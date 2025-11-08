module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: ['server.js'],
  coverageDirectory: 'coverage',
  verbose: false,
  testTimeout: 30000
};
