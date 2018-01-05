
/**
 * '[摄像机规则设置中划线画框部分的逻辑]'
 * @author Wang Xiaojun
 * @date   2014-12-19
 */

define([
	'/module/common/js/player2.js',
	'DrawEditor',
	'base.self'
	], function() {

	var frame = function(){};

	frame.prototype= {


		/**
		 * 坐标转换(主要是转换成0~1中间的值，主要用到的有ocx显示框线、算法任务参数保存)
		 * @param point-当前点的坐标信息
		 * @param curCameraRate-待转化的分辨率
		 * 
		 * @param curDrawRate-绘图时的分辨率
		 * @returns {{x: string, y: string}}-返回待转化分辨率下的坐标信息
		 */
		

		coordinateSwitch: function(point, curCameraRate, curDrawRate) {
			//获取当前坐标相对于摄像机分辨率的坐标
			var self = this,
				tempPoint_x = point[0] * (parseFloat(curCameraRate.width / curDrawRate.width)),
				tempPoint_y = point[1] * (parseFloat(curCameraRate.height / curDrawRate.height));
			//转换为0~1坐标数据
			return {
				x: parseFloat(tempPoint_x / curCameraRate.width).toFixed(6),
				y: parseFloat(tempPoint_y / curCameraRate.height).toFixed(6)
			};
		},

		/**
		 * 在摄像机上绘制单线（视频绘线用）
		 * @param data-线条的坐标信息
		 * @param text-线条的名称
		 * @param curCameraRate-摄像机分辨率，也即显示分辨率
		 * @param curDrawRate-绘制线条时的分辨率
		 * @returns {string}-返回符合ocx解析的数据格式
		 */
		

		showSingleLineOnPlayer: function(data, text, curCameraRate, curDrawRate) {
			var self = this,
				drawInfo = "",
				i = 0,
				type = 0,
				tempInfo = null;
			//如果是否符合数据类型
			if (data.length < 4) {
				return;
			}
			//单向
			if (data.length === 4) {
				drawInfo += "{'singlearrowline',{";

			} else if (data.length === 6) {
				//双向
				drawInfo += "{'onelinedoublearrow',{";
				type = 1; //双向标示，默认单向0
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
				tempInfo = self.coordinateSwitch(data[i], curCameraRate, curDrawRate);
				drawInfo += "(" + tempInfo.x + "," + tempInfo.y + "),";
			}
			drawInfo = drawInfo.substring(0, drawInfo.length - 1) + "},'12124160','" + text + "'}";

			return drawInfo;
		},

		/**
		 * 在摄像机上绘制双线(取第一条线的第一个方向为方向)（视频绘线用）
		 * @param data-线条的坐标信息
		 * @param text-线条的名称
		 * @param curCameraRate-摄像机分辨率，也即显示分辨率
		 * @param curDrawRate-绘制线条时的分辨率
		 * @returns {string}-返回符合ocx解析的数据格式
		 */
		

		showDoubleLineOnPlayer: function(data, text, curCameraRate, curDrawRate) {
			var self = this,
				drawInfo = "",
				i = 0,
				tempInfo = null;
			//验证数据格式
			if (!data.line0 || !data.line1 || data.line0.length < 4) {
				return;
			}
			drawInfo += "{'doublelineonearrow',{";
			//遍历第一条线信息体
			for (i = 0; i < 4; i++) {
				if (i === 2) {
					continue;
				}
				//转换坐标
				tempInfo = me.coordinateSwitch(data.line0[i], curCameraRate, curDrawRate);
				drawInfo += "(" + tempInfo.x + "," + tempInfo.y + "),";
			}
			//遍历第二条线信息体（取线上两点即可）
			for (i = 0; i < 2; i++) {
				//转换坐标
				tempInfo = self.coordinateSwitch(data.line1[i], curCameraRate, curDrawRate);
				drawInfo += "(" + tempInfo.x + "," + tempInfo.y + "),";
			}
			drawInfo = drawInfo.substring(0, drawInfo.length - 1) + "},'12124160','" + text + "'}";

			return drawInfo;
		},

		/**
		 * 在摄像机上绘制矩形（视频绘线用）
		 * @param data-线条的坐标信息
		 * @param text-线条的名称
		 * @param curCameraRate-摄像机分辨率，也即显示分辨率
		 * @param curDrawRate-绘制线条时的分辨率
		 * @returns {string}-返回符合ocx解析的数据格式
		 */
		
		showRectLineOnPlayer: function(data, text, curCameraRate, curDrawRate) {
			var self = this,
				drawInfo = "",
				i = 0,
				tempInfo = null;
			//验证数据格式
			if (data.length !== 4) {
				return;
			}
			//添加类型
			drawInfo += "{'rectangle',{";
			//遍历信息体
			for (i = 0; i < data.length; i++) {
				//转换坐标
				tempInfo = self.coordinateSwitch(data[i], curCameraRate, curDrawRate);
				drawInfo += "(" + tempInfo.x + "," + tempInfo.y + "),";
			}
			//去掉最后一个“，”，并添加颜色
			drawInfo = drawInfo.substring(0, drawInfo.length - 1) + "},'12124160','" + text + "'}";

			return drawInfo;
		},


		/**
		 * 在摄像机上绘制多边形（视频绘线用）
		 * @param data-线条的坐标信息
		 * @param text-线条的名称
		 * @param curCameraRate-摄像机分辨率，也即显示分辨率
		 * @param curDrawRate-绘制线条时的分辨率
		 * @returns {string}-返回符合ocx解析的数据格式
		 */
		

		showPolyLineOnPlayer: function(data, text, curCameraRate, curDrawRate) {
			var self = this,
				drawInfo = "",
				i = 0,
				tempInfo = null;
			//验证数据格式
			if (data.length < 3) {
				return;
			}
			//添加类型
			drawInfo += "{'polygon',{";
			//遍历信息体
			for (i = 0; i < data.length; i++) {
				//转换坐标
				tempInfo = self.coordinateSwitch(data[i], curCameraRate, curDrawRate);
				drawInfo += "(" + tempInfo.x + "," + tempInfo.y + "),";
			}
			//去掉最后一个“，”，并添加颜色
			drawInfo = drawInfo.substring(0, drawInfo.length - 1) + "},'12124160','" + text + "'}";

			return drawInfo;
		},


		/**
		 * 将data中的宽、高，转化成显示分辨率下的宽、高
		 * @param data-摄像机分辩率的宽、高
		 * @param displayRate-ocx当前显示的分辨率
		 * @param cameraRate-摄像机本身的分辨率
		 */
		
		
		formateDisplayRataRect: function(data, displayRate, cameraRate) {
			return {
				width: data.width * displayRate.width / cameraRate.width,
				height: data.height * displayRate.height / cameraRate.height
			};
		}
	}

	return new frame();

});