/*global FloatDialog:true,notify:true,OrgTree:true,FuncTree:true,RoleTable:true,CameraTree:true,AutoComplete:true,GridTree:true ,$jit:true*/
/**
 * 用户管理主模块
 * @author chencheng
 * @date   2014-12-10
 * @param  {[type]}   domReady       [description]
 * @param  {[type]}   TabPanel       左侧tab面板
 * @param  {[type]}   OrgRelationMgr  组织拓扑图
 * @param  {[type]}   OrganizeMgr    组织管理
 * @param  {[type]}   UserMgr        用户管理
 * @param  {[type]}   RoleMgr        角色管理
 * @param  {[type]}   settings       全局变量
 * @param  {[type]}   ajaxModel    	 公共ajaxModel
 * @return {[type]}                  [description]
 */
define(["domReady",
	"js/tabpanel",
	"js/usermgr",
	"js/config",
	"ajaxModel",
	"js/hbs-helpers",
	"base.self"
	], function(domReady,TabPanel,UserMgr,settings,ajaxModel) {

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

					var tabPanel = new TabPanel({
						"userMgr": userMgr
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


