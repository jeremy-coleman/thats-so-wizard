"use strict";

var path = require("path");
var cproc = require("child_process");
const { EventEmitter } = require("events");
var crypto = require("crypto");
var readline = require("readline");
var _ = require("lodash");
const through = require("through2");

const createTemplate = () => {
  return `
    (function(global, _main, moduleDefs, cachedModules, _entries) {
      'use strict';
    
      var moduleMeta = null/*!^^moduleMeta*/;
      var originalEntries = null/*!^^originalEntries*/;
      var updateUrl = null/*!^^updateUrl*/;
      var updateMode = null/*!^^updateMode*/;
      var supportModes = null/*!^^supportModes*/;
      var ignoreUnaccepted = null/*!^^ignoreUnaccepted*/;
      var updateCacheBust = null/*!^^updateCacheBust*/;
      var bundleKey = null/*!^^bundleKey*/;
      var sioPath = null/*!^^sioPath*/;
      var incPath = null/*!^^incPath*/;
    
      if (!global._hmr) {
        try {
          Object.defineProperty(global, '_hmr', {value: {}});
        } catch(e) {
          global._hmr = {};
        }
      }
    
      if (!Object.prototype.hasOwnProperty.call(global._hmr, bundleKey)) {
        // Temporary hack so requiring modules works before the _hmr values are
        // correctly initialized.
        global._hmr[bundleKey] = {initModule: function(){}};
      }
    
      var main = require(incPath);
      var isFirstRun = main(
        moduleDefs,
        cachedModules,
        moduleMeta,
        updateUrl,
        updateMode,
        supportModes,
        ignoreUnaccepted,
        updateCacheBust,
        bundleKey,
        sioPath ? require(sioPath) : null,
        typeof __filename !== 'undefined' && __filename,
        typeof __dirname !== 'undefined' && __dirname
      );

      if (isFirstRun) {
        for (var i=0, len=originalEntries.length; i<len; i++) {
          require(originalEntries[i]);
        }
      }

    }).call(
      this,
      typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},
      arguments[3],
      arguments[4],
      arguments[5],
      arguments[6]
    );`
};


const syncQueues = new WeakMap();

function noop() {}

function rethrow(e) {
  throw e;
}

function synchd(scopeKey, fn) {
  const waitOn = syncQueues.get(scopeKey) || Promise.resolve();
  const p = waitOn.then(fn);
  syncQueues.set(scopeKey, p.then(noop, noop));
  return p.catch(rethrow);
}

function has(object, propName) {
  return Object.prototype.hasOwnProperty.call(object, propName);
}

function defer() {
  const resolver = {};
  resolver.promise = new Promise((resolve, reject) => {
    Object.assign(resolver, {
      resolve,
      reject,
      fulfill: resolve
    });
  });
  return resolver;
}

function hashStr(str) {
  var hasher = crypto.createHash("sha256");
  hasher.update(str);
  return hasher.digest("base64").slice(0, 20);
}

var DEFAULT_OPTIONS = {
  mode: "websocket",
  updateMode: "websocket",
  port: 3123,
  hostname: "localhost",
  updateCacheBust: false,
  bundleKey: "websocket_null",
  supportModes: ["websocket"],
  noServe: false,
  ignoreUnaccepted: true,
  basedir: process.cwd()
};

