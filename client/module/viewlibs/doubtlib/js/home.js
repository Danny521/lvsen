define(['/module/viewlibs/common/filterData.js', 'permission'], function(FilterData) {

	var url = '/service/pvd/doubts',
		template_url = '/module/viewlibs/doubtlib/inc/tpl_doubtlib.html',
		orgId = '';

	var initialize = function() {
		FilterData.setTemplate_url(template_url);
		FilterData.setUrl(url);
		FilterData.init();
		orgId = FilterData.getOrgId();

		FilterData.getChildOrgs(function() {
			bindSelfEvent();
		});

		//助手
		var SK = '',ST=''; 
		var trlSceneT = function(){
			jQuery.ajax({
				url: "/module/viewlibs/json/scene_u.json",
				type: "get",
				async: false,
				dataType: 'json',
				success: function(res) {
					ST = res;
				}
			});
		};
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
		trlSceneT();
		translateData();
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
		function carhelp(licenseNumber,licenseType,carColor) {
            if ((!licenseType || licenseType === "暂未填写") && (!licenseNumber || licenseNumber==="暂未填写") && (!carColor || carColor==="暂未填写")) {
                return '车辆';
            } else {
                var obj = [licenseNumber,licenseType,carColor];
                var str = mergeStr(obj);
                return str;
            }
        };
        function exhibithelp(name, shape, color) {
            if ((!name || name ==="暂未填写") && (!shape || shape ==="暂未填写") && (!color || color ==="暂未填写")) {
                return '物品';
            } else {
                var exhibitdata = [name,shape,color];
                var str = mergeStr(exhibitdata);
                return str;
            }
        };
        function movehelp(type, color, height, gray) {
            if ((!type || type === "暂未填写") && (!color || color === "暂未填写") && (!height || height === "暂未填写") && (!gray || gray === "暂未填写")) {
                return '运动目标';
            } else {
                var movingdata = [type,color,height,gray];
                var str = mergeStr(movingdata);
                return str;
            }
        };
        function personhelp(name, gender, jacketColor, trousersColor) {
            if ((!name || name === "暂未填写") && (!gender || gender === "暂未填写") && (!jacketColor || jacketColor === "暂未填写") && (!trousersColor || trousersColor ==="暂未填写")) {
                return '人员';
            } else {
                var persondata = [name,gender,jacketColor,trousersColor];
                var str = mergeStr(persondata);
                return str;
            }
        };
        function resthelp(restName) {
            if (!restName || restName === "暂未填写") {
                return '其他';
            } else {
                return restName;
            }
        };
        function scenehelp(categoryMain,subcategoryMain, weather) {
            if ((!categoryMain || categoryMain === "暂未填写") && (!weather || weather === "暂未填写")) {
                return '场景';
            } else {
                var scenedata = [ST[categoryMain]?ST[categoryMain][0]:"", ST[subcategoryMain]?ST[subcategoryMain][0]:'',SK.weather[weather]];
                var str = mergeStr(scenedata);
                return str;
            }
        };
        Handlebars.registerHelper('casecar', function(licenseNumber,licenseType,carColor) {
            return carhelp(licenseNumber,licenseType,carColor);
        });

        Handlebars.registerHelper('caseexhibit', function(name, shape, color) {
            return exhibithelp(name, shape, color);
        });
        Handlebars.registerHelper('casemove', function(type, color, height, gray) {
            return movehelp(type, color, height, gray);
        });

        Handlebars.registerHelper('caseperson', function(name, gender, jacketColor, trousersColor) {
            return personhelp(name, gender, jacketColor, trousersColor);
        });

        Handlebars.registerHelper('caseothers', function(restName) {
            return resthelp(restName);
        });
        Handlebars.registerHelper('casesence', function(categoryMain,subcategoryMain, weather) {
            return scenehelp(categoryMain,subcategoryMain, weather);
        });
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
                    case "person": return personhelp(trueName[0], trueName[1], trueName[2], trueName[3]); break;
                    case "scene": return scenehelp(trueName[0],trueName[1], trueName[2]);break;
                    case "exhibit": return exhibithelp(trueName[0], trueName[1], trueName[2]);break;
                    case "moving": return movehelp(trueName[0], trueName[1], trueName[2], trueName[4]);break;
                    case "rest": return resthelp(trueName[0]);break;
                }
            }
        });
        //用来去掉高亮字符外标签
        Handlebars.registerHelper("showTrueName", function (param, options) {
            if (!!param) {
                var incidentname = param.replace(/<em class="height-light">/gi, ""),
                    incidentname = incidentname.replace(/<\/em>/gi, "");
                return incidentname;
            }
        });

		Handlebars.registerHelper("eq", function(name, str,options) {
			return name === str ? options.fn(this) : options.inverse(this);
		});

		Handlebars.registerHelper("mills2str", function(mills, options) {
			if (!!mills) {
				return Toolkit.formatDate(new Date(mills));
			}

		});
		Handlebars.registerHelper("displaytype", function(name, options) {
			var result;
			switch (name) {
				case '车辆':
					result = 'car';
					break;
				case '人员':
					result = 'person';
					break;
				case '场景':
					result = 'scene';
					break;
				case '物品':
					result = 'exhibit';
					break;
				case '运动目标':
					result = 'move';
					break;
				case '其他':
					result = 'others';
					break;
				default:
			}
			return result;
		});
		Handlebars.registerHelper("showImage", function(path, options) {
			return jQuery.trim(path) !== "" ? path : "/module/common/images/upload.png";
		});
		Handlebars.registerHelper("location", function(videolocation, imagelocation, options) {
			var result = '';
			if (videolocation) {
				return videolocation;
			}
			if (imagelocation) {
				return imagelocation;
			}
		});
		Handlebars.registerHelper("isTrack", function(type, incidentid, options) {
			if (!_.isNull(incidentid)) {
				return (_.has(conf.trackObj.data, type)) ? options.fn(this) : options.inverse(this);
			}
		});
	};

	var setUrl = function(type) {
		var url = '';
		if (type == "rest") {
			type = "others";
		} else if (type == "moving") {
			type = "move";
		} else if (type == "1") {
			type = "face";
		} else if (type == "2") {
			type = "realtimecar";
		} else if (type == "7") {
			type = "body";
		}
		switch (type) {
			case "car":
				url = '/module/viewlibs/details/struct/car.html?origntype=car&id=';
				break;
			case "realtimecar":
				url = '/module/viewlibs/details/struct/realtime_car.html?origntype=car&sign=realtime&id=';
				break;
			case "person":
				url = '/module/viewlibs/details/struct/person.html?origntype=person&id=';
				break;
			case "exhibit":
				url = '/module/viewlibs/details/struct/exhibit.html?origntype=exhibit&id=';
				break;
			case "scene":
				url = '/module/viewlibs/details/struct/scene.html?origntype=scene&id=';
				break;
			case "move":
				url = '/module/viewlibs/details/struct/move.html?origntype=move&id=';
				break;
			case "face":
				url = '/module/viewlibs/details/struct/face.html?origntype=face&id=';
				break;
			case "body":
				url = '/module/viewlibs/details/struct/body.html?origntype=body&id=';
				break;
			case "others":
				url = '/module/viewlibs/details/struct/others.html?origntype=others&id=';
				break;
			default:
				break;
		}
		return url;
	};

	var bindSelfEvent = function() {
		var params = Toolkit.paramOfUrl(location.href); 
		if (params.jobId || params.cameraChannelId) {//布防布控获取某个任务的实时结构化信息列表
            load_camera_structure_list(params);
		} else if (params.types) { //实时视频标注
			jQuery('[data-tab="video"]').addClass("active");
			jQuery('[data-tab="info"]').removeClass("active");
			loadTabData("video");
		} else {
			FilterData.loadResource(FilterData.getFilter()); //载入筛选信息
		}
		//实时结构化疑情信息库添加tab切换事件
		//切换到“实时视频标注”选项卡
		jQuery(document).on("click", ".filter-box .header .tabs li[data-tab='video']", function() {
			loadTabData("video");
		});

		//切换到“疑情信息”选项卡
		jQuery(document).on("click", ".filter-box .header .tabs li[data-tab='info']", function() {
			loadTabData("info");
		});
		/**创建人员：搜索筛选*/
		jQuery(document).off('click', '[data-filter="n"] .seach').on("click", "[data-filter='n'] .seach", function() {
			FilterData.loadResource(FilterData.getFilter());
		});
		/**缩略图链接*/
		jQuery(document).off('click', '.items-list .thumb-figure .thumb-anchor').on("click", ".items-list .thumb-figure .thumb-anchor", function() {
			var thumb = jQuery(this).closest("li");
			id = thumb.attr("data-id");
		
			if(jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click") === "true") {
                //展示某个摄像头下的结构化信息列表
                jQuery('<div class="loading"></div>').appendTo(jQuery("#content .main .box .content"));
                var title = (thumb.find("a").text()).replace(/(^\s*)|(\s*$)/g, "");
                jQuery(".sheader span:eq(1)").text(title).show();
                jQuery(".sheader span:eq(2)").show();
                jQuery(".filter-box .header").css("border-bottom","1px solid #e0e4e3");//修改tabs样式
                //默认筛选条件为全部
                jQuery('[data-filter="t"] li:eq(0)').addClass("active").siblings().removeClass("active");
                jQuery('[data-filter="l"] li:eq(0)').addClass("active").siblings().removeClass("active");
                jQuery('.filter-box .content').show();
                jQuery('[data-filter="o"] span').html("创建时间");
                jQuery('[data-filter="m"]').show();
				var ajaxUrl = '/service/pvd/realtime/structures';
				var ajaxData = FilterData.getRealTimeFilter();
				ajaxData.cameraChannelId = id;
				sessionStorage.setItem("cameraId", id);
				var redirectUrl = '/module/viewlibs/doubtlib/inc/videoinfo_doubtlib.html';
				FilterData.loadVideoResource(ajaxUrl, ajaxData, redirectUrl);
				jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click","info");
			}
			else if(jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click") === "info") {
                //展示结构化详细信息
                jQuery(".sheader span:eq(1)").hide();
                jQuery(".sheader span:eq(2)").hide();
                loadStructureInfo(id,thumb);//id为结构化信息标识
			}
			else {
				showtype = thumb.attr("data-showType"), //用于展示的类型
				jQuery(".sheader span:eq(1)").hide();
                jQuery(".sheader span:eq(2)").hide();
				temUrl = '',
				orgId = jQuery('.filter-panel [data-filter="c"] .current').attr('data-key');
			    orgId = orgId === undefined ? "" : orgId;
			    temUrl = '&pagetype=doubtlib' + "&orgid=" + orgId;
			    window.location.href = setUrl(showtype) + id + temUrl;
			}
		});

		/**缩略图下方（视、图、结构化信息）主文案链接*/
		jQuery(document).off('click', '.items-list  .synopsis .name').on("click", ".items-list  .synopsis .name", function() {
			jQuery(this).closest("li").find(".thumb-anchor").trigger('click');
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
	};
	/**
     * [loadTabData tab切换加载不同的数据]
     * @author zhangxinyu
	 * @date   2015-7-6
     * @param  {[type]} type [description]
     * @return {[type]}      [description]
     */
	var loadTabData = function (type){
		jQuery('<div class="loading"></div>').appendTo(jQuery("#content .main .box .content"));
		if (type === "video") {
			jQuery('.search').hide();
			jQuery('[data-filter="l"] li:eq(2)').attr('data-key', '7').show();
			jQuery('[data-filter="l"] li:eq(3)').attr('data-key', '2');
			jQuery('[data-filter="l"] li:eq(1) a').html('人脸');
			jQuery('[data-filter="l"] li:eq(2) a').html('人体');
			jQuery('[data-filter="l"] li:eq(3) a').html('车辆');
			jQuery('[data-filter="l"] li:eq(4)').hide();
			jQuery('[data-filter="l"] li:eq(5)').hide();
			jQuery('[data-filter="l"] li:eq(6)').hide();
			jQuery('[data-filter="n"]').hide();
			jQuery('[data-filter="o"] span').html("更新时间");
			jQuery('[data-filter="m"]').hide();
			jQuery('.filter-box .content').hide();
			jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click", "true"); //区分用户点击的是疑情信息还是实时视频标注(true:实时视频标注 false:疑情信息)
			jQuery(".filter-box .header").css("border-bottom", "0px"); //修改tabs样式
			//先获取摄像头的列表信息
			var ajaxUrl = '/service/pvd/realtime/directory';
			var filtermap = {};
			filtermap.currentPage = 1;
			filtermap.pageSize = filterData.np;
			var ajaxData = filtermap;
			var redirectUrl = '/module/viewlibs/doubtlib/inc/video_doubtlib.html';
			FilterData.loadVideoResource(ajaxUrl, ajaxData, redirectUrl);
		} else {
			jQuery('.search').show();
			jQuery('[data-filter="l"] li:eq(2)').attr('data-key', '2');
			jQuery('[data-filter="l"] li:eq(3)').attr('data-key', '3');
			jQuery('[data-filter="l"] li:eq(1) a').html('人体');
			jQuery('[data-filter="l"] li:eq(2) a').html('车辆');
			jQuery('[data-filter="l"] li:eq(3) a').html('物品');
			jQuery('[data-filter="l"] li:eq(4)').show();
			jQuery('[data-filter="l"] li:eq(5)').show();
			jQuery('[data-filter="l"] li:eq(6)').show();
			jQuery('[data-filter="n"]').show();
			jQuery('[data-filter="o"] span').html("创建时间");
			jQuery('[data-filter="m"]').show();
			jQuery(".sheader span:eq(1)").hide();
			jQuery(".sheader span:eq(2)").hide();
			jQuery('.filter-box .content').show();
			jQuery(".filter-box .header").css("border-bottom", "1px solid #e0e4e3"); //修改tabs样式
			jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click", "false");
			//防止实时视频标注自定义筛选后切换疑情信息tabs时筛选列表没有初始化
			//jQuery('.custom-time').hide();
			jQuery('[data-filter="t"] li:eq(0)').addClass("active").siblings().removeClass("active");
			jQuery('[data-filter="l"] li:eq(0)').addClass("active").siblings().removeClass("active");
			FilterData.loadResource(FilterData.getFilter());
		}
	};
	/**
     * [loadStructureInfo 跳转实时结构化信息详情页面]
     * @author zhangxinyu
	 * @date   2015-7-4
     * @param  {[type]} id    [结构化信息标识]
     * @param  {[type]} thumb [jq对象]
     * @return {[type]}       [description]
     */
	var loadStructureInfo = function(id,thumb) {
		//标记该页的结构化信息文件夹个数（若只有一个，删除后显示前一页的列表信息）
		var num = thumb.closest("ul").find("li").length;
		var pageNum = (jQuery(".total .curpage").text()) * 1;
		var del_option = 0;
		if (num === 1 && pageNum > 1) {
			del_option = 1;
		} else if (num === 1 && pageNum === 1) {
			del_option = 2;
		}
		jQuery.ajax({
            url: '/service/pvd/realtime/structure/'+id,
            type: 'get',
            cache: false,
            success: function (res) {
                if (res.code === 200) {
					var points = res.data.structures.trackInfo,
						showtype = thumb.attr("data-showType"), //用于展示的类型
						cameraChannelId = thumb.attr("data-cameraChannelId"), //摄像机通道id
						temUrl = '',
						key = jQuery(".sheader input.input-text").val(),
						dataType = jQuery('[data-filter="l"] .active').attr("data-key"),
						timeType = jQuery('[data-filter="t"] .active').attr("data-key"),
						startTime = jQuery('[data-filter="s"]').val(),
						endTime = jQuery('[data-filter="e"]').val(),
						sortValue = jQuery(".order-cases .active").attr("data-key"),
						sortType = jQuery(".order-cases .active").attr("data-filter"),
						orgId = jQuery('.filter-panel [data-filter="c"] .current').attr('data-key');
					orgId = orgId === undefined ? "" : orgId;
					temUrl = '&pagetype=doubtlib' + '&orgid=' + orgId + '&cameraChannelId=' + cameraChannelId + '&points=' + points + '&pageNum=' + jQuery(".total .curpage").text() + '&timeType=' + timeType + '&sortType=' + sortType + ',' + sortValue + '&key=' + key + '&dataType=' + dataType + '&del_option=' + del_option + '&startTime=' + startTime + '&endTime=' + endTime;
					// console.log(setUrl(showtype) + id + temUrl);
					// return;
					window.location.href = setUrl(showtype) + id + temUrl;
                }
                else {
                	notify.error(res.data);
                } 
            },
            error: function (err, errstatus, errthr) {
                //notify.warn("网络错误，请重试！");
                if (errstatus !== "abort") {
                    jQuery(".main .content .loading").html("网络错误，请重试！").addClass("error");
                }
            }
		})
	}

	/**
	 * [load_camera_structure_list 布防布控获取某个任务的实时结构化信息列表]
	 * @author zhangxinyu
	 * @date   2015-7-16
	 * @param  {[type]} params [参数列表]
	 * @return {[type]}        [description]
	 */
	var load_camera_structure_list = function(params){
		jQuery('.search').hide();
		jQuery('[data-filter="l"] li:eq(2)').attr('data-key', '7').show();
		jQuery('[data-filter="l"] li:eq(3)').attr('data-key', '2');
		jQuery('[data-filter="l"] li:eq(1) a').html('人脸');
		jQuery('[data-filter="l"] li:eq(2) a').html('人体');
		jQuery('[data-filter="l"] li:eq(3) a').html('车辆');
		jQuery('[data-filter="l"] li:eq(4)').hide();
		jQuery('[data-filter="l"] li:eq(5)').hide();
		jQuery('[data-filter="l"] li:eq(6)').hide();
		jQuery('[data-filter="n"]').hide();
		jQuery('[data-tab="info"]').removeClass("active");
	    jQuery('[data-tab="video"]').addClass("active");
	    var currentPage = 1;
        var dataType ="";
		var ajaxData = {};
		var ajaxUrl = '/service/pvd/realtime/structures';
		if (params.pageNum) {
			currentPage = params.pageNum * 1;
			ajaxData.cameraChannelId = params.cameraChannelId;
			ajaxData.currentPage = currentPage;
			ajaxData.pageSize = 12;
			ajaxData.dataType = params.dataType;
			ajaxData.timeType = params.timeType;
			ajaxData.sortType = params.sortType;
			ajaxData.key = params.key;
			ajaxData.del_option = params.del_option;
			ajaxData.startTime = params.startTime;
			ajaxData.endTime = params.endTime;
		} else {
			ajaxData.cameraChannelId = params.cameraChannelId;
			ajaxData.currentPage = currentPage;
			ajaxData.pageSize = 12;
			ajaxData.createSort = 1;
		}
		var ajaxData = {
			cameraChannelId: params.cameraChannelId,
			currentPage: 1,
			pageSize: 12,
			createSort: 1
		};
		sessionStorage.setItem("cameraId",params.cameraChannelId);
		var redirectUrl = '/module/viewlibs/doubtlib/inc/videoinfo_doubtlib.html';
		FilterData.loadVideoResource(ajaxUrl, ajaxData, redirectUrl);
		jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click","info");
	}
	return {
		initialize: initialize
	};
});