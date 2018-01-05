define(['/lbsplat/module/commanddispatch/route-planning/js/route-planning-pack.js',
	'text!/lbsplat/module/commanddispatch/route-planning/inc/path-planning.tpl',
	'/lbsplat/component/business/addresswin/addresswin.js',
	'/lbsplat/module/common/js/utils/layer-control.js',
	'jquery'
], function(Pack, compile, Addresswin, LayerControl) {

	return (function(scope, $) {
		//模板
		var
			_compiler = Handlebars.compile(compile),
			//获取地图服务
			_mapService = null;

		var _markPointOnMap = function(el) {
			//清除路径规划图层
			LayerControl.removeAllGroups();
			//在地图上标注
			Pack.markPointOnMap(map, el);
		};
		//初始化页面
		scope.init = function() {
			Pack.init(map);
			//获取地图服务
			_mapService = new MapPlatForm.Base.MapService(map);
		};
		/*******对接窗口路径规划-start*******/
		//地址匹配窗口
		scope.initWin = function(config) {
			if (config.key) {
				config = $.extend({}, config, {
					type: 'map',
					mapService: _mapService,
					pageNum: 10,
					winHeight: 170,
					addressClickFun: function(obj) {
						_markPointOnMap(obj);
						//显示窗口下三角
						$("#npgis_contentDiv").css("z-index", 1);
					},
					openEventListener: function() {
						//隐藏窗口下三角
						$("#npgis_contentDiv").css("z-index", 10001);
					},
					closeEventListener: function() {
						//显示窗口下三角
						$("#npgis_contentDiv").css("z-index", 1);
					}
				});
				Addresswin.initWin(config);
			} else {
				config = $.extend({}, config, {
					type: 'history',
					mapService: _mapService,
					pageNum: 10,
					winHeight: 170,
					addressClickFun: function(obj) {
						_markPointOnMap(obj);
						//显示窗口下三角
						$("#npgis_contentDiv").css("z-index", 1);
					},
					openEventListener: function() {
						//隐藏窗口下三角
						$("#npgis_contentDiv").css("z-index", 10001);
					},
					closeEventListener: function() {
						//显示窗口下三角
						$("#npgis_contentDiv").css("z-index", 1);
					}
				});
				Addresswin.initWin(config);
			}
		};
		//地址搜索
		scope.searchPath = function(config) {
			//切换出左侧内容
			require(["js/npmap-new/map-common", "js/sidebar/sidebar"], function(mapCommon, SideBar) {
				//初始化信息窗模板
				mapCommon.loadTemplate("inc/sidebar/path-planning.html?_=1", function(compiler) {
					//渲染勾选警卫路线摄像机相关
					SideBar.push({
						name: "#sidebar-body",
						markName: "pathplanning",
						template: $.trim(compiler({}))
					});
					//切换左侧tab
					$("#sidebar").find(".sidebar-header li.inline-list-item-nav.np-business").addClass('active').siblings().removeClass('active');
					//搜索服务
					Pack.searchPath(config.position, config.type, config.data);
				}, function() {
					notify("路径规划模板加载失败！");
				});
			});
		};
		/*******对接窗口路径规划-end*********/
		return scope;
	}({}, jQuery));
});