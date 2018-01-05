define(["jquery","jquery-ui-timepicker-addon","base.self","handlebars","./../js/jquery.mockjax"],function(){
	
	var mailMask = function MailMask() {
			this.newPlanUserCache = [];
			this.init();
	};
	
	mailMask.prototype = {
		
		init: function () {
			
			this.bindEvt();
			this.dateTimePlugin();
			
		},
		
		tpl:{},
		
		url:{
			
			//获取用户列表（全部）
            'getUser':'/service/check/get_plan_user',
			
			//添加计划
            'addTask':'/service/check/add_task_plan',
            
            //设置计划
            'setTask':'/service/check/set_task_plan'
		},
		

		
		loadTpl: function (name, callback) { //通用载入模板方法
			var self = this,
				url = "../common/inc/" + name + ".html";
			if (self.tpl[name]) {
				return callback(self.tpl[name]);
			}
			$.get(url).then(function (temp) {
				if (temp) {
					self.tpl[name] = Handlebars.compile(temp);
					callback(self.tpl[name]);
				}
			});
		},
		
		loadData: function (sendData,sendUrl,callback) {  //通用请求数据方法
			$.ajax({
			data:sendData,
			url:sendUrl,
			type:'post',
			success:function (res){
				if (res && res.code === 200 ){
					callback(res.data);
				} else {					
					notify.error(res.data.message)
				}
								
			},
			error: function () {				
			notify.error('请求失败！')			
			}
		})
		
		},
		
		bindEvt: function (id) {	
			var self = this;
			self.newPlanUserCache = [];	
			$(".form-panel").off('click').on('click','#linkage .btnsize',function () {
					self.loadAllUser(id);			
			});
		},


		sendChkData: function () {
			var self = this,
			    userArr = [];  //用来存储每个用户的信息

			    $('.mailitem').each(function() {
					
					if ($(this).attr('data-mail') == 1 || $(this).attr('data-sms') ==1) {
						var plan = $(this).attr('data-plan'),
			    	    user = $(this).attr('data-user'),
			    	    mail = $(this).attr('data-mail') || '0',
			    	    sms  = $(this).attr('data-sms') || '0';

			    	infoArr = {
			    	'plan_id':plan,
			    	'user_id':user,
			    	"send_mail":mail,
			    	"send_sms":sms,
					'sms_timer':$('.smstime').val(),
			       }
			      userArr.push(infoArr)
					}
			    				    
			    });

             var sData = {
			    	'isSend':1, //默认参数1					
			    	'planUser':	JSON.stringify({'planUser':userArr})		    	
			    };
				
			return sData
			    
		},
		
		loadAllUser: function (id) {
			var self = this,
				sdt = { 'plan_id': id || null },
				surl = self.url.getUser;


			self.loadTpl('mailMask', function (temp) {
				if (self.newPlanUserCache.length == 0) {
					
					self.loadData(sdt, surl, function (res) {						
							res.user_list.each(function (i) {
							i.plan_id = id
						})
						self.newPlanUserCache = res.user_list;
						showPanel(res.user_list);							
					});
					
				} else {
					showPanel(self.newPlanUserCache);
					console.log(self.newPlanUserCache);
				}
				
				function showPanel(data) {
					var ele = temp({ res: data });

					MaskLayer.show()
					new ConfirmDialog({ //调用base.self里的弹窗方法，可以遮盖ocx对象
						title: '联动选择',
						width: '800px',
						message: ele,
						classes: "msgPanel"
					})

					self.msgSet();
					
					self.smsTime();

					$('.common-dialog').off('click').on('click', '.blue', function () {
						self.sendChkData();
					});
				}
				
				
			});
		},
		
		msgSet: function () {
			var self = this;
			$('.mailitem span').off('click').on('click','i',function(){ //勾选邮箱/短信
							var index = $(this).closest("li.mailitem").attr("data-user")-1;
							if ($(this).attr('class').indexOf('sms') == -1){																								
								chk($(this),'mail');								
							} else {								
								chk($(this),'sms');								
							}	
							
							function chk(element,method){ //通用设置属性方法，设置1为勾选，0为取消
								if (element.attr('class').indexOf('checked') == -1){
									element.closest('.mailitem').attr("data-" + method,'1');
									element.addClass('checked');
									self.newPlanUserCache[index]["send_"+method] = 1
								} else {
									element.closest('.mailitem').attr("data-" + method,'0');
									element.removeClass('checked');	
									self.newPlanUserCache[index]["send_"+method] = 0
								}
								
							}
							
							});
			
		},
		
		smsTime: function () {					
			$('.wrapper').find('footer').prepend('<input class="smstime" placeholder="短信通知时间" >')
		},
		
		dateTimePlugin: function (){
				$(document).on('focus','.smstime',function() {				
				$('.smstime').timepicker({
					showSecond: true,
					timeOnlyTitle: "选择时间",
					timeFormat: 'HH:mm:ss',
					timeText: '',
					hourText: '时',
					minuteText: '分',
					secondText: '秒',
					showAnim: ''
				});
				})
		}
	
	
	
	
	
	
	
	
	
	}
	return new mailMask;
		
});