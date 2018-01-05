/**
 * 警力调度
 * @author Li Dan
 * @date   2014-12-19
 */
define([
	"js/npmap-new/map-common",
	"js/npmap-new/map-variable",
	"js/npmap-new/map-const",
	"js/npmap-new/view/task-myattention-view",
	"js/npmap-new/map-common-overlayer-ctrl",
	"js/npmap-new/controller/task-myattention-controller"
],function(commonFun, Variable, mapConst, MyAttentionView, MapOverLayerCtrl) {

	var PoliceScheduleView = function (MapInfoWindow) {
		//保存地图信息窗对象
		this.mapInfoWindow = MapInfoWindow;
	};

	PoliceScheduleView.prototype = {
		//地图信息窗对象
		mapInfoWindow: null,
		markerCount: 0,
		//当前标注
		currentMarker: null,
		/**
		 * 处理左侧警力调度按钮的点击事件
		 * @author Li Dan
		 * @date   2014-12-19
		 */
		dealOnPoliceSchedule: function () {
			var self = this;
			//置标记位，标示进入警力调度流程
			Variable.isPoliceSchedule = true;
			//在地图上进行标注
			self.markOnMap();
			//延迟切换图层
			window.setTimeout(function () {
				//切换图层
				MapOverLayerCtrl.showAndHideOverLayers("click-on-map-police-schedule");
			}, 0);
		},
		/**
		 * 在地图上进行标注
		 * @author Li Dan
		 * @date   2014-12-19
		 */
		markOnMap: function () {
			var self = this;
			//注销地图点击事件
			if (NPMapLib.MAP_EVENT_CLICK) {
				Variable.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
			}
			// 添加文字提示
			Variable.map.activateMouseContext("点击左键标记位置，右键退出");
			var style = Variable.map.getMouseContextStyle();
			style.width = "160px";
			style.height = "20px";
			window.notPreventArr = ['markerName', 'markerDescription'];
			this.markerCount++;

			//更新鼠标样式
			window.map.removeHandStyle()
			window.map.setCursor('hand');

			// 添加鼠标跟随图标
			var policeScheduleImg = jQuery("#mapId .map-police-schedule-img");
			//为了解决鼠标移动过快，图片跟随跟不上的问题，在图片上也绑定鼠标移动事件，by zhangyu on 2015/6/25
			jQuery("#mapId > div.olMapViewport, #mapId .map-police-schedule-img").off("mousemove").on("mousemove", function(evt) {
				var position = commonFun.getTooltipPosition(evt);
				policeScheduleImg.css({
					left: (position.left - 6) + "px",
					top: (position.top - 42 + 86) + "px"
				}).show();
			});

			Variable.map.addEventListener(NPMapLib.MAP_EVENT_CLICK, function (point) {
				window.map.addHandStyle();
				// 取消文本提示
				Variable.map.deactivateMouseContext();
				//取消图片跟随
				jQuery("#mapId > div.olMapViewport").unbind("mousemove");
				jQuery("#mapId .map-police-schedule-img").css({
					left: "-2000px",
					top: "-2000px"
				});
				//置标记位，标示退出警力调度流程
				Variable.isPoliceSchedule = false;
				//点位信息
				var position = new NPMapLib.Geometry.Point(point.lon, point.lat);
				//图片标注
				var symbol = mapConst.symbol.markerSymbol();
				//标注
				var marker = new NPMapLib.Symbols.Marker(position);
				marker.setIcon(symbol);
				var attributes = {
					name: "",
					remark: "",
					index: self.markerCount,
					lon: point.lon,
					lat: point.lat,
					isMyAttention: false,
					markerId: ""
				};
				marker.setData(attributes);
				//添加覆盖物
				Variable.layers.markerLayer.addOverlay(marker)
				Variable.currentMarker = marker;
				//显示添加窗口
				self.markerAddWin(position, marker);
				//绑定保存事件
				self.markerAddSave(point, marker);
				//绑定删除事件
				self.markerDelete(marker);
				//绑定marker点击事件
				self.showInfo(marker);
				// 移除点击事件
				Variable.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);

			});
			// 绑定右键取消点击事件
			Variable.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
			Variable.map.addEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK, function (point) {
				// 取消文本提示
				Variable.map.deactivateMouseContext();
				// 取消左键点击事件
				Variable.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
			});
		},
		/**
		 * [markerAddWin 显示添加窗口]
		 * @author Wang Xiaojun
		 * @date   2014-11-03
		 * @param  position [新建的标注的坐标]
		 * @param  marker   [新建的标注]
		 * 这个现实窗口的时候要注意，如果地图上有弹窗，
		 * 则需要关闭弹窗，窗口对象一定要清空。
		 */
		markerAddWin: function (position, marker) {
			var self = this;
			self.mapInfoWindow.showMapInfoWindow({position: position}, "PSAddMarker", function () {
				self.dealOnShowInfoWindow(position, marker);
			});
		},
		/**
		 * 显示信息窗后的页面处理过程
		 * @param position - 当前位置信息
		 * @param marker - 当前标注信息
		 */
		dealOnShowInfoWindow: function(position, marker) {
			var self = this;
			jQuery('#markerX').val(position.lon);
			jQuery('#markerY').val(position.lat);
			self.markerDelete(marker);
			self.markerAddSave(position, marker);
			//添加关注
			MyAttentionView.addToMyAttention(marker);
		},
		/**
		 * 信息窗保存按钮事件后的处理过程
		 * @param position - 当前位置信息
		 * @param marker - 当前标注信息
		 * @param attributes - 属性信息
		 */
		dealOnSaveFromInfowin: function(position, marker, attributes) {
			var self = this;
			// 文字标注
			var label = new NPMapLib.Symbols.Label(attributes.name, {
				offset: new NPMapLib.Geometry.Size(5, -12),
				position: position
			});
			//设置样式
			label.setStyle({
				fontSize: 12, //文字大小
				fontFamily: '宋体', //字体
				color: '#090909', //文字前景色
				align: 'center', //对方方式
				isBold: true //是否粗体
			});
			marker.setLabel(label);
			//触发我的关注相关功能
			if (attributes.isMyAttention === "true") {
				//取消关注
				MyAttentionView.cancelFromMyAttention(marker, "1");
			} else {
				//刷新标记
				marker.refresh();
				//添加关注
				MyAttentionView.addToMyAttention(marker);
			}
			//绑定删除事件
			self.markerDelete(marker);
			//绑定编辑按钮事件
			jQuery(".infowindow-title .btns .marker-edit").click(function () {
				var attributes = {
					name: jQuery('#markerName').val(),
					remark: jQuery('#markerDescription').val(),
					index: parseInt(jQuery('#markerIndex').val()),
					lon: jQuery('#markerX').val(),
					lat: jQuery('#markerY').val(),
					isMyAttention: jQuery("#isMyAttention").val(),
					markerId: jQuery("#markerId").val()
				}
				var position = new NPMapLib.Geometry.Point(attributes.lon, attributes.lat);
				if (attributes.isMyAttention === "true") {
					self.mapInfoWindow.showMapInfoWindow({
							position: position,
							editMarktrue: {
								"attributes": attributes
							}},
						"PSEditTrueAttention",
						function () {
							self.dealOnEditFromInfowin(position, marker, attributes);
						});
				} else {
					self.mapInfoWindow.showMapInfoWindow({
							position: position,
							editMarkfalse: {
								"attributes": attributes
							}},
						"PSEditFalseAttention",
						function () {
							self.dealOnEditFromInfowin(position, marker, attributes);
						});
				}
			});
		},
		/**
		 * 信息窗编辑按钮事件后的处理过程
		 * @param position - 当前位置信息
		 * @param marker - 当前标注信息
		 * @param attributes - 属性信息
		 */
		dealOnEditFromInfowin: function(position, marker, attributes) {
			var self = this;
			if(attributes.isMyAttention === "true") {
				//取消关注
				MyAttentionView.cancelFromMyAttention(marker, "1");
			} else {
				//添加关注
				MyAttentionView.addToMyAttention(marker);
			}
			self.markerEditSave(attributes.index, attributes.lon, attributes.lat, marker);
			//绑定删除事件
			self.markerDelete(marker);
		},
		/**
		 * [markerAddSave 绑定保存事件]
		 * @author Wang Xiaojun
		 * @date   2014-11-03
		 * @param  point         [标注的坐标信息]
		 * @param  marker        [标注的对象]
		 * @param  isMyAttention [是不会已近是关注点，true的话是关注点，false则不是]
		 */
		markerAddSave: function (point, marker, isMyAttention) {
			var self = this;
			jQuery("#mapId").find("#saveMarker").click(function () {
				var name = jQuery("#mapId").find("#markerName").val();
				var remark = jQuery("#mapId").find("#markerDescription").val();
				var isMyAttention = (isMyAttention ? isMyAttention : jQuery("#isMyAttention").val());
				var markerId = jQuery('#markerId').val();
				var attributes = {
					name: name,
					remark: remark,
					index: self.markerCount,
					lon: point.lon,
					lat: point.lat,
					isMyAttention: isMyAttention,
					markerId: markerId
				};
				marker.setData(attributes);
				if (attributes.isMyAttention === "true") {
					Variable.layers.markerLayer.removeOverlay(marker)
					var position = new NPMapLib.Geometry.Point(attributes.lon, attributes.lat);
					//标注
					var marker2 = new NPMapLib.Symbols.Marker(position);
					marker2.setIcon(mapConst.symbol.attentionSymbol());
					marker2.setData(attributes);
					//添加覆盖物
					Variable.layers.myAttentionLayer.addOverlay(marker2);
					// 点击出现弹窗
					self.showInfo(marker2);
					self.markerBusinessWin(attributes, marker2);
				} else {
					self.showInfo(marker);
					self.markerBusinessWin(attributes, marker);
				}
			});
		},
		/**
		 * [showInfo 点击图标显示信息]
		 * @author Wang Xiaojun
		 * @date   2014-11-03
		 * @param  marker [标注对象]
		 */
		showInfo: function (marker) {
			var self = this;
			marker.addEventListener(NPMapLib.MARKER_EVENT_CLICK, function (point) {
				Variable.currentMarker = marker;
				self.markerBusinessWin(marker.getData(), marker);
			});
		},
		/**
		 * [markerEditSave 保存编辑过的标注]
		 * @author Wang Xiaojun
		 * @date   2014-11-03
		 * @param  index  [description]
		 * @param  lon    [修改后标注经度]
		 * @param  lat    [修改后标注纬度]
		 * @param  marker [修改前的标注]
		 * 这个保存的方法主要是重新是修改参数，也要判断是
		 * 不是添加到我的关注的时候，从而渲染不同的模板，如
		 * 果是添加到我的关注的话，就重新new一个标注对象。这
		 * 样做的原因是我的关注和警力调度的图标是不一样的
		 */
		markerEditSave: function (index, lon, lat, marker) {
			var self = this;
			jQuery("#mapId").find("#saveMarker").click(function () {
				var attributes = {
					name: jQuery("#mapId").find("#markerName").val(),
					remark: jQuery("#mapId").find("#markerDescription").val(),
					index: index,
					lon: lon,
					lat: lat,
					isMyAttention: jQuery("#isMyAttention").val(),
					markerId: jQuery('#markerId').val()
				};
				marker.setData(attributes);
				if (attributes.isMyAttention === "true") {
					Variable.layers.markerLayer.removeOverlay(marker)
					var position = new NPMapLib.Geometry.Point(attributes.lon, attributes.lat);
					//标注
					var marker2 = new NPMapLib.Symbols.Marker(position);
					marker2.setIcon(mapConst.symbol.attentionSymbol());
					marker2.setData(attributes);
					//添加覆盖物
					Variable.layers.myAttentionLayer.addOverlay(marker2);
					// 点击出现弹窗
					self.showInfo(marker2);
					self.markerBusinessWin(attributes, marker2);
				} else {
					self.showInfo(marker);
					self.markerBusinessWin(attributes, marker);
					//绑定删除事件
					self.markerDelete(marker);
				}
			});
		},
		/**
		 * [markerDelete 绑定删除事件]
		 * @author Wang Xiaojun
		 * @date   2014-11-03
		 */
		markerDelete: function (markerGraphic) {
			jQuery("#mapId").find("#deleteMarker, .marker-del").click(function () {
				//关闭窗口
				window.infowindow.closeInfoWindow();
				Variable.layers.markerLayer.removeOverlay(markerGraphic);
			});
		},
		/**
		 * [markerBusinessWin 标注的业务窗口]
		 * @author Wang Xiaojun
		 * @date   2014-11-03
		 * @param  attributes [创建标注是的参数对象]
		 * @param  marker     [创建的标注]
		 * 这个窗口的显示是要通过isMyAttention要区分
		 * 的，主要是关注窗口和非关注窗口不一样。true
		 * 是已近添加到我的关注了，false还没有添加到我的关注。
		 */
		markerBusinessWin: function (attributes, marker) {
			var self = this;
			var position = new NPMapLib.Geometry.Point(attributes.lon, attributes.lat);
			if (attributes.isMyAttention === 'true') {
				//显示信息窗
				self.mapInfoWindow.showMapInfoWindow({
					position: position,
					MyAttentiontrue: {
						"attributes": attributes
					}},
					"PSSaveTrueAttention",
					function () {
					self.dealOnSaveFromInfowin(position, marker, attributes);
				});
			} else {
				//显示信息窗
				self.mapInfoWindow.showMapInfoWindow({
						position: position,
						MyAttentionfalse: {
							"attributes": attributes
						}},
					"PSSaveFalseAttention",
					function () {
						self.dealOnSaveFromInfowin(position, marker, attributes);
				});
			}
		}
	};

	return PoliceScheduleView;
});
