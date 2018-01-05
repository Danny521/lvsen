/*global DrawEditor:true*/
/**
 * Created by Zhangyu on 2014/12/10.
 * 布防详细规则设置，对当前绘制的区域列表进行管理（增删查改...）
 */
define([
	"/module/protection-monitor/defencesetting/js/view/defence/third-arealist-view.js",
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js",
	"jquery",
	"DrawEditor"
], function(view, DefenceTools, jQuery) {
	/**
	 * 数据格式化模块:布防框线规则保存到数据库前对数据进行格式化
	 */
	var FormateData = (function(scope) {

		/**
		 * 获取线的方向（至少四个点，后面两个是方向的起点和终点）,-1为无方向，0为双向，1为方向点在直线下面，2为方向点在直线上面
		 * @param points - 线条的坐标数据
		 * @returns {number} - 返回线条的方向
		 */
		var _getLineDirection = function (points) {
			//获取划线的两个点坐标及斜率
			var x1 = points[0][0], y1 = points[0][1], x2 = points[1][0], y2 = points[1][1], lineSlope = parseFloat(parseFloat(y2 - y1) / parseFloat(x2 - x1)), dir_x = points[3][0], dir_y = points[3][1], y = -1;
			//根据不同的情况计算方向
			if (x1 === x2) {
				return 1;
			} else {
				//求得直线方程上dir_x点的纵坐标值
				y = lineSlope * dir_x - lineSlope * x1 + y1;
				//比较 y值和dir_y的大小
				if (y < dir_y) {
					//方位点在直线下面
					return 1;
				} else {
					//方位点在直线上面
					return 2;
				}
			}
		};
		/**
		 * 格式化单线规则
		 * @param tempArea - 待格式化的单线数据
		 * @param pointsArr - 临时坐标点位的存储
		 * @returns {*} - 满足算法参数的格式
		 */
		scope.formateSingleLineData = function (tempArea, pointsArr) {

			var j, tempInfo = {}, areaInfo = {}, curCameraRate = DefenceTools.getCameraRate();

			if (tempArea.points.length < 4) {
				return null;
			}
			areaInfo.rgnName = tempArea.text;
			areaInfo.rgnType = 0;
			areaInfo.direction = (tempArea.points.length === 6) ? 0 : _getLineDirection(tempArea.points);
			areaInfo.vaLines = [];
			//格式化坐标（取直线的两个点即可）
			for (j = 0; j < 2; j++) {
				//需要包含两个坐标
				if (tempArea.points[j].length !== 2) {
					return null;
				}
				//转换坐标
				tempInfo = DefenceTools.ruleLineOpera.coordinateSwitch(tempArea.points[j], curCameraRate, tempArea.drawRate);
				//装载这算为（0~1）的坐标
				pointsArr.push(tempInfo.x);
				pointsArr.push(tempInfo.y);
			}
			areaInfo.vaLines.push({
				vaLine: pointsArr.join(",")
			});

			return areaInfo;
		};

		/**
		 * 格式化双线规则
		 * @param tempArea - 待格式化的单线数据
		 * @param pointsArr - 临时坐标点位的存储
		 * @returns {*} - 满足算法参数的格式
		 */
		scope.formateDoubleLinesData = function (tempArea, pointsArr) {

			var j, tempInfo = {}, areaInfo = {}, curCameraRate = DefenceTools.getCameraRate();

			//有两条线
			if (!tempArea.points.line0 || !tempArea.points.line1) {
				return null;
			}
			areaInfo.rgnName = tempArea.text;
			areaInfo.rgnType = 0;
			areaInfo.direction = (tempArea.points.line0.length === 6) ? 0 : _getLineDirection(tempArea.points.line0);
			areaInfo.vaLines = [];
			//格式化line0的坐标（取直线的两个点即可）
			for (j = 0; j < 2; j++) {
				//需要包含两个坐标
				if (tempArea.points.line0[j].length !== 2) {
					return null;
				}
				//转换坐标
				tempInfo = DefenceTools.ruleLineOpera.coordinateSwitch(tempArea.points.line0[j], curCameraRate, tempArea.drawRate);
				//装载这算为（0~1）的坐标
				pointsArr.push(tempInfo.x);
				pointsArr.push(tempInfo.y);
			}
			areaInfo.vaLines.push({
				vaLine: pointsArr.join(",")
			});
			//清空临时数组
			pointsArr.length = 0;
			//格式化line1的坐标（取直线的两个点即可）
			for (j = 0; j < 2; j++) {
				//需要包含两个坐标
				if (tempArea.points.line1[j].length !== 2) {
					return null;
				}
				//转换坐标
				tempInfo = DefenceTools.ruleLineOpera.coordinateSwitch(tempArea.points.line1[j], curCameraRate, tempArea.drawRate);
				//装载这算为（0~1）的坐标
				pointsArr.push(tempInfo.x);
				pointsArr.push(tempInfo.y);
			}
			areaInfo.vaLines.push({
				vaLine: pointsArr.join(",")
			});

			return areaInfo;
		};

		/**
		 * 格式化矩形规则
		 * @param tempArea - 待格式化的单线数据
		 * @param pointsArr - 临时坐标点位的存储
		 * @returns {*} - 满足算法参数的格式
		 */
		scope.formateRectData = function (tempArea, pointsArr) {

			var j, tempInfo = {}, areaInfo = {}, curCameraRate = DefenceTools.getCameraRate();

			if (tempArea.points.length < 4) {
				return null;
			}
			areaInfo.rgnName = tempArea.text;
			areaInfo.rgnType = 2;
			areaInfo.vaLines = [];
			//格式化坐标（取对角线两个点即可）
			for (j = 0; j < tempArea.points.length; j++) {

				if (j === 1 || j === 3) {
					continue;
				}
				//需要包含两个坐标
				if (tempArea.points[j].length !== 2) {
					return null;
				}
				//转换坐标
				tempInfo = DefenceTools.ruleLineOpera.coordinateSwitch(tempArea.points[j], curCameraRate, tempArea.drawRate);
				//ipvs3.0之后矩形区域通过起始点和宽高来确定
				if (j === 2) {
					//装载宽高度
					pointsArr.push(parseFloat(Math.abs(tempInfo.x - pointsArr[0])).toFixed(6));
					pointsArr.push(parseFloat(Math.abs(tempInfo.y - pointsArr[1])).toFixed(6));
				} else {
					//装载这算为（0~1）的坐标
					pointsArr.push(tempInfo.x);
					pointsArr.push(tempInfo.y);
				}
			}
			//矩形时，一个点一个点的添加
			areaInfo.vaLines.push({
				vaLine: pointsArr.join(",")
			});

			return areaInfo;
		};

		/**
		 * 格式化对变形规则
		 * @param tempArea - 待格式化的单线数据
		 * @param pointsArr - 临时坐标点位的存储
		 * @returns {*} - 满足算法参数的格式
		 */
		scope.formatePolyLineData = function (tempArea, pointsArr) {

			var j, tempInfo = {}, areaInfo = {}, curCameraRate = DefenceTools.getCameraRate();

			if (tempArea.points.length < 3) {
				return null;
			}
			areaInfo.rgnName = tempArea.text;
			areaInfo.rgnType = 1;
			areaInfo.vaLines = [];
			//格式化坐标（取直线的两个点即可）
			for (j = 0; j < tempArea.points.length; j++) {
				//需要包含两个坐标
				if (tempArea.points[j].length !== 2) {
					return null;
				}
				//转换坐标
				tempInfo = DefenceTools.ruleLineOpera.coordinateSwitch(tempArea.points[j], curCameraRate, tempArea.drawRate);
				//装载这算为（0~1）的坐标
				pointsArr.push(tempInfo.x);
				pointsArr.push(tempInfo.y);
				//多边形时，一个点一个点的添加
				areaInfo.vaLines.push({
					vaLine: pointsArr.join(",")
				});
				pointsArr.length = 0;
			}

			return areaInfo;
		};

		return scope;
	}(FormateData || {}));

	/**
	 * 区域列表的逻辑控制部分
	 */
	var AreaList = (function(scope, $) {

		var _curAreaList = [],      //存储当前算法规则设置时所画的区域,每次选则新的算法时清空
			_curAreaListIndex = {   //存储当前绘图所添加的索引，供新绘图的默认命名用
				"singleLine": 0,
				"doubleLine": 0,
				"rect": 0,
				"polyline": 0
			};

		/**
		 * 根据新绘制的框线获取对应的默认名称
		 * @param data - 框线数据
		 * @returns {string} - 返回框线的默认名称
		 */
		var _getAreaDefaultName = function (data) {

			//根据当前划线类型
			switch (data.type) {
				case "SingleArrowline":
					_curAreaListIndex.singleLine++;
					return "线" + _curAreaListIndex.singleLine;
				case "Doubleline":
					_curAreaListIndex.doubleLine++;
					return "双线" + _curAreaListIndex.doubleLine;
				case "rect":
					_curAreaListIndex.rect++;
					return "矩形" + _curAreaListIndex.rect;
				case "polyline":
					_curAreaListIndex.polyline++;
					return "多边形" + _curAreaListIndex.polyline;
				default:
					return "区域";
			}
		};

		// 是否存在非法的框选区域
		var hasInvalidArea = false;

		/**
		 * 返回当前的框线规则列表
		 */
		scope.getCurAreaList = function () {
			return _curAreaList;
		};

		/**
		 * 显示已有的区域,在下拉列表中显示
		 * @param data - 待显示的数据信息
		 */
		scope.showExistAreas = function (data) {

			var self = this, fregmentArr = [];
			if(!data.frontParam){        //区别实时标注模块，里面并无frontParam数据
				return ;
			}
			//获取区域列表
			_curAreaList = self.formateDrawData(1, data.frontParam);
			//初始化select列表
			for (var i = 0, length = _curAreaList.length; i < length; i++) {
				//更新类型索引
				if (_curAreaList[i].type === "SingleArrowline") {

					_curAreaListIndex.singleLine++;
				} else if (_curAreaList[i].type === "Doubleline") {

					_curAreaListIndex.doubleLine++;
				} else if (_curAreaList[i].type === "rect") {

					_curAreaListIndex.rect++;
				} else if (_curAreaList[i].type === "polyline") {

					_curAreaListIndex.polyline++;
				}
				fregmentArr.push("<li data-domid='" + _curAreaList[i].domid + "'>" + _curAreaList[i].text + "</li>");
			}
			return fregmentArr.join("");
		};

		/**
		 * 用户划线、框完毕，需要遍历已有区域列表，如果已存在该区域，则更新，否则添加
		 * @param data - 绘图回传的数据
		 */
		scope.addAreaToList = function (data) {
			//绘图的时候显示分辩率和画图分辨率相同
			var $TempSnapPicture = $("#TempSnapPicture"), drawRateInfo = {height: $TempSnapPicture.height(), width: $TempSnapPicture.width()};
			//获取绘图分辨率，并存储到绘图数据中
			$.extend(data, {
				drawRate: {
					width: drawRateInfo.width,
					height: drawRateInfo.height
				}
			});
			//遍历区域列表，存储区域数据
			for (var i = 0, length = _curAreaList.length; i < length; i++) {
				if (_curAreaList[i].domid === data.domid) {
					//如果该区域已存在，则更新
					_curAreaList[i] = data;
					scope.checkArealist(drawRateInfo);
					return;
				}
			}
			//给区域添加名称并更新页面区域部分
			var title = _getAreaDefaultName(data);
			//更新当前绘制的框线名称
			DrawEditor.setTitle(data.domid, title);
			//添加到列表中
			data.text = title;
			_curAreaList.push(data);
			scope.checkArealist(drawRateInfo);
			return title;
		};
		/**
		 * [checkArealist 每次画完线后，检测所有区域的合法性]
		 * @return {[type]} [description]
		 */
		scope.checkArealist = function(drawRateInfo) {
			var areaList = _curAreaList;
			hasInvalidArea = false;
			areaList.forEach(function(area) {
				var points = area.points;
				if (points instanceof Array) {
					points.forEach(function(item) {
						if (item[0] > drawRateInfo.width) {
							hasInvalidArea = true;
						}
					})
				}
			});
		};
		scope.hasInvalidArea = function() {
			return hasInvalidArea;
		};
		/**
		 * 修改区域名称
		 * @param newName - 新的名字
		 * @param id - 框线规则的id
		 */
		scope.modifyAreaName = function (newName, id) {

			for (var i = 0, length = _curAreaList.length; i < length; i++) {
				if (_curAreaList[i].domid === id) {
					//如果该区域已存在，则更新
					_curAreaList[i].text = newName;
					DrawEditor.setTitle(id, newName);
					return;
				}
			}
		};

		/**
		 * 用户删除了某个区域时的执行事件
		 * @param delInfo - 待删除的框线数据信息
		 */
		scope.delAreaToList = function (delInfo) {

			//删除掉list表项
			for (var i = 0, length = _curAreaList.length; i < length; i++) {
				if (_curAreaList[i].domid === delInfo.domid) {
					//如果该区域已存在，则删除
					_curAreaList.splice(i, 1);
					//更新各类型的索引值
					switch (delInfo.type) {
						case "SingleArrowline":
							_curAreaListIndex.singleLine--;
							break;
						case "Doubleline":
							_curAreaListIndex.doubleLine--;
							break;
						case "rect":
							_curAreaListIndex.rect--;
							break;
						case "polyline":
							_curAreaListIndex.polyline--;
							break;
						default:
							break;
					}
					break;
				}
			}
		};

		/**
		 * 每次进入算法参数设置页面时，清空上一次的公共变量值
		 */
		scope.clearAreaListInfo = function () {

			//清空列表
			_curAreaList.length = 0;
			//清空索引
			for (var property in _curAreaListIndex) {
				//对属性值进行判断
				if (_curAreaListIndex.hasOwnProperty(property)) {
					_curAreaListIndex[property] = 0;
				}
			}
		};

		/**
		 * 由于绘图数据和算法参数坐标数据的结构差别太大，为了设置后再次回显，这里将绘图坐标数据格式化存入数据库
		 * @param tag - 标记格式化的情景，为0标示格式化入库，为1标示格式化显示
		 * @param data - 待格式化的数据，tag为1时有效
		 * @returns {*} - 返回格式化的数据
		 */
		scope.formateDrawData = function (tag, data) {

			var dataInfo = null, i = 0;

			if (tag === 0) {
				//格式化存入数据库中
				for (i = 0; i < _curAreaList.length; i++) {
					//暂时不用，强制为空
					_curAreaList[i].box = null;
					_curAreaList[i].node = null;
				}
				dataInfo = JSON.stringify(_curAreaList);
			} else {
				//格式化回显到页面逻辑中
				dataInfo = JSON.parse(data);
			}
			return dataInfo;
		};

		/**
		 * 根据不同类型，格式化区域数据(算法参数用)
		 * @returns {*} - 格式化后的区域数据
		 */
		scope.formateAreaInfo = function () {
			var result = [];
			//遍历框线规则列表，进行数据格式化
			for (var i = 0; i < _curAreaList.length; i++) {

				var tempArea = _curAreaList[i], areaInfo = {}, pointsArr = [];
				//线形：1条（带一个方向：4点，双向：6点）
				if (tempArea.type === "SingleArrowline" || tempArea.type === "DoubleArrowline") {
					areaInfo = FormateData.formateSingleLineData(tempArea, pointsArr);
				}
				//双线（去取一条线的方向）
				else if (tempArea.type === "Doubleline") {
					areaInfo = FormateData.formateDoubleLinesData(tempArea, pointsArr);
				}
				//矩形
				else if (tempArea.type === "rect") {
					areaInfo = FormateData.formateRectData(tempArea, pointsArr);
				}
				//多边形
				else if (tempArea.type === "polyline") {
					areaInfo = FormateData.formatePolyLineData(tempArea, pointsArr);
				}
				result.push(areaInfo);
				//清空，以备后续使用
				pointsArr.length = 0;
			}
			return result;
		};

		return scope;
	}(AreaList || {}, jQuery));

	/**
	 * 区域规则逻辑控制器
	 */
	var Controller = function () {};

	Controller.prototype = {
		/**
		 * 初始化函数
		 */
		init: function(){
			//初始化区域相关页面逻辑
			view.init(this);
		},

		/**
		 * 显示已有的区域,在下拉列表中显示
		 * @param data - 待显示的数据信息
		 */
		showExistAreas: function (data) {

			var domData = AreaList.showExistAreas(data);
			//在界面上显示已存在的区域列表
			view.showExistAreas(domData, AreaList.getCurAreaList());
		},

		/**
		 * 用户划线、框完毕，需要遍历已有区域列表，如果已存在该区域，则更新，否则添加
		 * @param data - 绘图回传的数据
		 */
		addAreaToList: function (data) {

			var title = AreaList.addAreaToList(data);
			//新添加&修改区域规则
			if (title) {
				view.addAreaToList(data, title);
			}
		},

		/**
		 * 用户删除了某个区域时的执行事件
		 * @param delInfo - 待删除的框线数据信息
		 */
		delAreaToList: function (delInfo) {

			//删除掉list表项
			AreaList.delAreaToList(delInfo);
			//删除界面上的区域列表项
			view.delAreaToList(delInfo);
		},

		/**
		 * 每次进入算法参数设置页面时，清空上一次的公共变量值
		 */
		clearAreaListInfo: function () {

			//清除框线区域相关信息
			AreaList.clearAreaListInfo();
			//清空框线规则后，重新渲染界面
			view.refreshOnClearAreaList();
		},
		hasInvalidArea: function() {
			return AreaList.hasInvalidArea();
		},
		//存储当前算法规则设置时所画的区域,每次选则新的算法时清空
		getCurAreaList: AreaList.getCurAreaList,

		//修改区域名称
		modifyAreaName: AreaList.modifyAreaName,

		//根据不同类型，格式化区域数据(算法参数用)
		formateAreaInfo: AreaList.formateAreaInfo,

		//由于绘图数据和算法参数坐标数据的结构差别太大，为了设置后再次回显，这里将绘图坐标数据格式化存入数据库
		formateDrawData: AreaList.formateDrawData
	};

	return new Controller();
});