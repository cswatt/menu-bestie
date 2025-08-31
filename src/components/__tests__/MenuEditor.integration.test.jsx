import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuEditor from '../MenuEditor';
import { 
  createMockYamlFile, 
  createMockMenuData, 
  createMockMenuItem,
  mockJsYaml,
  mockBrowserAPIs,
  restoreBrowserAPIs
} from '../../utils/testUtils';

describe('MenuEditor Integration Tests', () => {
  let user;
  
  beforeEach(() => {
    user = userEvent.setup();
    mockBrowserAPIs();
    jest.clearAllMocks();
  });

  afterEach(() => {
    restoreBrowserAPIs();
  });

  describe('Complete Workflow: Upload, Edit, Download', () => {
    test('complete workflow from upload to download', async () => {
      // Setup mock data
      const mockData = createMockMenuData([
        createMockMenuItem({ name: 'Home', identifier: 'home', url: '/home' }),
        createMockMenuItem({ name: 'About', identifier: 'about', url: '/about' })
      ]);
      
      mockJsYaml(mockData, 'modified yaml content');

      render(<MenuEditor />);
      
      // Step 1: Upload file
      const file = createMockYamlFile('yaml content');
      const uploadInput = screen.getByLabelText(/Upload YAML File/i);
      await user.upload(uploadInput, file);
      
      // Verify upload worked
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
      });

      // Step 2: Edit an item
      const editButtons = screen.getAllByText(/Edit/i);
      await user.click(editButtons[0]); // Edit Home item
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Home')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Home');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Home');
      
      const saveButton = screen.getByText(/Save/i);
      await user.click(saveButton);
      
      // Verify edit was saved
      await waitFor(() => {
        expect(screen.getByText('Updated Home')).toBeInTheDocument();
        expect(screen.queryByDisplayValue('Updated Home')).not.toBeInTheDocument(); // Form closed
      });

      // Step 3: Add a new item
      const addButton = screen.getByText(/Add Item/i);
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Add New Menu Item/i)).toBeInTheDocument();
      });

      const newNameInput = screen.getByPlaceholderText(/Item name/i);
      const newIdentifierInput = screen.getByPlaceholderText(/Unique identifier/i);
      const newUrlInput = screen.getByPlaceholderText(/URL path/i);
      
      await user.type(newNameInput, 'Contact');
      await user.type(newIdentifierInput, 'contact');
      await user.type(newUrlInput, '/contact');
      
      const addItemButton = screen.getByText(/Add Item/i);
      await user.click(addItemButton);
      
      // Verify new item was added
      await waitFor(() => {
        expect(screen.getByText('Contact')).toBeInTheDocument();
        expect(screen.queryByText(/Add New Menu Item/i)).not.toBeInTheDocument(); // Modal closed
      });

      // Step 4: Download the modified YAML
      const downloadButton = screen.getByText(/Download new main.en.yaml/i);
      await user.click(downloadButton);
      
      // Verify download was triggered
      await waitFor(() => {
        expect(require('js-yaml').dump).toHaveBeenCalled();
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });
    });
  });

  describe('Complex Menu Structure Handling', () => {
    test('handles nested menu structure with children', async () => {
      const mockData = createMockMenuData([
        createMockMenuItem({ 
          name: 'Admin', 
          identifier: 'admin', 
          url: '/admin',
          children: [
            createMockMenuItem({ 
              name: 'Users', 
              identifier: 'users', 
              url: '/admin/users',
              parent: 'admin'
            }),
            createMockMenuItem({ 
              name: 'Settings', 
              identifier: 'settings', 
              url: '/admin/settings',
              parent: 'admin'
            })
          ]
        }),
        createMockMenuItem({ name: 'Public', identifier: 'public', url: '/public' })
      ]);
      
      mockJsYaml(mockData);

      render(<MenuEditor />);
      
      const file = createMockYamlFile('yaml content');
      const uploadInput = screen.getByLabelText(/Upload YAML File/i);
      await user.upload(uploadInput, file);
      
      // Verify structure loaded
      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('Public')).toBeInTheDocument();
      });

      // Expand Admin section
      const adminItem = screen.getByText('Admin');
      await user.click(adminItem);
      
      // Verify children are shown
      await waitFor(() => {
        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Edit a child item
      const editButtons = screen.getAllByText(/Edit/i);
      const usersEditButton = editButtons.find(button => 
        button.closest('[data-item-id]')?.textContent?.includes('Users')
      );
      
      if (usersEditButton) {
        await user.click(usersEditButton);
        
        await waitFor(() => {
          expect(screen.getByDisplayValue('Users')).toBeInTheDocument();
        });

        const nameInput = screen.getByDisplayValue('Users');
        await user.clear(nameInput);
        await user.type(nameInput, 'User Management');
        
        const saveButton = screen.getByText(/Save/i);
        await user.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText('User Management')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Search and Filter Functionality', () => {
    test('comprehensive search and filter workflow', async () => {
      const mockData = createMockMenuData([
        createMockMenuItem({ name: 'Home', identifier: 'home', url: '/home' }),
        createMockMenuItem({ name: 'About', identifier: 'about', url: '/about' }),
        createMockMenuItem({ name: 'Contact', identifier: 'contact', url: '/contact' }),
        createMockMenuItem({ name: 'Help', identifier: 'help', url: '/help' }),
        createMockMenuItem({ name: 'FAQ', identifier: 'faq', url: '/faq' })
      ]);
      
      mockJsYaml(mockData);

      render(<MenuEditor />);
      
      const file = createMockYamlFile('yaml content');
      const uploadInput = screen.getByLabelText(/Upload YAML File/i);
      await user.upload(uploadInput, file);
      
      // Verify all items are shown
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();
        expect(screen.getByText('Help')).toBeInTheDocument();
        expect(screen.getByText('FAQ')).toBeInTheDocument();
      });

      // Search for items containing 'o'
      const searchInput = screen.getByPlaceholderText(/Search menu items/i);
      await user.type(searchInput, 'o');
      
      // Should show items with 'o' in name
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();
        expect(screen.queryByText('Help')).not.toBeInTheDocument(); // No 'o'
        expect(screen.queryByText('FAQ')).not.toBeInTheDocument(); // No 'o'
      });

      // Clear search
      await user.clear(searchInput);
      
      // All items should be visible again
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();
        expect(screen.getByText('Help')).toBeInTheDocument();
        expect(screen.getByText('FAQ')).toBeInTheDocument();
      });

      // Search by identifier
      await user.type(searchInput, 'help');
      
      await waitFor(() => {
        expect(screen.getByText('Help')).toBeInTheDocument();
        expect(screen.queryByText('Home')).not.toBeInTheDocument();
        expect(screen.queryByText('About')).not.toBeInTheDocument();
        expect(screen.queryByText('Contact')).not.toBeInTheDocument();
        expect(screen.queryByText('FAQ')).not.toBeInTheDocument();
      });
    });
  });

  describe('Duplicate Resolution Workflow', () => {
    test('complete duplicate detection and resolution', async () => {
      const mockData = createMockMenuData([
        createMockMenuItem({ name: 'Home', identifier: 'home', url: '/home' }),
        createMockMenuItem({ name: 'Home Page', identifier: 'home', url: '/home-page' }), // Duplicate
        createMockMenuItem({ name: 'About', identifier: 'about', url: '/about' }),
        createMockMenuItem({ name: 'About Us', identifier: 'about', url: '/about-us' }) // Duplicate
      ]);
      
      mockJsYaml(mockData);

      render(<MenuEditor />);
      
      const file = createMockYamlFile('yaml content');
      const uploadInput = screen.getByLabelText(/Upload YAML File/i);
      await user.upload(uploadInput, file);
      
      // Verify duplicates are detected
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Home Page')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
        expect(screen.getByText('About Us')).toBeInTheDocument();
      });

      // Check for duplicate warnings
      const duplicateWarnings = screen.getAllByText(/Duplicate identifier detected/i);
      expect(duplicateWarnings.length).toBeGreaterThan(0);

      // Open duplicate resolution
      const resolveButton = screen.getByText(/Resolve Duplicates/i);
      await user.click(resolveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Resolving Duplicates/i)).toBeInTheDocument();
      });

      // Resolve one set of duplicates by editing
      const editButtons = screen.getAllByText(/Edit/i);
      await user.click(editButtons[1]); // Edit Home Page
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Home Page')).toBeInTheDocument();
      });

      const identifierInput = screen.getByDisplayValue('home');
      await user.clear(identifierInput);
      await user.type(identifierInput, 'home-page');
      
      const saveButton = screen.getByText(/Save/i);
      await user.click(saveButton);
      
      // Verify duplicate was resolved
      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
        expect(screen.queryByDisplayValue('Home Page')).not.toBeInTheDocument(); // Form closed
      });

      // Check that duplicate warnings are reduced
      const remainingWarnings = screen.getAllByText(/Duplicate identifier detected/i);
      expect(remainingWarnings.length).toBeLessThan(duplicateWarnings.length);
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    test('handles file upload errors gracefully', async () => {
      // Mock FileReader to simulate error
      const originalFileReader = global.FileReader;
      global.FileReader = jest.fn().mockImplementation(() => ({
        readAsText: jest.fn(),
        onerror: null,
        onload: null
      }));

      render(<MenuEditor />);
      
      const file = createMockYamlFile('content');
      const uploadInput = screen.getByLabelText(/Upload YAML File/i);
      
      // Simulate error
      const fileReader = global.FileReader.mock.results[0].value;
      fileReader.onerror(new Error('File read error'));
      
      await waitFor(() => {
        expect(screen.getByText(/Error parsing YAML file/i)).toBeInTheDocument();
      });

      // Should still allow new uploads
      const newFile = createMockYamlFile('new content');
      await user.upload(uploadInput, newFile);
      
      // Restore original FileReader
      global.FileReader = originalFileReader;
    });

    test('handles empty menu data gracefully', async () => {
      const emptyData = createMockMenuData([]);
      mockJsYaml(emptyData);

      render(<MenuEditor />);
      
      const file = createMockYamlFile('yaml content');
      const uploadInput = screen.getByLabelText(/Upload YAML File/i);
      await user.upload(uploadInput, file);
      
      // Should show empty state message
      await waitFor(() => {
        expect(screen.getByText(/No menu items found/i)).toBeInTheDocument();
      });

      // Add item button should still work
      const addButton = screen.getByText(/Add Item/i);
      expect(addButton).toBeInTheDocument();
    });

    test('handles malformed menu data gracefully', async () => {
      const malformedData = {
        menu: {
          main: [
            { name: 'Item 1' }, // Missing required fields
            { identifier: 'item2' }, // Missing name
            { name: 'Item 3', identifier: 'item3', url: '/item3' } // Valid item
          ]
        }
      };
      
      mockJsYaml(malformedData);

      render(<MenuEditor />);
      
      const file = createMockYamlFile('yaml content');
      const uploadInput = screen.getByLabelText(/Upload YAML File/i);
      await user.upload(uploadInput, file);
      
      // Should still load what it can
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
      });
    });
  });
});
