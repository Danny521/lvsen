/**
 * Created by Zhangxinyu on 2016/3/31.
 * description 联动规则视图
 */
define([
	"jquery",
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-time-ctrl.js",
	"../cache.js",
	"../tree/cameraTree-init.js",
	"../model/main-model.js",
	"text!../../index.html"
], function(jQuery, timeTemplate, Cache, cameraTree, linkageModel, dialogLinkage) {

	'use strict';

	var linkageCtrl,
	    templateUrl = "/module/common/checkLinkage/inc/linkageTemp.html";

	var eventHandler = {
		//联动规则左侧tab切换处理事件
		clickLinkTabs: function() {
			var self = jQuery(this),
			    type = self.data("tab"),
			    $dom = jQuery(".popContent .popRight ." + type);
			self.addClass("active").siblings().removeClass("active");
			$dom.removeClass("disnone").siblings().addClass("disnone");
			switch (type) {
				case "pmessage":
				    linkageCtrl.renderCacheData(type);
					bindPmessageEvent();
					break;
				case "email":
				    linkageCtrl.renderCacheData(type);
					bindEmailEvent();
					break;
				case "message":
				    linkageCtrl.renderCacheData(type);
					bindMessageEvent();
					break;
				case "gis":
				    linkageCtrl.renderCacheData(type);
					bindGISEvent();
					break;
				case "mobile":
				    linkageCtrl.renderCacheData(type);
					bindMobileEvent();
					break;
				case "tvwall":
				    linkageCtrl.renderCacheData(type);
				    cameraTree.init(linkageCtrl,type);
					break;
				case "monitor":
				    linkageCtrl.renderCacheData(type);
				    cameraTree.init(linkageCtrl,type);
					break;
				case "ptz":
				    linkageCtrl.renderCacheData(type);
				    cameraTree.init(linkageCtrl,type);
					break;
			}
		},
		//关闭取消联动规则窗口
		clickClose: function() {
			Cache.clearCache(Cache.cloneData);
			jQuery("#popLayer, #popContainer").hide();
			jQuery("#PeopleTaskFrom .linkage-check").removeClass("disabled");
			jQuery("#defence-setting-sidebar .linkBtn").removeClass("disabled");
			document.getElementById("UIOCXDEFEND") && (document.getElementById("UIOCXDEFEND").style.visibility = "visible");
		},
		//保存联动规则数据
		clickSubmit: function() {
			setTimeArea();
			//清空缓存
		    Cache.clearCache(Cache.submitLinkageData);
			//数据合并
			jQuery.extend(true, Cache.submitLinkageData, Cache.cloneData);
			//清除临时缓存
			Cache.clearCache(Cache.cloneData);
            jQuery("#popLayer, #popContainer").hide();
			jQuery("#PeopleTaskFrom .linkage-check").removeClass("disabled");
			jQuery("#defence-setting-sidebar .linkBtn").removeClass("disabled");
			document.getElementById("UIOCXDEFEND") && (document.getElementById("UIOCXDEFEND").style.visibility = "visible");
		},
		//增加电话,邮箱(短信,邮箱联动)
		clickAdd: function(){
            var self = jQuery(this),
                type = self.siblings().data("type"),
                value = jQuery.trim(self.siblings(".add-input").val());
            if(!value){
            	return false;
            }
            addContent(type, value);
            //号码删除事件
            bindEvent(".add-result li");
		},
		//增加电话,邮箱(短信,邮箱联动) 回车
		enter: function(e) {
			if (e.keyCode === 13) {
				var self = jQuery(this),
					type = self.data("type"),
					value = jQuery.trim(self.val());
				if (!value) {
					return false;
				}
				addContent(type, value);
				//号码删除事件
				bindEvent(".add-result li");
			}
		},
		//短信，邮箱号码删除事件
		clickDelete: function(){
			removeElement(jQuery(this));
		},
		//短信通知时间相关事件
		clickChecked: function (){
			var self = jQuery(this),
			    type = self.data("type");
			switch (type) {
				case 'message':
					jQuery(".message").find("i").toggleClass("active");
                    Cache.cloneData.sendMessage = jQuery(".message .header").find("i").hasClass("active");
					break;
				case 'gis':
					jQuery(".gis").find("i").toggleClass("active");
                    Cache.cloneData.showGIS = jQuery(".gis").find("i").hasClass("active");
					break;
				case 'mobile':
					jQuery(".mobile").find("i").toggleClass("active");
                    Cache.cloneData.showMobile = jQuery(".mobile .header").find("i").hasClass("active");
					break;
				default:
					changeSmsTimeType(jQuery(this));
			}
		},
		//选择预置位
        selectPresets: function(){
            var node = jQuery(this).find(".radio"),
                cameraId = jQuery(this).data("cameraid"),
                id = jQuery(this).data("id"),
			    params = {};
            params = {
				camera_id: cameraId,
				preset_id: id,
				preset_name: jQuery(this).find(".inspectName").text(),
			};
			if (!node.hasClass('active')) {
				node.addClass('active').closest('li').siblings('li').find(".radio").removeClass("active");
				params.isAppend = true;
			} else {
				node.removeClass('active');
				params.isAppend = false;
			}
			linkageCtrl.renderCameraList("ptz", params);
			bindEvent(".ptz .mid-right .data-list .js-close, .ptz .mid-right .header");
        },
        //单个删除已选列表
        removeLi: function(){
        	var self = jQuery(this).closest("li"),
        	    cameraId = self.data("cameraid"),
        	    type = jQuery("#popContainer .popLeft .active").data("tab");
        	self.remove();

        	if(type === "ptz"){
                if(cameraId){
					Cache.cloneData.PTZCameraList = Cache.cloneData.PTZCameraList.filter(function(item) {
						return parseInt(item.camera_id) !== parseInt(cameraId);
					});
					jQuery(".mid-center .data-list li[data-cameraid='" + cameraId + "']").find(".radio").removeClass('active');
				    jQuery(".ptz .header").find("em").text(Cache.cloneData.PTZCameraList.length);
				    if(Cache.cloneData.PTZCameraList.length === 0){
				    	jQuery(".ptz .header .delete-all").addClass("disnone");
				    }
                }
        	}
        	if(type === "monitor"){
                if(cameraId){
                	Cache.cloneData.monitorCameraList = Cache.cloneData.monitorCameraList.filter(function(item) {
						return parseInt(item.camera_id) !== parseInt(cameraId);
					});
					jQuery("#cameraTreeList li[data-id='"+cameraId+"']").find(".radio-leaf").removeClass("active");
				    jQuery(".monitor .header").find("em").text(Cache.cloneData.monitorCameraList.length);
				    if(Cache.cloneData.monitorCameraList.length === 0){
				    	jQuery(".monitor .header .delete-all").addClass("disnone");
				    }
                }
        	}
        	if(type === "tvwall"){
        		if(cameraId){
        			Cache.cloneData.tvwallList = Cache.cloneData.tvwallList.filter(function(item) {
						return parseInt(item.camera_id) !== parseInt(cameraId);
					});
					jQuery("#cameraTreeList li[data-id='"+cameraId+"']").find(".radio-leaf").removeClass("active");
				    jQuery(".tvwall .header").find("em").text(Cache.cloneData.tvwallList.length);
				    if(Cache.cloneData.tvwallList.length === 0){
				    	jQuery(".tvwall .header .delete-all").addClass("disnone");
				    }
        		}
        	}
        },
        //已选列表全部清除
        removeAll: function(){      	
        	var type = jQuery(".popLeft li.active").data("tab");
        	if(type === "ptz"){
                Cache.cloneData.PTZCameraList.length = 0;
                jQuery(".ptz .mid-right").find(".data-list li").remove();
        	    jQuery(".ptz .mid-right").find(".delete-all").addClass("disnone");
        	    jQuery(".ptz .mid-right .header").find("em").text("0");
        	    jQuery(".mid-center .data-list .js-left").find(".radio").removeClass("active");
        	}
        	if(type === "monitor"){
                Cache.cloneData.monitorCameraList.length = 0;
                jQuery(".monitor .mid-right").find(".data-list li").remove();
        	    jQuery(".monitor .mid-right").find(".delete-all").addClass("disnone");
        	    jQuery(".monitor .mid-right .header").find("em").text("0");
        	    jQuery(".radio-leaf").removeClass("active");
        	}
        	if(type === "tvwall") {
        		Cache.cloneData.tvwallList.length = 0;
        		jQuery(".tvwall .mid-right").find(".data-list li").remove();
        	    jQuery(".tvwall .mid-right").find(".delete-all").addClass("disnone");
        	    jQuery(".tvwall .mid-right .header").find("em").text("0");
        	    jQuery(".radio-leaf").removeClass("active");
        	}
        },      
        //电视墙布局通道下拉列表       
		showOption: function(event) {
			event.stopPropagation();
			var self = jQuery(this),
				type = self.data("type"),
				obj = self.closest(".select_container"),
				cameraId = obj.closest("li").data("cameraid"), 
				positionInfo = {
					left: jQuery(obj).offset().left,
					top: jQuery(obj).offset().top,
					width: jQuery(obj).outerWidth(),
					height: jQuery(obj).outerHeight()
				};
			if (type === "layout") {
				dealAfterShowPubDiv({
					layout: true,
					layoutData: Cache.LayoutData
				}, positionInfo, type, cameraId);
			}
			if (type === "channel") {
				var curLayout = self.closest(".layout-select").find(".select_container[data-type=layout] .text").data("value");
				getLayoutData("channel", curLayout, function(res) {
					dealAfterShowPubDiv({
						channel: true,
						channelData: res
					}, positionInfo, type, cameraId);
				});
				
			}
		}
	};
	/**
	 * [init 初始化联动规则弹窗]
	 * @return {[type]} [description]
	 */
	function init(taskId, scope, type) {

		linkageCtrl = scope;
        //判断联动弹窗是否首次加载
		var isRepeatOpen = jQuery("#popContainer").length === 0 ? false : true;
        //渲染联动弹窗
		renderHtml(taskId, isRepeatOpen, dialogLinkage, type);
		//联动切换，关闭弹窗，取消设置，保存设置
		bindEvent(".popContent ul, .popHeader, .popFooter");
		//默认绑定短信相关事件
		bindPmessageEvent();
	}
	/**
	 * [renderHtml 渲染联动规则弹窗]
	 * @param  {[type]}  taskId       [任务id]
	 * @param  {Boolean} isRepeatOpen [是否缓存加载]
	 * @param  {[type]}  html         [联动弹窗框架html]
	 * @param  {[type]}  type         [布控还是布防]
	 * @return {[type]}               [description]
	 */
	function renderHtml(taskId, isRepeatOpen, html, type) {
        jQuery("#popLayer").remove();
        jQuery("#popContainer").remove();
        if(type === "defence"){//布防
        	jQuery("#defence-setting-content").append(html);
        } else {//布控
        	jQuery("#control-setting-content").append(html);
        }
		if (taskId) {
			if (isRepeatOpen) {
				renderCachePanel(Cache.submitLinkageData);
			} else {
				linkageModel.ajaxEvents.getLinkage({
					task_id: taskId
				}, function(res) {
					var typeArr = [],
						type = "";
					if (res.code === 200 && res.data && res.data.length > 0) {
						//清除缓存
						Cache.clearCache(Cache.cloneData);
						Cache.clearCache(Cache.submitLinkageData);
						//渲染联动面板，组织缓存数据
                        renderPanel(res.data);
					}
					//克隆原始联动数据
					jQuery.extend(true, Cache.cloneData, Cache.submitLinkageData);
				});
			}
		} else {
			if(isRepeatOpen){
				renderCachePanel(Cache.submitLinkageData);
			}
			jQuery.extend(true, Cache.cloneData, Cache.submitLinkageData);
		}
	}

	/**
	 * [renderPanel 渲染联动面板，组织缓存数据]
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	 */
	function renderPanel(data) {
		for (var i = 0; i < data.length; i++) {
			//短信
			if (data[i].type === 1) {
				Cache.submitLinkageData.phoneList.push({
					way: data[i].way,
					type: 1
				});
				addContent("pmessage", data[i].way);
				renderTimeArea(data);
				bindEvent(".pmessage .result-list li");
			}
			//邮箱
			if (data[i].type === 2) {
				Cache.submitLinkageData.emailList.push({
					way: data[i].way,
					type: 2
				});
				addContent("email",data[i].way);
				bindEvent(".email .result-list li");
			}
			//消息推送
			if (data[i].type === 3) {
				jQuery(".message").find("i").removeClass("active").addClass("active");
				Cache.submitLinkageData.sendMessage = true;
			}
			//联动地图
			if (data[i].type === 6) {
				jQuery(".gis").find("i").removeClass("active").addClass("active");
				Cache.submitLinkageData.showGIS = true;
			}
			//联动移动端
			if (data[i].type === 7) {
				jQuery(".mobile").find("i").removeClass("active").addClass("active");
				Cache.submitLinkageData.showMobile = true;
			}
			//电视墙
			if (data[i].type === 5) {
				renderTemp("tvwall", data, "select");
				Cache.submitLinkageData.tvwallList.push({
					type: 5,
					camera_id: data[i].camera_id,
					cameraName: data[i].cameraName,
					camera_type: data[i].cameraType,
					channel_id: data[i].channel_id,
					tvwallLayout_id: data[i].tvwallLayout_id, //布局id
					tvwallLayout_name: data[i].tvwallLayout_name, //布局名称
					mdTvwallLayout_id: data[i].mdTvwallLayout_id, //通道id
					mdTvwallLayout_sceen: data[i].mdTvwallLayout_sceen //通道名称
				});
			}
			//预置位
			if (data[i].type === 4) {
				renderTemp("ptz", data);
				bindEvent(".ptz .mid-right .data-list .js-close, .ptz .mid-right .header");
				Cache.submitLinkageData.PTZCameraList.push({
					type: 4,
					camera_id: data[i].camera_id,
					channel_id: data[i].channel_id,
					preset_id: data[i].preset_id,
					cameraName: data[i].cameraName,
					preset_name: data[i].preset_name
				});
			}
			//监控画面
			if (data[i].type === 8) {
				renderTemp("monitor", data);
				Cache.submitLinkageData.monitorCameraList.push({
					type: 8,
					camera_id: data[i].camera_id,
					cameraName: data[i].cameraName,
					channel_id: data[i].channel_id,
					camera_type: data[i].camera_type
				});
			}
		}
	}
	/**
	 * [renderCachePanel 缓存数据渲染面板]
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	 */
	function renderCachePanel(data){
		if (data.phoneList.length > 0) {
			data.phoneList.forEach(function(item) {
				addContent("pmessage", item.way);
			});
			//渲染短信通知时间
			renderTimeArea(data.phoneList);
			bindEvent(".pmessage .result-list li");
		}
		if(data.emailList.length > 0){
			data.emailList.forEach(function(item){
               addContent("email", item.way);
			});
			bindEvent(".email .result-list li");
		}
		if(data.sendMessage){
			Cache.cloneData.sendMessage = data.sendMessage;
			jQuery(".message").find("i").removeClass("active").addClass("active");
		}
		if(data.showGIS){
			Cache.cloneData.showGIS = data.showGIS;
			jQuery(".gis").find("i").removeClass("active").addClass("active");
		}
		if(data.showMobile){
			Cache.cloneData.showMobile = data.showMobile;
			jQuery(".mobile").find("i").removeClass("active").addClass("active");
		}
		if(data.tvwallList.length > 0) {
			renderTemp("tvwall", data.tvwallList);
		}
		if(data.monitorCameraList.length > 0){
			renderTemp("monitor", data.monitorCameraList);
		}
		if(data.PTZCameraList.length > 0){
			renderTemp("ptz", data.PTZCameraList);
		}
	}
	/**
	 * [bindEvent 绑定页面事件]
	 * @param  {[type]} selector [被绑定的元素]
	 * @return {[type]}          [description]
	 */
	function bindEvent(selector) {
		jQuery(selector).find("[data-handler]").map(function() {
			jQuery(this).off(jQuery(this).data("event")).on(jQuery(this).data("event"), eventHandler[jQuery(this).data("handler")]);
		});
	}
	/**
	 * [bindPmessageEvent 绑定短信相关事件]
	 * @return {[type]} [description]
	 */
	function bindPmessageEvent() {
       bindEvent(".pmessage .search, .pmessage .add-footer, .pmessage .time-type");
       //初始化时间插件
       initTimer();
	}
    /**
     * [bindEmailEvent 绑定邮箱相关事件]
     * @return {[type]} [description]
     */
	function bindEmailEvent() {
       bindEvent(".email .search");
	}
    /**
     * [bindMessageEvent 绑定消息联动相关事件]
     * @return {[type]} [description]
     */
	function bindMessageEvent() {
        bindEvent(".message .header");
		if (Cache.cloneData.sendMessage) {
			jQuery(".message").find("i").addClass("active");
		} else {
			jQuery(".message").find("i").removeClass("active");
		}
	}
    /**
     * [bindGISEvent 绑定地图相关事件]
     * @return {[type]} [description]
     */
	function bindGISEvent() {
		bindEvent(".gis .header");
		if (Cache.cloneData.showGIS) {
			jQuery(".gis").find("i").addClass("active");
		} else {
			jQuery(".gis").find("i").removeClass("active");
		}
	}
    /**
     * [bindMobileEvent 绑定移动端相关事件]
     * @return {[type]} [description]
     */
	function bindMobileEvent() {
		bindEvent(".mobile .header");
		if (Cache.cloneData.showMobile) {
			jQuery(".mobile").find("i").addClass("active");
		} else {
			jQuery(".mobile").find("i").removeClass("active");
		}
	}
   
    /**
     * [addContent 增加短信，邮箱号码联动，最多支持20个]
     * @param {[type]} type  [description]
     * @param {[type]} value [description]
     */
	function addContent(type, value) {

		var $content = jQuery(".popRight").find("." + type).find(".add-result"),
		    sign = type === "pmessage" ? 1 : 2,
		    valid = checkValid(type, value),
			repeat = checkRepeat(type, value),
			$tips = jQuery(".popRight").find("." + type + "-tips"),
			invalidMsg = {
				pmessage: "手机号码格式有误！",
				email: "邮箱格式有误！"
			},
			repeatMsg = {
				pmessage: "此号码已添加！",
				email: "此邮箱已添加！"
			},
			overflowMsg = {
				pmessage: "最多可添加20个手机号码！",
				email: "最多可添加20个邮箱地址！"
			},
			typeMap = {
				pmessage: Cache.cloneData.phoneList,
				email: Cache.cloneData.emailList
			};
		$tips.text("").hide();
		// 如果超出了20个。则提示超出信息
		if (typeMap[type].length >= 20) {
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
		} else {
			// 收集数据
			typeMap[type].push({
				way: value,
				type: sign
			});
		}

		// 渲染页面
		$content.find(".no-result").hide();
		if ($content.find(".result-list").length > 0) {
			$content.find(".result-list").append("<li><span class='element-name' title='" + value + "'>" + value + "</span><i class='delete' data-type='" + type + "' data-value='" + value + "' data-event='click' data-handler='clickDelete'></i></li>");
		} else {
			$content.append("<ul class='result-list clearfix'><li><span class='element-name' title='" + value + "'>" + value + "</span><i class='delete' data-event='click' data-handler='clickDelete' data-type='" + type + "' data-value='" + value + "'></i></li></ul>");
		}
		// 清楚输入框，并让输入框获取焦点，以便继续输入
		jQuery(".popRight").find("." + type).find(".add-input").val("").focus();
	}

    /**
     * [checkValid 验证短信，邮箱格式的合法性]
     * @param  {[type]} type  [description]
     * @param  {[type]} value [description]
     * @return {[type]}       [description]
     */
	function checkValid(type, value) {
		var regMap = {
			pmessage: /^(1[3578][0-9]{9})$/,
			email: /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/
		};
		return regMap[type].test(value);
	}
    /**
     * [checkRepeat 短信，邮箱信息重复信息验证]
     * @param  {[type]} type  [description]
     * @param  {[type]} value [description]
     * @return {[type]}       [description]
     */
	function checkRepeat(type, value) {
		var typeMap = {
			pmessage: Cache.cloneData.phoneList,
			email: Cache.cloneData.emailList
		};
		for (var i = 0; i < typeMap[type].length; i++) {
			if (typeMap[type][i].way === value) {
				return true;
			}
		}
		return false;
	}
	/**
	 * [removeElement 删除收集的手机号或者邮箱]
	 * @param  {[type]} $node [删除按钮的jQuery对象]
	 * @return {[type]}       [description]
	 */
	function removeElement($node) {
		var type = $node.attr("data-type"),
			value = $node.attr("data-value"),
			$content  = jQuery(".popRight").find("." + type).find(".add-result");
		$node.closest('li').remove();
		if(type === "pmessage"){
			Cache.cloneData.phoneList = Cache.cloneData.phoneList.filter(function(item){
				if(item === value){
					return false;
				}
			})
		} 
		if(type === "email"){
			Cache.cloneData.emailList = Cache.cloneData.emailList.filter(function(item){
				if(item === value){
					return false;
				}
			})
		}
		// 删除之后，如果数据没有了，则显示无数据的提示
		if ($node.closest('li').length === 0) {
			$content.find(".no-result").show();
		}
		if ($node.closest('li').length < 20) {
            jQuery("." + type).find(".search i").hide();
		} else {
			jQuery("." + type).find(".search i").show();
		}
	}
	/**
	 * [changeSmsTimeType 短信通知，改变时间类型]
	 * @param  {[type]} $node [按钮的jQuery对象]
	 * @return {[type]}       [description]
	 */
	function changeSmsTimeType($node) {
 
		$node.addClass('active').closest('.time-type').siblings().find("i").removeClass('active');

		var $timeGroup = jQuery(".pmessage").find(".time-group");
		// 如果是时间段，则取消相应的输入框和按钮禁用，否则，添加禁用
		if ($node.closest(".time-area").length > 0) {
			$timeGroup.find(".ctrl").removeClass('disabled');
			$timeGroup.find("input").removeAttr('disabled');
		} else {
			$timeGroup.find(".ctrl").addClass('disabled');
			$timeGroup.find("input").attr("disabled", true);
			jQuery(".add-footer .begintime input.text1").val("00");
			jQuery(".add-footer .begintime input.text2").val("00");
			jQuery(".add-footer .endtime input.text1").val("23");
			jQuery(".add-footer .endtime input.text2").val("59");
		}
	}
    /**
     * [initTimer 初始化短信时间插件]
     * @return {[type]} [description]
     */
	function initTimer() {
		var $timeGroup = jQuery(".pmessage").find(".time-group");
		$timeGroup.empty().TimeSelect({
			parentBorder: {
				"borderColor": "#ddd"
			},
			controlsBorder: {
				"borderColor": "#ddd"
			}
		});

		var timeObj = Cache.timeArea,
			timeValue = [],
			timeValue = [timeObj.startHour, timeObj.startMinute, timeObj.endHour, timeObj.endMinute],
            holeDay = TimeAreaType();
		// 如果时间范围为全天，那么时间段选项，暂时禁用
		holeDay && $timeGroup.find(".ctrl").addClass('disabled');
		$timeGroup.find("input").each(function(index) {
			holeDay && jQuery(this).prop("disabled", true);
			jQuery(this).val(timeValue[index]);
		})
	}
	/**
	 * [renderTemp 渲染已选摄像机列表]
	 * @param  {[type]} type [联动类型]
	 * @param  {[type]} data [联动数据]
	 * @param  {[type]} sign [可选参数(区分电视墙已选列表是新建还是查询)]
	 * @return {[type]}      [description]
	 */
	function renderTemp(type, data , sign) {
		if (type === "ptz") {
			renderPTZTemp(data);
		}
		if(type === "monitor") {
			renderMonitorTemp(data);
		}
		if(type === "tvwall"){
			if(sign === "create"){
               createTvwallTemp(data);
			} else {
               selectTvwallTemp(data);
			} 
		}	
	}
    /**
     * [renderPTZTemp 渲染云台已选数据]
     * @param  {[type]} data [description]
     * @return {[type]}      [description]
     */
	function renderPTZTemp(data) {
		if (data.length > 0) {
			var html = "",
			    j = 0;
			for (var i = 0, le = data.length; i < le; i++) {
				if (data[i].type === 4) {
					j++;
					html += ['<li data-name="' + data[i].preset_name + '" data-cameraid="' + data[i].camera_id + '">',
						'<span class="name" title="' + data[i].cameraName + '-' + data[i].preset_name + '"><i class="camera-ball-online"></i>' + data[i].cameraName + '-' + data[i].preset_name + '</span>',
						'<span class="js-close"><i class="icon-close" data-event="click" data-handler="removeLi"></i></span>',
						'</li>'
					].join("");
				}
			}
			jQuery(".ptz .mid-right .data-list ul").html(html);
			jQuery(".ptz .mid-right").find(".delete-all").removeClass("disnone");
			jQuery(".ptz .mid-right .header").find("em").text(j);
			bindEvent(".ptz .mid-right .data-list .js-close, .ptz .mid-right .header");
		} else {
			jQuery(".mid-right .data-list ul").html("");
			jQuery(".ptz .mid-right").find(".delete-all").addClass("disnone");
			jQuery(".ptz .mid-right .header").find("em").text("0");
		}
	}
    /**
     * [renderMonitorTemp 渲染监控画面已选面板]
     * @param  {[type]} data [description]
     * @return {[type]}      [description]
     */
	function renderMonitorTemp(data) {
		if (data.length > 0) {
			var html = "",
			    j = 0;
			for (var i = 0; i < data.length; i++) {
				if (data[i].type === 8) {
					j++;
					html += ['<li data-name="' + data[i].cameraName + '" data-cameraid="' + data[i].camera_id + '">',
						'<span class="name" title="' + data[i].cameraName + '">' +
						'<i class=' + (data[i].cameraType == 0 ? 'camera-gun-online' : 'camera-ball-online') + '></i>' + data[i].cameraName + '</span>',
						'<span class="js-close"><i class="icon-close" data-event="click" data-handler="removeLi"></i></span>',
						'</li>'
					].join("");
				}
			}
			jQuery(".monitor .mid-right .data-list ul").html(html);
			jQuery(".monitor .mid-right").find(".delete-all").removeClass("disnone");
			jQuery(".monitor .mid-right .header").find("em").text(j);
			bindEvent(".monitor .mid-right .data-list .js-close, .monitor .mid-right .header");
		} else {
			jQuery(".monitor .mid-right .data-list ul").html("");
			jQuery(".monitor .mid-right").find(".delete-all").addClass("disnone");
			jQuery(".monitor .mid-right .header").find("em").text("0");
		}
	}
    /**
     * [createTvwallTemp 渲染新建电视墙已选面板]
     * @param  {[type]} data [description]
     * @return {[type]}      [description]
     */
	function createTvwallTemp(data) {
		if (data.length > 0) {
			var defaultLayoutId = "";
			var defaultLayoutName = "";
			var defaultMdlayoutId = "";
			var defaultMdlayoutScreen = "";
			getLayoutData("layout", "", function(res) {
				for (var j = 0; j < res.length; j++) {
					if (res[j].status) {
						defaultLayoutId = res[j].id;
						defaultLayoutName = res[j].name;
					}
				}
				//如果没有默认布局，则读取第一个布局
				if(defaultLayoutId === "") {
					defaultLayoutId = res[0].id;
					defaultLayoutName = res[0].name;
				}
				getLayoutData("channel", defaultLayoutId, function(res) {
					//默认通道是当前布局的第一个通道
					defaultMdlayoutId = res[0].id;
					defaultMdlayoutScreen = res[0].screenId
					var options = {
						layoutId: defaultLayoutId,
						layoutName: defaultLayoutName,
						mdlayoutId: defaultMdlayoutId,
						mdlayoutScreen: defaultMdlayoutScreen
					};
					data.forEach(function(item) {
						if (!item.tvwallLayout_id) {
							item.tvwallLayout_id = defaultLayoutId;
						}
						if (!item.tvwallLayout_name) {
							item.tvwallLayout_name = defaultLayoutName;
						}
						if (!item.mdTvwallLayout_id) {
							item.mdTvwallLayout_id = defaultMdlayoutId;
						}
						if (!item.mdTvwallLayout_sceen) {
							item.mdTvwallLayout_sceen = defaultMdlayoutScreen
						}
					});
					renderTvwallTemp(data, options);
				})
			});
		}
	}
    /**
     * [selectTvwallTemp 渲染查询电视墙已选列表]
     * @param  {[type]} data [description]
     * @return {[type]}      [description]
     */
	function selectTvwallTemp(data) {
		var options = {
			layoutId: "",
			layoutName: "选择布局",
			mdlayoutId: "",
			mdlayoutScreen: "选择通道"
		};
		//获取布局信息
		getLayoutData("layout");
		renderTvwallTemp(data, options);
	}
    /**
     * [renderTvwallTemp 渲染电视墙已选列表]
     * @param  {[type]} data    [缓存数据]
     * @param  {[type]} options [默认布局通道信息]
     * @return {[type]}         [description]
     */
	function renderTvwallTemp(data, options) {
		if (data.length > 0) {
			var html = "",
			    j = 0;
			for (var i = 0; i < data.length; i++) {
				if (data[i].type === 5) {
                    j++;
					if (data[i].tvwallLayout_id) {
						options.layoutId = data[i].tvwallLayout_id;
					}
					if (data[i].tvwallLayout_name) {
						options.layoutName = data[i].tvwallLayout_name;
					}
					if (data[i].mdTvwallLayout_id) {
						options.mdlayoutId = data[i].mdTvwallLayout_id;
					}
					if (data[i].mdTvwallLayout_sceen+"") {
						options.mdlayoutScreen = data[i].mdTvwallLayout_sceen;
					}
					html += ['<li data-cameraid="' + data[i].camera_id + '"><span class="name" title="' + data[i].cameraName + '">',
						'<i class=' + (data[i].cameraType == 0 ? 'camera-gun-online' : 'camera-ball-online') + '></i>' + data[i].cameraName + '</span>',
						'<div class="layout-select">布局:',
						'<span class="select_container" data-type="layout">',
						'<span class="text" title='+ options.layoutName + ' data-value=' + options.layoutId + '>' + options.layoutName + '</span>',
						'<span class="arrow-down" data-type="layout" data-event="click" data-handler="showOption"></span></span>',
						'通道:<span class="select_container" data-type="channel">',
						'<span class="text" title='+ options.mdlayoutScreen + ' data-value=' + options.mdlayoutId + '>' + options.mdlayoutScreen + '</span>',
						'<span class="arrow-down" data-type="channel" data-event="click" data-handler="showOption"></span></span>',
						'<span class="js-close"><i class="icon-close" data-event="click" data-handler="removeLi"></i></span>',
						'</div></li>'
					].join("");
					jQuery(".tvwall .mid-right .data-list ul").html(html);
					jQuery(".tvwall .mid-right .header").find("em").text(j);
					jQuery(".tvwall .mid-right").find(".delete-all").removeClass("disnone");

				}
			}
			bindEvent(".tvwall .data-list ul .select_container, .tvwall .data-list .js-close, .tvwall .header");
		} else {
			jQuery(".tvwall .mid-right .data-list ul").html('');
			jQuery(".tvwall .mid-right").find(".delete-all").addClass("disnone");
			jQuery(".tvwall .mid-right .header").find("em").text("0");
		}
	}
	/**
	 * [getLayoutData 获取电视墙布局通道信息]
	 * @param  {[type]}   type     [布局or通道]
	 * @param  {[type]}   layoutId [布局id]
	 * @param  {Function} callback [回调]
	 * @return {[type]}            [description]
	 */
	function getLayoutData(type, layoutId, callback) {
		if (type === "layout") {
			linkageModel.ajaxEvents.getLayoutTvwall({
				isIncludeChannel: 1
			}, function(res){
               if (res.code === 200) {
				   if(res.data.length > 0) {
					   Cache.LayoutData = res.data;
					   callback && callback(res.data);
				   } else {
					   notify.warn("暂无电视墙布局信息，请先创建电视墙布局");
				   }
				} else {
					notify.error("获取电视墙布局信息失败");
					return;
				}
			});
		}
		if (type === "channel") {
			linkageModel.ajaxEvents.getLayoutChannel({
				id: layoutId
			}, function(res) {
				if (res.code === 200 && res.data) {
					callback && callback(res.data);
				} else {
					notify.error("获取电视墙布局通道信息失败！");
					return;
				}
			});
		}
	}
    /**
     * [dealAfterShowPubDiv 下拉列表渲染,下拉事件绑定]
     * @param  {[type]} compilerParam [下拉框数据]
     * @param  {[type]} positionInfo  [下拉框位置信息]
     * @param  {[type]} dataType      [dom标识]
     * @param  {[type]} cameraid      [摄像机id]
     * @return {[type]}               [description]
     */
	function dealAfterShowPubDiv(compilerParam, positionInfo, dataType, cameraid) {
		var self = this;
		Cache.compiler(templateUrl, compilerParam, function(html) {
			//加载浮动层
			jQuery(".alarmmgr.pubdiv ul").html(html);
			//显示浮动层
			jQuery(".alarmmgr.pubdiv").css({
				"left": positionInfo.left + "px",
				"top": positionInfo.top + positionInfo.height + 2 + "px",
				"width": positionInfo.width
			}).attr("data-type", dataType).show();
			//下拉列表项的点击事件
			jQuery(".alarmmgr.pubdiv ul").find("li").each(function() {
				//给每一个列表项绑定点击事件
				jQuery(this).off("click").on("click", function(event) {
					event.stopPropagation();
					var that = jQuery(this);
					if (dataType === "layout") {
						var selectId = that.data("id"),
							selectName = that.data("name");
						Cache.cloneData.tvwallList.map(function(item) {
							if (item.camera_id === cameraid) {
								item.tvwallLayout_id = selectId;
								item.tvwallLayout_name = selectName;
							}
						});
						//设置选中值
						jQuery(".data-list li[data-cameraid='" + cameraid + "'] .select_container[data-type=layout]").find(".text").attr("data-value", selectId).html(selectName);
					} else {
						var selectId = that.data("id"),
							screenId = that.data("screenid"),
							layoutId = that.data("layoutid");
						Cache.cloneData.tvwallList.map(function(item) {
							if (item.tvwallLayout_id === layoutId && item.camera_id === cameraid) {
								item.mdTvwallLayout_id = selectId;
								item.mdTvwallLayout_sceen = screenId;
							}
						});
						//设置选中值
						jQuery(".data-list li[data-cameraid='" + cameraid + "'] .select_container[data-type=channel]").find(".text").attr("data-value", selectId).html(screenId);
					}
					//隐藏下拉列表
					jQuery(".alarmmgr.pubdiv").hide();
				});
			});
		});
	}
    /**
     * [renderPreTemp 获取球机预置位信息]
     * @param  {[type]} cameraId [description]
     * @return {[type]}          [description]
     */
	function renderPreTemp(cameraId, node) {
		if (node.hasClass("active")) {
			linkageModel.ajaxEvents.getPresetsByCameraId({
				cameraId: cameraId
			}, function(res) {
				if (res.code === 200 && res.data.presets.length) {
					var opts = {
						middlePosition: true,
						dataList: res.data.presets
					};
					Cache.compiler(templateUrl, opts, function(html) {
						jQuery(".ptz .mid-center .data-list").empty().html(html);
						bindEvent(".ptz .mid-center .data-list ul");
					});
				} else {
					jQuery(".ptz .mid-center .data-list").empty().html("该摄像机没有预置位信息！");
					jQuery("#cameraTreeList li[data-id='" + cameraId + "']").find(".radio-leaf").removeClass("active");
				}
			});
		} else {
			jQuery(".ptz .mid-center .data-list").find("li[data-cameraid=" + cameraId + "]").remove();
		}
	}
    /**
     * [setTimeArea 设置短信时效]
     */
	function setTimeArea(){
         Cache.timeArea.startHour = jQuery(".add-footer .begintime input.text1").val();
         Cache.timeArea.startMinute = jQuery(".add-footer .begintime input.text2").val();
         Cache.timeArea.endHour = jQuery(".add-footer .endtime input.text1").val();
         Cache.timeArea.endMinute = jQuery(".add-footer .endtime input.text2").val();
	}
    /**
     * [renderTimeArea 渲染短信通知时间]
     * @param  {[type]} data [缓存数据]
     * @return {[type]}      [description]
     */
	function renderTimeArea(data) {
		for (var i = 0; i < data.length; i++) {
			if (data[i].type === 1) {
				if (data[i].start_time) {
					jQuery(".add-footer .begintime input.text1").val(data[i].start_time.split(":")[0]);
					jQuery(".add-footer .begintime input.text2").val(data[i].start_time.split(":")[1]);
					jQuery(".add-footer .endtime input.text1").val(data[i].end_time.split(":")[0]);
					jQuery(".add-footer .endtime input.text2").val(data[i].end_time.split(":")[1]);
					Cache.timeArea.startHour = data[i].start_time.split(":")[0];
					Cache.timeArea.startMinute = data[i].start_time.split(":")[1];
					Cache.timeArea.endHour = data[i].end_time.split(":")[0];
					Cache.timeArea.endMinute = data[i].end_time.split(":")[1];
				} else {
					jQuery(".add-footer .begintime input.text1").val(Cache.timeArea.startHour);
					jQuery(".add-footer .begintime input.text2").val(Cache.timeArea.startMinute);
					jQuery(".add-footer .endtime input.text1").val(Cache.timeArea.endHour);
					jQuery(".add-footer .endtime input.text2").val(Cache.timeArea.endMinute);
				}
				TimeAreaType();
			}
			return false;
		}
	}
    /**
     * [TimeAreaType 判断短信时效的类型(全天or时间段)]
     */
	function TimeAreaType() {
		if (Cache.timeArea.startHour === "00" && Cache.timeArea.startMinute === "00" && Cache.timeArea.endHour === "23" && Cache.timeArea.endMinute === "59") {
			jQuery(".pmessage .whole-day").find("i").addClass("active");
			jQuery(".pmessage .time-area").find("i").removeClass("active");
			return true;
		} else {
			jQuery(".pmessage .whole-day").find("i").removeClass("active");
			jQuery(".pmessage .time-area").find("i").addClass("active");
			return false;
		}
	}

	return {
		init: init,
		bindEvent: bindEvent,
		renderTemp: renderTemp,
		renderPreTemp: renderPreTemp,
		addContent: addContent,
		removeElement: removeElement,
		changeSmsTimeType: changeSmsTimeType,
		dealAfterShowPubDiv: dealAfterShowPubDiv,
		getLayoutData: getLayoutData
	}
});