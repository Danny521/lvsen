/**
 * Created by LiangChuang on 2014/12/3.
 */
define(["jquery","mootools"],function(){
    var dirtyCheck = new new Class({

        Implements: [Events, Options],

        options: {},

        initialize: function (options) {
            this.setOptions(options);
            this.orginal = [];
            this.checked = [];
            this.bindEvent();
        },

        setOrginal: function (data) {
            if (typeof data === 'string') {
                this.orginal = this.sort(data.split(","));
            }
            if (Object.prototype.toString.call(data) === '[object Array]') {
                this.orginal = this.sort(data);
            }
        },

        setChecked: function (data) {
            if (typeof data === 'string') {
                this.checked = this.sort(data.split(","));
            }
            if (Object.prototype.toString.call(data) === '[object Array]') {
                this.checked = this.sort(data);
            }
        },

        sort: function (arr) {
            return arr.sort(function (a, b) {
                return a - b > 0 ? 1 : 0;
            });
        },

        isEq: function () {
            return this.orginal.join("") === this.checked.join("");
        },

        getAllInfo: function () {
            var checkbox = $("#npplay .body .controller-area .options input:checked"),
            //remarks  = $.trim($(".controller-area .options textarea").val()),
                remarks = $(".controller-area .remarks textarea").val().trim(),
                tmp = [];

            checkbox.each(function () {
                tmp.push($(this).attr("data-id"));
            });

            tmp.push(remarks);

            return tmp;
        },

        bindEvent: function () {
            var self = this;
            $("#npplay .body").on("click", ".controller-area .options li", function () {
                var tmp = self.getAllInfo();

                self.setChecked(tmp);
            });
            // $("#npplay .body").on("click",".controller-area .options label.issue",function(){
            //     $(".controller-area .options .issue").triggerHandler("click");
            // });
            $("#npplay .body").on("change", ".controller-area .remarks textarea", function () {
                var tmp = self.getAllInfo();

                self.setChecked(tmp);
            });
        }

    });

    window.dirtyCheck = dirtyCheck;
    return dirtyCheck;

});