function HotModulePlugin(bundle, opts) {
  const {
    updateMode,
    port,
    hostname,
    updateCacheBust,
    bundleKey,
    supportModes,
    ignoreUnaccepted,
    basedir
  } = DEFAULT_OPTIONS;

  var server
  var em = new EventEmitter();
  var incPath = "./" + path.relative(basedir, require.resolve("./hmr-inc.js"));
  var sioPath = './'+path.relative(basedir, require.resolve('socket.io-client/dist/socket.io.slim.js'));
  var serverCommLock = {};
  var nextServerConfirm = defer();
  var currentModuleData = {};

  function sendToServer(data) {
    return new Promise((resolve, reject) => {
      server.stdio[3].write(JSON.stringify(data), err => {
        if (err) return reject(err);
        server.stdio[3].write("\n", err => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }

  var runServer = _.once(() => {

    // Start a new process with an extra socket opened to it.
    // See https://github.com/nodejs/node-v0.x-archive/issues/5727 for a
    // description. It's faster than using `process.send`.

    server = cproc.spawn(process.argv[0], [__dirname + "/hmr-socket-server.js"], {
      stdio: ["inherit", "inherit", "inherit", "pipe"]
    });

    var childReadline = readline.createInterface({
      input: server.stdio[3],
      output: process.stdout,
      terminal: false
    });

    childReadline.on("line", line => {
      var msg = JSON.parse(line);

      if (msg.type === "confirmNewModuleData") {
        nextServerConfirm.resolve();
        nextServerConfirm = defer();
      } else {
        console.warn(
          "[HMR builder] Unknown message type from server:",
          msg.type
        );
      }
    });

    server.stdio[3].on("finish", () => {
      em.emit(
        "error",
        new Error("Browserify-HMR lost connection to socket server")
      );
    });

    return sendToServer({
      type: "config",
      hostname: hostname,
      port: port
    })
  });

  
  function setNewModuleData(moduleData) {
    return runServer().then(() => {
      
      var newModuleData = _.chain(moduleData)
        .toPairs()
        .filter(pair => pair[1].isNew)
        .map(pair => {
          return [
            pair[0],
            {
              index: pair[1].index,
              hash: pair[1].hash,
              source: pair[1].source,
              parents: pair[1].parents,
              deps: pair[1].deps
            }
          ];
        })
        .fromPairs()
        .value();

      
      // var newModuleData1 = Object.values(Object.fromEntries(Object.entries(moduleData)
      // .filter(pair => pair[1].isNew)
      // .map(pair => {
      //   return [
      //     pair[0],
      //     {
      //       index: pair[1].index,
      //       hash: pair[1].hash,
      //       source: pair[1].source,
      //       parents: pair[1].parents,
      //       deps: pair[1].deps
      //     }
      //   ];
      // })))

      var removedModules = _.chain(currentModuleData)
        .keys()
        .filter(name => !has(moduleData, name))
        .value();

      currentModuleData = moduleData;

      // This following block talking to the server should execute serially,
      // never concurrently.

      return synchd(serverCommLock, () => {
        // Don't send all of the module data over at once, send it piece by
        // piece. The socket server won't apply the changes until it gets the
        // type:"removedModules" message.

        return Object.keys(newModuleData)
          .reduce((promise, name) => {
            return promise.then(() => {
              return sendToServer({
                type: "newModule",
                name: name,
                data: newModuleData[name]
              });
            });
          }, Promise.resolve())
          .then(() => {
            return sendToServer({
              type: "removedModules",
              removedModules: removedModules
            });
          });
      })
      .then(() => {
        // Waiting for the response doesn't need to be in the exclusive section.
        return nextServerConfirm.promise;
      });
    });
  }

  function fileKey(filename) {
    return path.relative(basedir, filename);
  }

  var hmrManagerFilename = path.join(basedir, "__hmr_manager.js");

  // keys are filenames, values are {hash, transformedSource}
  var transformCache = {};

  function setupPipelineMods() {
    var originalEntries = [];
    var moduleMeta = {};
    var moduleData = {};
    var newTransformCache = {};
    var managerRow = null;
    var rowBuffer = [];

    bundle.pipeline.get("record").push(
      through.obj(
        function(row, enc, next) {
          if (row.entry) {
            originalEntries.push(row.file);
            next(null);
          } else {
            next(null, row);
          }
        },
        function(next) {
          var source = [sioPath, incPath]
            .filter(Boolean)
            .concat(originalEntries)
            .map(function(name) {
              return "require(" + JSON.stringify(name) + ");\n";
            })
            .join("");

          // Put the hmr file name in basedir to prevent this:
          // https://github.com/babel/babelify/issues/85

          this.push({
            entry: true,
            expose: false,
            basedir: undefined,
            file: hmrManagerFilename,
            id: hmrManagerFilename,
            source: source,
            order: 0
          });
          next();
        }
      )
    );

    function makeModuleMetaEntry(name) {
      if (!has(moduleMeta, name)) {
        moduleMeta[name] = {
          index: null,
          hash: null,
          parents: []
        };
      }
    }

    bundle.pipeline.get("deps").push(
      through.obj(function(row, enc, next) {
        if (row.file !== hmrManagerFilename) {
          makeModuleMetaEntry(fileKey(row.file));
          _.forOwn(row.deps, function(name, ref) {
            // dependencies that aren't included in the bundle have the name false
            if (name) {
              makeModuleMetaEntry(fileKey(name));
              moduleMeta[fileKey(name)].parents.push(fileKey(row.file));
            }
          });
        }
        next(null, row);
      })
    );

    if (bundle.pipeline.get("dedupe").length > 1) {
      console.warn(
        "[HMR] Warning: other plugins have added dedupe transforms. This may interfere."
      );
    }
    // Disable dedupe transforms because it screws with our change tracking.
    bundle.pipeline.splice("dedupe", 1, through.obj());

    bundle.pipeline.get("label").push(
      through.obj(
        function(row, enc, next) {
          if (row.file === hmrManagerFilename) {
            managerRow = row;
            next(null);
          } else {
            // row.id used when fullPaths flag is used
            moduleMeta[fileKey(row.file)].index = has(row, "index")
              ? row.index
              : row.id;

            var hash = (moduleMeta[fileKey(row.file)].hash = hashStr(
              row.source
            ));
            var originalSource = row.source;
            var isNew, thunk;
            if (
              has(transformCache, row.file) &&
              transformCache[row.file].hash === hash
            ) {
              isNew = false;
              row.source = transformCache[row.file].transformedSource;
              newTransformCache[row.file] = transformCache[row.file];
              thunk = _.constant(row);
            } else {
              isNew = true;
              thunk = function() {
                const wrapped_row_source = `
              _hmr[${JSON.stringify(bundleKey)}].initModule(${JSON.stringify(
                  fileKey(row.file)
                )}, module);
              (function(){
                ${row.source}
              }).apply(this, arguments);
          `;

                row.source = wrapped_row_source;
                newTransformCache[row.file] = {
                  hash: hash,
                  transformedSource: row.source
                };
                return row;
              };
            }

            moduleData[fileKey(row.file)] = {
              isNew: isNew,
              index: moduleMeta[fileKey(row.file)].index,
              hash: hash,
              source: originalSource,
              parents: moduleMeta[fileKey(row.file)].parents,
              deps: row.indexDeps || row.deps
            };

            // Buffer everything so we can get the websocket stuff done sooner
            // without being slowed down by the final bundling.
            rowBuffer.push(thunk);
            next(null);
          }
        },
        function(done) {
          var self = this;
          transformCache = newTransformCache;

          setNewModuleData(moduleData)
            .then(() => rowBuffer.forEach(thunk => self.push(thunk())))
            .then(() => {
              managerRow.source = createTemplate()
              .replace('null/*!^^moduleMeta*/', _.constant(JSON.stringify(moduleMeta)))
              .replace('null/*!^^originalEntries*/', _.constant(JSON.stringify(originalEntries)))
              //.replace('null/*!^^updateUrl*/', _.constant(JSON.stringify(updateUrl)))
              .replace('null/*!^^updateMode*/', _.constant(JSON.stringify(updateMode)))
              .replace('null/*!^^supportModes*/', _.constant(JSON.stringify(supportModes)))
              .replace('null/*!^^ignoreUnaccepted*/', _.constant(JSON.stringify(ignoreUnaccepted)))
              .replace('null/*!^^updateCacheBust*/', _.constant(JSON.stringify(updateCacheBust)))
              .replace('null/*!^^bundleKey*/', _.constant(JSON.stringify(bundleKey)))
              .replace('null/*!^^sioPath*/', _.constant(JSON.stringify(sioPath)))
              .replace('null/*!^^incPath*/', _.constant(JSON.stringify(incPath)));

              self.push(managerRow);
            })
            .then(done, done);
        }
      )
    );
  }

  setupPipelineMods();

  bundle.on("reset", setupPipelineMods);

  return em;
}

module.exports = HotModulePlugin;
