import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useMenuData } from '../hooks/useMenuData';
import { useMenuEditor } from '../hooks/useMenuEditor';
import { useMenuNavigation } from '../hooks/useMenuNavigation';
import { useMenuOperations } from '../hooks/useMenuOperations';
import { useParentSuggestions } from '../hooks/useParentSuggestions';
import FileUploadModal from './FileUploadModal';
import AddItemModal from './AddItemModal';
import MenuItem from './MenuItem';
import MenuItemForm from './MenuItemForm';
import { buildHierarchy, filterItems, getVisibleItemCount } from '../utils/menuUtils';

const MenuEditor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadNewModal, setShowUploadNewModal] = useState(false);

  const {
    menuData,
    originalMenuData,
    uploadedFile,
    loadFromFile,
    updateMenuData,
    resetToOriginal,
    setInitialData,
    clearData
  } = useMenuData();

  const {
    editingItem,
    editForm,
    setEditForm,
    isSaving,
    setIsSaving,
    inlineEditingItem,
    inlineEditForm,
    setInlineEditForm,
    recentlyEditedItems,
    lastEditedItemRef,
    addEditFeedback,
    startEditing,
    cancelEditing,
    startInlineEditing,
    cancelInlineEditing,
    clearAllEditing
  } = useMenuEditor();

  const {
    expandedItems,
    setExpandedItems,
    searchTerm,
    setSearchTerm,
    toggleExpanded,
    isExpanded,
    expandAll,
    collapseAll,
    resetExpanded,
    ensureParentExpanded,
    preserveExpandedState
  } = useMenuNavigation(menuData);

  const {
    resolvingDuplicates,
    duplicateResolution,
    addNewItem,
    saveEditedItem,
    deleteItem,
    downloadYaml,
    getDuplicateIdentifiers,
    getItemsWithoutIdentifiers,
    startResolvingDuplicates,
    cancelDuplicateResolution,
    mergeIdenticalDuplicates,
    generateDiff
  } = useMenuOperations(menuData, updateMenuData);

  const {
    parentSuggestions,
    showParentSuggestions,
    handleParentInputChange,
    selectParentSuggestion,
    showSuggestions,
    hideSuggestions,
    getParentOptions
  } = useParentSuggestions(menuData, editingItem);

  // Preserve expanded state when menu data changes
  useEffect(() => {
    if (lastEditedItemRef.current && menuData) {
      preserveExpandedState(lastEditedItemRef.current);
      lastEditedItemRef.current = null;
    }
  }, [menuData, preserveExpandedState]);



  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || (!file.name.endsWith('.yaml') && !file.name.endsWith('.yml'))) {
      alert('Please select a valid YAML file (.yaml or .yml)');
      return;
    }

    try {
      setIsLoading(true);
      const data = await loadFromFile(file);
      setInitialData(data, file);
      
      // Reset expanded state to top-level items
      const topLevelItems = data.menu.main.filter(item => !item.parent);
      const initialExpanded = new Set(topLevelItems.map(item => item.identifier || item.name));
      setExpandedItems(initialExpanded);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || (!file.name.endsWith('.yaml') && !file.name.endsWith('.yml'))) {
      alert('Please select a valid YAML file (.yaml or .yml)');
      return;
    }

    try {
      setIsLoading(true);
      const data = await loadFromFile(file);
      
      // Reset all state
      clearAllEditing();
      setSearchTerm('');
      resetExpanded();
      
      setInitialData(data, file);
      
      // Set initial expanded state
      const topLevelItems = data.menu.main.filter(item => !item.parent);
      const initialExpanded = new Set(topLevelItems.map(item => item.identifier || item.name));
      setExpandedItems(initialExpanded);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (itemData) => {
    const newItem = await addNewItem(itemData);
    
    // Expand parent if specified
    if (newItem.parent) {
      ensureParentExpanded(newItem.parent);
      
      // Scroll to parent
      setTimeout(() => {
        const parentElement = document.querySelector(`[data-item-id="${newItem.parent}"]`);
        if (parentElement) {
          parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
    
    addEditFeedback(newItem);
  };

  const handleStartEditing = (item) => {
    startEditing(item);
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      
      // Store parent info for expansion
      lastEditedItemRef.current = {
        ...editingItem,
        _editFormParent: editForm.parent
      };
      
      await saveEditedItem(editingItem, editForm);
      
      // Handle parent expansion and scrolling only if parent changed
      const originalParent = editingItem.parent;
      const newParent = editForm.parent;
      const parentChanged = originalParent !== newParent;
      
      if (parentChanged && newParent) {
        ensureParentExpanded(newParent);
        
        setTimeout(() => {
          const parentElement = document.querySelector(`[data-item-id="${newParent}"]`);
          if (parentElement) {
            parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      
      addEditFeedback(editingItem);
      cancelEditing();
    } catch (error) {
      alert(`Error updating item: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    cancelEditing();
  };

  const handleSaveInlineEdit = async () => {
    if (!inlineEditingItem || !menuData) return;

    try {
      const updatedItems = menuData.menu.main.map(item => {
        if (item._uid === inlineEditingItem._uid) {
          return {
            ...item,
            ...inlineEditForm,
            _uid: item._uid,
            ...(inlineEditForm.url === '' && { url: undefined }),
            ...(inlineEditForm.pre === '' && { pre: undefined }),
            ...(inlineEditForm.parent === '' && { parent: undefined })
          };
        }
        return item;
      });

      const updatedMenuData = {
        ...menuData,
        menu: { ...menuData.menu, main: updatedItems }
      };

      updateMenuData(updatedMenuData);
      addEditFeedback(inlineEditingItem);
      cancelInlineEditing();
    } catch (error) {
      alert(`Error saving item: ${error.message}`);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await deleteItem(item);
    } catch (error) {
      alert(`Error deleting item: ${error.message}`);
    }
  };

  const handleResetToOriginal = () => {
    if (!confirm('Are you sure you want to reset? All temporary changes will be lost.')) {
      return;
    }

    if (resetToOriginal()) {
      clearAllEditing();
      setSearchTerm('');
      resetExpanded();
      
      // Reset expanded state to default
      const topLevelItems = originalMenuData.menu.main.filter(item => !item.parent);
      const initialExpanded = new Set(topLevelItems.map(item => item.identifier || item.name));
      setExpandedItems(initialExpanded);
    } else {
      alert('No original data available to reset to. Please upload a file first.');
    }
  };

  const handleMergeIdenticalDuplicates = async (duplicateData) => {
    const [item1, item2] = duplicateData.items;
    const itemToKeep = item1._uid > item2._uid ? item2 : item1;
    const itemToDelete = item1._uid > item2._uid ? item1 : item2;
    
    if (!confirm(`Merge identical items? "${itemToDelete.name}" will be deleted, keeping "${itemToKeep.name}".`)) {
      return;
    }

    try {
      await mergeIdenticalDuplicates(duplicateData);
    } catch (error) {
      alert(`Error merging duplicates: ${error.message}`);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleInlineFormChange = (field, value) => {
    setInlineEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleParentSuggestionSelect = (suggestion) => {
    const value = selectParentSuggestion(suggestion);
    setEditForm(prev => ({ ...prev, parent: value }));
  };

  const renderMenuItem = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    const expanded = isExpanded(item);
    const isRecentlyEdited = recentlyEditedItems.has(item._uid);
    const isEditing = editingItem && editingItem._uid === item._uid;
    

    return (
      <MenuItem
        key={item._uid || item.identifier || item.name}
        item={item}
        level={0}
        editingItem={editingItem}
        editForm={editForm}
        onEditFormChange={handleEditFormChange}
        onStartEditing={handleStartEditing}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onDelete={handleDeleteItem}
        isSaving={false}
        hasChildren={hasChildren}
        expanded={expanded}
        onToggleExpanded={toggleExpanded}
        isExpanded={isExpanded}
        isRecentlyEdited={isRecentlyEdited}
        recentlyEditedItems={recentlyEditedItems}
        resolvingDuplicates={resolvingDuplicates}
        menuData={menuData}
        parentSuggestions={parentSuggestions}
        showParentSuggestions={showParentSuggestions}
        onParentInputChange={handleParentInputChange}
        onParentFocus={showSuggestions}
        onSelectParentSuggestion={handleParentSuggestionSelect}
        getParentOptions={getParentOptions}
      />
    );
  };

  if (isLoading && !menuData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu data...</p>
        </div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Menu Bestie</h1>
              <p className="text-gray-600">Edit navigation menu configuration.</p>
            </div>
            <div className="text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-md">
              Upload a YAML file to get started
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Menu File</h2>
              <p className="text-gray-600">Select a main.en.yaml file to get started</p>
            </div>
            <div className="mb-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors">
                  <div className="text-gray-600">
                    <div className="text-lg font-medium mb-2">Choose a file</div>
                    <div className="text-sm">or drag and drop</div>
                    <div className="text-xs text-gray-500 mt-1">YAML files only</div>
                  </div>
                </div>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".yaml,.yml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-500">
              Upload your main.en.yaml file to start editing your navigation menu
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hierarchicalItems = buildHierarchy(menuData.menu.main);
  const filteredItems = filterItems(hierarchicalItems, searchTerm);
  const duplicates = getDuplicateIdentifiers();
  const itemsWithoutIdentifiers = getItemsWithoutIdentifiers();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Bestie</h1>
            <p className="text-gray-600">Edit navigation menu configuration.</p>
            {duplicates.length > 0 && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md inline-flex items-center gap-2">
                Identifier errors found: {duplicates.length} duplicate{duplicates.length !== 1 ? 's' : ''}, {itemsWithoutIdentifiers.length} missing
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowUploadNewModal(true)}
              variant="outline"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              Upload New
            </Button>
            <Button 
              onClick={downloadYaml}
              className="bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700"
            >
              Download new main.en.yaml
            </Button>
            <Button 
              onClick={handleResetToOriginal}
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Reset changes
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {getVisibleItemCount(hierarchicalItems, expandedItems, isExpanded)} of {menuData?.menu?.main?.length || 0} items
          </div>
          
          <Button onClick={() => setShowAddModal(true)}>
            Add Item
          </Button>
        </div>
      </div>

      {/* Modals */}
      <AddItemModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddItem={handleAddItem}
        parentSuggestions={parentSuggestions}
        showParentSuggestions={showParentSuggestions}
        onParentInputChange={handleParentInputChange}
        onSelectParentSuggestion={selectParentSuggestion}
        onParentFocus={showSuggestions}
      />


      <FileUploadModal
        show={showUploadNewModal}
        onClose={() => setShowUploadNewModal(false)}
        onFileUpload={handleNewFileUpload}
        title="Upload New Menu File"
        description="This will replace the current menu with a new file. All unsaved changes will be lost."
      />

      {/* Items Without Identifiers Warning */}
      {itemsWithoutIdentifiers.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Items Without Identifiers Found ({itemsWithoutIdentifiers.length} items)
              </h3>
              <p className="text-yellow-700 mb-3">
                The following items are missing identifier fields, which may cause navigation issues:
              </p>
              <div className="space-y-2">
                {itemsWithoutIdentifiers.map((item) => (
                  <div key={item._uid} className="bg-yellow-100 p-3 rounded border border-yellow-300">
                    {inlineEditingItem && inlineEditingItem._uid === item._uid ? (
                      <MenuItemForm
                        formData={inlineEditForm}
                        onChange={handleInlineFormChange}
                        onSubmit={handleSaveInlineEdit}
                        onCancel={cancelInlineEditing}
                        submitText="Save"
                        parentSuggestions={parentSuggestions}
                        showParentSuggestions={showParentSuggestions}
                        onParentInputChange={handleParentInputChange}
                        onParentFocus={showSuggestions}
                        onSelectParentSuggestion={(suggestion) => {
                          const value = selectParentSuggestion(suggestion);
                          setInlineEditForm(prev => ({ ...prev, parent: value }));
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-yellow-800">{item.name}</div>
                          <div className="text-sm text-yellow-700 mt-1">
                            {item.url && <span className="mr-3">URL: {item.url}</span>}
                            {item.weight && <span className="mr-3">Weight: {item.weight}</span>}
                            {item.parent && <span>Parent: {item.parent}</span>}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startInlineEditing(item)}
                          className="text-xs bg-yellow-600 text-white border-yellow-600 hover:bg-yellow-700 hover:border-yellow-700"
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-yellow-600 text-sm mt-3">
                Each item should have a unique <code>identifier</code> field for proper navigation.
                <br />
                Click "Edit" on any item above to add an identifier.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Identifiers Warning */}
      {duplicates.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-2">
                Duplicate Identifiers Found ({duplicates.length} unique duplicates)
              </h3>
              <p className="text-red-700 mb-3">
                The following identifiers are used multiple times, which may cause navigation issues:
              </p>
              <div className="space-y-2">
                {duplicates.map((dup, index) => (
                  <div key={index} className="bg-red-100 p-3 rounded border border-red-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-red-800">
                          "{dup.identifier}" used {dup.count} times
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {dup.areIdentical ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMergeIdenticalDuplicates(dup)}
                            className="bg-red-600 text-white border-red-600 hover:bg-red-700"
                          >
                            Merge
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startResolvingDuplicates(dup)}
                            className="bg-red-600 text-white border-red-600 hover:bg-red-700"
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Duplicate resolution interface */}
                    {resolvingDuplicates && resolvingDuplicates.identifier === dup.identifier && duplicateResolution && (
                      <div className="mt-4 p-4 bg-white rounded border border-red-200">
                        <div className="mb-4">
                          <h4 className="font-semibold text-red-800 mb-2">Duplicate Items Comparison</h4>
                          <p className="text-red-700 text-sm">
                            Review the differences and edit or delete items as needed.
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          {duplicateResolution.items.map((item, itemIndex) => (
                            <div key={item._uid} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                              {editingItem && editingItem._uid === item._uid ? (
                                <MenuItemForm
                                  formData={editForm}
                                  onChange={handleEditFormChange}
                                  onSubmit={handleSaveEdit}
                                  onCancel={cancelEditing}
                                  isSaving={isSaving}
                                  getParentOptions={getParentOptions}
                                />
                              ) : (
                                <>
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="font-medium text-gray-900">
                                      Item {itemIndex + 1}: {item.name}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => startEditing(item)}
                                        className="text-xs bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteItem(item)}
                                        className="text-xs bg-red-600 text-white border-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="text-sm text-gray-600 space-y-1">
                                    {duplicateResolution.items.length === 2 ? (
                                      Object.entries(generateDiff(item, duplicateResolution.items[1 - itemIndex])).map(([field, values]) => (
                                        <div 
                                          key={field}
                                          className={`p-2 rounded ${
                                            values.changed 
                                              ? 'bg-red-50 border border-red-200 text-red-800' 
                                              : 'bg-gray-100'
                                          }`}
                                        >
                                          <span className="font-medium">{field}:</span> {values.item1 || '(empty)'}
                                          {values.changed && (
                                            <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                              differs from Item {2 - itemIndex}
                                            </span>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <>
                                        <div><span className="font-medium">Identifier:</span> {item.identifier}</div>
                                        {item.url && <div><span className="font-medium">URL:</span> {item.url}</div>}
                                        {item.weight && <div><span className="font-medium">Weight:</span> {item.weight}</div>}
                                        {item.parent && <div><span className="font-medium">Parent:</span> {item.parent}</div>}
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-3 mt-4">
                          <Button variant="outline" onClick={cancelDuplicateResolution} size="sm">
                            Close
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-red-600 text-sm mt-3">
                Each item should have a unique <code>identifier</code> field.
                <br />
                If two items have completely identical content, you can merge them to keep one and delete the other.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Structure */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Structure</h2>
        
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No items match your search criteria.' : 'No menu items found.'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredItems.map((item) => renderMenuItem(item))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuEditor;