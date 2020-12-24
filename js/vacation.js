$(document).ready(function () {
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
    $(document).ajaxError((event, request, settings) => {
        console.log(event, request, settings);
    });
    const this_Vue = new Vue({
        el: `#body`,
        data: {
            endScanSec: 0,
            cancelSec: 0,
            empid: ``,
            empName: ``,
            showContent: false,
            ym: {
                year: 0,
                month: 0
            },
            calendar: {
                dateList: [],
                chooseDate: [],
            },
            dayOfWeek: [`日`, `一`, `二`, `三`, `四`, `五`, `六`]
        },
        methods: {
            async startScan(callback) {
                callback();
                //this.endScanSec = 20;
                //let scanTimeout = setInterval(() => {
                //    this_Vue.endScanSec = this_Vue.endScanSec - 1;
                //    if (this_Vue.endScanSec <= 0) {
                //        clearInterval(scanTimeout);
                //    }
                //}, 20000);
                //require('child_process').exec("node scan.js", function (err, data, c) {
                //    const regex = RegExp(/[A-Z][0-9]*[A-Z]?/);
                //    if (regex.test(data) && data.toUpperCase().indexOf(`ERROR`) == -1) {
                //        this_Vue.empid = data.match(/[A-Z][0-9]*[A-Z]?/)[0];
                //        this_Vue.endScanSec = 0;
                //        if (callback) {
                //            callback();
                //        }
                //    } else {
                //        this_Vue.startScan(callback);
                //    }
                //});
            },
            async getData() {
                this_Vue.empid = `T11272`;
                await this_Vue.createCalendar();
                await $.ajax({
                    type: `post`,
                    url: config.ajaxOrder,
                    data: {
                        Order: `Get_ExprectVacation`,
                        cuid: custid,
                        empid: this_Vue.empid
                    },
                    dataType: `json`,
                    success: function (data) {
                        data.main.forEach(x => {
                            this_Vue.calendar.chooseDate.push(new Date(x.VacationDate).getDate());
                        });
                        this_Vue.empName = data.name[0].F_EMP_NAME;
                        this_Vue.showContent = true;
                    }
                })
            },
            async createCalendar() {
                let now = new Date();
                now = new Date(now.setMonth(now.getMonth() + 1));
                if (now.getDate() > 20) {
                    now = new Date(now.setMonth(now.getMonth() + 1));
                }
                this.ym.year = now.getFullYear();
                this.ym.month = now.getMonth() + 1;
                this.calendar.dateList = [];
                this.calendar.chooseDate = [];
                for (let i = 0; i < new Date(this_Vue.ym.year, this_Vue.ym.month, 0).getDate(); i++) {
                    this.calendar.dateList.push(false);
                }
            },
            submitData() {
                $.ajax({
                    type: `post`,
                    url: config.ajaxOrder,
                    data: {
                        Order: `Update_ExprectVacation`,
                        ym: `${this_Vue.ym.year}-${this_Vue.ym.month}`,
                        cuid: custid,
                        empid: this_Vue.empid,
                        date: this_Vue.calendar.chooseDate.toString()
                    },
                    complete: function (XMLHttpRequest, textStatus) {
                        if (XMLHttpRequest.responseText == `Success`) {
                            alert(`儲存成功`);
                            this_Vue.empid = ``;
                            this_Vue.showContent = false;
                        }
                        else {
                            alert(`請檢查網路並且更新版本，如未解決請回報公司!`);
                        }
                    }
                })
            },
            disabled(date) {
                return this.calendar.chooseDate.length > 5 && this.calendar.chooseDate.filter(x => x == date).length == 0;
            },
            getDayOfMonth(date) {
                date = new Date(this_Vue.ym.year, this_Vue.ym.month - 1, date);
                return date.getDay();
            },
            dateClass(date) {
                switch (this.getDayOfMonth(date)) {
                    case 0:
                        return 'Date Sunday';
                        break;
                    case 6:
                        return 'Date Saturday';
                        break;
                    default:
                        return `Date`;
                        break;
                }
            }
        },
        components: {

        },
        async created() {
            console.log(`created`);
        },
        async mounted() {
            console.log(`mounted`);
        },
        async beforeCreate() {
            console.log(`beforeCreate`);
        }
    });
});

