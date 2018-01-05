/**
 * 地图上报警
 * @author Li Dan
 * @date   2014-12-15
 */
define([
	"js/npmap-new/map-common",
	"js/npmap-new/map-variable",
	"js/npmap-new/map-infowindow",
	"js/npmap-new/view/map-infowindow-view",
	"js/npmap-new/map-common-overlayer-ctrl",
	"pubsub",
	"thickbox"
], function(commonFun, Variable, InfoWindow, MapInfoWindow, MapOverLayerCtrl, pubsub) {

		var AlarmView = function() {};

		AlarmView.prototype = {
			/**
			 * 地图工具栏上报警信息按钮的点击响应程序
			 * @author Li Dan
			 * @date   2014-12-15
			 * @return {[type]}   [description]
			 */
			showOrHideAlarmInfos: function(scope) {
				var self = this;
				//如果已经显示，则隐藏
				if (jQuery(scope).is(".show")) {
					//图层切换
					MapOverLayerCtrl.showAndHideOverLayers("click-map-toor-bar-hide-alarm");
					//按钮样式修改
					jQuery(scope).removeClass("active show");
				} else { //否则显示
					//按钮样式修改
					jQuery(scope).addClass("active show");
					//图层切换
					MapOverLayerCtrl.showAndHideOverLayers("click-map-toor-bar-show-alarm");
					//获取报警信息
					self.getAlarmInfo();
				}
			},
			/**
			 * 获取报警信息
			 * @author Li Dan
			 * @date   2014-12-15
			 * @return {[type]}   [description]
			 */
			getAlarmInfo: function() {
				var self = this;
				//获取地图范围坐标
				var extent = Variable.map.getExtent();
				var leftTopPoint = extent.sw;
				var rightBottomPoint = extent.ne;
				var x1 = leftTopPoint.lon;
				var y1 = leftTopPoint.lat;
				var x2 = rightBottomPoint.lon;
				var y2 = rightBottomPoint.lat;
				//获取视野范围内的报警信息
				var data = {
						x1: x1,
						x2: x2,
						y1: y1,
						y2: y2
					}
					//发布事件 获取视野范围内报警信息
				pubsub.publish("getAlarmInfoInScreen1", data);
			},
			/**
			 * 显示报警信息在地图上
			 * @author Li Dan
			 * @date   2014-12-15
			 * @param  {[type]}   result [description]
			 */
			setAlarmInfoToMap: function(result) {
				var self = this;
				var len = result.data.list.length;
				if(len > 0){
					for (var i = 0; i < len; i++) {
						if (result.data.list[i].longitude && result.data.list[i].latitude) {
							var Point = new NPMapLib.Geometry.Point(parseFloat(result.data.list[i].longitude), parseFloat(result.data.list[i].latitude));
							var symbol = new NPMapLib.Symbols.Icon("/module/common/images/map/showalarm.png", new NPMapLib.Geometry.Size(30, 30));
							//标注
							var alarmMarker = new NPMapLib.Symbols.Marker(Point);
							alarmMarker.setIcon(symbol);
							alarmMarker.setData(result.data.list[i]);
							Variable.layers.alarmInfo.addOverlay(alarmMarker);
							//绑定点击事件
							alarmMarker.addEventListener(NPMapLib.MARKER_EVENT_CLICK, function(point) {
								var id = point._data.cameraId;
								//获取报警详细信息
								self.getAlarmDetailInfo(point._position, id);
							});
						}
					}
				}else{
					notify.info("当前视野内没有报警信息！");
				}
			},
			// 获取报警详情信息
			getAlarmDetailInfo: function(Point, id) {
				var self = this,
					currentPage = 1;
				//发布获取报警详情订阅
				pubsub.publish("getAlarmDetailInfo", {
					id: id,
					currentPage: currentPage,
					point: Point
				});
			},
			/**
			 * 设置报警详细信息
			 * @author Li Dan
			 * @date   2014-12-15
			 * @param  {[type]}   result [description]
			 */
			setAlarmDetailInfo: function(result, Point) {
				var self = this;
				//记录日志
				logDict.insertLog("m1", "f2", "o4", "b15", result.data.event.deployEvent.cameraName + '点位');
				//获取模板
				MapInfoWindow.showWindow(jQuery.extend(result.data, { position: Point}), "alarm", function() {
					self.bindEventsOnMapInfowinShow(result.data);
				});
			},
			/**
			 * 报警信息窗展现之后，进行数据绑定操作
			 */
			bindEventsOnMapInfowinShow: function(data) {
				//显示图片
				var htmlImg = "";
				var ImgList = data.event.deployEvent.imgInfo;
				var len = ImgList.length;
				if (len > 1) {
					for (var i = 0; i < len; i++) {
						if (i === 0) {
							htmlImg += "<a class='thickbox' href='" + ImgList[i] + "'><img src='" + ImgList[i] + "'></a>";
						} else {
							htmlImg += "<a class='thickbox' href='" + ImgList[i] + "' style='display:none'><img src='" + ImgList[i] + "' ></a>";
						}
					}
				} else if (len === 1) {
					htmlImg = "<a class='thickbox' href='" + ImgList[0] + "'><img src='" + ImgList[0] + "'></a>";
				} else {
					htmlImg = "<a class='thickbox' href='/module/common/images/nopic.jpg'><img src='/module/common/images/nopic.jpg'></a>";
				}
				jQuery("#alarm-events-content .event-image").html(htmlImg);
				//查看大图
				window.thickbox();
				//绑定事件
				//编辑按钮
				this.bindEditAlarmInfo();
				//获取上一个下一个报警
				this.getNextOrPreAlarm();
				this.bindSelectEvent();
			},
			
			/**
			 * 绑定报警编辑事件
			 * @author Li Dan
			 * @date   2014-12-15
			 * @return {[type]}   [description]
			 */
			
			bindEditAlarmInfo: function() {
				var self = this;
				// 点击编辑按钮显示编辑部分
				jQuery(".infowindow-title .closeBtn").off("click").on("click", function() {
					window.infowindow.closeInfoWindow();
				});
				// 点击编辑按钮显示编辑部分
				jQuery(".infowindow-title .alarm-mark-deal").off("click").on("click", function() {
					if (jQuery(this).is(".showInfo")) {
						jQuery(this).removeClass("showInfo");
						InfoWindow.setSize({height: 330});
						jQuery(this).closest("#mapId").find(".alarm-event-mark").slideUp("fast");
					} else {
						jQuery(this).addClass("showInfo");
						InfoWindow.setSize({height: 460});
						jQuery(this).closest("#mapId").find(".alarm-event-mark").slideDown("fast", function() {
							self.bindGiveEvent();
						});
					}
				});
			},
			/**
			 * 绑定报警处理按钮事件
			 */
			bindGiveEvent: function() {
				// 点击有效和无效
				jQuery("#dealAlarm,#cancelAlarm").off("click").on("click", function(e) {
					e.stopPropagation();
					var name = jQuery("#alarm-event-top").text();
					var dom = jQuery(this);
					dom.closest("#mapId").find(".infowindow-title .alarm-mark-deal").show();
					var level = jQuery(this).closest(".alarm-event-mark").find("span.text").attr("level-type");
					var status = dom.attr("data-level");
					if (dom.closest(".alarm-event-mark").find("textarea").val().length > 100) {
						notify.warn("备注内容不能超过100个字符！");
						return false;
					}
					// 重新给等级赋值
					var levelText = "";
					if (level === "1") {
						levelText = "一般";
					} else if (level === "2") {
						levelText = "重要";
					} else if (level === "3") {
						levelText = "严重";
					}
					// 重新给处理状态赋值
					var statusText = "";
					if (status === "1") {
						statusText = "有效";
					} else {
						statusText = "无效";
					}
					var comment = jQuery(this).closest(".alarm-event-mark").find(".event-mark-text").val();
					var id = jQuery(this).closest("#alarm-events-content").attr("data-id");
					var dealStatus = jQuery(this).attr("data-level");
					var data={
						id: id,
						comment: comment,
						name:name,
						level: level,
						value: dealStatus,
						obj: dom,
						levelText: levelText,
						statusText: statusText
					}
					pubsub.publish("dealAlarmEvent1", data);
				});
			},
			/**
			 * 报警处理后的刷新页面
			 * @param result - 接口返回对象
			 * @param dom - dom对象
			 * @param dealStatus - 报警处理的状态标示
			 * @param levelText - 报警处理的等级描述
			 * @param statusText - 报警处理的状态描述
			 */
			refreshOnDealAlarm: function(result, name,dom, dealStatus, levelText, statusText){
				if (result.code === 200) {
					notify.success("报警处理成功！");
					logDict.insertLog("m1", "f2", "o16", "b15", name + '点位');
					InfoWindow.setSize({height: 330});
					jQuery(".infowindow-title .alarm-mark-deal").removeClass("showInfo");
					dom.closest("#mapId").find(".alarm-event-mark").css({
						"display": "none"
					});
					dom.closest(".operate").find(".alarm-event-detail .event-status #status").removeClass();
					dom.closest(".operate").find(".alarm-event-detail .event-status #status").addClass("status" + dealStatus);
					dom.closest(".operate").find(".alarm-event-detail .event-status #status").html(statusText);
					dom.closest(".operate").find(".alarm-event-detail .event-level .level").html(levelText);
					if (levelText === "重要") {
						dom.closest(".operate").find(".alarm-event-detail .event-level .level").removeClass("level2");
						dom.closest(".operate").find(".alarm-event-detail .event-level .level").removeClass("level3");
						dom.closest(".operate").find(".alarm-event-detail .event-level .level").addClass("level2");
					} else if (levelText === "严重") {
						dom.closest(".operate").find(".alarm-event-detail .event-level .level").removeClass("level3");
						dom.closest(".operate").find(".alarm-event-detail .event-level .level").removeClass("level2");
						dom.closest(".operate").find(".alarm-event-detail .event-level .level").addClass("level3");
					} else {
						dom.closest(".operate").find(".alarm-event-detail .event-level .level").removeClass("level3");
						dom.closest(".operate").find(".alarm-event-detail .event-level .level").removeClass("level2");
					}
					// if(dealStatus === "2"){
					// 	dom.closest(".operate").find(".alarm-event-level .text").html("报警等级--一般");
					// }
				} else if (result.code === 500) {
					notify.error(result.data.message);
				} else {
					notify.error("获取数据异常！");
				}
			},
			/**
			 * 点击查看下一个和上一个报警信息
			 * @author Li Dan
			 * @date   2014-12-15
			 * @return {[type]}   [description]
			 */
			getNextOrPreAlarm: function() {
				var self = this;
				jQuery("#alarm-events-content .pre,#alarm-events-content .next").on("click", function() {
					var type = jQuery(this).attr("data-disc");
					var alarmId = jQuery(this).attr("data-id");
					var id = jQuery(this).closest("#mapId").find("#alarm-event-top").attr("data-cameraid");
					var data = {
						"id": id,
						"currentPage": type === "pre" ? parseInt(jQuery(this).attr("data-currentpage")) + 1 : 1,
						"type": type,
						"alarmId": alarmId
					};
					//发布获取上一个或者下一个报警 订阅
					pubsub.publish("getPreOrNextAlarmDetailInfo1", data);
				});
			},
			/**
			 * 设置上一个或者下一个报警信息
			 * @author Li Dan
			 * @date   2014-12-16
			 * @param  {[type]}   result [description]
			 */
			setPreOrNextAlarmDetail: function(result, type, alarmId) {
				if (result.data.event.deployEvent) {
					/**
					 * 先判断是不是点击下一个，如果是则和用当前的报警id和取过来的id比较，如果一样说明已经是最后一条
					 * 这个不能删除，因为后台没有处理，点击下一条的时候总会给过来数据，不会给你提示是最后一条数据。
					 */
					if (type !== "pre") {
						if (alarmId == result.data.event.deployEvent.id) {
							notify.info("该条已经是最后一条报警信息，暂无下一条报警信息!");
							return false;
						}
					}
					//记录日志
					logDict.insertLog("m1", "f2", "o4", "b15", result.data.event.deployEvent.cameraName + '点位');
					//渲染模板
					var content = Variable.template({
						alarmInfo: {
							"info": result.data
						}
					});
					//设置窗口内容
					InfoWindow.setContent(content);
					//设置窗口高度
					InfoWindow.setSize({height: 330});
					// imgUrls是一个List不能渲染，单独拿出来进行渲染
					var htmlImg = "";
					var ImgList = result.data.event.deployEvent.imgInfo;
					var len = ImgList.length;
					if (len > 1) {
						for (var i = 0; i < len; i++) {
							if (i === 0) {
								htmlImg += "<a class='thickbox' href='" + ImgList[i] + "'><img src='" + ImgList[i] + "'></a>";
							} else {
								htmlImg += "<a class='thickbox' href='" + ImgList[i] + "' style='display:none'><img src='" + ImgList[i] + "' ></a>";
							}
						}
					} else if (len === 1) {
						htmlImg = "<a class='thickbox' href='" + ImgList[0] + "'><img src='" + ImgList[0] + "'></a>";
					} else {
						htmlImg = "<a class='thickbox' href='/module/common/images/nopic.jpg'><img src='/module/common/images/nopic.jpg'></a>";
					}
					jQuery("#alarm-events-content .event-image").html(htmlImg);
					window.thickbox();
					//编辑按钮
					this.bindEditAlarmInfo();
					//获取上一个下一个报警
					this.getNextOrPreAlarm();
					this.bindSelectEvent();
				} else {
					if (type === "pre") {
						notify.info("该条已经是第一条报警信息，暂无上一条报警信息!");

					} else {
						notify.info("该条已经是最后一条报警信息，暂无下一条报警信息!");
					}
				}
			},
			//倒三角下拉数据
			bindSelectEvent: function() {
				// 点击倒三角显示下拉框
				jQuery("#alarm-events-content .alarm-event-level span.down, #alarm-events-content .alarm-event-level span.text").on("click", function() {
					if (jQuery(this).is(".downok")) {
						jQuery(this).closest(".alarm-event-level").find(".text,.down").removeClass("downok");
						jQuery(".level-list1").hide();
					} else {
						//移动下拉列表到div下方
						var divPosition = jQuery(this).closest(".alarm-event-level").position();
						jQuery(this).closest(".alarm-event-level").find(".text,.down").addClass("downok");
						//定位下拉列表并显示	
						jQuery(".level-list1").slideDown("fast");
						//下拉列表项的点击事件
						jQuery(".level-list1 li").each(function() {
							//给每一个列表项绑定点击事件
							jQuery(this).on("click", function() {
								var selectValue = jQuery(this).html(),
									levelTypeId = jQuery(this).attr("level-type");
								jQuery("#alarm-events-content .alarm-event-level span.down, #alarm-events-content .alarm-event-level span.text").addClass("downok");
								//隐藏下拉列表
								jQuery(".level-list1").hide();
								//设置选中值
								jQuery(".alarm-event-mark .alarm-event-level .text").html(selectValue).attr("level-type", levelTypeId);
							});
						});
						//下拉列表的鼠标移入移出事件
						jQuery(".level-list1").hover(function() {}, function() {
							jQuery("#alarm-events-content .alarm-event-level span.down, #alarm-events-content .alarm-event-level span.text").removeClass("downok");
							jQuery(".level-list1").hide();
						});
					}
				});
			}
		};

		return new AlarmView();
	});