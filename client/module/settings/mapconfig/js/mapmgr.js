define(["broadcast", "./config","ajaxModel","./pva-map","npmapConfig","jquery", "handlebars"], function(broadcast, mapSettings, ajaxModel) {
	// 地图管理
	var MapMgr = new Class({

		Implements: [Options],

		drawToolbar: null,
		
		pType:null, //标记点位添加或修改状态

		options: {
			tmpUrl: "/module/settings/mapconfig/inc/map-fragment-angle.html",
			cameraLayer: null,
			drawtool: "",
			_maxAngle:359,
			_minAngle:0,
			_stepAngle:1
		},
		initialize: function(options) {
			debugger
			this.options.drawtool = new NPMapLib.Tools.DrawingTool(PVAMap.options.map.id);
			this.setOptions(options);
			this.loadTmp();
			this.bindToolBarEvent();
			this.addLayers();
		},
		/*
		 *	加载模板
		 */
		loadTmp: function() {
			debugger
			var self = this;
			ajaxModel.getTml(self.options.tmpUrl).then(function(res){
				self.addHelper();
				self.template = Handlebars.compile(res);
			});
		},
		/*
		 *	添加助手
		 */
		addHelper: function() {
			 Handlebars.registerHelper('showCode', function(value) {
                return value !== "" ? "("+ value +")" :"";
            });

			Handlebars.registerHelper('angleformat', function(value) {
                return value ==="undefined"?0:parseInt(value);
            });
		},
		/**
		 * 添加地图
		 */
		addLayers: function() {
			var self = this;
			self.options.cameraLayer = new NPMapLib.Layers.OverlayLayer("camera-point");
			// 依赖PVAMap 它是window下的一个属性--全局变量
			PVAMap.options.map.addLayer(self.options.cameraLayer);
		},
		/* 关闭弹窗 */
		bindInfoWindowEvent: function() {
			var self = this;
			jQuery("#npgis .infowindow-title  i.closeBtn,#cancelMark").unbind("click").bind("click", function() {
				PVAMap.options.infowindow.close();
				PVAMap.options.infowindow = null;
				PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
				self.options.cameraLayer.removeAllOverlays();
				//取消则重置reMark
				window.reMark = 0;
			});
		},

		/* 角度拖动事件绑定 */
		bindChangeAngleEvent:function(){
			var self = this;
			//模拟range(拖动角度条同步input)
			$('.all-contro').off().on('mousedown',".range-btn",function(evt) {
				evt.stopPropagation();
				var ex = $(this)[0].offsetLeft,
					dx = evt.clientX;
				var totalLength = $(".range-div").width()-18;
				var rate = 360 / totalLength;
				$('.all-contro').off("mousemove").on('mousemove',function(e) {
					var len = ex + e.clientX - dx;
					if (len >= 0 && len <= totalLength) {
						$('.range-btn').css('left', len + 'px')
						$('.range-color').width(len);
						$('#angle').val(parseInt(len*rate));
					}
				}).on('mouseup',function(e) {
					$(this).off("mousemove");				});
			});
			//模拟range(input同步拖动角度条)
			$('#angle').on('input', function() {
				var val = $(this).val(),
					num = parseInt(val);

				var totalLength = $(".range-div").width()-18;
				var rate = 360/totalLength;

				if (!/^\d+$/g.test(val) || num < 0 || num >= 360) {
					notify.warn('必须输入0-359之间的数字！')
					$(this).val(val.replace(/\D+/g, ''));
				} else {
					val = parseInt(val / rate);
					$('.range-btn').css('left', val + 'px')
					$('.range-color').width(val);
				}
			});

			//鼠标滚轮监听
			$('#angle').on("mousewheel DOMMouseScroll", function(e) {
				var totalLength = $(".range-div").width()-18;
				var rate = 360/totalLength;

				var _ele = jQuery(this);
				var val = jQuery(this).val() - 0;
				if (e.type === "mousewheel") {
					var p = e.originalEvent.wheelDelta / 120;
				} else if (e.type === "DOMMouseScroll") {
					var p = e.originalEvent.detail * (-1) / 3;
				}
				destination = val + self.options._stepAngle * p;

				if (destination === (self.options._maxAngle + 1)) {
		            destination = self.options._minAngle;
		        }
		        if (destination === (self.options._minAngle - 1)) {
		            destination = self.options._maxAngle;
		        }

				setTimeout(function(){
					var eleValue = destination;
					_ele.val(eleValue);

					var val = parseInt(eleValue/rate);
					$('.range-btn').css('left', val + 'px')
					$('.range-color').width(val);

				},50);
			});

			//模拟range(点击加1)
			$('.up-down .up').on('click', function() {
				var val = parseInt($('#angle').val());
				if (val >= 0 && val < 359) {
					var totalLength = $(".range-div").width()-18;
					var rate = 360/totalLength;

					$('#angle').val(val + 1);
					val = parseInt(val/rate);
					$('.range-btn').css('left', val + 1 + 'px')
					$('.range-color').width(val + 1);
				}
			});
			//模拟range(点击减1)
			$('.up-down .down').on('click', function() {
				var val = parseInt($('#angle').val());
				if (val >= 1 && val <= 359) {
					var totalLength = $(".range-div").width()-18;
					var rate = 360/totalLength;
					$('#angle').val(val - 1);
					val = parseInt(val/rate);
					$('.range-btn').css('left', val - 1 + 'px')
					$('.range-color').width(val - 1);
				}
			})
		},
		/* 绑定地图工具栏相关事件 */
		bindToolBarEvent: function() {
			var self = this;
			// 全屏
			jQuery("#gismap .map-tool a.map-tool-fullscreen").click(function() {
				jQuery("#gismap .map-tool a.map-tool-exitfullscreen").show();
				jQuery(this).hide();
				self.fullscreen();
			});

			// 退出全屏
			jQuery("#gismap .map-tool a.map-tool-exitfullscreen").click(function() {
				jQuery(this).hide();
				jQuery("#gismap .map-tool a.map-tool-fullscreen").show();
				self.exitFullscreen();
			});
		},
		/*
		 *	经纬度验证
		 */
		validateCoord: function(camera) {
			var pattern = /^[1-9](\d){0,2}[.]?(\d)*$/;
			if (pattern.test(camera.lon) && pattern.test(camera.lat) && camera.lon !== "" && camera.lat !== "" && parseInt(Math.abs(camera.lat),10) <= 90 && parseInt(Math.abs(camera.lon),10) <= 180) {
				return true;
			}
			return false;
		},
		/*
		 *	显示坐标
		 */
		showMark: function(lon, lat) {
			var self = this;
			// 判断是否有点击事件，有的话取消。
			if (NPMapLib.MAP_EVENT_CLICK) {
				PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
			}
			if (lon !== "" && lat !== "") {
				self.options.cameraLayer.removeAllOverlays();
				var position = new NPMapLib.Geometry.Point(lon, lat);
				//图片标注
				var symbol = new NPMapLib.Symbols.Icon("/module/common/images/map/map-marker.png", new NPMapLib.Geometry.Size(26, 29));
				//标注
				var marker = new NPMapLib.Symbols.Marker(position);
				marker.setIcon(symbol);
				//添加覆盖物
				self.options.cameraLayer.addOverlay(marker);
				// 把这个设置为中心点
				PVAMap.options.map.centerAndZoom(position, PVAMap.options.map.getZoom());
			} else {
				self.options.cameraLayer.removeAllOverlays();
			}

		},

		//获取左下方标注的用户信息
		getMarkInfo:function(id){
			var self = this;
			debugger
		$.ajax({
			type:"get",
			dataType:"json",
			async: false,
			url : "/service/map/history/searchByCameraId?cameraId="+id,
			success:function(res){
				if(res.code === 200){
					debugger
					if(res.data){
						window.mDate=res.data.date;
						window.mOrgName=res.data.orgName;
						window.mUserName=res.data.userName;
					}
				}else{
					//notify.warn("获取标注的用户信息失败");
				}
			}
		});

	    },

		/*
		 *	显示摄像机
		 */
		showCamera: function(camera, el) {
			debugger
			var self = this;
			self.getMarkInfo(camera.id);
			self.options.cameraLayer.removeAllOverlays();
			var position = new NPMapLib.Geometry.Point(camera.lon, camera.lat);
			//图片标注
			var symbol = new NPMapLib.Symbols.Icon("/module/common/images/map/map-marker.png", new NPMapLib.Geometry.Size(26, 29));
			//标注
			var marker = new NPMapLib.Symbols.Marker(position);
			marker.setIcon(symbol);
			marker.setData(camera);
			//添加覆盖物
			self.options.cameraLayer.addOverlay(marker);
			var content = self.template({
				"cameraLocationPanel": {
					"name": camera.name,
					"code":camera.cameraCode,
					"longitude": mapSettings.float8(camera.lon),
					"latitude": mapSettings.float8(camera.lat),
					"angle": parseInt(camera.angle),
					"date": window.mDate,
					"orgName": window.mOrgName,
					"userName": window.mUserName
				}
			});
			//窗口参数
			var opts = {
				width: 454, //信息窗宽度，单位像素
				height: 326, //信息窗高度，单位像素
				offset: new NPMapLib.Geometry.Size(-7, -42), //信息窗位置偏移值
				arrow: false,
				positionBlock: {
					offset: new NPMapLib.Geometry.Size(-(452 / 2 - 8), 12),
					paddingY: 13, // 小箭头Y轴偏移量 一般为小箭头的高度
					imageSrc: '/module/common/images/map/arr.png', // 小箭头地址
					imageSize: { // 小箭头图片大小
						width: 16,
						height: 12
					}
				},
				autoSize: false
			};

			if (PVAMap.options.infoWindow) {
				PVAMap.options.infowindow.close();
				PVAMap.options.infowindow = null;
			}
			window.setTimeout(function(){
				PVAMap.addInfoWindow(position, '', content, opts);
				PVAMap.options.infowindow.open();
				PVAMap.options.map.setCenter(position);
				window.mDate = "";
				window.mOrgName = "";
				window.mUserName = "";
				// 权限控制
				permission && permission.reShow();
				self.bindInfoWindowEvent();
				self.bindCreateMarkEvent(camera, el);
				self.bindDeleteMarkEvent(camera, el);
				self.bindChangeAngleEvent();
				self.initRangeBar(camera.angle);
			}, 0);

			// 系统配置-地图配置-地图标注
			// settings:{
			// 	// 地图标注默认放大级别
			// 	markZoom:4      // 这个根据实际情况进行配置
			// },
			// 如果mapConfig中没有没有此配置段，请添加上
			if(PVAMap.options.map.getZoom() < mapConfig.settings.markZoom){
				PVAMap.options.map.centerAndZoom(position,mapConfig.settings.markZoom);
			}else{
				PVAMap.options.map.setCenter(position)
			}

			// 放大缩小事件  当前图层发生变化，设置到中心点。
			if(NPMapLib.MAP_EVENT_ZOOM_END){
				PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_ZOOM_END);
			}
			// 点击事件
			if(NPMapLib.MAP_EVENT_CLICK){
				PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
			}

			/**
			 * 同步上来的摄像机不可编辑坐标 ，需清楚之前的点击事件
			 * @author chencheng
			 * @date   2015-03-12
			 */
			if(camera.isSynced){
				// 隐藏保存取消按钮
				jQuery('.permission-maker-camera-point').hide();
				return;
			}

			PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_ZOOM_END, function(zoomLevel) {
				PVAMap.options.map.centerAndZoom(position, zoomLevel)
			});

			PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_CLICK, function(point) {
				self.options.cameraLayer.removeAllOverlays();
				var position1 = new NPMapLib.Geometry.Point(point.lon, point.lat);
				camera.lon = point.lon;
				camera.lat = point.lat;
				//图片标注
				var newsymbol = new NPMapLib.Symbols.Icon("/module/common/images/map/map-marker.png", new NPMapLib.Geometry.Size(26, 29));
				//标注
				var newmarker = new NPMapLib.Symbols.Marker(position1);
				var newcamera = {
					"id": camera.id,
					"name": camera.name,
					"lon": point.lon,
					"lat": point.lat
				}
				newmarker.setIcon(newsymbol);
				newmarker.setData(newcamera);
				//添加覆盖物
				self.options.cameraLayer.addOverlay(newmarker);
				var newcontent = self.template({
					"cameraLocationPanel": {
						"name": camera.name,
						"code":camera.cameraCode,
						"longitude": mapSettings.float8(point.lon),
						"latitude": mapSettings.float8(point.lat),
						"angle": parseInt(camera.angle)
					}
				});
				//窗口参数
				var newopts = {
					width: 454, //信息窗宽度，单位像素
					height: 326, //信息窗高度，单位像素
					offset: new NPMapLib.Geometry.Size(-7, -42), //信息窗位置偏移值
					arrow: false,
					positionBlock: {
						offset: new NPMapLib.Geometry.Size(-(452 / 2 - 8), 12),
						paddingY: 13, // 小箭头Y轴偏移量 一般为小箭头的高度
						imageSrc: '/module/common/images/map/arr.png', // 小箭头地址
						imageSize: { // 小箭头图片大小
							width: 16,
							height: 12
						}
					},
					autoSize: false
				};
				PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_ZOOM_END, function(zoomLevel) {
					PVAMap.options.map.centerAndZoom(position1, zoomLevel)
				});
				if (PVAMap.options.infoWindow) {
					PVAMap.options.infowindow.close();
					PVAMap.options.infowindow = null;
				}
				// 添加window提示框
				PVAMap.addInfoWindow(position1, '', newcontent, newopts);
				PVAMap.options.infowindow.open();
				// 权限控制
				permission && permission.reShow();

				// 当前图层发生变化，设置到中心点。
				self.bindInfoWindowEvent();
				self.bindCreateMarkEvent(camera, el);
				self.bindDeleteMarkEvent(camera, el);
				self.bindChangeAngleEvent();
				self.initRangeBar(camera.angle);
			});
			// 藏掉跟随图标
			// 	jQuery("#follower").hide();
		},
		//初始化rangeBar
		initRangeBar : function(val){
			var totalLength = $(".range-div").width()-18;
			var rate = 360/totalLength;
			var val = parseInt(parseInt(val) / rate);
			$('.range-btn').css('left', val + 'px')
			$('.range-color').width(val);
		},
		/* 绑定删除经纬度 */
		bindDeleteMarkEvent: function(data, el){
			//已经标注过的摄像机，不显示保存，只显示重新标注
			/*
			if(window.alreadyMarked == 1){
				jQuery("#saveMark").hide();
				window.alreadyMarked = 0;
			}else{
				jQuery("#saveMark").show();
			}
			*/
			var self = this;
			jQuery(".infowindow-title .deleteBtn").unbind("click").bind("click",function() {
				var camera = {
					"cameraId": data.id,
					"zoom":PVAMap.options.map.getZoom(),
					"name":jQuery("#gismap .infowindow-title .mark-name").text()
				};
				if (camera.cameraId) {
					self.deleteCamera(camera, function() {
						PVAMap.options.infowindow.close();
						PVAMap.options.infowindow = null;
						PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
						// self.map.infoWindow.hide();
						// dojo.disconnect(self.clickHandler);
						el.removeAttr("data-lon").removeAttr("data-lat").removeAttr("data-angle");
						// 更新图标
						var iEl = el.children("i.camera-style");
						// 球机
						if (iEl.hasClass("dom")) {
							if (iEl.hasClass("dom-marked")) {
								iEl.removeClass("dom-marked");
							}
						} else {
							// 枪机
							if (iEl.hasClass("marked")) {
								iEl.removeClass("marked");
							}
						}
						self.showMark(camera.lon, camera.lat);
						jQuery("content").unbind("mousemove").unbind("mousedown");
					});
				} else {
					notify.warn("网络异常");
				}
			});
		},
		/* 隐藏图层上的信息 */
		hideInfo: function() {
			var self = this;
			self.options.cameraLayer.removeAllOverlays();
		},
		/*
		 *	保存摄像机坐标
		 */
		bindCreateMarkEvent: function(data, el) {
			debugger
			var self = this;
			jQuery("#gismap .location-box.add-location #saveMark").unbind("click").bind("click",function() {
				var nType = 1
				if(window.reMark == 1){
					nType = 2;
					window.reMark = 0;
				}
				var angle = jQuery("#gismap .location-box #angle").val().trim();
				var camera = {
					"type":nType,
					"cameraId": data.id,
					"lon": jQuery("#gismap .location-box #longitude").val().trim(),
					"lat": jQuery("#gismap .location-box #latitude").val().trim(),
					"angle":angle===""?0:angle,
					"zoom":PVAMap.options.map.getZoom(),
					"name":jQuery("#gismap .infowindow-title .mark-name").text()
				};
				// var camera = {
				// 	"cameraId": data.id,
				// 	"lon": jQuery("#gismap .location-box #longitude").val().trim(),
				// 	"lat": jQuery("#gismap .location-box #latitude").val().trim()
				// };
				if (self.validateCoord(camera)) {
					self.saveCamera(camera, function() {
						PVAMap.options.infowindow.close();
						PVAMap.options.infowindow = null;
						PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
						// self.map.infoWindow.hide();
						// dojo.disconnect(self.clickHandler);
						el.attr("data-lon", camera.lon).attr("data-lat", camera.lat).attr("data-angle", camera.angle);
						// 更新图标
						var iEl = el.children("i.camera-style");
						// 球机
						if (iEl.hasClass("dom")) {
							if (!iEl.hasClass("dom-marked")) {
								iEl.addClass("dom-marked");
							}
						} else {
							// 枪机
							if (!iEl.hasClass("marked")) {
								iEl.addClass("marked");
							}
						}
						self.showMark(camera.lon, camera.lat);
						jQuery("content").unbind("mousemove").unbind("mousedown");
					});
				} else {
					notify.warn("经纬度输入有误！");
				}
			});
             //点击重新标注
			jQuery("#gismap .location-box.add-location #againMark").unbind("click").bind("click",function() {
				debugger
				//弹出窗口消失
				if (PVAMap.options.infowindow) {
					PVAMap.options.infowindow.close();
					PVAMap.options.infowindow = null;
				}
				// 清除缩放事件
				if(NPMapLib.MAP_EVENT_ZOOM_END){
					PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_ZOOM_END);
				}
				// 清除点击事件
				if (NPMapLib.MAP_EVENT_CLICK) {
					PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
				}
				// 地图的点击事件
				PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_CLICK, function(point) {
					//获取当前地图层级数
					var currentZoom = PVAMap.options.map.getZoom();
					if(currentZoom != 19){
						notify.info("请把地图放到最大后，再进行标注操作");
						return;
					}
					// 取消右击事件
					PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
					self.options.cameraLayer.removeAllOverlays();
					var position = new NPMapLib.Geometry.Point(point.lon, point.lat);
					//图片标注
					var symbol = new NPMapLib.Symbols.Icon("/module/common/images/map/map-marker.png", new NPMapLib.Geometry.Size(26, 29));
					//标注
					var marker = new NPMapLib.Symbols.Marker(position);
					marker.setIcon(symbol);
					marker.setData(data);
					//添加覆盖物
					var currTime = Toolkit.getCurDateTime();
					console.log("currTime:"+currTime);
					self.options.cameraLayer.addOverlay(marker);
					var content = self.template({
						"cameraLocationPanel": {
							"name": data.name,
							"code":data.cameraCode,
							"longitude": mapSettings.float8(point.lon),
							"latitude": mapSettings.float8(point.lat),
							"angle": parseInt(point.angle),
							"currTime": currTime
						}
					});
					//窗口参数
					var opts = {
						width: 454, //信息窗宽度，单位像素
						height: 256, //信息窗高度，单位像素
						offset: new NPMapLib.Geometry.Size(-7, -42), //信息窗位置偏移值
						arrow: false,
						positionBlock: {
							offset: new NPMapLib.Geometry.Size(-(452 / 2 - 8), 12),
							paddingY: 13, // 小箭头Y轴偏移量 一般为小箭头的高度
							imageSrc: '/module/common/images/map/arr.png', // 小箭头地址
							imageSize: { // 小箭头图片大小
								width: 16,
								height: 12
							}
						},
						autoSize: false
					};

					if (PVAMap.options.infoWindow) {
						PVAMap.options.infowindow.close();
						PVAMap.options.infowindow = null;
					}
					PVAMap.addInfoWindow(position, '', content, opts);
					PVAMap.options.infowindow.open();
					// 权限控制
					permission && permission.reShow();
					self.pType = 'add';
					self.bindInfoWindowEvent();
					self.bindCreateMarkEvent(data, el);
					self.bindDeleteMarkEvent(data, el);
					self.bindChangeAngleEvent();
					self.initRangeBar(point.angle);
					// 藏掉跟随图标
					jQuery("#follower").hide();
					//隐藏重新标注图标
					jQuery("#againMark").hide();
					//隐藏左下方的标注时间，标注人，标注人所属组织
					jQuery("#markInfo").hide();
					//标记是重新标注的
					window.reMark = 1;
				});
				//地图上显示小图标
				var follower = jQuery("#follower");
				var className = "drag-helper-icon-alt";
				if (follower.length === 0) {
					follower = jQuery("<div id='follower' class='" + className + "'></div>");
					jQuery("body").append(follower);
				}
				follower.css({
					"top": event.clientY + 12,
					"left": event.clientX + 12
				}).show();
				jQuery("#content").unbind("mousemove").bind("mousemove",function(evt) {
					follower.css({
						"top": evt.clientY + 12,
						"left": evt.clientX + 12
					});
				});
			});
		},
		/*
		 *	保存摄像机坐标信息
		 */
		saveCamera: function(camera, callback) {
			var self = this;
			ajaxModel.postData("/service/map/update_camera_point", camera).then(function(res){
				if (res.code === 200) {					
					notify.success("标注成功！");
					if(self.pType === 'add'){ //仅在新增标注时写入日志
						logDict.insertLog('m3', 'f9', 'o2', '', "地图上标注 " + camera.name + " 摄像机");
					}					
					callback();
				} else {
					notify.warn("标注失败！");
				}
			});
		},
		/*
		 *	删除摄像机坐标信息
		 */
		deleteCamera: function(camera, callback) {
			var self = this;
			ajaxModel.postData("/service/map/delete_camera_point", camera).then(function(res){
				if (res.code === 200) {					
					notify.success("删除成功！");		
					callback();
				} else {
					notify.warn("删除失败！");
				}
			});
		},
		/*
		 *	添加摄像机
		 */
		addCamera: function(data, el) {
			var self = this;
			// 清空图层
			self.options.cameraLayer.removeAllOverlays();
			if (PVAMap.options.infowindow) {
				PVAMap.options.infowindow.close();
				PVAMap.options.infowindow = null;
			}

			// 清除缩放事件
			if(NPMapLib.MAP_EVENT_ZOOM_END){
				PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_ZOOM_END);
			}
			// 清除点击事件
			if (NPMapLib.MAP_EVENT_CLICK) {
				PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
			}
			// 地图的点击事件
			PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_CLICK, function(point) {
				//获取当前地图层级数
				var currentZoom = PVAMap.options.map.getZoom();
				if(currentZoom != 19){
					notify.info("请把地图放到最大后，再进行标注操作");
					return;
				}
				// 取消右击事件
				PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
				self.options.cameraLayer.removeAllOverlays();
				var position = new NPMapLib.Geometry.Point(point.lon, point.lat);
				//图片标注
				var symbol = new NPMapLib.Symbols.Icon("/module/common/images/map/map-marker.png", new NPMapLib.Geometry.Size(26, 29));
				//标注
				var marker = new NPMapLib.Symbols.Marker(position);
				marker.setIcon(symbol);
				marker.setData(data);
				//添加覆盖物
				self.options.cameraLayer.addOverlay(marker);
				var content = self.template({
					"cameraLocationPanel": {
						"name": data.name,
						"code":data.cameraCode,
						"longitude": mapSettings.float8(point.lon),
						"latitude": mapSettings.float8(point.lat),
						"angle": parseInt(point.angle)
					}
				});
				//窗口参数
				var opts = {
					width: 454, //信息窗宽度，单位像素
					height: 256, //信息窗高度，单位像素
					offset: new NPMapLib.Geometry.Size(-7, -42), //信息窗位置偏移值
					arrow: false,
					positionBlock: {
						offset: new NPMapLib.Geometry.Size(-(452 / 2 - 8), 12),
						paddingY: 13, // 小箭头Y轴偏移量 一般为小箭头的高度
						imageSrc: '/module/common/images/map/arr.png', // 小箭头地址
						imageSize: { // 小箭头图片大小
							width: 16,
							height: 12
						}
					},
					autoSize: false
				};

				if (PVAMap.options.infoWindow) {
					PVAMap.options.infowindow.close();
					PVAMap.options.infowindow = null;
				}
				PVAMap.addInfoWindow(position, '', content, opts);
				PVAMap.options.infowindow.open();
				// 权限控制
				permission && permission.reShow();
				self.pType = 'add';
				self.bindInfoWindowEvent();
				self.bindCreateMarkEvent(data, el);
				self.bindDeleteMarkEvent(data, el);
				self.bindChangeAngleEvent();
				self.initRangeBar(point.angle);
				// 藏掉跟随图标
				jQuery("#follower").hide();
				//隐藏重新标注图标
				jQuery("#againMark").hide();
				//隐藏左下方的标注时间，标注人，标注人所属组织
				jQuery("#markInfo").hide();
			});
		},
		/*
		 *	全屏
		 */
		fullscreen: function() {
			var self = this;
			window.top.showHideNav("hide");
			// jQuery(window.parent.document).contents().find("#navigator,#header").hide();
			//jQuery("#navigator,#header").hide();
			jQuery("#sidebar").hide();
			jQuery("#content .wrapper").css("top", "0px");
			jQuery(window.parent.document).contents().find("#pva-iframe, .iframe").css('top',0)			
			jQuery("#major").css({
				top: "0px",
				left: "0px"
			});
			jQuery("#sidePage").hide();
			jQuery("#importBtn").removeClass("disabled");
			PVAMap.options.map.updateSize();
		},
		/*
		 *	退出全屏
		 */
		exitFullscreen: function() {
			var self = this;
			// songxj update
			broadcast.emit("dealFullScreen", {"fullscreenFlag": false});
			//jQuery("#navigator,#header").show();

			jQuery("#sidebar").show();
			//jQuery("#content .wrapper").css("top", "86px");
			jQuery("#major").css({
				top: "10px",
				left: jQuery("#sidebar").width()
			});
			PVAMap.options.map.updateSize();
		},

		/* 根据坐标值在地图上显示多边形 */
		showPolygon: function(data, color, zoom) {
			var self = this;
			PVAMap.options.map.clearOverlays();
			self.options.cameraLayer.removeAllOverlays();
			if (PVAMap.options.infowindow) {
				PVAMap.options.infowindow.close();
				PVAMap.options.infowindow = null;
			}
			var geoData = JSON.parse(data);
			var len = geoData.coordinates[0].length;
			var point = [];
			for (var i = 0; i < len; i++) {
				point.push(new NPMapLib.Geometry.Point(geoData.coordinates[0][i][0], geoData.coordinates[0][i][1]));
			}
			var polygon = new NPMapLib.Geometry.Polygon(point, {
				color: color, //颜色
				fillColor: "#6980bc", //填充颜色
				weight: 2, //宽度，以像素为单位
				opacity: 0.8, //透明度，取值范围0 - 1
				fillOpacity: 0.5 //填充的透明度，取值范围0 - 1
			});
			PVAMap.options.map.addOverlay(polygon);
			if (zoom === "") {
				PVAMap.options.map.centerAndZoom(new NPMapLib.Geometry.Point(geoData.coordinates[0][0][0], geoData.coordinates[0][0][1]), zoom);
			} else {
				PVAMap.options.map.centerAndZoom(new NPMapLib.Geometry.Point(geoData.coordinates[0][0][0], geoData.coordinates[0][0][1]), zoom);
			}
			// 地图的缩放事件让面积图形的一个点作为中心点
			PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_ZOOM_END, function(zoomLevel) {
					PVAMap.options.map.centerAndZoom(new NPMapLib.Geometry.Point(geoData.coordinates[0][0][0],geoData.coordinates[0][0][1]), zoomLevel)
			});
		},
		/* 画多边形 */
		drawCover: function(lineColor, event) {
			var self = this;
			PVAMap.options.map.clearOverlays();
			if (PVAMap.options.infowindow) {
				PVAMap.options.infowindow.close();
				PVAMap.options.infowindow = null;
			}
			self.options.cameraLayer.removeAllOverlays();
			self.options.drawtool.setMode(NPMapLib.DRAW_MODE_POLYLGON, self.callBackMethod);
			PVAMap.options.map.activateMouseContext("单击开始绘制，双击结束，右键取消绘制");
			// 绑定右键取消点击事件
			PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
			PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK, function(point) {
				// 取消文本提示
				PVAMap.options.map.deactivateMouseContext();
				// 取消左键点击事件
				PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
				self.options.drawtool.cancel()
			});
		},
		callBackMethod: function(result, geometry) {
			var self = this;
			geometry._color = mapSettings.lineColor;
			geometry._fillColor = "#6980bc";
			geometry._opacity = 0.8;
			var points = geometry._points;
			PVAMap.options.map.deactivateMouseContext();
			PVAMap.options.map.addOverlay(geometry);
			var units = "m";
			mapSettings.polygonArea = geometry.getArea(units).toFixed(3);
			mapSettings.polygonPoints = PVAMap.convertArrayToGeoJson(geometry._points, "Polygon");

		},
		/* 获取多边形的面积 */
		getPolygonArea: function() {
			return mapSettings.polygonArea ? mapSettings.polygonArea : 0;
		},
		// 获取坐标
		getPolygonPoints: function() {
			return mapSettings.polygonPoints;
		},
		getZoom: function(argument) {
			return PVAMap.options.map.getZoom();
		}
	});

	return MapMgr;
});
