/**
 * 添加工具条组件和聚合图层
 * @author Li Dan
 * @date   2015-10-14
 * @param  {[type]}   ){    return (function(scope){        return scope;   });} [description]
 * @return {[type]}              [description]
 */
define([
		"js/sidebar/sidebar",
		'/lbsplat/module/commanddispatch/route-planning/js/route-planning-pack.js',
		'jquery'
	],
	function(SideBar, PathPlanningPack) {
		return (function(scope, $) {
			var
			// 地图工具栏初始化的回调方法，添加房子面包屑
				_callbackMaptoolbarInit = function(content) {
					//加载左侧列表,插入框架
					SideBar.push({
						name: "#sidebar-body",
						markName: "SelectResultPanel",
						template: content
					});
					var $container = $(".search-result-header");
					var datamark = $(".sidebar .sidebar-header .active").attr('data-mark');
					$container.prepend('<i class="sidebar-home-icon np-map-overlay" data-mark="' + datamark + '"></i><b> &gt; </b>');
				},
				_callbackPathPlanningTemplateLoad = function(config) {
					//切换出左侧内容
					require(["/module/inspect/dispatch/js/npmap-new/map-common.js"], function(mapCommon) {
						//初始化信息窗模板
						mapCommon.loadTemplate("/module/inspect/dispatch/inc/sidebar/path-planning.html?_=1", function(compiler) {
							//渲染勾选警卫路线摄像机相关
							SideBar.push({
								name: "#sidebar-body",
								markName: "pathplanning",
								template: $.trim(compiler({}))
							});
							//切换左侧tab
							$("#sidebar").find(".sidebar-header li.inline-list-item-nav.np-business").addClass('active').siblings().removeClass('active');
							//搜索服务
							PathPlanningPack.searchPath(config.position, config.type, config.data);
						}, function() {
							notify("路径规划模板加载失败！");
						});
					});
				};
			scope.init = function(map) {
				//加载工具栏
				require(['/lbsplat/component/business/maptoolbar/js/maptoolbar.js'], function(Maptoolbar) {
					//加载地图工具栏
					Maptoolbar.init({
						container: $("#gismap"),
						map: map,
						toolConfig: {
							//行政区域
							regionSelect: true,
							//资源
							resource: true,
							//地图报警
							mapShowInfo: true,
							//地图选择
							select: true,
							//视野范围搜索
							rangeSearch: true,
							//地图工具
							tools: true,
							//全屏
							fullScreen: true
						}
					}, _callbackMaptoolbarInit, _callbackPathPlanningTemplateLoad);
				});
				//加载聚合图层
				require(['/lbsplat/component/business/clusterlayer/cluster-layer-view.js'], function(ClusterLayer){
					ClusterLayer.init({
						map: map,
						clusterConfig: {
							//摄像机
							camera: true,
							//卡口
							bayonet: false,
							//灯杆
							lightbar: false,
							//警车
							policecar: false
						}
					});
				});
			};
			//显示图层  wang xi   2016-04-14
			scope.showSwitchLayer = function(map){
				require(['/lbsplat/component/business/maptoolbar/js/maptoolbar.js'], function(Maptoolbar) {
					Maptoolbar.showSwitchLayer();
				});
			};
			//隐藏图层 wang xi   2016-04-14
			scope.hideSwitchLayer = function(map){
				require(['/lbsplat/component/business/maptoolbar/js/maptoolbar.js'], function(Maptoolbar) {
					Maptoolbar.hideSwitchLayer();
				});
			};
			return scope;
		})({}, jQuery);
	});
