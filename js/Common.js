var fs = require('fs');
var jade = require("jade");
var custFile = "public/custid.txt" ;
var currentCust = fs.readFileSync(custFile , {encoding:'utf-8'});
$(document).ready(function(){
  var navJade = jade.compileFile("views/header.jade");
  var navHtml = navJade({current: "checkin"});
  $("nav").html(navHtml);
});