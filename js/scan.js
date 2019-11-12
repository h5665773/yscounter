!function () {
  	'use strict';
	var exec = require('child_process').exec,
          child;
	module.exports = function (cb) {
		var scanEmpId ="";
		exec("node scan.js" , function(err ,data ,c){
	        if(err == null && data.length > 0){

	          data = data.trim();
	          var parse = data.match(/([A-Z]{1}[0-9]+)([A-Z]?)/);
	          //cb(parse,false);
	          if(parse == null){
	          	//error callback
	          	cb("刷入資料錯誤",true);
	          }else{
	          	scanEmpId = parse[1];
	          	cb(scanEmpId,false);
	          }
	        }else{
	          //error callback
	          cb(err,true);
	        }
	    });
	};
}();
