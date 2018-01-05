/**
 * Created by Zhangyu on 2015/9/16.
 * ��Ҫ��Ϊ�˲���ģ����ת����ʱ����ʹ��
 */
define(["jquery"], function(jQuery){

    var _delayLoadTimer = null,     //��ʱ���ض�ʱ��
        _curDelayLoadTime = 0,      //��ʱ���ص�ǰ�ۼ�ʱ����
        _delayTimerInfo = {
            delayLoadSpan: 10,           //��ʱ����ʱ������Ĭ��10�����ж�һ��
            delayLoadTotalTime: 20 * 1000//��ʱ������ȴ�ʱ�䣬Ĭ��20��
        };
    /**
     * ��ʱ��ʱ�������
     * @param check - �����жϺ���������ʱ�˳�����
     * @param fn - �ж������ɹ���Ļص�����
     * @param options - ������
     * @private
     */
    var _IntervalForDelay = function(check, fn, options) {
        //�жϲ����Ϸ���
        if(typeof check !== "function" || typeof fn !== "function") {
            throw "��ʱ���ز�������";
        }
        //��չ����
        jQuery.extend(_delayTimerInfo, options);
        //�ر����еĶ�ʱ��
        if (_delayLoadTimer) {
            _curDelayLoadTime = 0;
            window.clearInterval(_delayLoadTimer);
        }
        //�����µĶ�ʱ��
        _delayLoadTimer = window.setInterval(function () {
            if (check && check()) {
                //�����ʱ��
                window.clearInterval(_delayLoadTimer);
                //ִ�в���
                fn && fn();
            } else {
                if (_curDelayLoadTime > _delayTimerInfo.delayLoadTotalTime) {
                    //������������ȴ�ʱ�䣬�������ʱ��
                    window.clearInterval(_delayLoadTimer);
                } else {
                    //�ۼ�ʱ��
                    _curDelayLoadTime += _delayTimerInfo.delayLoadSpan;
                }
            }
        }, _delayTimerInfo.delayLoadSpan);
    };
    /**
     * �����ʼ�����
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