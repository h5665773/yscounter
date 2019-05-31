var http = require('http');
var config = require("./config.js");
var fs = require('fs');
var jade = require("jade");
var custFile = "public/custid.txt" ;
var currentCust = fs.readFileSync(custFile , {encoding:'utf-8'});
var displayLogo = true;
var d = new Date();
$(document).ready(function(){
	http.get(config.apiHost + 'api/custName/'+currentCust+'/0/0', (res) => {
      var resContent="";
      res.on('data',(d) =>{
        resContent+=d;
        //$("#message").html(news[0].F_MESSAGE);
      });
      res.on('end',function(){
        var cust = JSON.parse(resContent);
        $("#companyName").html(cust[0].F_CU_NAME)
      });
      res.resume();
    });
  if(currentCust.substr(0,1) == "W"){
    displayLogo = false;
  }
	var navHtml = fs.readFileSync("views/nav.html", {encoding:'utf-8'});
	$("nav").html(navHtml);
  var footerJade = jade.compileFile("views/footer.jade");
  var footerHtml = footerJade({year: d.getFullYear()});
  $("footer").html(footerHtml);
});