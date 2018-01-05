/**
 * Created by Zhangyu on 2014/12/3.
 * 视频布防模块的公共方法
 */
define([
	"/module/protection-monitor/defencesetting/js/global-var.js",
	"base.self"
], function(_g) {

	/**
	 * 判断浏览器版本
	 * @param browser - 待检测的浏览器标示
	 * @returns {boolean} - 返回检测结果
	 */
	var checkWebBrowser = function (browser) {
		return (navigator.userAgent.indexOf(browser) > 0);
	};

	/**
	 * 判断摄像机视频是否已经加载画面
	 * @returns {boolean} - 返回加载与否
	 */
	var checkVideoLoaded = function () {
		var videoAttr = _g.defence.videoPlayer.playerObj.GetVideoAttribute(0);
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
	 * 数据格式化相关处理函数
	 * 1、布防算法列表显示时使用（eye）
	 * 2、查看已布防的规则列表时使用
	 */
	var formateModelData = (function () {
		//当前屏蔽的算法事件
		var notOpenRule = ["手动报警", "人员布控"];//"离岗检测", "出门检测", "打架检测", "拥堵检测", "非法尾随", "奔跑检测", "车牌识别", "人脸检测", "烟火检测"],

		/**
		 * 判断当前算法事件是否已经可用，用于在formateData中过滤
		 * @param name
		 * @returns {boolean}
		 */
		var checkOpenFlag = function (name) {

			for (var i = 0; i < notOpenRule.length; i++) {
				if (name.indexOf(notOpenRule[i]) >= 0) {
					return false;
				}
			}
			return true;
		};

		/**
		 * 获取分类的名字
		 * @param id - 根据分类id，映射对应的分类名称
		 * @returns {string} - 返回分类名称
		 */
		var getCategoryName = function (id) {
			switch (id) {
				case 1:
					return "行为分析";
				case 2:
					return "流量统计";
				case 3:
					return "检测标注";
				case 4:
					return "人员布控";
				case 5:
					return "烟火检测";
			}
		};

		/**
		 * 根据布防规则算法事件的evType获取用户在该事件已设置的taskId和任务所在的状态
		 * @param evType - 待获取信息的算法事件类型标示
		 * @param data - 待查找的数据集合
		 * @returns {*} - 返回查找结果
		 */
		var getRuleTaskId = function (evType, data) {

			for (var i = 0; i < data.length; i++) {
				if (data[i].evType === evType) {
					return {
						taskId: data[i].taskId,
						enableTask: data[i].enableTask
					};
				}
			}
			return {
				taskId: 0,
				enableTask: -1
			};
		};

		/**
		 * 数据格式化部分(工具)
		 * @param data - 原始数据
		 * @param tag - 数据类型
		 * @param extra - 额外的数据集合
		 * @returns {*} - 返回格式化之后的数据集合
		 */
		return function (data, tag, extra) {
			//布防规则列表的数据格式化
			if (tag === "rule_list") {
				var resultData = { categories: [] }, preCategory = 0, tempCategory = null;
				for (var i = 0; i < data.defences.length; i++) {
					var tempObj = data.defences[i], curCategory = tempObj.category, //当前规则信息
						taskInfo = getRuleTaskId(tempObj.evType, extra), temprule = jQuery.extend({}, {
							ruleid: tempObj.evType,
							rulename: tempObj.name,
							modulename: tempObj.modulename,
							moduleversion: tempObj.moduleversion,
							openflag: !!checkOpenFlag(tempObj.name),
							taskId: taskInfo.taskId,
							enableTask: taskInfo.enableTask
						});
					if (curCategory !== preCategory) {
						if (i !== 0) {
							//添加分组
							resultData.categories.push(tempCategory);
						}
						//新的分类
						tempCategory = jQuery.extend({}, {
							categoryid: data.defences[i].category,
							categoryname: getCategoryName(data.defences[i].category),
							subrulescount: 0,
							showflag: false,
							subrules: []
						});
						preCategory = curCategory;
					}

					//添加当前规则对象到当前分类
					tempCategory.subrules.push(temprule);
					if (temprule.openflag) {
						tempCategory.subrulescount++;
					}
					tempCategory.showflag |= temprule.openflag;
				}
				resultData.categories.push(tempCategory);

				return resultData;

			} else if (tag === "eye_event_list") {
				//当用户点击视频右上角眼睛时，系统列表当前正在布防的事件列表
				for (var h = 0; h < data.list.length; h++) {
					//当前规则信息
					if (data.list[h].name === "手动报警") {
						//视频右上角的框线规则查看中的事件列表是添加了布防任务的，所以不需要手动报警
						data.list.splice(h, 1);
					}
				}
				return data;
			}
		};

	})();

	/**
	 * 数据验证相关函数
	 */
	var dataValidateFun = {

		/**
		 * 输入验证
		 * @param str - 待检测的字符串
		 * @param msg - 提示信息的头
		 * @param canNull - 是否允许为空
		 * @param canspecial - 是否允许除中文、数字、字母、下划线以外的其他字符
		 * @returns {boolean} - 返回验证成功与否
		 */
		inputInvalidate: function (str, msg, canNull, canspecial) {
			var partern = /^[\w\u4e00-\u9fa5]+$/gi;

			if (!canNull && jQuery.trim(str) === "") {
				notify.warn(msg + "不能为空！");
				return false;
			} else {
				if(!canspecial || canspecial === "undefined") {
					//传空，不用继续检测了
					return true;
				} else {
					if(canspecial){
						return true;
					} else {
						//如果不允许特殊字符，则进行判断检测
						if (!partern.test(str)) {
							notify.warn(msg + "中含有除中文、数字、字母、下划线以外的其他字符，请检查更正！");
							return false;
						} else {
							return true;
						}
					}
				}
			}
		},

		/**
		 * 验证数字（包含小数）
		 * @param num - 待验证的数据
		 * @param tag - 标记是否检验0~1的范围
		 * @returns {boolean} - 返回验证成功与否
		 */
		filterNumbers: function (num, tag) {
			var partern = /^(-?\d+)(\.\d+)?$/;
			//判断是否是数子
			if (!partern.test(+ num)) {
				return false;
			} else {
				if (tag) {
					//判断是否处于0~1之间
					var parseNum = parseFloat(num);
					return (parseNum > 0 && parseNum <= 1);
				} else {
					return true;
				}
			}
		},

		/**
		 * 验证正整数
		 * @param num - 待验证的数据
		 * @param min - 最小值范围
		 * @param max - 最大值范围
		 * @returns {boolean} - 返回验证成功与否
		 */
		filterIntegers: function (num, min, max) {
			var partern = /^\+?[1-9][0-9]*$/gi;
			//判断是否是数子
			if (!partern.test(num)) {
				return false;
			} else {
				return !(num > max || num < min);
			}
		}
	};

	/**
	 * 摄像机框线规则设置、视频框线叠加相关
	 */
	var DefenceLineTools = (function(){
		/**
		 * 坐标转换(智能标注,算法任务参数保存)
		 * @param point - 框线点坐标数据
		 * @param curCameraRate - 摄像机的原始分辨率
		 * @param curDrawRate - 框线绘制时的分辨率
		 * @returns {{x: string, y: string}} - 转换后的的点坐标数据
		 */
		var coordinateSwitchForSmartDeal = function (point, curCameraRate, curDrawRate) {
			//获取当前坐标相对于摄像机分辨率的坐标
			var tempPoint_x = point[0] * (parseFloat(curCameraRate.width / curDrawRate.width)), tempPoint_y = point[1] * (parseFloat(curCameraRate.height / curDrawRate.height));
			//转换为0~1坐标数据
			return {
				x: tempPoint_x,
				y: tempPoint_y
			};
		};
		/**
		 * 坐标转换(主要是转换成0~1中间的值，主要用到的有ocx显示框线、算法任务参数保存)
		 * @param point - 框线点坐标数据
		 * @param curCameraRate - 摄像机的原始分辨率/ocx显示分辨率
		 * @param curDrawRate - 框线绘制时的分辨率
		 * @returns {{x: string, y: string}} - 转换后的的点坐标数据
		 */
		var coordinateSwitch = function (point, curCameraRate, curDrawRate) {
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
		var showSingleLineOnPlayer = function (data, text, curCameraRate, curDrawRate) {
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
			drawInfo = drawInfo.substring(0, drawInfo.length - 1) + "},'12124160','" + text + "'}";

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
		var showDoubleLineOnPlayer = function (data, text, curCameraRate, curDrawRate) {
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
			drawInfo = drawInfo.substring(0, drawInfo.length - 1) + "},'12124160','" + text + "'}";

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
		var showRectLineOnPlayer = function (data, text, curCameraRate, curDrawRate) {
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
			drawInfo = drawInfo.substring(0, drawInfo.length - 1) + "},'12124160','" + text + "'}";

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
		var showPolyLineOnPlayer = function (data, text, curCameraRate, curDrawRate) {
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
			drawInfo = drawInfo.substring(0, drawInfo.length - 1) + "},'12124160','" + text + "'}";

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
			coordinateSwitchForSmartDeal:coordinateSwitchForSmartDeal,
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
			dealGraphicOnVideo: function (data, curCameraRate) {
				var drawInfo = "";
				//遍历当前区域列表，并在摄像机视频上显示
				for (var i = 0; i < data.length; i++) {
					var tempObj = data[i];
					if (tempObj.type === "SingleArrowline" || tempObj.type === "DoubleArrowline") {
						//单线
						drawInfo = showSingleLineOnPlayer(tempObj.points, tempObj.text, curCameraRate, tempObj.drawRate);
						//调用播放器接口绘图
						_g.defence.videoPlayer.createImage(drawInfo, 0);
					} else if (tempObj.type === "Doubleline") {
						//双线
						drawInfo = showDoubleLineOnPlayer(tempObj.points, tempObj.text, curCameraRate, tempObj.drawRate);
						//调用播放器接口绘图
						_g.defence.videoPlayer.createImage(drawInfo, 0);
					} else if (tempObj.type === "rect") {
						//矩形
						drawInfo = showRectLineOnPlayer(tempObj.points, tempObj.text, curCameraRate, tempObj.drawRate);
						//调用播放器接口绘图
						_g.defence.videoPlayer.createImage(drawInfo, 0);
					} else if (tempObj.type === "polyline") {
						//多边形
						drawInfo = showPolyLineOnPlayer(tempObj.points, tempObj.text, curCameraRate, tempObj.drawRate);
						//调用播放器接口绘图
						_g.defence.videoPlayer.createImage(drawInfo, 0);
					}
				}
			}
		};
	})();

	return {
		/**
		 * 数据格式化函数
		 */
		formateData: formateModelData,

		/**
		 * 数据验证相关函数
		 */
		invalidate: dataValidateFun,

		/**
		 * 摄像机框线规则设置、视频框线叠加相关
		 */
		ruleLineOpera: DefenceLineTools,

		/**
		 * 判断浏览器版本
		 */
		checkWebBrowser: checkWebBrowser,

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
		getCameraRate: function () {
			var rateInfo = null, rWidth = 0, rHeight = 0;
			//如果获取失败，则
			var videoAttr = _g.defence.videoPlayer.playerObj.GetVideoAttribute(0);
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
		 * 获取框线绘制时的分辨率
		 * @returns {{width: *, height: *}} - 获取当前ocx显示分辨率
		 */
		getDrawRate: function () {
			var drawAreaObj = jQuery("#TempSnapCover");//这个是获取ocx的宽高来用的，做兼容，在火狐上取不到ocx的对象用jquery，但是用原生的取的话宽高全是100%，根据布局取ocx父元素的宽高即可。by wangxiaojun 2015-01-04
			return {
				width: drawAreaObj.width(),
				height: drawAreaObj.height()
			};
		},
		/**
		 * 获取框线展现时的分辨率
		 * @returns {{width: *, height: *}} - 获取当前ocx显示分辨率
		 */
		
		getDisplayRate: function () {
			var drawAreaObj = jQuery(".content-down-video");//这个是获取ocx的宽高来用的，做兼容，在火狐上取不到ocx的对象用jquery，但是用原生的取的话宽高全是100%，根据布局取ocx父元素的宽高即可。by wangxiaojun 2015-01-04
			// var drawAreaObj = document.getElementById("UIOCXDEFEND");
			return {
				width: drawAreaObj.width(),
				height: drawAreaObj.height()
			};
		},

		/**
		 * 检查视频播放器是否可以播放
		 * @param tag 为1标示进入布防设置时验证，为2标示显示布防规则时验证
		 * @returns {boolean} true播放成功，false播放失败
		 */
		checkedPlayer: function (tag) {
			if (_g.defence.videoPlayer.cameraData[0].cplayStatus === 0) {
				if (!checkVideoLoaded()) {
					notify.warn("正在加载摄像机视频，请稍后...");
					return false;
				}
				//正常播放
				return true;
			} else if (_g.defence.videoPlayer.cameraData[0].cplayStatus === 1) {
				//播放异常
				if (tag === 1) {
					notify.warn("摄像机视频加载出现异常，暂不能进行布防！");
				} else {
					notify.warn("摄像机视频加载出现异常，暂不能查看布防规则！");
				}
				return false;
			} else if (_g.defence.videoPlayer.cameraData[0].cplayStatus === 2) {
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
		 * 加载模板通用函数
		 * @param url - 模板地址
		 * @param callbackSuccess - 加载模板成功后的回调函数
		 * @param callbackError - 加载模板失败后的回调函数
		 */
		loadTemplate: function (url, callbackSuccess, callbackError) {
			var compiler = null;
			//加载模板
			jQuery.when(Toolkit.loadTempl(url)).done(function (timeTemplate) {

				if (timeTemplate instanceof Array) {
					timeTemplate = timeTemplate[0];
				}
				//模板加载成功
				compiler = Handlebars.compile(timeTemplate);
				callbackSuccess(compiler);

			}).fail(function () {
				//执行错误函数
				callbackError();
			});
		},

		/**
		 * 根据算法事件的id获取对应的算法图标【算法列表、任务保存】
		 * @param evType - 算法的id
		 * @param taskid - 算法对应的任务id
		 * @param enableTask - 当前任务状态，为0是暂停，为1是关闭
		 * @returns {string} - 返回对应图标的样式名称
		 */
		getRuleIconById: function (evType, taskid, enableTask) {
			switch (evType) {
				case 1024:
					return ((taskid === 0 || enableTask === 0) ? "icon_run" : "icon_run_active");				//奔跑检测
				case 8388608:
					return ((taskid === 0 || enableTask === 0) ? "icon_follow" : "icon_follow_active");		//非法尾随
				case 4:
					return ((taskid === 0 || enableTask === 0) ? "icon_invasion" : "icon_invasion_active");		//区域入侵
				case 256:
					return ((taskid === 0 || enableTask === 0) ? "icon_parking" : "icon_parking_active");		//非法停车
				case 2:
					return ((taskid === 0 || enableTask === 0) ? "icon_detection" : "icon_detection_active");	//拌线检测
				case 32:
					return ((taskid === 0 || enableTask === 0) ? "icon_wandering" : "icon_wandering_active");	//徘徊检测
				case 128:
					return ((taskid === 0 || enableTask === 0) ? "icon_legacy" : "icon_legacy_active");		//物品遗留
				case 64:
					return ((taskid === 0 || enableTask === 0) ? "icon_lost" : "icon_lost_active");				//物品丢失
				case 2048:
					return ((taskid === 0 || enableTask === 0) ? "icon_gathered" : "icon_gathered_active");	//人群聚集
				case 4096:
					return ((taskid === 0 || enableTask === 0) ? "icon_per_count" : "icon_per_count_active");	//人流统计
				case 131072:
					return ((taskid === 0 || enableTask === 0) ? "icon_car_count" : "icon_car_count_active");//车流统计
				case 8192:
					return ((taskid === 0 || enableTask === 0) ? "icon_car_logo" : "icon_car_logo_active");	//车牌识别
				case 524288:
					return ((taskid === 0 || enableTask === 0) ? "icon_face" : "icon_face_active");			//人脸检测
				case 16777216:
					return ((taskid === 0 || enableTask === 0) ? "icon_fireworks" : "icon_fireworks_active");//烟火检测
				case 262144:
					return ((taskid === 0 || enableTask === 0) ? "icon_checkdoor" : "icon_checkdoor_active");//出门检测
				case 1048576:
					return ((taskid === 0 || enableTask === 0) ? "icon_fight" : "icon_fight_active");//打架检测
				case 4194304:
					return ((taskid === 0 || enableTask === 0) ? "icon_congestion" : "icon_congestion_active");//拥堵检测
				case 65536:
					return ((taskid === 0 || enableTask === 0) ? "icon_leftchair" : "icon_leftchair_active");//离岗检测
				case 268435456:
					return ((taskid === 0 || enableTask === 0) ? "icon_mark" : "icon_mark_active");//实时标注
				default:
					return "icon_run";
			}
		},

		/**
		 * 清除掉选中算法时间对应信息，如视频上的框线、当前选中的算法id，在后退事件上用到
		 */
		clearSelectedRuleInfo: function () {
			clearInterval(_g.defence.refreshCarOrPeopleTimer);
			_g.defence.preCarOrPeopleCount = 0;
			_g.defence.curSelectedRule = -1;
			if(_g.defence.videoPlayer) {
				_g.defence.videoPlayer.releaseAllImage(0);
			}
		},

		/**
		 * 清空播放器相关对象,资源释放
		 */
		clearVideoInfo: function () {
			if (_g.defence.videoPlayer) {
				_g.defence.videoPlayer.stop(false, 0);
				_g.defence.videoPlayer = null;
			}
		}
	};
});