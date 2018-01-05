/**
 *
 * @authors lrxia (lrxia@netposa.com)
 * @date    2015/6/12
 * @version $
 */
require(['/require-conf.js'],function(){
    require(['base.self','jquery-ui-timepicker-addon','js/showDetail-list','js/pageMouseEvent.js'],function(base,timepicker,showDetailList,pageMouseEvent){
        pageMouseEvent.bindEventInit()
        showDetailList.init();
    });
});