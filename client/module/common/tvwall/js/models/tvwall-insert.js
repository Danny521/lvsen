/*global TvLayoutDetail:true, TvWallLyt:true */
// $(function() {
/**
 * [电视墙提供浮出层展现、上墙]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	"/module/common/tvwall/js/controllers/tv-layout-detail-controller.js",
	"ajaxModel",
	"pubsub",
	"/module/common/tvwall/js/models/tv-layout-detail-model.js",
	"domReady",
	"base.self",
	'jquery-ui'
], function(TvLayoutDetail, ajaxModel, PubSub, tvDetailM) {
	//扩展屏提示问题
	if (window.isHasTvwall && window.isHasTvwall === "isHasTvwall") {
		return false;
	}
	var tempLyt = new TvLayoutDetail();
	tempLyt.layoutContainer = jQuery(".tvList");
	tempLyt.saveFun = function() {};
	tempLyt.changeIssd();

	function TvwallInsert() {
		this.initialize(this.options);
	}
	TvwallInsert.prototype = {
		/**
		 * [options description]
		 * @type {Object}
		 */
		options: {
			template: null,
			lytdata: null,//存储查询布局时从后台获得的数据
			intv:null
		},
		selectValue: null,
		templateUrl: '/module/common/tvwall/inc/tvwall-template.html',
		URLS: {
			//布局的初始查询
			QUERYLAYOUTURL: "/service/config/tvwall/layouts"
		},
		/**
		 * [initialize 初始化布局以及不同布局之间切换]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   options [description]
		 * @return {[type]}           [description]
		 */
		initialize: function(options) {
			var self = this;
			//如果非电视墙模块，则不需要在加载时进行布局读取和切换
			if (location.href.match(/\/module\/inspect\/tvwall\//gi)) {
				self.initData();
			}
		},
		/**
		 * 初始化电视墙相关
		 * @Author zhangyu
		 * @Date   2015-10-18T18:58:02+0800
		 * @return {[type]}                 [description]
		 */
		initData: function(){
			var that = this;
			that.loadLytData();
			jQuery("#major .tree .more").remove();
			$(".tv-model").draggable({
				helper: "clone",
				cursor: "pointer",
				appendTo: ".tvList",
				cursorAt: {
					"left": -10
				}
			});

			//jQuery("#lyLishow .tvList").css("overflow", "hidden");
			//不同布局切换效果
			jQuery(document).on("change", ".changeLyt select", function(e) {
				e.preventDefault();
				var $dom = jQuery(this);
				new ConfirmDialog({
					title: '警告',
					width: 640,
					message: "确定切换到其他电视墙布局？",
					callback: function() {
						if (tempLyt.isChange) {
							that.updateLatelyData();
						}
						var lytArr = that.options.lytdata.data,//存储后台获取到的数据
							selfid = $dom.children('option:selected').attr("data-id"),//获取当前选中的布局id
							obj = that.getclickLytbyid(lytArr, selfid).lyta;//根据id获取当前布局的详细信息							
							that.selectValue = jQuery(".changeLyt select").val();//改变select框的值
						// that.changeCss(jQuery(this).children().children().filter(".ty"));
						if (window.tvWallIntv){
							clearInterval(window.tvWallIntv);
						}
						//切换布局时清空之前的相机上墙标识
						jQuery("#camerasPanel .tree").find(".node li").removeClass("selected");
						//切换布局时关闭历史进度条
						jQuery(".playbar-close").trigger("click");
						var historyBar = window.tvWallHistoryBarObj;
						if (historyBar && historyBar.timmer) {
							window.clearInterval(historyBar.timmer);
						}
						logDict.insertMedialog("m1", "修改"+window.oldName +"电视墙布局为" + that.selectValue + "电视墙布局", "", "o2");
						tempLyt.renderDetailMode(obj);//用布局详细信息渲染模板
						that.rendLoop(selfid)  //渲染窗口内分屏格子						
						that.options.oldName = that.selectValue;
						
					}
				});
				//点击取消时什么都不做
				jQuery(".common-dialog .button[value=取消], .common-dialog .close").click(function() {
					jQuery(".changeLyt select").val(that.selectValue);
				});
			});
            //点击全部下墙
			jQuery(".allOffWall span").off("click").on("click",function(){
				if (jQuery(this).hasClass('disabled')) {
				//	notify.warn("当前电视墙所有屏幕上没有流!");
					return false;
				}
				var layoutName = jQuery(".changeLyt select").val(),
					option = jQuery(".changeLyt select").find("option[data-name=" + layoutName + "]"),
					layoutId = option.data("id"),
					url = "/service/md/stream/close/layout/";
				jQuery.get(url + layoutId, null, function(res) {
					//取消电视墙布局通道选中状态
					jQuery("#autoMousewheel li").find(".dis-screen1").removeClass("selected");
					//取消左侧所有分组中所有上墙相机的选中状态
					jQuery("li.node").removeClass("selected");
					//切换布局时关闭历史进度条
					jQuery(".playbar-close").trigger("click");
					var historyBar = window.tvWallHistoryBarObj;
					if (historyBar && historyBar.timmer) {
						window.clearInterval(historyBar.timmer);
					}
					notify.success(res.data.message);
				});
			});
			//电视墙拖动
			that.dragWalldiv();
			that.divFocus();
		},
		/**
		 * [rendLoop description 定时器渲染状态]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
		rendLoop: function (layId) {
			var self = this;
			if (/module\/inspect/g.test(location.href.toString())) {
				//第一次默认执行状态读取
				self.rendTableCell(layId);
				//先关闭状态定时器
				if (window.tvWallIntv) {
					window.clearInterval(window.tvWallIntv);
				}
				//开启新的定时器
				window.tvWallIntv = window.setInterval(function() {
					self.rendTableCell(layId);
				}, 3000);
			}
		},
		
		/**
		 * [divFocus description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
		divFocus: function() {
			setTimeout(function() {
				jQuery("#major .tvList").hover(function() {
					jQuery("#major").focus();
				});
			}, 500);
		},
		
		
		/**
		 * [divFocus description 传入布局id获取每个小格子信息，并渲染]
		 * @author xukai	
		 * @date   2015-09-21
		 * @return {[type]}   [description]
		 */
		
		rendTableCell: function (layId) {
			var self = this;
			ajaxModel.getData('/service/md/layout/screenInfo/' + layId).then(function (res) { //切换时获取窗格布局
				if (res && res.code === 200) {
				    var allOffWallIsUsed = false;				
					jQuery(res.data.layoutWindowInfo).each(function (i, e) {
						var ele = jQuery(jQuery('#autoMousewheel>li')[i]),
							stream = e.streamStatusVos;
						if (e.windowInfo) {
							ele.find('.tv').attr({
								'data-id': e.id,
								'data-screenid': e.screenId,
								'data-serverid': e.serverId,
								'data-info': e.windowInfo
							});							
							//切换1,4,9,16分屏
							tempLyt.swScreen(e.windowInfo, ele);							
							var num = ele.find('.smscreen').length;
							if (num){								
							    ele.find('.cel-screen').css('background', 'url(/module/common/images/bg/clyt-' + num + '.png) no-repeat scroll 0 0');
							}
							//new tvDetailM().offWall() //下墙							
							jQuery.each(stream,function(i,o){
								var	smele = jQuery('.tv[data-id="'+e.id+'"]').find('.smscreen[data-id="'+(parseInt(o.window)+1)+'"]');														
								smele.attr({
									'data-title': o.title,
									'data-status': o.status,
									'data-stream': o.stream,
									'data-cameraid': o.cameraId
								}).text(o.title).css('background-image','');
								if (smele.find('.cls').length === 0) {
								    smele.append('<i class="cls" title="下墙"></i><i class="real-stream" title="播放视频"></i>');
							    }
							    //已经上墙的相机在左侧分组中找到对应的增加上墙选中状态
							    jQuery("#camerasPanel .tree").find(".node li[data-id="+ o.cameraId +"]").addClass("selected");
							})					
							if (ele.hasClass('tv-mask')){
								ele.removeClass('tv-mask');
							}																										
						} else {
							ele.addClass('tv-mask');							
							ele.find('.tvinner1>div').css('line-height',ele.find('.tvinner1').height() + 'px').text('暂时无法连接！');
						}
						//长度大于2表示电视墙上有流
						if(e.streamStatus && e.streamStatus.length > 2){
							allOffWallIsUsed = true;
						}
					});
                    if(allOffWallIsUsed){
                    	jQuery(".allOffWall span").removeClass('disabled');
                    }else{
                    	jQuery(".allOffWall span").addClass('disabled');
                    }
				} else {
					notify.error(res.data.message);
				}
			})
		},
		/**
		 * [loadEvent description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
		loadEvent: function() {
			this.loadLytData();
		},
		/**
		 * [loadLytemp 渲染布局选择框以及详细布局信息]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		loadLytemp: function(data) {
			var that = this;
			//获取模板内容，并且获取从后台拿到的布局种类，渲染电视墙中布局选择框
			ajaxModel.getTml(that.templateUrl).then(function(tem) {
				if (tem) {
					var template = Handlebars.compile(tem);
					jQuery(".changeLyt select").html(template({
						"showLyt": data
					}));
					//(疑问：这里渲染模板调用了两次)
					that.initChecked();//渲染当前布局选择框所对应的布局的详细信息到布局模板
					that.spiltScreentemp(data.layouts);//对每一个布局进行内部div计算
					//获取当前默认布局(如果存在)或者所有布局中第一个布局信息，并渲染
					that.chooseInitlyt(data);
					that.selectValue = jQuery(".changeLyt select").val();//获取当前选中布局的name

					window.oldName = jQuery(".changeLyt select").val();
				}
			});
		},
		/**
		 * [initChecked 渲染当前布局选择框所对应的布局的详细信息到布局模板]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
		initChecked: function() {
			var that = this;
			//将布局选择框所占的option赋值给$dom
			var $dom = jQuery(".changeLyt select option");
			if ($dom.length === 0) {
				return;
			}
			//将所有种类中第1个option取出
			$dom = $dom.eq(0);
			var lytArr = that.options.lytdata.data,
				selfid = $dom.attr("data-id"),
				/*获取布局选择框中第一个option所对应的布局的具体详细信息
				（creatId: "1" defaultValue: "1" id: "1" monitorLayout: Array[4] name: "aa"）
				*/
				obj = that.getclickLytbyid(lytArr, selfid).lyta;

			that.changeCss($dom.find(".ty"));
			//将获取到的详细布局信息在布局模板渲染，并添加样式等
			tempLyt.renderDetailMode(obj);
			if (window.tvWallIntv) {
				clearInterval(window.tvWallIntv);
			}
			
		},
		/**
		 * [spiltScreentemp 对每一个布局进行内部div计算]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   currentSplit [description]
		 * @return {[type]}                [description]
		 */
		spiltScreentemp: function(currentSplit) {
			for (var i = 0; i < currentSplit.length; i++) {
				var currentSplitnum = currentSplit[i].monitorLayout;
				var lytid = currentSplit[i].id;
				this.mathScreen(lytid, currentSplitnum);
			}

		},
		/**
		 * [dragWalldiv 电视墙拖动]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
		dragWalldiv: function() {
			var containdiv = "";
			if ($("#gismap")) {
				containdiv = $("#gismap");
			}
			$(".tvList ul").draggable({
				zIndex: 10000,
				snap: false,
				cursor: "pointer",
				scrollSensitivity: 10,
				scrollSpeed: 1,
				stop: function(event, ui) {
					event.stopPropagation();
					if (ui.position.left < -1000) {
						ui.position.left = -1000;
					}
				}
			});
		},
		/**
		 * [chooseInitlyt 选择初始化加载时要加载的详细布局信息：1、已经设置的默认的布局2、没有设置默认情况下，取所有布局的第一个布局]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		chooseInitlyt: function(data) {			
			var that = this;
			var defaultArr = data.layouts;
			var defaultId = "",
				currentObj = "";
			//将已有布局中设置的默认布局的id和name赋值给defaultId和defaultName
			if($("#userEntry").data("truename") === "administrator"){
				for (var i = 0; i < defaultArr.length; i++) {
					if (defaultArr[i].isAdminStatus) {
						defaultId = defaultArr[i].id;
						defaultName = defaultArr[i].name;
					}
				}
			}else{
				for (var i = 0; i < defaultArr.length; i++) {
					if (defaultArr[i].status) {
						defaultId = defaultArr[i].id;
						defaultName = defaultArr[i].name;
					}
				}
			}
			
			//如果没有默认布局，取第一个布局
			if (!defaultId) {
				defaultId = defaultArr[0].id;
				that.rendLoop(defaultId)  //渲染窗口内分屏格子
			}
			//选中默认布局
			// jQuery(".changeLyt").removeClass("active");
			if (defaultId) {
				//设置布局选择框中当前哪一个处于选中状态
				jQuery(".changeLyt .lytname[data-id=" + defaultId + "]").prop("selected", true);
				//获取布局选择框中当前选中布局的具体详细布局信息
				currentObj = that.getclickLytbyid(that.options.lytdata.data, defaultId).lyta;
				//详细布局信息渲染布局模板
				tempLyt.renderDetailMode(currentObj);
				that.rendLoop(defaultId)  //渲染窗口内分屏格子
			}
			
		},
		/**
		 * [mathScreen 计算系统配置中布局样式框]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   lytid           [description]
		 * @param  {[type]}   currentSplitnum [description]
		 * @return {[type]}                   [description]
		 */
		mathScreen: function(lytid, currentSplitnum) {
			var lytInner = jQuery(".lytname[data-id=" + lytid + "] .tv-screen .innerty");
			for (var j = 0; j < currentSplitnum.length; j++) {
				lytInner.append("<div class='inneryl'></div>");
			}
			var num = Math.sqrt(currentSplitnum.length),
				lytInnl = jQuery(".lytname[data-id=" + lytid + "] .tv-screen .innerty .inneryl");
			if (num === 1) {
				lytInnl.width(lytInner.width());
				lytInnl.height(lytInner.height());
			} else {
				if (num > parseInt(num)) {
					lytInnl.width(((lytInner.width() - parseInt(num + 1)) / parseInt(num + 1)));
					lytInnl.height(((lytInner.height() - parseInt(num + 1)) / parseInt(num + 1)));
				} else {
					lytInnl.width(((lytInner.width() - parseInt(num)) / parseInt(num)));
					lytInnl.height(((lytInner.height() - parseInt(num)) / parseInt(num)));
				}
			}
		},
		/**
		 * [loadLytData 查询初始布局]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
		loadLytData: function() {
			var that = this;
			var url = that.URLS.QUERYLAYOUTURL + "?timestamp=" + new Date().getTime();
			ajaxModel.getData(url, null, {
				cache: false,
				async: false
			}).then(function(res) {
				that.options.lytdata = res;
				if (that.options.lytdata.code === 200) {
					//如果在系统配置中没有进行布局的设置，即布局为0时
					if (that.options.lytdata.data.layouts.length === 0) {
						$('.tvHeader .changeLyt select').attr('disabled','disabled');
						$('.tvHeader .changeLyt select').append('<option>暂无布局</option>');
						if ($(".major-reset").length === 0 ) {
							notify.error("未设置任何布局或默认布局为空,请重新设置！");
						}

					} else {//已经存在布局情况
						//用已经存在的布局种类渲染布局选择框(存在默认和非默认两种情况)
						that.loadLytemp(that.options.lytdata.data);
						//判断是否有默认布局(在已有布局的情况下)
						setTimeout(function() {
							if (($("#autoMousewheel").children().length === 0) && $("#gismap").length === 0) {
								notify.error("未设置任何布局或默认布局为空,请重新设置！");
							}
						}, 2000);
					}
				} else {
					if (/inspect\/tvwall/.test(location.href.toString())){
						notify.error("获取布局数据失败！");
					}
					
				}
				$(document).on("click", "#closeWall", function() {
					//触发显示地图播放栏（如果进入时不显示，此处也不能显示，在播放栏逻辑中写）
					PubSub.publishSync("openMapVideoBar");
					//触发显示录像查询面板（录像上墙时有效）
					PubSub.publishSync("showHistoryPanel");
					//关闭电视墙
					$(".major-reset").animate({
						right: "-3000px"
					});
					if (jQuery('#ptzCamera').length){
						jQuery('#ptzCamera').remove();
					}
					window.gTvwallArrayGis = [];
					if ($("#preview") && $("#preview").length !== 0) {
						$("#preview").remove();
					}
					//清除读取状态定时器
					if(that.options.intv){
						window.clearInterval(window.tvWallIntv);
					}
				});
			});
		},
		/**
		 * [updateLatelyData description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
		updateLatelyData: function() {
			return this.options.lytdata;

		},
		/**
		 * [getclickLytbyid 获取当前布局选择框中选中的布局对应的详细布局信息
		 * (初始化时两种情况1、存在默认布局是就为默认布局的信息2、不存在时就为option中第一个对应的布局信息；
		 * 非初始化状态时就为选中哪一个即为哪一个的具体信息)]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   lytArr [description]
		 * @param  {[type]}   selfid [description]
		 * @return {[type]}          [description]
		 */
		getclickLytbyid: function(lytArr, selfid) {
			var len = lytArr.layouts.length;
			var lyta = "";
			//从后台拿到的数据中获取与第一个option匹配的布局信息并且赋值给lyta
			for (var i = 0; i < len; i++) {
				//if (lytArr.layouts[i].id === selfid) {
				if (parseInt(lytArr.layouts[i].id) === parseInt(selfid)) {	
					lyta = lytArr.layouts[i];
				}
			}
			return {
				"lyta": lyta
			};
		},
		/**
		 * [changeCss description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   cself [description]
		 * @return {[type]}         [description]
		 */
		changeCss: function(cself) {
			cself.addClass("active");
			cself.closest("li").siblings().children().children().filter(".ty").removeClass("active");
		}
	};
	//扩展屏提示问题
	if (window.isHasTvwall && window.isHasTvwall === "isHasTvwall") {
		window.isHasTvwall = null;
	}
	return new TvwallInsert();
});
