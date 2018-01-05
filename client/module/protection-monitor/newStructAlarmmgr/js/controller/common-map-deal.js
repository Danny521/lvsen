/**
 * Created by Leon.z on 2015/9/17.
 * 报警管理中-报警处理相关逻辑
 */
define([
	'../model/alarm-mapModel.js',
	'js/global-varibale',
	'pubsub',
	'jquery',
	'../view/common-task-view',
], function(model, _g, PubSub, jQuery, commonView) {
	var alarmDeal = function() {
		var self = this;
		//订阅事件-绑定布防处理弹出信息窗上的事件
		PubSub.subscribe("toDealPersonEvents", function() {
			self.toDealPersonEvents();
		});
	};

	alarmDeal.prototype = {
		/**
		 * 布控处理面板的事件绑定 by chengyao
		 */
		toDealPersonEvents: function() {
			var self = this;
			var params = {};
			var activePeole = null; //当前选中的候选人
			//点击候选人图片
			jQuery(".protect-person-info .image-detail img").off("click").on("click", function() {
				jQuery(".protect-person-info .image-detail img").removeClass("active");
				jQuery(this).addClass("active");
				activePeole = jQuery(this);
				var data = jQuery.extend(activePeole.data(), {
					"description": activePeole.attr("data-description")
				});
				params = { //保存参数
					id: data.personid,
					dealStatus: data.handlestatus
				};
				//切换候选人时，工具条的选择状态也随之切换(有效1，无效2，未知3)
				var status = parseInt(activePeole.attr("data-handlestatus") === "" ? 0 : activePeole.attr("data-handlestatus"));
				if (status !== 0) {
					activePeole.closest(".infowindow-alarm-mgr").find(".infowindow-down .image-tools i").removeClass("active");
					activePeole.closest(".infowindow-alarm-mgr").find(".infowindow-down .image-tools i:nth-of-type(" + status + ")").addClass("active");
				} else if (status === 0) {
					activePeole.closest(".infowindow-alarm-mgr").find(".infowindow-down .image-tools i").removeClass("active");
				}
				//切换候选人时，旁边的候选人信息随之切换
				jQuery(".litter-info").html(_g.compiler({
					candidate: data
				}));
				jQuery(".select-person-image img").attr("src", jQuery(this).attr("src"));
			});
			//将候选人图片右下角的图标也绑定点击图片事件
			jQuery(".protect-person-info .image-detail i").on("click", function() {
				jQuery(this).siblings("img").click();
			});
			//点击处理工具条
			jQuery(".infowindow-down .image-tools i").off().on("click", function() {
				var This = jQuery(this);
				var peopleList = This.closest(".infowindow-alarm-mgr").find(".person-images .image-detail");
				//判断图片中是否有处理状态为有效的候选人以及当前选中的候选人
				var isRight = false;
				for (var i = 0; i < peopleList.size(); i++) {
					if (jQuery(peopleList[i]).find("i").hasClass("right")) {
						isRight = true;
						break;
					}
				}
				jQuery(".infowindow-down .image-tools i").removeClass("active");
				if (This.hasClass("right")) {
					if (isRight) {
						notify.warn("已经有一个有效的候选人，请选择其他处理状态！");
						return;
					}
				}
				This.addClass("active");
			});
			//点击保存
			jQuery(".infowindow-down .save-select-person").off("click");
			jQuery(".infowindow-down .save-select-person").on("click", function() {
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
					"_method": "put",
					"id": jQuery(this).closest(".infowindow-alarm-mgr").attr("data-id"),
					"personId": params.id,
					"value": params.dealStatus,
					"comment": This.closest(".infowindow-alarm-mgr").find(".select-person-info textarea").val()
				}
				if (data.comment.length >= 100) {
					notify.warn("备注信息不能超过100字，请重新输入！");
					return;
				}

				model.PostSelectPerson(data).then(function(res) {
					if (res.code === 200 && res.data.dealStatus !== undefined) {
						//改变图片下角图标
						activePeole.siblings("i").removeClass().addClass(params.iconStatus);
						//改变左侧列表上的状态
						var dealStatus = "";
						switch (res.data.dealStatus) {
							case 0:
								dealStatus = "未处理";
								break;
							case 1:
								dealStatus = "有效";
								break;
							case 2:
								dealStatus = "无效";
								break;
							case 3:
								dealStatus = "未知";
								break;
						}
						//保存成功之后修改当前选中的候选人的data-handlestatus，以便在切换候选人时工具条切换使用
						if (statusDom.hasClass("right")) {
							activePeole.attr({
								"data-handlestatus": "1",
								"data-description": data.comment
							});
						} else if (statusDom.hasClass("wrong")) {
							activePeole.attr({
								"data-handlestatus": "2",
								"data-description": data.comment
							});
						} else if (statusDom.hasClass("unknow")) {
							activePeole.attr({
								"data-handlestatus": "3",
								"data-description": data.comment
							});
						}
						//更新报警数据缓存状态，已经联动右侧报警列表状态

						jQuery(".content-alarms-list li.alarm-info-content[data-id=" + data.id + "]").find(".alarm-details span .status").html(dealStatus);

						self.changeCacheStatus(data, false, res.data.dealStatus);
						//改变按钮
						notify.success("报警处理成功！");
					} else {
						notify.warn("处理失败！");
					}
				});
			});
			//点击信息窗上，查看大图事件
			jQuery(".infowindow-alarm-mgr .alarm-image img,.infowindow-alarm-mgr .select-person-image img").on("click", function() {
				//隐藏导航,bug[37719], add by zhangyu, 2015.10.25
				window.top.showHideNav("hide");
				var infowindow = jQuery(this).closest(".infowindow-alarm-mgr");
				if (infowindow.find(".infowindow-down .alarm-image").hasClass("protect")) { //布控图片查看
					var cadidataInf = []; //用来存储候选人信息，以便在弹出层下方显示
					var index = parseInt(activePeole.attr("data-index")); //当前选中的候选人的排列序号
					var cadidates = infowindow.find(".protect-person-info img"); //候选人图片
					for (var i = 0; i < cadidates.length; i++) {
						jQuery.extend(cadidates.eq(i).data(), {
							"src": cadidates.eq(i).attr("src"),
							"handlestatus": cadidates.eq(i).attr("data-handlestatus")
						});
						cadidataInf.push(cadidates.eq(i).data());
					}
					var data = jQuery.extend({
						targetSrc: "/service/defence/image?id=" + infowindow.attr("data-id") || infowindow.find(".infowindow-down .alarm-image img").attr("src")
					}, cadidataInf[index]);

					commonView.checkImg(cadidataInf, data, index); //修改by wangxiaojun
					//绑定翻页查看图片事件
					self.bindTurnPage(cadidataInf, index);
				}
			});
			//关闭查看大图
			jQuery(document).on("click", ".checkAlarm_layout, .checkAlarm_layout_ifr, .alarm-list-dialog .pop_bottom .pop_close", function() {
				//隐藏导航,bug[37719], add by zhangyu, 2015.10.25
				window.top.showHideNav("show");
				//关闭预览弹出层
				jQuery(".checkAlarm_layout, .checkAlarm_layout_ifr, .alarm-list-dialog").addClass("hidden");
			});
		},
		/**
		 * 地图上布控报警弹出层查看候选人翻页事件
		 * @author chengyao@date   2014-10-29
		 * @param  {[arr]}   cadidataInf [候选人信息]
		 * @param  {[num]}   current     [当前候选人在数组中的位置,0表示第一张]
		 */
		bindTurnPage: function(cadidataInf, current) {

			//如果候选人只有一个，按键置灰
			if (cadidataInf.length === 1) {
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
				// view.checkAimPersonPage(This,cadidataInf,current);
				if (This.hasClass("turnNex")) { //翻到下一页
					if (current + 1 < cadidataInf.length) {
						//取消向上翻页的forbidden
						This.siblings(".turnPrev").removeClass("forbidden");
						//切换候选人图片
						jQuery(".alarm-list-dialog .imgItem .cadidate").attr("src", cadidataInf[current + 1].src);
						//切换底部信息栏
						jQuery(".alarm-list-dialog .pop_bottom").html(_g.compiler({
							checkAimPerson: true,
							turnPage: true,
							data: cadidataInf[current + 1]
						}));
						//工具条的选择状态也随之切换(有效1，无效2，未知3)
						var status = parseInt(cadidataInf[current + 1].handlestatus === "" ? 0 : cadidataInf[current + 1].handlestatus);
						if (status !== 0) {
							jQuery(".alarm-list-dialog .pop_bottom .toolsBar i").removeClass("active");
							jQuery(".alarm-list-dialog .pop_bottom .toolsBar i:nth-of-type(" + status + ")").addClass("active");
						} else if (status === 0) {
							jQuery(".alarm-list-dialog .pop_bottom .toolsBar i").removeClass("active");
						}
						current++;
						if (current + 1 === cadidataInf.length) {
							This.addClass("forbidden");
						}
					} else {
						notify.warn("当前嫌疑人已为最后一位嫌疑人");
					}
				} else { //翻回上一页
					if (current - 1 >= 0) {
						This.siblings(".turnNex").removeClass("forbidden");
						//切换候选人图片
						jQuery(".alarm-list-dialog .imgItem .cadidate").attr("src", cadidataInf[current - 1].src);
						//切换底部信息栏
						jQuery(".alarm-list-dialog .pop_bottom").html(_g.compiler({
							checkAimPerson: true,
							turnPage: true,
							data: cadidataInf[current - 1]
						}));
						//工具条的选择状态也随之切换(有效1，无效2，未知3)
						var status = parseInt(cadidataInf[current - 1].handlestatus === "" ? 0 : cadidataInf[current - 1].handlestatus);
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
					} else {
						notify.warn("当前嫌疑人是第一位嫌疑人");
					}
				}
				//切换时重新写原始比例算法，以前的有点小bug
				var resizeImg = function(maxWidth, maxHeight, src, $obj) {
					$obj.css({
						marginTop: 0,
						width: 0,
						height: 0
					})
					var img = new Image();
					img.onload = function() {
						var hRatio,
							wRatio,
							Ratio = 1,
							w = img.width,
							h = img.height,
							parW = $obj.parent('.imgItem').width(),
							parH = $obj.parent('.imgItem').height();
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
							left: 0,
							top: (parH - h) / 2 + "px"
						});
						$obj.width(w);
						$obj.height(h);
					}
					img.src = src;
				};

				resizeImg(360, 480, cadidataInf[current].src, $('.pop_pic .imgItem:eq(1)').find('img'));

			});
		},
		/**
		 * 绑定信息窗上的事件
		 */
		mapInfowinEvents: function() {
			var self = this;
			//布控的处理面板需要加载第一张图片
			if (jQuery(".infowindow-alarm-mgr .infowindow-down").hasClass("protect")) {
				//人员布控报警处理事件绑定
				self.toDealPersonEvents();
				jQuery(".infowindow-alarm-mgr").find(".person-images .image-detail:first-child img").click();
			}
			//报警弹出层上-报警处理的点击事件
			jQuery(".infowindow-top .alarm-mark-deal").off("click").on("click", function() {

				//根据当前的报警处理类型，来伸展信息窗
				PubSub.publish("resizeInfoWindowOnDeal", {});
				_g.isPauseTaskPush = true; //暂时暂停右侧报警推送
				//人员布控报警处理事件绑定
				self.toDealPersonEvents();
				jQuery(this).closest(".infowindow-alarm-mgr").find(".person-images .image-detail:first-child img").click();
				//展开后隐藏处理图标
				jQuery(this).addClass("hidden");
			});
			//报警弹出层上-历史调阅的点击事件
			jQuery(".infowindow-top .alarm-video-play").off("click").on("click", function() {
				//显示历史调阅视频播放层
				var alarmInfo = {
					cameraId: jQuery(this).closest(".infowindow-alarm-mgr").attr("data-cameraid"),
					name: jQuery(this).closest(".infowindow-alarm-mgr").attr("data-name"),
					id: jQuery(this).closest(".infowindow-alarm-mgr").attr("data-id"),
					time: jQuery(this).closest(".infowindow-alarm-mgr").attr("data-time"),
					code: jQuery(this).closest(".infowindow-alarm-mgr").attr("data-cameracode"),
					rulename: jQuery(this).closest(".infowindow-alarm-mgr").attr("data-rulename"),
					taskname: jQuery(this).closest(".infowindow-alarm-mgr").attr("data-taskname"),
					alarmtype: jQuery(this).closest(".infowindow-alarm-mgr").attr("data-alarmtype")
				};
				PubSub.publish("playCameraHistory", {
					info: alarmInfo
				});
			});
			//弹出层的关闭点击事件
			jQuery(".infowindow-top .icon_mark_close").off("click").on("click", function() {
				//关闭弹出层
				PubSub.publishSync("closeInfoWindow", {});
				_g.PreventTaskPaush(false); //开启报警推送
				//根据当前处于的不同模式进行相应的处理
				if (_g.AlarmMgrOptions.curPageMode === "alarm-list-mode") {
					//清除地图上选中节点的图标样式
					if (_g.currentCameraMarker) {
						var currentMarker = _g.currentCameraMarker;
						currentMarker.setIcon(_g.symbols.alarmMarkerNormal());
						currentMarker.refresh();
					}
					//清除左侧列表上选中项的图标样式
					jQuery(".alarm-info-active").toggleClass("alarm-info-active").removeClass("li-active");

				} else {
					//清除地图上的摄像机标注
					_g.AlarmMgrOptions.layers.cameraVideoLayer.removeAllOverlays();
				}
				//清除当前活跃的点位信息
				_g.currentCameraMarker = null;
				//隐藏可能出现的报警级别下拉框
				jQuery(".alarmmgr.pubdiv").hide();
				jQuery(".alarmmgr.pubdiv").attr("data-type", "");
			});
			//报警等级点击事件
			jQuery(".alarm-deal .select_container[data-type='level-list']").off("click").on("click", function(event) {
				if (jQuery(".pubdiv[data-type='level-list']").is(":visible")) {
					jQuery(".alarmmgr.pubdiv").hide();
				} else {
					PubSub.publish("showPubListInfo", {
						obj: this
					});
				}
				//取消冒泡
				event.stopPropagation();
			});
			//事件列表触发点失去焦点时隐藏（如果是报警规则列表，则需要触发报警查询）
			jQuery(".infowindow-alarm-mgr").on("click", function() {
				//隐藏
				jQuery(".alarmmgr.pubdiv").hide();

			});
			//布防处理的点击事件
			jQuery(".alarm-deal .alarm-deal-operator .do").off("click").on("click", function() {
				var This = jQuery(this);
				_g.PreventTaskPaush(false); //开启报警推送
				var data = {
					"id": parseInt(This.closest(".infowindow-alarm-mgr").attr("data-id")),
					"value": This.attr("data-status"),
					"_method": "put",
					"comment": This.closest(".alarm-deal").find(" .alarm-comment textarea").val(),
					"level": This.closest(".alarm-deal").find(".alarm-level .select_container span:first-child").attr("data-value")
				};
				if (data.comment.length >= 100) {
					notify.warn("备注信息不能超过100字，请重新输入！");
					return;
				}
				//左侧树的点击/处理,根据当前报警的id，发送请求获取该报警的信息
				model.DealAlarmByAlarmId(data).then(function(res) { //success
					if (res.code === 200) {
						notify.success("报警处理成功！");
						//刷新信息窗
						PubSub.publish("showInfoWinOnMap", {
							index: -1,
							eventType: "click",
							alarmId: data.id
						});
					} else if (res.code === 500) {
						notify.error(res.data.message + "！ 错误码：" + res.code);
					} else {
						notify.error("报警处理失败！错误码：" + res.code);
					}
				});
				_g.AlarmMgrOptions.infowindow.setWidth(_g.curInfoWinIsMap ? 345 : 300);
				//隐藏设置区域
				jQuery(".infowindow-down .alarm-deal").addClass("alarm-hidden");
				//动态修改弹出框和左侧面板上的显示状态
				var status = This.html();
				var level = This.closest(".alarm-deal").find(".alarm-level .select_container span:first-child").html();
				This.closest(".infowindow-down").find(".alarm-details span .status").html(status).addClass("status-done");
				This.closest(".infowindow-down").find(".alarm-details span .level").html(level).addClass(self.getLevelClass(level));
				var tabDom = jQuery(".content-alarms-list li.alarm-info-content[data-id=" + data.id + "]");
				var currsTatus = data.value;
				//更新报警数据缓存状态，已经联动右侧报警列表状态
				self.changeCacheStatus(data, true, currsTatus);
				tabDom.find(".alarm-details span .status").html(status).addClass("status-done");
				tabDom.find(".alarm-details span .level").html(level).removeClass().addClass("level " + self.getLevelClass(level));
			});
			//查看布防时点击图片查看大图
			jQuery(".infowindow-alarm-mgr .alarm-image img").on("click", function() {
				var infowindow = jQuery(this).closest(".infowindow-alarm-mgr");
				if (!infowindow.find(".infowindow-down .alarm-image").hasClass("protect")) {
					var param = {
						imgTime: jQuery(this).closest('div.infowindow-alarm-mgr').attr("data-time"),
						faceImg: jQuery(this).attr("src"),
						index: 0,
						imgName: jQuery(this).closest('div.infowindow-alarm-mgr').attr("data-name")
					};
					if (jQuery("#major").attr("data-currpart") === "ocx") {
						jQuery("#ocxPanel").addClass('indetify');
					}
					//对接统一的查看图片插件
					_g.histNewimplent(param, function() {
						if (jQuery("#major").attr("data-currpart") === "ocx") {
							jQuery("#ocxPanel").removeClass('indetify');
						}
					})
				}
			});
		},
		//更新缓存的更新后状态
		changeCacheStatus: function(data, flag, status) {
			var ArrayUnique = function(objArray) {
				var re = [];
				for (var i in objArray) {

					if (objArray.hasOwnProperty(i)) {
						if (!objArray[i]) {
							continue;
						}
						if (re.indexOf(objArray[i].cId) == -1) {
							re.push(objArray[i].cId);
						}
					}

				}
				return re;
			};
			var screenIds = ArrayUnique(_g.curScreenCameraIds);
			if (screenIds.length > 0 && _g.curAlarmMode === "alarm-now-mode") {

				for (var i = 0, le = _g.currNowAlarmList.length; i < le; i++) {
					if (parseInt(_g.currNowAlarmList[i].content.id) === parseInt(data.id)) {
						if (status) {
							_g.currNowAlarmList[i].content.dealStatus = parseInt(status)
						} else {
							_g.currNowAlarmList[i].content.dealStatus = 1;
						}
						if (flag) {
							_g.currNowAlarmList[i].content.level = parseInt(data.level);
						}
						continue;
					}
				}
			} else {
				for (var i = 0, le = _g.currentAlarmListCache.length; i < le; i++) {
					if (parseInt(_g.currentAlarmListCache[i].content.id) === parseInt(data.id)) {
						if (status) {
							_g.currentAlarmListCache[i].content.dealStatus = parseInt(status)
						} else {
							_g.currentAlarmListCache[i].content.dealStatus = 1;
						}
						if (flag) {
							_g.currentAlarmListCache[i].content.level = parseInt(data.level);
						}
						continue;
					}
				}
			}


		},
		/**
		 * 根据等级获取对应的样式
		 */
		getLevelClass: function(level) {
			if (level === "一般") {
				return "level-one";
			} else if (level === "重要") {
				return "level-two";
			} else if (level === "严重") {
				return "level-thr";
			}
		}
	}
	return new alarmDeal();
});