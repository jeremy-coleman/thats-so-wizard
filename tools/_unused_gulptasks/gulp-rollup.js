"use strict";

var PLUGIN_NAME = "gulp-rollup";

var util = require("util");
var PluginError = require("plugin-error");
var File = require("vinyl");
var Transform = require("stream").Transform;
var path = require("path");

//2.3 or so as of this writing
const { rollup } = require("rollup");

var rollupBundler = rollup;

function cloneWithBlacklist(obj) {
  var out = {};
  outer: for (var key in obj) {
    for (var i = 1; i < arguments.length; ++i) {
      if (arguments[i] === key) {
        continue outer;
      }
    }
    out[key] = obj[key];
  }

  return out;
}

function deepEqual(a, b) {
  if (typeof a !== "object" || typeof b !== "object") {
    return a === b;
  }
  var key;
  for (key in a) {
    if (!(key in b) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }
  for (key in b) {
    if (!(key in a)) {
      return false;
    }
  }
  return true;
}

function deExternalizePath(path) {
  if (/^(\.?\.?|[A-Za-z]:)\//.test(path)) {
    return path;
  } else {
    // path is external
    return "./" + path;
  }
}


const normalizeInputOption = v => {
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) {
    if (v.some(f => typeof f !== "string")) {
      console.warn("rollups config[input] should be an array of strings");
      console.warn("revieved type Array with NON-STRING values of shape", v);
      console.warn("attemping to coerse input to strings");
      let fixed = v.map(_ => _.toString());
      console.warn("modifying config[input] to", fixed);
      return fixed;
    } else return v;
  }
  if (typeof v === "object") {
    console.warn("rollups config[input] should be an array of strings");
    console.warn("recieved type Object of shape", v);
    console.warn("attemping to coerse input to strings");
    let temp = [];
    let _t = Object.entries(v).map(_ => _);
    _t.forEach(k => {
      if (k[1]) temp.push(k[1]);
      else if (k[0]) temp.push(k[0]);
    });
    let fixed = temp.flat([1]);
    console.warn("modifying config[input] to", fixed);
    return fixed;
  } else return console.warn("your config is fucked");
};

/**
  const badPaths = {
    app: 'src/app.tsx',
    sever: 'src/server.ts',
    other: ['src/server.ts', 'thing.tsx']
  }
  const badArray = [3, '5']
  console.log(normalizeInputOption(badPaths)) good
  console.log(normalizeInputOption(badArray)) good
*/

