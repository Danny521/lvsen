/**
 * Created by Zhangyu on 2014/12/11.
 * 布防任务保存相关展现逻辑
 */
define([
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js",
	"/module/protection-monitor/defencesetting/js/global-var.js",
	"/module/protection-monitor/defencesetting/js/controller/defence/third-arealist-controller.js",
	"pubsub",
	"jquery"
], function(DefenceTools, globalVar, areaListController, PubSub, jQuery) {
	var View = function () {};

	View.prototype = {
		/**
		 * 初始化函数
		 */
		init: function() {
			var self = this;

			self.bindEvents();
		},
		/**
		 * 事件绑定
		 */
		bindEvents: function() {
			var self = this;
			//当前事件规则设置保存事件
			jQuery("#RuleDetailSave").off("click").on("click", function (event) {
				if (jQuery(this).hasClass('disabled')) {
					return false;
				};
				jQuery(this).addClass('disabled');
				//取消冒泡
				event.stopPropagation();
				// 实时标注 单独处理
				if(parseInt(globalVar.defence.ruleInfo.options.curRuleId) === 268435456){
					startSmart();
					return false; 
				}

				//联动规则
				var linkOptions = [];
				var selector = jQuery(".rules .other-ganged input:checked");

				for (var i = 0; i < selector.length; i++) {
					linkOptions.push(parseInt(jQuery(selector[i]).attr("data-type")));
				}

				//触发任务保存事件
				PubSub.publish("saveCameraRuleDetail", {
					sensitivity: jQuery(".rules .slider_bar .bar.active").attr("data-value"),//灵敏度
					wduration: jQuery('.rules .event-alarm-time .speedSlider').slider('value'),//告警时间
					fdensity: jQuery('.rules .people-density .speedSlider1').slider('value'),//人群密度等级
					wspeed: jQuery(".fight-speed input").val(),//打架速度
					wchaos: jQuery(".fight-chaotic-rate input").val(),//大家混乱度
					fspeed: jQuery(".alarm-speed input").val(),//奔跑触发报警速度
					carflagw: jQuery(".car-flag-set input[name='carFlagW']").val(),
					carflagh: jQuery(".car-flag-set input[name='carFlagH']").val(),
					curstreamspeed: jQuery(".rules .people-car-stream-rate input").val(),
					level: jQuery(".alarm-events-rule-detail .event-alarm-level .bar.active").attr("data-level"),
					linkoptions: linkOptions.join(",")
				});
			});
			//当前事件规则设置删除事件
			jQuery("#RuleDetailDel").off("click").on("click", function () {
				//做兼容，ocx的层级太高会把弹窗挡住，所以在弹窗出现的时候影藏ocx. by wangxiaojun 2015-01-04
				document.getElementById("UIOCXDEFEND").style.marginLeft="-9999px";
				// jQuery(".content-down-video").css("margin-left","9999px");
				// document.getElementById("UIOCXDEFEND").ShowOrHideOCX(false);

				//提示是否删除
				setTimeout(function(){
					new ConfirmDialog({
						title: "删除布防任务",
						confirmText: "确定",
						message: "确定要删除当前的布防任务吗？",
						callback: function () {
							//做兼容，ocx的层级太高会把弹窗挡住，先影藏ocx,在弹窗关闭的时候显示ocx. by wangxiaojun 2015-01-04
							document.getElementById("UIOCXDEFEND").style.marginLeft="";
							// jQuery(".content-down-video").css("margin-left","");
							// document.getElementById("UIOCXDEFEND").ShowOrHideOCX(true);
							//触发任务保存事件
							PubSub.publish("delCameraRuleDetail", {});
						},
						prehide:function(){
							//做兼容，ocx的层级太高会把弹窗挡住，先影藏ocx,在弹窗关闭的时候显示ocx. by wangxiaojun 2015-01-04
							document.getElementById("UIOCXDEFEND").style.marginLeft="";
							// jQuery(".content-down-video").css("margin-left","");
							// document.getElementById("UIOCXDEFEND").ShowOrHideOCX(true);
						}
					});
				},100);
			});

			// 保存生成标注
            function startSmart() {
            	if (!$("#smartMarkform .type-mark input").is(":checked")) {
                    notify.warn("请选择类型！");
                    jQuery("#RuleDetailSave").removeClass('disabled');
                    return false;
                }

                if (areaListController.hasInvalidArea()) {
					notify.warn("存在超出视频范围的布防区域，布防任务保存失败");
					jQuery("#RuleDetailSave").removeClass("disabled");
					return false;
				}
				if($('.type-params-item [name="move-height"]').spinner("value") > globalVar.defence.ruleInfo.faceProtectInfo.maxSize || $('.type-params-item [name="move-height"]').spinner("value") < globalVar.defence.ruleInfo.faceProtectInfo.minSize){
					notify.warn("人脸尺寸不能超过设置范围！");
					jQuery("#RuleDetailSave").removeClass("disabled");
					return false;
				}
				if($('.type-params-item [name="face-minFace"]').spinner("value") > globalVar.defence.ruleInfo.humInfo.maxSize || $('.type-params-item [name="face-minFace"]').spinner("value") < globalVar.defence.ruleInfo.humInfo.minSize ){
					notify.warn("人员尺寸不能超过设置范围！");
					jQuery("#RuleDetailSave").removeClass("disabled");
					return false;
				}
                var params = {},startTime,endTime,faceSkip,humanSkip,humanSensitivity,carSkip,carFrameRate;
                // 运动目标
                startTime = Toolkit.str2mills($(".dataPicker .begin-time").val());
                endTime =Toolkit.str2mills($(".dataPicker .end-time").val())?Toolkit.str2mills($(".dataPicker .end-time").val()):"";

                faceSkip = $(".delicacyLevel").eq(0).find("span[data-delicacylevel='true']").text()==="低"?2:$(".delicacyLevel").eq(0).find("span[data-delicacylevel='true']").text()==="中"?1:$(".delicacyLevel").eq(0).find("span[data-delicacylevel='true']").text()==="高"?0:1;
                humanSkip = $(".delicacyLevel").eq(1).find("span[data-delicacylevel='true']").text()==="低"?2:$(".delicacyLevel").eq(1).find("span[data-delicacylevel='true']").text()==="中"?1:$(".delicacyLevel").eq(1).find("span[data-delicacylevel='true']").text()==="高"?0:1;
                humanSensitivity = $(".delicacyLevel").eq(1).find("span[data-delicacylevel='true']").text()==="低"?5:$(".delicacyLevel").eq(1).find("span[data-delicacylevel='true']").text()==="中"?3:$(".delicacyLevel").eq(1).find("span[data-delicacylevel='true']").text()==="高"?1:3;
                carSkip = $(".delicacyLevel").eq(2).find("span[data-delicacylevel='true']").text()==="低"?1:$(".delicacyLevel").eq(2).find("span[data-delicacylevel='true']").text()==="中"?1:$(".delicacyLevel").eq(2).find("span[data-delicacylevel='true']").text()==="高"?0:1;
                carFrameRate = $(".delicacyLevel").eq(2).find("span[data-delicacylevel='true']").text()==="低"?2:$(".delicacyLevel").eq(2).find("span[data-delicacylevel='true']").text()==="中"?1:$(".delicacyLevel").eq(2).find("span[data-delicacylevel='true']").text()==="高"?1:1;
                  // 人脸
                if ($("#type-mark-move").prop("checked")) {
                    params.face = {
                      	maxFace:400,
                        minFace:$('.type-params-item [name="move-height"]').spinner("value"),
                     	 // 跳桢数
                        skipFrames:faceSkip
                    };
                }
              	//人员
              
                if ($("#type-mark-face").prop("checked")) {
                    params.human = {

                        minHeight: $('.type-params-item [name="face-minFace"]').spinner("value")/2,

                        maxHeight: $('.type-params-item [name="face-minFace"]').spinner("value")*2,
                         // 灵敏度
                        sensitivity:humanSensitivity,
                        // 跳桢数
                        skipFrames:humanSkip
                    };
                }
               
                // 车辆
                if ($("#type-mark-car").prop("checked")) {
                    params.vehicle = {
                        // 融合帧数
                        integrationFrameRate:carFrameRate,
                        // 最小尺寸
                        minPlate:60,
                        // 最大尺寸
                        maxPlate: 400,
                        // 跳桢数
  						skipFrames:carSkip,
                        // 默认省
                        province: $('.type-params-item [name="car-defaultProvince"]').val(),
                      
                       
                    };
                }
                // 处理区域
                if (globalVar.defence.ruleInfo.procPolyData.length>0) {
                    var procPolyData = JSON.parse(JSON.stringify(globalVar.defence.ruleInfo.procPolyData));
                    params.roi = {
                        // 处理区域
                        procRgn: {
                            ploygon: self.getXY(self.filterData( procPolyData,'ploygon')[0].ploygon),
                            domid:globalVar.defence.ruleInfo.procPolyData[0].domid
                        }
                    };
                }
                // 屏蔽区域
                if (globalVar.defence.ruleInfo.shieldPolyData.length>0) {

                    var shieldPolydata = JSON.parse(JSON.stringify(globalVar.defence.ruleInfo.shieldPolyData));
                    params.roi = params.roi !== undefined ? params.roi : {};
                    params.roi.shieldRgn = [];
                    _.map(self.filterData(shieldPolydata, 'ploygon'),  function(item){
                        params.roi.shieldRgn.push({
                            ploygon: self.getXY(item.ploygon),
                            domid:item.domid
                        })
                    });
                }
                if(startTime && endTime && startTime>endTime){
                 	notify.warn("开始时间不能大于结束时间");
                 	jQuery("#RuleDetailSave").addClass('disabled');
                 	return false;
                }
                $.ajax({
                    url: "/service/defence/realTime/structure",
                    type: "post",
                    data: {
                    	"id":globalVar.defence.ruleInfo.options.curTaskId,
                        "channelId": globalVar.defence.cameraData ? globalVar.defence.cameraData.curChannelId : null,
                        "cameraId" : globalVar.defence.cameraData ? globalVar.defence.cameraData.id : null,
                        "params": JSON.stringify(params),
                        "startTime" :startTime,
                        "endTime" :endTime
                    },
                    dataType: "json",
                    success: function (res) {
                        if (res.code === 200) {
							notify.success("添加任务成功");
							//var $defenceWindow = jQuery("#defenceWindow");
							//做兼容，ocx的层级太高会把弹窗挡住，所以在弹窗出现的时候影藏ocx. by wangxiaojun 2015-01-04
							document.getElementById("UIOCXDEFEND").style.marginLeft = "-9999px";
							self.showFinish();
							// setTimeout(function() {
							// 	self.refreshOnReturnBack($defenceWindow);
							// 	jQuery(".rules_set span[data-id='" + _r.options.curRuleId + "']").attr("data-taskid", res.data.taskId);
							// 	jQuery(".rules_set span[data-id='" + _r.options.curRuleId + "']").addClass("active");
							// 	jQuery(".rules_set span[data-id='" + _r.options.curRuleId + "']").find("a").addClass("color-blue").removeClass("color-gray");
							// }, 100);
                        } else if (res.code === 500) {
                            notify.error(res.data.message);
                            jQuery("#RuleDetailSave").addClass('disabled');
                        } else {
                            notify.warn('标注失败! ' + (res ? res.code ? "状态码: " + res.code : "" : ""));
                            jQuery("#RuleDetailSave").addClass('disabled');
                        }
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                        if (xhr.status === 200) {
                            notify.warn('标注失败! 数据格式错误');
                        }
                        // 其它状态为HTTP错误状态
                        else {
                            (xhr.status !== 0) && notify.warn('智能标注失败! HTTP状态码: ' + xhr.status);
                        }
                        jQuery("#RuleDetailSave").addClass('disabled');
                    }
                });
            }
		},
		//过滤key为tye的对象数据
        filterData: function (arr, type) {
            var returnData = [];
            _.map(arr,  function(item){
                returnData.push({
                    'ploygon': item[type],
                    "domid":item.domid
                });
            })
            return returnData;
        },
		//获取区域坐标
        getXY: function (arr) {
			var returnData = [];
			_.map(arr, function(item) {
				returnData.push(DefenceTools.ruleLineOpera.coordinateSwitchForSmartDeal(item, DefenceTools.getCameraRate(), DefenceTools.getDrawRate()));
				/*returnData.push({
					x: item[0],
					y: item[1]
				});*/
			});
			return returnData;
		},
		/**
		 * 保存布防任务成功时更新算法列表
		 */
		updateRuleListOnSave: function(taskId) {
			var globalRuleInfo = globalVar.defence.ruleInfo;
			//页面跳转
			jQuery("#returnBackToRuleList").trigger("click", ["save-task"]);
			//刷新算法列表
			var $listItem = jQuery(".rules_set span[data-id='" + globalRuleInfo.options.curRuleId + "']");
			$listItem.attr("data-taskid", taskId).find("i").addClass(DefenceTools.getRuleIconById(parseInt(globalRuleInfo.options.curRuleId), taskId, 1));
			$listItem.find("a").addClass("color-blue").removeClass("color-gray");
			$listItem.addClass("active")
		},
		/**
		 * 删除布防任务成功时更新算法列表
		 */
		updateRuleListOnDel: function() {
			var globalRuleInfo = globalVar.defence.ruleInfo;
			//页面跳转
			jQuery("#returnBackToRuleList").trigger("click", ["del-task"]);
			//刷新算法列表
			var $listItem = jQuery(".rules_set span[data-id='" + globalRuleInfo.options.curRuleId + "']");
			$listItem.attr("data-taskid", 0).find("i").removeClass(DefenceTools.getRuleIconById(parseInt(globalRuleInfo.options.curRuleId), -1, 1)).addClass(DefenceTools.getRuleIconById(parseInt(globalRuleInfo.options.curRuleId), 0, 1));
			$listItem.find("a").removeClass("color-blue").addClass("color-gray");
			$listItem.removeClass("active");
		},
		/**
		 * [showFinish 布防任务创建成功后 显示第四步 完成  延迟1秒后 关闭设置窗口]
		 * @return {[type]} [description]
		 */
		showFinish: function() {
			var self = this;
			self.highLightStep("complete");
			setTimeout(function() {
				jQuery("#defence-setting-close").trigger("click");
			}, 3000);
		},
		/**
		 * [highLightStep 高亮顶部选择算法]
		 * @param  {[type]} num [description]
		 * @return {[type]}     [description]
		 */
		highLightStep: function(num) {
			var steps = [ "first", "second", "third", "complete" ],
				index = steps.indexOf(num) + 1;
			jQuery("#defence-setting-nav").find("li." + num + "-step").addClass("active").find("i.bar").addClass('active');
			// 点击上一步的时候，这里需要还原高亮的步骤
			for (; index < steps.length; index++) {
				jQuery("#defence-setting-nav").find("li." + steps[index] + "-step").removeClass("active").find("i.bar").removeClass('active');
			}
		}
	};

	return new View();
});
