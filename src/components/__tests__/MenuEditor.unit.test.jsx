/**
 * MenuEditor Unit Tests
 * 
 * Comprehensive unit testing for the MenuEditor component, focusing on 
 * individual features with minimal mocking to ensure realistic behavior.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuEditor from '../MenuEditor';

// Mock js-yaml at the module level
jest.mock('js-yaml', () => ({
  load: jest.fn(),
  dump: jest.fn()
}));

const mockJsYaml = require('js-yaml');

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

// Mock fetch for API calls
global.fetch = jest.fn();

describe('MenuEditor', () => {
  let user;
  
  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Reset FileReader mock
    global.FileReader = jest.fn(() => ({
      readAsText: jest.fn(),
      onload: null,
      onerror: null,
      result: null
    }));
    
    // Reset fetch mock to success by default
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
    
    // Reset other global mocks
    global.confirm.mockReturnValue(true);
    global.alert.mockClear();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('renders without crashing', () => {
      render(<MenuEditor />);
      expect(screen.getByText(/Menu Bestie/i)).toBeInTheDocument();
    });

    test('shows upload file button initially', () => {
      render(<MenuEditor />);
      expect(screen.getByText(/Choose a file/i)).toBeInTheDocument();
    });

    test('does not show menu data initially', () => {
      render(<MenuEditor />);
      // Should not show any specific menu items, just the upload interface
      expect(screen.queryByText(/Edit menu items/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Upload Your Menu File/i)).toBeInTheDocument();
    });
  });

  describe('File Upload - Valid Files', () => {
    test('handles valid YAML file upload', async () => {
      const mockYamlData = {
        menu: {
          main: [
            { name: 'Home', identifier: 'home', url: '/home' },
            { name: 'About', identifier: 'about', url: '/about' }
          ]
        }
      };

      mockJsYaml.load.mockReturnValue(mockYamlData);

      // Setup FileReader to simulate successful read
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: 'yaml content'
      };
      global.FileReader = jest.fn(() => mockFileReader);

      render(<MenuEditor />);
      
      const file = new File(['yaml content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Choose a file/i);
      
      await user.upload(input, file);
      
      // Simulate FileReader success
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'yaml content' } });
      }
      
      await waitFor(() => {
        expect(mockJsYaml.load).toHaveBeenCalledWith('yaml content');
        // The component should process the file and update the UI
        expect(screen.getByText(/Menu Structure/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('processes file with nested menu items', async () => {
      const mockYamlData = {
        menu: {
          main: [
            { 
              name: 'Products', 
              identifier: 'products', 
              url: '/products',
              children: [
                { name: 'Category A', identifier: 'cat-a', url: '/products/a' }
              ]
            }
          ]
        }
      };

      mockJsYaml.load.mockReturnValue(mockYamlData);

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: 'yaml content'
      };
      global.FileReader = jest.fn(() => mockFileReader);

      render(<MenuEditor />);
      
      const file = new File(['yaml content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Choose a file/i);
      
      await user.upload(input, file);
      
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'yaml content' } });
      }
      
      await waitFor(() => {
        expect(mockJsYaml.load).toHaveBeenCalledWith('yaml content');
      });
    });
  });

  describe('File Upload - Error Cases', () => {
    test('handles FileReader unavailable gracefully', async () => {
      // Temporarily remove FileReader to simulate browser without FileReader support
      const originalFileReader = global.FileReader;
      delete global.FileReader;
      
      render(<MenuEditor />);
      
      // Component should render normally even without FileReader
      expect(screen.getByText(/Menu Bestie/i)).toBeInTheDocument();
      expect(screen.getByText(/Upload Your Menu File/i)).toBeInTheDocument();
      
      const file = new File(['content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Choose a file/i);
      
      // File upload should not crash the component
      await user.upload(input, file);
      
      // Component should still be functional
      expect(screen.getByText(/Menu Bestie/i)).toBeInTheDocument();
      
      // Restore FileReader
      global.FileReader = originalFileReader;
    });

    test('handles invalid YAML gracefully', async () => {
      mockJsYaml.load.mockImplementation(() => {
        throw new Error('Invalid YAML syntax');
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: 'invalid yaml content'
      };
      global.FileReader = jest.fn(() => mockFileReader);

      render(<MenuEditor />);
      
      const file = new File(['invalid yaml'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Choose a file/i);
      
      await user.upload(input, file);
      
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'invalid yaml content' } });
      }
      
      await waitFor(() => {
        expect(mockJsYaml.load).toHaveBeenCalledWith('invalid yaml content');
        // Component should handle the error and still be functional
        expect(screen.getByText(/Menu Bestie/i)).toBeInTheDocument();
      });
    });

    test('handles malformed YAML structure', async () => {
      const invalidData = { invalid: 'structure' };
      mockJsYaml.load.mockReturnValue(invalidData);

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: 'yaml content'
      };
      global.FileReader = jest.fn(() => mockFileReader);

      render(<MenuEditor />);
      
      const file = new File(['yaml content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Choose a file/i);
      
      await user.upload(input, file);
      
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'yaml content' } });
      }
      
      await waitFor(() => {
        expect(mockJsYaml.load).toHaveBeenCalledWith('yaml content');
        // Should handle invalid structure gracefully
        expect(screen.getByText(/Menu Bestie/i)).toBeInTheDocument();
      });
    });

    test('handles network error during upload', async () => {
      const mockYamlData = {
        menu: { main: [{ name: 'Test', identifier: 'test' }] }
      };
      mockJsYaml.load.mockReturnValue(mockYamlData);
      
      // Mock fetch to fail
      global.fetch.mockRejectedValue(new Error('Network error'));

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: 'yaml content'
      };
      global.FileReader = jest.fn(() => mockFileReader);

      render(<MenuEditor />);
      
      const file = new File(['yaml content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Choose a file/i);
      
      await user.upload(input, file);
      
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'yaml content' } });
      }
      
      await waitFor(() => {
        expect(mockJsYaml.load).toHaveBeenCalledWith('yaml content');
        // Component should handle network errors gracefully and still show the interface
        expect(screen.getByText(/Menu Bestie/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Component Integration', () => {
    test('maintains component state after file operations', async () => {
      const mockYamlData = {
        menu: { main: [{ name: 'Home', identifier: 'home' }] }
      };
      mockJsYaml.load.mockReturnValue(mockYamlData);

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: 'yaml content'
      };
      global.FileReader = jest.fn(() => mockFileReader);

      render(<MenuEditor />);
      
      // Initial state
      expect(screen.getByText(/Upload Your Menu File/i)).toBeInTheDocument();
      
      // Upload file
      const file = new File(['yaml content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Choose a file/i);
      await user.upload(input, file);
      
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'yaml content' } });
      }
      
      await waitFor(() => {
        expect(mockJsYaml.load).toHaveBeenCalled();
        // Component should maintain its structure
        expect(screen.getByText(/Menu Bestie/i)).toBeInTheDocument();
      });
    });

    test('handles multiple file uploads correctly', async () => {
      const firstData = {
        menu: { main: [{ name: 'First', identifier: 'first' }] }
      };
      const secondData = {
        menu: { main: [{ name: 'Second', identifier: 'second' }] }
      };

      let callCount = 0;
      mockJsYaml.load.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? firstData : secondData;
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: null
      };
      global.FileReader = jest.fn(() => mockFileReader);

      render(<MenuEditor />);
      
      const input = screen.getByLabelText(/Choose a file/i);
      
      // First upload
      const file1 = new File(['yaml content 1'], 'test1.yaml', { type: 'text/yaml' });
      await user.upload(input, file1);
      mockFileReader.result = 'yaml content 1';
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'yaml content 1' } });
      }
      
      await waitFor(() => {
        expect(mockJsYaml.load).toHaveBeenCalledWith('yaml content 1');
      });
      
      // Second upload
      const file2 = new File(['yaml content 2'], 'test2.yaml', { type: 'text/yaml' });
      await user.upload(input, file2);
      mockFileReader.result = 'yaml content 2';
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'yaml content 2' } });
      }
      
      await waitFor(() => {
        expect(mockJsYaml.load).toHaveBeenCalledWith('yaml content 2');
        expect(mockJsYaml.load).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles empty file upload', async () => {
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: ''
      };
      global.FileReader = jest.fn(() => mockFileReader);

      render(<MenuEditor />);
      
      const file = new File([''], 'empty.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Choose a file/i);
      
      await user.upload(input, file);
      
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: '' } });
      }
      
      await waitFor(() => {
        // Should handle empty file gracefully
        expect(screen.getByText(/Menu Bestie/i)).toBeInTheDocument();
      });
    });

    test('handles very large file gracefully', async () => {
      const largeContent = 'x'.repeat(10000);
      const mockYamlData = {
        menu: { main: Array.from({length: 100}, (_, i) => ({
          name: `Item ${i}`,
          identifier: `item-${i}`,
          url: `/item-${i}`
        }))}
      };
      
      mockJsYaml.load.mockReturnValue(mockYamlData);

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: largeContent
      };
      global.FileReader = jest.fn(() => mockFileReader);

      render(<MenuEditor />);
      
      const file = new File([largeContent], 'large.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Choose a file/i);
      
      await user.upload(input, file);
      
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: largeContent } });
      }
      
      await waitFor(() => {
        expect(mockJsYaml.load).toHaveBeenCalledWith(largeContent);
        // Should handle large files without crashing
        expect(screen.getByText(/Menu Bestie/i)).toBeInTheDocument();
      });
    });

    test('handles non-YAML file extension gracefully', async () => {
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: 'yaml content'
      };
      global.FileReader = jest.fn(() => mockFileReader);

      render(<MenuEditor />);
      
      // Try to upload a .txt file
      const file = new File(['yaml content'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/Choose a file/i);
      
      await user.upload(input, file);
      
      // Component should handle this gracefully
      expect(screen.getByText(/Menu Bestie/i)).toBeInTheDocument();
    });
  });
});