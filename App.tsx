
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import toast, { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import StepIndicator from './components/StepIndicator';
import InfoPage from './components/InfoPage';
import ChatInterface from './components/ChatInterface';
import ErrorEditModal from './components/ErrorEditModal';
import { WorkflowStep, AnalysisState, PipelineComponent, DesignError, ChatMessage, EditSession, ChangeAction, PendingErrorAction } from './types';
import { analyzeIsometric, detectDesignErrors, generateUpdatedDrawing, initializeChatSession, generateAnnotatedDrawing, sendImageContext } from './services/geminiService';
import { generateAnalysisReport } from './services/pdfGenerator';
import { Chat, GenerateContentResponse } from '@google/genai';
import {
  Plus,
  Trash2,
  Play,
  ChevronRight,
  RefreshCcw,
  Download,
  AlertCircle,
  Activity,
  Maximize2,
  Loader2,
  X,
  Columns2,
  FileImage,
  Minimize2,
  Image,
  MapPin,
  Info,
  MessageSquare,
  Edit2
} from 'lucide-react';

type View = 'analysis' | 'info';
type ImageViewMode = 'side-by-side' | 'original-only' | 'corrected-only' | 'triple-view';

const App: React.FC = () => {
  // Initialize view from URL hash
  const [currentView, setCurrentView] = useState<View>(() => {
    const hash = window.location.hash;
    return hash === '#/info' ? 'info' : 'analysis';
  });
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(WorkflowStep.UPLOAD);
  const [state, setState] = useState<AnalysisState>({
    originalImage: null,
    recognizedComponents: [],
    detectedErrors: [],
    updatedImage: null,
    annotatedImage: null,
    isProcessing: false,
    error: null
  });

  // Image view mode state
  const [viewMode, setViewMode] = useState<ImageViewMode>('side-by-side');

  // Fullscreen state
  const [fullscreenImage, setFullscreenImage] = useState<{
    src: string;
    label: string;
  } | null>(null);
  const isFullscreen = fullscreenImage !== null;

  // PDF generation state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Per-step processing states
  const [stepStates, setStepStates] = useState<{
    recognition: 'idle' | 'loading' | 'completed';
    errorDetection: 'idle' | 'loading' | 'completed';
    generation: 'idle' | 'loading' | 'completed';
  }>({
    recognition: 'idle',
    errorDetection: 'idle',
    generation: 'idle'
  });

  // Cross-reference highlighting for error components
  const [highlightedComponent, setHighlightedComponent] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isStreamingChat, setIsStreamingChat] = useState(false);
  const chatInstanceRef = useRef<Chat | null>(null);
  const [pendingChatActions, setPendingChatActions] = useState<PendingErrorAction[]>([]);

  // Edit session state
  const [editSession, setEditSession] = useState<EditSession>({
    originalErrors: [],
    currentErrors: [],
    originalComponents: [],
    currentComponents: [],
    changeLog: [],
    hasUnsavedChanges: false
  });

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingError, setEditingError] = useState<DesignError | null>(null);
  const [showChangelog, setShowChangelog] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // Listen for hash changes (browser back/forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      setCurrentView(hash === '#/info' ? 'info' : 'analysis');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Navigation functions
  const navigateToInfo = () => {
    window.location.hash = '#/info';
  };

  const navigateToAnalysis = () => {
    window.location.hash = '#/';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, originalImage: reader.result as string, error: null }));
        toast.success('Drawing uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!state.originalImage) return;

    const loadingToast = toast.loading('Starting analysis...');
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    // Reset step states
    setStepStates({
      recognition: 'idle',
      errorDetection: 'idle',
      generation: 'idle'
    });

    try {
      // Variables to store generated images for chat context
      let annotated: string | null = null;
      let updated: string;

      // Step 2: Recognition
      setStepStates(prev => ({ ...prev, recognition: 'loading' }));
      toast.loading('Recognizing components...', { id: loadingToast });
      setCurrentStep(WorkflowStep.RECOGNITION);
      const recognition = await analyzeIsometric(state.originalImage);
      setState(prev => ({ ...prev, recognizedComponents: recognition.components }));
      setStepStates(prev => ({ ...prev, recognition: 'completed' }));

      // IMMEDIATELY update editSession with components
      setEditSession(prev => ({
        ...prev,
        originalComponents: [...(recognition?.components || [])],
        currentComponents: [...(recognition?.components || [])]
      }));

      toast.success(`Found ${recognition.components.length} components`, { id: loadingToast });

      // Step 3: Error Detection
      setStepStates(prev => ({ ...prev, errorDetection: 'loading' }));
      const errorToast = toast.loading('Detecting design errors...');
      setCurrentStep(WorkflowStep.IDENTIFY_ERRORS);
      const errors = await detectDesignErrors(state.originalImage);

      // Force immediate re-render to show errors BEFORE image generation
      flushSync(() => {
        setState(prev => ({ ...prev, detectedErrors: errors.errors }));
        setStepStates(prev => ({ ...prev, errorDetection: 'completed' }));

        // IMMEDIATELY update editSession so errors show in UI right away
        setEditSession(prev => ({
          ...prev,
          originalErrors: [...(errors?.errors || [])],
          currentErrors: [...(errors?.errors || [])],
          hasUnsavedChanges: false,
          changeLog: []
        }));
      });

      if (errors.errors.length > 0) {
        const criticalCount = errors.errors.filter(e => e.category === 'Critical').length;
        if (criticalCount > 0) {
          toast.error(`Found ${errors.errors.length} issues (${criticalCount} critical)`, { id: errorToast });
        } else {
          toast.success(`Found ${errors.errors.length} issues to review`, { id: errorToast });
        }
      } else {
        toast.success('No design errors detected', { id: errorToast });
      }

      // Generate annotated drawing (if errors exist)
      if (errors.errors.length > 0) {
        const annotatedToast = toast.loading('Generating annotated view...');
        try {
          annotated = await generateAnnotatedDrawing(state.originalImage, errors.errors);
          setState(prev => ({ ...prev, annotatedImage: annotated }));
          toast.success('Annotated drawing ready!', { id: annotatedToast });
        } catch (err) {
          console.error('Annotation failed:', err);
          // Don't block workflow if annotation fails
          toast.error('Could not generate annotations', { id: annotatedToast });
        }
      }

      // Step 4: Generation
      setStepStates(prev => ({ ...prev, generation: 'loading' }));
      const genToast = toast.loading('Generating corrected drawing...');
      setCurrentStep(WorkflowStep.GENERATE_UPDATED);
      updated = await generateUpdatedDrawing(state.originalImage, errors.errors);
      setState(prev => ({ ...prev, updatedImage: updated, isProcessing: false }));
      setStepStates(prev => ({ ...prev, generation: 'completed' }));
      toast.success('Analysis complete!', { id: genToast });

      // Clear any existing chat session before creating new one
      if (chatInstanceRef.current) {
        chatInstanceRef.current = null;
      }

      // Initialize chat session with analysis context
      const chat = initializeChatSession(
        recognition.components,
        errors.errors
      );
      chatInstanceRef.current = chat;

      // Send image context to chat for visual reference
      try {
        await sendImageContext(
          chat,
          state.originalImage!,
          annotated || null,
          updated
        );
        console.log('[startAnalysis] Image context sent to chat');
      } catch (err) {
        console.warn('[startAnalysis] Failed to send image context:', err);
        // Non-blocking - chat will work without visual context
      }

      // editSession already updated incrementally during analysis
      // Just log for debugging
      console.log('[startAnalysis] Analysis complete');
      console.log('[startAnalysis] Final error count:', errors?.errors?.length || 0);
      console.log('[startAnalysis] Final component count:', recognition?.components?.length || 0);

    } catch (err: any) {
      console.error(err);
      toast.dismiss(loadingToast);
      const errorMessage = err.message || "Unknown error";
      toast.error(`Analysis failed: ${errorMessage}`, {
        duration: 6000,
      });
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: "Critical failure during analysis: " + errorMessage,
        errorDetails: err.stack
      }));
    }
  };

  const reset = () => {
    setState({
      originalImage: null,
      recognizedComponents: [],
      detectedErrors: [],
      updatedImage: null,
      annotatedImage: null,
      isProcessing: false,
      error: null
    });
    setCurrentStep(WorkflowStep.UPLOAD);
    setViewMode('side-by-side');

    // Reset step states
    setStepStates({
      recognition: 'idle',
      errorDetection: 'idle',
      generation: 'idle'
    });

    // Reset chat state
    setChatMessages([]);
    chatInstanceRef.current = null;
    setPendingChatActions([]);

    // Reset edit session
    setEditSession({
      originalErrors: [],
      currentErrors: [],
      originalComponents: [],
      currentComponents: [],
      changeLog: [],
      hasUnsavedChanges: false
    });
    setEditingError(null);
    setShowChangelog(false);
  };

  const handleSendChatMessage = async (text: string) => {
    if (!chatInstanceRef.current) return;

    const newUserMsg: ChatMessage = { role: 'user', text };
    setChatMessages(prev => [...prev, newUserMsg]);
    setIsStreamingChat(true);

    try {
      const result = await chatInstanceRef.current.sendMessage({ message: text });

      // Handle function calls if present
      if (result.functionCalls && result.functionCalls.length > 0) {
        handleFunctionCall(result.functionCalls[0], text);
      }

      // Handle text response if present (can coexist with function calls)
      if (result.text) {
        setChatMessages(prev => [...prev, {
          role: 'model',
          text: result.text
        }]);
      }

      setIsStreamingChat(false);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, {
        role: 'model',
        text: 'Sorry, I encountered an error. Please try again.'
      }]);
      toast.error('Chat error occurred');
      setIsStreamingChat(false);
    }
  };

  // Helper function to generate unique IDs
  const generateId = () => `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Chat Function Call Handlers
  const handleFunctionCall = (functionCall: any, userPrompt: string) => {
    const { name, args } = functionCall;
    const actionId = generateId();

    console.log('[Chat] Function call:', name, args);

    switch (name) {
      case 'add_error_node': {
        const newError: DesignError = {
          id: generateId(),
          category: args.category || 'Warning',
          description: args.description,
          recommendation: args.recommendation,
          confidence: args.confidence || 0.9,
          affectedComponents: args.affectedComponents || [],
          location: args.location || '',
          detectionReason: args.detectionReason || 'User-reported via chat',
          isNew: true,
          createdBy: 'user'
        };

        const pendingAction: PendingErrorAction = {
          id: actionId,
          type: 'add',
          errors: [newError],
          userPrompt,
          timestamp: new Date()
        };

        showConfirmation(pendingAction);
        break;
      }

      case 'edit_error_node': {
        const existingError = editSession.currentErrors.find(e => e.id === args.errorId);
        if (!existingError) {
          setChatMessages(prev => [...prev, {
            role: 'model',
            text: `I couldn't find that error. Current issues:\n${editSession.currentErrors.map((e, i) => `${i + 1}. ${e.description}`).join('\n')}`
          }]);
          return;
        }

        const updatedError: DesignError = {
          ...existingError,
          ...args.updates,
          isModified: true,
          lastModified: new Date()
        };

        const pendingAction: PendingErrorAction = {
          id: actionId,
          type: 'edit',
          errors: [updatedError],
          userPrompt,
          timestamp: new Date()
        };

        showConfirmation(pendingAction, existingError);
        break;
      }

      case 'delete_error_node': {
        const errorToDelete = editSession.currentErrors.find(e => e.id === args.errorId);
        if (!errorToDelete) {
          setChatMessages(prev => [...prev, {
            role: 'model',
            text: 'I couldn\'t find that error to delete.'
          }]);
          return;
        }

        const pendingAction: PendingErrorAction = {
          id: actionId,
          type: 'delete',
          errors: [errorToDelete],
          userPrompt,
          timestamp: new Date()
        };

        showConfirmation(pendingAction);
        break;
      }

      case 'bulk_add_errors': {
        const newErrors: DesignError[] = args.errors.map((errorData: any) => ({
          id: generateId(),
          category: errorData.category || 'Warning',
          description: errorData.description,
          recommendation: errorData.recommendation,
          confidence: errorData.confidence || 0.9,
          affectedComponents: errorData.affectedComponents || [],
          location: errorData.location || '',
          detectionReason: errorData.detectionReason || 'User-reported via chat',
          isNew: true,
          createdBy: 'user'
        }));

        const pendingAction: PendingErrorAction = {
          id: actionId,
          type: 'bulk-add',
          errors: newErrors,
          userPrompt,
          timestamp: new Date()
        };

        showConfirmation(pendingAction);
        break;
      }

      default:
        console.warn('Unknown function call:', name);
        setChatMessages(prev => [...prev, {
          role: 'model',
          text: 'I tried to process that request but encountered an issue. Could you rephrase?'
        }]);
    }
  };

  const showConfirmation = (action: PendingErrorAction, existingError?: DesignError) => {
    const confirmationMessage: ChatMessage = {
      role: 'system',
      text: formatConfirmationMessage(action, existingError),
      pendingAction: action,
      actionId: action.id
    };

    setChatMessages(prev => [...prev, confirmationMessage]);
    setPendingChatActions(prev => [...prev, action]);
  };

  const formatConfirmationMessage = (
    action: PendingErrorAction,
    existingError?: DesignError
  ): string => {
    switch (action.type) {
      case 'add': {
        const error = action.errors[0];
        return `I'd like to add this issue:\n\n**${error.category}**: ${error.description}\n\n**Fix**: ${error.recommendation}\n\n**Location**: ${error.location || 'Not specified'}\n\n**Components**: ${error.affectedComponents?.join(', ') || 'None'}\n\nDoes this look correct?`;
      }

      case 'edit': {
        const updated = action.errors[0];
        return `I'd like to update this issue:\n\n**Before**: ${existingError?.description}\n\n**After**: ${updated.description}\n\n**New fix**: ${updated.recommendation}\n\nConfirm these changes?`;
      }

      case 'delete': {
        const toDelete = action.errors[0];
        return `I'd like to remove this issue:\n\n**${toDelete.category}**: ${toDelete.description}\n\nConfirm deletion?`;
      }

      case 'bulk-add': {
        return `I'd like to add ${action.errors.length} issues:\n\n${action.errors.map((e, i) => `${i + 1}. **${e.category}**: ${e.description}`).join('\n')}\n\nConfirm all?`;
      }

      default:
        return 'Confirm this action?';
    }
  };

  const handleConfirmChatAction = (actionId: string) => {
    const action = pendingChatActions.find(a => a.id === actionId);
    if (!action) {
      toast.error('Action not found');
      return;
    }

    // Apply changes to edit session
    switch (action.type) {
      case 'add':
      case 'bulk-add': {
        const changeActions: ChangeAction[] = action.errors.map(error => ({
          id: generateId(),
          timestamp: new Date(),
          type: 'add',
          target: 'error',
          targetId: error.id,
          description: `Added via chat: ${error.description}`,
          beforeState: null,
          afterState: error,
          source: 'chat-ai'
        }));

        setEditSession(prev => ({
          ...prev,
          currentErrors: [...prev.currentErrors, ...action.errors],
          changeLog: [...prev.changeLog, ...changeActions],
          hasUnsavedChanges: true
        }));

        toast.success(`Added ${action.errors.length} issue${action.errors.length > 1 ? 's' : ''}`);
        break;
      }

      case 'edit': {
        const updatedError = action.errors[0];
        const changeAction: ChangeAction = {
          id: generateId(),
          timestamp: new Date(),
          type: 'edit',
          target: 'error',
          targetId: updatedError.id,
          description: `Modified via chat: ${updatedError.description}`,
          beforeState: editSession.currentErrors.find(e => e.id === updatedError.id) || null,
          afterState: updatedError,
          source: 'chat-ai'
        };

        setEditSession(prev => ({
          ...prev,
          currentErrors: prev.currentErrors.map(e =>
            e.id === updatedError.id ? updatedError : e
          ),
          changeLog: [...prev.changeLog, changeAction],
          hasUnsavedChanges: true
        }));

        toast.success('Issue updated');
        break;
      }

      case 'delete': {
        const errorToDelete = action.errors[0];
        const changeAction: ChangeAction = {
          id: generateId(),
          timestamp: new Date(),
          type: 'delete',
          target: 'error',
          targetId: errorToDelete.id,
          description: `Deleted via chat: ${errorToDelete.description}`,
          beforeState: errorToDelete,
          afterState: null,
          source: 'chat-ai'
        };

        setEditSession(prev => ({
          ...prev,
          currentErrors: prev.currentErrors.filter(e => e.id !== errorToDelete.id),
          changeLog: [...prev.changeLog, changeAction],
          hasUnsavedChanges: true
        }));

        toast.success('Issue deleted');
        break;
      }
    }

    // Mark as confirmed in chat
    setChatMessages(prev =>
      prev.map(msg =>
        msg.actionId === actionId ? { ...msg, confirmed: true } : msg
      )
    );

    // Remove from pending
    setPendingChatActions(prev => prev.filter(a => a.id !== actionId));
  };

  const handleDenyChatAction = (actionId: string) => {
    // Mark as cancelled
    setChatMessages(prev =>
      prev.map(msg =>
        msg.actionId === actionId ? { ...msg, confirmed: false } : msg
      )
    );

    // Remove from pending
    setPendingChatActions(prev => prev.filter(a => a.id !== actionId));

    // Add follow-up from AI
    setChatMessages(prev => [...prev, {
      role: 'model',
      text: 'No problem! Let me know if you\'d like to make any adjustments.'
    }]);

    toast.info('Action cancelled');
  };

  // CRUD Handlers for Errors
  const handleAddError = () => {
    setEditingError(null);
    setIsEditMode(true);
  };

  const handleEditError = (error: DesignError) => {
    setEditingError(error);
    setIsEditMode(true);
  };

  const handleSaveError = (error: DesignError) => {
    const isNew = !editSession.currentErrors.find(e => e.id === error.id);

    // Create change action
    const changeAction: ChangeAction = {
      id: generateId(),
      timestamp: new Date(),
      type: isNew ? 'add' : 'edit',
      target: 'error',
      targetId: error.id,
      description: isNew ? `Added: ${error.description}` : `Modified: ${error.description}`,
      beforeState: isNew ? null : editSession.currentErrors.find(e => e.id === error.id) || null,
      afterState: error,
      source: 'manual'
    };

    // Update current errors (ONLY editSession, not main state)
    setEditSession(prev => ({
      ...prev,
      currentErrors: isNew
        ? [...prev.currentErrors, { ...error, isNew: true, createdBy: 'user', lastModified: new Date() }]
        : prev.currentErrors.map(e =>
            e.id === error.id
              ? { ...error, isModified: true, lastModified: new Date() }
              : e
          ),
      changeLog: [...prev.changeLog, changeAction],
      hasUnsavedChanges: true
    }));

    setIsEditMode(false);
    setEditingError(null);
    toast.success(isNew ? 'Issue added successfully' : 'Issue updated successfully');
  };

  const handleDeleteError = (errorId: string) => {
    console.log('[handleDeleteError] Called with errorId:', errorId);
    console.log('[handleDeleteError] editSession.currentErrors.length:', editSession.currentErrors.length);
    console.log('[handleDeleteError] editSession.currentErrors:', editSession.currentErrors.map(e => ({ id: e.id, description: e.description })));

    const error = editSession.currentErrors.find(e => e.id === errorId);

    if (!error) {
      console.error('[handleDeleteError] Error not found in currentErrors!');
      console.error('[handleDeleteError] Requested ID:', errorId);
      console.error('[handleDeleteError] Available IDs:', editSession.currentErrors.map(e => e.id));
      toast.error('Error not found. The error list may have been refreshed. Please try again.');
      return;
    }

    console.log('[handleDeleteError] Found error to delete:', error.description);

    // Confirmation dialog
    if (!window.confirm(`Delete issue: "${error.description}"?`)) return;

    const changeAction: ChangeAction = {
      id: generateId(),
      timestamp: new Date(),
      type: 'delete',
      target: 'error',
      targetId: errorId,
      description: `Deleted: ${error.description}`,
      beforeState: error,
      afterState: null,
      source: 'manual'
    };

    // Update ONLY editSession (not main state)
    setEditSession(prev => ({
      ...prev,
      currentErrors: prev.currentErrors.filter(e => e.id !== errorId),
      changeLog: [...prev.changeLog, changeAction],
      hasUnsavedChanges: true
    }));

    toast.success('Issue deleted successfully');
  };

  const handleRestoreError = (changeActionId: string) => {
    const change = editSession.changeLog.find(c => c.id === changeActionId);
    if (!change || change.type !== 'delete' || !change.beforeState) return;

    const restoredError = change.beforeState as DesignError;

    const restoreAction: ChangeAction = {
      id: generateId(),
      timestamp: new Date(),
      type: 'restore',
      target: 'error',
      targetId: restoredError.id,
      description: `Restored: ${restoredError.description}`,
      beforeState: null,
      afterState: restoredError,
      source: 'manual'
    };

    // Update ONLY editSession (not main state)
    setEditSession(prev => ({
      ...prev,
      currentErrors: [...prev.currentErrors, restoredError],
      changeLog: [...prev.changeLog, restoreAction],
      hasUnsavedChanges: true
    }));

    toast.success('Issue restored successfully');
  };

  // Regenerate drawing with modified errors
  const handleRegenerateDrawing = async () => {
    if (!state.originalImage) return;

    setIsRegenerating(true);

    try {
      // Use CURRENT (modified) errors for regeneration
      const modifiedErrors = editSession.currentErrors;

      console.log('=== REGENERATION REQUEST STARTED ===');
      console.log('Total modified errors:', modifiedErrors.length);
      console.log('Modified errors array:', JSON.stringify(modifiedErrors, null, 2));
      console.log('Edit session state:', {
        originalErrorsCount: editSession.originalErrors.length,
        currentErrorsCount: editSession.currentErrors.length,
        changeLogCount: editSession.changeLog.length,
        hasUnsavedChanges: editSession.hasUnsavedChanges
      });
      console.log('State.detectedErrors count:', state.detectedErrors.length);

      // Validation: Check if we have errors to regenerate with
      if (modifiedErrors.length === 0) {
        console.error('[handleRegenerateDrawing] No errors to regenerate with!');
        toast.error('No errors to regenerate with. Add errors or use original drawing.');
        setIsRegenerating(false);
        return;
      }

      // Validation: Check if error objects have required fields
      const validErrors = modifiedErrors.filter(e => e.description && e.recommendation);
      if (validErrors.length !== modifiedErrors.length) {
        console.warn('[handleRegenerateDrawing] Some errors missing required fields');
        console.warn('Valid errors:', validErrors.length, 'Total errors:', modifiedErrors.length);
        console.warn('Invalid errors:', modifiedErrors.filter(e => !e.description || !e.recommendation));
      }

      // Step 1: Generate annotated drawing
      const annotatedToast = toast.loading(`Generating annotated drawing with ${modifiedErrors.length} error${modifiedErrors.length !== 1 ? 's' : ''}...`);
      console.log('Step 1: Calling generateAnnotatedDrawing with', modifiedErrors.length, 'errors');
      const annotatedImage = await generateAnnotatedDrawing(
        state.originalImage,
        modifiedErrors
      );
      console.log('Step 1: Annotated drawing generated successfully');
      toast.success('Annotated drawing ready!', { id: annotatedToast });

      // Step 2: Generate corrected drawing
      const updatedToast = toast.loading(`Generating corrected drawing with ${modifiedErrors.length} fix${modifiedErrors.length !== 1 ? 'es' : ''}...`);
      console.log('Step 2: Calling generateUpdatedDrawing with', modifiedErrors.length, 'errors');
      console.log('Step 2: Errors being sent:', modifiedErrors.map(e => ({
        id: e.id,
        description: e.description,
        recommendation: e.recommendation,
        category: e.category
      })));
      const updatedImage = await generateUpdatedDrawing(
        state.originalImage,
        modifiedErrors
      );
      console.log('Step 2: Corrected drawing generated successfully');
      toast.success('Corrected drawing ready!', { id: updatedToast });

      // Step 3: Update state ONLY if both succeeded
      setState(prev => ({
        ...prev,
        annotatedImage,
        updatedImage,
        detectedErrors: modifiedErrors  // Update main error list
      }));

      // Mark changes as saved
      setEditSession(prev => ({
        ...prev,
        originalErrors: modifiedErrors,  // New baseline
        currentErrors: modifiedErrors,
        hasUnsavedChanges: false,
        changeLog: []  // Clear changelog after successful regeneration
      }));

      // Clear pending chat actions after successful regeneration
      setPendingChatActions([]);

      // Update chat with new images
      if (chatInstanceRef.current) {
        try {
          await sendImageContext(
            chatInstanceRef.current,
            state.originalImage!,
            annotatedImage,
            updatedImage
          );
          console.log('[handleRegenerateDrawing] Chat image context refreshed');
        } catch (err) {
          console.warn('[handleRegenerateDrawing] Failed to update chat image context:', err);
          // Non-blocking - chat will continue to work with old context
        }
      }

      toast.success('Drawing regenerated successfully!');

    } catch (error) {
      console.error('Regeneration failed:', error);
      toast.error(`Failed to regenerate drawing: ${(error as Error).message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Discard all changes and revert to original errors
  const handleDiscardChanges = () => {
    if (!window.confirm('Discard all changes and revert to original AI analysis?')) return;

    setEditSession(prev => ({
      ...prev,
      currentErrors: prev.originalErrors,
      currentComponents: prev.originalComponents,
      changeLog: [],
      hasUnsavedChanges: false
    }));

    toast.success('Changes discarded');
  };

  // Download current image (toolbar button)
  const downloadCurrentImage = () => {
    const imageToDownload = state.updatedImage || state.originalImage;
    if (!imageToDownload) {
      toast.error('No image available to download');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = imageToDownload;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const prefix = state.updatedImage ? 'corrected' : 'original';
      link.download = `isoguard-${prefix}-${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded successfully');
    } catch (error) {
      toast.error('Failed to download image');
      console.error(error);
    }
  };

  // Download corrected image (PNG Download button)
  const downloadCorrectedImage = () => {
    if (!state.updatedImage) {
      toast.error('No corrected image available');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = state.updatedImage;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `isoguard-corrected-${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Corrected image downloaded');
    } catch (error) {
      toast.error('Download failed');
      console.error(error);
    }
  };

  // Cycle through view modes
  const cycleViewMode = () => {
    const modes: ImageViewMode[] = ['side-by-side', 'triple-view', 'original-only', 'corrected-only'];
    setViewMode(prev => {
      const currentIndex = modes.indexOf(prev);
      const nextIndex = (currentIndex + 1) % modes.length;
      return modes[nextIndex];
    });
  };

  // Fullscreen image functions
  const openImageFullscreen = (src: string, label: string) => {
    setFullscreenImage({ src, label });
    document.body.style.overflow = 'hidden';
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
    document.body.style.overflow = 'auto';
  };

  // ESC key handler for fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenImage) {
        closeFullscreen();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [fullscreenImage]);

  // Generate PDF Report
  const generatePdfReport = async () => {
    if (!state.updatedImage || !state.originalImage) {
      toast.error('Complete analysis required to generate PDF report');
      return;
    }

    setIsGeneratingPdf(true);
    const loadingToast = toast.loading('Generating PDF report...');

    try {
      await generateAnalysisReport(
        state.originalImage,
        state.updatedImage,
        state.recognizedComponents,
        state.detectedErrors
      );
      toast.success('PDF report generated successfully', { id: loadingToast });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF report', { id: loadingToast });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Render Info Page
  if (currentView === 'info') {
    return <InfoPage onNavigateBack={navigateToAnalysis} />;
  }

  // Render Analysis Page
  return (
    <Layout onNavigateToInfo={navigateToInfo}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#262626',
            color: '#fafafa',
            border: '1px solid #404040',
          },
          success: {
            iconTheme: {
              primary: '#0891b2',
              secondary: '#fafafa',
            },
          },
          error: {
            iconTheme: {
              primary: '#b91c1c',
              secondary: '#fafafa',
            },
          },
        }}
      />
      <StepIndicator currentStep={currentStep} stepStates={stepStates} />

      {state.error && (
        <div className="bg-red-50 border border-red-600 p-4 rounded-lg flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-900">Analysis Error</h4>
            <p className="text-sm text-red-800 mt-1">{state.error}</p>
            {state.errorDetails && (
              <details className="mt-2">
                <summary className="text-xs text-red-700 cursor-pointer hover:underline">
                  Show technical details
                </summary>
                <pre className="text-xs text-red-700 mt-2 bg-red-100 p-2 rounded overflow-x-auto">
                  {state.errorDetails}
                </pre>
              </details>
            )}
          </div>
          <div className="flex gap-2">
            {/* Show retry button for temporary errors */}
            {(state.error.includes('overloaded') ||
              state.error.includes('unavailable') ||
              state.error.includes('try again')) && (
              <button
                onClick={startAnalysis}
                className="text-blue-700 hover:text-blue-900 text-sm font-medium flex items-center gap-1"
              >
                <RefreshCcw className="w-4 h-4" />
                Retry
              </button>
            )}
            <button
              onClick={reset}
              className="text-red-700 hover:text-red-900 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Image Viewer */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-neutral-300 rounded-2xl overflow-hidden min-h-[500px] flex flex-col relative group shadow-sm">
            <div className="bg-neutral-100 p-3 flex items-center justify-between border-b border-neutral-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs font-mono uppercase text-neutral-600">Drawing Viewer v2.1</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openImageFullscreen(
                    state.updatedImage || state.originalImage!,
                    state.updatedImage ? 'Corrected Drawing' : 'Original Drawing'
                  )}
                  disabled={!state.originalImage}
                  className="p-1.5 hover:bg-neutral-200 rounded text-neutral-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Fullscreen viewer"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={downloadCurrentImage}
                  disabled={!state.originalImage}
                  className="p-1.5 hover:bg-neutral-200 rounded text-neutral-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Download image"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50 relative">
              {!state.originalImage ? (
                <label className="cursor-pointer group">
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-neutral-200 transition-all border-2 border-dashed border-neutral-300 group-hover:border-blue-600/50">
                      <Plus className="w-8 h-8 text-neutral-400 group-hover:text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-neutral-900 font-semibold text-lg">Upload Drawing</h4>
                      <p className="text-neutral-600 text-sm max-w-xs mx-auto">Click to browse or drag and drop your P&ID or Isometric CAD drawings (PNG, JPG, PDF)</p>
                    </div>
                  </div>
                </label>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center animate-in fade-in zoom-in duration-500">
                  <img 
                    src={state.updatedImage || state.originalImage} 
                    alt="Piping Drawing" 
                    className={`max-h-[600px] rounded-sm object-contain shadow-2xl transition-opacity duration-1000 ${state.isProcessing ? 'opacity-50 grayscale' : 'opacity-100'}`}
                  />
                  
                  {state.isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent absolute top-0 animate-[scan_2s_infinite]" />
                      <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl border border-neutral-300 shadow-xl flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        <div className="text-center">
                          <p className="text-neutral-900 font-semibold">
                            {stepStates.recognition === 'loading' && 'Recognizing Components'}
                            {stepStates.errorDetection === 'loading' && 'Detecting Design Errors'}
                            {stepStates.generation === 'loading' && 'Generating Corrected Drawing'}
                          </p>
                          <p className="text-neutral-600 text-xs uppercase tracking-widest mt-1">
                            {stepStates.recognition === 'loading' && 'Analyzing drawing symbols...'}
                            {stepStates.errorDetection === 'loading' && 'Validating ASME/API standards...'}
                            {stepStates.generation === 'loading' && 'Creating corrected image...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {state.originalImage && !state.isProcessing && currentStep === WorkflowStep.UPLOAD && (
              <div className="absolute bottom-6 right-6 flex gap-3">
                <button
                  onClick={reset}
                  className="bg-white/95 text-neutral-600 p-3 rounded-full border border-neutral-300 hover:text-neutral-900 hover:border-neutral-400 transition-all backdrop-blur-md shadow-sm"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={startAnalysis}
                  className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-2 group"
                >
                  Start Analysis <Play className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* Comparison Slider / Grid */}
          {state.updatedImage && (
            <div className="space-y-4">
              {/* View Mode Toggle */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Image Comparison</h3>
                <button
                  onClick={cycleViewMode}
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg border border-neutral-300 transition-all text-xs font-medium text-neutral-700"
                  aria-label="Toggle view mode"
                >
                  {viewMode === 'side-by-side' && <><Columns2 className="w-3.5 h-3.5" /> Side-by-Side</>}
                  {viewMode === 'triple-view' && <><Columns2 className="w-3.5 h-3.5" /> Triple View</>}
                  {viewMode === 'original-only' && <><FileImage className="w-3.5 h-3.5" /> Original Only</>}
                  {viewMode === 'corrected-only' && <><FileImage className="w-3.5 h-3.5" /> Corrected Only</>}
                </button>
              </div>

              {/* Side-by-side view */}
              {viewMode === 'side-by-side' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-neutral-600 font-bold ml-1">Original Revision</p>
                    <div className="bg-white border border-neutral-300 rounded-xl overflow-hidden aspect-video relative group cursor-pointer hover:border-neutral-400 transition-all shadow-sm">
                      <img src={state.originalImage!} alt="Original" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 to-transparent pointer-events-none" />
                      <button
                        onClick={() => openImageFullscreen(state.originalImage!, 'Original Drawing')}
                        className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Expand original image"
                      >
                        <Maximize2 className="w-4 h-4 text-neutral-700" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-teal-700 font-bold ml-1">Corrected Version</p>
                    <div className="bg-white border border-teal-600/30 rounded-xl overflow-hidden aspect-video relative group cursor-pointer ring-2 ring-teal-600/20 shadow-sm">
                      <img src={state.updatedImage} alt="Optimized" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-teal-600 text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider">Verified</div>
                      <button
                        onClick={() => openImageFullscreen(state.updatedImage!, 'Corrected Drawing')}
                        className="absolute bottom-2 right-2 p-2 bg-white/90 hover:bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Expand corrected image"
                      >
                        <Maximize2 className="w-4 h-4 text-neutral-700" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Original only view */}
              {viewMode === 'original-only' && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <p className="text-xs uppercase tracking-widest text-neutral-600 font-bold ml-1">Original Revision</p>
                  <div className="bg-white border border-neutral-300 rounded-xl overflow-hidden aspect-video relative group cursor-pointer hover:border-neutral-400 transition-all shadow-sm">
                    <img src={state.originalImage!} alt="Original" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 to-transparent pointer-events-none" />
                    <button
                      onClick={() => openImageFullscreen(state.originalImage!, 'Original Drawing')}
                      className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Expand image"
                    >
                      <Maximize2 className="w-4 h-4 text-neutral-700" />
                    </button>
                  </div>
                </div>
              )}

              {/* Corrected only view */}
              {viewMode === 'corrected-only' && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <p className="text-xs uppercase tracking-widest text-teal-700 font-bold ml-1">Corrected Version</p>
                  <div className="bg-white border border-teal-600/30 rounded-xl overflow-hidden aspect-video relative group cursor-pointer ring-2 ring-teal-600/20 shadow-sm">
                    <img src={state.updatedImage} alt="Optimized" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-teal-600 text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider">Verified</div>
                    <button
                      onClick={() => openImageFullscreen(state.updatedImage!, 'Corrected Drawing')}
                      className="absolute bottom-2 right-2 p-2 bg-white/90 hover:bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Expand image"
                    >
                      <Maximize2 className="w-4 h-4 text-neutral-700" />
                    </button>
                  </div>
                </div>
              )}

              {/* Triple view - Original | Annotated | Corrected */}
              {viewMode === 'triple-view' && state.annotatedImage && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  {/* Color Legend */}
                  <div className="flex items-center gap-4 text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-300">
                    <span className="font-semibold text-neutral-700">Numbered Markers:</span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-600"></div>
                      <span className="text-neutral-700">Critical</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-amber-600"></div>
                      <span className="text-neutral-700">Warnings</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      <span className="text-neutral-700">Info</span>
                    </span>
                    <span className="text-neutral-500">• Numbers match error cards</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Original */}
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-widest text-neutral-600 font-bold ml-1">Original Drawing</p>
                      <div className="bg-white border border-neutral-300 rounded-xl overflow-hidden aspect-video relative group shadow-sm">
                        <img src={state.originalImage!} alt="Original" className="w-full h-full object-cover" />
                        <button
                          onClick={() => openImageFullscreen(state.originalImage!, 'Original Drawing')}
                          className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Expand original"
                        >
                          <Maximize2 className="w-4 h-4 text-neutral-700" />
                        </button>
                      </div>
                    </div>

                    {/* Annotated (NEW) */}
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-widest text-amber-600 font-bold ml-1">Issues Highlighted</p>
                      <div className="bg-white border-2 border-amber-500 rounded-xl overflow-hidden aspect-video relative group shadow-md">
                        <img src={state.annotatedImage!} alt="Annotated" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider">Annotated</div>
                        <button
                          onClick={() => openImageFullscreen(state.annotatedImage!, 'Annotated Drawing (Issues Highlighted)')}
                          className="absolute bottom-2 right-2 p-2 bg-white/90 hover:bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Expand annotated"
                        >
                          <Maximize2 className="w-4 h-4 text-neutral-700" />
                        </button>
                      </div>
                    </div>

                    {/* Corrected */}
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-widest text-teal-600 font-bold ml-1">Corrected Drawing</p>
                      <div className="bg-white border-2 border-teal-500 rounded-xl overflow-hidden aspect-video relative group shadow-md">
                        <img src={state.updatedImage} alt="Corrected" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-teal-600 text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider">Verified</div>
                        <button
                          onClick={() => openImageFullscreen(state.updatedImage!, 'Corrected Drawing')}
                          className="absolute bottom-2 right-2 p-2 bg-white/90 hover:bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Expand corrected"
                        >
                          <Maximize2 className="w-4 h-4 text-neutral-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Analysis Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-neutral-300 rounded-2xl overflow-hidden shadow-sm">
            {/* Analysis Header */}
            <div className="bg-neutral-100 p-3 border-b border-neutral-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-700">Analysis Results</span>
            </div>

            {/* Analysis Content */}
            <div className="p-6">
              {!state.originalImage ? (
              <div className="text-center py-12 space-y-3 border-2 border-dashed border-neutral-300 rounded-xl">
                <div className="p-3 bg-neutral-100 w-fit mx-auto rounded-full text-neutral-400">
                  <ChevronRight className="w-5 h-5" />
                </div>
                <p className="text-sm text-neutral-600 px-6">Upload a drawing to begin analysis.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Recognized Components Section - Progressive Disclosure */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Components Detected</h4>
                    {stepStates.recognition === 'loading' && (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    )}
                    {stepStates.recognition === 'completed' && (
                      <span className="bg-neutral-100 text-neutral-700 text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-300">{state.recognizedComponents.length} items</span>
                    )}
                  </div>

                  {/* Show loading shimmer ONLY for this step */}
                  {stepStates.recognition === 'loading' && (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded w-1/2 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                          <div className="h-3 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded w-full animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Show results as soon as completed */}
                  {stepStates.recognition === 'completed' && (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar animate-in fade-in duration-500">
                      {state.recognizedComponents.map((comp, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border transition-all group ${
                            highlightedComponent === comp.name
                              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50'
                              : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-semibold transition-colors ${
                              highlightedComponent === comp.name
                                ? 'text-blue-600'
                                : 'text-neutral-900 group-hover:text-blue-600'
                            }`}>{comp.name}</span>
                            <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-mono uppercase">{comp.type}</span>
                          </div>
                          <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{comp.description}</p>
                        </div>
                      ))}
                      {state.recognizedComponents.length === 0 && (
                        <p className="text-xs text-neutral-500 italic">No components identified.</p>
                      )}
                    </div>
                  )}

                  {stepStates.recognition === 'idle' && (
                    <p className="text-xs text-neutral-500 italic">Waiting to start analysis...</p>
                  )}
                </section>

                {/* Error Findings Section - Progressive Disclosure */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Design Issues</h4>
                    <div className="flex items-center gap-2">
                      {stepStates.errorDetection === 'loading' && (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      )}
                      {stepStates.errorDetection === 'completed' && (
                        <>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${state.detectedErrors.length > 0 ? 'bg-red-50 text-red-700 border-red-600' : 'bg-teal-50 text-teal-700 border-teal-600'}`}>
                            {state.detectedErrors.length > 0 ? 'Issues Found' : 'Compliant'}
                          </span>
                          <button
                            onClick={handleAddError}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-[10px] font-semibold rounded hover:bg-blue-700 transition-colors"
                            aria-label="Add new issue"
                          >
                            <Plus className="w-3 h-3" />
                            Add Issue
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Show loading state with informative cards */}
                  {stepStates.errorDetection === 'loading' && (
                    <div className="space-y-3">
                      {/* Scanning for Critical Issues */}
                      <div className="p-4 rounded-lg border-l-4 border-red-600 bg-red-50 flex items-start gap-3">
                        <Loader2 className="w-5 h-5 text-red-600 animate-spin flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900">Scanning for Critical Issues</p>
                          <p className="text-xs text-red-700 mt-1">Checking ASME standards, safety hazards, compliance violations...</p>
                        </div>
                      </div>

                      {/* Scanning for Warnings */}
                      <div className="p-4 rounded-lg border-l-4 border-amber-600 bg-amber-50 flex items-start gap-3">
                        <Loader2 className="w-5 h-5 text-amber-600 animate-spin flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-900">Scanning for Warnings</p>
                          <p className="text-xs text-amber-700 mt-1">Identifying potential issues, best practices, optimization opportunities...</p>
                        </div>
                      </div>

                      {/* General Analysis */}
                      <div className="p-4 rounded-lg border-l-4 border-blue-600 bg-blue-50 flex items-start gap-3">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900">Analyzing Design Quality</p>
                          <p className="text-xs text-blue-700 mt-1">Evaluating overall design integrity and documentation...</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show errors immediately when ready */}
                  {stepStates.errorDetection === 'completed' && (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar animate-in fade-in duration-500">
                      {editSession.currentErrors.map((error, idx) => (
                      <div key={idx} className={`relative group p-4 rounded-lg border-l-4 ${
                        error.category === 'Critical' ? 'bg-red-50 border-red-700 ring-1 ring-red-600/10' :
                        error.category === 'Warning' ? 'bg-amber-50 border-amber-600 ring-1 ring-amber-600/10' :
                        'bg-sky-50 border-sky-600 ring-1 ring-sky-600/10'
                      }`}>
                        {/* Edit/Delete buttons - appear on hover */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditError(error)}
                            className="p-1.5 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm"
                            aria-label="Edit error"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteError(error.id)}
                            className="p-1.5 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                            aria-label="Delete error"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        </div>

                        {/* Status indicators */}
                        {error.isModified && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold uppercase rounded border border-blue-300">
                            Modified
                          </div>
                        )}
                        {error.isNew && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold uppercase rounded border border-green-300">
                            New
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            error.category === 'Critical' ? 'bg-red-600 text-white' :
                            error.category === 'Warning' ? 'bg-amber-600 text-white' :
                            'bg-blue-600 text-white'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h5 className={`text-sm font-bold ${
                              error.category === 'Critical' ? 'text-red-900' :
                              error.category === 'Warning' ? 'text-amber-900' :
                              'text-sky-900'
                            }`}>{error.description}</h5>

                            {/* Affected Components */}
                            {error.affectedComponents && error.affectedComponents.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {error.affectedComponents.map((comp, compIdx) => (
                                  <span
                                    key={compIdx}
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer transition-all ${
                                      highlightedComponent === comp ? 'ring-2 ring-blue-500' : ''
                                    } ${
                                      error.category === 'Critical' ? 'bg-red-100 text-red-800 border border-red-300' :
                                      error.category === 'Warning' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                      'bg-sky-100 text-sky-800 border border-sky-300'
                                    }`}
                                    onMouseEnter={() => setHighlightedComponent(comp)}
                                    onMouseLeave={() => setHighlightedComponent(null)}
                                    title="Hover to find in components list"
                                  >
                                    {comp}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Location Context */}
                            {error.location && (
                              <div className="mt-2 flex items-start gap-1">
                                <MapPin className="w-3 h-3 text-neutral-500 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] text-neutral-600 font-medium">
                                  {error.location}
                                </p>
                              </div>
                            )}

                            {/* Detection Reason (Expandable) */}
                            {error.detectionReason && (
                              <details className="mt-2">
                                <summary className="text-[11px] text-neutral-600 cursor-pointer hover:text-neutral-900 font-medium flex items-center gap-1">
                                  <Info className="w-3 h-3" />
                                  Why was this detected?
                                </summary>
                                <p className="text-[10px] text-neutral-600 mt-1 pl-4 italic leading-relaxed">
                                  {error.detectionReason}
                                </p>
                              </details>
                            )}

                            {/* Fallback for missing location data */}
                            {!error.affectedComponents && !error.location && (
                              <p className="text-[10px] text-neutral-500 mt-2 italic">
                                ℹ️ Review drawing manually to locate this issue
                              </p>
                            )}

                            <p className="text-xs text-neutral-700 mt-2 font-medium">Recommendation:</p>
                            <p className="text-xs text-neutral-600 mt-1 italic">{error.recommendation}</p>
                            <div className="flex items-center gap-2 mt-3">
                              <div className="flex-1 h-1 bg-neutral-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${
                                  error.category === 'Critical' ? 'bg-red-700' :
                                  error.category === 'Warning' ? 'bg-amber-600' :
                                  'bg-sky-600'
                                }`} style={{ width: `${error.confidence * 100}%` }} />
                              </div>
                              <span className="text-[9px] font-mono text-neutral-500">Conf: {(error.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                      {editSession.currentErrors.length === 0 && (
                        <div className="text-center py-8 bg-teal-50 border border-teal-600 rounded-lg">
                          <div className="text-teal-600 mb-2 flex justify-center"><Activity className="w-8 h-8" /></div>
                          <p className="text-xs text-teal-900 font-bold uppercase tracking-widest">Compliant Design</p>
                          <p className="text-[10px] text-teal-700 mt-1">No major design violations detected.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {stepStates.errorDetection === 'idle' && (
                    <p className="text-xs text-neutral-500 italic">Awaiting error detection...</p>
                  )}
                </section>

                {/* Regenerate Section - appears when there are unsaved changes */}
                {editSession.hasUnsavedChanges && stepStates.errorDetection === 'completed' && (
                  <section className="mt-6">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-600 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="text-sm font-bold text-neutral-900 mb-1">
                            Ready to Regenerate
                          </h5>
                          <p className="text-xs text-neutral-700 mb-3">
                            You have {editSession.changeLog.length} pending change{editSession.changeLog.length !== 1 ? 's' : ''}. Regenerate the corrected drawing with your modifications?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={handleRegenerateDrawing}
                              disabled={isRegenerating}
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {isRegenerating ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Regenerating...
                                </>
                              ) : (
                                <>
                                  <RefreshCcw className="w-4 h-4" />
                                  Regenerate Drawing
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleDiscardChanges}
                              className="px-4 py-2 border border-neutral-300 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-50 transition-colors"
                            >
                              Discard Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {state.updatedImage && (
                  <button
                    onClick={reset}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white py-3 rounded-xl transition-all border border-neutral-600 font-semibold"
                  >
                    <RefreshCcw className="w-4 h-4" /> Reset Workspace
                  </button>
                )}
                  </div>
                )}
            </div>
          </div>

          {/* Quick Actions Footer Card */}
          <div className="bg-white border border-neutral-300 rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-4">Export Tools</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={downloadCorrectedImage}
                disabled={!state.updatedImage}
                className="flex flex-col items-center gap-2 p-3 bg-neutral-50 border border-neutral-300 rounded-xl hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-neutral-700"
                aria-label="Download PNG"
              >
                <Image className="w-5 h-5 text-blue-600" />
                <span className="text-[10px] font-bold uppercase">PNG Download</span>
              </button>
              <button
                onClick={generatePdfReport}
                disabled={!state.updatedImage || isGeneratingPdf}
                className="flex flex-col items-center gap-2 p-3 bg-neutral-50 border border-neutral-300 rounded-xl hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-neutral-700"
                aria-label="Generate PDF Report"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <FileImage className="w-5 h-5 text-blue-600" />
                )}
                <span className="text-[10px] font-bold uppercase">
                  {isGeneratingPdf ? 'Generating...' : 'PDF Report'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Chat Panel - Always Visible */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-neutral-300 rounded-2xl overflow-hidden shadow-sm sticky top-6">
            {/* Chat Header */}
            <div className="bg-neutral-100 p-3 border-b border-neutral-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-700">AI Consultant</span>
            </div>

            {/* Chat Interface */}
            <ChatInterface
              messages={chatMessages}
              onSendMessage={handleSendChatMessage}
              isStreaming={isStreamingChat}
              isChatReady={chatInstanceRef.current !== null}
              onConfirmAction={handleConfirmChatAction}
              onDenyAction={handleDenyChatAction}
            />
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-200">
          {/* Fullscreen Toolbar */}
          <div className="bg-neutral-100 p-4 flex items-center justify-between border-b border-neutral-300 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-sm font-mono uppercase text-neutral-700">Fullscreen Viewer</span>
              <span className="text-xs text-neutral-500">•</span>
              <span className="text-xs font-semibold text-neutral-700">{fullscreenImage.label}</span>
              <span className="text-xs text-neutral-500">Press ESC to exit</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadCurrentImage}
                className="p-2 hover:bg-neutral-200 rounded-lg text-neutral-600 transition-colors flex items-center gap-2"
                aria-label="Download image"
              >
                <Download className="w-4 h-4" />
                <span className="text-xs font-medium">Download</span>
              </button>
              <button
                onClick={closeFullscreen}
                className="p-2 hover:bg-neutral-200 rounded-lg text-neutral-600 transition-colors flex items-center gap-2"
                aria-label="Exit fullscreen"
              >
                <X className="w-4 h-4" />
                <span className="text-xs font-medium">Close</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Image Container */}
          <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50 overflow-auto">
            <img
              src={fullscreenImage.src}
              alt={fullscreenImage.label}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Error Edit Modal */}
      <ErrorEditModal
        error={editingError}
        isOpen={isEditMode}
        onClose={() => {
          setIsEditMode(false);
          setEditingError(null);
        }}
        onSave={handleSaveError}
      />

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(500px); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f5f5f5;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #a3a3a3;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #737373;
        }
      `}</style>
    </Layout>
  );
};

export default App;
