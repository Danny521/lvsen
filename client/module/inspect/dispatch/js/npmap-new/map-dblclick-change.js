/**
 * 视频双击放大]
 * @author 仵景文
 * @date   2015-08-06
 */
define([
	"jquery",
	"/module/inspect/dispatch/js/npmap-new/task/map-toolbar.js",
	"/module/common/js/player2.js",
], function($, Toolbar) {
	var _isAreadyBindOnExtendScreen = false;
	/*增加自动切换视频流函数 add by wujingwen  on 2015.08.27*/
	var autoVideoStream = function(player) {
		//全局变量needSwitchVideoStream是判断是否需要切流  增加切换 标/高清流  标记 add by wujingwen on 2015.08.27
		if (window.needSwitchVideoStream) {
			var definitionType = player.cameraData[0].definitionType;
			if (player.curMaxWinChannel === -1 && definitionType !== 0) {
				player.switchDefinition(0, 0, true);
			} else if (player.curMaxWinChannel !== -1 && definitionType !== 1) {
				player.switchDefinition(0, 1, true);
			}

		}
	}
	return {
		//扩展屏视频双击放大函数
		dblExtendScreen: function(player, isNew) {

			if (_isAreadyBindOnExtendScreen && !isNew) { //如果已经绑定，则返回；
				return;
			}
			player.on("dblclick", function(index) {
				//隐藏影像地图图标
				Toolbar.hideSwitchLayer();
				autoVideoStream(player); //调用自动切换视频流add by wujingwen  on 2015.08.27
				if ($("#streetMap1").hasClass("infinity")) { // infinity 默认 页面关闭层：display:none;
					if (!window.isPointPlay) { //如果是 没有点定位 
						$("#map-video-play-bar").removeClass("map-video-play-bar").addClass("map-video-playBarSin");
					} else {
						$("#map-video-play-bar").removeClass("map-video-play-bar").addClass("map-video-playBar");
					}
					//对其样式操作
					$("#map-video-play-bar").removeClass("map-video-play-bar").addClass("map-video-playBar");
					$(".video-content").removeClass("video-content").addClass("video-content1");
					$(".map-video-play-bar-ocx").css({
						"height": "100%"
					});
					$("#streetMap1").removeClass("infinity");
					//记录最大化分屏数
					player.curMaxWinChannel = index - 0;

					$("#closeStreetmapBtn1").off("click").click(function() { //点击关闭层按钮：关闭
						autoVideoStream(player); //调用自动切换视频流add by wujingwen  on 2015.08.27
						var playerIndex = player.playerObj.GetFocusWindowIndex();
						player.playerObj.SetWindowMaximize(playerIndex);
						if (!window.isPointPlay) {
							$("#map-video-play-bar").removeClass("map-video-playBarSin").addClass("map-video-play-bar");
						} else {
							$("#map-video-play-bar").removeClass("map-video-playBar").addClass("map-video-play-bar");
						}
						$("#map-video-play-bar").removeClass("map-video-playBar").addClass("map-video-play-bar");
						$(".video-content1").removeClass("video-content1").addClass("video-content");
						$(".map-video-play-bar-ocx").css({
							"height": ""
						});
						$("#streetMap1").addClass("infinity");
						//关闭最大化后将curMaxWinChannel置为-1
						player.curMaxWinChannel = -1;
						//显示影像地图图标
						Toolbar.showSwitchLayer();
					});
				} else {
					if (!window.isPointPlay) {
						$("#map-video-play-bar").removeClass("map-video-playBarSin").addClass("map-video-play-bar");
					} else {
						$("#map-video-play-bar").removeClass("map-video-playBar").addClass("map-video-play-bar");
					}
					$("#map-video-play-bar").removeClass("map-video-playBar").addClass("map-video-play-bar");
					$(".video-content1").removeClass("video-content1").addClass("video-content");
					$(".map-video-play-bar-ocx").css({
						"height": ""
					});
					$("#streetMap1").addClass("infinity");
					//关闭最大化后将curMaxWinChannel置为-1
					player.curMaxWinChannel = -1;
					//显示影像地图图标
					Toolbar.showSwitchLayer();
				}
			});

			_isAreadyBindOnExtendScreen = true;
		},
		//地图视频双击放大函数
		dblSingleScreen: function(player) {

			// player.on("dblclick", function() {
			// 	autoVideoStream(player); //调用自动切换视频流add by wujingwen  on 2015.08.27
			// 	if ($("#streetMap1").hasClass("infinity")) {
			// 		var $parentNPGIS = $("#npgis").parent();
			// 		var leftDate = $($parentNPGIS).position().left;
			// 		var topDate = $($parentNPGIS).position().top;
			// 		var width = $("#npgis #npgis_contentDiv").css("width");
			// 		var height = $("#npgis #npgis_contentDiv").css("height");

			// 		$($parentNPGIS).css({
			// 			"width": "100%",
			// 			"height": "100%",
			// 			"top": "-36px",
			// 			"left": "0"
			// 		});
			// 		$("#npgis").css({
			// 			"position": "static"
			// 		});
			// 		$("#npgis #npgis_contentDiv").css({
			// 			"width": "100%",
			// 			"height": "100%"
			// 		});
			// 		$("#npgis").find(".map-video-container").removeClass("map-video-container").addClass("map-video-object");
			// 		$("#streetMap1").removeClass("infinity");
			// 		require(["/module/inspect/dispatch/js/npmap-new/task/map-toolbar.js"], function(toolbar) {
			// 			toolbar.hideSwitchLayer();
			// 		});
			// 		$("#closeStreetmapBtn1").off("click").click(function() {
			// 			autoVideoStream(player); //调用自动切换视频流add by wujingwen  on 2015.08.27										
			// 			$($parentNPGIS).css({
			// 				"width": "",
			// 				"height": "",
			// 				"top": topDate,
			// 				"left": leftDate
			// 			});
			// 			$("#npgis").css({
			// 				"position": "absolute"
			// 			});
			// 			$("#npgis #npgis_contentDiv").css({
			// 				"width": width,
			// 				"height": height
			// 			});

			// 			$("#npgis").find(".map-video-object").removeClass("map-video-object").addClass("map-video-container");
			// 			$("#streetMap1").addClass("infinity");
			// 			require(["/module/inspect/dispatch/js/npmap-new/task/map-toolbar.js"], function(toolbar) {
			// 				toolbar.showSwitchLayer();
			// 			});
			// 		});
			// 	} else {
			// 		$("#streetMap1 #closeStreetmapBtn1").trigger("click")
			// 	}
			// })
			player.on("dblclick", function() {
				autoVideoStream(player);//调用自动切换视频流add by wujingwen  on 2015.08.27
				if($("#streetMap1").hasClass("infinity")){		
					var DomID = "#windowDom";//"#OpenLayers_Map_4_OpenLayers_Container";
					var leftDate = $(DomID).position().left;
					var topDate = $(DomID).position().top;
					$(DomID).css({"width":"","height":"","bottom":"0","right":"0","top":"36px","left":"0"});
					// $("#npgis").css({"position":"static"});
					// $("#npgis #npgis_contentDiv").css({"width":"100%","height":"100%"});
					//$("#npgis").find(".map-video-container").removeClass("map-video-container").addClass("map-video-object");
					$(DomID).find(".map-video-container").removeClass("map-video-container").addClass("map-video-object");
					$("#streetMap1").removeClass("infinity");
					require(["/module/inspect/dispatch/js/npmap-new/task/map-toolbar.js"], function(toolbar) {
						toolbar.hideSwitchLayer();
					});
					$("#closeStreetmapBtn1").off("click").click(function(){	
						autoVideoStream(player);	//调用自动切换视频流add by wujingwen  on 2015.08.27										
						$(DomID).css({"width":"","height":"","bottom":"","right":"","top":topDate,"left":leftDate});
						// $("#npgis").css({"position":"absolute"});
						// $("#npgis #npgis_contentDiv").css({"width":"418px","height":"398px"});
						// $("#npgis").find(".map-video-object").removeClass("map-video-object").addClass("map-video-container");
						$(DomID).find(".map-video-object").removeClass("map-video-object").addClass("map-video-container");
						$("#streetMap1").addClass("infinity");
						require(["/module/inspect/dispatch/js/npmap-new/task/map-toolbar.js"], function(toolbar) {
							toolbar.showSwitchLayer();
						});
					});
				}
				else {
					$("#streetMap1 #closeStreetmapBtn1").trigger("click")
				}				
			})
		}


	}
})