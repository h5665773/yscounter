var download = require("url-download");
var unzip = require("unzip");
var fs = require("fs");
var i = 0;
download('https://github.com/Hash543/yscounter/archive/master.zip', './')
    .on('close', function () {
      console.log('One file has been downloaded.');
      //fs.createReadStream('master.zip').pipe(unzip.Extract({ path: '../test/download' }));
      fs.createReadStream('master.zip')
        .pipe(unzip.Parse())
        .on('entry', function (entry) {
          var fileName = entry.path;
          var type = entry.type; // 'Directory' or 'File' 
          var size = entry.size;
          //console.log(fileName.replace("yscounter-master",""));
          if (fileName.match(/\.js$/)) {
            i++;
            entry.pipe(fs.createWriteStream('.'+fileName.replace("yscounter-master","")));
          } else {
            entry.autodrain();
          }
        });
    });