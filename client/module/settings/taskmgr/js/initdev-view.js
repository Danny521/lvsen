/**
 * [电视墙设置页面左侧树展现视图类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	'/module/common/tvwall/js/views/templteGet.js',
	'base.self'
], function() {
	function initDevView() {}
	initDevView.prototype.options = {
		containObj: jQuery(".deviceMenu")
	};
	/**
	 * [initialize description]
	 * @type {[type]}
	 */
	initDevView.prototype.initialize = function(options) {
		this.setOptions(options);
	};
	/**
	 * [loadDevtemp 根据获取到的设备信息渲染左侧设备信息模板]
	 * @type {[type]}
	 */
	initDevView.prototype.loadDevtemp = function(data) {
		var dt= {"code":200,"data":{"universals":null,"pvgs":[{"orgId":1,"orgName":"市局","pvgId":"1","ip":"192.168.60.136","monmonitorId":null,"monitorName":null,"type":"0"},{"orgId":2,"orgName":"2局","pvgId":"2","ip":"192.168.60.137","monmonitorId":null,"monitorName":null,"type":"0"},{"orgId":3,"orgName":"3局","pvgId":"3","ip":"192.168.60.138","monmonitorId":null,"monitorName":null,"type":"0"}]}};
		jQuery(data.mdecoders).each(function(i,e){
			e.index = i;
		});		
		var self = this;
		if (template) {			
			self.options.containObj.html(template({
				"treeinfo": data
				//"info": dt.data
			}));
		}
	};
	/**
	 * [loadWjChildTemp 渲染卍解下根节点的子设备信息]
	 * @type {[type]}
	 * self：当前点击节点
	 * data：当前点击节点的子节点数据(后台获取)
	 */
	initDevView.prototype.loadWjChildTemp = function(self, data) {
		var that = this;		
		if (template) {
			self.after(template({
				"sjdst": data
			}));
		}
	};
	/**
	 * [loadChildTemp 渲染pvg下根节点的子设备]
	 * @type {[type]}
	 * self：当前点击节点
	 * data：当前点击节点的子节点数据(后台获取)
	 */
	initDevView.prototype.loadChildTemp = function(self, data) {		
		var that = this;
		if (template) {
			self.after(template({
				"dstep": data
			}));
		}
	};
	return initDevView;
});