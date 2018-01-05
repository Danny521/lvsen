define(["ajaxModel","jquery","jquery.pagination", "handlebars","domReady",
	"base.self"],function(ajaxModel){

var configSeting = function ConfigSeting() {
			this.init();
	};
	
	configSeting.prototype = {
		
		init: function () {	
		    	this.loadConfigTemplete();			
				this.loadData();	
				this.bindEvent();		
			},
			
		url: {
			//获取服务器配置信息
             getSystemCfg:'/service/config/system_config',
             serciceSettingTplUrl: "/module/serviceconfig/inc/service-seting.html",
             configContain:".serviceContent"
		},
		 settingConfigTpl: {},

		loadData: function () {
				var self = this;
				
				$.get(self.url.getSystemCfg,function(loadData){	//获取配置信息并写入页面	
				var temp=self.settingConfigTpl(loadData.data);
	            jQuery(self.url.configContain).html(temp);


			}).error(function() {				
			    notify.error("获取配置失败！");	
			})	
				
		}, 
		/**
         * [loadNotifyTemplete 初始化模版]
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        loadConfigTemplete: function() {
            var self = this;
            // 消息提醒模板
            ajaxModel.getTml(self.url.serciceSettingTplUrl).then(function(tmp) {
                self.settingConfigTpl = Handlebars.compile(tmp);
            });
        },
		 /*
         *	绑定事件
         */
        bindEvent: function() {
           

           jQuery(document).on("click", ".mailtitle", function() {
           	 var self = this;
               $(self).find("i").toggleClass("down");
               var tt=$(self).siblings(".content");
               var index_old=$(self).attr("data-index");
               tt.each(function(){
               	    var gg = this;
               		var index_new=$(gg).attr("data-index");
              
                    if(index_old===index_new){
                    	$(gg).toggle();
                    }

				});
             //$(self).siblings(".content").toggle();
            });

		}

	}
	
return new configSeting;

});