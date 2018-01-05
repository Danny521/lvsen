/**
 *
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-04-09 17:02:08
 * @version $Id$
 */

define(['jquery'], function($) {
    var root = $('#content'),
        sidebarContent = $('#sidebar-body'),
        domArray = [],  //面板内容保存数组
        domArrayInit = [], //初始化数据数组，保存面板的最初始化内容。
        lastMarkName = 'temporary', //记录该移除的面板名称
        SidebarManager = function() {
            /**
             *  dom参数对象 包括3个属性 
             *  name : 用来确认需要插入html的dom元素。
             *  markName : 标识面板的标志
             *  template ：插入到dom元素的初始化内容
             */

            if (!window.inspectSuperMainLoaded) {
                return;
            }

            domArray["resource"] = $("#sidebar-body").children();
            domArrayInit["resource"] = window.inspectSuperMainResourceTml;
        };

    SidebarManager.prototype = {
        /**
         * [init 初始化面板内容，如果在初始化数组已经存在，已经调用]
         * @author yuqiu
         * @date   2015-04-17T11:04:45+0800
         * @param  {[type]}                 dom [传入一个对象，包括{name,markName,template}]
         * @return {[type]}                     [返回 当前对象，已提供链式调用]
         */
        init: function(dom) {
            var domContent = _getDomNode(dom.name);
            dom.markName ? true : dom.markName = 'temporary';
            this.remove({
                markName: lastMarkName,
                name: domContent
            });
            lastMarkName = dom.markName;
            !domArrayInit[dom.markName] ? (domContent.html(dom.template), domArrayInit[dom.markName] = dom.template) : (domContent.append(domArrayInit[dom.markName]));
            return this;
        },
        /**
         * [remove 删除掉对应标识的面板内容]
         * @author yuqiu
         * @date   2015-04-17T11:08:37+0800
         * @param  {[type]}                 dom [传入一个对象，包括{name,markName}]
         * @return {[type]}                     [返回当前对象，已提供链式调用]
         */
        remove: function(dom) {
            dom.markName ? true : dom.markName = 'temporary';
            domArray[dom.markName] = _getDomNode(dom.name).children().detach();
            return this;
        },
        /**
         * [push 给dom.name 元素，插入相对应的内容，从存储数组中取。]
         * @author yuqiu
         * @date   2015-04-17T11:09:23+0800
         * @param  {[type]}                 dom [传入一个对象，包括{name,markName}]
         * @return {[type]}                     [返回当前对象，已提供链式调用]
         */
        push: function(dom) {
            var domContent = _getDomNode(dom.name);
            this.remove({
                markName: lastMarkName,
                name: dom.name
            });
            lastMarkName = dom.markName;
            domContent.append(dom.template || domArray[dom.markName]);
            return this;
        },
        /**
         * [click 区分点击事件是初始化还是平常点击切换]
         * @author yuqiu
         * @date   2015-04-17T11:10:38+0800
         * @param  {[type]}                 dom [传入一个对象，包括{name,markName，template}]
         * @return {[type]}                     [返回当前对象，已提供链式调用]
         */
        click: function(dom, initBool) {
            initBool ? this.init(dom) : this.push(dom);
            return this;
        },
        /**
         * [initClickEvent 绑定通用的点击事件]
         * @author yuqiu
         * @date   2015-04-17T11:14:41+0800
         * @return {[type]}                 [返回当前对象，已提供链式调用]
         */
        initClickEvent: function() {
            var self = this;
            root.on('click', '.np-sidebar-click:not(.np-first)', function(event) {
                event.stopPropagation();
                event.preventDefault();
                var domInfo = {
                    markName: $(this).attr('data-mark'),
                    name: $(this).attr('data-dom')
                };
                self.click(domInfo, $(this).hasClass('init'));
                //当点击资源时资源树刷不出来，自动触发摄像机资源按钮中的click事件，保证树的出现
                if($(this).attr('data-mark') === "resource"){
                    $(".np-resource .np-business-click:first").trigger("click");
                }
            });
            return this;
        },
        /**
         * [initData description]
         * @author yuqiu
         * @date   2015-04-17T11:14:45+0800
         * @param  {[type]}                 domName  [绑定执行初始化函数的dom元素]
         * @param  {[type]}                 func     [获取数据的方法]
         * @param  {Function}               callback [回调函数]
         * @return {[type]}                          [promise对象]
         */
        initData: function(domName, func, callback) {
            var self = this,
                deferred = $.Deferred();

            if (window.inspectSuperMainResourceTml && domName === ".np-resource") {
                deferred.resolve(true);
                return deferred;
            }

            root.one('click', domName, function(event) {
                var target = $(this);
                func().done(function(data) {
                    self.init({
                        name: target.attr('data-dom'),
                        markName: target.attr('data-mark'),
                        template: data
                    });
                    $(event.currentTarget).removeClass('np-first');
                    if (typeof callback === 'function') {
                        callback();
                    }
                    deferred.resolve(true);
                })
            });
            return deferred;
        },
        /**
         * [updateDomArrayInit 可以利用此函数修改初始化的模板]
         * @author yuqiu
         * @date   2015-05-20T09:43:15+0800
         * @param  {[type]}                 dom [传入一个对象，包括{name,markName，template}]
         * @return {[type]}                     [返回当前对象，链式调用]
         */
        updateDomArrayInit: function(dom){
            domArrayInit[dom.markName] = _getDomNode(dom.name).children();
            return this; 
        },

        // 调试使用的
        console: function() {
            console.log(domArray);
            console.log(domArrayInit);
        }

    };


    function _getDomNode(domName) {
        return root.find(domName).length ? root.find(domName) : root;
    }

    return new SidebarManager();
})
