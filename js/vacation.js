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
    const this_Vue = new Vue({
        el: `#body`,
        data: {
            endScanSec: 0,
            cancelSec: 0,
            editTime: 60 * 10,
            empid: ``,
            ym: {
                year: 0,
                month: 0
            },
            calendar: [],
            usePoint: 0
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
                await this_Vue.createCalendar();
                await $.ajax({
                    type: `post`,
                    url: config.testURL,
                    data: {
                        Order: `Get_ExprectVacation`,
                        cuid: custid,
                        empid: this_Vue.empid
                    },
                    dataType: `json`,
                    success: function (data) {
                        data.forEach(x => {
                            let [year, month, date] = x.VacationDate.split('/');
                            year = parseInt(year);
                            month = parseInt(month);
                            date = parseInt(date);
                            this_Vue.calendar.forEach((weekCurrentValue, weekIndex, calendarArray) => {
                                weekCurrentValue.forEach((dayCurrentValue, dayIndex, weekArray) => {
                                    if (year == dayCurrentValue.year && month == dayCurrentValue.month && date == dayCurrentValue.date) {
                                        this_Vue.calendar[weekIndex][dayIndex].point = x.Point;
                                        this_Vue.usePoint += parseInt(x.Point);
                                    }
                                })
                            })
                        })
                        this_Vue.showContent();
                    }
                })
            },
            async createCalendar() {
                this.calendar = [];
                let now = new Date();
                now = new Date(now.setMonth(now.getMonth() + 1));
                if (now.getDate() > 20) {
                    now = new Date(now.setMonth(now.getMonth() + 1));
                }
                this.ym.year = now.getFullYear();
                this.ym.month = now.getMonth() + 1;
                now = new Date(now.getFullYear(), now.getMonth(), 1);
                now = now.firstDayOfWeek();
                for (let i = 0; i < now.weekOfMonth(); i++) {
                    let week = [];
                    for (let j = 0; j < 7; j++) {
                        let day = {
                            year: now.addDays(i * 7).addDays(j).getFullYear(),
                            month: now.addDays(i * 7).addDays(j).getMonth() + 1,
                            date: now.addDays(i * 7).addDays(j).getDate(),
                            day: now.addDays(i * 7).addDays(j).getDay(),
                            point: 0
                        };
                        week.push(day);
                    }
                    this.calendar.push(week);
                }
            },
            computeUsePoint() {
                let total = 0;
                for (let i = 0; i < this.calendar.length; i++) {
                    for (let j = 0; j < 7; j++) {
                        total += parseInt(this.calendar[i][j].point);
                    }
                }
                this.usePoint = total;
            },
            showContent() {
                this.cancelSec = this.editTime;
                let timeOut = setInterval(() => {
                    this_Vue.cancelSec = this_Vue.cancelSec - 1;
                    if (this_Vue.cancelSec <= 0) {
                        clearInterval(timeOut);
                        this_Vue.empid = ``;
                    }
                }, 1000);
            },
            submitData() {
                let data = [];
                this.calendar.forEach((weekCurrentValue, weekIndex, calendarArray) => {
                    weekCurrentValue.forEach((dayCurrentValue, dayIndex, weekArray) => {
                        if (dayCurrentValue.point != 0) {
                            data.push({
                                VacationDate: `${dayCurrentValue.year}-${dayCurrentValue.month}-${dayCurrentValue.date}`,
                                Point: dayCurrentValue.point
                            })
                        }
                    })
                })
                this.cancelSec = 0;
                $.ajax({
                    type: `post`,
                    url: config.testURL,
                    data: {
                        Order: `Update_ExprectVacation`,
                        cuid: custid,
                        empid: this_Vue.empid,
                        ym: new Date(this_Vue.ym.year, this_Vue.ym.month, 0).toISOString().substr(0, 10),
                        data: JSON.stringify(data)
                    },
                    complete: function (jqXHR, textStatus) {
                        if (jqXHR.responseText != `Success`) {
                            console.log(`Data error!`);
                        }
                    }
                })
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

