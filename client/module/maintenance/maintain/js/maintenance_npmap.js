/**
 * @fileOverview  巡检主逻辑，包括手动巡检自动巡检以及地图巡检
 * @author LiangChuang
 * @date 2014.11.04
 * @version 0.9
 */
jQuery(function () {
    /**
    * @global gVideoPlayer
    * @description 引用云台操作的 js ，而此 js 依赖于此全局变量
    * @see  {@link src/js/apps/inspect/control.js}
    */
    gVideoPlayer = mintenance.videoPlayer;
    (function () {
        /**
         * @module  自动巡检
         * @author LiangChuang
         * @example getAutomaticStatus.start();
         */
        var getAutomaticStatus = {
            /**
            * @description t 定时器全局变量 taskId 任务id timeout 超时时间
            * */
            t : null,
            taskId: null,
            timeout: 1000,

            /**
             * @name start
             * @description 开始自动巡检
             */
            start: function () {
                var self = this;
                self.t = setTimeout(function () {
                    self.process.call(self)
                }, self.timeout);
            },

            /**
             * @name process
             * @description 具体处理自动巡检的逻辑 complete 只要 ajax 只要完成就去拿状态，通过状态来继续执行或完成或给提示
             */
            process: function () {
                var self = this;
                self.taskId = $(".mode .automatic").attr("task-id");

                if(!self.t){
                    return;
                }
                $(".autoLayout, .automain").show(); 

                $.ajax({
                    url: "/service/check/automatic/inspection/status",
                    data: {taskId: self.taskId},
                    method: "post",
                    complete: function (res) {
                        if (res && res.responseJSON.code && res.responseJSON.code === 200) {
                            // 1 成功 0 失败
                            var status  = res.responseJSON.data.status,
                                percent = res.responseJSON.data.progress || 0;

                            /**
                             * 添加巡检进度显示 2014.11.09 By LiangChuang
                             */
                            //if(percent){
                                $("#percent").text(percent + "%");
                            //}

                            if (status === 1 || status === 0) {
                                setTimeout(function(){self.giveStatus(self.taskId)},500);
                                $(".autoLayout").hide();
                                if ($(".mode .automatic").length > 0) {
                                    $(".mode .automatic").removeClass("active").text("自动");
                                    $(".mode").attr("data-automatic", 0);
                                }
                                if (status === 0) {
                                    notify.warn("自动巡检任务失败，已返回巡检完成的摄像机状态！");
                                }
                            } else {
                                self.start();
                                $(".rMenu").hide();
                            }
                        } else {
                            self.start();
                            $(".rMenu").hide();
                        }
                    },
                    timeout: self.timeout
                });
            },

            /**
             * @name giveStatus
             * @description 给出自动巡检的结果 拿巡检的结果，然后 initPrevStatus 给出巡检状态，checkboxAction 初始化勾选表单
             */
            giveStatus: function (taskId) {
                $.when(mintenance.loadData("get_task?taskId=" + (taskId || this.taskId))).done(function (data) {
                    initPrevStatus(data.data.task.cameras,true);
                    $(".autoLayout").hide();
                    $(".rMenu").show();
                    mintenance.data.isStatusChanged = true; // 巡检完成，设置状态标志，返回时提示
                    checkboxAction();
                })
            },

            /**
             * @name pause
             * @description 暂停自动巡检 不向后端拿取巡检状态了，返回的时候用。但是巡检仍旧继续
             */
            pause: function () {
                clearTimeout(this.t);
                $(".rMenu").show();
            },

            /**
             * @name stop
             * @description 停止自动巡检 完全停止自动巡检，并给出已经巡检的摄像机的状态
             * @see process
             */
            stop: function () {

                var self = this;
                self.taskId = $(".mode .automatic").attr("task-id");
                clearTimeout(this.t);

                $(".autoLayout .automain").show().find("p").text("请稍等...");

                $.ajax({
                    url: "/service/check/automatic/delete/task",
                    data: {taskId: self.taskId},
                    method: "post",
                    complete: function (res) {
                        if (res && res.responseJSON.code && res.responseJSON.code === 200) {
                            self.giveStatus();
                        } else {
                            if ($(".mode .automatic").length > 0) {
                                $(".mode .automatic").addClass("active").text("停止");
                                $(".mode").attr("data-automatic", 1);
                                $(".autoLayout .automain").find("p").text("巡检中...");
                                $(".rMenu").show();
                                notify.warn("停止自动巡检任务时服务器出错，停止失败，请稍后重试！");
                                self.start();
                            }
                        }
                    },
                    timeout: self.timeout
                })
            }
        };

        /**
         * @global getAutomaticStatus
         * @description 设置为全局变量，其他文件调用
         */
        mintenance.getAutomaticStatus = getAutomaticStatus;


        /**
         * @function
         * @name makePolling
         * @description 巡检初始化函数 获取任务数据，初始化界面，初始化树形，如果自动巡检中，则初始化自动巡检等。
         * @param  {Number|string} taskId 巡检任务 id
         * @return {}
         */
        function makePolling(taskId) {
            var xTask = mintenance.witchTask,
                htmlt,
                htmls;

            /**
             * 用了简单的方式防止重复执行代码
             */
            if (mintenance.polling.isGettingData) {
                notify.warn("正在获取数据中，请稍后！", {timeout: 1500});
                return false;
            }

            mintenance.polling.isGettingData = true;

            /**
             * 获取模板和数据
             */
            $.when(mintenance.loadTpl("maintenance_polling"), mintenance.loadData("get_task?taskId=" + taskId)).done(function (html, data) {
                mintenance.polling.isGettingData = false;
                if (data.data.task.cameras === null || data.data.task.cameras.length === 0) {
                    notify.info("没有可以查看的摄像机！");
                    $(".group-item i.loading").hide();
                    return;
                }

                pagination.hidePage();

                $("#sidebar>.header>ul").hide();
                $("#treePanel").css({
                    "top": 36 //摄像机搜索暂时隐藏122
                });

                /**
                 * 存储获取到的数据到全局变量，巡检中使用
                 */
                mintenance.data.taskorgids = data.data.taskorgids; // 缓存数据
                mintenance.data[xTask] = data.data.task; // 缓存数据
                mintenance.data.modifyCamerasList = data.data.task.cameras;
                mintenance.maxLen = mintenance.data[xTask].cameras.length;
                mintenance.data.taskStatus = data.data.task.taskStatus;  // 是否已经提交任务 1 未巡检 2 已巡检
                mintenance.data.isComplete = data.data.status;  // 自动巡检是否完成的标志     0 未设置 1 完成 2 未完成

                //
                /**
                 * 获取所有巡检摄像机祖先节点的ID
                 * @see getAllTreeId
                 */
                getAllTreeId();

                /**
                 * 将渲染好的模板一分为二，滚动条上部和下部分别使用，innerHTML 为了兼容 IE
                 */
                htmlt = $(mintenance.render("maintenance_polling", data.data));
                htmls = (htmlt[2] || htmlt[1]).innerHTML;

                $("#sidebar>.header .newinsertheader").remove();
                $("#" + xTask).html(htmls);
                $("#sidebar>.header").append(htmlt[0].innerHTML);

                if (xTask.indexOf("checktask") !== -1) {
                    jQuery("#submittask").remove();
                }

                /**
                 * 初始化树形菜单
                 * @see tree.js
                 */
                var cameraTree = new CameraTree({
                    node: $(".cameras-list .treePanel"),
                    nodeHeight: jQuery('#treePanel .viewport').css('height', jQuery("#treePanel").height() - (40 + 70 + 70 + 65)),
                    selectable: true,
                    checkboxClick: function (el) {
                        addOrDeleteCameraIdforData(el);
                    },
                    leafClick: function (el, e) {
                        var elm    = el.closest('li'),
                            id     = elm.attr('data-id') - 0,
                            target = $(e.target),
                            text   = target.text(),
                            truely = target.hasClass("camearstatus") && text !== '巡检中',  // 点击的对象以及是否是正异常
                            isCntn = $('.camearstatus:contains("巡检中")').length > 0, // 巡检是否还在继续
                            length = $(".manual.active").length;           // 是否开始了巡检

                        // 如果点击的是正异常信息
                        if (truely) {

                            if (isCntn) {
                                notify.warn("请完成或停止巡检任务后再进行此操作！");
                                return false;
                            }

                            if (length > 0) {
                                $(".manual.active").trigger("click");
                            }
                            playSingleVideo(id);
                            mintenance.videoPlayer.setFocusWindow(0);
                            mintenance.videoPlayer.fireEvent('OCXCLICK', 0);

                            //mintenance.data.isSingle = true;

                            if (length > 0) {
                                $(".page-turning span").addClass("disable");
                            }
                            //mintenance.videoPlayer.setFocusByCameraID(id);

                            if (mintenance.videoPlayer !== null && mintenance.model ==="classic") {
                                mintenance.videoPlayer.setFocusByCameraID(id, function (cameraData) {
                                    mintenancePlayer.setData(cameraData);
                                });
                            }

                            if (mintenance.model === 'maptype') {
                                mintenance.mapObj.triggerWindowOnMap();
                            }

                            return false;
                        }

                        return false;

                    },
                    leafDblClick: function (self) {
                        var elm = jQuery(self).closest('li'),
                            id = elm.attr('data-id'),
                            text = elm.find(".camearstatus").text();

                        mintenance.curCameraIndex = getIndexById(id);

                        //dbClickMakeStatus(mintenance.curCameraIndex);

                        //camearStatus(elm,"巡检中");

                        /*if(text !== "巡检中"){
                         elm.find(".camearstatus").attr({"data-status":text});
                         }*/

                        clearPollingStatus();

                        mintenance.data.expandTree.starusElmLen = 1;
                        mintenance.data.expandTree.prevCameras = [];

                        expandTree(4);

                        if (mintenance.model === 'classic') {
                            //postNormal();
                            checkboxAction();
                            showVideo(mintenance.layout);
                        }

                        if ($(".mode").length > 0 && $(".mode .manual.active").length <= 0) {
                            $(".mode").attr("data-manual", 1);
                            $(".manual").addClass("active").text("停止");
                        }

                        if (mintenance.model === 'maptype') {
                            mintenance.mapObj.triggerWindowOnMap();
                        }
                    }
                });


                /**
                 * 绑定自动巡检，因为要用到 cameraTree 的方法，所以放在 makePolling 函数内部。
                 */
                $("#mytask").unbind("autoPolling");
                $("#mytask").on("autoPolling", function () {
                    //mintenance.videoPlayer.stopAll();
                    //mintenance.videoPlayer.refreshAllWindow();

                    var ids = cameraTree.getSelectedLeafs(),
                        len = ids.length,
                        data = mintenance.data.modifyCamerasList,
                        cameraList = [],
                        tmp = {},
                        id;

                    if (len <= 0) {
                        notify.warn("请选择摄像机后再自动巡检！");
                        return false;
                    }

                    for (var i = 0; i < len; i++) {
                        id = ids[i] - 0;
                        for (var j = 0; j < data.length; j++) {
                            if (data[j].cameraId === id) {
                                tmp = {
                                    cameraId   : id,
                                    pvgIp      : data[j].pvgIp,
                                    cameraType : data[j].cameraType,
                                    pvgPort    : data[j].pvgPort,
                                    userName   : data[j].userName,
                                    password   : data[j].password,
                                    channels   : [
                                        {avObj : data[j].cameraNo}
                                    ]

                                };
                                cameraList.push(tmp);
                            }
                        }
                        //$("li.leaf[data-id=" + id + "]").children(".camearstatus").hide();
                        //$("li.leaf[data-id=" + id + "]").children(".camearstatus").text("").css({"margin-left":0}).attr({"data-status":""});
                    }

                    /**
                     * 开始自动巡检
                     */
                    $.ajax({
                        url: "/service/check/automatic/inspection",
                        data: {cameraList: JSON.stringify({cameraList: cameraList}), taskId: $(".mode .automatic").attr("task-id")},
                        method: "post",
                        beforeSend: function () {
                            $(".autoLayout,.automain").show();
                        },
                        success: function (res) {
                            var automatic = $(".mode .automatic");
                            if (res && res.code === 200) {
                                $(".autoLayout,.automain").show();
                                getAutomaticStatus.start();
                            } else {
                                $(".autoLayout,.automain").hide();
                                notify.warn("设置自动巡检时服务器出错，请稍后重试！");
                                //$(".mode .automatic").trigger("click");
                                automatic.text("自动");
                                $(".mode").attr("data-automatic", 0);
                                automatic.removeClass("active");
                                $(".rMenu").show();
                            }
                        }
                    })
                });

                /**
                 * 日志
                 */
                logDict.insertLog('m2', 'f3', 'o17', 'b19', mintenance.data['mytask'].taskName); // 查询日志

            }).fail(function () {
                mintenance.polling.isGettingData = false;
                $(".group-item i.loading").hide();
                notify.error("获取模板或数据失败，服务器错误，请稍后重试！");
            });
        }


        // 点击搜索结果播放一个
        $("#mytask").on("click", ".cameraSearch.treePanel li.leaf .camearstatus", function () {
            var target = $(this),
                id = target.closest('li').attr('data-id') - 0,
                text = target.text(),
                truely = target.hasClass("camearstatus") && text !== '巡检中',  // 点击的对象以及是否是正异常
                isCntn = $('.camearstatus:contains("巡检中")').length > 0; // 巡检是否还在继续

            // 如果点击的是正异常信息
            if (truely) {

                if (isCntn) {
                    notify.warn("请完成或停止巡检任务后再进行此操作！");
                    return false;
                }

                playSingleVideo(id);
                mintenance.videoPlayer.setFocusWindow(0);
                mintenance.videoPlayer.fireEvent('OCXCLICK', 0);
                logDict.insertLog('m2', 'f3', 'o19', '', $(".item-header h3.name").text() + '任务(搜索)'); // 手动巡检日志
                return false;
            }
        });
        // 双击搜索结果播放一批
        $("#mytask").on("dblclick", ".cameraSearch.treePanel li.leaf span.name", function () {
            var elm = jQuery(this).closest('li'),
                id = elm.attr('data-id'),
                text = elm.find(".camearstatus").text();

            mintenance.curCameraIndex = getIndexById(id);

            //dbClickMakeStatus(mintenance.curCameraIndex);

            //camearStatus(elm,"巡检中");

            /*if(text !== "巡检中"){
             elm.find(".camearstatus").attr({"data-status":text});
             }*/

            clearPollingStatus();

            mintenance.data.expandTree.starusElmLen = 0;
            mintenance.data.expandTree.prevCameras = [];
            mintenance.data.search.starusElmLen = 1;
            mintenance.data.search.polling = true;

            expandTree(4);

            if (mintenance.model === 'classic') {
                //postNormal();
                showVideo(mintenance.layout);
            }

            if (mintenance.model === 'maptype') {
                mintenance.mapObj.triggerWindowOnMap();
            }
            logDict.insertLog('m2', 'f3', 'o19', '', $(".item-header h3.name").text() + '任务(搜索)'); // 手动巡检日志
        });

        // 点击收缩
        $("#mytask").on("click", ".cameraSearch.treePanel i.fold", function () {
            var li = $(this).closest("li"),
                isShow = li.hasClass("active"),
                ul = $(this).siblings("ul");

            li.toggleClass("active");
            if (isShow) {
                ul.hide();
            } else {
                ul.show();
            }
        });


        // 点击 手动巡检 或者 自动巡检
        $("#mytask").on("click", ".mode", function (e) {
            var self = $(this),
                target = $(e.target),
                isAuto = target.hasClass("automatic"),
                manual = self.attr("data-manual") - 0,
                automc = self.attr("data-automatic") - 0;

            if (mintenance.data.isSingle) {
                notify.warn("请先完成单个摄像机的巡检后再操作！");
                return false;
            }

            if (isAuto) {
                if (manual === 0) {
                    if (automc) {  // 停止
                        target.text("自动");
                        self.attr("data-automatic", !automc - 0);
                        getAutomaticStatus.stop();
                        target.removeClass("active");
                        $(".rMenu").show();
                        logDict.insertLog('m2', 'f3', 'o20', '', $(".item-header h3.name").text() + '任务(停止自动巡检)'); // 自动巡检日志
                    } else {  // 启动
                        if ($("#mytask .treePanel .selected").length <= 0) {
                            notify.warn("请选择摄像机后再自动巡检！");
                            return false;
                        }
                        target.text("停止");
                        $("#mytask").triggerHandler("autoPolling");
                        self.attr("data-automatic", !automc - 0);
                        target.addClass("active");
                        $(".rMenu").hide();
                        checkboxAction(true);
                        logDict.insertLog('m2', 'f3', 'o20', '', $(".item-header h3.name").text() + '任务(开始自动巡检)'); // 自动巡检日志
                    }
                    //clearPollingStatus();
                    return false;
                } else {
                    notify.warn("请先停止手动模式！");
                    return false;
                }
            }

            if (!isAuto) {
                if (automc === 0) {
                    if (manual) {  // 停止
                        target.text("手动");
                        self.attr("data-manual", !manual - 0);
                        target.removeClass("active");
                        mintenance.videoPlayer.stopAllWithoutClearData();
                        mintenance.videoPlayer.refreshAllWindow();
                        mintenancePlayer.hidePtz();
                        clearPollingStatus();
                        $("#video-control").hide();
                        mintenance.data.expandTree.starusElmLen = 0; // 停止了手动巡检
                        logDict.insertLog('m2', 'f3', 'o19', '', $(".item-header h3.name").text() + '任务(停止手动巡检)'); // 手动巡检日志
                    } else {   // 启动
                        target.text("停止");
                        $(".autoLayout").hide();

                        mintenance.data.expandTree.starusElmLen = 1; // 已经开始手动巡检了
                        // 设置第一次巡检的状态
                        expandTree(5);

                        //经典模式下初始化第一个视频
                        if (mintenance.model === 'classic') { //当前模式:经典模式
                            showVideo(mintenance.layout); //播放第一批视频
                        }

                        //地图模式加载过
                        if (mintenance.mapObj.mymap !== null) {
                            mintenance.mapObj.setCamerasToMap(mintenance.newCameras/*mintenance.data[mintenance.witchTask].cameras*/, mintenance.mymap);
                        }
                        self.attr("data-manual", !manual - 0);
                        target.addClass("active");
                        logDict.insertLog('m2', 'f3', 'o19', '', $(".item-header h3.name").text() + '任务(开始手动巡检)'); // 手动巡检日志
                    }
                    return false;
                } else {
                    notify.warn("请先停止自动模式！");
                    return false;
                }
            }
        });

        function playSingleVideo(id) {
            var data = getCameraDataById(id);

            playVideo([data], 1);

            mintenance.data.isSingle = true;
        }

        // 通过 ID 获取摄像机数据
        function getCameraDataById(id) {
            var cameras = mintenance.newCameras,
                len = cameras.length;

            for (var i = 0; i < len; i++) {
                if (cameras[i].cameraId === id) {
                    return cameras[i];
                }
            }
        }

        /*jQuery("#mytask,#checktask").on("cameraExprendComplete",".cameras", function(e, html) {
         var cameras = null,
         dataId  = [],
         elm     = $("#mytask .treePanel"),
         len;
         setTimeout(function(){
         cameras = elm.find("li[data-res=camera]:visible");
         elm.find("li[data-res=camera]:hidden").remove();
         len = cameras.length
         for(var i=0;i<len;i++){
         dataId.push(cameras.eq(i).attr("data-id") - 0);
         }
         sorttedByTree(dataId);
         expandTree(4);
         },500);
         });*/

        /**
         * 绑定摄像机树展开完成事件，处理数据，排序等，然后才可执行巡检任务。
         */
        jQuery("#mytask,#checktask").on("cameraExprendComplete", ".cameras", function (e, html) {
            var cameras = null,
                dataId = [],
                elm = $("#mytask .treePanel"),
                taskStatus = mintenance.data.taskStatus, // 任务状态(是否提交) 1 未提交 2 已提交
                isComplete = mintenance.data.isComplete, // 自动巡检是否完成   0 未设置 1 已完成 2 未完成
                len;

            //当前模式:地图模式
            if (mintenance.model === 'maptype') {
                mintenance.PrevLayout = mintenance.layout;
                mintenance.layout = 1;
            }

            checkboxAction();  // 使异常原因等可用。
            setTimeout(function () {

                cameras = elm.find("li[data-res=camera]:visible");
                elm.find("li[data-res=camera]:hidden").remove();
                elm.find("li.tree[data-res=org]:hidden").remove();
                len = cameras.length;

                for (var i = 0; i < len; i++) {
                    dataId.push(cameras.eq(i).attr("data-id") - 0);
                }
                // 任务未提交且自动巡检设置后未完成
                if (isComplete === 2) {
                    $(".mode .automatic").addClass("active").text("停止");
                    $(".mode").attr("data-automatic", 1);
                    getAutomaticStatus.process();
                    checkboxAction(true);
                } else {
                    // 如果任务已经提交或者自动巡检完成，则初始化上一次巡检的状态
                    if (taskStatus === 2) {
                        initPrevStatus();
                        $(".autoLayout").hide();
                    }
                    // 如果完成，则置一个标志，返回的时候提示
                    if (isComplete === 1) {
                        mintenance.data.isStatusChanged = true;
                    }
                }
                // 通过左侧树形界面上显示的顺序，排序返回的数据
                sorttedByTree(dataId);

                // 设置位置
                setAutoLayoutPosition();

                // 预加载预登录
                var c = mintenance.newCameras,
                    length = c.length,
                    ly = mintenance.layout;

                /*if (!mintenance.videoPlayer) {
                    mintenance.videoPlayer = new VideoPlayer({
                        layout: ly
                    });
                }*/

                // 预登录
                for (var l = 0; l < length; l++) {
                    mintenance.videoPlayer.login(modifyDataForPreLoginPerPlay(mintenance.newCameras[l]));
                }

                // 预播放
                /*for (var j = 0; j < ly; j++) {
                    mintenance.prePlay[j] = mintenance.videoPlayer.preOpenStream(modifyDataForPreLoginPerPlay(mintenance.newCameras[j], true), j);
                }*/

                //当前模式:地图模式
                if (mintenance.model === 'maptype') {
                    if (mintenance.maxLen <= 0) {
                        notify.info('没有可以播放的摄像机！', {timeout: '1000'});
                        return;
                    }

                    setTimeout(function () {
                        mintenance.mapObj.setCamerasToMap(mintenance.newCameras /*mintenance.data[mintenance.witchTask].cameras*/, mintenance.mymap);
                        mintenance.mapObj.triggerWindowOnMap();
                        /*加载第一个*/
                    }, 500);

                    if ($(".mode").length > 0 && $(".mode .manual.active").length <= 0) {
                        $(".mode .manual").trigger("click");
                        $(".mode").hide();
                    }
                }

            }, 500);
        });

        // 预加载预登录数据的处理转换
        function modifyDataForPreLoginPerPlay(data, play) {
            if(!data || !data.userName){
                return {};
            }
            /*var tmp = {
                user: data.userName,
                passwd: data.password,
                ip: data.pvgIp,
                port: data.pvgPort,
                cId: data.cameraId,
                orgId: data.orgId,
                cType: data.cameraType
            };*/
            var tmp = {
                ip     : data.pvgIp,
                port   : data.pvgPort,
                user   : data.userName,
                passwd : data.password,
                cType  : data.cameraType,
                cId    : data.cameraId,
                type   : 1, /*1:实时流*/
                orgId  : data.orgId,
                cameraChannel : {
                    id : data.channelId
                }
            }
            if (play) {
                tmp.path = data.cameraNo;
            }
            return tmp;
        }

        // 双击摄像机巡检，改变其他摄像机巡检状态
        function dbClickMakeStatus(index) {
            var task = mintenance.witchTask,
                target = $("#" + task + " .treePanel"),
                cameras = mintenance.data[task].cameras,
                len = cameras.length,
                status,
                cameraId,
                curtCamera;

            for (var i = 0; i < len; i++) {
                cameraId = cameras[i].cameraId;
                curtCamera = target.find("li.leaf[data-id=" + cameraId + "]");
                status = (curtCamera.find(".camearstatus").attr("data-status") === "异常" || $(".controller-area .mark p.small.button").hasClass("red")) ? "异常" : "正常";
                //if(i<=index){
                if (curtCamera.find(".camearstatus").length <= 0) {
                    //camearStatus(curtCamera,"未巡检");
                } else if (curtCamera.find(".camearstatus").text() === "巡检中") {
                    if (status === '异常') {
                        curtCamera.find(".camearstatus").text(status).css({"margin-left": "-28px", "color": "#D95C5C"});
                    } else {
                        curtCamera.find(".camearstatus").text(status).css({"margin-left": "-28px", "color": "#8CCE58"});
                    }
                }
                /*}else if(curtCamera.find(".camearstatus").text() === "巡检中"){
                 curtCamera.find(".camearstatus").text("未巡检");
                 }*/
            }
        }

        jQuery(document).on('click', '.groups .moredetail', function () {
            var taskId = jQuery(this).attr('task-id').trim();
            mintenance.action = mintenance.witchTask === "mytask" ? ".header .mytask" : ".header .checktask";
            makePolling(taskId);
            $(this).siblings("i.loading").show();
            mintenance.pointertrigger = true;
            /*分任务状态:展开*/
            mintenance.optChange = 0;
        });

        jQuery(document).on('click', '.item-header .show-details', function () {
            var searching = jQuery(this).parents('.searching'),
                details = searching.next('.details'),
                arrow = jQuery(this).parents('.item-header').find('.arrow');

            $("#treePanel").css({"top": 36});
            searching.hide();
            details.show();

            if (!arrow.hasClass('drop')) {
                arrow.toggleClass('drop');
            }
            return false;
        });

        jQuery(document).on('click', '.item-header .cancel', function () {
            var parents = jQuery(this).closest('form'),
                searching = parents.find('.searching'),
                status = jQuery('.searching .status'),
                arrow = jQuery(this).parents('.item-header').find('.arrow');

            parents.find('.details').hide();

            if ((status.css('display') !== 'block')) {
                arrow.toggleClass('drop');
            }
            searching.show();

            if (status.is(":visible")) {
                $("#treePanel").css({"top": 36});
            } else {
                $("#treePanel").css({"top": 36});
            }

            //jQuery('.back-home').trigger('click');
            cameraSearch.cancelSearch();

        });

        jQuery(document).on('click', 'h3.name', function () {

            var parents = jQuery(this).next('form'),
                searching = parents.find('.searching'),
                details = parents.find('.details'),
                status = searching.find('.status');

            if (searching.css('display') === 'block') {
                if (status.is(":visible")) {
                    $("#treePanel").css({"top": 36});
                } else {
                    $("#treePanel").css({"top": 36});
                }
                status.toggle();
            }

            if (details.css('display') === 'block') {
                details.children('.detailsinner').toggle();
            }
            jQuery(this).find('i').toggleClass('drop');
        });

        jQuery(document).on('mouseover', '.moredetail', function () {
            jQuery(this).css('cursor', 'pointer');
        });

        jQuery(document).on('focus', '.datepicker', function () {
            addDatepicker(jQuery('.datepicker'));
        });

        jQuery('.controller-area').on('change', 'input,textarea', function () {
            if (jQuery('#abnormal').hasClass('red')) {
                mintenance.optChange = 1;
            }
        });

        jQuery(document).on('change', '.map-issue input,.map-issue textarea', function () {
            mintenance.optChange = 1;
        });

        function showNext() {
            if (mintenance.curCameraIndex >= mintenance.maxLen - 1) {
                notify.info('已经是该组最后一个摄像机！', {timeout: '1000'});
                mintenance.curCameraIndex = mintenance.maxLen - 1; // 到达最后一个时重置当前索引为数组最后一个
                if (mintenance.videoPlayer) {
                    mintenance.videoPlayer.stopAllWithoutClearData();
                    mintenance.videoPlayer.refreshAllWindow();
                }
                if (mintenance.mapvideoPlayer) {
                    mintenance.mapvideoPlayer.stopAllWithoutClearData();
                    mintenance.mapvideoPlayer.refreshAllWindow();
                }
                if (mintenance.model === 'maptype' && jQuery('.esriPopupWrapper').css('visibility') === 'hidden') {
                    mintenance.mapObj.triggerWindowOnMap();
                }
                return 0;
            }


            //mintenance.curCameraIndex += mintenance.layout-1;

            if (mintenance.curCameraIndex < 0) {
                mintenance.curCameraIndex = 0 - mintenance.layout;
            } else {
                mintenance.data.expandTree.isLast = 0;
            }
            mintenance.curCameraIndex = (mintenance.curCameraIndex + mintenance.layout) >= mintenance.maxLen ? mintenance.maxLen : (mintenance.curCameraIndex + mintenance.layout);

            if (mintenance.model === 'classic') {
                showVideo(mintenance.layout);
            } else {
                mintenance.mapObj.triggerWindowOnMap();
            }
        }

        function showPrevious() {
            if (mintenance.curCameraIndex <= 0) {
                notify.info('已经是该组第一个摄像机！', {timeout: '1000'});
                mintenance.data.expandTree.isLast = 1;
                expandTree(1, 1);
                mintenance.data.expandTree.isLast = 0;
                if (mintenance.videoPlayer) {
                    mintenance.videoPlayer.stopAllWithoutClearData();
                    mintenance.videoPlayer.refreshAllWindow();
                }
                if (mintenance.mapvideoPlayer) {
                    mintenance.mapvideoPlayer.stopAllWithoutClearData();
                    mintenance.mapvideoPlayer.refreshAllWindow();
                }
                if (mintenance.model === 'maptype' && jQuery('.esriPopupWrapper').css('visibility') === 'hidden') {
                    mintenance.mapObj.triggerWindowOnMap();
                }
                return;
            }

            if (mintenance.curCameraIndex >= mintenance.maxLen - 1) {
                //if((mintenance.model === 'maptype' || mintenance.model === 'classic') && mintenance.data.expandTree.isLast === 1){
                if (mintenance.layout === 1 && mintenance.data.expandTree.isLast === 1) {
                    mintenance.curCameraIndex = (mintenance.curCameraIndex - mintenance.layout < 0 ? 0 : mintenance.curCameraIndex - mintenance.layout); // 解决最后一个返不回去的问题
                    mintenance.data.expandTree.isLast = 0;
                } else {
                    mintenance.curCameraIndex = (mintenance.curCameraIndex - mintenance.layout < 0 ? 0 : mintenance.curCameraIndex - mintenance.layout) + 1;
                    mintenance.data.expandTree.isLast = 1;
                }
            } else {
                mintenance.curCameraIndex = mintenance.curCameraIndex - mintenance.layout < 0 ? 0 : mintenance.curCameraIndex - mintenance.layout;
                mintenance.data.expandTree.isLast = 0;
            }

            if (mintenance.model === 'classic') {
                showVideo(mintenance.layout, 1);
            } else {
                mintenance.mapObj.triggerWindowOnMap();
            }
        }

        // function self.mapUpInfo(){
        // 	if (mintenance.maxLen <= 0) {
        // 		notify.info('没有可以切换的摄像机',{timeout:'1000'});
        // 		return '0';
        // 	}

        // 	var nor = jQuery('#mapNormal'),
        // 		abnor = jQuery('#mapAbnormal'),
        // 		par = jQuery('.map-issue');

        // 	if(abnor.hasClass('red') && par.find(':checked').length <= 0){
        // 		notify.info("请先选择摄像机异常原因！",{timeout:'1000'});
        // 		//if(mintenance.model === 'maptype'){
        // 			par.show().offset({
        // 				//left: jQuery('.pointer.bottom').length >=1 ? jQuery('.pointer.bottom').offset().left + 50 : jQuery('.contentPane').offset().left + 50
        // 				left:jQuery('#npgis_FrameDecorationDiv_0').offset().left + 50
        // 			});
        // 		//}
        // 		return '0';
        // 	}

        // 	if(!mintenance.optChange){
        // 		/*异常信息是否变动过*/
        // 		if(abnor.hasClass('red')){
        // 			// 异常
        // 			showPrevious();
        // 			expandTree(2,1);
        // 		}else if(nor.hasClass(('green'))){
        // 			//正常
        // 			showPrevious();
        // 			expandTree(1,1);
        // 		}else{
        // 			//未巡检
        // 			postNormal();
        // 			showPrevious();
        // 			expandTree(1,1);
        // 		}
        // 	}else{
        // 		getIssues(par, 2);
        // 		//异常
        // 		expandTree(2,1)
        // 	}
        // }

        // function mapDownInfo(){
        // 	var par = jQuery('.map-issue'),
        // 		nor = jQuery('#mapNormal'),
        // 		abnor = jQuery('#mapAbnormal');

        // 	if (abnor.hasClass('red')) {
        // 		if (par.find(':checked').length <= 0) {
        // 			notify.info('请先选择摄像机异常原因！',{timeout:'1000'});
        // 			//if(mintenance.model === 'maptype'){
        // 				par.show().offset({
        // 					//left: jQuery('.pointer.bottom').length >=1 ? jQuery('.pointer.bottom').offset().left + 50 : jQuery('.contentPane').offset().left + 50
        // 					left:jQuery('#npgis_FrameDecorationDiv_0').offset().left + 50
        // 				});
        // 			//}
        // 			return '0';
        // 		}
        // 		if(mintenance.optChange){
        // 			getIssues(par, 2);
        // 		}
        // 		showNext();
        // 		//异常
        // 		expandTree(2);
        // 	} else if (nor.hasClass('green')) {
        // 		//正常
        // 		showNext();
        // 		expandTree(1);
        // 	} else {
        // 		//未巡检
        // 		postNormal();
        // 		showNext();
        // 		expandTree(1);
        // 	}
        // }

        function upInfo() {
            checkboxAction();

            if (mintenance.curCameraIndex >= -1) {
                postNormal();   // 提交本批次正常摄像机信息
            }

            showPrevious();    // 显示下一批视频
            expandTree(1, 1);   // 更新摄像机树状态

            // 当前摄像机索引小于 0 的时候，置一些标志
            if (mintenance.curCameraIndex <= 0) {
                mintenance.curCameraIndex = -1;
                mintenance.data.expandTree.isLast = 1;
            }
        }

        // 绑定点击确定的事件
        jQuery(document).on('click', '#exception', function () {
            var par = null,
                taskStatus = mintenance.data.taskStatus, // 任务状态(是否提交)
                isComplete = mintenance.data.isComplete,// 自动巡检是否完成
                isSPolling = mintenance.data.search.polling,
                cameraData = mintenance.data.cameraData,
                status;

            if (!isSPolling) {
                if (($(".mode .active").length <= 0 && !mintenance.data.isSingle)) {
                    notify.warn("请开始巡检后提交摄像机异常信息！");
                    return false;
                }
            }

            if (cameraData === null || cameraData.length <=0 || JSON.stringify(cameraData)==="{}") {
                notify.warn("请先选择正确的摄像机！");
                return false;
            }

            if (mintenance.model === 'classic') {
                par = jQuery('.controller-area');
            }

            if (mintenance.model === 'maptype') {
                par = jQuery('.map-issue');
            }

            if (dirtyCheck.isEq()) {
                notify.warn("未修改异常原因，请勿重复提交！");
                return false;
            }

            if (mintenance.data.isSingle) {
                if ($(".camearstatus:visible").length !== mintenance.maxLen) {  // 判断下是否是所有的都巡检完了
                    mintenance.data.isSingle = false;
                    //mintenance.data.cameraData = null;
                    status = par.find(':checked').length <= 0 ? 1 : 2;  // 1 正常 2 异常
                    getIssues(par, status);
                    $(".mode .manual").trigger("click");
                    mintenance.data.isStatusChanged = true;
                    return false;
                } else {
                    mintenance.data.isSingle = false;
                    //mintenance.data.cameraData = null;
                    mintenance.videoPlayer.stopAllWithoutClearData();
                    mintenance.videoPlayer.refreshAllWindow();
                    $("#video-control").hide();
                    mintenance.videoPlayer.setLayout(mintenance.layout);
                    status = par.find(':checked').length <= 0 ? 1 : 2;  // 1 正常 2 异常
                    getIssues(par, status);
                    mintenance.data.isStatusChanged = true;
                    return false;
                }
                return false;
            }

            if (!mintenance.data.cameraData) {
                notify.warn("请选择要巡检的摄像机后继续！");
                return false;
            }

            /*            if (par.find(':checked').length <= 0) {

             */
            /*notify.info('请先选择摄像机异常原因！',{timeout:'1000'});
             if(mintenance.model === 'maptype'){
             par.show().offset({
             left: jQuery('.pointer.bottom').length >=1 ? jQuery('.pointer.bottom').offset().left + 50 : jQuery('.contentPane').offset().left + 50
             });
             }*/
            /*
             return '0';
             }*/
            status = par.find(':checked').length <= 0 ? 1 : 2;  // 1 正常 2 异常
            getIssues(par, status);
        });

        function downInfo() {
            checkboxAction();
            if (mintenance.curCameraIndex <= mintenance.maxLen - 1) {
                postNormal();   // 提交本批次正常摄像机信息
            }
            showNext();     // 显示下一批视频

            expandTree(1);  // 更新摄像机树状态
        }

        /*点击上一页*/
        jQuery(document).on('click', '#pageup', function () {

            jQuery('#video-control').hide();

            // 搜索之后的巡检
            if (mintenance.data.search.isSearching) {
                mintenance.data.search.starusElmLen = true; // 设置
                upInfo();
                return false;
            } else {
                // 按钮是否可用
                if (mintenance.isDisabled($(this)) || !$(".manual").hasClass("active")) {
                    return false;
                }
            }

            mintenance.data.expandTree.starusElmLen = 1;  // 已经开始手动巡检
            mintenance.data.isStatusChanged = true;       // 已经改变了状态

            //if(mintenance.model === 'classic'){
            if (mintenance.pointertrigger === false || mintenance.maxLen <= 0) {
                //expandTree("mytask",4,1);
                return;
            }
            //}
            if (upInfo() === '0') {
                return false;
            }
            scrollarMove(); // 移动滚动条
            mintenance.optChange = 0;
        });
        /*地图中上一页*/
        // jQuery(document).on('click', '.mappageup', function() {

        // 	mintenance.data.expandTree.starusElmLen = 1;
        // 	// if(mintenance.model === 'classic'){
        // 	// 	if (mintenance.pointertrigger === false || mintenance.maxLen <= 0) {
        // 	// 		//expandTree("mytask",4,1);
        // 	// 		return;
        // 	// 	}
        // 	// }
        // 	if(self.mapUpInfo() === '0'){
        // 		return false;
        // 	}

        // 	//showPrevious();

        // 	mintenance.optChange = 0;
        // });

        /*点击下一页*/
        jQuery(document).on('click', '#pagedown', function () {

            jQuery('#video-control').hide();

            // 搜索之后的巡检
            if (mintenance.data.search.isSearching) {
                mintenance.data.search.starusElmLen = true; // 设置
                mintenance.data.isStatusChanged = true;
                downInfo();
                return false;
            } else {
                // 按钮是否可用
                if (mintenance.isDisabled($(this)) || !$(".manual").hasClass("active")) {
                    return false;
                }
            }

            //if(mintenance.data.expandTree.starusElmLen === 0) {
            mintenance.data.expandTree.starusElmLen = 1;  // 设置已经开始手动巡检了
            mintenance.data.isStatusChanged = true;       // 已经改变了状态
            //}

            //if(mintenance.model === 'classic'){
            //expandTree("mytask",4);
            if (mintenance.pointertrigger === false || mintenance.maxLen <= 0) {
                return;
            }
            //}

            // if (mintenance.maxLen <= 0 && mintenance.model === 'maptype') {
            // 	notify.info("没有可以切换的摄像机",{timeout:'1000'});
            // 	return;
            // }

            if (downInfo() === '0') {
                return false;
            }

            scrollarMove(); // 移动滚动条
            mintenance.optChange = 0;

        });

        function scrollarMove(){
            var item_header = $(".make-polling .item-header"),
                item_height = item_header.height(),
                opration    = $(".make-polling .cameras .opration"),
                o_height    = opration.height(),
                li_height   = 24,
                index       = mintenance.curCameraIndex,
                top         = index*li_height + o_height + item_height;
                //scroll      = ScrollListener.formPanel;

            //if(scroll.contentPosition !== (scroll.contentSize - scroll.viewportSize) && scroll.contentPosition !== 0){
            ScrollListener.updateScrollbar(top);
            //}
            //opration.scrollTop(top);
        }

        /*地图中下一页*/
        // jQuery(document).on('click', '.mappagedown', function() {

        //           if(mintenance.data.expandTree.starusElmLen === 0) {
        //               mintenance.data.expandTree.starusElmLen = 1;  // 设置已经开始手动巡检了
        //           }

        // 	// if(mintenance.model === 'classic'){
        // 	// 	//expandTree("mytask",4);
        // 	// 	if (mintenance.pointertrigger === false || mintenance.maxLen <= 0) {
        // 	// 		return;
        // 	// 	}
        // 	// }

        // 	if (mintenance.maxLen <= 0 /*&& mintenance.model === 'maptype'*/) {
        // 		notify.info("没有可以切换的摄像机",{timeout:'1000'});
        // 		return;
        // 	}

        // 	if(mapDownInfo() === '0'){
        // 		return false;
        // 	}

        // 	mintenance.optChange = 0;
        // 	//showNext();
        // });

        /*点击经典模式/地图模式的异常按钮*/
        // jQuery(document).on('click', '#abnormal,#mapAbnormal', function(id) {

        // 	if (mintenance.pointertrigger === false || mintenance.maxLen <= 0) {
        // 		return;
        // 	}

        //           // 获取摄像机类型
        // 	var cameraType = mintenance.data[mintenance.witchTask].cameras[mintenance.curCameraIndex].cameraType;
        //           //var cameraType = mintenance.data.cameraData.cType;
        // 	jQuery(this).addClass('red');

        // 	if(mintenance.model === 'classic'){
        // 		jQuery('#normal').removeClass('green');
        // 		cameraType ? disableCheckbox(jQuery('.controller-area .options'), false) : disableCheckbox(jQuery('.controller-area .options .image '), false);
        // 	}else{
        // 		jQuery('#mapNormal').removeClass('green');
        // 		jQuery('.map-issue').toggle().offset({
        // 			//left: jQuery('.pointer.bottom').length >=1 ? jQuery('.pointer.bottom').offset().left + 50 : jQuery('.contentPane').offset().left + 50
        // 			left:jQuery('#npgis_FrameDecorationDiv_0').offset().left + 50
        // 		});
        // 		cameraType ? jQuery('.map-issue .clound').show() : jQuery('.map-issue .clound').hide();
        // 	}

        // });

        /*点击经典模式/地图模式的正常按钮*/
        // jQuery(document).on('click', '#normal,#mapNormal', function() {
        //           mintenance.data.expandTree.starusElmLen = 1;
        // 	//正常
        // 	if(jQuery(this).hasClass('green')){
        // 		expandTree(1);
        // 		showNext();
        // 		return;
        // 	}else{
        //               expandTree(1);
        //           }
        // 	if (mintenance.pointertrigger === false || mintenance.maxLen <= 0) {
        // 		return;
        // 	}

        // 	if(mintenance.model === 'classic'){
        // 		jQuery('#abnormal').removeClass('red');
        // 		initCheckbox();
        // 	}else{
        // 		jQuery('#mapAbnormal').removeClass('red');
        // 		jQuery('.map-issue').hide();
        // 	}

        // 	postNormal();

        // 	showNext();
        // });

        function postNormal() {
            var cameraIds = mintenance.data.cameraIds,
                newCameraIds = cameraIds.slice(0, cameraIds.length),
                cameraOrgIds = mintenance.data.cameraOrgIds,  // 正在播放的摄像机的组织 id
                isBadId = mintenance.data.isBadId,
                length = cameraIds.length,
                tmpCameras = [],
                tmpOrgIdS = [],
                cameraIdsi;

            if (mintenance.model === 'classic') {
                var self = jQuery('#normal');
            }
            if (mintenance.model === 'maptype') {
                var self = jQuery('#mapNormal');
            }

            for (var i = 0; i < length; i++) {
                var cameraIdsi = newCameraIds[i] - 0;
                for (var j = 0; j < isBadId.length; j++) {
                    if (cameraIdsi === isBadId[j] - 0) {
                        //newCameraIds.splice(i,1);
                        //cameraOrgIds.splice(i,1);
                        newCameraIds[i] = -1;
                        cameraOrgIds[i] = -1;
                    }
                }
            }

            for (var k = 0; k < newCameraIds.length; k++) {
                if (newCameraIds[k] !== -1) {
                    tmpCameras.push(newCameraIds[k]);
                    tmpOrgIdS.push(cameraOrgIds[k])
                }
            }

            mintenance.data.cameraIds = tmpCameras;
            mintenance.data.cameraOrgIds = tmpOrgIdS;

            // 如果正常的摄像机是 0 个，则不提交信息
            if (tmpCameras.length <= 0) {
                return false;
            }

            //self.addClass('green');
            var task = mintenance.newCameras,
                taskId = mintenance.data[mintenance.witchTask].taskId;
                info = {
                    taskId: taskId,
                    //cameraId: task.cameras[mintenance.curCameraIndex].cameraId,
                    cameraIds: mintenance.model === 'maptype' ? task[mintenance.curCameraIndex].cameraId : tmpCameras.join(","),
                    orgIds: tmpOrgIdS.join(","),
                    //orgId: task.cameras[mintenance.curCameraIndex].orgId,
                    status: 1,
                    info: '',
                    remark: ''
                };

            /*提交正常信息*/
            postIssue(info);
        }

        function getIndexById(id) {
            var cameras = mintenance.newCameras;//mintenance.data[mintenance.witchTask].cameras;
            for (var i = 0, len = cameras.length; i < len; i++) {
                if (cameras[i].cameraId == id) {
                    return i;
                }
            }
        }

        function showVideo(layout, flag, isChange) {

            if (!mintenance || !mintenance.newCameras || mintenance.newCameras.length < 1) {
                return false;
            }

            if (mintenance.curCameraIndex > mintenance.newCameras.length - 1) {
                mintenance.videoPlayer.stopAllWithoutClearData();
                mintenance.videoPlayer.refreshAllWindow();
                return;
            }

            var layout       = layout || mintenance.layout,
                //taskData     = mintenance.data[mintenance.witchTask],
                camerasIndex = mintenance.curCameraIndex,
                //oldcameras   = taskData.cameras[mintenance.curCameraIndex],
                newCameras   = mintenance.newCameras,
                len          = newCameras.length,
                cameras      = [],
                preNext;

            mintenance.data.cameraIds = [];
            mintenance.data.cameraOrgIds = [];  // 正在播放的摄像机的组织 id

            if (camerasIndex <= mintenance.maxLen - 1) {
                // 按照不同的布局来获取不同个数的摄像机，考虑前后, isChange 为 true 时变换布局并重设当前摄像机索引
                //if(camerasIndex === mintenance.maxLen - 1){
                cameras = [];
                //}else{
                cameras = newCameras.slice(camerasIndex, layout + camerasIndex);
                preNext = newCameras.slice(layout + camerasIndex, 2 * layout + camerasIndex);
                //}

            } else {
                cameras = [];
            }

            for (var i = 0; i < cameras.length; i++) {
                mintenance.data.cameraIds.push(cameras[i].cameraId);
                mintenance.data.cameraOrgIds.push(cameras[i].orgId);
            }

            /*加载要播放的视频的异常信息*/
            if (mintenance.newCameras.length <= 0) {
                notify.info('没有可以播放的摄像机！', {timeout: '1000'});
                return;
            }
            //getCamerasIssue(jQuery('.controller-area'));

            //预播放 2014.09.24
            //playVideo(cameras,layout);
            playVideo(cameras, layout, preNext);
        }

        function transKey(data,i) {
            if ((data.cameraStatus - 0) === 1) {
                mintenance.videoPlayer.setStyle(2,i); // 设置 OCX 上显示摄像机离线
                /*if (mintenance.model === 'classic') {
                    notify.warn("摄像机处于离线状态！", {timeout: '1000'});
                }
                return {};*/
            }
            var camerasData = {
                path          : data.cameraNo,
                ip            : data.pvgIp,
                port          : data.pvgPort,
                user          : data.userName,
                passwd        : data.password,
                cType         : data.cameraType,
                cId           : data.cameraId,
                type          : 1, /*1:实时流*/
                orgId         : data.orgId,
                status        : data.cameraStatus -0 ,
                cameraChannel : {
                    id: data.channelId
                }
            };
            /*camerasData.path   = data.cameraNo;
             camerasData.ip     = data.pvgIp;
             camerasData.port   = data.pvgPort;
             camerasData.user   = data.userName;
             camerasData.passwd = data.password;
             camerasData.cType  = data.cameraType;
             camerasData.cId    = data.cameraId;
             camerasData.type   = 1;*/
            /*1:实时流*/
            /*
             camerasData.cameraChannel = {
             id : data.cameraChannel
             };*/
            return camerasData;
        }

        function triggerPtz(playObj, cData) {
            var cData = cData;
            gVideoPlayer = playObj;
            /*gVideoPlayer.cameraData[0] = {
             ptzSpeed:8
             };
             gVideoPlayer.focusChannel = 0;*/

            if (cData.cType === 1) {
                setTimeout(function () {
                    gVideoPlayer.switchPTZ(true, 0);
                }, 1000);
            } else {
                gVideoPlayer.switchPTZ(false, 0);
            }
        }

        function playVideo(camerasData, layout, next) {
            var layout = layout || mintenance.layout,
                len = next && next.length,
                cData,
                back,
                prePlay;

            /*            var target  = mintenance.data.search.isSearching ? $(".cameraSearch.treePanel") : $(".cameras-list.polling .treePanel"),
             lastId  = mintenance.newCameras[mintenance.maxLen-1].cameraId,
             lastElm = target.find("li.leaf[data-id="+ lastId +"]"),
             status  = lastElm.children("span.camearstatus"),
             text    = status.text();


             if(status.length > 0 && (text === '正常' || text=== '异常') && mintenance.curCameraIndex === mintenance.maxLen-1){
             mintenance.videoPlayer.stopAll();
             mintenance.videoPlayer.refreshAllWindow();
             return false;
             }*/

            /*            if(mintenance.curCameraIndex > mintenance.maxLen-1){
             notify.warn("已经是最后一个了。");
             return false;
             }*/

            $("#video-control").css({top: -99999});

            /*if (mintenance.videoPlayer === null) {
                mintenance.videoPlayer = new VideoPlayer({
                    layout: layout
                });
            }*/

            if (!mintenance.isAddEvent) {
                mintenance.videoPlayer.addEvent("OCXWNDOWDBLCLICK", function (index, x, y) {
                    //setControlBarPos(index);
                    jQuery('#video-control').hide();
                    return false;
                });
                mintenance.videoPlayer.addEvent("click", function (index) {
                    var cameraData = this.cameraData[index];
                    if (cameraData === -1 || cameraData === 'undefined' || !cameraData) {
                        return false;
                    }
                    var target = mintenance.data.search.isSearching ? $(".cameraSearch.treePanel") : $(".cameras-list.polling .treePanel");
                    setControlBarPos(index);
                    $("#downBlockContent span").text(target.find("li.leaf[data-id='" + this.cameraData[index].cId + "'] span.name").text());
                    mintenance.data.cameraData = cameraData;
                    mintenance.data.foucusPlayerIndex = index;//焦点所在屏
                    setException(cameraData, index);
                });
                mintenance.isAddEvent = true;
            }

            mintenance.videoPlayer.setLayout(layout);
            mintenance.videoPlayer.enableExchangeWindow(false);
            mintenance.videoPlayer.stopAllWithoutClearData();
            mintenance.videoPlayer.refreshAllWindow();

            for (var i = 0; i < camerasData.length; i++) {
                cData = transKey(camerasData[i],i);
                prePlay = mintenance.prePlay[i];
                // 预播放，判断是否已经有预播放的视频，有打开，没有，正常打开
                /*if (prePlay) {
                    if (prePlay > 0) {
                        var back = mintenance.videoPlayer.prePlayStream(prePlay,i);
                        //var clos = mintenance.videoPlayer.perCloseStream(mintenance.prePlay[i]);
                    } else {
                        mintenance.videoPlayer.ShowError(prePlay);
                    }
                } else {
                    var back = mintenance.videoPlayer.play(cData, i);
                }*/
                if(cData.status === 1){  // 摄像机离线的时候调用此接口，只存数据，不播放
                    back = mintenance.videoPlayer.play(cData, i,true);
                }else{
                    back = mintenance.videoPlayer.play(cData, i);
                }

                WaterMark.setWatermark(mintenance.videoPlayer, i);
                /*if(back.toString() !== "0"){
                 if (back.toString() === "-10063") {
                 notify.error("没有权限播放第 " + (i-0+1) + " 通道摄像机，错误码：" + back, {timeout:'1000'});
                 }else{
                 notify.error("第 " + (i-0+1) + " 通道视频播放失败，错误码：" + back, {timeout:'1000'});
                 }
                 }*/

                //triggerPtz(mintenance.videoPlayer, cData);
            }

            // 预播放，预播放
            /*setTimeout(function () {
                mintenance.prePlay = [];  // 重新初始化
                for (var j = 0; j < len; j++) {
                    mintenance.prePlay[j] = next[j] && mintenance.videoPlayer.preOpenStream(modifyDataForPreLoginPerPlay(next[j], true),j);
                }
            }, 1000);*/

            mintenance.videoPlayer.setFocusWindow(0);
        }

        // 设置控制条的位置
        function setControlBarPos(index) {
            if (mintenance.videoPlayer.cameraData[index] !== -1) {
                var channelPositionObj = mintenance.videoPlayer.getVideoRectByIndex(index);
                jQuery('#video-control').css({
                    left: channelPositionObj.Left,
                    top: channelPositionObj.Top,
                    width: channelPositionObj.Width,
                    height: channelPositionObj.Height
                }).show();
            }
        }


        function setException(cameraData, index) {
            //$('#abnormal').trigger("click");
            // 云台是否可以操作，只有在线的摄像机才判断
            if(cameraData.status === 0) {
                mintenancePlayer.setData(cameraData, index);
            }
            // 异常信息是否可以勾选等
            checkboxAction();
            getIssuseById(cameraData.cId);
        }

        // 通过摄像机id获取此摄像机的组织id
        function getOrgIdbyCameraId(id) {
            var cameras = mintenance.newCameras,
                len = cameras.length,
                camera;
            for (var i = 0; i < len; i++) {
                camera = cameras[i];
                if (camera.cameraId === id) {
                    return camera.orgId;
                }
            }
        }

        // 是否可以勾选异常信息的选择框 isInit 是否初始化(都禁用)
        function checkboxAction(isInit) {
            var cameraType = mintenance.data.cameraData ? mintenance.data.cameraData.cType : 0,
                exception = $("#exception"),
                options = jQuery('.controller-area .options'),
                remarks = jQuery('.controller-area .remarks'),
                page = $(".page-turning .button"),
                image = options.children('.image'),
                cloud = options.children('.clound');

            if (isInit) {
                cloud.find('input').prop({'disabled': true, "checked": false});
                cloud.find("label").css("color", "#AFAFAF");
                cloud.css("color", "#AFAFAF");
                image.find('input').prop({'disabled': true, "checked": false});
                image.addClass("disable");
                remarks.css({"color": "#AFAFAF"});
                remarks.find('textarea').prop('disabled', true).val("");
                exception.addClass("disable");
                page.addClass("disable");
                return;
            }

            if (mintenance.model === 'classic') {
                if (cameraType === 1) { // 云台
                    cloud.find('input').prop('disabled', false).prop("checked", false);
                    cloud.removeClass("disable");
                    cloud.find("label").css("color", "#3E3E3E");
                    cloud.css("color", "#3E3E3E");
                } else {   // 非云台
                    cloud.find('input').prop('disabled', true);
                    cloud.addClass("disable");
                    cloud.find("label").css("color", "#AFAFAF");
                    cloud.css("color", "#AFAFAF");
                }
                remarks.css({"color": "#3E3E3E"});
                remarks.find('textarea').prop('disabled', false).val("");
                image.find('input').prop('disabled', false).prop("checked", false);
                image.removeClass("disable");
                exception.removeClass("disable");
                page.removeClass("disable");
            }
        }

        mintenance.checkboxAction = checkboxAction;
        // 获取被点击的屏幕的摄像机的错误信息
        function getIssuseById(cameraId) {
            var curTask = mintenance.data[mintenance.witchTask],
                taskId = curTask.taskId,
                orgId = getOrgIdbyCameraId(cameraId),
                parent = jQuery('.controller-area');

            jQuery.ajax({
                url: "/service/check/get_task_camera_info?taskId=" + taskId + "&orgId=" + orgId + "&cameraId=" + cameraId,
                type: 'get',
                cache: false,
                success: function (data) {
                    if (data && data.code && data.code === 200) {
                        var taskCamera = data.data.taskCamera || {};

                        parent.find("textarea").val("");
                        parent.find("input[type=checkbox]").prop("checked", false); //重置输入框等

                        dirtyCheck.setOrginal(data.data.taskCamera.exceptInfo + "," + (data.data.taskCamera.remark ? data.data.taskCamera.remark : "N/A"));
                        dirtyCheck.setChecked(data.data.taskCamera.exceptInfo + "," + (data.data.taskCamera.remark ? data.data.taskCamera.remark : "N/A"));

                        /*设备异常*/
                        if (taskCamera.status === 2) {
                            parseIssue(taskCamera, parent); // 填充异常信息
                        }
                    } else {
                        notify.error('服务器没有响应！', {timeout: '1000'});
                    }
                },
                error: function () {
                    notify.error("网络或服务器异常！", {timeout: '1000'});
                }
            });
        }

        //播放视频地图上的视频
        function startPlayVideo(camerasData) {
            var cData = transKey(camerasData);
            /*布点之后.mapcameras没有加载到dom,点击时会立即加载先于startPlayVideo之前,并且每次点击都是重新加载*/
            if($("#UIOCXMAP").length<=0){
                jQuery('.mapcameras').html('<object id="UIOCXMAP" class="uiocxmap" classid="clsid:294EEBEC-7677-4EBA-B2D7-3FD669FBF2A2" align="center" width="268" height="216"></object>');
            }

            if(mintenance.mapvideoPlayer){
                mintenance.mapvideoPlayer.stopWithoutClearData();
                mintenance.mapvideoPlayer = null;
            }else{
                mintenance.mapvideoPlayer = null;
            }

            mintenance.data.cameraIds = [cData.cId];
            mintenance.data.cameraOrgIds = [cData.orgId];

            mintenance.mapvideoPlayer = new VideoPlayer({
                uiocx: '#UIOCXMAP',
                layout: 1
            });

            //拖动地图 OCX 残影问题 2014.11.19 By LiangChuang
            mintenance.mapvideoPlayer.refreshForGis(100);


            // 取消延迟播放，优化播放速度 2014.11.19 By LiangChuang
            var back = mintenance.mapvideoPlayer.play(cData, 0);
            //mintenancePlayer.setData(cData);

            /*//mintenance.mapvideoPlayer.initialize();
            mintenance.mapvideoPlayer.stopAllWithoutClearData();
            setTimeout(function () {
                //mintenance.mapvideoPlayer.setLayout(1);
                var back = mintenance.mapvideoPlayer.play(cData, 0);
                //var back = mintenance.mapvideoPlayer.playerObj.Play(JSON.stringify(cData),0);
                *//*if (back.toString() !== "0") {
                    if (back.toString() === "-10063") {
                        notify.error("没有权限播放此摄像机，错误码：" + back, {timeout: '1000'});
                    } else {
                        notify.error("此摄像机的视频播放失败，错误码：" + back, {timeout: '1000'});
                    }
                }*//*
                mintenancePlayer.setData(cData);

            }, 1000);*/

            //if(camerasData.status !== 1){
                mintenancePlayer.setData(cData);
                triggerPtz(mintenance.mapvideoPlayer, cData);
            //}
        }

        function postIssue(cameraIssues, callback) {
            jQuery.ajax({
                url: '/service/check/inspect_task',
                type: 'post',
                dataType: 'json',
                data: cameraIssues,
                success: function (data) {
                    if (data && data.code && data.code === 200) {
                        notify.success('提交巡检结果成功！', {timeout: '1000'});
                        if (callback) {
                            callback()
                        }
                    } else {
                        mintenance.optChange = 1;
                        notify.error('提交巡检结果失败！', {timeout: '1000'});
                    }
                },
                error: function () {
                    mintenance.optChange = 1;
                    notify.error('网络或服务器异常！', {timeout: '1000'});
                }
            });
        }

        function getIssueList(parents) {
            mintenance.makeUp('maintenance_issue', 'get_exception_info', function (html) {
                parents.html(html.replace("左右控制", "左右").replace("上下控制", "上下"));
            });
            mintenance.makeUp('maintenance_mapissuelist', 'get_exception_info', function (html) {
                mintenance.mapIssueHtml = html.replace("左右控制", "左右").replace("上下控制", "上下");
            });
        }

        getIssueList(jQuery('.controller-area .options'));
        /*获取指定摄像机异常信息*/

        function getCamerasIssue(parents) {
            var curTask = mintenance.data[mintenance.witchTask],
                taskId = curTask.taskId,
                orgId = mintenance.newCameras[mintenance.curCameraIndex].orgId,
                cameraId = mintenance.newCameras[mintenance.curCameraIndex].cameraId;

            jQuery.ajax({
                url: "/service/check/get_task_camera_info?taskId=" + taskId + "&orgId=" + orgId + "&cameraId=" + cameraId,
                type: 'get',
                cache: false,
                success: function (data) {
                    if (data && data.code && data.code === 200) {
                        var taskCamera = data.data.taskCamera || {};
                        /*设备异常*/
                        if (taskCamera.status === 2) {
                            initAbnormal(parents);
                            if (mintenance.model === 'classic') {
                                jQuery('.abnormal').trigger('click');
                            }
                            if (mintenance.model === 'maptype') {
                                jQuery('.mapAbnormal').addClass('red');
                            }
                            parseIssue(taskCamera, parents);
                        }
                        /*设备正常*/
                        if (taskCamera.status === 1) {
                            initAbnormal(parents);
                            if (mintenance.model === 'maptype') {
                                jQuery('.mapNormal').addClass('green');
                            }
                            if (mintenance.model === 'classic') {
                                jQuery('.normal').addClass('green');
                            }
                        }
                        /*设备没有定义正常异常*/
                        if (taskCamera.status === 3) {
                            initAbnormal(parents);
                        }
                    } else {
                        notify.error('服务器没有响应！', {timeout: '1000'});
                    }
                },
                error: function () {
                    notify.error("网络或服务器异常！", {timeout: '1000'});
                }
            });
        }

        /*因为地图上的异常信息布局和经典模式不同所以加了parents区别*/

        function parseIssue(data, parents) {
            var info = (data.exceptInfo ? data.exceptInfo.split(',') : []),
                len  = info.length;

            parents.find('textarea[name=remarks]').val(data.remark);

            while (len--) {
                if (mintenance.model === 'maptype') {
                    parents.find('#mapissue_' + info[len]).prop('checked', true);
                }
                if (mintenance.model === 'classic') {
                    parents.find('#issue_' + info[len]).prop('checked', true);
                }
            }
        }

        /*获取用户编辑的故障信息
         * status
         * 1 正常
         * 2 异常*/
        function getIssues(parents, status) {
            var info = [],
                issuesOpt = parents.find('input:checked'),
                len = issuesOpt.length,
                taskObj = mintenance.data[mintenance.witchTask],
                cameraId = mintenance.model === 'maptype' ? mintenance.newCameras[mintenance.curCameraIndex].cameraId : mintenance.data.cameraData.cId,
                isBadId = mintenance.data.isBadId,
                isEqual = 0,
                pic,
                cameraIssues = {};

            // 正常
            if (status === 1) {
                cameraIssues = {
                    remark: '',
                    status: 1,
                    taskId: taskObj.taskId,
                    orgIds: mintenance.model === 'maptype' ? mintenance.newCameras[mintenance.curCameraIndex].orgId : mintenance.data.cameraData.orgId,
                    cameraIds: cameraId
                }

                postIssue(cameraIssues, function () {
                    if (mintenance.data.search.isSearching) {
                        camearStatus($("#mytask .cameras-list.polling .treePanel li.leaf[data-id=" + cameraId + "]"), "正常", 1, -28); // 巡检树
                        camearStatus($("#mytask .cameraSearch.treePanel li.leaf[data-id=" + cameraId + "]"), "正常", 1);  // 搜索树
                    } else {
                        camearStatus($("li.leaf[data-id=" + cameraId + "]"), "正常", 1);
                    }
                    for (var i = 0; i < isBadId.length; i++) {
                        if ((isBadId[i] - 0) === (cameraId - 0)) {
                            isBadId.splice(i, 1);
                            if (mintenance.data.search.isSearching) {
                                mintenance.preIsBadId.splice(i, 1);
                            }
                        }
                    }
                    mintenance.data.cameraData = null; //提交完成后，置为空
                });
                /*提交数据*/

                return false;
            }

            // 异常
            while (len--) {
                info.push(issuesOpt.eq(len).attr('data-id'));
            }

            pic = mintenance.model === 'maptype' ? mintenance.mapvideoPlayer.getPicInfo(0).replace(/[\n\r]/ig, "") : mintenance.videoPlayer.getPicInfo(mintenance.data.foucusPlayerIndex).replace(/[\n\r]/ig, "");
            pic = (pic === "ERROR" ? "" : pic);

            cameraIssues = {
                exceptInfo: info.join(','),
                remark: parents.find("textarea[name=remarks]").val().trim(),
                status: status,
                taskId: taskObj.taskId,
                orgIds: mintenance.model === 'maptype' ? mintenance.newCameras[mintenance.curCameraIndex].orgId : mintenance.data.cameraData.orgId, //mintenance.newCameras[mintenance.curCameraIndex].orgId,//taskObj.cameras[mintenance.curCameraIndex].orgId,
                cameraIds: cameraId,//mintenance.model === 'maptype' ? mintenance.newCameras[mintenance.curCameraIndex].cameraId : mintenance.data.cameraData.cId //taskObj.cameras[mintenance.curCameraIndex].cameraId
                image:pic
            };
            postIssue(cameraIssues, function () {
                //var cameraId = mintenance.data.cameraData.cId;
                if (mintenance.data.search.isSearching) {
                    camearStatus($("#mytask .cameras-list.polling .treePanel li.leaf[data-id=" + cameraId + "]"), "异常", 1, -28); // 巡检树
                    camearStatus($("#mytask .cameraSearch.treePanel li.leaf[data-id=" + cameraId + "]"), "异常", 1);  // 搜索树
                } else {
                    camearStatus($("li.leaf[data-id=" + cameraId + "]"), "异常", 1);
                }
                if (isBadId.indexOf(cameraId - 0) < 0) {
                    mintenance.data.isBadId.push(cameraId);
                    if (mintenance.data.search.isSearching) {
                        mintenance.preIsBadId.push(cameraId);
                    }
                }

                dirtyCheck.orginal = dirtyCheck.checked;

                mintenance.data.cameraData = null; //提交完成后，置为空
                mintenance.data.foucusPlayerIndex = -1;
            });
            /*提交数据*/
        }

        /* checkbox禁用 */
        function disableCheckbox(parentsNode, trigger) {
            parentsNode.find('input:checkbox').prop('disabled', trigger);
            if (trigger) {
                parentsNode.find('label').css('color', '#AFAFAF');
            }
            if (!trigger) {
                parentsNode.find('label').css('color', '#333');
            }
        }

        /*初始化异常信息展示*/
        function initCheckbox() {
            disableCheckbox(jQuery('.controller-area'), true);
            jQuery('.controller-area').find("input:checkbox").prop('checked', false);
            jQuery('#abnormal').removeClass('red');
            jQuery("textarea[name=remarks]").val('');
        }

        function initAbnormal(parents) {
            if (parents.hasClass('controller-area')) {
                disableCheckbox(parents, true);
            }
            parents.find("input:checkbox").prop('checked', false);
            parents.find('.red').removeClass('red');
            parents.find('.green').removeClass('green');
            parents.find("textarea[name=remarks]").val('');
        }

        function addDatepicker(self) {
            var options = {
                maxDate: new Date,
                showSecond: true,
                dateFormat: 'yy-mm-dd',
                timeFormat: 'HH:mm:ss',
                stepHour: 1,
                stepMinute: 1,
                stepSecond: 1,
                timeText: '时间',
                hourText: '时:',
                minuteText: '分:',
                secondText: '秒:'
            };
            self.datepicker(options);
        }

        mintenance.mapObj = new new Class({
            initialize: function () {
                this.map = {};//地图对象
                this.maps = {};//this.map.map
                this.zoom = 6;//默认地图缩放倍数
                this.markers = [];//这里保存地图上所有的摄像机图标
                this.textmarks = [];//这里保存地图上所有的文字图标
                this.smallW = null;//地图上的小窗口
                this.camSym = {};//红色图标
                this.curZoom = 6;//当前地图缩放倍数
                this.hoverCamSym = {};//蓝色图标
                this.smallIcon = '/module/common/images/map/map-marker-red.png';//红色图标地址
                this.smallIconHover = '/module/common/images/map/map-marker-blue.png';//蓝色地址
                this.issContent = '<div class="mapcameras"></div><div class="mark"><p class="mapNormal ui tiny basic button" id="mapNormal">正常</p><p class="mapAbnormal ui tiny basic button" id="mapAbnormal">异常</p><p class="ui tiny button mappagedown">下一个</p><p class="ui tiny button mappageup">上一个</p></div>'
                this.textS = '10px';//图标字体大小
                this.textC = '#fff';//图标字体颜色
                /*this.graphicClick = null;
                 this.graphicMouseDown = null;*/
                this.addMap();//加载地图并初始化某些值
                //this.bindDomEvent();
            },
            setCamerasToMap: function (camerasData) {
                var self = this;
                //清除地图上的覆盖物
                this.map.clearOverlays();

                for (var i = 0, len = camerasData.length; i < len; i++) {

                    if (camerasData[i].longitude === undefined && camerasData[i].latitude === undefined) {
                        continue;
                    }

                    camerasData[i].siblingsindex = i + 1;
                    //监控点标注
                    self.webMercator = new NPMapLib.Geometry.Point(parseFloat(camerasData[i].longitude), parseFloat(camerasData[i].latitude));

                    var marker = new NPMapLib.Symbols.Marker(self.webMercator);

                    //设置文本
                    var label = new NPMapLib.Symbols.Label(camerasData[i].siblingsindex + "");
                    label.setStyle({Color: "#ffffff"});
                    label.setOffset(new NPMapLib.Geometry.Size(-2, 12));
                    //设置图标
                    marker.setIcon(this.camSym);
                    marker.setLabel(label);
                    marker.setData(camerasData[i]);
                    //将图标加到地图中
                    this.map.addOverlay(marker);
                    //加入到标注列表中
                    self.markers.push(marker);
                    //添加鼠标点击事件
                    marker.addEventListener(NPMapLib.MARKER_EVENT_CLICK, function (marker) {
                        //self.clearOCX();
                        //self.closeInfoWindow();
                        //还原上次活动图标
                        //self.redIcon();
                        //展示窗口
                        //位置
                       // var position = new NPMapLib.Geometry.Point(marker._position.lon, marker._position.lat);
                        //摄像机名称
                       // var title = marker.getData().cameraName;
                        //加载信息窗口
                        //self.addInfoWindow(position, title);
                        mintenance.curCameraIndex = parseInt(marker.getData().siblingsindex) - 1;
                        var cameraData = mintenance.newCameras[mintenance.curCameraIndex];
                        var cameraId   = cameraData.cameraId;
                        $("li.leaf[data-id=" + cameraId + "] span").trigger("dblclick");
                        //设置当前标注为蓝色
                        //marker.setIcon(self.hoverCamSym);
                        //marker.getLabel().setOffset(new NPMapLib.Geometry.Size(-1, 14));
                        //marker.refresh();
                        //记录当前活动的摄像机
                        //self.lastActiveMarker = marker;
                        //self.triggerWindowOnMap();
                    });
                }
            },
            closeWindow: function () {
                jQuery(".map-issue").hide();
                jQuery('#mapAbnormal').removeClass('red');
                //按钮变红
                this.redIcon();
                //关闭窗口
                this.closeInfoWindow();
            },
            //打开地图上窗口
            triggerWindowOnMap: function () {
                var self = this;

                self.clearOCX();
                jQuery('.map-issue').remove();
                /*移除已经有的*/
                var cameraIndex = mintenance.curCameraIndex,
                    cameras = mintenance.newCameras[cameraIndex];
                // 摄像机没有点位信息 不播放，返回
                if(cameras.longitude === 0.0 || cameras.latitude === 0.0 || !cameras.longitude || !cameras.latitude){
                    notify.warn("该摄像机没有坐标信息！",{timeout:1500});
                    //var point = new NPMapLib.Geometry.Point(0, 0);
                    //this.addInfoWindowWithoutMove(point, cameras.cameraName);
                    this.bindWindowEvents();
                }else{
	                //在缩放之前关闭窗口,以解决ocx地图信息窗播放在缩放后关闭造成ocx画面残留的问题，add by zhangyu, 2014-10-31
	                self.closeInfoWindow();
                    //当前摄像机位置
                    var point = new NPMapLib.Geometry.Point(cameras.longitude, cameras.latitude);
                    //居中放大地图
                    self.switchS(point);
                    //显示窗口
                    this.addInfoWindow(point, cameras.cameraName);
                    //记录摄像机索引
                    self.curIconIndex = cameraIndex;
                    //改变图标颜色
                    self.blueIcon(cameraIndex);
                    //播放视频
                    startPlayVideo(cameras);
                }


            },
            loadIssue: function () {
                if (mintenance.mapIssueHtml !== undefined) {
                    jQuery('.mapcameras').append(mintenance.mapIssueHtml);
                    getCamerasIssue(jQuery(".map-issue"));
                } else {
                    notify.warn("异常信息加载失败！");
                }
            },
            blueIcon: function (cameraIndex) {
                //按钮着色
                this.redIcon();
                if (this.markers[cameraIndex]) {
                    this.markers[cameraIndex].setIcon(this.hoverCamSym);
                    this.markers[cameraIndex].getLabel().setOffset(new NPMapLib.Geometry.Size(-1, 14));
                    this.markers[cameraIndex].refresh();
                    //记录当前活动的摄像机
                    this.lastActiveMarker = this.markers[cameraIndex];
                }
                ;
            },
            redIcon: function () {
                //将上次选中的摄像机置为红色
                if (this.lastActiveMarker) {
                    this.lastActiveMarker.setIcon(this.camSym);
                    this.lastActiveMarker.getLabel().setOffset(new NPMapLib.Geometry.Size(-2, 12));
                    this.lastActiveMarker.refresh();
                }
            },
            switchS: function (center) {
                /*地图自动放大居中*/
                this.curZoom = this.map.getZoom() < this.zoom ? this.zoom : this.map.getZoom();
                this.map.centerAndZoom(center, this.curZoom);
            },
            addMap: function () {
                var self = this;
                //初始化地图
                this.map = mapConfig.initMap(document.getElementById("gismap"));
                var layers = [];
                if(mapConfig.baselayer){
                    var layer = mapConfig.initLayer(mapConfig.baselayer, "baselayer");
                    layers.push(layer[0]);
                    if(layer.length === 2){
                        layers.push(layer[1]);
                    }
                }
                //加载基础图层
                this.map.addLayers(layers);

                //导航
                var Navictrl = new NPMapLib.Controls.NavigationControl();
                this.map.addControl(Navictrl);
                //摄像机悬浮标注
                self.hoverCamSym = new NPMapLib.Symbols.Icon(this.smallIconHover, new NPMapLib.Geometry.Size(22, 29));
                //摄像机标注
                self.camSym = new NPMapLib.Symbols.Icon(this.smallIcon, new NPMapLib.Geometry.Size(22, 26));


                //添加鼠标缩放时的动画,四个角-add by LiangChuang 2014-11-15
                var zoomAnimation = new NPMapLib.Controls.zoomAnimationControl();
                this.map.addControl(zoomAnimation);
                //鼠标样式
                this.map.addHandStyle();


                // 解决拖动残影 2014.10.31 by liangchuang
                this.map.addEventListener(NPMapLib.MAP_EVENT_DRAGGING, function(){
                    if(self.smallW){
                        if(mintenance.mapvideoPlayer){
                            mintenance.mapvideoPlayer.refreshWindow(0);
                        }
                    }
                });

                // 解决拖动残影 2014.11.04 by liangchuang
                //地图拖拽结束
                this.map.addEventListener(NPMapLib.MAP_EVENT_DRAG_END, function(e){
                    if(self.smallW){
                        self.smallW.show();
                        if(mintenance.mapvideoPlayer){
                            mintenance.mapvideoPlayer.refreshWindow(0);
                        }
                    }
                });
                //地图缩放结束
                this.map.addEventListener(NPMapLib.MAP_EVENT_ZOOM_END, function(e){
                    if(self.smallW){
                        if(mintenance.mapvideoPlayer){
                            mintenance.mapvideoPlayer.refreshWindow(0);
                        }
                    }
                });

                /**
                 * 解决拖动残影 2014.11.13 by LiangChuang
                 * */
                //地图拖拽开始
                this.map.addEventListener(NPMapLib.MAP_EVENT_DRAG_START, function(e){
                    if(self.smallW){
                        self.smallW.hide();
                    }
                });
/*                //地图拖拽结束
                this.map.addEventListener(NPMapLib.MAP_EVENT_DRAG_END, function(e){
                    if(self.smallW){
                        self.smallW.show();
                    }
                });*/

            },

            // 清楚隐藏的OCX播放窗口
            clearOCX : function (){
                $("#ocxinfowindow").remove();
                if (this.smallW) {
                    //先关闭
                    this.closeInfoWindow();
                }
            },
            addInfoWindowWithoutMove : function(){
                var content = '<div class="infowindow-title" id="ocxinfowindow" style="position:absolute;top:-9999px;left:-9999px;">' +
                        /*'<object id="UIOCXMAP" class="uiocxmap" classid="clsid:294EEBEC-7677-4EBA-B2D7-3FD669FBF2A2" align="center" width="268" height="216"></object>' +*/
                        '</div>';

                if($("#ocxinfowindow").length <= 0){
                    $("body").append(content);
                }

                if(!this.ocxDom){
                    this.createOcxOnMap();
                }
                if($("#ocxinfowindow #UIOCXMAP").length <= 0){
                    jQuery("#ocxinfowindow").append(this.ocxDom);
                }

                //绑定窗口事件
                this.bindWindowEvents();
            },

            // 创建地图上的 OCX By LiangChuang 2014.11.20
            createOcxOnMap: function(){
                if(!this.ocxDom){
                    this.ocxDom = document.createElement("object");
                    this.ocxDom.setAttribute("id", "UIOCXMAP");
                    this.ocxDom.setAttribute("height", 216);
                    this.ocxDom.setAttribute("width", 268);
                    this.ocxDom.setAttribute("classid", "clsid:294EEBEC-7677-4EBA-B2D7-3FD669FBF2A2");
                }
            },

            /**
             * 加载信息窗口
             **/
            addInfoWindow: function (position, title) {
                var cameraIssues = "";
                if (mintenance.mapIssueHtml !== undefined) {
                    cameraIssues = mintenance.mapIssueHtml;
                } else {
                    notify.warn("异常信息加载失败！");
                }
                //内容
                var content = '<div class="infowindow-title">' +
                        '<span class="text" title="' + title + '">' + title + '</span>' +
                        '<span class="btns">' +
                        '<i class="closeBtn"></i>' +
                        '</span>' +
                        '</div>' +
                        '<div class="mapdddcameras" id="new-map-video-container">' +
                        /*'<object id="UIOCXMAP" class="uiocxmap" classid="clsid:294EEBEC-7677-4EBA-B2D7-3FD669FBF2A2" align="center" width="268" height="216"></object>' +*/
                        '</div>' +
                        '<div class="mark"><p class="mapNormal ui tiny basic button" id="mapNormal">正常</p><p class="mapAbnormal ui tiny basic button" id="mapAbnormal">异常</p><p class="ui tiny button mappageup">上一个</p><p class="ui tiny button mappagedown">下一个</p></div>' + mintenance.mapIssueHtml,
                //窗口参数
                    opts = {
                        width: 270, //信息窗宽度，单位像素
                        height: 280, //信息窗高度，单位像素
                        offset: new NPMapLib.Geometry.Size(0, -22),	 //信息窗位置偏移值
                        arrow: true,
                        autoSize: false
                    };
                //新建窗口元素
                this.smallW = new NPMapLib.Symbols.InfoWindow(position, "", content, opts);
                //将窗口加入在地图
                this.map.addOverlay(this.smallW);

                if(!this.ocxDom){
                    this.createOcxOnMap();
                }
                jQuery("#new-map-video-container").prepend(this.ocxDom);

                //显示信息窗口
                this.smallW.open();
                //绑定窗口事件
                this.bindWindowEvents();
                //获取摄像机异常信息
                getCamerasIssue(jQuery(".map-issue"));
            },
            //关闭窗口
            closeInfoWindow: function () {
                if(this.smallW){
                    var BaseDiv = jQuery(this.smallW.getBaseDiv());
                    BaseDiv.html("");
                    this.smallW.close();
                    this.smallW = null;
                }
            },
            postMNormal: function () {
                /*提交正常信息*/
                jQuery('#mapNormal').addClass('green');
                var task = mintenance.data[mintenance.witchTask],
                    cameraId = mintenance.newCameras[mintenance.curCameraIndex].cameraId,
                    isBadId = mintenance.data.isBadId,
                    info = {
                        taskId: task.taskId,
                        cameraIds: cameraId,
                        orgIds: mintenance.newCameras[mintenance.curCameraIndex].orgId,
                        status: 1,
                        info: '',
                        remark: ''
                    };
                /*提交正常信息*/
                postIssue(info, function () {
                    if (mintenance.data.search.isSearching) {
                        camearStatus($("#mytask .cameras-list.polling .treePanel li.leaf[data-id=" + cameraId + "]"), "正常", 1, -28); // 巡检树
                        camearStatus($("#mytask .cameraSearch.treePanel li.leaf[data-id=" + cameraId + "]"), "正常", 1);  // 搜索树
                    } else {
                        camearStatus($("li.leaf[data-id=" + cameraId + "]"), "正常", 1);
                    }
                    for (var i = 0; i < isBadId.length; i++) {
                        if ((isBadId[i] - 0) === (cameraId - 0)) {
                            isBadId.splice(i, 1);
                            if (mintenance.data.search.isSearching) {
                                mintenance.preIsBadId.splice(i, 1);
                            }
                        }
                    }
                });

                expandTree(1);
            },
            mapDownInfo: function () {
                var self = this;
                var par = jQuery('.map-issue'),
                    nor = jQuery('#mapNormal'),
                    abnor = jQuery('#mapAbnormal');

                if(nor.length <= 0 && abnor.length <= 0 ){
                    showNext();
                    expandTree(4);
                    return false;
                }

                if (abnor.hasClass('red')) {
                    if (par.find(':checked').length <= 0) {
                        notify.info('请先选择摄像机异常原因！', {timeout: '1000'});
                        par.show().offset({
                            left: jQuery('#npgis_FrameDecorationDiv_0').offset().left + 50
                        });
                        return '0';
                    }
                    if (mintenance.optChange) {
                        getIssues(par, 2);
                    }
                    showNext();
                    //异常
                    expandTree(2);
                } else if (nor.hasClass('green')) {
                    //正常
                    showNext();
                    expandTree(1);
                } else {
                    //未巡检
                    self.postMNormal();
                    showNext();
                    expandTree(1);
                }
            },
            mapUpInfo: function () {
                if (mintenance.maxLen <= 0) {
                    notify.info('没有可以切换的摄像机！', {timeout: '1000'});
                    return '0';
                }

                var nor = jQuery('#mapNormal'),
                    abnor = jQuery('#mapAbnormal'),
                    par = jQuery('.map-issue');

                if(nor.length <= 0 && abnor.length <= 0 ){
                    showPrevious();
                    expandTree(4);
                    return false;
                }

                if (abnor.hasClass('red') && par.find(':checked').length <= 0) {
                    notify.info("请先选择摄像机异常原因！", {timeout: '1000'});
                    par.show().offset({
                        left: jQuery('#npgis_FrameDecorationDiv_0').offset().left + 50
                    });
                    return '0';
                }

                if (!mintenance.optChange) {
                    /*异常信息是否变动过*/
                    if (abnor.hasClass('red')) {
                        // 异常
                        showPrevious();
                        expandTree(2, 1);
                    } else if (nor.hasClass('green')) {
                        //正常
                        postNormal();
                        showPrevious();
                        expandTree(1, 1);
                    } else {
                        //未巡检
                        postNormal();
                        showPrevious();
                        expandTree(1, 1);
                    }
                } else {
                    getIssues(par, 2);
                    showPrevious();
                    //异常
                    expandTree(2, 1);
                }
            },
            //绑定窗口事件
            bindWindowEvents: function () {
                var self = this;
                //点击关闭按钮
                jQuery('.infowindow-title .btns .closeBtn').on("click", function () {
                    self.closeWindow();
                });
                //地图模式异常处理
                jQuery("#mapAbnormal").off('click');
                jQuery("#mapAbnormal").on('click', function () {

                    if (mintenance.pointertrigger === false || mintenance.maxLen <= 0) {
                        return;
                    }
                    var cameraType = mintenance.newCameras[mintenance.curCameraIndex].cameraType;
                    jQuery(this).addClass('red');

                    jQuery('#mapNormal').removeClass('green');
                    jQuery('.map-issue').toggle().offset({
                        left: jQuery('#npgis_FrameDecorationDiv_0').offset().left + 50
                    });
                    cameraType ? jQuery('.map-issue .clound').show() : jQuery('.map-issue .clound').hide();
                });
                //地图模式的正常按钮
                jQuery("#mapNormal").off('click');
                jQuery("#mapNormal").on('click', function () {

                    mintenance.data.expandTree.starusElmLen = 1;
                    //正常
                    if (jQuery(this).hasClass('green')) {
                        showNext();
                        expandTree(1);
                        return;
                    } else {
                        self.postMNormal();

                        showNext();
                        expandTree(1);
                    }
                    if (mintenance.pointertrigger === false || mintenance.maxLen <= 0) {
                        return;
                    }

                    if (jQuery('#mapAbnormal').hasClass('red')) {
                        var cameraId = mintenance.newCameras[mintenance.curCameraIndex].cameraId;
                        camearStatus($("li.leaf[data-id=" + cameraId + "]"), "正常", 1);
                    }

                    jQuery('#mapAbnormal').removeClass('red');
                    jQuery('.map-issue').hide();

                    //postNormal();

                });
                //上一个
                jQuery('.mappageup').off('click');
                jQuery('.mappageup').on('click', function () {

                    mintenance.data.expandTree.starusElmLen = 1;
                    mintenance.data.isStatusChanged = true;

                    if (self.mapUpInfo() === '0') {
                        return false;
                    }

                    scrollarMove(); // 移动滚动条
                    mintenance.optChange = 0;
                    ///showPrevious();
                });
                //下一个
                jQuery('.mappagedown').off('click');
                jQuery('.mappagedown').on('click', function () {

                    //if(mintenance.data.expandTree.starusElmLen === 0) {
                    mintenance.data.expandTree.starusElmLen = 1;  // 设置已经开始手动巡检了
                    mintenance.data.isStatusChanged = true;
                    //}

                    if (mintenance.maxLen <= 0 /*&& mintenance.model === 'maptype'*/) {
                        notify.info("没有可以切换的摄像机！", {timeout: '1000'});
                        return;
                    }

                    if (self.mapDownInfo() === '0') {
                        return false;
                    }

                    scrollarMove(); // 移动滚动条
                    mintenance.optChange = 0;

                    //showNext();
                });
            }
        });

        jQuery(document).on('keydown', '#taskName', function (e) {
            if (e.which === 13) {
                return false;
            }
        });

        // 设置中 当树形展开时，新建任务时勾选的 摄像机以及组织，此时将其勾选
        function modifyCamerasList(e, html) {
            var camerasList = mintenance.data.modifyCamerasList || [],
                taskorgids = mintenance.data.modifyOrgList,
                list = $(html).find("li"),
                camerasLen = camerasList.length,
                taskorgidsLen = taskorgids.length,
                listLen = list.length,
                target = e.currentTarget,
                cameraId,
                orgId,
                li,
                id;

            // 摄像机勾选
            for (var i = 0; i < camerasLen; i++) {
                cameraId = camerasList[i].cameraId;
                for (var j = 0; j < listLen; j++) {
                    li = list.eq(j);
                    id = li.attr("data-id");
                    if (id == cameraId) {
                        $(target).find("li.leaf[data-id=" + id + "]").children(".checkbox").addClass("selected");
                    }
                }
            }
            //组织勾选
            for (var h = 0; h < taskorgidsLen; h++) {
                orgId = taskorgids[h];
                $(target).find("li.tree[data-id=" + orgId + "]").children(".checkbox").addClass("selected");
            }
        }

        //巡检开始前，树形展开时，初始化摄像机上次巡检状态 || 自动巡检完成后给出状态 isAuto true 为自动巡检
        function initPrevStatus(data,isAuto) {
            var task = mintenance.witchTask,
                cameras = data || mintenance.data[task].cameras,
                len = cameras.length,
                treePanel = $("#" + task + " .treePanel"),
                target,
                status,
                cameraId,
                statusText;

            for (var i = 0; i < len; i++) {
                cameraId = cameras[i].cameraId;
                status   = cameras[i].status;
                target   = treePanel.find("li.leaf[data-id=" + cameraId + "]");
                if (status < 3) {
                    if (status === 2) {
                        mintenance.data.isBadId = [];
                        mintenance.data.isBadId.push(cameraId);
                        //mintenance.data.cameraOrgIds.push(cameras[i].orgId);
                    }
                    statusText = getStatus(status);
                    if(isAuto){
                        if(target.find("i.checkbox.selected").length>0){
                            camearStatus(target, statusText);
                        }
                    }else{
                        camearStatus(target, statusText);
                    }
                    //camearStatus(target, statusText);
                }

            }
        }

        // 返回状态文字
        function getStatus(status) {
            var statusText = "";
            switch (status) {
                case 1:
                    statusText = "正常";
                    break;
                case 2:
                    statusText = "异常";
                    break;
                case 3:
                    statusText = "正常";//未巡检
                    break;
                case 4:
                    statusText = 4;//地图没有坐标，特殊处理
                    break;
                case 5:
                    statusText = "巡检中";
                    break;
                default:
                    statusText = "巡检中";
                    break;
            }
            return statusText;
        }


        mintenance.data.expandTree = {
            index: -1,
            starusElmLen: 0,
            isLast: 0,
            prevCameras: []
        };


        function expandTree(status, flag) {   // 其实主要的作用是判断并设置摄像机的巡检状态，历史原因，名字有歧义

            var task = mintenance.witchTask,       // 我的任务/审核任务
                target = mintenance.data.search.isSearching ? $(".cameraSearch.treePanel") : $("#" + task + " .cameras-list.polling .treePanel"),
                camerasIndex = mintenance.curCameraIndex,  // 第 i 个摄像机 当前上一批下一批的分界点
                cameras = mintenance.newCameras,      // 当前任务的摄像机列表

                expandTree = mintenance.data.expandTree, // 引用，减少作用域链

                starusElmLen = mintenance.data.search.isSearching ? mintenance.data.search.starusElmLen : expandTree.starusElmLen,

                prevCameras = expandTree.prevCameras.slice(0), // 上一次巡检的摄像机组


                statusText = getStatus(status || 1),

                prevCurtCameras = expandTree.prevCameras, // 上一次巡检摄像机缓存

                prevCurtCamera,  // 上一次巡检摄像机缓存 的 循环的缓存

                thisCameras, // 此次要巡检的摄像机组1 4 9 16 等，


                curtCamera,// 正在操作的摄像机,

                len = cameras.length;

            thisCameras = cameras.slice(camerasIndex, mintenance.layout + camerasIndex);

            if (camerasIndex === 0 && prevCameras.length <= 0) {
                for (var i = 0; i < thisCameras.length; i++) {
                    curtCamera = target.find("li.leaf[data-id=" + thisCameras[i].cameraId + "]");
                    if (curtCamera.length > 0) {
                        camearStatus(curtCamera, "巡检中");
                    }
                }
                // 保存此次巡检的摄像机组，以备下批次时设置其正异常状态
                expandTree.prevCameras = thisCameras;
            }

            if (thisCameras.length > 0 && starusElmLen > 0) {
                for (var l = 0; l < thisCameras.length; l++) {
                    curtCamera = target.find("li.leaf[data-id=" + thisCameras[l].cameraId + "]");
                    camearStatus(curtCamera, "巡检中");
                }
                expandTree.prevCameras = thisCameras;
            }

            if (prevCurtCameras.length > 0 && !expandTree.isLast) {
                for (var k = 0; k < prevCurtCameras.length; k++) {
                    prevCurtCamera = target.find("li.leaf[data-id=" + prevCurtCameras[k].cameraId + "]");
                    camearStatus(prevCurtCamera, statusText || '正常');
                }
            }

        }

        // 显示当前任务中所有摄像机和组织
        function showAllCameras() {
            var task = mintenance.witchTask,
                treePanel = $("#" + task + " .treePanel"),
                camera = mintenance.data[task].cameras || [],
                camlen = camera.length,
                camId,
                orglen,
                orgs,
                i;

            for (i = 0; i < camlen; i++) {
                orgs = camera[i].orgIds;
                orglen = orgs.length;
                camId = camera[i].cameraId;
                treePanel.find(".leaf[data-id=" + camId + "]").show();
            }
        }

        // 获取此任务的所有父节点
        function getAllTreeId() {

            /*if(mintenance.data.taskorgids.length>0){
                mintenance.data.allTreeIds = mintenance.data.taskorgids;
                return false;
            }*/

            var task = mintenance.witchTask,
                camera = mintenance.data[task].cameras || [],
                camLen = camera.length,
                orgIds = [],
                orgs,
                orgLen,
                i,
                j;

            for (i = 0; i < camLen; i++) {
                orgs = camera[i].orgIds;
                orgLen = orgs.length;
                for (j = 0; j < orgLen; j++) {
                    orgIds.push(orgs[j]);
                }
            }

            //orgIds = orgIds.concat(mintenance.data.taskorgids);

            mintenance.data.allTreeIds = orgIds.delArrayRepeat();
            //sortedDataBylastNumber();
        }

        // 排序
        function sortedDataBylastNumber(){
            var ids = mintenance.data.allTreeIds;

            ids.sort(function(a,b){
                var x = a.indexOf("vorg")>=0 ? a.split("_")[1] : a,
                    y = b.indexOf("vorg")>=0 ? b.split("_")[1] : b;

                if(x === y && a.indexOf("vorg")>=0){
                    return 1;
                }

                return x-y;
            })

        }

        //一进入巡检任务，就将所有摄像机祖先节点展开
        mintenance.data.expandAllTree = -1;
        function expendAllTree() {
            var task      = mintenance.witchTask,
                treePanel = $("#" + task + " .treePanel"),
                orgIds    = mintenance.data.allTreeIds,
                index     = mintenance.data.expandAllTree + 1,
                orgElm1   = treePanel.find(".tree[data-id=" + orgIds[index] + "]"),
                orgElm2   = treePanel.find(".tree[data-virtual=" + orgIds[index] + "]"),
                orgElm    = orgElm1.length > 0 ? orgElm1 : orgElm2,
                target    = orgElm.children(".fold");

            if (index >= orgIds.length) {
                jQuery("#mytask .cameras,#checktask").trigger("cameraExprendComplete");
                return false;
            }

            if (!target.hasClass("unbind")) {
                if (orgElm.length < 1) {
                    mintenance.data.expandAllTree = index;
                    jQuery("#mytask .cameras,#checktask").trigger("treeExpandSuccess");
                    return false;
                } else {
                    setTimeout(function () {
                        target.trigger("click");
                    }, 100);
                    orgElm.show();
                    target.addClass("unbind");
                }
            } else {
                mintenance.data.expandAllTree = index;
                jQuery("#mytask .cameras,#checktask").trigger("treeExpandSuccess");
                return false;
            }
            mintenance.data.expandAllTree = index;

        }

        // 数组去重
        Array.prototype.delArrayRepeat = function () {
            var newArray = [];
            var provisionalTable = {};
            for (var i = 0, item; (item = this[i]) != null; i++) {
                if (!provisionalTable[item]) {
                    newArray.push(item);
                    provisionalTable[item] = true;
                }
            }
            return newArray;
        };
        // 巡检时左侧树形中摄像机切换时，树形展开完毕后，触发的事件及所执行的函数
        jQuery("#mytask,#checktask").on("treeExpandSuccess", ".cameras", function (e, html) {
            expendAllTree(); // 将所有摄像机祖父节点都展开并且显示
            showAllCameras();
        });

        function sorttedByTree(dataId) {
            var task = mintenance.witchTask,
                data = mintenance.data[task],
                camerasList = data.cameras,
                newCameras = [],
                len = dataId.length,
                lenj = camerasList.length;
            for (var i = 0; i < len; i++) {
                for (var j = 0; j < lenj; j++) {
                    if (dataId[i] === camerasList[j].cameraId) {
                        newCameras.push(camerasList[j]);
                    }
                }
            }
            mintenance.newCameras = newCameras;
        }

        //每次 勾选/取消勾选 摄像机，都对数据进行处理
        function addOrDeleteCameraIdforData(el) {
            var task = mintenance.witchTask,
                data = mintenance.data[task],
                cameras = mintenance.data.camerasId,
            //camerasId = [],
                len = cameras.length,
                li = el.parent("li"),
                id = li.attr("data-id") - 0,
                selected = el.hasClass("selected"),
                tmp;

            /*for(var j=0;j<len;j++){
             camerasId.push({cameraId:cameras[j].cameraId,orgId:cameras[j].orgId});
             }*/

            if (len <= 0) {
                cameras.push({cameraId: id, orgId: li.attr("data-org")});
                //mintenance.data.camerasId = camerasId;
                return false;
            }

            for (var i = 0; i < len; i++) {
                tmp = indexOfObject(cameras, id, "cameraId");

                if (selected && tmp > -1) {
                    cameras.slice(0);
                    cameras.splice(tmp, 1);
                    //mintenance.data.camerasId = camerasId;
                    len = cameras.length;
                    return false;
                }
                if (!selected) {
                    cameras.push({cameraId: id, orgId: li.attr("data-org")});
                    //mintenance.data.camerasId = camerasId;
                    return false;
                }
            }

        }

        function indexOfObject(array, context, key) {

            for (var i = 0; i < array.length; i++) {
                if (array[i][key] === context) {
                    return i;
                }
            }
            return -1;
        }

        function indexOf(array, context) {
            if (typeof Array.prototype.indexOf !== "function") {
                for (var i = 0; i < array.length; i++) {
                    if (array[i] === context) {
                        return i;
                    }
                }
                return -1;
            } else {
                return array.indexOf(context);
            }
        }

        /*
         * elm 要设置状态的 li
         * text 要设置的状态
         * flag 是否强制为正常
         * */
        function camearStatus(elm, text, flag, marginLeft) {
            var len = text.length,
                camera = elm.find(".camearstatus"),
                preStatus = elm.find(".camearstatus").attr('data-status'),
                preStatus = (preStatus === '正常' || preStatus === '巡检中') ? false : preStatus,
                isSearch = marginLeft ? marginLeft : mintenance.data.search.isSearching ? -40 : -28;
            if (camera.length > 0) {
                if(text === 4){
                    camera.text(" ").css({"margin-left": "0", "color": "#333"});
                    return false;
                }
                if (len === 3) {
                    camera.text(text).css({"margin-left": "-40px", "color": "#333"});
                    elm.addClass("doing");
                } else {
                    if (preStatus === '异常' && !flag) {
                        camera.text(preStatus || text).attr({"data-status": preStatus || text}).css({"margin-left": isSearch, "color": "#d95c5c"});
                        elm.removeClass("doing");
                        return false;
                    }
                    if (text === '异常') {
                        camera.text(text).attr({"data-status": preStatus || text}).css({"margin-left": isSearch, "color": "#d95c5c"});
                    } else {
                        if (flag) {
                            camera.text(text).attr({"data-status": ""}).css({"margin-left": isSearch, "color": "#8cce58"});
                        } else {
                            camera.text(preStatus || text).attr({"data-status": preStatus || text}).css({"margin-left": isSearch, "color": "#8cce58"});
                        }
                    }
                    elm.removeClass("doing");
                }
                return false;
            }
            if(text === 4){
                elm.prepend('<span class="camearstatus" style="margin-left:0;color:#333;" data-status=""> </span>');
                elm.addClass("doing");
                return false;
            }
            if (len === 3) {
                elm.prepend('<span class="camearstatus" style="margin-left:-40px;color:#333;" data-status="">' + text + '</span>');
                elm.addClass("doing");
            } else {
                if (text === '异常') {
                    elm.prepend('<span class="camearstatus" style="margin-left:-28px;color:#d95c5c;" data-status="异常">异常</span>');
                } else {
                    elm.prepend('<span class="camearstatus" style="margin-left:-28px;color:#8cce58;" data-status="正常">正常</span>');
                }
                elm.removeClass("doing");
            }
        }

        // 清除 巡检中 的巡检状态
        function clearPollingStatus() {
            var camearstatus = $(".camearstatus:contains('巡检中')"),
                len = camearstatus.length,
                dataStatus,
                camearstatusj;

            for (var i = 0; i < len; i++) {
                camearstatusj = camearstatus.eq(i);
                dataStatus = camearstatusj.attr("data-status");
                camearstatusj.text(dataStatus);
                camearstatusj.closest("li").removeClass("doing");
                if (dataStatus) {
                    if (dataStatus === '异常') {
                        camearstatusj.css({"color": "#d95c5c"});
                    } else {
                        camearstatusj.css({"color": "#8cce58"});
                    }
                    camearstatusj.css({"margin-left": "-28px"});
                } else {
                    camearstatusj.css({"margin-left": "0"});
                    camearstatusj.remove();
                }
                //camearstatusj.closest("li").removeClass("doing");
            }

            /*for(var j=0;j<len;j++){
             if(camearstatus.eq(j).text() === '巡检中'){
             camearstatusj = camearstatus.eq(j);
             dataStatus    = camearstatusj.attr("data-status");
             if(dataStatus !== '巡检中' && dataStatus !== ''){
             if(dataStatus === '异常'){
             camearstatusj.css({"color":"#d95c5c"});
             }else{
             camearstatusj.css({"color":"#8cce58"});
             }
             camearstatusj.text(dataStatus);
             camearstatusj.attr({"data-status":dataStatus});
             camearstatusj.css({"margin-left":"-28px"});
             }else{
             camearstatusj.text("");
             camearstatusj.attr({"data-status":""});
             camearstatusj.css({"margin-left":0});
             camearstatusj.closest("li").removeClass("doing");
             }
             }
             }*/
        }

        mintenance.clearPollingStatus = clearPollingStatus;

        /*地图和经典模式切换*/
        jQuery(document).on('click', '#maptype', function () {
            var mode   = $(".mode"),
                manual = mode.find(".manual");

            if (mode.length > 0) {
                if (!manual.hasClass("active")) {
                    manual.addClass("active");
                    mode.attr({"data-manual": 1});
                }
                mode.hide();
            }

            if (mintenance.videoPlayer) {
                mintenance.videoPlayer.stopAllWithoutClearData();
            }
            jQuery('#classic').show();
            jQuery("#selectPanel").hide();
            jQuery(this).hide();
            jQuery('.pages').css('visibility', 'visible');
            jQuery("#npplay").addClass('infinity');
            jQuery("#gismap").removeClass('infinity');
            mintenance.model = 'maptype';
            mintenance.mapObj.map.updateSize();
            /*纠正地图定位*/
            mintenance.mapObj.map.fullExtent();
            if (mintenance.pointertrigger === true && mintenance.maxLen !== 0) {
                mintenance.PrevLayout = mintenance.layout;
                mintenance.layout = 1;
                //initPrevStatus();// 初始化上一次巡检的状态
                changeStatus(1); // 切换模式时更改左侧树形状态
                mintenance.mapObj.setCamerasToMap(mintenance.newCameras /*mintenance.data[mintenance.witchTask].cameras*/, mintenance.mymap);
                mintenance.mapObj.triggerWindowOnMap(mintenance.curCameraIndex);
            }
            mintenance.optChange = 0;
        });

        jQuery(document).on('click', '#classic', function () {
            var mode = $(".mode");

            if (mode.length > 0) {
                mode.show();
            }

            if (mintenance.mapvideoPlayer) {
                mintenance.mapvideoPlayer.stopAllWithoutClearData();
            }
            if(mintenance.mapObj && mintenance.mapObj.smallW){
                mintenance.mapObj.closeInfoWindow();
            }
            jQuery('#maptype,#selectPanel').show();
            jQuery(this).hide();
            jQuery('.pages').css('visibility', 'hidden');
            jQuery('#npplay').removeClass('infinity');
            jQuery('#gismap').addClass('infinity');
            mintenance.model = 'classic';
            mintenance.layout = mintenance.PrevLayout;  // 重置回切换模式之前的布局
            changeStatus(mintenance.layout); // 切换模式时更改左侧树形状态
            if (mintenance.pointertrigger === true) {
                showVideo(mintenance.layout);
            }
            mintenance.optChange = 0;
        });

        // 多屏切换等
        function switchLayout(obj) {
            var layout = obj.attr("data-layout") - 0;

            $("#selectPanel").attr("data-layout", layout);

            if (layout === 1) {
                $("#major .header .rMenu .item i.icon.split").css("background-position", "0 0");
            }
            if (layout === 4) {
                $("#major .header .rMenu .item i.icon.split").css("background-position", "0px -34px");
            }
            if (layout === 9) {
                $("#major .header .rMenu .item i.icon.split").css("background-position", "0px -68px");
            }
            if (layout === 16) {
                $("#major .header .rMenu .item i.icon.split").css("background-position", "0px -102px");
            }
            /*if (mintenance.videoPlayer === null) {
                mintenance.videoPlayer = new VideoPlayer({
                    layout: layout
                });
            } else {
                mintenance.videoPlayer.setLayout(layout);
            }*/

            mintenance.videoPlayer.setLayout(layout);

            if (mintenance.model === 'classic' && $(".manual").hasClass("active")) {
                showVideo(layout);
                changeStatus(layout);
            }

            if (mintenance.model === 'maptype') {
                mintenance.mapObj.triggerWindowOnMap();
            }
            //mintenance.videoPlayer.initialize();
            mintenance.layout = layout;
        }

        mintenance.switchLayout = switchLayout;

        $("a.item.dropdown").click(function () {
            $(".function-container").addClass("active");
        });

        $(".split-panel.active").hover(function () {

        }, function () {
            $(".function-container").removeClass("active");
        });

        $(".split-panel.active i").click(function () {
            switchLayout($(this));
            $(".function-container").removeClass("active");
        });

        // 切换屏幕播放数的时候，更改右侧树形巡检状态。
        function changeStatus(layout) {
            var task = mintenance.witchTask,       // 我的任务/审核任务
                target = $("#" + task + " .treePanel"),
                camerasIndex = mintenance.curCameraIndex,  // 第 i 个摄像机 当前上一批下一批的分界点
                cameras = mintenance.newCameras,      // 当前任务的摄像机列表
                thisCameras = cameras ? cameras.slice(camerasIndex, layout + camerasIndex) : [],
                curtCamera,
                camearstatus = $(".camearstatus"),
                len = camearstatus.length,

                expandTree = mintenance.data.expandTree, // 引用，减少作用域链

                status,
                camearstatusj;

            for (var j = 0; j < len; j++) {
                camearstatusj = camearstatus.eq(j);
                status = camearstatusj.attr("data-status");
                if (camearstatusj.text() === '巡检中') {
                    if (status) {
                        camearStatus(camearstatusj.closest("li"), status);//camearstatusj.text(status);
                    } else {
                        camearstatus.eq(j).remove();
                    }
                }
            }

            for (var i = 0; i < thisCameras.length; i++) {
                curtCamera = target.find("li.leaf[data-id=" + thisCameras[i].cameraId + "]");
                if (curtCamera.length > 0) {
                    camearStatus(curtCamera, "巡检中");
                }
            }
            // 保存此次巡检的摄像机组，以备下批次时设置其正异常状态
            expandTree.prevCameras = thisCameras;
        }

    })();

    var SearchTask = new Class({
        initialize: function (obj) {
            var self = this;
            this.pageNo = obj.pageNo;
            this.pageSize = obj.pageSize;
            this.option = obj.option;
            this.level = obj.level;
            this.api = obj.api;
            this.node = obj.trigger;
            this.parNode = obj.parNode;
            this.info = obj.info;
            jQuery(document).on('click', this.node, function () {

                var data = {},
                    par = jQuery(self.node).closest('form').find("." + self.level);

                for (var i = 0, len = self.option.length; i < len; i++) {
                    data[self.option[i]] = par.find('[name=' + self.option[i] + ']').val().trim();
                }

                if (self.level === 'simple') {
                    if (data.taskName === '' || data.planName === '') {
                        notify.info(self.info, {timeout: '1000'});
                        return;
                    }
                }

                data.pageNo = self.pageNo;
                data.pageSize = self.pageSize;
                self.searchTask(data);
            });
        },
        searchTask: function (data) {
            var self = this;
            jQuery.ajax({
                url: self.api,
                type: 'post',
                dataType: 'json',
                data: data,
                success: function (data) {

                    if (data && data.code && data.code === 200) {
                        var taskList = data.data.tasks;
                        self.parseData(taskList);
                    } else {
                        notify.error("服务器没有响应！", {timeout: '1000'});
                    }
                },
                error: function () {
                    notify.error('网络或服务器异常！', {timeout: '1000'});
                }
            });
        },
        parseData: function (taskList) {
            var self = this;
            if (taskList === null || taskList.length === 0) {
                jQuery("#" + self.parNode).html('<span style="color:#999999">暂无数据!</span>');
                pagination.hidePage();
                return;
            }
            var data = {};
            jQuery.when(mintenance.loadTpl('maintenance_advanceSearch')).done(function (handlebar) {
                switch (self.parNode) {
                    case 'mytask':
                        data = {
                            'mytask': taskList
                        };
                        break;
                    case 'checktask':
                        data = {
                            'checktask': taskList
                        };
                        break;
                    case 'combine':
                        data = {
                            'combine': taskList
                        };
                        break;
                    case 'plan':
                        data = {
                            'plan': taskList
                        };
                        break;
                }
                jQuery("#" + self.parNode).html(Handlebars.compile(handlebar)(data));
                pagination.hidePage();
            });
        }
    });
    /*搜索我的任务*/
    new SearchTask({
        trigger: '.searchMyTask',
        api: '/service/check/search_tasks_list',
        option: ['taskName'],
        level: 'simple',
        parNode: 'mytask',
        pageNo: '1',
        pageSize: '5',
        info: '请输入任务名称'
    });
    /*搜索我的任务(高级)*/
    new SearchTask({
        trigger: '.highSearchMyTaskTrigger',
        api: '/service/check/search_tasks_list',
        option: ['taskName', 'taskStatus'],
        level: 'advance',
        parNode: 'mytask',
        pageNo: '1',
        pageSize: '5',
        info: '请输入任务名称'
    });
    /*搜索计划*/
    new SearchTask({
        trigger: '.searchPlan',
        api: '/service/check/search_plans_list',
        option: ['planName'],
        level: 'simple',
        parNode: 'plan',
        pageNo: '1',
        pageSize: '5',
        info: '请输入计划名称'
    });

    Handlebars.registerHelper('pollingresult', function (data) {
        var result = '';
        switch (data) {
            case 1:
                result = '正常';
                break;
            case 2:
                result = '异常';
                break;
            case 3:
                result = '';
                break;
            default:
                result = '';
        }
        return result;
    });

    Handlebars.registerHelper('checkStatus', function (data) {
        var result = '';
        switch (data) {
            case 1:
                result = '已巡检';
                break;
            case 2:
                result = '已巡检';
                break;
            case 3:
                result = '未巡检';
                break;
            default:
                result = '未知参数';
        }
        return result;
    });

    /*Handlebars.registerHelper('polingType', function (data) {
        var result = '手动';
        return result;
    });*/

    Handlebars.registerHelper('isRoot', function (isRoot) {
        return isRoot ? 'root' : 'tree';
    });

    Handlebars.registerHelper('statusToColor', function (data) {
        var result = '';
        switch (data) {
            case 1:
                result = '8cce58';
                break;
            case 2:
                result = 'd95c5c';
                break;
            case 3:
                result = '333';
                break;
            default:
                result = '333';
        }
        return result;
    });

    /*摄像机搜索searchCameras*/
    var SC = new Class({
        initialize: function (obj) {
            this.tplApi = obj.tplApi;
            this.dataApi = obj.dataApi;
            this.appendTo = obj.appendTo;
            this.norLevel = obj.norLevel;
            this.topLevel = obj.topLevel;
            this.parNode = obj.parNode;
            this.triggerNSearch = obj.triggerNSearch;
            this.triggerHSearch = obj.triggerHSearch;
            this.type = obj.type;
            /*post,get*/
            this.info = {}, /*搜索参数*/
                this.data = '';
            /*数据*/
            this.tpl = '';
            /*模板*/
            this.bindEvent();
            /*绑定触发搜索*/
            this.loadTpl();
            /*获取模板*/
            this.callback = obj.callback;
        },
        loadTpl: function () {
            var self = this;
            jQuery.ajax({
                url: self.tplApi,
                type: 'get'
            }).done(function (html) {
                self.tpl = html;
            });
        },
        loadData: function () {
            var self = this;
            jQuery.ajax({
                url: self.dataApi,
                type: self.type,
                data: self.info
            }).done(function (data) {
                //self.data = data.data;//{cameras:[]}
                if (data.data.cameras === null || data.data.cameras.length === 0) {
                    self.parNode.show();
                    self.parNode.html('<i style="color:#999">暂无数据!</i>');
                    return;
                }
                // 为树形增加数据
                var node = $(".cameras-list.polling .treePanel>ul>li"),
                    orgData = node.data(),
                    tmp;

                tmp = {
                    id: orgData.id,
                    org: orgData.org,
                    name: orgData.name,
                    cameras: data.data.cameras,
                    isRoot: node.children(".root").length
                };

                self.data = tmp;
                self.render();

            }).fail(function () {
                notify.info('网络或服务异常!', {timeout: '1000'})
            });
        },
        bindEvent: function () {
            var self = this,
                t    = null;

            jQuery(document).on('focus', self.triggerNSearch, function () {
                if ($(".mode .active").length > 0) {
                    notify.warn("请停止巡检之后再搜索！");
                    return false;
                }
                clearInterval(t);
                var sBtn = jQuery(this), val = sBtn.val().trim();
                t = setInterval(function () {
                    if (val === sBtn.val().trim()) {
                        return;
                    } else {
                        val = sBtn.val().trim();
                        if (val === '') {
                            self.cancelSearch();
                        } else {
                            self.doSearch('simple');
                        }
                    }
                }, 600);
            });

            jQuery(document).on('blur', self.triggerNSearch, function () {
                clearInterval(t);
            });

            jQuery(document).on('click', self.triggerHSearch, function () {
                if ($(".mode .active").length > 0) {
                    notify.warn("请停止巡检之后再搜索！");
                    return false;
                }
                self.doSearch('high');
            });

            jQuery(document).on('keypress', self.triggerNSearch, function (e) {
                var keyCode = e.keyCode;
                if(keyCode === 13 && !$(".serchbox.high").is(":visible")){
                    return false;
                }
            });

            jQuery(document).on('keypress', '.polling.cameraName input[name=cameraName], #type, #status, #result', function (e) {
                var keyCode = e.keyCode;
                if(keyCode ===13 && $(".serchbox.high").is(":visible")){
                    $(self.triggerHSearch).click();
                }
            });

            /*选择了已巡检,才显示正常异常选项*/
            jQuery(document).on('change', '#status', function () {
                var result = jQuery('.polling.result, .polling.type');
                if (jQuery(this).val() === '2') {
                    result.show();
                    self.topLevel.push('result');
                    self.topLevel.push('type');
                } else {
                    result.hide();
                    self.topLevel.pop();
                    self.topLevel.pop();
                }
            });
        },
        cancelSearch: function () {
            this.parNode.hide();
            /*隐藏搜索结果dom*/
            this.parNode.siblings('.cameras').show();
            /*显示摄像机树*/

            // 清空搜索结果和标志
            mintenance.data.search = {
                isSearching: false,
                starusElmLen: 0
            };
            mintenance.data.expandTree.prevCameras = mintenance.prePreCameras;
            mintenance.newCameras = mintenance.preNewCameras;
            mintenance.curCameraIndex = mintenance.preCurCameraIndex;
            mintenance.maxLen = mintenance.preMaxLen;
            mintenance.data.isBadId = mintenance.preIsBadId;

            mintenance.data.search.polling = false;
            //mintenance.data.cameraOrgIds           = mintenance.preCameraOrgIds;

            this.parNode.html("");
            if (mintenance.videoPlayer) {
                mintenance.videoPlayer.stopAllWithoutClearData();
                mintenance.videoPlayer.refreshAllWindow();
            }
            if (mintenance.mapvideoPlayer) {
                mintenance.mapvideoPlayer.stopAllWithoutClearData();
                mintenance.mapvideoPlayer.refreshAllWindow();
            }
        },
        doSearch: function (arg) {
            this.parNode = jQuery(this.appendTo);

            this.parNode.show();

            this.getInfo(arg);
            /*获取参数*/

            this.loadData();
            /*获取数据,更新dom*/

            this.parNode.siblings('.cameras').hide();
        },
        getInfo: function (arg) {
            var data = {}, par = jQuery('form.cameraSearch');
            data.taskId = mintenance.data.mytask.taskId;
            if (arg === 'simple') {
                data.cameraName = par.find('div.simple [name= ' + this.norLevel[0] + ']').val().trim();
            } else if (arg === 'high') {
                var len = this.topLevel.length;
                while (len--) {
                    data[this.topLevel[len]] = par.find('div.high [name=' + this.topLevel[len] + ']').val().trim();
                }
            }
            this.info = data;
        },
        render: function () {
            this.parNode.html(Handlebars.compile(this.tpl)(this.data));
            this.callback && this.callback(this.data);
        }
    });

    var cameraSearch = new SC({
        tplApi: '/module/maintenance/maintenance/inc/camerasSearchTree.html',
        dataApi: '/service/check/taskCameras',
        appendTo: 'div.cameraSearch',
        parNode:$('div.cameraSearch'),
        type: 'post',
        triggerNSearch: 'div.simple input[name=cameraName]',
        triggerHSearch: 'span.searchCameras',
        norLevel: ['cameraName'],
        topLevel: ['cameraName', 'status'],
        callback: function (data) {
            // 搜索完成后，巡检关键数据的替换
            mintenance.data.search = {
                isSearching: true,
                starusElmLen: 0
            };
            mintenance.preIsBadId = mintenance.data.isBadId;
            mintenance.data.isBadId = [];
            //mintenance.preCameraOrgIds   = mintenance.data.cameraOrgIds,
            //mintenance.data.cameraOrgIds = []
            mintenance.prePreCameras = mintenance.data.expandTree.prevCameras || [];
            mintenance.preNewCameras = mintenance.newCameras;
            mintenance.newCameras = data.cameras;
            mintenance.preCurCameraIndex = mintenance.curCameraIndex;
            mintenance.preMaxLen = mintenance.maxLen;
            mintenance.maxLen = data.cameras.length;
            mintenance.curCameraIndex = 0;

            mintenance.clearPollingStatus();

            for (var i = 0; i < mintenance.maxLen; i++) {
                if ((data.cameras)[i].status === 2) {
                    mintenance.data.isBadId.push(data.cameras[i].cameraId);
                    //mintenance.data.cameraOrgIds.push(data.cameras[i].orgId)
                }
            }
        }
    });

    // 关闭所有预播放的视频
    (function() {
        window.onbeforeunload = function() {
            if(mintenance.videoPlayer){
                mintenance.videoPlayer.perAllCloseStream();
            }
        }
    })();

    /*初始化播放器和视频巡检操作部分高度*/
    (function () {
        var interval;
        jQuery('.relpos,#UIOCX').height(jQuery(window).height() - 130 - 120);
        jQuery(window).resize(function () {
            clearTimeout(interval);
            interval = setTimeout(function () {
                jQuery('.relpos,#UIOCX').height(jQuery(window).height() - 130 - 120);
                setAutoLayoutPosition();
            }, 200);
        });
    })();

    // 设置遮挡层的位置
    function setAutoLayoutPosition() {
        var layout = $("#mytask .make-polling .cameras-list.polling"),
            position, height, width;

        if (layout.length > 0) {
            position = layout.offset();
            height = $(window).height();
            width = layout.width();
            layout.find(".automain").css({
                top: (height - position.top) / 2 + position.top,
                left: position.left + width / 2
            })
        }

    }


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


});
