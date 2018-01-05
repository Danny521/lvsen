/**
 * Created by LiangChuang on 2014/12/3.
 */
define(["domReady","jquery-ui-1.10.1.custom.min","tree","base.self","scrollbar","echarts-plain","thickbox","permission"],function(domReady){
    domReady(function(){
        require(["js/reports","js/cameraStat","js/examine"]);
        updateThirdNav(); //三级菜单控制
    });
});