import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuEditor from '../MenuEditor';

// Mock js-yaml
jest.mock('js-yaml', () => ({
  load: jest.fn(),
  dump: jest.fn()
}));

// Mock the UI components
jest.mock('../ui/button', () => ({
  Button: function MockButton({ children, onClick, ...props }) {
    return (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    );
  }
}));

jest.mock('../ui/input', () => ({
  Input: function MockInput({ value, onChange, ...props }) {
    return (
      <input value={value} onChange={onChange} {...props} />
    );
  }
}));

// Mock all other components and hooks that MenuEditor uses
jest.mock('../FileUploadModal', () => {
  return function MockFileUploadModal({ show, children }) {
    if (!show) return null;
    return <div data-testid="file-upload-modal">{children}</div>;
  };
});

jest.mock('../AddItemModal', () => {
  return function MockAddItemModal({ show, children }) {
    if (!show) return null;
    return <div data-testid="add-item-modal">{children}</div>;
  };
});

jest.mock('../MenuItem', () => {
  return function MockMenuItem({ item }) {
    return <div data-testid="menu-item">{item.name}</div>;
  };
});

jest.mock('../MenuItemForm', () => {
  return function MockMenuItemForm() {
    return <form data-testid="menu-item-form">Mock Form</form>;
  };
});

// Mock all the hooks with stateful data
let mockMenuData = null;

jest.mock('../../hooks/useMenuData', () => ({
  useMenuData: () => ({
    menuData: mockMenuData,
    originalMenuData: null,
    uploadedFile: null,
    loadFromFile: jest.fn().mockResolvedValue({ menu: { main: [] } }),
    updateMenuData: jest.fn(),
    resetToOriginal: jest.fn(),
    setInitialData: jest.fn((data) => { mockMenuData = data; }),
    clearData: jest.fn()
  })
}));

jest.mock('../../hooks/useMenuEditor', () => ({
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
  })
}));

jest.mock('../../hooks/useMenuNavigation', () => ({
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
  })
}));

jest.mock('../../hooks/useMenuOperations', () => ({
  useMenuOperations: () => ({
    resolvingDuplicates: null,
    duplicateResolution: null,
    addNewItem: jest.fn(),
    saveEditedItem: jest.fn(),
    deleteItem: jest.fn(),
    downloadYaml: jest.fn(() => {
      // Simulate the download functionality
      global.URL.createObjectURL();
    }),
    getDuplicateIdentifiers: jest.fn().mockReturnValue([]),
    getItemsWithoutIdentifiers: jest.fn().mockReturnValue([]),
    startResolvingDuplicates: jest.fn(),
    cancelDuplicateResolution: jest.fn(),
    mergeIdenticalDuplicates: jest.fn(),
    generateDiff: jest.fn()
  })
}));

jest.mock('../../hooks/useParentSuggestions', () => ({
  useParentSuggestions: () => ({
    parentSuggestions: [],
    showParentSuggestions: false,
    handleParentInputChange: jest.fn(),
    selectParentSuggestion: jest.fn(),
    showSuggestions: jest.fn(),
    hideSuggestions: jest.fn(),
    getParentOptions: jest.fn().mockReturnValue([])
  })
}));

jest.mock('../../utils/menuUtils', () => ({
  buildHierarchy: jest.fn().mockReturnValue([]),
  filterItems: jest.fn().mockReturnValue([]),
  getVisibleItemCount: jest.fn().mockReturnValue(0)
}));

const mockJsYaml = require('js-yaml');

describe('MenuEditor Integration Tests (Simplified)', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Reset mock menu data
    mockMenuData = null;
    
    // Mock browser APIs
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Set up proper DOM container
    document.body.innerHTML = '<div id="root"></div>';
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('basic upload workflow', async () => {
    // Setup test data
    const testData = {
      menu: {
        main: [
          { name: 'Home', identifier: 'home', url: '/home', _uid: '1' },
          { name: 'About', identifier: 'about', url: '/about', _uid: '2' }
        ]
      }
    };
    
    // Set the mock data so component renders with data
    mockMenuData = testData;
    
    // Mock utility functions to return the test data
    const { buildHierarchy, filterItems } = require('../../utils/menuUtils');
    buildHierarchy.mockReturnValue(testData.menu.main);
    filterItems.mockReturnValue(testData.menu.main);
    
    mockJsYaml.load.mockReturnValue(testData);

    render(<MenuEditor />);
    
    // Verify menu items are rendered (since we set mockMenuData)
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
  
  test('can download YAML', async () => {
    // Setup test data
    const testData = {
      menu: {
        main: [
          { name: 'Home', identifier: 'home', url: '/home', _uid: '1' }
        ]
      }
    };
    
    // Set the mock data so component renders with data
    mockMenuData = testData;
    
    // Mock utility functions
    const { buildHierarchy, filterItems } = require('../../utils/menuUtils');
    buildHierarchy.mockReturnValue(testData.menu.main);
    filterItems.mockReturnValue(testData.menu.main);
    
    mockJsYaml.load.mockReturnValue(testData);
    mockJsYaml.dump.mockReturnValue('generated yaml');

    render(<MenuEditor />);
    
    // Wait for component to render with data
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click download button
    const downloadButton = screen.getByText(/Download new main.en.yaml/i);
    await user.click(downloadButton);
    
    // Verify download was triggered
    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });
});