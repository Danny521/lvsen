/*global TvLayoutEdit:true */
/**
 * [电视墙设置页面电视墙布局设置入口类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
require(['/require-conf.js'], function() {
	require([
		"domReady",
		'js/tabpanel',
		'js/sync-setting',
		'js/tvwall-view',
		'permission',
		"jquery.datetimepicker"
	], function(domReady, TabPanel,SyncMgr) {
		domReady(function() {
			// 高亮二级菜单
			jQuery("#header .menu a[data-target='taskmgr']").addClass("active").siblings().removeClass("active");

			var syncMgr = new SyncMgr();
			var tabPanel = new TabPanel({
				"syncMgr":syncMgr
			});

			jQuery(document).on('focus', '.input-time', function() {
				jQuery(this).timepicker({
					timeOnlyTitle:"请选择时间",
					timeText:"",
					timeOnly: true,
					hourText:"时",
					minuteText:"分"
				})
			});

			// 权限控制
			updateThirdNav && updateThirdNav();

		});
	});
});
