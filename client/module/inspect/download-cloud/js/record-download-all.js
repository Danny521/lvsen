/*
 * @Author: Administrator
 * @Date:   2015-03-09 18:25:31
 * @Last Modified by:   Administrator
 * @Last Modified time: 2015-06-08 18:21:22
 */
define([
	"jquery",
	"handlebars",
	"/module/inspect/download_local/download.js",
	"/module/viewlibs/common/js/AutoComplete.js",
	"jquery-ui"
], function(jQuery, Handlebars, downloadLocal, AutoComplete) {

	require(["jquery-ui-timepicker-addon"]);

	var HitoryDownLoad = window.HitoryDownLoad = {

		player: null,
		//ajax请求
		Ajax: function (url, type, data, fn) {
			var ajax = jQuery.ajax({
				url: url,
				data: data,
				cache: false,
				type: type || 'GET',
				async: true,
				success: function (res) {
					fn(res);
				},
				error: function () {
					notify.warn("获取数据异常");
				}
			});
			return ajax;
		},
		/**
		 * 历史录像批量下载需要绑定事件,因此在此对外暴露
		 */
		addEvents: function () {
			bindDialogEvents();
		},
		/**
		 * 录像入云空间
		 * @param pobj - 数据信息
		 * @constructor
		 */
		Tocloud: function (pobj) {
			var self = this;
			self.player = pobj.player;
			jQuery("#download-showList").hide();
			var getHTML = jQuery.get("/module/inspect/download-cloud/inc/down-record.html");
			var getDirs = jQuery.getJSON("/service/pcm/directoryList/0");
			jQuery.when(getHTML, getDirs).done(function (html, resdata) {
				//解决多次叠加的问题,by zhangyu on 2015/5/27
				jQuery(".download-record").remove();
				jQuery(".dialog-history").remove();

				var template = Handlebars.compile(html[0]);
				var html = template(resdata[0]);
				jQuery(document.body).append(html);
				parent.showHideMasker && parent.showHideMasker("show");
				//绑定传递过来的数据
				jQuery(".dialog-history.filedir").data("pobj", pobj);
				var path = "<span class='rootdir' filedirid='0' title='根目录'>根目录</span><span class='right-icon'></span>";
				jQuery(".dialog-history .dialog-body .filedir-path").html(path);
			}).fail(function () {
				notify.warn("后端数据接口发生异常，请重试");
			});
		},
		/**
		 * 录像本地下载
		 * @param pobj - 数据信息
		 * @constructor
		 */
		Tolocal: function (pobj) {
			var self = this;
			var data = pobj.playingdata;
			var fileName = pobj.fileName;
			var player = self.player = pobj.player;
			downloadLocal(data, fileName, player, "");
		},
		/**
		 * 录像入视图库
		 * @param pobj - 数据信息
		 * @constructor
		 */
		intoViewlibs: function (pobj) {
			var self = this;
			var index = pobj.index;
			var hisdata = pobj.hisdata;
			var cameradata = pobj.cameradata;
			var player = self.player = pobj.player;
			self.Ajax("/module/inspect/download-cloud/inc/into-viewlibs.html", "get", {}, function (res) {
				//解决多次叠加的问题,by zhangyu on 2015/5/27
				jQuery(".download-record").remove();
				//初始化入库界面
				jQuery(document.body).append(res);
				jQuery(".dialog-history.postform").data("pobj", pobj);
				//显示一二级导航
				parent.showHideMasker && parent.showHideMasker("show");
				// 地址级联
				new CommonCascade({
					firstSelect: '.dialog-history.postform .dialog-body .formlist #province',
					secondSelect: '.dialog-history.postform .dialog-body .formlist #city',
					thirdSelect: '.dialog-history.postform .dialog-body .formlist #country'
				});
				cameradata.longitude && jQuery(".dialog-history.postform #longitude").val(cameradata.longitude);
				cameradata.latitude && jQuery(".dialog-history.postform #latitude").val(cameradata.latitude);

				var list = hisdata.videos[index];
				var beginTime = list[0];
				var endTime = list[1];
				var dis = (endTime - beginTime) / 1000;
				beginTime = (Toolkit.mills2datetime(beginTime)) + ".000";
				endTime = (Toolkit.mills2datetime(endTime)) + ".000";
				jQuery(".dialog-history.postform #duration").val(dis);
				jQuery(".dialog-history.postform #enterTime").val(beginTime);
				jQuery(".dialog-history.postform #startTime").val(beginTime);
				jQuery(".dialog-history.postform #endTime").val(endTime);
				var playindex = player.playerObj.GetFocusWindowIndex();
				var attrstr = player.playerObj.GetVideoAttribute(playindex);
				if (attrstr != "ERROR" && JSON.parse(attrstr).videoType == 2) {
					var w = JSON.parse(attrstr).width;
					var h = JSON.parse(attrstr).height;
					jQuery(".dialog-history.postform #width").val(w);
					jQuery(".dialog-history.postform #height").val(h);
				}

				//初始化自动匹配输入案事件名称
				self.autoComplete = new AutoComplete({
					node: "#incidentname",
					url: '/service/pvd/get_incident_menu',
					hasSelect: true,
					hasEnter: true,
					left: "104px",
					top: "24px",
					panelClass: "suggest-panel",
					checkCallback: function () {
						jQuery("#incidentname").next('label.error').remove();
					}
				});

				jQuery("input.time.input-time").on("focus", function () {
					jQuery(this).datetimepicker({
						showSecond: true,
						dateFormat: 'yy.mm.dd',
						timeFormat: 'HH:mm:ss',
						timeText: '',
						hourText: '时',
						minuteText: '分',
						secondText: '秒',
						showAnim: ''
					}).datetimepicker('show');
				});
			});
		}
	};
	/**
	 * 下载到云空间、视图库的事件绑定
	 * @return {[type]} [description]
	 */
	var bindDialogEvents = function() {
		/**
		 * bs，1、弹出窗上的取消和关闭按钮事件；2、入云空间、入视图库的确定按钮触发关闭逻辑
		 */
		jQuery(document).off("click",".dialog-history .dialog-foot .cancel,.dialog-history .dialog-title .close").on("click", ".dialog-history .dialog-foot .cancel,.dialog-history .dialog-title .close", function() {
			//检查时间插件并关闭 by zhangyu on 2015/5/22
			if (jQuery("#ui-datepicker-div").is(":visible")) {
				jQuery("#ui-datepicker-div").hide();
			}
			//显示之前隐藏的录像查询面板
			window.showHidedHistoryPanel();
			//关闭入库窗口
			jQuery(".dialog-history").remove();
			jQuery(".download-record").remove();
			
		});

		//bs运行 下载历史录像到云空间,完成动画
		jQuery(document).off("click",".dialog-history.filedir .dialog-foot .okcancel .ok").on("click", ".dialog-history.filedir .dialog-foot .okcancel .ok", function() {
			var node = jQuery(".dialog-history.filedir");
			var offset = node.offset();
			var x0 = offset.left;
			var y0 = offset.top;
			var w0 = node.width();
			var h0 = node.height();
			var x = (x0 + w0) / 2;
			var y = (y0 + h0) / 2;
			var html = "";
			var active = jQuery(".dialog-history.filedir .dialog-body .content-list .file.active");
			//mayue 添加   只有完成重命名(名称重复时，必须键入正确的不重复的名字) 才能进行下一步操作  start
			if (jQuery('.dialog-history.filedir .dialog-body .content-list').find('input.input').is(':visible')) {
				return;
			}
			//mayue 添加   只有完成重命名(名称重复时，必须键入正确的不重复的名字) 才能进行下一步操作  end
			if (active[0]) {
				var directoryId = active.attr("filedirid");
			} else {
				var directoryId = jQuery(".dialog-history.filedir .dialog-body .content-list").attr("showfiledirid");
			}
			//var playinfo= jQuery("#ptzCamera >.content>.view.hisplay>.box>.box-body>.resultList").data("playinfo");
			var pobj = jQuery(".dialog-history.filedir").data("pobj");
			var playinfo = pobj.hisdata;
			// var index = pobj.index;  //马越修改，因为index代表的是正在播放的视频窗口
			var order = pobj.order;
			var channelid = pobj.channelid;
			if (!directoryId) {
				notify.warn("请选择一个目录");
				return;
			}
			var playedata;
			//order等于-1时  代表下载搜索开始时间到结束时间之间的历史录像
			if (order === -1) {
				playedata = playinfo.videos[0]; //数据入口时  已经约定了第一个元素用来存放数据
			} else {
				playedata = playinfo.videos[order];
			}
			//console.log("directoryId="+directoryId);
			// var playedata = playinfo.videos[order];
			var data = {
				directoryId: directoryId,
				channelId: channelid,
				beginTime: playedata[0],
				endTime: playedata[1],
				vodType: playedata[2]
			};
			jQuery.ajax({
				url: "/service/history/voddownload",
				data: data,
				cache: false,
				type: 'POST',
				async: true,
				success: function(res) {
					if (res.code == 200) {
						var w = jQuery(window).width();
						notify.info("历史录像下载任务提交成功");
						//日志记录，保存XX摄像机视频到云空间,add by wujingwen, 2015.08.11
						var startTime = Toolkit.mills2datetime(data.beginTime);
						var endTime = Toolkit.mills2datetime(data.endTime);
						if (location.href.indexOf("dispatch") >= 0) {
							logDict.insertMedialog("m1", "保存" + playinfo.name + "摄像机历史视频到云空间" + startTime + "--" + endTime, "f2");
						} else {
							logDict.insertMedialog("m1", "保存" + playinfo.name + "摄像机历史视频到云空间" + startTime + "--" + endTime, "f1");
						}
					} else {
						notify.warn("历史录像下载出错," + res.data?res.data.message:"");
					}
				},
				error: function() {
					notify.warn("历史录像下载error");
				}
			});
			//显示一二级导航
			parent.showHideMasker && parent.showHideMasker("hide");
			//关闭弹出窗
			jQuery(".dialog-history .dialog-foot .cancel,.dialog-history .dialog-title .close").trigger("click");
		});

		var getAllDir = function(id, fn) {
			jQuery.ajax({
				url: "/service/pcm/directoryList/" + id,
				type: "get",
				data: {},
				cache: false,
				dataType: "json",
				success: function(res) {
					if (res.code == 200) {
						fn(res.data);
					}
				}
			});
		};

		var JudgeNewDir = function(resdata) {
			var L = resdata.length;
			var A = [];
			for (var i = 0; i <= L - 1; i++) {
				resdata[i].name.replace(/新建文件夹(\d+)/gi, function($0, $1) {
					A.push($1);
				});
			}
			var str = "," + A.join(",") + ",";
			var L = A.length;
			for (var i = 1; i <= L; i++) {
				var s = "," + i + ",";
				if (str.indexOf(s) >= 0) {
					continue;
				} else {
					return i;
				}
			}
			return 0;
		};

		//bs 新建文件夹
		var fileIndex = window.fileIndex = 0;
		jQuery(document).off("click",".dialog-history .dialog-foot .newdir").on("click", ".dialog-history .dialog-foot .newdir", function() {
			/**
			 * bug[33626],修改为点击了新建后disabled,创建成功后remove,add by zhangyu on 2015/5/24
			 */
			jQuery(".dialog-history .dialog-foot .newdir").attr("disabled", "disabled");

			var html = '<div class="file"><span class="icon"></span><span class="title unselect"></span><input class="input" /></div>';
			fileIndex++;
			//console.info(fileIndex);
			var li = jQuery(html);
			//var N = parseInt(fileIndex);
			//li.find(".title").html("新建文件夹" + N);
			var pid = jQuery(".dialog-history .dialog-body .content-list").attr("showfiledirid");
			getAllDir(pid, function(resdata) {
				var N = JudgeNewDir(resdata);
				var data = {
					name: "新建文件夹" + N,
					parentId: pid
				};
				jQuery.ajax({
					url: "/service/pcm/save_directory_toclound",
					data: data,
					cache: false,
					type: 'POST',
					async: true,
					success: function(res) {
						if (res.code == 200) {
							li.find(".title").html("新建文件夹" + N);
							jQuery(".dialog-history .dialog-body .filedir-path span.rootdir:last").trigger("click");
							setTimeout(function() {
								jQuery(".dialog-history .dialog-body").scrollTop(1000000000);
								jQuery(".dialog-history .content-list .file:last").addClass("active");
								var nameTitle = jQuery(".dialog-history .dialog-body .content-list .file:last").find(".title");
								var html = nameTitle.html();
								nameTitle.hide();
								nameTitle.next().show();
								nameTitle.next().val("新建文件夹" + N);
								nameTitle.next().focus();
								// nameTitle.next().attr('maxlength',15);
							}, 500);
							/*
							var node=jQuery(".dialog-history .dialog-body .filedir-path span.rootdir:last");
							ShowDir(pid,node,function(){
								alert(1234);
								jQuery(".dialog-history .dialog-body").scrollTop(1000000000);
								var nameTitle=jQuery(".dialog-history .dialog-body .content-list .file:last").find(".title");
								var html=nameTitle.html();
								nameTitle.hide();
								nameTitle.next().show();
								nameTitle.next().val(data.name);
								nameTitle.next().focus();
							});*/
							notify.info("新建文件夹成功");
						}
					}
				});
			});
		});

		//bs 新建文件夹
		jQuery(document).on("contextmenu", ".dialog-history,.dialog-history .dialog-body .file span.title,#dialog-history-right>div", function(evt) {
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		});
		//bs
		jQuery(document).on("contextmenu", ".dialog-history,.dialog-history .dialog-body,.dialog-history .dialog-body .file, .dialog-history .dialog-body .file span.title", function(evt) {
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		});
		//bs
		jQuery(document).off("mousedown",".dialog-history .dialog-body .file span.title").on("mousedown", ".dialog-history .dialog-body .file span.title", function(evt) {
			// evt.preventDefault();  //马越注释
			//evt.stopPropagation();  //马越注释
			if (evt.button == 2) {
				//mayue 添加   只有完成重命名(名称重复时，必须键入正确的不重复的名字) 才能进行下一步操作  start
				if (jQuery('.dialog-history .dialog-body .input:visible').size()) {
					return;
				}
				//mayue 添加   只有完成重命名(名称重复时，必须键入正确的不重复的名字) 才能进行下一步操作  end
				jQuery(this).parent().siblings().removeClass("active");
				jQuery(this).parent().addClass("active");
				var html =
					[
						"<div id='dialog-history-right' tabindex='0'>",
						"<iframe src='about:blank'></iframe>",
						"<div class='opendir'>打开</div>",
						"<div class='rename'>重命名</div>",
						"</div>"
					].join("");
				var x = evt.clientX;
				var y = evt.clientY;
				if (jQuery("#dialog-history-right")[0]) {
					jQuery("#dialog-history-right").remove();
				}
				jQuery(document.body).append(html);
				jQuery("#dialog-history-right").css({
					left: x + 2,
					top: y + 2
				}).focus();
				return false;
			}
			//return false;//马越注释
		});

		//bs 右键打开文件夹
		jQuery(document).off("click","#dialog-history-right .opendir").on("click", "#dialog-history-right .opendir", function() {
			var selected = jQuery(".dialog-history .dialog-body .file.active");
			selected.find(".title").prev().trigger("dblclick");
			if (jQuery("#dialog-history-right")[0]) {
				jQuery("#dialog-history-right").remove();
			}
		});

		//bs 重名名
		jQuery(document).off("click","#dialog-history-right .rename").on("click", "#dialog-history-right .rename", function() {
			var selected = jQuery(".dialog-history .dialog-body .file.active");
			selected.find(".title");
			var html = selected.find(".title").html();
			var input = selected.find(".title").next();
			input.val(html).show().focus();
			selected.find(".title").hide();
		});
		//bs
		jQuery(document).off("blur","#dialog-history-right").on("blur", "#dialog-history-right", function() {
			setTimeout(function() {
				jQuery("#dialog-history-right").remove();
			}, 100);
		});

		//bs 这个应该是改名字
		jQuery(document).off("blur",".dialog-history .dialog-body .file .input").on("blur", ".dialog-history .dialog-body .file .input", function() {
			var html = jQuery(this).hide().val().trim();
			html = html.replace(/^\s+/gi, "").replace(/\s+$/gi, "");
			if (html === "") {
				notify.warn("名称不能为空，提示输入正确存储路径");
				jQuery(this).show().focus();
				return;
			}
			if (html.match(/[\\\/\:\*\?\"\<\>\|]+/g)) {
				notify.warn("含有不允许的字符，提示输入正确存储路径");
				jQuery(this).show().focus();
				return;
			}
			if(html.length > 100){
                notify.warn("名称最长为100个字符");
				jQuery(this).show().focus();
				return;
			}
			var index = jQuery(this).parent().index();
			var node = jQuery(this).prev().html(html).show();
			if (jQuery(".dialog-history .dialog-body .content-list").hasClass("small-list")) {
				node.css("display", "inline-block");
			} else {
				node.css("display", "block");
			}
			var dirs = jQuery(".dialog-history .dialog-body .content-list .file");
			var L = dirs.length;
			var A = [];
			for (var i = 0; i <= L - 1; i++) {
				if (i == index) {
					continue;
				}
				A[i] = dirs.eq(i).attr("title");
				if (html == A[i]) {
					//mayue 修改  start
					notify.warn("文件夹名称重复，请输入其他文件名");
					jQuery(this).show().focus();
					node.hide();
					//mayue 修改  end
					return;
				}
			}
			var pid = jQuery(".dialog-history .dialog-body .content-list").attr("showfiledirid");
			var data = {
				name: jQuery(this).val(),
				parentId: pid
			};

			var node = jQuery(this).parent();
			var value = jQuery(this).val(); //马越修改
			var data = {
				id: node.attr("filedirid"),
				name: value, //马越修改
				parentId: node.attr("parentId") || node.attr("parentid"),
				type: node.attr("type")
			};
			// console.log(JSON.stringify(data, null, "  "));

			jQuery.ajax({
				url: "/service/pcm/update_directory_toclound",
				data: data,
				cache: false,
				type: 'POST',
				async: true,
				success: function(res) {
					// console.log(JSON.stringify(res, null, "  "));
					if (res.code == 200) {
						if (res.data.message == "文件夹已经存在") {
							return;
						}
						notify.info("重命名成功");
						node.attr('title', value); //马越修改
					}
				}
			});
			//bug[33626]add by zhangyu on 2015/5/24
			jQuery(".dialog-history .dialog-foot .newdir").removeAttr("disabled");
		});
		//bs
		jQuery(document).off("click",".dialog-history .dialog-body .file .icon").on("click", ".dialog-history .dialog-body .file .icon", function() {

		});
		//bs
		jQuery(document).off("click",".dialog-history .dialog-body .file").on("click", ".dialog-history .dialog-body .file", function() {
			jQuery(this).siblings().removeClass("active");
			jQuery(this).addClass("active");
		});
		/**
		 * [reshowFiledirPath 文件路径栏的显示  仿照百度云盘]
		 * @author Mayue
		 * @date   2015-05-28
		 * @return {[type]}   [description]
		 */
		var reshowFiledirPath = function() {
			var allWidth = jQuery('.filedir-path').width();
			var iconWidth = jQuery('.right-icon').width();
			var rootWidth = jQuery('.rootdir').width();
			var usableWidth = allWidth - iconWidth - rootWidth;
			var insertMore = function() {
				removeMore();
				if (jQuery('.rootdir.hided').size() > 0) {
					jQuery('.rootdir').eq(0).next().after('<span class="rootdir more" filedirid="" title="更多">...</span><span class="right-icon more"></span>');
				}
			};
			var removeMore = function() {
				jQuery('.filedir-path').find('.rootdir.more').remove();
				jQuery('.filedir-path').find('.right-icon.more').remove();
			};
			var getVisibleWidth = function() {
				var w = 0;
				jQuery('.rootdir:visible').each(function(i, elm) {
					if (i !== 0) {
						w = w + jQuery(elm).width() + iconWidth;
					}
				});
				return w;
			};
			var init = function() {
				removeMore();
				jQuery('.filedir-path').find('.rootdir.hided').removeClass('hided');
				jQuery('.filedir-path').find('.right-icon.hided').removeClass('hided');
			};
			var checkeWidth = function() {
				if (getVisibleWidth() > usableWidth) {
					jQuery('.rootdir:visible').eq(1).next().addClass('hided');
					jQuery('.rootdir:visible').eq(1).addClass('hided');
					return checkeWidth();
				} else {
					insertMore();
				}
			};
			init();
			checkeWidth();
		};
		//bs 显示文件夹列表
		var ShowDir = function(pid, obj, fn) {
			var getDirs = jQuery.getJSON("/service/pcm/directoryList/" + pid);
			var name = jQuery(obj).attr("title");
			var name0 = name;
			/*马越删除  因为有reshowFiledirPath函数的功能*/
			/*if (name && name.length >= 30) {
				name0 = name.substr(0, 30);
				name0 = name0 + "...";
			}*/
			var getList = function(A) {
				var L = A.length;
				var html = "";
				for (var i = 0; i <= L - 1; i++) {
					var str = [
						"<div class='file'",
						" title='" + A[i].name + "'",
						" filedirid='" + A[i].id + "'",
						" type='" + A[i].type + "'",
						" userId='" + A[i].userId + "'",
						" parentId='" + A[i].parentId + "'",
						" storageTime='" + A[i].storageTime + "'>",
						"<span class='icon'></span>",
						"<span class='title unselect'>" + A[i].name + "</span>",
						"<input class='input'/>",
						"</div>"
					].join("");
					html = html + str;
				}
				return html;
			};

			jQuery.when(getDirs).done(function(res) {
				var A = res.data;
				//if(A.length==0){return}
				var html = getList(A);
				jQuery(".dialog-history .dialog-body .content-list").html(html);
				jQuery(".dialog-history .dialog-body .content-list").attr("showfiledirid", pid);
				var path = "<span class='rootdir' filedirid='" + pid + "' title='" + name + "'>" + name0 + "</span><span class='right-icon'></span>";
				if (!jQuery(".dialog-history .dialog-body .filedir-path .rootdir[filedirid='" + pid + "']")[0]) {
					jQuery(".dialog-history .dialog-body .filedir-path").append(path);
				}
				reshowFiledirPath(); //马越添加
			});
		};
		//bs
		jQuery(document).off("click",".dialog-history .dialog-body .filedir-path .rootdir").on("click", ".dialog-history .dialog-body .filedir-path .rootdir", function() {
			if (jQuery(this).hasClass('more')) {
				return;
			} //马越添加  因为有reshowFiledirPath函数的功能
			var pid = jQuery(this).attr("filedirid");
			ShowDir(pid, this);
			jQuery(this).next().nextAll().remove();
		});

		//bs 双击打开文件夹，列出其中的子文件夹
		jQuery(document).off("dblclick",".dialog-history .dialog-body .file").on("dblclick", ".dialog-history .dialog-body .file", function() {
			/*mayue 添加   如果重命名输入框还存在的话  不允许打开文件 start*/
			if (jQuery(this).children('.input').is(':visible')) {
				return false;
			}
			/*mayue 添加   如果重命名输入框还存在的话  不允许打开文件 end*/
			var pid = jQuery(this).attr("filedirid");
			ShowDir(pid, this);
		});
		//bs
		jQuery(document).off("click",".dialog-history .dialog-title .tab .list").on("click", ".dialog-history .dialog-title .tab .list", function() {
			jQuery(this).siblings().removeClass("active");
			jQuery(this).addClass("active");
			jQuery(".dialog-history .dialog-body .big-list").removeClass("big-list").addClass("small-list");
			jQuery(".dialog-history .dialog-body .small-list span").css("display", "inline-block");
			/*马越添加  展示模式切换的时候  是需要考虑重命名框是否存在的问题的 start*/
			jQuery('.dialog-history .dialog-body .input:visible').each(function(index, elm) {
				jQuery(elm).siblings('.title').hide();
			});
			/*马越添加  展示模式切换的时候  是需要考虑重命名框是否存在的问题的 end*/
		});
		//bs
		jQuery(document).off("click",".dialog-history .dialog-title .tab .thumb").on("click", ".dialog-history .dialog-title .tab .thumb", function() {
			jQuery(this).siblings().removeClass("active");
			jQuery(this).addClass("active");
			jQuery(".dialog-history .dialog-body .small-list").removeClass("small-list").addClass("big-list");
			/*马越添加  展示模式切换的时候  是需要考虑重命名框是否存在的问题的 start*/
			jQuery('.dialog-history .dialog-body .input:visible').each(function(index, elm) {
				jQuery(elm).siblings('.title').hide();
			});
			/*马越添加  展示模式切换的时候  是需要考虑重命名框是否存在的问题的 end*/
		});
		//bs
		jQuery(document).off("click",".dialog-history.postform .must-write").on("click", ".dialog-history.postform .must-write", function() {
			jQuery(this).siblings().removeClass("active");
			jQuery(this).addClass("active");
			jQuery(".dialog-history.postform .must").show();
			jQuery(".dialog-history.postform .option").hide();
		});
		//bs
		jQuery(document).off("click",".dialog-history.postform .option-write").on("click", ".dialog-history.postform .option-write", function() {
			jQuery(this).siblings().removeClass("active");
			jQuery(this).addClass("active");
			jQuery(".dialog-history.postform .option").show();
			jQuery(".dialog-history.postform .must").hide();
		});

		//bs 关闭对话框
		jQuery(document).off("click",".close-panel").on("click", ".close-panel", function() {
			jQuery(".incident-panel-layer.incident-panel-group").remove();
			jQuery("#incidentPanel").remove();
		});

		//bs 添加至已有案件
		jQuery(document).off("click",".dialog-history.postform #existingIncident").on("click", ".dialog-history.postform #existingIncident", function() {
			jQuery("#incidentname").attr("disabled", false);
		});
		//bs
		jQuery(document).off("click",".dialog-history.postform #unIncident,.dialog-history.postform #createIncident").on("click", ".dialog-history.postform #unIncident,.dialog-history.postform #createIncident", function() {
			jQuery("#incidentname").attr("disabled", true);
		});

		jQuery(document).off("dblclick",".dialog-history .dialog-foot .okcancel .ok").on("dblclick", ".dialog-history .dialog-foot .okcancel .ok", function(evt) {
			evt.preventDefault();
			evt.stopPropagation();
		});

		//bs
		jQuery(document).off("click",".dialog-history.postform .dialog-foot .okcancel .ok").on("click", ".dialog-history.postform .dialog-foot .okcancel .ok", function() {
			/*var cdata=jQuery(".win-dialog.history-record").data("cdata");
			var hisdata=jQuery(".win-dialog.history-record").data("hisdata");
			var order=jQuery("#download-showList").data("order");
			var channelid=jQuery(".win-dialog.history-record").data("channelid");
			var index=cdata.index;
			var videos=hisdata.videos;
			*/
			var pobj = jQuery(".dialog-history.postform").data("pobj");
			var incidentId = "";
			if (jQuery("#existingIncident").prop("checked")) {
				//incidentId=jQuery("#incidentname").val();
				incidentId = jQuery("#incidentname").attr("incidentId");
			}

			var province = jQuery(".dialog-history.postform #province").val();
			var city = jQuery(".dialog-history.postform #city").val();
			var country = jQuery(".dialog-history.postform #country").val();
			var streets = jQuery(".dialog-history.postform #streets").val();

			var _province = jQuery(".dialog-history.postform #province option:selected").text();
			var _city = jQuery(".dialog-history.postform #city option:selected").text();
			var _country = jQuery(".dialog-history.postform #country option:selected").text();

			var location = _province + " " + _city + " " + _country + " " + streets;

			//var channelId=window.SelectCamera.Channelid;
			//var playinfo=window.SelectCamera.searchData;
			var channelId = pobj.channelid;
			var playinfo = pobj.hisdata;
			var vodType = playinfo.videos[0][2];

			var container = jQuery(".dialog-history.postform .dialog-body");
			var remark = setRemark.getText(container);

			if (jQuery(".dialog-history.postform #file_format").val() === "") {
				notify.warn("文件格式不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #shootTime").val() === "") {
				notify.warn("拍摄时间不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #category").val() === "") {
				notify.warn("分类不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #name").val() === "") {
				notify.warn("提名不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #description").val() === "") {
				notify.warn("内容描述不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #province").val() === "") {
				notify.warn("拍摄地点省不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #city").val() === "") {
				notify.warn("拍摄地点市不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #country").val() === "") {
				notify.warn("拍摄地点县不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #longitude").val() === "") {
				notify.warn("拍摄地点经度不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #latitude").val() === "") {
				notify.warn("拍摄地点纬度不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #duration").val() === "") {
				notify.warn("视频长度不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #enterTime").val() === "") {
				notify.warn("视频入点不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #startTime").val() === "") {
				notify.warn("视频开始时间不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #endTime").val() === "") {
				notify.warn("视频结束时间不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #width").val() === "") {
				notify.warn("视频宽度不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #height").val() === "") {
				notify.warn("视频高度不能为空");
				return;
			}
			if (jQuery(".dialog-history.postform #height").val() === "") {
				notify.warn("视频高度不能为空");
				return;
			}
			var enterTime = jQuery(".dialog-history.postform #enterTime").val().replace(/-/gi, "/").replace(/\.\d\d\d$/gi, "");
			var startTime = jQuery(".dialog-history.postform #startTime").val().replace(/-/gi, "/").replace(/\.\d\d\d$/gi, "");
			var endTime = jQuery(".dialog-history.postform #endTime").val().replace(/-/gi, "/").replace(/\.\d\d\d$/gi, "");

			enterTime = (new Date(enterTime)).getTime();
			startTime = (new Date(startTime)).getTime();
			endTime = (new Date(endTime)).getTime();
			//console.log([enterTime,startTime,endTime]);

			var data = {
				"channelId": channelId,
				"vodType": vodType,
				"fileType": "1", //视频就是1，图片是2
				"incidentId": "null",
				//"createIncident":null,
				"fileFormat": jQuery(".dialog-history.postform #file_format").val(),
				"shootTime": jQuery(".dialog-history.postform #shootTime").val(),
				"category": jQuery(".dialog-history.postform #category").val(),
				"name": jQuery(".dialog-history.postform .dialog-body .formlist #name").val(),
				"description": jQuery(".dialog-history.postform #description").val(),
				"province": province,
				"city": city,
				"country": country,
				"streets": streets,
				"longitude": jQuery(".dialog-history.postform #longitude").val() - 0,
				"latitude": jQuery(".dialog-history.postform #latitude").val() - 0,
				"duration": parseInt(jQuery("#duration").val() - 0),
				"enterTime": enterTime, //jQuery("#enterTime").val(),
				"startTime": startTime, //jQuery("#startTime").val(),
				"endTime": endTime, //jQuery("#endTime").val(),
				"width": jQuery(".dialog-history.postform #width").val() - 0,
				"height": jQuery(".dialog-history.postform #height").val() - 0,
				"sourceId": jQuery(".dialog-history.postform #source_id").val(),
				"device": jQuery(".dialog-history.postform #device").val(),
				"codeFormat": jQuery(".dialog-history.postform #code_format").val(),
				"supplement": jQuery(".dialog-history.postform #supplement").val(),
				"earmark": jQuery(".dialog-history.postform #earmark").val(),
				"subject": jQuery(".dialog-history.postform #subject").val(),
				"keywords": jQuery(".dialog-history.postform #keywords").val(),
				"keyman": jQuery(".dialog-history.postform #keyman").val(),
				"secrecy": jQuery(".dialog-history.postform #secrecy").val(),
				"language": jQuery(".dialog-history.postform #language").val(),
				"picker": jQuery(".dialog-history.postform #picker").val(),
				"pickerCompany": jQuery(".dialog-history.postform #picker_company").val(),
				"quality": jQuery(".dialog-history.postform #quality").val() - 0,
				"pic": "",
				"location": location,
				"remark": remark
			};
			var incident_id = jQuery("#createIncident").attr("incident_id");
			if (incident_id) {
				data.incidentId = incident_id;
			}
			if (jQuery("#existingIncident").prop("checked")) {
				//	data.incidentId = jQuery("#incidentname").attr("data-id");
				if(! HitoryDownLoad.autoComplete.hasMatching){
					jQuery("#incidentname").val("");
                    notify.warn("该案事件不存在，请重新输入!");
					return;
				}
				if(!(HitoryDownLoad.autoComplete.matchingName.indexOf(jQuery("#incidentname").val().trim()) > -1)){
                     jQuery("#incidentname").val("");
                     notify.warn("该案事件不存在，请重新输入!");
                     return;
				}
				if (jQuery("#incidentname").val().trim() === "") {
					notify.warn("案事件名称不能为空！");
					return;
				}
				data.incidentId = jQuery("#incidentname").val().trim();
			}
			var nodeok = jQuery(".dialog-history.postform .dialog-foot .okcancel .ok");

			if (nodeok.html() == "保存信息") {
				var data = JSON.stringify(data);
				data = JSON.parse(data);
				jQuery(".dialog-history .dialog-foot .cancel,.dialog-history .dialog-title .close").trigger("click");
				if (HitoryDownLoad.ivd) {
					HitoryDownLoad.ivd.abort();
				}
				HitoryDownLoad.ivd = HitoryDownLoad.Ajax("/service/history/imageVideoDownload", "POST", data, function(res) {
					if (res.code == 200) {
						notify.info("入库信息提交成功！");
						//日志记录，XX摄像机视频入库,add by wujingwen, 2015.08.11
						var startTime = Toolkit.mills2datetime(data.startTime);
						var endTime = Toolkit.mills2datetime(data.endTime);
						logDict.insertMedialog("m1", playinfo.name + "摄像机历史视频入库" + startTime + "--" + endTime);

					} else {
						notify.warn("入库信息提交失败请重试！");
					}
				});
			} else {
				data.incidentId = jQuery("#createIncident").attr("incident_id") + "";
			}

			if (nodeok.html() == "下一步" && jQuery("#createIncident").prop("checked")) {
				var getHTML = jQuery.get("/module/inspect/download-cloud/inc/viewlibs-1.html");
				jQuery.when(getHTML).done(function(res) {
					var template = Handlebars.compile(res);
					var html = template({
						incident: {}
					});
					jQuery(document.body).append(html);
				});
				return;
			}
		});
		//bs
		jQuery(document).off("click",".dialog-history.postform .dialog-body input[name='createIncident']").on("click", ".dialog-history.postform .dialog-body input[name='createIncident']", function() {
			var nodeok = jQuery(".dialog-history.postform .dialog-foot .okcancel .ok");
			if (jQuery(this).attr("id") == "createIncident") {
				nodeok.html("下一步");
			} else {
				nodeok.html("保存信息");
			}
		});

		jQuery(document).off("focus",".input-time").on("focus", ".input-time", function() {
			jQuery(this).datetimepicker({
				showSecond: true,
				dateFormat: 'yy-mm-dd',
				timeFormat: 'HH:mm:ss',
				timeText: '',
				hourText: ' 时',
				minuteText: ' 分',
				secondText: ' 秒',
				showAnim: ''
			}).datetimepicker('show');
		});
		};


	window.onCreateIncident = function(param) {
		notify.info("创建案事件成功！");
		jQuery("#createIncident").attr("incident_id", param.id);
		jQuery("#incidentPanel a.close-panel").trigger("click");
		var nodeok = jQuery(".dialog-history.postform .dialog-foot .okcancel .ok");
		nodeok.html("保存信息");
		nodeok.addClass("needclose");
		jQuery(".dialog-history.postform .dialog-foot .okcancel .ok").trigger("click");
	};

	return HitoryDownLoad;
});