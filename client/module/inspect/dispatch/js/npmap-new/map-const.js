/*global NPMapLib:true, NPMapLib.Symbols:true*/
define([], function() {

	var res = {
		//字母数组，目前最多20个
		letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
		//标注
		symbol: {
			//空标注，左侧视频定位播放时用
			nullSymbol: function () {
				return new NPMapLib.Symbols.Icon("", new NPMapLib.Geometry.Size(0, 0));
			},
			//标注
			markerSymbol: function () {
				return new NPMapLib.Symbols.Icon("images/map/map-icon/map-marker.png", new NPMapLib.Geometry.Size(26, 29));
			},
			normalCameraSymbol: function () {
				return new NPMapLib.Symbols.Icon("images/map/map-icon/map-search-marker-normal.png", new NPMapLib.Geometry.Size(16, 21));
			},
			activeCameraSymbol: function () {
				return new NPMapLib.Symbols.Icon("images/map/map-icon/map-search-marker-active.png", new NPMapLib.Geometry.Size(16, 21));
			},
			//灯杆标注
			lightbarSymbol: function () {
				return new NPMapLib.Symbols.Icon("images/map/map-icon/map-marker-lightbar-small.png", new NPMapLib.Geometry.Size(24, 24));
			},
			//灯杆标注（激活）
			lightbarActiveSymbol: function () {
				return new NPMapLib.Symbols.Icon("images/map/map-icon/map-marker-lightbar-big.png", new NPMapLib.Geometry.Size(28, 28));
			},
			//gps标注(小车)
			gpsSymbol: function () {
				return new NPMapLib.Symbols.Icon("images/map/map-icon/map-marker-police-small.png", new NPMapLib.Geometry.Size(24, 24));
			},
			//gps标注(激活)
			gpsActiveSymbol: function () {
				return new NPMapLib.Symbols.Icon("images/map/map-icon/map-marker-police-big.png", new NPMapLib.Geometry.Size(28, 28));
			},
			//350M标注(警帽)
			tfzMSymbol: function () {
				return new NPMapLib.Symbols.Icon("images/map/map-icon/map-marker-policeman-small.png", new NPMapLib.Geometry.Size(24, 24));
			},
			//350M标注(激活)
			tfzMActiveSymbol: function () {
				return new NPMapLib.Symbols.Icon("images/map/map-icon/map-marker-policeman-big.png", new NPMapLib.Geometry.Size(28, 28));
			},
			//gps标注(小车+水滴)
			gpsNormalSymbol: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/map-marker-gps-red.png", new NPMapLib.Geometry.Size(28, 51));
			},
			//350M标注(警帽+水滴)
			tfzMNormalSymbol: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/map-marker-350m-red.png", new NPMapLib.Geometry.Size(28, 51));
			},
			//兴趣点标注
			mapPlaceSymbol: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/map-marker-place.png", new NPMapLib.Geometry.Size(20, 20));
			},
			//报警信息标注（感叹号）
			alarmSymbol: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/showalarm.png", new NPMapLib.Geometry.Size(30, 30));
			},
			// 全景地图对象标注（摄像头）
			markerViweSymbol: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/simple-marker.png", new NPMapLib.Geometry.Size(15, 15));
			},
			// 地图上的关注点标注
			attentionSymbol: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/map-marker-attention.png", new NPMapLib.Geometry.Size(14, 14));
			},
			//周围搜索中心点的标记
			searchCenterSymbol: function () {
				return new NPMapLib.Symbols.Icon("images/map/map-icon/map-search-center.png", new NPMapLib.Geometry.Size(24, 32));
			},
			//拖动圈圈搜索的图标
			dragCircleSymbol: function () {
				return new NPMapLib.Symbols.Icon("images/map/editCircle.png", new NPMapLib.Geometry.Size(76, 24));
			},
			//拖动圈圈搜索的图标（鼠标移入状态）
			dragCircleHoverSymbol: function () {
				return new NPMapLib.Symbols.Icon("images/map/editCircle_hover.png", new NPMapLib.Geometry.Size(76, 24));
			}
		},
		//全景地图操作 by songxj update on 2015-09-07
		fullviewOpera: {
			centerPoint: function() {
				return new NPMapLib.Symbols.Icon("/module/inspect/dispatch/images/task-fullview/center-point.png", new NPMapLib.Geometry.Size(20, 20));
			},
			normalPoint: function() {
				return new NPMapLib.Symbols.Icon("/module/inspect/dispatch/images/task-fullview/normal-point.png", new NPMapLib.Geometry.Size(5, 5));
			},
			highLightPoint: function() {
				return new NPMapLib.Symbols.Icon("/module/inspect/dispatch/images/task-fullview/highlight-point.png", new NPMapLib.Geometry.Size(12, 12));
			}
			/*centerBg: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-centerbg.png", new NPMapLib.Geometry.Size(45, 45));
			},
			center: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-center.png", new NPMapLib.Geometry.Size(10, 10));
			},
			top: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-top.png", new NPMapLib.Geometry.Size(13, 13));
			},
			bottom: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-bottom.png", new NPMapLib.Geometry.Size(13, 13));
			},
			left: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-left.png", new NPMapLib.Geometry.Size(13, 13));
			},
			right: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-right.png", new NPMapLib.Geometry.Size(13, 13));
			},
			leftTop: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-lefttop.png", new NPMapLib.Geometry.Size(13, 13));
			},
			leftBottom: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-leftbottom.png", new NPMapLib.Geometry.Size(13, 13));
			},
			rightTop: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-righttop.png", new NPMapLib.Geometry.Size(13, 13));
			},
			rightBottom: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-rightbottom.png", new NPMapLib.Geometry.Size(13, 13));
			},
			//hover
			centerBgHover: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-centerbg.png", new NPMapLib.Geometry.Size(45, 45));
			},
			centerHover: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-center-hover.png", new NPMapLib.Geometry.Size(10, 10));
			},
			topHover: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-top-hover.png", new NPMapLib.Geometry.Size(13, 13));
			},
			bottomHover: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-bottom-hover.png", new NPMapLib.Geometry.Size(13, 13));
			},
			leftHover: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-left-hover.png", new NPMapLib.Geometry.Size(13, 13));
			},
			rightHover: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-right-hover.png", new NPMapLib.Geometry.Size(13, 13));
			},
			leftTopHover: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-lefttop-hover.png", new NPMapLib.Geometry.Size(13, 13));
			},
			leftBottomHover: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-leftbottom-hover.png", new NPMapLib.Geometry.Size(13, 13));
			},
			rightTopHover: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-righttop-hover.png", new NPMapLib.Geometry.Size(13, 13));
			},
			rightBottomHover: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/fullview-rightbottom-hover.png", new NPMapLib.Geometry.Size(13, 13));
			}*/
		},
		//警卫路线标注
		guardRouteSymbol: {
			currentCameraGun: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/flash_camera.gif", new NPMapLib.Geometry.Size(20, 20), {
					anchor: new NPMapLib.Geometry.Size(-10, -10)
				});
			},
			currentCameraBall: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/flash_camera1.gif", new NPMapLib.Geometry.Size(20, 20), {
					anchor: new NPMapLib.Geometry.Size(-10, -10)
				});
			},
			cameraGunOnline: function () {
				return new NPMapLib.Symbols.Icon(res.mapIcon.camera.res["0000"], new NPMapLib.Geometry.Size(res.mapIcon.camera.res["smallSize"].width, res.mapIcon.camera.res["smallSize"].height), {
					anchor: new NPMapLib.Geometry.Size(-res.mapIcon.camera.res["smallSize"].width/2, -res.mapIcon.camera.res["smallSize"].height/2)
				});
			},
			cameraGunOnlineForbid: function () {
				return new NPMapLib.Symbols.Icon(res.mapIcon.camera.res["00"], new NPMapLib.Geometry.Size(res.mapIcon.camera.res["smallSize"].width, res.mapIcon.camera.res["smallSize"].height), {
					anchor: new NPMapLib.Geometry.Size(-res.mapIcon.camera.res["smallSize"].width/2, -res.mapIcon.camera.res["smallSize"].height/2)
				});
			},
			cameraGunOffline: function () {
				return new NPMapLib.Symbols.Icon(res.mapIcon.camera.res["0100"], new NPMapLib.Geometry.Size(res.mapIcon.camera.res["smallSize"].width, res.mapIcon.camera.res["smallSize"].height), {
					anchor: new NPMapLib.Geometry.Size(-res.mapIcon.camera.res["smallSize"].width/2, -res.mapIcon.camera.res["smallSize"].height/2)
				});
			},
			cameraGunOfflineForbid: function () {
				return new NPMapLib.Symbols.Icon(res.mapIcon.camera.res["01"], new NPMapLib.Geometry.Size(res.mapIcon.camera.res["smallSize"].width, res.mapIcon.camera.res["smallSize"].height), {
					anchor: new NPMapLib.Geometry.Size(-res.mapIcon.camera.res["smallSize"].width/2, -res.mapIcon.camera.res["smallSize"].height/2)
				});
			},
			cameraBallOnline: function () {
				return new NPMapLib.Symbols.Icon(res.mapIcon.camera.res["1000"], new NPMapLib.Geometry.Size(res.mapIcon.camera.res["smallSize"].width, res.mapIcon.camera.res["smallSize"].height), {
					anchor: new NPMapLib.Geometry.Size(-res.mapIcon.camera.res["smallSize"].width/2, -res.mapIcon.camera.res["smallSize"].height/2)
				});
			},
			cameraBallOnlineForbid: function () {
				return new NPMapLib.Symbols.Icon(res.mapIcon.camera.res["10"], new NPMapLib.Geometry.Size(res.mapIcon.camera.res["smallSize"].width, res.mapIcon.camera.res["smallSize"].height), {
					anchor: new NPMapLib.Geometry.Size(-res.mapIcon.camera.res["smallSize"].width/2, -res.mapIcon.camera.res["smallSize"].height/2)
				});
			},
			cameraBallOffline: function () {
				return new NPMapLib.Symbols.Icon(res.mapIcon.camera.res["1100"], new NPMapLib.Geometry.Size(res.mapIcon.camera.res["smallSize"].width, res.mapIcon.camera.res["smallSize"].height), {
					anchor: new NPMapLib.Geometry.Size(-res.mapIcon.camera.res["smallSize"].width/2, -res.mapIcon.camera.res["smallSize"].height/2)
				});
			},
			cameraBallOfflineForbid: function () {
				return new NPMapLib.Symbols.Icon(res.mapIcon.camera.res["11"], new NPMapLib.Geometry.Size(res.mapIcon.camera.res["smallSize"].width, 20), {
					anchor: new NPMapLib.Geometry.Size(-res.mapIcon.camera.res["smallSize"].width/2, -res.mapIcon.camera.res["smallSize"].height/2)
				});
			},
			startPoint: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/map-start-point.png", new NPMapLib.Geometry.Size(28, 31));
			},
			stopPoint: function () {
				return new NPMapLib.Symbols.Icon("/module/common/images/map/map-stop-point.png", new NPMapLib.Geometry.Size(28, 31));
			},
			carSymbol: function() {
				return new NPMapLib.Symbols.Icon("images/map/map-icon/guard-route-gps-car.png", new NPMapLib.Geometry.Size(40, 20));
			}
		},
		mapIcon: {
			camera: {
				//摄像机聚合图标位置
				cluster: {
					"1": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-camera-cluster-1.png",
						size: {width: 24, height: 44}
					},
					"2": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-camera-cluster-2.png",
						size: {width: 34, height: 44}
					},
					"3": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-camera-cluster-3.png",
						size: {width: 38, height: 44}
					},
					"4": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-camera-cluster-4.png",
						size: {width: 44, height: 44}
					},
					//聚合点位的字体大小
					fontSize: 10,
					//聚合点位的字体颜色
					fontColor: "",
					//聚合数字的垂直偏移量
					labelYOffset: 11,
					//聚合数字的垂直偏移量,IE下
					labelYOffsetIE: 7
				},
				/**
				 * 摄像机资源图标，四位显示
				 * 第一位：摄像机类型，0为枪击，1为球机
				 * 第二位：在线状态，0为在线，1为离线
				 * 第三位：高标清标记，0标清，1高清
				 * 第四位：图标大小标记，0为小图，1为大图
				 * 另：禁用状态，0为在线禁用，1为离线禁用
				 */
				res: {
					//枪击在线标清
					"0000": "/module/inspect/dispatch/images/map/map-icon/map-marker-gun-online-small.png",
					//枪击在线标清-大图标
					"0001": "/module/inspect/dispatch/images/map/map-icon/map-marker-gun-online-big.png",
					//枪击在线高清
					"0010": "/module/inspect/dispatch/images/map/map-icon/map-marker-gun-online-small.png",
					//枪击在线高清-大图标
					"0011": "/module/inspect/dispatch/images/map/map-icon/map-marker-gun-online-big.png",
					//枪击离线标清
					"0100": "/module/inspect/dispatch/images/map/map-icon/map-marker-gun-offline-small.png",
					//枪击离线标清-大图标
					"0101": "/module/inspect/dispatch/images/map/map-icon/map-marker-gun-offline-big.png",
					//枪击离线高清
					"0110": "/module/inspect/dispatch/images/map/map-icon/map-marker-gun-offline-small.png",
					//枪击离线高清-大图标
					"0111": "/module/inspect/dispatch/images/map/map-icon/map-marker-gun-offline-big.png",
					//球击在线标清
					"1000": "/module/inspect/dispatch/images/map/map-icon/map-marker-ball-online-small.png",
					//球击在线标清-大图标
					"1001": "/module/inspect/dispatch/images/map/map-icon/map-marker-ball-online-big.png",
					//球击在线高清
					"1010": "/module/inspect/dispatch/images/map/map-icon/map-marker-ball-online-small.png",
					//球击在线高清-大图标
					"1011": "/module/inspect/dispatch/images/map/map-icon/map-marker-ball-online-big.png",
					//球击离线标清
					"1100": "/module/inspect/dispatch/images/map/map-icon/map-marker-ball-offline-small.png",
					//球击离线标清-大图标
					"1101": "/module/inspect/dispatch/images/map/map-icon/map-marker-ball-offline-big.png",
					//球击离线高清
					"1110": "/module/inspect/dispatch/images/map/map-icon/map-marker-ball-offline-small.png",
					//球击离线高清-大图标
					"1111": "/module/inspect/dispatch/images/map/map-icon/map-marker-ball-offline-big.png",
					//枪击在线禁用
					"00": "/module/inspect/dispatch/images/map/map-icon/camera-gun-online-forbid.png",
					//枪击离线禁用
					"01": "/module/inspect/dispatch/images/map/map-icon/camera-gun-offline-forbid.png",
					//球击在线禁用
					"10": "/module/inspect/dispatch/images/map/map-icon/camera-ball-online-forbid.png",
					//球击离线禁用
					"11": "/module/inspect/dispatch/images/map/map-icon/camera-ball-offline-forbid.png",
					//大图标的大小
					bigSize: {width: 30, height: 30},
					//小图标的大小
					smallSize: {width: 26, height: 26}
				}
			},
			bayonet: {
				cluster: {
					"1": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-bayonet-cluster-1.png",
						size: {width: 24, height: 44}
					},
					"2": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-bayonet-cluster-2.png",
						size: {width: 34, height: 44}
					},
					"3": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-bayonet-cluster-3.png",
						size: {width: 38, height: 44}
					},
					"4": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-bayonet-cluster-4.png",
						size: {width: 44, height: 44}
					},
					//聚合点位的字体大小
					fontSize: 10,
					//聚合点位的字体颜色
					fontColor: "",
					//聚合数字的垂直偏移量
					labelYOffset: 11,
					//聚合数字的垂直偏移量,IE下
					labelYOffsetIE: 7
				},
				res: {
					big: {
						img: "/module/inspect/dispatch/images/map/map-icon/map-marker-bayonet-big.png",
						size: {width: 30, height: 30}
					},
					small: {
						img: "/module/inspect/dispatch/images/map/map-icon/map-marker-bayonet-small.png",
						size: {width: 26, height: 26}
					}
				}
			},
			lightbar: {
				cluster: {
					"1": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-lightbar-cluster-1.png",
						size: {width: 24, height: 44}
					},
					"2": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-lightbar-cluster-2.png",
						size: {width: 34, height: 44}
					},
					"3": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-lightbar-cluster-3.png",
						size: {width: 38, height: 44}
					},
					"4": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-lightbar-cluster-4.png",
						size: {width: 44, height: 44}
					},
					//聚合点位的字体大小
					fontSize: 10,
					//聚合点位的字体颜色
					fontColor: "",
					//聚合数字的垂直偏移量
					labelYOffset: 11,
					//聚合数字的垂直偏移量,IE下
					labelYOffsetIE: 7
				},
				res: {
					big: {
						img: "/module/inspect/dispatch/images/map/map-icon/map-marker-lightbar-big.png",
						size: {width: 30, height: 30}
					},
					small: {
						img: "/module/inspect/dispatch/images/map/map-icon/map-marker-lightbar-small.png",
						size: {width: 26, height: 26}
					}
				}
			},
			gps: {
				cluster: {
					"1": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-gps-cluster-1.png",
						size: {width: 24, height: 44}
					},
					"2": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-gps-cluster-2.png",
						size: {width: 34, height: 44}
					},
					"3": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-gps-cluster-3.png",
						size: {width: 38, height: 44}
					},
					"4": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-gps-cluster-4.png",
						size: {width: 44, height: 44}
					},
					//聚合点位的字体大小
					fontSize: 10,
					//聚合点位的字体颜色
					fontColor: "",
					//聚合数字的垂直偏移量
					labelYOffset: 11,
					//聚合数字的垂直偏移量,IE下
					labelYOffsetIE: 7
				},
				res: {
					big: {
						img: "/module/inspect/dispatch/images/map/map-icon/map-marker-police-big.png",
						size: {width: 79, height: 57}
					},
					small: {
						img: "/module/inspect/dispatch/images/map/map-icon/map-marker-police-small.png",
						size: {width: 79, height: 52}
					},
					//gps资源点位车牌文字标注的偏移量
					cusLabelYOffset: { width: -2, height: 13 },
					//gps资源点位车牌文字标注的偏移量,IE下
					cusLabelYOffsetIE: { width: -2, height: 9 }
				}
			},
			"350M": {
				cluster: {
					"1": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-350M-cluster-1.png",
						size: {width: 24, height: 44}
					},
					"2": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-350M-cluster-2.png",
						size: {width: 34, height: 44}
					},
					"3": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-350M-cluster-3.png",
						size: {width: 38, height: 44}
					},
					"4": {
						img: "/module/inspect/dispatch/images/map/map-icon/map-350M-cluster-4.png",
						size: {width: 44, height: 44}
					},
					//聚合点位的字体大小
					fontSize: 10,
					//聚合点位的字体颜色
					fontColor: "",
					//聚合数字的垂直偏移量
					labelYOffset: 11,
					//聚合数字的垂直偏移量,IE下
					labelYOffsetIE: 7
				},
				res: {
					big: {
						img: "/module/inspect/dispatch/images/map/map-icon/map-marker-policeman-big.png",
						size: {width: 30, height: 30}
					},
					small: {
						img: "/module/inspect/dispatch/images/map/map-icon/map-marker-policeman-small.png",
						size: {width: 26, height: 26}
					}
				}
			}
		}
	};

	return res;
});
