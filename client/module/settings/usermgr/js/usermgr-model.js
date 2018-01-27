/**
 * 用户模型
 * @author chencheng
 * @date   2014-12-12
 * 
 */
define(["ajaxModel","pvaConfig"],function(ajaxModel){

	var User = {

		urls: {
			/* 获取用户详情信息 */ 
			get_user_info: window.projectMode === "develop" ? window.mockDataUrl + "/service/sys/user/info/" : "/service/sys/user/info/",
			/* 获取组织下的用户 包含分页 搜索 */ 
			get_org_users: window.projectMode === "develop" ? window.mockDataUrl + "/service/sys/user/list" : "/service/sys/user/list",
			/* 永久删除用户 */
			delete_user_completely:"/service/user/completely_delete_user",
			/* 恢复已删除的用户 */
			restore_user:"/service/user/restore_user",
			/* 修改用户的状态 */
			update_user_status:"/service/user/update_status",
			/* 删除用户 */
			delete_user:"/service/user/delete",
			/* 修改用户 */
			update_user:"/service/sys/user/update",
			/* 添加用户 */
			create_user:"/service/sys/user/save"
		},
		/**
		 * 获取组织的角色列表al
		 * @param  {[type]}   data   发送的数据
		 * @param  {[type]}   custom  ajax额外的回调函数
		 * @return {[type]}          [description]
		 */
		getUserInfo:function(data,custom){
			return ajaxModel.getData(this.urls.get_user_info,data,custom);
		},
		/**
		 * 分页获取组织下的用户 包含搜索 分页
		 */
		getOrgUsers:function(data,custom){
			return ajaxModel.postData(this.urls.get_org_users,data,custom);
		},
		/**
		 * 用户权限 添加临时数据
		 */
		addTempResource:function(data,custom){
			return ajaxModel.postData(this.urls.add_resource_temp,data,custom);
		},
		/**
		 * 删除临时数据
		 */
		deleteTempResource:function(data,custom){
			return ajaxModel.getData(this.urls.delete_resource_temp,data,custom);
		},
		/**
		 * 修改用户信息
		 */
		updateUser:function(data,custom){
			return ajaxModel.postData(this.urls.update_user,data,custom);
		},
		/**
		 * 创建用户
		 */
		createUser:function(data,custom){
			return ajaxModel.postData(this.urls.create_user,data,custom);
		},
		/**
		 * 删除用户
		 */
		deleteUser:function(data,custom){
			return ajaxModel.postData(this.urls.delete_user,data,custom);
		},
		/**
		 * 永久删除用户
		 */
		deleteUserCompletely:function(data,custom){
			return ajaxModel.postData(this.urls.delete_user_completely,data,custom);
		},
		/**
		 * 恢复已删除的用户
		 */
		restoreUser:function(data,custom){
			return ajaxModel.postData(this.urls.restore_user,data,custom);
		},
		/**
		 * 修改用户的状态  启用 | 禁用
		 */
		updateUserStatus:function(data,custom){
			return ajaxModel.postData(this.urls.update_user_status,data,custom);
		}
		
	};

	return User;
});