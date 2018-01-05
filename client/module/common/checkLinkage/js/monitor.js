/**
 * Created by Zhangxinyu on 2016/4/14.
 * description 联动监控画面弹窗入口
 */
define([
	"/module/common/js/player2.js",
	"jquery",
	"base.self",
	"handlebars"
], function(player, jQuery) {

	'use strict';

    var templateUrl = "/module/common/checkLinkage/inc/linkageTemp.html";
	var eventHandler = {
		//联动规则切换处理事件
		clickLi: function() {
			var self = jQuery(this),
				options = self.data("channel");
			self.addClass("active").siblings().removeClass("active");
			playCamera(options);
		}
	};

	(function() {
		var id = location.href.split("=")[1];
		jQuery.ajax({
			url: "/service/alarm_notify/getMonitorData",
			type: "get",
			data: {
				eventId: id,
				type: 8
			},
			success: function(res) {
				if (res.code === 200 && res.data) {
					init(res.data);
				}
			},
			error: function(){
				notify.warn("获取联动摄像机数据失败！");
			}
		});
	})()
	/**
	 * [init 初始化页面]
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	 */
	function init(data) {
		renderTable(data.event);
		renderCameraList(data.monitor, function() {
			bindEvent(".camera-list ul");
			//默认播放第一个联动摄像机的实时视频
			var options = jQuery(".camera-list ul").find("li:eq(0)").data("channel");
			playCamera(options);
		});
	}
	/**
	 * [bindEvent 事件注册]
	 * @param  {[type]} selector [description]
	 * @return {[type]}          [description]
	 */
	function bindEvent(selector) {
		jQuery(selector).find("[data-handler]").map(function() {
			jQuery(this).off(jQuery(this).data("event")).on(jQuery(this).data("event"), eventHandler[jQuery(this).data("handler")]);
		});
	}
		/**
		 * [renderTable 渲染报警摄像机信息]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
	function renderTable(data) {
        addHelper();
		var opts = {
			alarm: data
		};
        jQuery.when(Toolkit.loadTempl(templateUrl)).done(function(source) {
			var template = Handlebars.compile(source);
			var html = template(opts);
			jQuery(".content .footer").html(html);
		});
	}
	/**
	 * [renderCameraList 渲染联动摄像机列表]
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	 */
	function renderCameraList(data, callback) {
        addHelper(); 
        var linkageData = [];
		data.forEach(function(item) {
			if (item.cameraDataJson.length) {
				linkageData.push({
					channel: JSON.stringify({
						ip: item.cameraDataJson[0].ip,
						port: item.cameraDataJson[0].port,
						user: item.cameraDataJson[0].user,
						password: item.cameraDataJson[0].passwd,
						path: item.cameraDataJson[0].path,
						type: 1,
						id: item.camera_id
					}),
					// channel: item.cameraData,
					name: item.cameraName,
					c_type: item.cameraType
				});
			} else {
				notify.warn("获取联动摄像机数据失败！");
			}
		})
        var opts = {
			linkage: true,
			linkageData: linkageData
		};
        jQuery.when(Toolkit.loadTempl(templateUrl)).done(function(source) {
			var template = Handlebars.compile(source);
			var html = template(opts);
			jQuery(".camera-list ul").html(html);
			callback && callback();
		}); 
	}
	/**
	 * [addHelper Handlebars助手]
	 */
	function addHelper() {
		Handlebars.registerHelper("levels", function(level) {
            if(level === 1){
            	return "一般";
            } else if(level === 2){
            	return "重要";
            } else {
            	return "严重";
            }
		});
		Handlebars.registerHelper("name", function(code) {
            if(code === 4){
            	return "区域入侵";
            } else if(code === 256){
            	return "非法停车";
            } else if(code === 2){
            	return "绊线检测";
            } else if(code === 32){
            	return "徘徊检测";
            } else if(code === 128){
            	return "物品丢失";
            } else if(code === 262144){
            	return "出门检测";
            } else if(code === 64){
            	return "物品遗留";
            } else if(code === 65536){
            	return "离岗检测";
            } else if(code === 2048){
            	return "人群聚集";
            } else if(code === 1048576){
            	return "打架检测";
            } else if(code === 4194304){
            	return "拥堵检测";
            } else if(code === 8388608){
            	return "非法尾随检测";
            } else if(code === 1024){
            	return "奔跑检测";
            } else if(code ===134217728){
            	return "人员布控";
            }

		});
		Handlebars.registerHelper("cameraType", function(c_type) {
			if (c_type === "1") {
				return "camera-qiu";
			}
			if(c_type === "0"){
				return "camera-qiang";
			}
		});

		//  毫秒转日期
		Handlebars.registerHelper("mills2str", function(num) {
			return Toolkit.mills2datetime(num);
		});
	}
	
    /**
	 * [playCamera 播放实时视频]
	 * @param  {[type]} options [description]
	 * @return {[type]}         [description]
	 */
	function playCamera(options) {
		var play = new player({
			layout: 1,
			uiocx: 'UIOCX'
		});
		var optStr = JSON.stringify({
			ip: options.ip,
			port: options.port,
			user: options.user,
			passwd: options.password,
			path: options.path,
			type: 1
		});
		play.playStreams(optStr, 0, function(index, result, userParam) {
			//console.log("播放实时视频", index, result, userParam);
		});
	}
})