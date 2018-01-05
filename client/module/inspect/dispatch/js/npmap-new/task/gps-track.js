define(["/lbsplat/module/commanddispatch/gps-track/js/gps-track-pack.js"],
	function(GPSTrack) {
		return (function(scope) {
			scope.init = function() {
				GPSTrack.init(map);
			};
			//移除GPS播放
			scope.removeGPSPlayControl = function(){
				GPSTrack.removeGPSPlayControl();
			};
			//对接资源GPS警力进入GPS历史监控
			scope.policeGps = function(gpsCode) {
				//切换出左侧内容
				require(["js/npmap-new/map-common", "js/sidebar/sidebar"], function(mapCommon, SideBar) {
					//初始化信息窗模板
					mapCommon.loadTemplate("inc/sidebar/gps-track.html", function(compiler) {
						//渲染勾选警卫路线摄像机相关
						SideBar.push({
							name: "#sidebar-body",
							markName: "gpstrack",
							template: $.trim(compiler({}))
						});
						//切换左侧tab
						$("#sidebar").find(".sidebar-header li.inline-list-item-nav.np-business").addClass('active').siblings().removeClass('active');
						//搜索服务
						GPSTrack.policeGps(map,gpsCode);
					}, function() {
						notify("路径规划模板加载失败！");
					});
				});
			};
			return scope;
		})({});
	});