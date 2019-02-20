module.exports = {
  // Setup
  // ---------------
  testEnvironment: 'node',
  preset: 'ts-jest',

  // Paths
  // ---------------
  roots: ['<rootDir>/src/'],
  testMatch: ['**/*.test.ts'],

  // Coverage
  // ---------------
  coveragePathIgnorePatterns: ['/node_modules/', '/*.d.ts/', '/fixture/'],

  globals: {
    // Ts-jest configuration
    // ---------------
    'ts-jest': {
      diagnostics: {
        warnOnly: true,
      },
    },
  },
};
