define(['js/npmap-new/view/task-guard-route-currentscreen', 'broadcast', 'pubsub'],
	function(CurrentScreen,BroadCast, PubSub){
		var checkPlayOverTimer = null;
		var curGuardRoute = CurrentScreen;
		var screenNum;
		var GuardRoutePlay = function(){
			screenNum = window.JudgeExpand();
		};
		/**
		 * 进行浏览器兼容性判断，ie下会抛出异常，非ie下正常，故此处进行区别对待
		 * add by zhangyu on 2015/6/4
		 * @param handle - 窗口的句柄
		 * @returns {*}
		 */
		var checkExpandHandle = function(handle) {
			if ((/msie/.test(navigator.userAgent.toLowerCase()))) {
				//ie下扩展屏的句柄判断
				try {
					//ie下如果窗口关闭，下句会报错，故用try，catch传递错误来实现
					handle.document;
					return true;
				} catch (e) {
					return false;
				}
			} else {
				//非ie下扩展屏的句柄判断
				return handle.window;
			}
		};

		GuardRoutePlay.prototype = {
			send:function(data){
				if (screenNum===1) {//单屏
					curGuardRoute.send(data);
				}else if (screenNum===2){//非单屏
					if(window.expandRouteWinHandle&&checkExpandHandle(window.expandRouteWinHandle)){
						BroadCast.emit("sendGuardRoute",data);
					}else{
						/**
						 * 备注：
						 * ie9下，window.open方式打开页面时，页面title即窗口名字中不允许有特殊字符，如（空格、“-”等）
						 * 兼容性问题，add by zhangyu on 2015/6/5
						 */
						window.expandRouteWinHandle = window.openExpandScreen("/module/inspect/dispatch/guard-route.html", "guardroutescreen");
						window.setTimeout(function(){
							BroadCast.emit("sendGuardRoute",data);
						},1500);
						//监测扩展屏窗口是否存在
						this.checkExtendScreenPlayOver();
					}
				}
			},
			stop:function(id){
				if (screenNum===1) {//单屏
					curGuardRoute.stop(id);
				}else if (screenNum===2){//非单屏
					BroadCast.emit("stopGuardRoute", {routeId:id});
				}
			},
			/**
			 * 发送扩展屏播放后，定时检测扩展屏窗口是否关闭，如果关闭，则直接关闭警卫路线的播放
			 */
			checkExtendScreenPlayOver: function () {
				//如果已经存在，则关闭定时器
				if(checkPlayOverTimer) {
					window.clearInterval(checkPlayOverTimer);
				}
				//开启检测定时器
				checkPlayOverTimer = window.setInterval(function() {
					if(!window.expandRouteWinHandle || !checkExpandHandle(window.expandRouteWinHandle)) {
						if(checkPlayOverTimer) {
							window.clearInterval(checkPlayOverTimer);
						}
						checkPlayOverTimer = null;
						//关闭所有在播放的警卫路线
						PubSub.publish("stopAllPlayingRoute");
					}
				}, 500);
			}
		};

		return new GuardRoutePlay();
});
