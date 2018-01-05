define([
	"underscore",
	"jquery",
	"mootools",
	"handlebars",
	"scrollbar",
	"/module/common/tvwall/js/models/tvwall-insert.js",
	"/module/common/tvwall/js/controllers/tvwall-wheel.js",
	"/module/ptz-controller/history/vodhistory.js",
	"pubsub"
], function(_, jQuery, mt, Handlebars, scrollbar, tvwall, mouseTip, vodHistory, PubSub) {

	var player;

	var TreeSubscribe = function(ocxPlayer) {
		player = ocxPlayer;
		this.bindEvents();
		this.k = 0;
	};

	TreeSubscribe.prototype = {
		templCache:{},
		URLS:{
			"GROUP_LIST":"/module/inspect/monitor/inc/group_list.html"
		},
		bindEvents: function(){
			var self = this;
			// 点击资源树上"添加到我的分组"弹出的层上的小的checkbox OK
			jQuery(document).on("click", "#groupwrap .grouplist li .small-checkbox", function(event) {
				event.stopPropagation();
				event.preventDefault();
				jQuery(this).toggleClass("checked");
				jQuery(this).closest("li").toggleClass("active");
			});
			// 点击资源树上"添加到我的分组"弹出的层上的小的"取消"按钮   取消添加到我的分组或监巡组 Ok
			jQuery(document).on("click", " #groupwrap .cancel-append", function(e) {
				e.stopPropagation();
				e.preventDefault();
				// jQuery(this).closest(".node").removeClass("opened");
				jQuery("#groupwrap").remove();
			});
			// 点击资源树上"添加到我的分组"弹出的层上的小的"确定"按钮  添加到自定义分组 OK
			jQuery(document).on("click", "#groupwrap .save-append", function(e) { //id前面加类名限制是因为两个确定按钮向后台发生的请求时不同的。
				e.stopPropagation();
				e.preventDefault();
				var node = jQuery(this).closest(".node");
				var groupActive = jQuery(" #groupwrap .grouplist li.active");
				var groups = [];
				var groupsName = [];
				var $camera = jQuery(this).closest(".node");
				var cameraId = $camera.data("id");   
				var cameraName = $camera.data("name");
				if (groupActive.length > 0) {
					// node.removeClass("opened");
					groupActive.each(function(index,elm){
						groups.push(jQuery(elm).data("id"));
						groupsName.push(jQuery(elm).attr("title"));
					});
					self._appendCameraToGroup(groups.join("/"), cameraId, function(){
                        logDict.insertMedialog("m1", cameraName +"已添加到我的分组名为" + groupsName.join(",") + "的分组中");
					});

					jQuery("#groupwrap").remove();
				} else {
					return notify.error("请选择自定义分组！");
				}
			});
			//点击的如果不是“添加到我的分组”的按钮，则删除jQuery("#groupwrap")
			jQuery(document).on("click",".tree-outtest-container .operator a",function(){
				if (!jQuery(this).hasClass("append")) {
					jQuery("#groupwrap").remove();
				}
			});
		},
		/**
		 * 在资源树上添加摄像头到我的分组 OK
		 * @param id - groupID
		 * @param camera - 摄像机id
		 * @param callback - 回调
		 * @private
		 */
		_appendCameraToGroup: function (id, camera, callback) {
			jQuery.ajax({
				url: "/service/video_access_copy/append_camera",
				data: {
					id: id,
					camera: camera,
					groups: "", //导入分组id列，可以传多个，格式为id1/id2/id3,这个参数用于将整个分组下面的摄像头添加到自定义分组
					type: "customize" //当groups有效的时候，需要取出groups实际的type
				},
				type: "post",
				success: function (res) {
					if (res && res.code === 200) {
						notify.success("已添加到自定义分组！");
						callback && callback();
					} else {
						notify.error("添加失败，" + res.data);
					}
				},
				error: function () {
					notify.error("请检查网络连接！");
				}
			});
		},
		/**
		 * 选择摄像机添加布防
		 * @param elm - 选中的节点元素
		 * @returns {boolean}
		 */
		defend: function(elm) {
			var node = jQuery(elm);
			var data = node.closest(".node").data();
			var orgIdInfo = node.closest("ul").closest("li").attr("data-id");
			if (orgIdInfo) {
				data.orgid = parseInt(orgIdInfo.split("_")[1]);
			}
			//权限的控制 从该用户是否有权限看视频和是否拥有播放实时视频的权限  by 2015.01.20
			var score = node.closest("li").attr("data-camerascore");
			if (!permission.stopFaultRightByScore(score, true)) {
				return false;
			}
			window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/protection-monitor/newStructAlarmmgr/?defenceCamearaId=" + data.id);
			//没有实时视频播放权限了（2016-4-8）bug#45041
			/*if (permission.klass["defense-real-time-view"] === "defense-real-time-view") {
				window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/protection-monitor/newStructAlarmmgr/?defenceCamearaId=" + data.id);
			} else {
				notify.info("该用户没有布防布控模块的实时视频播放权限，不能设置布防任务！")
			}*/
		},
		/**
		 * 播放实时流
		 * @param elm - 选中的节点元素
		 */
		realStreamPlay: function(elm) {
			var self = this;
			var node = jQuery(elm).closest(".node");
			var data = node.data();

			jQuery(".preview-panel .exit").trigger("click");
			if (self._judgePlaypermission(node)) {
				//如果有视频轮巡
				if (window.inspect) {
					var layout = player.getLayout(),
						freeWindow = window.inspect.groups[0].freeWindow,
						talWin = [];
					for (var i = 0; i < layout; i++) {
						talWin.push(i);
					}
					ocWin = this.difArray(talWin, freeWindow);
					if (ocWin.length === 0) {
						notify.warn("当前正在轮巡，暂无空闲窗口。");
						node.removeClass("selected");
						return;
					}
					//手动获取焦点
					player.manualFocusChannel = ocWin[this.k++];
					if (this.k === ocWin.length) {
						this.k = 0;
					}
					self._realPlay(data, node);
					self._storageHisData(node);
				}
				else {
					self._realPlay(data, node);
					self._storageHisData(node);
				}
			}
		},
		//求出两个数组不同的部分
		difArray:function(a,b){
			var c = [];
			var tmp = a.concat(b);
			var o = {};
			for (var i = 0; i < tmp.length; i ++) (tmp[i] in o) ? o[tmp[i]] ++ : o[tmp[i]] = 1;
			for (var x in o) {
				if (o.hasOwnProperty(x) && o[x] == 1) c.push(x);
			}
			return c;
		},
		/**
		 * 历史播放
		 * @param elm - 选中的节点元素
		 * @param externPlayer - 播放器对象
		 */
		historyStreamPlay: function(elm,externPlayer) {
			/*点击右边查看历史 弹出窗口 事件*/
			var self = this;
			var node = jQuery(elm).closest(".node");
			var data = node.data();
			var ocxplayer = player || externPlayer;
			if (self._judgeHistorypermission(node)) {
				if (window.inspect) {     //所有窗口都在轮巡时不允许查看历史录像
					var layout = ocxplayer.getLayout(),
						freeWindow = window.inspect.groups[0].freeWindow,
						talWin = [];
					for (var i = 0; i < layout; i++) {
						talWin.push(i);
					}
					ocWin = this.difArray(talWin, freeWindow);
					if (ocWin.length === 0) {
						notify.warn("当前正在轮巡，暂无空闲窗口。");
						return;
					}
				}
				var A = ocxplayer.getFreeWindows();
				if (A.length === 0) {
					A.push(0)
				}
				var index = A[0];
				var maxWindowIndex = ocxplayer.curMaxWinChannel;
				console.log("最大屏" + ocxplayer.curMaxWinChannel);
				if (maxWindowIndex !== -1) {
					index = maxWindowIndex;
				}
				ocxplayer.setFocusWindow(index);
				var pobj = {
					index: index,
					data: data,
					player: ocxplayer
				};
				vodHistory.showDialog({
					center: true
				}, pobj);
			}
		},
		/**
		 * 添加到我的分组
		 * @param cameraId - 摄像id
		 * @param parent - 当前元素的父节点
		 */
		appendToGroup: function(cameraId, parent) {
			var self = this,
				$groupwrap = parent.find("#groupwrap");
			if ($groupwrap.length > 0) {
				$groupwrap.toggle();
			} else {
				$groupwrap.remove();
				jQuery.getJSON("/service/video_access_copy/get_custom_group_not_contain?id=" + cameraId + "&r=" + Math.random(), function (res) {
					self._getGrouplist(res.data, parent, function () {
						if (jQuery(".grouplist").find("h2").length) {
							return;
						}
						jQuery(".grouplist").tinyscrollbar({
							thumbSize: 15,
							size: "12"
						});
					});
				});
			}
		},
		/**
		 * 发送到电视墙
		 * @param elm - 选中的节点元素
		 */
		appendTvwall: function(elm) {
			var node = jQuery(elm).closest(".node");
			window.gTvwallArrayGis = [];
			//参数 0：cameracode 1：id 2：name 3：hdchannel 4：sdchannel
			var cameracode = node.attr("data-cameracode").trim();
			var id = node.attr("data-id").trim();
			var name = node.attr("data-name").trim();
			var hdchannel = node.attr("data-hdchannel").trim();
			var sdchannel = node.attr("data-sdchannel").trim();
			window.gTvwallArrayGis = [cameracode, id, name, hdchannel, sdchannel];
			new mouseTip().bindEvents();
			//触发隐藏地图播放栏
			PubSub.publishSync("closeMapVideoBar");
			//初始化并显示电视墙
			tvwall.initData();
			jQuery(".major-reset").css({
				"width": "100%",
				"right": 0
			});
		},
		/**
		 * 加载模板文件
		 * @param tempURL - 地址
		 * @param force - 是否强制读取
		 * @returns {*}
		 * @private
		 */
		_loadTempl: function(tempURL, force) {
			var self = this,
				temp = self.templCache[tempURL];
			if (!temp || force) {
				return jQuery.get(tempURL).then(function(tml) {
					return self.templCache[tempURL] = Handlebars.compile(tml);
				});
			} else {
				return jQuery.Deferred().resolve(temp);
			}
		},
		/**
		 * 获取我的分组列表
		 * @param data - 分组数据
		 * @param parent - 当前元素的父节点
		 * @param callback - 回调
		 * @private
		 */
		_getGrouplist: function (data, parent, callback) {
			var self = this,
				$groupwrap = jQuery("#groupwrap");
			if ($groupwrap.length !== 0) {
				$groupwrap.remove();
			}

			jQuery.when(self._loadTempl(self.URLS.GROUP_LIST)).done(function (tpl) {
				parent.append(tpl(data));
				if (typeof callback === "function") {
					callback();
				}
			});
		},
		/**
		 * 判断是否拥有历史录像查看权限
		 * @param liNode - 当前的节点
		 * @returns {boolean}
		 * @private
		 */
		_judgeHistorypermission: function(liNode) {
			var permissionFlag = permission.stopFaultRightById([liNode.attr("data-id")])[0];
			if (!permission.klass["view-history"]) {
				notify.info("暂无权限访问该摄像头");
				return false;
			}
			if (!permissionFlag) {
				notify.info("暂无权限访问该摄像头");
				return false;
			}
			return true;
		},
		/**
		 * 判断资源权限
		 * @param liNode - 当前的节点
		 * @returns {boolean}
		 * @private
		 */
		_judgePlaypermission: function(liNode) {
			var permissionFlag = permission.stopFaultRightById([liNode.attr("data-id")])[0];
			if (!permission.klass["real-time-view"]) {
				notify.info("暂无权限访问该摄像头");
				return false;
			}
			if (!permissionFlag) {
				notify.info("暂无权限访问该摄像头");
				return false;
			}
			return true;
		},
		/**
		 * 播放实时流
		 * @param data - 待播放的摄像机数据
		 * @param node - 当前节点对象
		 * @private
		 */
		_realPlay: function(data,node) {
			var playStream = function (data) {
				//播放
				player.freePlay({
					"hdChannel": Array.clone(data.hdchannel), //高清通道
					"sdChannel": Array.clone(data.sdchannel), //标清通道
					"cId": data.id,
					"cName": data.name,
					"cType": data.cameratype,
					"cCode": data.cameracode,
					"cStatus": data.cstatus, //摄像机在线离线状态
					//bug【33812】，添加经纬度信息，供录像入视图库时回填使用，by zhangyu on 2015/5/28
					"longitude": data.longitude,
					"latitude": data.latitude
				});
			};
			var getCpuMonitor = function () {
				//进行cup、内存占用临界值进行检测
				if (player && player.playerObj && player.playerObj.GetMemory) {
					try {
						var memoryInfo = JSON.parse(player.playerObj.GetMemory()),
							sysCpuRate = memoryInfo.scpu;
						//check cpu是否超过80%
						console.log("cpu:", memoryInfo);
						return sysCpuRate;
					} catch (e) {
						//由于部分系统API对于获取CPU相关信息出错，此处做差错处理
						return 0;
					}
				}
			};
			//进行cup、内存占用临界值进行检测
			if (getCpuMonitor() >= 80) {
				setTimeout(function () {
					if (getCpuMonitor() >= 80 && Cookie.read("doNotRemindCpu") != "true") {
						//提示用户
						new ConfirmDialog({
							title: "视频打开提示",
							close: false,
							confirmText: "确定",
							message: "系统cpu占用超过80%，继续打开会导致系统卡顿、崩溃，是否继续打开？",
							callback: function () {
								//播放
								playStream(data);
								node.addClass("selected");
								//确定之后不再弹
								Cookie.write("doNotRemindCpu", "true", {
									duration: 365000
								});
							},
							closure: function () {
								node.removeClass("selected");
							}
						});
					} else {
						playStream(data);
						node.addClass("selected");
					}
				}, 500);
			} else {
				//播放
				playStream(data);
				node.addClass("selected");
			}
		},
		/**
		 * 存储历史录像数据
		 * @param liNode - 当前节点对象
		 * @private
		 */
		_storageHisData:function(liNode) {
			var camera = liNode.data();
			window.SelectCamera.Channelid = player.findcamid(camera);
			var text = liNode.find(".text-over").attr("title");
			text = text.replace(/\(\d+\)$/gi, "");
			if (!window.SelectCamera.MenuData) {
				window.SelectCamera.MenuData = {};
			}
			window.SelectCamera.MenuData[text] = camera;
			window.SelectCamera.selectName = text;
		}
	};

	return TreeSubscribe;
});
