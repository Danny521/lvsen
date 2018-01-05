require(['/require-conf.js'], function () {
		require(['jquery', 
			'mootools',
			'base.self',
			'/module/common/js/player2.js',
			'broadcast',
			'js/route-layout'
			], function (jQuery,mt,base,Ocxplayer,BroadCast,RouteLayout) {
		
			 var GuardRouteExtendScreen  = function(){
				this._init();
			};

			GuardRouteExtendScreen.prototype = {
				players:null,
				routeCache:[],//用来存储警卫路线和对应的播放器的map
				_init:function(){
					this._addBroadCast();
				},
				_hasThisRoute:function(id){
					var self = this;
					var i = self.routeCache.length;
					var has = false;
					while(i--){
						if (self.routeCache[i].routeId===id) {
							has = true;
							break;
						}
					}
					return has;
				},
				_getRouteCacheById:function(id){
					var self = this;
					var i = self.routeCache.length;
					while(i--){
						if (self.routeCache[i].routeId === id) {//debugger
							return self.routeCache[i];
						}
					}
				},
				_startGuardRoute:function(data){
					var self = this;
					self._setRouteCache(data, function() {
						self._play(data);
					});//debugger
				},
				_play:function(data){
					var self = this;//debugger
					var cameras = data.data;
					var playerData = self._getPlayerById(data.routeId);//debugger
					var player = playerData.player;
					//console.log(cameras);
					if(!cameras[0]){
						//第一次加载全部摄像机数据
						for (var i = 0; i < cameras.length; i++) {
							self._stopVideo(player,i);
							self._playVideo(player,cameras[i],i);
						}
					} else {
						//先移动播放窗口，以避免重复加载摄像机视频
						player.playerObj.ReplaceWindow("{\"step\":1}");
						//移动完成后，加载第三屏摄像机视频即可
						self._stopVideo(player,2);
						self._playVideo(player,cameras[2],2);
					}	
					
				},
				_playVideo:function(player,data,index){	
					if (data) {																									
						player.playSH(data,index);
					}else{
						this._stopVideo(player,index);
					}
				},
				_stopVideo:function(player,index){
					player.playerObj.Stop(false, index);
					player.playerObj.RefreshVideoWindow(index);
					player.playerObj.SetStreamLostByIndex(0, index);
				},
				_setRouteCache:function(data, fn){
					/**
					 * 用回调的方式实现，以解决ie下，播放器播放样式加载慢造成单屏播放的问题。
					 * @type {GuardRouteExtendScreen}
					 */
					var self = this;
					var has = self._hasThisRoute(data.routeId);
					if (has) {
						//执行回调
						fn && fn();
						return;
					}else{
						RouteLayout.getPlayer(data.routeName, function(res) {
							var tem = {
								'routeId': data.routeId,
								'playerData': res
							};
							self.routeCache.push(tem);
							//执行回调
							fn && fn();
						});//debugger
					}
				},

				_getPlayerById:function(id){
					var data = this._getRouteCacheById(id);
					if (data) {
						return data.playerData;
					}else{
						 // notify.error('RouteCache为空');
						 console.warn('RouteCache为空');
						 return;
					}
				},
				_stopGuardRoute:function(id){
					var self = this;
					var playerData = self._getPlayerById(id);
					if (!playerData) {return;}
					var player = playerData.player;
					var i = player.getWindowCount();
					while(i--){
						self._stopVideo(player,i);
					}
					self._updataRouteCache(id);
				},
				_updataRouteCache:function(id){
					var self = this;
					var i = self.routeCache.length;
					while(i--){
						if (self.routeCache[i].routeId===id) {
							RouteLayout.removePlayer(self.routeCache[i].playerData.id);
							self.routeCache.splice(i,1); 
						}
					}
				},
				/**
				 * [_addBroadCast 添加全站通知  绑定事件]
				 * @author Mayue
				 * @date   2015-05-05
				 */
				_addBroadCast: function() {
					var self = this;
					BroadCast.on("sendGuardRoute", function(data) {
						self._startGuardRoute(data);
					});
					BroadCast.on("stopGuardRoute", function(data) {
						self._stopGuardRoute(data.routeId);
					});
				}
			};

			window.GuardRouteExtendScreen = new GuardRouteExtendScreen();
	});

});
