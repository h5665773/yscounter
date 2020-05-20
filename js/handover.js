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

$(document).ready(function(){
	const loading = $("#loading");
	const loadingMask = $(".loadingMask");
    var pointPanel = new Vue({
      el: '#pointPanel',
      data: {
      	dateOptions: [],
      	precautions: '',
      	currentEmpId: '',
      	currentEmpName: '',
      	currentPointid: "",
      	currentTabKey: 0,
      	currentDate: '',
      	sopData: [],
        otherRecord: [],
        otherType: [],
        selectDate: "",
        tabs: []
      },
      methods: {
      	clickTab: function(tabKey,pointid){
      		this.currentPointid = pointid;
      		this.currentTabKey = tabKey;
	        loadAllData(null);
      	},
      	addOtherJob: function(){
      		this.otherRecord.push({
      			F_D2_SEQ: '',
      			F_EMP_NAME: '',
      			F_TID: '',
      			F_OT_TIME: '',
      			F_OT_ATTINFO: ''
      		})
      	},
      	savePrecautions: function(){
      		let self = this;
      		console.log(config.apiHost + 'postdata/updatePrecaution')
      		request.post({url: config.apiHost + 'postdata/updatePrecaution', formData: {cuid: currentCust,note: self.precautions}},(error, response, body)=>{
		      console.log(body);
		    }); 
      	},
      	saveWork: function(){
      		let postData = {};
      		let postList = [];
      		this.sopData.list.map(function(v,k){
      			if(v.comment.trim()!=''){
      				postList.push(v);
      			}
      		});
      		if(postList.length<1){
      			alert("目前沒有任何資料需要存檔!");
      			return;
      		}
      		postData["cuid"] = currentCust;
      		postData["selectDate"] = this.currentDate;
      		postData["F_EMP_ID"] = this.currentEmpId;
      		postData["F_EMP_NAME"] = this.currentEmpName;
      		postData["listJson"] = JSON.stringify(postList);
      		console.log(postData);
      		request.post({url: config.apiHost + 'postdata/pointInfo',formData: postData},(error, response, body)=>{
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
      	const d1 = new Date();
	    for(let i =0;i>-7;i--){
	      let sd = new Date(d1.getFullYear(),d1.getMonth(),d1.getDate()+i);
	      let dateStr = sd.getFullYear() + "-" +_.padStart((sd.getMonth() + 1), 2, "0")+ "-" +_.padStart(sd.getDate(), 2, "0");
	      if(i == 0){
	      	self.currentDate = dateStr;
	      }
	      self.dateOptions.push(dateStr);
	    }
      	scan((empId,err) => {
      		//err = false;
      		//empId = "T10668";
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
        otherTypeList = results.pointSop.otherTypeList;
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
        //console.log(results);
        pointPanel.sopData = results.pointSop.sopData;
        $(".otherJob tr:last input[name='workOtherSeq[]']").val($(".otherJob tr").length-2);
        if(callbackLoad != null){
          callbackLoad(otherTypeList);
        }
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