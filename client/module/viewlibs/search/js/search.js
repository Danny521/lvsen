define(['/module/viewlibs/common/filterData.js',
	'base.self'
], function(FilterData) {
	var filterData = {
			np: 5, // 每页包含多少项（最大500，最小1，默认值为50）
			key: ''
		};

		//当触发筛选条件时，设置全局搜索页，每页显示5项内容
		FilterData.setnp(5);
	var url= '/service/pvd/global';
	var template_url= '/module/viewlibs/search/inc/tpl_search.html';
	var orgId = '';
	var initialize = function() {
		FilterData.getChildOrgs(function() {
			bindSelfEvent();
		}, true);
		orgId  = FilterData.getOrgId();
		FilterData.showPie();
        FilterData.rightListClick();
		addHelper();
		showResult();
	};
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
	var addHelper = function() {
		trlSceneT();
		translateData();
		Handlebars.registerHelper("isIncident", function(type, options) {
			return type === "incident" ? options.fn(this) : options.inverse(this);
		});
		Handlebars.registerHelper("isStruct", function(type, options) {
			if (type !== 'incident' && type !== 'video' && type !== 'image') {
				return options.fn(this);
			} else {
				return options.inverse(this);
			}
		});
		Handlebars.registerHelper("isMedia", function(type, options) {
			if (type === 'video' || type === 'image') {
				return options.fn(this);
			} else {
				return options.inverse(this);
			}
		});
		Handlebars.registerHelper("showStructType", function(type, incidentID) {
			if (incidentID) {
				return type;
			} else {
				return "i"+type;
			}
		});
		
		//用来去掉高亮字符外标签
		Handlebars.registerHelper("showTrueName", function(param, options) {
			if (!!param) {
				var incidentname = param.replace(/<em class="height-light">/gi, ""),
					incidentname = incidentname.replace(/<\/em>/gi, "");
				return incidentname;
			}
		});
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
		Handlebars.registerHelper("showImage", function(path, options) {
			return jQuery.trim(path) !== "" ? path : "/module/common/images/upload.png";
		});
		
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

		Handlebars.registerHelper("eq", function(name, str,options) {
			return name === str ? options.fn(this) : options.inverse(this);
		});
		/*Handlebars.registerHelper("showStructType", function(type, options) {
			var result;
			switch (type) {
				case 'car':
					result = '车辆';
					break;
				case 'person':
					result = '人员';
					break;
				case 'scene':
					result = '场景';
					break;
				case 'exhibit':
					result = '物品';
					break;
				case 'move':
					result = '运动目标';
					break;
				case 'rest':
					result = '其他';
					break;
				default:
			}
			return result;
		});*/
		Handlebars.registerHelper("showMeaidType", function(type, options) {
			if (type === 'video') {
				return '视频';
			} else if (type === 'image') {
				return '图片';
			} else {}
		});

		Handlebars.registerHelper("incidentType", function(type, options) {
			var result;
			switch (type) {
				case "01":
					result = "刑事犯罪案件";
					break;
				case "02":
					result = "出入境案事件";
					break;
				case "03":
					result = "船舶（民）管理事件、案件";
					break;
				case "04":
					result = "报警信息";
					break;
				case "05":
					result = "违反治安管理行为";
					break;
				case "06":
					result = "群体性事件";
					break;
				case "07":
					result = "治安灾害事故";
					break;
				case "08":
					result = "道路交通事故";
					break;
				case "09":
					result = "涉恐事件";
					break;
				case "10":
					result = "重大事件预警";
					break;
				case "99":
					result = "其他";
					break;
				default:
			}
			return result;
		});
		Handlebars.registerHelper("showDes", function(des, options) {
			if (des === '') {
				return '暂未填写';
			} else {
				return des;
			}
		});
	};
	var showResult = function() {
		var param = Toolkit.paramOfUrl(location.href); //获取url信息

		/**第一次进来  刷新  -全局搜索*/
		var seachData = {};
		var firstSearch = FilterData.getFilter();
		var param = Toolkit.paramOfUrl(location.href); //获取url信息
		seachData['key'] = param.q.replace(/\+/g, ' ');
		filterData.key = param.q;
		jQuery("#gsheader .search").val(seachData['key']);
		seachData = Object.merge(firstSearch, seachData, filterData);
		loadResource(seachData); //载入筛选信息
	};

	var setPagination = function (total, selector, itemsPerPage, callbacks) {
        jQuery(selector).pagination(total, {
            orhide: false,
            first_loading: false,
            num_display_entries: 4, //连续分页主体部分显示的分页条目数
            items_per_page: itemsPerPage, //每页显示的条目数
            prev_text: "上一页",
            next_text: "下一页",
            ellipse_text: "...", //省略的页数用什么文字表示
            num_edge_entries: 2, //两侧显示的首尾分页的条目数  默认是2
            callback: function (pageIndex, jq) {
                callbacks(pageIndex + 1);
            }
        });
    };

	var loadResource = function(params) {
		jQuery("#content .searchlist .content").empty(); //移除内容区列表
		jQuery("#content .searchlist .content").html('<div class="loading"></div>');
		// 保持单例模式
		if (ajaxRequest) {
			ajaxRequest.abort();
		}
		var ajaxRequest = jQuery.ajax({
			url: url + "?timestamp=" + new Date().getTime(),
			type: 'get',
			data: params,
			cache: false,
			success: function(res) {
				if (res.code === 200) {
					jQuery("#content .main .searchlist .loading").remove(); //隐藏loading效果
					var totalPages = res.data.totalPages, //总页树
						totalRecords = res.data.totalRecords, //总资源数
						pageNo = res.data.pageNo, //当前页码
						renderData = res.data.list; //将要渲染的数据

					//如果资源树等于0时，则当前页面也置为0
					if (totalRecords === 0) {
						pageNo = 0;
					}
					jQuery(".order-cases .total .count").text(totalRecords); //资源总数
					jQuery(".order-cases .total .totalpage").text("/" + totalPages); //总页数
					jQuery(".order-cases .total .curpage").text(pageNo); //当前页码
					renderResult(renderData);
					if (totalPages < 2) { //不足2页时将所有筛选结果数据直接渲染模板
						jQuery(".order-cases .total .count").text(totalRecords); //资源总数
						jQuery(".order-cases .total .totalpage").text("/" + totalPages); //总页数
						jQuery(".order-cases .total .curpage").text(pageNo); //当前页码
						renderResult(renderData);
						jQuery(".itempager").hide();
					} else {
						jQuery(".itempager").show();
						setPagination(totalRecords, '.searchlist .pagepart', filterData.np, function(nextPage) {
							jQuery.ajax({
								url: url + '?timestamp=' + new Date().getTime(),
								type: "get",
								data: Object.merge(params, {
									p: nextPage
								}),
								dataType: 'json',
								success: function(res) {
									if (res.code === 200) {
										var totalPages = res.data.totalPages,
											totalRecords = res.data.totalRecords,
											pageNo = res.data.pageNo,
											renderData = res.data.list;
										renderResult(renderData);
										jQuery(".searchlist .content .itempager .current").html(nextPage); //修改下面分页当前页码
										jQuery(".order-cases .total .count").text(totalRecords);
										jQuery(".order-cases .total .totalpage").text("/" + totalPages);
										jQuery(".order-cases .total .curpage").text(pageNo);

										if (jQuery(".pagination").length === 1) { //若当前没有加载排序区的分页节点，则追加
											var clone = jQuery(".itempager").clone(true);
											jQuery(".total").append(clone);
											jQuery(".total .jumpto,.total .goto").remove();
										} else { //否则用下方的分页节点去替换排序区的分页节点
											var clone = jQuery(".itempager:eq(1)").clone(true);
											jQuery(".pagination:eq(0)").replaceWith(clone);
											jQuery(".total .jumpto,.total .goto").remove();
											jQuery(".pagination").show();
											jQuery(jQuery(".pagination")[0]).css("display", 'inline-block');

										}
									} else {
										notify.error(res.data);
									}
								},
								error: function() {
									notify.warn("网络错误，请重试！");
									jQuery(".main .content .loading").html("网络错误，请重试！").addClass("error");
								}
							});
						});
					}
					if (jQuery(".pagination").length === 1) { //若当前没有加载排序区的分页节点，则追加
						var clone = jQuery(".itempager").clone(true);
						jQuery(".total").append(clone);
						jQuery(".total .jumpto,.total .goto").remove();
					} else { //否则用下方的分页节点去替换排序区的分页节点
						var clone = jQuery(".itempager:eq(1)").clone(true);
						jQuery(".pagination:eq(0)").replaceWith(clone);
						jQuery(".total .jumpto,.total .goto").remove();
						//jQuery(".pagination").show();
						if (totalPages > 1) {
							jQuery(jQuery(".pagination")[0]).css("display", 'inline-block');
						}

					}
				} else {
					notify.error(res.data);
				}

			},
			error: function() {
				//notify.warn("网络错误，请重试！");
				jQuery(".main .content .loading").html("网络错误，请重试！").addClass("error");
			}
		});
	};

	var renderResult = function(data) {
		jQuery.when(Toolkit.loadTempl(template_url)).done(function(teml) {
			var template = Handlebars.compile(teml);

			jQuery("#content .main .searchlist .content").empty();
			jQuery("#content .main .searchlist .content").html(template({
				list: data
			}));

			//去掉我的工作台高亮
			jQuery('#header a.item').removeClass('active');
		});
	};

	/**
	 * [setUrl 设置每个内容的跳转连接 ]
	 * @author limengmeng
	 * @date   2015-02-07
	 * @param  {[type]}   type         [文件类型]
	 * @param  {[type]}   incidentName [有案事件为案事件名称或为undefined]
	 * @param  {[type]}   flag         [指当前文件的审核状态,已通过在库中，其他的都在我的工作台]
	 */
	
	var setUrl = function(type, incidentName,flag) {
		var url = hl = '';
		//var hrefStr = location.href;
		//var highlight = hrefStr.split('?')[0].split('/').getLast();
		var pagetype = 'workbench';
		switch(flag){
			case "0":
			case "1":
			case "2":
			case "3":
				pagetype = 'workbench';
			    break;
			case "4":
				if(incidentName){
					pagetype = 'caselib';
				}else{
					pagetype = 'doubtlib';
				}
			    break;
			default:
				break;
		}
		switch (type) {
			case "incident":
				url = '/module/viewlibs/details/incident/incident_detail.html?pagetype='+pagetype+'&incidentname=' + incidentName + '&id=';
				break;
			case "iimage":
				url = '/module/viewlibs/details/media/picture.html?pagetype='+pagetype+'&fileType=2&incidentname=' + incidentName + '&id=';
				break;
			case "image":
				url = '/module/viewlibs/details/media/picture.html?pagetype='+pagetype+'&fileType=2&id=';
				break;
			case "ivideo":
				url = '/module/viewlibs/details/media/video.html?pagetype='+pagetype+'&fileType=1&incidentname=' + incidentName + '&id=';
				break;
			case "video":
				url = '/module/viewlibs/details/media/video.html?pagetype='+pagetype+'&fileType=1&id=';
				break;
			case "icar":
				url = '/module/viewlibs/details/struct/car.html?pagetype='+pagetype+'&origntype=car&incidentname=' + incidentName + '&id=';
				break;
			case "car":
				url = '/module/viewlibs/details/struct/car.html?pagetype='+pagetype+'&origntype=car&id=';
				break;
			case "iperson":
				url = '/module/viewlibs/details/struct/person.html?pagetype='+pagetype+'&origntype=person&incidentname=' + incidentName + '&id=';
				break;
			case "person":
				url = '/module/viewlibs/details/struct/person.html?pagetype='+pagetype+'&origntype=person&id=';
				break;
			case "iexhibit":
				url = '/module/viewlibs/details/struct/exhibit.html?pagetype='+pagetype+'&origntype=exhibit&incidentname=' + incidentName + '&id=';
				break;
			case "exhibit":
				url = '/module/viewlibs/details/struct/exhibit.html?pagetype='+pagetype+'&origntype=exhibit&id=';
				break;
			case "iscene":
				url = '/module/viewlibs/details/struct/scene.html?pagetype='+pagetype+'&origntype=scene&incidentname=' + incidentName + '&id=';
				break;
			case "scene":
				url = '/module/viewlibs/details/struct/scene.html?pagetype='+pagetype+'&origntype=scene&id=';
				break;
			case "imoving":
				url = '/module/viewlibs/details/struct/move.html?pagetype='+pagetype+'&origntype=move&incidentname=' + incidentName + '&id=';
				break;
			case "moving":
				url = '/module/viewlibs/details/struct/move.html?pagetype='+pagetype+'&origntype=move&id=';
				break;
			case "irest":
				url = '/module/viewlibs/details/struct/others.html?pagetype='+pagetype+'&origntype=others&incidentname=' + incidentName + '&id=';
				break;
			case "rest":
				url = '/module/viewlibs/details/struct/others.html?pagetype='+pagetype+'&origntype=others&id=';
				break;
			default:
				break;
		}
		return url;
	};

	var bindSelfEvent = function() {
		/**筛选区点击事件*/
		jQuery(document).off('click', '.filter-panel .filter ul li a').on("click", ".filter-panel .filter ul li a", function (e) {
            var item = jQuery(this).closest("li"); //点击元素对应的li
            jQuery('[data-filter="n"] .create').val(''); //清空创建人员输入框
            item.addClass("active").siblings().removeClass("active"); //高亮筛选文字

            var childStr = item.attr("data-child"); //获取它下面要显示的data-filter的值
            //强关联项(包含data-child的筛选区都是强关联区，意思就是它的每个选项都和下面要显示或者不显示紧紧关联，不包含该属性的都是弱关联，即它的状态不影响其他元素的显隐)
            if (childStr !== undefined) {
                var childDate = childStr.split(",");
                var childLen = childDate.length;
                if (childStr !== 'no') { //强关联项，下面有关联项显示的
                    jQuery(".morefilter").hide();
                    item.closest(".morefilter").show();
                    var tem = childLen;
                    while (tem--) {
                        jQuery('[data-filter=' + childDate[tem] + ']').show();
                        jQuery('[data-filter=' + childDate[tem] + ']').find('[data-key]').show();
                        jQuery('[data-filter=' + childDate[tem] + '] [data-type="all"]').addClass("active").siblings().removeClass("active");
                    }

                    var hideStr = item.attr("data-hidekey"); //强关联项中要隐藏的data-key的值
                    if (!!hideStr) {
                        var hideDate = hideStr.split(",");
                        var hideLen = hideDate.length;
                        for (var i = 0; i < childLen; i++) {
                            var tem = jQuery('[data-filter=' + childDate[i] + ']');
                            for (var j = 0; j < hideLen; j++) {
                                tem.find('[data-key=' + hideDate[j] + ']').hide();
                            }
                        }
                    }
                } else {
                    jQuery(".morefilter").hide();
                    item.closest(".morefilter").show();
                }
            }

            //如果是存储单位
            var unit = jQuery(this).closest('[data-filter]');
            if (unit.attr('data-filter') === 'c') {
                var activekey = orgId = item.attr('data-key');
                unit.find('.box li.active').removeClass('active');

                var activeli = unit.find('[data-key="' + activekey + '"]');
                activeli.addClass('active');
                var cName = jQuery(activeli[0]).text();
                jQuery('.filter .container .current').text(cName);
                if (activeli.attr('data-self') === '0') {
                    jQuery('.filter .container .current').removeAttr('data-key');
                } else {
                    jQuery('.filter .container .current').attr('data-key', activekey);
                }
                jQuery('.filter-panel .filter .container .more').trigger('click');
            }

            //点击的不是“自定义时间”  !!!强调!!  这部分代码必须放在最后
            if (!jQuery(this).is(".custom-a")) {
                //如果自定义展开，则收起自定义，同时选中全部
                if (jQuery('.custom').hasClass("active")) {
                    jQuery(".createtime [data-key='0'] a").trigger("click");
                }
                var filterS = FilterData.getFilter();
				filterS.key = filterData.key;
                loadResource(filterS);
            }
            e.preventDefault();
        });
		/**排序*/
        jQuery(document).off('click', '.order-cases .cases li a').on("click", ".order-cases .cases li a", function (e) {
            e.preventDefault();
            var item = jQuery(this).closest("li");
            if (item.is(".active")) { //当前处于激活状态则变换排序方式（升序变降序等）
                var dir = item.find("i");

                if (dir.is(".dir_down")) { //降序
                    dir.removeClass("dir_down").addClass("dir_up");
                    item.attr("data-key", "2"); //升序
                } else {
                    dir.addClass("dir_down").removeClass("dir_up");
                    item.attr("data-key", "1"); //降序
                }
            } else {
                item.addClass("active").siblings().removeClass("active");
            }
            var filterS = FilterData.getFilter();
				filterS.key = filterData.key;
            loadResource(filterS);
        });
		/**自定义时间筛选*/
        jQuery(document).off('click', '.custom .custom-time .btn').on("click", ".custom .custom-time .btn", function () {
            var starttime = jQuery('.custom-time .input-time:eq(0)').val(),
                endtime = jQuery('.custom-time .input-time:eq(1)').val();
            if (starttime >= endtime) {
                return notify.error("起始时间必须小于截止时间！", {
                    timeout: 800
                });
            } else {
                var filterS = FilterData.getFilter();
				filterS.key = filterData.key;
            	loadResource(filterS);
            }
        });
        /**时间控件*/
        jQuery('.input-time').datetimepicker({
	        showSecond: true,
	        dateFormat: 'yy-mm-dd',
	        timeFormat: 'HH:mm:ss',
	        timeText: '',
	        hourText: '时',
	        minuteText: '分',
	        secondText: '秒',
	        showAnim: ''
        });
        //收起、更多 存储单位 按钮事件
        jQuery(document).off('click', '.filter-panel .filter .container .more').on("click", ".filter-panel .filter .container .more", function () {
            if (jQuery(this).is(".down")) {
                jQuery('.filter .container .current').hide();
                jQuery('.filter .container .unit-seach').show();
                jQuery(".filter-panel .filter .container .moreinfo").show();
                //jQuery(this).find('em').attr("title", "收起");
                jQuery(this).find("em").text("收起");
            } else {
                jQuery('.filter .container .current').show();
                jQuery('.filter .container .unit-seach').hide();
                jQuery(".filter-panel .filter .container .moreinfo").hide();
                jQuery(this).find("em").text("更多");
            }
            jQuery(this).toggleClass("down up");
        });
        /**
         * [description]  搜索存储单位从列表中
         * @return {[type]} [description]
         */
        jQuery(document).off('click', '.filter .container input.seach').on('click', '.filter .container input.seach', function () {

            var selector = $(this).closest('.status').siblings('div.moreinfo').find('.tab[data-tab="all"]'),
                seachText = $(this).siblings('input').val(),
                liArray = '';
            if (seachText === '' || seachText.length === 0) {
                selector.find('ul.search-result').empty().hide().siblings('dt').show();
            } else {
                selector.find('ul.search-result').empty();//清空上次的记录
                selector.find('li a').each(function (index, el) {
                    if ($(this).text().test(seachText)) {
                        liArray = $(liArray).add($(el).parent('li').clone(true, true));
                    }
                });
                if (!liArray.length) {
                    liArray = '<li>未搜索到任何数据！</li>'
                }
                selector.find('ul.search-result').append(liArray).show().siblings('dt').hide();
            }
        });
		/**“案发时间”和“目标出现时间”"拍摄时间"排序功能的显隐*/
		jQuery(document).off('click', '.filter[data-filter="f"] a').on("click", ".filter[data-filter='f'] a", function(e) {
			var item = jQuery(this).closest('li');
			var msg = '';
			if (!item.is('[data-type="all"]')) {
				jQuery('[data-filter="m"]').show();
				if (item.is('[data-type="case"]')) {
					jQuery('[data-filter="m"] .name').text('案发时间');
					msg = "起案事件";
				} else if (item.is('[data-type="trail"]') || item.is('[data-type="struct"]')) {
					jQuery('[data-filter="m"] .name').text('目标出现时间');

					msg = "条线索";
					if (item.is('[data-type="struct"]')) {
						msg = "条结构化信息";
					}
				} else {
					jQuery('[data-filter="m"] .name').text('拍摄时间');
					if (item.is('[data-type="video"]')) {
						msg = "个视频";
					} else {
						msg = "个图片";
					}
				}
				jQuery(".order-cases .total .infotype").text(msg);
			} else {
				jQuery('[data-filter="m"]').hide();
				jQuery(".order-cases .total .infotype").text('个资源信息');
			}
		});
		// 资源类型切换  重置统计提示信息
		jQuery(document).off('click', '.filter[data-filter="a"] a').on("click", ".filter[data-filter='a'] a", function(e) {
			jQuery('[data-filter="m"]').hide();
			jQuery(".order-cases .total .infotype").text('个资源信息');

		});

		/**缩略图链接*/
		jQuery('.searchlist').off('click', '.item .thumb-figure').on("click", ".item .thumb-figure", function() {
			var item = jQuery(this).closest(".item"),
				showtype = item.attr("data-type"), //用于展示的类型
				id = item.attr("data-id"),
				temUrl = '',
				flag = item.attr("data-auditflag"),
				incidentName = item.find(".incidentname").attr("data-inciedntname");
			//转换其他的类型关键字
			/*if (showtype == "rest") {
				showtype = "others";
			};*/
			temUrl = "&orgid=" + orgId;
			window.location.href = setUrl(showtype, incidentName, flag) + id + temUrl;
		});

		/**缩略图上方（视、图、结构化信息）主文案链接*/
		jQuery(document).off('click', '.maininfo .medianame,.maininfo .incidentname,.maininfo .incidentno,.maininfo .structname').on("click", ".maininfo .medianame,.maininfo .incidentname,.maininfo .incidentno,.maininfo .structname", function() {
			jQuery(this).closest(".item").find(".thumb-anchor").trigger('click');
		});

		/**导入视频、图片跳转参数添加*/
		jQuery(document).off('click', '#importResource').on("click", "#importResource", function() {
			panelImport.open();
		});
		//页面上搜索框点击
		jQuery(document).off('click', '#gsheader .content input.confirm').on("click", "#gsheader .content input.confirm", function() {
			if (jQuery('#gsheader .content input.search').val() === '') {
				filterData.key = '';
			}
			var filterS = FilterData.getFilter();
			filterS.key = filterData.key;
			loadResource(filterS);
		});
		//页面上搜索框回车
		jQuery("#gsheader .content input.search").keydown(function(event) {
			if (event.keyCode === 13) {
				jQuery("#gsheader .content input.confirm").trigger('click');
			}
		});
		//创建人员：搜索筛选
		jQuery(document).off('click', '[data-filter="n"] .seach').on("click", "[data-filter='n'] .seach", function() {
			var filterS = FilterData.getFilter();
			filterS.key = filterData.key;
			loadResource(filterS);
		});
		//创建人员：搜索框回车
		jQuery("[data-filter='n'] .create").keydown(function(event) {
			event.stopImmediatePropagation();
			if (event.keyCode === 13) {
				var filterS = FilterData.getFilter();
				filterS.key = filterData.key;
				loadResource(filterS);
			}
		});
		jQuery('#gsheader .content input.search').keyup(function() {
			filterData.key = jQuery(this).val();
		});

	};
	return {initialize : initialize};

});