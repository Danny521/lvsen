/**
 * Created by Zhangyu、huzhongchuan on 2015/5/6.
 * 视频监控中摄像机的地图定位播放相关逻辑
 */
define(["js/connection/subscribe-for-camera-tree", "js/npmap-new/map-variable", "pubsub"], function(Controller, Variable, PubSub) {

	var _pointPlayTimer = null,         //定制延时定点播放定时器
		_pointPlaySpan = 1000,          //定制延时定点播放定时器时间间隔
		_curPointPlayTime = 0,       //定制延时定点播放定时器当前累计时间间隔
		_pointPlayTotalTime = 20 * 1000;//定制延时定点播放定时器最长等待时间，暂定20秒
	/**
	 * 定时延时播放处理程序
	 * data, 待播放的摄像机信息
	 * 结合常州现场，延迟定时处理，by zhangyu on 2015/6/23
	 */
	var IntervalForPointPlay = function(data) {
		//关闭已有的定时器
		if(_pointPlayTimer) {
			window.clearInterval(_pointPlayTimer);
		}
		//开启新的定时器
		_pointPlayTimer = window.setInterval(function () {
			if(!window.infowindow) {
				//定位播放
				Controller.playVideoOnMap(data);
				//清除定时器
				window.clearInterval(_pointPlayTimer);
			} else {
				if(_curPointPlayTime > _pointPlayTotalTime) {
					//如果超出了最大等待时间，则清除定时器
					window.clearInterval(_pointPlayTimer);
				} else {
					//累计时间
					_curPointPlayTime += _pointPlaySpan;
				}
			}
		}, _pointPlaySpan);
	};

	//视频监控地图定位播放跳转
	var PointPlay = function () {
		var hash = location.hash;
		if (!hash.match(/^\#\d+\@/gi)) {
			return
		}
		var id = hash.replace(/^#/gi, "").replace(/@[\s\S]*/gi, "");
		//判断信息窗是否已经存在，且为当前摄像机，如果是则不再执行下去,by zhangyu on 2015/5/27
		if(window.infowindow && window.infowindow.checkInfoWindowExists()) {
			var curInfoWindowData = Variable.currentCameraMarker.getData();
			//判断是摄像机
			if(curInfoWindowData.hd_channel || curInfoWindowData.hdChannel || curInfoWindowData.hdchannel) {
				if(id === curInfoWindowData.id) {
					//当前摄像机已经打开，不需要再次打开
					return;
				}
			}
		}
		//读取摄像机信息，然后播放点位
		var url = "/service/video_access_copy/accessChannels";
		jQuery.ajax({
			url: url,
			type: 'get',
			data: {id: id},
			dataType: 'json',
			success: function (res) {
				if (res.code === 200) {
					// 先处理左侧树的联动，然后进行地图上摄像机的播放
					PubSub.publish("displayInTree", {
                    	id: id
                	});
					IntervalForPointPlay(res.data.cameraInfo);
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("获取数据异常！");
				}
			}
		});
		//标记已经进入了地图定位播放
		window.isPointPlay = true;
	};

	PubSub.subscribe("mapInitialComplete", function () {
		PointPlay();
	});

	jQuery(window).on("hashchange", function () {
		PointPlay();
	});


	(function(){
		// 各种浏览器兼容
		var hidden, state, visibilityChange; 
		if (typeof document.hidden !== "undefined") {
			hidden = "hidden";
			visibilityChange = "visibilitychange";
			state = "visibilityState";
		} else if (typeof document.mozHidden !== "undefined") {
			hidden = "mozHidden";
			visibilityChange = "mozvisibilitychange";
			state = "mozVisibilityState";
		} else if (typeof document.msHidden !== "undefined") {
			hidden = "msHidden";
			visibilityChange = "msvisibilitychange";
			state = "msVisibilityState";
		} else if (typeof document.webkitHidden !== "undefined") {
			hidden = "webkitHidden";
			visibilityChange = "webkitvisibilitychange";
			state = "webkitVisibilityState";
		}
		// 添加监听器，监听页面是否可见，设置播放器弹出对话框的的状态
		document.addEventListener(visibilityChange, function(evt) {
			var state=document.visibilityState;
			state=state||document.mozVisibilityState;
			state=state||document.msVisibilityState;
			state=state||document.webkitVisibilityState;
			var Flag=(state=="visible")?true:false;
			var stype=JSON.stringify({"show":Flag});
			var playerDom=document.getElementById("UIOCXMAP");
			try{
				playerDom.ExeScript(-1, "", stype);
			}catch(e){
				//notify.warn('请安装最新版ocx');
			}
		}, false);

	})();
});