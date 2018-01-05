/**
 * Created by LiangChuang on 2014/12/3.
 */
define(["js/tools"],function(tools){

    var startPlayVideo  = tools.startPlayVideo,
        getCamerasIssue = tools.getCamerasIssue,
        postIssue       = tools.postIssue,
        cameraStatus    = tools.cameraStatus,
        expandTree      = tools.expandTree,
        showNext        = tools.showNext,
        getIssues       = tools.getIssues,
        showPrevious    = tools.showPrevious,
        postNormal      = tools.postNormal,
        scrollarMove    = tools.scrollarMove;

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
                //self.closeInfoWindow();
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
                this.ocxDom.innerHTML = '<param name="onload" value="pluginLoaded"/>';
                this.ocxDom.setAttribute("id", "UIOCXMAP");
                this.ocxDom.setAttribute("height", 216);
                this.ocxDom.setAttribute("width", 268);
                this.ocxDom.setAttribute("type", "applicatin/x-firebreath");
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
                    cameraStatus($("#mytask .cameras-list.polling .treePanel li.leaf[data-id=" + cameraId + "]"), "正常", 1, -28); // 巡检树
                    cameraStatus($("#mytask .cameraSearch.treePanel li.leaf[data-id=" + cameraId + "]"), "正常", 1);  // 搜索树
                } else {
                    cameraStatus($("li.leaf[data-id=" + cameraId + "]"), "正常", 1);
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
                    cameraStatus($("li.leaf[data-id=" + cameraId + "]"), "正常", 1);
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

});