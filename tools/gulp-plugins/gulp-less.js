var path           = require('path');
var through2       = require('through2');
var replaceExt     = require('replace-ext');
var applySourceMap = require('vinyl-sourcemaps-apply');
var PluginError    = require('plugin-error');
var less = require("less")

//var less           = accord.load('less');


module.exports = function (options) {
  //options.paths = options.paths ? lessOpts.paths.concat([path.dirname(file)]) : [path.dirname(file)];

  // Mixes in default options.
  var opts = Object.assign({}, {
    compress: false,
    paths: []
  }, options);


  return through2.obj(function(file, enc, cb) {

    if (file.isNull()) {
      return cb(null, file);
    }

    if (file.isStream()) {
      return cb(new PluginError('gulp-less', 'Streaming not supported'));
    }


    var str = file.contents.toString();

    // Injects the path of the current file
    opts.filename = file.path;

    // Bootstrap source maps
    if (file.sourceMap) {
      opts.sourcemap = true;
    }

    
    less.render(str, opts).then(function(res) {

      //console.log(Object.keys(res))

      file.contents = Buffer.from(res.css);

      file.path = replaceExt(file.path, '.css');

       if (res.map) {
        res.map.file = file.relative;
        res.map.sources = res.map.sources.map(function (source) {
          return path.relative(file.base, source);
        });

        applySourceMap(file, res.map);
      }

      return file
    })
    .then(function(file) {
      cb(null, file);
    })
    .catch(function(err) {
      // Convert the keys so PluginError can read them
      err.lineNumber = err.line;
      err.fileName = err.filename;

      // Add a better error message
      err.message = err.message + ' in file ' + err.fileName + ' line no. ' + err.lineNumber;
      return cb(new PluginError('gulp-less', err));
    })
  })}


//   interface Options {
//     sourceMap?: SourceMapOption;
//     /** Filename of the main file to be passed to less.render() */
//     filename?: string;
//     /** The locations for less looking for files in @import rules */
//     paths?: string[];
//     /** True, if run the less parser and just reports errors without any output. */
//     lint?: boolean;
//     /** Pre-load global Less.js plugins */
//     plugins?: Plugin[];
//     /** @deprecated If true, compress using less built-in compression. */
//     compress?: boolean;
//     strictImports?: boolean;
//     /** If true, allow imports from insecure https hosts. */
//     insecure?: boolean;
//     depends?: boolean;
//     maxLineLen?: number;
//     /** @deprecated If false, No color in compiling. */
//     color?: boolean;
//     /** @deprecated False by default. */
//     ieCompat?: boolean;
//     /** @deprecated If true, enable evaluation of JavaScript inline in `.less` files. */
//     javascriptEnabled?: boolean;
//     /** Whether output file information and line numbers in compiled CSS code. */
//     dumpLineNumbers?: "comment" | string;
//     /** Add a path to every generated import and url in output css files. */
//     rootpath?: string;
//     /** Math mode options for avoiding symbol conficts on math expressions. */
//     math?: 'always' | 'strict' | 'parens-division' | 'parens' | 'strict-legacy' | number;
//     /** If true, stops any warnings from being shown. */
//     silent?: boolean;
//     /** Without this option, Less attempts to guess at the output unit when it does maths. */
//     strictUnits?: boolean;
//     /** Defines a variable that can be referenced by the file. */
//     globalVars?: {
//       [key: string] : string,
//     };
//     /** Puts Var declaration at the end of base file. */
//     modifyVars?: {
//       [key: string] : string,
//     };
//     /** Read files synchronously in Node.js */
//     syncImport?: boolean;
// }