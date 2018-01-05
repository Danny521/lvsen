/*global NPMapLib:true*/
/**
 * Created by Zhangyu on 2015/1/6.
 * 全局搜索中间结果缓存相关控制器
 */
define([], function() {

	return (function () {

		//考虑到ie每次都进行查询，比较慢，为了提高效率，对已查询的数据结果进行缓存，15分钟清除一次，清除时保存频率较高的5个结果
		var _cacheInfo = {
			cacheData: [], //存储缓存数据{ value: 查询的值, data: 查询结果, frequence: 频繁度}
			isUseCache: true, //标记是否使用缓存
			delCacheSpan: 10 * 60 * 1000, //删除缓存的时间间隔，默认10分钟
			lastNum: 5, //每次删除后预留的数据个数
			delCacheTimer: null //缓存删除定时器
		};

		return {
			//对外暴露属性，标记是否使用缓存
			isUseCache: _cacheInfo.isUseCache,
			/**
			 * 在缓存中查找，返回成功与否标记和对应的结果（如果查找成功）
			 * @param inputValue
			 * @param type
			 * @returns {{success: boolean, data: *}}
			 */
			getResultInCache: function (inputValue, type) {
				var resultData = null, isIn = false;
				for (var i = 0, length = _cacheInfo.cacheData.length; i < length; i++) {
					if (_cacheInfo.cacheData[i].value === inputValue && _cacheInfo.cacheData[i].data[type]) {
						isIn = true;
						resultData = _cacheInfo.cacheData[i].data[type];
						_cacheInfo.cacheData[i].frequence++; //使用一次，频繁度加1
						break;
					}
				}
				return {
					success: isIn,
					data: resultData
				};
			},

			/**
			 * 添加数据到缓存中{ value: 查询的值, data: 查询结果, frequence: 频繁度}
			 * @param inputValue - 查询的值
			 * @param queryResult - 查询结果
			 * @param type - 数据类型
			 */
			addDataToCache: function (inputValue, queryResult, type) {

				//遍历缓存
				for (var i = 0, length = _cacheInfo.cacheData.length; i < length; i++) {
					if (_cacheInfo.cacheData[i].value === inputValue) {
						_cacheInfo.cacheData[i].data[type] = queryResult;
						break;
					}
				}
				//没找到，全新的
				if (i === _cacheInfo.cacheData.length) {
					var tempData = {};
					tempData[type] = queryResult;
					_cacheInfo.cacheData.push({
						value: inputValue,
						data: tempData,
						frequence: 1
					});
				}
			},

			/**
			 * 从cacheData中删除查询数据，以免太过冗余，一定时间一次，每次删除只保留前五个频繁度高的
			 */
			delDataFromCache: function () {

				if (_cacheInfo.cacheData.length > _cacheInfo.lastNum) {
					//第一步：对list数据根据value值进行排序
					_cacheInfo.cacheData.sort(function (a, b) {
						if (a.frequence > b.frequence) {
							return -1;
						} else {
							return 1;
						}
					});
					//第二步：截取保存的数组
					_cacheInfo.cacheData = _cacheInfo.cacheData.slice(0, _cacheInfo.lastNum);
				}
			},

			/**
			 * 检测缓存并进行定时更新，只能频繁使用的5个记录
			 */
			checkAndUpdateCache: function () {

				var self = this;

				if (_cacheInfo.isUseCache && !_cacheInfo.delCacheTimer) {
					_cacheInfo.delCacheTimer = setInterval(function () {
						if (self.delDataFromCache) {
							self.delDataFromCache();
						}
					}, _cacheInfo.delCacheSpan);
				}
			}
		};
	}());
});