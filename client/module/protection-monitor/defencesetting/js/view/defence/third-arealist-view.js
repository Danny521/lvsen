/*global SCREEN_SHOT_AND_SHOW_LINES:true, DrawEditor:true*/
/**
 * Created by Zhangyu on 2014/12/10.
 * 布防详细规则设置，对当前绘制的区域列表进行管理（增删查改...）
 */
define([
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js",
	'/module/protection-monitor/defencesetting/js/global-var.js',
	"pubsub",
	"jquery"
], function(DefenceTools, _g, PubSub, jQuery) {

	var AreaListView = (function (scope, $) {
		/**
		 * 规则区域列表中的项的点击事件处理程序
		 * @param event - 触发事件的对象
		 * @private
		 */
		var _eventHandlerOnSelectAreaItem = function (event) {
			var $This = $(this), selectValue = $This.html(), domId = $This.attr("data-domid");
			//隐藏下拉列表
			$This.closest(".area-list").hide();
			//设置选中值
			$This.closest(".area_container").find(".text").html(selectValue).attr("data-domid", domId);
			//截图并根据情况显示已有的框线规则
			PubSub.publishSync(SCREEN_SHOT_AND_SHOW_LINES, {
				callback: function() {
					//高亮显示当前被选中的值
					DrawEditor.ShowRange($This.attr("data-domid"));
				}
			});
			//阻止冒泡
			event.stopPropagation();
		};

		/**
		 * 显示框线区域名称列表
		 * @param obj - 触发区域名称的下拉列表的dom对象
		 * @private
		 */
		var _showAreaNameList = function (obj) {

			//移动下拉列表到div下方
			var $obj = $(obj), $list = $obj.siblings(".area-list"), divPosition = $obj.parent().position();
			//定位下拉列表并显示
			$list.css({
				left: divPosition.left + 2 + "px",
				top: divPosition.top + 25 + $(".rule-set").scrollTop() + "px",
				width: $obj.parent().width() + "px"
			}).slideDown("fast");
			//下拉列表项的点击事件
			$list.find("li").each(function () {
				if ($(this).attr("data-domid") === "none") {
					return true;
				}
				//给每一个列表项绑定点击事件
				$(this).off("click").on("click", _eventHandlerOnSelectAreaItem);
			});
			//下拉列表的鼠标移入移出事件
			$(".area_container .level-list").hover(function () {
				_g.defence.isMouseOverPubDiv = true;
			}, function () {
				_g.defence.isMouseOverPubDiv = false;
			});
		};

		/**
		 * 修改区域的名称
		 * @param obj - 修改按钮的dom对象
		 * @param tag - 标示是切换到编辑状态还是保存
		 * @private
		 */
		var _modifyRegionName= function (obj, tag) {
			var $inputObj = $(".new-name"), $selectObj = $(".area_container");
			var orign =  $selectObj.find(".text").text();
			if (tag === 0) {
				//切换成编辑状态
				var selectRegionName = $selectObj.find(".text").text();
				$inputObj.val(selectRegionName).show().parent().removeClass("hidden");
				$selectObj.hide();
				//切换按钮状态
				$(obj).val("确定").attr("title", "确认编辑");
			} else {
				//差错验证
				var regionId = $selectObj.find(".text").attr("data-domid"), newName = $.trim($inputObj.val());
				//验证
				if(newName.length>6){
					$inputObj.val(orign).focus();
					notify.warn('区域名称最多6个字');					
					return;
				}
				if (!DefenceTools.invalidate.inputInvalidate(newName, "区域名", false)) {
					return;
				}
				//切换按钮状态
				$(obj).val("修改").attr("title", "修改选中的区域名称");
				//切换成修改状态
				$(".area_container .area-list").find("li[data-domid='" + regionId + "']").text(newName);
				$selectObj.find(".text").text(newName);
				$selectObj.show();
				$inputObj.parent().addClass("hidden");
				//触发更新区域列表
				scope.controller.modifyAreaName(newName, regionId);
			}
		};

		/**
		 * 区域修改按钮的点击处理程序
		 * @private
		 */
		var _eventHandlerOnAreaNameModify = function() {
			//根据编辑的不同情况进行不同的操作
			if ($(this).val() === "修改") {
				//验证有没有待修改的区域
				if ($(".area_container .area-list li[data-domid!='none']").length === 0) {
					notify.warn("当前暂没有任何区域，请先在右侧视频上添加！");
					return;
				}
				//触发截图并根据情况显示已有的框线规则
				PubSub.publish(SCREEN_SHOT_AND_SHOW_LINES, {});

				//更改区域的名字
				_modifyRegionName(this, 0);
			} else {
				//更改区域的名字
				_modifyRegionName(this, 1);
			}
		};

		/**
		 * 区域下拉列表的点击处理程序-显示下拉列表
		 * @param event - 当前的点击事件对象
		 * @private
		 */
		var _eventHandlerOnSelectAreaList = function (event) {
			var $This = $(this);
			$(".area_container").focus();
			if ($This.find(".area-list").css("display") === "none" || $This.siblings(".area-list").css("display") === "none") {
				if ($(".area_container .area-list li").length !== 0) {
					//如果没有显示则显示
					_showAreaNameList($This.hasClass("arrow-down") ? this : $This.find(".arrow-down"));
					//隐藏等级列表
					$(".level-list").hide();
				}
			} else {
				if ($This.siblings(".area-list").length > 0) {
					$This.siblings(".area-list").hide();
				} else {
					$This.find(".area-list").hide();
				}
			}
			//阻止冒泡
			event.stopPropagation();
		};

		/**
		 * 存储控制器对象，对外调用属性
		 * @type {null}
		 */
		scope.controller = null;

		/**
		 * 事件绑定，对外调用函数
		 */
		scope.bindEvents = function() {
			//区域修改按钮的点击事件
			$("#RuleRegionModify").off("click").on("click", _eventHandlerOnAreaNameModify);
			//区域名称列表中，点击框区域也可触发下拉事件(也包括箭头事件)
			$(".area_container, .area_container .arrow-down").off("click").on("click", _eventHandlerOnSelectAreaList);
		};

		//返回模块
		return scope;

	}(AreaListView || {}, jQuery));

	/**
	 * 区域规则列表展现逻辑
	 */
	var View = function () {};

	View.prototype = {

		/**
		 * 初始化函数
		 */
		init: function (controller) {

			//初始化变量
			AreaListView.controller = controller;
			//事件绑定
			AreaListView.bindEvents();
		},

		/**
		 * 显示已有的区域,在下拉列表中显示
		 * @param data - 待显示的数据信息
		 * @param curAreaList - 当前区域列表
		 */
		showExistAreas: function (data, curAreaList) {
			//删除默认项
			if (jQuery(".area_container .area-list li[data-domid!='none']").length === 0) {
				jQuery(".area_container .area-list li[data-domid='none']").remove();
			}
			//添加到区域列表中
			jQuery(".area_container .area-list ul").append(data);
			//显示第一个区域的名称
			jQuery(".area_container .text").text((curAreaList.length === 0) ? "" : curAreaList[0].text).attr("data-domid", (curAreaList.length === 0) ? "" : curAreaList[0].domid);
		},

		/**
		 * 绘制规则完成后，添加新的规则到下拉列表中
		 * @param data - 新绘制的规则信息
		 * @param title - 格式化后的名字
		 */
		addAreaToList: function (data, title, _curAreaList) {
			var self = this;
			//去掉默认列表
			if (jQuery(".area_container .area-list li[data-domid!='none']").length === 0) {
				jQuery(".area_container .area-list li[data-domid='none']").remove();
			}

			//更新下拉列表
			jQuery(".area_container .text").text(title).attr("data-domid", data.domid);
			jQuery(".area-list ul").append("<li data-domid='" + data.domid + "'>" + title + "</li>");
		},

		/**
		 * 删除某个区域
		 * @param delInfo - 待删除的区域信息
		 */
		delAreaToList: function (delInfo) {

			var $container = jQuery(".area_container"), $newName = jQuery(".new-name"), $modifyBtn = jQuery("#RuleRegionModify");
			//更新页面元素参数
			jQuery(".area_container .area-list ul").find("li[data-domid='" + delInfo.domid + "']").remove();
			//如果当前显示的正是删除的列表项，则更新列表显示区域
			var listText = $container.find(".text"), listObj = jQuery(".area_container .area-list li[data-domid!='none']");
			if (listObj.length !== 0) {
				if (listText.attr("data-domid") === delInfo.domid) {
					listText.text(listObj[0].innerText).attr("data-domid", listObj[0].getAttribute("data-domid"));
					//判断是否处于编辑状态，如果是，则返回选择状态
					$newName.val("").hide();
					$container.show();
					$modifyBtn.val("修改").attr("title", "修改选中的区域名称");
				}
			} else {
				listText.text("").attr("data-domid", "").end().find("ul").append("<li data-domid='none'>暂无区域</li>");
				//判断是否处于编辑状态，如果是，则返回选择状态
				$newName.val("").hide();
				$container.show();
				$modifyBtn.val("修改").attr("title", "修改选中的区域名称");
			}
		},

		/**
		 * 清除框线区域时，重新渲染页面中的区域下拉列表
		 */
		refreshOnClearAreaList: function () {
			//清空框线规则后，重新渲染界面
			jQuery(".area_container").find("ul").empty().append("<li data-domid='none'>暂无区域</li>").end().find(".text").text("").attr("data-domid", "");
		}
	};

	return new View();
});