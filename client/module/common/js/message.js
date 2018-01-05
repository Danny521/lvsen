/**
 * Created by LiangChuang on 2015/3/11.
 */

define(["require", "ajaxModel", "socket", "handlebars", "base.self"], function(require, ajaxModel, io) {

    require(["jquery.fly"]);

    function Message() {
        this.tpl = '<div class="notifyBox" id="notifyBox{{uid}}">' +
            '<iframe></iframe>' +
            '<div class="notifyBox-header">' +
            '<div class="notifyBox-title">{{module}}</div>' +
            '<div class="notifyBox-close" data-uid="{{uid}}" data-id="{{id}}" data-module="{{moduleId}}">X</div>' +
            '</div>' +
            '<div class="notifyBox-body" data-functionids="{{functionIds}}" data-functionorgids="{{functionOrgIds}}">' +
            '<!--<a href="/module/settings/usercenter/#{{target}}">-->{{hasURL url message id moduleId uid functionIds functionOrgIds}}<!--</a>-->' +
            '</div>' +
            '</div>';

        this.timeout = 60000 * 60; // 1分钟乘以60 = 1小时，最开始1分钟，后来要求变为1小时

        this.timer = null;

        this.linkageTimer = null;

        this.flag = true;

        this.eventArr = [];


        // 不同种类的消息，来源，是否跳转，跳转的页面等
        // 目前四种 不跳转，任务管理 已完成， 消息提醒界面， 运维任务详情页面
        this.map = {
            "1": {
                module: "视频指挥",
                timeout: 60000 * 60
                    //message : "XXXX监巡任务将于2分钟后开始",
                    //url     : ""
                    /*module  : "视频指挥",
                    message : "XXXX视频下载完成",
                    url     : ""
                    module  : "视频指挥",
                    message : "XXXX视频下载失败",
                    url     : "/module/settings/userCenter/#task/processed"*/
            },
            "2": {
                module: "人员布控",
                timeout: 5000
                    // url  : "/module/protection-monitor/alarmmgr/#491198"
            },
            "3": {
                module: "视图库",
                timeout: 60000 * 60
                    //message : "收到一条待审核的案事件",
                    //url     : "/module/settings/userCenter/#message"
                    /*module  : "视图库",
                    message : "您有一条案事件审核通过",
                    url     : "/module/settings/userCenter/#message"
                    module  : "视图库",
                    message : "您有一条案事件被审核打回",
                    url     : "/module/settings/userCenter/#message"
                    module  : "视图库",
                    message : "收到来自**的评论",
                    url     : ""
                    module  : "视图库",
                    message : "收到来自的回复",
                    url     : ""*/
            },
            "4": {
                module: "图像研判",
                timeout: 60000 * 60
                    //message : "**智能分析完成",
                    //url     : ""
                    /*module  : "图像研判",
                    message : "**智能分析失败",
                    url     : "/module/settings/userCenter/#task/processing"*/
            },
            "5": {
                module: "运维管理",
                timeout: 60000 * 60
                    //message : "**自动巡检完成",
                    //url     : "/module/maintenance/maintain/#task/"
                    /*module  : "运维管理",
                    message : "**自动巡检失败",
                    url     : "/module/maintenance/maintain/#task*/
                    /*id"*/
            },
            "6": {
                module: "系统配置",
                timeout: 60000 * 60
            },
            "7": {
                module: "布防报警",
                timeout: 5000
            },
            "8": {
                module: "权限申请",
                timeout: 60000 * 60
            },
            "9": {
                module: "权限审批",
                timeout: 60000 * 60
            },
            "60": {
                module: "权限变更",
                timeout: 60000 * 60
                    //message : "您有临时权限将于明天过期",
                    //url     : "/module/settings/userCenter/#message"
                    /*module : "权限变更",
                    message : "您被赋予了新的权限",
                    url     : "/module/settings/userCenter/#message"
                    module : "权限变更",
                    message : "您有部分权限被收回",
                    url     : "/module/settings/userCenter/#message"*/
            },
            /*交通管理*/
            "10": {
                module: "交通管理",
                timeout: 60000 * 60
            }
        };

        this.API = {
            router: "/service/userCenter/route/",
            NumberOfMsg: "/service/userCenter/unreadMessagesCount/",
            status: "/service/userCenter/messages/"
        };

        this.init();
    }

    Message.prototype = {
        construct: Message,
        notifyFuncList: [],
        init: function() {
            
            var self = this;
            this.tpl = Handlebars.compile(this.tpl);
            this.getSocketChanel("", function(res) {
                if (res.data.channel) {
                    //如果是127.0.0.1这种开发环境，就不使用socket.io
                    //if(!location.hostname.match(/(127\.0\.0\.1)|(localhost)/gi)){
                    self.socket = io.connect("http://" + res.data.channel);
                    self.bindEvent();
                    //}
                    self.helper();
                }
            });

            // 初始化头部小红点提醒
            self.showNumberOfNotify(function(res) {
                self.updateNodify(res.data);
            })
        },

        getSocketChanel: function(route, callback) {
            var self = this;
            route = route ? "/" + route : "";
            $.get(self.API.router + route).then(function(res) {
                if (res && res.code === 200) {
                    if (callback) {
                        callback(res)
                    }
                }
            });
        },

        createNotify: function(data) {
            var uid = parseInt((new Date()).getTime() + (Math.random() * 10000000000000), 10),
                html,
                notifyBox;



            this.closeAllNotify();

            data.uid = uid;

            html = this.tpl(data);
            $(top.document.getElementById("pva-iframe").contentWindow.document.body).find(".notifyBox").remove();
            $(top.document.getElementById("pva-iframe").contentWindow.document.body).append(html);
            notifyBox = $(top.document.getElementById("pva-iframe").contentWindow.document.body).find("#notifyBox" + uid);

            notifyBox.fadeIn(300);

            this.closeNotifyAuto(data.uid, data.moduleId);

        },

        canCreate: function() {
            var hash = window.location.hash,
                hasNoMenu = hash.indexOf("#nomenu") > -1,
                isInIframe = top.location != self.location;

            if (!hasNoMenu && !isInIframe) {
                return true;
            }

        },

        closeNotify: function(id) {
            var notifyBox = $(top.document.getElementById("pva-iframe").contentWindow.document.body).find("#notifyBox" + id);
            notifyBox.fadeOut(300, function() {
                notifyBox.remove();
            });
        },

        closeNotifyAuto: function(id, moduleId) {
            var self = this;
            self.timer = setTimeout(function() {
                self.closeNotify(id);
            }, self.map[moduleId].timeout);
        },

        closeAllNotify: function() {
            $(".notifyBox").remove();
        },

        updateNodify: function(msg) {
            var message = $("#notifyMessage"),
                task = $("#notifyTask"),
                notify = $("#notify");

            if (msg.messageCount > 0 || msg.taskCount > 0) {
                notify.show();
            } else {
                notify.hide();
            }

            if (msg.messageCount > 0) {
                message.show();
                message.text(msg.messageCount > 99 ? "99+" : msg.messageCount);
            } else {
                message.hide();
            }

            if (msg.taskCount > 0) {
                task.show();
                task.text(msg.taskCount > 99 ? "99+" : msg.taskCount);
            } else {
                task.hide();
            }
        },

        updateUserCenter: function(msg) {
            if (window.location.href.indexOf("/settings/usercenter") > -1) {
                var totalCount = msg.messageCount,
                    msg = msg.message,
                    all = jQuery(".casetype li .icon.all");

                if (totalCount > 0) {
                    all.removeClass("isZero").text(totalCount > 99 ? "99+" : totalCount);
                } else {
                    all.addClass("isZero").text(totalCount);
                }

                for (var i = 0; i < msg.length; i++) {
                    var moduleIcon = jQuery(".casetype li[data-module=module" + msg[i]["moduleId"] + "]").find(".icon"),
                        count = msg[i]["count"];

                    if (count > 0) {
                        moduleIcon.removeClass("isZero").text(count > 99 ? "99+" : count);
                    } else {
                        moduleIcon.addClass("isZero").text(count);
                    }
                }
            }
        },

        changeStatus: function(id, moduleId) {
            var self = this;
            $.ajax({
                method: "post",
                "url": self.API.status,
                data: {
                    "ids": id,
                    value: 1,
                    moduleId: moduleId
                }
            }).then(function(res) {
                self.showNumberOfNotify(function(res) {
                    self.updateNodify(res.data);
                    self.updateUserCenter(res.data);
                });
            });
        },

        helper: function() {
            Handlebars.registerHelper("hasURL", function(url, body, id, moduleId, uid, data1, data2) {
                // 如果是布防布控，则把时间和摄像机名称分开显示
                if (moduleId.toString() === "2" && body.indexOf(",") > -1) {
                    body = body.replace(",", "<br />");
                }
                if (moduleId.toString() === "8") {
                    return new Handlebars.SafeString('<a class="apply" target="_blank" data-module="' + moduleId + '" data-id="' + id + '" data-uid="' + uid + '" href="/module/iframe/?windowOpen=1&iframeUrl=/module/permissionApply?id='+id+'">' + body + '</a>');
                }
                if (url) {
                    if (moduleId === 10 && url.indexOf("ftp") !== -1) {
                        return new Handlebars.SafeString('<a target="_blank" data-module="' + moduleId + '" data-id="' + id + '" data-uid="' + uid + '" href="' + url + '">' + body + '</a>');
                    }
                    if (url.indexOf("/module/viewlibs/details/media/video.html") !== -1) { // 历史录像入库后跳转到新视图库 by songxj
                        // 跳转
                        //url = "/module/pvb/index.html#/workbench/entry?videoId=" + id;
                        var videoId = url.substring(url.indexOf("&id=") + 4, url.indexOf("&pagetype"));
                        url = "/module/pvb/index.html#/workbench/entry?videoId=" + videoId;
                    }
                    return new Handlebars.SafeString('<a target="_blank" data-module="' + moduleId + '" data-id="' + id + '" data-uid="' + uid + '" href="/module/iframe/?windowOpen=1&iframeUrl=' + url + '">' + body + '</a>');
                } else {
                    return body;
                }
            });
        },
        showNumberOfNotify: function(callback) {
            var self = this;
            $.get(self.API.NumberOfMsg).then(function(res) {
                if (callback) {
                    callback(res)
                }
            });
        },

        bindEvent: function() {
            var self = this;

            $("body").on("click", ".notifyBox-close", function() {
                self.closeNotify($(this).attr("data-uid"));
                if(parseInt($(this).attr("data-module")) !== 8){
                   self.changeStatus($(this).attr("data-id"), $(this).attr("data-module")); 
                }
            });

            $("body").on("mouseenter", ".notifyBox", function() {
                self.timer && clearTimeout(self.timer);
            });
            $("body").on("mouseleave", ".notifyBox", function() {
                var $close = $(this).find(".notifyBox-close"),
                    uid = $close.attr("data-uid"),
                    moduleId = $close.attr("data-module");
                setTimeout(function() {
                    self.closeNotifyAuto(uid, moduleId);
                }, 100);
            });

            // 页头消息中心弹出 songxj update
            jQuery(parent.document).find("#userEntry").hover(function() {
                self.showNumberOfNotify(function(res) {
                    self.updateNodify(res.data);
                    self.updateUserCenter(res.data);
                });
                $("#notifyInfo").show();
            });

            $("#notifyInfo").hover(function() {}, function() {
                $("#notifyInfo").hide();
            });

            $("#userInfo").hover(function() {}, function() {
                $("#notifyInfo").hide();
            });

            $("body").on("click", ".notifyBox-body a", function() {
                self.closeNotify($(this).attr("data-uid"));
                if(parseInt($(this).attr("data-module")) !== 8){
                   self.changeStatus($(this).attr("data-id"), $(this).attr("data-module")); 
                }
            });

            self.socket.on("connect", function() {

                self.socket.on('message', function(data) {
                    if (data.moduleId === 20) {
                        //当前为监控联动推送
                        if (data.content.type === 8) {
                            // if (timer) {
                            //     clearTimeout(timer);
                            // }
                            // var timer = setTimeout(function() {
                            //     self.openWindow(data.content.eventId);
                            // }, Math.random() * 50000);
                            self.eventArr.push(data.content.eventId);
                            if(self.eventArr.length ===1){
                                self.openWindow();
                            }
                            // self.sleep(Math.random() * 5000);
                            //self.openWindow();
                            return;
                        }
                        //当前为报警信息推送。遍历注册的方法并触发
                        for (var i = 0, le = self.notifyFuncList.length; i < le; i++) {
                            if (typeof self.notifyFuncList[i] === "function") {
                                self.notifyFuncList[i](data);
                            }
                        }
                        return;
                    }

                    var message = data;

                    message.id = data.id;
                    message.moduleId = data.moduleId;
                    message.module = self.map[data.moduleId]["module"];
                    message.message = data.pushDescription;
                    message.url = data.pushUrl || self.map[data.moduleId]["url"];
                    if (self.canCreate()) {
                        self.createNotify(data);
                    }
                });

                self.socket.on('count', function(data) {
                    self.showNumberOfNotify(function(res) {
                        self.updateNodify(res.data);
                        self.updateUserCenter(res.data);
                    });
                });
            });
        },

        openWindow: function() {
            var self = this;
            // var type = "one",
            //     self = this;
            // if (window.linkageConfig.mutiWindow) {
            //     type = "_blank";
            // }
            // if (self.flag) {
            //     window.open("/module/common/checkLinkage/openMonitor.html?eventId=" + id + "", type, "width=680,height=430,top=56,left=160,bottom=46,rigth=60,toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no");
            //     self.flag = false;
            //     if (self.linkageTimer) {
            //         clearTimeout(self.linkageTimer);
            //     }
            //     self.linkageTimer = setTimeout(function() {
            //         self.flag = true;
            //     }, linkageConfig.refuseTimeSpan);
            // }
            if (self.eventArr.length > 0) {
                var timer = setInterval(function() {
                    if(self.eventArr.length === 0){
                        clearInterval(timer);
                        return;
                    }
                    var type = "one";
                    if (window.linkageConfig.mutiWindow) {
                        type = "_blank";
                    }
                    window.open("/module/common/checkLinkage/openMonitor.html?eventId=" + self.eventArr[0] + "", type, "width=680,height=430,top=56,left=160,bottom=46,rigth=60,toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no");
                    self.eventArr.shift();
                }, linkageConfig.refuseTimeSpan);
            }
        },
        fly: function(obj, url) {
            var to = $('#notify').offset(),
                from = obj ? obj.offset() : {
                    left: 0,
                    top: 0
                },
                url = url || "/module/common/images/dot.png",
                flyer = $('<img class="notify-flyer" src="' + url + '"/>');

            flyer.fly({
                start: {
                    left: from.left,
                    top: from.top
                },
                end: {
                    left: to.left,
                    top: to.top,
                    width: 8,
                    height: 8
                }
            });
        }
    };

    window.Message = Message;
    return Message;

});