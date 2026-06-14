/* eslint-env jest */
require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-reanimated', () =>
    require('react-native-reanimated/mock')
);
