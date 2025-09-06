// Build hierarchical structure from flat list
export const buildHierarchy = (items) => {
  if (!items || !Array.isArray(items)) return [];
  
  const itemMap = new Map();
  const rootItems = [];
  const processedUIDs = new Set();
  
  // First pass: create item objects with empty children arrays
  items.forEach(item => {
    if (!item._uid || processedUIDs.has(item._uid)) return;
    
    const itemWithChildren = { ...item, children: [] };
    itemMap.set(item._uid, itemWithChildren);
    processedUIDs.add(item._uid);
  });
  
  // Second pass: build parent-child relationships
  items.forEach(item => {
    if (!item._uid || !itemMap.has(item._uid)) return;
    
    const currentItem = itemMap.get(item._uid);
    
    if (item.parent) {
      const parentItem = items.find(p => p.identifier === item.parent);
      
      if (parentItem && itemMap.has(parentItem._uid) && parentItem._uid !== item._uid) {
        const parent = itemMap.get(parentItem._uid);
        if (!parent.children) parent.children = [];
        
        const childExists = parent.children.some(child => child._uid === currentItem._uid);
        if (!childExists) {
          parent.children.push(currentItem);
        }
      } else {
        rootItems.push(currentItem);
      }
    } else {
      rootItems.push(currentItem);
    }
  });
  
  // Sort function to sort by weight
  const sortByWeight = (itemsToSort) => {
    if (!itemsToSort || !Array.isArray(itemsToSort)) return;
    
    itemsToSort.sort((a, b) => (a.weight || 0) - (b.weight || 0));
    
    itemsToSort.forEach(item => {
      if (item.children && item.children.length > 0) {
        sortByWeight(item.children);
      }
    });
  };
  
  sortByWeight(rootItems);
  return rootItems;
};

// Filter items based on search term
export const filterItems = (items, searchTerm) => {
  if (!searchTerm) return items;
  
  const searchLower = searchTerm.toLowerCase();
  
  return items.filter(item => {
    const itemMatches = (
      item.name?.toLowerCase().includes(searchLower) ||
      item.identifier?.toLowerCase().includes(searchLower) ||
      item.url?.toLowerCase().includes(searchLower)
    );
    
    const childrenMatch = item.children && item.children.length > 0 && 
      filterItems(item.children, searchTerm).length > 0;
    
    return itemMatches || childrenMatch;
  }).map(item => {
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: filterItems(item.children, searchTerm)
      };
    }
    return item;
  });
};

// Count total items in hierarchy
export const countItemsInHierarchy = (items) => {
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

// Get the count of visible items (expanded items only)
export const getVisibleItemCount = (items, expandedItems, isExpanded) => {
  if (!items) return 0;
  
  let count = 0;
  const countVisible = (itemList) => {
    itemList.forEach(item => {
      count++;
      if (item.children && item.children.length > 0 && isExpanded(item)) {
        countVisible(item.children);
      }
    });
  };
  
  countVisible(items);
  return count;
};