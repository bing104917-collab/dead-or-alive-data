const path = require('path');

module.exports = {
  dependencies: {
    'onnxruntime-react-native': {
      platforms: {
        android: {
          sourceDir: path.join(__dirname, 'node_modules', 'onnxruntime-react-native', 'android'),
          packageImportPath: 'import ai.onnxruntime.reactnative.OnnxruntimePackage;',
          packageInstance: 'new OnnxruntimePackage()',
        },
        ios: {
          podspecPath: path.join(__dirname, 'node_modules', 'onnxruntime-react-native', 'onnxruntime-react-native.podspec'),
        },
      },
    },
  },
};
