define(['jquery',
		'handlebars',
		'jquery.validate',
		'jquery-ui-1.10.1.custom.min',
		'jquery-ui-timepicker-addon'],function(jQuery,handlebars,validate){
	var NAME = {
			"register": "注册",
			"unregister": "注销",
			"expiry": "注册有效期",
			"keepalive": "心跳",
			"time": "校时",
			"openstream": "实时点播",
			"ptz": "云台控制",
			"ptzstop": "云台控制停止",
			"remoterun": "设备远程启动",
			"download": "视音频文件下载",
			"queryfile": "录像文件检索",
			"play": "视频文件回放",
			"playctrl": "视频文件回放控制",
			"rec": "开始手动录像",
			"stoprec": "停止手动录像",
			"guard": "报警布防",
			"unguard": "报警撤防",
			"alarm": "设备报警",
			"resetalarm": "报警复位",
			"querycatalog": "设备目录查询",
			"queryinfo": "设备信息查询",
			"querystatus": "设备状态查询",
			"subscribe": "订阅通知",
			"broadcast": "语音广播"
		},
		Type = {
			"IPC": "IPC",
			"NVR": "NVR",
			"Codec": "解码器"
		},
		stop=null,
		start=true,
		MAP = {};
	var Template = (function() {
		var cache = {};
		var templates = {
			CHECKLISTS: '/module/maintenance/sipdetection/src/inc/check-tpl.html',
			RESULT: '/module/maintenance/sipdetection/src/inc/result-tpl.html',
			MNGLISTS: '/module/maintenance/sipdetection/src/inc/mng-list-tpl.html',
			BASICINFOS: '/module/maintenance/sipdetection/src/inc/basic-tpl.html',
			REPORTCHECKINFOS: '/module/maintenance/sipdetection/src/inc/report-result-tpl.html'
		};

		function changeContent(content) {
			var content = content.replace(/</gi, "&lt;");
			content = content.replace(/>/gi, "&gt;");
			content = content.replace(/\n/gi, "<br/>");
			return content;
		};
		Handlebars.registerHelper("get-sendresult", function(send) {
			var send = changeContent(send);
			return send;
		});
		Handlebars.registerHelper("get-receiveresult", function(receive) {
			var receive = changeContent(receive);
			return receive;
		});
		Handlebars.registerHelper("get-num", function(index) {
			return (index % 2 === 0) ? "white-class" : "gray-class";
		});
		//列表页中型号模板
		Handlebars.registerHelper("get-manufacture",function(manufacture){
			if(manufacture === ""){
				return "---";
			}else{
				return manufacture;
			}
		});
		Handlebars.registerHelper("get-model",function(model){
			if(model === ""){
				return "---";
			}else{
				return model;
			}
		});
		//报告详情页面的样式
		Handlebars.registerHelper("get-value", function(value) {
			if (value === "") {
				return "---";
			} else {
				return value;
			}
		});
		Handlebars.registerHelper("get-check-value", function(value) {
			if (value === "未检测") {
				return "green-class";
			} else if (value === "未通过") {
				return "red-class";
			}
		});
		Handlebars.registerHelper("get-unpass-detail",function(value,name){
			if(value ==="未通过"){
				return '<span class="look-detail" data-name="'+name+'">详情查看</span>';
			}
		});
		return {
			/**
			 * [模板渲染]
			 * @param  {[type]}   templateName [模板名称]
			 * @param  {Function} callback     [回调]
			 * @return {[type]}                [description]
			 */
			render: function(templateName, callback) {
				if (cache[templateName]) {
					callback(cache[templateName]);
				} else {
					$.ajax({
						url: templates[templateName],
						method: "get"
					}).then(function(temp) {
						callback(cache[templateName] = Handlebars.compile(temp))
					})
				}
			}
		};
	})();
	var View = function(pb){
		PB = pb;
		this.validate();
		this.initEvent();
	}
	View.prototype = {
		/**
		 * [initPlaceHolder placeholder兼容性]
		 * @return {[type]} [description]
		 */
		initPlaceHolder: function() {
			if (!('placeholder' in document.createElement('input'))) {
				$('input[placeholder],textarea[placeholder]').each(function() {
					var that = $(this),
						text = that.attr('placeholder');
					if (that.val() === "") {
						that.val(text).addClass('placeholder');
					}
					that.focus(function() {
						if (that.val() === text) {
							that.val("").removeClass('placeholder');
						}
					}).blur(function() {
						if (that.val() === "") {
							that.val(text).addClass('placeholder');
						}
					}).closest('form').submit(function() {
						if (that.val() === text) {
							that.val('');
						}
					});
				});
			}
		},
		initEvent: function() {
			var self = this;
			/**
			 * [onselectstart 控制页面内容可选]
			 * @return {[type]} [description]
			 */
			document.onselectstart = function() {
					return true;
			};
			/**
			 * [点击一级导航时]
			 * @param  {[type]}              [description]
			 * @return {[type]}              [description]
			 */
			jQuery(parent.document).find("#navigator .wrapper a").on("click",function(ev){
				var $self = $(this),src = $self.attr("href"),
					IsOver = !($(".check-process .check-status").hasClass("overcheck")),
					IsAncsy = !($(".check-process .check-status").hasClass("error")),
					isStop = !($(".check-process .check-status").hasClass("stopcheck"));
				if(jQuery(parent.document).find("#header .nav a.item").filter("[href = '/maintenance/sipdetection']").hasClass("active")){
					//检测完成情况下是可以离开页面
					if($(".wrap #main .access .main").hasClass("hide") && IsOver && IsAncsy && isStop){
						//阻止默认事件，阻止事件冒泡
						ev.preventDefault();
						ev.stopPropagation();
						new ConfirmDialog({
							title: '提示',
							confirmText: '确定',
							message: "正在进行国标信令检测，您确定要离开此页面？",
							callback:function(){
								PB.publish("stopCheck",$(".sip-id").val());
								window.location.href = src;
							}
						})
					}
				}
			});
			/**
			 * [如果正在进行检测，点击二级导航时询问是否离开此页]
			 * @param  {[type]}              [description]
			 * @return {[type]}              [description]
			 */
			jQuery(parent.document).find("#header .nav a.item").on("click",function(ev){
				var $self = $(this),src = $self.attr("href"),
					IsOver = !($(".check-process .check-status").hasClass("overcheck")),
					IsAncsy = !($(".check-process .check-status").hasClass("error")),
					isStop = !($(".check-process .check-status").hasClass("stopcheck"));
				if($self.attr("href")!=="/maintenance/sipdetection"){
					//检测完成情况下是可以离开页面
					if($(".wrap #main .access .main").hasClass("hide") && IsOver && IsAncsy && isStop){
						//阻止默认事件，阻止事件冒泡
						ev.preventDefault();
						ev.stopPropagation();
						new ConfirmDialog({
							title: '提示',
							confirmText: '确定',
							message: "正在进行国标信令检测，您确定要离开此页面？",
							callback:function(){
								PB.publish("stopCheck",$(".sip-id").val());
								window.location.href = src;
							}
						})
					}
				}
			});
			//缓存dom
			this.$lists = $("#check-items");
			this.$result = $("#result-content");
			this.$mag_lists = $("#mag-lists");
			this.$basic = $("#basic-content");
			this.$report = $("#result-check-content");

			/**
			 * [左侧栏tabs按钮]
			 * @param  {[type]}            [description]
			 * @return {[type]}            [description]
			 */
			$(".aside .inline-list li").click(function() {
				var $self = $(this);
				$self.addClass("current").siblings().removeClass("current");
				$self.children().removeClass("hide");
				$self.siblings().children().addClass("hide");
				$("#main").children("[data-content=" + $self.attr("data-tab") + "]").removeClass("hide").siblings().addClass("hide");
			});
			/**
			 * [全选复选框]
			 * @return {[type]} [description]
			 */
			$(".check-all").click(function() {
				var $self = $(this),
					IsAllChecked,
					IsKindChecked,
					$kindChild = $(".check-type").children(),
					IsRegist,
					IsControl,
					IsHistory,
					IsAlarm,
					IsOther;
				IsAllChecked = $self.find("input")[0].checked;
				$kindChild.find("input").prop("checked", IsAllChecked);
				IsRegist = $kindChild.filter("[data-tab='registkind']").find("input")[0].checked;
				//注册类消息选中状态
				$(".access-item").children().filter("[data-tab='registkind']").find("input").prop("checked", IsRegist);
				//注册默认选中
				$(".access-item").children().filter("[data-tab='registkind']").find("input").filter("[name='register']").prop("checked", true);
				//控制类消息选中状态
				IsControl = $kindChild.filter("[data-tab='controlkind']").find("input")[0].checked;
				$(".access-item").children().filter("[data-tab='controlkind']").find("input").prop("checked", IsRegist);
				//历史类选中状态
				IsHistory = $kindChild.filter("[data-tab='historykind']").find("input")[0].checked;
				$(".access-item").children().filter("[data-tab='historykind']").find("input").prop("checked", IsRegist);
				//报警类
				IsAlarm = $kindChild.filter("[data-tab='alarmkind']").find("input")[0].checked;
				$(".access-item").children().filter("[data-tab='alarmkind']").find("input").prop("checked", IsRegist);
				//其他
				IsOther = $kindChild.filter("[data-tab='otherkind']").find("input")[0].checked;
				$(".access-item").children().filter("[data-tab='otherkind']").find("input").prop("checked", IsRegist);
			});
			/**
			 * [五类信息全选框的选择]
			 * @return {[type]} [description]
			 */
			$(document).on("click", ".check-type label", function() {
				var $self = $(this),
					IsChecked, $children = $(".access-item").children(),
					boolAll;
				if ($self.attr("data-tab") == "registkind") { //注册类
					IsChecked = $self.find("input")[0].checked;
					$children.filter("[data-tab='registkind']").find("input").prop("checked", IsChecked);
					$children.filter("[data-tab='registkind']").find("input").filter("[name='register']").prop("checked", true)
				} else if ($self.attr("data-tab") == "controlkind") { //控制类
					IsChecked = $self.find("input")[0].checked;
					$children.filter("[data-tab='controlkind']").find("input").prop("checked", IsChecked);
				} else if ($self.attr("data-tab") == "historykind") { //历史类
					IsChecked = $self.find("input")[0].checked;
					$children.filter("[data-tab='historykind']").find("input").prop("checked", IsChecked);
				} else if ($self.attr("data-tab") == "alarmkind") { //报警类
					IsChecked = $self.find("input")[0].checked;
					$children.filter("[data-tab='alarmkind']").find("input").prop("checked", IsChecked);
				} else if ($self.attr("data-tab") == "otherkind") { //其他类
					IsChecked = $self.find("input")[0].checked;
					$children.filter("[data-tab='otherkind']").find("input").prop("checked", IsChecked);
				}
				//全选复选框的反选
				boolAll = $(".check-type label").find("input:checked").length === $(".check-type label").find("input").length;
				$(".check-all").find("input").prop("checked", boolAll);
			});
			/**
			 * [每一条检测信息的反选控制]
			 * @return {[type]} [description]
			 */
			$(document).on("click", ".access-item input", function() {
				var $self = $(this),
					boolAll,
					boolRegist = $(".register-cmd").find("input:checked").length === $(".register-cmd").find("input").length,
					boolControl = $(".controll-cmd").find("input:checked").length === $(".controll-cmd").find("input").length,
					boolHistory = $(".history-cmd").find("input:checked").length === $(".history-cmd").find("input").length,
					boolAlarm = $(".alarm-cmd").find("input:checked").length === $(".alarm-cmd").find("input").length,
					boolOther = $(".other-cmd").find("input:checked").length === $(".other-cmd").find("input").length;
				if ($self.closest("[data-tab='registkind']").length > 0) {
					$(".check-type").children().filter("[data-tab='registkind']").find("input").prop("checked", boolRegist);
				} else if ($self.closest("[data-tab='controlkind']").length > 0) {
					$(".check-type").children().filter("[data-tab='controlkind']").find("input").prop("checked", boolControl);
				} else if ($self.closest("[data-tab='historykind']").length > 0) {
					$(".check-type").children().filter("[data-tab='historykind']").find("input").prop("checked", boolHistory);
				} else if ($self.closest("[data-tab='alarmkind']").length > 0) {
					$(".check-type").children().filter("[data-tab='alarmkind']").find("input").prop("checked", boolAlarm);
				} else if ($self.closest("[data-tab='otherkind']").length > 0) {
					$(".check-type").children().filter("[data-tab='otherkind']").find("input").prop("checked", boolOther);
				}
				//全选按钮的反选控制
				boolAll = $(".check-type label").find("input:checked").length === $(".check-type label").find("input").length;
				$(".check-all").find("input").prop("checked", boolAll);
			});
			/**
			 * [其他厂商输入框]
			 * @param  {[type]}   [description]
			 * @return {[type]}   [description]
			 */
			$(".other").click(function() {
				var $self = $(this);
				$("select").toggleClass("hide");
				$(".manufacture").toggleClass("hide");
				if ($("select").hasClass("hide")) {
					$self.html("取消");
					$(".manufacture")[0].value = "";
				}
				if ($(".manufacture").hasClass("hide")) {
					$self.html("其他");
					$self.parent().find("label").remove();
				}
				//重置输入框
				self.initPlaceHolder();
			});
			/**
			 * [国标ID输入框的blur事件]
			 * @return {[type]} [description]
			 */
			$(".sip-id").on("blur", function() {
				var $self = $(this);
				if (self.validateId($self.val())) {
					$(".validate").addClass("hide");
					PB.publish("GetDeviceType", $self.val());
				}
				$(".validate").addClass("hide");
				$(".validate").removeClass("flag");
			});
			/**
			 * [国标ID输入框focus事件，处理提示语“该ID已注册，重新设置与ID不能为空冲突”]
			 * @param  {[type]} [description]
			 * @return {[type]}                                                                                              [description]
			 */
			$(".sip-id").on("focus", function() {
				//flag做为标识位
				if ($(".validate").hasClass("flag")) {
					$(".validate").addClass("hide");
				}
			});
			/**
			 * 开始检测
			 */
			$(".btn-start").click(function() {
				var time;
				self.validate();
				var $form = $("#content");
				if (!$(".validate").hasClass("hide")) {
					$(".main").removeClass("hide");
					$(".check-process").addClass("hide");
				} else {
					if ($form.valid() && $(".access-list").find("input:checked").length > 0) {
						self.changeSlide();
						PB.publish("startCheck", self.getCheckedItems());
					}
					//存储检测项信息到MAP
					MAP = self.getSaveDate();
					//加入开始检测时间到MAP
					time = new Date().getTime();
					MAP["checkTime"] = time;
				}
				//为了消除异常情况时界面状态
				self.errorSituationAginaOrExit();
				setTimeout(function() {
					$(".check-lists").scrollTop(0);
				}, 200);
			});
			/**
			 * [查看结果(眼睛图标)]
			 * @param  {[type]}	           [description]
			 * @return {[type]}            [description]
			 */
			$(document).on("click", ".look-img", function() {
				var $self = $(this);
				if ($self.hasClass("lookDetail")) {
					$(".shade").removeClass("hide");
					$(".result").removeClass("hide");
				}
				PB.publish("showInfos", $self.closest(".check-item").attr("data-name"));
			});
			/**
			 * [查看结果（文字“查看”）]
			 * @param  {[type]} 	       [description]
			 * @return {[type]}            [description]
			 */
			$(document).on("click",".look label",function(){
				var $self = $(this);
				if ($self.hasClass("lookDetail")) {
					$(".shade").removeClass("hide");
					$(".result").removeClass("hide");
				}
				PB.publish("showInfos", $self.closest(".check-item").attr("data-name"));
			});
			/**
			 * [查看结果关闭界面]
			 * @param  {[type]} ) [description]
			 * @return {[type]}   [description]
			 */
			$(".result-close").click(function() {
				var $self = $(this);
				$(".shade").addClass("hide");
				$(".result").addClass("hide");
				//注册失败后查看信令交互过程，flag标示是在注册失败时点击查看信令交互时添加的
				if ($self.hasClass("flag")) {
					//清空已经通过项，未通过项、总检测项
					self.clearCheckItemsTimes();
					//隐藏检测页面跳转到首页
					$(".check-process").addClass("hide");
					$(".main").removeClass("hide");
					//清空检测项id，password等
					self.clearcheckInfo();
					//滚动条的位置
					$(".check-lists").scrollTop(0);
				}
				$self.removeClass("flag");
			});
			/**
			 * [交互界面确定按钮]
			 * @param  {[type]} ) [description]
			 * @return {[type]}   [description]
			 */
			$(".btn-ok").click(function() {
				$(".operate-cmd").addClass("hide");
				$(".shade").addClass("hide");
				$(".operate-cmd").addClass("flag");
				PB.publish("Tip");
			});
			/**
			 * [关闭交互界面]
			 * @param  {[type]}   [description]
			 * @return {[type]}   [description]
			 */
			$(".btn-close").click(function() {
				$(".shade").addClass("hide");
				$(".operate-cmd").addClass("hide");
				$(".operate-cmd").addClass("flag");
				PB.publish("Tip");
			});
			/**
			 * [注册不通过情况下查看信令交互过程]
			 * @param  {[type]} [description]
			 * @return {[type]}                                                                                                                          [description]
			 */
			$(".btn-register").click(function() {
				//隐藏询问框
				$(".register-unpass").addClass("hide");
				//显示详情查看界面
				$(".shade").removeClass("hide");
				$(".result").removeClass("hide");
				//注册不通过时给详情页面的关闭按钮添加一个flag标识，为了区分查看时详情页面的关闭标识，控制界面是否跳转到首页；
				$(".result").find(".result-close").addClass("flag");
				//渲染详情页面信息
				PB.publish("showInfos", "注册");
			});
			/**
			 * [注册不通过情况下不查看信令交互过程]
			 * @param  {[type]}  [description]
			 * @return {[type]}                                                                                                                          [description]
			 */
			$(".btn-unregister").click(function() {
				$(".register-unpass").addClass("hide");
				$(".shade").addClass("hide");
				//清空已经通过项，未通过项、总检测项
				self.clearCheckItemsTimes();
				//隐藏检测页面跳转到首页
				$(".check-process").addClass("hide");
				$(".main").removeClass("hide");
				//每一个检测项状态处理
				$(".status").removeClass("pass");
				$(".status").removeClass("unpass");
				$(".status").removeClass("error");
				$(".status").removeClass("wait");
				//进度条改变位置
				$(".check-progress").css("left","-69px");
				//改变滑动条位置
				clearInterval(stop);
				$(".check-slide").css("left","-14px");
				//每一个检测项的进度条隐藏
				$(".progress-line").css("width","0px");
				$(".progress-line").addClass("hide");
				//清空检测项id，password等
				self.clearcheckInfo();
				//滚动条的位置
				$(".check-lists").scrollTop(0);
			});
			/**
			 * [暂停检测]
			 * @param  {[type]} [description]
			 * @return {[type]} [description]
			 */
			$(".btn-stop").click(function() {
				var $self = $(this),
					index = $(".btn-stop").attr("data-index"),
					$status = $("#check-items").find($(".check-item")).filter("[data-index='" + index + "']").find(".status");
				if ($self.hasClass("checkback")) { //停止之后或者异常点击“退出”时变化
					//隐藏检测页面进入首页
					$(".check-process").addClass("hide");
					$(".main").removeClass("hide");
					//添加flag是为了作为标示，在重新检测的时候能够将时间、检测数目清空
					$(".btn-stop").addClass("flag");
					if ($(".btn-open").hasClass("agina")) { //如果是异常情况，btn-open添加了agina类
						/*异常情况下退出检测页面*/
						self.errorSituationExit();
					}else { //点击停止之后btn-open有stop类,停止之后“退出”
						self.stopEndCheck();
					}
				}else if($self.hasClass("agina")){//检测完毕之后重新检测
					//添加flag是为了作为标示，在重新检测的时候能够将时间、检测数目清空
					$(".btn-stop").addClass("flag");
					self.checkOverAgina();
					//滑动条单独控制，避免退出之后在进入速度变快问题
					self.changeSlide();
					PB.publish("startCheck", self.getCheckedItems());
					//加入开始检测时间到MAP
					time = new Date().getTime();
					MAP.checkTime = time;
				}else { //只是停止还未退出
					PB.publish("suspendCheck");
					//停止滑动条滑动
					clearInterval(stop);
					//若终止检测时正在检测心灵交互的项，则需要隐藏信令交互弹出框
					$(".operate-cmd").addClass("hide");
					//上面绿色渐变背景的变化
					$(".check-status").addClass("stopcheck")
					//转圈图片变化
					$(".check-logo").addClass("stopcheck");
					//“正在检测”变为“停止”
					$(".check-percent span:first-child").html("停止");
					//百分比变为“！”
					$(".percent").html("！");
					//通过or未通过统计变为已检测统计
					$(".sum-static").removeClass("hide");
					$(".static-items").addClass("hide");
					//界面上面正在检测项的状态变化
					$status.removeClass("wait");
					//暂停按钮和停止按钮的变化
					$(".btn-open").addClass("stop");
					$(".btn-open").attr("title","继续检测");
					$(".btn-stop").addClass("checkback");
					$(".btn-stop").attr("title","退出");
					//每一个检测项的进度条隐藏
					$(".progress-line").css("width","0px");
					$(".progress-line").addClass("hide");
					//暂停时隐藏信令交互框
					$(".operate-cmd").addClass("hide");
				}
				goOnindex = index;
			});
			/**
			 * [暂停/播放]
			 * @param  {[type]}            [description]
			 * @return {[type]}            [description]
			 */
			goOnindex: 0; //存储继续检测的项的index
			$(".btn-open").click(function() {
				var $self = $(this),
					$status_F, $status_S, index = parseInt($self.attr("data-index")),
					Check_Items = self.getCheckedItems().length;
				$self.toggleClass("stop");
				if (!$self.hasClass("stop")) { //播放
					self.stopGoOnCheck();//暂停之后播放
				} else if ($self.hasClass("agina")) {//异常情况下,重新检测
					//添加flag是为了作为标示，在重新检测的时候能够将时间、检测数目清空
					$(".btn-open").addClass("flag");
					self.errorSituationAgina();
				} else if($self.hasClass("save")){//保存按钮（图片）
					PB.publish("saveCheckInfos", MAP);
					$self.removeClass("stop");
				} else { //暂停
					$self.attr("disabled","disabled");
					PB.publish("suspendCheck");
					clearInterval(stop);
					$status_F = $(".check-items").find(".check-item").filter("[data-index=" + index + "]");
					$status_S = $(".check-items").find(".check-item").filter("[data-index=" + (index + 1) + "]");
					//暂停的时候如果当前项是index的值
					if ($status_F.find(".status").hasClass("wait")) {
						self.stopMoment($status_F);
						goOnindex = index; //存储继续检测的项的index
					} else { //暂停的时候如果当前项是index+1的值
						self.stopMoment($status_S);//暂停时清空当前检测项的一系列状态
						goOnindex = index + 1; //存储继续检测的项的index
						if (index === Check_Items) { //如果index的等于最后一项时，继续检测就从0开始
							goOnindex = 0;
						}
					}
					$(".check-percent span:first-child").html("暂停");
					//暂停时界面处理
					$(".check-logo").addClass("stopmoment");
					//暂停时清除每一个检测项的进度条
					$(".progress-line").css("width","0px");
					$(".progress-line").addClass("hide");
					//暂停时隐藏信令交互框
					$(".operate-cmd").addClass("hide");
					//暂停时修改title属性
					$self.attr("title","继续检测");
					$self.removeAttr("disabled");
				}
			});
			/**
			 * [检测完成之后退出检测页面进入首页]
			 * @param  {[type]} 		[description]
			 * @return {[type]}         [description]
			 */
			$(".btn-exit").on("click",function(){
				//退出检测页面进入首页
				$(".check-process").addClass("hide");
				$(".main").removeClass("hide");
				//清空检测界面数据
				self.checkOverAgina();
				//清空检测首页数据
				self.clearcheckInfo();
			});
			/**
			 * [保存检测结果]
			 * @param  {[type]} 		 [description]
			 * @return {[type]}          [description]
			 */
			$(document).on("click",".save-operate",function(){
				PB.publish("saveCheckInfos", MAP);
			});
			/**
			 * [重新检测（文字提示）]
			 * @param  {[type]} 	       [description]
			 * @return {[type]}            [description]
			 */
			$(document).on("click",".agina-operate",function(){
				var $self = $(this);
				$self.addClass("flag");
				if($self.parent().hasClass("operate-tip")){//检测完毕之后重新检测
					self.checkOverAgina();
					self.changeSlide();
					PB.publish("startCheck", self.getCheckedItems());
					//加入开始检测时间到MAP
					time = new Date().getTime();
					MAP.checkTime = time;
				}else if($self.parent().hasClass("error-situation")){//异常情况下重新检测
					self.errorSituationAgina();
				}
			});
			/**
			 * [异常情况||终止检测||检测结束时的退出检测]
			 * @param  {[type]} 		   [description]
			 * @return {[type]}            [description]
			 */
			$(document).on("click",".exit-operate",function(){
				var $self = $(this);
				$self.addClass("flag");
				$(".check-process").addClass("hide");
				$(".main").removeClass("hide");
				/*异常情况下退出检测页面*/
				if($self.parent().hasClass("error-situation")){
					self.errorSituationExit();
				}else if($self.parent().hasClass("operate-tip")){//检测完成之后退出
					//清空检测界面数据
					self.checkOverAgina();
					//清空检测首页检测数据
					self.clearcheckInfo();
				}else{//停止之后终止检测
					self.stopEndCheck();
				}
			});
			/**
			 * [停止之后继续检测和暂停之后播放一样（文字提示）]
			 * @param  {[type]} 			[description]
			 * @return {[type]}             [description]
			 */
			$(document).on("click",".goOn-check",function(){
				self.stopGoOnCheck();
			});
			$(".inline-list").on("click","li",function(){
				var $self = $(this);
				if($self.attr("data-tab")==="access"){
					$(".operate-cmd").removeClass("flag");
				}
			});
			/**
			 * [点击检测管理时渲染检测列表页面]
			 * @param  {[type]} )		 [description]
			 * @return {[type]}          [description]
			 */
			$(".btn-manager").click(function() {
				PB.publish("showCheckedInfos");
				$(".manager-content").removeClass("hide");
				$(".div-mng").addClass("hide");
				//防止在测试到用户交互过程的时候点击“检测管理”页面，添加隐藏交互界面
				$(".operate-cmd").addClass("flag");
				$(".operate-cmd").addClass("hide");
			});
			/**
			 * [检测管理中时间控件]
			 * @param  {[type]}            [description]
			 * @return {[type]}            [description]
			 */
			$(document).on("focus", ".input-time", function() {
				var $self = $(this);
				$(this).datetimepicker({
					showSecond: true,
					dateFormat: 'yy-mm-dd',
					timeFormat: 'HH:mm:ss',
					timeText: '',
					hourText: ' 时:',
					minuteText: ' 分:',
					secondText: ' 秒:',
					showAnim: ''
				}).datetimepicker('show');
			});
			/**
			 * [检测管理列表中全选框操作]
			 * @param  {[type]} 		 [description]
			 * @return {[type]}          [description]
			 */
			$(".checkall").click(function() {
				var $self = $(this),
					IsChecked;
				IsChecked = $self[0].checked;
				$(".mag-lists").find(".eachcheck").prop("checked", IsChecked);
			});
			/**
			 * [检测列表中反选]
			 * @param  {[type]} 		 [description]
			 * @return {[type]}          [description]
			 */
			$(".mag-lists").on("click", ".eachcheck", function() {
				var checkL = $(".mag-lists").find(".eachcheck:checked").length;
				var allCheck = $(".mag-lists").find(".eachcheck").length;
				var IsChecked = checkL === allCheck;
				$(".checkall").prop("checked", IsChecked);
			});
			/**
			 * [根据筛选条件查询结果]
			 * @param  {[type]   [description]
			 * @return {[type]   [description]
			 */
			$(".btn-select").click(function() {
				PB.publish("searchCheckedInfos");
			});
			/**
			 * [检测管理列表中查看检测报告]
			 * @param  {[type]}			   [description]
			 * @return {[type]}            [description]
			 */
			$(document).on("click", ".btn-mng-look", function() {
				var $self = $(this),
					checkTime;
				$(".manager-content").addClass("hide");
				$(".div-mng").removeClass("hide");
				checkTime = $self.closest(".mag-list").children().last().prev().html();
				$(".check-time").html(checkTime);
				$(".btn-export").attr("data-id", $self.closest(".mag-list").attr("data-id"));
				PB.publish("searchDetailInfos", $self.closest(".mag-list").attr("data-id"));
			});
			/**
			 * [删除某一项]
			 * @param  {[type]} 	       [description]
			 * @return {[type]}            [description]
			 */
			$(".mag-lists").on("click", ".btn-delete", function() {
				var $self = $(this);
				PB.publish("DeleteInfos", {
					ids: $self.closest(".mag-list").attr("data-id"),
					deleteDom: function() {
						$self.closest(".mag-list").remove();
					}
				});
			});
			/**
			 * [删除所选中的项，批量删除]
			 * @param  {[type]} 	       [description]
			 * @return {[type]}            [description]
			 */
			$(".btn-delete-all").click(function() {
				var checked = $(".mag-lists").find(".eachcheck:checked"),
					ids = [];
				if (checked.length === 0) {
					notify.warn("请先选择要删除的项")
				} else {
					for (var i = 0; i < checked.length; i++) {
						ids.push($(checked[i]).closest(".mag-list").attr("data-id"));
					}
					PB.publish("DeleteInfos", {
						ids: ids,
						deleteDom: function() {
							for (var i = 0; i < ids.length; i++) {
								$(".mag-lists").find(".mag-list").filter("[data-id='" + ids[i] + "']").remove();
							}
						}
					});
				}
			});
			/**
			 * [导出报告中查看详细信息]
			 * @param  {[type]}            [description]
			 * @return {[type]}            [description]
			 */
			$(document).on("click",".look-detail",function(){
				var $self = $(this);
				$(".shade").removeClass("hide");
				$(".result").removeClass("hide");
				PB.publish("lookUnpassDetail",{
					id:$(".mag-list").attr("data-id"),
					method:$self.attr("data-name")
				});
			});
			/**
			 * [单个导出检测报告]
			 * @param  {[type]} 		 [description]
			 * @return {[type]}          [description]
			 */
			$(document).on("click", ".btn-mng-export", function() {
				var $self = $(this);
				PB.publish("exportDoc", $self.closest(".mag-list").attr("data-id"));
			});
			/**
			 * [导出报告中导出按钮]
			 * @param  {[type]} 	     [description]
			 * @return {[type]}          [description]
			 */
			$(".div-mng").on("click", ".btn-export", function() {
				var $self = $(this);
				PB.publish("exportDoc", $self.attr("data-id"));
			});
			/**
			 * [检测报告中返回按钮]
			 * @param  {[type]}  [description]
			 * @return {[type]}  [description]
			 */
			$(".btn-back").click(function() {
				$(".div-mng").addClass("hide");
				$(".manager-content").removeClass("hide");
			});
		},
		/**
		 * [validateId 验证国标id]
		 * @param  {[type]} num [国标id值]
		 * @return {[type]}     [description]
		 */
		validateId: function(num) { /*^\d{18,20}$*/ // ^\d{n}$
			var patrn = /^\d{20}/
			if (patrn.test(num)) {
				return true;
			} else {
				return false;
			}
		},
		/**
		 * [validate 表单验证]
		 * @type {[type]}
		 */
		validate: function() {
			$("#content").validate({
				ignore: "",
				rules: {
					id: {
						required: true,
						maxlength: 20,
						minlength: 20,
						number: true
					},
					password: {
						required: true,
						minlength: 6,
						maxlength: 20
					},
					expires: {
						positiveInteger: true,
						min: 60,
						max: 3600
					},
					video:{
						maxlength: 20,
						minlength: 20,
						number: true
					},
					alarm:{
						maxlength: 20,
						minlength: 20,
						number: true
					},
					manufacture: {
						maxlength: 50
					},
					model: {
						maxlength: 50
					},
					fireware: {
						maxlength: 50
					},
					soft: {
						maxlength: 50
					}
				},
				success: function(label) {
					label.remove();
				},
				messages: {
					id: {
						required: "ID不能为空",
						maxlength: "请输入20位的数字",
						minlength: "请输入20位的数字",
						number: "请输入20位的数字"
					},
					password: {
						required: "密码不能为空",
						minlength: "请输入6-20位以内的字符、数字或两者组合",
						maxlength: "请输入6-20位以内的字符、数字或两者组合"
					},
					expires: {
						positiveInteger: "请输入60-3600以内的正整数",
						min: "请输入60-3600以内的正整数",
						max: "请输入60-3600以内的正整数"
					},
					video: {
						maxlength: "请输入20位的数字",
						minlength: "请输入20位的数字",
						number: "请输入20位的数字"
					},
					alarm: {
						maxlength: "请输入20位的数字",
						minlength: "请输入20位的数字",
						number: "请输入20位的数字"
					},
					manufacture: {
						maxlength: "请输入50位以内的字符"
					},
					model: {
						maxlength: "请输入50位以内的字符"
					},
					fireware: {
						maxlength: "请输入50位以内的字符"
					},
					soft: {
						maxlength: "请输入50位以内的字符"
					}
				}
			})
		},
		/**
		 * [getDeviceType 根据后台返回设备类型的值选中checkbox]
		 * @type {[type]}
		 */
		checkedBoxById: function(res) {
			var l = $(".access-list").find("input").length,
				$input = $(".access-list").find("input"),
				$controll = $(".controll-cmd").children().find("input"),
				$other = $(".other-cmd").children().find("input");
			if (res && res.code == 200) {
				$(".validate").addClass("hide");
				$(".device-type").find("input")[0].value = Type[res.response.type];
				if (res.response.type == "IPC" || res.response.type == "NVR") { //如果是IPC或者是NVR时所有复选框均选中
					$(".access-list").find("input").prop("checked", "checked");
				} else { //解码器时选中以下复选框
					for (var i = 0; i < l; i++) {
						$input[i].checked = false;
					}
					$(".check-type").children().filter("[data-tab='registkind']").find("input").prop("checked", "checked");
					$(".register-cmd").find("input").prop("checked", "checked");
					$controll.filter("[name='openstream']").prop("checked", "checked");
					$controll.filter("[name='remoterun']").prop("checked", "checked");
					$other.filter("[name='querycatalog']").prop("checked", "checked");
					$other.filter("[name='queryinfo']").prop("checked", "checked");
					$other.filter("[name='querystatus']").prop("checked", "checked");
				}
			} else if (res && res.code == 400) {
				$(".validate").addClass("hide");
				$(".device-type").find("input")[0].value = Type[res.response.type];
			} else if (res && res.code == 401) {
				$(".validate").removeClass("hide");
				$(".validate").addClass("flag");
			}
		},
		/**
		 * [getCheckedItems 获取选中要检测的项]
		 * @type {[type]}
		 */
		getCheckedItems: function() {
			var checklists = [],
				$checked = $(".access-item").find("input:checked"),
				indexLists = [],
				index = 0,
				sortchecked = [];
			$checked.each(function() {
				var $self = $(this);
				checklists.push({
					method: $self[0].name,
					describe: $self.attr("data-describe"),
					name: NAME[$self[0].name],
					index: $self.attr("data-index"), //存储index，后续检测的时候要按顺序检测
					deviceId: $(".sip-id").val(),
					password: $(".sip-password").val(),
					expires: $(".sip-expires").val(),
					video:$(".video-id").val(),
					alarm:$(".alarm-id").val(),
					start_time:$(".video-start-time").val(),
					end_time:$(".video-end-time").val()
				})
			})
			for (var i = 0; i < checklists.length; i++) {
				indexLists.push(parseInt(checklists[i].index));
			}
			//将检测项排序之后存入sortchecked数组
			indexLists = indexLists.sort(function(a, b) {
				return a > b ? 1 : -1
			});
			for (var i = 0; i < indexLists.length; i++) {
				for (var j = 0; j < checklists.length; j++) {
					if (checklists[j].index == indexLists[i]) {
						sortchecked.push(checklists[j]);
					}
				}
			}
			return sortchecked;
		},
		/**
		 * [gateWayOpen 网关开启状态]
		 * @return {[type]} [description]
		 */
		gateWayOpen: function() {
			$(".main").addClass("hide");
			$(".check-process").removeClass("hide");
		},
		/**
		 * [gateWayClosed 网关已关闭时界面处理]
		 * @return {[type]} [description]
		 */
		gateWayClosed: function() {
			$(".main").removeClass("hide");
			$(".detail").addClass("hide");
		},
		/**
		 * [showDetail 渲染检测项模板]
		 * @type {[type]}
		 */
		showDetail: function(items) {
			var self = this;
			Template.render("CHECKLISTS", function(tpl) {
				self.$lists.html(tpl(items));
			})
		},
		/**
		 * [stopMoment 暂停时界面处理]
		 * @param  {[type]} $el [description]
		 * @return {[type]}     [description]
		 */
		stopMoment: function($el) {
			//暂停时移除当前检测项的状态
			$el.find(".status").removeClass("pass");
			$el.find(".status").removeClass("unpass");
			$el.find(".status").removeClass("wait");
			//暂停时如果该项已经检测通过或者是未通过时移除checked类
			$el.find(".look").removeClass("checked");
			$el.find(".look-img").removeClass("checked");
			//暂停时移除lookDetail类
			$el.find(".look-img").removeClass("lookDetail");
			$el.find(".look").find("label").removeClass("lookDetail");
		},
		/**
		 * [clearcheckInfo 清空检测项信息]
		 * @return {[type]} [description]
		 */
		clearcheckInfo: function() {
			var self = this;
			//清空检测项id，password等
			$(".sip-id")[0].value = "";
			//ie下密码框控制
			if ($(".content").find(".sip-password").length > 1) {
				$(".sip-password").filter("[type='password']")[0].value = "";
				$(".sip-password").filter("[type='text']").css("display", "inline-block");
				$(".sip-password").filter("[type='password']").css("display", "none");
			} else {
				$(".sip-password")[0].value = "";
			}
			$(".sip-expires")[0].value = 3600;
			$(".device-type").find("input")[0].value="IPC";
			$(".item").find("input").filter("[name='model']")[0].value = "";
			$(".item").find("input").filter("[name='fireware']")[0].value = "";
			$(".item").find("input").filter("[name='soft']")[0].value = "";
			$(".video-id")[0].value = "";
			$(".alarm-id")[0].value = "";
			//再次检测时界面上面复选框的变化
			$(".access-list").find("input").prop("checked", false);
			$(".access-list").find("input").filter("[name='register']").prop("checked", true);
			//设置placeholder
			self.initPlaceHolder();
		},
		/**
		 * [errorSituationExit 异常情况下退出检测界面，进入检测首页（文字和图片共用的方法）]
		 * @return {[type]} [description]
		 */
		errorSituationExit:function(){
			var self = this;
			/*异常情况下退出检测页面*/
			//改变进度条的位置
			$(".check-progress").css("left","-69px");
			//清除检测过程中数目和已经使用时间
			self.clearCheckItemsTimes();
			//出现异常情况下退出检测界面进入首页时检测界面变化情况
			self.errorSituationAginaOrExit();
			//清空检测项id，password等
			self.clearcheckInfo();
		},
		/**
		 * [errorSituationAgina 出现异常情况下重新检测（文字和图片共用的方法）]
		 * @return {[type]} [description]
		 */
		errorSituationAgina:function(){
			var self = this;
			//增加滑动条
			if(start==true){
				self.changeSlide();
			}
			//清除检测过程中数目和已经使用时间
			self.clearCheckItemsTimes();
			//出现异常情况下重新检测时界面变化
			self.errorSituationAginaOrExit();
			//重新检测
			PB.publish("startCheck", self.getCheckedItems());
			//加入开始检测时间到MAP
			time = new Date().getTime();
			MAP.checkTime = time;
		},
		/**
		 * [errorSituationAginaOrExit 异常情况下重新检测和退出界面变化情况]
		 * @return {[type]} [description]
		 */
		errorSituationAginaOrExit:function(){
			//上面绿色渐变背景的变化
			$(".check-status").removeClass("error");
			//转圈图片变化
			$(".check-logo").removeClass("error");
			//“停止”变为“正在检测”
			$(".check-percent span:first-child").html("正在检测");
			//“！”变为百分比
			$(".percent").removeClass("hide");
			$(".percent").html("0%");
			//已检测统计变为通过or未通过统计
			$(".error-situation").addClass("hide");
			$(".static-items").removeClass("hide");
			$(".check-progress").css("left","-69px");
			//界面上面正在检测项的状态变化
			$(".status").removeClass("pass");
			$(".status").removeClass("unpass");
			$(".status").removeClass("error");
			//信令名称变化
			$(".check-cmd").removeClass("error");
			//暂停按钮和停止按钮的变化
			$(".btn-open").removeClass("agina");
			$(".btn-open").removeClass("stop"); //移除stop是因为btn-open时用toggleClass方法stop类
			$(".btn-open").attr("title","暂停");
			$(".btn-stop").removeClass("checkback");
			$(".btn-stop").attr("title","停止检测");
			//滚动条的位置
			$(".check-lists").scrollTop(0);
			//若终止检测时正在检测心灵交互的项，则需要隐藏信令交互弹出框
			$(".operate-cmd").addClass("hide");
			//重新检测时清除每一项进度条的异常样式
			$(".progress-line").addClass("hide");
			$(".progress-line").removeClass("error");
			$(".progress-line").css("left","62px");
			$(".progress-line").css("top","49px");
			$(".progress-line").removeAttr("right");
			$(".progress-line").css("width","0px");
			//异常情况下移除look样式
			$(".look").removeClass("checked");
			$(".look-img").removeClass("checked");
		},
		/**
		 * [checkOverAgina 检测完毕之后重新检测（文字和图片共用的方法）]
		 * @return {[type]} [description]
		 */
		checkOverAgina:function(){
			var self = this;
			//上面绿色渐变背景的变化
			$(".check-status").removeClass("overcheck");
			//改变进度条的位置
			$(".check-progress").css("left","-69px");
			//改变滑动条的位置
			$(".check-slide").css("left","-14px");
			//百分比显示情况
			$(".check-percent span:first-child").html("正在检测");
			$(".percent").removeClass("hide");
			//转圈图片变化
			$(".check-logo").removeClass("overcheck");
			//隐藏总体统计显示通过or未通过统计
			$(".static-items").removeClass("hide");
			$(".items-time").addClass("hide");
			//隐藏操作提示。显示时间统计
			$(".operate-tip").addClass("hide");
			$(".checked-time").removeClass("hide");
			//清除检测过程中数目和已经使用时间
			self.clearCheckItemsTimes();
			//暂停按钮和停止按钮的变化
			$(".btn-open").removeClass("save");
			$(".btn-open").removeClass("hide");
			$(".btn-open").attr("title","暂停");
			$(".btn-stop").removeClass("agina");
			$(".btn-stop").attr("title","停止检测");
			//显示出文字提示的保存
			$(".save-operate").removeClass("hide");
			$(".operate-tip").find(".agina-operate").addClass("hide");
			//检测完成之后重新检测时隐藏退出按钮
			$(".btn-exit").addClass("hide");
			//检测项状态变化
			$(".status").removeClass("pass");
			$(".status").removeClass("unpass");
			//滚动条的位置
			$(".check-lists").scrollTop(0);

		},
		removeDisabled:function(){
			$(".btn-open").removeAttr("disabled");
		},
		/**
		 * [stopGoOnCheck 停止之后继续检测操作（文字和图片共用的方法）]
		 * @return {[type]} [description]
		 */
		stopGoOnCheck:function(){
			var self = this;
			if(start==true){
				self.changeSlide();
			}
			$(".btn-open").attr("disabled","disabled");
			PB.publish("goOnCheck", goOnindex);
			//上面绿色渐变背景的变化
			$(".check-status").removeClass("stopcheck");
			//转圈图片变化
			$(".check-logo").removeClass("stopcheck");
			//“正在检测”变为“停止”
			$(".check-percent span:first-child").html("正在检测");
			//百分比变为“！”
			$(".percent").html("！");
			//通过or未通过统计变为已检测统计
			$(".sum-static").addClass("hide");
			$(".static-items").removeClass("hide");
			//暂停按钮和停止按钮的变化
			$(".btn-open").removeClass("stop");
			$(".btn-open").attr("title","暂停");
			$(".btn-stop").removeClass("checkback");
			$(".btn-stop").attr("title","停止检测");
			//暂停之后界面处理
			$(".check-logo").removeClass("stopmoment");
		},
		/**
		 * [stopEndCheck 停止之后终止检测（文字和图片共用的方法）]
		 * @return {[type]} [description]
		 */
		stopEndCheck:function(){
			var self = this;
			PB.publish("stopCheck",$(".sip-id").val());
			//上面绿色渐变背景的变化
			$(".check-status").removeClass("stopcheck");
			//改变进度条的位置
			$(".check-progress").css("left","-69px");
			//改变滑动条的位置
			clearInterval(stop);
			$(".check-slide").css("left","-14px");
			//转圈图片变化
			$(".check-logo").removeClass("stopcheck");
			//“停止”变为“正在检测”
			$(".check-percent span:first-child").html("正在检测");
			//“！”变为百分比
			$(".percent").html("0%");
			//已检测统计变为通过or未通过统计
			$(".sum-static").addClass("hide");
			$(".static-items").removeClass("hide");
			//清除检测过程中数目和已经使用时间
			self.clearCheckItemsTimes();
			//界面上面正在检测项的状态变化
			$(".status").removeClass("wait");
			$(".status").removeClass("pass");
			$(".status").removeClass("unpass");
			//暂停按钮和停止按钮的变化
			$(".btn-open").removeClass("stop");
			$(".btn-open").attr("title","暂停");
			$(".btn-stop").removeClass("checkback");
			$(".btn-stop").attr("title","停止检测");
			//滚动条的位置
			$(".check-lists").scrollTop(0);
			//若终止检测时正在检测信令交互的项，则需要隐藏信令交互弹出框
			$(".operate-cmd").addClass("hide");
			//清空检测项id，password等
			self.clearcheckInfo();
		},
		/**
		 * [clearCheckItemsTimes 清除检测过程中数目和已经使用时间]
		 * @return {[type]} [description]
		 */
		clearCheckItemsTimes:function(){
			//清除检测过程中数目和已经使用时间
			$(".pass-sum").html(0); //检测通过数目
			$(".unpass-sum").html(0); //检测未通过数目
			$(".checked-time span").html(0); //检测时间
			$(".sum-static span:first-child").html(0); //总检测数目统计
			$(".items-time span:first-child").html(0);//总检测数目
			$(".items-time span:last-child").html(0);//总检测时间
		},
		/**
		 * [passORunpassSur 检测通过或者不通过时界面相同之处处理]
		 * @return {[type]} [description]
		 */
		passORunpassSur: function(checkedItems, method, response, data, itemsL, index, status) {
			var $status = $("#check-items").find($(".check-item")).filter("[data-index='" + index + "']").find(".status"), //当前检测项的状态
				$active = $("#check-items").find($(".check-item")).filter("[data-index='" + (index) + "']"), //当前检测项
				item_top = $active.offset().top,
				item_height = $active.height(),
				wrap_top = $(".check-lists").offset().top, //检测项容器
				wrap_height = $(".check-lists").height();
			//交互信令弹框，通过或者未通过时要隐藏弹框
			$(".operate-cmd").addClass("hide");
			$(".operate-cmd").removeClass("flag");
			//通过或者未通过时要隐藏正在检测状态
			$status.removeClass("wait");
			//改变总检测数目
			$(".sum-static span:first-child").html(checkedItems);
			$(".items-time span:first-child").html(checkedItems);
			//改变时间
			$(".checked-time").find("span").html(data);
			$(".items-time span:last-child").html(data); //检测完毕时使用
			//改变检测进度的百分比
			$(".percent").html(Math.floor((checkedItems / itemsL) * 100) + "%");
			//给look添加checked类，便于给look里面的图片和“查看”文字添加hover时的样式(先注释)
			$active.find(".look").addClass("checked");
			//给look-img添加checked类是改变图片
			$active.find(".look-img").addClass("checked");
			//此处添加lookDetail类是为了点击查看详情时控制
			$active.find(".look-img").addClass("lookDetail");
			$active.find(".look").find("label").addClass("lookDetail");
			//将index存入btn-open，后续暂停的时候通过该index获取当前检测项
			$(".btn-open").attr("data-index", index);
			//滚动条下滑
			if ((item_top + item_height) > (wrap_height)) {
				//下滑
				$(".check-lists").scrollTop(item_top + item_height - wrap_height + $(".check-lists").scrollTop());
			}
			//失败或者通过之后
			$(".progress-line").filter("[data-index=" + index + "]").addClass("hide");
			//检测完毕控制
			if(index === itemsL-1){
				//背景图渐变颜色变化
				$(".check-status").addClass("overcheck");
				//转圈变为静止
				$(".check-logo").addClass("overcheck");
				//"正在检测"变为"检测完毕"
				$(".check-percent span:first-child").html("检测完毕");
				$(".percent").addClass("hide");
				//隐藏通过or未通过提示，显示总检测项和时间提示
				$(".static-items").addClass("hide");
				$(".items-time").removeClass("hide");
				//检测完成时隐藏时间提示显示操作提示
				$(".checked-time").addClass("hide");
				$(".operate-tip").removeClass("hide");
				//右边按钮变为"保存"和"重新检测"
				$(".btn-open").addClass("save");
				$(".btn-open").attr("title","保存");
				$(".btn-stop").addClass("agina");
				$(".btn-stop").attr("title","重新检测");
				//检测完成时显示提出按钮
				$(".btn-exit").removeClass("hide");
				setTimeout(function(){
					//进度条改变位置
					$(".check-progress").css("left","-69px");
					//改变滑动条位置
					clearInterval(stop);
					$(".check-slide").css("left","-14px");
					//改变每一个进度条的top和width值
					$(".progress-line").css("top","49px");
					$(".progress-line").css("width","0px");
				},300)
			}
			//给MAP中添加检测通过项的通过状态以及详情
			for (var i = 0; i < MAP.parentItems.length; i++) {
				for (var j = 0; j < MAP.parentItems[i].childItems.length; j++) {
					if (MAP.parentItems[i].childItems[j].method === method) {
						MAP.parentItems[i].childItems[j].status = status;
						MAP.parentItems[i].childItems[j].response = response;
					}
				}
			}
		},
		/**
		 * [passStatus 检测通过界面状态修改]
		 * @type {[type]}
		 */
		passStatus: function(method, response, checkedItems, passItems, index, data) {
			var self = this,
				$UL = $("#check-items").find($(".check-item")).filter("[data-index='" + index + "']"),
				$status = $("#check-items").find($(".check-item")).filter("[data-index='" + index + "']").find(".status"), //通过or未通过or检测中or异常时每一项状态
				itemsL = self.getCheckedItems().length;
			$status.addClass("pass");
			$status.attr("title","通过")
			$(".pass-sum").html(passItems);
			self.passORunpassSur(checkedItems, method, response, data, itemsL, index, 1);
		},
		/**
		 * [waitStatus 检测处于等待状态界面状态]
		 * @type {[type]}
		 */
		waitStatus: function(checkedItems, index, data) {
			var self = this,
				$status = $("#check-items").find($(".check-item")).filter("[data-index='" + index + "']").find(".status"), //通过or未通过or检测中or异常时每一项状态
				itemsL = self.getCheckedItems().length;
			//等待状态时信令交互框隐藏（后端返回100时表示等待）
			$(".operate-cmd").addClass("hide");
			$(".operate-cmd").removeClass("flag");
			//检测状态为等待
			$status.addClass("wait");
			//改变时间
			$(".checked-time").find("span").html(data);
			$(".items-time span:last-child").html(data); //检测完毕时使用
			//改变检测进度的百分比
			$(".percent").html(Math.floor((checkedItems / itemsL) * 100) + "%");
			//将index存入btn-open，后续暂停的时候通过该index获取当前检测项
			$(".btn-open").attr("data-index", index);
			//将index存入btn-stop，后续终止检测后控制当前正在检测的项的状态
			$(".btn-stop").attr("data-index", index);
		},
		/**
		 * [exchangeStatus 交互状态]
		 * @param  {[type]} index [description]
		 * @param  {[type]} data  [description]
		 * @return {[type]}       [description]
		 */
		exchangeStatus: function(checkedItems, index, data, warning) {
			var self = this,
				$status = $("#check-items").find($(".check-item")).filter("[data-index='" + index + "']").find(".status"), //通过or未通过or检测中or异常时每一项状态
				itemsL = self.getCheckedItems().length;
			//交互状态时界面显示为等待（后端返回101）
			$status.addClass("wait");
			//改变时间
			$(".checked-time").find("span").html(data);
			$(".items-time span:last-child").html(data); //检测完毕时使用
			//改变检测进度的百分比
			$(".percent").html(Math.floor((checkedItems / itemsL) * 100) + "%");
			//将index存入btn-open，后续暂停的时候通过该index获取当前检测项
			$(".btn-open").attr("data-index", index);
			//将index存入btn-stop，后续终止检测后控制当前正在检测的项的状态
			$(".btn-stop").attr("data-index", index);
			//需要用户交互界面展示时间处理
			if (!$(".operate-cmd").hasClass("flag")) {
				$(".operate-cmd").removeClass("hide");
				$(".warning").html(warning);
			}
		},
		/**
		 * [unPassStatus 检测未通过界面状态]
		 * @type {[type]}
		 */
		unPassStatus: function(method, response, checkedItems, unpassItems, index, data) {
			var self = this,
				$UL = $("#check-items").find($(".check-item")).filter("[data-index='" + index + "']"),
				$status = $("#check-items").find($(".check-item")).filter("[data-index='" + index + "']").find(".status"),
				itemsL = self.getCheckedItems().length;
			//检测项添加未通过图片，未通过文字
			$status.addClass("unpass");
			$status.attr("title","未通过");
			//未通过项增加
			$(".unpass-sum").html(unpassItems);
			//未通过时界面时间、百分比、进度条等等变化
			self.passORunpassSur(checkedItems, method, response, data, itemsL, index, 0);
			//注册失败时界面变化（是否查看信令交互提示框弹出）
			if (index == 0) {
				//添加flag标示是为了在注册失败时不查看信令交互的过程再次进入检测页面时控制时间，检测项等清零
				$("#check-items").find(".check-item").filter("[data-index='0']").find(".status").addClass("flag");
				$(".register-unpass").removeClass("hide");
				$(".shade").removeClass("hide");
			}
		},
		/**
		 * [changeProgress 改变滑动条的进度]
		 * @param  {[type]} index [description]
		 * @return {[type]}       [description]
		 */
		changeProgress: function(index, progress) {
			var self = this,
				sumL = $(".check-status").width(),
				itemWidth, itemwidthAdd,left,
				itemsL = self.getCheckedItems().length;
			if (index == itemsL - 1) {//最后一段宽度和之前的不一样
				itemWidth = sumL - (Math.floor(sumL / itemsL)) * (index);
				itemwidthAdd = Math.floor(sumL / itemsL);//控制最后一段的时候itemWidth变大或者变小的问题；
			} else {
				itemWidth = Math.floor(sumL / itemsL);
				itemwidthAdd = itemWidth;
			}
			if(progress==0){//如果后端返回的进度是0的时候，要保持进度条的left仍然为-69px
				left = -69;
			}else{//left要减去进度条的宽度
				left = itemWidth * (progress / 100)-69;
			}
			$(".check-progress").stop().animate({
				left: (index * itemwidthAdd) + left
			}, 200);
		},
		changeSlide: function() {
			var progress = $(".check-progress")[0];
			var w = $(".check-progress").width()-14;
			var slide = $(".check-slide")[0];
			var speed = 1;
			stop = setInterval(function() {
				var pLeft = parseInt(progress.style.left||0)+w,
					sLeft = parseInt(slide.style.left||0);
				if (sLeft >= pLeft) {
					$(".check-slide").css("left","-14px");
				}else{
					speed = 1;
					slide.style.left = sLeft + speed + "px";
				}
			}, 10);
		},
		/**
		 * [changeItemProgress 为每一个检测项添加进度条]
		 * @return {[type]} [description]
		 */
		changeItemProgress:function(progress,index){
			var ItemProgress = $(".progress-line").filter("[data-index=" + index + "]"),
			 	SumWidth = $(".check-item").width(),
				pre = $(".check-items").find(".check-item").eq(index),progressWidth = 0;
			$(ItemProgress).removeClass("hide");
			$(ItemProgress).css("top",(parseInt(49)+(index*($(pre).height()+1)))+"px");//49指最初始的top值
			if(progress === 100){
				progressWidth = SumWidth-5;
			}else{
				progressWidth = Math.floor(SumWidth*(progress/100));
			}
			$(ItemProgress).stop().animate({
				width:progressWidth
			},200)
		},
		/**
		 * [gateWayClosedstatus 正在检测某一项时网关关闭时界面处理]
		 * @return {[type]} [description]
		 */
		gateWayClosedstatus: function(index) {
			//当前正在检测项
			var $current = $("#check-items").find(".check-item").filter("[data-index='" + index + "']");
			//背景图渐变颜色变化
			$(".check-status").addClass("error");
			//改变当前检测项的状态
			$current.find(".status").removeClass("wait").addClass("error");
			//改变异常项颜色
			$current.find(".check-cmd").addClass("error");
			//改变转圈logo的样式
			$(".check-logo").addClass("error");
			//"正在检测"变为"异常"，同时隐藏百分比
			$(".check-percent span:first-child").html("异常");
			$(".percent").addClass("hide");
			//隐藏检测项统计dom，显示提示网关关闭dom
			$(".sum-static").addClass("hide");
			$(".static-items").addClass("hide");
			$(".error-situation").removeClass("hide");
			//显示时间统计
			$(".checked-time").removeClass("hide");
			//滑动条静止
			clearInterval(stop);
			$(".check-slide").css("left","-14px");
			//暂停按钮变为重新检测
			$(".btn-open").addClass("agina");
			$(".btn-open").attr("title","重新检测");
			//停止按钮变为退出
			$(".btn-stop").addClass("checkback");
			$(".btn-stop").attr("title","退出");
			//隐藏信令交互框
			$(".operate-cmd").addClass("hide");
			//异常情况下每一项进度条
			$(".progress-line").filter("[data-index=" + index + "]").css("left","0px");
			$(".progress-line").filter("[data-index=" + index + "]").css("width",$(".check-items").width());
			$(".progress-line").filter("[data-index=" + index + "]").addClass("error");
			$(".progress-line").filter("[data-index=" + index + "]").removeClass("hide");
		},
		/**
		 * [ItemCheckError 非注册之外的检测项出现异常时界面处理]
		 * @param {[type]} res [description]
		 */
		ItemCheckError: function(res) {
			$(".error-situation span:first-child").html(res);
		},
		/**
		 * [showLookInfos 渲染查看信息页面]
		 * @param  {[type]} response [description]
		 * @return {[type]}          [description]
		 */
		showLookInfos: function(response) {
			var self = this;
			Template.render("RESULT", function(tpl) {
				self.$result.html(tpl(response));
			})
		},
		showError: function() {
			//注册失败时添加该标示，此处使用
			var Isregister = $("#check-items").find(".check-item").filter("[data-index='0']").find(".status").hasClass("flag"),
				IsAginaError = $(".agina-operate").hasClass("flag"),
				//退出检测页面跳转到首页时添加该标示的，此处添加也是为了清空检测项数目、时间等
				IsStop = $(".btn-stop").hasClass("flag"),
				//重新检测时添加该标示，此处添加是为了清空检测数目、时间等
				IsOpen = $(".btn-open").hasClass("flag"),
				IsExit = $(".exit-operate").hasClass("flag");
			if (IsAginaError || IsStop || Isregister || IsExit || IsOpen) {
				return true;
			} else {
				return false;
			}
		},
		/**
		 * [removeAginaFlag 在时间等已经清空的情况下，删除flag标示]
		 * @return {[type]} [description]
		 */
		removeAginaFlag: function() {
			$(".btn-agina").removeClass("flag");
			$(".btn-stop").removeClass("flag");
			/*$(".btn-exit").removeClass("flag");*/
			$(".btn-open").removeClass("flag");
			$(".agina-operate").removeClass("flag");
			$(".exit-operate").removeClass("flag");
		},
		/**
		 * [getSaveDate 获取要保存数据（维护MAP内容）]
		 * @return {[type]} [description]
		 */
		getSaveDate: function() {
			var data = {},
				manufacture;
			if ($(".manufacture").hasClass("hide")) {
				manufacture = $("#manufacture option:selected").val();
			} else {
				manufacture = $("input[name='manufacture']").val();
			}
			data = {
				nid: $("input[name='id']").val(),
				password: $("input[name='password']").val(),
				expires: $("input[name='expires']").val(),
				deviceType: $("input[name='deviceType']").val(),
				manufacture: manufacture,
				model: $("input[name='model']").val(),
				fireware: $("input[name='fireware']").val(),
				soft: $("input[name='soft']").val(),
				parentItems: [{
					type: "register-cmd",
					childItems: [{
						method: "register",
						status: 2,
						response: null
					}, {
						method: "expiry",
						status: 2,
						response: null
					}, {
						method: "unregister",
						status: 2,
						response: null
					}, {
						method: "keepalive",
						status: 2,
						response: null
					}, {
						method: "time",
						status: 2,
						response: null
					}]
				}, {
					type: "controll-cmd",
					childItems: [{
						method: "openstream",
						status: 2,
						response: null
					}, {
						method: "ptz",
						status: 2,
						response: null
					}, {
						method: "ptzstop",
						status: 2,
						response: null
					}, {
						method: "remoterun",
						status: 2,
						response: null
					}, {
						method: "download",
						status: 2,
						response: null
					}]
				}, {
					type: "history-cmd",
					childItems: [{
						method: "queryfile",
						status: 2,
						response: null
					}, {
						method: "play",
						status: 2,
						response: null
					}, {
						method: "playctrl",
						status: 2,
						response: null
					}, {
						method: "rec",
						status: 2,
						response: null
					}, {
						method: "stoprec",
						status: 2,
						response: null
					}]
				}, {
					type: "alarm-cmd",
					childItems: [{
						method: "guard",
						status: 2,
						response: null
					}, {
						method: "unguard",
						status: 2,
						response: null
					}, {
						method: "alarm",
						status: 2,
						response: null
					}, {
						method: "resetalarm",
						status: 2,
						response: null
					}]
				}, {
					type: "other-cmd",
					childItems: [{
						method: "querycatalog",
						status: 2,
						response: null
					}, {
						method: "queryinfo",
						status: 2,
						response: null
					}, {
						method: "querystatus",
						status: 2,
						response: null
					}, {
						method: "subscribe",
						status: 2,
						response: null
					}, {
						method: "broadcast",
						status: 2,
						response: null
					}]
				}]
			}
			return data;
		},
		/**
		 * [hideSaveButton 保存成功之后隐藏保存按钮]
		 * @return {[type]} [description]
		 */
		hideSaveButton:function(){
			//隐藏保存按钮
			$(".btn-open").addClass("hide");
			$(".save-operate").addClass("hide");
			//显示重新检测按钮
			$(".operate-tip").find(".agina-operate").removeClass("hide");

		},
		/**
		 * [getPageContainer 获取分页容器]
		 * @return {[type]} [description]
		 */
		getPageContainer: function() {
			return $("#pager");
		},
		/**
		 * [hidePage 当检测管理中总数小于或等于每一页条数时]
		 * @return {[type]} [description]
		 */
		hidePage: function() {
			$("#pager").addClass("hide");
		},
		/**
		 * [showPage 当检测管理中总数大于每一页条数时]
		 * @return {[type]} [description]
		 */
		showPage: function() {
			$("#pager").removeClass("hide");
		},
		/**
		 * [showNoData 没有检测数据界面上面显示“没有相关数据”]
		 * @return {[type]} [description]
		 */
		showNoData: function() {
			$("#pager").addClass("hide");
			$(".noData").removeClass("hide");
		},
		/**
		 * [getSelectFactor 获取查询时的筛选条件]
		 * @return {[type]} [description]
		 */
		getSelectFactor: function() {
			var data = {};
			return data = {
				"nid": $(".input-id").val(),
				"startTime": $(".start-time").val(),
				"endTime": $(".end-time").val(),
				"manufacturer":$(".input-manufacture").val()
			}
		},
		/**
		 * [showCheckedInfos 渲染检测列表]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		showCheckedInfos: function(data) {
			var self = this;
			Template.render("MNGLISTS", function(tpl) {
				self.$mag_lists.html(tpl(data));
			})
		},
		/**
		 * [showDetailBasic 渲染检测结果中基本信息]
		 * @return {[type]} [description]
		 */
		showDetailBasic: function(data) {
			var self = this;
			Template.render("BASICINFOS", function(tpl) {
				self.$basic.html(tpl(data));
			})
		},
		/**
		 * [showDetailReport 渲染检测报告中检测项结果]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		showDetailReport: function(data) {
			var self = this;
			Template.render("REPORTCHECKINFOS", function(tpl) {
				self.$report.html(tpl(data));
			})
		},
		/**
		 * [showResult 检测报告总结结果]
		 * @param  {[type]} unpassItems [description]
		 * @param  {[type]} passItems   [description]
		 * @return {[type]}             [description]
		 */
		showResult: function(unpassItems, passItems) {
			var uncheckItems = 24 - unpassItems - passItems;
			$(".sum-pass").val(passItems);
			$(".sum-unpass").val(unpassItems);
			$(".sum-uncheck").val(uncheckItems);
		},
		NetError: function() {
			$(".manager-content").removeClass("hide");
			$(".div-mng").addClass("hide");
		}
	}
	return View;
})
