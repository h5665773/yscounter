const SerialPort = require('serialport');
async function listComport() {
    let ports = await SerialPort.list();
    let comports = [];
    ports.forEach(function (port) {
      if (String(port.comName).match(/^COM\d+/)){
        comports.push(port.comName);
      }
    });
    return comports;
}
listComport().then(function (comports) {
    console.log(JSON.stringify(comports));
});