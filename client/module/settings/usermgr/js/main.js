/*global FloatDialog:true,notify:true,OrgTree:true,FuncTree:true,RoleTable:true,CameraTree:true,AutoComplete:true,GridTree:true ,$jit:true*/
/**
 * 用户管理主模块
 * @author chencheng
 * @date   2014-12-10
 * @param  {[type]}   domReady       [description]
 * @param  {[type]}   UserMgr        用户管理
 * @param  {[type]}   settings       全局变量
 * @param  {[type]}   ajaxModel    	 公共ajaxModel
 * @return {[type]}                  [description]
 */
define(["domReady",
	"js/usermgr",
	"js/config",
	"ajaxModel",
	"js/hbs-helpers",
	"base.self"
	], function(domReady,UserMgr,settings,ajaxModel) {

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
					var userMgr = new UserMgr(opt);
					userMgr.getUsers();
				} else {
					notify.warn(settings.errorMessage);
				}
			});
		})();
	});
});


