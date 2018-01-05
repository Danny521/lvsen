/**
 * 勾选左侧摄像机树
 * @author chengyao
 * @date   2014-12-08
 */
define([
	'base.self',
	'handlebars'
], function() {
	var CamerasLoader = new new Class({

		Implements: [Events, Options],

		options: {
			id: '',

			// 分组类型 org|system|customize
			type: 'org',

			// 加载地址
			url: "/service/video_access_copy/list_cameras",

			// 模板路径
			template: '/module/protection-monitor/preventioncontrolmgr/inc/tree.template_bk.html',

			// 操作按钮模板
			operatorTemplate: '/module/protection-monitor/preventioncontrolmgr/inc/operator.template.html',

			// 菜单容器
			container: jQuery(".people-control-checkbox-tree"),

			// 回调
			callback: jQuery.noop,

			// 是否切换回树形菜单面板
			activate: true,
			lookup: false
		},
		initialize: function(options) {
			var self = this;
			this.setOptions(options);
			/*self.cameraCache = new Hash();*/
			var camera = jQuery('.menus .camera'),
				navtab = jQuery(".patrol[data-tab='patrol']");

			// 节点类型
			Handlebars.registerHelper('equals', function(attr, expect, options) {
				return this[attr] === expect ? options.fn(this) : options.inverse(this);
			});

			Handlebars.registerHelper('enable', function(expect, options) {
				var bool1 = expect ? !camera.is(".active") : camera.is(".active"),
					bool2 = expect ? navtab.is(".active") : false,
					bool = (bool1 || bool2);
				return bool ? options.fn(this) : options.inverse(this);
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

			Handlebars.registerHelper('cameratype', function(type, options) { //摄像机类型1球机0枪击
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
			Handlebars.registerHelper('checktree', function(options) { //有复选框时添加额外类名checktree
				var bool = !camera.is(".active");
				return bool ? 'checktree' : '';
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

			Handlebars.registerHelper("cameraCodeShow", function(data, options) {
				var data = data + "";
				if (data === "null" || data === "" || data === null || data === 'undefined') {
					return "";
				} else if (data.indexOf("(") > -1) {
					return data;
				} else {
					return "(" + data + ")";
				}
			});

			this.bindEvents(options);
		},

		loadCameras: function(params, isFirst) {
			var options = Object.merge({}, this.options, params);
			// 当前请求是否为根节点
			this.isRoot = !options.id;
			this.options.type = options.type;
			this.options.container = options.container;

			// 是否切换回树形菜单面板
			this.activate = typeof params.activate === 'undefined' ? this.activate : params.activate;

			// 如果是根节点 清空容器
			if (this.isRoot) {
				options.container.empty();
			}

			// 保持单例模式
			if (this.ajaxRequest) {
				this.ajaxRequest.abort();
			}
			// 开始发送请求
			var self = this,
				rootTreeData = JSON.parse(window.localStorage.getItem('root-tree')),
				firstTreeData = JSON.parse(window.localStorage.getItem('first-tree'));


			function localStorage(treeData) {
				var textMap = {
					org: '视频资源',
					system: '系统分组',
					customize: '我的分组'
				};
				if (self.isRoot) {
					jQuery('#camerasPanel').addClass('loading');
				}
				jQuery('#camerasType').html(textMap[options.type]);
				jQuery('#camerasType').attr("data-type", options.type);

				// 默认激活447树形菜单面板
				if (self.activate) {
					jQuery('.menus .camera').tab('activate');
				}

				self.login(treeData.cameras);
				self.renderTree(treeData, options);
				jQuery('#camerasPanel').removeClass('loading');
			};
			if (isFirst && this.options.type === 'org') {

				if (this.isRoot && rootTreeData) {
					localStorage(rootTreeData);
				} else if (options.id == rootTreeData.cameras[0].id && firstTreeData) {
					localStorage(firstTreeData);
				}
				return;
			}
			this.ajaxRequest = jQuery.ajax({
				url: options.url,
				data: {
					isRoot:1,//后端李丹让添加，以便显示所有组织结构  by wangxiaojun
					id: options.id,
					type: options.type
				},
				cache: false,
				beforeSend: function() {
					var textMap = {
						org: '视频资源',
						system: '系统分组',
						customize: '我的分组'
					};
					if (self.isRoot) {
						jQuery('#camerasPanel').addClass('loading');
					}
					jQuery('#camerasType').html(textMap[options.type]);
					jQuery('#camerasType').attr("data-type", options.type);

					// 默认激活447树形菜单面板
					if (self.activate) {
						jQuery('.menus .camera').tab('activate');
					}
				},
				success: function(res) {
					if (res.code === 200) {
						self.renderTree(res.data, options);
					} else {
						notify.error("获取数据失败！");
					}
				},
				complete: function() {
					jQuery('#camerasPanel').removeClass('loading');
				}
			});
		},
		//将多组摄像机一起登录  其实此处可以更简单一点，在获取到每一组参数时就直接登录，不用专门再组合成一个数据块
		login: function(arr) {
			var self = this;
			if (typeOf(arr) === 'array' && arr.length) {
				var cameras = arr.slice(0);
				var i = cameras.length;
				var tem;
				var result = [];
				while (i--) {
					if (cameras[i].hd_channel && cameras[i].sd_channel) {
						var hd_channel = self.getLoginInfo(cameras[i].hd_channel);
						var sd_channel = self.getLoginInfo(cameras[i].sd_channel)
						result = result.concat(hd_channel.concat(sd_channel));
					}
				}
				if (result.length) {
					//gVideoPlayer.preLogin(result);
				}
			}
		},
		//从后端返回的数据中提取出登录信息  channel:传入hd_channel或者sd_channel数组
		getLoginInfo: function(channel) {
			if (typeOf(channel) === 'array' && channel.length) {
				var i = channel.length;
				var result = [];
				while (i--) {
					var tem = {
						"user": channel[i].username,
						"passwd": channel[i].password,
						"ip": channel[i].ip,
						"port": channel[i].port
					};
					result.push(tem);
				}
				return result;
			}
			return new Array();
		},
		renderTree: function(data, options) {

			var self = this;
			jQuery.when(this.loadTemplate(options.template)).done(function(source) {
				var fragment = jQuery(Handlebars.compile(source)(data)),
					container = options.id ? jQuery(options.container).find('.node[data-id="{0}"]'.format(options.id)) : jQuery(options.container);
				container.children('.loading').remove();
				container.append(fragment);
				// 若是根节点且只有唯一分组 自动展开
				if (self.isRoot) {
					var firstGroup = jQuery(container).find('.node:first');
					if (firstGroup.siblings('.loading, .node').length === 0) {
						firstGroup.find(".group:first").trigger('click');
					}
				}
			});
		},
		renderOperator: function(node, params) {
			var options = Object.merge({}, this.options, params);
			this.options.lookup = options.lookup;
			jQuery.when(this.loadTemplate(this.options.operatorTemplate)).done(function(source) {
				var fragment = Handlebars.compile(source)({
					operator: true
				});
				node.append(fragment);
			});
		},

		loadTemplate: function(url) {
			return Toolkit.loadTempl(url);
		},
		toggleGroup: function(options) {
			var node = options.node.toggleClass('active');
			// 保持单一展开 并且移除前次loading，保证单例Ajax能够正常请求
			node.siblings().removeClass('active').children(".loading").remove();
			/*粗略计算滚动条需要向上滚动的距离，使得当前展开的节点出现在可视区内*/
			var height = parseInt(node.css('height')),
				siblings = node.prevAll().length,
				parent = node.parent(), //父元素
				parentSiblings = parent.prevAll().length, //父元素之前的节点个数
				grandSiblings = parent.parent().prevAll().length, //祖父元素之前的节点个数
				ggSiblings = parent.parent().parent().prevAll().length, //曾祖父节点个数
				top = (siblings + parentSiblings + grandSiblings + ggSiblings) * height;
			/*滚动条滚动距离计算结束*/
			if (node.children('.loading, h2, .tree').length === 0) {
				node.append("<div class='loading'></div>"); //载入中...
				this.loadCameras({
					id: node.data('id'),
					callback: function() {
						//勾选通道播放的摄像机
						var arr = gVideoPlayer.cameraData,
							nodes = jQuery(".node[data-type=camera]"),
							groups = LoopInspect.groups;
						for (var i = 0, len = arr.length; i < len; i++) {
							var leaf = nodes.filter("[data-id=" + arr[i].cId + "]");
							if (leaf.find(".checkbox").length === 0) { //编辑时不做处理
								leaf.find(".camera").addClass("selected");
							}
						}
					}
				});
			}
		},
		bindEvents: function() {
			var self = this;

			jQuery(document).on('click', '.treeMenu .node .group', function() {
				var node = jQuery(this).closest('.node');
				self.checked = node.children(".group").children(".checkbox").is(".checked");
				self.toggleGroup({
					node: node
				});
			});
		}
	});
	return {
		CamerasLoader: CamerasLoader
	}
});