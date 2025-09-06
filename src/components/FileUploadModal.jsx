import React from 'react';
import { Button } from './ui/button';

const FileUploadModal = ({ show, onClose, onFileUpload, title, description }) => {
  if (!show) return null;

  const handleFileChange = (event) => {
    onFileUpload(event);
    onClose();
  };

  const inputId = title.toLowerCase().replace(/\s+/g, '-') + '-file-input';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative p-8 border w-96 shadow-lg rounded-md bg-white">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          {description && (
            <p className="text-gray-600 mb-4">{description}</p>
          )}
          <div className="mb-4">
            <label htmlFor={inputId} className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <div className="text-gray-600">
                  <div className="text-lg font-medium mb-2">Choose a file</div>
                  <div className="text-sm">or drag and drop</div>
                  <div className="text-xs text-gray-500 mt-1">YAML files only</div>
                </div>
              </div>
            </label>
            <input
              id={inputId}
              type="file"
              accept=".yaml,.yml"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;