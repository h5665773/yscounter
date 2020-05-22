const d1 = new Date();
var d1Ym = d1.getFullYear() + "-" + ("0" + (d1.getMonth() + 1)).slice(-2);
var navJade = jade.compileFile("views/nav.jade");
const _ = require("lodash");
//const QrCode = require('qrcode-reader');
const exec = require('child_process').exec;
const scan = require("./js/scan.js");
const request = require('request');
const async = require("async");
//const qr = new QrCode();
const postUrl = config.apiHost + 'postdata/pointInfo';
var otTypeList;
var dNow = new Date();
var times = [
	'00:00','00:30','01:00','01:30','02:00','02:30','03:00','03:30','04:00','04:30','05:00','05:30','06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30','23:00','23:30'
];
$(document).ready(function(){
	const loading = $("#loading");
	const loadingMask = $(".loadingMask");
    var pointPanel = new Vue({
      el: '#pointPanel',
      data: {
      	editMode: 'a',
      	dateOptions: [],
      	precautions: '',
      	currentEmpId: '',
      	currentEmpName: '',
      	currentPointid: "",
      	currentTabKey: 0,
      	currentTime: '',
      	currentDate: '',
      	sopData: [],
        otherRecord: [],
        otherTypes: [],
        otherTypeList: [],
        selectDate: "",
        tabs: [],
        times: []
      },
      methods: {
      	clickTab: function(tabKey,pointid){
      		this.currentPointid = pointid;
      		this.currentTabKey = tabKey;
	        loadAllData(null);
      	},
      	changeMode: function(m){
      		this.editMode = m;
      	},
      	changeOtherType: function(k,F_TID){
      		this.otherRecord[k].typeList = [];
      		this.otherRecord[k].typeList = this.otherTypeList[F_TID];
      	},
      	changeCid: function(k){
      		let cid = parseInt(this.otherRecord[k].F_CID)-1;

      		this.otherRecord[k].F_OT_ATTINFO = this.otherRecord[k].typeList[cid]["F_DESC"];
      		//logs(this.otherRecord[k]);
      	},
      	addOtherJob: function(){
      		this.otherRecord.push({
      			done: false,
      			F_D2_SEQ: '',
      			F_EMP_NAME: '',
      			F_TID: this.otherTypes[0].F_TID,
      			F_CID: '1',
      			F_OT_TIME: this.currentTime,
      			F_OT_ATTINFO: '',
      			typeList: this.otherTypeList[this.otherTypes[0].F_TID],
      			comment: ''
      		});
      	},
      	savePrecautions: function(){
      		let self = this;
      		console.log(config.apiHost + 'postdata/updatePrecaution')
      		request.post({url: config.apiHost + 'postdata/updatePrecaution', formData: {cuid: currentCust,note: self.precautions}},(error, response, body)=>{
		      //console.log(body);
		    }); 
      	},
      	saveWork: function(){
      		let submitLength = 0;
      		if(!confirm("確定要存檔嗎?")){
      			return;
      		}
      		let postData = {};
      		let postList = [];
      		let otherPostList = [];
      		this.sopData.list.map(function(v,k){
      			if(v.comment.trim()!='' && v.done!=true){
      				postList.push(v);
      				submitLength++;
      			}
      		});
      		this.otherRecord.map(function(v,k){
      			if(v.comment.trim()!='' && v.done!=true){
      				otherPostList.push(v);
      				submitLength++;
      			}
      		});
      		if(submitLength<1){
      			alert("目前沒有任何資料需要存檔!");
      			return;
      		}
      		postData["cuid"] = currentCust;
      		postData["selectDate"] = this.currentDate;
      		postData["F_EMP_ID"] = this.currentEmpId;
      		postData["F_EMP_NAME"] = this.currentEmpName;
      		postData["listJson"] = JSON.stringify(postList);
      		postData["otherListJson"] = JSON.stringify(otherPostList);
      		request.post({url: config.apiHost + 'postdata/pointInfo',formData: postData},(error, response, body)=>{
      			console.log(body);
      			let row = JSON.parse(body);
      			if(row["result"]=="done"){
      				loadAllData(null);
      				alert("存檔完成!")
      			}else{
      				alert("存檔失敗!");
      			}
      		});
      	},
      	dateChage: function(){
	      	loadAllData(null);
	    }
      },
      mounted: function(){
      	let self = this;
      	this.times = times;
      	this.currentTime = String(dNow.getHours()).padStart(2,"0")+":";
      	if(dNow.getMinutes() <30){
      		this.currentTime = this.currentTime+"00";
      	}else{
      		this.currentTime = this.currentTime+"30";
      	}
      	console.log(this.currentTime);
      	const d1 = new Date();
	    for(let i =0;i>-7;i--){
	      let sd = new Date(d1.getFullYear(),d1.getMonth(),d1.getDate()+i);
	      let dateStr = sd.getFullYear() + "-" +_.padStart((sd.getMonth() + 1), 2, "0")+ "-" +_.padStart(sd.getDate(), 2, "0");
	      if(i == 0){
	      	self.currentDate = dateStr;
	      }
	      self.dateOptions.push(dateStr);
	    }
	    loadingMask.css("display","block");
      	loading.removeClass("rotateOut");
      	loading.css("display","block");
      	loading.addClass("rotateIn");
      	scan((empId,err) => {
      		err = false;
      		empId = "T10668";
      		loadingMask.css("display","none");
            loading.css("display","none");
            loading.removeClass("rotateIn");
            loading.addClass("rotateOut");
      		if(err == true){
      			alert("員工編號錯誤");
      			location.href="index.html";
      		}
      		this.currentEmpId = empId;
	    	request(config.apiHost + 'api/pointByCust&custName/'+currentCust+'/000/'+empId,(error, response, body)=>{
	    	  let rows = JSON.parse(body);
		      let pointList = rows['data1'];
		      let cust = rows["data2"];
		      self.precautions = cust[0].F_CU_Precautions;
		      self.tabs = pointList;
		      self.currentPointid = pointList[0].F_POINT_ID;
		      self.currentEmpName = pointList[0].F_EMP_NAME;
		      loadAllData(null);
		    });
	    });
	    
      }
    })
    var otherTypeList = [];
    var selectDate = $("#selectDate");
    const scanCancel = $("#scanCancel");
    var intvalWorker ;
    
    var loadAllData = function(callbackLoad){
      async.parallel({
        pointSop: function(callback){
          console.log(config.apiHost + 'api/pointSop/'+currentCust+'/'+pointPanel.currentPointid+'/0?selectdate='+pointPanel.currentDate);
          request(config.apiHost + 'api/pointSop/'+currentCust+'/'+pointPanel.currentPointid+'/0?selectdate='+pointPanel.currentDate, function (error, response, body) {
            if(error == null){
              callback(null,JSON.parse(body));  
            }else{

              callback(null,[]);
            }
          });
        }
      }, function(err, results) {
        //console.log(results);
        var otherType = [];
        var workRecord = [];
        let otl = results.pointSop.otherTypeList;
        pointPanel.otherTypeList = otl;
        
        //梳理1
        //results.otherType.map(function(v){
        //  otherType[v.F_CID] = v.F_DESC;
        //});
        //梳理2 設定上班紀錄
        results.pointSop.sopRecord.map(function(v){
          workRecord[v['F_D2_SEQ']] = v;
        });
        
        //梳理3
        let sopData = results.pointSop.sopData;
        sopData.list.map(function(sop,sopk){
            results.pointSop.sopData.list[sopk].done = false;
            results.pointSop.sopData.list[sopk].comment = '';
            if(typeof(workRecord[sop['F_D2_SEQ']])!="undefined"){
              results.pointSop.sopData.list[sopk].done = true;
              results.pointSop.sopData.list[sopk].name = workRecord[sop['F_D2_SEQ']]["F_EMP_NAME"];
              results.pointSop.sopData.list[sopk].comment = workRecord[sop['F_D2_SEQ']]["F_OT_COMMENT"];
            }
        });
        let orec = results.pointSop.otherRecord;
        orec.map(function(v,k){
        	orec[k].typeList = otl[v.F_TID];
        });
        console.log(results);
        pointPanel.otherTypes = results.pointSop.otherType;
        pointPanel.sopData = results.pointSop.sopData;
        pointPanel.otherRecord = results.pointSop.otherRecord;
      });
    }
    
    var checkCheckbox = function(){
      var checkedCount = 0;
      var boxs = pointSop.find("input:checkbox");
      boxs.each(function(){
        if($(this).prop("checked") == true){
          checkedCount++;
        }
      });
      if(checkedCount>0)
        return false;
      else
        return true;
    }
});