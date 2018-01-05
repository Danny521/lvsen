
/**
 * [摄像机设置相关的播放器的操做]
 * @author Wang Xiaojun
 * @date   2014-12-19
 */
define([
	'js/controller/camera-rule-frame-controller',
	'new-player',
	'DrawEditor',
	'base.self'
	], function(frame) {

	var control = function(){};
	control.prototype = {
		//播放器对象
		videoPlayer: null,

		//当前选中的摄像机信息(设置框线规则时用)
		curCameraData: null,
		//人脸布控的规则参数信息
		faceProtectInfo: {
			minSize: 60, //最小人脸尺寸
			maxSize: 200, //最大人脸尺寸
			pointsInfo: { //人脸布控区域的坐标
				left: 0,
				top: 0,
				right: 0,
				bottom: 0
			}
		},



		/**
		 * 检查视频播放器是否可以播放
		 * @param tag 为1标示设置布控区域时，为2标示标定布控区域时，为3标示查看布控区域时
		 * @returns {boolean} true播放成功，false播放失败
		 */
		
		checkedPlayer: function(tag) {
			var self = this;

			if (self.videoPlayer.cameraData[0].cplayStatus === 0) {
				if (!self.checkVideoLoaded()) {
					notify.warn("正在加载摄像机视频，请稍后...");
					return false;
				}
				//正常播放
				return true;
			} else if (self.videoPlayer.cameraData[0].cplayStatus === 1) {
				//播放异常
				if (tag === 1) {
					notify.warn("摄像机视频加载出现异常，暂不能进行规则调整！");
				} else if (tag === 2) {
					notify.warn("摄像机视频加载出现异常，暂不能进行人脸尺寸标定！");
				} else {
					notify.warn("摄像机视频加载出现异常，暂不能查看人脸布控区域！");
				}
				return false;
			} else if (self.videoPlayer.cameraData[0].cplayStatus === 2) {
				//离线状态
				if (tag === 1) {
					notify.warn("摄像机处于离线状态，暂不能进行规则调整！");
				} else if (tag === 2) {
					notify.warn("摄像机处于离线状态，暂不能进行人脸尺寸标定！");
				} else {
					notify.warn("摄像机处于离线状态，暂不能查看人脸布控区域！");
				}
				return false;
			}
			return false;
		},
		/**
		 * 判断摄像机视频是否已经加载画面
		 * @returns {boolean}
		 */
		checkVideoLoaded: function() {
			var self = this;
			var videoAttr = self.videoPlayer.playerObj.GetVideoAttribute(0);
			if (videoAttr !== "ERROR") {
				var rateInfo = JSON.parse(videoAttr);
				//如果分辨率非最小分辨率摄像机（摄像机没有加载出画面）
				if (rateInfo.width <= 0 || rateInfo.height <= 0) {
					return false;
				} else {
					return true;
				}
			} else {
				//获取不到时，此时摄像机完全没有加载
				return false;
			}
		},


		/**
		 * 摄像机截图
		 * @returns {{imgObj: *}}
		 */
		videoScreenShot: function() {
			var self = this;
			//下面这条实现ocx截图后的格式封装，在再ie9及以上版本均可以，ie8对大于32kb的图像数据不兼容；
			//故此处更改为后台进行图片包装，然后用地址显示
			var imgData = self.videoPlayer.catchOriginal(0),
				imgPath = "data:image/jpg;base64," + self.videoPlayer.catchOriginal(0); //IE8+
			//考虑到以后高清高速摄像机的图片会非常大，故只在ie8的情况下进行上传处理
			if (self.checkWebBrowser("MSIE 8.0")) {

				jQuery.ajax({
					url: "/snap/base64tofile",
					type: "post",
					dataType: "json",
					data: {
						base64: imgData,
						ext: "png"
					},
					success: function(res) {
						if (res.code === 200) {
							imgPath = res.data.path;
						} else if (res.code === 500) {
							notify.error(res.data.message);
						} else {
							notify.error("画布初始化异常！");
						}
					},
					error: function() {
						notify.error("画布初始化异常！");
					}
				});
			}
			//初始化图像对象
			var imgObj = jQuery("<img>").attr({
				"src": imgPath,
				"id": "TempSnapPicture",
				"draggable": false
			}).css({
				left: -1000 + "px"
			});
			return {
				imgObj: imgObj
			};
		},
		/**
		 * 获取摄像机分辨率
		 * @returns {{width: number, height: number}}
		 */
		getCameraRate: function() {
			var self = this,
				rateInfo = null,
				rWidth = 0,
				rHeight = 0;
			//如果获取失败，则
			var videoAttr = self.videoPlayer.playerObj.GetVideoAttribute(0);
			if (videoAttr !== "ERROR") {
				rateInfo = JSON.parse(videoAttr);
				rWidth = rateInfo.width;
				rHeight = rateInfo.height;
			}
			//如果未加载完视频，则直接取最小分辨率摄像机的宽和高(摄像机分辩率改用ocx方法获取后，此处的判断只当差错处理使用)
			if (rWidth <= 352) {
				rWidth = 352;
			}
			if (rHeight <= 288) {
				rHeight = 288;
			}

			return {
				width: rWidth,
				height: rHeight
			};
		},
		/**
		 * 获取框线展现时的分辨率
		 * @returns {{width: *, height: *}}
		 */
		getDisplayRate: function() {
			var drawAreaObj = jQuery(".content-down-video");//这个是获取ocx的宽高来用的，做兼容，在火狐上取不到ocx的对象用jquery，但是用原生的取的话宽高全是100%，根据布局取ocx父元素的宽高即可。by wangxiaojun 2015-01-04
			return {
				width: drawAreaObj.width(),
				height: drawAreaObj.height()
			};
		},
		/**
		 * 播放实时流
		 */
		showPlayingStream: function() {
			if (jQuery("#TempSnapPicture").length !== 0) {

				jQuery(".control-video .alarm-events-content-video .content-top-video-tool .intercept").removeClass("icon_play").attr("title", "暂停");
				//显示实时流&删除图像
				jQuery("#TempSnapPicture, #TempSnapCover").remove();
				// jQuery("#UIOCXCONTROL").show();
				document.getElementById("UIOCXCONTROL").style.width = "100%";
				document.getElementById("UIOCXCONTROL").style.height = "100%";
				document.getElementById("UIOCXCONTROL").style.marginLeft="";
			}
		},
		/**
		 * 布控规则设置，播放视频
		 * @param data-当前摄像机的详细信息
		 */
		playCurCameraVideo: function(data) {
			var self = this;
			// self.clearVideoInfo();
			//保存摄像机信息
			self.curCameraData = data;
			//初始化规则信息
			self.recordFaceRuleInfo();
			//清空播放器对象信息
			// if (!self.videoPlayer) {
				self.videoPlayer = new VideoPlayer({
					layout: 1,
					uiocx: 'UIOCXCONTROL',
					displayMode: 1
				});
			// }
			//播放视频
			setTimeout(function() {
				self.videoPlayer.defencePlay({
					'hdChannel': self.curCameraData.hdchannel, //高清通道
					'sdChannel': self.curCameraData.sdchannel, //标清通道
					'cId': self.curCameraData.id,
					'cName': self.curCameraData.name,
					'cType': self.curCameraData.cameratype, //摄像机类型：0枪机，1球机
					'cStatus': self.curCameraData.cstatus //摄像机在线离线状态：0在线，1离线
				});
				if (self.curCameraData.cameratype === 1 && self.curCameraData.cstatus === 0) {
					self.videoPlayer.switchPTZ(true, 0);
				}
			}, 1000);
		},

		/**
		 * 点开摄像机参与的某个布控任务时，记录并填充参与该任务中的
		 * @param data-读取该摄像机参与到该任务的信息
		 */
		recordFaceRuleInfo: function() {
			var self = this;

			var container = jQuery(".camera-list .active.control-camera-config"),
				minSize = container.find(".forth-line input[name='minSize']").val(),
				maxSize = container.find(".forth-line input[name='maxSize']").val(),
				left = container.find(".forth-line input[name='left']").val(),
				top = container.find(".forth-line input[name='top']").val(),
				right = container.find(".forth-line input[name='right']").val(),
				bottom = container.find(".forth-line input[name='bottom']").val();
			//执行填充
			self.faceProtectInfo.minSize = parseInt((minSize != "") ? minSize : 60);
			self.faceProtectInfo.maxSize = parseInt((maxSize != "") ? maxSize : 200);
			self.faceProtectInfo.pointsInfo.left = parseFloat((left != "") ? left : 0);
			self.faceProtectInfo.pointsInfo.top = parseFloat((top != "") ? top : 0);
			self.faceProtectInfo.pointsInfo.right = parseFloat((right != "") ? right : 0);
			self.faceProtectInfo.pointsInfo.bottom = parseFloat((bottom != "") ? bottom : 0);
		},
		/**
		 * 清空播放器相关对象,资源释放
		 */
		clearVideoInfo: function() {
			var self = this;
			if (self.videoPlayer) {
				self.videoPlayer.stop(false, 0);
				self.videoPlayer = null;
			}
		},
		/**
		 * 判断浏览器版本，截图需要
		 * @param browser
		 * @returns {boolean}
		 */
		checkWebBrowser: function(browser) {
			if (navigator.userAgent.indexOf(browser) > 0) {
				return true;
			} else {
				return false;
			}
		},

		/**
		 * 在视频上叠加图形，框架函数
		 * @param data-待显示的图形坐标信息
		 * @param curCameraRate-当前摄像机的分辨率，也是待显示的分辨率
		 */
		dealGraphicOnVideo: function(data, curCameraRate) {
			var self = this,
				drawInfo = "";
			//遍历当前区域列表，并在摄像机视频上显示
			for (var i = 0; i < data.length; i++) {
				var tempObj = data[i];
				if (tempObj.type === "SingleArrowline" || tempObj.type === "DoubleArrowline") {
					//单线
					drawInfo = frame.showSingleLineOnPlayer(tempObj.points, tempObj.text, curCameraRate, tempObj.drawRate);
					//调用播放器接口绘图
					self.videoPlayer.createImage(drawInfo, 0);
				} else if (tempObj.type === "Doubleline") {
					//双线
					drawInfo = frame.showDoubleLineOnPlayer(tempObj.points, tempObj.text, curCameraRate, tempObj.drawRate);
					//调用播放器接口绘图
					self.videoPlayer.createImage(drawInfo, 0);
				} else if (tempObj.type === "rect") {
					//矩形
					drawInfo = frame.showRectLineOnPlayer(tempObj.points, tempObj.text, curCameraRate, tempObj.drawRate);
					//调用播放器接口绘图
					self.videoPlayer.createImage(drawInfo, 0);
				} else if (tempObj.type === "polyline") {
					//多边形
					drawInfo = frame.showPolyLineOnPlayer(tempObj.points, tempObj.text, curCameraRate, tempObj.drawRate);
					//调用播放器接口绘图
					self.videoPlayer.createImage(drawInfo, 0);
				}
			}
		}

	}

	return new control();


})