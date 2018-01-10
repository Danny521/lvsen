/**
 * 
 * @authors chencheng (chencheng@netposa.com)
 * @date    2014-12-02 
 * @description  用户管理全局变量 -- 这里边存在了一个全局变量 导出给其他模块使用
 */
define(["jquery","jquery.pagination"], function(){
	var settings = {

		curDepartment: null,	
		
		jzCurDepartment: null,

		orgTree: null,
		
		jzOrgTree: null,

		steps: [],

		jzSteps: [],

		orgLevel: 8,	// by chencheng on 2014-11-6 配置组织树的最大层级(用于控制组织添加按钮) 但是搜索会改变树的深度，这个需要后端支持(暂未实现)

		templateUrl: "/module/settings/devicemgr/inc/devicemgr-template.html",		// by chencheng on 2014-11-6 用户管理 handlebars 模板

		errorMessage: "网络或服务器异常！",

		bindBreadEvent: jQuery.noop,
		// by chencheng on 2014-11-6  将分页插件封装到一个Function中
		setPagination: function(total, selector, itemsPerPage, callback) {
			jQuery(selector).pagination(total, {
				items_per_page: itemsPerPage,
				first_loading:false,
				callback: function(pageIndex, jq) {
					callback(pageIndex + 1);
				}
			});
		},
		// 是否可以添加管理员 (控制新增用户 是否显示 管理员勾选框)
		hasPermission: function() {
			return true;
		},
		getUserScore:function(){
			return $("#userEntry").attr("data-score") - 1;
		}

	};

	return settings ;

});