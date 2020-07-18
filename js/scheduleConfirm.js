const screenshot = require('screenshot-desktop')
var exec = require('child_process').exec,
    child;
const request = require("request");
var vueScheduleList = new Vue({
  el: '#scheduleList',
  data: {
    reason: '',
    list: {}
  },
  methods: {
    sendConfirm: function(status){
      if(!confirm("確認送出?")){
        return
      }
      let reason = ''
      if(status == "correct"){

      }else{
        
      }
      let submitData = {
        reason: this.reason,
        status: 
      }
    }
  }
});

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
  var d = new Date();
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
  $("#scanEmp").click(function(){
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
      data = 'T10220';
      err = null;
      if(err == null && data.length > 0){
        data = data.trim();
        var parse = data.match(/([A-Z]{1}[0-9]+)([A-Z]?)/);
        scanEmpId = parse[1];
        var ym = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
        var range = "first"
        if(d.getDate()>15){
          range = "second"
        }
        console.log(config.apiHost + `api/getConfirmSchedule/${ym}/${currentCust}/${scanEmpId}/${range}`);
        request(config.apiHost + 'api/empName/'+currentCust+'/000/'+scanEmpId, function (error, response, body) {
          var row = JSON.parse(body);
          empName.html(row[0]['F_EMP_NAME']);
        });
        request(config.apiHost + `api/getConfirmSchedule/${ym}/${currentCust}/${scanEmpId}/${range}`, function (error, response, body) {
          var rows = JSON.parse(body);
          //設定vue data
          if(typeof(rows) !='undefined'){
            vueScheduleList.list = rows;
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
  var checkin = async function(workType){
    await screenshot({ filename: './screen.png' })
    showMask();
    context.drawImage(video, 0, 0, 270, 270);
    var imageData = canvas.toDataURL("image/png");
    var url ;
    if(scanEmpId != "" && choosePoint!=""&&currentCust!=""){
      gowork.prop("disabled",true);
      offwork.prop("disabled",true);  
      
      var imageDir = `./public/coworkerImages`;
      if(!fs.existsSync(imageDir)){
        fs.mkdirSync(imageDir,0777);
      }
      
      url = config.apiHost + 'barcode/checkin/'+workType+'/'+currentCust+"/"+choosePoint+"/"+scanEmpId;
      var formData = {
        screen: fs.createReadStream('./screen.png')
      };
      request.post({url: url, formData: formData}, function (error, httpResponse, body) {
        hideMask();
        switch(String(body)){
          case("3"):
            alert("打卡完成");
          break;
          case("1"):
            alert("當日未排班");
          break;
          case("2"):
            alert("員工不存在或已離職");
          break;
          case("4"):
            alert("已經超過打卡時限");
          break;
          case("5"):
            alert("當日已在其他地方打卡了");
          break;
        }
        location.href="index.html";
      });
    }else{
      alert("資料有錯誤");
    }
  }
});