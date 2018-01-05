define(["handlebars"], function() {
    Handlebars.registerHelper('changeType', function(data) {
        if (data) {
            return (data * 100).toFixed(2) + "%"
        } else {
            return "0.0%"
        }
    });
    Handlebars.registerHelper('isVer', function(name) {
        if (name === "平均值") {
            return "bolds"
        } else {
            return "normal"
        }
    });
    Handlebars.registerHelper('spanLen', function(list, top) {
        top.firstLoad = false;
        if (list && list.length) {
            return list.length
        } else {
            return 1
        }
    });

});