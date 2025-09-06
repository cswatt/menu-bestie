import { useState, useRef, useEffect } from 'react';

export const useMenuEditor = () => {
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [inlineEditingItem, setInlineEditingItem] = useState(null);
  const [inlineEditForm, setInlineEditForm] = useState({});
  const [recentlyEditedItems, setRecentlyEditedItems] = useState(new Set());
  const lastEditedItemRef = useRef(null);


  const addEditFeedback = (item) => {
    if (item._uid) {
      setRecentlyEditedItems(prev => new Set([...prev, item._uid]));
      
      setTimeout(() => {
        setRecentlyEditedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(item._uid);
          return newSet;
        });
      }, 3000);
    }
  };

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
    lastEditedItemRef.current = item;
    addEditFeedback(item);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditForm({});
    lastEditedItemRef.current = null;
  };

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

  const cancelInlineEditing = () => {
    setInlineEditingItem(null);
    setInlineEditForm({});
  };

  const clearAllEditing = () => {
    setEditingItem(null);
    setEditForm({});
    setInlineEditingItem(null);
    setInlineEditForm({});
    setIsSaving(false);
    lastEditedItemRef.current = null;
  };

  return {
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
  };
};