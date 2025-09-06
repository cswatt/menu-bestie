import { useState } from 'react';
import * as yaml from 'js-yaml';

export const useMenuOperations = (menuData, updateMenuData) => {
  const [resolvingDuplicates, setResolvingDuplicates] = useState(null);
  const [duplicateResolution, setDuplicateResolution] = useState(null);

  const addNewItem = async (itemData) => {
    if (!itemData.name || !itemData.identifier || !menuData) {
      throw new Error('Name and identifier are required');
    }

    const newItem = {
      ...itemData,
      _uid: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    const updatedItems = [...menuData.menu.main, newItem];
    const updatedMenuData = {
      ...menuData,
      menu: { ...menuData.menu, main: updatedItems }
    };

    updateMenuData(updatedMenuData);
    return newItem;
  };

  const saveEditedItem = async (editingItem, editForm) => {
    if (!editingItem || !menuData) {
      throw new Error('No item to edit');
    }

    const updatedItems = menuData.menu.main.map(item => {
      if (item._uid === editingItem._uid) {
        return {
          ...item,
          ...editForm,
          _uid: item._uid,
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

    updateMenuData(updatedMenuData);

    // Handle duplicate resolution updates
    if (resolvingDuplicates && duplicateResolution) {
      const remainingDuplicates = updatedItems.filter(item => 
        item.identifier === duplicateResolution.identifier
      );
      
      if (remainingDuplicates.length <= 1) {
        setResolvingDuplicates(null);
        setDuplicateResolution(null);
      } else {
        setDuplicateResolution({
          identifier: duplicateResolution.identifier,
          items: remainingDuplicates
        });
      }
    }

    return updatedMenuData;
  };

  const deleteItem = async (itemToDelete) => {
    if (!menuData) {
      throw new Error('No menu data available');
    }

    const updatedItems = menuData.menu.main.filter(item => item._uid !== itemToDelete._uid);
    const updatedMenuData = {
      ...menuData,
      menu: { ...menuData.menu, main: updatedItems }
    };

    updateMenuData(updatedMenuData);

    // Handle duplicate resolution updates
    if (resolvingDuplicates && duplicateResolution) {
      const remainingDuplicates = updatedItems.filter(item => 
        item.identifier === duplicateResolution.identifier
      );
      
      if (remainingDuplicates.length <= 1) {
        setResolvingDuplicates(null);
        setDuplicateResolution(null);
      }
    }

    return updatedMenuData;
  };

  const downloadYaml = async () => {
    if (!menuData) {
      throw new Error('No menu data available to download');
    }

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

    const yamlContent = yaml.dump(dataWithoutUIDs, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false,
      defaultStringType: 'PLAIN'
    });
    
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'main.en.yaml';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getDuplicateIdentifiers = () => {
    if (!menuData) return [];
    
    const identifierCounts = {};
    
    menuData.menu.main.forEach(item => {
      const identifier = item.identifier || item.name;
      if (!identifierCounts[identifier]) {
        identifierCounts[identifier] = [];
      }
      identifierCounts[identifier].push(item);
    });
    
    return Object.entries(identifierCounts)
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
  };

  const getItemsWithoutIdentifiers = () => {
    if (!menuData) return [];
    return menuData.menu.main.filter(item => !item.identifier);
  };

  const startResolvingDuplicates = (duplicateData) => {
    setResolvingDuplicates(duplicateData);
    
    const items = menuData.menu.main.filter(item => item.identifier === duplicateData.identifier);
    setDuplicateResolution({
      identifier: duplicateData.identifier,
      items: items
    });
  };

  const cancelDuplicateResolution = () => {
    setResolvingDuplicates(null);
    setDuplicateResolution(null);
  };

  const mergeIdenticalDuplicates = async (duplicateData) => {
    if (!duplicateData.areIdentical || duplicateData.items.length !== 2) {
      throw new Error('Can only merge identical duplicates with exactly 2 items');
    }
    
    const [item1, item2] = duplicateData.items;
    const itemToDelete = item1._uid > item2._uid ? item1 : item2;
    
    return await deleteItem(itemToDelete);
  };

  const generateDiff = (item1, item2) => {
    const allFields = ['name', 'identifier', 'url', 'pre', 'parent', 'weight'];
    const diff = {};
    
    allFields.forEach(field => {
      const value1 = item1[field];
      const value2 = item2[field];
      
      diff[field] = {
        item1: value1,
        item2: value2,
        changed: value1 !== value2
      };
    });
    
    return diff;
  };

  return {
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
  };
};