// Shared mock implementations for MenuEditor tests
// This file centralizes all the mocks used across different MenuEditor test files

// Mock js-yaml
export const mockJsYaml = {
  load: jest.fn(),
  dump: jest.fn()
};

// Mock UI components
export const mockUIComponents = {
  Button: function MockButton({ children, onClick, ...props }) {
    return (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    );
  },
  Input: function MockInput({ value, onChange, ...props }) {
    return (
      <input value={value} onChange={onChange} {...props} />
    );
  }
};

// Mock component modules
export const mockComponents = {
  FileUploadModal: function MockFileUploadModal({ show, children }) {
    if (!show) return null;
    return <div data-testid="file-upload-modal">{children}</div>;
  },
  AddItemModal: function MockAddItemModal({ show, children }) {
    if (!show) return null;
    return <div data-testid="add-item-modal">{children}</div>;
  },
  MenuItem: function MockMenuItem({ item }) {
    return <div data-testid="menu-item">{item.name}</div>;
  },
  MenuItemForm: function MockMenuItemForm() {
    return <form data-testid="menu-item-form">Mock Form</form>;
  }
};

// Mock hook implementations with proper state isolation
export const createMockHooks = () => {
  let menuData = null;
  
  return {
    useMenuData: () => ({
      menuData,
      originalMenuData: null,
      uploadedFile: null,
      loadFromFile: jest.fn().mockResolvedValue({ menu: { main: [] } }),
      updateMenuData: jest.fn((data) => { menuData = data; }),
      resetToOriginal: jest.fn(),
      setInitialData: jest.fn((data) => { menuData = data; }),
      clearData: jest.fn(() => { menuData = null; })
    }),
    
    useMenuEditor: () => ({
      editingItem: null,
      editForm: {},
      setEditForm: jest.fn(),
      isSaving: false,
      setIsSaving: jest.fn(),
      inlineEditingItem: null,
      inlineEditForm: {},
      setInlineEditForm: jest.fn(),
      recentlyEditedItems: new Set(),
      lastEditedItemRef: { current: null },
      addEditFeedback: jest.fn(),
      startEditing: jest.fn(),
      cancelEditing: jest.fn(),
      startInlineEditing: jest.fn(),
      cancelInlineEditing: jest.fn(),
      clearAllEditing: jest.fn()
    }),
    
    useMenuNavigation: () => ({
      expandedItems: new Set(),
      setExpandedItems: jest.fn(),
      searchTerm: '',
      setSearchTerm: jest.fn(),
      toggleExpanded: jest.fn(),
      isExpanded: jest.fn().mockReturnValue(false),
      expandAll: jest.fn(),
      collapseAll: jest.fn(),
      resetExpanded: jest.fn(),
      ensureParentExpanded: jest.fn(),
      preserveExpandedState: jest.fn()
    }),
    
    useMenuOperations: () => ({
      resolvingDuplicates: null,
      duplicateResolution: null,
      addNewItem: jest.fn(),
      saveEditedItem: jest.fn(),
      deleteItem: jest.fn(),
      downloadYaml: jest.fn(() => {
        global.URL.createObjectURL();
      }),
      getDuplicateIdentifiers: jest.fn().mockReturnValue([]),
      getItemsWithoutIdentifiers: jest.fn().mockReturnValue([]),
      startResolvingDuplicates: jest.fn(),
      cancelDuplicateResolution: jest.fn(),
      mergeIdenticalDuplicates: jest.fn(),
      generateDiff: jest.fn()
    }),
    
    useParentSuggestions: () => ({
      parentSuggestions: [],
      showParentSuggestions: false,
      handleParentInputChange: jest.fn(),
      selectParentSuggestion: jest.fn(),
      showSuggestions: jest.fn(),
      hideSuggestions: jest.fn(),
      getParentOptions: jest.fn().mockReturnValue([])
    })
  };
};

// Mock utilities
export const mockUtils = {
  buildHierarchy: jest.fn().mockReturnValue([]),
  filterItems: jest.fn().mockReturnValue([]),
  getVisibleItemCount: jest.fn().mockReturnValue(0)
};

// Mock browser APIs
export const mockBrowserAPIs = () => {
  global.URL.createObjectURL = jest.fn(() => 'mock-url');
  global.URL.revokeObjectURL = jest.fn();
  
  // Mock document methods for download functionality
  const mockAnchor = {
    href: '',
    download: '',
    click: jest.fn()
  };
  jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
  jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
  jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
};

// Test data factory
export const createTestMenuData = (items = []) => ({
  menu: {
    main: items.length > 0 ? items : [
      { name: 'Home', identifier: 'home', url: '/home', _uid: '1' },
      { name: 'About', identifier: 'about', url: '/about', _uid: '2' }
    ]
  }
});

// Setup function for common test initialization with isolated state
export const setupTestEnvironment = (initialMenuData = null) => {
  jest.clearAllMocks();
  mockBrowserAPIs();
  document.body.innerHTML = '<div id="root"></div>';
  
  // Create fresh mock hooks with isolated state for this test
  const hooks = createMockHooks();
  
  // Set initial menu data if provided
  if (initialMenuData) {
    hooks.useMenuData().setInitialData(initialMenuData);
  }
  
  return hooks;
};

// Teardown function
export const teardownTestEnvironment = () => {
  document.body.innerHTML = '';
};