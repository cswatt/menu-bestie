import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import ParentSuggestions from './ParentSuggestions';

const MenuItemForm = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  onDelete,
  isSaving,
  submitText = 'Save',
  showDelete = false,
  parentSuggestions,
  showParentSuggestions,
  onParentInputChange,
  onParentFocus,
  onSelectParentSuggestion,
  getParentOptions
}) => {
  const handleParentChange = (e) => {
    const value = e.target.value;
    onChange('parent', value);
    if (onParentInputChange) {
      onParentInputChange(value);
    }
  };

  const handleParentFocus = () => {
    if (onParentFocus && formData.parent) {
      onParentFocus(formData.parent);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    onChange('parent', suggestion.value);
    if (onSelectParentSuggestion) {
      onSelectParentSuggestion(suggestion);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <Input
            value={formData.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Item name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Identifier</label>
          <Input
            value={formData.identifier || ''}
            onChange={(e) => onChange('identifier', e.target.value)}
            placeholder="Unique identifier"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
          <Input
            value={formData.url || ''}
            onChange={(e) => onChange('url', e.target.value)}
            placeholder="URL path (optional)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
          <Input
            value={formData.pre || ''}
            onChange={(e) => onChange('pre', e.target.value)}
            placeholder="Icon name (optional)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
          <div className="relative">
            {parentSuggestions ? (
              <>
                <Input
                  value={formData.parent || ''}
                  onChange={handleParentChange}
                  onFocus={handleParentFocus}
                  placeholder="Start typing to search for parent..."
                  className="w-full"
                />
                <ParentSuggestions
                  suggestions={parentSuggestions}
                  show={showParentSuggestions}
                  onSelect={handleSelectSuggestion}
                />
              </>
            ) : (
              <select
                value={formData.parent || ''}
                onChange={(e) => onChange('parent', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No parent (top level)</option>
                {getParentOptions && getParentOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
          <Input
            type="number"
            value={formData.weight || 0}
            onChange={(e) => onChange('weight', parseInt(e.target.value) || 0)}
            placeholder="Sort weight"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button 
          onClick={onSubmit} 
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          {isSaving ? 'Saving...' : submitText}
        </Button>
        <Button variant="outline" onClick={onCancel} size="sm">
          Cancel
        </Button>
        {showDelete && onDelete && (
          <Button 
            variant="outline" 
            onClick={onDelete} 
            size="sm"
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};

export default MenuItemForm;