define(['/module/viewlibs/common/filterData.js', 'permission'], function(FilterData) {

	var url = '/service/pvd/get_incident_list', //案事件信息库数据筛选接口
		template_url = '/module/viewlibs/caselib/inc/tpl_caselib.html', //模板文件
		filterData = {};

		/**
		 * [initialize 车辆信息库初始化函数，FilterData是各类信息库的公共函数，不同的库初始化模板不同]
		 * @return {[]}   []
		 */
	var initialize = function() {
		FilterData.setTemplate_url(template_url);
		FilterData.setUrl(url);
		FilterData.init();

		orgId = FilterData.getOrgId();

		FilterData.getChildOrgs(function() {
			bindSelfEvent();
		});
		/*if (self.isProvince()) {//是省厅
			
		}else{//非省厅
			self.bindSelfEvent();
		}*/
		/*助手*/
		Handlebars.registerHelper("mills2str", function(mills, options) {
			return Toolkit.formatDate(new Date(mills));
		});
		Handlebars.registerHelper("showImage", function(path, options) {
			return jQuery.trim(path) !== "" ? path : "/module/common/images/upload.png";
		});
		//用来去掉高亮字符外标签
		Handlebars.registerHelper("showTrueName", function(param, options) {
			if (!!param) {
				var incidentname = param.replace(/<em class="height-light">/gi, ""),
					incidentname = incidentname.replace(/<\/em>/gi, "");
				return incidentname;
			}
		});

		Handlebars.registerHelper("isTrack", function(type, incidentid, options) {
			if (!_.isNull(incidentid)) {
				return (_.has(conf.trackObj.data, type)) ? options.fn(this) : options.inverse(this);
			}
		});
        
        Handlebars.registerHelper("icpStatus", function(status, options) {
			return status === 1 ? "disable" : "default";
		});
	};

	var bindSelfEvent = function() {
		FilterData.loadResource(FilterData.getFilter());
		FilterData.showPie();


		//收起、展开按钮事件
		jQuery(document).off('click', '.filter .casetype .fences span').on("click", ".filter .casetype .fences span", function() {
			if (jQuery(this).closest('li').is(".down")) {
				jQuery(".filter .hiden").show("normal");
				jQuery(this).closest('li').attr("title", "收起");
				jQuery(this).find("em").text("收起");
			} else {
				jQuery(".filter .hiden").hide("normal");
				jQuery(this).closest('li').attr("title", "展开");
				jQuery(this).find("em").text("展开");
			}
			jQuery(this).closest('li').toggleClass("down up");
		});

		//创建人员：搜索筛选
		jQuery(document).off('click', '[data-filter="n"] .seach').on("click", "[data-filter='n'] .seach", function() {
			FilterData.loadResource(FilterData.getFilter());
		});
		//添加回车事件
		jQuery("[data-filter='n'] .create").keydown(function(event) {
			event.stopImmediatePropagation();
			if (event.keyCode === 13) {
				FilterData.loadResource(FilterData.getFilter());
			}
		});

		//二次搜索
		jQuery(document).off('click', '.sheader .secondseach').on("click", ".sheader .secondseach", function() {
			FilterData.secondSeach();
		});
		//二次搜索回车
		jQuery(".sheader .create").keydown(function(event) {
			if (event.keyCode === 13) {
				FilterData.secondSeach();
			}
		});

		//点击存储单位.右侧统计信息重新统计
		/*jQuery(document).on("click", '[data-filter="c"] a', function() {
			var unioncityName = jQuery(this).text();
			if (!jQuery(this).hasClass('active')) {
				jQuery(".module-head .location").text('(' + unioncityName + ')');

				self.loadResource(self.getFilter());
				self.showPie();
			}
		});*/
		/**缩略图链接*/
		jQuery(document).off('click', '.items-list .thumb-figure .thumb-anchor').on("click", ".items-list .thumb-figure .thumb-anchor", function() {
			var thumb = jQuery(this).closest("li"),
				id = thumb.attr("data-id"),
				incidentname = thumb.find('.synopsis .casename').data("incidentname"),
				orgId = jQuery('.filter-panel [data-filter="c"] .current').attr('data-key');
			orgId = orgId === undefined ? "" : orgId;

			window.location.href = '/module/viewlibs/details/incident/incident_detail.html?pagetype=caselib&id=' + id + "&incidentname=" + incidentname + '&orgid=' + orgId;
		});

		/**缩略图下方视图文案链接*/
		jQuery(document).off('click', '.items-list  .synopsis .casename').on("click", ".items-list  .synopsis .casename", function() {
			jQuery(this).closest("li").find(".thumb-anchor").trigger('click');
		});
	};
	return { initialize:initialize}
});