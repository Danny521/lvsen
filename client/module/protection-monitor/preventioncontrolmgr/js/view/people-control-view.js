/**
 * 人员布控view模块
 */
define([
	'pubsub',
	'js/preventcontrol-global-var',
	'js/local-import',
	'js/model/preventcontrol-model',
	'js/protectcontrol-common-fun',
	'permission'],function(PubSub,globalVar,localImport,ajaxService,commonFun){
	var View = function(){};
	View.prototype = {
		//当前的人员库信息
		curPersonLibInfo :{},

		init:function(curPersonLibInfo){
			var self = this;
			self.curPersonLibInfo = Object.create(curPersonLibInfo);
			self.bindEvents();
			self.registerHelper();
			updateThirdNav();
			var score = jQuery("#userEntry").data("loginname");
			if(score==="admin"){
				jQuery(".tab-panel .tabs").find(".tasKsetNum").show();
			}
		},
		//事件绑定
		bindEvents: function() {
			var self = this;
			//新建人员布控库
			jQuery("#createPeopleLibrary").click(function() {
				//显示新建区域
				var LibCreateForm = jQuery(".mid-top-panel .people-library-search .create-people-lib-table");
				LibCreateForm.addClass("active");
				//初始化
				LibCreateForm.find("input[name='name']").val(""),
					LibCreateForm.find("input[name='threshold']").val("");
				jQuery(this).addClass("open");
				//设置左侧高度
				self.setMidHeight();
			});
			//保存人员布控库
			jQuery("#savePeopleLibrary").click(function() {
				PubSub.publish("savePersonLibEvent");
			});
			//取消人员布控库
			jQuery("#cancelPeopleLibrary").click(function() {
				jQuery(".mid-top-panel .people-library-search .create-people-lib-table").removeClass("active");
				jQuery("#createPeopleLibrary").removeClass("open");
				//设置左侧高度
				self.setMidHeight();
			});
			//点击某个布控库
			jQuery(document).on("click", ".mid-bottom-panel .people-library-list .people-library-item .text", function(e) {
				var liObj = jQuery(this).parent();
				//搜索条件全部转换成默认的
				jQuery(".select_container[data-type='searchcraditcardtype'] span.text").attr("data-value", "").html("全部");
				jQuery(".people-library-search-content .top-search-panel input[name='name']").val("");
				jQuery(".people-library-search-content .top-search-panel input[name='IDcard']").val("");
				PubSub.publish("getPeopleListOfLibrary",{
					libId: parseInt(liObj.attr("data-id")),
					pageNum: 1,
					pageSize: globalVar.configInfo.peopleListPageSize,
					papersType: "",
					name: "",
					number: ""
				});
				var LibraryContent = jQuery(".people-library-content");
				//存储当前用户操作的人员库信息
				self.curPersonLibInfo.id = parseInt(liObj.attr("data-id"));
				self.curPersonLibInfo.name = liObj.attr("data-name");
				//显示列表
				LibraryContent.show().siblings().hide();
				LibraryContent.prev().show();
				LibraryContent.prev().prev().show();
				//渲染面包屑
				var threshold = liObj.attr("data-threshold"),
					thresholdText = threshold ? "（比分阈值：" + threshold + "）" : "";
				var breadTemp = globalVar.template({
					peopleBreadCrumb: {
						libName: jQuery(this).text(),
						thresholdText: thresholdText,
						peopleList: true
					}
				});
				jQuery(".people-control .breadcrumb").html(breadTemp);
				//去掉表头复选框的选中状态
				jQuery(".people-library-th td input[type = 'checkbox']").prop("checked", false);
				//绑定批量导入控件
				self.initBulkImport();
				//如果当前布控库是非选中状态,则需要更新选中样式
				if(!liObj.hasClass("active")) {
					//设置样式
					liObj.addClass("active").siblings().removeClass("active");
					//绑定批量导入按钮的初始化事件
				}
			});
			//点击某个布控库的面包屑
			jQuery(document).on("click", ".people-control .breadcrumb .lib", function() {
				jQuery(".mid-bottom-panel .people-library-list .people-library-item.active .text").click();
			});
			//编辑布控库
			jQuery(document).on("click", ".mid-bottom-panel .people-library-list .people-library-item .opera i.edit", function(e) {
				e.stopPropagation();
				//显示编辑区域
				var LI = jQuery(this).closest("li.people-library-item");
				var data = LI.data();
				var template = globalVar.template({
					PeopleLibraryEdit: data
				});
				LI.html(template);
			});
			//布控库编辑保存
			jQuery(document).on("click", ".mid-bottom-panel .people-library-list .people-library-item .people-library-edit table input[type='button'].save", function(e) {
				e.stopPropagation();
				PubSub.publish("saveEditLibEvent",jQuery(this));
			});
			//布控库编辑时回车键禁用
			jQuery(document).on("keydown",function(eve){
				if ((eve.target.type==="text")&&eve.keyCode === 13) {
					return false;
				}
			});
			//布控库编辑取消
			jQuery(document).on("click", ".mid-bottom-panel .people-library-list .people-library-item .people-library-edit table input[type='button'].cancel", function(e) {
				e.stopPropagation();
				var LI = jQuery(this).closest("li.people-library-item");
				var data = jQuery(this).data();
				var template = globalVar.template({
					PeopleLibraryEditSuccess: data
				});
				LI.html(template);
				permission.reShow();
			});
			//删除布控库
			jQuery(document).on("click", ".mid-bottom-panel .people-library-list .people-library-item .opera i.delete", function(e) {
				e.stopPropagation();
				//收集信息
				var id = jQuery(this).data("id"),
					liObj = jQuery(this).closest("li.people-library-item");
				libraryName = liObj.data('name');
				//用户确认
				commonFun.confirmDialog("删除后该人员布控库记录将不再显示，确定要删除吗？", function() {
					//调用删除方法
					PubSub.publish("deletePeopleLibrary",{
						id:id,
						LI:liObj,
						libraryName:libraryName
					});
				});
			});
			//新建人员
			jQuery(document).on("click", "#CreatePersonBtn", function() {
				jQuery(".create-edit-person").show().siblings().hide();
				//添加人员
				PubSub.publish("loadOrAddPersonInfo");
				//self.loadOrAddPersonInfo();
			});
			//批量导入
			jQuery("#BulkImportBtn").click(function() {

			});
			//批量删除
			jQuery("#BulkDeleteBtn").click(function() {
				//收集被勾选的人员id串
				var selectPersonIds = [];
				var libraryName = jQuery(".mid-bottom-panel .people-library-list .active").attr("data-name");
				jQuery(".people-library-content td input[type='checkbox']").each(function() {
					if (jQuery(this).prop("checked")) {
						selectPersonIds.push(parseInt(jQuery(this).closest("tr").attr("data-id")));
					}
				});
				if (selectPersonIds.length === 0) {
					notify.warn("请先选择要进行删除的人员！");
					return;
				}
				//用户确认
				commonFun.confirmDialog("删除后人员记录将不再显示，确定要删除吗？", function() {
					//批量删除该人员集合
					var param = {
						ids:selectPersonIds.join(","),
						libraryName:libraryName
					};
					PubSub.publish("deletePersonSet",param);
					//self.deletePersonSet(selectPersonIds.join(","), libraryName);
				});
			});
			//人员查看
			jQuery(document).on("click", ".people-library-content td.opera span.check", function() {
				jQuery(".check-person.see-details").empty().show().siblings().hide();
				//加载人员信息
				var param = {
					personId : jQuery(this).attr("data-id"),
					libName : jQuery(".mid-bottom-panel li.people-library-item.active .text").html()
				};
				PubSub.publish("loadPersonInfo",param);
			});
			//人员编辑
			jQuery(document).on("click", ".people-library-content td.opera span.edit", function(e) {
				e.stopPropagation();
				//编辑人员信息
				jQuery(".create-edit-person").empty().show().siblings().hide();
				var personId = jQuery(this).attr("data-id");
				PubSub.publish("loadOrAddPersonInfo",personId);

			});
			//在人员查看页面的编辑按钮
			jQuery(document).on("click", ".check-person .title-panel .edit", function() {
				var id = jQuery(this).attr("data-id");
				jQuery(".people-library-content td.opera span.edit[data-id=" + id + "]").click();
			});
			//人员转移
			jQuery(document).on("click", ".people-library-content td.opera span.moveto", function(e) {
				e.stopPropagation();
				//由于移动面板是动态绑定到移动按钮span元素中的，故点击移动面板的任何地方都会触发查询，这里对触发事件的对象进行判断。
				if (jQuery(e.target).hasClass("moveto")) {
					//移除其他位置的转移库
					jQuery(".moveto-content").remove();
					//显示浮动框
					var param = {
						personId : jQuery(this).attr("data-id"), 
						DelPerson :jQuery(this)
					};
					PubSub.publish("getPersonMoveLibrary",param);
				}
			});
			//人员删除
			jQuery(document).on("click", ".people-library-content td.opera span.delete", function(e) {
				e.stopPropagation();
				var id = jQuery(this).attr("data-id"),
					TR = jQuery(this).closest("tr");
				//用户确认
				commonFun.confirmDialog("删除后该人员记录将不再显示，确定要删除吗？", function() {
					//调用删除人员方法
					var param = {
						id:id,
						TR:TR
					};
					PubSub.publish("deletePeople",param);
					//self.deletePeople(id, TR);
				});
			});
			//取消库转移
			jQuery(document).on("click", ".moveto .moveto-content p.bottom .cancel", function(e) {
				e.stopPropagation();
				jQuery(this).closest("div").hide();
			});
			//确定转移库
			jQuery(document).on("click", ".moveto .moveto-content p.bottom .confirm", function(e) {
				e.stopPropagation();
				var This = jQuery(this),
					LibraryId = jQuery(".moveto .moveto-content .moveto-library .moveto-library-item.active").data("id");
				if (LibraryId) {
					var param = {
						personId:This.closest("span.moveto").data("id"),
						LibraryId:LibraryId
					};
					PubSub.publish("saveMoveLibrary",param);
				} else {
					notify.warn("请选择您要转移的库！");
				}
			});
			//点击转移库
			jQuery(document).on("click", ".moveto .moveto-content .moveto-library li.moveto-library-item", function(e) {
				e.stopPropagation();
				//改变待转移库的样式
				jQuery(this).addClass("active").siblings().removeClass("active");
			});
			//保存人员信息
			jQuery(document).on("click", "#savePersonInfo", function(e) {
				e.stopPropagation();
				//保存人员信息
				PubSub.publish("savePerson",jQuery('#save-edit-person'));
			});
			//取消人员保存页面
			jQuery(document).on("click", "#cancelSavePersonInfo", function(e) {
				e.stopPropagation();
				//用户确认
				commonFun.confirmDialog("您可能还有未保存的信息，确定要退出编辑页面吗？", function() {
					//显示人员方法
					var LibraryContent = jQuery(".people-library-content");
					//显示列表
					LibraryContent.show().siblings().hide();
					LibraryContent.prev().show();
					LibraryContent.prev().prev().show();
				});
				//清除上传插件，添加对批量导入的绑定
				self.initBulkImport();
			});
			//人员编辑页面，点击日历图标时触发日历插件
			jQuery(document).on("click",".create-edit-person .check-person-table .birthday-container .calendar",function(){
				jQuery(this).siblings("input").focus();
			});
			//人员查看、编辑页面的返回按钮点击事件
			jQuery(document).on("click", ".check-person .title-panel .back", function(e) {
				e.stopPropagation();
				if (jQuery(this).closest(".check-person").hasClass("create-edit-person")) {
					//用户确认
					commonFun.confirmDialog("您可能还有未保存的信息，确定要退出编辑页面吗？", function() {
						//显示人员方法
						var LibraryContent = jQuery(".people-library-content");
						//显示列表
						LibraryContent.show().siblings().hide();
						LibraryContent.prev().show();
						LibraryContent.prev().prev().show();
						//渲染面包屑
						var threshold = jQuery(".mid-bottom-panel li.people-library-item.active").attr("data-threshold"),
							thresholdText = threshold ? "（比分阈值：" + threshold + "）" : "";
						var breadTemp = globalVar.template({
							peopleBreadCrumb: {
								libName: jQuery(".mid-bottom-panel li.people-library-item.active .text").html(),
								thresholdText: thresholdText,
								peopleList: true
							}
						});
						jQuery(".people-control .breadcrumb").html(breadTemp);
						//清除上传插件，添加对批量导入的绑定
						self.initBulkImport();
					});
				} else {
					//显示人员方法
					var LibraryContent = jQuery(".people-library-content");
					//显示列表
					LibraryContent.show().siblings().hide();
					LibraryContent.prev().show();
					LibraryContent.prev().prev().show();
					//渲染面包屑
					var threshold = jQuery(".mid-bottom-panel li.people-library-item.active").attr("data-threshold"),
						thresholdText = threshold ? "（比分阈值：" + threshold + "）" : "";
					var breadTemp = globalVar.template({
						peopleBreadCrumb: {
							libName: jQuery(".mid-bottom-panel li.people-library-item.active .text").text(),
							thresholdText: thresholdText,
							peopleList: true
						}
					});
					jQuery(".people-control .breadcrumb").html(breadTemp);
					//清除上传插件，添加对批量导入的绑定
					self.initBulkImport();
				}
			});
			//人员库页面的条件查询点击事件
			jQuery(document).on("click", "#PersonSearchBtn", function(e) {
				e.stopPropagation();
				//如果人员库数目为0，则提示先建库
				if (jQuery(".mid-bottom-panel .people-library-item").length === 0) {
					notify.warn("暂无人员库信息，请先新建人员库");
					return;
				}
				//根据查询条件筛选人员信息并显示
				var param = {
					libId: parseInt(self.curPersonLibInfo.id),
					name: jQuery(this).siblings().find("input[name='name']").val(),
					number: jQuery(this).siblings().find("input[name='IDcard']").val(),
					papersType: jQuery(".people-library-search-content").find(".top-search-panel .select_container .text").attr("data-value"),
					pageNum: 1,
					pageSize: globalVar.configInfo.peopleListPageSize
				}
				PubSub.publish("getPeopleListOfLibrary",param);
			});
			//人员库表头上的全选checkbox点击事件
			jQuery(document).on("click", ".people-library-th td input[type='checkbox']", function() {
				if (jQuery(this).prop("checked")) {
					//全选当前页
					jQuery(".people-library-content td input[type='checkbox']").prop("checked", true);
				} else {
					//取消全选
					jQuery(".people-library-content td input[type='checkbox']").prop("checked", false);
				}
			});
			//人员信息左侧的checkbox点击事件
			jQuery(document).on("click", ".people-library-content td input[type='checkbox']", function() {
				if (jQuery(this).prop("checked")) {
					//判断是否全选
					if (jQuery(".people-library-content td input[type='checkbox']").not(":checked").length === 0) {
						//全选
						jQuery(".people-library-th td input[type='checkbox']").prop("checked", true);
					}
				} else {
					//清除全选
					jQuery(".people-library-th td input[type='checkbox']").prop("checked", false);
				}
			});
			//人员添加时，相片选择的点击事件
			jQuery(document).on("click", ".check-person table tr td.picture .small-pic-ul .small-pic-item img.edit", function(event) {
				//无图片时，图片被绑定到了上传插件；有图片时，图片上有遮罩层，所有点击操作绑定到父节点上（下面的绑定），故此处只做冒泡屏蔽
				if (jQuery(this).attr("src") === "") {
					event.stopPropagation();
				}
			});
			//人员添加时，相片框的父节点点击拦截事件
			jQuery(document).on("click", ".check-person table tr td.picture .small-pic-ul .small-pic-item", function(event) {
				event.stopPropagation();
				//选中图片，并发送至大图
				var imgPath = jQuery(this).children("img").addClass("active").attr("src");
				var resizeImg = function(maxWidth,maxHeight,src,$obj){
					var img = new Image();
					img.onload = function(){
						var hRatio;
						var wRatio;
						var Ratio = 1;

						var w = img.width;
						var h = img.height;
						var parW  =$obj.parent('.big-pic').width(),parH = $obj.parent('.big-pic').height();
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
						$obj.css({
							left:(parW-w)/2+"px",
							top:(parH-h)/2+"px",
							width:w+"px",
							height:h+"px"
						}).attr("src",src);
						$obj.parent('.big-pic').css({
							'background':"none"
						});
					}
					img.src =src;
				};
				jQuery(this).children(".img-cover").addClass("active");
				//清除其他图片的选中样式
				jQuery(this).siblings().find("img, .img-cover").removeClass("active");
				//发送至大图
				//jQuery(".picture .big-pic img").attr("src", imgPath);
				resizeImg(0,339,imgPath,jQuery(".picture .big-pic img"));
			});
			//人员添加时，取消已选择的照片
			jQuery(document).on("click", "#save-edit-person table tr td.picture .small-pic-ul .small-pic-item .img-opera .icon_delete", function(event) {
				event.stopPropagation();
				//读取后台接口，删除当前图片
				//self.deletePersonPic(this);
				PubSub.publish("deletePersonPic",jQuery(this));
			});
			//关联到8大库
			jQuery(document).on("click", ".people-control .people-library-search-content .people-library-content .people-library-content-inner .detail", function() {
				var num = jQuery(this).html();
				eightLib.search("person", num);
			});
			// 点击查看批量导入详情
			jQuery(document).on("click", ".import .check", function() {
				jQuery("#suceessTable").show();
			});
			//搜索人员库监听事件
			jQuery('.people-library-search input[name="q_personlib"]').watch({
				wait: 200,
				captureLength: 0,
				//监听的输入长度
				callback: function(key) {
					//触发人员库查询
					self.searchPersonLibs(key);
				}
			});
			jQuery(".people-library-search .search.action").off("click").on("click", function(){
				var value = jQuery('.people-library-search input[name="q_personlib"]').val();
				//触发人员库查询
				self.searchPersonLibs(value);
			});

			jQuery(window).resize(function () {
				//自适应人员布控库左侧中间高度
				self.setMidHeight();
			});
		},
		/**
		 * 模糊搜索人员库
		 * @param searchValue - 待查询的值
		 */
		searchPersonLibs: function(searchValue) {
			var param = {
				libName: searchValue,
				pageNum: "", //1,
				pageSize: "" //PreventionControlMgr.configInfo.peopleLibPageSize
			};
			ajaxService.ajaxEvents.getLibList(param, function(res) {
				if (res.code === 200) {
					var template = globalVar.template({
						PeopleLibraryList: res.data
					});
					jQuery(".mid-bottom-panel .people-library-list").html(template);
					permission.reShow();
				}else if (res.code === 500) {
					notify.warn(res.data.message);
				}else{
					notify.warn("查询人员布控库异常!");
				}
			},function(){
				notify.error("查询人员布控库失败,请检查网络状况!");
			});
		},
		//注册助手
		registerHelper: function() {
			//index +1
			Handlebars.registerHelper("addOne", function(num) {
				return num + 1;
			});
			//人员分库的人员列表渲染助手
			Handlebars.registerHelper('PersonListFilter', function(value, type) {
				if (type === "sex") {
					return value ? ((value === "M") ? "男" : ((value === "F") ? "女" : "未知")) : "未知";
				} else if (type === "status") {
					return (value === -1) ? "失败" : (value === 1) ? "成功" : "正在入库";
				} else if (type === "status-class") {
					return (value === -1) ? "lib-fail" : (value === 1) ? "lib-succ" : "lib-ing";
				}
			});
			//人员信息编辑时的信息过滤
			Handlebars.registerHelper('EditPersonDetailsFilter', function(value, type, dataType) {
				if (dataType === "sex") {
					if (type === "text") {
						return value ? ((value === "M") ? "男" : ((value === "F") ? "女" : "未知")) : "男";
					} else {
						return value ? value : "M";
					}
				} else if (dataType === "nation") {
					if (type === "text") {
						return value ? value : "中华人民共和国";
					} else {
						return value ? value : 16;
					}
				} else if (dataType === "group") {
					if (type === "text") {
						return value ? value : "汉族";
					} else {
						return value ? value : 1;
					}
				} else if (dataType === "craditcardtype") {
					if (type === "text") {
						return value ? value : "居民身份证";
					} else {
						return value ? value : "1";
					}
				} else if (dataType === "birthday") {
					return Toolkit.mills2str(value);
				}
			});
			//人员信息编辑时的信息过滤
			Handlebars.registerHelper('PersonDetailsFilter', function(value, type, dataType) {
				if (dataType === "sex") {
					return value ? ((value === "M") ? "男" : ((value === "F") ? "女" : "未知")) : "未知";
				}
			});
			//人员信息编辑时对遮罩层和工具的处理
			Handlebars.registerHelper('CheckImg', function(value, type) {
				if (value && jQuery.trim(value) !== "") {
					if (type === "cover") {
						return "protect-show";
					} else if (type === "opera") {
						return "protect-show";
					} else if (type === "status") {
						return "protect-hide";
					}
				}
			});
			//是否对接8大库
			Handlebars.registerHelper("isDetail", function(value, num) {
				if (value && jQuery.trim(value) === "居民身份证") {
					if (eightLib.enable) {
						return '<span class="detail" title="关联信息库查询">' + num + '</span>';
					} else {
						return num;
					}
				}
				return num;
			});
			// 奇偶行
			Handlebars.registerHelper("even", function(value) {
				if (value % 2 === 0) {
					return "even";
				} else {
					return "odd";
				}
			});
		},
		/**
		 * 清除上传插件，添加对批量导入的绑定（人员添加&编辑时的返回、取消、保存；布控库点击时用）
		 */
		initBulkImport: function() {
			var self = this,
				curPersonLibId = self.curPersonLibInfo.id;
				//debugger;

			localImport.UploadFile.destroy();
			localImport.UploadFile.createUpload({
				selector: "#BulkImportBtn",
				type: "zip",
				url: "/service/deploycontrol/personnel/upload/" + parseInt(curPersonLibId)
			}, function(data){
				PubSub.publishSync("funOnImgUpload", data);
			});
		},
		//设置中间高度
		setMidHeight: function() {
			jQuery(".tab-content").find("div[data-view='people-control'] .mid-bottom-panel").height(jQuery(window).height() - 188);
			var midObj = jQuery(".tab-content").find("div[data-view='people-control'] .mid-bottom-panel");
			var height = jQuery(window).height() - 184;
			if (jQuery(".create-people-lib-table").is(":visible")) {
				height = height - jQuery(".create-people-lib-table").height();
			}
			midObj.height(height);
		}
	};
	return new View();
});