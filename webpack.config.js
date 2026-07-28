const MinimizerPlugin = require("minimizer-webpack-plugin");

module.exports = (env) => {
  const options = {
    entry: "./src/index.js",
    output: {
      filename: "webextension-state.js",
      library: "WebextensionState",
      libraryTarget: "umd",
      libraryExport: "default",
      globalObject: "this",
    },
    mode: "development",
    watch: true,

    stats: {
      colors: true,
    },

    devtool: false,
  };

  if (env.production) {
    options.optimization = {
      minimize: true,
      minimizer: [new MinimizerPlugin()],
    };
    options.output.filename = "webextension-state.min.js";
  }

  return options;
};
