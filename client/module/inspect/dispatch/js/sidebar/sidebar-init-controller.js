/**
 *
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2014-12-02 10:48:56
 * @version $Id$
 */

define(['js/sidebar/sidebar', 'ajaxModel', 'js/sidebar/analysis','js/sidebar/map-layer-control', 'jquery', 'js/sidebar/map-video-play-bar'], function(sidebar, ajaxModel, analysis, mapControl) {
	return {
		init: function() {
			function getTml() {
				return ajaxModel.getTml(this.url).done(function(data) {
					return data;
				});
			}
			require(['js/npmap-new/controller/map-infowindow-controller'],function(){

			});
			//初始化左侧面板的各种数据和相对应的操作。
			sidebar.initData('.np-resource', getTml.bind({
				url: 'inc/sidebar/resource.html'
			}));
			sidebar.initData('.np-business', getTml.bind({
				url: 'inc/sidebar/business.html'
			})).done(function(){
				//刷新权限，by zhangyu on 2015/5/29
				permission.reShow();
			});
			sidebar.initData('.np-analysis', getTml.bind({
				url: 'inc/sidebar/analysis.html'
			})).done(function(){
				analysis.init();
			}).done(function(){
				sidebar.updateDomArrayInit({
					name: '#sidebar-body',
					markName: 'analysis'
				});
			});
			sidebar.initData('.np-favorite', getTml.bind({
				url: 'inc/sidebar/favorite.html'
			}));
			sidebar.initData('.np-route', getTml.bind({
				url: 'inc/sidebar/route.html'
			}));
			sidebar.initData('.np-circle', getTml.bind({
				url: 'inc/sidebar/defence-circle.html'
			}));
			sidebar.initData('.np-defense', getTml.bind({
				url: 'inc/sidebar/electronic-defense.html'
			}));
			sidebar.initData('.np-route-new', getTml.bind({
				url: 'inc/sidebar/route-new.html'
			}));
			sidebar.initData('.np-defence-circle-new', getTml.bind({
				url: 'inc/sidebar/defence-circle-new.html'
			}));
			sidebar.initData('.np-route-select', getTml.bind({
				url: 'inc/sidebar/route-select-camera.html'
			}));
			sidebar.initData('.np-path-planning', getTml.bind({
				url: 'inc/sidebar/path-planning.html'
			}));
			sidebar.initData('.np-gps-track', getTml.bind({
				url: 'inc/sidebar/gps-track.html'
			}));
			sidebar.initClickEvent();

			require(["js/sidebar/sidebar-init-view-event"]);
		}
	};
});