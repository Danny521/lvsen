/**
 * Created by Zhangyu on 2015/4/9.
 */
/**
 * Created by Zhangyu on 2014/12/17.
 * 全局搜索的主控制器
 */
define([
	"js/npmap-new/controller/mapsearch-circle-controller",
	"js/npmap-new/controller/mapsearch-result-controller",
	"js/npmap-new/controller/mapsearch-common-fun",
	"js/npmap-new/mapsearch-variable"
], function(circleCtrl, SearchResult, commonFuns, _g) {

	return (function (scope) {
		/**
		 * 视野范围内搜索时，调用此函数进行数据展现
		 * @param data - 待展现的搜索数据
		 * @param dataType - 数据类型，警力：gps，灯杆：lightbar，摄像机：camera, 卡口：bayonet， 警员：350M
		 * @param extern - 输入搜索时用，待查询的关键字
		 */
		scope.showSearchResultOnScope = function (data, dataType, extern) {
			//判断是否是输入搜索
			if(extern) {
				_g.isInputSearch = true;
			} else {
				//如果不是，则置false
				_g.isInputSearch = false;
			}
			//视野范围类搜索警力、灯杆
			var resultData = commonFuns.formatResultData(data, 1, dataType, "range");
			SearchResult.showSearchResult(resultData, dataType, "range");
		};

		/**
		 * 在附近查找资源
		 * @param type - 当前的数据类型
		 * @param position - 搜索范围的中心点坐标信息
		 * @param extern - 输入搜索时的搜素关键字
		 */
		scope.triggerSearchInCircle = function (type, position, extern) {
			//判断是否是输入搜索
			if (extern) {
				_g.isInputSearch = true;
			} else {
				//如果不是，则置false
				_g.isInputSearch = false;
			}
			//清除掉当前的圈圈
			commonFuns.clearOnSearchAround(1);
			//执行搜索
			circleCtrl.searchInCircle(position, type, extern);
		};

		return scope;

	}({}));
});