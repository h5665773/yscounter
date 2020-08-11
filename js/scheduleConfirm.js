const screenshot = require('screenshot-desktop')
var exec = require('child_process').exec,
    child;
const request = require("request");
var d = new Date();
var range = "first"
if(d.getDate()>15){
  range = "second"
}

$(document).ready(function(){
  var empName= $("#empName");
  var faceDetections = [];
  var loading = $("#loading");
  var loadingText = $("#loadingText");
  var loadingMask = $(".loadingMask");
  var pointList = $(".pointList");
  //$(".viewDetail").colorbox({inline:true, width:"50%"});
  var scanEmpId = "";
  var chooseCust = "";
  var choosePoint = "";
  var gowork = $("#goWork");
  var offwork = $("#offWork");
  var offlinePointFile = "offlinePoint.json";
  var offlineCheckinFile = "offlineCheckin.json";
  var pointData = {};
  var video = document.getElementById('video');
  
  var mediaConfig =  { video: true };
  var body = $("html");
  var showMask = function(){
    loadingText.text("載入中!");
    loadingMask.css("display","block");
    loading.removeClass("rotateOut");
    loading.css("display","block");
    loading.addClass("rotateIn");
  }
  var hideMask = function(){
    loadingMask.css("display","none");
    loading.css("display","none");
    loading.removeClass("rotateIn");
    loading.addClass("rotateOut");
  }
  var errBack = function(e) {
    console.log('An error has occurred!', e)
  };
  
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var options = {
    hostname: 'api.wyattst.com.tw',
    port: 80,
    path: ''
  };
  var vueScheduleList = new Vue({
    el: '#scheduleList',
    data: {
      reason: '',
      list: {},
      confirmed: 'no'
    },
    methods: {
      sendConfirm: async function(status){
        if(!confirm("確認送出?")){
          return
        }
        await screenshot({ filename: './screen.png' })
        showMask();
        let reason = ''
        if(status != "correct"){
          status = "incorrect"
        }
        let submitData = {
          reason: this.reason,
          status: status,
          screen: fs.createReadStream('./screen.png')
        }
        url = config.apiHost + 'barcode/scheduleConfirm/'+currentCust+"/"+scanEmpId+"/"+range;
        request.post({url: url, formData: submitData}, function (error, httpResponse, body) {
          logs(body)
          hideMask();
          switch(String(body)){
            case("1"):
              alert("已完成確認");
            break;
            case("2"):
              alert("已完成確認，並記錄原因");
            break;
            case("4"):
              alert("提交失敗");
            break;
          }
          //location.href="index.html";
        });
      },
      mounted: function(){
        
      }
    }
  });
  $("#scanEmp").click(function(){
    console.log(123)
    var pointData={};
    if($(this).attr("disabled")==true){
      return false;
    }
    loadingText.text("請在20秒內掃描員工識別證!");
    loadingMask.css("display","block");
    loading.removeClass("rotateOut");
    loading.css("display","block");
    loading.addClass("rotateIn");

    exec("node scan.js" , function(err ,data ,c){
      //data = 'T10220';
      //err = null;
      if(err == null && data.length > 0){
        data = data.trim();
        var parse = data.match(/([A-Z]{1}[0-9]+)([A-Z]?)/);
        scanEmpId = parse[1];
        var ym = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
        console.log(config.apiHost + `api/getConfirmSchedule/${ym}/${currentCust}/${scanEmpId}/${range}`);
        request(config.apiHost + 'api/empName/'+currentCust+'/000/'+scanEmpId, function (error, response, body) {
          var row = JSON.parse(body);
          empName.html(row[0]['F_EMP_NAME']);
        });
        request(config.apiHost + `api/getConfirmSchedule/${ym}/${currentCust}/${scanEmpId}/${range}`, function (error, response, body) {
          var rows = JSON.parse(body);
          //設定vue data
          if(typeof(rows) !='undefined'){
            vueScheduleList.list = rows.schedule;
            vueScheduleList.confirmed = rows.confirmed;
            loadingMask.css("display","none");
            loading.css("display","none");
            loading.removeClass("rotateIn");
            loading.addClass("rotateOut");
          }
        });
      }else{
        loadingMask.css("display","none");
        loading.css("display","none");
        loading.removeClass("rotateIn");
        loading.addClass("rotateOut");
        //console.log(err);
      }
    });
  });
  
});