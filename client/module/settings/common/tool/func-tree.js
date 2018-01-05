/**
 * 
 * @authors chencheng (chencheng@netposa.com)
 * @date    2014-12-02 
 * @description  用户功能权限微调树
 */

define([
	"ajaxModel",
	"settings/common/tool/pvd-tree",
	"base.self"
], function(ajaxModel, PvdTree){

	var FuncTree = new Class({
		Implements: [Events, Options],
		options: {
			rootUrl:"/service/resource/get_root_function",
			url:"/service/resource/get_function_orgs_by_parent",
			getAllFuncsUrl:"/service/resource/get_function_pemission",  // 获取所有的功能权限 方便角色功能对比
			node:".treePanel",
			pvdOrgId: -1,
			scrollbar:null,
			scrollbarNode:"#aside .scrollbarPanel",
			defaultFuncs:[],
			defaultRootId:0,
			mode:"create",	// "create", "edit" ,
			roleId:null   /* */

		},
		initialize: function(options) {
			window.hasPvdFuncs = false;
			this.setOptions(options);
			// scrollbar 默认scroll容器的类名为 scrollbarPanel
			var tem = this.options;
			// tem.scrollbar = jQuery(tem.node).html("").closest("div"+ tem.scrollbarNode);
			// tem.scrollbar.tinyscrollbar({thumbSize : 72});
			window.oldUserIdValue = this.options.roleId;
			window.newUserIdValue = null;
			jQuery(tem.node).html("");

			// 编辑的时候默认传一个roleId(用户当前角色id)

			this.updateScrollBar();
			var self = this;
			jQuery.ajax({
				type: "get",
				url: "/pvdservice/traffic/tree/root",
				success: function(res) {
					if (res && res.code === 200) {
						var receiveData = res.data.orgs || [];
						receiveData.length > 0 && (window.pvdOrgRootId = receiveData[0].id);
					}
				}
			});
			// 获取所有的功能列表 构建供功能树
			self.getAllFuncs();
		},
		/**
		 * 解析用户的功能权限，编辑用户的时候回显  反向遍历
		 * @author chencheng
		 * @date   2014-12-29
		 * @return {[type]}   [description]
		 */
		parseDefaultFuncs:function(arr){
			var self = this,
				treePanel = jQuery(self.options.node).find("ul.func-tree-panel");

			var modules1 = arr,
				//正式叶子功能
				functionPermission = [],
				//临时叶子功能
				functionTempPermission = [],
				// 用户树的反向遍历
				linkage = [];

			// 遍历第一级
			for (var i = 0; i < modules1.length; i++) {
				var modules2 = modules1[i].systemFunctionOrganizationList || [];
				var funcs2 =  modules1[i].systemFunctionList || [];
				// 第二级功能
				if (modules2.length > 0) {
					linkage[i] = {
						lvl2: treePanel.find("li.tree[data-id='" + modules2[0].id + "']").children("i.checkbox")[0],
						lvl3: []
					}
				}

				if (funcs2.length > 0) {
					linkage[i] = {
						lvl2: treePanel.find("li.leaf[data-id='" + funcs2[0].id + "']").children("i.checkbox")[0],
						lvl3: []
					}
				}

				for (var j = 0; j < modules2.length; j++) {
					var funcs3 = modules2[j].systemFunctionList || [];
					if (funcs3[0]) {
						linkage[i].lvl3.push(treePanel.find("li.leaf[data-id='" + funcs3[0].id + "']").children("i.checkbox")[0]);
					}
					// 遍历三级子节点
					for (var k = 0; k < funcs3.length; k++) {
						var func3 = funcs3[k];
						// 临时权限
						if (func3.beginTime) {
							functionTempPermission.push(func3.id);
						} else {
							// 正式权限
							functionPermission.push(func3.id);
						}
					}
				}

				// 遍历二级子节点
				for (var m = 0; m < funcs2.length; m++) {
					var func2 = funcs2[m];
					if (func2.beginTime) {
						functionTempPermission.push(func2.id);
					} else {
						// 正式权限
						functionPermission.push(func2.id);
					}
				}
			}
			self.selectFuncs(functionPermission, functionTempPermission, linkage);
		},
		/* 编辑用户 回显用户拥有的功能权限 */
		selectFuncs:function(formal,temp,arr){
			var self = this;
			var treePanel = jQuery(self.options.node).find("ul.func-tree-panel");
			// 清空所有的状态
			treePanel.find("i.checkbox").removeClass('icon0 icon1');

			for (var i = 0; i < formal.length; i++) {
				treePanel.find("li.leaf[data-id='" + formal[i] + "']").children('i.checkbox').addClass('icon1');
			}

			for (var j = 0; j < temp.length; j++) {
				treePanel.find("li.leaf[data-id='" + temp[j] + "']").children('i.checkbox').addClass('icon0');
			}

			for (var k = 0; k < arr.length; k++) {
				for (var m = 0; m < arr[k].lvl3.length; m++) {
					if (arr[k].lvl3[m]) {
						self.walkUp(jQuery(arr[k].lvl3[m]));
					}
				}
				// 如果含有3级功能子节点 那么不必遍历二级子节点
				if(arr[k].lvl3.length === 0){
					if (arr[k].lvl2) {
						self.walkUp(jQuery(arr[k].lvl2));
					}
				}
			}

		},
		/* 获取所有的功能权限  */
		getAllFuncs:function(){
			var self = this ;
			var allFuncs = this.options.allFuncs ;
			jQuery.ajax({
				url: self.options.getAllFuncsUrl,
				method: "get",
				dataType: "json",
				data: {},
				success: function(res) {
					if (res.code === 200 && res.data.systemFunctionOrganizationList) {
						self.dataSource  = res.data.systemFunctionOrganizationList;
						// self.dataSource  = mockData.data.systemFunctionOrganizationList;
						// 创建功能树
						jQuery(self.options.node).html(self.assembleTree(self.dataSource));
						self.setPermission();

						// 用户编辑回显数据
						if(self.options.roleId){
							var orgFuncs = self.options.defaultFuncs;
							for (var i = 0, len = orgFuncs.length; i < len; i++) {
								if (orgFuncs[i].id === 10001) {
									window.hasPvdFuncs = true;
									break;
								}
							}
							self.parseDefaultFuncs(self.options.defaultFuncs);
						}
                        //视图库录入与历史录像入库联动
                        var $viewLibs = jQuery("#funcTree li[data-id=3]"),
                            $videoToLibs = jQuery("#funcTree li[data-id=159]");
                        if($viewLibs && $viewLibs.length > 0){
                            $videoToLibs.show();
                            if(!$viewLibs.find("i").hasClass("icon1")){
                                $videoToLibs.find("i").removeClass("icon1");
                            }
                        } else {
                        	$videoToLibs.hide();
                        }
						self.bindEvents();
						self.initPvdOrgs(true);
					}else{
						notify.warn(res.data.message);
					}
				}
			});
		},
		/*
		 * 获取该角色的功能权限 {roleId}:角色id  更新角色 功能面板 更新勾选状态
		 */
		getRoleFuncs:function(roleId){
			var self = this;
			jQuery.ajax({
				url:"/service/role/get_role_function",
				method: "get",
				dataType: "json",
				async:false,
				data: {"id":roleId},
				success: function(res) {
					if (res.code === 200 && res.data.role.roleResourceAccessRules) {
						self.updateTreeStatus({
							"orgs":res.data.role.roleResourceOrganizationAccessRules,
							"funcs":res.data.role.roleResourceAccessRules
						});

					} else {
						notify.warn("网络或服务器异常！");
					}
				}
			});
		},
		/**
		 * 角色更换  更新功能树的状态
		 * @author chencheng
		 * @date   2014-12-25
		 * @return {[type]}   [description]   obj {orgs:[], funcs:[]}
		 */
		updateTreeStatus:function(obj){

			var self = this;
			//正式叶子功能
			var functionPermission = obj.funcs || [],
			//正式组织功能
			functionOrgPermission =  obj.orgs || [],


			treePanel = jQuery(self.options.node).find("ul.func-tree-panel");

			// 清空所有的状态
			treePanel.find("i.checkbox").removeClass('icon0 icon1');

			// 正式子功能
			for (var i = 0; i < functionPermission.length; i++) {
				var funcEl = treePanel.find("li.leaf[data-id='" + functionPermission[i].resourceId + "']");
				if(funcEl.attr("data-deny")){ continue; }
				funcEl.children("i.checkbox").addClass('icon1');
			}

			// 正式父功能
			for (var j = 0; j < functionOrgPermission.length; j++) {
				var orgEl = treePanel.find("li.tree[data-id='" + functionOrgPermission[j].resourceOrganizationId + "']");
				if(orgEl.attr("data-deny")){ continue; }
				orgEl.children("i.checkbox").addClass('icon1').closest("li").children('ul').find("li:not(.data-deny) >i.checkbox").addClass('icon1');
			}
		},
		/**
		 * 组装树
		 * @author chencheng
		 * @date   2014-12-25
		 */
		assembleTree:function(data){
			var self  = this,
				treeHtml = '<ul class="func-tree-panel">';

			for (var i = 0; i < data.length; i++) {
				var line1 = '<li data-parentid="0" data-treeid="t'+data[i].id +'" data-name="'+ data[i].name +'" data-tree-level="1" data-type="tree" data-id="'+ data[i].id +'" class="tree">'+
							'<i class="checkbox "></i><i class="fold"></i><span title="'+ data[i].name +'" class="name">'+ data[i].name +'</span>';

				if (data[i].systemFunctionOrganizationList.length + data[i].systemFunctionList.length > 0) {

					line1 += "<ul>";
					var orgs2 = data[i].systemFunctionOrganizationList,
						funcs2 = data[i].systemFunctionList;

					for (var j = 0; j < orgs2.length; j++) {

						line1 += '<li data-parentid="'+ data[i].id +'" data-treeid="t'+orgs2[j].id +'"  data-name="'+ orgs2[j].name +'" data-tree-level="2" data-type="tree" data-id="'+ orgs2[j].id +'" class="tree">'+
									'<i class="checkbox "></i><i class="fold"></i><span title="'+ orgs2[j].name +'" class="name">'+ orgs2[j].name +'</span>';

						if (orgs2[j].systemFunctionList.length > 0) {

							line1 += "<ul>";
							var funcs3 = orgs2[j].systemFunctionList;


							for (var m = 0; m < funcs3.length; m++) {
								line1 += '<li data-parentid="'+ orgs2[j].id +'"  data-treeid="'+funcs3[m].id +'"  data-name="'+ funcs3[m].name +'" data-tree-level="3" data-type="leaf" data-id="'+ funcs3[m].id +'" class="leaf">' +
											'<i class="checkbox"></i><span title="'+ funcs3[m].name +'" class="name">'+ funcs3[m].name +'</span></li>';
							}
							line1 += "</ul>";
						}
						line1 += '</li>'
					}

					for (var k = 0; k < funcs2.length; k++) {
						line1 += '<li data-parentid="'+ funcs2[k].id +'" data-treeid="'+funcs2[k].id +'" data-name="'+ funcs2[k].name +'" data-tree-level="2" data-type="leaf" data-id="'+ funcs2[k].id +'" class="leaf">'+
									'<i class="checkbox "></i><span title="'+ funcs2[k].name +'" class="name">'+ funcs2[k].name +'</span></li>';

					}

					line1 += "</ul>";
				}

				treeHtml += line1;
			}
			treeHtml += "</ul>";

			return treeHtml ;
		},
		/*
		*	@orgFuncs 组织  @resFuncs 具体资源
		*	@resourceType"："1,//资源类型 1：功能，2：摄像机 3：视图库
		*	@isReject:1 没有该权限
		*	@isDelete:1 是否删除该资源
		*/
		updateRoleFuncs:function(orgFuncs,resFuncs,sroleId){
			var self = this;
			if (window.pvdOrgRootId) {
				return showNext();
			}

			jQuery.ajax({
				type: "get",
				url: "/pvdservice/traffic/tree/root",
				success: function(res) {
					if (res && res.code === 200) {
						var receiveData = res.data.orgs || [];
						receiveData.length > 0 && (window.pvdOrgRootId = receiveData[0].id);
					}
				}
			});
			showNext();
			function showNext() {
				if(self.options.roleId !== parseInt(sroleId,10)){
					self.updateTreeStatus({
						"orgs":orgFuncs,
						"funcs":resFuncs
					});

					window.hasPvdFuncs = false;
					for (var i = 0, len = orgFuncs.length; i < len; i++) {
						if (orgFuncs[i].resourceOrganizationId === 10001) {
							window.hasPvdFuncs = true;
							break;
						}
					}
					window.newUserIdValue = parseInt(sroleId,10);
				}else{	
					var defaultFuncs = self.options.defaultFuncs;
					for (var i = 0, len = defaultFuncs.length; i < len; i++) {
						if (defaultFuncs[i].id === 10001) {
							window.hasPvdFuncs = true;
							break;
						}
					}
					self.parseDefaultFuncs(self.options.defaultFuncs);
				}

				self.initPvdOrgs();
			}
		},
		/**
		 * 用户功能继承
		 * @author chencheng
		 * @date   2014-12-26
		 */
		setPermission:function(){
			var self =  this;
			var p = JSON.parse(window.localStorage.getItem("sPermissionList")).data;
			// var p = mockP.data;

			var items = jQuery(this.options.node).find("ul.func-tree-panel").find("li");
			for (var i = 0; i < items.length; i++) {
				var el = jQuery(items[i]);

				if(!self.hasPermission(el.attr("data-type"),el.attr("data-id"),p)){
					el.attr("data-deny","1");
					el.children('span').css("opacity",0.7);
				}

			}


		},
		// 将不拥有的功能权限置灰
		hasPermission:function(type,id,permission){
			var orgs = permission.validFunctionOrgList ? permission.validFunctionOrgList:[];
			var funcs = permission.validFunctionResourceList ? permission.validFunctionResourceList: [];

			var flag = false;
			if (type === "tree") {
				for (var i = 0; i < orgs.length; i++) {
					if (orgs[i].id == id) {
						flag = true;
						break;
					}
				}
			}

			if (type === "leaf") {
				for (var j = 0; j < funcs.length; j++) {
					if (funcs[j].id == id) {
						flag = true;
						break;
					}
				}
			}

			return flag;

		},
		bindEvents:function(){
			var self = this;
			var treePanel = jQuery(self.options.node).find("ul");

			// + 点击事件
			jQuery(document).off("click",".func-tree-panel i.fold").on("click",".func-tree-panel i.fold",function(){
				var current = jQuery(this).closest("li");

				if(current.attr("data-type") === "tree"){
					self.toggle(current.children("ul"));
				}
				current.toggleClass("active");
				return false;
			});

			// checkbox 勾选事件
			jQuery(document).off("click", ".func-tree-panel i.checkbox").on("click", ".func-tree-panel i.checkbox", function () {

				var tem = jQuery(this),
					his = jQuery('.func-tree-panel').find('li[data-id="46"] i.checkbox'), //历史录像查看
					hisDown = jQuery('.func-tree-panel').find('li[data-id="47"] i.checkbox'), //历史录像下载
					hisSave = jQuery('.func-tree-panel').find('li[data-id="159"] i.checkbox'), //历史录像入库
					viewEnter = jQuery('.func-tree-panel').find('li[data-id=2001] i.checkbox'), //视图库
                    enter = jQuery('.func-tree-panel').find('li[data-id=2002] i.checkbox');//视图库录入
				// 如果没有该角色的功能
				if (tem.closest("li").attr("data-deny")) {
					return false;
				}
				if (tem.closest('li').attr('data-id') === '47') {

					if (his[0].className === 'checkbox') {
						notify.warn('没有历史录像查看权限！');
						return;
					} else if(!(viewEnter.hasClass("icon1") || viewEnter.hasClass("icon0"))){//视图库录入
                        notify.warn("没有视图库权限！");
                        return;
					} else {
						var hisCls = his[0].className;
						if (tem[0].className === 'checkbox'){
							tem[0].className = hisCls;
						} else {
							tem[0].className = 'checkbox';
						}				
						return;
					}
				}

				if(tem.closest('li').attr('data-id') === '2002'){
					if(viewEnter[0].className==="checkbox"){
						notify.warn('没有视图库权限！');
						return;
					} else {
						var view_enter = viewEnter[0].className;
						if (tem[0].className === 'checkbox'){
							tem[0].className = view_enter;
						} else {
							tem[0].className = 'checkbox';
						}				
						return;
					}
				}

				if (tem.hasClass("icon0")) {
					tem.removeClass("icon0").addClass("icon1");
				} else if (tem.hasClass("icon1")) {
					tem.removeClass("icon1").removeClass("icon0");
				} else {
					tem.addClass("icon0");
				}
				self.walkUp(tem);
				self.walkDown(tem);

				self.getOutPutData();
				self.initPvdOrgs();


				if (tem.closest('li').attr('data-id') === '46') {//历史录像查看
					if (hisDown[0].className.indexOf('icon') !== -1) {
						hisDown[0].className = tem[0].className;
					}

					// if (hisSave[0].className.indexOf('icon') !== -1) {
					// 	hisSave[0].className = tem[0].className;
					// }

				}

				if (tem.closest('li').attr('data-id') === '2001') {//视图库
					if (enter[0].className.indexOf('icon') !== -1) {
						enter[0].className = tem[0].className;
					}
				}

				if(tem.closest('li').attr('data-id') === '3' || tem.closest('li').attr('data-id') === '5' && !(tem.hasClass("icon1") || tem.hasClass("icon1"))){//视图库/视图库录入
                    hisSave.removeClass("icon1 icon0");  
				}
				return false;
			});

		},

		/*
		 *	向上查找
		 */
		walkUp:function(item){
			var current = item;
			var caller = arguments.callee;
			if(current.closest("li").is("li.root") ){
				return;
			}
			if(current.closest("li").is("li") ){
				var parent = current.closest("li").closest("ul").closest("li").children("i.checkbox");
				if(!(current.hasClass("icon0") || current.hasClass("icon1"))){
					parent.removeClass("icon0").removeClass("icon1");
					caller(parent);
				}else{
					if(current.hasClass("icon0")){
						var result = true;
						current.closest("li").siblings("li").children("i.checkbox").each(function(index,checkbox){
							if(!jQuery(checkbox).hasClass("icon0")){
								result = false;
							}
						});
						var ckb = item.closest("li").closest("ul").closest("li").children("i.checkbox");
						if(result){
							ckb.addClass("icon0").removeClass("icon1");
						}else{
							ckb.removeClass("icon0").removeClass("icon1");
						}
						caller(parent);

					}

					if(current.hasClass("icon1")){
						var result1 = true;
						current.closest("li").siblings("li").children("i.checkbox").each(function(index,checkbox){
							if(!jQuery(checkbox).hasClass("icon1")){
								result1 = false;
							}
						});
						var ckb1 = item.closest("li").closest("ul").closest("li").children("i.checkbox");
						if(result1){
							ckb1.addClass("icon1").removeClass("icon0");
						}else{
							ckb1.removeClass("icon0").removeClass("icon1");
						}
						caller(parent);

					}
				}
			}
		},
		/*
		 *	向下查找
		 */
		walkDown:function(item){
			var caller = arguments.callee;
			var current = item;
			if(current.closest("li").is("li.tree")){
				if(!(current.hasClass("icon0") || current.hasClass("icon1"))){
					current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem);
							child.removeClass("icon0").removeClass("icon1");
							caller(child);
						});
				}else{

					if(current.hasClass("icon0")){
						current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem);
							if(!child.hasClass("icon0")){
								child.addClass("icon0").removeClass("icon1");
							}
							caller(child);
						});
					}

					if(current.hasClass("icon1")){
						current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem);
							if(!child.hasClass("icon1")){
								child.addClass("icon1").removeClass("icon0");
							}
							caller(child);
						});
					}


				}
			}
		},
		/*
		 *	(暂时不用)遍历勾选的数据 包含 功能父节点(不包含下边的功能子节点) 和 功能子节点
		 */
		getOutPutData_orgfuncs:function(){
			var self = this;
			//正式叶子功能
			var functionPermission = [],
			//临时叶子功能
			functionTempPermission = [],
			//正式组织功能
			functionOrgPermission = [],
			//临时组织功能
			functionTempOrgPermission = [],
			treePanel = jQuery(self.options.node).find("ul.func-tree-panel");

			var modules = treePanel.children('li');
			for (var i = 0; i < modules.length; i++) {
				var module = jQuery(modules[i]);
				if (module.children('i.checkbox').hasClass('icon0')) {
					functionTempOrgPermission.push(module.attr("data-id"));
					continue;
				} else if (module.children('i.checkbox').hasClass('icon1')) {
					functionOrgPermission.push(module.attr("data-id"));
					continue;
				} else {
					var modules2 = module.children('ul').children('li');
					for (var j = 0; j < modules2.length; j++) {
						var module2 = jQuery(modules2[j]);
						if (module2.children('i.checkbox').hasClass('icon0') && module2.attr("data-type") === "tree") {
							functionTempOrgPermission.push(module2.attr("data-id"));
							continue;
						} else if (module2.children('i.checkbox').hasClass('icon0') && module2.attr("data-type") === "leaf") {
							functionTempPermission.push(module2.attr("data-id"));
							continue;
						} else if (module2.children('i.checkbox').hasClass('icon1') && module2.attr("data-type") === "tree") {
							functionOrgPermission.push(module2.attr("data-id"));
							continue;
						} else if (module2.children('i.checkbox').hasClass('icon1') && module2.attr("data-type") === "leaf") {
							functionPermission.push(module2.attr("data-id"));
							continue;
						} else {
							var modules3 = module2.children('ul').children('li');
							for (var k = 0; k < modules3.length; k++) {
								var module3 = jQuery(modules3[k]);
								if (module3.children('i.checkbox').hasClass('icon0')) {
									functionTempPermission.push(module3.attr("data-id"));
									continue;
								} else if (module3.children('i.checkbox').hasClass('icon1')) {
									functionPermission.push(module3.attr("data-id"));
									continue;
								}
							}
						}
					}
				}
			}
			// console.clear()
			// console.log("正式--子功能")
			// console.log(functionPermission)
			// console.log("临时--子功能")
			// console.log(functionTempPermission)
			// console.log("正式--组织")
			// console.log(functionOrgPermission)
			// console.log("临时--组织")
			// console.log(functionTempOrgPermission)

			return [];
		},
		/**
		 * 遍历勾选的数据 只包含功能子节点
		 * @author chencheng
		 * @date   2014-12-26
		 */
		getOutPutData:function(){
			var self = this;
			/* 正式叶子功能 */
			var functionPermission = [],
			/* 临时叶子功能 */
			functionTempPermission = [],

			allInputs = jQuery(self.options.node).find("ul.func-tree-panel").find("li[data-type='leaf']");
			for (var i = 0; i < allInputs.length; i++) {
				var item = jQuery(allInputs[i]);
				if (item.children('i.checkbox').hasClass('icon0')) {
					functionTempPermission.push(item.attr("data-id"));
				} else if (item.children('i.checkbox').hasClass('icon1')) {
					functionPermission.push(item.attr("data-id"));
				}
			}

			return {
				temp: functionTempPermission,
				formal: functionPermission
			};
		},
		updateScrollBar:function(){
			return ;
			// this.options.scrollbar.tinyscrollbar_update('relative');
		},
		toggle:function(el){
			if(el.css("display") === "none"){
				el.css("display","block");
			}else{
				el.css("display","none");
			}
			this.updateScrollBar();
		},
		initPvdOrgs: function(init) {
			var self = this,
				pvdCheckbox = jQuery(self.options.node).find("li[data-name='交通管理']").find("i.checkbox");
			
			if (pvdCheckbox.hasClass("icon0") || pvdCheckbox.hasClass("icon1")) {
				jQuery(".pvdTreePanel").attr("hasPvd", "true").show();
			} else {
				jQuery(".pvdTreePanel").removeAttr('hasPvd').hide();
			}

			if (init) {
				return; //去掉新增用户时弹出的错误提示
				// 初始化交通管理组织树
				var pvdOrgsTree = new PvdTree({
					node: ("#" + self.options.mode + "User .pvdTreePanel"),
					pvdOrgId: self.options.pvdOrgId
				});		
			}
		}

	});

	return FuncTree;
});
