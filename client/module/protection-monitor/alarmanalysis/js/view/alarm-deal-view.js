/*
** 报警处理 by chengyao
 */
define(['pubsub','../alarmanalysis-global-var','handlebars'],function(PubSub,global){
	var view = function(){};
	view.prototype = {
		//模板
		template:null,
		init:function(){
			var self = this;
			//初始化模板
			jQuery.get('/module/protection-monitor/alarmanalysis/inc/alarm-deal-template.html',function(tem){
				self.template = Handlebars.compile(tem);
			});
		},
		//报警处理模板渲染
		applyAlarmDealTemp:function(data){
			var tbody = data.tbody,
				self = this;
			//判断报警类型（不同报警类型加载的模板不一样）
			if (data.event.deployEvent.eventType === 134217728) { //人员布控
				tbody.find("div.deal_layout").html(self.template({
					toDealAlarm: data.event
				}));
				tbody.find("div.deal_layout .layout_ifr,div.deal_layout .layout,div.deal_layout .infowindow-down").removeClass("hidden");
				window.thickbox();
				self.bindDealPersonEvents();
				tbody.find("div.deal_layout .person-images .image-detail:first-child img").click();
			} else if (data.event.deployEvent.eventType === 33554432) { //手动报警的渲染  By wangxiaojun 2014-10-30
				tbody.find("div.deal_layout").html(self.template({
					handlerDealAlarm: data.event
				}));
				tbody.find("div.deal_layout .layout_ifr,div.deal_layout .layout,div.deal_layout .deal_defense").removeClass("hidden");
				//window.thickbox();
				global.histNewimplent(data.event)
				self.bindDefenseEvents();
			} else { //其他布防处理
				tbody.find("div.deal_layout").html(self.template({
					otherDealAlarm: data.event
				}));
				tbody.find("div.deal_layout .layout_ifr,div.deal_layout .layout,div.deal_layout .deal_defense").removeClass("hidden");
				//window.thickbox();
				global.histNewimplent(data.event)
				self.bindDefenseEvents();
			}
		},
		// [处理布防时的事件绑定]
		bindDefenseEvents: function() {
			var self = this;
			//关闭弹出层
			jQuery(document).on("click",".deal_defense .dialog_title .close" ,function() {
				jQuery("div.deal_layout .layout_ifr,div.deal_layout .layout,div.deal_layout .deal_defense").addClass("hidden");
			});
			//点击处理
			jQuery(document).off("click", ".deal_defense button.do");
			jQuery(document).on("click", ".deal_defense button.do", function() {
				var This = jQuery(this);
				var tbody = This.closest("tbody");
				var data = {
					"This":This,
					"id": parseInt(tbody.attr("data-id")),
					"value": This.attr("data-dealstatus"),
					"_method": "put",
					"comment": This.closest("li.infor").find("textarea").val(),
					"level": This.closest("li.infor").find(".select_container .text").attr("data-value")
				};
				if (data.comment.length >= 100) {
					notify.warn("备注信息不能超过100字，请重新输入！");
					return;
				}
				/*var param = {
					data:data,
					This:This
				};*/
				PubSub.publish("toDealDefence",data);
				jQuery("div.deal_layout .layout_ifr,div.deal_layout .layout,div.deal_layout .deal_defense").addClass("hidden");
			});
		},
		//处理人员布控时的事件绑定
		bindDealPersonEvents: function() {
			var self = this;
			var params = {};
			var activePeole = null; //当前选中的候选人
			//关闭弹出层
			jQuery(document).on("click","div.deal_layout .dialog_title .close", function() {
				jQuery("div.deal_layout .layout_ifr,div.deal_layout .layout,div.deal_layout .infowindow-down").addClass("hidden");
			});
			//点击候选人图片
			jQuery(document).off("click", ".infowindow-down .image-detail img");
			jQuery(document).on("click", ".infowindow-down .image-detail img", function() {
				jQuery(".infowindow-down .image-detail img").removeClass("active");
				jQuery(this).addClass("active");
				activePeole = jQuery(this);
				//切换候选人时，旁边的候选人信息随之切换
				var data = jQuery.extend(activePeole.data(), {
					"description": activePeole.attr("data-description")
				});
				params = { //保存参数
					id: data.personid,
					dealStatus: data.handlestatus
				};
				jQuery(".infowindow-down .select-person-info").html(self.template({
					candidate: data
				}));
				jQuery(".infowindow-down .select-person-image a.thickbox").attr("href", jQuery(this).attr("src"));
				jQuery(".infowindow-down .select-person-image img").attr("src", jQuery(this).attr("src"));
				//切换候选人时，工具条的选择状态也随之切换(有效1，无效2，未知3)
				var status = parseInt(activePeole.attr("data-handlestatus"));
				if (status !== 0) {
					activePeole.closest("tbody").find(".infowindow-down .image-tools i").removeClass("active");
					activePeole.closest("tbody").find(".infowindow-down .image-tools i:nth-of-type(" + status + ")").addClass("active");
				} else if (status === 0) {
					activePeole.closest("tbody").find(".infowindow-down .image-tools i").removeClass("active");
				}
			});
			//将候选人图片右下角的图标也绑定点击图片事件
			jQuery(document).on("click", ".infowindow-down .image-detail i",function() {
				jQuery(this).siblings("img").click();
			});
			//点击处理工具条
			jQuery(document).on("click",".infowindow-down .image-tools i", function() {
				var This = jQuery(this);
				var peopleList = This.closest(".infowindow-down").find(".person-images .image-detail");
				//判断图片中是否有处理状态为有效的候选人以及当前选中的候选人
				var isRight = false;
				for (var i = 0; i < peopleList.size(); i++) {
					if (jQuery(peopleList[i]).find("i").hasClass("right")) {
						isRight = true;
						break;
					}
				}
				jQuery(".infowindow-down .image-tools i").removeClass("active");
				//有效的只能有一个
				if (This.hasClass("right")) {
					if (isRight) {
						notify.warn("已经有一个有效的候选人，请选择其他处理状态！");
						return;
					}
				}
				This.addClass("active");
			});
			//点击保存
			jQuery(document).off("click", ".infowindow-down .save-select-person");
			jQuery(document).on("click", ".infowindow-down .save-select-person", function() {
				var This = jQuery(this),
					statusDom = jQuery(this).closest(".infowindow-down").find(".image-tools .active"); //当前选中的处理状态
				//获取当前选择的状态
				if (statusDom.length) {
					if (statusDom.hasClass("right")) {
						params.dealStatus = 1;
						params.iconStatus = "right";
					} else if (statusDom.hasClass("wrong")) {
						params.dealStatus = 2;
						params.iconStatus = "wrong";
					} else if (statusDom.hasClass("unknow")) {
						params.dealStatus = 3;
						params.iconStatus = "unknow";
					}
				} else {
					notify.warn("请选择处理状态");
					return;
				}
				//保存信息
				var data = {
					"activePeole": activePeole,
					"iconStatus": params.iconStatus,
					"statusDom":statusDom,
					"This":This,
					"param": {
						"_method": "put",
						"id": jQuery(this).closest("tbody").attr("data-id"),
						"personId": params.id,
						"value": params.dealStatus,
						"comment": This.closest("tbody").find(".select-person-info textarea").val()
					}
				};
				if (data.param.comment.length >= 100) {
					notify.warn("备注信息不能超过100字，请重新输入！");
					return;
				}
				PubSub.publish("toDealControl",data);
			});
			//布控处理时点击图片查看大图
			jQuery(document).on("click", ".infowindow-down .alarm-image img,.select-person-image img", function() {
				//隐藏导航,bug[37719], add by zhangyu, 2015.10.25
                window.top.showHideNav("hide");

				var infowindow = jQuery(this).closest(".infowindow-down");

				var cadidataInf = []; //用来存储候选人信息，以便在弹出层下方显示
				var index = parseInt(activePeole.attr("data-index")); //当前选中的候选人的排列序号
				var cadidates = infowindow.find(".protect-person-info img"); //候选人图片
				jQuery(".icon_close").fadeIn();
				for (var i = 0; i < cadidates.length; i++) {
					jQuery.extend(cadidates.eq(i).data(), {
						"src": cadidates.eq(i).attr("src"),
						"handlestatus": cadidates.eq(i).attr("data-handlestatus")
					});
					cadidataInf.push(cadidates.eq(i).data());
				}
				var data = jQuery.extend({
					targetSrc: infowindow.find(".alarm-image img").attr("src")
				}, cadidataInf[index]);
				jQuery(".alarm-list-dialog.show_event_pic").html(self.template({
					checkAimPerson: true,
					data: data
				}));
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
					});
				};
				//弹出遮罩层
				jQuery(".checkAlarm_layout, .checkAlarm_layout_ifr, .alarm-list-dialog").removeClass("hidden");
				//初始化弹出框的位置
				jQuery(".alarm-list-dialog").css({
					left: ($(window).width() - 825)/2,
					top: ($(window).height() - 580) / 2,
					width: 825,
					height: 580
				});
				$('.pop_pic').find('img').load(function() {
					resizeImg($('.pop_pic'));
				});
				//工具条的选择状态也随之切换(有效1，无效2，未知3)
				var status = parseInt(cadidataInf[index].handlestatus);
				if (status !== 0) {
					jQuery(".alarm-list-dialog .pop_bottom .toolsBar i").removeClass("active");
					jQuery(".alarm-list-dialog .pop_bottom .toolsBar i:nth-of-type(" + status + ")").addClass("active");
				} else if (status === 0) {
					jQuery(".alarm-list-dialog .pop_bottom .toolsBar i").removeClass("active");
				}
				//绑定翻页查看图片事件
				self.bindTurnPage(cadidataInf, index);
			});
			//关闭查看大图
			jQuery(document).on("click", ".checkAlarm_layout, .checkAlarm_layout_ifr, .alarm-list-dialog .pop_bottom .pop_close", function() {
				//隐藏导航,bug[37719], add by zhangyu, 2015.10.25
                window.top.showHideNav("show");

				jQuery(".checkAlarm_layout, .checkAlarm_layout_ifr, .alarm-list-dialog").addClass("hidden");
			});
		},
		/**
		 * 布控报警弹出层查看候选人翻页事件
		 * @author chengyao@date   2014-10-29
		 * @param  {[arr]}   cadidataInf [候选人信息]
		 * @param  {[num]}   current     [当前候选人在数组中的位置,0表示第一张]
		 */
		bindTurnPage: function(cadidataInf, current) {
			var self = this;
			//如果候选人只有一个，按键置灰
			if(cadidataInf.length === 1){
				jQuery(".turnPrev, .turnNex").addClass("forbidden");
			}
			//如果当前候选人是第一个，则前翻按键置灰
			if (current === 0) {
				jQuery(".turnPrev").addClass("forbidden");
			}
			//如果当前候选人是最后一个，则后翻按键置灰
			if (current + 1 === cadidataInf.length) {
				jQuery(".turnNex").addClass("forbidden");
			}
			jQuery(".alarm-list-dialog .imgItem i").off("click").on("click", function(eve) {
				eve.stopPropagation();
				var This = jQuery(this);
				if (This.hasClass("turnNex")) { //翻到下一页
					if (current + 1 < cadidataInf.length) {
						//取消向上翻页的forbidden
						This.siblings(".turnPrev").removeClass("forbidden");
						//切换候选人图片
						jQuery(".alarm-list-dialog .imgItem .cadidate").attr("src", cadidataInf[current + 1].src);
						//切换底部信息栏
						jQuery(".alarm-list-dialog .pop_bottom").html(self.template({
							checkAimPerson: true,
							turnPage: true,
							data: cadidataInf[current + 1]
						}));
						//工具条的选择状态也随之切换(有效1，无效2，未知3)
						var status = parseInt(cadidataInf[current + 1].handlestatus===""?0:cadidataInf[current + 1].handlestatus);
						if (status !== 0) {
							jQuery(".alarm-list-dialog .pop_bottom .toolsBar i").removeClass("active");
							jQuery(".alarm-list-dialog .pop_bottom .toolsBar i:nth-of-type(" + status + ")").addClass("active");
						} else if (status === 0) {
							jQuery(".alarm-list-dialog .pop_bottom .toolsBar i").removeClass("active");
						}
						current++;
						if (current+1 === cadidataInf.length) {
							This.addClass("forbidden");
						}
					}else{
						notify.warn("当前嫌疑人已为最后一位嫌疑人");
					}
				} else { //翻回上一页
					if (current - 1 >= 0) {
						This.siblings(".turnNex").removeClass("forbidden");
						//切换候选人图片
						jQuery(".alarm-list-dialog .imgItem .cadidate").attr("src", cadidataInf[current - 1].src);
						//切换底部信息栏
						jQuery(".alarm-list-dialog .pop_bottom").html(self.template({
							checkAimPerson: true,
							turnPage: true,
							data: cadidataInf[current - 1]
						}));
						//工具条的选择状态也随之切换(有效1，无效2，未知3)
						var status = parseInt(cadidataInf[current - 1].handlestatus===""?0:cadidataInf[current - 1].handlestatus);
						if (status !== 0) {
							jQuery(".alarm-list-dialog .pop_bottom .toolsBar i").removeClass("active");
							jQuery(".alarm-list-dialog .pop_bottom .toolsBar i:nth-of-type(" + status + ")").addClass("active");
						} else if (status === 0) {
							jQuery(".alarm-list-dialog .pop_bottom .toolsBar i").removeClass("active");
						}
						current--;
						if (current === 0) {
							This.addClass("forbidden");
						}
					}else{
						notify.warn("当前嫌疑人是第一位嫌疑人");
					}
				}
				/**var resizeImg = function(node) {
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
						console.log(img.width+"/"+imgParent.height);
						console.log(imgParent.width+"/"+img.height);
						if(img.height > imgParent.height || img.width > imgParent.width){
							img.ratio >= imgParent.ratio ? $img.width(imgParent.width) : $img.height(imgParent.height);
						}
						$img.css('margin-top',$img.height()/2 - $img.height() );
					});
				};
				**/
				//切换时重新写原始比例算法，以前的有点小bug
				var resizeImg = function(maxWidth,maxHeight,src,$obj){
					$obj.css({
						marginTop:0,
						width:0,
						height:0
					})
					var img = new Image();
					img.onload = function(){
						var hRatio,
						wRatio,
						Ratio = 1,
						w = img.width,
						h = img.height,
						parW = $obj.parent('.imgItem').width(), parH = $obj.parent('.imgItem').height();
						wRatio = maxWidth / w;
						hRatio = maxHeight / h;
						if (maxWidth == 0 && maxHeight == 0) {
							Ratio = 1;
						} else if (maxWidth == 0) { //
							if (hRatio < 1) Ratio = hRatio;
						} else if (maxHeight == 0) {
							if (wRatio < 1) Ratio = wRatio;
						} else if (wRatio < 1 || hRatio < 1) {
							Ratio = (wRatio <= hRatio ? wRatio : hRatio);
						}
						if (Ratio < 1) {
							w = w * Ratio;
							h = h * Ratio;
						}
						$obj.css({
							left:0,
							top:(parH-h)/2+"px"
						});
						$obj.width(w);
						$obj.height(h);
					}
					img.src =src;
				};
				
				resizeImg(360,480,cadidataInf[current].src,$('.pop_pic .imgItem:eq(1)').find('img'));
				
			});
		}
	};
	return new view();
});