<<<<<<< Updated upstream
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
=======
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      production: {
        plugins: ['react-native-paper/babel'],
      },
    },
  };
};
>>>>>>> Stashed changes
