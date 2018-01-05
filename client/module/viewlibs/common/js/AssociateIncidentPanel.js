/*
 *	案事件关联弹窗
 */
define(['/module/viewlibs/common/js/AutoComplete.js', 'jquery','mootools'], function(AutoComplete) {
	var AssociateIncidentPanel = new new Class({
		Implements: [Events, Options],
		options: {
			selector:"#chooseIncident"
		},
		initialize:function(){
			var self = this;
			self.flag = 1;
			jQuery("html,body").css({
                "overflow-y":"auto",
                height:"100%"
            });
			jQuery.get("/module/viewlibs/common/dialog.html",function(data){
				self.template = Handlebars.compile(data);
			});
		},

		//弹窗显示
		show: function(opt) {
			this.setOptions(opt);
			var self = this;
			if(jQuery(self.options.selector).length === 0){
				return;
			}
			// 显示弹窗
			new ConfirmDialog({
				title: '关联案事件',
				confirmText: '确定',
				message: self.template({"chooseIncidentTemplate":{}}),
				callback: function() {
					var btn = jQuery(self.options.selector);
					// resourceId:所属视图的id	type:所属视图的类型[1 视频	2 图片]
					var param = {
							"resourceId":btn.attr("data-mediaid"),
							"type":btn.attr("data-type")
						};

					if(self.flag === 1){
						var resType = self.getResourceTypeName(Toolkit.paramOfUrl().origntype);
						window.location.href = "/module/viewlibs/workbench/create_incident.html?id="+param.resourceId+"&type="+param.type +"&res="+resType;
					}else if(self.flag === 2){
						param.incidentId = jQuery("input#associate").attr("data-id");
						if(param.incidentId !== "notexist"){
							self.sendAssociateRequest(btn,param);
						}else{
							//如果案事件名称和id对应的话可保存成功
							if(jQuery("input#associate").val()){
								self.checkReq = jQuery.ajax({
									url:'/service/pvd/incident/matching/' + jQuery.trim(jQuery("input#associate").val()),
									type:"get",
									dataType:"json",
									success:function(res){
										if(res.code === 200){
											if(res.data.incident !==""){
												var data = res.data.incident;
												param.incidentId = data.id;
												self.sendAssociateRequest(btn,param);
											}else{
												notify.info("该案事件无效");
											}
										}else{
											notify.warn("匹配该案事件失败");
										}
									}
								});
							}else{
								notify.info("该案事件无效");
								return false;
							}
						}
					}
				}
			});

			self.bindEvents();
			
		},
		bindEvents:function() {
			var self = this;
			// 输入框的启用 禁用
			jQuery(".associate-panel input:radio").change(function(event) {
				if(jQuery(this).attr("data-id") === "2"){
					jQuery("#associate").prop("disabled",false);
					self.flag = 2;
				}else{
					jQuery("#associate").prop("disabled",true);
					self.flag = 1;
				}
				
			});
			//自动匹配输入内容
			new AutoComplete({
					node: '#associate',
					hasSelect: true,
					hasEnter: true,
					left: "0px",
					top: "52px",
					panelClass: "suggest-panel"
			});
			
		},
		// 根据类型id or English name获取类型名称
		getResourceTypeName:function(type){
			var name = "";
			switch(type) {
				case 1:
				case "1":
				case "person":
					name = "人员";
					break;
				case 2:	
				case "2":
				case "car":
					name = "车辆";
					break;
				case 3:	
				case "3":
				case "exhibit":
					name = "物品";
					break;
				case 4:	
				case "4":
				case "scene":
					name = "场景";
					break;
			}

			return name;
		},
		/*
		 *	关联已有案事件
		 * @param{el} 关联按钮 
		 * @param{param} 请求参数
		 */
		sendAssociateRequest:function(el,param) {
			var self = this;
			jQuery.ajax({
				url: '/service/pvd/incident/binding',
				type: 'post',
				data:param,
				dataType: 'json',
				success: function(res) {
					if (res.code === 200) {
						notify.success("关联案事件成功");

						var msg = self.getResourceTypeName(el.attr("data-rtype")) +"线索关联"+ jQuery.trim(jQuery("#associate").val())+"案事件";
						logDict.insertMedialog('m4',msg);

						el.remove();
						setTimeout(function(){
							window.location.href = window.location.href+"&incidentname="+jQuery.trim(jQuery("#associate").val());
						},2000);
						
					} else {
						notify.warn("关联案事件失败");
					}
				}
			});
		}

	});

 return AssociateIncidentPanel;
});

		




