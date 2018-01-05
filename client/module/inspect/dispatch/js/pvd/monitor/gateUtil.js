/**
 * Created by ACE on 2015/4/27.
 */
define(function(require, exports, module) {
    var _gateCache = null,
        _getGates = function(cache) {
            if (!_gateCache || cache) {
                return $.get('/pvdservice/traffic/roadMonitor/all').then(function(res) {
                    if (res.code == 200 && res.data) {
                        _gateCache = res.data;
                        return _gateCache;
                    }
                    return [];
                });
            } else {
                return $.Deferred().resolve(_gateCache);
            }
        };
    module.exports = {
        /**
         * 获取视野内卡口
         * @param  {[type]}   x1       左上角坐标X
         * @param  {[type]}   y1       左上角坐标Y
         * @param  {[type]}   x2       右下角坐标X
         * @param  {[type]}   y2       右下角坐标Y
         * @param  {Function} callback 回调
         * @return {[type]}            返回Deferred对象
         */
        getByRectangle: function(name, x1, y1, x2, y2, callback) {
            if (x2 < x1) {
                x1 = x1 + x2;
                x2 = x1 - x2;
                x1 = x1 - x2;
            }
            if (y2 < y1) {
                y1 = y1 + y2;
                y2 = y1 - y2;
                y1 = y1 - y2;
            }
            return _getGates().then(function(gateList) {
                var i = 0,
                    item,
                    len = gateList.length,
                    resultGateList = [];
                for (; i < len; i++) {
                    item = gateList[i];
                    if (item.x >= x1 && item.x <= x2 && item.y >= y1 && item.y <= y2 && (!item.name || item.name.indexOf(name) > -1)) {
                        resultGateList.push(item);
                    }
                }
                callback && callback(resultGateList);
                return resultGateList;
            });
        },
        /**
         * 获取附近卡口
         * @param  {[type]}   map      地图对象，用来计算两点之间距离
         * @param  {[type]}   x        中心点X
         * @param  {[type]}   y        中心点Y
         * @param  {[type]}   r        半径(单位:米)
         * @param  {Function} callback 回调
         * @return {[type]}            返回Deferred对象
         */
        getByCircle: function(name, map, x, y, r, callback) {
            return _getGates().then(function(gateList) {
                var i = 0,
                    item,
                    len = gateList.length,
                    centerPoint = new NPMapLib.Geometry.Point(x, y),
                    resultGateList = [];
                for (; i < len; i++) {
                    item = gateList[i];
                    if (map.getDistance(centerPoint, new NPMapLib.Geometry.Point(item.x, item.y)) <= r && (!item.name || item.name.indexOf(name) > -1)) {
                        resultGateList.push(item);
                    }
                }
                callback && callback(resultGateList);
                return resultGateList;
            });
        },
        /**
         * 通过名称查询卡口
         * @param  {[type]}   name     要查询的名称
         * @param  {Function} callback 回调
         * @return {[type]}            返回Deferred对象
         */
        getByName: function(name, callback) {
            return _getGates().then(function(gateList) {
                var i = 0,
                    item,
                    len = gateList.length,
                    resultGateList = [];
                for (; i < len; i++) {
                    item = gateList[i];
                    if (item.name.indexOf(name) > -1) {
                        resultGateList.push(item);
                    }
                }
                callback && callback(resultGateList);
                return resultGateList;
            });
        }
    };
});
