jest.mock('./src/components/AppIcon', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockAppIcon({ name, size, color }) {
    return React.createElement(View, { testID: 'icon-' + name, accessibilityLabel: name, style: { width: size, height: size, borderColor: color } });
  };
});
