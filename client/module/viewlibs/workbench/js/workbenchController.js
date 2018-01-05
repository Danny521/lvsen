define([
    '/module/viewlibs/common/filterData.js',
    'js/conf',
    'underscore',
    '/module/viewlibs/workbench/js/workbenchView.js'
], function (FilterData, conf, _, workBenchView) {
    var url = '/service/pvd/work_bench',
        template_url = '/module/viewlibs/workbench/inc/tpl_workbench.html',
        /*filterData = {
            b: '', //案事件id（线索结果集）
            sf: '',//文件类型（结构化信息结果集）
            r: '' //资源(视频或者图片)id（结构化信息结果集）
        },*/
        pagetype = 'workbench';//当前页面的第二导航高亮 （会被复写）
    
    var init = function () {
        FilterData.init();
        workBenchView.addHelper();
        showPage();
        FilterData.getChildOrgs(function () {
            bindSelfEvent();
        }, true);
        judgeUser();

        //助手
        //注： rest类型和others相同即其他结构化类型，后台返回为rest，前台标示为others
        //move类型和moving相同即运动目标结构化类型，后台返回为moving，前台标示为move
    };

    var showPage = function () {
        var self = this;
        var param = Toolkit.paramOfUrl(location.href);//获取url信息
        var fileUrl = '';
        var incidentUrl = "/module/viewlibs/details/incident/incident_detail.html";//案事件详情页url
        var activeMenu = JSON.parse(window.localStorage.getItem('activeMenu'));
        //登陆进入除视图库的其他模块后跳转视图库进入资源详情localStorage.getItem('activeMenu')数据丢失的问题  by  zhangxinyu on 2015-10-14
        if(!activeMenu){
            var workbenchActive = '{"viewlibs":"workbench"}';
            localStorage.setItem("activeMenu", workbenchActive);
            activeMenu = JSON.parse(window.localStorage.getItem('activeMenu'));
        }
        /**默认首页-我的工作台*/
        if (location.search === '') {
            url = "/service/pvd/work_bench";//我的工作台的后端接口
            //此处setUrl是为重置筛选区的接口
            FilterData.setUrl(url);
            FilterData.loadResource(FilterData.getFilter());//载入筛选信息

            /**"线索"、"结构化信息"结果集(包括盟市和省厅2种情况)*/
        } else if (param.pagetype === "traillist" || param.pagetype === "structlist") {
            template_url = "/module/viewlibs/workbench/inc/tpl_trail.html";//"线索、结构化信息"结果集模板文件
            FilterData.setTemplate_url(template_url);

            param.orgid === undefined ? "" : param.orgid;
            FilterData.setOrgId(param.orgid);

            Object.append(filterData, {'c': FilterData.getOrgId()});
            param.home = activeMenu && activeMenu.viewlibs;
            if(!param.home){
                param.home = "workbench";
            }
            if(param.home==="workbench"){
                parent.jQuery('.workbench[data-id="14"]').addClass("active").siblings().removeClass("active");
            }
            pagetype = param.home;
            self.hlight = location.href.split('?')[0].split('/').getLast();
			switch(self.hlight){
				case "3-6":
					param.home = "caselib";
					break;
				case "3-21":
					param.home = "doubtlib";
					break;
				default:
				   pagetype = param.home;
					break;
			}
            //更新筛选区
            jQuery.when(Toolkit.loadTempl('/module/viewlibs/workbench/inc/filter_set.html').done(function (res) {
                jQuery('.filter-box .filter-panel').html(res);
                //如果是线索结果集就删除"审核状态"一栏
                if (param.pagetype === 'traillist'){
                    jQuery('.filter-panel [data-filter="v"]').remove();
                }
                //加载面包屑
                jQuery.when(Toolkit.loadTempl('/module/viewlibs/workbench/inc/breadcrumb.html').done(function (source) {                    
                    workBenchView.loadCrumbs(source, param, workBenchView.filterData)
                    switch(self.hlight){
						case "3-6":
							param.home = "caselib";
							jQuery("#header .nav>a").removeClass("active");
							jQuery("#header .nav>a[data-id=15]").addClass("active");
							break;
						case "3-21":
							jQuery("#header .nav>a").removeClass("active");
							jQuery("#header .nav>a[data-id=16]").addClass("active");
							param.home = "doubtlib";
							break;
					}
                }));

            }));

            /**"待审核案事件"结果集*/
        } else if (param.pagetype === "auditlist") {

            url = "/service/pvd/work_bench";
            FilterData.setUrl(url);
            var workbenchActive = '{"viewlibs":"workbench"}';
            localStorage.setItem("activeMenu", workbenchActive);
           workBenchView.checkCaseEventTriggerClick();
            /**"待审核结构化信息"结果集*/
        } else if (param.pagetype === "auditstructlist") {

            url = "/service/pvd/work_bench";
            FilterData.setUrl(url);
            var workbenchActive = '{"viewlibs":"workbench"}';
            localStorage.setItem("activeMenu", workbenchActive);
            workBenchView.checkedInfoTriggerClick();
        }
    };

    var bindSelfEvent = function () {
        /**高亮二级导“案事件信息库”*/
        var hrefData = Toolkit.paramOfUrl(location.href);
        /**“案发时间”和“目标出现时间”"拍摄时间"排序功能的显隐*/
        workBenchView.timeSortFlash();
        // 资源类型切换  重置统计提示信息
        workBenchView.resetReminderInfo();
        /**缩略图链接*/
        workBenchView.thumbnailLink(setUrl, pagetype);
        /**缩略图下方（视、图、结构化信息）主文案链接&&案事件文案链接（包括所属和主文案）*/
        workBenchView.mainOfficialLink(pagetype);
        //二次搜索
        workBenchView.onceSearch();
    };

    var judgeUser= function () {

        var self = this;

        if (!window.role) {
            setTimeout(judgeUser.bind(self), 100);
        } else {
            if ("done" in role.klass) {
                if (role.klass.province === 'province' || role.klass.common === 'common' || role.klass.admin === 'admin') {//省厅或者普通用户
                    if (location.search === '') {
                        // location.href = "/works/viewlibs/caselib/index.html"; //如果省厅用户进来，将会跳转
                        location.href = "/module/viewlibs/caselib/index.html"; //如果省厅用户进来，将会跳转
                        var activeMenu = {"viewlibs": "案事件"};
                        localStorage.setItem("activeMenu", JSON.stringify(activeMenu));
                    }
                } else {
                    var activeMenu = {"viewlibs": "workbench"};
                    localStorage.setItem("activeMenu", JSON.stringify(activeMenu));
                    if (role.klass.verify === 'verify') {
                        jQuery('[data-type="uncommit"]').remove();//审核人员则删除“未提交”的筛选条件
                    }
                    //self.bindSelfEvent(); // 盟市
                }
            } else {
                setTimeout(judgeUser.bind(self), 100);
            }
        }
    };

    //缩略图添加跳转连接
    var setUrl = function (type, incidentName) {
        var url = hl = '';
        var hrefStr = location.href;
        var highlight = hrefStr.split('?')[0].split('/').getLast();
        if (highlight === 'index') {
            highlight = '3-5';
        }
        if (type == "irest") {
            type = "iothers";
        } else if (type == "imoving") {
            type = "imove";
        }
        var getUrl = function (urlType, name) {
            if (_.has(conf.urlObj, urlType)) {
                var incidentName = conf.urlObj[urlType].plusName ? name : '';
                return conf.urlObj[urlType].data + incidentName + '&id=';
            }
        }

        return getUrl(type, incidentName)
    };

    return {
        init : init
    }
})