
import React from 'react';
import { Upload, Cpu, AlertTriangle, FileCheck, ArrowRight } from 'lucide-react';
import { WorkflowStep } from '../types';

interface StepIndicatorProps {
  currentStep: WorkflowStep;
}

const steps = [
  { id: WorkflowStep.UPLOAD, label: 'Upload P&IDs', icon: Upload, description: 'Import drawing files' },
  { id: WorkflowStep.RECOGNITION, label: 'AI Recognition', icon: Cpu, description: 'Component detection' },
  { id: WorkflowStep.IDENTIFY_ERRORS, label: 'Identify Errors', icon: AlertTriangle, description: 'Design verification' },
  { id: WorkflowStep.GENERATE_UPDATED, label: 'Generate Update', icon: FileCheck, description: 'Corrected drawings' }
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const Icon = step.icon;

        return (
          <div key={step.id} className="relative">
            <div className={`
              flex flex-col p-4 rounded-xl border transition-all duration-300 shadow-sm
              ${isActive ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/20' :
                isCompleted ? 'bg-teal-50 border-teal-600/50' : 'bg-white border-neutral-300'}
            `}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${isActive ? 'bg-blue-600 text-white' :
                    isCompleted ? 'bg-teal-600 text-white' : 'bg-neutral-100 text-neutral-500'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-bold uppercase tracking-tighter ${isActive ? 'text-blue-600' : 'text-neutral-500'}`}>
                  Step {step.id}
                </span>
              </div>
              <h3 className={`font-semibold ${isActive ? 'text-neutral-900' : 'text-neutral-600'}`}>
                {step.label}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">{step.description}</p>
            </div>

            {idx < steps.length - 1 && (
              <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-neutral-400">
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
