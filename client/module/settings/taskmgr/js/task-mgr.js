/*global selectCameraTree:true ,FloatDialog:true */
// jQuery(function() {
define(["domReady", "base.self", 'handlebars'], function(domReady) {


	var configCamera = new new Class({

		Implements: [Options, Events],

		curDepartment: null,

		templateUrl: "/module/settings/taskmgr/inc/task-mgr-template.html",

		template: "",

		active: "tvwall",

		steps: [],

		errorMessage: "网络或服务器异常,请联系管理人员！",

		itemsPerPage: 10, // 分页 每页条数

		/**
		 * [initialize 初始化 加载整个类的时候就开始运行]
		 * @author Wang Xiaojun
		 * @date   2014-10-28
		 * @registerHelper 加载模板助手
		 * @Changetab 切换tab的操作
		 * @begin 需要在初始化就运行的方法
		 */
		initialize: function() {
			// this.registerHelper();
			// this.Changetab();
			this.begin();
		},
		/**
		 * [begin 需要在初始化就运行的方法]
		 * @author Wang Xiaojun
		 * @date   2014-10-28
		 * 这个方法主要有清楚缓存的函数，防止相同的get请求不去从服务器取数据，而是直接从本地读数据，造成数据的遗漏。
		 * 绑定添加按钮的操作。
		 */
		begin: function() {
			var self = this;

			// 全局事件 [2014.10.11  拿掉提示 方便问题的定位]
			// jQuery(document).ajaxError(function(event, request) {
			// 	notify.warn(self.errorMessage);
			// });
			// 清楚IE缓存
			jQuery.ajaxSetup({
				cache: false
			});

			/**
			 * 由于系统分组的权限问题，最终决定是暂时将系统分组隐藏,下面是显示电视墙的部分，如果后期要将
			 * 系统分组启用可以到注释这块的代码注释。
			 */
			jQuery('.tab-content .tab-tvwall').show();

			jQuery('div#majorTv').show();

			jQuery('.tab-content .cameraTree').hide();
			jQuery("div.main").hide();
			//横向滚动条
			jQuery("#lypan").tinyscrollbar({
				axis: 'x',
				sizethumb: 2
			});

			/**************************************************************/


			jQuery("#lypan .scrollbar .thumb").width("30px");

			jQuery.get(self.templateUrl, function(tem) {
				if (tem) {
					self.template = Handlebars.compile(tem);
					// self.loadGroupName();
				} else {
					notify.warn("网络或服务器异常！");
				}
			});
			// jQuery("#aside .icons-add").bind("click",function(){
			// 	// var len = jQuery(".cameraTree .groupList ul li").length;
			// 	// if(len>50){
			// 	// notify.warn("最多可以创建50个分组,请删除没用分组后再创建！")
			// 	// }else{
			// 	// self.createGroup();
			// 	// }
			// 	self.createGroup();
			// });
		}


		// 添加handlebar助手
		/**
		 * [registerHelper 添加模板助手]
		 * @author Wang Xiaojun
		 * @date   2014-10-28
		 */
		// registerHelper:function () {
		// 	/**
		// 	 * [添加一个奇偶行变色的助手]
		// 	 * @author Wang Xiaojun
		// 	 * @date   2014-10-28
		// 	 * @param    value [模板中给传过来的行数]
		// 	 */
		// 	Handlebars.registerHelper("even", function(value) {
		// 		if (value % 2 === 0) {
		// 			return "class=even";
		// 		}
		// 	});
		// 	Handlebars.registerHelper("list", function(value) {
		// 		return value + 1;
		// 	});
		// },


		/**
		 * [setPagination 重写分页的方法]
		 * @author Wang Xiaojun
		 * @date   2014-10-28
		 * @param   total        [数据的总条数]
		 * @param   selector     [选择器]
		 * @param   itemsPerPage [每页显示的条数]
		 * @param   callback     [一个回调函数]
		 */
		// setPagination: function(total, selector, itemsPerPage, callback) {
		// 	jQuery(selector).pagination(total, {
		// 		items_per_page: itemsPerPage,
		// 		num_display_entries: 4,
		// 		first_loading: false,
		// 		callback: function(pageIndex, jq) {
		// 			callback(pageIndex + 1);
		// 		}
		// 	});
		// },

		/**
		 * [Changetab 左侧tab切换]
		 * @author Wang Xiaojun
		 * @date   2014-10-28
		 */
		// Changetab: function() {
		// 	var self1 = this;
		// 	jQuery(".tab-panel  .tabs li").bind("click", function() {
		// 		var self = jQuery(this);
		// 		var active ="";

		// 		self.addClass("active").siblings().removeClass("active");

		// 		var panel = self.closest(".tab-panel");

		// 		panel.children(".tab-header").children("div[data-hview=" + self.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
		// 		var tem = jQuery("#content>div.main[data-view=" + self.attr("data-tab") + "]").addClass("active").siblings(".main").removeClass("active");
		// 		// 设备管理左侧tab切换
		// 		if (self.attr("data-tab") === "cameraMan") {

		// 			active = "cameraMan";

		// 			jQuery('.tab-content .cameraTree').show();

		// 			jQuery('.tab-content .tab-tvwall').hide();

		// 			jQuery('#majorTv').hide();

		// 			self1.loadGroupName();
		// 		} else if (self.attr("data-tab") === "tvwall") {
		// 			active = "tvwall";

		// 			jQuery('.tab-content .tab-tvwall').show();

		// 			jQuery('div#majorTv').show();

		// 			jQuery('.tab-content .cameraTree').hide();
		// 			jQuery("div.main").hide();
		// 			//横向滚动条
		// 			jQuery("#lypan").tinyscrollbar({
		// 				axis: 'x',
		// 				sizethumb: 2
		// 			});
		// 			jQuery("#lypan .scrollbar .thumb").width("30px");

		// 		}
		// 	});
		// },

		/**
		 * [createGroup 新增分组]
		 * @author Wang Xiaojun
		 * @date   2014-10-28
		 * 这个方法是点击按钮切换页面时候就new一个资源树，如果树存在就不需要再去创建，在输入名字的时候验证是否重名。
		 */
		// createGroup: function (){
		// 	var self = this;
		// 	var groupTree =null;
		// 	jQuery("#createGroup").show().html(self.template({
		// 		creatGroup: {}
		// 	})).siblings(".main").hide();
		// 	if(!groupTree){
		// 		groupTree = new selectCameraTree({
		// 			node: "#group1",
		// 			scrollbarNode: "#group",
		// 			selectable: true
		// 		});
		// 	}
		// 	// 验证是否重名
		// 	jQuery("#createGroup #name").bind("keyup blur",function(){
		// 		jQuery("#createGroup input#name").closest("div").children("label.error3").remove();
		// 		var name = jQuery("#createGroup #name").val().trim();
		// 		// 判断组名大于十个字符提示错误
		// 		if(name.length<=10){
		// 			jQuery("#createGroup input#name").closest("div").children("label.error4").remove();
		// 		}else{
		// 			jQuery("#createGroup input#name").closest("div").children("label.error4").remove();
		// 			jQuery("#createGroup input#name").after("<label class='error error4'>分组名称不能超过10个字符</label>");

		// 		}
		// 		jQuery.getJSON("/service/config/all_sys_group",function(tem){
		// 			if(tem.code === 200 && tem.data.groups){
		// 				for (var i = 0; i < tem.data.groups.length; i++) {
		// 					if (tem.data.groups[i].groupName === name ) {
		// 						jQuery("#createGroup input#name").closest("div").children("label.error2").remove();
		// 						jQuery("#createGroup input#name").after("<label class='error error2'>该分组名已经存在，请重新输入！</label>");
		// 						jQuery("#createGroup #save").attr("disabled", "true");
		// 						return;
		// 					} else {
		// 						jQuery("#createGroup input#name").closest("div").children("label.error2").remove();
		// 						jQuery("#createGroup #save").removeAttr("disabled");
		// 					}
		// 				}
		// 			}
		// 		});
		// 	});

		// 	// 点击确定按钮提交数据
		// 	jQuery("#createGroup #save").bind("click",function(){
		// 		var name = jQuery("#createGroup #name").val();
		// 		var len = jQuery("#createGroup #group1 li.leaf i.checkbox.selected").length;
		// 		var orglen = jQuery("#createGroup #group1 li.tree ").children("i.checkbox.selected").length;
		// 		var orglength = 0;
		// 		var orgs = [];
		// 		var camerasId = "";
		// 		var orgsId="";

		// 		// 过滤组织id
		// 		for(var i = 0;i<orglen;i++){
		// 			if(!jQuery("#createGroup #group1 li.tree ").children("i.checkbox.selected:eq("+i+")").nextAll().is('ul')){
		// 				orgs.push(jQuery("#createGroup #group1 li.tree ").children("i.checkbox.selected:eq("+i+")").closest("li").attr("data-id"));
		// 				orglength = orglength+1;
		// 			}
		// 		}
		// 		// 拼接orgsid 
		// 		for(var j = 0 ;j<orglength;j++){
		// 			if(j !== orglength-1){
		// 			orgsId +=orgs[j]+"-";
		// 			}else{
		// 			orgsId +=orgs[j];
		// 			}
		// 		}
		// 		// 拼接camerasId
		// 		for(var k=0;k<len;k++){
		// 			if(k !== len-1){
		// 			camerasId +=jQuery("#createGroup #group1 li.leaf i.checkbox.selected:eq("+k+")").closest("li").attr("data-id")+"-";
		// 			}else{
		// 			camerasId +=jQuery("#createGroup #group1 li.leaf i.checkbox.selected:eq("+k+")").closest("li").attr("data-id");

		// 			}
		// 		}
		// 		// 判断组名为空时提示错误
		// 		if(name === ""){
		// 			jQuery("#createGroup input#name").closest("div").children("label.error3").remove();
		// 			jQuery("#createGroup input#name").after("<label class='error error3'>请输入分组名称</label>");
		// 			return false;
		// 		}

		// 		if(name.length>10){
		// 			jQuery("#createGroup input#name").closest("div").children("label.error4").remove();
		// 			jQuery("#createGroup input#name").after("<label class='error error4'>分组名称不能超过10个字符</label>");
		// 			return false;
		// 		}

		//               // 验证 bug 565
		//               if(!camerasId && !orgsId){
		//                   notify.warn("请勾选摄像机或者组织(须包含摄像机)后继续！");
		//                   return false;
		//               }
		//               /**
		//                * [centerPanel 由于数据可能太多，保存会等一些时间，这是一个遮罩层，中间有提示，当保存成功后，遮罩层会消失]
		//                */
		// 		var centerPanel = new FloatDialog({"html":"正在保存数据，请稍候..."}).show();
		// 		jQuery.ajax({
		// 			url:"/service/config/add_sys_group",
		// 			type: "post",
		// 			beforeSend:function(){
		// 				jQuery("#createGroup #save").attr("disabled","true");
		// 			},
		// 			data: {
		// 				"name":name,
		// 				"camerasId":camerasId,
		// 				"orgsId":orgsId
		// 			},
		// 			dataType: "json",
		// 			success: function(res) {
		// 				if(res.code === 200){
		//                           if(res.data.status === 0){
		//                               notify.warn("分组创建失败，此分组下未包含摄像机！");
		//                               return false;
		//                           }
		// 					logDict.insertMedialog("m3", "创建" + name + "系统分组", "f8");
		// 					notify.info("分组创建成功！");
		// 					self.loadGroupName();
		// 				}else{
		// 					notify.warn("分组创建失败，请查看网络或联系管理员！");
		// 				}
		// 			},
		// 			complete:function(){
		// 				centerPanel.hide();
		// 				jQuery("#createGroup #save").removeAttr("disabled");
		// 			}
		// 		});

		// 	});
		// },


		/**
		 * [loadGroupList 加载特定分组的列表，里面要判断是否要加载分页函数的判断，如果大于两页的话就加载]
		 * @author Wang Xiaojun
		 * @date   2014-10-28
		 * @param   id  [想要加载该分组列表的id]
		 */
		// loadGroupList: function(id) {
		// 	var self = this;
		// 	jQuery("#detailsGroup").empty().show().siblings(".main").hide();
		// 	var url = "/service/config/page_sys_group_cameras";
		// 	var data = {
		// 		id: id,
		// 		current_page: 1,
		// 		page_size: self.itemsPerPage
		// 	};
		// 	jQuery.ajax({
		// 		url: url,
		// 		type: "post",
		// 		dataType: "json",
		// 		data: data,
		// 		success: function(tem) {
		// 			if (tem.code === 200 && tem.data.groups) {
		// 				var html = "";
		// 				// 判断是否渲染分页
		// 				if (tem.data.total === 0 || tem.data.total === 1) {
		// 					html = self.template({
		// 						"groupCameraList": {
		// 							"bread": tem.data.groups
		// 						}
		// 					});
		// 					jQuery("#detailsGroup").html(html);
		// 				} else {
		// 					html = self.template({
		// 						"groupCameraList": {
		// 							"bread": tem.data.groups
		// 						},
		// 						"pagebar": true
		// 					});
		// 					jQuery("#detailsGroup").html(html);
		// 					jQuery("#detailsGroup .content-panel #groupCameraTable").html(self.template({
		// 						groupCameraTable: {
		// 							groupCamera: tem.data.groups.cameras
		// 						}
		// 					}));
		// 				}

		// 				// TODO绑定相关事件
		// 				self.bingDetails();
		// 				jQuery("#content").resize();
		// 				if (tem.data.total === 0) {
		// 					notify.info("此分组下没有相关的摄像机");
		// 					// 绑定相关事件
		// 					return false;
		// 				} else if (tem.data.total === 1) {
		// 					jQuery("#detailsGroup .content-panel #groupCameraTable").html(self.template({
		// 						groupCameraTable: {
		// 							groupCamera: tem.data.groups.cameras
		// 						}
		// 					}));
		// 				} else {
		// 					/**
		// 					 * [渲染分页]
		// 					 * @author Wang Xiaojun
		// 					 * @date   2014-10-28
		// 					 * @param  nextPage [点击下一页的页码]
		// 					 */
		// 					self.setPagination(tem.data.count, "#detailsGroup .pagination", self.itemsPerPage, function(nextPage) {
		// 						// TODO  分页回调函数
		// 						jQuery.ajax({
		// 							url: "/service/config/page_sys_group_cameras",
		// 							type: "post",
		// 							data: {
		// 								id:id,
		// 								current_page: nextPage,
		// 								page_size: self.itemsPerPage
		// 							},
		// 							dataType: 'json',
		// 							success: function(res) {
		// 								if (res.code === 200 && res.data.groups) {
		// 									jQuery("#detailsGroup .content-panel #groupCameraTable").html(self.template({
		// 										groupCameraTable: {
		// 											groupCamera: res.data.groups.cameras
		// 										}
		// 									}));
		// 								} else {
		// 									notify.warn("服务器或网络异常！");
		// 								}
		// 							}
		// 						});
		// 					});
		// 				}
		// 			} else {
		// 				notify.info("获取数据失败！");
		// 			}
		// 		}
		// 	});
		// },

		/**
		 * [editGroup 编辑分组,这个里面有一个选择摄像机的树，
		 * 就是在展开的时候会自动勾选传过来的摄像机id,包括分组名和长度的验证]
		 * @author Wang Xiaojun
		 * @date   2014-10-28
		 * @param cameraIds [这个分组的所有摄像机的一个list]
		 */
		// editGroup:function(cameraIds){
		// 	var self = this;
		// 	var camerasTree = null;
		// 	if(!camerasTree){
		// 		camerasTree = new selectCameraTree({
		// 		node:"#editgroup1",
		// 		scrollbarNode:"#editgroup", 
		// 		selectable:true,
		// 		mode:"edit",
		// 		defaultCameras:cameraIds
		// 		});
		// 	}

		// 	// 重名的验证和字符长度的验证
		// 	var beginName = jQuery("#editGroup input#name").val();
		// 	jQuery("#editGroup #name").bind("keyup blur",function(){
		// 		jQuery("#editGroup input#name").closest("div").children("label.error3").remove();
		// 		var name = jQuery("#editGroup #name").val().trim();
		// 		// 判断组名大于十个字符提示错误
		// 		if(name.length<=10){
		// 			jQuery("#editGroup input#name").closest("div").children("label.error4").remove();
		// 		}else{
		// 			jQuery("#editGroup input#name").closest("div").children("label.error4").remove();
		// 			jQuery("#editGroup input#name").after("<label class='error error4'>分组名称不能超过10个字符</label>");

		// 		}
		// 		jQuery.getJSON("/service/config/all_sys_group",function(tem){
		// 			if(tem.code === 200 && tem.data.groups){
		// 				for (var i = 0; i < tem.data.groups.length; i++) {
		// 					if (tem.data.groups[i].groupName === name && beginName !== name) {
		// 						jQuery("#editGroup input#name").closest("div").children("label.error2").remove();
		// 						jQuery("#editGroup input#name").after("<label class='error error2'>该分组名已经存在，请重新输入！</label>");
		// 						jQuery("#editGroup #save").attr("disabled", "true");
		// 						return;
		// 					} else {
		// 						jQuery("#editGroup input#name").closest("div").children("label.error2").remove();
		// 						jQuery("#editGroup #save").removeAttr("disabled");
		// 					}
		// 				}
		// 			}
		// 		});
		// 	});
		// 	// 点击确定按钮提交数据
		// 	jQuery("#editGroup #save").bind("click",function(){
		// 		var sysCameraList ={sysCameraList:camerasTree.getOutPutData()};
		// 		var id = jQuery("#editGroup #name").attr("data-id");
		// 		var name = jQuery("#editGroup #name").val();

		// 		// 判断组名为空时提示错误
		// 		if(name === ""){
		// 			jQuery("#editGroup input#name").closest("div").children("label.error3").remove();
		// 			jQuery("#editGroup input#name").after("<label class='error error3'>请输入分组名称</label>");
		// 			return false;
		// 		}


		//               // bug 1939
		//               var list = sysCameraList.sysCameraList,
		//                   len  = list.length,
		//                   obj  = null,
		//                   sel  = [],
		//                   i    = 0;

		//               for(;i<len;i++){
		//                   obj = list[i];
		//                   if(obj && obj.isResource && (obj.isResource-0) === 0){
		//                       if(obj.id && $("#editgroup1 li.tree[data-id=" + obj.id + "]").find("li>.no-data").length>0){
		//                           list.splice(i,1);
		//                       }
		//                   }
		//               }

		//               // 数据为空的情况（应该只有一种情况就是默认进来为空）
		//               // if(list.length === 0){
		//               //     // notify.warn("摄像机或者组织(须包含摄像机)不可以为空！");
		//               //     return false;
		//               // }

		//               // sel = $("#editgroup1 li>i.checkbox.selected");

		//               // // 勾选为空的情况
		//               // if(sel.length === 0){
		//               //     notify.warn("摄像机或者组织(须包含摄像机)不可以为空！");
		//               //     return false;
		//               // }

		//               // // 勾选不为空，但已经展开无摄像机
		//               // if(sel.length > 0 && sel.siblings("ul").find("li>.no-data").length === sel.length){
		//               //     notify.warn("摄像机或者组织(须包含摄像机)不可以为空！");
		//               //     return false;
		//               // }
		//               // bug 1939


		// 		if(name.length>10){
		// 			return false;
		// 		}

		// 		var centerPanel = new FloatDialog({"html":"正在保存数据，请稍候..."}).show();
		// 		jQuery.ajax({
		// 			url:"/service/config/edit_sys_group",
		// 			type: "post",
		// 			data: {
		// 				"id": id,
		// 				"name":name,
		// 				"sysCameraList":JSON.stringify(sysCameraList)
		// 			},
		// 			dataType: "json",
		// 			beforeSend:function(){
		// 				/**
		// 				 * 保存按钮设为不可能状态。避免多次提交
		// 				 */
		// 				jQuery("#editGroup #save").attr("disabled","disabled");
		// 			},
		// 			success: function(res) {
		// 				if(res.code === 200){
		// 					logDict.insertMedialog("m3", "编辑" + name + "系统分组", "f8");
		// 					notify.info("分组编辑成功！");
		// 					self.loadGroupName();
		// 				}else{
		// 					notify.info("分组编辑失败，请查看网络或联系管理员！");
		// 				}
		// 			},
		// 			complete:function(){
		// 				centerPanel.hide();
		// 				//请求完成后将保存按钮设为可用。
		// 				jQuery("#editGroup #save").removeAttr("disabled");
		// 			}
		// 		});

		// 	});
		// },

		/**
		 * [loadGroupName 加载所有的分组名称]
		 * @author Wang Xiaojun
		 * @date   2014-10-28
		 */
		// loadGroupName:function(){
		// 	var self = this;
		// 	jQuery.getJSON("/service/config/all_sys_group",function(tem){
		// 		var html = "";
		// 		if(tem.code === 200 && tem.data.groups){
		// 			if(tem.data.groups.length === 0){
		// 				var html2 = "<ul><li><span>没有数据</span></li><ul>";
		// 				jQuery(".tab-content .cameraTree").show();
		// 				jQuery(".tab-content .cameraTree .groupList").html(html2);
		// 				jQuery("#noData").empty().show().siblings(".main").hide();
		// 				var html1 = self.template({
		// 					"notGroup": {}
		// 				});
		// 				jQuery("#noData").html(html1);
		// 			} else {
		// 				html = self.template({
		// 					"group": {
		// 						"groupList": tem.data.groups
		// 					}
		// 				});
		// 				jQuery(".tab-content .cameraTree").show();
		// 				jQuery(".tab-content .cameraTree .groupList").html(html);
		// 				jQuery(".tab-content .cameraTree .groupList ul li").eq(0).addClass("active");
		// 				// 获取选择的id,以便接下来获取详情
		// 				var id = jQuery(".tab-content .cameraTree .groupList ul li:eq(0)").attr("data-id");
		// 				self.loadGroupList(id);
		// 				self.loadDifferntGroup();
		// 			}

		// 		}else{
		// 			notify.warn("获取数据失败！");
		// 		}
		// 	});
		// },

		/**
		 * [loadDifferntGroup 点击获取不同分组获取详情，可以从点击的li上获取这个分组的id，然后在调用]
		 * @author Wang Xiaojun
		 * @date   2014-10-28
		 */
		// loadDifferntGroup:function(){
		// 	var self = this;
		// 	jQuery(".cameraTree .groupList ul li").bind("click",function(){
		// 		jQuery(this).addClass("active").siblings("li").removeClass("active");
		// 		var id = jQuery(this).attr("data-id");
		// 		// 根据已知的id获取分组的详情
		// 		self.loadGroupList(id);
		// 	});
		// },

		/**
		 * [bingDetails 绑定详情页的一些操作，比如说新增，编辑，删除]
		 * @author Wang Xiaojun
		 * @date   2014-10-28
		 */
		// bingDetails:function(){
		// 	var self = this;
		// 	// 删除操作
		// 	jQuery("#detailsGroup #delete").bind("click",function(){
		// 		var id = jQuery("#detailsGroup .breadcrumb .active").attr("data-id");
		// 		new ConfirmDialog({
		// 			title: '警告',
		// 			warn: true,
		// 			message: '<div class="dialog-messsage"><h4>您确定要删除该分组和分组下的摄像机吗？</h4>',
		// 			callback: function() {
		// 				jQuery.ajax({
		// 					url:"/service/config/delete_sys_group",
		// 					type: "post",
		// 					data: {
		// 						"id": id
		// 					},
		// 					dataType: "json",
		// 					success: function(res) {
		// 						if (res.code === 200) {
		// 							logDict.insertMedialog("m3", "删除" + jQuery("#detailsGroup .breadcrumb .active").text() + "系统分组", "f8");
		// 							notify.success("该分组删除成功！");
		// 							self.loadGroupName();
		// 						} else {
		// 							notify.warn("该分组删除失败，服务器或网络异常！");
		// 						}
		// 					}
		// 				});
		// 			}
		// 		});
		// 	});

		// 	// 编辑操作
		// 	jQuery("#detailsGroup #edit").bind("click",function(){
		// 		var id = jQuery("#detailsGroup .breadcrumb .active").attr("data-id");
		// 		var cameraIds = [];
		// 		jQuery.getJSON("/service/config/one_sys_group?id="+id,function(tem) {
		// 		if (tem.code === 200 && tem.data.groups) {
		// 			jQuery("#editGroup").empty().show().html(self.template({
		// 				editGroup: {
		// 					group: tem.data.groups
		// 				}
		// 			})).siblings(".main").hide();
		// 			for(var i = 0;i<tem.data.groups.cameras.length;i++){
		// 				cameraIds.push(tem.data.groups.cameras[i].id);
		// 			}
		// 			self.editGroup(cameraIds);
		// 			} else {
		// 				notify.info("获取数据失败！");
		// 			}
		// 		});
		// 	});
		// }

	});

	// 滚动条自适应
	// var ScrollListener = new new Class({

	// 	timer: null,
	// 	/**
	// 	 * [initialize 初始化，获取滚动条的容器，绑定bingEvent,start]
	// 	 * @author Wang Xiaojun
	// 	 * @date   2014-10-28
	// 	 */
	// 	initialize: function() {
	// 		this.treePanel = jQuery('.cameraTree');
	// 		this.camerasPanel = jQuery('#cameraTreeScrollBar');
	// 		this.scrollbar = this.camerasPanel.children('.scrollbar');
	// 		this.viewport = this.camerasPanel.children('.viewport');

	// 		// 初始化容器
	// 		this.camerasPanel.tinyscrollbar({
	// 			thumbSize: 62
	// 		});

	// 		this.bindEvents();

	// 		this.start();
	// 	},
	// 	/**
	// 	 * [start 定时更新滚动条的高度]
	// 	 * @author Wang Xiaojun
	// 	 * @date   2014-10-28
	// 	 */
	// 	start: function() {
	// 		this.stop();

	// 		var self = this;
	// 		this.timer = setInterval(function() {
	// 			self.viewport.css('height', jQuery(document).height() - (36 + 50 + 10 + 36));
	// 			self.camerasPanel.tinyscrollbar_update('relative');
	// 			self.treePanel.toggleClass('overflow', !self.scrollbar.is('.disable'));
	// 		}, 1000);
	// 	},
	// 	/**
	// 	 * [stop 清楚定时器]
	// 	 * @author Wang Xiaojun
	// 	 * @date   2014-10-28
	// 	 */
	// 	stop: function() {
	// 		clearInterval(this.timer);
	// 	},

	// 	bindEvents: function() {
	// 		var self = this;

	// 		// 拖拽滚动条暂停定位
	// 		this.scrollbar.children('.track').mousedown(function() {
	// 			self.stop();
	// 			// 松开后重启
	// 			jQuery(document).one('mouseup', self.start.bind(self));

	// 		});
	// 	}
	// });
	// });


});