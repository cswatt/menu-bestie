import { useState, useEffect } from 'react';

export const useParentSuggestions = (menuData, editingItem) => {
  const [parentSuggestions, setParentSuggestions] = useState([]);
  const [showParentSuggestions, setShowParentSuggestions] = useState(false);

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

  const generateParentSuggestions = (input) => {
    if (!input || !menuData) return [];
    
    const searchTerm = input.toLowerCase();
    
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
    
    const descendants = editingItem ? getDescendants(editingItem.identifier || editingItem.name) : new Set();
    
    const suggestions = menuData.menu.main
      .filter(item => 
        item._uid !== editingItem?._uid &&
        !descendants.has(item.identifier || item.name) &&
        (item.name.toLowerCase().includes(searchTerm) || 
         (item.identifier && item.identifier.toLowerCase().includes(searchTerm)))
      )
      .slice(0, 10)
      .map(item => ({
        value: item.identifier || item.name,
        label: `${item.name} (${item.identifier || 'no-id'})`,
        displayName: item.name,
        identifier: item.identifier
      }));
    
    return suggestions;
  };

  const handleParentInputChange = (value) => {
    const suggestions = generateParentSuggestions(value);
    setParentSuggestions(suggestions);
    setShowParentSuggestions(suggestions.length > 0);
  };

  const selectParentSuggestion = (suggestion) => {
    setShowParentSuggestions(false);
    setParentSuggestions([]);
    return suggestion.value;
  };

  const showSuggestions = (currentValue) => {
    if (currentValue) {
      const suggestions = generateParentSuggestions(currentValue);
      setParentSuggestions(suggestions);
      setShowParentSuggestions(suggestions.length > 0);
    }
  };

  const hideSuggestions = () => {
    setShowParentSuggestions(false);
    setParentSuggestions([]);
  };

  const getParentOptions = () => {
    if (!menuData) return [];
    
    return menuData.menu.main
      .filter(item => item._uid !== editingItem?._uid)
      .map(item => ({
        value: item.identifier || item.name,
        label: `${item.name} (${item.identifier || 'no-id'})`
      }));
  };

  return {
    parentSuggestions,
    showParentSuggestions,
    handleParentInputChange,
    selectParentSuggestion,
    showSuggestions,
    hideSuggestions,
    getParentOptions
  };
};