/*global FloatDialog:true,notify:true,OrgTree:true,FuncTree:true,RoleTable:true,CameraTree:true,AutoComplete:true,GridTree:true ,$jit:true*/
/**
 * 设备管理主模块
 * @author chencheng
 * @date   2014-12-10
 * @param  {[type]}   ajaxModel    	 公共ajaxModel
 * @return {[type]}                  [description]
 */
define(["domReady",
	"js/goodmgr",
	"js/config",
	"ajaxModel",
	"js/hbs-helpers",
	"base.self"
	], function(domReady,GoodMgr,settings,ajaxModel) {

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

					var goodMgr = new GoodMgr(opt);

					goodMgr.listGoods(1, "");

				} else {
					notify.warn(settings.errorMessage);
				}
			});
		})();
	});
});


