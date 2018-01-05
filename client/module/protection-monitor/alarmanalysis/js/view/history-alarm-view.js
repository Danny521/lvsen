/**
 * 历史报警view
 */
define([
	'../tab-panel',
	'../alarmanalysis-global-var',
	'../alarmanalysis-common-fun',
	'../controller/alarm-deal-controller',
	'../view/alarm-deal-view',
	'pubsub',
	'base.self',
	'permission'
	],function(Panel,globalVar,commonFun,alarmDeal,alarmDealView,PubSub){
	var view = function() {};
	view.prototype = {
		// 历史报警开始时间
		hBTime: null,
		// 历史报警结束时间
		hETime: null,
		// 历史报警资源类型
		hType: "",
		//历史报警处理状态
		hStatus: "",
		//模板渲染对象
		template : null,
		//初始化模板
		initTemp : function(){
			var self = this;
			if (window.historyTemplate) {
				self.template = window.historyTemplate;
				return;
			}
			
			commonFun.loadTemplate(globalVar.templateURL, function(template){
				//存储模板渲染对象
				self.template = template;
			},function(){
				notify.error("模板加载失败!");
			});
		},
		//绑定历史报警页面事件
		bindHistory: function() {
			var self = this;
			//绑定面包屑事件
			self.bindCamerBreadEvent();
			//点击查看获取详情信息
			jQuery(document).off("click", "#historyTable tbody .table_lists_cont");
			jQuery(document).on("click", "#historyTable tbody .table_lists_cont", function() {
				var el = jQuery(this),
					tbody = el.closest("tbody");
				if (tbody.hasClass("up")) {
					jQuery("#historyTable tbody").addClass("up").find(".table_lists_details").hide();
					tbody.removeClass("up").find(".table_lists_details").show();
					var data = tbody.data();
					PubSub.publish("getDetails",{
						data:data,
						tbody:tbody
					});
				} else {
					tbody.addClass("up").find(".table_lists_details").hide();
				}
			});
			//点击历史调阅
			jQuery(document).off("click", "#historySearch .tools .icon_video").on("click", "#historySearch .tools .icon_video", function(eve) {
				eve.stopPropagation();
				var list = [];
				var camId = jQuery(this).attr("data-cameraid");
				list.push(camId);
				var typeName = jQuery(this).closest("tbody").find(".alarm-type").html();
				logDict.insertMedialog("m9", "查看“" + typeName + "”历史报警的历史视频", "f11", "o4");
				//调用历史调阅事件

				var tbody = jQuery(this).closest("tbody");
				var alarmInfo = {
					cameraId: jQuery(this).attr("data-cameraid"),
					name: tbody.attr("data-name"),
					id: tbody.attr("data-id"),
					time: tbody.attr("data-abstime"),
					code: tbody.attr("data-cameracode")
				};
				permission.stopFaultRightById(list, true, function(rights) {
					// rights以传入的顺序为顺序返回是否可以播放的数组
					if (rights[0] === true) {
						PubSub.publish("playCameraHistory", alarmInfo);
					} else {
						notify.info("暂无权限访问该摄像机");
					}
				});
			});
			//窗口大小改变时，同时改变视频播放层的位置和大小
			jQuery(window).resize(function() {
				if (jQuery(".video-play-frame").is(":visible")) {
					//先隐藏
					// jQuery(".video-play-frame").hide();
					//显示视频播放层
					jQuery(".video-play-frame").css({
						left: jQuery("#major").offset().left,
						top: jQuery("#major").offset().top,
						width: jQuery("#major").width() + "px",
						height: jQuery("#major").height() + "px"
					}).show();
				}
			});
			//关闭历史调阅
			jQuery(document).on("click", ".video-play-frame .video-win-close", function() {
				PubSub.publish("hideVideoFrame",{});
			});
			//点击报警处理
			jQuery(document).off("click", "#historySearch .tools .icon_editing");
			jQuery(document).on("click", "#historySearch .tools .icon_editing", function(eve) {
				eve.stopPropagation();
				jQuery('.alarmanalysis .pubdiv').hide(0);
				var tbody = jQuery(this).closest("tbody"),
					data = tbody.data();
				jQuery.extend(data,{tbody:tbody});
				alarmDeal.init(data);
			});
			//点击搜索
			jQuery(document).off("click", "#historySearch .conditions .hisSearch");
			jQuery(document).on("click", "#historySearch .conditions .hisSearch", function() {
				var id = globalVar.curTreeDepartment.id,
					type = globalVar.curTreeDepartment.type,
					recursion = globalVar.curTreeDepartment.recursion;
				var startTime = jQuery("#historySearch input.begin-time").val(),
					endTime = jQuery("#historySearch input.end-time").val(),
					alarmType = jQuery("#countDetial .countListDetail.active:not(.first)").attr("data-eventtype"),
					dealStatus = jQuery("#historySearch .conditions .select_container[data-type='deal-status'] .text").attr("data-value");
				//判断起始时间
				if (startTime && startTime > Toolkit.formatDate(new Date())) {
					notify.error("开始时间不能晚于当前时间!");
					return false;
				}
				if (startTime && endTime && startTime > endTime) {
					notify.error("结束时间不能早于开始时间！");
					return false;
				}
				self.hBTime = startTime;
				self.hETime = endTime;
				self.hType = alarmType;
				self.hStatus = dealStatus;
				var data = {
					type:type,
					id:id,
					recursion:recursion,
					startTime:startTime,
					endTime:endTime,
					alarmType:alarmType,
					dealStatus:dealStatus,
					isSearch:true
				};
				PubSub.publish("getHistoryDate",data);
			});
			//点击导出
			jQuery(document).off("click", "#historySearch .conditions a.export");
			jQuery(document).on("click", "#historySearch .conditions a.export", function() {
				if (globalVar.hisCount === 0) {
					notify.warn("没有可导出的历史报警信息");
					return;
				}
				new ConfirmDialog({
					title: '导出',
					confirmText: '确定',
					message: "最多导出10000条历史报警信息，确定要导出吗？",
					callback: function() {
						//显示窗口
						jQuery(".checkAlarm_layout_ifr").removeClass('hidden');
						jQuery(".export-loading").removeClass('hidden');
						//jQuery(".layout").removeClass('hidden');
						var id = globalVar.curTreeDepartment.id,
							recursion = globalVar.curTreeDepartment.recursion,
							type = (globalVar.curTreeDepartment.type === "true") ? 2 : 1;
						var startTime = jQuery("#historySearch input.begin-time").val(),
							endTime = jQuery("#historySearch input.end-time").val(),
							alarmType =jQuery("#countDetial .countList li.active").attr("data-eventtype") - 0,
							dealStatus = jQuery("#historySearch .conditions .select_container[data-type='deal-status'] .text").attr("data-value");	
							self.hType = alarmType ? alarmType : "";	
						var ifr = document.getElementById ("exportRecords");
						ifr.src = "/service/events/history/export/" + id + "?" +encodeURI("resourceType=" + type + "&recursion=" + recursion + "&eventType=" + self.hType + "&name=历史报警信息统计表&dealStatus=" + self.hStatus + "&startTime=" + startTime + "&endTime=" + endTime);
						//解决在谷歌和火狐下没办法取到状态值从而无法关闭窗口，所以正对谷歌火狐做了一个延时的处理到一定时间关闭窗口。这个会有不妥之处，窗口有时关闭早，有时关闭晚，所以取了一个折中的时间。 by wangxiaojun 2015.01.19
						if(navigator.userAgent.toLowerCase().search(/(msie\s|trident.*rv:)([\w.]+)/) !== -1){
							commonFun.getIframeLoadState("exportRecords");
						}else{
							var i = 7;
							var a = setInterval(function(){
								jQuery(".export-loading").html("窗口"+i+"秒后自动关闭...");
								i = i-1;
							},1000);
							setTimeout(function() {
								jQuery(".checkAlarm_layout_ifr").addClass('hidden');
								jQuery(".export-loading").addClass('hidden');
								jQuery(".export-loading").html("正在下载,请稍后...");
								clearTimeout(a);
								//将src置空
								// ifr.src = "about:blank";   如果是在火狐和谷歌下采用这种方式就不能设为空，要不然就会取消下载。
							}, 8000);
						}
						logDict.insertMedialog("m9","导出历史报警信息","f11");	//加日志
					}
				});
			});
			//点击关闭导出提示框
			jQuery(document).on("click",".export-loading .close-ifr",function(){
				jQuery(".checkAlarm_layout_ifr,.export-loading").addClass('hidden');
			});
			//点击右侧统计数据列
			jQuery(document).off("click",'#countDetial .countList li').on("click",'#countDetial .countList li',function(e){
				e.preventDefault();
				e.stopPropagation();
				jQuery(this).addClass("active").siblings().removeClass("active");
				jQuery('#historySearch .conditions .hisSearch').trigger("click");
				// var params = {},oid=jQuery(this).attr("data-orgid"),eventType = jQuery(this).attr("data-eventtype"),
				// resType  =jQuery(this).attr("data-resouceType");
				// params = {
				// 	resourceType:resType,
				// 	id: oid,
				// 	recursion:true,
				// 	startTime:"",
				// 	endTime:"",
				// 	alarmType: eventType==0?"":eventType,
				// 	dealStatus: "",
				// 	isSearch:true,
				// 	isRight:true
				// }
				// PubSub.publish("getHistoryDate",params);
				
			});
			jQuery(document).off("click",'#countDetial .slidePanel').on("click",'#countDetial .slidePanel',function(e){
				e.preventDefault();
				e.stopPropagation();
				var $node = jQuery(this),
					$parents = jQuery(this).parents("#countDetial");

				if(!$node.hasClass('active') && !$parents.is(":animated")){
					$parents.stop().animate({
						right:"0px",
					},150);	
					$node.addClass('active');
				}else{
					$parents.stop().animate({
						right:"-275px",
					},150);
					setTimeout(function(){
						$node.removeClass('active');
					},200)
					
				}
			});
			jQuery(document).on("click",function(e){
				e.preventDefault();
				e.stopPropagation();
				var $node = jQuery("#countDetial").find(".slidePanel");
				if($node.hasClass('active') && e.target.nodeName==="DIV"){
					jQuery("#countDetial").animate({
						right:"-278px",
					});
					$node.removeClass('active');
				}
				
			});
		},
		/**
		 * 查看人员布控时，事件绑定
		 */
		bindPersonEvents: function() {
			var self = this;
			//点击候选人图片切换的事件，在最右侧会动态展示该候选人的信息
			jQuery(document).off("click", "#historyTable .icon_look_details .imgList img");
			jQuery(document).on("click", "#historyTable .icon_look_details .imgList img", function() {
				jQuery(this).addClass("active").closest(".imgWraper").siblings().find("img").removeClass("active");
				var data = jQuery(this).data();
				jQuery("#historyTable .icon_look_details .person").html(self.template({
					clickPerson: data
				}));
			});
			//将候选人图片右下角的图标也绑定点击图片事件
			jQuery(document).on("click","#historyTable .icon_look_details .imgList i",function(){
				jQuery(this).siblings("img").click();
			});
			//布控处理时点击目标人图片查看对比图
			jQuery(document).on("click", ".icon_look_details.control .pic img", function() {
				//隐藏导航,bug[37719], add by zhangyu, 2015.10.25
                window.top.showHideNav("hide");
				var imgList = jQuery(this).closest(".control").find(".imgList"),
					id = jQuery(this).closest(".control").attr("data-id"),
					index = parseInt(imgList.find(".imgs img.active").attr("data-index"));
					cadidataInf = [], //用来存储候选人信息，以便在弹出层下方显示
					cadidates = imgList.find("img"); //候选人图片
				for (var i = 0; i < cadidates.length; i++) {
					jQuery.extend(cadidates.eq(i).data(), {
						"src": cadidates.eq(i).attr("src"),
						"handlestatus": cadidates.eq(i).attr("data-handlestatus")
					});
					cadidataInf.push(cadidates.eq(i).data());
				}
				// targetSrc之所以要替换，是因为要去请求一张画了框线的人脸
				var data = jQuery.extend({
					targetSrc: "/service/events/image?id=" + id
				}, cadidataInf[index]);
				jQuery(".alarm-list-dialog.show_event_pic").html(self.template({
					checkAimPerson: true,
					data: data
				}));
				// 这里隐藏是防止resizeImg之后图片闪动，resize之后再显示出来
				$('.pop_pic').find('img').hide();
				//初始化布防人员布控查看图片使其自适应
				var resizeImg = function(node) {
					var imgArray = $(node).find('img'),
						$img = '',
						img = {width: 0, height: 0, ratio: 1},
						imgParent = { width: 0, height: 0, ratio: 1};
					$.each(imgArray, function(index, val) {
						$img  = $(val);
						img.width = $img.width();
						img.height = $img.height();
						img.ratio = img.width/img.height;
						imgParent.width = $img.parent().width() - 10;
						imgParent.height = $img.parent().height() - 10;
						imgParent.ratio = imgParent.width/imgParent.height;
						if(img.height > imgParent.height || img.width > imgParent.width){
							img.ratio >= imgParent.ratio ? $img.width(imgParent.width) : $img.height(imgParent.height);
						}
						$img.css('margin-top',$img.height()/2 - $img.height() );
						setTimeout(function() {
							$('.pop_pic').find('img').fadeIn(0);
						},300);
					});
					
				};
				//弹出遮罩层
				jQuery(".checkAlarm_layout, .checkAlarm_layout_ifr, .alarm-list-dialog").removeClass("hidden");
				jQuery(".icon_close").fadeIn();
				//初始化弹出框的位置
				jQuery(".alarm-list-dialog").css({
					left: ($(window).width()-825)/2,
					top: ($(window).height()-580) / 2,
					width: 825,
					height:580
				});
				$('.pop_pic').find('img').load(function() {
					resizeImg($('.pop_pic'));
					
				});
				//工具条的选择状态也随之切换(有效1，无效2，未知3)
				
				var status = parseInt(cadidataInf[index].handlestatus===""?0:cadidataInf[index].handlestatus);
				if (status !== 0) {
					jQuery(".alarm-list-dialog .pop_bottom .toolsBar i").removeClass("active");
					jQuery(".alarm-list-dialog .pop_bottom .toolsBar i:nth-of-type(" + status + ")").addClass("active");
				} else if (status === 0) {
					jQuery(".alarm-list-dialog .pop_bottom .toolsBar i").removeClass("active");
				}
				//绑定翻页查看图片事件
				alarmDealView.bindTurnPage(cadidataInf, index);
			});
			//关闭查看大图
			jQuery(document).on("click", ".checkAlarm_layout, .checkAlarm_layout_ifr, .icon_close", function() {
				//隐藏导航,bug[37719], add by zhangyu, 2015.10.25
                window.top.showHideNav("show");

				jQuery(".checkAlarm_layout, .checkAlarm_layout_ifr, .alarm-list-dialog").addClass("hidden");
				jQuery(".icon_close").hide(0);
			});
		},
		//绑定摄像机树对应的面包屑事件
		bindCamerBreadEvent: function() {
			jQuery("#historySearch .breadcrumb a.section").unbind("click");
			jQuery("#historySearch .breadcrumb a.section").bind("click", function() {
				var id = jQuery(this).attr("data-id");
				var type = jQuery(this).attr("data-type");
				var recursion = jQuery(this).attr("data-recursion");
				var temSteps = globalVar.treeSteps;
				var temCurDepartment = globalVar.curTreeDepartment;
				for (var i = 0; i < globalVar.treeSteps.length; i++) {
					if (globalVar.treeSteps[i].id === id) {
						globalVar.treeSteps = globalVar.treeSteps.slice(0, i + 1);
					}
				}
				if (type == "false") {
					if (recursion == "false") {
						id = id.substring(5);
					} else {
						id = id.substring(4);
					}
				}
				globalVar.curTreeDepartment.id = id;
				globalVar.curTreeDepartment.type = type;
				if (globalVar.curTreeDepartment.type === "true") {
					//模拟点击搜索事件
					jQuery("#historySearch .conditions .hisSearch").click();
				} else {
					if (Panel.hasPermissionForCTree(globalVar.curTreeDepartment.id)) {
						//模拟点击搜索事件
						jQuery("#historySearch .conditions .hisSearch").click();
					} else {
						globalVar.treeSteps = temSteps;
						globalVar.curTreeDepartment = temCurDepartment;
						notify.info("权限不足");
					}
				}
			});
		}
	};
	return new view();
});