/**
 * Created by LiangChuang on 2014/12/3.
 */
/**
 * @module  自动巡检
 * @author LiangChuang
 * @example getAutomaticStatus.start();
 */
define(["js/tools"],function(tools){

    var initPrevStatus = tools.initPrevStatus,
        checkboxAction = tools.checkboxAction;

    var getAutomaticStatus = {
        /**
         * @description t 定时器全局变量 taskId 任务id timeout 超时时间
         * */
        t : null,
        taskId: null,
        timeout: 1000,

        /**
         * @name start
         * @description 开始自动巡检
         */
        start: function () {
            var self = this;
            self.t = setTimeout(function () {
                self.process.call(self)
            }, self.timeout);
        },

        /**
         * @name process
         * @description 具体处理自动巡检的逻辑 complete 只要 ajax 只要完成就去拿状态，通过状态来继续执行或完成或给提示
         */
        process: function () {
            var self = this;
            self.taskId = $(".mode .automatic").attr("task-id");

            if(!self.t){
                return;
            }
            $(".autoLayout, .automain").show();

            $.ajax({
                url: "/service/check/automatic/inspection/status",
                data: {taskId: self.taskId},
                method: "post",
                complete: function (res) {
                    if (res && res.responseJSON.code && res.responseJSON.code === 200) {
                        // 1 成功 0 失败
                        var status  = res.responseJSON.data.status,
                            percent = res.responseJSON.data.progress || 0;

                        /**
                         * 添加巡检进度显示 2014.11.09 By LiangChuang
                         */
                            //if(percent){
                        $("#percent").text(percent + "%");
                        //}

                        if (status === 1 || status === 0) {
                            setTimeout(function(){self.giveStatus(self.taskId)},500);
                            $(".autoLayout").hide();
                            if ($(".mode .automatic").length > 0) {
                                $(".mode .automatic").removeClass("active").text("自动");
                                $(".mode").attr("data-automatic", 0);
                            }
                            if (status === 0) {
                                notify.warn("自动巡检任务失败，已返回巡检完成的摄像机状态！");
                            }
                        } else {
                            self.start();
                            $(".rMenu").hide();
                        }
                    } else {
                        self.start();
                        $(".rMenu").hide();
                    }
                },
                timeout: self.timeout
            });
        },

        /**
         * @name giveStatus
         * @description 给出自动巡检的结果 拿巡检的结果，然后 initPrevStatus 给出巡检状态，checkboxAction 初始化勾选表单
         */
        giveStatus: function (taskId) {
            $.when(mintenance.loadData("get_task?taskId=" + (taskId || this.taskId))).done(function (data) {
                initPrevStatus(data.data.task.cameras,true);
                $(".autoLayout").hide();
                $(".rMenu").show();
                mintenance.data.isStatusChanged = true; // 巡检完成，设置状态标志，返回时提示
                checkboxAction();
            })
        },

        /**
         * @name pause
         * @description 暂停自动巡检 不向后端拿取巡检状态了，返回的时候用。但是巡检仍旧继续
         */
        pause: function () {
            clearTimeout(this.t);
            $(".rMenu").show();
        },

        /**
         * @name stop
         * @description 停止自动巡检 完全停止自动巡检，并给出已经巡检的摄像机的状态
         * @see process
         */
        stop: function () {

            var self = this;
            self.taskId = $(".mode .automatic").attr("task-id");
            clearTimeout(this.t);

            $(".autoLayout .automain").show().find("p").text("请稍等...");

            $.ajax({
                url: "/service/check/automatic/delete/task",
                data: {taskId: self.taskId},
                method: "post",
                complete: function (res) {
                    if (res && res.responseJSON.code && res.responseJSON.code === 200) {
                        self.giveStatus();
                    } else {
                        if ($(".mode .automatic").length > 0) {
                            $(".mode .automatic").addClass("active").text("停止");
                            $(".mode").attr("data-automatic", 1);
                            $(".autoLayout .automain").find("p").text("巡检中...");
                            $(".rMenu").show();
                            notify.warn("停止自动巡检任务时服务器出错，停止失败，请稍后重试！");
                            self.start();
                        }
                    }
                },
                timeout: self.timeout
            })
        }
    };

    /**
     * @global getAutomaticStatus
     * @description 设置为全局变量，其他文件调用
     */
    mintenance.getAutomaticStatus = getAutomaticStatus;

    return getAutomaticStatus;
});