
export enum WorkflowStep {
  UPLOAD = 1,
  RECOGNITION = 2,
  IDENTIFY_ERRORS = 3,
  GENERATE_UPDATED = 4
}

export interface PipelineComponent {
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
  role: 'user' | 'model';
  text: string;
}
