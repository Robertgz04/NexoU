jest.mock('./src/components/AppIcon', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockAppIcon({ name, size, color }) {
    return React.createElement(View, {
      testID: 'icon-' + name,
      accessibilityLabel: name,
      style: { width: size, height: size, borderColor: color },
    });
  };
});
jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn().mockResolvedValue(false),
  setGenericPassword: jest.fn().mockResolvedValue(true),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device' },
}));
jest.mock('react-native-get-random-values', () => ({}));
jest.mock('uuid', () => ({ v4: () => '94b987ce-c538-4d12-a6b7-c338cc83d094' }));
