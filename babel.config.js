module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // ADD THIS PLUGIN HERE
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env', // Assumes your .env file is named .env (you used "env file :L")
      blacklist: null,
      whitelist: null,
      safe: false,
      allowUndefined: true,
    }],
  ],
};
