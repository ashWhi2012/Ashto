module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/*.test.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo)/)'
  ]
};