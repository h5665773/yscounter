//require('nw.gui').Window.get().maximize()
var fs = require('fs');
var versionFile = "public/v.txt";
var version = require('./package.json').version;
var http = require('http');
var config = require("./config.js");
var jade = require("jade");
var custFile = "public/custid.txt";
var currentCust = fs.readFileSync(custFile, { encoding: 'utf-8' });
var currentCustName = ""
var displayLogo = true;
var logs = console.log;
var d = new Date();
$(document).ready(function () {
  http.get(config.apiHost + 'api/custName/' + currentCust + '/0/0', (res) => {
    var resContent = "";
    res.on('data', (d) => {
      resContent += d;
      //$("#message").html(news[0].F_MESSAGE);
    });
    res.on('end', function () {
      var cust = JSON.parse(resContent);
      $("#companyName").html(cust[0].F_CU_NAME)
      currentCustName = cust[0].F_CU_NAME
    });
    res.resume();
  });
  if (currentCust.substr(0, 1) == "W") {
    displayLogo = false;
  }
  var navHtml = fs.readFileSync("views/nav.html", { encoding: 'utf-8' });
  $("nav").html(navHtml);
  var footerJade = jade.compileFile("views/footer.jade");
  var footerHtml = footerJade({ year: d.getFullYear() });
  $("footer").html(footerHtml);
  var timerVar = setInterval(myTimer, 1000);

  function myTimer() {
    var d = new Date();
    document.getElementById("globalTimer").innerHTML = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " " + d.toLocaleTimeString();
  }
  $.ajax({
    type: `post`,
    url: `http://admin.wyattst.com.tw/YSWEB/XMLFORM/AjaxOrder.aspx`,
    data: {
      Order: `Get_YSCounterVersion`
    },
    dataTYpe: `json`,
    success: function (data) {
      let ver, block, detail;
      let nowVer, nowBlock, nowDetail;
      [ver, block, detail] = data.split('.');
      [nowVer, nowBlock, nowDetail] = version.split('.');
      if (parseInt(nowVer * 10000) + parseInt(nowBlock * 100) + parseInt(nowDetail) < parseInt(ver * 10000) + parseInt(block * 100) + parseInt(detail)) {
        var download = require("url-download");
        var unzip = require("unzipper");
        download(config.updateURL, './')
          .on('close', function () {
            console.log('One file has been downloaded.');
            //fs.createReadStream('master.zip').pipe(unzip.Extract({ path: '../test/download' }));
            fs.createReadStream('master.zip')
              .pipe(unzip.Parse())
              .on('entry', function (entry) {
                var fileName = entry.path;
                var type = entry.type; // 'Directory' or 'File' 
                var size = entry.size;
                if (fileName.match(/comport\.txt|custid\.txt/) || fileName.match(/\/$/)) {
                  entry.autodrain();
                } else {
                  let fwt = fs.createWriteStream('.' + fileName.replace("yscounter-master", ""));
                  entry.pipe(fwt);
                  fwt.on('error', (err) => {
                    console.log(err);
                  });
                }
              });
            exec("npm i", function (err, data, c) {
              loadingMask.css("display", "none");
              loading.css("display", "none");
              loading.removeClass("rotateIn");
              loading.addClass("rotateOut");
              $(".updateSuccess").show();
              console.log(err);
              console.log(data);
              console.log(c);
              setTimeout(function () { chrome.runtime.reload(); }, 1500);
            });
            fs.writeFileSync(versionFile, data, { encoding: 'utf-8' });
          });
      } else if (parseInt(nowVer * 10000) + parseInt(nowBlock * 100) + parseInt(nowDetail) > parseInt(ver * 10000) + parseInt(block * 100) + parseInt(detail)) {
        $.ajax({
          type: `post`,
          url: `http://admin.wyattst.com.tw/YSWEB/XMLFORM/AjaxOrder.aspx`,
          data: {
            Order: `Update_YSCounterVersion`,
            VersionNo: version,
          },
          success: function () {
            console.log(`SQL Data Updated`);
          }
        })
      }
    }
  })
});
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}