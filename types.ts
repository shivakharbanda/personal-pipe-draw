
export enum WorkflowStep {
  UPLOAD = 1,
  RECOGNITION = 2,
  IDENTIFY_ERRORS = 3,
  GENERATE_UPDATED = 4
}

export interface PipelineComponent {
  id: string;
  type: string;
  name: string;
  description: string;
  location?: string;
}

export interface DesignError {
  id: string;
  category: 'Critical' | 'Warning' | 'Info';
  description: string;
  recommendation: string;
  confidence: number;
  // Explainability fields
  affectedComponents?: string[];  // Equipment tags/line numbers from the drawing
  location?: string;              // Human-readable location description
  detectionReason?: string;       // Explanation of why this issue was detected
  // Change tracking metadata
  isModified?: boolean;
  isNew?: boolean;
  isDeleted?: boolean;
  createdBy?: 'ai' | 'user';
  lastModified?: Date;
}

export interface AnalysisState {
  originalImage: string | null;
  recognizedComponents: PipelineComponent[];
  detectedErrors: DesignError[];
  updatedImage: string | null;
  annotatedImage: string | null;
  isProcessing: boolean;
  error: string | null;
  errorDetails?: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
  // New fields for interactive confirmations
  pendingAction?: PendingErrorAction;
  confirmed?: boolean;  // undefined = pending, true = confirmed, false = cancelled
  actionId?: string;    // Unique ID to track this message
}

export interface PendingErrorAction {
  id: string;
  type: 'add' | 'edit' | 'delete' | 'bulk-add';
  errors: DesignError[];
  userPrompt: string;
  timestamp: Date;
}

export interface ChangeAction {
  id: string;
  timestamp: Date;
  type: 'add' | 'edit' | 'delete' | 'restore';
  target: 'error' | 'component';
  targetId: string;
  description: string;
  beforeState?: DesignError | PipelineComponent | null;
  afterState?: DesignError | PipelineComponent | null;
  source: 'manual' | 'chat-ai' | 'chat-user';
}

export interface EditSession {
  originalErrors: DesignError[];
  currentErrors: DesignError[];
  originalComponents: PipelineComponent[];
  currentComponents: PipelineComponent[];
  changeLog: ChangeAction[];
  hasUnsavedChanges: boolean;
}
