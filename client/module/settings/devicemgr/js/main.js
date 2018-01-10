/*global FloatDialog:true,notify:true,OrgTree:true,FuncTree:true,RoleTable:true,CameraTree:true,AutoComplete:true,GridTree:true ,$jit:true*/
/**
 * 设备管理主模块
 * @author chencheng
 * @date   2014-12-10
 * @param  {[type]}   ajaxModel    	 公共ajaxModel
 * @return {[type]}                  [description]
 */
define(["domReady",
	"js/tabpanel",
	"js/storehousemgr",
	"js/goodmgr",
	"js/config",
	"ajaxModel",
	"js/hbs-helpers",
	"base.self"
	], function(domReady,TabPanel,StoreHouseMgr,GoodMgr,settings,ajaxModel) {

	domReady(function() {

		// 页面初始化
		(function init() {
			// 请求页面模板
			ajaxModel.getTml(settings.templateUrl).then(function(tem) {
				if (tem) {

					var template = Handlebars.compile(tem);

					var opt = {
						"template": template,
						"setPagination": settings.setPagination
					};

					var storeHouseMgr = new StoreHouseMgr(opt);
					var goodMgr = new GoodMgr(opt);

					var tabPanel = new TabPanel({
						"storeHouseMgr": storeHouseMgr,
						"goodMgr": goodMgr
					});

					updateThirdNav && updateThirdNav();

					jQuery(".tab-panel  .tabs li:first").trigger("click");
				} else {
					notify.warn(settings.errorMessage);
				}
			});
		})();
	});
});


