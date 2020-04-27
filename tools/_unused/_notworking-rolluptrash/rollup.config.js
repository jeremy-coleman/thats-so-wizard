var closure = require("@ampproject/rollup-plugin-closure-compiler");
const { terser } = require("rollup-plugin-terser");
var commonjs = require("@rollup/plugin-commonjs");
var nodeResolve = require("@rollup/plugin-node-resolve");
var globals = require("rollup-plugin-node-globals");
var babel = require("rollup-plugin-babel");
var typescript = require("@rollup/plugin-typescript");

module.exports = {
  input: "build/app/main.js",
  output: {
    format: "esm",
    file: "build/public/main.js",
  },
  external: ["tslib"], //Object.keys(require("./package.json").dependencies),
  treeshake: {
    moduleSideEffects: false,
  },
  inlineDynamicImports: true,
  plugins: [
    commonjs({
      namedExports: {
        //'node_modules/react/index.js': Object.keys(require("react")),
        //'node_modules/react-dom/index.js': Object.keys(require("react-dom"))
        "node_modules/react-is/index.js": Object.keys(require("react-is")),
      },
    }),
    nodeResolve(),
    babel({
      extensions: [".js", ".jsx", ".tsx", ".ts"],
      plugins: [
        ["babel-plugin-transform-react-pug"],
        ["babel-plugin-polished"],
        ["babel-plugin-macros"],
      ],
      comments: false,
    }),
    //terser(),
    //closure()
  ],
  onwarn: function (message) {
    if (/external dependency/.test(message)) {
      return;
    }
    if (message.code === "CIRCULAR_DEPENDENCY") {
      return;
    }
    if (message.code === "INPUT_HOOK_IN_OUTPUT_PLUGIN") {
      return;
    } else console.error(message);
  },
};