function GulpRollup(options) {
  var self = this;

  Transform.call(self, { objectMode: true });

  var options0 = options || {};
  options = cloneWithBlacklist(
    options0,
    "rollup",
    "allowRealFiles",
    "impliedExtensions",
    "separateCaches",
    "generateUnifiedCache"
  );

  var rollup = options0.rollup || rollupBundler;
  var allowRealFiles = options0.allowRealFiles;
  var impliedExtensions = options0.impliedExtensions;

  if (impliedExtensions === undefined) {
    impliedExtensions = [".js"];
  } 
  else if (impliedExtensions !== false && !Array.isArray(impliedExtensions)) {
    throw new Error(
      "options.impliedExtensions must be false, undefined, or an Array!"
    );
  }

  var unifiedCachedModules = options0.generateUnifiedCache && {};

  var separateCaches = options0.separateCaches;

  if (separateCaches) {
    separateCaches = cloneWithBlacklist(separateCaches);
  }

  var wonderland = {};
  var vinylFiles = {};
  var haveSourcemaps;

  self._transform = function (file, enc, cb) {
    if (!file.isBuffer()) {
      self.emit(
        "error",
        new PluginError(PLUGIN_NAME, "Input files must be buffered!")
      );
      return cb();
    }

    if (haveSourcemaps === undefined) {
      haveSourcemaps = file.sourceMap !== undefined;
    } 
    else if (haveSourcemaps !== (file.sourceMap !== undefined)) {
      self.emit(
        "error",
        new PluginError(
          PLUGIN_NAME,
          "Mixing of sourcemapped and non-sourcemapped files!"
        )
      );
      return cb();
    }

    var nonExternalFilePath = deExternalizePath(file.path);

    if (haveSourcemaps) {
      wonderland[nonExternalFilePath] = {
        code: file.contents.toString(),
        map: file.sourceMap
      };
    } 
    else {
      wonderland[nonExternalFilePath] = file.contents.toString();
    }
    vinylFiles[nonExternalFilePath] = file;

    cb();
  };

  self._flush = function (cb) {
    if (!options.plugins) {
      options.plugins = [];
    } else if (!Array.isArray(options.plugins)) {
      options.plugins = [options.plugins];
    }

    options.plugins = options.plugins.concat(
      hypothetical({
        files: wonderland,
        allowFallthrough: allowRealFiles,
        impliedExtensions: impliedExtensions
      })
    );

    if (options.output) {
      options.output.sourcemap = haveSourcemaps;
    } else {
      options.sourcemap = haveSourcemaps;
    }

    var vinylSystem = hypothetical({
      files: vinylFiles,
      allowFallthrough: true,
      impliedExtensions: impliedExtensions
    });

    var options1 = options;

    Promise.resolve(normalizeInputOption(options["input"]))
      .then(function (entryFiles) {
        return Promise.all(
          entryFiles.map(function (entryFile) {
            var options = cloneWithBlacklist(options1);
            options.input = entryFile;

            if (
              separateCaches &&
              Object.prototype.hasOwnProperty.call(separateCaches, entryFile)
            ) {
              options.cache = separateCaches[entryFile];
            }

            return rollupBundler(options)
              .then(function (bundle) {

                //console.log("opts", options);
                //console.log("bundle", bundle);

                self.emit("bundle", bundle, entryFile);

                if (unifiedCachedModules) {
                  var modules = bundle.modules;
                  for (var i = 0; i < modules.length; ++i) {
                    var module = modules[i],
                      id = module.id;
                    if (
                      Object.prototype.hasOwnProperty.call(
                        unifiedCachedModules,
                        id
                      )
                    ) {
                      if (!deepEqual(module, unifiedCachedModules[id])) {
                        throw new Error(
                          'Conflicting caches for module "' + id + '"!'
                        );
                      }
                    } else {
                      unifiedCachedModules[id] = module;
                    }
                  }
                }

                return bundle.generate(options);
              })
              .then(function (result) {
                //console.log('result', result)
                //console.log('entryFile', entryFile)

                // get the corresponding entry Vinyl file to output with.
                // this makes file.history work. maybe expando properties too if you use them.
                var file = vinylSystem.resolveId(entryFile);
                if (file !== undefined) {
                  file = vinylSystem.load(file);
                }

                if (file === undefined) {
                  // possible if options.allowRealFiles is true
                  file = new File({
                    path: entryFile,
                    contents: Buffer.from(result.output[0].code)
                  });
                } else {
                  file.contents = Buffer.from(result.output[0].code);
                }

                var map = result.map;
                if (map) {
                  // This makes sure the paths in the generated source map (file and
                  // sources) are relative to file.base:
                  map.file = unixStylePath(file.relative);
                  map.sources = map.sources.map(function (fileName) {
                    return unixStylePath(path.relative(file.base, fileName));
                  });
                  file.sourceMap = map;
                }

                self.push(file);
              });
          })
        );
      })
      .then(function () {
        if (unifiedCachedModules) {
          var modules = [];
          for (var id in unifiedCachedModules) {
            modules.push(unifiedCachedModules[id]);
          }
          self.emit("unifiedcache", { modules: modules });
        }
        cb(); // it's over!
      })
      .catch(function (err) {
        setImmediate(function () {
          self.emit("error", new PluginError(PLUGIN_NAME, err));
          cb();
        });
      });
  };
}

util.inherits(GulpRollup, Transform);

function unixStylePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function main(options) {
  return new GulpRollup(options);
};

module.exports = main

//virtual fs plugin

