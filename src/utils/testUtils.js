import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Helper to create a mock YAML file
export const createMockYamlFile = (content, filename = 'test.yaml') => {
  return new File([content], filename, { type: 'text/yaml' });
};

// Helper to create mock menu data
export const createMockMenuData = (items = []) => {
  return {
    menu: {
      main: items
    }
  };
};

// Helper to create a mock menu item
export const createMockMenuItem = (overrides = {}) => {
  return {
    name: 'Test Item',
    identifier: 'test-item',
    url: '/test',
    pre: '',
    parent: '',
    weight: 0,
    ...overrides
  };
};

// Helper to render component with user event setup
export const renderWithUser = (component) => {
  const user = userEvent.setup();
  const utils = render(component);
  return {
    user,
    ...utils,
  };
};

// Helper to mock js-yaml - returns the mock functions to use
export const mockJsYaml = (loadData = null, dumpData = 'yaml content') => {
  const mockLoad = jest.fn();
  const mockDump = jest.fn();
  
  if (loadData !== null) {
    mockLoad.mockReturnValue(loadData);
  }
  
  if (dumpData !== null) {
    mockDump.mockReturnValue(dumpData);
  }
  
  return {
    load: mockLoad,
    dump: mockDump
  };
};

// Helper to create a global js-yaml mock for use in jest.mock()
export const createGlobalJsYamlMock = () => ({
  load: jest.fn(),
  dump: jest.fn()
});

// Helper to simulate file upload
export const simulateFileUpload = async (user, inputElement, file) => {
  await user.upload(inputElement, file);
};

// Helper to wait for element to appear
export const waitForElement = async (getElement, timeout = 5000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const element = getElement();
      if (element) return element;
    } catch (error) {
      // Element not found, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error('Element not found within timeout');
};

// Helper to mock browser APIs
export const mockBrowserAPIs = () => {
  // Mock URL.createObjectURL
  global.URL.createObjectURL = jest.fn(() => 'mock-url');
  global.URL.revokeObjectURL = jest.fn();
  
  // Mock FileReader
  global.FileReader = jest.fn(() => ({
    readAsText: jest.fn(function() {
      // Simulate successful file read
      setTimeout(() => {
        if (this.onload) {
          this.onload({ target: { result: 'mock yaml content' } });
        }
      }, 0);
    }),
    onload: null,
    onerror: null,
    result: null
  }));
  
  // Mock document.createElement for anchor tags
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = jest.fn((tagName) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        click: jest.fn()
      };
    }
    return originalCreateElement(tagName);
  });
  
  // Mock document.body methods
  jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
  jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
};

// Helper to restore browser APIs
export const restoreBrowserAPIs = () => {
  jest.restoreAllMocks();
};

// Helper to create a mock FileReader with success
export const createMockFileReader = (result) => {
  return jest.fn().mockImplementation(() => ({
    readAsText: jest.fn(),
    onload: null,
    onerror: null,
    result: result
  }));
};

// Helper to create a mock FileReader with error
export const createMockFileReaderWithError = (error) => {
  return jest.fn().mockImplementation(() => ({
    readAsText: jest.fn(),
    onload: null,
    onerror: null,
    error: error
  }));
};
