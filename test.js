const request = require('request')
function doRequest(url) {
  return new Promise(function (resolve, reject) {
    request(url, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        resolve(body.substr(0,10));
      } else {
        reject(error);
      }
    });
  });
}

// Usage:

async function main() {
  let res = await doRequest('https://www.google.com');
  console.log(res);
  console.log(123)
}

main();