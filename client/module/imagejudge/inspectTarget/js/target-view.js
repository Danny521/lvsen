define(['js/PARAM-STATUS.js','base.self','jquery-ui-timepicker-addon'],function(scope){

	return new new Class({
		initialize:function(){
			this.bindEvents();
		},
		bindEvents:function(){
			var self = this;
			/*
			*  下面绑定的事件都是些单纯的交互
			*   即使涉及到scope的内容也是根据scope的值做判断,并没有在这里去修改scope的变量
			*/

			jQuery(".select_list input[type='text']").focus(function() {
				jQuery(this).addClass("focus");
			}).blur(function() {
				jQuery(this).removeClass("focus");
			});

			jQuery(".select_list input[type='checkbox']").change(function(){
				var checkbox = jQuery(this);
				if(checkbox.prop("checked")){
					checkbox.closest(".select_list").removeClass("disable");
				}else{
					checkbox.closest(".select_list").addClass("disable");
				}
			});

			/*
			资源来源选择
			*/
			jQuery(".search_type").hover(function() {
				jQuery(this).children("ul").stop(true, false).show();
			}, function() {
				jQuery(this).children("ul").stop(true, false).hide();
			});

			/*
			搜索区域表单样式控制check/not check
			*/
			// jQuery(document).on('click','#isTimeCheck,#isResultCheck,#isResultSaved',function(){
			// 	var $this = jQuery(this),
			// 		par = $this.closest('.select_list');
			// 	if($this.prop('checked')){
			// 		par.css({'color':'#000'}).find('input[type=text],select').css({'color':'#000'}).removeAttr('disabled');
			// 	}else{
			// 		par.css({'color':'#ccc'}).find('input[type=text],select').css({'color':'#ccc'}).attr('disabled','true');
			// 	}
			// });

			/*
			* 是否保存当前检索结果
			*/
			jQuery(document).on('click','label.is-new-result',function(){
				if(jQuery(this).hasClass('disable')){
					return;
				}
				jQuery('.save-details').toggle();
			});

			/*增加时间控件*/
			jQuery('.input-time').datetimepicker({
				showSecond: true,
				dateFormat: 'yy-mm-dd',
				timeFormat: 'HH:mm:ss',
				timeText: '',
				hourText: ' 时:',
				minuteText: ' 分:',
				secondText: ' 秒:',
				showAnim: '',
				maxDate: new Date()
			});

			var searchValue = jQuery('#searchValue'),
				controlBar = jQuery('.control-toggle'),
				search_result = jQuery('.search-result'),
				toggle_search = jQuery('.toggle-search'),
				doSearch = jQuery('#doSearch');

			/*隐藏显示检索条件*/
			toggle_search.click(function(){
				var $this =  jQuery(this);
				controlBar.toggle();
				// if(scope.toggle_key){
					/*展开搜索条件*/
					// $this.text('隐藏检索条件');
					// scope.toggle_key = false;
					search_result.css({'top':"245px"});
				// }else{
					// $this.text('展开检索条件');
					// scope.toggle_key = true;
					// search_result.css({'top':'88px'});
				// }
			});

			searchValue.keyup(function(){
				if(scope.searchData.id !== '' && document.getElementById('searchValue').value.trim() !== ''){
					doSearch.removeClass('disable-btn');
				}else{
					doSearch.addClass('disable-btn');
				}
			});
		},

		/*
		*	手风琴效果
		*/
		bindAccordion:function(container){
			container.find("dl dt").click(function(){
				var tEl = jQuery(this);
				tEl.find("i").addClass("icon_uparrow");
				tEl.closest("dl").children("dd").show();
				tEl.closest("dl").siblings("dl").children("dd").hide();
				tEl.closest("dl").siblings("dl").find("dt i").removeClass("icon_uparrow");
			});
		},
		/*
		*@ className [string]:样式名称
		*@ clickNodeObj [jquery Obj]:点击元素jquery对象
		*@ par [string]:父元素class类名
		*@ clickNodeName [string]:被点击子元素类名
		*/
		// toggleClass:function(className,clickNodeObj,par,clickNodeName){
		// 	if(!par){
		// 		/*如果没有第三个参数,则是最简单的相邻兄弟节点之前切换样式*/
		// 		clickNodeObj.addClass(className).siblings().removeClass(className);
		// 	}else{
		// 		/*需要切换样式的节点a不是兄弟节点,而其外的父元素是相邻的兄弟节点,需要切换a的样式时*/
		// 		jQuery(par).find(clickNodeName).addClass(className).parent(par).siblings().find(clickNodeName).removeClass(className);
		// 	}
		// },
		/*
		* 弹框提示,执行callback
		*/
		makeDialog: function(msg, callback) {
			new ConfirmDialog({
				title: '注意',
				width: 640,
				message: msg,
				callback: callback
			});
		},
		initOrder:function(){
			jQuery('#apperTime').find('i').removeClass('icon_red_up').addClass('icon_red_down')
			jQuery('#buildTime').find('i').removeClass('icon_blue_down').addClass('icon_blue_down');
		},
		// toggle_up_down:function(key){
		// 	var self = this;
		// 	if(key){
		// 		// jQuery('.control-toggle').hide();
		// 		scope.toggle_key = true;
		// 		// jQuery('.toggle-search').text('展开检索条件');
		// 		// jQuery('.search_area').css({'top':'0px'});
		// 		jQuery('.search-result').css({'top':'245px'}).show();
		// 		scope.sStatus = false;
		// 	}else{
		// 		// jQuery('.control-toggle').show();
		// 		scope.toggle_key = false;
		// 		// jQuery('.toggle-search').text('隐藏检索条件');
		// 		if(jQuery('.search-result').is(':visible')){
		// 			// jQuery('.search_area').css({'top':'0px'});
		// 			jQuery('.search-result').css({'top':'245px'}).show();
		// 		}
		// 		scope.sStatus = true;
		// 	}
		// },
//		toggleCicon:function(){
//			jQuery(".retrieve_list dd").hover(function() {
//				jQuery(this).find(".icon_close").show();
//			}, function() {
//				jQuery(this).find(".icon_close").hide();
//			});
//		},
		addFileLabel:function(fileName,nametype){
			//jQuery('.search_select_file').html("<span class='choose-file'>"+ fileName +" <i class='close'>x</i></span>");
			var strHtml = "",
				html = "";
			jQuery("#selectResult .search_select").remove();
			if(nametype === "1"){
				html ='<span class="search_select">类型：<span>人员</span><i class="close"></i>&nbsp&nbsp</span>';
			}else if(nametype=== "2"){
				html ='<span class="search_select">类型：<span>车辆</span><i class="close" data-type="1">&nbsp&nbsp</i></span>';
			}else if(nametype=== "3"){
				html ='<span class="search_select">类型：<span>物品</span><i class="close" data-type="1">&nbsp&nbsp</i></span>';
			}else if(nametype=== "4"){
				html ='<span class="search_select">类型：<span>场景</span><i class="close" data-type="1">&nbsp&nbsp</i></span>';
			}else if(nametype=== "5"){
				html ='<span class="search_select">类型：<span>运动目标</span><i class="close" data-type="1">&nbsp&nbsp</i></span>';
			}else if(nametype=== "6"){
				html ='<span class="search_select">类型：<span>其他</span><i class="close" data-type="1">&nbsp&nbsp</i></span>';
			}
			strHtml ='<span class="search_select sour_name">资源名称：<span>'+fileName+'</span><i class="close" data-type="0">&nbsp&nbsp</i></span>'+html;
			jQuery("#selectResult .select-cancel").before(strHtml);
		},
		apperTimeClick:function(){
			jQuery('#apperTime').find('i').toggleClass('icon_red_down').toggleClass('icon_red_up');
			jQuery('#buildTime').find('i').removeClass('icon_blue_up').addClass('icon_blue_down');
		},
		buildTimeClick:function(){
			jQuery('#buildTime').find('i').toggleClass('icon_blue_up').toggleClass('icon_blue_down');
			jQuery('#apperTime').find('i').removeClass('icon_red_up').addClass('icon_red_down');
		},
		detailFail:function(){
			jQuery('ul.contentList').html('<p style="color:#ccc;">查看详情信息失败!</p>');
		},
		/*隐藏掉把里是保存为检索的表单*/
		disableSave:function(){
			jQuery('.is-new-result').addClass('disable');
			jQuery('.save-details').hide();
		},
		unDesableSave:function(){
			jQuery('.is-new-result').removeClass('disable');
		}
	});	
});