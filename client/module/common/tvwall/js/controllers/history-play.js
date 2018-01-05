/**
 * 历史录像进度条
 */
define([
	"jquery",
	"underscore",
	"handlebars",
	"pubsub"
],function(jQuery, _, Handlebars, PubSub) {

	var history_play = function (config) {
		var self = this;
		jQuery.extend(self.config, config);
		self._init();
		self._bindEvent();
	};
	history_play.prototype = {
		config :{
			playSpeed: 1,   // 播放速度1,2,4,8
		 	isPlayed: true, // 是否播放
		 	beginTime: 0,   // 开始时间(毫秒数)
		 	endTime: new Date().getTime(),   //结束时间(毫秒数)
			playPosition: 123  //播放进度(毫秒数)
		},
		urls: {
			checkInfoUrl: "/service/md/screenWindowInfo/",
			commandUrl:"/service/md/vodstream/control/"
		},
		timer: null,
		/**
		 * 初始化
		 */
        _init: function(){

			var self = this;
			jQuery("#historySlider").slider({
				range: 'min',
				step: 1,
				max: self.config.endTime,
				min: self.config.beginTime,
				value: self.config.playPosition,
				change: function(e) {
					if (jQuery(e.currentTarget).length) {
						console.log("手动seek，发送请求");
						var speed = jQuery(this).slider('value'),
							url = self._getUrl("commandUrl"),
							data = {
								screen: self.config.param.screen,
								window: self.config.param.window,
								cmd: 5,
								param: speed
							}
						jQuery.post(url, data, function(res) {

						});
					}
				}
			});
			jQuery(".historySpeed").text('x' + self._format(self.config.playSpeed));
			if(self.config.isPlayed){
				jQuery(".history-video-btn .toggle").removeClass('toggle-pause').addClass('toggle-play');
			}else{
				jQuery(".history-video-btn .toggle").removeClass('toggle-play').addClass('toggle-pause');
			}
			self._startTimmer();
        },
        _startTimmer: function(){
			var self = this;
			if (self.timer) {
				window.clearInterval(self.timer);
			} 
			self.timer = window.setInterval(function() {
				self._queryPlayInfo();
			}, 1500);
        },
        /**
		 * 每隔1秒发送请求，刷新进度条
		 */
        _queryPlayInfo: function(callback){
			var self = this;
			   
			jQuery.get(self._getUrl("checkInfoUrl"), self.config.param).then(function(res) {
				if (res && res.code === 200) {
					self._renderProcess(res.data.playingInfo);
				}
			});
        },
        //渲染结果分为3部分：1进度条 2播放倍速 3播放状态
        _renderProcess: function(data){
			var self = this;
			self.currentSpeed = data.speed;
			jQuery("#historySlider").slider({
				max: data.endTime,
				min: data.startTime,
				value: data.currentTime
			});
			jQuery(".historySpeed").text('x' + self._format(data.speed));
			var flag = data.status === 1 ? true : false;
			if(flag){
				jQuery(".history-video-btn .toggle").removeClass('toggle-pause').addClass('toggle-play');
			}else{
				jQuery(".history-video-btn .toggle").removeClass('toggle-play').addClass('toggle-pause');
			}
        },
        _getUrl: function(urlString){
        	var self = this,
        	    serverId = self.config.param.serverId,
        	    url = self.urls[urlString];
        	    return url+serverId;
        },
        //格式化倍速
        _format:function(speed){
			if(speed === 0.125){
                return "1/8";
			}else if(speed === 0.25){
                return "1/4";
			}else if(speed === 0.5){
                return "1/2";
			}else{
				return speed;
			}
        },
		/**
		 * 事件绑定
		 */
		_bindEvent: function () {
			var self = this;
			//点击关闭按钮
			jQuery(".history-play-bar-panel").off("click",".playbar-close").on("click", ".playbar-close", function (e) {
				e.preventDefault();
				e.stopPropagation();
				if(self.timer){
        		   window.clearInterval(self.timer);
        	    }
				jQuery(".history-play-bar-panel").empty();
				jQuery(".history-play-bar-panel").hide();
			});
			/*cmd 
			     UNKNOW 0
			     PLAY   1
			     PAUSE  2
			     STOP   3
			     SPEED  4
			     SEEK   5
			     LOCATION 6
			*/
			// 慢速播放
			jQuery('.history-play-bar-panel').off("click",".slow-play").on('click', '.slow-play', function() {
                var speed = self.currentSpeed ? self.currentSpeed :self.config.playSpeed;
				if (speed === 0.125) {
					notify.warn('已经是最小倍速！');
					return false;
				}
                var url =  self._getUrl("commandUrl"),
                    data = {
                    	screen:self.config.param.screen,
                    	window:self.config.param.window,
                        cmd:4,
                        param:speed / 2
                    }
				jQuery.post(url,data,function(res){

				}); 
				
			});
			// 快速播放
			jQuery('.history-play-bar-panel').off("click",".quick-play").on('click', '.quick-play', function() {
                var speed = self.currentSpeed ? self.currentSpeed :self.config.playSpeed;
				if (speed === 8) {
					notify.warn('已经是最大倍速！');
					return false;
				}
                var url =  self._getUrl("commandUrl"),
                    data = {
                    	screen:self.config.param.screen,
                    	window:self.config.param.window,
                        cmd:4,
                        param:speed * 2
                    }
				jQuery.post(url,data,function(res){

				}); 
				
			});
			// 暂停播放
			jQuery('.history-play-bar-panel').off("click",".toggle").on('click', '.toggle', function() {
               
				var command = jQuery(this).hasClass('toggle-pause') ? 1 : 2, // 1暂停 2播放 
					speed = self.currentSpeed ? self.currentSpeed : self.config.playSpeed,
					url = self._getUrl("commandUrl"),
					data = {
						screen: self.config.param.screen,
						window: self.config.param.window,
						cmd: command,
						param: speed
					}
				jQuery.post(url, data, function(res) {

				});
				
			});
			
		},
		/**
		 * 关闭面板
		 * 
		 */
		closeHistoryPanel: function () {
			var self = this;
			if(self.timer){
        		window.clearInterval(self.timer);
        	}
			jQuery(".history-play-bar-panel").empty();
			jQuery(".history-play-bar-panel").hide();
		},
		/**
		 * 获取timmer
		 * 
		 */
		getTimmer: function () {
			var self = this;
			return self.timer;
		}
	};
	return history_play;
});