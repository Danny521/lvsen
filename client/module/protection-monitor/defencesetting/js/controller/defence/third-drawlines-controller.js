/*global DrawEditor:true*/
/**
 * Created by Zhangyu on 2014/12/10.
 * 布防规则设置，划线相关逻辑控制器
 */
define([
	"/module/protection-monitor/defencesetting/js/controller/defence/third-arealist-controller.js",
	"/module/protection-monitor/defencesetting/js/view/defence/third-drawlines-view.js",
	"/module/protection-monitor/defencesetting/js/view/defence/third-protect-view.js",
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js",
	"/module/protection-monitor/defencesetting/js/global-var.js",
	"pubsub",
	"jquery",
	"DrawEditor"
], function(areaListController, view, protectView, DefenceTools, globalVar, PubSub, jQuery) {
	var Controller = function() {
		var self = this;
		//订阅事件-标定后的回填事件
		PubSub.unsubscribe(self.showFilterRectToken);
		self.showFilterRectToken = PubSub.subscribe("showFilterRect", function(msg, data) {
			self.showFilterRect(data.type, data.width, data.height);
		});
		//订阅事件-显示人脸布控区域
		PubSub.unsubscribe(self.showProtectRuleOnDrawToken);
		self.showProtectRuleOnDrawToken = PubSub.subscribe("showProtectRuleOnDraw", function() {
			self.showProtectRuleOnDraw();
		});
		//订阅事件-rectFilter绘制完成后处理逻辑
		PubSub.unsubscribe(self.fillRectFilterToken);
		self.fillRectFilterToken = PubSub.subscribe("fillRectFilter", function(msg, data) {
			self.fillRectFilter(data);
		});
		//清除按钮的点击后触发
		PubSub.unsubscribe(self.removeLinesToken);
		self.removeLinesToken = PubSub.subscribe("removeLines", function(msg, data) {
			self.removeLines(data.obj);
		});
	};

	Controller.prototype = {
		/**
		 * 初始化函数
		 */
		init: function() {
			var self = this;

			view.init(areaListController, self);
		},
		/**
		 * 显示框线
		 */
		initDraw: function() {

			var self = this,
				$TempSnapPicture = jQuery("#TempSnapPicture");
			var ruleInfo = globalVar.defence.ruleInfo;
			//初始化画图区域
			DrawEditor.init("TempSnapCover", $TempSnapPicture.width(), $TempSnapPicture.height());
			DrawEditor.strokewidth = 5;
			DrawEditor.fontsize = 14;
			//布防模式下，加载框线
			if (ruleInfo.isDefenceFlag) {
				//布防模式下，初始化画布，加载框线
				self.initDefenceLines();
			} else {
				//布控模式下，初始化画布，加载框线
				self.initProtectLines();
			}
		},
		/**
		 * 布防模式下，当已经存在区域时，需要将区域填充到画布上
		 */
		initDefenceLines: function() {
			var drawInfo = {},
				$TempSnapPicture = jQuery("#TempSnapPicture"),
				curAreaList = areaListController.getCurAreaList();
			//初始化已有的区域
			for (var i = 0, length = curAreaList.length; i < length; i++) {

				if (curAreaList[i].type === "SingleArrowline" || curAreaList[i].type === "DoubleArrowline") {
					//单线
					drawInfo = DefenceTools.ruleLineOpera.formateDisplayDataOnDraw(curAreaList[i], "line", {
						width: $TempSnapPicture.width(),
						height: $TempSnapPicture.height()
					});
					DrawEditor.add_Single_Arrowline(drawInfo);
				} else if (curAreaList[i].type === "Doubleline") {
					//双线
					drawInfo = DefenceTools.ruleLineOpera.formateDisplayDataOnDraw(curAreaList[i], "dline", {
						width: $TempSnapPicture.width(),
						height: $TempSnapPicture.height()
					});
					DrawEditor.add_Double_Arrowline(drawInfo);
				} else if (curAreaList[i].type === "rect") {
					//矩形
					drawInfo = DefenceTools.ruleLineOpera.formateDisplayDataOnDraw(curAreaList[i], "rect", {
						width: $TempSnapPicture.width(),
						height: $TempSnapPicture.height()
					});
					DrawEditor.add_rect(drawInfo);
				} else if (curAreaList[i].type === "polyline") {
					//多边形
					drawInfo = DefenceTools.ruleLineOpera.formateDisplayDataOnDraw(curAreaList[i], "poly", {
						width: $TempSnapPicture.width(),
						height: $TempSnapPicture.height()
					});
					DrawEditor.add_poly(drawInfo);
				}
			}
		},
		/**
		 * 布控模式下，当已经存在区域时，需要将区域填充到画布上
		 */
		initProtectLines: function() {
			var self = this;
			var ruleInfo = globalVar.defence.ruleInfo;
			if (ruleInfo.faceProtectInfo.containerObj && ruleInfo.faceProtectInfo.containerObj.is(":visible")) {
				//只要当前任务下侧设置、标定按钮均处于初始化状态时显示框线规则
				var $modifyArea = jQuery(".item-content.active .modify-rect"),
					ruleSet = $modifyArea.find("input[type='button']").val(),
					minFace = jQuery(".item-content.active .min-face input[type='button']").val(),
					maxFace = jQuery(".item-content.active .max-face input[type='button']").val();
				if (ruleSet === "设置" && minFace === "标定" && maxFace === "标定") {
					//显示当前任务对应的框线规则
					self.showProtectRuleOnDraw();
					//设置当前任务详情面板的dom状态
					$modifyArea.find("input[type='button']").val("确定");
					$modifyArea.find("input[type='checkbox']").trigger("click");
				}
			}
		},
		/**
		 * 显示最大物体矩形框、最小物体矩形框、车牌标示矩形框、最小人脸矩形框、最大人脸矩形框
		 * @param type - 显示的框线类型
		 * @param width - 宽度数据
		 * @param height - 高度数据
		 */
		showFilterRect: function(type, width, height) {
			//获取参数信息
			var text = "",
				domid = "";
			if (type === "rect_min") {
				text = "最小物体";
				domid = "rect_min";
			} else if (type === "rect_max") {
				text = "最大物体";
				domid = "rect_max";
			} else if (type === "rect_car") {
				text = "车牌大小";
				domid = "rect_car";
			} else if (type === "rect_min_face") {
				text = "最小人脸尺寸";
				domid = "rect_min_face";
			} else if (type === "rect_max_face") {
				text = "最大人脸尺寸";
				domid = "rect_max_face";
			}

			//转化成相对于当前显示分辨率下的宽度和高度
			var $TempSnapPicture = jQuery("#TempSnapPicture"),
				rectInfo = DefenceTools.ruleLineOpera.formateDisplayRataRect({
					width: width,
					height: height
				}, {
					width: $TempSnapPicture.width(),
					height: $TempSnapPicture.height()
				}, DefenceTools.getCameraRate());
			width = rectInfo.width;
			height = rectInfo.height;
			//绘图
			var drawInfo = DefenceTools.ruleLineOpera.formateDisplayDataOnDraw({
				width: width,
				height: height,
				text: text,
				domid: domid
			}, domid);
			DrawEditor.add_rect(drawInfo);
		},
		/**
		 * 标定后的最大、最小区域、车牌大小、人脸检测区域、人脸大小填充
		 * @param data - 绘图回传的数据
		 */
		fillRectFilter: function(data) {
			var ruleInfo = globalVar.defence.ruleInfo;
			if (!data.points || !(data.points instanceof Array) || data.points.length !== 4) {
				notify.error("标定区域参数有误！");
				return;
			}
			var $TempSnapPicture = jQuery("#TempSnapPicture"),
				drawRate = {
					width: $TempSnapPicture.width(),
					height: $TempSnapPicture.height()
				},
				cameraRate = DefenceTools.getCameraRate();
			//转换坐标
			data.points = DefenceTools.ruleLineOpera.coordinateSwitchEx(data.points, drawRate, cameraRate);

			var width = parseFloat(Math.abs(data.points[0][0] - data.points[1][0])).toFixed(1),
				height = parseFloat(Math.abs(data.points[0][1] - data.points[2][1])).toFixed(1);
			//将转换后的数据赋值给页面元素
			if (data.domid === "rect_min" || data.domid === "rect_max" || data.domid === "rect_car") {
				//最小物体标定、最大物体标定、车牌标定
				// view.fillRectFilter(width, height, "rect_min");
				view.fillRectFilter(width, height, data.domid);
			} else if (data.domid === "rect_min_face") {
				//最小人脸尺寸
				view.fillRectFilter(width, height, "rect_min_face");
				//取最小边作为最小人脸尺寸，后续会调整为正方形
				ruleInfo.faceProtectInfo.minSize = (width > height) ? parseInt(height) : parseInt(width);
				//有变动，则显示保存按钮
				protectView.showSaveBtn();
			} else if (data.domid === "rect_max_face") {
				//最大人脸尺寸
				view.fillRectFilter(width, height, "rect_max_face");
				//取最大边作为最大人脸尺寸，后续会调整为正方形
				ruleInfo.faceProtectInfo.maxSize = (width > height) ? parseInt(width) : parseInt(height);
				//有变动，则显示保存按钮
				protectView.showSaveBtn();
			} else if (data.domid === "rect_face_rule") {
				//将坐标转化为cameraRate并存储
				ruleInfo.faceProtectInfo.pointsInfo.left = data.points[0][0];
				ruleInfo.faceProtectInfo.pointsInfo.top = data.points[0][1];
				ruleInfo.faceProtectInfo.pointsInfo.right = data.points[2][0];
				ruleInfo.faceProtectInfo.pointsInfo.bottom = data.points[2][1];
				//有变动，则显示保存按钮
				protectView.showSaveBtn();
			}
		},
		/**
		 * 用户删除框线规则或清除框线规则时处理流程
		 */
		removeLines: function(obj) {
			console.log(obj)
			//获取当前区域规则列表
			var curAreaList = areaListController.getCurAreaList();
			//判断当前所处的模式
			if (jQuery("#TempSnapPicture").length === 0) {
				notify.warn("请先暂停播放摄像机视频！");
				return false;
			}
			//为区分实时标注单独处理 
			console.log(globalVar.defence.ruleInfo.procPolyData,globalVar.defence.ruleInfo.shieldPolyData)
			if (globalVar.defence.ruleInfo.options.curRuleId === "268435456") {
				if ((globalVar.defence.ruleInfo.procPolyData.length + globalVar.defence.ruleInfo.shieldPolyData.length) === 0 && !DrawEditor.drawingPolyNode) {
					notify.warn("当前暂没有任何区域，请先在视频上添加！");
					return false;
				}

			} else {
				if (curAreaList.length === 0 && !DrawEditor.drawingPolyNode) {
					notify.warn("当前暂没有任何区域，请先在视频上添加！");
					return false;
				}

			}
			if (jQuery(obj).hasClass("icon_removeall")) {
				//全部清除
				DrawEditor.clearPaper();
				//触发-全部清除页面变量
				areaListController.clearAreaListInfo();
			} else if (jQuery(obj).hasClass("icon_remove")) {
				console.log(DrawEditor.drawingPolyNode)
				if (DrawEditor.drawingPolyNode) {
					//如果处于多边形绘制过程中，则删除当前正在绘制的多边形区域
					DrawEditor.deletedom();
					DrawEditor.setPenType("select");
				} else {
					if (!DrawEditor.selectNode || !DrawEditor.selectNode.data("domid")) {
						notify.warn("请选中要删除的区域！");
						return;
					}
					var delId = DrawEditor.selectNode.data("domid");
					if (delId === "rect_min" || delId === "rect_max" || delId === "rect_car") {
						return;
					}
					//部分清除
					var delInfo = DrawEditor.deletedom();
					console.log(delInfo,globalVar.defence.ruleInfo.procPolyData)
					if (globalVar.defence.ruleInfo.options.curRuleId === "268435456") {
						if (globalVar.defence.ruleInfo.procPolyData.length > 0) {
							for (var i = 0, length = globalVar.defence.ruleInfo.procPolyData.length; i < length; i++) {
								if (globalVar.defence.ruleInfo.procPolyData[i].domid === delInfo.domid) {
									globalVar.defence.ruleInfo.procPolyData.splice(i, 1);
									break;
								}

							}
							if (globalVar.defence.ruleInfo.procPolyData.length === 0) { //当前划线少于1条重新激活按钮
								$("#type-region-proc").removeClass("disabled").removeAttr("disabled");
							}

						}
						if (globalVar.defence.ruleInfo.shieldPolyData.length > 0) {
							for (var i = 0, length = globalVar.defence.ruleInfo.shieldPolyData.length; i < length; i++) {
								if (globalVar.defence.ruleInfo.shieldPolyData[i].domid === delInfo.domid) {
									globalVar.defence.ruleInfo.shieldPolyData.splice(i, 1);
									break;
								}
							}
							if (globalVar.defence.ruleInfo.shieldPolyData.length < 5) { //当前划线少于5条重新激活按钮
								$("#type-region-shield").removeClass("disabled").removeAttr("disabled");
							}
						}
					} else {
						//触发-清除arealist中的指定区域
						areaListController.delAreaToList(delInfo);
					}

				}
			}
		},
		/**
		 * 布控任务规则在画布上显示
		 */
		showProtectRuleOnDraw: function() {
			var ruleInfo = globalVar.defence.ruleInfo;
			var $TempSnapPicture = jQuery("#TempSnapPicture"),
				displayRate = {
					width: $TempSnapPicture.width(),
					height: $TempSnapPicture.height()
				},
				cameraRate = DefenceTools.getCameraRate();
			var x = 50,
				y = 50,
				width = displayRate.width - 100,
				height = displayRate.height - 100;
			x = (ruleInfo.faceProtectInfo.pointsInfo.left === 0) ? x : ruleInfo.faceProtectInfo.pointsInfo.left;
			y = (ruleInfo.faceProtectInfo.pointsInfo.top === 0) ? y : ruleInfo.faceProtectInfo.pointsInfo.top;
			width = ((ruleInfo.faceProtectInfo.pointsInfo.right - ruleInfo.faceProtectInfo.pointsInfo.left) > 0) ? (ruleInfo.faceProtectInfo.pointsInfo.right - ruleInfo.faceProtectInfo.pointsInfo.left) : width;
			height = ((ruleInfo.faceProtectInfo.pointsInfo.bottom - ruleInfo.faceProtectInfo.pointsInfo.top) > 0) ? (ruleInfo.faceProtectInfo.pointsInfo.bottom - ruleInfo.faceProtectInfo.pointsInfo.top) : height;
			//如果是默认值，则不需要转换
			if ((ruleInfo.faceProtectInfo.pointsInfo.right - ruleInfo.faceProtectInfo.pointsInfo.left) !== 0) {
				//转化成相对于当前显示分辨率下的宽度和高度
				width = width * displayRate.width / cameraRate.width;
				height = height * displayRate.height / cameraRate.height;
				x = x * displayRate.width / cameraRate.width;
				y = y * displayRate.height / cameraRate.height;
			}
			//绘图
			var drawInfo = DefenceTools.ruleLineOpera.formateDisplayDataOnDraw({
				x: x,
				y: y,
				width: width,
				height: height,
				text: "人脸检测区域",
				domid: "rect_face_rule"
			}, "rect_face_rule");
			DrawEditor.add_rect(drawInfo);
		}
	};

	return new Controller();
});