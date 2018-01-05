define([
	'/module/viewlibs/details/incident/js/model.js',
	'/module/viewlibs/common/panel_import.js',
	'handlebars',
	'base.self',
	'jquery-ui-1.10.1.custom.min',
	'jquery.pagination',
	'jquery.placeholder',
	'thickbox',
	'permission'
], function(IncidentModel, panelImport) {
	var IncidentView = function(){};

	IncidentView.prototype = {
		urls: {
			GET_INCIDENT_INFO: '/service/pvd/get_incident_info',
			COMMIT_URL: '/service/pvd/audit_incident_info',
			DELETE_URL: '/service/pvd/delete_incident_info',
			INCIDENT_DICTIONARY: '/module/viewlibs/caselib/inc/incident.json',
			LIST_VIDEOS: '/service/pvd/get_incident_videos',
			LIST_IMAGES: '/service/pvd/get_incident_images',
			GET_OPERATE_RECORD: '/service/pvd/incident/operator/record/',
			SAVE_TO_CLOUND:'/service/pvd/pvd_incident_pcm',	//	保存到云端
			IS_IN_CLOUND:'/service/pvd/incident_exist'	//	检测之前是否已保存过
		},

		initialize: function(params) {
			//二级高亮
			jQuery("#header .wrapper a").removeClass("active");
			var activeMenu = localStorage.getItem("activeMenu"),
                currentLib = activeMenu && JSON.parse(activeMenu).viewlibs;
			switch (currentLib) {
				case 'workbench':
					jQuery("#header .wrapper a[data-id='14']").addClass("active");break;
				case 'caselib':
					jQuery("#header .wrapper a[data-id='15']").addClass("active");break;
				case 'doubtlib':
					jQuery("#header .wrapper a[data-id='16']").addClass("active");break;
				case 'peoplelib':
					jQuery("#header .wrapper a[data-id='17']").addClass("active");break;
				case 'carlib':
					jQuery("#header .wrapper a[data-id='18']").addClass("active");break;
				default:
					jQuery("#header .wrapper a[data-id='14']").addClass("active");break;
			}
			this.addHelper();
			//通过url获取案件相关参数
			this.params = IncidentModel.getParams(params);
			var incident = {},
				inClound = false;
			var self = this;
			//判断是否以保存在云空间中
			IncidentModel.checkXhr(this.params.id, function(res) {
				if (res.code === 200) {
					inClound = res.data.flag;
				}
			});
			//获取案事件的详细信息
			IncidentModel.getIncidentInfo(this.params.id, function(res) {
				if (res.code === 200 && !res.data.message) {
					incident = res.data.incident;
					incident.inClound = inClound;
					self.displayInfo(incident);
				} else if(res.code === 200 && res.data.message){
					//去掉我的工作台高亮
					jQuery('#header a.item').removeClass('active');	
					jQuery("#content").html("<p class='deltext'>该资源在视图库中已被删除</p>");
				}else{
					notify.warn("获取案事件信息失败");
				}
			});

		},

		// handlebar助手
		addHelper: function() {
			var self = this;
			//	毫秒转日期

			// 设置ajax同步请求
			jQuery.ajaxSetup({
				async: false
			});

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
			// 非待审核
			Handlebars.registerHelper('unwaitPass', function(status, options) {
				if (status !== 2) {
					return options.fn();
				}
			});
			Handlebars.registerHelper("eq", function(val1, val2, options) {
				if (val1 === val2) {
					return options.fn();
				} else {
					return options.inverse();
				}
			});

			Handlebars.registerHelper("uneq", function(val1, val2, options) {
				if (val1 !== val2) {
					return options.fn();
				} else {
					return options.inverse();
				}
			});

			Handlebars.registerHelper("readOnly", function() {
				var orgId = Toolkit.paramOfUrl().orgid;
				// 如果orgid不存在则说明是浏览下级资源 不显示通过、打回按钮
				return (orgId && orgId !== '') ? 'hide' : '';
			});

			Handlebars.registerHelper("belongs", function(context, options) {
				var orgId = Toolkit.paramOfUrl().orgid;
				var sync = context.sync === "暂未填写" ? null : context.sync; // sync 案事件的同步上传状态

				//sync可能存在的值1，2，4，8，16，32 或以上值中某几个值之间的算术或
				// 	2. 1，2，4，8，16，32所代表的含义
				// 	1： 代表下级存在的案事件是已经被下级人员手动的推送到上级单位的案事件 (访问下级资源  不显示同步)
				// 	
				// 	2： 代表上级的案事件  是被上级人员手动同步到上级单位的案事件 (可以继续上传)
				// 	
				// 	4： 代表下级的案事件 是已经被下级单位自动推送到上级单位的案事件  (访问下级资源  不显示同步)
				// 	
				// 	8： 代表上级存在的案事件是被下级人员手动推送上来的案事件  (可以继续上传  访问下级资源  不显示同步)
				// 	
				// 	16： 代表下级存在的案事件是已经被上级人员手动的同步的案事件 (可以继续上传  访问下级资源  不显示同步)
				// 	
				// 	32： 代表上级存在的案事件是被下级单位自动推送的案事件 (可以继续上传  访问下级资源  不显示同步)

				// 该资源不属于当前部门
				// 

				if (orgId && orgId !== "") {
					// 同步按钮
					if (options.hash.type === "2") {
						if ((sync & 1) !== 1 && (sync & 4) !== 4 && (sync & 16) !== 16) {
							return options.inverse(context);
						}
					}
				} else {
					// 该资源属于当前部门的(上传按钮)
					if (options.hash.type === "1") {
						if (sync === null || (sync & 2) === 2 || (sync & 8) === 8) {
							return options.fn(context);
						}
					}
				}
			});

			var userid = jQuery('#userEntry').data('userid');
			Handlebars.registerHelper('isLogUser', function(param) {
				return userid === param ? "show" : "must-hide";
			});

			Handlebars.registerHelper('textdisabe', function(count) {
				return count === 0 ? "textdisabe" : "";
			});

			Handlebars.registerHelper('isOwner', function(param1, param2) {
				if (param2 === 4) {
					return "permission-delete";
				} else {
					return userid === param1 ? "permission-create" : "";
				}
			});

			// 案事件状态颜色控制
			Handlebars.registerHelper("statecolor", function(state) {
				var classname = '';
				switch (state) {
					case '未提交':
						classname = 'to-commit';
						break;
					case '待审核':
						classname = 'to-verify';
						break;
					case '再审核':
						classname = 'verify-again';
						break;
					case '已通过':
						classname = 'verify-success';
						break;
					case '未通过':
						classname = 'verify-error';
						break;
					default:
						return;
				}
				return classname;
			});
            
            Handlebars.registerHelper("isUpload", function(sycState, status, options) {
				if (status !== 4) {
					return "";
				}

				if (sycState === 1) {
					return new Handlebars.SafeString('<a class="disable">已上传ICP</a>');
				}

				return new Handlebars.SafeString('<a data-type="11" class="uploadIcp">上传ICP</a>');
			});

			// 通过翻译字典转code值
			jQuery.getJSON(self.urls.INCIDENT_DICTIONARY).done(function(result) {
				Handlebars.registerHelper("translate", function(param1, param2, options) {
					if ((param2 in result) && (param1 in result[param2])) {
						return result[param2][param1];
					}
					return '暂未填写';
				});
			});

			// 恢复ajax异步请求
			jQuery.ajaxSetup({
				async: true
			});
		},

		// 将案件信息显示
		displayInfo: function(data) {
			var incidentId = data.id;
			// 如果返回的值为null或'' 则转换为'暂未填写' 
			for (var key in data) {
				data[key] = (data[key] === '' || data[key] === null) ? '暂未填写' : data[key];
				if (key === "picture" && data[key] === "暂未填写") {
					data[key] = "/module/common/images/upload.png";
				}
			}

			var template = Handlebars.compile(jQuery('#incidentInfo').html());

			jQuery('#content .wrapper').html(template(data));

			// 更新面包屑
			this.params.incidentname = data.name;
			this.updateCrumbs(data.status);
			// 显示案事件操作记录 
			IncidentModel.getRecord(this.params);

			// 注册查看大图
			window.thickbox();

			// 列举视频图片线索
			this.listVideo();
			this.listImage();
			this.listThread();
			// 根据角色显示相应按钮
			permission.reShow();

			// 根据状态控制按钮的显隐
			this.hidRoleBtn(data.state);
			permission.reShow();
			// 获取主评论信息
			this.showComments();


			//保存后不可点击
			if (data.inClound) {
				jQuery(".main .save-to-clound").addClass("disable");
				jQuery(".main .save-to-clound").prop('disabled', true);
				jQuery(".main .save-to-clound").html('已保存');
			} else {
				jQuery(".main .save-to-clound").prop("disabled", false);
			}
			//取回按钮 0：可点，2：不可点
			if (data.isBack == "2") {
				jQuery("#recaption").addClass("disable");
				jQuery("#recaption").prop('disabled', true);
				jQuery("#recaption").html('已取回');
			} else {
				jQuery("#recaption").prop("disabled", false);
			}
		},

		
		/* 根据案件状态控制按钮显隐 
		*@ 未提交和未通过的可删除 其他状态不能删除
		*@ 已通过审核时 隐藏“提交审核”按钮
		*/
		hidRoleBtn: function(status){
			if(status === '待审核' || status === '已通过' || status === '再审核'){
				jQuery('.btn .delete').hide();
				jQuery('#commit').hide();
			}

			if(status === '已通过'){
				jQuery('.btn #commit').hide();	
				jQuery('.btn #reject, .btn #pass').hide();// 针对审核人员
			}

			if(status === '未通过'){
				jQuery('.btn #reject, .btn #pass').hide();// 针对审核人员
			}
		},

		//列举案事件下面的线索
		listThread: function() {
			var self = this;
			var orgid = this.params.orgid;
			jQuery.ajax({
				url: '/service/pvd/clue/' + self.params.id,
				data: {
					id: self.params.id,
					orgId: orgid,
					pageNo: 1,
					pageSize: 6
				},
				cacha: false,
				type: 'GET',
				success: function(res) {
					if ((typeof res) === 'string') {
						res = JSON.parse(res);
					}
					// notify.success('获取视频成功');
					if (res.code === 200) {
						self.threadCount = res.data.totalRecords;
						jQuery('#relatedMedia .tabs .tcount').text(self.threadCount);
						self.setPagination(self.threadCount, '.pagebar.threads', 6, function(nextPage) {
							jQuery.ajax({
								url: '/service/pvd/clue/' + self.params.id,
								type: "get",
								cache: false,
								data: {
									id: self.params.id,
									orgId: orgid,
									pageNo: nextPage,
									pageSize: 6
								},
								dataType: 'json',
								success: function(res) {
									if (res.code === 200) {
										var data = res.data.records;
										self.showThread(data);
									} else {
										notify.warn("线索统计请求出错！错误码：" + res.code);
									}
								}
							});
						});
					} else {
						notify.warn("线索统计请求出错！错误码：" + res.code);
					}
				},
				error: function() {
					notify.warn('获取视频失败');
				}
			});
		},

		// 列举案事件下面的视频
		listVideo: function() {
			var self = this;
			var orgid = this.params.orgid;
			jQuery.ajax({
				url: this.urls.LIST_VIDEOS,
				data: {
					id: self.params.id,
					orgId: orgid,
					pageNo: 1,
					pageSize: 6
				},
				cacha: false,
				type: 'GET',
				success: function(res) {
					if ((typeof res) === 'string') {
						res = JSON.parse(res);
					}
					// notify.success('获取视频成功');
					if (res.code === 200) {
						self.videoCount = res.data.totalRecords;
						jQuery('#relatedMedia .tabs .vcount').text(self.videoCount);
						self.setPagination(self.videoCount, '.pagebar.videos', 6, function(nextPage) {
							jQuery.ajax({
								url: self.urls.LIST_VIDEOS,
								type: "get",
								cache: false,
								data: {
									id: self.params.id,
									orgId: orgid,
									pageNo: nextPage,
									pageSize: 6
								},
								dataType: 'json',
								success: function(res) {
									if (res.code === 200) {
										var data = res.data.records;
										self.showVideo(data);
									} else {
										notify.warn("网络异常！");
									}
								}
							});
						});
					}
				},
				error: function() {
					notify.warn('获取视频失败');
				}
			});
		},

		// 列举案事件下面的图片
		listImage: function() {
			var self = this;
			var orgid = this.params.orgid;
			jQuery.ajax({
				url: this.urls.LIST_IMAGES,
				data: {
					id: self.params.id,
					orgId: orgid,
					pageNo: 1,
					pageSize: 6
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
						jQuery('#relatedMedia .tabs .pcount').text(self.imageCount);
						self.setPagination(self.imageCount, '.pagebar.pictures', 6, function(nextPage) {
							jQuery.ajax({
								url: self.urls.LIST_IMAGES,
								type: "get",
								cache: false,
								data: {
									id: self.params.id,
									orgId: orgid,
									pageNo: nextPage,
									pageSize: 6
								},
								dataType: 'json',
								success: function(res) {
									if (res.code === 200) {
										var data = res.data.records;
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

		//渲染线索信息
		showThread: function(data) {
			if (!data) return;
			var self = this;
			var items = '';
			for (var i = 0; i < data.length; i++) {
				// 转化时间格式 
				data[i].std_APPEAR_TIME = Toolkit.mills2datetime(data[i].std_APPEAR_TIME);
				items += "<li data-id='" + data[i].id + "' data-name='" + data[i].name + "'><a class='box'><img src='" + data[i].ctm_THUMBNAIL + "'/></a><p><a>" + IncidentModel.trackKeyType(data[i]) + "</a></p><p class='v-address'>" + data[i].location + "</p><p class='v-time'>" + data[i].std_APPEAR_TIME + "</p></li>";
			}
			jQuery("[data-view='thread'] ul").empty().html(items);
		},
		// 渲染视频信息
		showVideo: function(data) {
			var items = '';
			for (var i = 0; i < data.length; i++) {
				// 转化时间格式 
				data[i].stdShootTime = Toolkit.mills2datetime(data[i].stdShootTime);
				if (!data[i].stdThumbnail) {
					data[i].stdThumbnail = "/module/common/images/upload.png";
				}
				items += "<li data-id='" + data[i].id + "'><a class='box'><img src='" + data[i].stdThumbnail + "'/></a><p><a>" + data[i].stdName + "</a></p><p class='v-address'>" + data[i].stdLocation + "</p><p class='v-time'>" + data[i].stdShootTime + "</p></li>";
			}
			jQuery("[data-view='video'] ul").empty().html(items);
			// 	var template = Handlebars.compile(jQuery('#incidentInfo').html());
			// 	jQuery("[data-view='video'] ul").html(template(data));
		},

		// 渲染图片信息
		showImage: function(data) {
			if (!data) return;
			var items = '';
			for (var i = 0; i < data.length; i++) {
				// 转化时间格式 
				data[i].stdShootTime = Toolkit.mills2datetime(data[i].stdShootTime);
				items += "<li data-id='" + data[i].id + "'><a class='box'><img src='" + data[i].stdThumbnail + "'/></a><p><a>" + data[i].stdName + "</a></p><p class='v-address'>" + data[i].stdLocation + "</p><p class='v-time'>" + data[i].stdShootTime + "</p></li>";
			}
			jQuery("[data-view='picture'] ul").empty().html(items);
		},

		// 分页
		setPagination: function(total, selector, itemsPerPage, callback) {
			jQuery(selector).pagination(total, {
				items_per_page: itemsPerPage,
				num_display_entries: 6,
				num_edge_entries: 0,
				show_cur_all: true,
				callback: function(pageIndex, jq) {
					callback(pageIndex + 1);
				}
			});
		},

		// 更新面包屑
		updateCrumbs: function(status) {
			jQuery('.crumbs > a.first').text(IncidentModel.getCrumbsType()).attr({
				'href': '/module/viewlibs/' + this.params.pagetype + '/index.html',
				'data-pagetype': this.params.pagetype
			});
			if (status === 4) {
				jQuery('.crumbs > a.first').text("案事件信息库");
			};

			jQuery('.crumbs > a.second').text(this.params.incidentname);

			// 更新二级导航选中状态
			if (Toolkit.paramOfUrl(window.location.href).pagetype === 'caselib' || status === 4) {
				jQuery('div.ui.menu.atached.nav > a[data-id="15"]').addClass('active').siblings().removeClass('active');
			}
		},

		/*
		 *	案事件保存到云端
		 *	@param{id}	incidentId
		 *	@param{el}	保存按钮
		 */
		saveToClound: function(id, el) {
			jQuery.ajax({
				url: this.urls.SAVE_TO_CLOUND + "/" + id,
				type: 'POST',
				dataType: "JSON",
				success: function(res) {
					if (res.code === 200) {
						var msg = "保存“" + jQuery("#incidentName").text() + "”案事件";
						logDict.insertMedialog('m4', msg);
						jQuery(".main .save-to-clound").addClass("disable");
						jQuery(".main .save-to-clound").html("已保存");
						notify.info("保存到云端成功");
					} else {
						notify.warn("保存到云端失败");
					}
				},
				beforeSend: function() {
					el.prop("disabled", true);
				},
				error: function() {
					notify.warn('网络异常');
				}
			});
		},

		// 显示评论信息
		showComments: function() {
			var self = this;
			// 请求模板
			jQuery.get('/module/viewlibs/workbench/inc/tpl_comment.html', function(source) {
				var template = Handlebars.compile(source);
				var data = null;

				IncidentModel.getComments(self.params.id, function(res) {
					if (res.code === 200) {
						data = res.data;
						jQuery('#notes > .views .comment > ul').html(template(data));
					}
				});
			});
		}
	}
	var incidentView  = new IncidentView();
	return incidentView;
});