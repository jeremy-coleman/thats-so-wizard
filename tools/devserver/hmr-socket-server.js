'use strict';

var net = require('net');
var _ = require('lodash');
var http = require('http');
var socketio = require('socket.io');
var readline = require('readline');
const {polka} = require('./polka')

function has(object, propName) {
  return Object.prototype.hasOwnProperty.call(object, propName);
}

function log(...args) {
  let msg = [new Date().toTimeString(), '[HMR]'].concat(args)
  console.log(...msg)
}

var parent = new net.Socket({fd: 3});

var parentReadline = readline.createInterface({
  input: parent,
  output: process.stdout,
  terminal: false
});

var hostname
var port
var currentModuleData = {};
var uncommittedNewModuleData = {};

var runServer = _.once(() => {

  var app = polka();
  var server = http.Server(app);
  var io = new socketio(server);
  
  io.on('connection', (socket) => {
    socket.on('sync', (syncMsg) => {
      log('User connected, syncing');

      var newModuleData = _.chain(currentModuleData)
        .toPairs()
        .filter((pair) => !has(syncMsg, pair[0]) || syncMsg[pair[0]].hash !== pair[1].hash)
        .fromPairs()
        .value();

      var removedModules = _.chain(syncMsg)
        .keys()
        .filter(function(name) {
          return !has(currentModuleData, name);
        })
        .value();

      socket.emit('sync confirm', null);

      if (Object.keys(newModuleData).length || removedModules.length){
        socket.emit('new modules', {newModuleData: newModuleData, removedModules: removedModules});
      }

    });

  });

  server.listen(port, hostname, () => {
    log('Listening on '+hostname+':'+port);
  });

  return io;
});


function sendToParent(data) {
  parent.write(JSON.stringify(data)+'\n');
}




parentReadline.on("line", line => {
  var msg = JSON.parse(line);

  switch (msg.type) {
    case "config":
      {
        hostname = msg.hostname;
        port = msg.port;
      }
      break;

    case "newModule":
      {
        uncommittedNewModuleData[msg.name] = msg.data;
      }
      break;

    case "removedModules":
      {
        sendToParent({ type: "confirmNewModuleData" });
        _.assign(currentModuleData, uncommittedNewModuleData);
        var io = runServer();

        msg.removedModules.forEach((name) => {
          delete currentModuleData[name];
        });

        if (
          Object.keys(uncommittedNewModuleData).length ||
          msg.removedModules.length
        ) {
          log("Emitting updates");

          io.emit("new modules", {
            newModuleData: uncommittedNewModuleData,
            removedModules: msg.removedModules
          });
        }

        uncommittedNewModuleData = {};
      }
      break;

    default: {
      log("Unknow message type", msg.type);
    }
  }
});


parent.on('finish', () => {
  process.exit(0);
});
