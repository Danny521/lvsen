
define(["domReady","js/user-center","js/notify-center"], function(domReady, User, NotifyClass) {

    domReady(function() {
        //改变用户中心标志的颜色
        jQuery("#navigator a").removeClass('active');
        jQuery("#navigator a[target='personal']").addClass('active');
        // 用户
        new User();
        // 消息中心 任务管理
        new NotifyClass();
    });
});


