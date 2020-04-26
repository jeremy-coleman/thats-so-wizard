const path = require("path");
const { through_v1 } = require("./streams");
const less = require("less");
const { PassThrough } = require("stream");

function lessify(file, opts) {
  var input = "";

  if (/\.less$/i.test(file) === false) {
    return new PassThrough();
  }

  function write(data) {
    input += data;
  }

  function end() {
    var self = this;
    var lessOpts = opts || {};
    var autoInject = typeof lessOpts["auto-inject"] == "undefined" || !!lessOpts["auto-inject"];
    function jsToLoad(css) {
      var stringifiedCss = JSON.stringify(css);
      if (autoInject) {
        const out = `var css = ${stringifiedCss}; (require('insert-css'))(css); module.exports = css;`
        return out
      }
      else {
        return "module.exports = " + stringifiedCss;
      }
    }
  
    lessOpts.filename = file;
    lessOpts.paths = lessOpts.paths
      ? lessOpts.paths.concat([path.dirname(file)])
      : [path.dirname(file)];

    less.render(input, lessOpts, function(err, output) {
      if (err) {
        self.emit("error", new Error(err.message + ": " + err.filename + "(" + err.line + ")"));
      } else {
        self.queue(jsToLoad(output.css));
      }
      output.imports.forEach(function(f) {
        self.emit("file", f);
      });
      self.queue(null);
    });
  }

  return through_v1(write, end);
}

module.exports = {
  lessify
};
