module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "webextension-state.js",
    library: "WebextensionState",
    libraryTarget: "umd",
    globalObject: "this",
  },
  mode: "development",
  watch: true,

  stats: {
    colors: true,
  },

  devtool: false,
};
