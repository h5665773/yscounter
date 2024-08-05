const fs = require("fs");
const comportFile = './public/comport.txt';
const args = process.argv.slice(2);
console.log('arg:', args);
fs.writeFileSync(comportFile, args[0]);