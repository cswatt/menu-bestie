import { useState, useEffect } from 'react';
import { buildHierarchy } from '../utils/menuUtils';

export const useMenuNavigation = (menuData) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize expanded state when menu data is loaded
  useEffect(() => {
    if (menuData && menuData.menu && menuData.menu.main && expandedItems.size === 0) {
      const topLevelItems = menuData.menu.main.filter(item => !item.parent);
      const initialExpanded = new Set(topLevelItems.map(item => item.identifier || item.name));
      setExpandedItems(initialExpanded);
    }
  }, [menuData, expandedItems.size]);

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

  const isExpanded = (item) => {
    const itemKey = item.identifier || item.name;
    return expandedItems.has(itemKey);
  };

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
    
    // Use the hierarchical data structure
    const hierarchicalItems = buildHierarchy(menuData.menu.main);
    addItemKeys(hierarchicalItems);
    setExpandedItems(allItemKeys);
  };

  const collapseAll = () => {
    if (!menuData) return;
    
    // Use the hierarchical data structure to get top-level items
    const hierarchicalItems = buildHierarchy(menuData.menu.main);
    const topLevelKeys = new Set(hierarchicalItems.map(item => item.identifier || item.name));
    setExpandedItems(topLevelKeys);
  };

  const resetExpanded = () => {
    setExpandedItems(new Set());
  };

  const ensureParentExpanded = (parentId) => {
    if (parentId) {
      const newExpanded = new Set(expandedItems);
      newExpanded.add(parentId);
      setExpandedItems(newExpanded);
    }
  };

  const preserveExpandedState = (lastEditedItem) => {
    if (lastEditedItem && menuData) {
      const currentParent = lastEditedItem._editFormParent || lastEditedItem.parent;
      
      if (currentParent) {
        const newExpanded = new Set();
        let currentParentIdentifier = currentParent;
        
        while (currentParentIdentifier) {
          const parentItem = menuData.menu.main.find(item => item.identifier === currentParentIdentifier);
          if (parentItem) {
            newExpanded.add(parentItem.identifier || parentItem.name);
            currentParentIdentifier = parentItem.parent;
          } else {
            break;
          }
        }
        
        if (lastEditedItem.identifier && expandedItems.has(lastEditedItem.identifier)) {
          newExpanded.add(lastEditedItem.identifier);
        }
        
        expandedItems.forEach(item => {
          if (!newExpanded.has(item)) {
            newExpanded.add(item);
          }
        });
        
        setExpandedItems(newExpanded);
      }
    }
  };

  return {
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
  };
};