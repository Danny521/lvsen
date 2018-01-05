define([
	'pubsub',
	'js/npmap-new/model/maptool-searchInscope-model',
	'js/npmap-new/view/maptool-searchInscope-view',
	'js/npmap-new/controller/map-things-search',
	'js/connection/controller/left-for-map-select-controller'
], function(pubsub, Model, searchInscopeView, MapThingsSearch) {

		var searchInScopeController = function() {
			var self = this;
			//订阅 获取分组
			pubsub.subscribe("getGroups", function(msg, obj) {
				self.getGroups(obj);
			});
			//订阅 获取视野范围内的分组摄像机
			pubsub.subscribe("getGroupCameraInScope", function(msg, obj) {
				self.getGroupCamerasInScope(obj);
			});
			//订阅 获取视野范围内的GPS
			pubsub.subscribe("getGpsInscope", function(msg, obj) {
				self.getGpsInscope(obj);
			});
			//订阅 获取视野范围内的灯杆
			pubsub.subscribe("getLightbarInscope", function(msg, obj) {
				self.getLightBarInscope(obj);
			});
			//订阅 分页获取视野范围内的所有摄像机
			pubsub.subscribe("getCameraInscope", function(msg, obj) {
				self.getCameraInscope(obj);
			});
			//订阅 获取视野范围内的卡口
			pubsub.subscribe("getBayonetInscope", function(msg, obj) {
				self.getBayonetInscope(obj);
			});
			//订阅 获取视野范围内的350M
			pubsub.subscribe("get350MInscope", function(msg, obj) {
				self.get350MInscope(obj);
			});
			//订阅 获取视野范围内的报警信息
			pubsub.subscribe("getAlarmInscope", function(msg, obj) {
				self.getAlarmInscope(obj);
			});
			//订阅 获取视野范围内的输入查询
			pubsub.subscribe("searchAllInscope", function(msg, obj) {
				self.searchAllInscope(obj);
			});
		};

		searchInScopeController.prototype = {
			/**
			 * 获取分组
			 * @author Li Dan
			 * @date   2014-12-16
			 * @return {[type]}   [description]
			 */
			getGroups: function(obj) {
				Model.getGroups(obj, {}).then(function(result) {
					searchInscopeView.setGroups(result);
				});
			},
			/**
			 * 获取视野范围内的分组摄像机
			 * @author Li Dan
			 * @date   2014-12-16
			 * @param  {[type]}   obj [description]
			 * @return {[type]}       [description]
			 */
			getGroupCamerasInScope: function(obj) {
				Model.getGroupCamerasInScope(obj, {}).then(function(result) {
					result.data.reqParam = obj;
					searchInscopeView.setGroupCamerasInscope(result, obj);
				});
			},
			/**
			 * 获取视野范围内的警车
			 * @author Li Dan
			 * @date   2014-12-16
			 * @param  {[type]}   obj [description]
			 * @return {[type]}       [description]
			 */
			getGpsInscope: function(obj) {
				Model.getGpsInScope(obj.location, {}).then(function (res) {
					if (res.code === 200) {
						//如果数据不为空或者是输入搜索时，需要切换页面
						if(res.data.gps.length !== 0 || obj.extern) {
							MapThingsSearch.showSearchResultOnScope(res.data.gps, "gps", obj.extern);
						} else {
							notify.warn("当前视野范围内没有查询到警力资源！");
						}
					} else {
						notify.error("视野内获取警力信号失败！");//错误码：" + res.code);
					}
				});
			},
			/**
			 * 获取视野范围内的灯杆
			 * @author Li Dan
			 * @date   2014-12-16
			 * @param  {[type]}   obj [description]
			 * @return {[type]}       [description]
			 */
			getLightBarInscope: function(obj) {

				Model.getLightbarInScope(obj.location, {}).then(function(res) {
					if (res.code === 200) {
						//如果数据不为空或者是输入搜索时，需要切换页面
						if(res.data.lampposts.length !== 0 || obj.extern) {
							MapThingsSearch.showSearchResultOnScope(res.data.lampposts, "lightbar", obj.extern);
						} else {
							notify.warn("当前视野范围内没有查询到灯杆资源！");
						}
					} else {
						notify.error("视野内获取灯杆资源失败！");//错误码：" + res.code);
					}
				});
			},
			/**
			 * 获取视野范围内的摄像机
			 * @author Li Dan
			 * @date   2014-12-16
			 * @param  {[type]}   obj [description]
			 * @return {[type]}       [description]
			 */
			getCameraInscope: function(obj) {
				var params = {};
				if(obj.currentPage){
					//分页
					params = obj;
				} else {
					//非分页
					params = {
						minLongitude: obj.extent.sw.lon,
						minLatitude: obj.extent.sw.lat,
						maxLongitude: obj.extent.ne.lon,
						maxLatitude: obj.extent.ne.lat,
						currentPage: 1,
						pageSize: 20,
						keyWord: obj.extern
					};
				}
				Model.getCameraInscope(params, {}).then(function (res) {
					if (res.code === 200) {
						//如果数据不为空或者是输入搜索时，需要切换页面
						if (res.data.count !== 0 || obj.extern) {
							searchInscopeView.setRangeCameras({
								data: {
									cameras: res.data.cameras,
									count: res.data.count,
									pageCount: res.data.pageCount,
									reqParam: params
								},
								extern: obj.extern
							});
						} else {
							notify.warn("当前视野范围内没有查询到摄像机资源！");
						}
					} else {
						notify.error("视野内获取摄像机资源失败！");//错误码：" + res.code);
					}
				});
			},
			/**
			 * 获取视野范围内的卡口
			 * @author Li Dan
			 * @date   2014-12-16
			 * @param  {[type]}   obj [description]
			 * @return {[type]}       [description]
			 */
			getBayonetInscope: function(obj) {
				//卡口资源
				require(["js/pvd/monitor/gateUtil"], function(GateUtil){
					//查询卡口资源
					GateUtil.getByRectangle((obj.extern ? obj.extern : ""), obj.location.x1, obj.location.y1, obj.location.x2, obj.location.y2).then(function(res) {
						//如果数据不为空或者是输入搜索时，需要切换页面
						if (res.length !== 0 || obj.extern) {
							//如果有数据，则显示结果
							MapThingsSearch.showSearchResultOnScope(res, "bayonet", obj.extern);
						} else {
							notify.warn("当前视野范围内没有查询到卡口资源！");
						}
					});
				});
			},
			/**
			 * 获取视野范围内的警员
			 * @author Li Dan
			 * @date   2014-12-16
			 * @param  {[type]}   obj [description]
			 * @return {[type]}       [description]
			 */
			get350MInscope: function(obj) {
				Model.get350MInscope(obj.location, {}).then(function(res) {
					if (res.code === 200) {
						var result = res.data["350M"] || res.data.gps;
						//如果数据不为空或者是输入搜索时，需要切换页面
						if (result.length !== 0 || obj.extern) {
							MapThingsSearch.showSearchResultOnScope(result, "350M", obj.extern);
						} else {
							notify.warn("当前视野范围内没有查询到警员信号！");
						}
					} else {
						notify.error("视野内获取警员资源失败！");//错误码：" + res.code);
					}
				});
			},
			/**
			 * 搜索视野范围内的报警信息
			 * @param obj - 参数信息
			 */
			getAlarmInscope: function(obj) {
				Model.getAlarmInscope(obj.location, {}).then(function(res) {
					if (res.code === 200) {
						var result = res.data.list || [];
						//如果数据不为空或者是输入搜索时，需要切换页面
						if (result.length !== 0 || obj.extern) {
							MapThingsSearch.showSearchResultOnScope(result, "alarm", obj.extern);
						} else {
							notify.warn("当前视野范围内没有查询到报警信息！");
						}
					} else {
						notify.error("视野内获取报警数据失败！");//错误码：" + res.code);
					}
				});
			}
		};

		return new searchInScopeController();
	});