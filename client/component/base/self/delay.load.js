/**
 * Created by Zhangyu on 2015/9/16.
 * 主要是为了部分模块跳转的延时加载使用
 */
define(["jquery"], function(jQuery){

    var _delayLoadTimer = null,     //延时加载定时器
        _curDelayLoadTime = 0,      //延时加载当前累计时间间隔
        _delayTimerInfo = {
            delayLoadSpan: 10,           //延时加载时间间隔，默认10毫秒判断一次
            delayLoadTotalTime: 20 * 1000//延时加载最长等待时间，默认20秒
        };
    /**
     * 定时延时处理程序
     * @param check - 条件判断函数，即延时退出函数
     * @param fn - 判断条件成功后的回调函数
     * @param options - 配置项
     * @private
     */
    var _IntervalForDelay = function(check, fn, options) {
        //判断参数合法性
        if(typeof check !== "function" || typeof fn !== "function") {
            throw "延时加载参数错误。";
        }
        //扩展参数
        jQuery.extend(_delayTimerInfo, options);
        //关闭已有的定时器
        if (_delayLoadTimer) {
            _curDelayLoadTime = 0;
            window.clearInterval(_delayLoadTimer);
        }
        //开启新的定时器
        _delayLoadTimer = window.setInterval(function () {
            if (check && check()) {
                //清除定时器
                window.clearInterval(_delayLoadTimer);
                //执行操作
                fn && fn();
            } else {
                if (_curDelayLoadTime > _delayTimerInfo.delayLoadTotalTime) {
                    //如果超出了最大等待时间，则清除定时器
                    window.clearInterval(_delayLoadTimer);
                } else {
                    //累计时间
                    _curDelayLoadTime += _delayTimerInfo.delayLoadSpan;
                }
            }
        }, _delayTimerInfo.delayLoadSpan);
    };
    /**
     * 定义初始化入口
     * @type {{init: Function, initGlobal: Function}}
     */
    return {
        init: function () {
            return _IntervalForDelay;
        },
        initGlobal: function () {
            (function () {
                this.IntervalForDelay = _IntervalForDelay;
            }).call(window);
        }
    };
});