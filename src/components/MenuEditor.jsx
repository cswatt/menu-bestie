import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const MenuEditor = () => {
  const [menuData, setMenuData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Load menu data from the YAML file
  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch from API, fallback to sample data
      try {
        const response = await fetch('/api/menu-data');
        if (response.ok) {
          const data = await response.json();
          setMenuData(data);
          return;
        }
      } catch (err) {
        console.log('API not available, using sample data');
      }
      
      // Sample data for demo
      setMenuData({
        menu: {
          main: [
            {
              name: "Essentials",
              identifier: "essentials_heading",
              weight: 1000000
            },
            {
              name: "Getting Started",
              identifier: "getting_started",
              url: "getting_started/",
              pre: "hex-ringed",
              parent: "essentials_heading",
              weight: 10000
            },
            {
              name: "Platform",
              identifier: "platform_heading",
              weight: 2000000
            },
            {
              name: "Dashboards",
              identifier: "dashboards",
              url: "dashboards/",
              pre: "dashboard",
              parent: "platform_heading",
              weight: 10000
            }
          ]
        }
      });
    } catch (err) {
      console.error('Error loading menu data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Build hierarchical structure from flat list
  const buildHierarchy = (items) => {
    if (!items || !Array.isArray(items)) return [];
    
    // Create a map of all items by identifier
    const itemMap = new Map();
    const rootItems = [];
    
    // First pass: create item objects with empty children arrays
    items.forEach(item => {
      const itemWithChildren = { ...item, children: [] };
      itemMap.set(item.identifier || item.name, itemWithChildren);
    });
    
    // Second pass: build parent-child relationships
    items.forEach(item => {
      const currentItem = itemMap.get(item.identifier || item.name);
      
      if (item.parent && itemMap.has(item.parent)) {
        // This item has a parent, add it to parent's children
        const parent = itemMap.get(item.parent);
        if (!parent.children) parent.children = [];
        parent.children.push(currentItem);
      } else {
        // This is a root item
        rootItems.push(currentItem);
      }
    });
    
    // Sort function to sort by weight
    const sortByWeight = (itemsToSort) => {
      itemsToSort.sort((a, b) => (a.weight || 0) - (b.weight || 0));
      
      // Recursively sort children
      itemsToSort.forEach(item => {
        if (item.children && item.children.length > 0) {
          sortByWeight(item.children);
        }
      });
    };
    
    // Sort root items and all children
    sortByWeight(rootItems);
    
    return rootItems;
  };

  // Start editing an item
  const startEditing = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name || '',
      identifier: item.identifier || '',
      url: item.url || '',
      pre: item.pre || '',
      parent: item.parent || '',
      weight: item.weight || 0
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingItem(null);
    setEditForm({});
  };

  // Save the edited item
  const saveEditedItem = async () => {
    if (!editingItem || !menuData) return;

    try {
      setIsSaving(true);
      
      // Find the item in the flat list and update it
      const updatedItems = menuData.menu.main.map(item => {
        // Fix the matching logic to prevent duplication
        if (item.identifier === editingItem.identifier) {
          // Match by identifier (most reliable)
          return {
            ...item,
            ...editForm,
            // Remove empty fields
            ...(editForm.url === '' && { url: undefined }),
            ...(editForm.pre === '' && { pre: undefined }),
            ...(editForm.parent === '' && { parent: undefined })
          };
        } else if (!item.identifier && !editingItem.identifier && item.name === editingItem.name) {
          // Match by name only when both items have no identifier
          return {
            ...item,
            ...editForm,
            // Remove empty fields
            ...(editForm.url === '' && { url: undefined }),
            ...(editForm.pre === '' && { pre: undefined }),
            ...(editForm.parent === '' && { parent: undefined })
          };
        }
        return item;
      });

      const updatedMenuData = {
        ...menuData,
        menu: { ...menuData.menu, main: updatedItems }
      };

      // Try to save to API
      try {
        console.log(`Saving menu data with ${updatedItems.length} items...`);
        
        const response = await fetch('/api/menu-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedMenuData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Save successful:', result.message);
          
          // Update local state
          setMenuData(updatedMenuData);
          setEditingItem(null);
          setEditForm({});
        } else {
          const errorText = await response.text();
          console.error(`API error ${response.status}:`, errorText);
          
          if (response.status === 413) {
            throw new Error('Menu data is too large to save. Consider breaking it into smaller sections.');
          } else {
            throw new Error(`Failed to save: ${response.status} ${response.statusText}`);
          }
        }
      } catch (err) {
        console.error('API save failed:', err);
        
        // Show user-friendly error message
        if (err.message.includes('too large')) {
          alert('⚠️ Save failed: The menu data is very large. The changes have been applied locally but not saved to the file. Consider editing fewer items at once.');
        } else {
          alert(`⚠️ Save failed: ${err.message}. The changes have been applied locally but not saved to the file.`);
        }
        
        // Update local state even if API fails
        setMenuData(updatedMenuData);
        setEditingItem(null);
        setEditForm({});
      }
    } catch (err) {
      console.error('Error saving item:', err);
      alert(`Error saving item: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Get all available parent options for the current item
  const getParentOptions = () => {
    if (!menuData) return [];
    
    return menuData.menu.main
      .filter(item => 
        item.identifier !== editingItem?.identifier && 
        item.name !== editingItem?.name
      )
      .map(item => ({
        value: item.identifier || item.name,
        label: `${item.name} (${item.identifier || 'no-id'})`
      }));
  };

  // Render a single menu item with proper indentation
  const renderMenuItem = (item, level = 0) => {
    const indent = level * 24; // Increased indentation for better visual hierarchy
    const hasChildren = item.children && item.children.length > 0;
    const isEditing = editingItem && (
      editingItem.identifier === item.identifier || 
      (editingItem.name === item.name && !item.identifier)
    );
    
    return (
      <div key={item.identifier || item.name} style={{ marginLeft: `${indent}px` }}>
        {isEditing ? (
          // Edit form
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Item name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Identifier</label>
                <Input
                  value={editForm.identifier}
                  onChange={(e) => setEditForm({...editForm, identifier: e.target.value})}
                  placeholder="Unique identifier"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <Input
                  value={editForm.url || ''}
                  onChange={(e) => setEditForm({...editForm, url: e.target.value})}
                  placeholder="URL path (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <Input
                  value={editForm.pre || ''}
                  onChange={(e) => setEditForm({...editForm, pre: e.target.value})}
                  placeholder="Icon name (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
                <select
                  value={editForm.parent || ''}
                  onChange={(e) => setEditForm({...editForm, parent: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No parent (top level)</option>
                  {getParentOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                <Input
                  type="number"
                  value={editForm.weight}
                  onChange={(e) => setEditForm({...editForm, weight: parseInt(e.target.value) || 0})}
                  placeholder="Sort weight"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button 
                onClick={saveEditedItem} 
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // Display mode
          <div className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-md transition-colors border-l-2 border-gray-200">
            <div className="text-gray-500">
              {item.url ? '🔗' : hasChildren ? '📁' : '📄'}
            </div>
            <div className="flex-1">
              <span className="font-medium">{item.name}</span>
              {item.identifier && (
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {item.identifier}
                </span>
              )}
              {item.url && (
                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {item.url}
                </span>
              )}
              {item.weight && (
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  w: {item.weight}
                </span>
              )}
              {item.parent && (
                <span className="ml-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                  parent: {item.parent}
                </span>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => startEditing(item)}
              className="text-xs"
            >
              ✏️ Edit
            </Button>
          </div>
        )}
        
        {/* Render children if they exist */}
        {hasChildren && (
          <div className="ml-4">
            {item.children.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">Failed to load menu data</p>
          <Button onClick={loadMenuData}>Retry</Button>
        </div>
      </div>
    );
  }

  // Build the hierarchical structure
  const hierarchicalItems = buildHierarchy(menuData.menu.main);
  
  // Filter items based on search term (search through all levels)
  const filterItems = (items, searchTerm) => {
    if (!searchTerm) return items;
    
    const searchLower = searchTerm.toLowerCase();
    
    return items.filter(item => {
      // Check if this item matches
      const itemMatches = (
        item.name?.toLowerCase().includes(searchLower) ||
        item.identifier?.toLowerCase().includes(searchLower) ||
        item.url?.toLowerCase().includes(searchLower)
      );
      
      // Check if any children match
      const childrenMatch = item.children && item.children.length > 0 && 
        filterItems(item.children, searchTerm).length > 0;
      
      return itemMatches || childrenMatch;
    }).map(item => {
      // If this item doesn't match but children do, still include it
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: filterItems(item.children, searchTerm)
        };
      }
      return item;
    });
  };

  const filteredItems = filterItems(hierarchicalItems, searchTerm);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Bestie</h1>
            <p className="text-gray-600">Edit navigation menu configuration</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              📥 Download
            </Button>
            <Button>
              💾 Save All
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Button>
            ➕ Add Top-Level Item
          </Button>
        </div>
      </div>

      {/* Menu Tree */}
      <div className="px-6 py-6">
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
    </div>
  );
};

export default MenuEditor;

