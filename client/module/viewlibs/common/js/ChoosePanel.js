define(['handlebars','mootools','jquery','scrollbar'], function() {
	var ChoosePanel =  new Class({
		Implements: [Events, Options],
		options: {
			url:"/service/pvd/incident/categories",
			callback:jQuery.noop
		},
		initialize:function(){
			var self = this;
			jQuery.get("/module/viewlibs/caselib/inc/tpl_importIncidentPanel.html",function (data) {
				self.template = Handlebars.compile(data);
				self.createDialog(self.template({"choosePanel":{"category":self.getItems()}}));
			});
		},
		createDialog:function(html) {
			var self = this;
			this.dialog = new ConfirmDialog({
					width: "625px",
					top: "85px",
					visible:true,
					title: '设置重大案事件类别',
					classes:"importent-incident-panel",
					confirmText: '确定',
					message: html,
					callback: function() {
						var outData = self.getOutPutData();
						if(jQuery.trim(outData) === ""){
							outData = "-1";
						}
						jQuery.ajax({
							url:self.options.url,
							type:"post",
							data:{"code":outData},
							dataType:"json",
							success:function(res){
								if(res.code === 200){
									notify.success("设置重大案事件类别成功");
								}else{
									notify.warn("设置重大案事件类别失败");
								}
							},error:function() {
								notify.warn("网络异常，请稍后再试")
							}
						});
						
					}
				});

			this.bindEvents();
		},
		getItems:function (argument) {
			return [
						{categoryCode:"01",type:"offense",categoryName:"刑事犯罪案件"},
						{categoryCode:"02",type:"traffic",categoryName:"出入境案事件"},
						{categoryCode:"03",type:"disaster",categoryName:"船舶（民）管理事件、案件"},
						{categoryCode:"04",type:"security",categoryName:"报警信息"},
						{categoryCode:"05",type:"mass",categoryName:"违反治安管理行为"},
						{categoryCode:"06",type:"immigration",categoryName:"群体性事件"},
						{categoryCode:"07",type:"alarm",categoryName:"治安灾害事故"},
						{categoryCode:"08",type:"events",categoryName:"道路交通事故"},
						{categoryCode:"09",type:"terror",categoryName:"涉恐事件"},
						{categoryCode:"10",type:"ship",categoryName:"重大事件预警"},
						{categoryCode:"11",type:"else",categoryName:"其他"}
					];
		},
		updateCountNum:function(){
			var count = jQuery(".importent-incident-panel .choose-list-right li").length;
				jQuery(".importent-incident-panel .choose-list-right .count").text(count);
			this.updateScrollBar();
		},
		updateScrollBar:function(){
			jQuery("#cpscrollbar2").tinyscrollbar_update('relative');
		},
		/*
		 *	获取之前的配置数据
		 */
		getConf:function(){
			var self = this;
			jQuery.ajax({
				url:self.options.url,
				type:"get",
				dataType:"json",
				success:function(res){
					if(res.code === 200){
						if(res.data.length>0){
							self.selectCategory(res.data);
						}
					}else{
						notify.warn("获取重大案事件类别失败");
					}
				}
			});
		},
		//	回显之前的数据
		selectCategory:function(data){
			for (var i = data.length - 1; i >= 0; i--) {
				var el = jQuery(".importent-incident-panel .choose-list-left li[data-code="+data[i].categoryCode+"]");
				el.addClass("selected");
				var el = jQuery(".importent-incident-panel .choose-list-right ul").append(el.clone());
			}
			this.updateCountNum();
		},
		bindEvents:function(){
			var self = this;
			// 添加滚动条
			jQuery("#cpscrollbar1").tinyscrollbar({thumbSize :80});
			jQuery("#cpscrollbar2").tinyscrollbar({thumbSize :80});

			// 回显之前设置过的数据
			self.getConf();

			// 左侧勾选
			jQuery(document).off("click",".importent-incident-panel .choose-list-left li i");
			jQuery(document).on("click",".importent-incident-panel .choose-list-left li i",function(){
				var el = jQuery(this).closest("li").toggleClass("selected");
				var code = el.attr("data-code");
				if(el.hasClass("selected")){
					jQuery(".importent-incident-panel .choose-list-right ul").append(el.clone());
				}else{
					jQuery(".importent-incident-panel .choose-list-right li[data-code="+code+"]").remove();
				}
				self.updateCountNum();
			});

			// 右侧删除
			jQuery(document).off("click",".importent-incident-panel .choose-list-right li i");
			jQuery(document).on("click",".importent-incident-panel .choose-list-right li i",function(){
				var el = jQuery(this).closest("li");
				jQuery(".importent-incident-panel .choose-list-left li[data-code="+el.attr("data-code")+"]").removeClass("selected");
				el.remove();
				self.updateCountNum();
			});

		},
		getOutPutData:function(){
			var data = [];
			jQuery(".importent-incident-panel .choose-list-right li").each(function(index,item){
				var el = jQuery(item);
				data.push(el.attr("data-code"));
			});
			return data.join(",");
		}

	});
 return ChoosePanel;
});





		




