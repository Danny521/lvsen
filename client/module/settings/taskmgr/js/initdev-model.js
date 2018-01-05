/**
 * [电视墙设置页面左侧树展现模型数据获取类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	'ajaxModel',
	'/module/settings/taskmgr/js/initdev-view.js',
	'base.self'
], function(ajaxModel, initDevView) {
	function initDevModel() {}
	initDevModel.prototype = new initDevView();
	/**
	 * [urls description]
	 * @type {Object}
	 */
	initDevModel.prototype.urls = {
		//POWTREE: "/service/pow/show_tree",
		POWTREE: "/service/server/mdecoders",
		UOWTREE: "/service/uow/show_tree",
		SHOWMONITORS: "/service/pow/show_monitors"
	};
	/**
	 * [initialize description]
	 * @type {[type]}
	 */
	initDevModel.prototype.initialize = function(devices, options) {
		// this.parent(options);
		this.setOptions(options);
	};
	/**
	 * [loadDevices 获取pvg与卍解树]
	 * @type {[type]}
	 */
	initDevModel.prototype.loadDevices = function() {
		var self = this;
		ajaxModel.getData(self.urls.POWTREE + "?timestamp=" + new Date().getTime(), null, {
			cache: false
		}).then(function(res) {
			var rescode = res;
			if (rescode.code === 200) {
				jQuery("#camerasPanel").removeClass("loading");
				//根据得到数据渲染设备信息模板
				self.loadDevtemp(rescode.data);
				self.options.rescildren = res;
				self.options.rescildrenArr.push(res);
			} else {
				notify.error("获取设备数据失败！");
			}
		});
	};
	/**
	 * [loadWjDevices 获取卍解下设备信息]
	 * @type {[type]}
	 */
	initDevModel.prototype.loadWjDevices = function() {
		var self = this;
		ajaxModel.getData(self.urls.UOWTREE + "?timestamp=" + new Date().getTime(), null, {
			cache: false
		}).then(function(res) {
			var rescode = res;
			if (rescode.code === 200) {
				//根据得到数据渲染设备信息模板
				self.loadDevtemp(rescode.data);
			} else {
				notify.error("获取设备数据失败！");
			}
		});
	};
	/**
	 * [loadChildDev 获取pvg下或者卍解下设备信息]
	 * @type {[type]}
	 */
	// initDevModel.prototype.loadChildDev = function(node, self, funevent) {
		
	// 	var that = this;
	// 	node.attr("data-num", that.options.num);
	// 	that.options.num++;
	// 	if (node.attr("data-pvgid")) {//pvg设备
	// 		var pvgId = node.attr("data-pvgid").trim();
	// 		//获取pvg下设备信息
	// 		ajaxModel.getData("/service/pow/show_monitors?pvgId=" + pvgId, null, {
	// 			cache: false,
	// 			complete: function() {
	// 				funevent();
	// 				if (that.options.rescildren && that.options.rescildren.data.length === 0) {
	// 					node.find("ul").append("<div class='loading'>暂无数据！</div>");
	// 					return;
	// 				}
	// 				//????
	// 				that.draggMove(node);
	// 			}
	// 		}).then(function(res) {				
	// 			that.options.rescildren = res;
	// 			that.options.rescildrenArr.push(res);
	// 			console.log(res)
	// 			if (that.options.rescildren.code === 200) {
	// 				//渲染子节点数据
	// 				that.loadChildTemp(self, that.options.rescildren);
	// 				//设置子节点数据样式
	// 				that.initDevActive();
	// 			} else {
	// 				notify.error("获取数据失败！");
	// 			}
	// 		});
	// 	} else {//卍解设备
	// 		var wjId = node.attr("data-wjid").trim();
	// 		node.attr("data-num", that.options.num1);
	// 		that.options.num1++;
	// 		//获取卍解下设备信息
	// 		ajaxModel.getData("/service/uow/show_tree?universaId=" + wjId, null, {
	// 			cache: false,
	// 			complete: function() {
	// 				funevent();
	// 				if (that.options.reswjcildren && that.options.reswjcildren.data.length === 0) {
	// 					node.find("ul").append("<div class='loading'>暂无数据！</div>");
	// 					return;
	// 				}
	// 				that.draggMove(node);
	// 			}
	// 		}).then(function(res) {				
	// 			that.options.reswjcildren = res;
	// 			that.options.reswjcildrenArr.push(res);
	// 			if (that.options.reswjcildren.code === 200) {
	// 				//渲染子节点数据
	// 				that.loadWjChildTemp(self, that.options.reswjcildren);
	// 				//设置样式(如果当前渲染详细布局中已经存在子设备中某一些设备时，要将其样式发生变化)
	// 				that.initDevActive();
	// 			} else {
	// 				notify.error("获取数据失败！");
	// 			}
	// 		});
	// 	}
	// };
	
	
	
	/**
	 * [loadChildDev 新版获取卍解下设备信息]
	 * @type {[type]}
	 */
	initDevModel.prototype.loadChildDev = function (node, self, funevent) {
		var that = this,			
			dataArr = [];

		for (var i = 0; i < node.attr('data-num'); i++) {
			var res = {
				ip:node.attr('data-ip'),
				monitorId: i,
				name: i,
				serverId:node.attr('data-id'),
				serverName:node.attr('data-name')
			}
			dataArr.push(res)
		};
		
		var dataobj = {data:dataArr};
		//that.options.rescildren = {'data':dataArr};
		//that.options.rescildrenArr.push([{'data':dataArr}]);		
		//渲染子节点数据
		that.loadChildTemp(self,dataobj);
		//设置子节点数据样式
		that.initDevActive();
		that.draggMove(node);
	}
	
	return initDevModel;
});