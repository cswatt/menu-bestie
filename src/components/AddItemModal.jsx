import React, { useState } from 'react';
import { Button } from './ui/button';
import MenuItemForm from './MenuItemForm';

const AddItemModal = ({ 
  show, 
  onClose, 
  onAddItem, 
  parentSuggestions, 
  showParentSuggestions, 
  onParentInputChange, 
  onSelectParentSuggestion,
  onParentFocus
}) => {
  const [addItemForm, setAddItemForm] = useState({
    name: '',
    identifier: '',
    url: '',
    pre: '',
    parent: '',
    weight: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!show) return null;

  const handleFormChange = (field, value) => {
    setAddItemForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!addItemForm.name || !addItemForm.identifier) return;

    try {
      setIsSaving(true);
      await onAddItem(addItemForm);
      
      setAddItemForm({
        name: '',
        identifier: '',
        url: '',
        pre: '',
        parent: '',
        weight: 0
      });
      
      onClose();
    } catch (error) {
      alert(`Error adding item: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setAddItemForm({
      name: '',
      identifier: '',
      url: '',
      pre: '',
      parent: '',
      weight: 0
    });
    onClose();
  };

  const handleParentInputChange = (value) => {
    handleFormChange('parent', value);
    if (onParentInputChange) {
      onParentInputChange(value);
    }
  };

  const handleParentFocus = () => {
    if (onParentFocus && addItemForm.parent) {
      onParentFocus(addItemForm.parent);
    }
  };

  const handleSelectParentSuggestion = (suggestion) => {
    handleFormChange('parent', suggestion.value);
    if (onSelectParentSuggestion) {
      onSelectParentSuggestion(suggestion);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative p-8 border w-96 shadow-lg rounded-md bg-white">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Menu Item</h3>
          <div className="grid grid-cols-1 gap-3">
            <MenuItemForm
              formData={addItemForm}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              onCancel={handleClose}
              isSaving={isSaving}
              submitText="Add Item"
              parentSuggestions={parentSuggestions}
              showParentSuggestions={showParentSuggestions}
              onParentInputChange={handleParentInputChange}
              onParentFocus={handleParentFocus}
              onSelectParentSuggestion={handleSelectParentSuggestion}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;