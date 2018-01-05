define([
	'js/preventcontrol-global-var',
	'pubsub',
	'base.self',
	'handlebars'], function(globalVar, PubSub) {
	/**
	 * 公共函数，工具类
	 */
	var ProtectCommonFun = new new Class({
		Implements: [Events, Options],
		//当前屏蔽的算法事件
		notOpenRule: ["手动报警", "人员布控"], //"离岗检测", "出门检测", "打架检测", "拥堵检测", "非法尾随", "奔跑检测", "车牌识别", "人脸检测", "烟火检测"],
		//下拉列表浮动层鼠标移入标记
		isMouseOverPubDiv: false,
		//下拉列表的缓存信息
		pubListCache: {
			"nation": { //国家列表
				isLoad: false,
				data: null
			},
			"group": { //名族列表
				isLoad: false,
				data: null
			},
			"craditcardtype": { //证件列表
				isLoad: false,
				data: null
			},
			"searchcraditcardtype": { //人员布控库搜索时证件列表（多了一个全部）
				isLoad: false,
				data: null
			},
			"defence-type": { //布防算法列表
				isLoad: false,
				data: null
			}
		},

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
			jQuery(document).on("click", ".create-edit-person .select_container, .control-task-list-head .select_container, .conditions .select_container, #PeopleTaskFrom .select_container,.top-search-panel .select_container", function(e) {
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
			//根据不同的类型显示浮动层
			switch (type) {
				case "control-status":
					me.dealAfterShowPubDiv({
						controlstatus: true
					}, positionInfo, type);
					return;
				case "alarm-level":
					me.dealAfterShowPubDiv({
						alarmlevel: true
					}, positionInfo, type);
					return;
				case "sex":
					me.dealAfterShowPubDiv({
						sex: true
					}, positionInfo, type);
					return;
				case "nation":
					if (me.pubListCache.nation.isLoad) {
						me.dealAfterShowPubDiv(me.pubListCache.nation.data, positionInfo, type);
						return;
					} else {
						//读取数据库国籍列表
						url = "/service/deploycontrol/nationalities";
						msg = "国家";
					}
					break;
				case "group":
					if (me.pubListCache.group.isLoad) {
						me.dealAfterShowPubDiv(me.pubListCache.group.data, positionInfo, type);
						return;
					} else {
						//读取数据库民族列表
						url = "/service/deploycontrol/nations";
						msg = "民族";
					}
					break;
				case "craditcardtype":
					if (me.pubListCache.craditcardtype.isLoad) {
						me.dealAfterShowPubDiv(me.pubListCache.craditcardtype.data, positionInfo, type);
						return;
					} else {
						//读取数据库证件类型列表
						url = "/service/deploycontrol/certificateTypes";
						msg = "证件类型";
					}
					break;
				case "searchcraditcardtype":
					if (me.pubListCache.searchcraditcardtype.isLoad) {
						me.dealAfterShowPubDiv(me.pubListCache.searchcraditcardtype.data, positionInfo, type);
						return;
					} else {
						//读取数据库证件类型列表
						url = "/service/deploycontrol/certificateTypes";
						msg = "证件类型";
					}
					break;
				case "defence-type":
					if (me.pubListCache["defence-type"].isLoad) {
						//读取缓存并加载
						me.dealAfterShowPubDiv(me.pubListCache["defence-type"].data, positionInfo, type);
						return;
					} else {
						//读取布防规则列表
						url = "/service/defence/get_defence_algorithm_list";
						msg = "布防规则";
					}
					break;
			}
			//读取下拉列表的数据
			//if(type !== "sex" && type !== "control-status" && type !== "alarm-level"){
			//读取下拉列表的数据并填充
			jQuery.ajax({
				url: url,
				data: {},
				cache: false,
				dataType: "json",
				async: false,
				type: "get",
				beforeSend: function() {},
				success: function(res) {
					if (res.code === 200) {
						me.dealAfterShowPubDiv(me.getPubDivData(type, res.data), positionInfo, type);
					} else if (res.code === 500) {
						notify.error(res.data.message + "！错误码：" + res.code);
					} else {
						notify.error(msg + "列表获取失败！错误码：" + res.code);
					}
				},
				error: function() {
					notify.error(msg + "列表获取失败,服务器或网络异常！");
				}
			});
			//}
		},
		/**
		 * 根据不同的类型渲染不同的下拉列表，此处获取下拉列表模板渲染数据
		 * @param type-当前的数据类型
		 * @param data-数据库读取的数据
		 */
		getPubDivData: function(type, data) {
			var me = this,
				param = {};
			if (type === "nation") {
				param = {
					common: true,
					data: data.nationality
				};
				//加入缓存
				me.pubListCache.nation.isLoad = true;
				me.pubListCache.nation.data = param;
			} else if (type === "group") {
				param = {
					common: true,
					data: data.nations
				};
				//加入缓存
				me.pubListCache.group.isLoad = true;
				me.pubListCache.group.data = param;
			} else if (type === "craditcardtype" || type === "searchcraditcardtype") {
				// data.types = data.types.slice(0, 1);
				if (type === "searchcraditcardtype") {
					data.types.unshift({
						id: "",
						code: "",
						typeName: "全部"
					});
				}
				param = {
					craditcardtype: true,
					data: data.types
				};

				if (type === "searchcraditcardtype") {
					//加入缓存
					me.pubListCache.searchcraditcardtype.isLoad = true;
					me.pubListCache.searchcraditcardtype.data = param;
				} else {
					//加入缓存
					me.pubListCache.craditcardtype.isLoad = true;
					me.pubListCache.craditcardtype.data = param;
				}

			} else if (type === "defence-type") {
				param = {
					defencetype: true,
					data: me.formateData(data).defences
				};
				//加入缓存
				me.pubListCache["defence-type"].isLoad = true;
				me.pubListCache["defence-type"].data = param;
			}
			return param;
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
			//添加对国家列表的滚动
			if (dataType === "nation") {
				jQuery(".preventioncontrolmgr.pubdiv").scrollTop(380);
			}
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
					if (dataType === "craditcardtype") {
						//将上次付给该表单的值清空
						var validateForm = jQuery('#save-edit-person');
						jQuery.data(validateForm[0], "validator", "");
						PubSub.publish("savePersonValid", {
							formSelector: validateForm, 
							personId: jQuery("#save-edit-person").parent().data("id"), 
							cardType: selectValue
						});
					}
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