/**
 * Created by Zhangyu on 2014/12/3.
 * 公共函数，工具类
 */
define(['base.self'], function() {

	return CommonFun = {

		/**
		 * 根据规则id获取规则名称
		 * @param ruleid 规则id
		 */
		getRuleName: function (ruleid) {
			switch (ruleid) {
				case 4096:
					return "人数统计";
				case 2:
					return "绊线检测";
				case 262144:
					return "出门检测";
				case 4:
					return "区域入侵";
				case 256:
					return "非法停车";
				case 32:
					return "徘徊检测";
				case 64:
					return "物品遗留";
				case 128:
					return "物品丢失";
				case 2048:
					return "人群聚集";
				case 65536:
					return "离岗检测";
				case 1048576:
					return "打架检测";
				case 4194304:
					return "拥堵检测";
				case 8388608:
					return "可疑尾随检测";
				case 1024:
					return "奔跑检测";
				case 131072:
					return "车流统计";
				case 16777216:
					return "烟火检测";
				case 8192:
					return "车牌识别";
				case 524288:
					return "人脸检测";
				case 33554432:
					return "手动报警";
				case 134217728:
					return "人员布控";
			}
		},

		/**
		 * 加载模板通用函数
		 * @param url - 模板地址url
		 * @param callbackSuccess - 模板加载成功后的执行函数
		 * @param callbackError - 模板加载失败后的执行函数
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
				//成功的回调函数
				if (callbackSuccess && typeof callbackSuccess === "function") {
					callbackSuccess(compiler);
				}
			}).fail(function () {
				//错误的函数
				if (callbackError && typeof callbackError === "function") {
					callbackError();
				}
			});
		},

		/**
		 * 对报警信息列表部分的弹出框进行最大限制
		 * @author chengyao
		 * @date   2014-10-28
		 * @param  {[img对象]}   imgObj
		 * @param  {[百分比]}   width  [宽度的缩放比例]
		 * @param  {[百分比]}   height [高度的缩放比例]
		 */
		maxImgLimit: function (imgObj, width, height) {
			var desWidth = imgObj ? 0 : imgObj.width(), desHeight = imgObj ? 0 : imgObj.height(), maxHeight = document.documentElement.clientHeight * height, maxWidth = document.documentElement.clientWidth * width;
			if (desWidth >= maxWidth || desWidth === 0) {
				desWidth = maxWidth;
			}
			if (desHeight >= maxHeight || desHeight === 0) {
				desHeight = maxHeight;
			}
			return {
				width: desWidth,
				height: desHeight
			};
		},

		/**
		 * 添加报警管理日志
		 * @param type - 日志所在的逻辑类型
		 * @param data - 日志记载中需要的数据对象（json）
		 */
		insertLog: function (type, data) {
			switch (type) {
				case "fast-deal"://快速处理报警
					logDict.insertMedialog("m9", "批量处理" + ((data.status === 3) ? "布控" : "") + "报警信息为" + ((data.status === 1) ? "有效" : (data.status === 2) ? "无效" : "未知"), "f10");
					break;
				case "real-video"://实时视频查看
					logDict.insertMedialog("m9", "查看" + data.name + "摄像机的实时视频", "f10", "o4", data.name);
					break;
				case "alarm-deal"://地图上处理报警信息
					if (data.isDefence) {
						//布防
						logDict.insertMedialog("m9", "地图上处理" + data.name + "报警信息为" + ((data.status === "1") ? "有效" : "无效"), "f10");
					} else {
						//布控
						logDict.insertMedialog("m9", "地图上处理" + data.name + "布控任务报警信息为" + data.status, "f10");
					}
					break;
				case "history-view"://历史录像查询
					if (data.alarmtype === "1") {
						//布防报警
						logDict.insertMedialog("m9", "查看" + data.rulename + "报警的历史录像", "f10", "o4");
					} else {
						//布控报警
						logDict.insertMedialog("m9", "查看" + data.taskname + "布控任务的历史录像", "f10", "o4");
					}
					break;
			}
		}

	};
});