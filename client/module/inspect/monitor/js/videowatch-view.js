/*global window:true, require:true, document:true*/
/**
 * Created by Mayue on 2014/12/9.
 *  注释：[data-tabor]元素的点击，面板切换代码写在了video-monitor.js中，事件委托
 */
define([
	"jquery",
	"underscore",
	"js/choose-camera-view",
	"text!/module/inspect/monitor/inc/group_tpl.html",
	"text!/module/inspect/monitor/inc/group_create_tpl.html",
	"handlebars",
	"jquery.datetimepicker",
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-time-ctrl.js"
], function(jQuery, _, chooseCameras, gTpl, gTimeTpl){
	"use strict";
	var Module = require("js/videowatch-module");
	var internalPubSub;
	var Controller;
 	var globeEle = null;  //当前编辑元素
 	var flagsIn = false; //点击编辑下的标志
 	var homeFlag = false; //点击保存下的标志
 	var globeIndex = null; // 编辑下的下标
 	var flagsSa = false ;	//记录初始化的编辑
 	var selectEle = null;
 	var editorFlg = null; //记录点击时间的编辑
	var View = function(pb, ocx, controller) {
		var self = this;
		internalPubSub = pb;
		self.player = ocx;
		self.initEvent();
		Controller = controller;
		self.cameraList = [];
		self.cameras = null;
		self.globId = null;   //点击编辑之后获取watchId;
		self.playsCamera = [];
		self.globesIndex = null;
		//初始化dom容器
		var $mainContainer = jQuery("#sidebar-body");
		self.creatContainer = $mainContainer.find('> [data-tabor="inspect-create"]  .group>ul');
		self.container = $mainContainer.find('> [data-tabor="monitor-inspect"] > .groups');
	};

	View.prototype = {
		URLS: {
			CREATE_TPL: "inc/group_create_tpl.html"
		},
		player:null,
		htmlCache:{},
		templCache:{},
		alreadyInfoed:false,
		creatContainer:null,//左侧面板容器--布局设置面板
		container:null,//左侧面板容器--监巡分组面板
		mouseStatus:1, //1:未进入过面板,2:进入了,3离开了    备注：面板是指jQuery("#groupwrap") 该参数主要是为资源树上添加摄像头到监巡分组时，弹窗3秒消失处理所用
		timer:null, //该参数主要是为资源树上添加摄像头到监巡分组时，弹窗3秒消失处理所用
		/**
		 * 初始化事件绑定
		 */
		initEvent:function(){
			var self = this,
				$sideBar = jQuery("#sidebar"),
				$sideBody = jQuery("#sidebar-body");
			//点击添加摄像机
			jQuery(".addcamera").on("click", function() {
				chooseCameras.init(self.cameraList, function(cameras) {
					self.showChoosedCameras(cameras);
				});
			});
			//点击“监巡分组”按钮  初始化面板
			$sideBar.on("click", 'li.patrol[data-tabor="monitor-inspect"]', function() {
				//关闭播放的摄像机
				/*var layout = self.player.getLayout();
				self.player.stopAll();
				while (layout--) {
					self.player.refreshWindow(layout);
				}*/
				//此处抽离成函数，主要是方便在删除一组监巡分组后，方便调用
				self.initPanel();
			});
			//点击已选摄像机数目
			$sideBar.on("click", ".group-item .item-num>span", function() {
				var $cameraListPanel = jQuery(this).parent().next();

				if(!$cameraListPanel.hasClass("filtered")) {
					var $cameraList = $cameraListPanel.find("li");
					//渲染权限
					$cameraList.each(function (index, item) {
						var $curItemIcon = $(item).find("i"),
							cameraId = parseInt($curItemIcon.data("cameraid")),
							tem = permission.stopFaultRightById([cameraId])[0];
						if (!tem) {
							$curItemIcon.addClass("disabled");
						}
					});
					$cameraListPanel.addClass("filtered")
				}
				//显示/隐藏摄像机列表
				$cameraListPanel.slideToggle();
			});
			//点击布局设置
			jQuery(".layoutNum i").on("click",function() {
				var po = 0,
					$this = jQuery(this),
					layout = $this.data("layout"),
					$lists = jQuery("#sidebar-body").find('> [data-tabor="inspect-create"] .cameraslist li'),
					len = self.cameraList.length;
				//根据当前分配裁剪摄像机列表
				var fc = function () {
					for (var i = layout; i < len; i++) {
						$lists.eq(i).remove();
					}
					self.cameraList.splice(layout, len - layout);
					$this.addClass("layoutFlags").siblings().removeClass("layoutFlags");
					self.player.setLayout(layout);
					self.player.stopAll();
					while (layout--) {
						self.player.refreshWindow(layout);
					}
					for (i = 0; i < self.cameraList.length; i++) {
						self.cameraList[i].position = po++;
					}
					internalPubSub.publish("playCamerasAll");
				};
				if (self.cameraList.length > layout) {
					new ConfirmDialog({
						title: "警告",
						width: 640,
						message: "摄像机数目大于分屏数目，强制执行会删除多余摄像机！",
						callback: function () {
							fc();
						}
					});
				} else {
					$this.addClass("layoutFlags").siblings().removeClass("layoutFlags");
					self.player.setLayout(layout);
				}
			});
			//点击新建按钮
			$sideBar.on("click", '[data-tabor="monitor-inspect"] .init-create .creater', function(e){
				e.preventDefault();
				e.stopPropagation();
				flagsSa = false;
				//判断当前播放器是否有视频播放
				var i = self.player.getLayout(),
					flags = false;
				while(i--) {
					if (self.player.cameraData[i] !== -1) {
						flags = true;
						break;
					}
				}
				//新建时的处理程序
				var fc = function() {
					window.playDelFla = true;
					self.globesIndex = 0;
					self.cameraList = [];
					chooseCameras.newCameras = [];
					//隐藏视频画面上方按钮
					jQuery(".ui.atached.menu").css("display", "none");
					//初始化分屏（默认选中4分屏）
					jQuery(".layoutNum i").removeClass("layoutFlags").eq(1).addClass("layoutFlags");
					self.player.setLayout(4);
					//显示第一个时间段输入框
					jQuery(".newTimeOb").show();
					//隐藏添加时间段按钮
					jQuery(".newTime").hide();
					//清空时间段列表
					jQuery(".itemwrapper").empty();
					//清空摄像机列表
					jQuery(".cameraslist>ul").empty();
					//标记新建分组
					jQuery('[data-tabor="inspect-create"] .titie-text').html("新建监巡分组");
					//初始化时间选择控件[bug45193,添加.empty来清空已有值，add by zhangyu]
					jQuery(".time-group").empty().TimeSelect({
						parentBorder: {
							"borderColor": "#ddd"
						},
						controlsBorder: {
							"borderColor": "#ddd"
						}
					});
					//触发创建页面切换
					jQuery("#resetInput").trigger("click");
				};
				//初始化默认时间
				var fTime = function() {
					var $beginTime = jQuery(".begintime"),
						$endTime = jQuery(".endtime"),
						hour = (new Date()).getHours(),
						minutes = (new Date()).getMinutes();
					hour = hour < 10 ? "0" + hour : hour;
					var endHour = parseInt(hour) + 1 < 10 ? "0" + parseInt(hour) + 1 : parseInt(hour) + 1;
					minutes = minutes < 10 ? "0" + minutes : minutes;
					$beginTime.find(">.text1").val(hour);
					$beginTime.find(">.text2").val(minutes);
					$endTime.find(">.text1").val(endHour);
					$endTime.find(">.text2").val(minutes);
				};
				if (flags) {
					new ConfirmDialog({
						title: "提示",
						width: 640,
						message: "视频播放中，确定要关闭吗？",
						callback: function () {
							//关闭视频
							self.player.stopAll();
							var layout = self.player.getLayout();
							while (layout--) {
								self.player.refreshWindow(layout);
							}
							fc();
							//来自编辑下的操作
							if (flagsIn) {
								self.globesIndex = globeIndex;
								self.editorFn(globeEle);
								flagsIn = false;
								flagsSa = true;
							} else {
								fTime();
							}
						}
					});
				} else {
					fc();
					if (flagsIn) {
						self.globesIndex = globeIndex;
						self.editorFn(globeEle);
						flagsIn = false;
						flagsSa = true;
					} else {
						fTime();
					}
				}
			});
			/**
			 * 点击“返回“按钮
			 */
			$sideBar.on("click", ".opera-panel > .back-home >.inspect-list", function(e) {
				e.preventDefault();
				e.stopPropagation();
				var fs = function () {
					jQuery(".ui.atached.menu .item.dropdown").removeClass("active");
					//如果抓图开启
					if (jQuery(".screenshot-preview").is(":visible")) {
						jQuery(".screenshot-preview .exit").trigger("click");
					}
					jQuery(".close-frame").trigger("click");
					jQuery(".video-control").css("left", 10000);
					self.player.stopAll();
					var layout = self.player.getLayout();
					while (layout--) {
						self.player.refreshWindow(layout);
					}
					jQuery("#sidebar-head").find(".menus > .patrol").trigger("click");
					return false;
				};
				if (homeFlag) {
					fs();
					homeFlag = false;
				}
				else {
					var messages = flagsSa ? "正在编辑监巡分组，请确认是否放弃？" : "正在新建监巡分组，请确认是否放弃？";
					new ConfirmDialog({
						title: "提示",
						width: 640,
						message: messages,
						callback: function () {
							fs();
						}
					});
				}
			});
			/**
			 * 删除单个监巡分组
			 */
			$sideBar.on("click", ".groups .item-header a .icon-del", function(e) {
				e.preventDefault();
				e.stopPropagation();
				var $delNode = jQuery(this).closest(".del");
				if (jQuery(".loop-header").is(":visible")) {
					//监巡开启状态中
					notify.info("监巡进行中，请先停止！");
					return false;
				}
				new ConfirmDialog({
					title: "警告",
					width: 640,
					message: "确定要删除此分组吗？",
					callback: function () {
						internalPubSub.publish("deleteGroup", $delNode);
					}
				});
			});
			/**
			 * 添加监巡分组弹出层 input失去焦点时校验监巡分组名称是否重复
			 */
			$sideBar.on("blur", "#addgroupName, .addgroupName", function(e) {
				e.stopPropagation();
				e.preventDefault();
				internalPubSub.publish("verifyGroupName",jQuery(this));
			});
			/**
			 * 添加到监巡分组  点击"确定"按钮【视频上方快捷方式】
			 */
			jQuery("body").on("click", "#addsubmitbtn", function(e) {
				e.stopPropagation();
				e.preventDefault();
				if (jQuery(".loop-header").is(":visible")) {
					//监巡开启状态中
					notify.info("此监巡分组正在播放，请先停止当前监巡！");
					return false;
				}
				internalPubSub.publish("addInspect", jQuery(this));
			});
			/**
			 * 新建监巡分组保存【左侧新建面板】 add by  wujingwen on2015.09.23
			 */
			$sideBar.on("click", ".addsubmitbtn", function(e) {
				e.stopPropagation();
				e.preventDefault();
				homeFlag = true;
				/*从controller 拿过来开始*/
				var newCameras = self.cameraList,
					hasVideo = false,
					layout,
					cameraId = [];
				//已选摄像机列表容器
				self.cameras = {
					"cameras": []
				};
				//判断时间段添加
				if (jQuery(".group .itemwrapper>li").length === 0) {
					notify.error("未添加时段，请添加时段重试");
					return;
				}
				//获取分屏信息
				var $layoutObj = jQuery(".layoutNum i");
				if ($layoutObj.hasClass("layoutFlags")) {
					layout = $layoutObj.filter(".layoutFlags").data("layout");
				} else {
					layout = self.player.getLayout();   //如果没有选分屏，默认是目前的。
				}
				var groupNames = [],
					eleNames = jQuery(".group-content .group-item").find(".name"),
					groupName = jQuery(".addgroupName").val().trim();
				eleNames.each(function (index) {
					groupNames.push(eleNames.eq(index).attr("title"));
				});
				if (flagsSa) {
					//如果来自编辑，则要去掉本组名称
					groupNames.splice(globeIndex, 1);
				}
				for (var i in groupNames) {
					if (groupNames.hasOwnProperty(i) && groupName === groupNames[i]) {
						notify.error("已经存在相同监巡名称，请修改后重试！");
						return;
					}
				}
				if (newCameras.length > layout) {
					notify.warn("选择摄像头不能大于当前分屏数目");
					return;
				}
				for (var j = 0; j < newCameras.length; j++) {
					if (newCameras[j].cameraId) {
						cameraId.push(newCameras[j].cameraId);
					} else {
						cameraId.push(newCameras[j].id);
					}
					hasVideo = true;
				}
				// 构造后端需要的数据格式
				if (hasVideo) {
					for (var h = 0; h < cameraId.length; h++) {
						if (cameraId[h] !== -1) {
							self.cameras.cameras.push({
								"cameraId": cameraId[h],
								"position": h
							});
						}
					}
				} else {
					notify.warn("请选择摄像头后再添加监巡分组！");
					return false;
				}
				// 是否有重复摄像头
				if (self.isRepeat(cameraId)) {
					notify.info("摄像头有重复，请修正后再添加！");
					return false;
				}
				//监巡开启状态中
				if (jQuery(".loop-header").is(":visible")) {
					notify.info("此监巡分组正在播放，请先停止当前监巡！");
					return false;
				}
				//触发保存
				internalPubSub.publish("NewAddInspect", jQuery(this));
			});
			/**
			 * 点击新建时间确定按钮 和点击新增时段按钮的切换 add by wujingwen
			 */
			$sideBar.on("click", ".firmbtn", function() {
				var $beginTime = jQuery(".newTimeOb .begintime"),
					$endTime = jQuery(".newTimeOb .endtime"),
					starH = $beginTime.find(">.text1").val(),
					starM = $beginTime.find(">.text2").val(),
					startTime = starH + ":" + starM,
					endH = $endTime.find(">.text1").val(),
					endM = $endTime.find(">.text2").val(),
					endTime = endH + ":" + endM;
				if(startTime >= endTime) {
					notify.warn("启动时间不能大于等于结束时间！");
					return;
				}
				var timeInfor = {
					startTime: startTime,
					endTime: endTime
				};
				var timeList = [],
					li = jQuery(".group .itemwrapper li.timeBlock");
				if(editorFlg !== null) {
					li.splice(editorFlg, 1);
				}
				//遍历时间节点
				for(var i=0,len = li.length;i<len;i++) {
					var star = li.eq(i).find(".star").text(),
						end = li.eq(i).find(".end").text(),
						timeIn = {
							startTime: star,
							endTime: end
						};
					timeList.push(timeIn);
				}
				//判断事件重叠
				if(!self.checkTimeSlot(timeList, timeInfor)) {
					return;
				}
				jQuery(".newTimeOb").hide();
				jQuery(".newTime").show();
				if(editorFlg !== null){
					editorFlg = null;
				}
				if(selectEle) {
					selectEle.parent().parent().remove();
					selectEle = null;
				}
				//创建时间片段
				internalPubSub.publish("createGroup", timeInfor);
			});
            /**
             * 新建时间段时点击取消
             */
			$sideBar.on("click", ".cancelbtn", function() {
				jQuery(".newTimeOb").hide();
				jQuery(".newTime").show();
				if(selectEle){
					selectEle.parent().parent().css("display","block");
					selectEle = null;
				}
			});
            /**
             * 点击添加时段按钮
             */
			$sideBar.on("click", ".newTime", function() {
                var hour = (new Date()).getHours(),
                    minutes = (new Date()).getMinutes(),
                    $beginTime = jQuery(".begintime"),
                    $endTime = jQuery(".endtime");
                hour = hour < 10 ? "0" + hour : hour;
                var endHour = parseInt(hour) + 1 < 10 ? "0" + parseInt(hour) + 1 : parseInt(hour) + 1;
                minutes = minutes < 10 ? "0" + minutes : minutes;
                $beginTime.find(">.text1").val(hour);
                $beginTime.find(">.text2").val(minutes);
                $endTime.find(">.text1").val(endHour);
                $endTime.find(">.text2").val(minutes);
                //显示时间段添加面板，隐藏添加时间段按钮
                jQuery(".newTimeOb").show();
                jQuery(".newTime").hide();
            });
			//点击删除时间段按钮
			$sideBar.on("click", "ul.itemwrapper  .icon-del", function() {
				jQuery(this).closest(".timeBlock").slideUp(function () {
					jQuery(this).remove();
				});
			});
			//点击新建中时间的编辑按钮
			$sideBar.on("click", "ul.itemwrapper  .ico-editer", function() {
				var $this =jQuery(this),
					$beginTime = jQuery(".begintime"),
					$endTime = jQuery(".endtime"),
					startTime = $this.parent().find(".star").text(),
					endTime = $this.parent().find(".end").text();
				editorFlg = $this.parent().parent().index();
				selectEle = $this;
				$this.parent().parent().css("display", "none");
				$beginTime.find(">.text1").val(startTime.substring(0, 2));
				$beginTime.find(">.text2").val(startTime.substring(3));
				$endTime.find(">.text1").val(endTime.substring(0, 2));
				$endTime.find(">.text2").val(endTime.substring(3));
				jQuery(".newTimeOb").show();
			});
			//点击编辑监巡分组按钮
			$sideBar.on("click", ".groups .item-header a .ico-editer", function(e){
				e.preventDefault();
				e.stopPropagation();
				if (jQuery(".loop-header").is(":visible")) {//监巡开启状态中
					notify.info("监巡进行中，请先停止！");
					return false;
				}
				flagsIn = true;
				globeEle = this;
				globeIndex = jQuery(this).closest(".group-item").index();
				$sideBar.find('[data-tabor="monitor-inspect"] .init-create .creater').trigger("click");
			});
			//删除单个摄像机/上下移动add by wu jingwen on 2015.10.09
			$sideBody.find('> [data-tabor="inspect-create"] .cameraslist').off("click")
			.on("click", ".remove-ipc", function() {
				var po = 0;
				var $li = jQuery(this).closest("li.leaf");
				var index = $li.index();
				$li.slideUp(function() {
					$li.remove();
				});
				self.cameraList.splice(index,1);

				self.player.stopAll();
				var layout = self.player.getLayout();
				while (layout--) {
					self.player.refreshWindow(layout);
				}
				for(var i = 0;i<self.cameraList.length;i++){
					self.cameraList[i].position = po++;
				}
				internalPubSub.publish("playCamerasAll");
			}).on("click", ".move-up", function() {
					var po = 0;
					var $li = jQuery(this).closest("li.leaf");
					var index = $li.index();
					if (index !== 0) {
						$li.parent()[0].insertBefore($li[0], $li.prev()[0]);
						self.cameraList.splice(index - 1, 0, self.cameraList[index]);
						self.cameraList.splice(index + 1, 1);
						var layout = self.player.getLayout();
						while (layout--) {
							self.player.refreshWindow(layout);
						}
						for (var i = 0; i < self.cameraList.length; i++) {
							self.cameraList[i].position = po++;
						}
						internalPubSub.publish("playCamerasAll");
					}
				})
			.on("click", ".move-down", function() {
					var po = 0;
					var $li = jQuery(this).closest("li.leaf");
					var index = $li.index();
					if ($li.nextAll().length !== 0) {
						$li.parent()[0].insertBefore($li.next()[0], $li[0]);
						self.cameraList.splice(index, 0, self.cameraList[index + 1]);
						self.cameraList.splice(index + 2, 1);
						var layout = self.player.getLayout();
						while (layout--) {
							self.player.refreshWindow(layout);
						}
						for (var i = 0; i < self.cameraList.length; i++) {
							self.cameraList[i].position = po++;
						}
						internalPubSub.publish("playCamerasAll");
					}
				});

			/*修正键盘输入*/
			$sideBar.on("blur", ".newTimeOb .text1", function(){
				var values = jQuery(this).val();
				if(jQuery(this).parent().hasClass("begintime")){
					jQuery(".newTimeOb .begintime>.text1").val(values);
				}else{
					jQuery(".newTimeOb .endtime>.text1").val(values);
				}

			});
			$sideBar.on("blur", ".newTimeOb .text2", function(){
				var values = jQuery(this).val();
				if(jQuery(this).parent().hasClass("begintime")){
					jQuery(".newTimeOb .begintime>.text2").val(values);
				}else{
					jQuery(".newTimeOb .endtime>.text2").val(values);
				}
			});
			/*时间滚轮事件*/
			$sideBar.on("mousewheel", ".newTimeOb .text1", function(e,dir) {
				var values = jQuery(this).val(),
					firstValue = values.charAt(0);
				values = firstValue === 0 ? values.charAt(1) : values;
				if (dir > 0 && (++values < 25)) {
					values = values < 10 ? "0" + parseInt(values) : parseInt(values);
				}
				else if (dir < 0 && (--values > -1)) {
					values = values < 10 ? "0" + parseInt(values) : parseInt(values);
				}
				if (values < 0 || values > 24) {
					return;
				}
				if (jQuery(this).parent().hasClass("begintime")) {
					jQuery(".newTimeOb .begintime>.text1").val(values);
				} else {
					jQuery(".newTimeOb .endtime>.text1").val(values);
				}

			}).on("mousewheel", ".newTimeOb .text2", function(e,dir) {
				var values = jQuery(this).val(),
					firstValue = values.charAt(0);
				values = firstValue === 0 ? values.charAt(1) : values;
				if (dir > 0 && (++values < 60)) {
					values = values < 10 ? "0" + parseInt(values) : parseInt(values);
				}
				else if (dir < 0 && (--values > -1)) {
					values = values < 10 ? "0" + parseInt(values) : parseInt(values);
				}
				if (values < 0 || values > 59) {
					return;
				}
				if (jQuery(this).parent().hasClass("endtime")) {
					jQuery(".newTimeOb .endtime>.text2").val(values);
				} else {
					jQuery(".newTimeOb .begintime>.text2").val(values);
				}
			});
			/*停留时间 上下按钮*/
			$sideBar.find(".inputRe .inu").mousedown(function() {
				var $this = jQuery(this);
				$this.addClass("inupf").removeClass("inup");
				var values = $this.parent().find(".addstopTime").val();
				if (++values > 9) {
					$this.parent().find(".addstopTime").val(values);
				}
			});
			$sideBar.find(".inputRe .inu").mouseup(function(){
				jQuery(this).addClass("inup").removeClass("inupf");
			});
			$sideBar.find(".inputRe .ind").mousedown(function() {
				var $this = jQuery(this);
				$this.addClass("indownf").removeClass("indown");
				var values = $this.parent().find(".addstopTime").val();
				if (--values > 9) {
					$this.parent().find(".addstopTime").val(values);
				}
			});
			$sideBar.find(".inputRe .ind").mouseup(function(){
				jQuery(this).addClass("indown").removeClass("indownf");
			});
			/*停留时间滚轮*/
			$sideBar.on("mousewheel", ".inputRe .addstopTime ", function(e,dir) {
				var values = jQuery(this).val();
				if (dir > 0 && (++values > 9)) {
					jQuery(this).val(values);
				} else if (dir < 0 && (--values > 9)) {
					jQuery(this).val(values);
				}
			});
			/**
			 * 启动监巡分组，点击“启动”按钮
			 */
			$sideBar.on("click", "[data-tabor='monitor-inspect'] .grade .operation #start", function(e) {
				e.preventDefault();
				e.stopPropagation();
				//添加提示
				if(!self.alreadyInfoed){
					notify.info("监巡过程中请不要离开此页面,否则监巡停止！");
					//监巡过程中不能拖动窗口
					self.player.enableExchangeWindow(false);
				}
				self.alreadyInfoed = true;
				//启动监巡
				internalPubSub.publish("startOrPauseInspect", jQuery(this));
			});
			/**
			 * 停止监巡分组   点击“停止”按钮
			 */
			$sideBar.on("click", "[data-tabor='monitor-inspect'] .grade .operation .stop", function(e) {
				e.preventDefault();
				e.stopPropagation();
				var $this = jQuery(this);
				jQuery("[data-tabor='monitor-inspect'] .init-create input.creater").css("display","inline");
				internalPubSub.publish("stopInspect", $this);
				self.stopInspectUI($this);
				//监巡结束后能拖动窗口
				self.player.enableExchangeWindow(true);
				self.alreadyInfoed = false;
				notify.info("监巡结束");
			});
			//时间设置中起止时间 点击清除time-error类
			$sideBar.on("click", 'input[name="startTime"],input[name="endTime"]', function() {
				jQuery(this).removeClass("time-error");
			});
			// 添加监巡，时间选择控件
			jQuery("#addstartTime, #addendTime").datetimepicker2({
				step: 5,
				format: "H:i:s",
				datepicker: false,
				className: "datepicker-plugin",
				inline: true,
				onSelectTime: function(currentTime, input) {
					var startTime = jQuery("#addstartTime").val(),
						endTime = jQuery("#addendTime").val();
					if (startTime && endTime && startTime > endTime) {
						notify.warn("启动时间不能大于结束时间！");
						input.val("");
						return false;
					}
				}
			});
		},
		//判断时间段重叠，add by zhangyu,2014-11-5  //从controller拿过来的,做简单修改
		checkTimeSlot: function(timeList, timeInfo) {
			for (var i = 0; i < timeList.length; i++) {
				if (timeInfo.startTime >= timeList[i].startTime && timeInfo.startTime <= timeList[i].endTime) {
					notify.warn("启动时间不能和已有时间段重叠！");
					return false;
				}
				if (timeInfo.endTime >= timeList[i].startTime && timeInfo.endTime <= timeList[i].endTime) {
					notify.warn("结束时间不能和已有时间段重叠！");
					return false;
				}
				if (timeInfo.startTime <= timeList[i].startTime && timeInfo.endTime >= timeList[i].endTime) {
					notify.warn("该时间段包含已有时间段，请重新设置！");
					return false;
				}
			}
			return true;
		},
		/*从controller拿过来的判断是否重复*/
		isRepeat: function(array) {
			if (Object.prototype.toString.call(array) !== "[object Array]") {
				notify.warn("此函数参数只接受数组！");
				return;
			}
			var isRepeatFlag = false;

			array.sort(function(a, b) {
				if (a === b && a !== -1) {
					isRepeatFlag = true;
				}
				return a - b;
			});

			return isRepeatFlag;
		},
		/**
		 * 点击编辑之后的初始化渲染操作
		 * @param node - 当前编辑的dom元素
		 */
		editorFn: function(node) {
			var self = this,
				$curNode = jQuery(node),
				$itemBodys = $curNode.parents(".group-item").find(".item-body"),
				$sideBar = jQuery("#sidebar-body");
			self.cameraList = [];
			self.globId = $curNode.data("id");
			//初始化页面样式
			jQuery('[data-tabor="inspect-create"] .titie-text').html("编辑监巡分组");
			jQuery(".newTimeOb").hide();
			jQuery(".newTime").show();
			//初始化当前监巡分组的信息
			var name = $curNode.parents(".group-item").find(".name").text(),
				time = $curNode.parents(".group-item").find(".stopTime").text();
			jQuery(".addgroupName").val(name);
			jQuery(".addstopTime").val(time);
			//初始化时间段列表
			for (var i = 0; i < $itemBodys.length; i++) {
				var htmls = $itemBodys[i].innerHTML;
				jQuery(".itemwrapper").append('<li class="timeBlock"><div class="item-body">' + htmls + '</div></li>');
			}
			jQuery(".itemwrapper li i").css("display","inline-block");
			//渲染监巡分组下的摄像机列表
			jQuery.when(Module.getGroup(self.globId), self.loadTempl("inc/group_add_came_tpl.html")).done(function (res, tpl) {
			    var	layout = res.data.watch.layout;
				//编辑时的播放摄像机。
				internalPubSub.publish("editorInspect", {
					"layout": layout,
					"cameras": res.data.watch.cameras
				});
				//初始化布局
				jQuery(".layoutNum i").each(function(){
					if(jQuery(this).data("layout") === layout){
						jQuery(this).addClass("layoutFlags").siblings().removeClass("layoutFlags");
					}
				});
				//渲染摄像机列表
				self.cameraList = self.sortPosition(res.data.watch.cameras);
				for (var i in self.cameraList) {
					if (self.cameraList.hasOwnProperty(i)) {
						self.cameraList[i].name = self.cameraList[i].cameraName;
						self.cameraList[i].cameratype = self.cameraList[i].cameraType;
					}
				}
				var $cameraListC = $sideBar.find('> [data-tabor="inspect-create"] .cameraslist>ul'),
					$lis = $cameraListC.find("li"),
					obj = {
						"cameraList": self.cameraList
					};
				$cameraListC.append(Handlebars.compile(tpl[0])(obj));
				$lis.each(function () {
					if (jQuery(this).attr("data-camera-type") === 1) {
						jQuery(this).find(".camera-style").addClass("dom dom-marked");
					}
				});
				var height = jQuery(document).height();
				$sideBar.find('> [data-tabor="inspect-create"] .cameraslist>ul').css("height", (height - 370) + "px");
			});
		},
		/*按照self.cameraList.position的顺序，重新排序cameraList add by wujingwen*/
		sortPosition:function(a) {
			var b = [], c = [], d = [], g = [];
			for (var i = 0; i < a.length; i++) {
				var s = a[i].position;
				b.push(s);
				g.push(a[i].id);
			}
			b.sort(function (e, f) {
				return e - f;
			});
			for (i = 0; i < b.length; i++) {
				for (var j = 0; j < a.length; j++) {
					if (b[i] === a[j].position) {
						c.push(j);
					}
				}
			}
			for (i = 0; i < c.length; i++) {
				d.push(a[c[i]]);
			}
			Array.min = function (array) {
				return Math.min.apply(Math, array);
			};
			var minId = Array.min(g);
			for (i = 0; i < d.length; i++) {
				d[i].id = minId++;
			}
			return d;
		},
		/**
		 * 启动监巡后，隐藏视频播放器上方工具栏的按钮
		 */
		hideRightUpBtn: function () {
			var menu = jQuery("#npplay").find(">.header>.menu");
			menu.find(".sendto").closest(".item").hide();
			menu.find(".split").closest(".item").hide();
			menu.find(".close").closest(".item").hide();
			menu.find(".inspect").closest(".item").hide();
		},
		/**
		 * 停止监巡后，显示视频播放器上方工具栏的按钮
		 */
		showRightUpBtn:function () {
			var menu = jQuery("#npplay").find(">.header>.menu");
			menu.find(".inspect").closest(".item").show();
			menu.find(".sendto").closest(".item").show();
			menu.find(".split").closest(".item").show();
			menu.find(".close").closest(".item").show();
		},
		/**
		 * 停止监巡后，更新页面UI状态
		 * @param node -当前触发按钮的DOM对象
		 */
		stopInspectUI: function(node) {
			var $monitorInspect = jQuery("[data-tabor='monitor-inspect']"),
				$sidebarHead = jQuery("#sidebar-head");
			//隐藏停止按钮
			node.hide();
			//页面右上角的添加新的监巡分组的按钮
			jQuery(".ui.atached.menu .inspect").show();
			//更新按钮样式
			$monitorInspect.find(".grade .operation .pause").removeClass("pause").addClass("start").attr("title", "启动");
			$sidebarHead.find(">.menus").show();
			$sidebarHead.find(" >.loop-header").hide();
			$monitorInspect.find(".group-content").removeClass("run-inspect");
		},
		/**
		 * 初始化面板
		 */
		initPanel: function() {
			var self = this;
			self.container.addClass("loading");
			internalPubSub.publish("initGroupsView");
		},
		/**
		 * 获取模板
		 * @param url 模板URL
		 * @returns {*} 模板字符串
		 */
		loadTempl: function(url) {
			this.templCache = this.templCache || {};
			//debugger
			if (_.has(this.templCache, url)) {
				return this.templCache[url];
			}
			var self = this;
			return jQuery.get(url, function(templ) {
				self.templCache[url] = new Array(templ);
			});
		},
		/**
		 * 渲染监巡分组数据
		 * @param data - 带渲染的数据
		 */
		renderAllGroup: function(data) {
			var self = this;
			//谨记：html()函数是有返回值的
			self.container.removeClass("loading").html(Handlebars.compile(gTpl)(data));
			jQuery("#start").val("启动").removeClass("red");
		},
		/**
		 * 生成监巡段 add by wujingwen on 2015.09.21
		 * @param data - 时间段数据
		 */
		renderCreatGroup: function(data){
			var fragment = jQuery(Handlebars.compile(gTimeTpl)(data));
			this.creatContainer.append(fragment);
		},
		/**
		 * 删除监巡分组后的回调
		 * @param node - 删除事件dom对象
		 */
		deleteGroupCallBack: function(node) {
			//收起当前删除的分组
			node.closest(".group-item").slideUp(function(){
				jQuery(this).remove();
			});
			//更新总数
			var $groupCount = jQuery(".monitor-group-count"),
				curCount = parseInt($groupCount.text());
			$groupCount.text(curCount - 1);
		},
		/**
		 * 视频窗口上方添加完毕后的页面刷新回调
		 */
		addNewGroupCallBack: function() {
			var self = this;
			jQuery("#npplay").find(".function-container").removeClass("active");
			jQuery(".body").find("#layout").hide();
			jQuery("#addinspectsubmitbtn")[0].reset();
			self.initPanel();
		},
		/**
		 * 左侧面板添加完毕后的页面刷新回调
		 */
		addGroupCallBack:function() {
			var self = this;
			internalPubSub.publish("initGroupsNew");
			self.globId = null;
			globeIndex = null;
			flagsSa = false;
			window.playDelFla = false;
		},
		switchInspect:function(enable){
			var node = jQuery('[data-tabor="monitor-inspect"]').find("#start"),
				titleNode = jQuery("#sidebar-head").find(">.loop-header > .loop-title");
			if(enable){
				node.removeClass("start").addClass("pause").attr("title", "暂停");
				titleNode.html("正在监巡...");
			}else{
				titleNode.html("暂停中...");
				node.removeClass("pause").addClass("start").attr("title", "开启");
			}

		},
		/**
		 * 渲染已选择的摄像机list add by wujingwen on 2015.10.10
		 * @param cameraList - 待渲染的摄像机list
		 */
		showChoosedCameras: function(cameraList) {
			var self = this,
				po = 0,
				i = 0,
				postionMin = 0,
				len = self.cameraList.length;
			if (len) {
				postionMin = len - 1;
				for (i = 0, len = cameraList.length; i < len; i++) {
					cameraList[i].cameraId = cameraList[i].id;
					cameraList[i].position = ++postionMin;
				}
			} else {
				postionMin = -1;
				for (i = 0, len = cameraList.length; i < len; i++) {
					cameraList[i].cameraId = cameraList[i].id;
					cameraList[i].position = ++postionMin;
				}
			}
			jQuery('#sidebar-body').find('> [data-tabor="inspect-create"] .cameraslist ul').html("");
			chooseCameras.loadTempl(cameraList);
			self.cameraList = cameraList;
			self.player.stopAll();
			var layout = self.player.getLayout();
			while (layout--) {
				self.player.refreshWindow(layout);
			}
			for (i = 0; i < len; i++) {
				self.cameraList[i].position = po++;
			}
			//触发播放
			internalPubSub.publish("playCamerasAll");
		}
	};
	return  View;
});
