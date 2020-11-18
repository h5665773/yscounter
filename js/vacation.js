$(document).ready(function () {
    const SerialPort = require('serialport')
    const this_Vue = new Vue({
        el: `#page`,
        data: {

        },
        methods: {

        },
        compoments: {

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

