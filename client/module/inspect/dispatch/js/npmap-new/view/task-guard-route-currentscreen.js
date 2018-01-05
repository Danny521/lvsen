define([
	'js/npmap-new/map-variable', 
	'js/sidebar/map-video-play-bar',
	'jquery',
	'underscore',
	'mootools'
	 ],
	function(Variable, MapVideoPlay,jQuery,_,mt){
		var player;
		var GuardRouteCurScreen = function(){
		};
		GuardRouteCurScreen.prototype = {
			routeCache:[],
			routeNum:null,
			playMode:'single',//'single'代表一条警卫路线，'much'代表多条警卫路线
			routeCount:3,//允许添加的警卫路线条数
			_core:function(data){
				var self = this;
				var index;
				self._setRouteCache(data);
				self._play(data);
			},
			_play:function(data){
				var self = this;
				if (self.routeCache.length===1) {
					self._singlePlay(data.data,data.isPre);
				}else{
					self._playByRouteId(data);
				}
			},
			_playByRouteId:function(data){
				var self = this;
				var index = self._getIndexByRouteId(data.routeId);
				self._playVideo(data.data[1], index);
				self._writeTitle(data.routeName,index);
			},
			_getIndexByRouteId:function(id){
				var self = this;
				var i = self.routeCache.length;
				while(i--){
					if (self.routeCache[i].routeId===id) {
						return self.routeCache[i].index;
					}
				}
			},
			_singlePlay: function(data,isPre) {
				var self = this;
				var cameras = data;
				/*for (var i = 0; i < data.length; i++) {
				 self._stopVideo(i);
				 self._playVideo(data[i], i);
				 }*/
				/* [避免视频重复加载，平移2\3给 1\2  只让3加载
				 * @author wujingwen
				 * @date   2015-08-13
				 */
				if (!cameras[0]||!cameras[2]) {
					//第一次加载全部摄像机数据
					for (var i = 0; i < cameras.length; i++) {
						self._stopVideo(i);
						self._playVideo(cameras[i], i);
					}
				}
				else if(!isPre){
					//先移动播放窗口，以避免重复加载摄像机视频
					player.playerObj.ReplaceWindow("{\"step\":1}");
					//移动完成后，加载第三屏摄像机视频即可
					self._stopVideo(2);
					self._playVideo(cameras[2], 2);
				}else{
					//先移动播放窗口，以避免重复加载摄像机视频
					player.playerObj.ReplaceWindow("{\"step\":-1}");
					//移动完成后，加载第三屏摄像机视频即可
					self._stopVideo(0);
					self._playVideo(cameras[0], 0);
				}
				self._singleRouteTitle();
			},
			_singleRouteTitle:function(){
				var self = this;
				var titles = ['已经行驶过','正在通过','即将到来'];
				for (var i = 0; i < titles.length; i++) {
					self._writeTitle(titles[i],i);
				}
			},
			/**
			 * [_writeText description]
			 * @author Mayue
			 * @date   2015-05-10
			 * @param  {[type]}   obj [description]如下
			 * @return {[type]}       [description]
			 */
			_writeTitle:function(str,index){
				var data = {
					'title':str,
					'index':index
				};
				MapVideoPlay.writeTitle(data);
			},
			/**
			 * [_setRouteCache 设置RouteCache变量，用来存储警卫路线的信息 根据警卫路线id进行设置]
			 * @author Mayue
			 * @date   2015-05-10
			 * @param  {[type]}   data [description]
			 */
			_setRouteCache:function(data){
				var self = this;
				var has = self._hasThisRoute(data.routeId);
				if (has) {
					// return;
				}else{
					var tem = {
						'routeId':data.routeId
					};
					self._changeAddRoute();
					self.routeCache.push(tem);
					self._setIndex(data.routeId);
				}
				self._setRouteCacheData(data);
			},
			_setRouteCacheData:function(data){
				var self = this;
				var thisData = self._getRouteCacheById(data.routeId);
				thisData.routeData = Object.clone(data.data);
			},
			_changeAddRoute:function(){
				var self = this;
				if (self.routeCache.length===1) {
					 /*---------------播放--start-------------*/
					var data = player.cameraData[1];
					var tem = {
						"hdChannel":data.hdChannel,
						"sdChannel":data.sdChannel,
						"cId":data.cId,
						"cName":data.cName,
						"cType":data.cType,
						"cCode":data.cCode,
						"cStatus":data.cStatus
					};
					var index = self._getRouteIndexById(self.routeCache[0].routeId);
					if (index!==1) {//如果就在中间播放就不用移动播放了
						self._playVideo(Object.clone(tem),index);
					}
					/*---------------播放--end-------------*/

					/*-------关闭多余的--start-----*/
					var num = player.getWindowCount();
					while(num--){
						if (num!==index) {
							self._stopVideo(num);
						}
					}
					/*-------关闭多余的--end-----*/
				}
			},
			_changeRemoveRoute:function(){
				var self = this;
				if (self.routeCache.length===1) {
					/*-------关闭所有--start-----*/
					var num = player.getWindowCount();
					while(num--){
						self._stopVideo(num);
					}
					/*-------关闭所有--end-----*/
					 /*---------------播放--start-------------*/
					var arr = self._getRouteDataById(self.routeCache[0].routeId);
					//object转array，需要先标记长度，add by zhangyu 2015.09.15
					arr.length = 3;
					var playerData = Array.clone(arr);
					//加载单条路线数据
					for (var i = 0; i < playerData.length; i++) {
						self._playVideo(playerData[i],i);
					}
					//设置title
					self._singleRouteTitle();
					/*---------------播放--end-------------*/
				}
			},
			_setIndex:function(id){
				var self = this;
				var thisRouteCache = self._getRouteCacheById(id);
				thisRouteCache.index = self._getValidIndex();
			},
			_getValidIndex:function(){
				var self = this;
				var existIndex = self._getRouteCacheIndex();
				var index;
				for (var i = 0; i < self.routeCount; i++) {
					if (_.indexOf(existIndex,i)===-1) {
						index = i;
						break;
					}
				}
				return index;
			},
			_getRouteCacheIndex:function(){
				var self = this;
				var result = [];
				var i = self.routeCache.length;
				while(i--){
					if (self.routeCache[i].index!==undefined) {
						result.push(self.routeCache[i].index);
					}
				}
				return result;
			},
			_getRouteIndexById:function(id){
				var data =this._getRouteCacheById(id);
				if (data) {
					return data.index;
				}else{
					//notify.error('RouteCache为空');
					console.warn('RouteCache为空')
				}
			},
			_getRouteDataById:function(id){
				return this._getRouteCacheById(id).routeData;
			},
			_getRouteCacheById:function(id){
				var self = this;
				var i = self.routeCache.length;
				while(i--){
					if (self.routeCache[i].routeId === id) {
						return self.routeCache[i];
					}
				}
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

			_cleanScreen:function(){
				var self = this;
				var num = player.getWindowCount();
				while(num--){
					self._stopVideo(num);
				}
			},
			_playVideo:function(data,index){
				if (data) {
					player.playSH(data,index);
				}else{
					this._stopVideo(index);
				}
			},
			_stopVideo:function(index){
				player.playerObj.Stop(false, index);
				player.playerObj.RefreshVideoWindow(index);
				player.playerObj.SetStreamLostByIndex(0, index);
				this._writeTitle('',index);
			},
			/**
			 * [_initPlay 初始化播放器]
			 * @author Mayue
			 * @date   2015-05-10
			 * @return {[type]}   [description]
			 */
			_initPlay:function(){
				if(jQuery(".map-video-play-bar").length === 0) {
					player = Variable.mapVideoBarPlayer = MapVideoPlay.init();
				}else{
					player = Variable.mapVideoBarPlayer;
				}
				//显示
				if (jQuery('#map-video-play-bar .bar-control').hasClass('down')) {
					jQuery('#map-video-play-bar .bar-control div.video-play-column-bt').trigger('click');
				}
				//警卫路线播放的条件下，不显示地图播放栏的关闭按钮,add by zhangyu on 2015/5/23
				jQuery(".np-map-play-bar-close").hide();
				//设置警卫路线播放时的屏数
				if (player.getWindowCount()!==3) {
					MapVideoPlay.setLayout({column: 3});
				}
				//jQuery('.map-video-play-bar').css("display","block");
			},
			/**
			 * [send 警卫路线发送函数  供外部调用]
			 * @author Mayue
			 * @date   2015-05-10
			 * @param  {[type]}   data [description]
			 * @return {[type]}        [description]
			 */
			send:function(data){
				var self = this;
				//如果当前是双击放大状态，则不再切换ocx的数据流，bug[45819]
				if ($("#streetMap1").hasClass("infinity")) { 
					self._initPlay();
					//第一次启动警卫路线时关闭之前的残余视频
					if (self.routeCache.length === 0) {
						self._cleanScreen();
					}
					self._core(data);
				}
			},
			stop:function(id){
				var self = this;
				var index = self._getRouteIndexById(id);
				if (self.routeCache.length===1) {
					self._cleanScreen();
					jQuery('.np-map-play-bar-close').trigger('click');
				}else{
					self._stopVideo(index);
				}
				self._updataRouteCache(id);
				self._changeRemoveRoute();

				//jQuery('.map-video-play-bar').css("display","none");
			},
			_updataRouteCache:function(id){
				var self = this;
				var i = self.routeCache.length;
				while(i--){
					if (self.routeCache[i].routeId===id) {
						self.routeCache.splice(i,1);
					}
				}
			}
		};

		return new GuardRouteCurScreen();
});
