/**
 * Created by Zhangyu on 2014/12/23.
 * 全局搜索，周围资源搜索的控制逻辑
 */
define([
	"js/npmap-new/model/mapsearch-model",
	"js/npmap-new/view/mapsearch-circle-view",
	"js/npmap-new/view/mapsearch-common-view",
	"js/npmap-new/controller/mapsearch-common-fun",
	"js/npmap-new/map-common",
	"js/npmap-new/map-variable",
	"js/npmap-new/controller/mapsearch-result-controller",
	"js/npmap-new/map-common-overlayer-ctrl",
	"jquery",
	"pubsub"
], function(model, view, commonView, commonFuns, Common, mapVariable, SearchResult, MapOverLayerCtrl, jQuery, PubSub) {

	var Controller = function(){

		var self = this;

		//订阅事件-触发周围搜索查询
		PubSub.subscribe("dealSearchInCircle1", function(msg, data){
			self.dealSearchInCircle(data.value);
		});

		//订阅事件-搜索查询（接收来自left-for-map-select-view.js,分页查询）
		PubSub.subscribe("circleSearch", function(msg, data){
			self.circleSearch(data);
		});
	};

	Controller.prototype = {
		//当前圈搜索类型
		currCircleSearchType: 0,
		//常量
		circleConst: {
			"0" : {
				"type": "cameras",
				"formateType": "camera",
				"msg": "没有查询到摄像机，请调整搜索范围！"
			},
			"1" : {
				"type": "alarms",
				"formateType": "alarm",
				"msg": "没有查询到报警信息，请调整搜索范围！"
			},
			"2" : {
				"type": "gps",
				"formateType": "gps",
				"msg": "没有查询到警车信息，请调整搜索范围！"
			},
			"3" : {
				"type": "350M",
				"formateType": "350M",
				"msg": "没有查询到警员信息，请调整搜索范围！"
			},
			"4" : {
				"type": "lampposts",
				"formateType": "lightbar",
				"msg": "没有查询到灯杆信息，请调整搜索范围！"
			},
			"5" : {
				"type": "bayonet",
				"formateType": "bayonet",
				"msg": "没有查询到卡口信息，请调整搜索范围！"
			},
			"6" : {
				"type": "normal",
				"formateType": "normal",
				"msg": "没有查询到结果，请调整搜索范围！"
			}
		},
		/**
		 * 搜索圈内的摄像机、报警、警力（gps、350）
		 * @param centerPoint - 搜索中心点的位置
		 * @param type - 搜索类型
		 * @param extern - 输入搜索时的搜索关键字
		 */
		searchInCircle: function(centerPoint, type, extern) {
			var self = this;
			//初始化并显示圈圈
			self.currCircleSearchType = type;
			//切换地图资源图层
			MapOverLayerCtrl.showAndHideOverLayers("on-range-circle-map-select", type);
			//绘制圈圈
			view.searchInCircle(centerPoint, extern);
		},
		/**
		 * 处理圈圈内的查询
		 * @param value - 输入搜索时的搜索关键字
		 */
		dealSearchInCircle: function(value) {
			var self = this,
				points = Common.convertArrayToGeoJson(mapVariable.GlobalSearch.searchCircle.getPoints(), "Polygon"),
				resultItem = this.circleConst[self.currCircleSearchType].type,
				msg = this.circleConst[self.currCircleSearchType].msg;
			//获取当前搜索中心点和半径
			var centerPoint = mapVariable.GlobalSearch.searchCircle.getCenter(),
				radius = parseInt(mapVariable.GlobalSearch.searchCircle.getRadius());
			//组装查询参数
			var data = {
					lat: Common.parseFloat(centerPoint.lat, 6),
					lon: Common.parseFloat(centerPoint.lon, 6),
					radius: radius
				};

			//根据类型不同，搜索不同的资源
			if (self.currCircleSearchType === 0) {
				data = {
					geometry: points,
					current_page: 1,
					page_size: 20
				};
			} else if (self.currCircleSearchType === 1) {
				data = {
					geometry: points
				};
			} else if (self.currCircleSearchType === 2) {
			} else if (self.currCircleSearchType === 3) {
			} else if (self.currCircleSearchType === 4) {
				data = {
					geometry: points,
					currentPage: 1,
					pageSize: 20
				};
			} else if (self.currCircleSearchType === 5) {
				//卡口资源
				require(["js/pvd/monitor/gateUtil"], function(GateUtil){
					//查询卡口资源
					GateUtil.getByCircle((value ? value : ""), window.map, centerPoint.lon, centerPoint.lat, radius).then(function(res) {
						//如果数据不为空或者是输入搜索时，需要切换页面
						//if (res.length !== 0 || value) {
						//如果有数据，则显示结果
						self.showResOnSearchAround(res);
						/*} else {
						 notify.warn("当前范围内暂无卡口数据！");
						 }*/
					});
				});
				return;
			} else if (self.currCircleSearchType === 6) {
				//圈圈内输入搜索
				require(["js/connection/view/left-for-search-view"], function(LeftPanelSearchView) {
					LeftPanelSearchView.init(function() {
						LeftPanelSearchView.showSearchResult("around", {
							value: value
						}, self);
					});
				});
				return;
			}
			//添加关键字过滤
			data.keyWord = value ? value : "";
			//执行查询
			self.circleSearch(data, resultItem);
		},
		/**
		 * 查询圈圈里的资源
		 * @param data - 参数信息
		 * @param resultItem - 结果项
		 */
		circleSearch: function(data, resultItem) {
			var self = this;
			//执行查询
			model.getAroundResource(data, {
				cache: false
			}, self.currCircleSearchType).then(function (res) {
				if (res.code === 200) {
					//如果数据不为空或者是输入搜索时，需要切换页面
					/*if (res.data[resultItem].length === 0 && !value) {
					 notify.warn(msg);
					 } else {*/
					//如果有数据，则显示结果
					self.showResOnSearchAround(res.data[resultItem], data, res);
					//}
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("搜索周边资源失败，获取数据异常！");//错误码：" + res.code);
				}
				//隐藏等待加载浮动条
				commonView.showLoading(false);
			}, function () {
				notify.error("搜索周边资源失败，请查看网络状况！");
				//隐藏等待加载浮动条
				commonView.showLoading(false);
			});
		},
		/**
		 * 展现查询到的周边资源到地图上并渲染左侧列表
		 * @param list - 周边资源查询结果-非摄像机数据时使用
		 * @param data - 当前周边范围的查询数据
		 * @param res - 结果数据，摄像机数据时使用
		 */
		showResOnSearchAround: function(list, data, res) {
			var self = this,
				dataType = this.circleConst[self.currCircleSearchType].formateType;
			//显示搜索结果
			if (self.currCircleSearchType === 0) {
				res.data.reqParam = data;
				//摄像机资源
				PubSub.publish("showResultOnSearch", {
					result: res,
					from: "around"
				});
			} else {
				//报警资源
				var resultList = commonFuns.formatResultData(list, 1, dataType, "around");
				//更新左侧列表并显示在地图上
				SearchResult.showSearchResult(resultList, dataType, "around");
			}
		}
	};

	return new Controller();
});
