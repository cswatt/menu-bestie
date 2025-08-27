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
  const [expandedItems, setExpandedItems] = useState(new Set()); // Track expanded state
  const [resolvingDuplicates, setResolvingDuplicates] = useState(null); // Track which duplicates are being resolved
  const [duplicateResolution, setDuplicateResolution] = useState(null); // Store the resolution data

  // Load menu data from the YAML file
  useEffect(() => {
    loadMenuData();
  }, []);

  // Generate unique UIDs for items
  const addUIDsToItems = (items) => {
    if (!items || !Array.isArray(items)) return items;
    
    return items.map((item, index) => ({
      ...item,
      _uid: `item_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
    }));
  };

  // Initialize with all top-level items expanded by default
  useEffect(() => {
    if (menuData && menuData.menu && menuData.menu.main) {
      const topLevelItems = menuData.menu.main.filter(item => !item.parent);
      const initialExpanded = new Set(topLevelItems.map(item => item.identifier || item.name));
      setExpandedItems(initialExpanded);
    }
  }, [menuData]);

  // Toggle expand/collapse for an item
  const toggleExpanded = (item) => {
    const itemKey = item.identifier || item.name;
    const newExpanded = new Set(expandedItems);
    
    if (newExpanded.has(itemKey)) {
      newExpanded.delete(itemKey);
    } else {
      newExpanded.add(itemKey);
    }
    
    setExpandedItems(newExpanded);
  };

  // Check if an item is expanded
  const isExpanded = (item) => {
    const itemKey = item.identifier || item.name;
    return expandedItems.has(itemKey);
  };

  // Start resolving duplicate identifiers
  const startResolvingDuplicates = (duplicateData) => {
    setResolvingDuplicates(duplicateData);
    
    // Get the actual items for comparison
    const items = menuData.menu.main.filter(item => item.identifier === duplicateData.identifier);
    setDuplicateResolution({
      identifier: duplicateData.identifier,
      items: items,
      selectedItem: null
    });
  };

  // Cancel duplicate resolution
  const cancelDuplicateResolution = () => {
    setResolvingDuplicates(null);
    setDuplicateResolution(null);
  };

  // Select which item to keep
  const selectItemToKeep = (itemIndex) => {
    setDuplicateResolution(prev => ({
      ...prev,
      selectedItem: itemIndex
    }));
  };

  // Confirm duplicate resolution
  const confirmDuplicateResolution = async () => {
    if (!duplicateResolution || duplicateResolution.selectedItem === null) return;

    try {
      const selectedItem = duplicateResolution.items[duplicateResolution.selectedItem];
      const itemsToRemove = duplicateResolution.items.filter((_, index) => index !== duplicateResolution.selectedItem);
      
      console.log('Resolving duplicates:', {
        keeping: selectedItem.name,
        removing: itemsToRemove.map(item => item.name)
      });
      
      // Remove the items that weren't selected using UIDs for precise identification
      const updatedItems = menuData.menu.main.filter(item => {
        // Keep the item if it's NOT one of the items we want to remove (using UID)
        return !itemsToRemove.some(removeItem => item._uid === removeItem._uid);
      });

      console.log(`Original items: ${menuData.menu.main.length}, Updated items: ${updatedItems.length}, Removed: ${itemsToRemove.length}`);

      const updatedMenuData = {
        ...menuData,
        menu: { ...menuData.menu, main: updatedItems }
      };

      // Update temporary data via API
      try {
        console.log(`Resolving duplicates: keeping 1 item, removing ${itemsToRemove.length} items`);
        
        const response = await fetch('/api/menu-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedMenuData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Duplicate resolution successful:', result.message);
          
          // Update local state
          setMenuData(updatedMenuData);
          setResolvingDuplicates(null);
          setDuplicateResolution(null);
        } else {
          const errorText = await response.text();
          console.error(`API error ${response.status}:`, errorText);
          throw new Error(`Failed to resolve duplicates: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        console.error('API update failed:', err);
        alert(`⚠️ Failed to resolve duplicates: ${err.message}. Changes have been applied locally but not saved to temporary storage.`);
        
        // Update local state even if API fails
        setMenuData(updatedMenuData);
        setResolvingDuplicates(null);
        setDuplicateResolution(null);
      }
    } catch (err) {
      console.error('Error resolving duplicates:', err);
      alert(`Error resolving duplicates: ${err.message}`);
    }
  };

  // Expand all items
  const expandAll = () => {
    if (!menuData) return;
    
    const allItemKeys = new Set();
    const addItemKeys = (items) => {
      items.forEach(item => {
        allItemKeys.add(item.identifier || item.name);
        if (item.children && item.children.length > 0) {
          addItemKeys(item.children);
        }
      });
    };
    
    addItemKeys(menuData.menu.main);
    setExpandedItems(allItemKeys);
  };

  // Collapse all items
  const collapseAll = () => {
    if (!menuData) return;
    
    // Only keep top-level items expanded
    const topLevelItems = menuData.menu.main.filter(item => !item.parent);
    const topLevelKeys = new Set(topLevelItems.map(item => item.identifier || item.name));
    setExpandedItems(topLevelKeys);
  };

  // Get the count of visible items (expanded items only)
  const getVisibleItemCount = () => {
    if (!menuData) return 0;
    
    let count = 0;
    const countVisible = (items) => {
      items.forEach(item => {
        count++;
        if (item.children && item.children.length > 0 && isExpanded(item)) {
          countVisible(item.children);
        }
      });
    };
    
    countVisible(menuData.menu.main);
    return count;
  };

  // Check for duplicate identifiers
  const getDuplicateIdentifiers = () => {
    if (!menuData) return [];
    
    const identifierCounts = new Map();
    const duplicates = [];
    
    // Count occurrences of each identifier
    menuData.menu.main.forEach(item => {
      if (item.identifier) {
        const count = identifierCounts.get(item.identifier) || 0;
        identifierCounts.set(item.identifier, count + 1);
        
        if (count === 1) {
          // This is the second occurrence, add to duplicates
          duplicates.push(item.identifier);
        }
      }
    });
    
    // Get all items with duplicate identifiers
    const duplicateItems = [];
    duplicates.forEach(identifier => {
      const itemsWithId = menuData.menu.main.filter(item => item.identifier === identifier);
      duplicateItems.push({
        identifier,
        count: itemsWithId.length,
        items: itemsWithId.map(item => item.name)
      });
    });
    
    return duplicateItems;
  };

  const loadMenuData = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch from API, fallback to sample data
      try {
        const response = await fetch('/api/menu-data');
        if (response.ok) {
          const data = await response.json();
          // Add UIDs to all items
          const dataWithUIDs = {
            ...data,
            menu: {
              ...data.menu,
              main: addUIDsToItems(data.menu.main)
            }
          };
          setMenuData(dataWithUIDs);
          return;
        }
      } catch (err) {
        console.log('API not available, using sample data');
      }
      
      // Sample data for demo
      const sampleData = {
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
      };
      
      // Add UIDs to sample data
      const sampleDataWithUIDs = {
        ...sampleData,
        menu: {
          ...sampleData.menu,
          main: addUIDsToItems(sampleData.menu.main)
        }
      };
      
      setMenuData(sampleDataWithUIDs);
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
            _uid: item._uid, // Preserve the UID
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
            _uid: item._uid, // Preserve the UID
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

      // Try to save to temporary memory via API
      try {
        console.log(`Updating temporary menu data with ${updatedItems.length} items...`);
        
        const response = await fetch('/api/menu-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedMenuData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Temporary update successful:', result.message);
          
          // Update local state
          setMenuData(updatedMenuData);
          setEditingItem(null);
          setEditForm({});
        } else {
          const errorText = await response.text();
          console.error(`API error ${response.status}:`, errorText);
          throw new Error(`Failed to update: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        console.error('API update failed:', err);
        alert(`⚠️ Update failed: ${err.message}. Changes have been applied locally but not saved to temporary storage.`);
        
        // Update local state even if API fails
        setMenuData(updatedMenuData);
        setEditingItem(null);
        setEditForm({});
      }
    } catch (err) {
      console.error('Error updating item:', err);
      alert(`Error updating item: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Download the modified YAML file
  const downloadYaml = async () => {
    try {
      const response = await fetch('/api/download-yaml');
      
      if (response.ok) {
        const yamlContent = await response.text();
        
        // Create a blob and download link
        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'main.en.yaml';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('YAML file downloaded successfully');
      } else {
        const errorText = await response.text();
        console.error(`Download error ${response.status}:`, errorText);
        alert(`Download failed: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error downloading YAML:', err);
      alert(`Download failed: ${err.message}`);
    }
  };

  // Reset to original data from main.en.yaml
  const resetToOriginal = async () => {
    if (!confirm('Are you sure you want to reset? All temporary changes will be lost.')) {
      return;
    }

    try {
      // Clear any ongoing operations
      setEditingItem(null);
      setEditForm({});
      setResolvingDuplicates(null);
      setDuplicateResolution(null);
      
      // Call the reset API endpoint
      const response = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Reset successful:', result.message);
        
        // Reload fresh data from the original file
        await loadMenuData();
        
        // Reset expanded state to default (top-level items only)
        if (menuData && menuData.menu && menuData.menu.main) {
          const topLevelItems = menuData.menu.main.filter(item => !item.parent);
          const initialExpanded = new Set(topLevelItems.map(item => item.identifier || item.name));
          setExpandedItems(initialExpanded);
        }
        
        console.log('Reset to original data completed');
      } else {
        const errorText = await response.text();
        console.error(`Reset error ${response.status}:`, errorText);
        throw new Error(`Failed to reset: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error resetting to original data:', err);
      alert(`Error resetting: ${err.message}`);
      
      // Fallback: try to reload data anyway
      try {
        await loadMenuData();
      } catch (fallbackErr) {
        console.error('Fallback reload also failed:', fallbackErr);
      }
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
      (editingItem.name === editingItem.name && !item.identifier)
    );
    const expanded = isExpanded(item);
    
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
            {/* Expand/Collapse button */}
            {hasChildren && (
              <button
                onClick={() => toggleExpanded(item)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                title={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? '▼' : '▶'}
              </button>
            )}
            
            {/* Item icon */}
            <div className="text-gray-500">
              {item.url ? '🔗' : hasChildren ? '📁' : '📄'}
            </div>
            
            {/* Item content */}
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
            
            {/* Edit button */}
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
        
        {/* Render children if they exist AND item is expanded */}
        {hasChildren && expanded && (
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
            <p className="text-gray-600">Edit navigation menu configuration (changes are temporary until downloaded)</p>
            {(() => {
              const duplicates = getDuplicateIdentifiers();
              if (duplicates.length > 0) {
                return (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md inline-flex items-center gap-2">
                    ⚠️ {duplicates.length} duplicate identifier{duplicates.length > 1 ? 's' : ''} found
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={downloadYaml}>
              📥 Download main.en.yaml
            </Button>
            <Button variant="outline" onClick={resetToOriginal}>
              ↩️ Reset to Original
            </Button>
            <div className="text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-md">
              💡 Changes are stored in memory only
            </div>
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
          
          {/* Expand/Collapse Controls */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              📂 Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              📁 Collapse All
            </Button>
          </div>
          
          {/* Item Count */}
          <div className="text-sm text-gray-600">
            Showing {getVisibleItemCount()} of {menuData?.menu?.main?.length || 0} items
          </div>
          
          <Button>
            ➕ Add Top-Level Item
          </Button>
        </div>
      </div>

      {/* Menu Tree */}
      <div className="px-6 py-6">
        {/* Duplicate Identifier Warning - Separate Box */}
        {(() => {
          const duplicates = getDuplicateIdentifiers();
          if (duplicates.length > 0) {
            return (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="text-red-600 text-xl">⚠️</div>
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
                                "{dup.identifier}" used {dup.count} times:
                              </div>
                              <div className="text-sm text-red-700 mt-1">
                                {dup.items.map((name, nameIndex) => (
                                  <span key={nameIndex}>
                                    {nameIndex > 0 ? ', ' : ''}
                                    <span className="font-medium">{name}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startResolvingDuplicates(dup)}
                              className="ml-3 bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700"
                            >
                              🔧 Resolve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-red-600 text-sm mt-3">
                      💡 Consider giving each item a unique identifier to avoid conflicts.
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Duplicate Resolution Dialog */}
        {resolvingDuplicates && duplicateResolution && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">🔧</div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 mb-4">
                  Resolve Duplicate: "{duplicateResolution.identifier}"
                </h3>
                <p className="text-blue-700 mb-4">
                  Choose which item to keep. The other item(s) will be deleted.
                </p>
                
                <div className="space-y-3">
                  {duplicateResolution.items.map((item, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        duplicateResolution.selectedItem === index
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                      onClick={() => selectItemToKeep(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          duplicateResolution.selectedItem === index
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-gray-400'
                        }`}>
                          {duplicateResolution.selectedItem === index && '✓'}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Identifier:</span> {item.identifier}
                            {item.url && (
                              <>
                                <br />
                                <span className="font-medium">URL:</span> {item.url}
                              </>
                            )}
                            {item.weight && (
                              <>
                                <br />
                                <span className="font-medium">Weight:</span> {item.weight}
                              </>
                            )}
                            {item.parent && (
                              <>
                                <br />
                                <span className="font-medium">Parent:</span> {item.parent}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={confirmDuplicateResolution}
                    disabled={duplicateResolution.selectedItem === null}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    ✅ Confirm Resolution
                  </Button>
                  <Button variant="outline" onClick={cancelDuplicateResolution}>
                    ❌ Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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

