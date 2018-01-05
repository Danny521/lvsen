/**
 * 系统组织树相关公共配置函数
 * Created by Zhangyu on 2015/7/28.
 */
define(["pvaConfig"], function() {
    // 多级部署 组织树，资源树显示的顶级组织不一样
    // 1) 集中部署：组织树需显示父组织，即从当前用户所在组织的上一级开始显示；资源树从顶级组织开始显示 ；
    // 2) 多级部署：组织树和资源树均从当前用户所属组织开始显示。
    var sysConfig = {
        /**
         * 获取组织树的参数
         * @author chencheng
         * @date   2015-04-01
         * @return {[type]}   [description]
         */
        getOrgMode: function() {
            if (window.deployMode === "distribution") {
                return "isOrgUser=isOrgUser";
            } else if (window.deployMode === "concentration") {
                return "isParentOrg=isParentOrg";
            }
            return "";
        },
        /**
         * 获取资源树的参数
         * @date   2015-04-01
         * @return {[type]}   [description]
         */
        getResMode: function() {
            if (window.deployMode === "distribution") {
                return 0;
            } else if (window.deployMode === "concentration") {
                return 1;
            }
            return "";
        }
    };
    //ip地址页面校验
    var ipValid={
        keyPress:function(obj){
            debugger
            obj.value=obj.value.replace(/[^\d]/g,'') ;
            key1=event.keyCode ;
            if(key1==46||key1==110||key1==190){
                event.preventDefault();
            }
        },
        mask:function (obj){ 
            obj.value=obj.value.replace(/[^\d]/g,'') ;
            key1=event.keyCode ;
            if(key1==46||key1==110||key1==190){
                if(obj.value){
                    $(obj).next('input').focus();
                }
                return;
            }
            if(key1==37){
                $(obj).prev('input').focus();
            }
            if(key1==39){
                $(obj).next('input').focus();
            }
            if(obj.value.length>=3){
                if(parseInt(obj.value)>=256  ||  parseInt(obj.value)<=0) { 
                    notify.error(parseInt(obj.value)+"IP地址错误！") ;
                    obj.value="" ;
                    obj.focus() ;
                    return  false; 
                } 
                else   {  
                    obj.blur(); 
                    $(obj).next('input').focus();
                } 
            }   
        },
        mask_c:function(obj) { 
            clipboardData.setData('text',clipboardData.getData('text').replace(/[^\d]/g,'')) ;
        } 
    }
    

    /**
     * 定义初始化入口
     * @type {{init: Function, initGlobal: Function}}
     */
    return {
        init: function () {
            return sysConfig;
        },
        initGlobal: function () {
            (function () {
                this.sysConfig = sysConfig;
                this.ipValid=ipValid;
            }).call(window);
        }
    };
});