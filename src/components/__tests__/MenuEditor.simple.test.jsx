import React from 'react';
import { render, screen } from '@testing-library/react';
import MenuEditor from '../MenuEditor';

// Mock js-yaml
jest.mock('js-yaml', () => ({
  load: jest.fn(),
  dump: jest.fn()
}));

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

describe('MenuEditor Simple Tests', () => {
  beforeEach(() => {
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
      expect(screen.queryByText(/Edit menu items/i)).not.toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('renders main container', () => {
      render(<MenuEditor />);
      const container = screen.getByText(/Menu Bestie/i);
      expect(container).toBeInTheDocument();
    });

    test('renders file upload section', () => {
      render(<MenuEditor />);
      const uploadSection = screen.getByText(/Upload Your Menu File/i);
      expect(uploadSection).toBeInTheDocument();
    });

    test('renders file upload interface', () => {
      render(<MenuEditor />);
      expect(screen.getByText(/Choose a file/i)).toBeInTheDocument();
      expect(screen.getByText(/or drag and drop/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('search input is not visible initially', () => {
      render(<MenuEditor />);
      const searchInput = screen.queryByPlaceholderText(/Search menu items/i);
      expect(searchInput).not.toBeInTheDocument();
    });
  });

  describe('File Upload Interface', () => {
    test('file input has correct attributes', () => {
      render(<MenuEditor />);
      const fileInput = screen.getByLabelText(/Choose a file/i);
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', '.yaml,.yml');
    });

    test('shows upload instructions', () => {
      render(<MenuEditor />);
      expect(screen.getByText(/Choose a file/i)).toBeInTheDocument();
      expect(screen.getByText(/or drag and drop/i)).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    test('action buttons are not visible initially', () => {
      render(<MenuEditor />);
      expect(screen.queryByText(/Add Item/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Download new main.en.yaml/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Reset to Original/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      render(<MenuEditor />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/Menu Bestie/i);
    });

    test('file input has proper label', () => {
      render(<MenuEditor />);
      const fileInput = screen.getByLabelText(/Choose a file/i);
      expect(fileInput).toBeInTheDocument();
    });

    test('file input has proper id and label association', () => {
      render(<MenuEditor />);
      const fileInput = screen.getByLabelText(/Choose a file/i);
      expect(fileInput).toHaveAttribute('id', 'file-upload');
    });
  });

  describe('Error Handling', () => {
    test('shows appropriate message when no file is uploaded', () => {
      render(<MenuEditor />);
      expect(screen.getByText(/Upload a YAML file to get started/i)).toBeInTheDocument();
    });

    test('shows file type restrictions', () => {
      render(<MenuEditor />);
      expect(screen.getByText(/YAML files only/i)).toBeInTheDocument();
    });
  });
});
