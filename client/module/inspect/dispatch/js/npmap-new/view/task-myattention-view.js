/**
 * Created by Zhangyu on 2015/4/27.
 */
define([
	"js/npmap-new/map-variable",
	"js/npmap-new/map-common",
	"js/npmap-new/map-const",
	"jquery"
], function (Variable, MapCommon, MapConst, jQuery) {

	return (function (scope, $) {
		var //左侧列表控制器
			_leftPanel = null,
			//控制器对象
			_controller = null,
			//地图信息窗对象
			_mapInfoWindow = null
			//当前关注点
			_curAttentionMark = null;

		/**
		 * 显示当前关注点的位置
		 * @param data - 关注点信息
		 */
		scope.showAttentionMark = function(data, leftPanel) {
			//保存左侧列表控制器
			_leftPanel = leftPanel;
			//清空地图环境
			if (_curAttentionMark) {
				Variable.layers.myAttentionLayer.removeOverlay(_curAttentionMark);
			}
			Variable.layers.myAttentionLayer.show();
			// 根据经纬度new一个点位
			var Point = new NPMapLib.Geometry.Point(data.lon, data.lat);
			var symbol = MapConst.symbol.attentionSymbol();
			//缩放地图到指定层级
			if (data.zoom) {
				Variable.map.centerAndZoom(Point, data.zoom);
			} else {
				Variable.map.setCenter(Point);
			}
			//标注
			_curAttentionMark = new NPMapLib.Symbols.Marker(Point);
			_curAttentionMark.setIcon(symbol);
			// 储存数据在这个标注上，当点击标注的时候可以直接从这个标注上取数据。
			_curAttentionMark.setData(data);
			// 把这个标注添加到关注图层上
			Variable.layers.myAttentionLayer.addOverlay(_curAttentionMark);
			_curAttentionMark.addEventListener(NPMapLib.MARKER_EVENT_CLICK,function(marker){
				//显示信息窗
				_mapInfoWindow.showMapInfoWindow({
					position: marker.getPosition(),
					MyAttentiontrue: {
						"attributes": marker.getData()
					}}, "PSSaveTrueAttention",
					function () {
						$(".infowindow-title .btns .marker-edit, .infowindow-title .btns .marker-del").hide();
						//绑定事件
						scope.cancelFromMyAttention(marker, "");
					});
			});
			//显示信息窗
			_mapInfoWindow.showMapInfoWindow({
				position: Point,
				MyAttentiontrue: {
					"attributes": data
				}}, "PSSaveTrueAttention",
				function () {
					$(".infowindow-title .btns .marker-edit, .infowindow-title .btns .marker-del").hide();
					//绑定事件
					scope.cancelFromMyAttention(_curAttentionMark, "");
				});
		};
		/**
		 * 绑定取消关注按钮事件
		 * @param marker - 当前地图上的marker对象
		 * @param type - 操作类型
		 */
		scope.cancelFromMyAttention = function(marker, type) {
			$("#cancelFromMyAttention").off("click").click(function() {
				var id = $('#markerId').val();
				//取消某个关注
				_controller.cancelFromMyAttention({id: id, marker: marker, type: type});
			});
		};
		/**
		 * 设置取消掉的关注
		 * @param marker - 删除的地图关注对象
		 * @param type - 操作类型
		 */
		scope.setCancelMarkerFromMyAttention = function(marker, type) {
			//重新刷新加载列表
			_leftPanel && _leftPanel.refreshOnCancel(marker);
			//清空掉我的关注图层
			Variable.layers.myAttentionLayer.removeAllOverlays();
			//重新绑定添加关注事件
			$("#isMyAttention").val("false");
			$(".infowindow-title .btns .my-attention-ico-cancel").attr("id", "AddToMyAttention").removeClass("my-attention-ico-cancel").addClass("my-attention-ico");
			//添加到我的关注
			if (marker) {
				var attributes = {
					name: $('#markerName').val(),
					remark: $('#markerDescription').val(),
					index: parseInt($('#markerIndex').val()),
					lon: $('#markerX').val(),
					lat: $('#markerY').val(),
					isMyAttention: $("#isMyAttention").val(),
					markerId: $("#markerId").val()
				}
				//关闭窗口
				window.infowindow.closeInfoWindow();
				marker.setData(attributes);
				if (type === "1") {
					var position = new NPMapLib.Geometry.Point(attributes.lon, attributes.lat);
					var label = marker.getLabel();
					//设置偏移量
					label.setOffset(new NPMapLib.Geometry.Size(5, -12));

					Variable.layers.markerLayer.removeOverlay(marker)

					label.setPosition(position);
					//图片标注
					var symbol = MapConst.symbol.markerSymbol();
					var marker2 = new NPMapLib.Symbols.Marker(position);
					marker2.setIcon(symbol);
					marker2.setData(attributes);
					marker2.setLabel(label);
					//添加覆盖物
					Variable.layers.markerLayer.addOverlay(marker2);
					require(['js/npmap-new/view/task-police-schedule-view'], function(PoliceScheduleView){
						(new PoliceScheduleView(_mapInfoWindow)).showInfo(marker2);
					});
				}
				scope.addToMyAttention(marker);
			}
		};

		/**
		 * [addToMyAttention 添加到我的关注]
		 * @author Wang Xiaojun
		 * @date   2014-11-03
		 * @param  marker [点击添加到我的关注的标注对象]
		 * 这个就是重新组装数据，重新new一个标注，改变图片
		 * 标注，把组装好的数据赋给新的标注。
		 */
		scope.addToMyAttention= function(marker) {
			$("#AddToMyAttention").off("click").click(function() {
				var name = $('#markerName').val();
				var description = $('#markerDescription').val();
				var x = $('#markerX').val();
				var y = $('#markerY').val();
				var zoom = Variable.map.getZoom();
				if (name) {
					//发布请求 添加到我的关注
					var data = {
						name: name,
						description: description,
						x: x,
						y: y,
						zoom: zoom,
						marker: marker
					};
					//保存我的关注
					_controller.addToMyAttention(data);
				} else {
					notify.warn("请填写关注名称！");
				}
			});
		};

		/**
		 * 设置添加的我的关注
		 * @author Li Dan
		 * @date   2014-12-18
		 */
		scope.setMarkerToMyAttention = function(data, marker) {
			//刷新地图信息窗
			$(".infowindow-title .btns .my-attention-ico").attr("id", "cancelFromMyAttention").removeClass("my-attention-ico").addClass("my-attention-ico-cancel").attr("title", "取消关注");
			$('#markerId').val(data.id);
			$('#isMyAttention').val('true');
			if (marker) {
				var attributes = {
					name: $('#markerName').val(),
					remark: $('#markerDescription').val(),
					index: parseInt($('#markerIndex').val()),
					lon: $('#markerX').val(),
					lat: $('#markerY').val(),
					isMyAttention: $("#isMyAttention").val(),
					markerId: $("#markerId").val()
				}
				marker.setData(attributes);
				// 文字标注
				var label = new NPMapLib.Symbols.Label(attributes.name);
				//设置样式
				label.setStyle({
					fontSize: 12, //文字大小
					fontFamily: '宋体', //字体
					color: '#090909', //文字前景色
					align: 'center', //对方方式
					isBold: true //是否粗体
				});
				//设置偏移量
				label.setOffset(new NPMapLib.Geometry.Size(5, -12));
				//标注层移除标注
				Variable.layers.markerLayer.removeOverlay(marker);
				var position = new NPMapLib.Geometry.Point(attributes.lon, attributes.lat);
				label.setPosition(position);
				//标注
				var marker2 = new NPMapLib.Symbols.Marker(position);
				marker2.setIcon(MapConst.symbol.attentionSymbol());
				marker2.setData(attributes);
				marker2.setLabel(label);
				//添加覆盖物
				Variable.layers.myAttentionLayer.addOverlay(marker2);
				// 点击出现弹窗
				require(['js/npmap-new/view/task-police-schedule-view'], function (PoliceScheduleView) {
					var policeScheduleView = new PoliceScheduleView(_mapInfoWindow);
					policeScheduleView.showInfo(marker2);
					policeScheduleView.markerBusinessWin(attributes, marker2);
				});
				scope.cancelFromMyAttention(marker2, "1");
			}
		};

		//初始化页面
		scope.init = function (conctroller, mapInfoWindow) {
			//保存控制器对象
			_controller = conctroller;
			//存储地图信息窗对象
			_mapInfoWindow = mapInfoWindow;
		};

		return scope;

	}({}, jQuery));

});