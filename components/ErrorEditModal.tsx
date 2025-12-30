
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DesignError } from '../types';

interface ErrorEditModalProps {
  error: DesignError | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (error: DesignError) => void;
}

const generateId = () => `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const ErrorEditModal: React.FC<ErrorEditModalProps> = ({ error, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<DesignError>(
    error || {
      id: generateId(),
      category: 'Warning',
      description: '',
      recommendation: '',
      confidence: 0.8,
      affectedComponents: [],
      location: '',
      detectionReason: '',
      isNew: true,
      createdBy: 'user'
    }
  );

  // Update form data when error prop changes
  useEffect(() => {
    if (error) {
      setFormData(error);
    } else {
      setFormData({
        id: generateId(),
        category: 'Warning',
        description: '',
        recommendation: '',
        confidence: 0.8,
        affectedComponents: [],
        location: '',
        detectionReason: '',
        isNew: true,
        createdBy: 'user'
      });
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.description.trim() || !formData.recommendation.trim()) {
      alert('Description and Recommendation are required fields.');
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-neutral-300 flex items-center justify-between bg-neutral-50">
          <h2 className="text-xl font-bold text-neutral-900">
            {error ? 'Edit Design Issue' : 'Add Design Issue'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Category <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value as any})}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-neutral-900"
            >
              <option value="Critical">Critical</option>
              <option value="Warning">Warning</option>
              <option value="Info">Info</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none text-neutral-900"
              placeholder="Describe the design issue..."
            />
          </div>

          {/* Recommendation */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Recommendation <span className="text-red-600">*</span>
            </label>
            <textarea
              value={formData.recommendation}
              onChange={(e) => setFormData({...formData, recommendation: e.target.value})}
              rows={2}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none text-neutral-900"
              placeholder="How to fix this issue..."
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-neutral-900"
              placeholder="e.g., Pump P-101A suction line"
            />
          </div>

          {/* Affected Components */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Affected Components (comma-separated)
            </label>
            <input
              type="text"
              value={formData.affectedComponents?.join(', ') || ''}
              onChange={(e) => setFormData({
                ...formData,
                affectedComponents: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-neutral-900"
              placeholder="e.g., P-101A, V-100, PSV-101"
            />
          </div>

          {/* Detection Reason */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Detection Reason
            </label>
            <input
              type="text"
              value={formData.detectionReason || ''}
              onChange={(e) => setFormData({...formData, detectionReason: e.target.value})}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-neutral-900"
              placeholder="e.g., ASME BPVC requires relief valve on pressurized vessels"
            />
          </div>

          {/* Confidence slider */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Confidence: {(formData.confidence * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.confidence * 100}
              onChange={(e) => setFormData({...formData, confidence: parseInt(e.target.value) / 100})}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="p-6 border-t border-neutral-300 flex justify-end gap-3 bg-neutral-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-700 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            {error ? 'Save Changes' : 'Add Issue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorEditModal;
