define(['jquery','handlebars'],function(jQuery,handlebars){
	//监测状态
	var PVG_STATUS = {
		0 : "正常",
		1 : "网络异常",
		2 : "登陆异常"
	},
	deviceUpdateLength,
	channelUpdateLength,
	channelSumLength,
	deviceSumLength;
	var Template = (function(){
			var cache = {},
				templates = {
				INFOSLIST:'../inc/configMonitor-tpl.html',
				DETAILINFOS:'../inc/video-camera.html'
			};
			function getTitle(items){
				var titlecache = {};
				if (items.length !== 0) {
					for( var i = 0, l = items.length; i < l; i++){
						var k = items[i].title;
							titlecache[k] = items[i].value;
					}
					if(titlecache.主机){
						return "设备IP"+"："+titlecache.主机;
					}else{
						return "设备IP"+"："+titlecache.设备IP;
					}
				}
			}
			/**
			 * [pvg信息列表隔行颜色显示]
			 * @param  {[type]}		[description]
			 * @return {[type]}     [description]
			 */
			handlebars.registerHelper("get-color",function(index){
				return (index % 2 == 0) ? "white-class" : "gray-class";
			});
			/**
			 * [获取pvg标题]
			 * @param  {[type]} 				  [description]
			 * @return {[type]}                   [description]
			 */
			handlebars.registerHelper("get-pvg-title",function(Pvgs){
				return getTitle(Pvgs);
			});
			/**
			 * [获取数据库标题]
			 * @param  {[type]}					    [description]
			 * @return {[type]}                     [description]
			 */
			handlebars.registerHelper("get-table-title",function(Tables){
				return getTitle(Tables);
			});
			/**
			 * [比较不同信息用红色显示]
			 * @param  {[type]}              [description]
			 * @param  {[type]}              [description]
			 * @return {[type]}              [description]
			 */
			Handlebars.registerHelper("compare-Pvg",function(Tables,Pvgs){
				for(var i=0;i<Tables.length;i++){
					if(Tables[i].title==Pvgs.title){
						if(Tables[i].value!=Pvgs.value){
							return "red-class";
						}
					}
				}
			});
			/**
			 * [比较不同信息用红色显示]
			 * @param  {[type]}              [description]
			 * @param  {[type]}              [description]
			 * @return {[type]}              [description]
			 */
			Handlebars.registerHelper("compare-Table",function(Pvgs,Tables){
				for(var i=0;i<Pvgs.length;i++){
					if(Pvgs[i].title==Tables.title){
						if(Pvgs[i].value!=Tables.value){
							return "red-class";
						}
					}
				}
			});
			return {
			/**
			 * [模板渲染]
			 * @param  {[type]}   templateName [模板名称]
			 * @param  {Function} callback     [回调]
			 * @return {[type]}                [description]
			 */
				render: function(templateName, callback) {
					if (cache[templateName]) {
						callback(cache[templateName]);
					} else {
						$.ajax({
							url: templates[templateName],
							method: "get"
						}).then(function(temp) {
							callback(cache[templateName] = Handlebars.compile(temp))
						})
					}
				}
			};
		})();
	var View = function(pb){
		PB = pb;
		this.initEvent();
	}
	View.prototype={
		initEvent:function(){
			var self = this;
			//缓存dom
			this.$lists = $("#content-lists");
			this.$detail = $("#infos");
			/**
			 * [开始检测，轮训获取检测结果]
			 * @param  {[type]}  [description]
			 * @return {[type]}  [description]
			 */
			$(".btn-start").on("click",function(){
				var $self = $(this);
				PB.publish("startCheck");
				//开始按钮灰选 
				$self.attr({disabled:"true"});
				$self.addClass("btn-gray");
				//停止按钮取消灰选
				$(".btn-stop").removeAttr("disabled");
				$(".btn-stop").removeClass("btn-gray");
			});
			/**
			 * [停止检测]
			 * @param  {[type]} [description]
			 * @return {[type]} [description]
			 */
			$(".btn-stop").on("click",function(){
				var $self = $(this);
				PB.publish("stopCheck");
				//停止按钮灰选
				$self.attr({disabled:"true"});
				$self.addClass("btn-gray");
				//开始按钮取消灰选
				$(".btn-start").removeAttr("disabled");
				$(".btn-start").removeClass("btn-gray");
			});
			/**
			 * [全选复选框]
			 * @param  {[type]} 		 [description]
			 * @return {[type]}          [description]
			 */
			$(".check-all").on("click",function(){
				var $self = $(this),IsChecked;
				IsChecked = $self[0].checked;
				$(".infos").find("input").prop("checked",IsChecked);
			});
			/**
			 * [复选框反选]
			 * @param  {[type]} 		 [description]
			 * @return {[type]}          [description]
			 */
			$(".infos").on("click","input",function(){
				var IsChecked = $(".infos").find("input:checked").length===$(".infos").find("input").length;
				$(".check-all").prop("checked",IsChecked);
			});
			/**
			 * [点击设备变更数目]
			 * @param  {[type]} 		 [description]
			 * @return {[type]}          [description]
			 */
			$(".content-lists").on("click",".inline-content .device-change-num",function(){
				var $self = $(this);
				if(parseInt($self.html())!==0&&parseInt($self.parent().children().find(".channel-change-num"))!==0){
					//获取详细的变更情况
					PB.publish("getDeviceDetail",$self.closest(".inline-list").attr("data-pvgId"));
					//界面处理以及绑定数据，后续使用
					$("#check-result").attr("data-pvgId",$self.closest(".inline-list").attr("data-pvgId"));
					$("#check-result").attr("data-orgId",$self.closest(".inline-list").attr("data-orgId"));
					$("#check-lists").addClass("hide");
					$("#check-result").removeClass("hide");
					$(".tabs").attr("data-pvgid",$self.closest(".inline-list").attr("data-pvgId"));
					$(".tabs").children().filter("[data-tab='video']").addClass("current").siblings().removeClass("current");
					//点击变更数目的时候清空checkbox的选中状态
					$(".check-all").prop("checked",false);
					$(".update-infos").find("input").prop("checked",false);
				}
			});
			/**
			 * [点击摄像机通道变更数目]
			 * @param  {[type]} 	        [description]
			 * @return {[type]}            [description]
			 */
			$(".content-lists").on("click",".inline-content .channel-change-num",function(){
				var $self = $(this);
				if(parseInt($self.html())!==0&&parseInt($self.parent().children().find(".device-change-num"))!==0){
					//获取详细的变更情况
					PB.publish("getChannelDetail",$self.closest(".inline-list").attr("data-pvgId"));
					//界面处理以及绑定数据，后续使用
					$("#check-result").attr("data-pvgId",$self.closest(".inline-list").attr("data-pvgId"));
					$("#check-result").attr("data-orgId",$self.closest(".inline-list").attr("data-orgId"));
					$("#check-lists").addClass("hide");
					$("#check-result").removeClass("hide");
					$(".tabs").attr("data-pvgid",$self.closest(".inline-list").attr("data-pvgid"));
					$(".tabs").children().filter("[data-tab='camera']").addClass("current").siblings().removeClass("current");
					//点击变更数目的时候清空checkbox的选中状态
					$(".check-all").prop("checked",false);
					$(".update-infos").find("input").prop("checked",false);
				}
			});
			/**
			 * [视频设备和摄像机通道的切换]
			 * @param  {[type]} 		 [description]
			 * @return {[type]}          [description]
			 */
			$(".tabs span").on("click",function(){
				var $self = $(this),pvgId = $(".tabs").attr("data-pvgid");
				//切换tabs时界面样式变化
				$self.addClass("current").siblings().removeClass("current");
				//切换tabs时渲染模板
				if($(".tabs").children().filter("[data-tab='camera']").hasClass("current")){
					PB.publish("getChannelDetail",pvgId);
				}else{
					PB.publish("getDeviceDetail",pvgId);
				}
				//两者切换时清除复选框的选中程度
				$(".check-all").prop("checked",false);
				$(".update-infos").find("input").prop("checked",false);
			});
			/**
			 * [展开/收起时界面状态处理]
			 * @param  {[type]} 		 [description]
			 * @return {[type]}          [description]
			 */
			$(".infos").on("click",".btn-toggle",function(){
				var $self = $(this),maxheight,
					$btn_toggle = $(".infos").find(".update-infos").filter("[data-index="+$self.attr("data-index")+"]").find(".btn-toggle"),
					//左边内容
					$left = $btn_toggle.closest(".infos-left"),
					//左边展开时的界面
					$leftContent = $left.find(".left-content"),
					//左边收起时的界面
					$lefthide = $left.find(".left-content-hide"),
					//右边内容
					$right = $btn_toggle.closest(".infos-right"),
					//右边展开时的内容
					$rightContent = $right.find(".right-content"),
					//右边收起时的内容
					$righthide = $right.find(".right-content-hide");
				//展开收起时图标变化
				$btn_toggle.toggleClass("show");
				if($self.hasClass("show")){
					//取每一条信息左右两边高度的最大值，并将高度置为最大
					maxheight = Math.max($leftContent.height(),$rightContent.height());
					$leftContent.height(maxheight);
					$rightContent.height(maxheight);
					//展开时界面上面变化
					$btn_toggle.html("&nbsp;&nbsp;收起");
					$leftContent.removeClass("hide");
					$rightContent.removeClass("hide");
					$lefthide.addClass("hide");
					$righthide.addClass("hide");
				}else{
					//收起时界面上面的变化
					$btn_toggle.html("&nbsp;&nbsp;展开");
					$leftContent.addClass("hide");
					$rightContent.addClass("hide");
					$lefthide.removeClass("hide");
					$righthide.removeClass("hide");
				}
			});
			/**
			 * [同步数据]
			 * @param  {[type]} 		 [description]
			 * @return {[type]}          [description]
			 */
			$(".btn-update").on("click",function(){
				var pvgId = $("#check-result").attr("data-pvgId"),//获取当前pvgId
					orgId = $("#check-result").attr("data-orgId"),//获取当前orgId
					$checked;//存储选中项
				if($(".tabs").children().filter("[data-tab='camera']").hasClass("current")){
					PB.publish("UpdateChannel",{
						pvgId:pvgId,
						updateChannel:function(){
							$checked = $(".infos").find("input:checked");
							for(var i=0;i<$checked.length;i++){
								$($checked[i]).closest(".update-infos").hide("slow");
								//为同步过的信息绑定data-flag，便于后续统计变更数目
								$($checked[i]).closest(".update-infos").attr("data-flag","none");
							}
							//存储所有的视频设备的个数
							channelSumLength = $(".infos").find(".update-infos").length;
							//存储已经同步过的视频设备的个数
							channelUpdateLength = $(".infos").find(".update-infos").filter("[data-flag='none']").length;
							//同步成功之后消除checkbox的选中状态
							$("#infos").find("input").prop("checked",false);
							$(".check-all").prop("checked",false);
						}
					})
				}else{
					PB.publish("UpdateDevice",{
						pvgId:pvgId,
						orgId:orgId,
						updateDevice:function(){
							$checked = $(".infos").find("input:checked");
							for(var i=0;i<$checked.length;i++){
								$($checked[i]).closest(".update-infos").hide("slow");
								//为同步过的信息绑定data-flag，便于后续统计变更数目
								$($checked[i]).closest(".update-infos").attr("data-flag","none");
							}
							//存储所有的摄像机通道的个数
							deviceSumLength = $(".infos").find(".update-infos").length;
							//存储已经同步过的摄像机通道的个数
							deviceUpdateLength = $(".infos").find(".update-infos").filter("[data-flag='none']").length;
							//同步成功之后消除checkbox的选中状态
							$("#infos").find("input").prop("checked",false);
							$(".check-all").prop("checked",false);
						}
					})
				}
			});
			/**
			 * [同步页面返回，返回列表页]
			 * @param  {[type]} 		 [description]
			 * @return {[type]}          [description]
			 */
			$(".btn-back").on("click",function(){
				var	pvgId = $("#check-result").attr("data-pvgid"),//当前ID
					$inline_list=$(".content-lists").find(".inline-list").filter("[data-pvgid="+pvgId+"]"),
					Dresult = deviceSumLength-deviceUpdateLength,//视频设备变化数目
					Cresult = channelSumLength-channelUpdateLength, //摄像机通道变化数目
					$deviceNum = $($inline_list).find(".device-change-num"),//视频设备变更数目Dom
					$channelNum = $($inline_list).find(".channel-change-num");//摄像机通道变更数目DOM
				//视频设备变化数目界面处理
				if(Dresult){
					$deviceNum.html(Dresult);
				}
				//摄像机通道变化数目界面处理
				if(Cresult){
					$channelNum.html(Cresult);
				}
				//如果两者变更数目都为0时，界面处理
				if(($deviceNum.html()==0||Dresult===0)&&($channelNum.html()==0||Cresult===0)){
					if(Dresult){//如果是同步造成变更数目为0，则取同步后置为0的结果
						$deviceNum.html(Cresult);
					}else{//本身变更数目九尾0
						$deviceNum.html(0);
					}
					if(Cresult){//如果是同步造成变更数目为0，则取同步后置为0的结果
						$channelNum.html(Cresult);
					}else{//本身变更数目九尾0
						$channelNum.html(0);
					}
					$($inline_list).find(".last").find(".device-change-num").removeClass("blue-class");
					$($inline_list).find(".last").find(".channel-change-num").removeClass("blue-class");
				}
				$("#check-result").addClass("hide");
				$("#check-lists").removeClass("hide");
			});
		},
		/**
		 * [showInfosLists 渲染列表模板]
		 * @param  {[type]} res [调用获取列表接口返回结果]
		 * @return {[type]}     [description]
		 */
		showInfosLists:function(res){
			var self = this;
			//返回值为200的时候渲染列表模板（首页）
			if(res && res.code==200){
				Template.render("INFOSLIST",function(tpl){
					self.$lists.html(tpl(res.data.pvgs));
				})
			}
		},
		/**
		 * [addDisabled description]
		 */
		addDisabled:function(){
			$(".btn-start").attr("disabled","disabled");
			$(".btn-start").addClass("btn-gray");
		},
		/**
		 * [showChangeNum 渲染检测状态以及设备和摄像机变更数目]
		 * @param  {[type]} statusNum [存储状态-设备-摄像机变更数目]
		 * @return {[type]}           [description]
		 */
		showChangeNum:function(key,statusNum){
			//检测状态Dom
			$(".pvgUl-"+key+" .pvg-status").html(PVG_STATUS[statusNum[0]]);
			//设备变更数目Dom
			$(".pvgUl-"+key+" .last .device-change-num").html(statusNum[1]);
			//摄像机变更数目Dom
			$(".pvgUl-"+key+" .last .channel-change-num").html(statusNum[2]);
			//如果变更数目大于0时可以点击，添加blue-class类
			if(statusNum[1]>0||statusNum[2]>0){
				$(".pvgUl-"+key+" .last").find(".device-change-num").addClass("blue-class");
				$(".pvgUl-"+key+" .last").find(".channel-change-num").addClass("blue-class");
			}
		},
		/**
		 * [ControlButton 检测完成时按钮的变化]
		 */
		ControlButton:function(){
			//停止按钮灰选 
			$(".btn-stop").attr({disabled:"true"});
			$(".btn-stop").addClass("btn-gray");
			//开始按钮取消灰选
			$(".btn-start").removeAttr("disabled");
			$(".btn-start").removeClass("btn-gray");
		},
		/**
		 * [showDetail 渲染变更信息详情]
		 * @return {[type]} [description]
		 */
		showDetail:function(detail){
			var self = this;
			Template.render("DETAILINFOS",function(tpl){
				self.$detail.html(tpl(detail));
			})
		},
		/**
		 * [getChecked 获取选中项]
		 * @return {[type]} [description]
		 */
		getChecked:function(){
			return $(".infos").find("input:checked");
		},
		/**
		 * [getCheckIndex 获取选中要同步的项的data-index]
		 * @param  {[type]} checkedinput [description]
		 * @return {[type]}              [description]
		 */
		getCheckIndex:function(checkedinput){
			var checkedIndex;
			if($(checkedinput).attr("data-index")!=void 0){
					checkedIndex = $(checkedinput).attr("data-index");
			}
			return checkedIndex;
		}
	}
	return View;
})