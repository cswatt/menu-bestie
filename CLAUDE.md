# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Menu Bestie is a React-based web interface for editing navigation menu configuration files (YAML format). The application consists of a React frontend and an Express.js backend that temporarily stores menu edits in memory.

## Architecture

### Frontend (React)
- **Main Component**: `src/components/MenuEditor.jsx` - The core menu editing interface
- **UI Components**: Radix UI components (`@radix-ui/*`) with Tailwind CSS styling
- **State Management**: React hooks for menu data, editing state, and UI state
- **YAML Processing**: Uses `js-yaml` for parsing and generating YAML files

### Backend (Express.js)
- **Server**: `server.js` - Express server serving both API and static files  
- **Memory Storage**: Menu edits stored temporarily in memory (not persisted to disk)
- **API Endpoints**:
  - `GET /api/menu-data` - Retrieve current menu data
  - `POST /api/menu-data` - Update menu data in memory
  - `GET /api/download-yaml` - Download edited menu as YAML
  - `POST /api/reset` - Reset to original menu data

### Key Features
- Upload YAML menu files for editing
- Visual tree structure for menu navigation
- Add, edit, delete menu items with form validation
- Search/filter menu items
- Duplicate detection and resolution
- Download modified YAML files
- Reset to original state

## Development Commands

### Start Development Environment
```bash
npm run dev
```
This runs both the Express server (port 3001) and React development server concurrently.

### Individual Commands
```bash
npm run server    # Start Express server only
npm start         # Start React development server only
npm run build     # Build React app for production
```

### Testing
```bash
npm test                                                    # Run all tests in watch mode
npm test -- --watchAll=false                               # Run tests once without watch
npm test -- --testPathPattern=MenuEditor.simple.test.jsx   # Run specific test file
npm test -- --coverage --watchAll=false                    # Run with coverage report
```

**Test Structure**: 
- Simple tests (`MenuEditor.simple.test.jsx`) - ✅ Passing (15/15 tests)
- Unit tests (`MenuEditor.unit.test.jsx`) - ✅ Fully fixed (14/14 tests passing)
- Workflow tests (`MenuEditor.workflow.test.jsx`) - ✅ Passing (6/6 tests)
- Smoke tests (`MenuEditor.smoke.test.jsx`) - ✅ Passing (2/2 tests)
- Backend API tests (`server.test.js`) - ✅ Comprehensive (22/22 tests passing)
- Test utilities in `src/utils/testUtils.js`

## Technical Details

### Menu Data Structure
Menu items use a nested structure with required `identifier` field and optional `children` array. The system adds temporary `_uid` fields for React rendering that are stripped before YAML export.

### State Management Pattern
The MenuEditor component uses multiple useState hooks to manage:
- Menu data and editing state
- UI states (modals, expanded items, loading states)  
- Form data for adding/editing items
- Search and filter functionality

### File Processing Flow
1. User uploads YAML file
2. Frontend parses with js-yaml and sends to backend
3. Backend stores in memory with added UIDs
4. User edits data in frontend
5. Changes sent to backend and stored in memory
6. User downloads modified YAML (UIDs stripped)

### Dependencies
- **Frontend**: React, Radix UI, Tailwind CSS, js-yaml, Lucide React icons
- **Backend**: Express, cors, js-yaml, concurrently
- **Testing**: Jest, React Testing Library, user-event, supertest

## Code Quality & Architecture Notes

### Known Issues
- **Large Component**: `MenuEditor.jsx` is 704 lines - needs refactoring into smaller components
- **No Persistent Storage**: Backend uses memory-only storage (data lost on restart)
- **Performance**: Not optimized for large menu datasets (100+ items)

### Recent Improvements
- **✅ Testing Infrastructure**: Comprehensive test suite with 59/59 tests passing
- **✅ Backend API Testing**: Complete endpoint coverage with error scenarios
- **✅ Mock Integration**: Proper FileReader and state isolation in tests
- **✅ Error Handling**: Tests cover malformed YAML, network failures, and edge cases

### Improvement Areas
See `PLAN.md` for detailed improvement roadmap including:
- Component refactoring and state management enhancement
- Performance optimization with virtualization
- Backend persistence with database integration  
- Advanced features like drag & drop, real-time collaboration