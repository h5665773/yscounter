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
const precautionFile = "precaution.json";
var otTypeList;
var dNow = new Date();
var times = [
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
];
$(document).ready(function () {
  const loading = $("#loading");
  const loadingMask = $(".loadingMask");
  var pointPanel = new Vue({
    el: '#pointPanel',
    data: {
      filterDidStr: '',
      filterAreaStr: '',
      filterOwnerStr: '',
      liverList: [],
      editMode: 'a',
      dateOptions: [],
      precautionList: [],
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
      selectedLiver: "",
      pointEmpid: '',
      tabs: [],
      times: [],
      deliverUpdateKey: ``,
      deliverList: []
    },
    methods: {
      clickTab: function (tabKey, pointid, empid) {
        this.currentPointid = pointid;
        this.currentTabKey = tabKey;
        this.pointEmpid = empid
        loadAllData(null);
      },
      changeMode: function (m) {
        this.editMode = m;
      },
      changeOtherType: function (k, F_TID) {
        this.otherRecord[k].typeList = [];
        this.otherRecord[k].typeList = this.otherTypeList[F_TID];
      },
      changeCid: function (k) {
        let cid = parseInt(this.otherRecord[k].F_CID) - 1;
        this.otherRecord[k].F_OT_ATTINFO = this.otherRecord[k].typeList[cid]["F_DESC"];
        //logs(this.otherRecord[k]);
      },
      changePrecautionLiver: function (pKey, liverKey) {
        let liverRow = this.liverList[this.precautionList[pKey]['liverKey']];
        this.precautionList[pKey]['liverId'] = liverRow['F_LIVER_ID']
        this.precautionList[pKey]['did'] = liverRow['F_CU_DID']
        this.precautionList[pKey]['area'] = liverRow['F_CU_AREA']
        this.precautionList[pKey]['owner'] = liverRow['F_OWNER_NAME']
      },
      addOtherJob: function () {
        logs(this.otherTypes);
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
      addPrecaution: function () {
        this.precautionList.push({
          liverKey: 0,
          liverId: this.liverList[0]["F_LIVER_ID"],
          did: this.liverList[0]["F_CU_DID"],
          area: this.liverList[0]["F_CU_AREA"],
          owner: this.liverList[0]["F_OWNER_NAME"],
          hide: false,
          comment: ''
        });
      },
      deletePrecaution: function (k) {
        this.precautionList.splice(k, 1);
        this.savePrecaution();
      },
      liverFilter: function () {
        let self = this;
        this.liverList.map(function (v, k) {
          if (self.filterDidStr == "" && self.filterOwnerStr == "" && self.filterAreaStr == "") {
            self.liverList[k].hide = false;
          } else {
            let testDid = -1
            let testOwner = -1
            let testArea = -1
            if (self.filterDidStr != '')
              testDid = v.F_CU_DID.indexOf(self.filterDidStr)
            if (self.filterOwnerStr != '')
              testOwner = v.F_OWNER_NAME.indexOf(self.filterOwnerStr)
            if (self.filterAreaStr != '')
              testArea = v.F_CU_AREA.indexOf(self.filterAreaStr)

            if (testDid < 0 && testOwner < 0 && testArea < 0) {
              self.liverList[k].hide = true;
            } else {
              self.liverList[k].hide = false;
            }
          }
        });
      },
      prFilterArea: function () {
        let self = this;
        this.precautionList.map(function (v, k) {
          if (v.area.indexOf(self.filterAreaStr) < 0) {
            self.precautionList[k].hide = true;
          } else {
            self.precautionList[k].hide = false;
          }
        });
      },
      prFilterDid: function () {
        let self = this;
        this.precautionList.map(function (v, k) {
          if (v.did.indexOf(self.filterDidStr) < 0) {
            self.precautionList[k].hide = true;
          } else {
            self.precautionList[k].hide = false;
          }
        });
      },
      prFilterOwner: function () {
        let self = this;
        this.precautionList.map(function (v, k) {
          if (v.owner.indexOf(self.filterOwnerStr) < 0) {
            self.precautionList[k].hide = true;
          } else {
            self.precautionList[k].hide = false;
          }
        });
      },
      savePrecaution: function () {
        let newPrecaution = [];
        if (this.precautionList.length < 1) {
          return;
        }
        this.precautionList.map(function (v, k) {
          if (v.comment == "") {
            this.precautionList.slice(k, 1);
          } else {
            newPrecaution.push({
              liverId: v.liverId,
              liverKey: v["liverKey"],
              did: v["did"],
              area: v["area"],
              owner: v["owner"],
              hide: false,
              comment: v.comment
            });
          }
        });
        logs(newPrecaution)
        if (newPrecaution.length > 0) {
          fs.writeFileSync("precaution.json", JSON.stringify(newPrecaution));
        }
        alert("存檔完成");
      },
      saveWork: function (type, key, status) {
        let workData = {};
        if (type == "other") {
          workData = this.otherRecord[key];
        } else {
          workData = this.sopData.list[key];
        }

        let submitLength = 0;
        if (!confirm("確定要存檔嗎?")) {
          return;
        }
        let postData = {};

        postData["cuid"] = currentCust;
        postData["selectDate"] = this.currentDate;
        postData["F_EMP_ID"] = this.currentEmpId;
        postData["F_EMP_NAME"] = this.currentEmpName;
        postData["workType"] = type;
        postData["workStatus"] = status;
        postData["workData"] = JSON.stringify(workData);
        request.post({ url: config.apiHost + 'postdata/addHandoverWork', formData: postData }, (error, response, body) => {
          console.log(body);
          let row = JSON.parse(body);
          if (row["result"] == "done") {
            loadAllData(null);
            alert("存檔完成!")
          } else {
            alert("存檔失敗!");
          }
        });
      },
      selectLiver: function (did, owner, liverId) {
        let self = this;
        this.precautionList.map(function (v, k) {
          if (v.liverId.indexOf(liverId) < 0) {
            self.precautionList[k].hide = true;
          } else {
            self.precautionList[k].hide = false;
          }
        });
      },
      dateChage: function (v) {
        this.currentDate = v
        loadAllData(null);
      },
      updateDeliver(deliver) {
        $.ajax({
          type: `post`,
          url: config.CMSOrder,
          data: {
            Order: `Update_deliveryYSCounter`,
            F_CU_ID: currentCust,
            F_EMP_ID: pointPanel.currentEmpId,
            deliverUpdateKey: pointPanel.deliverUpdateKey,
            DeliveryID: deliver.DeliveryID
          },
          success: function () {
            pointPanel.getDeliveryList();
          },
          error: function (a, b, c) {
            console.log(a, b, c);
          }
        })
      },
      getDeliveryList() {
        $.ajax({
          type: `post`,
          url: config.CMSOrder,
          data: {
            Order: `Get_DeliveryYSCounter`,
            F_CU_ID: currentCust,
            F_EMP_ID: pointPanel.currentEmpId
          },
          dataType: `json`,
          success: function (data) {
            console.log(data.data);
            pointPanel.deliverList = data.data;
            pointPanel.deliverUpdateKey = data.key;
          },
          error: function (a, b, c) {
            console.log(a, b, c);
          }
        });
      }
    },
    mounted: function () {
      let self = this;
      this.times = times;
      this.currentTime = String(dNow.getHours()).padStart(2, "0") + ":";
      if (dNow.getMinutes() < 30) {
        this.currentTime = this.currentTime + "00";
      } else {
        this.currentTime = this.currentTime + "30";
      }
      if (fs.existsSync(precautionFile)) {
        this.precautionList = JSON.parse(fs.readFileSync(precautionFile));
      }
      console.log(this.precautionList)
      const d1 = new Date();
      for (let i = 0; i > -7; i--) {
        let sd = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate() + i);
        let dateStr = sd.getFullYear() + "-" + _.padStart((sd.getMonth() + 1), 2, "0") + "-" + _.padStart(sd.getDate(), 2, "0");
        if (i == 0) {
          self.currentDate = dateStr;
        }
        self.dateOptions.push(dateStr);
      }
      loadingMask.css("display", "block");
      loading.removeClass("rotateOut");
      loading.css("display", "block");
      loading.addClass("rotateIn");
      scan((empId, err) => {
        //err = false;
        //empId = "T10220";
        loadingMask.css("display", "none");
        loading.css("display", "none");
        loading.removeClass("rotateIn");
        loading.addClass("rotateOut");
        if (err == true) {
          alert("員工編號錯誤");
          location.href = "index.html";
        }

        this.currentEmpId = empId;
        this.pointEmpid = empId;
        this.getDeliveryList();
        request(config.apiHost + 'api/pointByCust&liverList/' + currentCust + '/000/000', (error, response, body) => {
          let rows = JSON.parse(body);
          let pointList = rows['data1'];
          let liverList = rows["data2"];
          self.liverList = liverList;
          self.tabs = pointList;
          console.log(rows);

          pointList.map(function (v, k) {
            if (v.F_EMP_ID == empId) {
              self.currentTabKey = k;
              self.currentPointid = v.F_POINT_ID;
              self.currentEmpName = v.F_EMP_NAME;
            }
          });
          loadAllData(null);
        });
      });

    }
  })
  var otherTypeList = [];
  var selectDate = $("#selectDate");
  const scanCancel = $("#scanCancel");
  var intvalWorker;

  var loadAllData = function (callbackLoad) {
    async.parallel({
      pointSop: function (callback) {
        console.log(config.apiHost + 'api/pointSop/' + currentCust + '/' + pointPanel.currentPointid + '/' + pointPanel.pointEmpid + '?selectdate=' + pointPanel.currentDate);
        request(config.apiHost + 'api/pointSop/' + currentCust + '/' + pointPanel.currentPointid + '/' + pointPanel.pointEmpid + '?selectdate=' + pointPanel.currentDate, function (error, response, body) {
          if (error == null) {
            callback(null, JSON.parse(body));
          } else {
            callback(null, []);
          }
        });
      }
    }, function (err, results) {
      console.log(results);
      var otherType = [];
      var workRecord = [];
      let otl = results.pointSop.otherTypeList;
      pointPanel.otherTypeList = otl;
      //梳理1
      //results.otherType.map(function(v){
      //  otherType[v.F_CID] = v.F_DESC;
      //});
      //梳理2 設定上班紀錄
      results.pointSop.sopRecord.map(function (v) {
        workRecord[v['F_D2_SEQ']] = v;
      });
      //梳理3
      let sopData = results.pointSop.sopData;
      if (sopData.length < 1) {
        alert("請先設定相關哨點'駐點須知'!如有疑問請洽課長!");
        //location.href="index.html";
        return;
      }
      sopData.list.map(function (sop, sopk) {
        results.pointSop.sopData.list[sopk].done = false;
        results.pointSop.sopData.list[sopk].comment = '';
        if (typeof (workRecord[sop['F_D2_SEQ']]) != "undefined") {
          results.pointSop.sopData.list[sopk].done = true;
          results.pointSop.sopData.list[sopk].F_WORK_STATUS = workRecord[sop['F_D2_SEQ']]["F_WORK_STATUS"];
          results.pointSop.sopData.list[sopk].name = workRecord[sop['F_D2_SEQ']]["F_EMP_NAME"];
          results.pointSop.sopData.list[sopk].comment = workRecord[sop['F_D2_SEQ']]["F_OT_COMMENT"];
        }
      });
      let orec = results.pointSop.otherRecord;
      orec.map(function (v, k) {
        orec[k].typeList = otl[v.F_TID];
        if (pointPanel.currentPointid == 'all') {
          orec[k].F_WORK_STATUS = 'done'
          results.pointSop.sopData.list.push(orec[k])
        }
      });
      console.log(results);
      pointPanel.otherTypes = results.pointSop.otherType;
      pointPanel.sopData = results.pointSop.sopData;
      pointPanel.otherRecord = results.pointSop.otherRecord;
    });
  }

  var checkCheckbox = function () {
    var checkedCount = 0;
    var boxs = pointSop.find("input:checkbox");
    boxs.each(function () {
      if ($(this).prop("checked") == true) {
        checkedCount++;
      }
    });
    if (checkedCount > 0)
      return false;
    else
      return true;
  }
});