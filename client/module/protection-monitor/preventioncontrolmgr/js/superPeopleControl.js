define([
	'/component/base/self/eight.lib.js',
	"permission",
	'jquery.pagination',
	'handlebars'
], function(EightLib) {
	//初始化8大库相关逻辑
	EightLib.initGlobal();
	// 权限相关
	permission.reShow();

	var peopleControl = {
		/**
		 * [getTml 获取html模板]
		 * @param  {Function} callback [回调函数]
		 * @return {[type]}            [description]
		 */
		getTml: function(callback) {
			jQuery.get("/module/protection-monitor/preventioncontrolmgr/inc/prevention-control-mgr-template.html").done(function(temp) {
				callback.call(this, Handlebars.compile(temp));
			}.bind(this));
		},
		//设置中间高度
		setMidHeight: function() {
			jQuery(".tab-content").find("div[data-view='people-control'] .mid-bottom-panel").height(jQuery(window).height() - 188);
			var midObj = jQuery(".tab-content").find("div[data-view='people-control'] .mid-bottom-panel");
			var height = jQuery(window).height() - 184;
			if (jQuery(".create-people-lib-table").is(":visible")) {
				height = height - jQuery(".create-people-lib-table").height();
			}
			midObj.height(height);
		},
		/**
		 * [getLibList 获取布控库列表]
		 * @param  {[type]} template [html模板函数]
		 * @return {[type]}          [description]
		 */
		getLibList: function(template) {
			var self = this;
			//加载人员布控库列表
			var param = {
				libName: "",
				pageNum: "", //1,
				pageSize: "" //globalVar.configInfo.peopleLibPageSize
			};
			//隐藏新增内容
			jQuery(".mid-top-panel").find(".create-people-lib-table").removeClass("active");
			//调用人员库列表
			jQuery.ajax({
				type: "get",
				url: "/service/deploycontrol/personLibs",
				data: param
			}).then(function(res) {
				if (res.code === 200) {
					var html = template({
						PeopleLibraryList: res.data
					});
					jQuery(".mid-bottom-panel .people-library-list").html(html);
					//默认选中第一个
					var libs = jQuery(".mid-bottom-panel .people-library-list .people-library-item");
					if (libs.length > 0) {
						// 请求首个布控库中的人员信息
						var $firstLib = libs.eq(0);
						$firstLib.addClass("active");
						self.getLibPeople($firstLib, template);
					} else { //如果布控库数量为0则隐藏右侧的新增等操作按钮
						jQuery(".people-library-search-content .opera").hide();
						// 加载真正的main.js
						require(['/module/protection-monitor/preventioncontrolmgr/js/main.js']);
					}
				} else if (res.code === 500) {
					notify.warn(res.data.message + "！错误码：" + res.code);
					// 加载真正的main.js
					require(['/module/protection-monitor/preventioncontrolmgr/js/main.js']);
				} else {
					notify.warn("获取人员布控库列表失败！错误码：" + res.code);
					// 加载真正的main.js
					require(['/module/protection-monitor/preventioncontrolmgr/js/main.js']);
				}
			}, function() {
				notify.error("获取人员布控库列表失败，服务器或网络异常！");
			});
		},
		/**
		 * [getLibPeople 获取某个布控库中的人员信息]
		 * @param  {[type]} $lib     [首个布控库选择器]
		 * @param  {[type]} template [html模板]
		 * @return {[type]}          [description]
		 */
		getLibPeople: function($lib, template) {
			var liObj = $lib,
				self = this;
				param = {
					libId: parseInt(liObj.attr("data-id")),
					pageNum: 1,
					pageSize: 10,
					papersType: "",
					name: "",
					number: ""
				};

			jQuery.ajax({
				type: "get",
				url: "/service/deploycontrol/personLib/personnels",
				data: param
			}).then(function(res) {
				if (res.code === 200) {
					if (res.data.count <= param.pageSize) {
						jQuery(".people-library-content .pagination").hide();
						var html = template({
							PeopleList: res.data,
							isSearch: (param.name !== "" || param.number!=="")
						});
						jQuery(".people-library-search-content .people-library-content .people-library-content-inner").html(html);
						permission.reShow();
					} else {
						//渲染分页
						jQuery(".people-library-content .pagination").show();
						self.setJumpPagination(res.data.count, ".people-library-content .pagination", param.pageSize, function(nextPage) {
							// TODO  分页回调函数
							param.pageNum = nextPage;
							jQuery.ajax({
								type: "get",
								url: "/service/deploycontrol/personLib/personnels",
								data: param
							}).then(function(res) {
								if (res.code === 200 && res.data) {
									var html = template({
										PeopleList: res.data,
										isSearch: (param.name !== "" || param.number!=="")
									});
									jQuery(".people-library-search-content .people-library-content .people-library-content-inner").html(html);
									permission.reShow();
								} else {
									notify.warn("服务器或网络异常！");
								}
							});
						});
					}
					//存储当前用户操作的人员库信息
					var liObj = jQuery(".mid-bottom-panel .people-library-list .people-library-item.active");
					window.curPersonLibId = parseInt(liObj.attr("data-id"));
					window.curPersonLibName = liObj.attr("data-name");
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.code);
				} else {
					notify.error("获取人员列表失败！错误码：" + res.code);
				}
				// 加载真正的main.js
				require(['/module/protection-monitor/preventioncontrolmgr/js/main.js']);
			}, function() {
				notify.error("获取人员列表失败，服务器或网络异常！");
				// 加载真正的main.js
				require(['/module/protection-monitor/preventioncontrolmgr/js/main.js']);
			});

			//渲染面包屑
			var threshold = liObj.attr("data-threshold"),
				thresholdText = threshold ? "（比分阈值：" + threshold + "）" : "";
			var breadTemp = template({
				peopleBreadCrumb: {
					libName: $lib.text(),
					thresholdText: thresholdText,
					peopleList: true
				}
			});
			jQuery(".people-control .breadcrumb").html(breadTemp);
			
		},
		//有跳转按钮的分页
		setJumpPagination: function(total, selector, itemsPerPage, callback) {
			jQuery(selector).pagination(total, {
				orhide: false,
				prev_show_always: true,
				next_show_always: true,
				items_per_page: itemsPerPage,
				callback: function(pageIndex, jq) {
					callback(pageIndex + 1);
					//分页时取消全选
					jQuery(".people-library-th td input[type='checkbox']").prop("checked", false);
				}
			});
		},
		/**
		 * [registerHelper 注册handlebar助手]
		 * @return {[type]} [description]
		 */
		registerHelper: function() {
			//人员分库的人员列表渲染助手
			Handlebars.registerHelper('PersonListFilter', function(value, type) {
				if (type === "sex") {
					return value ? ((value === "M") ? "男" : ((value === "F") ? "女" : "未知")) : "未知";
				} else if (type === "status") {
					return (value === -1) ? "失败" : (value === 1) ? "成功" : "正在入库";
				} else if (type === "status-class") {
					return (value === -1) ? "lib-fail" : (value === 1) ? "lib-succ" : "lib-ing";
				}
			});
			//是否对接8大库
			Handlebars.registerHelper("isDetail", function(value, num) {
				if (value && jQuery.trim(value) === "居民身份证") {
					if (eightLib.enable) {
						return '<span class="detail" title="关联信息库查询">' + num + '</span>';
					} else {
						return num;
					}
				}
				return num;
			});
		}
	};
	
	peopleControl.getTml(function(template) {
		window.peopleControlTml = template;
		// 设置页面布局
		this.setMidHeight();
		this.registerHelper();
		// 请求布控库列表
		this.getLibList(template);
	});
	
});