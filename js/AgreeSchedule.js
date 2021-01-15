$(document).ready(function () {
    const url = require('./config.js').ajaxOrder;
    const custid = require("fs").readFileSync('./public/custid.txt').toString();
    Date.prototype.addDays = function (days) {
        var dat = new Date(this.valueOf());
        dat.setDate(dat.getDate() + days);
        return dat;
    }
    Date.prototype.weekOfMonth = function () {
        let firstDay = new Date(this.getFullYear(), this.getMonth(), 1);
        let lastDay = new Date(this.getFullYear(), this.getMonth() + 1, 0);
        return Math.ceil((lastDay.getDate() - firstDay.getDate()) / 7) + Math.floor((firstDay.getDay() + lastDay.getDate() - (Math.floor((lastDay.getDate() - firstDay.getDate()) / 7) * 7) - 1) / 7);
    }
    Date.prototype.firstDayOfWeek = function () {
        return this.addDays(this.getDay() * (-1));
    }
    const screenshot = require('screenshot-desktop')
    const this_Vue = new Vue({
        el: `#body`,
        data: {
            endScanSec: 0,
            loadShow: false,
            loadMessage: ``,
            facedetections: 0,
            point: [],
            date: [],
            scanCheck: false,

            empid: ``,
            empName: ``,
            showContent: false,
            ym: {
                year: 0,
                month: 0
            },
            dayOfWeek: [`日`, `一`, `二`, `三`, `四`, `五`, `六`],
            checked: false
        },
        methods: {
            async startScan(callback) {
                this.endScanSec = 20;
                let scanTimeout = setInterval(() => {
                    this_Vue.endScanSec = this_Vue.endScanSec - 1;
                    if (this_Vue.endScanSec <= 0) {
                        clearInterval(scanTimeout);
                    }
                }, 20000);
                require('child_process').exec("node scan.js", function (err, data, c) {
                    const regex = RegExp(/[A-Z][0-9]*[A-Z]?/);
                    if (regex.test(data) && data.toUpperCase().indexOf(`ERROR`) == -1) {
                        this_Vue.empid = data.match(/[A-Z][0-9]*[A-Z]?/)[0];
                        this_Vue.endScanSec = 0;
                        if (callback) {
                            callback();
                        }
                    } else {
                        this_Vue.startScan(callback);
                    }
                });
            },
            async getData() {
                let that = this;
                await $.ajax({
                    type: `post`,
                    url: url,
                    data: {
                        Order: `Get_ScheduleConfirm`,
                        empid: that.empid
                    },
                    dataType: `json`,
                    success: function (data) {
                        that.point = [];
                        that.date = [];
                        let point = data.point;
                        point.forEach(x => {
                            x.sche = data.sche.filter(y => y.F_POINT_ID == x.F_POINT_ID);
                        });

                        data.sche.forEach(x => {
                            that.ym.year = x.F_YM.split('-')[0];
                            that.ym.month = x.F_YM.split('-')[1];
                        });
                        for (let i = 0; i < new Date(that.ym.year, that.ym.month, 0).getDate(); i++) {
                            that.date.push(i + 1);
                        }
                        that.checked = data.confirmed.length == 1;
                        that.point = point;
                        this_Vue.showContent = true;
                    },
                    error: function (err) {
                        alert(err.responseText);
                        location.href = "./index.html";
                    }
                })
            },
            async submitData() {
                let that = this;
                if (that.scanCheck) {
                    alert("未偵測到員工人臉或辨識度不足0.75，請重新對準!");
                    return;
                }
                await screenshot({ filename: './screen.png' });
                fs.readFile('./screen.png', "base64", (err, data) => {
                    if (err) { console.log(err); return; }
                    let Data = new FormData();
                    Data.append('Order', 'Add_ScheduleConfirm');
                    Data.append('empid', this.empid);
                    Data.append('pic', data);
                    $(Data).attr("enctype", "multipart/form-data");
                    // console.log(data);
                    $.ajax({
                        type: 'post',
                        url: url,
                        processData: false,
                        data: Data,
                        async: false,
                        cache: false,
                        processData: false,
                        contentType: false,
                        success: function (message) {
                            that.scanCheck = false;
                            alert("已確認班表!");
                            location.href = "./index.html";
                        }
                    });
                });
            },
            disabled(date) {
                return this.calendar.chooseDate.length > 1 && this.calendar.chooseDate.filter(x => x == date).length == 0;
            },
            getDayOfMonth(date) {
                date = new Date(this_Vue.ym.year, this_Vue.ym.month - 1, date);
                return date.getDay();
            },
            dateClass(date) {
                switch (this.getDayOfMonth(date)) {
                    case 0:
                        return 'text-center Date Sunday';
                        break;
                    case 6:
                        return 'text-center Date Saturday';
                        break;
                    default:
                        return `text-center Date`;
                        break;
                }
            },

            showLoading(message) {
                this.loadMessage = message;
                this.loadShow = true;
            },
            hideLoading() {
                this.loadMessage = ``;
                this.loadShow = false;
            },
        },
        watch: {
            facedetections: function () {
                let that = this;
                console.log(that.facedetections);
                if (that.facedetections > 75) {
                    that.scanCheck = true;
                    setTimeout(() => {
                        that.scanCheck = false;
                    }, 1000);
                }
            }
        },
        components: {
            'face-camera': {
                template: `<div class="col-lg-3" align="center">
                <h4>攝影機畫面</h4>
                <video ref="video" width="270" height="270" autoplay></video>
                <canvas id="canvas" width="270" height="270"></canvas>
                <div class="shotLine leftTop"></div>
                <div class="shotLine rightTop"></div>
                <div class="shotLine leftBottom"></div>
                <div class="shotLine rightBottom"></div>
                </div>`,
                props: ["facedetections"],
                methods: {
                    startVideo() {
                        navigator.getUserMedia(
                            { video: {} },
                            stream => this.$refs.video.srcObject = stream,
                            err => console.error(err)
                        )
                        this.$refs.video.addEventListener('play', () => {
                            const canvasF = faceapi.createCanvasFromMedia(this.$refs.video)
                            $(this.$el).append(canvasF)
                            const displaySize = { width: this.$refs.video.width, height: this.$refs.video.height }
                            faceapi.matchDimensions(canvasF, displaySize)
                            setInterval(async () => {
                                let faceDetections = await faceapi.detectAllFaces(this.$refs.video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.90 }));
                                const resizedDetections = faceapi.resizeResults(faceDetections, displaySize)
                                canvasF.getContext('2d').clearRect(0, 0, canvasF.width, canvasF.height)
                                faceapi.draw.drawDetections(canvasF, resizedDetections)
                                let score = 0;
                                if (resizedDetections.length) score = resizedDetections[0].score * 100;
                                this.$emit('update:facedetections', score);
                            }, 200)
                        });
                    },
                },
                created() {

                },
                mounted() {
                    let startVideo = this.startVideo;
                    Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri('/js'),
                        faceapi.nets.faceLandmark68Net.loadFromUri('/js'),
                        faceapi.nets.faceRecognitionNet.loadFromUri('/js'),
                        faceapi.nets.faceExpressionNet.loadFromUri('/js')
                    ]).then(startVideo);
                    this.startVideo();
                }
            },
            'loading': {
                template: `<div class="loadingMask" style="width:100%;height:100%;position:absolute;background: rgba(0,0,0,0.3);z-index:1111;top:0px;left:0px;"><button class=" btn btn-lg btn-warning rotateIn loading"><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span><span>
      {{loadmessage}}</span></button><img src="./images/scan3.png" style="position:absolute;left:765px;top:285px;"/></div>`,
                props: ["loadmessage"],
            }
        },
        mounted() {
        }
    });
});