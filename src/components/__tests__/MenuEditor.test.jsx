import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuEditor from '../MenuEditor';
import { mockBrowserAPIs, restoreBrowserAPIs } from '../../utils/testUtils';

// Mock js-yaml at the module level
jest.mock('js-yaml', () => ({
  load: jest.fn(),
  dump: jest.fn()
}));

const mockJsYaml = require('js-yaml');

// Mock the UI components
jest.mock('../ui/button', () => {
  return function MockButton({ children, onClick, ...props }) {
    return (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    );
  };
});

jest.mock('../ui/input', () => {
  return function MockInput({ value, onChange, ...props }) {
    return (
      <input value={value} onChange={onChange} {...props} />
    );
  };
});

describe('MenuEditor', () => {
  let user;
  
  beforeEach(() => {
    user = userEvent.setup();
    mockBrowserAPIs();
    jest.clearAllMocks();
  });

  afterEach(() => {
    restoreBrowserAPIs();
  });

  describe('Initial State', () => {
    test('renders without crashing', () => {
      render(<MenuEditor />);
      expect(screen.getByText(/Menu Editor/i)).toBeInTheDocument();
    });

    test('shows upload file button initially', () => {
      render(<MenuEditor />);
      expect(screen.getByText(/Upload YAML File/i)).toBeInTheDocument();
    });

    test('does not show menu data initially', () => {
      render(<MenuEditor />);
      expect(screen.queryByText(/menu/i)).not.toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
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

      render(<MenuEditor />);
      
      const file = new File(['yaml content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Upload YAML File/i);
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
      });
    });

    test('shows error for invalid YAML file', async () => {
      mockJsYaml.load.mockImplementation(() => {
        throw new Error('Invalid YAML');
      });

      render(<MenuEditor />);
      
      const file = new File(['invalid yaml'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Upload YAML File/i);
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText(/Error parsing YAML file/i)).toBeInTheDocument();
      });
    });

    test('shows error for invalid file structure', async () => {
      const invalidData = { invalid: 'structure' };
      const { jsYaml } = require('js-yaml');
      jsYaml.load.mockReturnValue(invalidData);

      render(<MenuEditor />);
      
      const file = new File(['yaml content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Upload YAML File/i);
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid YAML file structure/i)).toBeInTheDocument();
      });
    });
  });

  describe('Menu Navigation', () => {
    let component;
    let mockYamlData;

    beforeEach(() => {
      mockYamlData = {
        menu: {
          main: [
            { 
              name: 'Home', 
              identifier: 'home', 
              url: '/home',
              children: [
                { name: 'Dashboard', identifier: 'dashboard', url: '/dashboard' }
              ]
            },
            { name: 'About', identifier: 'about', url: '/about' }
          ]
        }
      };

      mockJsYaml.load.mockReturnValue(mockYamlData);

      component = render(<MenuEditor />);
      
      // Upload file first
      const file = new File(['yaml content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Upload YAML File/i);
      user.upload(input, file);
    });

    test('expands and collapses menu items', async () => {
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      const homeItem = screen.getByText('Home');
      await user.click(homeItem);

      // Should show children
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Click again to collapse
      await user.click(homeItem);
      
      await waitFor(() => {
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      });
    });

    test('shows search functionality', async () => {
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search menu items/i);
      expect(searchInput).toBeInTheDocument();
    });

    test('filters menu items by search', async () => {
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search menu items/i);
      await user.type(searchInput, 'Home');

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.queryByText('About')).not.toBeInTheDocument();
      });
    });
  });

  describe('Item Editing', () => {
    let component;
    let mockYamlData;

    beforeEach(() => {
      mockYamlData = {
        menu: {
          main: [
            { name: 'Home', identifier: 'home', url: '/home' },
            { name: 'About', identifier: 'about', url: '/about' }
          ]
        }
      };

      mockJsYaml.load.mockReturnValue(mockYamlData);

      component = render(<MenuEditor />);
      
      // Upload file first
      const file = new File(['yaml content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Upload YAML File/i);
      user.upload(input, file);
    });

    test('opens edit form when edit button is clicked', async () => {
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText(/Edit/i);
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Home')).toBeInTheDocument();
        expect(screen.getByDisplayValue('home')).toBeInTheDocument();
        expect(screen.getByDisplayValue('/home')).toBeInTheDocument();
      });
    });

    test('saves edited item', async () => {
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText(/Edit/i);
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Home')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Home');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Home');

      const saveButton = screen.getByText(/Save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Updated Home')).toBeInTheDocument();
        expect(screen.queryByDisplayValue('Updated Home')).not.toBeInTheDocument(); // Form should be closed
      });
    });

    test('cancels editing', async () => {
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText(/Edit/i);
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Home')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText(/Cancel/i);
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('Home')).not.toBeInTheDocument(); // Form should be closed
      });
    });
  });

  describe('Item Addition', () => {
    let component;
    let mockYamlData;

    beforeEach(() => {
      mockYamlData = {
        menu: {
          main: [
            { name: 'Home', identifier: 'home', url: '/home' }
          ]
        }
      };

      mockJsYaml.load.mockReturnValue(mockYamlData);

      component = render(<MenuEditor />);
      
      // Upload file first
      const file = new File(['yaml content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Upload YAML File/i);
      user.upload(input, file);
    });

    test('opens add item modal', async () => {
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      const addButton = screen.getByText(/Add Item/i);
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Add New Menu Item/i)).toBeInTheDocument();
      });
    });

    test('adds new item', async () => {
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      const addButton = screen.getByText(/Add Item/i);
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Add New Menu Item/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(/Item name/i);
      const identifierInput = screen.getByPlaceholderText(/Unique identifier/i);
      const urlInput = screen.getByPlaceholderText(/URL path/i);

      await user.type(nameInput, 'New Item');
      await user.type(identifierInput, 'new-item');
      await user.type(urlInput, '/new-item');

      const saveButton = screen.getByText(/Add Item/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('New Item')).toBeInTheDocument();
        expect(screen.queryByText(/Add New Menu Item/i)).not.toBeInTheDocument(); // Modal should be closed
      });
    });

    test('validates required fields', async () => {
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      const addButton = screen.getByText(/Add Item/i);
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Add New Menu Item/i)).toBeInTheDocument();
      });

      // Try to save without required fields
      const saveButton = screen.getByText(/Add Item/i);
      await user.click(saveButton);

      // Should still show the modal (validation failed)
      await waitFor(() => {
        expect(screen.getByText(/Add New Menu Item/i)).toBeInTheDocument();
      });
    });
  });

  describe('Item Deletion', () => {
    let component;
    let mockYamlData;

    beforeEach(() => {
      mockYamlData = {
        menu: {
          main: [
            { name: 'Home', identifier: 'home', url: '/home' },
            { name: 'About', identifier: 'about', url: '/about' }
          ]
        }
      };

      mockJsYaml.load.mockReturnValue(mockYamlData);

      component = render(<MenuEditor />);
      
      // Upload file first
      const file = new File(['yaml content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Upload YAML File/i);
      user.upload(input, file);
    });

    test('deletes item with confirmation', async () => {
      await waitFor(() => {
        expect(screen.getByText('About')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText(/Delete/i);
      await user.click(deleteButtons[1]); // Delete About item

      // Should show confirmation dialog
      expect(screen.getByText(/Are you sure you want to delete "About"/i)).toBeInTheDocument();

      const confirmButton = screen.getByText(/OK/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText('About')).not.toBeInTheDocument();
        expect(screen.getByText('Home')).toBeInTheDocument(); // Home should still be there
      });
    });
  });

  describe('Download Functionality', () => {
    let component;
    let mockYamlData;

    beforeEach(() => {
      mockYamlData = {
        menu: {
          main: [
            { name: 'Home', identifier: 'home', url: '/home' }
          ]
        }
      };

      mockJsYaml.load.mockReturnValue(mockYamlData);
      jsYaml.dump.mockReturnValue('yaml content');

      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();

      // Mock document.createElement and appendChild
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn()
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      component = render(<MenuEditor />);
      
      // Upload file first
      const file = new File(['yaml content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Upload YAML File/i);
      user.upload(input, file);
    });

    test('downloads YAML file', async () => {
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText(/Download new main.en.yaml/i);
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockJsYaml.dump).toHaveBeenCalled();
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });
    });

    test('shows error when no data available', async () => {
      // Clear the data
      component.unmount();
      component = render(<MenuEditor />);

      const downloadButton = screen.getByText(/Download new main.en.yaml/i);
      await user.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/No menu data available to download/i)).toBeInTheDocument();
      });
    });
  });

  describe('Reset Functionality', () => {
    let component;
    let mockYamlData;

    beforeEach(() => {
      mockYamlData = {
        menu: {
          main: [
            { name: 'Home', identifier: 'home', url: '/home' }
          ]
        }
      };

      mockJsYaml.load.mockReturnValue(mockYamlData);

      component = render(<MenuEditor />);
      
      // Upload file first
      const file = new File(['yaml content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Upload YAML File/i);
      user.upload(input, file);
    });

    test('resets to original data', async () => {
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      // Edit the item first
      const editButtons = screen.getAllByText(/Edit/i);
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Home')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Home');
      await user.clear(nameInput);
      await user.type(nameInput, 'Modified Home');

      const saveButton = screen.getByText(/Save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Modified Home')).toBeInTheDocument();
      });

      // Now reset
      const resetButton = screen.getByText(/Reset to Original/i);
      await user.click(resetButton);

      // Should show confirmation
      expect(screen.getByText(/Are you sure you want to reset/i)).toBeInTheDocument();

      const confirmButton = screen.getByText(/OK/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument(); // Should be back to original
        expect(screen.queryByText('Modified Home')).not.toBeInTheDocument();
      });
    });
  });

  describe('Duplicate Detection', () => {
    let component;
    let mockYamlData;

    beforeEach(() => {
      mockYamlData = {
        menu: {
          main: [
            { name: 'Home', identifier: 'home', url: '/home' },
            { name: 'Home2', identifier: 'home', url: '/home2' }, // Duplicate identifier
            { name: 'About', identifier: 'about', url: '/about' }
          ]
        }
      };

      mockJsYaml.load.mockReturnValue(mockYamlData);

      component = render(<MenuEditor />);
      
      // Upload file first
      const file = new File(['yaml content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Upload YAML File/i);
      user.upload(input, file);
    });

    test('detects duplicate identifiers', async () => {
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Home2')).toBeInTheDocument();
      });

      // Should show duplicate warning
      const duplicateWarnings = screen.getAllByText(/Duplicate identifier detected/i);
      expect(duplicateWarnings.length).toBeGreaterThan(0);
    });

    test('allows resolving duplicates', async () => {
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Home2')).toBeInTheDocument();
      });

      const resolveButton = screen.getByText(/Resolve Duplicates/i);
      await user.click(resolveButton);

      await waitFor(() => {
        expect(screen.getByText(/Resolving Duplicates/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles file read errors gracefully', async () => {
      // Mock FileReader to simulate error
      const originalFileReader = global.FileReader;
      global.FileReader = jest.fn().mockImplementation(() => ({
        readAsText: jest.fn(),
        onerror: null,
        onload: null
      }));

      render(<MenuEditor />);
      
      const file = new File(['content'], 'test.yaml', { type: 'text/yaml' });
      const input = screen.getByLabelText(/Upload YAML File/i);
      
      // Simulate error
      const fileReader = global.FileReader.mock.results[0].value;
      fileReader.onerror(new Error('File read error'));
      
      await waitFor(() => {
        expect(screen.getByText(/Error parsing YAML file/i)).toBeInTheDocument();
      });

      // Restore original FileReader
      global.FileReader = originalFileReader;
    });
  });
});
