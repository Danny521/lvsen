/**
 * @authors chencheng (chencheng@netposa.com)
 * @date    2013-3-5 
 * @description  同步计划设置
 */
define(["ajaxModel","base.self",
			"jquery-ui",
			"jquery-ui-1.10.1.custom.min",
			"jquery-ui-timepicker-addon"
		], function(ajaxModel) {

	var SyncMgr = new Class({
		Implements: [Options],
		options: {
			template: null
		},
		initialize: function(options) {
			this.setOptions(options);
			
		},
		init:function(){
			jQuery("div#syncSetting").show().siblings(".main").hide();

			jQuery(".sync-bread").html((window.localStorage.getItem("uOrgInfo") && JSON.parse(window.localStorage.getItem("uOrgInfo")).name) || '本部');
			// 目前全局设置时间，如需单独设置传入orgId
			this.showPlan();

			// 获取当前用户所在组织的名称  val 值待定。。。
			// jQuery(".sync-bread").val();

			// 绑定相关按钮事件
			this.bindEvents();
		},
		/**
		 * 1. Seconds 秒
		 * 2. Minutes 分钟
		 * 3. Hours 小时
		 * 4. Day-of-Month 月中的天
		 * 5. Month 月
		 * 6. Day-of-Week 周中的天
		 * 7. Year (optional field) 年（可选的域） 
		 * 参见java CronTrigger (接口文档里也有说明)
		 * @author chencheng
		 * @date   2015-03-19
		 * @return {[type]}   [description]
		 */
		parseCronExpression:function(str){
			var arr = str.split(' '),
			 	f = arr[5];
			 	result = {
			 		frequence:f,
			 		time:arr.slice(1, 3).reverse().join(':')
			 	};

		 	if(f === '*' || f === '?'){
		 		result.frequence = 0;
		 	}
		 	return result;
		},
		/**
		 * 构建CronExpression
		 * @author chencheng
		 * @date   2015-03-19
		 * @param  {[type]}   f 频率  每天[0] 每周日[1] 每周一[2]
		 * @param  {[type]}   t 时间  23:59
		 * @return {[type]}             [description]
		 */
		assetCronExpression:function(f, t){
			var cronExp = '',
				time = t.split(':');

			if(f === 0){
				cronExp = '0 '+ parseInt(time[1],10) + ' ' + parseInt(time[0],10) + ' * * ?';
			}else{
				cronExp = '0 '+ parseInt(time[1],10) + ' ' + parseInt(time[0],10) + ' ? * ' + f;
			}

			return cronExp;
		},
		/*
		 * 回显之前设置的同步计划
		 */
		showPlan:function(orgId){
			var self = this;
			ajaxModel.getData("/service/config/schedule/sync").then(function(res){
				if(res.code === 200){
					var task = res.data.scheduleTask;

					// 如果是新建任务
					if(!task){return;}
					var schedule = self.parseCronExpression(task.expression);

					jQuery("#syncTime").val(schedule.time);
					jQuery("#frequence").val(schedule.frequence || 0);
					jQuery("#sId").val(task.id || '');

					if(task.closed === 0){
						jQuery(".switch-panel .switch").addClass('on').removeClass('off');
					}else{
						jQuery(".switch-panel .switch").addClass('off').removeClass('on');
					}
				}else{
					notify.warn(res.data.message || "获取同步计划时间失败");
				}
			});
		},
		bindEvents:function(flag){
			var self = this;
			// 权限控制
			permission && permission.reShow();
			
			// 保存计划
			jQuery("#savePlan").unbind("click").bind("click",function(){
				var el = jQuery(this);
				var data = {
					"closed":jQuery(".switch-panel .switch").is(".on") ? 0 : 1,
					"frequence":jQuery("#frequence option:selected").val(),
					"time":jQuery("#syncTime").val().trim(),
					"id":jQuery("#sId").val()
				};

				if(data.time === ""){
					notify.warn("请选择时间");
					return ;
				}
				data.expression = self.assetCronExpression(parseInt(data.frequence,10),data.time);
				delete data.time;
				delete data.frequence;

				var custom = {
					beforeSend:function(){
						el.prop('disabled',true);
					},
					complete:function(){
						el.prop('disabled',false);
					}
				};

				ajaxModel.postData("/service/config/schedule/sync",data,custom).then(function(res){
					if(res.code === 200){
						jQuery("#sId").val(res.data.id);

						logDict.insertMedialog("m3", "设置同步计划", "f8");
						notify.info(res.data.message || "设置同步计划成功")
					}else{
						notify.warn(res.data.message || "设置同步计划失败");
					}
				});
			});

			// 开启/关闭
			jQuery(".switch-panel .switch").unbind("click").bind("click",function(){
				jQuery(this).toggleClass('on off');
			});

		}
	});
	return SyncMgr ;
});