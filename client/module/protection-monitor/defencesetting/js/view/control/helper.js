define([
	"handlebars"
], function() {
	/**
	 * 定义模板渲染助手
	 */
	return function () {
		//过滤时间
		Handlebars.registerHelper("TimeFilter", function(value) {
			return Toolkit.mills2str(value);
		});
		//将通道对象数组转化为json字符串，以备后期使用
		Handlebars.registerHelper("cameraStatusAndTypeByChannels", function(hd, sd, type, options) {
			var status = 1,
				isonline = false;
				
			hd.each(function(item, index) {
				if (item.channel_status === 0) {
					status = 0;
					isonline = true;
				}
			});
			if (!isonline) {
				sd.each(function(item, index) {
					if (item.channel_status === 0) {
						status = 0;
					}
				});
			}
			if (type) {
				if (status === 0) {

					if(hd.length>0){
						return "camera-ball-hd-online";
					}else{

						return "camera-ball-online";
					}
				}
				if (status === 1) {

					if(hd.length>0){
						return "camera-ball-hd-offline";
					}else{

						return "camera-ball-offline";
					}

				}
			} else {
				if (status === 0) {
					if(hd.length>0){
						return "camera-gun-hd-online";
					}else{
						return "camera-gun-online";
					}
				}
				if (status === 1) {
					if(hd.length>0){
						return "camera-gun-hd-offline";

					}else{

						return "camera-gun-offline";
					}
				}
			}
		});
		Handlebars.registerHelper("Checked", function(flag) {
			if (flag === "true") {
				return "checked";
			}
			return "";
		});
		Handlebars.registerHelper('translate', function(channel, options) { //将通道对象数组转化为json字符串，以备后期使用
			return channel ? JSON.stringify(channel) : '';
		});
		//撤控,恢复权限(status===2时恢复)
		Handlebars.registerHelper("hasPermisson",function(status){
			if (status === 2 && permission.klass["restore-surveillance-task"]) {
				return "permission-restore-surveillance-task";
			}else if (status !== 2 && permission.klass["cancel-surveillance-task"]) {
				return "permission-cancel-surveillance-task";
			}
		});
		//布控任务列表的助手
		Handlebars.registerHelper('FilterControlList', function(value, type, dataType, options) { //将通道对象数组转化为json字符串，以备后期使用
			if (dataType === "status") {
				//撤控/恢复
				if (type === "text") {
					return (value === 2) ? "恢复" : '撤控';
				} else if (type === "display") {
					//已过期和未开始的任务不需要撤控功能
					if (value !== 1 && value !== -1) {
						return options.fn(this);
					}
				}
			} else if (dataType === "selectCtrl") {
				if (parseInt(value) === type) {
					return "selected";
				}
			}
		});
		//编辑&查看布控任务时的助手
		Handlebars.registerHelper('FilterControlDetails', function(value, type, dataType, options) {
			if (dataType === "time") {
				return Toolkit.mills2str(value);
			} else if (dataType === "level") {
				if (value) {
					if (type === "text") {
						return (value === 1) ? "一般" : (value === 2) ? "重要" : "严重";
					} else {
						return value;
					}
				} else {
					if (type === "text") {
						return "一般";
					} else {
						return 1;
					}
				}
			}
		});
		Handlebars.registerHelper("cameraInstallType", function(num) {
			if (num === 1) {
				return "室内";
			}
			if (num === 2) {
				return "制高点";
			}
			if (num === 3) {
				return "高架";
			}
			if (num === 4) {
				return "水面";
			}
			if (num === 5) {
				return "路面";
			}
			if (num === 6) {
				return "其他";
			}
			return "";
		});
		Handlebars.registerHelper("isOnline", function(num, options) {
			if (num === 0 || num === null) {
				return options.fn({
					'data': true
				});;
			} else {
				return options.fn({
					'data': false
				});;
			}
		});
		//获取摄像机类型和状态
		Handlebars.registerHelper("cameraStatusAndType", function(type, isonline) {
			if (type) {
				if (isonline === 0 || isonline === null) {
					return "camera-ball-online";
				}
				if (status === 1) {
					return "camera-ball-offline";
				}
			} else {
				if (isonline === 0 || isonline === null) {
					return "camera-gun-online";
				}
				if (status === 1) {
					return "camera-gun-offline";
				}
			}
			return "camera-gun-offline";
		});
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
	};
});