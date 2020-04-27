var fs= require('fs')

function getFileSize(filePath) {
    var size = fs.statSync(filePath).size;
    var i = Math.floor(Math.log(size) / Math.log(1024));
    return (
      (size / Number(Math.pow(1024, i))).toFixed(2) +
      " " +
      ["B", "KB", "MB", "GB", "TB"][i]
    );
}