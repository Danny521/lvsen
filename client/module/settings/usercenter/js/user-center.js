/*global notifyClass:true */
/*用户中心*/

define([
	"ajaxModel",
	"md5",
	"jquery.validate",
	"handlebars",
	"base.self"
],function(ajaxModel, md5){
	var User = new Class({
		initialize: function(){
			this.registerHelper();
			this.getUserBaseInfo();
			this.bindEvents();
			this.passProving();
		},
		//注册助手
		registerHelper:function() {
			Handlebars.registerHelper("isAdmin", function (loginName, options) {
				if (jQuery("#userEntry").attr("data-orgid") === "null") {
					return options.fn(this);
				} else {
					return options.inverse(this);
				}
			});
			Handlebars.registerHelper("ifAdmin", function () {
				if (jQuery("#userEntry").attr("data-orgid") === "null") {
					return "disabled";
				}
			});
		},
		//事件绑定
		bindEvents: function(){
			var self = this;
			//隐藏高级设置
			jQuery("#header .wrapper a.item").hide();
			//jQuery("#myUL li[data-tab='advanceInf']").hide();
			jQuery("#myUL li").click(function(){
				var This = jQuery(this),
					thisTab = This.data().tab,					
					tabText = This.find("span").text();
				//激活当前项目
				This.addClass("active").siblings().removeClass("active");
				//激活当前项目对应信息
				jQuery("#major div[data-tab='"+thisTab+"']").addClass("active").siblings().removeClass("active");
				//修改面包屑
				jQuery("#major").find("#set").html(tabText);
				//获取信息
				if(thisTab === "baseInf"){
					//self.getUserBaseInfo();
				}
				if(thisTab === "advanceInf"){
					self.getUserAdvancedInfo();
				}
				if (thisTab === "notifyInf"){
					
				}
			});
		},
		//获取用户基本信息
		getUserBaseInfo: function(){
			var self = this;
			ajaxModel.getData('/service/usr/get_current_usr').then(function(res){
				if (res.code === 200) {
					var content = Handlebars.compile(jQuery("#user-base-info").html());
					jQuery("#info").html(content(res.data.usr));
					//验证用户基本信息
					self.validateOfBaseInfo();
					//用户基事件绑定
					self.bindUserBaseInfo();
				} else if (res.code === 500) {
					notify.error(res.data.message);
				}
			},function(){
				notify.error("请查看网络状况！");
			});

			// jQuery.ajax({
			// 	url: '/service/usr/get_current_usr',
			// 	type: 'get',
			// 	dataType: 'json',
			// 	success: function(res) {
			// 		if (res.code === 200) {
			// 			var content = Handlebars.compile(jQuery("#user-base-info").html());
			// 			jQuery("#userBaseInfo").html(content(res.data.usr));
			// 			//验证用户基本信息
			// 			self.validateOfBaseInfo();
			// 			//用户基事件绑定
			// 			self.bindUserBaseInfo();
			// 		} else if (res.code === 500) {
			// 			notify.error(res.data.message);
			// 		}
			// 	},
			// 	error: function() {
			// 		notify.error("请查看网络状况！");
			// 	}
			// });
		},
		//用户基本信息验证
		validateOfBaseInfo: function(){
			jQuery.validator.addMethod("stringCheck", function(value) {
				var df=/^[a-zA-Z0-9\u4E00-\u9FA5]+$/.test(value);
				return df;
			}, "格式不对，真实姓名由中文，数字，字母组成，如 张三，李四x，Amy，Alice1 !");

			jQuery("#signForm").validate({
				rules: {
					username: {
						required: true,
						maxlength: 50,
						usernamereg: true
					},
					realname: {
						stringCheck: $("#realname").val(),
						maxlength: 50,
						required: true
					},
					room: {
						fixedPhoneNumber: true
					},
					userid: {
						required: true,
						idcard: true
					},
					phone: {
						number: true,
						maxlength:11
					},
					email: {
						email: true
					},
					password: {
						minlength: 6,
						maxlength: 20,
					},
					confirm_password: {
						equalTo: "#password"
					}
				},
				messages: {
						username: {
						maxlength: "登录名不能超过50个字符！",
						usernamereg: "登录名由字母，数字，下划线组成！",
					},
					room: {
						fixedPhoneNumber: "号码输入格式有误，如010-8655112、010-86551122-0171！",
					},
					phone: {
						number: "号码必须为数字！",
						maxlength: "号码长度不超过11 ！"
					},
					userid: {
						idcard: "请输入正确的身份证号码！"
					},
					password: {
						minlength: "密码长度不小于6 ！",
						maxlength: "密码长度不超过20 ！",
					},
					confirm_password: {
						equalTo: "再次输入的密码不一致！"
					},
					realname: {
						maxlength: "真实姓名不能超过50个字符！",
						required: "请输入真实姓名！"
					},
					email: {
						email: "邮件地址格式不对，请重新输入！"
					}
				},
				success: function(label) {
					label.remove();
				}
			});
		},
		//用户基本信息保存
		bindUserBaseInfo: function(){
			var self = this;
			jQuery("#saveUser").click(function() {
				var id = $("#loginName").attr("data-id"),
					realname = $("#realname").val(),
					loginName = $("#loginName").val(),
					idCardNumber = $("#idCardNumber").val(),
					phoneNo = $("#phoneNo").val(),
					officeNo = $("#officeNo").val(),
					email = $("#email").val(),
					password = $("#password").val();

				var params = {
						id: id,
						name: realname,
						loginName: loginName,
						idCardNumber: idCardNumber,
						email: email,
						officeNo: officeNo,
						phoneNo: phoneNo
					};
						
				password && (params.password = md5(password));

				if (jQuery("#newPassFst").attr("class") == "new-pass-easy" ){
					return false;
				}		

				if (!jQuery("#signForm").valid()) {
					return false;
				}

				self.pvdUserMgr(params, function(err) {
					if (err) {
						return notify.error(err);
					}

					ajaxModel.postData('/service/usr/edit_current_usr',params).then(function(res){
						if (res.code === 200) {
							notify.success("修改成功！");
							logDict.insertMedialog("m3", "编辑" + realname + "用户信息", "f6", "o2");
						} else if (res.code === 500) {
	                        if(res.data && res.data.message.indexOf("-10041")>0){
	                            notify.error("登陆用户名称重复,请重试！");
	                        }else {
	                            notify.error((res.data && res.data.message) || '修改失败，服务器错误！');
	                        }
						}
					},function(){
						notify.error("请查看网络状况！");
					});
				})
			});
		},
		//获取用户高级信息
		getUserAdvancedInfo: function(){

		},
		passProving: function () {
			jQuery("#userBaseInfo").on("change input", "#password", function () {
				var pwd = jQuery("#password"),
					num = /^[0-9]+$/,
					strX = /^[a-z]+$/,
					strD = /^[A-Z]+$/,
					good = /^(?=.*[0-9])(?=.*[a-zA-Z])[0-9a-zA-Z]+$|^(?=.*[0-9])(?=.*[~!@#%&\$\^\*])[0-9~!@#%&\$\^\*]+$|^(?=.*[a-zA-Z])(?=.*[~!@#%&\$\^\*])[~!@#%&\$\^\*a-zA-Z]+$/.test(pwd.val()),
					complex = /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[~!@#%&\$\^\*])[0-9a-zA-Z~!@#%&\$\^\*]{6,20}$/.test(pwd.val()),
					vkeyWords= /^[~!@#%&\$\^\*]+$/,
					easy = num.test(pwd.val()) || strX.test(pwd.val()) || strD.test(pwd.val()) || vkeyWords.test(pwd.val()),
					len = pwd.val().length < 6 || pwd.val().length > 20;
				jQuery("#newPassFst").attr("class", "");
				if (easy && !len) {
					jQuery("#newPassFst").attr("class", "new-pass-easy");
				} else if (complex && !len) {
					jQuery("#newPassFst").attr("class", "new-pass-complex");
				} else if (good  && !len) {
					jQuery("#newPassFst").attr("class", "new-pass-mid");
				} else if (!len) {
					jQuery("#newPassFst").attr("class", "new-pass-err");
				}
			});				
		},
		/**
		 * 通知pvd创建、编辑用户
		 * @author LuoLong
		 * @date   2015-05-28
		 * @param  {[type]}   user     [用户信息]
		 * @param  {[type]}   callback [回调函数]
		 * @return {[type]}            [description]
		 */
		pvdUserMgr: function(user, callback) {
			if (!window.pvdSyncUser) {
	            return callback(null);
	        }
	        
			this.getPvdUserId(user.loginName, function(err, userId) {
				if (err) {
					return callback(err);
				}

				var params = {},
					k;
				for (k in user) {
					params[k] = user[k];
				}
				params.id = userId;
				
				jQuery.ajax({
	                url: "/pvdservice/system/user/saveOrUpdate",
	                data: params,
	                type: "post"
	            }).then(function(res){
	                if (res.code === 200) { //pvd创建、编辑用户成功
	                    callback(null);
	                } else {
	                    callback(res.message); //pvd创建、编辑用户失败
	                }
	            },function(res){
	                callback("请查看网络状况!"); //pvd创建、编辑用户失败
	            });
			})
		},
		getPvdUserId: function(userName, callback) {
			jQuery.ajax({
                url: "/pvdservice/system/user/getUserByName",
                data: { "userName" : userName },
                type: "post"
            }).then(function(res){
                if (res.code === 200 && res.data) { 
                    callback(null, res.data.id);
                } else {
                    callback("获取用户信息失败!"); 
                }
            },function(res){
                callback("请查看网络状况!"); 
            });
		}
	});
	return User;
});
