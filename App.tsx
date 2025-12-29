
import React, { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import StepIndicator from './components/StepIndicator';
import InfoPage from './components/InfoPage';
import { WorkflowStep, AnalysisState, PipelineComponent, DesignError } from './types';
import { analyzeIsometric, detectDesignErrors, generateUpdatedDrawing } from './services/geminiService';
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
  Loader2
} from 'lucide-react';

type View = 'analysis' | 'info';

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
    isProcessing: false,
    error: null
  });

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

    try {
      // Step 2: Recognition
      toast.loading('Recognizing components...', { id: loadingToast });
      setCurrentStep(WorkflowStep.RECOGNITION);
      const recognition = await analyzeIsometric(state.originalImage);
      setState(prev => ({ ...prev, recognizedComponents: recognition.components }));
      toast.success(`Found ${recognition.components.length} components`, { id: loadingToast });

      // Step 3: Error Detection
      const errorToast = toast.loading('Detecting design errors...');
      setCurrentStep(WorkflowStep.IDENTIFY_ERRORS);
      const errors = await detectDesignErrors(state.originalImage);
      setState(prev => ({ ...prev, detectedErrors: errors.errors }));

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

      // Step 4: Generation
      const genToast = toast.loading('Generating corrected drawing...');
      setCurrentStep(WorkflowStep.GENERATE_UPDATED);
      const updated = await generateUpdatedDrawing(state.originalImage, errors.errors);
      setState(prev => ({ ...prev, updatedImage: updated, isProcessing: false }));
      toast.success('Analysis complete!', { id: genToast });

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
      isProcessing: false,
      error: null
    });
    setCurrentStep(WorkflowStep.UPLOAD);
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
      <StepIndicator currentStep={currentStep} />

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
          <button
            onClick={reset}
            className="text-red-700 hover:text-red-900 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Workspace */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-neutral-300 rounded-2xl overflow-hidden min-h-[500px] flex flex-col relative group shadow-sm">
            <div className="bg-neutral-100 p-3 flex items-center justify-between border-b border-neutral-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs font-mono uppercase text-neutral-600">Drawing Viewer v2.1</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 hover:bg-neutral-200 rounded text-neutral-600 transition-colors"><Maximize2 className="w-4 h-4" /></button>
                <button className="p-1.5 hover:bg-neutral-200 rounded text-neutral-600 transition-colors"><Download className="w-4 h-4" /></button>
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
                          <p className="text-neutral-900 font-semibold">Processing Drawing</p>
                          <p className="text-neutral-600 text-xs uppercase tracking-widest mt-1">Analyzing components...</p>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-neutral-600 font-bold ml-1">Original Revision</p>
                <div className="bg-white border border-neutral-300 rounded-xl overflow-hidden aspect-video relative group cursor-pointer hover:border-neutral-400 transition-all shadow-sm">
                  <img src={state.originalImage!} alt="Original" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 to-transparent pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-teal-700 font-bold ml-1">Corrected Version</p>
                <div className="bg-white border border-teal-600/30 rounded-xl overflow-hidden aspect-video relative group cursor-pointer ring-2 ring-teal-600/20 shadow-sm">
                  <img src={state.updatedImage} alt="Optimized" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-teal-600 text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider">Verified</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Intelligence Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Analysis Metrics */}
          <div className="bg-white border border-neutral-300 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-neutral-900">
              <Activity className="w-5 h-5 text-blue-600" />
              Analysis Results
            </h3>

            {state.isProcessing ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-3">
                    <div className="h-4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded w-1/2 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                    <div className="h-3 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded w-full animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                    <div className="h-3 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded w-3/4 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                  </div>
                ))}
              </div>
            ) : !state.originalImage ? (
              <div className="text-center py-12 space-y-3 border-2 border-dashed border-neutral-300 rounded-xl">
                <div className="p-3 bg-neutral-100 w-fit mx-auto rounded-full text-neutral-400">
                  <ChevronRight className="w-5 h-5" />
                </div>
                <p className="text-sm text-neutral-600 px-6">Upload a drawing to begin analysis.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Recognized Components Section */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Components Detected</h4>
                    <span className="bg-neutral-100 text-neutral-700 text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-300">{state.recognizedComponents.length} items</span>
                  </div>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {state.recognizedComponents.map((comp, idx) => (
                      <div key={idx} className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors group">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">{comp.name}</span>
                          <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-mono uppercase">{comp.type}</span>
                        </div>
                        <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{comp.description}</p>
                      </div>
                    ))}
                    {state.recognizedComponents.length === 0 && (
                      <p className="text-xs text-neutral-500 italic">No components identified yet. Run analysis.</p>
                    )}
                  </div>
                </section>

                {/* Error Findings Section */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Design Issues</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${state.detectedErrors.length > 0 ? 'bg-red-50 text-red-700 border-red-600' : 'bg-teal-50 text-teal-700 border-teal-600'}`}>
                      {state.detectedErrors.length > 0 ? 'Issues Found' : 'Compliant'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {state.detectedErrors.map((error, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                        error.category === 'Critical' ? 'bg-red-50 border-red-700 ring-1 ring-red-600/10' :
                        error.category === 'Warning' ? 'bg-amber-50 border-amber-600 ring-1 ring-amber-600/10' :
                        'bg-sky-50 border-sky-600 ring-1 ring-sky-600/10'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${
                            error.category === 'Critical' ? 'text-red-700' :
                            error.category === 'Warning' ? 'text-amber-700' :
                            'text-sky-700'
                          }`}>
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h5 className={`text-sm font-bold ${
                              error.category === 'Critical' ? 'text-red-900' :
                              error.category === 'Warning' ? 'text-amber-900' :
                              'text-sky-900'
                            }`}>{error.description}</h5>
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
                    {state.originalImage && state.recognizedComponents.length > 0 && state.detectedErrors.length === 0 && !state.isProcessing && (
                      <div className="text-center py-8 bg-teal-50 border border-teal-600 rounded-lg">
                        <div className="text-teal-600 mb-2 flex justify-center"><Activity className="w-8 h-8" /></div>
                        <p className="text-xs text-teal-900 font-bold uppercase tracking-widest">Compliant Design</p>
                        <p className="text-[10px] text-teal-700 mt-1">No major design violations detected.</p>
                      </div>
                    )}
                  </div>
                </section>

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

          {/* Quick Actions Footer Card */}
          <div className="bg-white border border-neutral-300 rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-4">Export Tools</h4>
            <div className="grid grid-cols-2 gap-3">
              <button disabled={!state.updatedImage} className="flex flex-col items-center gap-2 p-3 bg-neutral-50 border border-neutral-300 rounded-xl hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-neutral-700">
                <Download className="w-5 h-5 text-blue-600" />
                <span className="text-[10px] font-bold uppercase">DWG Export</span>
              </button>
              <button disabled={!state.updatedImage} className="flex flex-col items-center gap-2 p-3 bg-neutral-50 border border-neutral-300 rounded-xl hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-neutral-700">
                <Maximize2 className="w-5 h-5 text-blue-600" />
                <span className="text-[10px] font-bold uppercase">PDF Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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
