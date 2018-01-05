define([
	'/module/protection-monitor/defencesetting/js/controller/control/preventcontrol-global-var.js',
	'base.self',
	'handlebars'], function(globalVar) {
	/**
	 * 公共函数，工具类
	 */
	var ProtectCommonFun = new new Class({
		Implements: [Events, Options],
		//当前屏蔽的算法事件
		notOpenRule: ["手动报警", "人员布控"], //"离岗检测", "出门检测", "打架检测", "拥堵检测", "非法尾随", "奔跑检测", "车牌识别", "人脸检测", "烟火检测"],
		//下拉列表浮动层鼠标移入标记
		isMouseOverPubDiv: false,
		/**
		 * 初始化函数
		 * @param options
		 */
		initialize: function(options) {
			var me = this;
			me.setOptions(options);
			me.bindEvents();
		},
		/**
		 * 事件绑定
		 */
		bindEvents: function() {
			var me = this;
			//下拉列表的点击事件
			jQuery(document).on("click", "#PeopleTaskFrom .select_container", function(e) {
				e.stopPropagation();
				if (jQuery(".preventioncontrolmgr.pubdiv").is(":visible")) {
					jQuery(".preventioncontrolmgr.pubdiv").hide();
				} else {
					//获取当前下拉列表的类型
					var selectType = jQuery(this).attr("data-type");
					//显示下拉列表
					me.showPubListInfo(this, selectType);
				}
			});
			//列表浮动层触发点失去焦点时隐藏
			jQuery(document).on("click", function() {
				if (!me.isMouseOverPubDiv) {
					//隐藏
					jQuery(".preventioncontrolmgr.pubdiv").hide();
				}
			});
		},
		/**
		 * 格式化搜索条件中的事件类型，屏蔽掉不用的算法事件
		 */
		formateData: function(data) {
			var me = this;
			for (var i = 0; i < data.defences.length; i++) {
				for (var j = 0; j < me.notOpenRule.length; j++) {
					if (data.defences[i].name.indexOf(me.notOpenRule[j]) >= 0) {
						data.defences.splice(i, 1);
					}
				}
			}
			return data;
		},
		/**
		 * 加载模板通用函数
		 */
		loadTemplate: function(url, callbackSuccess, callbackError) {
			var compiler = null;
			//加载模板
			jQuery.when(Toolkit.loadTempl(url)).done(function(timeTemplate) {

				if (timeTemplate instanceof Array) {
					timeTemplate = timeTemplate[0];
				}
				//模板加载成功
				compiler = Handlebars.compile(timeTemplate);
				//成功的回调函数
				if (callbackSuccess && typeof callbackSuccess === "function") {
					callbackSuccess(compiler);
				}
			}).fail(function() {
				//错误的函数
				if (callbackError && typeof callbackError === "function") {
					callbackError();
				}
			});
		},
		/**
		 * 用户确认框
		 * @param msg-用户确认时提示的信息
		 * @param callback-确认后回调的函数
		 */
		confirmDialog: function(msg, callback, closureCallBack) {
			new ConfirmDialog({
				title: '提示',
				confirmText: '确定',
				message: msg,
				callback: function() {
					if (callback && typeof callback === "function") {
						callback();
					}
				},
				closure: function() {
					if (closureCallBack && typeof closureCallBack === "function") {
						closureCallBack();
					}
				}
			});
		},
		/**
		 * 批量导入返回后，对于导入文件的状态进行回调，显示详细的错误信息
		 * @param msg-弹出框上的渲染内容
		 * @param callback-回调函数
		 */
		bulkImportConfirmDialog: function(msg, callback) {
			new CommonDialog({
				width: 640,
				title: '导入结果',
				classes: 'bulk-import',
				message: msg
			});
		},
		/**
		 * 触发下拉列表浮动层
		 * @param obj-触发点击的对象
		 * @param type-当前下拉列表的类型
		 */
		showPubListInfo: function(obj, type) {
			var me = this,
				url = "",
				param = null,
				msg = "",
				positionInfo = {
					left: jQuery(obj).offset().left,
					top: jQuery(obj).offset().top,
					width: jQuery(obj).outerWidth(),
					height: jQuery(obj).outerHeight()
				};
			//更新浮动层的样式
			jQuery(".preventioncontrolmgr.pubdiv").removeClass("nation group craditcardtype sex control-status defence-type").addClass(type);
			me.dealAfterShowPubDiv({
				alarmlevel: true
			}, positionInfo, type);
		},
		/**
		 * 填充下拉列表浮动层
		 * @param compilerParam-要渲染的数据
		 * @param positionInfo-浮动层显示的位置
		 * @param dataType-当前需要显示的数据类型
		 */
		dealAfterShowPubDiv: function(compilerParam, positionInfo, dataType) {
			var me = this;
			//加载浮动层
			jQuery(".preventioncontrolmgr.pubdiv ul").empty().html(globalVar.template(compilerParam));
			//显示浮动层
			jQuery(".preventioncontrolmgr.pubdiv").css({
				"left": positionInfo.left + "px",
				"top": positionInfo.top + positionInfo.height + 1 + "px",
				"width": positionInfo.width - 1
			}).attr("data-type", dataType).show();
			//下拉列表项的点击事件
			jQuery(".preventioncontrolmgr.pubdiv ul").find("li").each(function() {
				//给每一个列表项绑定点击事件
				jQuery(this).off("click").on("click", function(event) {
					var selectValue = jQuery(this).attr("data-value"),
						selectText = jQuery(this).html();
					//隐藏下拉列表
					jQuery(".preventioncontrolmgr.pubdiv").hide();
					//设置选中值
					jQuery(".select_container[data-type='" + dataType + "']").find(".text").attr("data-value", selectValue).html(selectText);
					//证件类型验证
					/*if (dataType === "craditcardtype") {
						//将上次付给该表单的值清空
						var validateForm = jQuery('#save-edit-person');
						jQuery.data(validateForm[0], "validator", "");
						Panel.options.PeopleControl.savePersonValid(validateForm, jQuery("#save-edit-person").parent().data("id"), selectValue);
					}*/
					event.stopPropagation();
				});
			});
			//下拉列表的鼠标移入移出事件
			jQuery(".preventioncontrolmgr.pubdiv").hover(function() {
				me.isMouseOverPubDiv = true;
			}, function() {
				me.isMouseOverPubDiv = false;
			});
		},
		/**
		 * 验证数字（包含小数）,正的数值
		 */
		filterNumbers: function(num, tag) {
			var partern = /^([0-9]\d*\.?\d*)$|^(0\.\d*[1-9])$/gi;
			//判断是否是数子
			if (!partern.test(num)) {
				return false;
			} else {
				if (tag) {
					//判断是否处于0~1之间
					var parseNum = parseFloat(num);
					if (parseNum >= 0 && parseNum <= 1) {
						return true;
					} else {
						return false;
					}
				} else {
					return true;
				}
			}
		},
		/**
		 * 显示提示进度
		 * @param msg 需要提示的信息
		 */
		showDealProgress: function(msg, showProcess) {
			msg = msg || "正在处理";
			jQuery(".process-msg, .process-cover-layout").removeClass("common-hidden");
			//根据需要是否要显示进度
			if (!showProcess) {
				jQuery(".process-msg .rate, .process-msg .process-bar").hide();
				jQuery(".process-msg .text").css({
					height: 60 + "px",
					lineHeight: 60 + "px"
				});
			} else {
				jQuery(".process-msg .rate, .process-msg .process-bar").show();
				jQuery(".process-msg .text").css({
					height: 40 + "px",
					lineHeight: 50 + "px"
				});
			}
			//显示提示文字
			jQuery(".process-msg .text").text(msg + "，请稍后...");
		},
		/**
		 * 关闭提示进度
		 */
		hideDealProgress: function() {
			jQuery(".process-msg, .process-cover-layout").addClass("common-hidden");
		}
	});
	return ProtectCommonFun;
});