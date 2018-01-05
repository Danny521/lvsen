/**
 * 布防任务 联动选择view模块
 */
define([
	// control层
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-linkage-control.js",
	// model层
	"/module/protection-monitor/defencesetting/js/model/control-linkage-model.js",
	//全局函数
	'/module/protection-monitor/defencesetting/js/global-var.js',
	//联动面板控制
	'/module/common/checkLinkage/js/controller/main-ctrl.js'

], function(linkageControl, linkageModel, _g, linkageCtrl) {
	function LinkageView() {
		// 联动选择模板列表
		this.templateList = {};
		// 联动选择对话框对象
		this.dialogObj = null;
		//
		this.complier = null;
		this.tvWallCache = {};
	}

	LinkageView.prototype = {
		/**
		 * [init 初始化函数]
		 * @return {[type]} [description]
		 */
		init: function() {
			// 绑定“联动选择”按钮事件
			this.bindEvent();
			// 注册handlebar助手
			this.registerHelper();
		},
		/**
		 * [bindEvent 绑定“联动选择”按钮事件]
		 * @return {[type]} [description]
		 */
		bindEvent: function() {
			var self = this;
			/**
			 * 联动设置
			 * add by leon.z 2015.11.23
			 **/
			jQuery(document).off("click","#defence-setting-sidebar .linkBtn:not(.disabled)").on("click", "#defence-setting-sidebar .linkBtn:not(.disabled)", function(event) {
				jQuery(this).addClass("disabled active-linkage");
				// 初始化联动选择面板
				// self.initLinkagePanel(jQuery(this));
				// 获取布防任务id
				var taskId = _g.defence.cameraData.taskId;
				//布防联动设置 by zhangxinyu
				linkageCtrl.init("defence", taskId);
				//移出ocx
				document.getElementById("UIOCXDEFEND") && (document.getElementById("UIOCXDEFEND").style.visibility = "hidden");
				return false;
			});
		},
		/**
		 * [getTemplate 根据模板名称获取模板]
		 * @param  {[type]}   name     [模板名称]
		 * @param  {Function} callback [获取成功后的回调函数]
		 * @return {[type]}            [description]
		 */
		getTemplate: function(name, callback) {
			var self = this;
			// 如果模板已经加载，则从内存中返回模板对象
			if (self.templateList[name]) {
				return callback(self.templateList[name]);
			}
			// 否则，获取模板
			linkageModel.getTml(name)
				.then(function(temp) {
					// 获取成功后，写入内存中，已供下次使用
					self.templateList[name] = Handlebars.compile(temp);
					callback(self.templateList[name]);
				});
		},
		/**
		 * [initLinkagePanel 初始化联动选择模板]
		 * @param  {[type]} $node [“联动选择”按钮的jQuery对象]
		 * @return {[type]}       [description]
		 */
		initLinkagePanel: function($node) {
			var self = this,
				params,
				isCloudPlant = (parseInt(_g.defence.cameraData.cameratype) === 0 ? parseInt(_g.defence.cameraData.cameratype) : parseInt(_g.defence.cameraData.camera_type)) === 0 ? false : {
					cId: _g.defence.cameraData.id,
					taskId: _g.defence.cameraData.taskId || "",
					name: _g.defence.cameraData.name,
					ptz: linkageControl.sendObj.ptz || ""
				},
				istviews = {
					model: linkageControl.sendObj.tvWall.model || "",
					chanel: linkageControl.sendObj.tvWall.chanel || ""
				},
				isMessage = {
					isMessage: linkageControl.sendObj.isSendMessage
				},
				isGis = {
					isLinkGis: linkageControl.sendObj.isLinkGis
				},
				isMobile ={
					isLinkMobile: linkageControl.sendObj.isLinkMobile
				};
			params = {
				linkage: true,
				cloudPlat: isCloudPlant,
				tviews: istviews,
				messages: isMessage,
				gis: isGis,
				mobile:isMobile
			};
			self.getTemplate("DefenceLinkagePanelTemp", function(temp) {
				self.complier = temp;
				self.dialogObj = new CommonDialog({
					title: "联动选择",
					message: temp(params),
					width: "570px",
					classes: "linkage-panel",
					prehide: function() {
						document.getElementById("UIOCXDEFEND") && (document.getElementById("UIOCXDEFEND").style.visibility = "visible");
					}
				});
				// 按钮取消禁用
				$node.removeClass('disabled');

				// 绑定面板事件
				self.bindPanelEvent();
			});
		},
		/**
		 * [bindPanelEvent 绑定面板上的事件]
		 * @return {[type]} [description]
		 */
		bindPanelEvent: function() {
			var self = this;
			jQuery("#linkagedContent").on("change", "li input", function(e) {
				var types = jQuery(this).closest('li').data("type"),
					$node = jQuery(this).closest('li'),
					$currNode = jQuery(this),
					donext = function(node) {
						var isCheck = $currNode.prop("checked");
						node.find(".slecetMode")[isCheck ? "removeClass" : "addClass"]("disabled");
					}
				switch (types) {
					case "cloudPlat":
						donext($node);
						break;
					case "tviews":
						donext($node);
						break;
					case "messages":
						linkageControl.sendObj.isSendMessage = $currNode.prop("checked");
						break;
					case "gis":
						linkageControl.sendObj.isLinkGis = $currNode.prop("checked");
						break;
					case "mobile":
						linkageControl.sendObj.isLinkMobile = $currNode.prop("checked");
						break;
				};

			});
			/**下拉列表点击事件**/
			jQuery("#linkagedContent").on("click", "li .slecetMode:not(.disabled)", function(e) {
				e.stopPropagation();
				var currType = jQuery(this).closest('li').attr("data-type"),
					cameraId = jQuery(this).closest('li').attr("data-camerId"),
					taskId = jQuery(this).closest('li').attr("data-taskId"),
					isChanel = jQuery(this).hasClass('chanelpanel'),
					$node = jQuery(this);
				jQuery(this).closest('li').addClass("active");

				switch (currType) {
					case "cloudPlat":
						self.toDealPnael("getPtzPreset", cameraId, taskId, $node);
						break;
					case "tviews":

						if (isChanel) {
							return self.toDealPnael("setChanel", cameraId, taskId, $node);
						}
						self.toDealPnael("setTvWall", cameraId, taskId, $node);
						break;
				}


			});
			/**下拉列表选择点击事件**/
			jQuery(".currpanel").on("click", "li", function(e) {
				e.stopPropagation();
				var name = jQuery(this).text(),
					isChanel = jQuery(this).hasClass('chanelpanel'),
					types = jQuery(this).parent().attr("data-model");
				jQuery(this).addClass('active').siblings().removeClass("active");
				jQuery(this).parent().closest('li').find(".slecetMode").find("i").removeClass('active');
				jQuery(this).parent().closest('li').removeClass('active');
				jQuery(this).parent().hide();
				if (types === "preset") {
					jQuery(this).parent().closest('li').find("em:eq(0)").html(name).attr("title",name);
					linkageControl.sendObj.ptz = {
						preset_id: jQuery(this).attr("data-id"),
						preset_name: jQuery(this).attr("data-name")
					}
				}
				if (types === "model") {
					jQuery(this).parent().closest('li').find("em:eq(0)").html(name).attr("title",name);
					linkageControl.sendObj.tvWall.model = {
						tvwallLayout_id: jQuery(this).attr("data-id"),
						tvwallLayout_name: jQuery(this).attr("data-name")
					}
				}
				if (types === "chanel") {
					linkageControl.sendObj.tvWall.chanel = {
						mdTvwallLayout_id: jQuery(this).attr("data-id"),
						mdTvwallLayout_sceen: jQuery(this).attr("data-screenId")
					}
					jQuery(this).parent().closest('li').find("em:eq(1)").html(name).attr("title",name);
				}

			});
			jQuery("#linkagedContent").on("click", "li .goset", function(e) {
				e.stopPropagation();
				var type = jQuery(this).closest('li').attr("data-type"),
					cameraId = jQuery(this).closest('li').attr("data-camerId");
				if (type === "cloudPlat") {
					return window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/inspect/monitor?defenceCamearaId=" + cameraId);
				}
				if (type === "tviews") {
					return window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/settings/taskmgr?defenceCamearaId=" + cameraId);
				}
			});
			jQuery(document).on("click", function(e) {
				jQuery(".currpanel").hide();
				jQuery("#linkagedContent li.active .slecetMode").find("i").removeClass('active');
			});
		},
		toDealPnael: function(name, cId, taskid, node) {
			var self = this;
			if (name === "getPtzPreset") {
				linkageModel.getData(name, {
					cameraId: cId
				}).then(function(res) {
					if (res.code === 200) {
						self.renderTemp(res.data, node, "getPtzPreset");
					} else {
						notify.error("请求预置位异常");
						return;
					}
				});
			} else if (name === "setTvWall") {
				linkageModel.getData(name, {
					isIncludeChannel: 1
				}).then(function(res) {
					if (res.code === 200) {
						self.renderTemp(res.data, node, "setTvWall");
						self.tvWallCache = res.data.layouts;
						jQuery(".chanelPanel").hide();
						node.siblings(".slecetMode").find("i.active").removeClass("active");
					} else {
						notify.error("请求模板异常");
						return;
					}

				});
			} else if (name === "setChanel") {
				var currMode = linkageControl.sendObj.tvWall.model.tvwallLayout_id || jQuery(".modlePanel").find("li.active").attr("data-id");
				linkageControl.chanelList = [];
				self.tvWallCache.forEach(function(item, index) {
					if (parseInt(item.id) === parseInt(currMode)) {
						linkageControl.chanelList.push(item.monitorLayout);
					}
				});
				self.renderChanelTemp(linkageControl.chanelList[0], node);
				jQuery(".modlePanel").hide();
				node.siblings(".slecetMode").find("i.active").removeClass("active");;
			}

		},
		/**渲染预置位和模板**/
		renderTemp: function(data, node, name) {
			var self = this,
				dataName, modelName, panelName, les = parseInt(node.width()) + 10;
			dataName = name === "getPtzPreset" ? "presets" : "layouts";
			modelName = name === "getPtzPreset" ? "暂无预置位" : "暂无模板";
			panelName = name === "getPtzPreset" ? "presetPanel" : "modlePanel";
			if (data && data[dataName].length === 0) {
				node.closest('li').find("em").html(modelName);
				node.closest('li').find(".warnInfo").removeClass("hidden");
			} else {
				if (name === "getPtzPreset") {
					var html = self.complier({
						presetList: data[dataName]
					});
				} else {
					var html = self.complier({
						modelList: data[dataName]
					});
					jQuery("#linkagedContent .chanelpanel").removeClass("hidden");
				}
				node.closest('li').find(".warnInfo").addClass("hidden");
				jQuery("." + panelName).html(html).width(les).show();
				node.find("i").addClass('active');
			}

		},
		/**渲染电视墙通道**/
		renderChanelTemp: function(data, node) {
			var self = this,
				les = parseInt(node.width()) + 10,
				lefts = node[0].offsetLeft;
			if (data && data.length === 0) {
				node.closest('li').find("em:eq(1)").html("暂无通道");
			} else {
				var html = self.complier({
					chanelList: data
				});
				jQuery(".chanelPanel").html(html).width(les).css("left", lefts + "px").show();
				node.find("i").addClass('active');
			}

		},
		/**
		 * [registerHelper 注册handlebar助手]
		 * @return {[type]} [description]
		 */
		registerHelper: function() {
			// 根据短信通知的时间值，判断时间类型的选中状态
			Handlebars.registerHelper("hasLinkage", function(ptz) {
				if (ptz) {
					return "";
				}
				return "disabled";
			});
			Handlebars.registerHelper("hasLinkage1", function(wall) {
				if (wall && wall.model) {
					return "";
				}
				if (wall && wall.chanel) {
					return "";
				}
				return "disabled";
			});
			Handlebars.registerHelper("hasLinkage2", function(wall) {
				if (wall && wall.chanel.mdTvwallLayout_id) {
					return "";
				}
				return "hidden";
			});
			Handlebars.registerHelper("presetName", function(ptz) {
				if (ptz) {
					return ptz.preset_name || "";
				}
				return "选择预置位";
			});
			Handlebars.registerHelper("tvwallName", function(wall) {
				if (wall && wall.model) {
					return wall.model.tvwallLayout_name || "";
				} else {
					return "选择模板";
				}
			});
			Handlebars.registerHelper("chanelName", function(wall) {
				if (wall.chanel.mdTvwallLayout_id) {
					return wall.chanel.mdTvwallLayout_sceen || "";
				} else {
					return "选择通道";
				}


			});
			Handlebars.registerHelper("isChecked", function(obj) {
				if (obj !== "") {
					return "checked = 'checked'";
				}
				return "";
			});
			Handlebars.registerHelper("isChecked1", function(obj) {

				if (obj && obj.model !== "") {
					return "checked = 'checked'";
				}
				return "";
			});
			Handlebars.registerHelper("isChecked2", function(flag) {
				if (flag) {
					return "checked = 'checked'";
				}
				return "";
			});
		},
		clearCache: function() {
			linkageControl.resetElement();
		}

	};

	return new LinkageView();
})