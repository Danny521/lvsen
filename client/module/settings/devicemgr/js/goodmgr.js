/**
 * @authors chencheng (chencheng@netposa.com)
 * @date    2014-12-02 
 * @description  商品管理
 */
define(['./config',
	'js/good-model',
	"md5",
	'jquery.validate',
	"base.self"
	], function(settings,goodModel,md5){
	var GoodMgr = new Class({
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
		 *	功能:获取该部门的商品
		 *	@departId : 部门ID
		 *	@q :查询字符串 (商品真实姓名)
		 */
		listGoods: function(departId, q) {
			var self = this;
			jQuery("div#departGood").empty().show().siblings(".main").hide();
			goodModel.listGoods({
				current_page: 1,
				page_size: self.options.itemsPerPage,
				name: q
			}).then(function(tem) {
				if (tem.code === 200 && tem.data.goods) {
					debugger
					var hasMorePages = tem.data.total > 1 ? true : false;
					var html = self.options.template({
						"goodList": {
							"q": q
						},
						"pagebar": hasMorePages
					});
					jQuery("#departGood").html(html);
					jQuery("#departGood .content-panel #goodform").html(self.options.template({
						goodItems: {
							goods: tem.data.goods
						}
					}));
					self.binddepartGood();
					if (tem.data.total > 1) {
						self.options.setPagination(tem.data.count, "#departGood .pagination", self.options.itemsPerPage, function(nextPage) {
							goodModel.listGoods({
								current_page: nextPage,
								page_size: self.options.itemsPerPage,
								name: q
							}).then(function(res) {
								if (res.code === 200 && res.data.goods) {
									jQuery("#departGood .content-panel #goodform").html(self.options.template({
										goodItems: {
											goods: tem.data.goods
										}
									}));
									jQuery(".pagepart .current").html(nextPage);
									self.binddepartGood();

								} else {
									notify.warn("获取组织商品列表失败！");
								}
							});
						});
					}
				} else {
					notify.warn("获取组织商品列表失败！");
				}
			});
		},
		/*
		 *	商品列表相关事件
		 */
		binddepartGood: function() {
			var self = this;
			//点击搜索按钮查询商品
			jQuery('#departGood .go').unbind('click').bind('click', function() {
				self.listGoods(1, jQuery('#departGood .selectUsers').val().trim());
				return false;
			});
			jQuery("#departGood input.selectUsers").unbind("keypress").bind("keypress", function(event) {
				if (event.keyCode === 13) {
					jQuery("#departGood .go").click();
					return false;
				}
			});
			// 启用和禁用
			jQuery('#departGood a.switch:not(.disable)').unbind('click').bind('click', function() {
				var el = jQuery(this);
				var status = el.attr("data-mark") === "1" ? 0 : 1;
				self.setUserStatus(el.closest("tr").attr("data-id"), status, el);
			});
			// 删除商品
			jQuery('#departGood .delete-user:not(.disable)').unbind('click').bind('click', function() {
				var el = jQuery(this).closest("tr"),
					userId = el.attr("data-id"),
					userName = el.attr("data-username");
				new ConfirmDialog({
					title: '删除商品',
					confirmText: '确定',
					message: "<p>确定要删除该商品吗？</p>",
					callback: function() {
						var cfmDialog = this;
							self.deleteUser(userId, el);
					}
				});
			});
			// 彻底删除
			jQuery('#departGood .delete-user-forever:not(.disable)').unbind('click').bind('click', function() {
				var trEl = jQuery(this).closest("tr");
					new ConfirmDialog({
						title: '永久删除商品',
						confirmText: '确定',
						message: "<p>确定要永久删除该商品吗？</p>",
						callback: function() {
							var cfmDialog = this;
							goodModel.deleteUserCompletely({
								userId: trEl.attr("data-id")
							}).then(function(res) {
								if (res.code === 200) {
									notify.success("商品删除成功！");
									self.listGoods(1, "");
								} else {
									notify.warn('永久删除商品失败！');
								}
								cfmDialog.hide();
							});
							return false;
						}
					});
			});
			// 删除->恢复
			jQuery('#departGood .operate-icon-edit-restore:not(.disable)').unbind('click').bind('click', function() {
				var trEl = jQuery(this).closest("tr"),
					userId = trEl.attr("data-id"),
					userName = trEl.attr("data-username"),
					status = 1;

				new ConfirmDialog({
					title: '恢复商品',
					confirmText: '确定',
					message: "<p>确定要恢复该商品吗？</p>",
					callback: function() {
						var cfmDialog = this;
							goodModel.restoreUser({
								userId: userId
							}).then(function(res) {
								if (res.code === 200) {
									notify.success("商品恢复成功！");
									self.listGoods(1, "");
								} else {
									notify.warn(res.data.message);
								}
							});	
					}
				});
			});
			// 编辑商品
			jQuery('#departGood .edit-user:not(.disable)').unbind('click').bind('click', function() {
				var id = jQuery(this).closest("tr").attr("data-id");
				goodModel.getGoodInfo({
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
						notify.warn("获取商品信息失败！");
					}
				});
			});
			// 添加商品
			jQuery('#departGood #addGood:not(.disable)').unbind('click').bind('click', function() {
				jQuery("#createStoreHouse").show().html(self.options.template({
					createStoreHouse: {}
				})).siblings(".main").hide();
				self.bindCreateStoreHouse();
			});
		},
		/*
		 *	功能:启用和禁用某个商品
		 *	@id:商品ID
		 *	@status : [0 禁用 1 启用]
		 *	@el:当前元素
		 */
		setUserStatus: function(id, status, el) {
			var action = status === 0 ? "禁用" : "启动",
				msg = status === 0 ? "确定要禁用该商品吗?" : "确定要启用该商品吗?",
				self = this,
				usernamelog;

			if (el.closest("tr").attr("data-username")) {
				usernamelog = el.closest("tr").attr("data-username");
			} else {
				usernamelog = el.closest(".action").attr("data-username");
			}

			new ConfirmDialog({
				title: '商品 [ 启用 | 禁用 ]',
				confirmText: '确定',
				message: "<p>" + msg + "</p>",
				callback: function() {
					var cfmDialog = this;
						goodModel.updateUserStatus({
							"id": id,
							"status": status
						}).then(function(res) {
							if (res.code === 200) {
								
								logDict.insertMedialog("m3", action + usernamelog + "商品信息", "f6");
								if (status === 1) {
									el.removeClass('operate-icon-switch-off').addClass('operate-icon-switch-on').attr('data-mark', 1);
								} else {
									el.removeClass('operate-icon-switch-on').addClass('operate-icon-switch-off').attr('data-mark', 0);
								}
							} else {
								notify.warn("修改商品状态失败！");
							}
						});
				}
			});
		},
		/*
		 *	功能:删除商品
		 *	@id:商品ID
		 *	@el:当前元素(tr)
		 */
		deleteUser: function(id, el) {
			var self = this;
			goodModel.deleteUser({"id": id}).then(function(res) {
				if (res.code === 200) {
					notify.success("商品删除成功！");
					logDict.insertMedialog("m3", "删除" + el.attr("data-username") + "商品信息", "f6", "o3");
					self.listGoods(1, '');
				} else {
					notify.warn("商品删除失败！");
				}
			});
		},
		/*
		 *	功能:商品表单验证
		 *	@selector:"#createUser" or "#editUser"
		 *	@sendData:验证成功之后的回调函数(向后端发送数据)
		 */
		volidatestorehouseform: function(selector, sendData) {
			// 先获取商品的比分  
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
						maxlength: 50
						// remote: {
						// 	url: "/service/usr/check_user_name_same",
						// 	type: "post",
						// 	data: {
						// 		userName: function() {
						// 			return jQuery(selector + " #username").val().trim();
						// 		}
						// 	}
						// }
					},
					desctiption: {
						required: false
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
						required: "请输入商品名！",
						maxlength:"商品名最多50个字符！"
					//	remote: "该商品名已被使用，请重新输入！"
					},
					desctiption: {
						required: false
					},
					status: {
						required: true
					}
				}
			});
		},
		/*
		 *	功能: 编辑商品页面相关事件
		 *	@id:该商品ID
		 *	@extraData:该商品权限相关的数据
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
			// 保存商品信息
			self.volidatestorehouseform("#editUser", function() {
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
				//pva编辑商品
				goodModel.updateUser(user, {
					beforeSend: function() {
						jQuery("#editUser #saveUser").attr("disabled", "disabled");						
						
					},
					complete: function() {
						jQuery("#editUser #saveUser").removeAttr("disabled");
					}
				}).then(function(res) {
					if (res.code === 200) {
						var fingerData , param = {};
						notify.success("商品编辑成功！");
						self.listGoods(1, '');
					} else {
						notify.warn(res.data.message);
					}
				});
			});
			// 取消
			jQuery("#editUser #cancel").unbind("click").bind("click", function() {
				self.listGoods(1, '');
			});
		},

		/*
		 *	功能:创建商品页面相关事件
		 */
		bindCreateStoreHouse: function() {
			var self = this;
			// 验证表单并向后端发送数据
			self.volidatestorehouseform("#createStoreHouse", function() {
				var user = {
					loginName: jQuery("#createStoreHouse #username").val().trim(),
					loginName: jQuery("#createStoreHouse #desctiption").val().trim(),
					status: 1
				};
				user.password = md5(user.password);
                	goodModel.createGoods(user, null).then(function(res) {
						if (res.code === 200) {
	                        notify.success("商品创建成功！");
	                        self.listGoods(1, '');
	                        jQuery("#createStoreHouse").html("");
	                    } else {
	                        notify.warn(res.data.message);
	                    }
					});
			});
			// 取消
			jQuery("#createStoreHouse #cancel").unbind("click").bind("click", function() {
				self.listGoods(1, '');
			});
		}
	});
	return GoodMgr ;
});