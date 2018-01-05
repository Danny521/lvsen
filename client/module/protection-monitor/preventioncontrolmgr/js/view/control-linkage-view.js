/**
 * 布控任务 联动选择view模块
 */
define([
	// control层
	"js/controller/control-linkage-control", 
	// model层
	"js/model/control-linkage-model",
	// 时间插件
	/*'/module/common/defencesetting/js/controller/defence-setting-time-ctrl.js',*/
], function(linkageControl, linkageModel/*, timeTemplate*/) {
	function LinkageView() {
		// 联动选择模板列表
		this.templateList = {};
		// 联动选择对话框对象
		this.dialogObj = null;
	}

	LinkageView.prototype = {
		constructor: LinkageView,
		/**
		 * [init 初始化函数]
		 * @return {[type]} [description]
		 */
		init: function() {
			// 绑定“联动选择”按钮事件
			this.bindEvent();
			// 注册handlebar助手
			this.registerHelper();
		},
		/**
		 * [bindEvent 绑定“联动选择”按钮事件]
		 * @return {[type]} [description]
		 */
		bindEvent: function() {
			var self = this;
			jQuery(document)
			.on("click", ".linkage-check:not(.disabled)", function() {
				jQuery(this).addClass("disabled");
				// 初始化联动选择面板
				self.initLinkagePanel(jQuery(this));
				return false;
			});
		},
		/**
		 * [getTemplate 根据模板名称获取模板]
		 * @param  {[type]}   name     [模板名称]
		 * @param  {Function} callback [获取成功后的回调函数]
		 * @return {[type]}            [description]
		 */
		getTemplate: function(name, callback) {
			var self = this;
			// 如果模板已经加载，则从内存中返回模板对象
			if (self.templateList[name]) {
				return callback(self.templateList[name]);
			}
			// 否则，获取模板
			linkageModel.getTml(name)
			.then(function(temp) {
				// 获取成功后，写入内存中，已供下次使用
				self.templateList[name] = Handlebars.compile(temp);
				callback(self.templateList[name]);
			});
		},
		/**
		 * [initLinkagePanel 初始化联动选择模板]
		 * @param  {[type]} $node [“联动选择”按钮的jQuery对象]
		 * @return {[type]}       [description]
		 */
		initLinkagePanel: function($node) {
			var self = this,
				timeArea = linkageControl.timeArea,
				// 渲染模板之前，先组装数据
				params = {
					startTime: timeArea.startHour + ":" + timeArea.startMinute,
					endTime: timeArea.endHour + ":" + timeArea.endMinute
				};
			// 缓存的电话号码列表
			linkageControl.phoneList.length && (params.telephones = linkageControl.phoneList);
			// 缓存的邮箱列表
			linkageControl.emailList.length && (params.emails = linkageControl.emailList);
			// 缓存的是否推送消息提醒
			linkageControl.sendMessage && (params.sendMessage = true);

			self.getTemplate("linkagePanelTemp", function(temp) {
				self.dialogObj = new CommonDialog({
					title: "联动选择",
					message: temp(params),
					width: "570px",
					classes: "linkage-panel",
					prehide: function() {
						linkageControl.setSmsTime();
					}
				});
				// 按钮取消禁用
				$node.removeClass('disabled');
				// 绑定面板事件
				self.bindPanelEvent();
			});
		},
		/**
		 * [bindPanelEvent 绑定面板上的事件]
		 * @return {[type]} [description]
		 */
		bindPanelEvent: function() {
			var self = this;
			jQuery(".linkage-panel").off()
			// 切换导航
			.on("click", "#linkageNav .item", function() {
				self.changeContent(jQuery(this));
				return false;
			})
			// 点击增加
			.on("click", ".add-btn", function() {
				var $btn = jQuery(this),
					type = $btn.attr("data-type"),
					value = jQuery.trim($btn.siblings(".add-input").val());
				if (!value) {
					return false;
				}
				
				self.addContent(type, value);
			})
			// 输入框回车
			.on("keyup", ".add-input", function(e) {
				if (e.keyCode === 13) {
					jQuery(this).siblings(".add-btn").trigger("click");
				}
			})
			// 点击删除
			.on("click", ".delete", function() {
				self.removeElement(jQuery(this));
			})
			// 短信通知 选择通知时间
			.on("click", ".time-type", function() {
				self.changeSmsTimeType(jQuery(this));
			})
			// 消息通知，复选框点击事件
			.on("click", ".message-content .checkbox", function() {
				self.messageCheck(jQuery(this));
			})
			// 以下为初始化短信通知的时间选择插件
			var $timeGroup = jQuery(".telephone-content").find(".time-group");
			$timeGroup.TimeSelect({
				parentBorder: {
					"borderColor": "#ddd"
				},
				controlsBorder: {
					"borderColor": "#ddd"
				}
			});

			var timeObj = linkageControl.timeArea,
				timeValue = [],
				holeDay = true;
			if (timeObj.startHour === "00" && timeObj.startMinute === "00" && timeObj.endHour === "24" && timeObj.endMinute === "00") {
				timeValue = ["08", "00", "23", "59"];
			} else {
				timeValue = [timeObj.startHour, timeObj.startMinute, timeObj.endHour, timeObj.endMinute];
				holeDay = false;
			}
			// 如果时间范围为全天，那么时间段选项，暂时禁用
			holeDay && $timeGroup.find(".ctrl").addClass('disabled');
			$timeGroup.find("input").each(function(index) {
				holeDay && jQuery(this).prop("disabled", true);
				jQuery(this).val(timeValue[index]);
			})
		},
		/**
		 * [changeContent 切换联动选项内容区域]
		 * @param  {[type]} $li [当前导航]
		 * @return {[type]}     [description]
		 */
		changeContent: function($li) {
			if ($li.hasClass('active')) {
				return false;
			}

			var tab = $li.attr("data-tab");
			$li.addClass('active').siblings('.item').removeClass('active');
			jQuery("#linkageChooseContent").find("." + tab + "-content").show().siblings('.content').hide();
		},
		/**
		 * [addContent 添加手机号码或者邮箱]
		 * @param {[type]} type  [手机号、邮箱]
		 * @param {[type]} value [值]
		 */
		addContent: function(type, value) {
			var valid = linkageControl.checkValid(type, value),
				repeat = linkageControl.checkRepeat(type, value),
				$tips = jQuery("#linkageChooseContent").find("." + type + "-tips"),
				invalidMsg = {
					telephone: "手机号码格式有误！",
					email: "邮箱格式有误！"
				},
				repeatMsg = {
					telephone: "此号码已添加！",
					email: "此邮箱已添加！"
				},
				overflowMsg = {
					telephone: "最多可添加20个手机号码！",
					email: "最多可添加20个邮箱！"
				},
				typeMap = {
					telephone: "phoneList",
					email: "emailList"
				};

			$tips.text("").hide();
			// 如果超出了20个。则提示超出信息
			if (linkageControl[typeMap[type]].length === 20) {
				$tips.text(overflowMsg[type]).show();
				return;	
			}
			// 如果格式不合法，则提示非法信息
			if (!valid) {
				$tips.text(invalidMsg[type]).show();
				return;
			}
 			// 如果已经添加了，则提示重复信息
			if (repeat) {
				$tips.text(repeatMsg[type]).show();
				return;
			}
			// 一切正常后，添加到结果集中
			var $content = jQuery("#linkageChooseContent").find("." + type + "-content").find(".add-result"),
				resultList = $content.find(".result-list");
			// 渲染页面
			$content.find(".no-result").hide();
			if (resultList.length) {
				resultList.append("<li><span class='element-name' title='" + value + "'>" + value + "</span><i class='delete' data-type='" + type + "' data-value='" + value + "'></i></li>");
			} else {
				$content.append("<ul class='result-list clearfix'><li><span class='element-name' title='" + value + "'>" + value + "</span><i class='delete' data-type='" + type + "' data-value='" + value + "'></i></li></ul>")
			}
			// 收集数据
			linkageControl[typeMap[type]].push(value);
			// 清楚输入框，并让输入框获取焦点，以便继续输入
			jQuery("#linkageChooseContent").find("." + type + "-content").find(".add-input").val("").focus();
		},
		/**
		 * [removeElement 删除收集的手机号或者邮箱]
		 * @param  {[type]} $node [删除按钮的jQuery对象]
		 * @return {[type]}       [description]
		 */
		removeElement: function($node) {
			var type = $node.attr("data-type"),
				value = $node.attr("data-value"),
				$content = $content = jQuery("#linkageChooseContent").find("." + type + "-content").find(".add-result");
			// linkageControl.removeElement control层移除数据
			var counts = linkageControl.removeElement(type, value);
			$node.closest('li').remove();
			// 删除之后，如果数据没有了，则显示无数据的提示
			if (counts === 0) {
				$content.find(".no-result").show();
			}
		},
		/**
		 * [changeSmsTimeType 短信通知，改变时间类型]
		 * @param  {[type]} $node [按钮的jQuery对象]
		 * @return {[type]}       [description]
		 */
		changeSmsTimeType: function($node) {
			$node.find("i").addClass('active')
			.end().siblings('.time-type').find("i").removeClass('active');

			var $timeGroup = jQuery(".telephone-content").find(".time-group");
			// 如果是时间段，则取消相应的输入框和按钮禁用，否则，添加禁用
			if ($node.hasClass("time-area")) {
				$timeGroup.find(".ctrl").removeClass('disabled');
				$timeGroup.find("input").removeAttr('disabled');
			} else {
				$timeGroup.find(".ctrl").addClass('disabled');
				$timeGroup.find("input").attr("disabled", true);
			}
		},
		/**
		 * [messageCheck 消息通知点击的展示]
		 * @param  {[type]} $node [description]
		 * @return {[type]}       [description]
		 */
		messageCheck: function($node) {
			$node.toggleClass('active');
			linkageControl.sendMessage = $node.hasClass('active') ? true : false;
		},
		/**
		 * [registerHelper 注册handlebar助手]
		 * @return {[type]} [description]
		 */
		registerHelper: function() {
			// 根据短信通知的时间值，判断时间类型的选中状态
			Handlebars.registerHelper("smsTimeType", function(startTime, endTime, type) {
				if (startTime === "00:00" && endTime === "24:00" && type === 1) {
					return "active";
				}

				if ((startTime !== "00:00" || endTime !== "24:00") && type === 2) {
					return "active";
				}

				return "";
			});
		}
	};

	return new LinkageView();
})