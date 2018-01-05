/**
 * 基础地图加载 常用数据转化
 **/
define([
	"OpenLayers",
	"npmapConfig"
], function() {
	/**
	 * 地图工具类，提供地图加载、控件加载等
	 * @type {[type]}
	 */
	var PVAMap = {

		options: {
			//地图容器，初始化地图时必须填写
			mapContainer: "",
			//底图种类, 默认为基本地图和卫星地图两种；目前仅视频指挥是两种，其他模块均为1种
			baseMapNum: 2,
			//是否添加鹰眼
			isOverviewCtrl: false,
			//是否导航条
			isNaviCtrl: false,
			//是否比例尺
			isScaleCtrl: false,
			//是否绘制工具
			isDrawTool: false,
			//是否测量工具
			isMeasureTool: false,
			//是否添加zoom动画效果
			isZoomAnimation: false
		},
		/**
		 * 初始化地图，设置地图控件
		 * @param options - 地图配置信息
		 * @param flag - 当前初始化的地图类别（由于地图对象要暴露到window下，故只有base（指挥调度主地图）类型的地图才暴露，其他均不）
		 * @returns {{map: *, baseLayer: (*|null), satelliteLayer: (*|null), overviewctrl: (*|null), navictrl: (*|null), drawtool: (*|null), measuretool: (*|null), zoomAnimation: (*|null)}}
		 */
		initMap: function(options, flag) {
			//合并参数
			options = jQuery.extend({}, this.options, options, {});
			//初始化地图
			this.map = mapConfig.initMap(options.mapContainer, flag);
			//鹰眼
			if (options.isOverviewCtrl) {
				this.overviewctrl = new NPMapLib.Controls.OverviewControl();
				this.map.addControl(this.overviewctrl);
				this.overviewctrl.changeView(false);
			}
			//导航
			if (options.isNaviCtrl) {
				this.navictrl = new NPMapLib.Controls.NavigationControl({navigationType:'netposa'});
				this.map.addControl(this.navictrl);
			}
			//比例尺
			if (options.isScaleCtrl) {
				this.scaleCtrl = new NPMapLib.Controls.ScaleControl();
				this.map.addControl(this.scaleCtrl);
			}
			//绘制工具初始化
			if (options.isDrawTool) {
				this.drawtool = new NPMapLib.Tools.DrawingTool(this.map.id);
			}
			//测量工具
			if (options.isMeasureTool) {
				this.measuretool = new NPMapLib.Tools.MeasureTool(this.map.id, {
					lengthUnit: NPMapLib.MAP_UNITS_METERS, //长度单位
					areaUnit: NPMapLib.MAP_UNITS_SQUARE_KILOMETERS, //面积单位
					mode: NPMapLib.MEASURE_MODE_DISTANCE //测量模式
				});
				this.measuretool.startUp();
			}
			//是否添加zoom动画效果
			if (options.isZoomAnimation) {
				//添加鼠标缩放时的动画
				var zoomAnimation = new NPMapLib.Controls.zoomAnimationControl();
				this.map.addControl(zoomAnimation);
			}
			//鼠标样式
			this.map.addHandStyle();
			//加载卡口对象
			if(!window.gateController) {
				require(["js/pvd/monitor/gateController"], function (GateController) {
					window.gateController = new GateController(window.map);
				});
			}
			//返回对象
			return {
				map: this.map,
				baseLayer: this.baseLayer || null,
				satelliteLayer: this.satelliteLayer || null,
				overviewctrl: this.overviewctrl || null,
				navictrl: this.navictrl || null,
				drawtool: this.drawtool || null,
				measuretool: this.measuretool || null,
				zoomAnimation: this.zoomAnimation || null
			};
		}
	};
	return PVAMap;
});