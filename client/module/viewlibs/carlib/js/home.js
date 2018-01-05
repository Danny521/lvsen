define(['/module/viewlibs/common/filterData.js','permission'], function(FilterData) {

		var url = '/service/pvd/cars',
		template_url = '/module/viewlibs/carlib/inc/tpl_carlib.html',
		orgId = '';
		SK = '';
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
			//翻译结构化信息关键字
			var translateData = function(){
				var self = this;
				jQuery.ajax({
					url: "/module/viewlibs/common/structkey.json",
					type: "get",
					async: false,
					dataType: 'json',
					success: function(res) {
						SK = res;
					}
				});
			};
			var mergeStr = function(obj){
				var str = '';
				var j = obj.length;
				for(var i=0;i<j;i++){
					if(obj[i] && obj[i] !== "暂未填写"){
						str = str + obj[i] + '，';
					}
				}
				str = str.substr(0, str.length - 1);
				return str;
			};
			//助手
			//返回车辆关键字段的组合
			function carhelp(licenseNumber,licenseType,carColor) {
	            if ((!licenseType || licenseType === "暂未填写") && (!licenseNumber || licenseNumber==="暂未填写") && (!carColor || carColor==="暂未填写")) {
	                return '车辆';
	            } else {
	                var obj = [licenseNumber,licenseType,carColor];
	                var str = mergeStr(obj);
	                return str;
	            }
	        };
			//用来去掉高亮字符外标签
			Handlebars.registerHelper("showTrueName", function(param, options) {
				if (!!param) {
					var incidentname = param.replace(/<em class="height-light">/gi,""),
						incidentname = incidentname.replace(/<\/em>/gi,"");
					return incidentname;
				}
			});
			//为title属性显示正确，去掉高亮的标签
			Handlebars.registerHelper("showTrueNameln", function() {
	            var arg = Array.prototype.slice.call(arguments);
	            var trueName = [];
	            if(arg.length !== 0){
	                var len = arg.length;
	                for(var i=1; i<len-1; i++){
	                    if (!arg[i] || arg[i] === "暂未填写") {
	                        continue;
	                    }
	                    var temp = (arg[i]+'').replace(/<em class="height-light">/gi, "");
	                    trueName[i-1] = temp.replace(/<\/em>/gi, "");
	                }
	                switch(arg[0]){
	                    case "car": return carhelp(trueName[0],trueName[1],trueName[2]);break;
	                }
	            }
	        });
			Handlebars.registerHelper('casecar', function(licenseNumber,licenseType,carColor) {
	            return carhelp(licenseNumber,licenseType,carColor);
	        });

			Handlebars.registerHelper("showname", function(incidentName, options) {
				if (!!incidentName) {
					return "("+incidentName+")";
				}
			});
			//如果图片路径为空，显示默认图片
			Handlebars.registerHelper("showImage", function(path, options) {
				return jQuery.trim(path) !== "" ? path : "/module/common/images/upload.png";
			});
			Handlebars.registerHelper("location", function(videolocation,imagelocation, options) {
				var result =  '';
				if (videolocation) {
					return videolocation;
				}
				if (imagelocation) {
					return imagelocation;
				}
			});
			Handlebars.registerHelper("showIncident", function(incidentName, options) {
				return incidentName ?  options.fn(this) : options.inverse(this);;
			});

			Handlebars.registerHelper("isTrack", function (type, incidentid, options) {
	            if (!_.isNull(incidentid)) {
	                return (_.has(conf.trackObj.data, type)) ? options.fn(this) : options.inverse(this);
	            }
	        });
		};

		var bindSelfEvent =function() {
			FilterData.loadResource(FilterData.getFilter());//载入筛选信息
			
			/**创建人员：搜索筛选*/
			jQuery(document).off('click','[data-filter="n"] .seach').on("click", "[data-filter='n'] .seach", function() {
				FilterData.loadResource(FilterData.getFilter());
			});

			/**缩略图链接*/
			jQuery(document).off('click','.items-list .thumb-figure .thumb-anchor').on("click", ".items-list .thumb-figure .thumb-anchor", function() {
				var thumb = jQuery(this).closest("li"),
					id = thumb.attr("data-id"),
					temUrl = '',
					incidentName = thumb.find("[data-incidentname]").attr("data-incidentname"),
					orgId = jQuery('.filter-panel [data-filter="c"] .current').attr('data-key');
					if (incidentName !== '') {
						temUrl = "&incidentname=" + incidentName;
					}

					orgId = orgId===undefined?"":orgId;

				temUrl = temUrl + '&pagetype=carlib&orgid='+ orgId;

				window.location.href = '/module/viewlibs/details/struct/car.html?origntype=car&id=' + id + temUrl;

			});

			/**缩略图下方（视、图、结构化信息）主文案链接*/
			jQuery(document).off('click','.items-list  .synopsis .name').on("click", ".items-list  .synopsis .name", function() {
				jQuery(this).closest("li").find(".thumb-anchor").trigger('click');
			});

			/**案事件文案链接（包括所属和主文案）*/
			jQuery(document).off('click','.items-list  .synopsis .casename').on("click", ".items-list  .synopsis .casename", function() {
				var incidentId = jQuery(this).attr("data-incidentid");
				var incidentName = jQuery(this).attr("data-incidentname");
				window.location.href = '/module/viewlibs/details/incident/incident_detail.html?id=' + incidentId + "&incidentname=" + incidentName + "&pagetype=carlib&orgid=" + orgId;
			});
			//二次搜索
			jQuery(document).off('click','.sheader .secondseach').on("click",".sheader .secondseach", function(){
				FilterData.secondSeach();
			});
			//二次搜索回车
			jQuery(".sheader .create").keydown(function(event) {
				if (event.keyCode === 13) {
					FilterData.secondSeach();
				}
			});
		};
	return {initialize:initialize};
});