module.exports = {
  testMatch: ['<rootDir>/__test__/*'],
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/*.ts'],
  coveragePathIgnorePatterns: ['<rootDir>/src/*.d.ts'],
}
