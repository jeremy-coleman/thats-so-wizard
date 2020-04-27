const createAliasConfig = dir => ({
  "@demo": `./${dir}/@demo`
});


/** @type import("@babel/core").TransformOptions */
var config = {
  plugins: [
    ["babel-plugin-transform-react-pug"],
    ["babel-plugin-polished"],
    ["babel-plugin-macros"],
    ["babel-plugin-add-import-extension"],
    [
      "babel-plugin-module-resolver",
      {
        root: ["src"],
        extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"],
        //alias: createAliasConfig("src")
      }
    ],
  ],
  comments: false
};

module.exports = config;
