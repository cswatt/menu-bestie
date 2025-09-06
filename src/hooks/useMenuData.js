import { useState, useEffect } from 'react';
import * as yaml from 'js-yaml';

export const useMenuData = () => {
  const [menuData, setMenuData] = useState(null);
  const [originalMenuData, setOriginalMenuData] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const addUIDsToItems = (items) => {
    if (!items || !Array.isArray(items)) return items;
    
    return items.map((item, index) => ({
      ...item,
      _uid: item._uid || `item_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
    }));
  };

  const loadFromFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const yamlContent = e.target.result;
          const data = yaml.load(yamlContent);
          
          if (!data || typeof data !== 'object' || !data.menu || !Array.isArray(data.menu.main)) {
            reject(new Error('Invalid YAML file structure. Expected format: { menu: { main: [...] } }'));
            return;
          }
          
          const itemsWithUIDs = addUIDsToItems(data.menu.main);
          const dataWithUIDs = {
            ...data,
            menu: {
              ...data.menu,
              main: itemsWithUIDs
            }
          };
          
          resolve(dataWithUIDs);
        } catch (err) {
          reject(new Error('Error parsing YAML file. Please ensure it\'s a valid YAML file.'));
        }
      };
      reader.readAsText(file);
    });
  };

  const updateMenuData = (newData) => {
    setMenuData(newData);
  };

  const resetToOriginal = () => {
    if (originalMenuData) {
      setMenuData(originalMenuData);
      return true;
    }
    return false;
  };

  const setInitialData = (data, file) => {
    setMenuData(data);
    setOriginalMenuData(data);
    setUploadedFile(file);
  };

  const clearData = () => {
    setMenuData(null);
    setOriginalMenuData(null);
    setUploadedFile(null);
  };

  return {
    menuData,
    originalMenuData,
    uploadedFile,
    loadFromFile,
    updateMenuData,
    resetToOriginal,
    setInitialData,
    clearData
  };
};