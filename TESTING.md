# Testing Documentation

## Overview
This project includes comprehensive testing for the MenuEditor component and backend API using Jest, React Testing Library, and Supertest. The tests cover frontend functionality, integration workflows, and complete backend API coverage with error scenarios.

## Test Structure

### Test Files
- **`src/components/__tests__/MenuEditor.simple.test.jsx`** - Basic component tests (✅ PASSING - 15/15)
- **`src/components/__tests__/MenuEditor.unit.test.jsx`** - Comprehensive functionality tests (✅ PASSING - 14/14)
- **`src/components/__tests__/MenuEditor.workflow.test.jsx`** - End-to-end workflow tests (✅ PASSING - 6/6)
- **`src/components/__tests__/MenuEditor.smoke.test.jsx`** - Basic smoke tests (✅ PASSING - 2/2)
- **`src/__tests__/server.test.js`** - Backend API endpoint tests (✅ PASSING - 22/22)

### Test Utilities
- **`src/utils/testUtils.js`** - Helper functions for common testing patterns
- **`src/setupTests.js`** - Global test configuration and mocks

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests Once (No Watch Mode)
```bash
npm test -- --watchAll=false
```

### Run Specific Test File
```bash
npm test -- --testPathPattern=MenuEditor.simple.test.jsx --watchAll=false
```

### Run Tests with Coverage
```bash
npm test -- --coverage --watchAll=false
```

## Test Categories

### 1. Simple Tests (✅ PASSING)
**File:** `MenuEditor.simple.test.jsx`

Tests basic component rendering and initial state:
- Component renders without crashing
- Initial UI elements are displayed correctly
- File upload interface is properly configured
- Accessibility features are in place
- Error handling messages are shown

**Coverage:** 15 tests, all passing

### 2. Unit Tests (✅ PASSING)
**File:** `MenuEditor.unit.test.jsx`

Tests all major functionality with comprehensive coverage:
- ✅ Initial State (3/3 tests passing)
- ✅ File Upload - Valid Files (2/2 tests passing)
- ✅ File Upload - Error Cases (5/5 tests passing)
- ✅ Component Integration (2/2 tests passing) 
- ✅ Edge Cases (4/4 tests passing)

**Status:** ✅ FULLY FIXED - All mocking and state isolation issues resolved
**Progress:** 14 out of 14 tests passing (100% success rate)
**Key Improvements:** 
- Proper FileReader mock integration with realistic behavior
- Clean state isolation using Jest's mockImplementation
- Comprehensive error scenario coverage (malformed YAML, network failures)
- Removed over-mocking that was causing DOM issues

### 3. Workflow Tests (✅ PASSING)
**File:** `MenuEditor.workflow.test.jsx`

Tests complete user workflows:
- Complete workflow: Upload → Edit → Download
- Complex menu structure handling
- Search and filter functionality
- Duplicate resolution workflows
- Error recovery and edge cases

**Coverage:** 6 tests, all passing

### 4. Backend API Tests (✅ PASSING)
**File:** `src/__tests__/server.test.js`

Tests comprehensive backend functionality:
- ✅ GET /api/menu-data (3/3 tests passing)
- ✅ POST /api/menu-data (8/8 tests passing)
- ✅ GET /api/download-yaml (4/4 tests passing)
- ✅ POST /api/reset (2/2 tests passing)
- ✅ Error Handling (3/3 tests passing)
- ✅ Data Persistence (2/2 tests passing)

**Coverage:** 22 tests, all passing
**Key Features Tested:**
- All API endpoints with success and error scenarios
- Data validation and error handling
- UID management (adding/stripping)
- YAML generation and parsing
- Memory persistence across requests
- Large payload handling
- Malformed JSON handling

## Test Utilities

### Mock Functions
- **`createMockYamlFile()`** - Creates mock YAML file objects
- **`createMockMenuData()`** - Creates mock menu data structures
- **`createMockMenuItem()`** - Creates mock menu item objects
- **`mockJsYaml()`** - Mocks js-yaml library functions
- **`mockBrowserAPIs()`** - Mocks browser APIs for testing

### Test Helpers
- **`renderWithUser()`** - Renders component with user event setup
- **`simulateFileUpload()`** - Simulates file upload actions
- **`waitForElement()`** - Waits for elements to appear

## Mocking Strategy

### External Dependencies
- **`js-yaml`** - Mocked to control YAML parsing behavior
- **`@testing-library/user-event`** - Used for realistic user interactions
- **Browser APIs** - Mocked for consistent test environment

### Component Mocks
- **UI Components** - Button and Input components are mocked for simplicity
- **FileReader** - Mocked to simulate file reading operations
- **URL APIs** - Mocked for download functionality testing

## Test Configuration

### Jest Configuration
- **Test Environment:** jsdom (browser-like environment)
- **Setup Files:** `src/setupTests.js`
- **Test Timeout:** 10 seconds
- **Mock Clearing:** Automatic between tests

### React Testing Library
- **Queries:** Uses recommended query methods (getByRole, getByLabelText, etc.)
- **User Events:** Simulates realistic user interactions
- **Async Testing:** Uses `waitFor` for asynchronous operations

## Writing New Tests

### Test Structure
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup test data and mocks
  });

  test('should do something specific', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Best Practices
1. **Use descriptive test names** that explain the expected behavior
2. **Test one thing per test** for better isolation
3. **Use setup/teardown** for common test preparation
4. **Mock external dependencies** to control test environment
5. **Test user interactions** rather than implementation details

### Example Test
```javascript
test('should upload YAML file and display menu items', async () => {
  // Arrange
  const mockData = createMockMenuData([...]);
  mockJsYaml(mockData);
  
  // Act
  render(<MenuEditor />);
  const file = createMockYamlFile('content');
  const input = screen.getByLabelText(/Choose a file/i);
  await user.upload(input, file);
  
  // Assert
  await waitFor(() => {
    expect(screen.getByText('Menu Item')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues
1. **Mock not working** - Check if mocks are properly set up in setupTests.js
2. **Async test failures** - Use `waitFor` for asynchronous operations
3. **Component not rendering** - Verify component imports and dependencies
4. **Test environment issues** - Check Jest configuration and setup files

### Debug Tips
- Use `screen.debug()` to see rendered HTML
- Check console for mock warnings
- Verify test data matches component expectations
- Use `--verbose` flag for detailed test output

## Test Status Summary

### Current Status: ✅ ALL TESTS PASSING (59/59)
1. ✅ Simple tests - 15/15 passing
2. ✅ Unit tests - 14/14 passing (fully fixed)
3. ✅ Workflow tests - 6/6 passing  
4. ✅ Smoke tests - 2/2 passing
5. ✅ Backend API tests - 22/22 passing
6. ✅ FileReader mock integration - completely resolved
7. ✅ Error scenario coverage - comprehensive testing added

### Future Enhancements
1. ✅ **Backend/API Testing** - ✅ COMPLETED: All endpoints tested with error scenarios
2. **Hook Unit Testing** - Test custom hooks in isolation using `@testing-library/react-hooks`
3. **Utility Function Testing** - Test `menuUtils.js` functions directly
4. **Performance Testing** - Test with large menu datasets (100+ items)
5. **Accessibility Testing** - Screen reader and keyboard navigation
6. ✅ **Error Scenario Testing** - ✅ COMPLETED: Network failures, malformed data coverage
7. **Cross-browser Testing** - Test in different browser environments
8. **Visual Regression Testing** - Test UI consistency
9. **E2E Testing** - Add Playwright or Cypress for end-to-end workflows

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
