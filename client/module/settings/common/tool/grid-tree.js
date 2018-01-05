/**
 * 
 * @authors chencheng (chencheng@netposa.com)
 * @date    2014-12-02 
 * @description  表格树 用户管理  摄像机权限授权tree-table  暂未使用 功能暂时砍掉
 */

define(["ajaxModel","base.self"], function(ajaxModel){

	var GridTree = new Class({
		Implements: [Events, Options],
		options: {
			cameraIndex: 0,
			thUrl: "/service/resource/get_user_camera_operation",//表头
			rootUrl: "/service/resource/get_root_camera",//根节点
			childUrlAdd: "/service/resource/get_camera_for_modify_permission_add",//子节点
			childUrlEdit: "/service/resource/get_camera_for_modify_permission_edit",//子节点
			childUrlDetail: "/service/resource/get_camera_for_modify_permission_get",//子节点
			templateUrl:"/module/settings/common/tool/grid-tree.html",
			treeType: "add",//表格树状态：add/添加；edit/编辑；vide/查看；
			container: '#treeGrid',
			masterOrgId:"0",	//用户当前所在部门的id
			mode: "add",//add:添加，edit:修改，detail:查看
			cameraResourceMedifyList: [],//修改后的监控点权限ID列表
			flag:0,   // 数据为空 [0 未微调  1 已微调 ]
			template:null
		},
		initialize: function(options) {
			var self = this;
			self.setOptions(options);
			self.registerHelper();

			ajaxModel.getTml(self.options.templateUrl).then(function(data){
				self.options.template = Handlebars.compile(data);
				self.setTh();
				self.setRoot();
			});

			// jQuery.get(self.options.templateUrl,function(data){
			// 	self.options.template = Handlebars.compile(data);

			// 	self.setTh();
			// 	self.setRoot();
			// });
		},
		//请求封装
		ajaxFun: function(url,params,container){
			var result = null;
			var custom = {
				beforeSend:function(){
					if(container){
						container.append("<div id='loading' class='no-data'><i class='loading-img'/></i>正在加载…</div>");
					}
				},
				complete:function(){
					if(container){
						container.find("#loading").remove();
					}
				}
			};
			ajaxModel.postData(url, params, {
				async: false
			}).then(function(res) {
				result = res;
			}, function() {
				notify.warn("网络或服务器异常！");
			});

			// jQuery.ajax({
			// 	url:url,
			// 	type:"post",
			// 	data:params,
			// 	dataType:'json', 
			// 	async:false,
			// 	beforeSend:function(){
			// 		if(container){
			// 			container.append("<div id='loading' class='no-data'><i class='loading-img'/></i>正在加载…</div>");
			// 		}
			// 	},
			// 	success:function(res){
			// 		result = res;
			// 	},
			// 	complete:function(){
			// 		if(container){
			// 			container.find("#loading").remove();
			// 		}
			// 	},
			// 	error:function(){
			// 		notify.warn("网络或服务器异常！");
			// 	}
			// });
			return result;
		},
		//获取表头数据
		getThData: function(){
			this.thData = this.ajaxFun(this.options.thUrl,{"masterOrgId":this.options.masterOrgId});
		},
		//设置表头
		setTh: function(){
			this.getThData();
			var ThData = this.thData;
			if(ThData.data.operationList.length>0){
				ThData.data.mode = this.options.mode;
				jQuery(this.options.container).empty().html(this.options.template({"tableHead":ThData.data}));
				jQuery(".treegrid-head .table-head table,.treegrid-body .table-body table,.table-scroll table").width(ThData.data.operationList.length*90+"px");
			
				// 绑定滚动事件
				jQuery(".table-scroll").scroll(function(){
					jQuery(".treegrid-container .treegrid-head .table-head").scrollLeft(this.scrollLeft);
					jQuery(".treegrid-body .treegrid-body-panel .table-body").scrollLeft(this.scrollLeft);				
				});
			}
		},
		//获取根节点数据
		getRootData: function(){
			return this.ajaxFun(this.options.rootUrl,{
				"masterOrgId":this.options.masterOrgId,
				"flag":this.options.flag
			});
		},
		//设置根节点
		setRoot: function(){
			var RootData = this.getRootData();
			var ThData = this.thData;
			if(RootData.data.orgList.length>0){
				for(var i=0,j=RootData.data.orgList.length;i<j;i++){
					RootData.data.orgList[i].level = "0-"+i;
					RootData.data.orgList[i].OperationList = ThData.data.operationList;
					RootData.data.orgList[i].mode = this.options.mode;
				}
				jQuery(".treegrid-body .treegrid-body-panel .tree-body table").empty().html(this.options.template({"treeRoot":RootData.data}));
				this.setGridData(RootData.data);
			}
			this.bindEvent(0);
		},
		//获取子节点数据
		getChildData: function(orgId,container){
			if(this.options.mode === 'add'){
				return this.ajaxFun(this.options.childUrlAdd,{
					"orgId":orgId,
					"masterOrgId":this.options.masterOrgId,
					"flag":this.options.flag
				},container);
			}
			if(this.options.mode === 'edit'){
				return this.ajaxFun(this.options.childUrlEdit,{
					"orgId":orgId,
					"userId":this.options.userId
				},container);
			}
			if(this.options.mode === 'detail'){
				return this.ajaxFun(this.options.childUrlDetail,{
					"orgId":orgId,
					"userId":this.options.userId
				},container);
			}
		},
		//设置子节点
		setChild: function(obj){
			var self = this;
			var parentTr = obj.closest("tr");
			var parentId = parentTr.attr("parent_id"),orgId = parentTr.attr("orgId");
			var url,params,container = parentTr.find("div.tree-item");
			if(this.options.mode === 'add'){
				url = this.options.childUrlAdd;
				params = {
					"orgId":orgId,
					"masterOrgId":this.options.masterOrgId,
					"flag":this.options.flag
				};
			}
			if(this.options.mode === 'edit'){
				url = this.options.childUrlEdit;
				params = {
					"orgId":orgId,
					"userId":this.options.userId
				};		}
			if(this.options.mode === 'detail'){
				url = this.options.childUrlDetail;
				params = {
					"orgId":orgId,
					"userId":this.options.userId
				};
			}
			jQuery.ajax({
				url:url,
				type:"post",
				data:params,
				dataType:'json', 
				beforeSend:function(){
					if(container){
						container.append("<div id='loading' class='no-data'><i class='loading-img'/></i>正在加载…</div>");
					}
				},
				success:function(res){
					var ThData = self.thData;
					var ChildData = res;

					if((parentId+"").split("-").length>7){
						notify.warn("暂时只支持7级及以下");
						return;
					}
					ChildData.data.OperationList = ThData.data.operationList;
					//组织资源列表
					if(ChildData.data.orgList.length>0){
						for(var i=0,j=ChildData.data.orgList.length;i<j;i++){
							ChildData.data.orgList[i].mode = self.options.mode;
							ChildData.data.orgList[i].level = parentId+"-"+(i+1);
						}
					}

					//监控点列表
					if(ChildData.data.cameraList.length>0){
						for(var m=0,n=ChildData.data.cameraList.length;m<n;m++){
							ChildData.data.cameraList[m].level = parentId+"-"+(ChildData.data.orgList.length+m+1);
							ChildData.data.cameraList[m].cameraIndex = self.options.cameraIndex+1;
							ChildData.data.cameraList[m].mode = self.options.mode;
							self.options.cameraIndex++;
						}
					}

					ChildData.data.mode = self.options.mode;
					obj.closest("tr").after(self.options.template({"treeChild":ChildData.data}));
					//设置表格数据
					self.setGridData(ChildData.data,jQuery(".table-body table tr[parent_id="+parentId+"]"));
					self.bindEvent(parentId);
				},
				complete:function(){
					if(container){
						container.find("#loading").remove();
					}
				},
				error:function(){
					notify.warn("网络或服务器异常！");
				}
			});
			
		},
		setGridData: function(data,parentTr){
			var self = this;
			if(parentTr){
				parentTr.after(self.options.template({"treeTable":data}));
			}else{
				jQuery(".table-body table").append(self.options.template({"treeTable":data}));
			}
		},
		getChangedTds: function(){
			return this.options.cameraResourceMedifyList;
		},
		resetCameraResourceMedifyList: function(data){
			var flag = false;
			var cameraList = this.options.cameraResourceMedifyList;
			for(var i=0,j=cameraList.length;i<j;i++){
				if(cameraList[i].cameraId === data.cameraId){
					cameraList.splice(i,1,data);
					flag = true;
					break;
				}
			}
			if(!flag){
				cameraList.push(data);
			}
		},
		//注册Helper
		registerHelper: function(){
			var self = this;
			//根据父亲ID获取当前级别
			Handlebars.registerHelper("data-level", function(parent_id) {
				if(parent_id+""){
					var levelArray = (parent_id+"").split("-");
					return levelArray.length-2;
				}
			});
			//判断当前行的奇偶性
			Handlebars.registerHelper("evenOrOdd", function(cameraIndex){
				if(cameraIndex%2 === 0){
					return "even";
				}
				return "odd";
			});
			//判断是否是某模式
			Handlebars.registerHelper("isXMode", function(mode,value,options){
				if(mode === value){
					return options.fn();
				}
			});
			//添加表头时判断模式
			Handlebars.registerHelper("ModeOnTh", function(mode,value,data,options){
				if(mode === value){
					return options.fn({"operationList":data});
				}
			});
			//添加表格内容时判断模式
			Handlebars.registerHelper("ModeOnTd", function(mode,value,data,options){
				if(mode === value){
					return options.fn({"cameraList":data});
				}
			});
			//编辑时默认选中复选框
			Handlebars.registerHelper("EditCheckedBox", function(operationList,operationIdList,mode,options){
				var optionIds = [];
				if(operationIdList){
					optionIds = operationIdList.split(",");
				}
				var str = "";
				for(var i=0;i<operationList.length;i++){
					var flag = false;
					for(var j=0;j<optionIds.length;j++){
						if(optionIds[j] === operationList[i].id){
							if(mode === 'edit'){
								str += '<td><i class="checkbox checked" operation_id="'+operationList[i].id+'"></i></td>';
							}else{
								str += '<td><i class="checked_detail"></i></td>';
							}
							flag = true;
							break;
						}
					}
					if(!flag){
						if(mode === 'edit'){
							str += '<td><i class="checkbox" operation_id="'+operationList[i].id+'"></i></td>';
						}else{
							str += '<td><i class="no">no</i></td>';
						}
					}
				}
				return str;
			});
		},
		bindEvent: function(parentId){
			var self = this;
			var clickTarget = jQuery(".treegrid-body .treegrid-body-panel .tree-body table tr[parent_id^="+parentId+"-] .tree-item .folder");
			clickTarget.on("click", function(){
				var This = jQuery(this);
				var parentId = This.closest("tr").attr("parent_id");
				//点击效果
				if(This.hasClass("open")){
					jQuery(".tree-body table tr[parent_id^="+parentId+"-]").each(function(){
						jQuery(this).hide();
					});

					jQuery(".table-body table tr[parent_id^="+parentId+"-]").each(function(){
						jQuery(this).hide();
					});
					This.removeClass("open").addClass("close");
					This.parent().find(".icon").removeClass("active");
					jQuery('#loading').remove();
				}else if(This.hasClass("close")){
					jQuery(".tree-body table tr[parent_id^="+parentId+"-]").each(function(){
						jQuery(this).show();
					});
					jQuery(".table-body table tr[parent_id^="+parentId+"-]").each(function(){
						jQuery(this).show();
					});
					This.removeClass("close").addClass("open");
					This.parent().find(".icon").addClass("active");
				}
				//加载子节点
				if(jQuery(this).parent().hasClass(".loaded")){
					return;
				}
				self.setChild(jQuery(this));
				This.parent().addClass(".loaded");
			});
			//点击复选框
			var checkboxClickTarget = jQuery(".treegrid-body .treegrid-body-panel .table-body tr[parent_id^="+parentId+"-] td i.checkbox");
			checkboxClickTarget.on("click",function(){
			var This = jQuery(this);
			if(This.hasClass("checked")){
				This.removeClass("checked");
			}else{
				This.addClass("checked");
			}
			var cameraId = This.closest("tr").attr("camera_id");
			var operationIdList = "";
			This.closest("tr").find("td").each(function(){
				var ThisCheckbox = jQuery(this).find("i");
				if(ThisCheckbox.hasClass("checked")){
					if(operationIdList){
						operationIdList += ","+ThisCheckbox.attr("operation_id");
					}else{
						operationIdList += ThisCheckbox.attr("operation_id");
					}
				}
			});
			var changeResult = '{"cameraId":"'+cameraId+'","operationIdList":"'+operationIdList+'"}';
			//重置监控点权限列表
			self.resetCameraResourceMedifyList(JSON.parse(changeResult));
			});
			//鼠标悬浮效果
			var hoverTreeTarget = jQuery(".treegrid-body .treegrid-body-panel .tree-body table tr.even,.treegrid-body .treegrid-body-panel .tree-body table tr.odd");
			hoverTreeTarget.on("mouseover", function(){
				var cameraIndex = jQuery(this).attr("data_id");
				jQuery(".table-body table tr[data_id="+cameraIndex+"]").css("background-color","#DCE3ED");
				jQuery(this).css("background-color","#DCE3ED");
			});
			hoverTreeTarget.on("mouseout", function(){
				var cameraIndex = jQuery(this).attr("data_id");
				jQuery(".table-body table tr[data_id="+cameraIndex+"]").css("background-color","");
				jQuery(this).css("background-color","");
			});
			var hoverTableTarget = jQuery(".table-body tr.even,.table-body tr.odd");
			hoverTableTarget.on("mouseover", function(){
				var cameraIndex = jQuery(this).attr("data_id");
				jQuery(".tree-body table tr[data_id="+cameraIndex+"]").css("background-color","#DCE3ED");
				jQuery(this).css("background-color","#DCE3ED");
			});
			hoverTableTarget.on("mouseout", function(){
				var cameraIndex = jQuery(this).attr("data_id");
				jQuery(".tree-body table tr[data_id="+cameraIndex+"]").css("background-color","");
				jQuery(this).css("background-color","");
			});
		}
	});

	return GridTree;
});
