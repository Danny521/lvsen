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
	"/module/common/js/map-drag.js",
	"/module/common/js/player2.js"
], function(model, simpleCameraTree,DragItems) {
	function Views() {
		var self = this;		
		// 手动选择摄像机面板模板
		self.chooseCameraPanelTml = null;
		// 手动选择摄像机摄像机树
		self.cameraTree = null;
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
		illegalCharacter:/([?"*'\/\\<>:|？“”‘’^&~]|(?!\s)'\s+|\s+'(?!\s))/ig,
		videoPlayerSigle:null,
		lastLeft:false,
		/**
		 * [init 初始化函数]
		 * @param  {[type]} cameras [已经选择的摄像机列表]
		 * @return {[type]}         [description]
		 */
		init: function(hideCallBack ,type ,mygroupinfo) {
			var self = this;
			//每次进来将newCameras,oldCameraList,oldGroupName置空	
			self.newCameras = [];
			self.oldCameraList = [];
			self.oldGroupName = null;
			if (mygroupinfo && mygroupinfo.cameras && mygroupinfo.name) {
				self.oldCameraList = mygroupinfo.cameras;
				self.oldGroupName = mygroupinfo.name;
			}
			self.registerHelper();
			hideCallBack && (self.closePanel = hideCallBack);
			self.initCameraPanelTml(function (err) {
				if (err) {
					return notify.warn("加载模板失败");
				}
				self.initCameraTree(type);
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
			model.getTml("addOrEditMyGroupPanel")
			.then(function(temp) {
				// 获取成功后加载Handlebars模板
				self.chooseCameraPanelTml = Handlebars.compile(temp);
				callback(null);
			}, function(err) {
				callback(err);
			});
		},
		/**
		 * [initCameraTree 初始化摄像机树]
		 * @return {[type]} [description]
		 */
		initCameraTree: function(ctype) {		
			var self = this,
			    title;
			//记录点击编辑后的摄像机id
			if(ctype === "add"){
                title = "新建分组";
			}
			if(ctype === "edit"){
                title = "编辑分组";
			}
			// 加载已经选择的摄像机
			var html = self.chooseCameraPanelTml({
					"oldCameraList": self.oldCameraList,
					"groupName":self.oldGroupName
				}),
				camerasCache = self.oldCameraList.map(function(item) {
					return item.id - 0;
				});												
			self.chooseCameraPanel = new CommonDialog({
				title: title,
				classes: "control-choose-camera-panel",
				width: "681px",
				isFixed:false,
				prehide:function(){
					self.removeOcx();
				}
			});
			$(".common-dialog.control-choose-camera-panel").css({
				height:"601px",
				top:"51px;",
				prehide:function(){
					self.removeOcx();
				}
			});
			self.chooseCameraPanel.getBody().html(html);
			//设置模态框可拖动，jquery-ui.js中的方法若，若出错检查该js是否加载
			jQuery(".common-dialog.control-choose-camera-panel").draggable();	
			var $result = jQuery(".choose-result .result");
			// 给dom绑定数据
			self.oldCameraList.forEach(function(item) {
				$result.find("li.leaf[data-id=" + item.id + "]").data(item);
			});		
			self.cameraTree = new simpleCameraTree({
				"node": ".control-choose-camera-panel .simple-camera-tree-panel", //树的容器
				"orgId": $("#userEntry").data("orgid"),         //当前用户的组织id
				"searchNode": ".control-choose-camera-panel .simple-camera-tree-search-input",  //树内容搜索框的选择器
				"checkIpcCamera": true,
				"checkboxTriggerLeaf": true,                   //树的叶子节点的checkbox是否触发叶子节点的点击事件
				"checkboxTriggerOrg": true,
				"showAllCameras": true,  // 是否显示所有摄像机
				"camerasCache": camerasCache,
				"hasPlayBtn":true,
				"hasPlayBtn":true,
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
			//绑定拖动事件
			new DragItems("mygroup-camera-list", 2);
			
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
				id = $node.closest('li.leaf').attr("data-id") - 0,
				name = $node.attr("title"),
				$checkbox = $node.siblings(".checkbox"),
				camerasCache = self.cameraTree.options.camerasCache;

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
				// 如果选中了当前摄像机
				var html = "<li class='leaf' data-id='" + id + "'><i class='leaf " + _class + " '></i><span class='name text-elips' title='" + name + "'>" + name + "</span><i class='remove-ipc'></i><i class='group-camera-down' title='下移'></i><i class='group-camera-up' title='上移'></i></li>";
				jQuery(".choose-result").find(".result").append(html)
					.end().find("li.leaf:last").data(cameraData);
				// 缓存中添加
				camerasCache.indexOf(id) === -1 && camerasCache.push(id);
			} else {
				// 如果取消选中了当前摄像机
				jQuery(".choose-result").find(".result").find("li[data-id=" + id + "]").remove();
				// 缓存中删除
				camerasCache.indexOf(id) > -1 && camerasCache.splice(camerasCache.indexOf(id), 1);
			}
		    //绑定拖动事件
			new DragItems("mygroup-camera-list", 2);
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
			var self = this,
			camerasCache = self.cameraTree.options.camerasCache;
			model.getData("getCamerasByOrgId", data)
			.then(function(res) {
				if (res.code === 200) {					
					var cameras = res.data.cameras,
						$ul = jQuery(".choose-result").find(".result");

					cameras.forEach(function(item) {						
						if (operaType === "remove") {
							camerasCache.indexOf(item.id-0) > -1 && camerasCache.splice(camerasCache.indexOf(item.id-0), 1);
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
							html = "<li class='leaf' data-id='" + item.id + "'><i class='leaf " + _class + "'></i><span class='name text-elips' title='" + item.name + "'>" + item.name + "</span><i class='remove-ipc'></i><i class='group-camera-down' title='下移'></i><i class='group-camera-up' title='上移'></i></li>";
				
						$ul.append(html);
						$ul.find("li.leaf:last").data(cameraData);
						camerasCache.indexOf(item.id-0) === -1 && camerasCache.push(item.id-0);
					});
                    //绑定拖动事件
			        new DragItems("mygroup-camera-list", 2);
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
				var $choosePanel = jQuery(".control-choose-camera-panel"),
					value = $choosePanel.find(".my-group-name-panel").val().trim();
				// 检查分组名是否合法
				if (!value) {
					// form.find('[name="name"]').focus();  //如果加上这行  会导致ie9下placeholder属性被当做val读取
					return notify.error("请输入分组名称！");
				}
				if (value.length > 30) {
					return notify.error("组名长度不能超过30字符！");
				}
				if (self.illegalCharacter.test(value)) {
					return notify.error("组名不能包含特殊字符！");
				}
				var	$li = $choosePanel.find(".choose-result").find("li.leaf");
				self.newCameras = [];    //在点击确定前置空				
				$li.each(function() {
					var data = jQuery(this).data();									
					self.newCameras.push(data.id);
				});
				console.log(self.newCameras);
				if(self.newCameras.length === 0){
					notify.error("请选择摄像机！");
					jQuery(this).removeClass("disabled");
					return;
				}				
			//	jQuery(this).addClass("disabled");
				var mygroupinfo = {
					name:value,
					cameras:self.newCameras
				};
				self.closePanel(mygroupinfo,self.chooseCameraPanel);
			//	self.chooseCameraPanel.hide();

			})
			// 点击取消，不做任何处理 直接关闭面板
			.on("click", ".cancle", function() {
				self.chooseCameraPanel.hide();
				self.removeOcx();
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
				var index = self.cameraTree.options.camerasCache.indexOf(id-0);
				self.cameraTree.options.camerasCache.splice(index,1);
			})
			//分组的第一个摄像机不上移
			.on("click", ".result .leaf:first .group-camera-up", function() {
				notify.warn("第一个摄像机不能上移");
			})
			//分组的最后一个摄像机不下移
			.on("click", ".result .leaf .group-camera-down", function() {
				var $this = $(this).closest("li.leaf"),
					ThisNext = $this.next();

					if (ThisNext.length === 0) {
						notify.warn("最后一个摄像机不能下移");
					}
			})
			//将摄像机的位置在列表中上移
			.on("click", ".group-camera-up", function() {
				var $this = $(this).closest("li.leaf"),
					ThisPrev = $this.prev();

					if (ThisPrev.length) {
						$this.after(ThisPrev);
					}
			})
			//将摄像机的位置在列表中下移
			.on("click", ".group-camera-down", function() {
				var $this = $(this).closest("li.leaf"),
					ThisNext = $this.next();

					if (ThisNext.length) {
						ThisNext.after($this);
					}
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
				self.cameraTree.options.camerasCache =[];
				var $allCheck = jQuery(".simple-camera-tree-panel").find("i.checkbox");
				//删除全部已选摄像机后左边的checkbox要去掉勾选
	            $allCheck.removeClass('selected');
			});

			jQuery(".ocxPanel").off("click",".video-win-close").on("click",".video-win-close",function(){
				self.removeOcx();
			});
			jQuery(".control-choose-camera-panel .simple-camera-tree-panel").off("click","li.leaf>.iconPlay").on("click","li.leaf>.iconPlay",function(e){
				var node = jQuery(this),
				params ={
					"orgName":node.closest('li').parents("li.tree").data("name"),
					"cameraName":node.closest('li').data("name")
				},
				position ={
					currL:jQuery(".control-choose-camera-panel")[0].offsetLeft,
					currtop:jQuery(".control-choose-camera-panel")[0].offsetTop,
					currW:jQuery(".control-choose-camera-panel")[0].clientWidth
				},
				cameraData={
					"hdChannel":jQuery(this).closest('li').data("hd-channel"),
					"sdChannel":jQuery(this).closest('li').data("sd-channel"),
					"id":jQuery(this).closest('li').data("id"),
					"name":jQuery(this).closest('li').data("name"),
					"cameratype":jQuery(this).closest('li').data("camera-type"),
					"cameracode":jQuery(this).closest('li').data("cameracode"),
					"cstatus":jQuery(this).closest('li').data("camera-status"),
					"longitude":jQuery(this).closest('li').data("lon"),
					"latitude":jQuery(this).closest('li').data("lat")
				};
				self.getOcxTemp(function() {
					if (!self.lastLeft) {
						jQuery(".control-choose-camera-panel").css({
							"left": position.currL - 200 + "px"
						})
						jQuery(".ocxPanel").css({
							"left": position.currL + position.currW - 190 + "px",
							"top": position.currtop + "px",
							"position": "fixed",
							"zIndex": 2000
						})
						self.lastLeft = true;
					}
					self.clearVideoInfo();
					jQuery(".ocxPanel").html(self.groupOcxTemp({
						videoplay: true,
						data: params
					})).show(10,function(){
						if (!self.videoPlayerSigle) {
							self.videoPlayerSigle = new VideoPlayer({
								uiocx: 'UIOCX_CURR'
							});
						}
						self.playCurrVideo(cameraData);
					});
					
				})
			});
		},
		playCurrVideo:function(data){
			var self = this;
			if(!data){
				return;
			}
			self.videoPlayerSigle.freePlay({
				"hdChannel": Array.clone(data.hdChannel), //高清通道
				"sdChannel": Array.clone(data.sdChannel), //标清通道
				"cId": data.id,
				"cName": data.name,
				"cType": data.cameratype,
				"cCode": data.cameracode,
				"cStatus": data.cstatus //摄像机在线离线状态
			});
		},
		getOcxTemp:function(callback){
			var self = this;
			model.getTml("addOrEditgroupOcx")
				.then(function(temp) {
					// 获取成功后加载Handlebars模板
					self.groupOcxTemp = Handlebars.compile(temp);
					callback()
				}, function(err) {
					callback(err);
				});
		},
		removeOcx:function(){
			var self = this;
			if (jQuery(".ocxPanel").is(":visible")) {
				self.clearVideoInfo();
				jQuery(".ocxPanel").empty().hide();
				jQuery(".control-choose-camera-panel").css({
					"left":jQuery(".control-choose-camera-panel")[0].offsetLeft+200+"px"
				});
				self.lastLeft = false;
			}
		},
		/**
		 * 清除播放器相关
		 */
		clearVideoInfo: function() {
			var self = this;
			if (self.videoPlayerSigle) {
				self.videoPlayerSigle.playerObj.Stop(false, 0);
				self.videoPlayerSigle = null;
			}

		},
		/**
		 * [setSelectedCount 获取选择的摄像机数量]
		 * @return {[type]} [description]
		 */
		setSelectedCount: function() {
			var $chooseResult = jQuery(".choose-result"),
				L = $chooseResult.find(".result").find("li.leaf").length;
			jQuery("#chooseCounts").html(L);
			if (L == 0) {
				$chooseResult.find(".head").find("button").css({"display": "none"});
				$chooseResult.find(".result").empty().append("<li class='warmtip'>暂无摄像机，请在左侧勾选</li>");
			} else {
				$chooseResult.find(".head").find("button").css({"display": "block"});
				$chooseResult.find(".result").find("li.warmtip").remove();
			}
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
});