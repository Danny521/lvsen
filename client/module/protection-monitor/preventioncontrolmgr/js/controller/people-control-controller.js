/**
 * 人员布控
 * @author chengyao
 * @date   2014-12-08
 */
define([
	'js/view/people-control-view',
	'js/model/preventcontrol-model',
	'js/preventcontrol-global-var',
	'js/local-import',
	'js/protectcontrol-common-fun',
	'pubsub',
	'jquery.validate',
	'permission'], function(peopleControlView,ajaxService,globalVar, localImport, commonFun,PubSub) {
	var peopleControl = new Class({
		Implements: [Events, Options],
		options: {
			template: null,
			peoplePerPage: 10,
			setPagination: jQuery.noop
		},
		//用户当前操作的人员库信息
		curPersonLibInfo: {
			id: window.curPersonLibId || -1,
			name: window.curPersonLibName || ""
		},
		//记录初始化时人员图片添加按钮的位置,以便进行滚动时调整
		initImportBtnsTop: -1,
		initialize: function(options) {
			var self = this;
			this.setOptions(options);
			peopleControlView.init(this.curPersonLibInfo);
			//订阅事件
			PubSub.subscribe("getPeopleListOfLibrary",function(msg,param){self.getPeopleListOfLibrary(msg,param)});
			PubSub.subscribe("savePersonLibEvent",function(msg,param){self.savePersonLibEvent(msg,param)});
			PubSub.subscribe("saveEditLibEvent",function(msg,param){self.saveEditLibEvent(msg,param)});
			PubSub.subscribe("deletePeopleLibrary",function(msg,param){self.deletePeopleLibrary(msg,param)});
			PubSub.subscribe("loadOrAddPersonInfo",function(msg,param){self.loadOrAddPersonInfo(msg,param)});
			PubSub.subscribe("deletePersonSet",function(msg,param){self.deletePersonSet(msg,param)});
			PubSub.subscribe("loadPersonInfo",function(msg,param){self.loadPersonInfo(msg,param)});
			PubSub.subscribe("getPersonMoveLibrary",function(msg,param){self.getPersonMoveLibrary(msg,param)});
			PubSub.subscribe("deletePeople",function(msg,param){self.deletePeople(msg,param)});
			PubSub.subscribe("saveMoveLibrary",function(msg,param){self.saveMoveLibrary(msg,param)});
			PubSub.subscribe("savePerson",function(msg,param){self.savePerson(msg,param)});
			PubSub.subscribe("funOnImgUpload",function(msg,param){self.funOnImgUpload(param)});
			PubSub.subscribe("deletePersonPic",function(msg,param){self.deletePersonPic(msg,param)});
			PubSub.subscribe("savePersonValid",function(msg,param){self.savePersonValid(msg,param)});
			jQuery("body").on("mousedown", function(e) {
				if (jQuery(e.target).hasClass('people-move-to')) {
					return;
				}
				if (jQuery(".moveto-content")[0]) {
					jQuery(".moveto-content").hide();
				}
			});
		},

	
		//新建点击保存人员布控库后执行的任务
		savePersonLibEvent: function(msg,param){
			var self = this;
			var Table = jQuery(".create-people-lib-table");
			var name = Table.find("input[name='name']").val(),
				threshold = Table.find("input[name='threshold']").val();
			//库名不能为空
			if (jQuery.trim(name) === "") {
				notify.warn("人员布控库的名字不能为空！");
				Table.find("input[name='name']").focus();
				return false;
			}
			//阈值验证
			if (jQuery.trim(threshold) === "") {
				//为空验证
				notify.warn("阈值不能为空！");
				Table.find("input[name='threshold']").focus();
				return false;
			} else if (!(/^[0-9]*$/g.test(threshold))) {
				//做一个数字的验证，如果验证不通过，聚焦到输入框
				notify.warn("比分阈值只能是整数，请重新输入！");
				Table.find("input[name='threshold']").focus();
				return false;
			} else {
				//判断是否超过范围
				if (parseInt(threshold) > 100 || parseInt(threshold) < 1) {
					notify.warn("比分阈值只能是1~100，请重新输入！");
					Table.find("input[name='threshold']").focus();
					return false;
				}
			}
			var param = {
					name: name,
					threshold: threshold
				}
			//保存
			jQuery.when(self.checkPeopleLibraries("", param.name)).done(function() {
				self.savePeopleLibrary(param);
			}).fail(function() {});
		},
		//编辑点击保存人员布控库后执行的任务
		saveEditLibEvent: function(msg,This){
			var self = this;
			var LI = This.closest("li.people-library-item");
			var LibraryForm = This.closest("table");
			// 做一个数字的验证，如果验证不通过，聚焦到输入框
			if (!(/^[0-9]*$/g.test(LibraryForm.find("input[name='threshold']").val()))) {
				notify.error("比分阈值只能是整数，请重新输入！");
				LibraryForm.find("input[name='threshold']").focus();
				return false;
			} else {
				if (parseInt(LibraryForm.find("input[name='threshold']").val()) > 100 || parseInt(LibraryForm.find("input[name='threshold']").val()) < 1) {
					notify.error("比分阈值只能是1~100，请重新输入！");
					LibraryForm.find("input[name='threshold']").focus();
					return false;
				}
			}
			if(!LibraryForm.find("input[name='threshold']").val()){
				notify.warn("比分阈值不能为空，请重新输入！");
				return false;
			}
			if(!LibraryForm.find("input[name='name']").val()){
				notify.warn("库名不能为空，请重新输入！");
				return false;
			}
			var thresholdVal =  LibraryForm.find("input[name='threshold']").val();
			var param = {
				id: LibraryForm.find("input[name='id']").val(),
				name: LibraryForm.find("input[name='name']").val(),
				threshold:thresholdVal,
				oldThreshold: LibraryForm.find("input[type='button'].cancel").data("threshold"),
				_method: "put"
			};
			//添加验证
			jQuery.when(self.checkPeopleLibraries(param.id, param.name)).done(function() {
				self.saveEditLibrary(LI, param);
			}).fail(function() {});

			jQuery(".mid-bottom-panel li.people-library-item.active").attr("data-threshold",thresholdVal);
		},
		/**
		 * 获取布控库列表
		 **/
		getPeopleLibraryList: function(param) {
			var self = this;

			ajaxService.ajaxEvents.getLibList(param, function(res) {
				if (res.code === 200) {
					var template = self.options.template({
						PeopleLibraryList: res.data
					});
					jQuery(".mid-bottom-panel .people-library-list").html(template);
					//默认选中第一个
					var libs = jQuery(".mid-bottom-panel .people-library-list .people-library-item");
					if (libs.length > 0) {
						libs.eq(0).find(".text").trigger("click");
					} else { //如果布控库数量为0则隐藏右侧的新增等操作按钮
						jQuery(".people-library-search-content .opera").hide();
					}
				} else if (res.code === 500) {
					notify.warn(res.data.message + "！错误码：" + res.code);
				} else {
					notify.warn("获取人员布控库列表失败！错误码：" + res.code);
				}
			}, function() {
				notify.error("获取人员布控库列表失败，服务器或网络异常！");
			});
		},
		/**
		 * 验证布控库重名
		 * @param id-分库id，编辑分库时用
		 * @param name-新的分库名字，用来和后端进行对比
		 * @returns {*}-异步deffered对象
		 */
		checkPeopleLibraries: function(id, name) {
			var dtd = $.Deferred();
			var param = {
				id: id,
				name: name
			};
			ajaxService.ajaxEvents.checkPeopleLib(param, function(res) {
				if (res.code === 200) {
					if (res.data.exists === true) {
						notify.warn("该人员库名称已经存在，请重新输入");
						dtd.reject(); //fail
					} else {
						dtd.resolve(); //done
					}
				} else if (res.code === 500) {
					notify.warn(res.data.message);
					dtd.reject();
				} else {
					notify.warn("布控库重名校验异常!");
					dtd.reject();
				}
			}, function() {
				notify.error("布控库重名校验失败,请查检网络!");
				dtd.reject();
			});
			return dtd.promise();
		},
		/**
		 * 布控库编辑保存
		 **/
		saveEditLibrary: function(LI, param) {

			ajaxService.ajaxEvents.savePeopleLib(param, function(res) {
				if (res.code === 200) {
					notify.success("编辑人员布控库成功！");
					logDict.insertMedialog("m9", "编辑" + param.name + "人员库", "f12", "o2");
					var template = globalVar.template({
						PeopleLibraryEditSuccess: param
					});
					LI.html(template);
					permission.reShow();
					LI.data("name", param.name);
					LI.data("threshold", parseInt(param.threshold));
					//修改面包屑
					jQuery(".people-control .breadcrumb .lib").html(param.name + "<span class='breadcrumb-threshold'>（比分阈值：" + param.threshold + "）</span>");
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.code);
				} else {
					notify.error("编辑人员布控库失败！错误码：" + res.code);
				}
			}, function() {
				notify.error("编辑人员布控库失败，服务器或网络异常！");
			});
		},
		/**
		 * 保存人员布控库
		 **/
		savePeopleLibrary: function(param) {
			var self = this;
			var name = param.name;
			ajaxService.ajaxEvents.savePeopleLib(param, function(res) {
				if (res.code === 200) {
					notify.success("新建人员布控库成功！");
					logDict.insertMedialog("m9", "新建" + name + "人员库", "f12", "o1");
					jQuery(".mid-top-panel .people-library-search .create-people-lib-table").removeClass("active");
					jQuery("#createPeopleLibrary").removeClass("open");
					//调用人员分库列表
					var param = {
						libName: "",
						pageNum: "", //1,
						pageSize: "" //PreventionControlMgr.configInfo.peopleLibPageSize
					};
					self.getPeopleLibraryList(param);
					//如果右侧的编辑等操作按钮是隐藏状态，则将其显示
					if (!jQuery(".people-library-search-content .opera").is(":visible")) {
						jQuery(".people-library-search-content .opera").show();
					}
					//设置左侧高度
					peopleControlView.setMidHeight();
				} else if (res.code === 500) {
					notify.warn(res.data.message + "！错误码：" + res.code);
				} else {
					notify.warn("新建人员布控库失败！错误码：" + res.code);
				}
			}, function() {
				notify.warn("新建人员布控库失败，服务器或网络异常！");
			});
		},
		/**
		 * 获取某分库人员信息
		 **/
		getPeopleListOfLibrary: function(msg,param) {
			var self = this;
			ajaxService.ajaxEvents.getSingleLibInfo(param, function(res) {
				if (res.code === 200) {
					if (res.data.count <= param.pageSize) {
						jQuery(".people-library-content .pagination").hide();
					} else {
						//渲染分页
						jQuery(".people-library-content .pagination").show();
						self.setJumpPagination(res.data.count, ".people-library-content .pagination", param.pageSize, function(nextPage) {
							// TODO  分页回调函数
							param.pageNum = nextPage;
							ajaxService.ajaxEvents.getSingleLibInfo(param, function(res) {
								if (res.code === 200 && res.data) {
									var template = globalVar.template({
										PeopleList: res.data,
										isSearch: (param.name !== "" || param.number!=="")
									});
									jQuery(".people-library-search-content .people-library-content .people-library-content-inner").html(template);
									permission.reShow();
								} else {
									notify.warn("服务器或网络异常！");
								}
							});
						});
					}
					var template = globalVar.template({
						PeopleList: res.data,
						isSearch: (param.name !== "" || param.number!=="")
					});
					jQuery(".people-library-search-content .people-library-content .people-library-content-inner").html(template);
					permission.reShow();
					//存储当前用户操作的人员库信息
					var liObj = jQuery(".mid-bottom-panel .people-library-list .people-library-item.active");
					self.curPersonLibInfo.id = peopleControlView.curPersonLibInfo.id = parseInt(liObj.attr("data-id"));
					self.curPersonLibInfo.name = peopleControlView.curPersonLibInfo.name = liObj.attr("data-name");
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.code);
				} else {
					notify.error("获取人员列表失败！错误码：" + res.code);
				}
			}, function() {
				notify.error("获取人员列表失败，服务器或网络异常！");
			});
		},
		//有跳转按钮的分页
		setJumpPagination: function(total, selector, itemsPerPage, callback) {
			jQuery(selector).pagination(total, {
				orhide: false,
				prev_show_always: true,
				next_show_always: true,
				items_per_page: itemsPerPage,
				first_loading: false,
				callback: function(pageIndex, jq) {
					callback(pageIndex + 1);
					//分页时取消全选
					jQuery(".people-library-th td input[type='checkbox']").prop("checked", false);
				}
			});
		},
		/**
		 * 删除某人员布控库
		 **/
		deletePeopleLibrary: function(msg,params) {
			//id, LI, libraryName
			var self = this,
				LI = params.LI;
			var param = {
				id: params.id,
				_method: "delete"
			};
			ajaxService.ajaxEvents.deletePersonLib(param,function(res) {
				if (res.code === 200) {
					notify.success("删除人员布控库成功！");
					logDict.insertMedialog("m9", "删除" + params.libraryName + "人员分库", "f12", "o3");
					//获取同辈库元素
					var siblings = LI.siblings();
					//如果剩下的库数量不为0，则选中第一个库；
					//如果数量为0，则隐藏新增等操作按钮,人员列表清空，面包屑修改为默认值
					if (siblings.size() === 0) {
						jQuery(".people-library-search-content .opera").hide();
						jQuery(".people-library-search-content .people-library-content .people-library-content-inner").html("");

						jQuery(".people-library-content .pagination").hide();
						jQuery(".people-control .breadcrumb span.lib").html("人员布控库");
						//输入默认信息
						jQuery(".mid-bottom-panel .people-library-list").html("<li class='no-result'>暂无人员布控库信息！</li>")
					} else {
						//判断当前是否有选中的,如果有，则直接remove掉当前的
						if (siblings.filter(".active").length !== 0) {
							LI.remove();
						} else {
							//如果删除的是当前的库，则选中一个存在的
							LI.remove();
							var libs = jQuery(".mid-bottom-panel .people-library-list .people-library-item");
							libs.eq(0).find(".text").trigger("click");
						}
					}
				} else if (res.code === 500) {
					notify.warn(res.data.message + "！" );
				} else {
					notify.warn("删除人员布控库异常！" );
				}
			}, function() {
				notify.error('删除人员布控库失败,请查检网络!');
			});
		},
		/**
		 * 删除人员库中的人员
		 * @param id-该人员的id
		 * @param TR-该人员所在行对象
		 */
		deletePeople: function(msg,data) {
			//id, TR
			var self = this,
				name = data.TR.find("td.name").html(),
				libraryName = jQuery(".people-library-list li.people-library-item.active").attr("data-name");
				var param = {
					id: data.id,
					_method: "delete"
				};
			ajaxService.ajaxEvents.deletePeople(param, function(res) {
				if (res.code === 200) {
					notify.success("删除人员成功！");
					logDict.insertMedialog("m9", "删除" + libraryName + "库的" + name + "人员信息", "f12", "o3");
					var papersType = jQuery(".people-library-search-content").find(".select_container span.text").data("value");
					var params = {
						libId: parseInt(jQuery(".people-library-list li.people-library-item.active").attr("data-id")),
						pageNum: 1,
						pageSize: globalVar.configInfo.peopleListPageSize,
						name: "",
						number: "",
						papersType: ""
					}
					self.getPeopleListOfLibrary('',params);
				} else if (res.code === 500) {
					notify.warn(res.data.message + "！" );
				} else {
					notify.error("删除人员失败！");
				}
			}, function() {
				notify.error("删除人员失败，服务器或网络异常！");
			});
		},
		/**
		 * 获取人员转移库
		 **/
		getPersonMoveLibrary: function(msg,params) {
			//personId, DelPerson
			var self = this,
				html = '<div class="moveto-content people-move-to">' +
				'<p class="head people-move-to">移动至</p>' +
				'<ul class="moveto-library people-move-to">' +
				'<li class="loading people-move-to"><span class="people-move-to"></span></li>' +
				'</ul>' +
				'<p class="bottom people-move-to">' +
				'<input type="button" value="取消" class="cancel ui button middle cancel people-move-to"/>' +
				'<input type="button" value="确定" class="confirm ui button middle blue people-move-to"/>' +
				'</p>' +
				'</div>';
			params.DelPerson.html(html);
			var param = {libId: parseInt(self.curPersonLibInfo.id)}
			ajaxService.ajaxEvents.getPersonMoveLib(param, function(res) {
				if (res.code === 200) {
					var str = "";
					for (var i = 0, j = res.data.libraries.length; i < j; i++) {
						str += '<li class="moveto-library-item people-move-to" data-id=' + res.data.libraries[i].id + ' title=' + res.data.libraries[i].libraryName + '>' + res.data.libraries[i].libraryName + '</li>';
					}
					//为空的时候
					if (res.data.libraries.length === 0) {
						str += '<li class="moveto-library-item no-result people-move-to" title="暂无可移动人员布控库。">暂无可移动人员布控库。</li>';
					}
					params.DelPerson.find(".moveto-library").html(str);
				} else if (res.code === 500) {
					notify.warn(res.data.message + "！错误码：" + res.code);
					params.DelPerson.find(".moveto-library").html('<li class="no-result people-move-to">暂无可转移库！</li>');
				} else {
					notify.error("获取待移动的人员布控库列表失败！错误码：" + res.code);
				}
			}, function() {
				notify.error("获取待移动的人员布控库列表失败，服务器或网络异常！");
			});
		},
		/**
		 * 保存转移
		 **/
		saveMoveLibrary: function(msg,data) {
			//personId, LibraryId
			var self = this;
			var param={
				personId:data.personId,
				oldLibId: parseInt(self.curPersonLibInfo.id),
				tagLibId: parseInt(data.LibraryId),
				_method: "put"
			};
			ajaxService.ajaxEvents.savePersonMove(param, function(res) {
				if (res.code === 200) {
					notify.success("转移成功！");
					jQuery(".moveto-content").hide();
					//刷新页面人员列表
					var trObj = jQuery(".people-library-content td.opera span.moveto[data-id='" + data.personId + "']");
					var params = {
						libId: parseInt(jQuery(".people-library-list li.people-library-item.active").attr("data-id")),
						pageNum: 1,
						pageSize: globalVar.configInfo.peopleListPageSize,
						name: "",
						number: "",
						papersType: ""
					}
					self.getPeopleListOfLibrary('',params);
				} else if (res.code === 500) {
					notify.warn(res.data.message + "！错误码：" + res.code);
				} else {
					notify.warn("人员移动失败！错误码：" + res.code);
				}
			}, function() {
				notify.error("人员移动失败，服务器或网络异常！");
			});
		},
		/**
		 * 人员信息表单验证
		 **/
		savePersonValid: function(msg, params) {
			var formSelector = params.formSelector, 
				personId = params.personId, 
				cardType = params.cardType
			//证件类型
			cardType = cardType ? cardType : formSelector.find(".select_container[data-type='craditcardtype'] span.text").data("value");
			cardType = parseInt(cardType);
			//验证规则
			var reg = {
				//身份证
				idcard: false,
				//中国护照
				chinaPassport: false,
				//外国护照
				foreignPassport: false,
				//居民户口簿
				residenceBooklet: false,
				//旅行证
				travelCertificate: false,
				//回乡证
				homeVisitPermit: false,
				//居留证件
				residenceCertificate: false,
				//驻华机构证明
				agenciesInChinaProve: false,
				//使领馆人员身份证明
				consularStaffIdentification: false,
				//军官离退休证
				theOfficerRetired: false,
				//士兵证
				Soldiers: false,
				//军官证
				certificateOfOfficers: false,
				//组织机构代码证书
				organizationCodeCertificate: false,
				markWords: ""
			};
			switch (cardType) {
				case 1: //身份证
					reg.idcard = true;
					reg.markWords = "身份证号格式不正确";
					break;
				case 2: //中国护照
					reg.chinaPassport = true;
					reg.markWords = "证件号格式不正确";
					break;
				case 3: //外国护照
					reg.foreignPassport = true;
					reg.markWords = "证件号格式不正确";
					break;
				case 4: //居民户口簿
					reg.residenceBooklet = true;
					reg.markWords = "证件号格式不正确";
					break;
				case 5: //旅行证
					reg.travelCertificate = true;
					reg.markWords = "证件号格式不正确";
					break;
				case 6: //回乡证
					reg.homeVisitPermit = true;
					reg.markWords = "证件号格式不正确";
					break;
				case 7: //居留证件
					reg.residenceCertificate = true;
					reg.markWords = "证件号格式不正确";
					break;
				case 8: //驻华机构证明
					reg.agenciesInChinaProve = true;
					reg.markWords = "证件号格式不正确";
					break;
				case 9: //使领馆人员身份证明
					reg.consularStaffIdentification = true;
					reg.markWords = "证件号格式不正确";
					break;
				case 10: //军官离退休证
					reg.theOfficerRetired = true;
					reg.markWords = "证件号格式不正确";
					break;
				case 11: //士兵证
					reg.Soldiers = true;
					reg.markWords = "证件号格式不正确";
					break;
				case 12: //军官证
					reg.certificateOfOfficers = true;
					reg.markWords = "证件号格式不正确";
					break;
				case 13: //组织机构代码证书
					reg.organizationCodeCertificate = true;
					reg.markWords = "证件号格式不正确";
					break;
			};
			formSelector.validate({
				rules: {
					name: {
						required: true,
						maxlength: 20
					},
					formerName: {
						maxlength: 20
					},
					cardNo: {
						required: true,
						//身份证
						idcard: reg.idcard,
						//中国护照
						chinaPassport: reg.chinaPassport,
						//外国护照
						foreignPassport: reg.foreignPassport,
						//居民户口簿
						residenceBooklet: reg.residenceBooklet,
						//旅行证
						travelCertificate: reg.travelCertificate,
						//回乡证
						homeVisitPermit: reg.homeVisitPermit,
						//居留证件
						residenceCertificate: reg.residenceCertificate,
						//驻华机构证明
						agenciesInChinaProve: reg.agenciesInChinaProve,
						//使领馆人员身份证明
						consularStaffIdentification: reg.consularStaffIdentification,
						//军官离退休证
						theOfficerRetired: reg.theOfficerRetired,
						//士兵证
						Soldiers: reg.Soldiers,
						//军官证
						certificateOfOfficers: reg.certificateOfOfficers,
						//组织机构代码证书
						organizationCodeCertificate: reg.organizationCodeCertificate,
						remote: {
							url: "/service/deploycontrol/personnel/check",
							type: "get",
							data: {
								papersNum: function() {
									return jQuery("#cardNo").val().trim();
								},
								//证件类型
								papersType: cardType,
								personId: personId
							}
						}
					},
					weightScore: {
						digits: true,
						range: [1, 100]
					}
				},
				success: function(label) {
					label.remove();
				},
				// 对于验证失败的字段都给出相应的提示信息
				messages: {
					name: {
						required: '请输入姓名',
						maxlength: '不得超过20个字符'
					},
					formerName: {
						maxlength: '不得超过20个字符'
					},
					cardNo: {
						required: "请输入证件号码",
						//身份证
						idcard: reg.markWords,
						//中国护照
						chinaPassport: reg.markWords,
						//外国护照
						foreignPassport: reg.markWords,
						//居民户口簿
						residenceBooklet: reg.markWords,
						//旅行证
						travelCertificate: reg.markWords,
						//回乡证
						homeVisitPermit: reg.markWords,
						//居留证件
						residenceCertificate: reg.markWords,
						//驻华机构证明
						agenciesInChinaProve: reg.markWords,
						//使领馆人员身份证明
						consularStaffIdentification: reg.markWords,
						//军官离退休证
						theOfficerRetired: reg.markWords,
						//士兵证
						Soldiers: reg.markWords,
						//军官证
						certificateOfOfficers: reg.markWords,
						//组织机构代码证书
						organizationCodeCertificate: reg.markWords,
						remote: "已存在该证件号"
					},
					weightScore: {
						required: '请输入比分阈值',
						digits: "请输入整数",
						range: '介于1到100之间'
					}
				}
			});
			$('#cardNo').focus().blur();
		},
		/**
		 * 保存人员（新建&编辑）
		 **/
		savePerson: function(msg,formSelector) {
			var self = this,
				param = {},
				url = "",
				data = {},
				msg = "";
			var libraryName = jQuery(".breadcrumb .lib").html();
			if (formSelector.valid()) {
				//收集图片列表
				var imgs = [],
					imgDomList = jQuery("#save-edit-person .small-pic-ul .small-pic-item img");
				for (var i = 0; i < 5; i++) {
					if (jQuery(imgDomList[i]).attr("src") !== "") {
						imgs.push(jQuery(imgDomList[i]).attr("src"));
					}
				}
				var imgStr = imgs.join(";");
				if (imgs.length === 0) {
					notify.warn("请选择人员图片！");
					return;
				}
				var name = jQuery("#name").val();
				//收集人员信息并保存
				param.libraryId = parseInt(jQuery(".create-edit-person .content input[name='libraryName']").attr("data-id"));
				param.name = jQuery("#name").val();
				param.formerName = jQuery("#formerName").val();
				param.gender = jQuery(".create-edit-person .content .select_container[data-type='sex']").find(".text").attr("data-value");
				param.nationality = parseInt(jQuery(".create-edit-person .content .select_container[data-type='nation']").find(".text").attr("data-value"));
				param.nation = parseInt(jQuery(".create-edit-person .content .select_container[data-type='group']").find(".text").attr("data-value"));
				param.registerAddress = jQuery("#address").val();
				param.papersType = parseInt(jQuery(".create-edit-person .content .select_container[data-type='craditcardtype']").find(".text").attr("data-value"));
				param.papersNumber = jQuery("#cardNo").val();
				param.birthday = jQuery("#birthday").val();
				param.threshold = jQuery("#weightScore").val();
				param.remark = jQuery(".create-edit-person .content textarea[name='comment']").val();
				param.featureImage = imgStr;
				//判断是否有人员id，区分编辑和新建
				var personId = jQuery(".create-edit-person .check-person-table-container").attr("data-id");
				if (personId && personId !== "") {
					personId = parseInt(personId);
					data = {
						id: personId,
						params: JSON.stringify(param),
						_method: "put"
					};
					msg = "编辑";
				} else {
					data = {
						params: JSON.stringify(param)
					};
					msg = "新增";
				}
				jQuery("#savePersonInfo").attr("disabled", "disabled");
				//调用后台接口，写入数据库
				ajaxService.ajaxEvents.savePerson(data, function(res) {
					if (res.code === 200) {
						if (msg === "新增") {
							logDict.insertMedialog("m9", "新增" + name + "人员信息到" + libraryName + "人员库", "f12", "o1");
						} else {
							logDict.insertMedialog("m9", "编辑" + libraryName + "布控库的" + name + "人员信息", "f12", "o2");
						}
						notify.success(msg + "人员成功，正在入库！");
						//退出当前页面页面并刷新列表-模拟当前库的点击事件重新请求
						jQuery(".mid-bottom-panel .people-library-list .people-library-item[data-id='" + self.curPersonLibInfo.id + "'] .text").trigger("click");
					} else if (res.code === 500) {
						notify.warn(res.data.message + "！错误码：" + res.code);
						jQuery("#savePersonInfo").removeAttr("disabled");
					} else {
						notify.warn("人员信息保存失败！错误码：" + res.code);
						jQuery("#savePersonInfo").removeAttr("disabled");
					}
				}, function() {
					notify.error("人员信息保存失败，服务器或网络异常！");
					jQuery("#savePersonInfo").attr("disabled", "");
				});
			};
		},
		/**
		 * 查看人员信息
		 */
		loadPersonInfo: function(msg,params) {
			//personId, libName
			var self = this;

			//根据人员id获取人员的详细信息
			var param = {id: params.personId};
			ajaxService.ajaxEvents.getPersonInfo(param, function(res) {
				if (res.code === 200) {
					//加载并渲染模板
					res.data = jQuery.extend({
						libName: params.libName
					}, res.data);
					var template = globalVar.template({
						CheckPersopn: true,
						data: res.data
					});
					jQuery(".people-library-search-content .check-person.see-details").empty().html(template);
					permission.reShow();
					//渲染面包屑
					var threshold = jQuery(".mid-bottom-panel li.people-library-item.active").attr("data-threshold"),
						thresholdText = threshold ? "（比分阈值：" + threshold + "）" : "";
					var breadTemp = globalVar.template({
						peopleBreadCrumb: {
							libName: params.libName,
							thresholdText:thresholdText,
							type: "人员信息查看"
						}
					});
					jQuery(".people-control .breadcrumb").html(breadTemp);
					//选中第一张可用图片
					jQuery(".check-person-table.see .small-pic-item img[src!='']").eq(0).trigger("click");

					//设置内容区高度
					peopleControlView.setMidHeight();
					logDict.insertMedialog("m9", "查看" + params.libName + "布控库的" + res.data.personnel.name + "人员信息", "f12", "o4");
					//清除上传插件
					localImport.UploadFile.destroy();
				} else if (res.code === 500) {
					notify.warn(res.data.message + "！错误码：" + res.code);
				} else {
					notify.warn("人员信息获取失败！错误码：" + res.code);
				}
			}, function() {
				notify.error("人员信息获取失败，服务器或网络异常！");
			});
		},
		/**
		 * 新建&编辑人员
		 */
		loadOrAddPersonInfo: function(msg,personId) {
			var self = this,
				data = {},
				opType = "人员添加";
			data.personnel = {};
			//判断是否是编辑人员信息
			if (personId && personId !== "") {
				//保存编辑的人员id
				data.personId = personId;
				//根据人员id获取人员的详细信息
				ajaxService.ajaxEvents.getPersonInfo({id:personId},function(res) {
					if (res.code === 200) {
						//人员编辑
						jQuery.extend(data, res.data);
						opType = "人员编辑";
						self.changePanelOnEditOrAdd(opType, data);
						//渲染面包屑
						var threshold = jQuery(".mid-bottom-panel li.people-library-item.active").attr("data-threshold"),
							thresholdText = threshold ? "（比分阈值：" + threshold + "）" : "";
						var breadTemp = globalVar.template({
							peopleBreadCrumb: {
								libName: jQuery(".mid-bottom-panel li.people-library-item.active .text").text(),
								thresholdText: thresholdText,
								type: "编辑人员"
							}
						});
						jQuery(".people-control .breadcrumb").html(breadTemp);
					} else if (res.code === 500) {
						notify.warn(res.data.message + "！错误码：" + res.code);
					} else {
						notify.warn("人员信息获取失败！错误码：" + res.code);
					}
				},function() {
					notify.error("人员信息获取失败，服务器或网络异常！");
				});
			} else {
				data.personId = "";
				//添加人员
				self.changePanelOnEditOrAdd(opType, data);
				//渲染面包屑
				var threshold = jQuery(".mid-bottom-panel li.people-library-item.active").attr("data-threshold"),
					thresholdText = threshold ? "（比分阈值：" + threshold + "）" : "";
				var breadTemp = globalVar.template({
					peopleBreadCrumb: {
						libName: jQuery(".mid-bottom-panel li.people-library-item.active .text").text(),
						thresholdText: thresholdText,
						type: "新增人员"
					}
				});
				jQuery(".people-control .breadcrumb").html(breadTemp);
			}
		},
		/**
		 * 人员添加&编辑功能触发后，渲染模板
		 */
		changePanelOnEditOrAdd: function(opType, data) {
			var self = this;
			//对人员信息中在图片进行扩展
			data.images = self.extendPersonImg(data.images);
			//加载并渲染模板
			var template = globalVar.template({
				createEditPerson: true,
				libraryId: self.curPersonLibInfo.id,
				libraryName: jQuery(".mid-bottom-panel li.people-library-item.active .text").html(),
				operationType: opType,
				data: data
			});
			jQuery(".people-library-search-content .create-edit-person").empty().html(template);
			//选中第一张可用图片
			jQuery("#save-edit-person .small-pic-item img[src!='']").eq(0).trigger("click");
			//绑定上传按钮的初始化事件
			localImport.UploadFile.destroy();
			localImport.UploadFile.createUpload({
				selector: ".check-person table tr td.picture .small-pic-ul .small-pic-item img.edit[src='']",
				type: "image",
				url: "/service/deploycontrol/personnel/uploadImg"
			}, self.funOnImgUpload);
			//设置内容区高度
			peopleControlView.setMidHeight();
			self.savePersonValid("", {
				formSelector: jQuery('#save-edit-person'), 
				personId: data.personId
			});
			//列表的滚动事件，隐藏浮动层
			jQuery(".people-library-search-content").scroll(function() {
				//隐藏下拉列表
				if (jQuery(".preventioncontrolmgr.pubdiv").is(":visible")) {
					jQuery(".preventioncontrolmgr.pubdiv").hide();
				}
				//滚动时添加对上传按钮的重新定位
				if (jQuery(".create-edit-person.check-person").is(":visible")) {
					if (self.initImportBtnsTop === -1) {
						//保存初始化时的上传按钮位置
						self.initImportBtnsTop = parseInt(jQuery(".plupload.flash").css("top"));
					}
					var scrollTop = jQuery(this).scrollTop(),
						setTop = self.initImportBtnsTop - scrollTop;
					//滚动时添加对上传按钮的重新定位
					jQuery(".plupload.flash").css({
						"top": (setTop < 0) ? 0 : setTop
					});
				}
			});
		},
		/**
		 * 编辑&添加时再现人员图片列表
		 * @param images-人员图片列表
		 */
		extendPersonImg: function(images) {
			var imgCount = 0;
			if (images) {
				imgCount = images.length;
			} else {
				images = [];
			}
			for (var i = 0; i < (5 - imgCount); i++) {
				//扩展图片列表
				images.push({
					imagePath: ""
				});
			}
			return images;
		},
		/**
		 * 图片上传成功后的回调函数
		 * @param data
		 */
		funOnImgUpload: function(data) {
			//设置当前人员图像到对应的框框中
			var resizeImg = function(maxWidth,maxHeight,src,$obj){
				var img = new Image();
				img.onload = function(){
					var hRatio;
					var wRatio;
					var Ratio = 1;

					var w = img.width;
					var h = img.height;
					var parW  =$obj.parent('.big-pic').width(),parH = $obj.parent('.big-pic').height();
					console.log(parW);
					console.log(parH);
					wRatio = maxWidth / w;
					hRatio = maxHeight / h;
					if (maxWidth == 0 && maxHeight == 0) {
						Ratio = 1;
					} else if (maxWidth == 0) { //
						if (hRatio < 1) Ratio = hRatio;
					} else if (maxHeight == 0) {
						if (wRatio < 1) Ratio = wRatio;
					} else if (wRatio < 1 || hRatio < 1) {
						Ratio = (wRatio <= hRatio ? wRatio : hRatio);
					}
					if (Ratio < 1) {
						w = w * Ratio;
						h = h * Ratio;
					}
					//将当前图片发送到大图
					$obj.attr("src", data.picture).css({
						left:(parW-w)/2+"px",
						top:(parH-h)/2+"px"
					});
					$obj.width(w);
					$obj.height(h);
					$obj.parent('.big-pic').css({
						'background':"none"
					});
				}
				img.src =src;
			};
			if (data.domId) {
				if (data.domId !== "BulkImportBtn") {
					if (data.picture && data.picture !== "") {
						//设置图片
						//resizeImg(90,85,data.picture,jQuery("#" + data.domId));

						jQuery("#" + data.domId).attr("src", data.picture);
						//取消当前框的上传绑定
						localImport.UploadFile.uploadArr[data.domId].destroy();
						//显示图片工具
						jQuery("#" + data.domId).addClass("active").siblings(".img-cover, .img-opera").addClass("active").show();
						jQuery("#" + data.domId).siblings(".img-opera").find(".protect-hide").removeClass("protect-hide"); //如果是编辑人员，删除之前上传的图片然后再上传，则显示“上传状态”
						//清除其他图片的选中样式
						jQuery("#" + data.domId).closest(".small-pic-item").siblings().find("img, .img-cover").removeClass("active");
						//将当前图片发送到大图
						//jQuery(".picture .big-pic img").attr("src", data.picture);
						resizeImg(0,339,data.picture,jQuery(".picture .big-pic img"));
					} else {
						notify.warn("添加图片失败，请重试！");
					}
				} else {
					//批量导入回调过程
					// notify.info("批量导入成功！");

					// 渲染结果页面
					var template = globalVar.template({
						ImportData: data.data
					});
					// 调用弹窗展示结果
					commonFun.bulkImportConfirmDialog(template);
					var libraryName = jQuery(".mid-bottom-panel .people-library-list .active").attr("data-name");
					logDict.insertMedialog("m9", "批量导入人员信息到" + libraryName + "布控库", "f12");

					//刷新当前人员库
					jQuery(".people-library-item.active .text").trigger("click");
				}
			} else {
				notify.warn("上传失败，请重试！");
			}
		},
		/**
		 *  批量删除人员集合
		 */
		deletePersonSet: function(msg,params) {
			//ids, libraryName
			var self = this;
			//批量删除人员信息
			var param = {
				ids: params.ids,
				_method: "delete"
			};
			ajaxService.ajaxEvents.batchRemovePerson(param, {
				beforeSend: function() {
					//开启处理进度条
					commonFun.showDealProgress("正在进行批量删除处理", false);
				}
			}, function(res) {
				if (res.code === 200) {
					notify.success("批量删除成功！");
					logDict.insertMedialog("m9", "批量删除" + params.libraryName + "布控库的人员信息", "f12", "o3");
					//结合查询条件更新人员列表
					var param = {
						libId: parseInt(self.curPersonLibInfo.id),
						name: jQuery(".top-search-panel").find("input[name='name']").val(),
						number: jQuery(".top-search-panel").find("input[name='IDcard']").val(),
						papersType: jQuery(".top-search-panel").find(".select_container span.text").data("value"),
						pageNum: 1,
						pageSize: globalVar.configInfo.peopleListPageSize
					};
					self.getPeopleListOfLibrary('',param);
					//如果是全选，则取消全选
					jQuery(".people-library-th td input[type='checkbox']").prop("checked", false);

				} else if (res.code === 500) {
					notify.error(res.data.message + "！" );
				} else {
					notify.error("批量删除人员信息失败！");
				}
				//关闭处理进度条
				commonFun.hideDealProgress();
			}, function() {
				notify.error("批量删除人员信息失败，服务器或网络异常！");
				//关闭处理进度条
				commonFun.hideDealProgress();
			});
		},
		
		/**
		 * 清除已选图片
		 */
		deletePersonPic: function(msg,obj) {

			var self = this,
				imgPath = jQuery.trim(obj.closest(".small-pic-item").find("img").attr("src"));
			//请求后台接口，删除服务器图片
			var data = {
				filePath: imgPath,
				_method: "delete"
			};
			ajaxService.ajaxEvents.removeSelectPic(data, function(res) {
				if (res.code === 200) {
					//删除掉当前图片
					obj.closest(".small-pic-item").find("img").attr("src", "");
					var domId = obj.closest(".small-pic-item").find("img").attr("id");
					//删除掉cover
					jQuery("#" + domId).removeClass("active").siblings(".img-cover, .img-opera").removeClass("active protect-show").hide();
					jQuery("#" + domId).siblings(".img-opera .status").removeClass("protect-hide");
					//清除大图
					jQuery(".picture .big-pic img").attr("src","").css({
						width:0,
						height:0
					});
					jQuery(".picture .big-pic").css({"background": "url(images/img-bg.png) center no-repeat","backgroundColor":"#eee"});
					//重新绑定上传事件
					localImport.UploadFile.destroy();
					localImport.UploadFile.createUpload({
						selector: ".check-person table tr td.picture .small-pic-ul .small-pic-item img.edit[src='']",
						type: "image",
						url: "/service/deploycontrol/personnel/uploadImg"
					}, self.funOnImgUpload);

				} else if (res.code === 500) {
					notify.warn(res.data.message + "！错误码：" + res.code);
				} else {
					notify.warn("人员图片删除失败！错误码：" + res.code);
				}
			}, function() {
				notify.error("人员图片删除失败，服务器或网络异常！");
			});
		}
	});
	return {
		peopleControl: peopleControl
	}
});