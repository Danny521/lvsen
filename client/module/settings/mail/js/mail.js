define(["jquery.pagination","js/jquery.mockjax"],function(){
    jQuery(function(){

var mailSeting = function MailSeting() {
			this.init();
	};
	
	mailSeting.prototype = {
		
		init: function () {				
				this.load();
				this.changeMsg();				
			},
			
		url: {
			//获取邮件配置信息
            'getMailCfg':'/service/config/get_mail_config',
			
			//邮箱配置
            'sendMailCfg':'/service/config/oper_mail_config' 
		},
		
		
		
		load: function () {
			var self = this;
			
			$.post(self.url.getMailCfg,function(loadData){	//获取配置信息并写入页面			
				if (loadData.data.id){					
				$('.setlist .usertype').val(loadData.data.acct_type); //账户类型
				// $('.setlist .receive').val(loadData.data.rec_server); //接收邮件服务器
				$('.setlist .send').val(loadData.data.send_server); //发送邮件服务器
				$('.setlist .port').val(loadData.data.send_server_port); //端口
				$('.setlist .username').val(loadData.data.mail_from); //邮箱用户名
				$('.setlist .userpass').val(loadData.data.mail_pass); //密码				
				self.bindEvt(loadData);
				} else {
					self.bindEvt();
				} 
			}).error(function() {				
				self.bindEvt();				
			})	
				
		},
		
		bindEvt: function (loadData) {
			var self = this;					
			$('.enter .save').off('click').on('click',function () {		//确定保存，如果第一次添加，走'add'接口进行添加，否则走'update'接口进行修改		
				
				$(".setlist input").each(function() {
					if ($(this).val() == ''){
						$(this).css('borderColor','red')
						$(this).siblings(".error-info").show();
						$(this).addClass('warnstyle').on('webkitAnimationEnd , AnimationEnd',function(){ $(this).removeClass('warnstyle') })
					return;
					}					
				});
				
				if ($(".setlist input[style*='red']").length == 0) {
					if (!loadData || loadData.data.id == null) {
						self.mailSet('add', 1, null);						
					} else {
						self.mailSet('update', 1, loadData.data.id);
					}
				}
			});
			
			
			$('.enter .test').off('click').on('click',function () {	//检测邮箱配置，会发送测试邮件，但不保存配置			
				
				$(".setlist input").each(function() {
					if ($(this).val() == ''){
						$(this).css('borderColor','red')
						$(this).siblings(".error-info").show();
						$(this).addClass('warnstyle').on('webkitAnimationEnd , AnimationEnd',function(){ $(this).removeClass('warnstyle') })
					return;
					}					
				});
				
				if ($(".setlist input[style*='red']").length == 0){
					self.mailSet('test',0,null);
				}			
				
			});
						
		},
		
		mailSet: function (method,save,id) {	
				var self = this;
				
				if (/(?=@)@netposa.com/i.test($('.setlist .username').val())){  //针对netposa的邮件名做特殊处理
					var user = $('.setlist .username').val();					
				} else {
					var user = $('.setlist .username').val().match(/^.*(?=@)/).toString();
						}
				
				sData = {
				'isSave': save,
			    'opMethod': method,	
			    'mailServer':JSON.stringify({									
				"rec_server":$('.setlist .username').val(),
				"send_server":$('.setlist .send').val(),
				"send_server_port":$('.setlist .port').val(),
				"mail_from":$('.setlist .username').val(),
				"mail_user":user, //截取邮箱用户名
				"mail_pass":$('.setlist .userpass').val(),
				'id':id
				})		
			    };
				
				
								
			$.post(self.url.sendMailCfg,sData,function (loadData) {				
				if (loadData.code == 200 ){						
					switch (sData.opMethod){
						case 'add': 
						notify.success('邮箱配置添加成功！')
						break;
						case 'update':
						notify.success('邮箱配置修改成功！')
						break;
						case 'test':
						notify.success('邮箱测试成功！')
						break;
					};
				
				
				} else {
					notify.error(loadData.data.message)
				}
			}).error(function(){
				notify.error('请求失败');
			})
			
			
		},
		
		regEx: {			
			mail:function (input) { //邮箱格式正则表达式及错误提示,必须传入jquery input对象				
				//var reg = /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;
				var reg = /^[A-Za-zd]+([-_.][A-Za-zd]+)*@([A-Za-zd]+[-.])+[A-Za-zd]{2,5}$/;
				if (input.val() && !reg.test(input.val())){	
					input.css('borderColor','red')
					notify.error('邮箱格式错误！')
					input.siblings(".error-info").show();
				} else {
					input.css('borderColor','#2da5ec')
					input.siblings(".error-info").hide();
				}
			},
			
			port:function (input) {  //端口格式正则表达式及错误提示
				if (input.val() && !/^\d+$/.test(input.val()) ||input.val()<1 ||input.val()>65535){
					input.css('borderColor','red')
					notify.error('端口必须是1~65535范围内的数字！')
					input.siblings(".error-info").show();
				} else {
					input.css('borderColor','#2da5ec')
					input.siblings(".error-info").hide();
				}
			},
			
			smtp: function(input) {  //smtp服务器验证，只能输入以smtp.打头的地址或ip地址
				var reg = /^smtp\.|((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)/ || /^smtp\..*/i;
				if (input.val() && !reg.test(input.val())){	
					input.css('borderColor','red')				
					notify.error('SMTP服务器错误！')
					input.siblings(".error-info").show();
				} else {
					input.css('borderColor','#2da5ec')
					input.siblings(".error-info").hide();
				}
			},
			
			pass:function(input){  //密码只能由数字，字母，下划线组成
				var reg = /[0-9a-zA-Z_]/;
				
				if (input.val() && !reg.test(input.val())){	
					input.css('borderColor','red')				
					notify.error('密码只能由数字，字母，下划线组成！')
					input.siblings(".error-info").show();
				} else {
					input.css('borderColor','#2da5ec')
					input.siblings(".error-info").hide();
				}
				
			}
			
		},
		
		changeMsg:function () {
			var self = this;			
			
			$('.setlist .username').off('input').on('input',function () { 
				
				if ($(this).val() == ''){
					$(this).siblings('ul.mailplg').hide();					
				} else {
					self.mailPlugin($(this));
				}
				
				$(this).off('change').on('change',function() {
					self.regEx.mail($(this));
					
				})
				
			});
			
			
			
			$('.setlist .port').off('change').on('change',function () { //端口格式验证
				self.regEx.port($(this));
			});
			
			$('.setlist .send').off('change').on('change',function () { //发送邮件服务器(smtp)格式验证
			self.regEx.smtp($(this));
			})
			
			$('.setlist .userpass').off('change').on('change',function () { //密码格式验证
			self.regEx.pass($(this));
			})
			
		},
		
		mailPlugin: function (mailIpt) {  //邮箱自动补全方法
			
			var li = mailIpt.closest('li.setlist'),
			    ul = li.find('ul.mailplg'),
			    html = '<li>mailIpt@netposa.com</li><li>mailIpt@qq.com</li><li>mailIpt@gmail.com</li><li>mailIpt@163.com</li><li>mailIpt@126.com</li><li>mailIpt@sina.com</li>',
				reHtml = html.replace(/\w+(?=@)/g,function(a){
					
					if (mailIpt.val().indexOf('@') == -1)	{
						return a = mailIpt.val();
					} else {
						return false;
					}	
							
				});
			
			
			
			if (reHtml.indexOf('false') == -1){				
				li.css('position','relative');						
			ul.html(reHtml);
			
			ul.show(500).off('mousedown click').on('mousedown click','li',function () {				
				mailIpt.val($(this).text()).change();	//此处将下拉选项写入输入框		
				ul.hide(500);								
			})
			
				
			} else {
				ul.hide(500);
			}
			
			mailIpt.off('blur').on('blur',function () {
				ul.hide(500);
			})
			
			
		}
		
		
	



	}
	
return new mailSeting;

    });
});