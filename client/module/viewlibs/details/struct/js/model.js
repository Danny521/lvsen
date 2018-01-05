define([
	'/module/viewlibs/details/struct/js/view.js',
	'domReady',
	'ajaxModel',
	'base.self',
	'handlebars'
], function(MediaLoaderView, domReady, ajaxModel) {
	function MediaLoaderModel() {}
	MediaLoaderModel.prototype = new MediaLoaderView();
	MediaLoaderModel.prototype.structInfo = '';
	/**
	 * [jsonUrls description]
	 * @type {Object}
	 */
	MediaLoaderModel.prototype.jsonUrls = {
		ADDRESS: "/module/viewlibs/json/address.json",
		VICTIM: "/module/viewlibs/json/victim_category.json",
		PROFESSION: "/module/viewlibs/json/profession_data.json",
		UPDATECAR: "/module/viewlibs/json/updateCarData.json",
		SCENE: "/module/viewlibs/json/scene_u.json",
		EXHIBIT: "/module/viewlibs/json/relateexhibit.json",
		WEAPON: "/module/viewlibs/json/exhibitweapon.json"
	};
	/**
	 * [urls description]
	 * @type {Object}
	 */
	MediaLoaderModel.prototype.urls = {
		INCIDENTINFO: '/service/pvd/audit_incident_info',
		GETINCIDENTINFO: '/service/pvd/get_incident_info',
		GETVIDEOFILE: "/service/pvd/get_video_file",
		PVDCLUEPCM: "/service/pvd/pvd_cluesinfo_pcm"
	};
	/**
	 * [getEntity 详情页用于翻译二级以上菜单获取联动数据,并添加助手将联动翻译]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @return {[type]}   [description]
	 */
	MediaLoaderModel.prototype.getEntity = function() {
		var self = this,
			address = '',
			victimCategory = '',
			profession = '',
			cartype = '',
			scenetitle = '',
			relateexhibit = '',
			exhibitweapon = '';
		/**
		 * [async 获取地址json]
		 * @type {[type]}
		 */
		ajaxModel.getData(self.jsonUrls.ADDRESS, null, {
			async: false
		}).then(function(data) {
			self.address = data; //地址在结构化信息切到所属视图信息的时候需要再次用到
		});
		/**
		 * 获取受害人类型json
		 */
		if (window.location.href.split("?")[0].indexOf('person') !== -1) { //人员页面需要加载的json
			ajaxModel.getData(self.jsonUrls.VICTIM, null, {
				async: false
			}).then(function(data) {
				victimCategory = data;
			});
			/**
			 * [async 获取职业json]
			 * @type {[type]}
			 */
			ajaxModel.getData(self.jsonUrls.PROFESSION, null, {
				async: false
			}).then(function(data) {
				profession = data;
			});
		} else if (window.location.href.split("?")[0].indexOf('car') !== -1) { //车辆
			ajaxModel.getData(self.jsonUrls.UPDATECAR, null, {
				async: false
			}).then(function(data) {
				cartype = data;
			});
		} else if (window.location.href.split("?")[0].indexOf('scene') !== -1) {
			ajaxModel.getData(self.jsonUrls.SCENE, null, {
				async: false
			}).then(function(data) {
				scenetitle = data;
			});
		} else if (window.location.href.split("?")[0].indexOf('exhibit') !== -1) {
			/**
			 * [async 获取涉案物品类别json]
			 * @type {[type]}
			 */
			ajaxModel.getData(self.jsonUrls.EXHIBIT, null, {
				async: false
			}).then(function(data) {
				relateexhibit = data;
			});
			/**
			 * [async 获取弹药类别json]
			 * @type {[type]}
			 */
			ajaxModel.getData(self.jsonUrls.WEAPON, null, {
				async: false
			}).then(function(data) {
				exhibitweapon = data;
			});
		}
		//此助手只用于详情页的展示e 二级以上菜单
		Handlebars.registerHelper('translate', function(value1, value2, value3, value4, type, options) {
			var data = '';
			var arr = [value1, value2, value3, value4];
			var hash = new Hash();
			var result = '';
			switch (type) {
				case 'address':
					data = self.address;
					break;
				case 'victim':
					data = victimCategory;
					break;
				case 'profession':
					data = profession;
					break;
				case 'cartype':
					data = cartype;
					break;
				case 'scene':
					data = scenetitle;
					break;
				case 'exhibitweapon':
					data = exhibitweapon;
					break;
				case 'relateexhibit':
					data = relateexhibit;
					break;
			}
			for (var i = 0; i < arr.length; i++) {
				if (arr[i] === '' || arr[i] === '暂未填写' || !data[arr[i]]) {
					hash.set('暂未填写', i);
				} else {
					hash.set(data[arr[i]][0]);
				}
			}
			result = hash.getKeys().join('，');
			if (result !== '暂未填写') {
				var index = result.indexOf('暂未填写');
				result = result.substring(0, index - 1);
			}
			return result;
		});
	};
	/**
	 * [loadResource description]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   params [description]
	 * @return {[type]}          [description]
	 */
	MediaLoaderModel.prototype.loadResource = function(params) {
		var self = this;
		if (params.orgid === 'undefined' || params.orgid === undefined) {
			params.orgid = '';
		}
		var ajaxData = {
			fileType: params.origntype,
			id: params.id,
			uuid: params.id,
			orgId: params.orgid,
			cameraChannelId: params.cameraChannelId
		};
		//详情和编辑页面		
		if (this.ajaxRequest) { // 保持单例模式
			this.ajaxRequest.abort();
		}
		this.ajaxRequest = jQuery.ajax({
			url: params.url,
			type: "get",
			data: ajaxData,
			dataType: "JSON"
		});
		var checkXhr = jQuery.ajax({
			url: "/service/pvd/structured_exist/" + params.id,
			data: {
				orignType: params.origntype,
				structureType: params.structureType
			},
			dataType: 'JSON'
		});
		jQuery.when(this.ajaxRequest, checkXhr).then(function(res1, res2) {
			if (res1[0].code === 200 && !res1[0].data.message && res2[0].code === 200) {
				jQuery(".wrapper .loading,.main .loading").remove();
				var structInfo = res1[0].data;
				// 保存一份结构化信息的引用 其它文件用到 
				MediaLoaderModel.structInfo = structInfo[params.origntype];
				structInfo[params.origntype].inClound = res2[0].data.flag;
				// 不是自己创建的 不显示保存按钮
				/*if(parseInt(jQuery("#userEntry").attr("data-userid")) !== structInfo[params.origntype].userId){
					structInfo[params.origntype].inClound = true;
				}*/
				var incidentId = structInfo[params.origntype].incidentId;
				// 判断该资源是否关联案事件
				self.isAssociated = incidentId === null ? false : true;
				self.renderResult(structInfo, params, res2[0].data.flag);
				// 获取关联案事件的状态
				self.getIncidentStatus(incidentId);
			} else if (res1[0].code === 200 && res1[0].data.message) {
				jQuery(".wrapper .loading,.main .loading").remove();
				//去掉我的工作台高亮
				jQuery('#header a.item').removeClass('active');
				jQuery("#content").html("<p class='deltext'>该资源在视图库中已被删除</p>");
			} else {
				notify.warn("获取结构化信息失败！");
				jQuery(".wrapper .loading,.main .loading").remove();
			}
		}, function() {
			notify.error("网络错误，数据获取失败！");
			jQuery(".wrapper .loading,.main .loading").remove();
		});
	};
	/**
	 * [verifyIncident 案事件打回]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   id     [description]
	 * @param  {[type]}   status [description]
	 * @return {[type]}          [description]
	 */
	MediaLoaderModel.prototype.verifyIncident = function(id, status) {
		var self = this;
		var auditInfo = jQuery('.common-dialog.incident .audit-info').val();
		ajaxModel.postData(self.urls.INCIDENTINFO, {
			id: id,
			status: status,
			auditInfo: auditInfo
		}, {
			cache: false
		}).then(function(res) {
			if (res.code == 200) {
				notify.success('操作成功');
				setTimeout(function() {
					window.location.reload();
				}, 2000);
			} else {
				notify.warn('操作异常，请重试');
			}
		}, function() {
			notify.warn('网络异常');
		});
	};
	/**
	 * [deleteVideoInfo description]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @return {[type]}   [description]
	 */
	MediaLoaderModel.prototype.deleteVideoInfo = function(params) {
		var self = this;
		var id = jQuery(".resources .actions").data("id");
		var url = "/service/pvd/delete_" + params.origntype + "_info";
		if (params.origntype == "rest") {
			url = "/service/pvd/rest_d";
		} else if (params.origntype == "moving") {
			url = "/service/pvd/moving_d";
		} else if (params.points) {
			url = "/service/pvd/realtime/structure/" + id + "?_method=delete";
		}
		new ConfirmDialog({
			title: '警告',
			warn: true,
			message: "<div class='dialog-messsage'><h4>您确定要删除该资源吗？</h4>",
			callback: function() {
				ajaxModel.postData(url, {
					id: id, //资源id
					fileType: params.origntype //资源类型，主要针对delete_video_info
				}).then(function(res) {
					if (res && res.code === 200) {
						notify.success("删除成功！", {
							timeout: 500
						});
						var type = self.getTypeByStr(params.origntype);
						if (self.incidentInfo.name) {
							var str = self.incidentInfo.name + '案事件的';
							logDict.insertMedialog('m4', '删除 ' + str + type + '线索表单', "", "o3");
						} else {
							logDict.insertMedialog('m4', '删除 ' + type + '结构化信息表单', "", "o3");
						}
						if (params.pagetype === 'workbench') {
							window.location.href = '/module/viewlibs/workbench/index.html';
						} else if (params.pagetype === 'caselib') {
							window.location.href = '/module/viewlibs/caselib/index.html';
						} else if (params.pagetype === 'doubtlib') {
							if (params.cameraChannelId) { //跳转结构化信息列表
								window.location.href = '/module/viewlibs/doubtlib/index.html?cameraChannelId=' + params.cameraChannelId + '&pageNum=' + params.pageNum + '&timeType=' + params.timeType + '&sortType=' + params.sortType + '&key=' + params.key + '&dataType=' + params.dataType + '&del_option=' + params.del_option;
							} else {
								window.location.href = '/module/viewlibs/doubtlib/index.html';
							}
						} else if (params.pagetype === 'peoplelib') {
							window.location.href = '/module/viewlibs/peoplelib/index.html';
						} else if (params.pagetype === 'carlib') {
							window.location.href = '/module/viewlibs/carlib/index.html';
						} else {
							if (params.incidentname) {
								window.location.href = '/module/viewlibs/caselib/index.html';
							} else {
								window.location.href = '/module/viewlibs/workbench/index.html';
							}
						}
					} else {
						notify.warn("删除资源信息出错,返回错误码:" + res.code);
					}
				});
			}
		});
	};
	/**
	 * [getIncidentStatus 获取关联案事件的状态]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   incidentId [description]
	 * @return {[type]}              [description]
	 */
	MediaLoaderModel.prototype.getIncidentStatus = function(incidentId) {
		var self = this;
		if (incidentId) {
			ajaxModel.getData(self.urls.GETINCIDENTINFO, {
				id: incidentId,
				orgId: self.params.orgid,
				rs: 0
			}).then(function(res) {
				if (res.code === 200) {
					self.incidentInfo = res.data.incident; //将案事件数据保存
					self.breadcrumb(); //面包屑
					var type = self.getTypeByStr(self.params.origntype);
					logDict.insertMedialog('m4', '查看 ' + self.incidentInfo.name + ' 案事件的 ' + type + ' 线索', "", "o4");
					// var incidentStatus = res.data.incident.status;
					var incidentStatus = res.data.incident.state;
					if (incidentStatus === null || incidentStatus === "") {
						incidentStatus = "未提交";
					}
					switch (incidentStatus) {
						case "未提交":
							incidentStatus = 1;
							break;
						case "待审核":
							incidentStatus = 2;
							break;
						case "未通过":
							incidentStatus = 3;
							break;
						case "已通过":
							incidentStatus = 4;
							break;
						case "再审核":
							incidentStatus = 5;
							break;
						default:
							incidentStatus = 1;
					}
					if (incidentStatus === 1 || incidentStatus === 3 || incidentStatus === 4) {
						jQuery("#reject").remove();
					} else {
						jQuery("#reject").attr("data-incident-status", incidentStatus);
					}
					//如果id：auditSection内容为空，则删除该节点
					if (jQuery("#auditSection a").size() === 0) {
						jQuery("#auditSection").prev(".actions").css("height", "30px");
						jQuery("#auditSection").prev(".actions").show();
						jQuery("#auditSection").remove();
					} else {
						if (jQuery("#auditSection").prev(".actions a").size() === 0 && !jQuery("#auditSection").is(":hidden")) {
							jQuery("#auditSection").prev(".actions").hide();
						}
					}
				} else {
					notify.warn("获取关联案事件失败");
				}
			});
		} else {
			self.breadcrumb(); //面包屑
			var type = self.getTypeByStr(self.params.origntype);
			logDict.insertMedialog('m4', '查看 ' + type + ' 结构化信息', "", "o4");
		}
	};
	/**
	 * [getMedia 获取所属视图]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @return {[type]}   [description]
	 */
	MediaLoaderModel.prototype.getMedia = function() {
		//取出源id和type
		var self = this,
			imageId = jQuery(".entity-preview").data("imageid"),
			videoId = jQuery(".entity-preview").data("videoid"),
			fileType,
			id;
		if (videoId && videoId !== "暂未填写") {
			fileType = "1";
			id = videoId;
		} else if (imageId && imageId !== "暂未填写") {
			fileType = "2";
			id = imageId;
		} else if (self.params.points) { //标识疑情库实时结构化
			self.mediaInfo = MediaLoaderModel.structInfo;
		}
		if (id) {
			ajaxModel.getData(self.urls.GETVIDEOFILE, {
				fileType: fileType,
				video_id: id,
				orgId: self.params.orgid
			}, {
				dataType: 'json'
			}).then(function(res) {
				if (res && res.code === 200) {
					self.mediaInfo = res.data;
				} else {
					notify.error("数据获取错误！");
				}
			});
		}
	};
	/*
	 *	案事件保存到云端
	 *	@param{id}	incidentId
	 *	@param{resType} 资源类型[1:person  2:car  3:exhibit  4:scene]
	 *	@param{el}	保存按钮
	 */
	MediaLoaderModel.prototype.saveToClound = function(id, resType, el) {
		var self = this;
		var allUrl = "";
		var url = "/service/pvd/pvd_cluesinfo_pcm";
		if (!self.isAssociated) { //是否关联案事件
			url = "/service/pvd/structured_pcm";
		}

		if (el.attr("data-sign")) { //实时结构化信息保存至云空间
			url = "/service/pvd/realtime/toPcm";
			allUrl = url;
		} else {
			allUrl = url + "/" + id;
		}
		ajaxModel.postData(allUrl, {
			orignType: resType,
			uuid: id
		}, {
			dataType: "JSON",
			beforeSend: function() {
				el.prop("disabled", true);
			},
			error: function() {
				notify.warn('网络异常');
			}
		}).then(function(res) {
			if (res.code === 200) {
				jQuery(".resources .actions .save-to-clound").addClass("disable");
				jQuery(".resources .actions .save-to-clound").html("已保存");
				notify.info("保存到云端成功");
				// 记录日志
				var incidentName = Toolkit.paramOfUrl().incidentname;
				var resTyepName = self.getTypeName(resType);
				if (incidentName && incidentName !== "") {
					logDict.insertMedialog('m4', "保存“" + incidentName + "”案事件的“" + resTyepName + "”线索");
				} else {
					logDict.insertMedialog('m4', "保存“" + resTyepName + "”结构化信息");
				}
			} else if (res.code === 500) {
				notify.warn(res.data.message);
			} else {
				notify.warn("保存到云端失败");
			}
		});
	};
	/**
	 * [commitAudit 疑情信息提交审核]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   params [description]
	 * @param  {[type]}   el     [description]
	 * @return {[type]}          [description]
	 */
	MediaLoaderModel.prototype.commitAudit = function(params, el) {
		var self = this;
		new ConfirmDialog({
			title: '提示',
			message: '<h3>您确认要提交审核吗？</h3>',
			callback: function() {
				ajaxModel.postData("/service/pvd/structure/audit/" + params.id, params, {
					dataType: 'json'
				}).then(function(data) {
					if (data.code === 200) {
						el.remove();
						//console.log("genghai dfk ")
						jQuery(".audit-status span.status").html("[待审核]").addClass("to-verify").removeClass("to-commit");
						logDict.insertMedialog('m4', "提交“" + self.getTypeName(params.type) + "”结构化信息审核");
						notify.success("提交审核成功");
						//刷新页面
						setTimeout(function() {
							window.location.reload();
						}, 2000);
					} else {
						notify.warn("提交审核失败");
					}
				});
			}
		});
	};
	/**
	 * [auditStruct 审核结构化信息@params		@status[1:通过	2:打回]]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   params [description]
	 * @param  {[type]}   status [description]
	 * @return {[type]}          [description]
	 */
	MediaLoaderModel.prototype.auditStruct = function(params, status) {
		var self = this;
		ajaxModel.postData("/service/pvd/structure/audit/" + params.id, params, {
			dataType: 'json'
		}).then(function(data) {
			if (data.code === 200) {
				notify.success("审核成功");
				var opt = status === 1 ? "通过" : "打回";
				logDict.insertMedialog('m4', opt + "“" + self.getTypeName(params.type) + "”结构化信息审核");
				jQuery("#auditSection").remove();
				//刷新页面
				setTimeout(function() {
					if (status === 1) {
						var workbenchActive = '{"viewlibs":"doubtlib"}';
						localStorage.setItem("activeMenu", workbenchActive);
						var useLocation = location.href.split("?")[1],
							origntypeL = location.href.split("?")[0];
						origntypeL = origntypeL.replace("/index", "/3-21");
						useLocation = useLocation.replace("pagetype=workbench", "pagetype=doubtlib");
						window.location.href = origntypeL + "?" + useLocation;
					} else {
						window.location.reload();
					}
				}, 2000);
			} else {
				notify.warn("审核失败");
			}
		});
	};
	/**
	 * [structToThread 案事件结构化信息生成线索]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   id   [description]
	 * @param  {[type]}   type [description]
	 * @return {[type]}        [description]
	 */
	MediaLoaderModel.prototype.structToThread = function(id, type) {
		switch (type) {
			case 'person':
				type = 1;
				break;
			case 'car':
				type = '2';
				break;
			case 'exhibit':
				type = '3';
				break;
			case 'scene':
				type = '4';
				break;
			case 'rest':
				type = '6';
				break;
			case 'moving':
				type = '5';
				break;
		}
		ajaxModel.postData('/service/pvd/clue', {
			id: id,
			type: type
		}, {
			dataType: 'json'
		}).then(function(res) {
			if (res.code === 200) {
				jQuery(".tabview a.save-to-thread").remove();
				notify.success(res.data.message);
			} else {
				notify.warn(res.data.message);
			}
		});
	};
	/**
	 * [createStructs 拼接结构化]
	 * @author zhangxinyu
	 * @date   2015-07-1
	 * @param  {[type]} points [结构化信息点坐标]
	 * @return {[type]}        [json对象]
	 */
	function createStructsData(points) {
		var pointsArr = points.split(",");
		var jsonpoints = {};
		for (var i = 0; i < pointsArr.length; i++) {
			jsonpoints[i].left = pointsArr[i].split(".")[0];
			jsonpoints[i].top = pointsArr[i].split(".")[1];
			jsonpoints[i].right = pointsArr[i].split(".")[2];
			jsonpoints[i].bottom = pointsArr[i].split(".")[3];
		}
		return jsonpoints;
	}
	return MediaLoaderModel;
});