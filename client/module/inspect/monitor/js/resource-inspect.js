/**
 * 树上的资源轮巡
 */
define([
	"jquery",
	"underscore",
	"handlebars",
	"jquery.watch",
	"/module/inspect/monitor/js/inspect.js",
	"pubsub",
	"/module/common/tree/tree-watch-name.js"
],function(jQuery, _, Handlebars, jWatch, Inspect, PubSub, TreeWatchName) {

	var player;

	var resoruce_inspect = function (play) {
		var self = this;
		player = play;
		self.bindEvent();
	};
	resoruce_inspect.prototype = {
		URLS: {
			INSPECT_TPL: "/module/common/tree/inspect.template.html"
		},
		/**
		 * 事件绑定
		 */
		bindEvent: function () {
			var self = this;
			//触发轮训弹出框
			jQuery(document).on("click", ".tree-outtest-container .node .group .circle-inspect", function (e) {
				e.preventDefault();
				e.stopPropagation();
				var node = jQuery(this).closest(".node");
				if (self.loopNum == 1) {
					notify.warn("已存在其他轮巡，请关闭后重试");
					return;
				}
				//将将要轮巡的分组id存储起来
				self.targetId = node.data("id");
				//将将要轮巡的分组存储起来
				self.targetNode = node;
				//由于蚌埠特殊需求要将.group存起来，不需要关注
				self.inspectNode = jQuery(this).closest(".group");
				var inspectName = node.attr("data-name");
				//将选择的面板存储起来（因为我的分组和视频资源获取分组下的摄像机接口不同）
				self.resourceType = jQuery("#sidebar-body").find("div[data-tabor='video-res']").hasClass("active") ? "video-res" : "my-group";
				//请求并渲染模板
				jQuery.get(self.URLS.INSPECT_TPL).then(function (tpl) {
					jQuery(".download-record").remove();
					jQuery("body").append(tpl);
					//电视墙轮巡初始化
					require(["../../common/tvwall-view/js/tvwall-view.js"], function (tvW) {
						var layout = player.getLayout(),
							freeWindow = player.getFreeWindows(),
							totalWindow = [];
						for (var i = 0; i < layout; i++) {
							totalWindow.push(i);
						}
						self.occupyWindow = _.difference(totalWindow, freeWindow);
						var config = {
							addDom: jQuery(".dialog-body-tcontent"),
							screenNum: layout,
							freeWindow: freeWindow,
							occupyWindow: self.occupyWindow,
							screenTitle: "轮巡窗口选择",
							inspectName:inspectName
						};

						window.tvW = new tvW(config);
						window.tvW.init();
					});
				});
			});
			//点击轮巡按钮
			jQuery(document).on("click", ".dialog-history  .tree-inspect", function (e) {
				e.preventDefault();
				e.stopPropagation();
				var intervalTime = jQuery(".dialog-history .inspect-interval-time").val().trim();
				if (!self.checkIntervalTime(intervalTime)) {
					return;
				}
				var wcount = jQuery("#wcount").val();
				jQuery(".split-panel i").trigger("click", {num: wcount});
				var targetWindow = self.targetWindow = window.tvW.tvArr();
				jQuery(".dialog-history .cancel-inspect").trigger("click");
				var inspectName = jQuery(this).closest('.dialog-history').attr("data-name");
				self.getCameras(self.targetId, self.resourceType, function (cameras) {
					if (cameras.length === 0) {
						(!self.targetNode.hasClass("active")) && self.targetNode.find(".group").trigger("click");
						return notify.warn("该分组下没有摄像机无法轮巡!");
					} else {
						/*开始add by wujingwen on2015.10.24 如果没有选择窗口则直接退出*/
						if (targetWindow.length === 0) {
							notify.warn("当前未选择可用窗口，无法进行轮巡操作!");
							return;
						}
						var targetCameras = self.handleCamera(cameras);
					//	var targetCameras = cameras;
						if (targetCameras.length === 0) {
							notify.warn("没有在线的摄像机，无法进行轮巡操作!");
							return;
						}
						/*结束*/
						notify.info("轮巡进行中请不要离开此页面,否则轮巡停止!");
						self.targetNode.addClass("tree-inspecting-node");
						if (!self.targetNode.hasClass("active")) {
							self.inspectNode.trigger("click");
							self.targetNode.siblings().removeClass("active");
						}
						self.targetNode.children(".group").after("<div class='inspecting'>正在轮巡...</div>");
						self.removeMask();
						var inspectData = {
							"cameras": targetCameras,
							"interval": parseInt(intervalTime, 10),
							"startTime": "00:00:00",
							"endTime": "23:59:59",
							//"layout": wcount, //add bywujingwen on2015.09.11
							"layout": targetWindow.length,
							"freeWindow": targetWindow,
							"occupyWindow": self.occupyWindow,
							"loopType": 0,
							"inspectName":inspectName
						};
						//若我的分组下的摄像机没有加载，则第一次轮巡时延迟2秒在开始轮巡
						var isAlreadyLoaded = false;
						if (self.targetNode.find("ul").length > 0) {
							isAlreadyLoaded = true;
						}
						window.loop_inspect_obj = {
							resourceType: self.resourceType,
							loopNum: 1,
							targetWindow: targetWindow
						};
						self.startInspect(inspectData, isAlreadyLoaded);
						//轮巡时不能拖动窗口
						player.enableExchangeWindow(false);
						//记录当前总有几个轮巡
						self.loopNum = 1;
						TreeWatchName.resetWidth();
						self.hideRightUpBtn();
					}
				});
			});
			//点击cancel按钮
			jQuery(document).on("click", ".dialog-history .cancel-inspect", function (e) {
				e.preventDefault();
				e.stopPropagation();
				jQuery(".download-record").remove();
				jQuery(".dialog-history").remove();

			});
			//关闭轮巡
			jQuery(document).on("click", ".tree-inspecting-node .stop-inspect", function (e) {
				e.preventDefault();
				e.stopPropagation();
				//将轮巡个数重新置为0
				self.loopNum = 0;
				window.loop_inspect_obj = null;
				self.stopInspectUI(self.targetNode);
				self.inspect.stop();
				self.inspect = null;
				window.inspect = null;
				ControlBar.updataInspect(null);
				//设置轮巡结束后窗口可以拖动
				player.enableExchangeWindow(true);
				for (var i = 0; i < self.targetWindow.length; i++) {
					//遍历每一个轮巡窗口，若该轮巡窗口的历史录像面板是打开的，则关闭轮巡时顺便关闭面板，若不属于轮巡窗口，则关闭轮巡时不关闭面板
					if (window.SelectCamera.ListData[self.targetWindow[i - 0]] && window.SelectCamera.ListData[self.targetWindow[i - 0]].vodHistory) {
						var N = window.SelectCamera.ListData[self.targetWindow[i - 0]].vodHistory.dialogId;
						player.playerObj.CloseWebDialog(N);
						delete window.SelectCamera.ListData[self.targetWindow[i - 0]].vodHistory;
					}
				}
				//设置轮巡结束后切流出现转圈
				for (var j = 0; j < 16; j++) {
					player.EnableLoadingGif(true, j);
				}
			});
			//注册滚动条事件
			jQuery("#sidebar-body").find(".tree-panel").scroll(function (e) {
				var srollTop = jQuery(this).scrollTop();
				jQuery(".down-inspect-mask").css("top", self.oldTop - srollTop);
			});

		},
		/**
		 * 动态计算宽度
		 * @param node
		 */
		resetWidth: function (node) {
			var groupNode = node.children(".group");
			var groupWidth = groupNode.width();
			var foldWidth = groupNode.children(".fold").outerWidth(true);
			var btnSize = groupNode.find(".group-operator:visible").size();
			var btnWidth = groupNode.find(".group-operator").eq(0).outerWidth(true);
			var btnsWidth = btnWidth * btnSize;
			groupNode.find(".text-over").width(groupWidth - foldWidth - btnsWidth);
		},
		/**
		 * 隐藏右上角按钮
		 */
		hideRightUpBtn: function () {
			var menu = jQuery("#npplay").find(".header .menu");
			menu.find(".sendto").closest(".item").hide();
			menu.find(".split").closest(".item").hide();
			menu.find(".close").closest(".item").hide();
		},
		/**
		 * 显示右上角按钮
		 */
		showRightUpBtn: function () {
			var menu = jQuery("#npplay").find(".header .menu");
			menu.find(".sendto").closest(".item").show();
			menu.find(".split").closest(".item").show();
			menu.find(".close").closest(".item").show();
		},
		_ajax: function (url, type, data, fn) {
			return jQuery.ajax({
				url: url,
				data: data,
				cache: false,
				type: type || "GET",
				async: true,
				success: function (res) {
					fn(res);
				},
				error: function () {
					notify.warn("没有满足要求的数据");
				}
			});
		},
		checkIntervalTime: function (time) {
			if (!(/^\+?[1-9][0-9]*[s秒]?$/.test(time))) {
				if (parseInt(time, 10) === 0 || time === "" || time === "单位:秒") {
					notify.error("请填写有效的间隔时间！");
				} else {
					notify.error("间隔时间必须为正整数！");
				}
				return false;
			}
			if (parseInt(time, 10) < 10) {
				notify.error("时间间隔不能小于10秒！");
				return false;
			}
			return true;
		},
		/**
		 * 获取摄像机信息
		 * @param id - 摄像机id
		 * @param type - 类型
		 * @param callback - 回调函数
		 */
		getCameras: function (id, type, callback) {
			var vtype;
			if (type == "video-res") {
				vtype = "org";
			} else if (type == "my-group") {
				vtype = "customize";
			}
			//这个接口/service/video_access_copy/recursion_list_camera,传入两个参数@groups@type返回组织下的所有摄像机，但当组织层级较多时返回耗费时间特长
			jQuery.get("/service/video_access_copy/recursion_list_camera", {   //service/video_access_copy/recursion_list_camera_id该接口传入两个参数@group@type返回组织下所有摄像机的id组成的数组
				groups: id,
				type: vtype
			}, function (res) {
				if (res && res.code === 200) {
					if (typeof callback === "function") {
						callback(res.data.cameras);
					//	callback(res.data.ids);
					}
				} else {
					notify.warn(res.data.message);
				}
			});
		},
		/**
		 * 添加遮挡层
		 * @param top
		 * @param heighter
		 * @param type
		 */
		addMask: function (top, heighter, type) {
			var self = this;
			var up = "<div class='up-inspect-mask inspect-mask'></div>";//上部遮挡层
			var down = "<div class='down-inspect-mask inspect-mask'></div>";//下部遮挡层
			var headHight = 96;//头部高度（页面最上面的3层 黑蓝白）
			var inspectItemHight = 45;
			var secondHeadHight = 36;//视频资源  监巡分组  标记管理  一排容器的高度
			var thirdHeadHight = 94;//全局搜索的高度和tab切换页的高度
			var HeadHight = 44;//全局搜索的高度
			jQuery("#sidebar").append(up);
			jQuery(".up-inspect-mask").height(secondHeadHight + HeadHight);
			/*if(type == "my-group"){
			 jQuery(".down-inspect-mask").css("top",top-headHight+inspectItemHight+86);
			 jQuery(".down-inspect-mask").css("height",heighter-inspectItemHight);
			 }
			 if(type == "video-res"){
			 jQuery(".down-inspect-mask").css("top",top-headHight+inspectItemHight+86);
			 jQuery(".down-inspect-mask").css("height",heighter-inspectItemHight);
			 jQuery(".down-inspect-mask").css("width","93%");
			 //获取元素的最近定位的父元素顶端距离
			 self.oldTop=jQuery(".down-inspect-mask").position().top;
			 }*/
			//此处代码请不要删除
		},
		removeMask: function () {
			jQuery("#sidebar").find(".inspect-mask").remove();
		},
		handleCamera: function (cameras) {
			var result = [];
			for (var i = 0; i < cameras.length; i++) {
				var camera = cameras[i];
				//摄像机不在线时不参与轮巡
				if (camera.camera_status !== 1) {
					 var userscoreFlagArray = permission.stopFaultRightById([camera.id]);
					 //用户比分小于摄像机比分时不参与轮巡
					if (userscoreFlagArray[0]) {
						var tem = {
							"cType": camera.camera_type,
							"cId": camera.id,
							"cName": camera.name,
							"cCode": camera.cameracode,
							"cStatus": camera.camera_status,
							"camerascore": camera.score,
							"hdChannel": camera.hd_channel,
							"sdChannel": camera.sd_channel
						};
						result.push(tem);
					}

				}
			}
			return Array.clone(result);
		},
		/**
		 * 停止轮巡
		 * @param node - 轮巡提示dom节点
		 */
		stopInspectUI: function (node) {
			var self = this;
			node.removeClass("tree-inspecting-node similar-hover");
			node.find(".inspecting").remove();
			self.removeMask();
			self.showRightUpBtn();
			notify.info("轮巡结束");
			var inspectName  = node.attr("data-name");
			logDict.insertMedialog("m1", "轮巡" + inspectName + "分组结束");
		},
		/**
		 * 开启轮巡
		 * @param inspectData - 数据
		 * @param isAlreadyLoaded - 是否已经加载
		 */
		startInspect: function (inspectData, isAlreadyLoaded) {
			var self = this;
			window.inspect = self.inspect = new Inspect({
				"player": player,
				"events": {
					// "after":function(){notify.warn("目前不存在满足当前时间的摄像头，请稍后")},//第一次启动时，已经在监巡组的最后时间之后
					"autoExit": function () {
						var node = jQuery(".tree-inspecting-node .stop-inspect").closest(".node");
						self.stopInspectUI(node);
					},//到时间后，自动退出时
					// "before":function(){notify.warn("目前不存在满足当前时间的摄像头，请稍后");},//第一次启动时，已经在监巡组的最早时间之前
					"inspecting": function (data) {
					}//每次进入到下一次的监巡时的事件。data是将要轮巡的摄像机数据
				}
			});
			logDict.insertMedialog("m1", "轮巡" + inspectData.inspectName + "分组开始!");
			if (!isAlreadyLoaded) {
				window.setTimeout(function () {
					self.addMask(self.targetNode.offset().top, self.targetNode.height(), self.resourceType);
					self.inspect.start(inspectData);
					//轮巡日志
					logDict.insertMedialog("m1", "正在轮巡我的分组中名为" + self.targetNode.data("name") + "的摄像机");
				}, 800);
			} else {
				self.addMask(self.targetNode.offset().top, self.targetNode.height(), self.resourceType);
				self.inspect.start(inspectData);
				//轮巡日志
				logDict.insertMedialog("m1", "正在轮巡我的分组中名为" + self.targetNode.data("name") + "的摄像机");
			}
			window.ControlBar && window.ControlBar.setInspect(self.inspect);
		}
	};
	return resoruce_inspect;
});