function hypothetical(opts) {
  var path = require("path").posix;

  function isAbsolute(p) {
    return path.isAbsolute(p) || /^[A-Za-z]:\//.test(p);
  }

  function isExternal(p) {
    return !/^(\.?\.?|[A-Za-z]:)\//.test(p);
  }

  function absolutify(p, cwd) {
    if (cwd) {
      return path.join(cwd, p);
    } else {
      return "./" + p;
    }
  }

  function forEachInObjectOrMap(object, map, callback) {
    if (object && map) {
      throw Error("Both an Object and a Map were supplied!");
    }

    if (map) {
      map.forEach(callback);
    } else if (object) {
      for (var key in object) {
        callback(object[key], key);
      }
    }
    // if neither was supplied, do nothing.
  }

  var VIRTUAL_FS_PLUGIN = function createPlugin(options) {
    options = options || {};
    var files0 = options.files;
    var files0AsMap = options.filesMap;
    var allowFallthrough = options.allowFallthrough || false;
    var allowRelativeExternalFallthrough =
      options.allowRelativeExternalFallthrough || false;
    var allowExternalFallthrough = options.allowExternalFallthrough;
    if (allowExternalFallthrough === undefined) {
      allowExternalFallthrough = true;
    }
    var leaveIdsAlone = options.leaveIdsAlone || false;
    var impliedExtensions = options.impliedExtensions;
    if (impliedExtensions === undefined) {
      impliedExtensions = [".js", "/"];
    } else {
      impliedExtensions = Array.prototype.slice.call(impliedExtensions);
    }
    var cwd = options.cwd;
    if (cwd !== false) {
      if (cwd === undefined) {
        cwd = process.cwd();
      }
      cwd = unixStylePath(cwd);
    }

    var files = new Map();
    if (leaveIdsAlone) {
      forEachInObjectOrMap(files0, files0AsMap, function (contents, f) {
        files.set(f, contents);
      });
    } else {
      forEachInObjectOrMap(files0, files0AsMap, function (contents, f) {
        var unixStyleF = unixStylePath(f);
        var pathIsExternal = isExternal(unixStyleF);
        var p = path.normalize(unixStyleF);
        if (pathIsExternal && !isExternal(p)) {
          throw Error(
            'Supplied external file path "' +
              unixStyleF +
              '" normalized to "' +
              p +
              '"!'
          );
        }
        if (!isAbsolute(p) && !pathIsExternal) {
          p = absolutify(p, cwd);
        }
        files.set(p, contents);
      });
    }

    function basicResolve(importee) {
      if (files.has(importee)) {
        return importee;
      } else if (!allowFallthrough) {
        throw Error(dneMessage(importee));
      }
    }

    var resolveId = leaveIdsAlone
      ? basicResolve
      : function (importee, importer) {
          importee = unixStylePath(importee);

          // the entry file is never external.
          var importeeIsExternal = Boolean(importer) && isExternal(importee);

          var importeeIsRelativeToExternal =
            importer &&
            !importeeIsExternal &&
            isExternal(importer) &&
            !isAbsolute(importee);

          if (importeeIsExternal) {
            var normalizedImportee = path.normalize(importee);
            if (!isExternal(normalizedImportee)) {
              throw Error(
                'External import "' +
                  importee +
                  '" normalized to "' +
                  normalizedImportee +
                  '"!'
              );
            }
            importee = normalizedImportee;
          } else if (importeeIsRelativeToExternal) {
            var joinedImportee = path.join(path.dirname(importer), importee);
            if (!isExternal(joinedImportee)) {
              throw Error(
                'Import "' +
                  importee +
                  '" relative to external import "' +
                  importer +
                  '" results in "' +
                  joinedImportee +
                  '"!'
              );
            }
            importee = joinedImportee;
          } else {
            if (!isAbsolute(importee) && importer) {
              importee = path.join(path.dirname(importer), importee);
            } else {
              importee = path.normalize(importee);
            }
            if (!isAbsolute(importee)) {
              importee = absolutify(importee, cwd);
            }
          }

          if (files.has(importee)) {
            return importee;
          } else if (impliedExtensions) {
            for (var i = 0, len = impliedExtensions.length; i < len; ++i) {
              var extended = importee + impliedExtensions[i];
              if (files.has(extended)) {
                return extended;
              }
            }
          }

          if (importeeIsExternal && !allowExternalFallthrough) {
            throw Error(dneMessage(importee));
          }
          if (
            importeeIsRelativeToExternal &&
            !allowRelativeExternalFallthrough
          ) {
            throw Error(dneMessage(importee));
          }
          if (
            !importeeIsExternal &&
            !importeeIsRelativeToExternal &&
            !allowFallthrough
          ) {
            throw Error(dneMessage(importee));
          }

          if (importeeIsRelativeToExternal) {
            // we have to resolve this case specially because Rollup won't
            // treat it as external if we don't.
            // we have to trust that the user has informed Rollup that this import
            // is supposed to be external... ugh.
            return importee;
          }
        };

    return {
      name: "hypothetical",
      resolveId: resolveId,
      load: function (id) {
        if (files.has(id)) {
          return files.get(id);
        } else {
          id = resolveId(id);
          return id && files.get(id);
        }
      }
    };
  };

  function unixStylePath(p) {
    return p.split("\\").join("/");
  }

  function dneMessage(id) {
    return '"' + id + '" does not exist in the hypothetical file system!';
  }

  return VIRTUAL_FS_PLUGIN(opts);
}
