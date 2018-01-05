/**
 * @authors zhaojin
 * @date    2016-04-27
 *
 *  系统关于功能
 */
define([
	"jquery",
	"text!/about/about.html",
	"handlebars",
	"pvaConfig",
	"style!/about/about.css"
], function($, tpl){

	"use strict";


	var /**
		 * 给各主页面动态添加遮挡ocx的iframe
		 */
	 	_createMaskerIfr = function() {
	 		var mainJquery = window.framework.jQuery;
	 		//动态添加
	 		mainJquery("body").append("<iframe class='about-ifr' scroll='none' src='about:blank'></iframe>");
		},
		/**
		 * 显示或隐藏主界面上的ocx
		 * @param  {[type]} type [显示或者隐藏标记（“hide”、“show”）]
		 * @return {[type]}      [description]
		 */
		_showHideOcx = function(type) {
			//判断是否是首页和登录页，这两个页面不需要进行ocx遮罩
			if(window.location.href.indexOf("/module/index/") >= 0 || window.location.href.indexOf("/login/") >= 0){
				return;
			}
			//业务功能模块的ocx遮罩逻辑
			if(type === "show") {
				//显示ocx
				window.framework.jQuery(".about-ifr").hide();
			} else {
				//隐藏ocx
				if(window.framework.jQuery(".about-ifr").length === 0) {
					//动态创建遮挡ocx的iframe
					_createMaskerIfr();
				}
				window.framework.jQuery(".about-ifr").show();
			}
		};

	return {
		/**
		 * 显示about信息窗
		 */
		showAbout: function() {
			var $aboutDialogLayer = $(".aboutDialogLayer");
			// 若弹框没有初始化,则渲染模版
			if ($aboutDialogLayer.length === 0) {
				$aboutDialogLayer = $("<div class='aboutDialogLayer'></div>");
				$aboutDialogLayer.append(Handlebars.compile(tpl)({
					"aboutModel": true,
					"isBaselineAbout": true,
					"title": htmlPageTitle,
					"data": {
						"version": window.version
					}
				}));
				$("body").append($aboutDialogLayer);
			}

			// 显示弹框
			$aboutDialogLayer.show();

			// 绑定关闭弹框事件
			$aboutDialogLayer.find(".cancleDialog").off("click").on("click", function(e) {
				$aboutDialogLayer.hide();

				//显示主界面上的ocx
				_showHideOcx("show");
			});

			// 隐藏主界面上的ocx
			_showHideOcx("hide");
		}
	}
});
