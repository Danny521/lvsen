/**
 * Created by LiangChuang on 2014/12/3.
 */
define(["orgnScrollbar","jquery","mootools",""],function(scrollBar){
    var pagination = new new Class({
        pageSize: 5,
        /*每页显示数量*/
        mytask: 1,
        /*记录我的任务当前操作页*/
        bottomPageNo: 1,
        /*后台返回最后一页的页数*/
        plan: 1,
        /*记录计划当前操作页的页数*/
        pageNode: jQuery('.pagination'),
        /*分页DOM节点*/
        initialize: function () {
            this.getPageSize();
            this.drawMytask(1);
            /*绘制第一页*/
            this.bindEvents();
        },
        // 按可视区域高度，自动调整可视条数
        getPageSize: function () {
            /*var sidebarHeight = $("#treePanel").height() ? $("#treePanel").height() - 100 : 580,
             itemHeight    = 100,
             pageNavHeight = 20,
             length        = Math.floor((sidebarHeight - pageNavHeight )/itemHeight);

             this.pageSize = 10 || length;*/

            this.pageSize = 10;
        },
        bindEvents: function () {
            this.searchTask();
            this.searchPlan();
        },
        searchPlan: function () {
            var self = this,
                t = null;
            jQuery(document).on('focus', 'form.newinsertheader input[name=planName]', function () {
                clearInterval(t);
                var searchBtn = jQuery(this),
                    val = searchBtn.val().trim();
                t = setInterval(function () {
                    if (val === searchBtn.val().trim()) {
                        return;
                    } else {
                        val = searchBtn.val().trim();
                        if (val === '') {
                            self.redrawPlanAndPages('search');
                        } else {
                            searchBtn.siblings('button').trigger('click');
                        }
                    }
                }, 600);
            });

            jQuery(document).on('blur', 'form.newinsertheader input[name=planName]', function () {
                clearInterval(t);
            });
        },
        searchTask: function () {
            var self = this,
                t = null,
                val = '',
                searchInput = '';
            jQuery(document).on('focus', 'form.newinsertheader .simple input[name=taskName]', function () {
                clearInterval(t);
                searchInput = jQuery(this);
                val = searchInput.val().trim();
                t = setInterval(function () {
                    if (val === searchInput.val().trim()) {
                        return;
                    } else {
                        val = searchInput.val().trim();
                        if (val === '') {
                            self.redrawMytaskAndPages('search');
                        } else {
                            jQuery('button.searchMyTask').trigger('click');
                        }
                    }
                }, 600);
            });

            jQuery(document).on('blur', 'form.newinsertheader .simple input[name=taskName]', function () {
                clearInterval(t);
            });
        },
        drawPlan: function (arg) {
            var self = this,
                htmlt,
                htmls;
            $.when(mintenance.loadTpl("mintenance_config_plan_list"), mintenance.loadData("task_plan_list?pageNo=" + self.plan + "&pageSize=" + self.pageSize)).done(function (html, mytask) {
                var tasks = mytask.data.taskPlans,
                    bottomPageNo = tasks.bottomPageNo;
                self.total = tasks.totalRecords;
                if (self.total <= self.pageSize) {
                    self.hidePage();
                }
                if (arg === 'remove' && tasks.list.length === 0) {
                    if (self.plan === 1) {
                        self.plan = 1;
                    } else {
                        self.plan -= 1;
                    }
                }
                // if(arg === 'add'){
                // 	self.plan = bottomPageNo;
                // }

                html = mintenance.render("mintenance_config_plan_list", mytask.data.taskPlans);

                htmlt = $(html);
                htmls = (htmlt[2] || htmlt[1]).innerHTML;

                $("#sidebar>.header .newinsertheader").remove();
                $("#plan").html(htmls);
                $("#sidebar>.header").append(htmlt[0].innerHTML);

                $("#sidebar>.header>ul").hide();
                $("#treePanel").css({
                    "top": 88   //暂时隐藏搜索所以为36，加上搜索为 88
                });

                // 更新滚动条
                scrollBar.init();

                if (self.comeFromSearchPlan === 'search') {
                    jQuery('form.newinsertheader .simple input[name=planName]').trigger('focus');
                }

                if (self.pageNode.html().length == '') {
                    self.pageNode.pagination(self.total, {
                        'items_per_page': self.pageSize,
                        'current_page': self.plan - 1,
                        'callback': self.planSelectCallback
                    });
                }
            });

            mintenance.witchTask = 'plan';
        },
        drawMytask: function (arg) {
            var self = this,
                htmlt,
                htmls;
            $.when(mintenance.loadTpl("maintenance_mytask"), mintenance.loadData("my_tasks?pageNo=" + self.mytask + "&pageSize=" + self.pageSize)).done(function (html, mytask) {
                var tasks = mytask.data.tasks,
                    bottomPageNo = tasks.bottomPageNo;
                self.total = tasks.totalRecords;

                if (self.total <= self.pageSize) {
                    self.hidePage();
                }

                if (arg === 'remove' && tasks.list.length === 0) {
                    if (self.mytask === 1) {
                        self.mytask = 1;
                    } else {
                        /*某一页删除了所有内容mytask自动减一,从而绘制上一页*/
                        self.mytask -= 1;
                    }
                }

                // if(arg === 'add'){
                // 	新增自动跳到最后一页(新增内容显示在最后一页)
                // 	self.mytask = bottomPageNo;
                // }

                $("#sidebar>.header .newinsertheader").remove();
                htmlt = $(mintenance.render("maintenance_mytask", mytask.data));

                htmls = (htmlt[2] || htmlt[1]).innerHTML;

                $("#mytask").html(htmls);

                $("#sidebar>.header").append(htmlt[0].innerHTML);

                $(".header>ul").show();

                $("#treePanel").css({
                    "top": 88
                });
                $(".header .make-polling").remove();

                // 更新滚动条
                scrollBar.init();

                if (self.comeFromSearchTask === 'search') {
                    jQuery('form.newinsertheader .simple input[name=taskName]').trigger('focus');
                }
                if (self.pageNode.html().length == '') {
                    self.pageNode.pagination(self.total, {
                        'items_per_page': self.pageSize,
                        'current_page': self.mytask - 1,
                        'callback': self.taskSelectCallback
                    });
                }
            });

            mintenance.witchTask = 'mytask';
        },
        taskSelectCallback: function (pageIndex, what) {
            /*callback在点击分页时会执行*/
            /*分页插件第一页从0开始,后台数据接口第一页从1开始*/
            /*绘制第一页current_page传0,加载第一页数据mytask传1*/
            /*这里不能使用this,函数环境为pagniation*/
            pagination.mytask = pageIndex + 1;
            pagination.drawMytask(pagination.mytask);
        },
        planSelectCallback: function (pageIndex) {
            pagination.plan = pageIndex + 1;
            pagination.drawPlan(pagination.plan);
        },
        redrawMytaskAndPages: function (arg) {
            /*如果要重新绘制分页必须值空pagination*/
            /*除了直接点击分页,产生跳转是插件自动完成,只需加载内容即可*/
            if (arg === 'search') {
                this.comeFromSearchTask = 'search';
            } else {
                this.comeFromSearchTask = '';
            }
            if (arg === 'first') {
                this.mytask = 1;
            }
            this.pageNode.show();
            this.pageNode.html('');
            this.drawMytask(arg);
        },
        redrawPlanAndPages: function (arg) {
            if (arg === 'search') {
                this.comeFromSearchPlan = 'search';
            } else {
                this.comeFromSearchPlan = '';
            }
            this.pageNode.show();
            this.pageNode.html('');
            this.drawPlan(arg);
        },
        hidePage: function () {
            this.pageNode.hide();
        }
    });
    window.pagination = pagination;

});