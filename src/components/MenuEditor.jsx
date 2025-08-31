import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import * as yaml from 'js-yaml';

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
  
  // Track recently edited items for visual feedback
  const [recentlyEditedItems, setRecentlyEditedItems] = useState(new Set());
  
  // Add item modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadNewModal, setShowUploadNewModal] = useState(false);
  const [addItemForm, setAddItemForm] = useState({
    name: '',
    identifier: '',
    url: '',
    pre: '',
    parent: '',
    weight: 0
  });

  // Parent autocomplete state
  const [parentSuggestions, setParentSuggestions] = useState([]);
  const [showParentSuggestions, setShowParentSuggestions] = useState(false);

  // Inline edit state for items without identifiers
  const [inlineEditingItem, setInlineEditingItem] = useState(null);
  const [inlineEditForm, setInlineEditForm] = useState({});

  // Uploaded file state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [originalMenuData, setOriginalMenuData] = useState(null);

  // Track the last edited item to preserve its expanded state
  const lastEditedItemRef = useRef(null);

  // Handle clicking outside autocomplete suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showParentSuggestions && !event.target.closest('.relative')) {
        setShowParentSuggestions(false);
        setParentSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showParentSuggestions]);

  // Add visual feedback for recently edited items
  const addEditFeedback = (item) => {
    if (item._uid) {
      setRecentlyEditedItems(prev => new Set([...prev, item._uid]));
      
      // Remove the feedback after 3 seconds
      setTimeout(() => {
        setRecentlyEditedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(item._uid);
          return newSet;
        });
      }, 3000);
    }
  };

  // Add a new item to the menu
  const addNewItem = async () => {
    if (!addItemForm.name || !addItemForm.identifier || !menuData) return;

    try {
      // Generate unique UID for the new item
      const newItem = {
        ...addItemForm,
        _uid: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Add the new item to the menu data
      const updatedItems = [...menuData.menu.main, newItem];
      const updatedMenuData = {
        ...menuData,
        menu: { ...menuData.menu, main: updatedItems }
      };

      // Update local state directly (no server needed)
      setMenuData(updatedMenuData);
        
        // Expand parent if specified
        if (newItem.parent) {
          const newExpanded = new Set(expandedItems);
          
          // Find all parent items in the hierarchy and expand them
          let currentParent = newItem.parent;
          while (currentParent) {
            const parentItem = updatedItems.find(item => item.identifier === currentParent);
            if (parentItem) {
              newExpanded.add(parentItem.identifier || parentItem.name);
              currentParent = parentItem.parent;
            } else {
              break;
            }
          }
          
          setExpandedItems(newExpanded);
        }
        
        // Add visual feedback for the new item
        addEditFeedback(newItem);
        
        // Scroll to the new item's position
        setTimeout(() => {
          const newItemElement = document.querySelector(`[data-item-id="${newItem.identifier}"]`);
          if (newItemElement) {
            newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        // Close modal and reset form
        setShowAddModal(false);
        setAddItemForm({
          name: '',
          identifier: '',
          url: '',
          pre: '',
          parent: '',
          weight: 0
        });
        
        // Add visual feedback for the new item
        addEditFeedback(newItem);
        
        // Scroll to the new item's position
        setTimeout(() => {
          const newItemElement = document.querySelector(`[data-item-id="${newItem.identifier}"]`);
          if (newItemElement) {
            newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
      } catch (err) {
        alert(`Error adding item: ${err.message}`);
      }
  };

  // Preserve expanded state when menu data changes
  useEffect(() => {
    if (lastEditedItemRef.current && menuData) {
      const editingItem = lastEditedItemRef.current;
      
      // Check if the parent has changed (use editForm.parent if available, fallback to editingItem.parent)
      const currentParent = editingItem._editFormParent || editingItem.parent;
      
      if (currentParent) {
        const newExpanded = new Set();
        let currentParentIdentifier = currentParent;
        
        // Traverse up the parent hierarchy
        while (currentParentIdentifier) {
          const parentItem = menuData.menu.main.find(item => item.identifier === currentParentIdentifier);
          if (parentItem) {
            newExpanded.add(parentItem.identifier || parentItem.name);
            currentParentIdentifier = parentItem.parent;
          } else {
            break;
          }
        }
        
        // Only add the current item's identifier if it was already expanded before
        if (editingItem.identifier && expandedItems.has(editingItem.identifier)) {
          newExpanded.add(editingItem.identifier);
        }
        
        // Add any existing expanded items that aren't already included
        expandedItems.forEach(item => {
          if (!newExpanded.has(item)) {
            newExpanded.add(item);
          }
        });
        
        setExpandedItems(newExpanded);
        
        // Clear the ref after preserving state
        lastEditedItemRef.current = null;
      }
    }
  }, [menuData]); // Removed expandedItems dependency to prevent infinite loop

  // No need to load data on mount - wait for user to upload a file

  // Initialize expanded state when menu data is loaded (only on initial load)
  useEffect(() => {
    if (menuData && menuData.menu && menuData.menu.main && expandedItems.size === 0) {
      const topLevelItems = menuData.menu.main.filter(item => !item.parent);
      const initialExpanded = new Set(topLevelItems.map(item => item.identifier || item.name));
      setExpandedItems(initialExpanded);
    }
  }, [menuData, expandedItems.size]);

  // Generate unique UIDs for items
  const addUIDsToItems = (items) => {
    if (!items || !Array.isArray(items)) return items;
    
    return items.map((item, index) => ({
      ...item,
      _uid: `item_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
    }));
  };

  // Generate diff between two items
  const generateDiff = (item1, item2) => {
    const allFields = new Set([
      'name', 'identifier', 'url', 'pre', 'parent', 'weight'
    ]);
    
    const diff = {};
    
    allFields.forEach(field => {
      const value1 = item1[field];
      const value2 = item2[field];
      
      if (value1 !== value2) {
        diff[field] = {
          item1: value1,
          item2: value2,
          changed: true
        };
      } else {
        diff[field] = {
          item1: value1,
          item2: value2,
          changed: false
        };
      }
    });
    
    return diff;
  };

  // Delete a specific item by UID
  const deleteItem = async (itemToDelete) => {
    if (!confirm(`Are you sure you want to delete "${itemToDelete.name}"?`)) {
      return;
    }

    try {
      // Remove the specific item by UID
      const updatedItems = menuData.menu.main.filter(item => item._uid !== itemToDelete._uid);
      
      const updatedMenuData = {
        ...menuData,
        menu: { ...menuData.menu, main: updatedItems }
      };

      // Update local state directly (no server needed)
      setMenuData(updatedMenuData);
      
      // If we were resolving duplicates, check if this resolves the issue
      if (resolvingDuplicates && duplicateResolution) {
        const remainingDuplicates = updatedItems.filter(item => 
          item.identifier === duplicateResolution.identifier
        );
        
        if (remainingDuplicates.length <= 1) {
          // Duplicate resolved, close the resolution interface
          setResolvingDuplicates(null);
          setDuplicateResolution(null);
        }
      }
    } catch (err) {
      alert(`Error deleting item: ${err.message}`);
    }
  };

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
    
    // Get the actual items for comparison by identifier (since we're resolving duplicates)
    const items = menuData.menu.main.filter(item => item.identifier === duplicateData.identifier);
    setDuplicateResolution({
      identifier: duplicateData.identifier,
      items: items
    });
    
    // Clear any ongoing editing to prevent conflicts
    setEditingItem(null);
    setEditForm({});
  };

  // Cancel duplicate resolution
  const cancelDuplicateResolution = () => {
    setResolvingDuplicates(null);
    setDuplicateResolution(null);
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

  // Get duplicate identifiers
  const getDuplicateIdentifiers = () => {
    const identifierCounts = {};
    
    menuData.menu.main.forEach(item => {
      const identifier = item.identifier || item.name;
      if (!identifierCounts[identifier]) {
        identifierCounts[identifier] = [];
      }
      identifierCounts[identifier].push(item);
    });
    
    const duplicates = Object.entries(identifierCounts)
      .filter(([identifier, items]) => items.length > 1)
      .map(([identifier, items]) => ({
        identifier,
        count: items.length,
        items,
        areIdentical: items.every(item => 
          items[0].name === item.name &&
          items[0].url === item.url &&
          items[0].pre === item.pre &&
          items[0].parent === item.parent &&
          items[0].weight === item.weight
        )
      }));
    
    return duplicates;
  };

  // Get items without identifiers
  const getItemsWithoutIdentifiers = () => {
    if (!menuData) return [];
    
    return menuData.menu.main.filter(item => !item.identifier);
  };

  // Merge identical duplicates by deleting the item with higher UID
  const mergeIdenticalDuplicates = async (duplicateData) => {
    if (!duplicateData.areIdentical || duplicateData.items.length !== 2) return;
    
    const [item1, item2] = duplicateData.items;
    const itemToDelete = item1._uid > item2._uid ? item1 : item2;
    const itemToKeep = item1._uid > item2._uid ? item2 : item1;
    
    if (!confirm(`Merge identical items? "${itemToDelete.name}" will be deleted, keeping "${itemToKeep.name}".`)) {
      return;
    }

    try {
      // Remove the item with higher UID
      const updatedItems = menuData.menu.main.filter(item => item._uid !== itemToDelete._uid);
      
      const updatedMenuData = {
        ...menuData,
        menu: { ...menuData.menu, main: updatedItems }
      };

      // Update local state directly (no server needed)
      setMenuData(updatedMenuData);
    } catch (err) {
      alert(`Error merging duplicates: ${err.message}`);
    }
  };

  // Load menu data from API or use sample data
  const loadMenuData = async () => {
    // Don't automatically load data - wait for user to upload a file
  };

  // Handle file upload for new file (resets application state)
  const handleNewFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.yaml') || file.name.endsWith('.yml'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const yamlContent = e.target.result;
          const data = yaml.load(yamlContent);
          
          // Check if the data has the expected structure
          if (!data || typeof data !== 'object' || !data.menu || !Array.isArray(data.menu.main)) {
            alert('Invalid YAML file structure. Expected format: { menu: { main: [...] } }');
            return;
          }
          
          // Add UIDs to the menu items
          const itemsWithUIDs = addUIDsToItems(data.menu.main);
          
          // Create the final data structure with UIDs
          const dataWithUIDs = {
            ...data,
            menu: {
              ...data.menu,
              main: itemsWithUIDs
            }
          };
          
          // Reset all application state
          setEditingItem(null);
          setEditForm({});
          setResolvingDuplicates(null);
          setDuplicateResolution(null);
          setSearchTerm('');
          setIsSaving(false);
          setExpandedItems(new Set());
          setShowAddModal(false);
          setShowUploadNewModal(false);
          
          // Set new data
          setMenuData(dataWithUIDs);
          setOriginalMenuData(dataWithUIDs);
          setUploadedFile(file);
          
          // Expand top-level items by default
          const topLevelItems = dataWithUIDs.menu.main.filter(item => !item.parent);
          const initialExpanded = new Set(topLevelItems.map(item => item.identifier || item.name));
          setExpandedItems(initialExpanded);
          
        } catch (err) {
          alert('Error parsing YAML file. Please ensure it\'s a valid YAML file.');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid YAML file (.yaml or .yml)');
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.yaml') || file.name.endsWith('.yml'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const yamlContent = e.target.result;
          const data = yaml.load(yamlContent);
          
          // Check if the data has the expected structure
          if (!data || typeof data !== 'object' || !data.menu || !Array.isArray(data.menu.main)) {
            alert('Invalid YAML file structure. Expected format: { menu: { main: [...] } }');
            return;
          }
          
          // Add UIDs to the menu items
          const itemsWithUIDs = addUIDsToItems(data.menu.main);
          
          // Create the final data structure with UIDs
          const dataWithUIDs = {
            ...data,
            menu: {
              ...data.menu,
              main: itemsWithUIDs
            }
          };
          
          setMenuData(dataWithUIDs);
          setOriginalMenuData(dataWithUIDs);
          setUploadedFile(file);
        } catch (err) {
          alert('Error parsing YAML file. Please ensure it\'s a valid YAML file.');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid YAML file (.yaml or .yml)');
    }
  };

  // Reset to uploaded file
  const resetToUploadedFile = () => {
    if (originalMenuData) {
      setMenuData(originalMenuData);
      setEditingItem(null);
      setEditForm({});
      setResolvingDuplicates(null);
      setDuplicateResolution(null);
      setSearchTerm('');
      setIsSaving(false);
      setExpandedItems(new Set());
    }
  };

  // Build hierarchical structure from flat list
  const buildHierarchy = (items) => {
    if (!items || !Array.isArray(items)) return [];
    
    // Create a map of all items by UID (unique identifier)
    const itemMap = new Map();
    const rootItems = [];
    const processedUIDs = new Set(); // Track processed items to prevent duplicates
    
    // First pass: create item objects with empty children arrays
    items.forEach(item => {
      if (!item._uid) {
        return;
      }
      
      if (processedUIDs.has(item._uid)) {
        return;
      }
      
      const itemWithChildren = { ...item, children: [] };
      itemMap.set(item._uid, itemWithChildren);
      processedUIDs.add(item._uid);
    });
    
    // Second pass: build parent-child relationships
    items.forEach(item => {
      if (!item._uid || !itemMap.has(item._uid)) return;
      
      const currentItem = itemMap.get(item._uid);
      
      if (item.parent) {
        // Find parent by identifier, but use UID for the actual relationship
        const parentItem = items.find(p => p.identifier === item.parent);
        
        if (parentItem && itemMap.has(parentItem._uid) && parentItem._uid !== item._uid) {
          // This item has a parent, add it to parent's children
          const parent = itemMap.get(parentItem._uid);
          if (!parent.children) parent.children = [];
          
          // Check if this child is already added to prevent duplicates
          const childExists = parent.children.some(child => child._uid === currentItem._uid);
          if (!childExists) {
            parent.children.push(currentItem);
          }
        } else {
          // Parent not found or would create circular reference, treat as root item
          rootItems.push(currentItem);
        }
      } else {
        // This is a root item
        rootItems.push(currentItem);
      }
    });
    
    // Sort function to sort by weight
    const sortByWeight = (itemsToSort) => {
      if (!itemsToSort || !Array.isArray(itemsToSort)) return;
      
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
  
  // Helper function to count total items in hierarchy
  const countItemsInHierarchy = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    
    let count = 0;
    items.forEach(item => {
      count++;
      if (item.children && item.children.length > 0) {
        count += countItemsInHierarchy(item.children);
      }
    });
    return count;
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
    lastEditedItemRef.current = item; // Set the ref to the item being edited
    addEditFeedback(item); // Add visual feedback
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingItem(null);
    setEditForm({});
    lastEditedItemRef.current = null; // Clear the ref
  };

  // Save the edited item
  const saveEditedItem = async () => {
    if (!editingItem || !menuData) return;

    try {
      setIsSaving(true);
      
      // Find the item in the flat list and update it by UID (unique identifier)
      const updatedItems = menuData.menu.main.map(item => {
        if (item._uid === editingItem._uid) {
          // Match by UID (most reliable, handles duplicate identifiers)
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

      // Update local state directly (no server needed)
      setMenuData(updatedMenuData);
      
      // Set the ref so useEffect can preserve expanded state
      lastEditedItemRef.current = {
        ...editingItem,
        _editFormParent: editForm.parent // Store the new parent value
      };
      
      // Add visual feedback for the edited item
      addEditFeedback(editingItem);
      
      // Scroll to the parent of the edited item if it has one
      if (editForm.parent) {
        // Ensure parent is expanded before scrolling
        const newExpanded = new Set(expandedItems);
        newExpanded.add(editForm.parent);
        setExpandedItems(newExpanded);
        
        setTimeout(() => {
          const parentElement = document.querySelector(`[data-item-id="${editForm.parent}"]`);
          if (parentElement) {
            parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      
      // Clear editing state
      setEditingItem(null);
      setEditForm({});
      
      // If we were resolving duplicates, refresh the duplicate data
      if (resolvingDuplicates && duplicateResolution) {
        // Check if the duplicate is still valid after the edit
        const remainingDuplicates = updatedItems.filter(item => 
          item.identifier === duplicateResolution.identifier
        );
        
        if (remainingDuplicates.length <= 1) {
          // Duplicate resolved, close the resolution interface
          setResolvingDuplicates(null);
          setDuplicateResolution(null);
        } else {
          // Update the duplicate resolution data with the new item data
          setDuplicateResolution({
            identifier: duplicateResolution.identifier,
            items: remainingDuplicates
          });
        }
      }
    } catch (err) {
      alert(`Error updating item: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Download the modified YAML file
  const downloadYaml = async () => {
    try {
      if (!menuData) {
        alert('No menu data available to download');
        return;
      }

      // Strip UIDs from the data before converting to YAML (same logic as server)
      const stripUIDsFromItems = (items) => {
        if (!items || !Array.isArray(items)) return items;
        return items.map(item => {
          const { _uid, ...itemWithoutUID } = item;
          if (item.children && item.children.length > 0) {
            itemWithoutUID.children = stripUIDsFromItems(item.children);
          }
          return itemWithoutUID;
        });
      };

      const dataWithoutUIDs = {
        ...menuData,
        menu: {
          ...menuData.menu,
          main: stripUIDsFromItems(menuData.menu.main)
        }
      };

      // Generate YAML content using js-yaml
      const yamlContent = yaml.dump(dataWithoutUIDs, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        quotingType: '"',
        forceQuotes: false,
        defaultStringType: 'PLAIN'
      });
      
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
      
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  // Reset to original data from main.en.yaml
  const resetToOriginal = async () => {
    if (!confirm('Are you sure you want to reset? All temporary changes will be lost.')) {
      return;
    }

    try {
      // Clear ALL frontend state comprehensively
      setEditingItem(null);
      setEditForm({});
      setResolvingDuplicates(null);
      setDuplicateResolution(null);
      setSearchTerm(''); // Clear search term
      setIsSaving(false); // Clear saving state
      
      // Reset to original uploaded file data (no server needed)
      if (originalMenuData) {
        setMenuData(originalMenuData);
        
        // Reset expanded state to default (top-level items only)
        const topLevelItems = originalMenuData.menu.main.filter(item => !item.parent);
        const initialExpanded = new Set(topLevelItems.map(item => item.identifier || item.name));
        setExpandedItems(initialExpanded);
      } else {
        alert('No original data available to reset to. Please upload a file first.');
      }
    } catch (err) {
      alert(`Error resetting: ${err.message}`);
    }
  };

  // Get parent options for dropdown (filtered to exclude current item)
  const getParentOptions = () => {
    return menuData.menu.main
      .filter(item => item._uid !== editingItem?._uid) // Changed to _uid filtering
      .map(item => ({
        value: item.identifier || item.name,
        label: `${item.name} (${item.identifier || 'no-id'})`
      }));
  };

  // Generate parent suggestions for autocomplete
  const generateParentSuggestions = (input) => {
    if (!input || !menuData) return [];
    
    const searchTerm = input.toLowerCase();
    
    // Get all descendants of the current item being edited
    const getDescendants = (itemId) => {
      const descendants = new Set();
      const queue = [itemId];
      
      while (queue.length > 0) {
        const currentId = queue.shift();
        const children = menuData.menu.main.filter(item => item.parent === currentId);
        
        children.forEach(child => {
          descendants.add(child.identifier || child.name);
          queue.push(child.identifier || child.name);
        });
      }
      
      return descendants;
    };
    
    // Get descendants if we're editing an item
    const descendants = editingItem ? getDescendants(editingItem.identifier || editingItem.name) : new Set();
    
    const suggestions = menuData.menu.main
      .filter(item => 
        item._uid !== editingItem?._uid && // Exclude current item
        !descendants.has(item.identifier || item.name) && // Exclude all descendants
        (item.name.toLowerCase().includes(searchTerm) || 
         (item.identifier && item.identifier.toLowerCase().includes(searchTerm)))
      )
      .slice(0, 10) // Limit to 10 suggestions
      .map(item => ({
        value: item.identifier || item.name,
        label: `${item.name} (${item.identifier || 'no-id'})`,
        displayName: item.name,
        identifier: item.identifier
      }));
    
    return suggestions;
  };

  // Handle parent input change for autocomplete
  const handleParentInputChange = (value, isEditForm = true) => {
    const suggestions = generateParentSuggestions(value);
    setParentSuggestions(suggestions);
    setShowParentSuggestions(suggestions.length > 0);
    
    // Update the appropriate form
    if (isEditForm) {
      setEditForm(prev => ({ ...prev, parent: value }));
    } else {
      setAddItemForm(prev => ({ ...prev, parent: value }));
    }
  };

  // Select a parent suggestion
  const selectParentSuggestion = (suggestion, isEditForm = true) => {
    if (isEditForm) {
      setEditForm(prev => ({ ...prev, parent: suggestion.value }));
    } else {
      setAddItemForm(prev => ({ ...prev, parent: suggestion.value }));
    }
    setShowParentSuggestions(false);
    setParentSuggestions([]);
  };

  // Start inline editing for items without identifiers
  const startInlineEditing = (item) => {
    setInlineEditingItem(item);
    setInlineEditForm({
      name: item.name || '',
      identifier: item.identifier || '',
      url: item.url || '',
      pre: item.pre || '',
      parent: item.parent || '',
      weight: item.weight || 0
    });
  };

  // Cancel inline editing
  const cancelInlineEditing = () => {
    setInlineEditingItem(null);
    setInlineEditForm({});
  };

  // Save inline edited item
  const saveInlineEditedItem = async () => {
    if (!inlineEditingItem || !menuData) return;

    try {
      // Find the item in the flat list and update it by UID
      const updatedItems = menuData.menu.main.map(item => {
        if (item._uid === inlineEditingItem._uid) {
          return {
            ...item,
            ...inlineEditForm,
            _uid: item._uid, // Preserve the UID
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

      // Update local state directly (no server needed)
      setMenuData(updatedMenuData);
      
      // Clear inline editing state
      setInlineEditingItem(null);
      setInlineEditForm({});
      
      // Add visual feedback for the edited item
      addEditFeedback(inlineEditingItem);
    } catch (err) {
      alert(`Error saving item: ${err.message}`);
    }
  };

  // Render a single menu item with proper indentation
  const renderMenuItem = (item, level = 0) => {
    const indent = level * 24; // Increased indentation for better visual hierarchy
    const hasChildren = item.children && item.children.length > 0;
    const isEditing = editingItem && editingItem._uid === item._uid;
    const expanded = isExpanded(item);
    
    // Don't show edit form in main menu if we're editing within duplicate resolution
    const shouldShowEditForm = isEditing && !resolvingDuplicates;
    
    return (
      <div key={item.identifier || item.name} style={{ marginLeft: `${indent}px` }} data-item-id={item.identifier || item.name}>
        {shouldShowEditForm ? (
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
                <div className="relative">
                  <Input
                    value={editForm.parent || ''}
                    onChange={(e) => handleParentInputChange(e.target.value, true)}
                    onFocus={() => {
                      if (editForm.parent) {
                        const suggestions = generateParentSuggestions(editForm.parent);
                        setParentSuggestions(suggestions);
                        setShowParentSuggestions(suggestions.length > 0);
                      }
                    }}
                    placeholder="Start typing to search for parent..."
                    className="w-full"
                  />
                  {showParentSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {parentSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => selectParentSuggestion(suggestion, true)}
                        >
                          <div className="font-medium text-gray-900">{suggestion.displayName}</div>
                          <div className="text-sm text-gray-500">{suggestion.identifier || 'no-id'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                size="sm"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={cancelEditing} size="sm">
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => deleteItem(item)} 
                size="sm"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>
        ) : (
          // Display mode
          <div className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-md transition-all duration-300 border-l-2 ${
            recentlyEditedItems.has(item._uid) 
              ? 'bg-purple-100 border-purple-400 shadow-sm' 
              : 'border-gray-200'
          }`}>
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
            
            {/* Item content - left side */}
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
              {/* {item.parent && (
                <span className="ml-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                  parent: {item.parent}
                </span>
              )} */}
            </div>
            
            {/* Right side - weight and edit button */}
            <div className="flex items-center gap-2">
              {item.weight && (
                <span className={`text-xs px-2 py-1 rounded ${
                  // Check if this item has the same parent and weight as another item
                  (() => {
                    if (!item.parent || !item.weight) return 'text-gray-500 bg-gray-100';
                    
                    const conflictingItems = menuData.menu.main.filter(otherItem => 
                      otherItem._uid !== item._uid && 
                      otherItem.parent === item.parent && 
                      otherItem.weight === item.weight
                    );
                    
                    return conflictingItems.length > 0 
                      ? 'text-red-600 bg-red-100' 
                      : 'text-gray-500 bg-gray-100';
                  })()
                }`}>
                  w: {item.weight}
                </span>
              )}
              
              {/* Edit button - only show if not in duplicate resolution */}
              {!resolvingDuplicates && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => startEditing(item)}
                  className="text-xs"
                >
                  Edit
                </Button>
              )}
            </div>
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
    // File upload interface
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
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
            <p className="text-gray-600">Edit navigation menu configuration.</p>
            {(() => {
              const duplicates = getDuplicateIdentifiers();
              if (duplicates.length > 0) {
                return (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md inline-flex items-center gap-2">
                    Identifier errors found: {duplicates.length} duplicate{duplicates.length !== 1 ? 's' : ''}, {getItemsWithoutIdentifiers().length} missing
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <div className="flex items-center gap-3">
            {menuData && (
              <>
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
                  onClick={resetToUploadedFile}
                  variant="outline"
                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Reset changes
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main menu interface */}
      <>
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            {/* Expand/Collapse Controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
            
            {/* Item Count */}
            <div className="text-sm text-gray-600">
              Showing {getVisibleItemCount()} of {menuData?.menu?.main?.length || 0} items
            </div>
            
            <Button onClick={() => setShowAddModal(true)}>
              Add Item
            </Button>
          </div>
        </div>

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-8 border w-96 shadow-lg rounded-md bg-white">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Menu Item</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <Input
                      value={addItemForm.name}
                      onChange={(e) => setAddItemForm({...addItemForm, name: e.target.value})}
                      placeholder="Item name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Identifier</label>
                    <Input
                      value={addItemForm.identifier}
                      onChange={(e) => setAddItemForm({...addItemForm, identifier: e.target.value})}
                      placeholder="Unique identifier"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                    <Input
                      value={addItemForm.url || ''}
                      onChange={(e) => setAddItemForm({...addItemForm, url: e.target.value})}
                      placeholder="URL path (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <Input
                      value={addItemForm.pre || ''}
                      onChange={(e) => setAddItemForm({...addItemForm, pre: e.target.value})}
                      placeholder="Icon name (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
                    <div className="relative">
                      <Input
                        value={addItemForm.parent || ''}
                        onChange={(e) => handleParentInputChange(e.target.value, false)}
                        onFocus={() => {
                          if (addItemForm.parent) {
                            const suggestions = generateParentSuggestions(addItemForm.parent);
                            setParentSuggestions(suggestions);
                            setShowParentSuggestions(suggestions.length > 0);
                          }
                        }}
                        placeholder="Start typing to search for parent..."
                        className="w-full"
                      />
                      {showParentSuggestions && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {parentSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => selectParentSuggestion(suggestion, false)}
                            >
                              <div className="font-medium text-gray-900">{suggestion.displayName}</div>
                              <div className="text-sm text-gray-500">{suggestion.identifier || 'no-id'}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                    <Input
                      type="number"
                      value={addItemForm.weight}
                      onChange={(e) => setAddItemForm({...addItemForm, weight: parseInt(e.target.value) || 0})}
                      placeholder="Sort weight"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={addNewItem} disabled={isSaving}>
                    {isSaving ? 'Adding...' : 'Add Item'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload New Modal */}
        {showUploadNewModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-8 border w-96 shadow-lg rounded-md bg-white">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Menu File</h3>
                <p className="text-gray-600 mb-4">
                  This will replace the current menu with a new file. All unsaved changes will be lost.
                </p>
                <div className="mb-4">
                  <label htmlFor="upload-new-file" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                      <div className="text-gray-600">
                        <div className="text-lg font-medium mb-2">Choose a new file</div>
                        <div className="text-sm">or drag and drop</div>
                        <div className="text-xs text-gray-500 mt-1">YAML files only</div>
                      </div>
                    </div>
                  </label>
                  <input
                    id="upload-new-file"
                    type="file"
                    accept=".yaml,.yml"
                    onChange={handleNewFileUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setShowUploadNewModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items Without Identifiers Warning */}
        {(() => {
          const itemsWithoutIdentifiers = getItemsWithoutIdentifiers();
          if (itemsWithoutIdentifiers.length > 0) {
            return (
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
                      {itemsWithoutIdentifiers.map((item, index) => (
                        <div key={item._uid} className="bg-yellow-100 p-3 rounded border border-yellow-300">
                          {inlineEditingItem && inlineEditingItem._uid === item._uid ? (
                            // Inline edit form
                            <div className="bg-white p-4 rounded border border-yellow-400">
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                  <Input
                                    value={inlineEditForm.name}
                                    onChange={(e) => setInlineEditForm({...inlineEditForm, name: e.target.value})}
                                    placeholder="Item name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Identifier</label>
                                  <Input
                                    value={inlineEditForm.identifier}
                                    onChange={(e) => setInlineEditForm({...inlineEditForm, identifier: e.target.value})}
                                    placeholder="Unique identifier"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                                  <Input
                                    value={inlineEditForm.url || ''}
                                    onChange={(e) => setInlineEditForm({...inlineEditForm, url: e.target.value})}
                                    placeholder="URL path (optional)"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                                  <Input
                                    value={inlineEditForm.pre || ''}
                                    onChange={(e) => setInlineEditForm({...inlineEditForm, pre: e.target.value})}
                                    placeholder="Icon name (optional)"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
                                  <div className="relative">
                                    <Input
                                      value={inlineEditForm.parent || ''}
                                      onChange={(e) => handleParentInputChange(e.target.value, true)}
                                      onFocus={() => {
                                        if (inlineEditForm.parent) {
                                          const suggestions = generateParentSuggestions(inlineEditForm.parent);
                                          setParentSuggestions(suggestions);
                                          setShowParentSuggestions(suggestions.length > 0);
                                        }
                                      }}
                                      placeholder="Start typing to search for parent..."
                                      className="w-full"
                                    />
                                    {showParentSuggestions && (
                                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {parentSuggestions.map((suggestion, index) => (
                                          <div
                                            key={index}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                            onClick={() => {
                                              setInlineEditForm(prev => ({ ...prev, parent: suggestion.value }));
                                              setShowParentSuggestions(false);
                                              setParentSuggestions([]);
                                            }}
                                          >
                                            <div className="font-medium text-gray-900">{suggestion.displayName}</div>
                                            <div className="text-sm text-gray-500">{suggestion.identifier || 'no-id'}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                                  <Input
                                    type="number"
                                    value={inlineEditForm.weight}
                                    onChange={(e) => setInlineEditForm({...inlineEditForm, weight: parseInt(e.target.value) || 0})}
                                    placeholder="Sort weight"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={saveInlineEditedItem} 
                                  className="bg-yellow-600 hover:bg-yellow-700"
                                  size="sm"
                                >
                                  Save
                                </Button>
                                <Button variant="outline" onClick={cancelInlineEditing} size="sm">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // Display mode
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-yellow-800">
                                  {item.name}
                                </div>
                                <div className="text-sm text-yellow-700 mt-1">
                                  {item.url && <span className="mr-3">URL: {item.url}</span>}
                                  {item.weight && <span className="mr-3">Weight: {item.weight}</span>}
                                  {item.parent && <span>Parent: {item.parent}</span>}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startInlineEditing(item)}
                                  className="text-xs bg-yellow-600 text-white border-yellow-600 hover:bg-yellow-700 hover:border-yellow-700"
                                >
                                  Edit
                                </Button>
                              </div>
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
            );
          }
          return null;
        })()}

        {/* Duplicate Identifier Warning - Separate Box */}
        {(() => {
          const duplicates = getDuplicateIdentifiers();
          if (duplicates.length > 0) {
            return (
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
                              <div className="text-sm text-red-700 mt-1">
                               
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {dup.areIdentical ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => mergeIdenticalDuplicates(dup)}
                                  className="bg-red-600 text-white border-green-600 hover:bg-red-700 hover:border-green-700"
                                >
                                  Merge
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startResolvingDuplicates(dup)}
                                  className="ml-3 bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-green-700"
                                >
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {/* Expanded resolution interface */}
                          {resolvingDuplicates && resolvingDuplicates.identifier === dup.identifier && duplicateResolution && (
                            <div className="mt-4 p-4 bg-white rounded border border-red-200">
                              <div className="mb-4">
                                <h4 className="font-semibold text-red-800 mb-2">
                                  Duplicate Items Comparison
                                </h4>
                                <p className="text-red-700 text-sm">
                                  Review the differences and edit or delete items as needed.
                                </p>
                              </div>
                              
                              {/* Individual Item Actions */}
                              <div className="space-y-3">
                                {duplicateResolution.items.map((item, itemIndex) => (
                                  <div 
                                    key={item._uid} 
                                    className="p-3 rounded-lg border border-gray-200 bg-gray-50"
                                  >
                                    {/* Show edit form if this item is being edited */}
                                    {editingItem && editingItem._uid === item._uid ? (
                                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
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
                                            size="sm"
                                          >
                                            {isSaving ? 'Saving...' : 'Save'}
                                          </Button>
                                          <Button variant="outline" onClick={cancelEditing} size="sm">
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      /* Show normal item display if not editing */
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
                                              className="text-xs bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700"
                                            >
                                              Edit
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => deleteItem(item)}
                                              className="text-xs bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700"
                                            >
                                              Delete
                                            </Button>
                                          </div>
                                        </div>
                                        
                                        <div className="text-sm text-gray-600 space-y-1">
                                          {(() => {
                                            if (duplicateResolution.items.length === 2) {
                                              const otherItem = duplicateResolution.items[1 - itemIndex];
                                              const diff = generateDiff(item, otherItem);
                                              
                                              return Object.entries(diff).map(([field, values]) => (
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
                                              ));
                                            } else {
                                              // Fallback for more than 2 items
                                              return (
                                                <>
                                                  <div><span className="font-medium">Identifier:</span> {item.identifier}</div>
                                                  {item.url && <div><span className="font-medium">URL:</span> {item.url}</div>}
                                                  {item.weight && <div><span className="font-medium">Weight:</span> {item.weight}</div>}
                                                  {item.parent && <div><span className="font-medium">Parent:</span> {item.parent}</div>}
                                                </>
                                              );
                                            }
                                          })()}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex gap-3 mt-4">
                                <Button 
                                  variant="outline" 
                                  onClick={cancelDuplicateResolution}
                                  size="sm"
                                >
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
            );
          }
          return null;
        })()}

        {/* Remove the separate blue resolution dialog */}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Structure</h2>
          
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No items match your search criteria.' : 'No menu items found.'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <div key={item.identifier || item.name} data-item-id={item.identifier || item.name}>
                  {renderMenuItem(item)}
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    </div>
  );
};

export default MenuEditor;

