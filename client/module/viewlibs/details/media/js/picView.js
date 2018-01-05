/**
 * [ImgView 图片详情信息类]
 * @author limengmeng
 * @date   2014-10-31
 */
define([
	'/module/viewlibs/details/media/js/picModel.js',
	'base.self',
	'jquery.pagination',
	'scrollbar',
	'jquery.placeholder',
	'permission',
	'handlebars'
], function(ImgModel) {
	var ImgView = function() {};
	ImgView.prototype = {
		isWorkBench: 0,
		urls: {
			IMG_DICTIONARY: '/module/viewlibs/json/image.json', //图片详情页翻译内容
			INCIDENT_DICTIONARY: '/module/viewlibs/json/incident.json', //案事件翻译信息
			ADDRESS_DICTIONARY: '/module/viewlibs/json/address.json'
		},

		//初始化函数
		initialize: function(params) {
			//二级高亮
			jQuery("#header .wrapper a").removeClass("active");
			var currentLib = JSON.parse(localStorage.getItem("activeMenu"));
			if(!currentLib){
				var activeMenu = {"viewlibs": "workbench"};
                localStorage.setItem("activeMenu", JSON.stringify(activeMenu));
                currentLib = JSON.parse(localStorage.getItem("activeMenu")).viewlibs;
			}
			switch (currentLib.viewlibs) {
				case 'workbench':
					jQuery("#header .wrapper a[data-id='14']", top.document).addClass("active").siblings("a").removeClass("active");break;
				case 'caselib':
					jQuery("#header .wrapper a[data-id='15']", top.document).addClass("active").siblings("a").removeClass("active");break;
				case 'doubtlib':
					jQuery("#header .wrapper a[data-id='16']", top.document).addClass("active").siblings("a").removeClass("active");break;
				case 'peoplelib':
					jQuery("#header .wrapper a[data-id='17']", top.document).addClass("active").siblings("a").removeClass("active");break;
				case 'carlib':
					jQuery("#header .wrapper a[data-id='18']", top.document).addClass("active").siblings("a").removeClass("active");break;
				default:
					jQuery("#header .wrapper a[data-id='14']", top.document).addClass("active").siblings("a").removeClass("active");break;
			}
			// 注册handlebar翻译助手
			this.addHelper();
			// 缓存url参数
			this.params = ImgModel.getParams(params);

			this.WorkBenchfun();
			var imgdata = {};
			var inClound = false;
			var self = this;
			ImgModel.checkXhr(self.params.id, function(res) {
				if (res.code === 200) {
					inClound = res.data.flag;
				}
			});
			// 获取视图信息
			ImgModel.getVideoInfo(self.params, function(res) {
				if (res.code === 200 && !res.data.message) {
					imgdata = res.data.image;
					// 判断该资源是否关联案事件
					self.isAssociated = imgdata.incidentId === null ? false : true;

					// 如果图片数据中的某些项为空则转换为'暂未填写'进行显示
					for (var key in imgdata) {
						if(imgdata[key] === 0){
							continue;
						}
						imgdata[key] = (!imgdata[key] ? '暂未填写' : imgdata[key]);
					}
					imgdata.inClound = inClound;
					self.name = imgdata.name;
					self.params.filename = imgdata.name;
					self.displayInfo(imgdata);
					//获取线索列表
					self.listThread(imgdata);
					//权限控制
					(window.permission || permission) && permission.reShow();

					//如果是在疑情信息库，则不能操作
					if(self.params.pagetype === "doubtlib"){
						jQuery(".body .operate").hide();
						jQuery("#imgHandle").hide();
						jQuery("#manualMark").hide();
					}
				
				} else if (res.code === 200 && res.data.message) {
					//去掉我的工作台高亮
					jQuery('#header a.item').removeClass('active');
					jQuery("#content").html("<p class='deltext'>该资源在视图库中已被删除</p>");
				} else {
					notify.warn("获取图片信息失败");
				}
			}, function() {
				notify.warn("网络异常");
			});
		},

		// handlebar助手
		addHelper: function() {
			var self = this;
			//	毫秒转日期
			Handlebars.registerHelper("mills2str", function(num) {
				return Toolkit.mills2datetime(num);
			});

			// 控制审核按钮的显隐
			Handlebars.registerHelper('auditBar', function(status, value1, value2, options) {
				if (status === "暂未填写" || status === "") {
					status = 1;
				}
				if (status === value1 || status === value2) {
					return options.fn();
				}

			});

			Handlebars.registerHelper('textdisabe', function(count) {
				return parseInt(count) === 0 ? "textdisabe" : "";
			});

			//不相等时执行
			Handlebars.registerHelper("uneq", function(val1, val2, options) {
				if (val1 !== val2) {
					return options.fn();
				} else {
					return options.inverse();
				}
			});

			// 审核状态 1:未提交；2：待审核；3：未通过；4：已通过；5:再审核
			Handlebars.registerHelper('auditStatus', function(status, value1, options) {
				if (status === "暂未填写" || status === "") {
					status = 1;
				}
				if (status === value1) {
					return options.fn();
				}
			});

			// 待审核
			Handlebars.registerHelper('unwaitPass', function(status, options) {
				if (status !== 2) {
					return options.fn();
				}
			});
			jQuery.ajaxSettings.async = false;
			// 将图片信息中的字符代码转换为具体的描述类型
			jQuery.getJSON(self.urls.IMG_DICTIONARY).done(function(result) {
				Handlebars.registerHelper("translate", function(param1, param2, options) {
					if ((param2 in result) && (param1 in result[param2])) {
						return result[param2][param1];
					}
					return '暂未填写';
				});
			});

			// 将案件信息中的字符代码转换为具体的描述类型
			jQuery.getJSON(self.urls.INCIDENT_DICTIONARY).done(function(result) {
				Handlebars.registerHelper("translate_case", function(param1, param2, options) {
					if ((param2 in result) && (param1 in result[param2])) {
						return result[param2][param1];
					}
					return '暂未填写';
				});
			});

			// 将地址信息中的字符代码转换为具体的描述类型
			jQuery.getJSON(self.urls.ADDRESS_DICTIONARY).done(function(result) {
				Handlebars.registerHelper('translate_address', function(param1, param2, options) {
					if (param2 === "address") {
						return result[param1] ? result[param1][0] : '';
					}
					return '';
				});
			});
			jQuery.ajaxSettings.async = true;
			// 判断当前登录的用户是否是图片的导入者 如果不是则不显示‘保存’‘编辑’‘删除’等按钮
			var userid = jQuery('#userEntry').data('userid');
			Handlebars.registerHelper('isLogUser', function(param1, param2) {
				if (param2 === '暂未填写') {
					param2 = false;
				} else if (!param2) {
					return (userid === param1) ? "show" : "must-hide";
				}
				return ((userid === param1) && param2) ? "show" : "must-hide";
			});

			//针对创建者和删除权限者 若是创建者则是创建权限，否则添加删除权限
			Handlebars.registerHelper('isOwner', function(param1, param2) {
				if (param2 === 4) {
					return "permission-delete";
				} else {
					return userid === param1 ? "permission-create" : "";
				}
			});

		},

		/**
		 * [setPagination 分页函数]
		 * @author limengmeng
		 * @date   2014-10-31
		 * @param  {[int]}   total        [要显示信息的总条数]
		 * @param  {[dom]}   selector     [分页显示位置dom]
		 * @param  {[int]}   itemsPerPage [每页显示的条数]
		 * @param  {Function} callback     [下一页的回调函数]
		 */
		setPagination: function(total, selector, itemsPerPage, callback) {
			jQuery(selector).pagination(total, {
				items_per_page: itemsPerPage,
				num_display_entries: 12,
				num_edge_entries: 0,
				show_cur_all: true,
				callback: function(pageIndex, jq) {
					callback(pageIndex + 1);
				}
			});
		},
		/**
		 * [showImage 读取列表信息渲染图片信息]
		 * @author limengmeng
		 * @date   2014-10-31
		 * @param  {[json]}   data [获取到的信息值]
		 * @return {[]}        []
		 */
		showImage: function(data) {
			if (!data) return;
			var self = this;
			var items = '';
			for (var i = 0; i < data.length; i++) {
				// 转化时间格式 
				data[i].std_APPEAR_TIME = Toolkit.mills2datetime(data[i].std_APPEAR_TIME);
				items += "<li data-id='" + data[i].id + "' data-name='" + data[i].name + "'><a class='box'><img src='" + data[i].ctm_THUMBNAIL + "'/></a><p><a>" + ImgModel.trackKeyType(data[i]) + "</a></p><p class='v-address'>" + data[i].location + "</p><p class='v-time'>" + data[i].std_APPEAR_TIME + "</p></li>";
			}

			if (items === '') {
				items = '<span class="picthreadli-span">暂无数据</span>';
			}

			jQuery(".overview [data-view='thread'] ul").empty().html(items);
		},
		WorkBenchfun: function() {
			var self = this,
				rs = 0;
			var pagetype = self.params.pagetype;
			var home = self.params.home;
			if (!home) {
				home = location.href.split("?")[0].test("/workbench/");
				home = "workbench";
			}
			if (pagetype !== "workbench") {
				if (pagetype === "structlist" && home && home === "workbench") {
					rs = 0;
				} else {
					rs = 1;
				}
			}
			self.isWorkBench = rs;
			self.params.isWorkBench = rs;
		},
		/**
		 * [listThread 获取图片相关的线索列表]
		 * @author limengmeng
		 * @date   2014-10-31
		 * @param  {[json]}   imgdata [当前图片信息]
		 * @return {[]}           []
		 */
		listThread: function(imgdata) {
			var self = this;
			var orgid = self.params.orgid;
			var imageId = self.params.id;
			jQuery.ajax({
				url: "/service/pvd/get_image_structeds",
				data: {
					t: 0,
					s: 0,
					t: 0, //全部 
					b: imgdata.incidentId, //案事件id
					r: imageId, //图片id
					l: 0, //线索类型,
					o: 2, //1创建时间升序 2 创建时间降序
					p: 1, //当前页
					np: 12, //每页多少条
					rs: self.isWorkBench
				},
				cacha: false,
				type: 'GET',
				success: function(res) {
					if ((typeof res) === 'string') {
						res = JSON.parse(res);
					}
					if (res.code === 200) {
						// notify.success('获取图片成功');
						self.imageCount = res.data.totalRecords;
						self.setPagination(self.imageCount, '.pagebar.pictures', 12, function(nextPage) {
							jQuery.ajax({
								url: "/service/pvd/get_image_structeds",
								type: "get",
								cache: false,
								data: {
									t: 0,
									s: 0,
									t: 0, //全部 
									b: imgdata.incidentId, //案事件id
									r: imageId, //图片id
									l: 0, //线索类型,
									o: 2, //1创建时间升序 2 创建时间降序
									p: nextPage, //当前页
									np: 12, //每页多少条
									rs: self.isWorkBench
								},
								dataType: 'json',
								success: function(res) {
									if (res.code === 200) {
										var data = res.data.list;
										self.showImage(data);
									} else {
										notify.warn("网络异常！");
									}
								}
							});
						});
					} else {
						notify.warn('获取图片异常');
					}
				},
				error: function() {
					notify.warn('网络异常');
				}
			});
		},

		/**
		 * [displayIncidentInfo 渲染案事件信息]
		 * @author limengmeng
		 * @date   2014-10-31
		 * @param  {[json]}   data [案事件信息内容]
		 * @return {[]}        []
		 */
		displayIncidentInfo: function(data) {
			var self = this;
			jQuery.get('/module/viewlibs/details/media/inc/tmp_incident.html', function(source) {
				var template = Handlebars.compile(source);
				for (var key in data) {
					data[key] = (data[key] ? data[key] : '暂未填写');
				}
				jQuery('.views .incident').html(template(data));

				// 如果案事件状态是‘待审核’或者‘再审核’ 则显示‘打回’按钮
				if (data.state === '待审核' || data.state === '再审核') {
					jQuery('#reject').css('display', 'block');
				}
				//权限控制
				window.permission && permission.reShow();
				//判断标注是否显示
				if (data.status === 4 || data.status === 2) {
					jQuery("#imgHandle").hide();
					jQuery("#manualMark").hide();
				}
				// 修改this.params
				self.params.casename = data.name;

				// 更新面包屑
				self.updateCrumbs();
			});
		},

		/**
		 * [displayInfo 将视频信息显示]
		 * @author limengmeng
		 * @date   2014-10-31
		 * @param  {[json]}   data [案事件信息内容]
		 * @return {[]}        []
		 */
		displayInfo: function(data) {
			var self = this;
			self.passParams = {
				mediaName: data.name,
				incidentId: data.incidentId
			};
			self.params.mediaName = data.name;
			var template = Handlebars.compile(jQuery('#imgTmp').html());

			jQuery('#content .wrapper').html(template(data));

			// 案事件不存在时隐藏“所属案事件tab”
			if (data.incidentId === '暂未填写') {
				jQuery('#incidentTab').hide();
			}
			//保存后不可点击
			if (data.inClound) {
				jQuery(".operate .save-to-clound span").addClass("disable");
				jQuery(".operate .save-to-clound span").html("已保存");
				jQuery(".operate .save-to-clound").prop("disabled", true);
			} else {
				jQuery(".operate .save-to-clound").prop("disabled", false);
			}
			var incidentId = jQuery('.header .body a.clue').data('caseid');
			if (data.incidentId && data.incidentId !== '暂未填写') {
				self.params.incidentid = incidentId;
				ImgModel.getIncidentInfo(self.params, function(res) {
					if ((typeof res) === 'string') {
						res = JSON.parse(res);
					}
					if (res.code === 200) {
						self.displayIncidentInfo(res.data.incident);
						logDict.insertMedialog('m4', '查看 ' + res.data.incident.name + '案事件的' + self.name + '图片', "", "o4");
					}
				}, function() {
					notify.warn('网络异常');
				});
			} else {
				// 更新面包屑
				self.updateCrumbs();
				logDict.insertMedialog('m4', '查看 ' + self.name + '图片', "", "o4");
			}

			//内容区添加滚动条
			jQuery(".views").tinyscrollbar({
				thumbSize: 36
			});


		},
		// 更新面包屑
		updateCrumbs: function() {
			this.hlight = location.href.split('?')[0].split('/').getLast(); //获取?前面紧跟的参数
			jQuery('.crumbs > a.first').text(ImgModel.getCrumbsType()).attr({
				'href': '/module/viewlibs/' + this.params.pagetype + '/index.html'
			});
			// 面包屑更新  案事件相关： pagetype > 案事件名 > 图片信息    案事件无关： pagettype > 图片信息
			if (this.params.casename) { //案事件相关
				var caseid = jQuery('#manualMark').data('caseid');
				jQuery('.crumbs > a.second').text(this.params.casename).attr("href", "/module/viewlibs/details/incident/incident_detail.html?id=" + caseid + "&pagetype=" + this.params.pagetype + '&incidentname=' + this.params.casename + '&orgid=' + this.params.orgid);
			} else { //案事件无关
				jQuery('.crumbs > a.second').text('图片信息').addClass('gray');
				jQuery('.crumbs > a.second').nextAll().hide();
				// 将图片上方显示为"结构化信息?条"
				jQuery('.body a.clue > span').text('结构化信息');
			}
			if (Toolkit.paramOfUrl(window.location.href).pagetype === 'caselib') {
				jQuery('div.ui.menu.atached.nav > a.caselib').addClass('active').siblings().removeClass('active');
			}
		}
	};
	var imgView = new ImgView();
	return imgView;
});