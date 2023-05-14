// const SerialPort = require('serialport');
const { SerialPort } = require('serialport')
const fs = require("fs");
var com = fs.readFileSync('./public/comport.txt').toString()
var d = new Date()
var end = new Date()
const startSec = d.getTime()
var returnStr = "";
// const port = new SerialPort('com' + com);
const port = new SerialPort({path: 'COM' + com, baudRate: 9600});
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
var checkClose = function () {
	//console.log(e.getTime() + "-" +startSec + " = " + (e.getTime()-startSec));
	e = new Date()
	if (returnStr != "") {
		console.log(returnStr);
		startSec = 0;
	} else {

		if (e.getTime() - startSec > 20000) {
			if (port.closing == false) {
				console.log(port);
				port.close();
			}
		}
	}
}
port.timeout = 20000;
// Switches the port into "flowing mode"
port.on('data', function (data) {
	returnStr = data.toString().substr(0, 6)
	console.log(returnStr);
})

port.on('error', function (e) {
	console.log(e);
});
port.on('open', function () {
	var refreshIntervalId = setInterval(function () {
		end = new Date()
		if (end.getTime() - startSec > 20000 || returnStr != "") {
			port.close();
			clearInterval(refreshIntervalId);
		}
	}, 1000);

	/* later */

});