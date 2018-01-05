/**
 * [手动选择摄像机view模块]
 * @param  {[type]} ipcControl        [手动选择摄像机Controller模块]
 * @param  {[type]} model         [model模块]
 * @param  {[type]} simpleCameraTree) [简化摄像机树]
 * @return {[type]}                   [description]
 */
define([
	"/module/inspect/monitor/js/choose-camera-model.js",
	"/module/inspect/common/js/simple-camera-tree.js",
	"/module/common/js/player2.js"
], function(model, simpleCameraTree) {
	function Views() {
		var self = this;		
		// 手动选择摄像机面板模板
		self.chooseCameraPanelTml = null;
		// 手动选择摄像机摄像机树
		self.cameraTree = null;
		// 已选择的摄像机列表
		self.oldCameraList = [];
		//摄像机信息
		self.newCameras = [];
		//初始化播放器
		if (!window.gVideoPlayer) {
			self.player = window.gVideoPlayer = new VideoPlayer(); //创建播放器对象
		} else {
			self.player = window.gVideoPlayer;
		}
		// 确定后的回调函数
		self.closePanel = jQuery.noop;
	}
	Views.prototype = {
		constructor: Views,
		/**
		 * [init 初始化函数]
		 * @param  {[type]} cameras [已经选择的摄像机列表]
		 * @return {[type]} hideCallBack [回调函数]
		 */
		init: function(cameras, hideCallBack) {
			var self = this;
			self.oldCameraList = cameras || [];
			self.registerHelper();
			hideCallBack && (self.closePanel = hideCallBack);
			self.initCameraPanelTml(function (err) {
				if (err) {
					notify.warn("加载模板失败");
					return;
				}
				self.initCameraTree();
			});
		},
		/**
		 * [formatLayoutDate description]
		 * @param  {[type]} cameras [数组]
		 * @return {[type]}         [数组]
		 */
		formatLayoutDate: function(cameras) {

			var result = [],
				tem = {},
				i = cameras.length;
			while (i--) {
				tem = {
					"cameraId": cameras[i].cameraId,
					"hdchannel": cameras[i].hd_channel || cameras[i].hdchannel,
					"sdchannel": cameras[i].sd_channel || cameras[i].sdchannel,
					"cameracode": cameras[i].cameraCode || "",
					"cameratype": cameras[i].cameratype || cameras[i].cameraType,
					"cameraType": cameras[i].cameraType,
					"cstatus": cameras[i].cameraStatus || cameras[i].cstatus,
					"watchId": cameras[i].watchId || "",
					"position": cameras[i].position,
					"name": cameras[i].name,
					"id": cameras[i].cameraId
				};
				result.push(Object.clone(tem));
			}
			return result;
		},
		/**
		 * 获取模板
		 * @param url 模板URL
		 * @returns {*} 模板字符串
		 */
		loadTempl: function(cameraList) {
			var self = this;

			jQuery.when(self.addTempl('inc/group_add_came_tpl.html')).done(function (tpl) {
				var obj = {
					"cameraList": cameraList
				};
				if (tpl.constructor !== window.Array) {
					var tpll = [];
					tpll.push(tpl);
					tpl = tpll;
				}
				var stmp = Handlebars.compile(tpl[0]);
				var sdom = stmp(obj);
				jQuery('#sidebar-body > [data-tabor="inspect-create"] .cameraslist>ul').append(sdom);
				var $lis = jQuery('#sidebar-body > [data-tabor="inspect-create"] .cameraslist>ul li');
				$lis.each(function (index, ele) {
					if (jQuery(this).attr("data-camera-type") == 1) {
						jQuery(this).find(".camera-style").addClass("dom dom-marked");
					}
				});
				var height = jQuery(document).height();
				jQuery('#sidebar-body > [data-tabor="inspect-create"] .cameraslist>ul').css("height", (height - 370) + "px");
			})
		},
		/**
		 * [addTempl description]
		 * @param {[type]} url [description]
		 */
		addTempl: function(url) {
			var self = this;
			self.templCache = self.templCache || {};
			//debugger
			if (_.has(self.templCache, url)) {
				return self.templCache[url];
			}
			return jQuery.get(url, function (templ) {
				self.templCache[url] = new Array(templ);
			});
		},
		/**
		 * [initCameraPanelTml 加载选择摄像机面板]
		 * @param  {Function} callback [回调函数]
		 * @return {[type]}            [description]
		 */
		initCameraPanelTml: function(callback) {
			var self = this;
			// 获取模板
			model.getTml("chooseCamerasPanel")
				.then(function (temp) {
					// 获取成功后加载Handlebars模板
					self.chooseCameraPanelTml = Handlebars.compile(temp);
					callback(null);
				}, function (err) {
					callback(err);
				});
		},
		dataFill:function($lis,cameras) {
			for (var i = 0; i < cameras.length; i++) {
				$lis.eq(i).data(cameras[i])
			}
		},
		/**
		 * [initCameraTree 初始化摄像机树]
		 * @return {[type]} [description]
		 */
		initCameraTree: function() {			
			var self = this;
			//记录点击编辑后的摄像机id
			self.oldCameraList = self.formatLayoutDate(self.oldCameraList);
			self.oldCameraList.reverse();
				// 加载已经选择的摄像机
			var html = self.chooseCameraPanelTml({
					"oldCameraList": self.oldCameraList
				}),

				camerasCache = self.oldCameraList.map(function(item) {
					return item.id - 0;
				});												
			self.chooseCameraPanel = new CommonDialog({
				title: "摄像机选择",
				classes: "control-choose-camera-panel",
				width: "460px"
			});

			self.chooseCameraPanel.getBody().html(html);
			//设置模态框可拖动，jquery-ui.js中的方法若，若出错检查该js是否加载
			jQuery(".common-dialog.control-choose-camera-panel").draggable();
			/*开始:填充数据同时要让对应勾选 add by wujingwen on2015.10.28*/
			var lis = jQuery(".choose-result .result li");
			self.dataFill(lis,self.oldCameraList);				
			/*结束*/			
			self.cameraTree = new simpleCameraTree({
				"node": ".control-choose-camera-panel .simple-camera-tree-panel", //树的容器
				"orgId": $("#userEntry").data("orgid"),         //当前用户的组织id
				"searchNode": ".control-choose-camera-panel .simple-camera-tree-search-input",  //树内容搜索框的选择器
				"checkIpcCamera": true,
				"checkboxTriggerLeaf": true,                   //树的叶子节点的checkbox是否触发叶子节点的点击事件
				"checkboxTriggerOrg": true,
				"showAllCameras": true,  // 是否显示所有摄像机
				"camerasCache": camerasCache,
				leafClick: function($node) {
					self.chooseCameras($node);
				}, //摄像机点击事件
				treeClick: function($node) {
					self.chooseOrg($node);
				},// 组织点击事件
				callback: function() {
					jQuery(".logs-left").find(".remark.disabled").removeClass("disabled");
				}
			});
			// 绑定摄像机选择面板的事件
			self.bindchooseCameraPanelEvent();
			// 显示已选择的摄像机数量
			self.setSelectedCount();
		},
		/**
		 * [chooseCameras 摄像机树上，点击摄像机的时候执行该函数，收集摄像机]
		 * @param  {[type]} $node [叶子节点上的span标签jQuery对象]
		 * @return {[type]}       [description]
		 */
		chooseCameras: function($node) {
			var self = this,
				id = $node.closest('li.leaf').attr("data-id"),
				name = $node.attr("title"),
				$checkbox = $node.siblings(".checkbox");

			if (id === undefined) {
				return false;
			}

			$checkbox.toggleClass('selected');
			self.cameraTree.walkUp($checkbox);

			var $li = $checkbox.closest("li.leaf"),
				cameraType = $li.attr("data-camera-type"),
				cameraStatus = $li.attr("data-camera-status"),
				hdChannel = $li.attr("data-hd-channel"),
				cameraData = {
					id: $li.attr("data-id"),
					name: $li.attr("data-name"),
					cameracode: $li.attr("data-cameracode"),
					cameratype: $li.attr("data-camera-type"),
					cameraType: $li.attr("data-camera-type"),
					longitude: $li.attr("data-lon"),
					latitude: $li.attr("data-lat"),
					hdchannel: $li.attr("data-hd-channel"),
					sdchannel: $li.attr("data-sd-channel"),
					cstatus: $li.attr("data-camera-status")
				},
				_class = getCamerasStatus(cameraType, cameraStatus, hdChannel);
			if ($checkbox.hasClass("selected")) {
				var html = "<li class='leaf' data-id='" + id + "'><i class='leaf " + _class + " '></i> <span class='name text-elips' title='" + name + "'>" + name + "</span><i class='remove-ipc'></i></li>";
				jQuery(".choose-result").find(".result").append(html)
				.end().find("li.leaf:last").data(cameraData);

			} else {
				jQuery(".choose-result").find(".result").find("li[data-id=" + id + "]").remove();
			}

			// 显示已选择的摄像机数量
			self.setSelectedCount();
		},
		/**
		 * [chooseOrg 摄像机树上选择组织时，触发该函数]
		 * @param  {[type]} $node [description]
		 * @return {[type]}       [description]
		 */
		chooseOrg: function($node) {
			var self = this,
				id = $node.closest('li.tree').attr("data-id"),
				$checkbox = $node.siblings(".checkbox");

			$checkbox.toggleClass('selected');
			self.getCamerasByOrgId({
				groups: id,
				type: 'org'
			}, $checkbox.hasClass("selected") ? "add" : "remove");
		},
		/**
		 * [remarkIpc 标记人脸摄像机] 按组织标记
		 * @param  {[type]} data [id列表]
		 * @return {[type]}      [description]
		 */
		getCamerasByOrgId: function(data, operaType) {		
			var self = this;
			model.getData("getCamerasByOrgId", data)
			.then(function(res) {
				if (res.code === 200) {					
					var cameras = res.data.cameras,
						$ul = jQuery(".choose-result").find(".result");

					cameras.forEach(function(item) {						
						if (operaType === "remove") {
							return $ul.find("li.leaf[data-id=" + item.id + "]").remove();
						}

						if ($ul.find("li.leaf[data-id=" + item.id + "]").length) {
							return;
						}

						var _class = getCamerasStatus(item.camera_type, item.camera_status, item.hd_channel),
							cameraData = {
								id: item.id,
								name: item.name,
								cameracode: item.cameraCode,
								cameratype: item.camera_type,
								longitude: item.longitude,
								latitude: item.latitude,
								hdchannel: item.hd_channel,
								sdchannel: item.sd_channel,
								cstatus: item.camera_status
							},
							html = "<li class='leaf' data-id='" + item.id + "'><i class='leaf " + _class + "'></i><span class='name text-elips' title='" + item.name + "'>" + item.name + "</span><i class='remove-ipc'></i></li>";
				
						$ul.append(html);
						$ul.find("li.leaf:last").data(cameraData);
					});

					// 显示已选择的摄像机数量
					self.setSelectedCount();
				} else if (res.code === 500) {
					notify.warn(res.data.message);
				} else {
					notify.warn("获取摄像机id列表异常!");
				}
			}, function() {
				notify.warn("获取摄像机id列表异常!");
			});
		},
		/**
		 * [bindchooseCameraPanelEvent 绑定摄像机选择面板的事件]
		 * @return {[type]} [description]
		 */
		bindchooseCameraPanelEvent: function() {
			var self = this;

			jQuery(".choose-footer").off("click")
			// 点击确定按钮，开始标识人脸摄像机
			.on("click", ".sure:not(.disabled)", function() {
				 self.newCameras = [];
				var	$li = jQuery(".control-choose-camera-panel").find(".choose-result").find("li.leaf");				
				$li.each(function() {
					var data = jQuery(this).data();									
					data.hd_channel = typeof data.hd_channel === "string" ? JSON.parse(data.hd_channel) : data.hd_channel;
					data.hdchannel = typeof data.hdchannel === "string" ? JSON.parse(data.hdchannel) : data.hdchannel;
					data.sd_channel = typeof data.sd_channel === "string" ? JSON.parse(data.sd_channel) : data.sd_channel;
					data.sdchannel = typeof data.sdchannel === "string" ? JSON.parse(data.sdchannel) : data.sdchannel;
					self.newCameras.push(data);
					
				});
				
				if(self.newCameras.length === 0){
					notify.warn("请选择摄像机！");
					jQuery(this).removeClass("disabled");
					return;
				}				
				var layout = self.player.getLayout();
				if(self.newCameras.length>layout){
					notify.warn("摄像机数目不能大于分屏数目！");
					return;
				}
				
				jQuery(this).addClass("disabled");
				self.closePanel(self.newCameras);
				self.chooseCameraPanel.hide();

			})
			// 点击取消，不做任何处理 直接关闭面板
			.on("click", ".cancle", function() {
				self.chooseCameraPanel.hide();
			});
			// 单个删除摄像机
			jQuery(".choose-result").off("click")
			.on("click", ".remove-ipc", function() {
				var $li = jQuery(this).closest("li.leaf"),
					id = $li.attr("data-id");
			
				$li.remove();
				var $checkbox = jQuery(".control-choose-camera-panel").find("li.leaf[data-id=" + id + "]").find(".checkbox");
				$checkbox.removeClass("selected");
				self.cameraTree.walkUp($checkbox);
				self.setSelectedCount();
			})
			//删除所有摄像机
			.on("click", ".remove", function() {
				jQuery(".choose-result .result li").each(function(index,ele){
					var $li = jQuery(ele).closest("li.leaf"),
						id = $li.attr("data-id");

					var $checkbox = jQuery(".control-choose-camera-panel").find("li.leaf[data-id=" + id + "]").find(".checkbox");
					$checkbox.removeClass("selected");
					self.cameraTree.walkUp($checkbox);
				});
				jQuery(".choose-result  .result").empty();
				self.setSelectedCount();
			});
		},

		/**
		 * [setSelectedCount 获取选择的摄像机数量]
		 * @return {[type]} [description]
		 */
		setSelectedCount: function() {
			jQuery("#chooseCounts").html(jQuery(".choose-result").find(".result").find("li.leaf").length);
		},
		/**
		 * [registerHelper 注册handlebar助手]
		 * @return {[type]} [description]
		 */
		registerHelper: function() {
			var self = this;
			Handlebars.registerHelper('getCamearstatus', getCamerasStatus);

			// 重置注册助手函数，防止注册多次
			self.registerHelper = jQuery.noop;
		}
	};
	
	function getCamerasStatus(type, status, hd_channel) {
		type = type - 0;
		status = status - 0;

        if(hd_channel&&hd_channel.length>0){
            if (type === 1) {
                if (status === 0) {
                    return 'dom dom-marked hd';
                } else {
                    return 'dom hd';
                }
            } else {
                if (status === 0) {
                    return 'marked hd';
                } else {
                    return 'hd';
                }
            }
        } else {
            if (type === 1) {
                if (status === 0) {
                    return 'dom dom-marked';
                } else {
                    return 'dom';
                }
            } else {
                if (status === 0) {
                    return 'marked';
                } else {
                    return '';
                }
            }
        } 
    }

	return new Views();
})