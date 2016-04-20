var exec = require('child_process').exec,
    child;
var http = require('http');
exec("python test.py" , function(err ,data ,c){
    error = err;
    if(err == null && data.length > 0){
    	data = data.trim();
    	var options = {
		  hostname: '61.220.182.219',
		  port: 80,
		  path: '/api/custByEmp/000/000/'+data
		};
    	var req = http.request(options, function(res) {
		  	console.log('STATUS: ' + res.statusCode);
		  	console.log('HEADERS: ' + JSON.stringify(res.headers));
		  	res.setEncoding('utf8');
		  	res.on('data', function (chunk) {
		  		console.log(chunk);
		    	sc = JSON.parse(chunk)[0];
		    });
		});
		req.on('error', function(e) {
		  console.log('problem with request: ' + e.message);
		});

		req.end();
    }
    console.log(data);
});