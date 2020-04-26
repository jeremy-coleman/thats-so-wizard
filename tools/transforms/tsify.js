
var stream = require("stream");
const {Transform, PassThrough} = require('stream')
let ts = require("typescript")


var tsify = configure()

module.exports = tsify
module.exports.tsify = tsify
module.exports.configure = configure;

var tsconfig = {
  module: "esnext", //ts.ModuleKind.UMD,
  target: "esnext",
  allowJs: true,
  jsx:"react",
  jsxFactory: "h",
  preserveConstEnums: true,
  //emitBOM: false,
  experimentalDecorators: true,
  //esModuleInterop: true,
  alwaysStrict: true,
  removeComments:true,
  baseUrl: './src',
  sourceMap: false
}

function initConfig(filePath){
 return {
    fileName: filePath,
    compilerOptions:tsconfig
  }
}

function configure(tscOpts = "FIXME") {
  return function (filename) {

    if (/\.[tj]sx?$/i.test(filename) === false) {
      return new PassThrough();
    }
    
    const tsConfigObject = initConfig(filename)
    if (tsConfigObject === null) {
      return stream.PassThrough();
    }
    return new TypescriptStream(tsConfigObject);
  };
}

class TypescriptStream extends Transform {
  constructor(opts) {
    super();
    this._data = [];
    this._opts = opts;
  }
  _transform(buf, enc, callback) {
    this._data.push(buf);
    callback();
  }
  _flush(callback) {
    // Merge the chunks before transform
    const data = Buffer.concat(this._data).toString();
    try{
      let result = ts.transpileModule(data, this._opts)
      var code = result !== null ? result.outputText : data;
      this.push(code);
      callback();
    }
    catch(e){
      callback(e)
    }
  }
}
