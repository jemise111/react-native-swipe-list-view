module.exports = {
    preset: 'react-native',
    setupFiles: ['./jest.setup.js'],
    testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-gesture-handler|react-native-reanimated)/)',
    ],
};
