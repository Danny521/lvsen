define(['js/npmap-new/map-variable', 'js/sidebar/map-video-play-bar', 'jquery'],
	function(Variable, MapVideoPlay,jQuery){

		var ExtendSreen = function(){};

		ExtendSreen.prototype = {
			/**
			 * 发送到电视墙
			 * @type {[type]}
			 */
			sendToExtendScreen: function(data) {
				//获取摄像机信息
				var cameraData = data || Variable.currentCameraData;
				//格式化信息
				var playData = {
					'layout': 4,
					'cameras': [
						{
							hdChannel: cameraData.hd_channel,
							sdChannel: cameraData.sd_channel,
							cId: cameraData.id,
							cName: cameraData.name,
							cType: cameraData.camera_type,
							cCode: cameraData.cameraCode,
							cStatus: cameraData.camera_status //摄像机在线离线状态 0-有 1-全部通道不可用
						}
					]
				};
				//发送至扩展屏
				var screenNum = window.JudgeExpand();
				if (screenNum === 1 || window.isPointPlay) { //单屏
					var index;
					//在下面播放
					if(jQuery(".map-video-play-bar").length === 0) {
						var player = Variable.mapVideoBarPlayer = MapVideoPlay.init();
						//播放
						index = player.getFreeIndex();
						player.playSH(playData.cameras[0],index);
					} else {
						index = Variable.mapVideoBarPlayer.getFreeIndex();
						if(jQuery(".bar-control").hasClass("down")){
							//弹起
							jQuery(".bar-control div").trigger("click");
							//播放

							Variable.mapVideoBarPlayer.playSH(playData.cameras[0],index);
						} else {
							//播放
							Variable.mapVideoBarPlayer.playSH(playData.cameras[0],index);
						}
					}
					MapVideoPlay.writeTitle({'index':index,'title':cameraData.name});

				} else if (screenNum === 2) { //非单屏
					playData.temporary = Math.random();
					window.sendExtendScreen(BroadCast,playData);

					/*if (window.expandWinHandle && window.expandWinHandle.window) {
						BroadCast.emit("ExtendSreen", playData);
					} else {
						window.expandWinHandle = window.openExpandScreen("/module/inspect/monitor/screen.html", "screen");
						setTimeout(function () {
							BroadCast.emit("ExtendSreen", playData);
						}, 2000);
					}*/
				}
				if(location.href.indexOf("dispatch") >= 0){
					logDict.insertLog("m1", "f2", "o6", "b10", cameraData.name + '摄像机', cameraData.name);
				}else{
					logDict.insertLog("m1", "f1", "o6", "b10", cameraData.name + '摄像机', cameraData.name);
				}
			}
		}

		return new ExtendSreen();
});
