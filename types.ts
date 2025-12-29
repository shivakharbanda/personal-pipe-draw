
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
}

export interface AnalysisState {
  originalImage: string | null;
  recognizedComponents: PipelineComponent[];
  detectedErrors: DesignError[];
  updatedImage: string | null;
  isProcessing: boolean;
  error: string | null;
  errorDetails?: string;
}
