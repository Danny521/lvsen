define(['/lbsplat/component/business/map-infowindow/js/infowindow-view.js',
	'/lbsplat/component/business/maptoolbar/js/model/maptoolbar-select-model.js',
	'/module/common/js/player2.js',
	'jquery'
], function(WindowView, Model) {
	return (function(scope, $) {
		var _videoPlayerSigle = null,
			_domId = 'UIOCXMAP';
		var _playVideo = function(viewPlayObj, domId) {
				if (domId) {
					_domId = domId;
				}
				//播放视频
				_videoPlayerSigle = new VideoPlayer({
					layout: 1,
					uiocx: _domId
				});
				document.getElementById(_domId).RefreshForGis(100);

				if (typeof viewPlayObj.position !== "undefined") {
					viewPlayObj.position = viewPlayObj.position;
				}
				_videoPlayerSigle.setFreePath(viewPlayObj);
				_videoPlayerSigle.ptzRedArrow(0);
				window.videoPlayerSigle = _videoPlayerSigle;
			},
			_showPlayVideo = function(data) {
				//播放视频
				var playinfo = {
					'hdChannel': data.hdchannel, //高清通道
					'sdChannel': data.sdchannel, //标清通道
					'cId': data.id,
					'cName': data.name,
					'cType': data.type,
					'cStatus': data.status //摄像机在线离线状态
				};
				if (!playinfo.hdChannel) {
					playinfo.hdChannel = Array.clone(data.hd_channel);
				}
				if (!playinfo.sdChannel) {
					playinfo.sdChannel = Array.clone(data.sd_channel);
				}
				if (typeof(playinfo.cType) == "string") {
					playinfo.cType = data.camera_type;
				}
				if (!playinfo.cStatus) {
					playinfo.cStatus = data.camera_status;
				}
				_playVideo(playinfo, data.domId);
			};
		scope.init = function(map) {
			WindowView.init(map);
		};
		scope.showCameraWindow = function(data) {
			var opts = null;
			if(!window.map.getLayerByName("camera-resource-layer")||!window.map.getLayerByName("camera-resource-layer").getVisible()){
				opts = {
					offset:new NPMapLib.Geometry.Size(-7, -40),
					closecallback:function(){
						if(window.map.getLayerByName("resource-show-layer")){
							window.map.getLayerByName("resource-show-layer").hide();
						}
					}
				}
			}
			WindowView.showCameraWindow(data,opts);
			scope.showSingleCameraWindow(data);
		};
		scope.showSingleCameraWindow = function(data){
			//添加视频全屏
            require(["/module/inspect/dispatch/js/npmap-new/map-dblclick-change.js"], function(dblclickChange) {
                dblclickChange.dblSingleScreen(_videoPlayerSigle);
            });
			WindowView.showSingleCameraWindow(data);
			_showPlayVideo(data);
			WindowView.setPlayObj(_videoPlayerSigle);
			//添加云台控制 
            require(["/lbsplat/module/common/js/player/controlbar.js"], function(ControlBar) {
                ControlBar.bindEvents(_videoPlayerSigle);
            });
		};
		scope.showLightbarWindow = function(data) {
			var opts = null;
			if(!window.map.getLayerByName("lightbar-resource-layer")||!window.map.getLayerByName("lightbar-resource-layer").getVisible()){
				opts = {
					offset:new NPMapLib.Geometry.Size(-7, -40),
					closecallback:function(){
						if(window.map.getLayerByName("resource-show-layer")){
							window.map.getLayerByName("resource-show-layer").hide();
						}
					}
				}
			}
			WindowView.showLightbarWindow(data,opts);
		};
		scope.closeCameraWindow = function(){
			WindowView.closeWindow();
		};
		scope.showAlarmWindow = function(data) {
			var data = {
				id: data.id,
				currentPage: 1
			};
			Model.GetAlarmDetail(data, {}).then(function(result) {
				var dataT = jQuery.extend(result.data, {
					position: new NPMapLib.Geometry.Point(result.data.lon, result.data.lat),
				});
				WindowView.showAlarmWindow(dataT);
			});
		};
		scope.showBayonetWindow = function(data) {
			var opts = null;
			if(!window.map.getLayerByName("bayonet-resource-layer")||!window.map.getLayerByName("bayonet-resource-layer").getVisible()){
				opts = {
					offset:new NPMapLib.Geometry.Size(-7, -40),
					closecallback:function(){
						if(window.map.getLayerByName("resource-show-layer")){
							window.map.getLayerByName("resource-show-layer").hide();
						}
					}
				}
			}
			WindowView.showBayonetWindow(data,opts);
		};
		scope.showGPSWindow = function(data) {
			var opts = null;
			if(!window.map.getLayerByName("policecar-resource-layer")||!window.map.getLayerByName("policecar-resource-layer").getVisible()){
				opts = {
					offset:new NPMapLib.Geometry.Size(-7, -40),
					closecallback:function(){
						if(window.map.getLayerByName("resource-show-layer")){
							window.map.getLayerByName("resource-show-layer").hide();
						}
					}
				}
			}
			WindowView.showGPSWindow(data,opts);
		};
		scope.showPoliceWindow = function(data) {
			WindowView.showPoliceWindow(data);
		};
		return scope;
	})({}, jQuery);
});