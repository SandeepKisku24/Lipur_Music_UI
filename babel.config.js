// Lipur_ui/babel.config.js

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Your .env plugin
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      blacklist: null,
      whitelist: null,
      safe: false,
      allowUndefined: true,
    }],
    
    // Your module-resolver for moti/skeleton
    [
      'module-resolver',
      {
        alias: {
          'expo-linear-gradient': 'react-native-linear-gradient',
        },
      },
    ],

    // Reanimated must STILL be the last plugin
    'react-native-reanimated/plugin', 
  ],
};