/**
 * [电视墙布局模版类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	'base.self',
	'handlebars'
], function() {
	function tvwallViews() {}
	tvwallViews.prototype = {
		/**
		 * [baseView description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
		baseView: function() {
			Handlebars.registerHelper('times', function(n, block) {
				var out = '';
				for (var i = 0; i < n; ++i) {
					out += block.fn(n);
				}
				return out;
			});
			Handlebars.registerHelper('universaISSD', function(value, status, block) {
				if (Number(value) === status) {
					return block.fn();
				} else {
					return "";
				}
			});
			Handlebars.registerHelper('isShow', function(block) {
				return block.fn();
			});
			Handlebars.registerHelper('isCd', function(sdcode, options) {
				return "[通道" + sdcode + "]" ;//sdcode === "1" ? "[高]" : "[标]";
			});
			Handlebars.registerHelper('displayName', function(itemObj, block) {
				if (itemObj.type === "1") {
					return block.fn(itemObj.monitorNo);
				} else {
					return block.fn(itemObj.monitorname);
				}
			});
			Handlebars.registerHelper('isShowCode', function(code, block) {
				if (code) {
					return "(" + code + ")";
				}
			});

			Handlebars.registerHelper('wallCss', function(width, height, block) {
				if (Number(width) > 400 && Number(height) > 200) {
					return "1";
				} else {
					return "4";
				}
			});
			
			Handlebars.registerHelper('sw', function(defaultVal) {
				if (defaultVal){
					return '1' 
				} else {
					return '0'
				}
			});
		},
		/**
		 * [editView description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
		editView: function() {
			Handlebars.registerHelper('universaClose', function(type, block) {
				return block.fn();
			});
			Handlebars.registerHelper('pvg', function(type, block) {
				return "";
			});
			Handlebars.registerHelper('havaCloseButton', function(block) {
				return "";
			});
			Handlebars.registerHelper('isShow', function(block) {
				return "";
			});
			Handlebars.registerHelper('displayName', function(itemObj, block) {
				if (itemObj.type === "1") {
					return block.fn(itemObj.monitorNo);
				} else {
					return block.fn(itemObj.monitorname);
				}
			});
			Handlebars.registerHelper('ifOnWall', function(block) {
				return block.inverse();
			});
		},
		/**
		 * [detailView description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
		detailView: function() {
			var self = this;
			Handlebars.registerHelper('universaClose', function(type, block) {
				if (type === "1") {
					return block.fn();
				} else {
					return "";
				}
			});
			Handlebars.registerHelper('pvg', function(type, block) {
				if (type === "1") {
					return block.fn();
				} else {
					return "";
				}
			});
			Handlebars.registerHelper('havaCloseButton', function(block) {
				return block.fn();
			});
			Handlebars.registerHelper('ifOnWall', function(block) {
				if (this.channelStatus === "1") {
					return block.fn(this);
				} else {
					return block.inverse();
				}
			});
		},
		/**
		 * [treeView description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
		treeView: function() {
			var self = this;
			// 节点类型
			Handlebars.registerHelper('equals', function(attr, expect, options) {
				return this[attr] === expect ? options.fn(this) : options.inverse(this);
			});

			Handlebars.registerHelper("offline", function(hd, sd, options) {
				var isonline = false;
				hd.each(function(item, index) {
					if (item.channel_status === 0) {
						isonline = true;
					}
				});
				if (!isonline) {
					sd.each(function(item, index) {
						if (item.channel_status === 0) {
							isonline = true;
						}
					});
				}
				return isonline ? '' : 'offline';
			});

			Handlebars.registerHelper('checked', function(options) {
				return self.checked ? 'checked' : '';
			});

			Handlebars.registerHelper('isActive', function(options) {
				return self.checked ? 'active' : '';
			});


			Handlebars.registerHelper('homeicon', function() {
				return self.isRoot && self.options.type === 'org' ? 'home' : '';
			});

			Handlebars.registerHelper('customize', function(options) {
				return self.options.type === 'customize' ? options.fn(this) : options.inverse(this);
			});
			Handlebars.registerHelper('search', function(options) {
				return !self.options.lookup ? options.fn(this) : options.inverse(this);
			});

			Handlebars.registerHelper('cameratype', function(type, options) { //摄像机类型
				return type ? 'dome' : '';
			});


			Handlebars.registerHelper('state', function(hd, sd, options) { //摄像机状态
				var isonline = false;
				hd.each(function(item, index) {
					if (item.channel_status === 0) {
						isonline = true;
					}
				});
				if (!isonline) {
					sd.each(function(item, index) {
						if (item.channel_status === 0) {
							isonline = true;
						}
					});
				}
				return !isonline ? '' : 'active';
			});
			Handlebars.registerHelper('cstatus', function(hd, sd, options) { //摄像机状态
				var isonline = false;
				hd.each(function(item, index) {
					if (item.channel_status === 0) {
						isonline = true;
					}
				});
				if (!isonline) {
					sd.each(function(item, index) {
						if (item.channel_status === 0) {
							isonline = true;
						}
					});
				}
				return isonline ? 0 : 1;
			});
			Handlebars.registerHelper('translate', function(channel, options) { //将通道对象数组转化为json字符串，以备后期使用
				return channel ? JSON.stringify(channel) : '';
			});
			Handlebars.registerHelper('isHD', function(HDchannel, options) {
				return HDchannel.length > 0 ? '[高] ' : '';
				// return HDchannel.length > 0 ? 'isHD' : '';
			});
			Handlebars.registerHelper('hasHD', function(HDchannel, options) {
				return HDchannel.length > 0 ? 'hasHD' : 'hasSD';
			});
			Handlebars.registerHelper("cameraCodeShow", function(data, options) {
				if (data === "null" || data === "" || data === null || data === 'undefined') {
					return "";
				} else {
					return "(" + data + ")";
				}
			});
			Handlebars.registerHelper('isSD', function(HDchannel, options) {
				return HDchannel.length > 0 ? '' : 'isSD';
			});
			Handlebars.registerHelper('nodata', function(options) {
				var ctype = jQuery('#camerasType').attr('data-type');
				if (ctype === 'system' || ctype === 'customize') {
					return '暂无分组！';
				} else {
					return '暂无摄像机！';
				}

			});
		}
	};
	return new tvwallViews();
});