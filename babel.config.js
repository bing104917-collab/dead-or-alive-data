module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],

    plugins: [
      // Reanimated plugin 必须放在最后（官方要求，用于 worklets 和 Fabric 支持）
      'react-native-reanimated/plugin',

    ],
  };
};