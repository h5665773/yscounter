var http = require('http');
var config = require("./config.js");
var fs = require('fs');
var jade = require("jade");
var custFile = "public/custid.txt" ;
var currentCust = fs.readFileSync(custFile , {encoding:'utf-8'});
$(document).ready(function(){
	http.get(config.apiHost + 'api/custName/'+currentCust+'/0/0', (res) => {
      var resContent="";
      res.on('data',(d) =>{
        resContent+=d;
        //$("#message").html(news[0].F_MESSAGE);
      });
      res.on('end',function(){
        var cust = JSON.parse(resContent);
        $("#companyName").html(cust[0].F_CU_SNAME)
      });
      res.resume();
    });
	var navJade = jade.compileFile("views/header.jade");
	var navHtml = navJade({current: "checkin"});
	$("nav").html(navHtml);
});