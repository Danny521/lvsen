/**
 * 公共函数，工具类
 * @author chengyao
 * @date   2014-12-08
 */
define([
	'./alarmanalysis-global-var',
	'mootools'],function(globalVar){
	var AnalysisCommonFun = new new Class({
		Implements: [Events, Options],
		//当前屏蔽的算法事件
		notOpenRule: [], //"手动报警", "人员布控","离岗检测", "出门检测", "打架检测", "拥堵检测", "非法尾随", "奔跑检测", "车牌识别", "人脸检测", "烟火检测"],
		//下拉列表浮动层鼠标移入标记
		isMouseOverPubDiv: false,
		//下拉列表的缓存信息
		pubListCache: {
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
		 * lw
		 * 筛选条件下拉列表中事件绑定
		 */
		bindEvents: function() {
			var me = this;
			//下拉列表的点击事件
			jQuery(document).on("click", ".conditions .select_container, .deal_defense .select_container", function(e) {
				e.stopPropagation();
				if (jQuery(".alarmanalysis.pubdiv").is(":visible")) {
					jQuery(".alarmanalysis.pubdiv").hide();
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
					jQuery(".alarmanalysis.pubdiv").hide();
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
		 * lw
		 * 显示下拉列表浮动层
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
					width: jQuery(obj).width(),
					height: jQuery(obj).height()
				};
			//更新浮动层的样式
			jQuery(".alarmanalysis.pubdiv").removeClass("deal-status alarm-level defence-type event-type").addClass(type);
			//根据不同的类型显示浮动层
			switch (type) {
				case "deal-status":
					me.dealAfterShowPubDiv({
						dealstatus: true
					}, positionInfo, type);
					return;
				case "alarm-level":
					me.dealAfterShowPubDiv({
						alarmlevel: true
					}, positionInfo, type);
					return;
				case "event-type":
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
			//if (type !== "deal-status" && type !== "alarm-level") {
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
						notify.error(msg + "列表获取异常！错误码：" + res.code);
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
			if (type === "defence-type"||"event-type") {
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
			me.loadTemplate(globalVar.templateURL,function(temp){
				jQuery(".alarmanalysis.pubdiv ul").empty().html(temp(compilerParam));
			},function(){
				notify.error("模板加载失败!");
			});
			//显示浮动层
			jQuery(".alarmanalysis.pubdiv").css({
				"left": positionInfo.left + "px",
				"top": positionInfo.top + positionInfo.height + 2 + "px",
				"width": positionInfo.width
			}).attr("data-type", dataType).show();
			//下拉列表项的点击事件
			jQuery(".alarmanalysis.pubdiv ul").find("li").each(function() {
				//给每一个列表项绑定点击事件
				jQuery(this).off("click").on("click", function(event) {
					var selectValue = jQuery(this).attr("data-value"),
						selectText = jQuery(this).html();
					//隐藏下拉列表
					jQuery(".alarmanalysis.pubdiv").hide();
					//设置选中值
					jQuery(".select_container[data-type='" + dataType + "']").find(".text").attr("data-value", selectValue).html(selectText);
					event.stopPropagation();
				});
			});
			//下拉列表的鼠标移入移出事件
			jQuery(".alarmanalysis.pubdiv").hover(function() {
				me.isMouseOverPubDiv = true;
			}, function() {
				me.isMouseOverPubDiv = false;
			});
		},
		/**
		 * 导出时公用的弹出层
		 */
		//是否加载了Iframe
		isLoadIframe: function(id){
			var ifr = document.getElementById(id);
			var state = ifr.readyState;
		    if(state == "complete" ||state == "interactive"){
		    	//隐藏窗口
				jQuery(".checkAlarm_layout_ifr").addClass('hidden');
				jQuery(".export-loading").addClass('hidden');
				//将src置空
		    	ifr.src = "about:blank";
		    	return true;
		   	}else if(ifr.onload){
		   		//隐藏窗口
				jQuery(".checkAlarm_layout_ifr").addClass('hidden');
				jQuery(".export-loading").addClass('hidden');
				//将src置空
		   		ifr.src = "about:blank";
				return true;
			}
			return false;
		},
		//获取iframe是否已加载状态
		getIframeLoadState: function(ifrID){
			var self = this;
			var isLoaded = self.isLoadIframe(ifrID);
			if(isLoaded){
			   return isLoaded;
			}else{
			    setTimeout (function(){
			   		self.getIframeLoadState(ifrID);
			    },200);
			}
		}
	});
	return AnalysisCommonFun;
});