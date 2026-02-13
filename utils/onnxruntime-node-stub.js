// Stub for node-only onnxruntime package to avoid Metro bundling .node binaries.
// If this gets called in RN, it should fail loudly.
module.exports = {
  InferenceSession: {
    create() {
      throw new Error('onnxruntime-node is not supported in Expo/RN');
    },
  },
};
