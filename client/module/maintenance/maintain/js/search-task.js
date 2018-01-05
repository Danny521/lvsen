/**
 * Created by LiangChuang on 2014/12/3.
 */
define(["jquery","mootools"],function() {
    var SearchTask = new Class({
        initialize: function (obj) {
            var self      = this;
            this.pageNo   = obj.pageNo;
            this.pageSize = obj.pageSize;
            this.option   = obj.option;
            this.level    = obj.level;
            this.api      = obj.api;
            this.node     = obj.trigger;
            this.parNode  = obj.parNode;
            this.info     = obj.info;

            jQuery(document).on('click', this.node, function () {

                var data = {},
                    par = jQuery(self.node).closest('form').find("." + self.level);

                for (var i = 0, len = self.option.length; i < len; i++) {
                    data[self.option[i]] = par.find('[name=' + self.option[i] + ']').val().trim();
                }

                if (self.level === 'simple') {
                    if (data.taskName === '' || data.planName === '') {
                        if($(".serchbox.advance").length>0 && $(".serchbox.advance input[name=taskName]").val().trim() !==""){
                            return false;
                        }
                        notify.info(self.info, {timeout: '1000'});
                        return false;
                    }
                }
                data.pageNo = self.pageNo;
                data.pageSize = self.pageSize;
                self.searchTask(data);

                return false;
            });
            jQuery(document).on("submit",".newinsertheader",function(){
                if($(".serchbox.advance").length>0){
                    jQuery(".highSearchMyTaskTrigger").trigger("click");
                }
                return false;
            });
        },
        searchTask: function (data) {
            var self = this;
            jQuery.ajax({
                url: self.api,
                type: 'post',
                dataType: 'json',
                data: data,
                success: function (data) {

                    if (data && data.code && data.code === 200) {
                        var taskList = data.data.tasks;
                        self.parseData(taskList);
                    } else {
                        notify.error("服务器没有响应！", {timeout: '1000'});
                    }
                },
                error: function () {
                    notify.error('网络或服务器异常！', {timeout: '1000'});
                }
            });
        },
        parseData: function (taskList) {
            var self = this;
            if (taskList === null || taskList.length === 0) {
                jQuery("#" + self.parNode).html('<span style="color:#999999">暂无数据!</span>');
                pagination.hidePage();
                return;
            }
            var data = {};
            jQuery.when(mintenance.loadTpl('maintenance_advanceSearch')).done(function (handlebar) {
                switch (self.parNode) {
                    case 'mytask':
                        data = {
                            'mytask': taskList
                        };
                        break;
                    case 'checktask':
                        data = {
                            'checktask': taskList
                        };
                        break;
                    case 'combine':
                        data = {
                            'combine': taskList
                        };
                        break;
                    case 'plan':
                        data = {
                            'plan': taskList
                        };
                        break;
                }
                jQuery("#" + self.parNode).html(Handlebars.compile(handlebar)(data));
                pagination.hidePage();
            });
        }
    });
    /*搜索我的任务*/
    new SearchTask({
        trigger: '.searchMyTask',
        api: '/service/check/search_tasks_list',
        option: ['taskName'],
        level: 'simple',
        parNode: 'mytask',
        pageNo: '1',
        pageSize: '5',
        info: '请输入任务名称'
    });
    /*搜索我的任务(高级)*/
    new SearchTask({
        trigger: '.highSearchMyTaskTrigger',
        api: '/service/check/search_tasks_list',
        option: ['taskName', 'taskStatus'],
        level: 'advance',
        parNode: 'mytask',
        pageNo: '1',
        pageSize: '5',
        info: '请输入任务名称'
    });
    /*搜索计划*/
    new SearchTask({
        trigger: '.searchPlan',
        api: '/service/check/search_plans_list',
        option: ['planName'],
        level: 'simple',
        parNode: 'plan',
        pageNo: '1',
        pageSize: '5',
        info: '请输入计划名称'
    });

});