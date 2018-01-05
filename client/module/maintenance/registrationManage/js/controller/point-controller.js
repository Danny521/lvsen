 /*
  ** @Date：2016.3.24
  ** @Author:zhaojin
  ** @Description:point
  */
 define([
 	'pubsub',
 	'../global-varibale',
 	'../view/point-view',
 	'../model/point-model',
 	'jquery',
 	'../view/commonHelper',
 	'npmapConfig',
 	'OpenLayers',
 	'npgis2'

 ], function(PubSub, global, pointView, ajaxCtr, $, helper) {
 	
 	var PointCtr = function() {
 		this.init();
 	};

 	PointCtr.prototype = {
 		/**
	 	 * 初始化点位页面
	 	 * @return {[type]} [description]
	 	 */
 		init: function() {
 			var self = this;
 			//加载助手
 			helper.pointRegister.pointHelper();
 			//加载普通模板
 			self.loadCommonTemp("inc/point-list-tpl.html");
 			//执行pointview中的初始化函数
 			pointView.init(PointCtr);
            $(".tab-panel .tab-content").css("display","none");
 			
 			if($("#userEntry").data("loginname") !== "admin"){
 				$(".searchPointstatus").css("display","none");
 				$(".pointStatus").css("display","none");
 			}
 		},
 		/**
 		 * 载入普通模板函数
 		 * @param  {[type]}   url      [description]
 		 * @param  {Function} callback [description]
 		 * @return {[type]}            [description]
 		 */
 		loadCommonTemp: function(url, callback) {
 			global.loadTemplate(url, function(compiler) {
 				global.pointCompiler = compiler;
 				callback && callback();
 			});
 		},
 		/**
 		 * 公用调后台并分页
 		 * @param  {[type]} option [传给后台参数]
 		 * @param  {[type]} ajaxE  [ajax对象]
 		 * @param  {[type]} flag   [是否进入平台]
 		 * @return {[type]}        [description]
 		 */
		loadList: function(option, ajaxE, flag) {
			var colspan = flag? 13:14;
			ajaxE(option, {
				beforeSend: function() {
					$(".point-library").find("tr").not(".table-header").remove();
					$(".point-library").find(".table-header").after('<tr><td class="loading" colspan="' + colspan + '"></td></tr>');
				}
			}, function(res) {
				if (res.code === 200) {
					$(".totalRecords").text(res.data.point_pageModel.totalRecords);
					//渲染页面
					pointView.renderList(res.data.point_pageModel.list, flag);
					option.pageCount = res.data.point_pageModel.totalRecords;
					if(option.pageCount === 0){
						$(".point-control .pagination").hide();
					}
					if (option.pageCount > 0) {
						//分页
						global.setPagination(option.pageCount, ".point-control .pagination", option.pageSize, option.currentPage - 1, function(nextPage) {
							option.currentPage = nextPage;
							ajaxE(option, {
									beforeSend: function() {}
								},
								function(res) {
									if (res.code === 200) {
										pointView.renderList(res.data.point_pageModel.list, flag);
									}
								}
							);
						});
					}
				} else {
					notify.warn(res.data);
				}
			});
		},
 		/**
 		 * 从后台调列表数据
 		 * @param  {[type]} flag [是否进入平台]
 		 * @return {[type]}      [description]
 		 */
 		loadYNEnterList: function(flag) {
 			var self = this;
 			var status = flag ? 1 : 0;
 			var option = {
 				currentPage: 1,
 				pageSize: 10,
 				enterPlatformStatus: status,
 				managerUnitName: global.managePointUnitName
 			};
 			self.loadList(option, ajaxCtr.ajaxEvents.getPointList, flag);

 		},
 		/**
 		 * 查询
 		 * @param  {[type]} obj [传给后台参数]
 		 * @return {[type]}     [description]
 		 */
 		search: function(obj) {
 			var self = this;
 			obj.managerUnitName = global.managePointUnitName;
 			if (obj.enterPlatformStatus === 1) {
 				self.loadList(obj, ajaxCtr.ajaxEvents.getSearchPoint, 1);
			} else {
 				self.loadList(obj, ajaxCtr.ajaxEvents.getSearchPoint, 0);
			}
		},
 		/**
 		 * 进入平台
 		 * @param  {[type]} obj [传给后台参数]
 		 * @return {[type]}     [description]
 		 */
 		enterLibrary: function(obj) {
 			var self = this;
 			ajaxCtr.ajaxEvents.getBatchPoint(obj, {
 				beforeSend: function() {}
 			}, function(res) {
				if (res.code === 200) {
 					//渲染页面
 					notify.success("点位成功进入平台");
 					$(".checkbox-h").find(".icon-checked").removeClass("icon-checked");
 					self.loadYNEnterList(0);
 					$(".point-library .checkbox-h i").addClass("icon-nochecked");
 				} else {
 					notify.warn("点位进入平台失败");
 				}
 			});
 		},
 		/**
 		 * 新建点位
 		 * @return {[type]} [description]
 		 */
 		createPoint: function() {
			var self = this;
 			//加载模板
 			$(".commonLayer").css("display", "block");
 			$(".createPoint").append(global.pointCompiler({
 				"createPoint": true
 			}));
 			//加载地图
 			jQuery(".pointmapPos").show(0);
 			if (global.pointMap) {
 				global.pointMap.destroyMap();
 			}
 			self.mapInit();
 		},
 		/**
 		 * map
 		 * @return {[type]} [description]
 		 */
 		mapInit: function() {
 			var mapConfig = new MapPlatForm.Base.MapConfig();
 			var currJosn = $.getJSON('/component/base/mapConfig.json', function(json) {
 				var resultJson = mapConfig.createMap(document.getElementById("mapSetPanel"), json);
 				global.pointMap = resultJson.map;
 				var ctrl = new NPMapLib.Controls.NavigationControl({
 					navigationType: "xxx",
 					xy: {
 						x: 4,
 						y: 4
 					}
 				});
 				global.pointMap.addControl(ctrl);
 				//鼠标样式
 				global.pointMap.addHandStyle();
 			});
		},
 		/**
 		 * 保存新建点位信息
 		 * @param  {[type]} params        [description]
 		 * @param  {[type]} ID            [description]
 		 * @param  {[type]} enterplatform [description]
 		 * @return {[type]}               [description]
 		 */
 		savePointMsg: function(params, ID, enterplatform) {
 			var self = this;
 			if ($(".editPoint").find(".pointDialog").length === 1) {
 				params.id = ID;
 				ajaxCtr.ajaxEvents.editPoint({
 					params: JSON.stringify(params)
 				}, {
 					beforeSend: function() {}
 				}, function(res) {
					if (res.code === 200) {
						notify.success("编辑数据成功");
 						$(".commonLayer").css("display", "none");
 						$(".pointDialog").remove();
 						//显示导航
            			window.top.showHideNav("show");
 						self.loadYNEnterList(enterplatform);
					} else {
 						notify.warn("编辑失败");
 					}
 				});
 			} else {
 				ajaxCtr.ajaxEvents.createPoint({
 					params: JSON.stringify(params)
 				}, {
 					beforeSend: function() {}
 				}, function(res) {
 					if (res.code === 200) {
 						notify.success("保存数据成功");
 						$(".commonLayer").css("display", "none");
 						$(".pointDialog").remove();
 						$(".pointmapPos").remove();
 						//显示导航
            			window.top.showHideNav("show");
 						self.loadYNEnterList(enterplatform);
					} else {
 						notify.warn(res.data);
 					}
 				});
 			}
		},
 		/**
 		 * 编辑点位
 		 * @param  {[type]} obj [description]
 		 * @return {[type]}     [description]
 		 */
 		editTask: function(obj) {
 			var self = this;
 			//渲染页面
			$(".commonLayer").css("display", "block");
 			$(".editPoint").html(global.pointCompiler({
 				"data": obj,
 				"editPoint": true
 			}));
 			pointView._bindEvents(".editPoint");
 			jQuery(".editPoint").find(".pointmapPos").show(0);
 			if (global.pointMap) {
 				global.pointMap.destroyMap();
 			}
 			self.mapInit();
 		},
 		/**
 		 * 注销点位
 		 * @param  {[type]} data       [description]
 		 * @param  {[type]} currentEle [description]
 		 * @return {[type]}            [description]
 		 */
 		logoutTask: function(data, currentEle) {
 			ajaxCtr.ajaxEvents.logoutPoint(data, {
 				beforeSend: function() {}
 			}, function(res) {
 				if (res.code === 200) {
 					//渲染页面
 					notify.success("注销成功");
 					pointView.logoutPointStyle(currentEle);
 				} else {
 					notify.warn("注销失败");
 				}
 			});
		},
 		/**
 		 * 显示点位下的摄像机详情
 		 * @param  {[type]} ele [description]
 		 * @param  {[type]} id  [description]
 		 * @return {[type]}     [description]
 		 */
 		creatDetailTable: function(ele, id,flag) {
 			//加载详情table头
 			var pointIdText = ele.find("td").eq(0).html();
			ele.after(global.pointCompiler({
 				"showPointDetails": true
 			}));
 			//渲染
 			ajaxCtr.ajaxEvents.getCameraIDPoint({
 				pointId: id,
 				enterPlatformStatus: flag
 			}, {
 				beforeSend: function() {}
 			}, function(res) {
 				if (res.code === 200) {
 					//渲染页面
 					pointView.renderDetailTable(res.data.cameraDeviceList);
 				} else {
 					notify.warn(res.data);
 				}
 			});
		},
	 	/**
		 * [selectRightPointSite 实时查询匹配搜索输入值的选项]
		 * @param  {[type]} str [description]
		 * @return {[type]}     [description]
		 */
		selectRightPointSite: function(str){
			ajaxCtr.ajaxEvents.getPointSite({
 				pointSite:str
 			}, {
 				beforeSend: function() {}
 			}, function(res) {
 				if (res.code === 200) {
 					//渲染页面
 					
 					pointView.changeSelect(res.data.siteList);
 				}
 			});
		},
	};
 	return new PointCtr();
 });