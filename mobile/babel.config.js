module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind", flow: { allowDeclareFields: true } }]
    ],
    plugins: [
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      ["@babel/plugin-transform-flow-strip-types", { allowDeclareFields: true }],
      "react-native-worklets/plugin",
      ["module-resolver", {
        root: ["."],
        alias: {
          "@": ".",
        },
      }],
    ],
  };
};
