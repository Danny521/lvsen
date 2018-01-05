/**
 * Created by LiangChuang on 2014/12/3.
 */

define(["orgnScrollbar","./../../../common/js/common.player","jquery","js/task"],function(scrollBar,VideoPlayer){
    var tools = {
        initPrevStatus : function (data,isAuto) {
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
                    statusText = tools.getStatus(status);
                    if(isAuto){
                        if(target.find("i.checkbox.selected").length>0){
                            tools.cameraStatus(target, statusText);
                        }
                    }else{
                        tools.cameraStatus(target, statusText);
                    }
                    //camearStatus(target, statusText);
                }

            }
        },
        // 返回状态文字
        getStatus : function(status) {
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
        },
        /*
         * elm 要设置状态的 li
         * text 要设置的状态
         * flag 是否强制为正常
         * */
        cameraStatus : function(elm, text, flag, marginLeft) {
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
        },
        // 是否可以勾选异常信息的选择框 isInit 是否初始化(都禁用)
        checkboxAction : function(isInit) {
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
        },
        //播放视频地图上的视频
        startPlayVideo : function(camerasData) {
            var cData = tools.transKey(camerasData,0,true);

            if(mintenance.mapvideoPlayer){
                mintenance.mapvideoPlayer.stopWithoutClearData(false,0);
            }else{
                mintenance.mapvideoPlayer = new VideoPlayer({
                    uiocx: 'UIOCXMAP',
                    layout: 1
                });
            }

            mintenance.data.cameraIds = [cData.cId];
            mintenance.data.cameraOrgIds = [cData.orgId];

            //拖动地图 OCX 残影问题 2014.11.19 By LiangChuang
            mintenance.mapvideoPlayer.refreshForGis(100);


            // 取消延迟播放，优化播放速度 2014.11.19 By LiangChuang
            var back = mintenance.mapvideoPlayer.play(cData, 0);

            mintenancePlayer.setData(cData);
            tools.triggerPtz(mintenance.mapvideoPlayer, cData);
        },
        getCamerasIssue : function(parents) {
            var curTask  = mintenance.data[mintenance.witchTask],
                taskId   = curTask.taskId,
                orgId    = mintenance.newCameras[mintenance.curCameraIndex].orgId,
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
                            tools.initAbnormal(parents);
                            if (mintenance.model === 'classic') {
                                jQuery('.abnormal').trigger('click');
                            }
                            if (mintenance.model === 'maptype') {
                                jQuery('.mapAbnormal').addClass('red');
                            }
                            tools.parseIssue(taskCamera, parents);
                        }
                        /*设备正常*/
                        if (taskCamera.status === 1) {
                            tools.initAbnormal(parents);
                            if (mintenance.model === 'maptype') {
                                jQuery('.mapNormal').addClass('green');
                            }
                            if (mintenance.model === 'classic') {
                                jQuery('.normal').addClass('green');
                            }
                        }
                        /*设备没有定义正常异常*/
                        if (taskCamera.status === 3) {
                            tools.initAbnormal(parents);
                        }
                    } else {
                        notify.error('服务器没有响应！', {timeout: '1000'});
                    }
                },
                error: function () {
                    notify.error("网络或服务器异常！", {timeout: '1000'});
                }
            });
        },

        /*因为地图上的异常信息布局和经典模式不同所以加了parents区别*/
        parseIssue : function (data, parents) {
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
        },

        postIssue : function(cameraIssues, callback) {
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
        },

        expandTree : function(status, flag) {   // 其实主要的作用是判断并设置摄像机的巡检状态，历史原因，名字有歧义

            var task            = mintenance.witchTask,       // 我的任务/审核任务
                target          = mintenance.data.search.isSearching ? $(".cameraSearch.treePanel") : $("#" + task + " .cameras-list.polling .treePanel"),
                camerasIndex    = mintenance.curCameraIndex,  // 第 i 个摄像机 当前上一批下一批的分界点
                cameras         = mintenance.newCameras,      // 当前任务的摄像机列表

                expandTree      = mintenance.data.expandTree, // 引用，减少作用域链

                starusElmLen    = mintenance.data.search.isSearching ? mintenance.data.search.starusElmLen : expandTree.starusElmLen,

                prevCameras     = expandTree.prevCameras.slice(0), // 上一次巡检的摄像机组

                statusText      = tools.getStatus(status || 1),

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
                        tools.cameraStatus(curtCamera, "巡检中");
                    }
                }
                // 保存此次巡检的摄像机组，以备下批次时设置其正异常状态
                expandTree.prevCameras = thisCameras;
            }

            if (thisCameras.length > 0 && starusElmLen > 0) {
                for (var l = 0; l < thisCameras.length; l++) {
                    curtCamera = target.find("li.leaf[data-id=" + thisCameras[l].cameraId + "]");
                    tools.cameraStatus(curtCamera, "巡检中");
                }
                expandTree.prevCameras = thisCameras;
            }

            if (prevCurtCameras.length > 0 && !expandTree.isLast) {
                for (var k = 0; k < prevCurtCameras.length; k++) {
                    prevCurtCamera = target.find("li.leaf[data-id=" + prevCurtCameras[k].cameraId + "]");
                    tools.cameraStatus(prevCurtCamera, statusText || '正常');
                }
            }

        },

        showNext : function(){
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
                tools.showVideo(mintenance.layout);
            } else {
                mintenance.mapObj.triggerWindowOnMap();
            }
        },

        showPrevious : function(){
            if (mintenance.curCameraIndex <= 0) {
                notify.info('已经是该组第一个摄像机！', {timeout: '1000'});
                mintenance.data.expandTree.isLast = 1;
                tools.expandTree(1, 1);
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
                tools.showVideo(mintenance.layout, 1);
            } else {
                mintenance.mapObj.triggerWindowOnMap();
            }
        },

        /*获取用户编辑的故障信息
         * status
         * 1 正常
         * 2 异常*/
        getIssues : function(parents, status) {
            var info         = [],
                issuesOpt    = parents.find('input:checked'),
                len          = issuesOpt.length,
                taskObj      = mintenance.data[mintenance.witchTask],
                cameraId     = mintenance.model === 'maptype' ? mintenance.newCameras[mintenance.curCameraIndex].cameraId : mintenance.data.cameraData.cId,
                isBadId      = mintenance.data.isBadId,
                isEqual      = 0,
                cameraIssues = {},
                pic;

            // 正常
            if (status === 1) {
                cameraIssues = {
                    remark: '',
                    status: 1,
                    taskId: taskObj.taskId,
                    orgIds: mintenance.model === 'maptype' ? mintenance.newCameras[mintenance.curCameraIndex].orgId : mintenance.data.cameraData.orgId,
                    cameraIds: cameraId
                }

                tools.postIssue(cameraIssues, function () {
                    if (mintenance.data.search.isSearching) {
                        tools.cameraStatus($("#mytask .cameras-list.polling .treePanel li.leaf[data-id=" + cameraId + "]"), "正常", 1, -28); // 巡检树
                        tools.cameraStatus($("#mytask .cameraSearch.treePanel li.leaf[data-id=" + cameraId + "]"), "正常", 1);  // 搜索树
                    } else {
                        tools.cameraStatus($("li.leaf[data-id=" + cameraId + "]"), "正常", 1);
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
            tools.postIssue(cameraIssues, function () {
                //var cameraId = mintenance.data.cameraData.cId;
                if (mintenance.data.search.isSearching) {
                    tools.cameraStatus($("#mytask .cameras-list.polling .treePanel li.leaf[data-id=" + cameraId + "]"), "异常", 1, -28); // 巡检树
                    tools.cameraStatus($("#mytask .cameraSearch.treePanel li.leaf[data-id=" + cameraId + "]"), "异常", 1);  // 搜索树
                } else {
                    tools.cameraStatus($("li.leaf[data-id=" + cameraId + "]"), "异常", 1);
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
        },

        postNormal : function(){
            var cameraIds    = mintenance.data.cameraIds,
                newCameraIds = cameraIds.slice(0, cameraIds.length),
                cameraOrgIds = mintenance.data.cameraOrgIds,  // 正在播放的摄像机的组织 id
                isBadId      = mintenance.data.isBadId,
                length       = cameraIds.length,
                tmpCameras   = [],
                tmpOrgIdS    = [],
                cameraIdsi,
                self;

            if (mintenance.model === 'classic') {
                self = jQuery('#normal');
            }
            if (mintenance.model === 'maptype') {
                self = jQuery('#mapNormal');
            }

            for (var i = 0; i < length; i++) {
                cameraIdsi = newCameraIds[i] - 0;
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
                taskId = mintenance.data[mintenance.witchTask].taskId,
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
            tools.postIssue(info);
        },

        scrollarMove : function(){
            var item_header = $(".make-polling .item-header"),
                item_height = item_header.height(),
                operation   = $(".make-polling .cameras .opration"),
                o_height    = operation.height(),
                li_height   = 24,
                index       = mintenance.curCameraIndex,
                top         = index*li_height + o_height + item_height;
            //scroll      = ScrollListener.formPanel;

            //if(scroll.contentPosition !== (scroll.contentSize - scroll.viewportSize) && scroll.contentPosition !== 0){
            scrollBar.updateScrollbar(top);
            //}
            //opration.scrollTop(top);
        },

        transKey : function(data,i,map) {
            if (!data.cameraStatus || (data.cameraStatus - 0) === 1) {
                if(map){
                    if(mintenance.mapvideoPlayer){
                        mintenance.mapvideoPlayer.setStyle(2,i); // 设置 OCX 上显示摄像机离线
                    }else{
                        notify.info("摄像机离线！");
                    }
                }else{
                    if(mintenance.videoPlayer){
                        mintenance.videoPlayer.setStyle(2,i); // 设置 OCX 上显示摄像机离线
                    }else{
                        notify.info("摄像机离线！");
                    }
                }
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
        },

        triggerPtz : function(playObj, cData) {
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
        },

        initAbnormal : function (parents) {
            if (parents.hasClass('controller-area')) {
                tools.disableCheckbox(parents, true);
            }
            parents.find("input:checkbox").prop('checked', false);
            parents.find('.red').removeClass('red');
            parents.find('.green').removeClass('green');
            parents.find("textarea[name=remarks]").val('');
        },

        /* checkbox禁用 */
        disableCheckbox : function(parentsNode, trigger) {
            parentsNode.find('input:checkbox').prop('disabled', trigger);
            if (trigger) {
                parentsNode.find('label').css('color', '#AFAFAF');
            }
            if (!trigger) {
                parentsNode.find('label').css('color', '#333');
            }
        },

        showVideo : function(layout, flag, isChange) {

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
            tools.playVideo(cameras, layout, preNext);
        },

        playVideo : function(camerasData, layout, next) {
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
                    tools.setControlBarPos(index);
                    $("#downBlockContent span").text(target.find("li.leaf[data-id='" + this.cameraData[index].cId + "'] span.name").text());
                    mintenance.data.cameraData = cameraData;
                    mintenance.data.foucusPlayerIndex = index;//焦点所在屏
                    tools.setException(cameraData, index);
                });
                mintenance.isAddEvent = true;
            }

            mintenance.videoPlayer.setLayout(layout);
            mintenance.videoPlayer.enableExchangeWindow(false);
            mintenance.videoPlayer.stopAllWithoutClearData();
            mintenance.videoPlayer.refreshAllWindow();

            for (var i = 0; i < camerasData.length; i++) {
                cData = tools.transKey(camerasData[i],i);
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
        },
        // 设置控制条的位置
        setControlBarPos : function(index) {
            if (mintenance.videoPlayer.cameraData[index] !== -1) {
                var channelPositionObj = mintenance.videoPlayer.getVideoRectByIndex(index);
                jQuery('#video-control').css({
                    left: channelPositionObj.Left,
                    top: channelPositionObj.Top,
                    width: channelPositionObj.Width,
                    height: channelPositionObj.Height
                }).show();
            }
        },

        setException : function(cameraData, index) {
            //$('#abnormal').trigger("click");
            // 云台是否可以操作，只有在线的摄像机才判断
            if(cameraData.status === 0) {
                mintenancePlayer.setData(cameraData, index);
            }
            // 异常信息是否可以勾选等
            tools.checkboxAction();
            tools.getIssuseById(cameraData.cId);
        },

        // 获取被点击的屏幕的摄像机的错误信息
        getIssuseById : function(cameraId) {
            var curTask = mintenance.data[mintenance.witchTask],
                taskId  = curTask.taskId,
                orgId   = tools.getOrgIdbyCameraId(cameraId),
                parent  = jQuery('.controller-area');

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
                            tools.parseIssue(taskCamera, parent); // 填充异常信息
                        }
                    } else {
                        notify.error('服务器没有响应！', {timeout: '1000'});
                    }
                },
                error: function () {
                    notify.error("网络或服务器异常！", {timeout: '1000'});
                }
            });
        },

        // 通过摄像机id获取此摄像机的组织id
        getOrgIdbyCameraId : function(id) {
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


    }

    return tools;
});
