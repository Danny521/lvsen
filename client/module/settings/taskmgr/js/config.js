/**
 * 
 * @authors chencheng (chencheng@netposa.com)
 * @date    2014-12-02 
 * @description  用户管理全局变量 -- 这里边存在了一个全局变量 导出给其他模块使用
 */
define(["jquery"], function(){
	var settings = {

		curDepartment: null,	

		orgTree: null,

		steps: [],

		orgLevel: 8,	// by chencheng on 2014-11-6 配置组织树的最大层级(用于控制组织添加按钮) 但是搜索会改变树的深度，这个需要后端支持(暂未实现)

		templateUrl: "",		

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
			// 超级管理员
			if (jQuery("#userEntry").attr("data-orgid") === "null" ? true : false) {
				return true;
			}
			// 普通管理员
			var userEntry = jQuery("#userEntry"),
			isManager = userEntry.attr("data-typeid") === "1" && userEntry.attr("data-orgid") != this.curDepartment.id && this.orgTree.hasAccessPower(this.curDepartment.id);
		
			return isManager;

		},
		// 管理员 (无权限操作按钮置灰)
		isManager:function  () {
			var userEntry = jQuery("#userEntry");
			if(userEntry.attr("data-typeid") === "1" || jQuery("#userEntry").attr("data-orgid") === "null"){
				return true;
			}
			return false;
		}

	};

	return settings ;

});