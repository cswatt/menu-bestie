import React from 'react';
import { Button } from './ui/button';
import MenuItemForm from './MenuItemForm';

const MenuItem = ({ 
  item, 
  level = 0, 
  editingItem,
  editForm,
  onEditFormChange,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  isSaving,
  hasChildren,
  expanded,
  onToggleExpanded,
  isRecentlyEdited,
  resolvingDuplicates,
  menuData,
  parentSuggestions,
  showParentSuggestions,
  onParentInputChange,
  onParentFocus,
  onSelectParentSuggestion,
  getParentOptions
}) => {
  const indent = level * 24;
  const isEditing = editingItem && editingItem._uid === item._uid;
  const shouldShowEditForm = isEditing && !resolvingDuplicates;
  
  

  const handleParentInputChange = (value) => {
    onEditFormChange('parent', value);
    if (onParentInputChange) {
      onParentInputChange(value);
    }
  };

  const handleParentFocus = () => {
    if (onParentFocus && editForm.parent) {
      onParentFocus(editForm.parent);
    }
  };

  const handleSelectParentSuggestion = (suggestion) => {
    onEditFormChange('parent', suggestion.value);
    if (onSelectParentSuggestion) {
      onSelectParentSuggestion(suggestion);
    }
  };

  const checkWeightConflict = () => {
    if (!item.parent || !item.weight || !menuData) return false;
    
    const conflictingItems = menuData.menu.main.filter(otherItem => 
      otherItem._uid !== item._uid && 
      otherItem.parent === item.parent && 
      otherItem.weight === item.weight
    );
    
    return conflictingItems.length > 0;
  };

  return (
    <div key={item.identifier || item.name} style={{ marginLeft: `${indent}px` }} data-item-id={item.identifier || item.name}>
      {shouldShowEditForm ? (
        <MenuItemForm
          formData={editForm}
          onChange={onEditFormChange}
          onSubmit={onSaveEdit}
          onCancel={onCancelEdit}
          onDelete={() => onDelete(item)}
          isSaving={isSaving}
          showDelete={true}
          parentSuggestions={parentSuggestions}
          showParentSuggestions={showParentSuggestions}
          onParentInputChange={handleParentInputChange}
          onParentFocus={handleParentFocus}
          onSelectParentSuggestion={handleSelectParentSuggestion}
          getParentOptions={getParentOptions}
        />
      ) : (
        <div className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-md transition-all duration-300 border-l-2 ${
          isRecentlyEdited 
            ? 'bg-purple-100 border-purple-400 shadow-sm' 
            : 'border-gray-200'
        }`}>
          {hasChildren && (
            <button
              onClick={onToggleExpanded}
              className="text-gray-500 hover:text-gray-700 transition-colors p-1"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? '▼' : '▶'}
            </button>
          )}
          
          <div className="flex-1">
            <span className="font-medium">{item.name}</span>
            {item.identifier && (
              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {item.identifier}
              </span>
            )}
            {item.url && (
              <span className="ml-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                {item.url}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {item.weight && (
              <span className={`text-xs px-2 py-1 rounded ${
                checkWeightConflict()
                  ? 'text-red-600 bg-red-100' 
                  : 'text-gray-500 bg-gray-100'
              }`}>
                w: {item.weight}
              </span>
            )}
            
            {!resolvingDuplicates && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onStartEditing(item)}
                className="text-xs"
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      )}
      
      {hasChildren && expanded && (
        <div className="ml-4">
          {item.children.map((child) => (
            <MenuItem
              key={child._uid || child.identifier || child.name}
              item={child}
              level={level + 1}
              editingItem={editingItem}
              editForm={editForm}
              onEditFormChange={onEditFormChange}
              onStartEditing={onStartEditing}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDelete={onDelete}
              isSaving={isSaving}
              hasChildren={child.children && child.children.length > 0}
              expanded={expanded}
              onToggleExpanded={onToggleExpanded}
              isRecentlyEdited={isRecentlyEdited}
              resolvingDuplicates={resolvingDuplicates}
              menuData={menuData}
              parentSuggestions={parentSuggestions}
              showParentSuggestions={showParentSuggestions}
              onParentInputChange={onParentInputChange}
              onParentFocus={onParentFocus}
              onSelectParentSuggestion={onSelectParentSuggestion}
              getParentOptions={getParentOptions}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuItem;