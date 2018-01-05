/**
 * Created by Leon.z on 2015/10/13.
 */
define([
	"base.self",
	'jquery.pagination'
], function() {
		return {
		compiler:null,
		templateUrl:"/module/maintenance/RealtimeInspection/inc/inspectTem.html",
		cameraTree:null,
		currRunTaskid:null,
		currRunTaskidList:[],  //正在运行的任务id数组
		timer:null,
		currentPage:1,
		/**
		 * 加载模板通用函数
		 * @param url - 模板地址url
		 * @param callbackSuccess - 模板加载成功后的执行函数
		 * @param callbackError - 模板加载失败后的执行函数
		 */
		loadTemplate: function (url, callbackSuccess, callbackError) {
			var compiler = null;
			//加载模板
			jQuery.when(Toolkit.loadTempl(url)).done(function (timeTemplate) {
				if (timeTemplate instanceof Array) {
					timeTemplate = timeTemplate[0];
				}
				//模板加载成功
				compiler = Handlebars.compile(timeTemplate);
				//成功的回调函数
				if (callbackSuccess && typeof callbackSuccess === "function") {
					callbackSuccess(compiler);
				}
			}).fail(function () {
				//错误的函数
				if (callbackError && typeof callbackError === "function") {
					callbackError();
				}
			});
		},
		/**
		 * [checkForm 用于新建任务验证]
		 * @param  {[type]} params [description]
		 * @return {[type]}        [description]
		 */
		checkForm:function(params){
			if(params){
				if(params.name===""){
					notify.warn("任务名不能为空！");
					return false
				}
				if(params.orgs.length<=0){
					notify.warn("请先选择要巡检的组织树！");
					return false
				}
				return true;
			}
		},
		/**
		 * [setPagination 分页封装方法]
		 * @param {[type]}   total        [总条数]
		 * @param {[type]}   selector     [dom]
		 * @param {[type]}   itemsPerPage [每页几条]
		 * @param {[type]}   currpage     [当前页码]
		 * @param {Function} callback     [回调]
		 */
		setPagination: function(total, selector, itemsPerPage,currpage,callback) {
			jQuery(selector).pagination(total, {
				orhide: true,
				prev_show_always: false,
				next_show_always: false,
				items_per_page: itemsPerPage,
				first_loading: false,
				current_page:currpage,
				callback: function(pageIndex, jq) {
					callback(pageIndex + 1);
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
		}
	};

});