/**
 * Created by Leon.z on 2015/9/1.
 * 视频布防模块的框线
 */
define([
	'/module/protection-monitor/newStructAlarmmgr/js/global-varibale.js',
	"base.self"
], function(_g) {
	var init = function(player){
		_g.videoPlayer = player;
	};
	/**
	 * 判断摄像机视频是否已经加载画面
	 * @returns {boolean} - 返回加载与否
	 */
	var checkVideoLoaded = function (index) {
		var videoAttr = _g.videoPlayer.playerObj.GetVideoAttribute(index);
		if (videoAttr !== "ERROR") {
			var rateInfo = JSON.parse(videoAttr);
			//如果分辨率非最小分辨率摄像机（摄像机没有加载出画面）
			return !(rateInfo.width <= 0 || rateInfo.height <= 0);
		} else {
			//获取不到时，此时摄像机完全没有加载
			return false;
		}
	};
	/**
	 * 摄像机框线规则设置、视频框线叠加相关
	 */
	var DefenceLineTools = (function(){

		/**
		 * 坐标转换(主要是转换成0~1中间的值，主要用到的有ocx显示框线、算法任务参数保存)
		 * @param point - 框线点坐标数据
		 * @param curCameraRate - 摄像机的原始分辨率/ocx显示分辨率
		 * @param curDrawRate - 框线绘制时的分辨率
		 * @returns {{x: string, y: string}} - 转换后的的点坐标数据
		 */
		var coordinateSwitch = function (point, curCameraRate, curDrawRate) {
			//console.log(point);
			//获取当前坐标相对于摄像机分辨率的坐标
			var tempPoint_x = point[0] * (parseFloat(curCameraRate.width / curDrawRate.width)), tempPoint_y = point[1] * (parseFloat(curCameraRate.height / curDrawRate.height));
			//转换为0~1坐标数据
			return {
				x: parseFloat(tempPoint_x / curCameraRate.width).toFixed(6),
				y: parseFloat(tempPoint_y / curCameraRate.height).toFixed(6)
			};
		};

		/**
		 * 绘图画布使用，回显之前绘制过的线条
		 * @param points - 待转换的框线坐标数据
		 * @param drawRate - 框线绘制时的分辨率
		 * @param DisplayRate - 框线显示时的分辨率
		 * @returns {Array} - 返回转换后的框线坐标数据
		 */
		var coordinateSwitchEx = function (points, drawRate, DisplayRate) {
			var resultData = [], tempData = [], i;
			//遍历坐标
			for (i = 0; i < points.length; i++) {
				//清空数组
				tempData.length = 0;
				//转化x坐标
				tempData.push(points[i][0] * (parseFloat(DisplayRate.width / drawRate.width)));
				//转化y坐标
				tempData.push(points[i][1] * (parseFloat(DisplayRate.height / drawRate.height)));
				//加载转化后的结果
				resultData.push(Object.clone(tempData));
			}
			return resultData;
		};

		/**
		 * 在摄像机上绘制单线（视频绘线用）
		 * @param data - 单线数据，点位坐标信息（3个点）
		 * @param text - 线条名字
		 * @param curCameraRate - 摄像机原始分辨率/显示框线的ocx显示分辨率
		 * @param curDrawRate - 绘制框线时的分辨率
		 * @returns {string} - 格式化后的字符串，供ocx调用并显示
		 */
		var showSingleLineOnPlayer = function (data,color, text, curCameraRate, curDrawRate) {
			var drawInfo = "", i, type = 0, tempInfo = null;
			//如果是否符合数据类型
			if (data.length < 4) {
				return drawInfo;
			}
			//单向
			if (data.length === 4) {
				drawInfo += "{'singlearrowline',{";

			} else if (data.length === 6) {
				//双向
				drawInfo += "{'onelinedoublearrow',{";
				type = 1;//双向标示，默认单向0
			}
			//遍历信息体
			for (i = 0; i < data.length; i++) {
				if (type === 0 && i === 2) {
					continue;
				}
				if (type === 1 && (i === 2 || i === 4)) {
					continue;
				}
				//转换坐标
				tempInfo = coordinateSwitch(data[i], curCameraRate, curDrawRate);
				drawInfo += "(" + tempInfo.x + "," + tempInfo.y + "),";
			}
			drawInfo = drawInfo.substring(0, drawInfo.length - 1) + "},'"+color+"','" + text + "'}";

			return drawInfo;
		};

		/**
		 * 在摄像机上绘制双线(取第一条线的第一个方向为方向)（视频绘线用）
		 * @param data - 双线数据，点位坐标信息（6个点）
		 * @param text - 线条名字
		 * @param curCameraRate - 摄像机原始分辨率/显示框线的ocx显示分辨率
		 * @param curDrawRate - 绘制框线时的分辨率
		 * @returns {string} - 格式化后的字符串，供ocx调用并显示
		 */
		var showDoubleLineOnPlayer = function (data, color,text, curCameraRate, curDrawRate) {
			var drawInfo = "", i, tempInfo = null;
			//验证数据格式
			if (!data.line0 || !data.line1 || data.line0.length < 4) {
				return drawInfo;
			}
			drawInfo += "{'doublelineonearrow',{";
			//遍历第一条线信息体
			for (i = 0; i < 4; i++) {
				if (i === 2) {
					continue;
				}
				//转换坐标
				tempInfo = coordinateSwitch(data.line0[i], curCameraRate, curDrawRate);
				drawInfo += "(" + tempInfo.x + "," + tempInfo.y + "),";
			}
			//遍历第二条线信息体（取线上两点即可）
			for (i = 0; i < 2; i++) {
				//转换坐标
				tempInfo = coordinateSwitch(data.line1[i], curCameraRate, curDrawRate);
				drawInfo += "(" + tempInfo.x + "," + tempInfo.y + "),";
			}
			drawInfo = drawInfo.substring(0, drawInfo.length - 1) + "},'"+color+"','" + text + "'}";

			return drawInfo;
		};

		/**
		 * 在摄像机上绘制矩形（视频绘线用）
		 * @param data - 矩形数据，点位坐标信息（4个点）
		 * @param text - 矩形名字
		 * @param curCameraRate - 摄像机原始分辨率/显示框线的ocx显示分辨率
		 * @param curDrawRate - 绘制框线时的分辨率
		 * @returns {string} - 格式化后的字符串，供ocx调用并显示
		 */
		var showRectLineOnPlayer = function (data,color, text, curCameraRate, curDrawRate) {
			var drawInfo = "", i, tempInfo = null;
			//验证数据格式
			if (data.length !== 4) {
				return drawInfo;
			}
			//添加类型
			drawInfo += "{'rectangle',{";
			//遍历信息体
			for (i = 0; i < data.length; i++) {
				//转换坐标
				
				tempInfo = coordinateSwitch(data[i], curCameraRate, curDrawRate);
				drawInfo += "(" + tempInfo.x + "," + tempInfo.y + "),";
			}
			//去掉最后一个“，”，并添加颜色
			drawInfo = drawInfo.substring(0, drawInfo.length - 1) + "},'"+color+"','" + text + "'}";

			return drawInfo;
		};

		/**
		 * 在摄像机上绘制多边形（视频绘线用）
		 * @param data - 多边形数据，点位坐标信息（4个点）
		 * @param text - 多边形名字
		 * @param curCameraRate - 摄像机原始分辨率/显示框线的ocx显示分辨率
		 * @param curDrawRate - 绘制框线时的分辨率
		 * @returns {string} - 格式化后的字符串，供ocx调用并显示
		 */
		var showPolyLineOnPlayer = function (data, color,text, curCameraRate, curDrawRate) {
			var drawInfo = "", i, tempInfo = null;
			//验证数据格式
			if (data.length < 3) {
				return drawInfo;
			}
			//添加类型
			drawInfo += "{'polygon',{";
			//遍历信息体
			for (i = 0; i < data.length; i++) {
				//转换坐标
				tempInfo = coordinateSwitch(data[i], curCameraRate, curDrawRate);
				drawInfo += "(" + tempInfo.x + "," + tempInfo.y + "),";
			}
			//去掉最后一个“，”，并添加颜色
			drawInfo = drawInfo.substring(0, drawInfo.length - 1) + "},'"+color+"','" + text + "'}";

			return drawInfo;
		};

		/**
		 * 获取直线的方向用于重绘，根据方向的左手定则，以画线的起止点作为绘制方向，在线绘制方向的左手边，方向为left，右手边方向为right,双向为leftright
		 * @param points - 线条的坐标数据
		 * @returns {string} - 返回线条的方向
		 */
		var getDirection = function (points) {

			if (points.length === 6) {
				//双向，直接返回
				return "leftright";
			}
			//获取划线的两个点坐标及斜率
			var x1 = points[0][0], y1 = points[0][1], x2 = points[1][0], y2 = points[1][1], lineSlope = parseFloat(parseFloat(y2 - y1) / parseFloat(x2 - x1)), dir_x = points[3][0], dir_y = points[3][1], dir_tag = -1, y = -1;
			//根据不同的情况计算方向
			if (y1 === y2) {
				//横向
				dir_tag = ((x2 - x1) > 0) ? 1 : 0; //从左到右为1，右到左为0
				if (dir_y < y1) {
					//如果方位点在当前线的上面
					return (dir_tag === 1) ? "left" : "right";
				} else {
					//如果方位点在当前线的下面
					return (dir_tag === 1) ? "right" : "left";
				}
			} else if (x1 === x2) {
				//竖向
				dir_tag = ((y2 - y1) > 0) ? 1 : 0; //从上到下为1，下到上为0
				if (dir_x < x1) {
					//如果方位点在当前线的左边
					return (dir_tag === 1) ? "right" : "left";
				} else {
					//如果方位点在当前线的右边
					return (dir_tag === 1) ? "left" : "right";
				}
			} else {
				//西北--东南向 和 东北--西南向
				dir_tag = ((x2 - x1) > 0) ? 1 : 0;//从左到右为1，右到左为0
				//求得直线方程上dir_x点的纵坐标值
				y = lineSlope * dir_x - lineSlope * x1 + y1;
				//比较 y值和dir_y的大小
				if (y < dir_y) {
					//方位点在直线下面
					return (dir_tag === 1) ? "right" : "left";
				} else {
					//方位点在直线上面
					return (dir_tag === 1) ? "left" : "right";
				}
			}
		};

		//对外接口
		return {

			/**
			 * 坐标转换(主要是转换成0~1中间的值，主要用到的有ocx显示框线、算法任务参数保存)
			 */
			coordinateSwitch: coordinateSwitch,

			/**
			 * 绘图画布使用，回显之前绘制过的线条
			 */
			coordinateSwitchEx: coordinateSwitchEx,

			/**
			 * 格式化画布回显时的格式，将框线规则重新显示在画布上时使用
			 * @param data - 规则线条的原始数据
			 * @param type - 规则线条的类型
			 * @param displayRate - 当前待显示的ocx显示分辨率
			 * @returns {{}} - 转换后的规则线条数据，用于在画布上显示
			 */
			formateDisplayDataOnDraw: function (data, type, displayRate) {
				var resultData = {};
				if (type === "line") {
					resultData.type = getDirection(data.points);
					resultData.points = coordinateSwitchEx(data.points, data.drawRate, displayRate);
				} else if (type === "dline") {
					resultData = {
						line0: { points: [] },
						line1: { points: [] }
					};
					//赋值
					resultData.line0.type = getDirection(data.points.line0);
					resultData.line1.type = getDirection(data.points.line1);
					resultData.line0.points = coordinateSwitchEx(data.points.line0, data.drawRate, displayRate);
					resultData.line1.points = coordinateSwitchEx(data.points.line1, data.drawRate, displayRate);
				} else if (type === "rect") {
					var tempPoints = coordinateSwitchEx(data.points, data.drawRate, displayRate);
					resultData.x = tempPoints[0][0];
					resultData.y = tempPoints[0][1];
					resultData.width = Math.abs(tempPoints[2][0] - tempPoints[0][0]);
					resultData.height = Math.abs(tempPoints[2][1] - tempPoints[0][1]);
				} else if (type === "poly") {
					resultData.points = coordinateSwitchEx(data.points, data.drawRate, displayRate);
				} else if (type === "rect_min" || type === "rect_max" || type === "rect_car" || type === "rect_min_face" || type === "rect_max_face") {
					//最大、最小过滤时
					resultData.width = data.width;
					resultData.height = data.height;
				} else if (type === "rect_face_rule") {
					//人脸检测区域
					resultData.x = data.x;
					resultData.y = data.y;
					resultData.width = data.width;
					resultData.height = data.height;
				}
				resultData.domid = data.domid;
				resultData.text = data.text;

				return resultData;
			},

			/**
			 * 将data中的宽、高，转化成显示分辨率下的宽、高, 人脸检测布控区域设置时使用
			 * @param data - 摄像机分辩率的宽、高
			 * @param displayRate - ocx当前显示的分辨率
			 * @param cameraRate - 摄像机本身的分辨率
			 */
			formateDisplayRataRect: function (data, displayRate, cameraRate) {
				return {
					width: data.width * displayRate.width / cameraRate.width,
					height: data.height * displayRate.height / cameraRate.height
				};
			},

			/**
			 * 在视频上叠加图形，查看布防规则时使用
			 * @param data - 待显示的布防规则框线数据
			 * @param curCameraRate - 摄像机的分辨率/当前显示框线规则的ocx显示分辨率
			 */
			dealGraphicOnVideo: function (data, color,curCameraRate,index) {
				var drawInfo = "";
				//遍历当前区域列表，并在摄像机视频上显示
				for (var i = 0; i < data.length; i++) {
					var tempObj = data[i];
					if (tempObj.type === "SingleArrowline" || tempObj.type === "DoubleArrowline") {
						//单线
						drawInfo = showSingleLineOnPlayer(tempObj.points, color,tempObj.text, curCameraRate, tempObj.drawRate);
						//调用播放器接口绘图
						_g.videoPlayer.createImage(drawInfo, index);
					} else if (tempObj.type === "Doubleline") {
						//双线
						drawInfo = showDoubleLineOnPlayer(tempObj.points,color, tempObj.text, curCameraRate, tempObj.drawRate);
						//调用播放器接口绘图
						_g.videoPlayer.createImage(drawInfo, index);
					} else if (tempObj.type === "rect") {
						//矩形
						drawInfo = showRectLineOnPlayer(tempObj.points, color,tempObj.text, curCameraRate, tempObj.drawRate);
						//调用播放器接口绘图
						_g.videoPlayer.createImage(drawInfo,index);
					} else if (tempObj.type === "polyline") {
						//多边形
						drawInfo = showPolyLineOnPlayer(tempObj.points, color,tempObj.text, curCameraRate, tempObj.drawRate);
						//调用播放器接口绘图
						_g.videoPlayer.createImage(drawInfo,index);
					}
				}
			}
		};
	})();

return {
		init:init,
		//是否加载完
		checkVideoLoaded:checkVideoLoaded,
		/**
		 * 摄像机框线规则设置、视频框线叠加相关
		 */
		ruleLineOpera: DefenceLineTools,

		/**
		 * 获取鼠标的位置
		 * @param evt - 当前触发对象的上下文
		 * @returns {{x: number, y: number}} - 返回鼠标的位置
		 */
		getMousePos: function (evt) {
			var left = 0, top = 0, ie = navigator.userAgent.indexOf("MSIE") > 0;
			if (ie) {
				left = parseInt(evt.clientX);
				top = parseInt(evt.clientY);
			} else {
				left = parseInt((evt.x ? evt.x : evt.pageX));
				top = parseInt((evt.y ? evt.y : evt.pageY));
			}
			return {
				x: left,
				y: top
			};
		},

		/**
		 * 获取摄像机分辨率
		 * @returns {{width: number, height: number}} - 返回摄像机分辨率信息
		 */
		getCameraRate: function (index) {
			var rateInfo = null, rWidth = 0, rHeight = 0;
			//如果获取失败，则
			var videoAttr = _g.videoPlayer.playerObj.GetVideoAttribute(index);
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
		 * @returns {{width: *, height: *}} - 获取当前ocx显示分辨率
		 */
		
		getDisplayRate: function () {
			var drawAreaObj = jQuery(".screen");//这个是获取ocx的宽高来用的，做兼容，在火狐上取不到ocx的对象用jquery，但是用原生的取的话宽高全是100%，根据布局取ocx父元素的宽高即可。by wangxiaojun 2015-01-04
			// var drawAreaObj = document.getElementById("UIOCXDEFEND");
			if( _g.videoPlayer.hasOwnProperty("isHaveMaxWindow")){
				var isBigger = _g.videoPlayer.isHaveMaxWindow();
			}
			if(isBigger){
				return {
					width: drawAreaObj.width()-6,
					height:drawAreaObj.height()-5
				};
			}else{
				return {
					width: (drawAreaObj.width()-6)/2,
					height: (drawAreaObj.height()-5)/2
				}
			}
			
		},
		/**
		 * 获取框线展现时的分辨率
		 * @returns {{width: *, height: *}} - 获取当前ocx显示分辨率
		 */
		
		getDisplayRateOnMap: function () {
			var drawAreaObj = jQuery(".map-video-container");//这个是获取ocx的宽高来用的，做兼容，在火狐上取不到ocx的对象用jquery，但是用原生的取的话宽高全是100%，根据布局取ocx父元素的宽高即可。by wangxiaojun 2015-01-04
			return {
				width: drawAreaObj.width(),
				height: drawAreaObj.height()
			}
		},
		/**
		 * 检查视频播放器是否可以播放
		 * @param tag 为1标示进入布防设置时验证，为2标示显示布防规则时验证
		 * @returns {boolean} true播放成功，false播放失败
		 */
		checkedPlayer: function (tag,index) {
			if (_g.videoPlayer.cameraData[index].cplayStatus === 0) {
				if (!checkVideoLoaded(index)) {
					return false;
				}
				//正常播放
				return true;
			} else if (_g.videoPlayer.cameraData[index].cplayStatus === 1) {
				//播放异常
				if (tag === 1) {
					notify.warn("摄像机视频加载出现异常，暂不能进行布防！");
				} else {
					notify.warn("摄像机视频加载出现异常，暂不能查看布防规则！");
				}
				return false;
			} else if (_g.videoPlayer.cameraData[index].cplayStatus === 2) {
				//离线状态
				if (tag === 1) {
					notify.warn("摄像机处于离线状态，暂不能进行布防！");
				} else {
					notify.warn("摄像机处于离线状态，暂不能查看布防规则！");
				}
				return false;
			}
			return false;
		},
		/**
		 * 清空播放器相关对象,资源释放
		 */
		clearVideoInfo: function () {
			if (_g.videoPlayer) {
				_g.videoPlayer.stop(false, 0);
				_g.videoPlayer = null;
			}
		},
		/**关闭CreateImage创建的所有图像*/
		clearAllImage:function(index){
			var status = _g.videoPlayer.releaseAllImage(index);
		},
		redrawTriggerClick:function(data, color,index){
			var self = this;
			_g.videoPlayer.on("dblclick",function(e,index){
				var curCameraRate =self.getDisplayRate();
				self.clearAllImage(index)
				setTimeout(function(){
					self.ruleLineOpera.dealGraphicOnVideo(data, color,curCameraRate,index);
					return ;
				},100)
				
			});
		},
		redraw:function(data, color,curCameraRate,index){
				var self = this;
				self.clearAllImage(index)
				self.ruleLineOpera.dealGraphicOnVideo(data, color,curCameraRate,index);
		}
	};
});