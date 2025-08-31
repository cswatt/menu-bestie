module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,
  
  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/setupTests.js'
  ],
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'jsx', 'json'],
  
  // A map from regular expressions to module names that allow to stub out resources
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.(js|jsx)',
    '**/?(*.)+(spec|test).(js|jsx)'
  ],
  
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/'
  ],
  
  // The regexp pattern Jest uses to detect test files
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  
  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.pnp\\.[^\\/]+$'
  ],
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Test timeout in milliseconds
  testTimeout: 10000,
  
  // Maximum number of workers used to run your tests
  maxWorkers: '50%',
  
  // Indicates whether to use watchman for file crawling
  watchman: false,
  
  // Automatically restore mocks between tests
  restoreMocks: true,
  
  // Reset all mocks between tests
  resetMocks: true,
  
  // Reset modules between tests
  resetModules: false,
  
  // Clear all mocks between tests
  clearAllMocks: true
};
