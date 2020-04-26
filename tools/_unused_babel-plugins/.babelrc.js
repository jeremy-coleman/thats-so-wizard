const createAliasConfig = dir => ({
  "@demo": `./${dir}/@demo`
});

// THIS IS MOST OF WHAT YOU NEED TO NOT USE TYPESCRIPT AT ALL , BUT THATS DUMB BC TS#1

/** @type import("@babel/core").TransformOptions */
var config = {
  presets: [
    ["@babel/preset-typescript", { isTsx: true, allowNamespaces: true , allowDeclareFields: true}],
    ["@babel/preset-react", { 
      //runtime: "automatic",
      useBuiltIns: true,
      //useSpread: true
    }],
    //["@babel/preset-env", {targets: {node: "current"}}]
  ],
  plugins: [
    ["babel-plugin-typescript-iife-enum"],
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    ["@babel/plugin-proposal-nullish-coalescing-operator"],
    ["@babel/plugin-proposal-optional-chaining"],
    //["@babel/plugin-transform-modules-commonjs", { noInterop: true, strict: true /**lazy: true*/ }],
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

// var path = require("path");
// var fs = require("fs");
// const projectSourceDirectory = path.resolve(process.cwd(), "src");
// const sourceDirs = fs
//   .readdirSync(projectSourceDirectory)
//   .filter(f => !f.includes("."));

// let createConfig = () => {
//   const config = {
//     baseUrl: ".",
//     paths: {}
//   };
//   for (var x of sourceDirs) {
//     config.paths[`${x}/*`] = [`src/${x}/*`];
//   }
//   //return JSON.stringify(config)
//   return config;
// };

// const compilerOptions = createConfig();


/** @type import("@babel/core").TransformOptions */
// var config = {
//   presets: [
//     ["@babel/preset-typescript", { isTsx: true, allowNamespaces: true , allowDeclareFields: true}],
//     ["@babel/preset-react", { runtime: "automatic", useBuiltIns: true, useSpread: true}],
//     //["@babel/preset-env", { targets: {node: "current" }}]
//   ],
//   plugins: [
//     //["@babel/plugin-syntax-typescript"],
//     ["@babel/plugin-proposal-decorators", { legacy: true }],
//     //["@babel/plugin-transform-typescript", {allowNamespaces: true, isTSX: true, allExtensions: true}],
//     ["@babel/plugin-proposal-class-properties", { loose: true }],
//     ["@babel/plugin-proposal-nullish-coalescing-operator"],
//     ["@babel/plugin-proposal-optional-chaining"],
//     //["@babel/plugin-syntax-dynamic-import"],
//     //["@babel/plugin-transform-react-jsx", {pragma: "React.createElement"}],
//     //[require.resolve("./tools/babel-plugins/iife-wrap")],
//     //["@babel/plugin-transform-modules-commonjs", { noInterop: true, strict: true /**lazy: true*/ }],
//     //["babel-plugin-inline-react-svg"],
//     ["babel-plugin-transform-react-pug"],
//     ["babel-plugin-polished"],
//     ["babel-plugin-macros"],
//     ["babel-plugin-add-import-extension"],
//     [
//       "babel-plugin-module-resolver",
//       {
//         root: ["."],
//         extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"],
//         alias: createAliasConfig("src")
//       }
//     ]
//     //"react-refresh/babel"
//   ],
//   comments: false
// };