define([
    'jquery'
], function() {

	var Model = {
		ADMINISTRATOR_NAME: "administrator", //超级管理员用户名
		currentUser: null,
		currentOrg: null,
		URLS: {
			GET_CURRENT_USER: "/service/usr/get_current_usr",
			GET_CURRENT_USER_ORG: "/service/org/current",
			GET_USERS_BY_ORG: "/service/usr/{orgid}/vilidusers", //机构下用户
			GET_STATISTIC: "/service/pvd/incident_structure/lists" //统计数据
		},
		_ajax: function(url, data, type) {
			return this._xhr = $.ajax({
				url: url,
				type: type || "get",
				data: data || {},
				timeout: 5000
			});
		},
		/**
		 * 获取当前登录用户
		 * @return {[type]} [description]
		 */
		getCurrentUser: function() {
			if (!this.currentUser) {
				var currentUser = JSON.parse(localStorage.permission);
				if (currentUser && currentUser.code == 200) {
					this.currentUser = {
						name: currentUser.data.trueName,
						id: currentUser.data.userId
					};
				} else {
					throw new Error("获取当前用户信息失败，请检查localStorage。")
				}
			}
			return this.currentUser;
		},
		/**
		 * 获取当前登录用户所属机构
		 * @return {[type]} [description]
		 */
		getCurrentOrgInfo: function() {
			var self = this;
			return this._ajax(this.URLS.GET_CURRENT_USER_ORG).then(function(org) {
				return self.currentOrg = org.data.org;
			});
		},
		/**
		 * 获取机构下用户
		 * @param  {string} orgId 机构Id
		 * @return {[type]}       [description]
		 */
		userCache: {},
		getUsersOfOrg: function(orgId,remote) {
			var self = this;
			var users, cache = this.userCache;
			if (users = cache[orgId]) {
				return $.Deferred().resolve(users);
			} else {
				return this._ajax(this.URLS.GET_USERS_BY_ORG.replace("{orgid}", orgId),{isRemoteAccess: remote}).then(function(data) {
					if (data && data.code == "200") {
						var users = data.data.vilidusers;
						var currentUser = self.getCurrentUser();
						if (orgId == self.currentOrg.id && currentUser.name == self.ADMINISTRATOR_NAME) {
							users.unshift(currentUser);
						}
						return cache[orgId] = users;
					}
					return [];
				});
			}
		},
		/**
		 * 获取统计数据
		 * @param  {object} filter 统计过滤条件
		 * @return {[type]}        [description]
		 */
		getStatisticData: function(filter) {
			return this._ajax(this.URLS.GET_STATISTIC, filter, "get");
		},
		getTestData: function(filter) {
			return $.ajax({
				type: "get",
				url: "../statistic/js/data.json",
				data: filter,
				dataType: "json"
			});
		}
	};
	return Model;
});