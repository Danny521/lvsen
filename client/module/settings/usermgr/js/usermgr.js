/**
 * @authors chencheng (chencheng@netposa.com)
 * @date    2014-12-02 
 * @description  用户管理
 */
define(['./config',
	'js/usermgr-model',
	"md5",
	'jquery.validate',
	"base.self"
	], function(settings,userModel,md5){
	var UserMgr = new Class({
		Implements: [Options],
		options: {
			template: null,
			itemsPerPage: 10, /* 分页 每页条数 */
			setPagination: jQuery.noop
		},
		initialize: function(options) {
			this.setOptions(options);
		},
		/*
		 *	功能:获取该部门的用户
		 *	@departId : 部门ID
		 *	@q :查询字符串 (用户真实姓名)
		 */
		getUsers: function(departId, q) {
			var self = this;
			jQuery("div#departUsers").empty().show().siblings(".main").hide();
			userModel.getOrgUsers({
				current_page: 1,
				page_size: self.options.itemsPerPage,
				name: q
			}).then(function(tem) {
				if (tem.code === 200 && tem.data.usrs) {
					var hasMorePages = tem.data.total > 1 ? true : false;
					var html = self.options.template({
						"userList": {
							"q": q
						},
						"pagebar": hasMorePages
					});
					jQuery("#departUsers").html(html);
					jQuery("#departUsers .content-panel #userform").html(self.options.template({
						userItems: {
							users: tem.data.usrs
						}
					}));
					self.bindDepartUsers();
					if (tem.data.total > 1) {
						self.options.setPagination(tem.data.count, "#departUsers .pagination", self.options.itemsPerPage, function(nextPage) {
							userModel.getOrgUsers({
								org_id: departId,
								current_page: nextPage,
								page_size: self.options.itemsPerPage,
								name: q
							}).then(function(res) {
								if (res.code === 200 && res.data.usrs) {
									jQuery("#departUsers .content-panel #userform").html(self.options.template({
										userItems: {
											users: res.data.usrs
										}
									}));
									jQuery(".pagepart .current").html(nextPage);
									self.bindDepartUsers();

								} else {
									notify.warn("获取组织用户列表失败！");
								}
							});
						});
					}
				} else {
					notify.warn("获取组织用户列表失败！");
				}
			});
		},
		/*
		 *	用户列表相关事件
		 */
		bindDepartUsers: function() {
			var self = this;
			//点击搜索按钮查询用户
			jQuery('#departUsers .go').unbind('click').bind('click', function() {
				self.getUsers(1, jQuery('#departUsers .selectUsers').val().trim());
				return false;
			});
			jQuery("#departUsers input.selectUsers").unbind("keypress").bind("keypress", function(event) {
				if (event.keyCode === 13) {
					jQuery("#departUsers .go").click();
					return false;
				}
			});
			// 启用和禁用
			jQuery('#departUsers a.switch:not(.disable)').unbind('click').bind('click', function() {
				var el = jQuery(this);
				var status = el.attr("data-mark") === "1" ? 0 : 1;
				self.setUserStatus(el.closest("tr").attr("data-id"), status, el);
			});
			// 删除用户
			jQuery('#departUsers .delete-user:not(.disable)').unbind('click').bind('click', function() {
				var el = jQuery(this).closest("tr"),
					userId = el.attr("data-id"),
					userName = el.attr("data-username");
				new ConfirmDialog({
					title: '删除用户',
					confirmText: '确定',
					message: "<p>确定要删除该用户吗？</p>",
					callback: function() {
						var cfmDialog = this;
							self.deleteUser(userId, el);
					}
				});
			});
			// 彻底删除
			jQuery('#departUsers .delete-user-forever:not(.disable)').unbind('click').bind('click', function() {
				var trEl = jQuery(this).closest("tr");
					new ConfirmDialog({
						title: '永久删除用户',
						confirmText: '确定',
						message: "<p>确定要永久删除该用户吗？</p>",
						callback: function() {
							var cfmDialog = this;
							userModel.deleteUserCompletely({
								userId: trEl.attr("data-id")
							}).then(function(res) {
								if (res.code === 200) {
									notify.success("用户删除成功！");
									self.getUsers(1, "");
								} else {
									notify.warn('永久删除用户失败！');
								}
								cfmDialog.hide();
							});
							return false;
						}
					});
			});
			// 删除->恢复
			jQuery('#departUsers .operate-icon-edit-restore:not(.disable)').unbind('click').bind('click', function() {
				var trEl = jQuery(this).closest("tr"),
					userId = trEl.attr("data-id"),
					userName = trEl.attr("data-username"),
					status = 1;

				new ConfirmDialog({
					title: '恢复用户',
					confirmText: '确定',
					message: "<p>确定要恢复该用户吗？</p>",
					callback: function() {
						var cfmDialog = this;
							userModel.restoreUser({
								userId: userId
							}).then(function(res) {
								if (res.code === 200) {
									notify.success("用户恢复成功！");
									self.getUsers(1, "");
								} else {
									notify.warn(res.data.message);
								}
							});	
					}
				});
			});
			// 编辑用户
			jQuery('#departUsers .edit-user:not(.disable)').unbind('click').bind('click', function() {
				var id = jQuery(this).closest("tr").attr("data-id");
				userModel.getUserInfo({
					id: id
				}).then(function(res) {
					if (res.code === 200) {
						jQuery("#editUser").show().html(self.options.template({
							editUser: {
								user: res.usr
							}
						})).siblings(".main").hide();
						self.bindEditUser(res.usr.id);
					} else {
						notify.warn("获取用户信息失败！");
					}
				});
			});
			// 添加用户
			jQuery('#departUsers #addUser:not(.disable)').unbind('click').bind('click', function() {
				jQuery("#createUser").show().html(self.options.template({
					createUser: {}
				})).siblings(".main").hide();
				self.bindCreateUser();
			});
		},
		/*
		 *	功能:启用和禁用某个用户
		 *	@id:用户ID
		 *	@status : [0 禁用 1 启用]
		 *	@el:当前元素
		 */
		setUserStatus: function(id, status, el) {
			var action = status === 0 ? "禁用" : "启动",
				msg = status === 0 ? "确定要禁用该用户吗?" : "确定要启用该用户吗?",
				self = this,
				usernamelog;

			if (el.closest("tr").attr("data-username")) {
				usernamelog = el.closest("tr").attr("data-username");
			} else {
				usernamelog = el.closest(".action").attr("data-username");
			}

			new ConfirmDialog({
				title: '用户 [ 启用 | 禁用 ]',
				confirmText: '确定',
				message: "<p>" + msg + "</p>",
				callback: function() {
					var cfmDialog = this;
						userModel.updateUserStatus({
							"id": id,
							"status": status
						}).then(function(res) {
							if (res.code === 200) {
								
								logDict.insertMedialog("m3", action + usernamelog + "用户信息", "f6");
								if (status === 1) {
									el.removeClass('operate-icon-switch-off').addClass('operate-icon-switch-on').attr('data-mark', 1);
								} else {
									el.removeClass('operate-icon-switch-on').addClass('operate-icon-switch-off').attr('data-mark', 0);
								}
							} else {
								notify.warn("修改用户状态失败！");
							}
						});
				}
			});
		},
		/*
		 *	功能:删除用户
		 *	@id:用户ID
		 *	@el:当前元素(tr)
		 */
		deleteUser: function(id, el) {
			var self = this;
			userModel.deleteUser({"id": id}).then(function(res) {
				if (res.code === 200) {
					notify.success("用户删除成功！");
					logDict.insertMedialog("m3", "删除" + el.attr("data-username") + "用户信息", "f6", "o3");
					self.getUsers(1, '');
				} else {
					notify.warn("用户删除失败！");
				}
			});
		},
		/*
		 *	功能:用户表单验证
		 *	@selector:"#createUser" or "#editUser"
		 *	@sendData:验证成功之后的回调函数(向后端发送数据)
		 */
		volidateUserForm: function(selector, sendData) {
			// 先获取用户的比分  
			var userScore = 100;
			jQuery.validator.setDefaults({
				invalidHandler: function() {
					return false;
				},
				submitHandler: function() {
					if (jQuery(selector + " #userForm").valid()) {
						// 验证时间
						sendData();
						return false;
					} else {
						notify.info("请正确填写相关信息！");
					}
					return false;
				}
			});
	        jQuery.validator.addMethod("stringCheck", function(value) {
				var df=/^[a-zA-Z0-9\u4E00-\u9FA5]+$/.test(value);
				return df;
			}, "格式不对，真实姓名由中文，数字，字母组成，如 张三，李四x，Amy，Alice1 !");
			jQuery(selector + " #userForm").validate({
				errorPlacement: function(error, element) {
					if (element.is(":radio") || element.is(":checkbox")) {
						error.appendTo(element.parent());
					} else {
						error.insertAfter(element);
					}
				},
				rules: {
					username: {
						required: true,
						maxlength: 50,
						usernamereg: true,
						remote: {
							url: "/service/usr/check_user_name_same",
							type: "post",
							data: {
								userName: function() {
									return jQuery(selector + " #username").val().trim();
								}
							}
						}
					},
					password: {
						required: true,						
						minlength: 6,
						
						passwordreg: true
					},
					realname: {
						stringCheck:jQuery(selector + " #realname").val(),
						required: true,
						maxlength: 50
					},
					belong: {
						required: true
					},
					score:{
						required:true,
						numberExt:true,
						max:userScore
					},
					cellphone: {
						number: true,
						maxlength: 11
					},
					sex: {
						required: true
					},
					status: {
						required: true
					}
				},
				success: function(label) {
					label.remove();
				},
				// 对于验证失败的字段都给出相应的提示信息
				messages: {
					username: {
						required: "请输入登录名！",
						maxlength:"登录名最多50个字符！",
						usernamereg: "登录名由字母，数字，下划线组成！",
						remote: "该登录名已被使用，请重新输入！"
					},
					password: {
						required: "请输入密码！",
						maxlength: "密码最多是20位！",
						minlength: "密码最少是6位！",
						passwordreg: "密码由字母，数字，下划线组成！"
					},
					realname: {
						maxlength: "真实姓名不能超过50个字符！",
						required: "请输入真实姓名！"
					},
					belong: {
						required: "请输入所属部门！"
					},
					sex: {
						required: "未选择性别！"
					},
					cellphone: {
						number: "号码必须为数字！",
						maxlength: "号码长度不超过11 ！"
					},
					score:{
						required:"级别不能为空",
						numberExt:"格式不对，请输入数值",
						max: "请输入0~" + userScore + "之间的整数"
					}
				}
			});
		},
		/*
		 *	功能: 编辑用户页面相关事件
		 *	@id:该用户ID
		 *	@extraData:该用户权限相关的数据
		 */
		bindEditUser: function(id) {
			var self = this;
			//验证密码是否修改及密码强度
		    jQuery("body").on("change","#editUser #password",function () {
				jQuery("#password").attr("data-change","change");
				if (jQuery("#password").val().length >  20){
					jQuery("#mypwd").attr("class","pass-len");
				} else {
					jQuery("#mypwd").attr("class","");
				}
			});
			// 保存用户信息
			self.volidateUserForm("#editUser", function() {
				var user = {
					id: jQuery("#editUser #id").val().trim(),
					loginName: jQuery("#editUser #username").val().trim(),
					password: jQuery("#editUser #password").val().trim(),
					name: jQuery("#editUser #realname").val().trim(),
					gender: jQuery("#editUser .sex:checked").val().trim(),
					score: jQuery("#editUser #score").val().trim(),
					phoneNo: jQuery("#editUser #cellphone").val().trim(),
					status: jQuery("#editUser .sex:checked").val().trim(),
					department: jQuery("#editUser #cellphone").val().trim()
				};
				if (jQuery("#mypwd").attr("class") == "pass-len" ) {
					notify.warn("密码设置不正确");
					return;
				}
				if (jQuery("#password").attr("data-change") === "change") {
					user.password = md5(user.password);					
				}
				//pva编辑用户
				userModel.updateUser(user, {
					beforeSend: function() {
						jQuery("#editUser #saveUser").attr("disabled", "disabled");						
						
					},
					complete: function() {
						jQuery("#editUser #saveUser").removeAttr("disabled");
					}
				}).then(function(res) {
					if (res.code === 200) {
						var fingerData , param = {};
						notify.success("用户编辑成功！");
						self.getUsers(1, '');
					} else {
						notify.warn(res.data.message);
					}
				});
			});
			// 取消
			jQuery("#editUser #cancel").unbind("click").bind("click", function() {
				self.getUsers(1, '');
			});
		},

		/*
		 *	功能:创建用户页面相关事件
		 */
		bindCreateUser: function() {
			var self = this;
			// 验证表单并向后端发送数据
			self.volidateUserForm("#createUser", function() {
				var user = {
					loginName: jQuery("#createUser #username").val().trim(),
					password: jQuery("#createUser #password").val().trim(),
					name: jQuery("#createUser #realname").val().trim(),
					gender: jQuery("#createUser .sex:checked").val().trim(),
					unitId: 1,
					officeNo: jQuery("#createUser #phone").val().trim(),
					roleId: 1,
					resourceRoleId: 1,
					// userLevel: jQuery("#createUser #userLevel option:selected").val().trim(),
					score: jQuery("#createUser #score").val().trim(),
					idCardNumber: jQuery("#createUser #idNumber").val().trim(),
					phoneNo: jQuery("#createUser #cellphone").val().trim(),
					email: jQuery("#createUser #email").val().trim(),
					orgID: 1,
					userSourceId: 1,
					// isManager: userType,
					// userTypeId: userType,
					status: 1, //启用和禁用状态：
					cameraResourceMedifyList: JSON.stringify({
						"cameraResourceMedifyList": cameraResourceMedifyList
					}), //	修改的摄像机列表
					flag: self.isRoleChanged,
					// pvd组织id
					pvdOrgId: window.hasPvdFuncs ? (window.pvdOrgRootId || "") : "",
					// self.options.pvdOrgId == -1 ? (window.hasPvdFuncs ? window.pvdOrgRootId : "") : self.options.pvdOrgId
				    cloud_limit:jQuery("input[name='cacheSet']:checked").val()==="0"?"":jQuery("input[name='actullayCache']").val(),
				    standardName:jQuery("#createUser #standardName").val().trim(),
				    policeNum:jQuery("#createUser #policeNum").val().trim(),
				    ipAddress: ipString
				};
				user.password = md5(user.password);
                	userModel.createUser(user, {
						beforeSend: function() {
							jQuery("#createUser #saveUser").attr("disabled", "disabled");
							
						},
						complete: function() {
							jQuery("#createUser #saveUser").removeAttr("disabled");
						}
					}).then(function(res) {
						if (res.code === 200) {
	                        notify.success("用户创建成功！");
	                        self.getUsers(1, '');
	                        jQuery("#createUser").html("");
	                    } else {
	                        notify.warn(res.data.message);
	                    }
					});
			});
			// 取消
			jQuery("#createUser #cancel").unbind("click").bind("click", function() {
				self.getUsers(1, '');
			});
		}
	});
	return UserMgr ;
});