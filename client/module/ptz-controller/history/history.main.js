define([
	"jquery",
	"/component/base/self/toolkit.js",
	"jquery-ui"
], function(jQuery, ToolFun) {

	require(["/libs/jquery/jquery-ui-timepicker-addon.js"]);

	var Toolkit = ToolFun.init();

	var OnBeforeNavigate2 = window.OnBeforeNavigate2 = function(data){
		jQuery("#input-data").val(data);
		var html = "<iframe id='OnBeforeNavigate2' etype='input' eid='input-data' src='about:blank' style='width:0px;height:0px;'></iframe>";
		jQuery(document.body).append(html);
		window.setTimeout(function() {
			if (jQuery("#OnBeforeNavigate2")[0]) {
				jQuery("#OnBeforeNavigate2").remove();
			}
		}, 1000);
	};
	/**
	 * 高亮某一条录像记录
	 * @param {[type]} order [description]
	 */
	var addActive = window.addActive = function(order) {

		jQuery("#history-list  ul  li:eq(" + (order) + ")").addClass("active").siblings("li").removeClass("active");
		jQuery("#history-list  ul  li").css("background-image", "none");
		jQuery("#history-list  ul  li:eq(" + (order) + ")").css({
			"background-image": "url('/module/ptz-controller/images/play.png')",
			"background-repeat": "no-repeat",
			"background-position": "5px 10px"
		});
	};

	/**
	 * 这个函数window下的，给OCX调用的，用于ocx给本窗口注入数据
	 * @param  {[type]} data [待注入的数据]
	 * @return {[type]}      [description]
	 */
	var importData = window.importData = function(data) {
		jQuery("#loading").hide();
		var obj = JSON.decode(data);
		jQuery(".win-dialog.history-record").data("cdata", obj);
		jQuery(".search-history button.search").trigger("click", {
			"mark": "auto"
		});
		//如果是电视墙模块，则隐藏下载按钮
		if (obj.fromModule === "form_tvwall") {
			jQuery(".search-history").find(".download, .marks").hide();
		}
	};
	/**
	 * 时间格式化函数
	 * @param  {[type]} format [description]
	 * @return {[type]}        [description]
	 */
	Date.prototype.format = function(format) {
		var o = {
			"M+": this.getMonth() + 1, //month
			"d+": this.getDate(), //day
			"h+": this.getHours(), //hour
			"m+": this.getMinutes(), //minute
			"s+": this.getSeconds(), //second
			"q+": Math.floor((this.getMonth() + 3) / 3), //quarter
			"S": this.getMilliseconds() //millisecond
		};

		if (/(y+)/.test(format)) {
			format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
		}

		for (var k in o) {
			if (new RegExp("(" + k + ")").test(format)) {
				format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
			}
		}
		return format;
	};

	var HistoryDeal = function() {

		var Events = {};
		/**
		 * 初始化
		 * @return {[type]} [description]
		 */
		this.init = function() {
			var self = this;
			//模拟登录
			self.login();
			//绑定事件
			self.bindEvents();
		};
		/**
		 * [fireEvent 注册事件，和mootools fireEvent以及jq的trigger类似]
		 * @author huzc
		 * @date   2015-04-21
		 * @param  {[type]}   name [description]
		 * @param  {[type]}   obj  [description]
		 * @return {[type]}        [description]
		 */
		this.fireEvent = function(name, obj) {
			var Fn = Events[name];
			if (Fn) {
				var L = Fn.length;
				for (var i = 0; i <= L - 1; i++) {
					Fn[i](obj);
				}
			}
		};
		/**
		 * [on 绑定事件]
		 * @author huzc
		 * @date   2015-04-21
		 * @param  {[type]}   name [description]
		 * @param  {Function} fn   [description]
		 * @return {[type]}        [description]
		 */
		this.on = function(name, fn) {
			if (!Events[name]) {
				Events[name] = [];
			}
			Events[name].push(fn);
		};
		/**
		 * 模拟登录
		 * @return {[type]} [description]
		 */
		this.login = function() {
			jQuery(function() {

				var data = location.hash;
				data = data.replace(/^#/gi, "");
				/*data = unescape(data);
				try {
					var userinfo = JSON.decode(data);
				} catch (e) {
					return;
				}*/
				jQuery.ajax({
					url: "/service/changeCookie",
					type: "post",
					dataType: "json",
					beforeSend: function() {
						Cookie.write("JSESSIONID", data, {
							duration: 0
						});
					},
					success: function(res) {
						if (res && res.code == 200) {}
					},
					error: function() {
						alert("error");
					},
					headers: {
						"webdialog": "true"
					}
				});
			});
		};
		/**
		 * 事件绑定
		 * @return {[type]} [description]
		 */
		this.bindEvents = function() {
			var self = this;

			//先引入,绑定时间插件
			jQuery(document).on('focus', '.datetime-picker-small', function() { //再调用
				jQuery('.datetime-picker-small').datetimepickerSmall();
			});
			//单击选中
			jQuery(document).on("click", ".win-dialog.history-record .win-dialog-body #history-list ul li", function() {
				jQuery(this).siblings().css({
					"background-image": "none"
				});
				jQuery(this).siblings().removeClass("active");
				jQuery(this).addClass("active");
				jQuery(this).css({
					"background-image": "url('/module/ptz-controller/images/play.png')",
					"background-repeat": "no-repeat",
					"background-position": "5px 10px"
				});
			});
			//双击播放
			jQuery(document).on("dblclick", ".win-dialog.history-record .win-dialog-body #history-list ul li", function() {
				jQuery(this).siblings().css({
					"background-image": "none"
				});
				jQuery(this).siblings().removeClass("active");
				jQuery(this).addClass("active");
				jQuery(this).css({
					"background-image": "url('/module/ptz-controller/images/play.png')",
					"background-repeat": "no-repeat",
					"background-position": "5px 10px"
				});
				jQuery(this).find(".play").trigger("click");
			});

			//点击搜索按钮查询历史录像片段
			jQuery(document).on("click", ".search-history button.search", function(event, datee) {
				var initData = '';
				if (datee && datee.mark) {
					initData = datee.mark;
				}
				var data = jQuery(".win-dialog.history-record").data("cdata");
				var html = "<div style='padding-top:10px;'><div class='hline'>正在查询中...</div></div>";
				jQuery("#history-record #history-list").html(html);
				var A = self.givePlayTime();
				/*--------当开始时间和结束时间为空时，才给输入givePlayTime的值   mayue修改--start------*/
				if (jQuery(".win-dialog.history-record #startTime").val() === '') {
					if (data.setTimeToOut === undefined) {
						jQuery(".win-dialog.history-record #startTime").val(A[0]);
					} else {
						jQuery(".win-dialog.history-record #startTime").val(data.setTimeToOut.startTime);
					}

				}

				if (jQuery(".win-dialog.history-record #endTime").val() === '') {
					if (data.setTimeToOut === undefined) {
						jQuery(".win-dialog.history-record #endTime").val(A[1]);
					} else {
						jQuery(".win-dialog.history-record #endTime").val(data.setTimeToOut.endTime);
					}

				}

				if (jQuery(".win-dialog.history-record #startTime").val() !== '' && jQuery(".win-dialog.history-record #endTime").val() !== '') {
					if (initData != "auto") {
						if (!data.flag) {
							var mes = JSON.encode({
								"type": "setTimeToOut",
								"startTime": jQuery(".win-dialog.history-record #startTime").val(),
								"endTime": jQuery(".win-dialog.history-record #endTime").val()
							});
							OnBeforeNavigate2(mes);
						}
					}
				}
				/*--------当开始时间和结束时间为空时，才给输入givePlayTime的值   mayue修改--end------*/
				setTimeout(function() {
					self.getHistory(data, initData);
				}, 200);
			});

			//搜索事件
			self.on("search", function(obj) {
				var data = obj.data;
				var flag = obj.flag;
				var initData = obj.initData;
				if (flag) {
					var selector = "#history-list  ul  li .play:eq(0)";
					//if(initData != "auto"){
					jQuery(selector).trigger("click");
					//}
				}
			});

			//选中一段录像播放，在webdialog里执行
			jQuery(document).on("click", "#history-list  ul  li span.play", function() {
				/**
				 * bug【33458】经排查发现，实体摄像机（非模拟）在切换播放历史录像的时候会出现
				 * 复现路径：在同一个历史录像片段上多次频繁点击时
				 * 2015.05.30鉴定时此问题不做处理，后续张向阳和飞虎跟踪处理。
				 * 当前添加延迟定时器，即1s以内只可点击一次，用以规避
				 * begin
				 * add by zhangyu on 2015/5/24
				 */
				var self = this;
				if (!self.isForbidClick) {
					self.isForbidClick = true;
					self.delayTimer = window.setTimeout(function() {
						self.isForbidClick = false;
					}, 1000);
				} else {
					return;
				}
				/********************end******************/

				//播放片段历史录像
				if (location.href.match(/\/monitor\//gi)) {
					return;
				}
				jQuery(this).parent().parent().siblings("li").removeClass("active");
				jQuery(this).parent().parent().addClass("active");
				var cdata = jQuery(".win-dialog.history-record").data("cdata");
				var hisdata = jQuery(".win-dialog.history-record").data("hisdata");
				var order = jQuery(this).parent().parent().index();
				var channelid = jQuery(".win-dialog.history-record").data("channelid");
				var index = cdata.index;
				/**
				 * 本来是传入搜索的开始和结束时间，但由于查询事件太大的话，有很大一段时间没有录像，
				 * 导致ocx无法计算播放进度，故此处仍传递查询时间段内，有录像的开始时间和结束时间
				 * add by zhangyu, 2015.11.10
				 */
				var L = hisdata.videos.length,
					beginTime = hisdata.videos[0][0],
					endTime = hisdata.videos[L - 1][1],

					data = JSON.encode({
						"type": "playVideo",
						"cameradata": cdata,
						"hisdata": hisdata,
						"order": order,
						"index": index,
						"channelid": channelid,
						"cameraId": cdata.cId || cdata.cameraId,
						"beginTime": beginTime,
						"endTime": endTime
					});
				OnBeforeNavigate2(data);
			});
			//录像上墙事件
			jQuery(document).on("click", "#history-list  ul  li span.tvwall", function() {
				window.gTvwallArrayGis = [];
				//data播放参数的json字符串，fileName摄像机名称,path是存储路径
				var hisdata = jQuery(".win-dialog.history-record").data("hisdata");
				var channelid = jQuery(".win-dialog.history-record").data("channelid");
				var cdata = jQuery(".win-dialog.history-record").data("cdata");
				//由于录像入库是针对每一条录像片段进行的，故原来cdata.index（此值一直是0）获取的录像段索引错误,modify by zhangyu on 2015/5/23
				var index = parseInt(jQuery(this).closest("li").data("index")); //cdata.index;
				if (hisdata.videos && hisdata.videos.length === 0) {
					notify.warn("没有查到历史录像");
					return;
				}
				var eventdata = JSON.encode({
					"type": "tvWall",
					"cId": cdata.cId || cdata.id,
					"channelid": channelid,
					"beginTime": hisdata.videos[index][0],
					"endTime": hisdata.videos[index][1],
					"vodType": hisdata.videos[index][2]
				});
				//向webdialog浏览器发送消息
				OnBeforeNavigate2(eventdata);
				//如果从电视墙模块打开，则不需要隐藏
				if(cdata.fromModule === "form_tvwall"){
					return;
				}
				//隐藏录像搜索面板
				setTimeout(function() {
					OnBeforeNavigate2(JSON.stringify({
						"type": "window.hide"
					}));
				}, 100);
			});
			//下载录像到本地事件
			jQuery(document).on("mouseout", "#history-list ul > li .download-local", function(evt) {
				evt.preventDefault();
				evt.stopPropagation();
				setTimeout(function() {
					if (!jQuery("#download-showList").hasClass("active")) {
						jQuery("#download-showList").hide();
					}
				}, 200);
			});
			//录像判断选择事件
			jQuery(document).on("click", "#history-list", function(evt) {
				jQuery("#download-showList").hide();
			});
			//点击下载图标/下载录像到本地
			jQuery(document).on("click", "#history-list ul>li .download-local,.search-history .download", function(evt) {
				evt.preventDefault();
				evt.stopPropagation();
				var $this = jQuery(this),
					indexs = $this.closest("li").data("index"),
					cdata = jQuery(".win-dialog.history-record").data("cdata"),
				    userRoleScore = cdata.userRoleScore,
				    data = self.getVideo_applyData(indexs, this);
				if (!data) {
					/*搜索旁边的下载按钮不能 下载 或者没有历史录像*/
					return false;
				}
				/*判断用户是否有直接下载的权限*/
				//if (userRoleScore >= 60) {
					self.setDownLoadLis(indexs, $this, userRoleScore);
					jQuery("#download-showList .apply").hide();
					jQuery("#download-showList .local").show();
                    var klass = cdata.klass;
                    //没有保存到云空间权限，隐藏该按钮
					if(!klass["import"]){
		                jQuery("#download-showList .cloud").hide();
					}else{
						jQuery("#download-showList .cloud").show();
					}
				/*} else {
					new ConfirmDialog({
						title: '申请下载',
						width: 335,
						classes: 'dialogBox',
						//message: "<p>确定申请下载该视频？</p>",
						message: '申请理由：<textarea id="remark" style="width:195px; overflow: hidden; vertical-align: middle;"></textarea>',
						callback: function() {
							if (jQuery("#download-showList .apply").attr("data-appStatu") == "2") return;
							var indexs = jQuery("#download-showList").data("order");
							var remark = jQuery("#remark").val();
							var data = self.getVideo_applyData(indexs, remark);

							jQuery.ajax({
								url: "/service/camera/video_apply",
								data: data,
								cache: false,
								type: 'POST',
								async: true,
								success: function(res) {
									if (res.code === 200) {
										setTimeout(function() {
											OnBeforeNavigate2("window.close");
										}, 1000);
										//notify.warn(res.data.message);
										//cs窗体与bs页面交互    by    zhangxinyu    2015-9-24
										var mes = JSON.stringify({
											"type": "notify.success",
											"message": res.data.message
										});
										OnBeforeNavigate2(mes);
										logDict.insertMedialog("m10", "申请下载录像" + res.data.message);
									} else {
										//notify.warn(res.data.message);
										var mes = JSON.stringify({
											"type": "notify.warn",
											"message": res.data.message
										});
										OnBeforeNavigate2(mes);
									}
								},
								error: function() {
									notify.warn("申请失败");
								}
							})
						}
					});
				}*/
			});
			//cs
			jQuery(document).on("mouseover", "#download-showList,#download-showList div", function() {
				jQuery("#download-showList").addClass("active");
			});
			//cs
			jQuery(document).on("mouseout", "#download-showList,#download-showList div", function(evt) {
				jQuery("#download-showList").removeClass("active");
			});
			//cs
			jQuery(document).on("blur", "#download-showList .cloud,#download-showList .local", function(evt) {
				var self = this;
				setTimeout(function() {
					jQuery("#download-showList").hide();
					if (!jQuery(self).hasClass("active")) {
						//jQuery("#download-showList").hide();
					}
				}, 200);
			});

			//cs 下载历史录像到云空间
			jQuery(document).on("click", "#download-showList .cloud", function() {
				var cdata = jQuery(".win-dialog.history-record").data("cdata");
				var hisdata = jQuery(".win-dialog.history-record").data("hisdata");
				var order = jQuery("#download-showList").data("order");
				var channelid = jQuery(".win-dialog.history-record").data("channelid");
				var index = cdata.index;
				var eventdata = JSON.stringify({
					"type": "download-record-cloud",
					"cameradata": cdata,
					"hisdata": hisdata,
					"order": order,
					"channelid": channelid,
					"index": index
				});
				/*点击下载搜索开始时间到结束时间内的录像到云空间 start   Mayue 修改*/
				if (order === -1) {
					var eventdataObj = JSON.parse(eventdata);
					var tem = eventdataObj.hisdata.videos[0];
					var vodType = tem ? tem[2] : 0; //深度默认取第一个的深度
					eventdataObj.hisdata.videos.length = 0;
					var beginTime = jQuery.trim(jQuery('.win-dialog-body').find('#startTime').val());
					var endTime = jQuery.trim(jQuery('.win-dialog-body').find('#endTime').val());
					beginTime = Toolkit.str2mills(beginTime);
					endTime = Toolkit.str2mills(endTime);
					eventdataObj.hisdata.videos.push([beginTime, endTime, vodType]);
					eventdata = JSON.stringify(eventdataObj);
				}
				/*点击下载搜索开始时间到结束时间内的录像到云空间 end*/
				//向webdialog浏览器发送消息
				OnBeforeNavigate2(eventdata);
				//最小化录像面板
				setTimeout(function() {
					OnBeforeNavigate2(JSON.stringify({
						"type": "window.hide"
					}));
				}, 100);
			});

			//cs下载历史录像到本地
			jQuery(document).on("click", "#download-showList>.local", function() {
				setTimeout(function() {
					jQuery("#download-showList").hide();
				}, 200);
				//data播放参数的json字符串，fileName摄像机名称,path是存储路径
				var cdata = jQuery(".win-dialog.history-record").data("cdata");
				var hisdata = jQuery(".win-dialog.history-record").data("hisdata");
				var order = jQuery("#download-showList").data("order");
				var channelid = jQuery(".win-dialog.history-record").data("channelid");
				//由于录像入库是针对每一条录像片段进行的，故原来cdata.index（此值一直是0）获取的录像段索引错误,modify by zhangyu on 2015/5/23
				var index = cdata.index;
				var videos = hisdata.videos;

				if (videos && videos.length === 0) {
					notify.warn("没有查到历史录像");
					return;
				}
				var beginTime;
				var endTime;
				//点击'下载'按钮   下载用户搜索框里的开始结束时间内的录像
				if (order === -1) {
					beginTime = jQuery.trim(jQuery('.win-dialog-body').find('#startTime').val()) + ".000";
					endTime = jQuery.trim(jQuery('.win-dialog-body').find('#endTime').val()) + ".000";
				} else {
					beginTime = hisdata.videos[order][0];
					endTime = hisdata.videos[order][1];
					beginTime = (Toolkit.mills2timestamp(beginTime));
					endTime = (Toolkit.mills2timestamp(endTime));
				}
				var data = {
					"type": 2,
					"user": hisdata.username,
					"passwd": hisdata.password,
					"ip": hisdata.ip,
					"port": hisdata.port,
					"path": hisdata.path,
					"vodType": order === -1 ? hisdata.videos[0][2] : hisdata.videos[order][2], //如果是针对一整段视频是不知道深度的，就去第一个历史片段的深度
					"beginTime": beginTime,
					"endTime": endTime
				};
				var eventdata = JSON.stringify({
					"type": "download-record-local",
					"cameradata": cdata,
					"hisdata": hisdata,
					"order": order,
					"channelid": channelid,
					"index": index,
					"playingdata": data,
					"fileName": hisdata.name
				});
				//向webdialog浏览器发送消息
				OnBeforeNavigate2(eventdata);
				//最小化录像面板
				setTimeout(function() {
					OnBeforeNavigate2(JSON.stringify({
						"type": "window.hide"
					}));
				}, 100);
			});
			/*用户无下载权限  申请下载*/
			jQuery(document).on("click", "#download-showList .apply", function() {
				if (jQuery("#download-showList .apply").attr("data-appStatu") == "2") return;
				var indexs = jQuery("#download-showList").data("order");
				var data = self.getVideo_applyData(indexs);
				jQuery.ajax({
					url: "/service/camera/video_apply",
					data: data,
					cache: false,
					type: 'POST',
					async: true,
					success: function(res) {
						//alert(JSON.stringify(res))
						if (res.code === 200) {
							notify.info(res.data.message);
							//最小化录像面板
							setTimeout(function() {
								OnBeforeNavigate2(JSON.stringify({
									"type": "window.hide"
								}));
							}, 100);
						} else {
							notify.warn(res.data.message);
						}
					},
					error: function() {
						notify.warn("申请失败");
					}
				});
			});
			//cs入视图库
			jQuery(document).on("click", "#history-list ul > li .into-viewlib", function() {
				// 新的视图库入库 by songxj 2016/04/07
				var $dialogHistoryRecord = jQuery(".win-dialog.history-record"),
					cameraData = $dialogHistoryRecord.data("cdata"),
					hisdata = $dialogHistoryRecord.data("hisdata"),
					channelId = $dialogHistoryRecord.data("channelid"),
					videos = hisdata.videos,
					index = parseInt(jQuery(this).closest("li").data("index")), //由于录像入库是针对每一条录像片段进行的，故原来cdata.index（此值一直是0）获取的录像段索引错误,modify by zhangyu on 2015/5/23
					beginTime = Toolkit.mills2datetime(hisdata.videos[index][0]),
					endTime = Toolkit.mills2datetime(hisdata.videos[index][1]),
					historyVideoObj = {
						type: "history",
						channelId: channelId,
						cameraId: cameraData.cId || cameraData.id, // 摄像机id
						beginTime: new Date(Date.parse(beginTime.replace(/-/g,"/"))).getTime(), // 视频开始时间
						endTime: new Date(Date.parse(endTime.replace(/-/g,"/"))).getTime(), // 视频结束时间
						vodType: hisdata.videos[index][2]
					},
					eventdata = JSON.stringify({
						"type": "download-record-viewlib",
						"historyVideoObj": historyVideoObj
					});
				if (videos && videos.length === 0) {
					notify.warn("没有查到历史录像");
					return;
				}
				// 根据type调用入库对话框
				OnBeforeNavigate2(eventdata);
				//最小化录像面板
				setTimeout(function() {
					OnBeforeNavigate2(JSON.stringify({
						"type": "window.hide"
					}));
				}, 100);
			});
			jQuery(document).on("click", ".search-history button.marks", function(evt) {
				setMarkPanel(jQuery(this),true);
			});
			jQuery(document).on("click","#history-list ul > li .marks",function(e){
				e.preventDefault();
				setMarkPanel(jQuery(this),false);
			});
			function setMarkPanel(ele,parent){
				var cdata = jQuery(".win-dialog.history-record").data("cdata"),
					hisdata = jQuery(".win-dialog.history-record").data("hisdata"),
					warnMsg = {
						type: "notify.warn",
						message: "该时间段没有录像可做摘要"
					};
				if (!hisdata) {
					/*如果没有历史视频*/
					OnBeforeNavigate2(JSON.stringify(warnMsg));
					return false;
			    }
				var videos = hisdata.videos;
				if (videos && videos.length === 0) {
					OnBeforeNavigate2(JSON.stringify(warnMsg));
					return false;
				}
				var order = parent?-1:ele.closest("li").data("index");
				var channelid = jQuery(".win-dialog.history-record").data("channelid");
				var eventdata = JSON.stringify({
					"type": "intelligentMark",
					"cameradata": cdata,
					"hisdata": hisdata,
					"order": order,
					"channelid": channelid,
					"fileName": hisdata.name
				});
				/*点击下载搜索开始时间到结束时间内的录像到云空间 start   Mayue 修改*/
				if (order === -1) {
					var eventdataObj = JSON.parse(eventdata);
					var tem = eventdataObj.hisdata.videos[0];
					var vodType = tem ? tem[2] : 0; //深度默认取第一个的深度
					eventdataObj.hisdata.videos.length = 0;
					var beginTime = jQuery.trim(jQuery('.win-dialog-body').find('#startTime').val());
					var endTime = jQuery.trim(jQuery('.win-dialog-body').find('#endTime').val());
					beginTime = Toolkit.str2mills(beginTime);
					endTime = Toolkit.str2mills(endTime);
					eventdataObj.hisdata.videos.push([beginTime, endTime, vodType]);
					eventdata = JSON.stringify(eventdataObj);
				}
				OnBeforeNavigate2(eventdata);
				//最小化录像面板
				setTimeout(function() {
					OnBeforeNavigate2(JSON.stringify({
						"type": "window.hide"
					}));
				}, 100);
			}
		};
		/**
		 * 下载录像前的验证处理
		 * @param  {[type]} index [录像片段索引]
		 * @param  {[type]} ele   [选中的元素对象]
		 * @return {[type]}       [description]
		 */
		this.getVideo_applyData = function(index, ele) {
			var cdata = jQuery(".win-dialog.history-record").data("cdata"),
				hisdata = jQuery(".win-dialog.history-record").data("hisdata"),
				order = index,
				channelid = jQuery(".win-dialog.history-record").data("channelid"),
				beginTime, endTime;
			//由于录像入库是针对每一条录像片段进行的，故原来cdata.index（此值一直是0）获取的录像段索引错误,modify by zhangyu on 2015/5/23
			var dataWarnMsg = {
				type: "notify.warn",
				message: "该时间段没有录像可下载"
			};
			if (!hisdata) {
				/*如果没有历史视频*/
				dataWarnMsg.message = "该时间段没有录像可下载";
				OnBeforeNavigate2(JSON.stringify(dataWarnMsg));
				return false;
			}
			if (ele && jQuery(ele).hasClass('download') && hisdata.videos.length > 1 && (hisdata.videos[0][2] > 0 && !window.isAllowDevHisDownload)) {
				/*搜索旁边的下载按钮 深度大于0的不支持下载*/
				dataWarnMsg.message = "设备录像不支持跨段下载";
				OnBeforeNavigate2(JSON.stringify(dataWarnMsg));
				return false;
			}
			if (!ele) {
				//dataWarnMsg.message = "申请理由不能为空！";
				//OnBeforeNavigate2(JSON.stringify(dataWarnMsg));
				notify.warn("申请理由不能为空！");
				return false;
			} else if (ele.length > 50) {
				//dataWarnMsg.message = "申请理由长度不能超过50";
				//OnBeforeNavigate2(JSON.stringify(dataWarnMsg));
				notify.warn("申请理由长度不能超过50！");
				return false;
			}


			var videos = hisdata.videos;
			if (videos && videos.length === 0) {
				notify.warn("没有查到历史录像");
				return;
			}
			if (order === -1 || order === null) {
				beginTime = jQuery.trim(jQuery('.win-dialog-body').find('#startTime').val()) + ".000";
				endTime = jQuery.trim(jQuery('.win-dialog-body').find('#endTime').val()) + ".000";
			} else {
				beginTime = hisdata.videos[order][0];
				endTime = hisdata.videos[order][1];
				beginTime = (Toolkit.mills2datetime(beginTime)) + ".000";
				endTime = (Toolkit.mills2datetime(endTime)) + ".000";
			}
			var vodType = (order === -1 || order === null) ? hisdata.videos[0][2] : hisdata.videos[order][2];

			return {
				upTime: beginTime,
				endTime: endTime,
				videoName: (hisdata.name),
				vodType: vodType,
				channelId: channelid,
				remark: ele
			};
		};
		/**
		 * 点击录像下载，显示下拉选择列表
		 * @param {[type]} indexs [待下载录像索引]
		 * @param {[type]} $this  [当前点击位置的元素对象]
		 */
		this.setDownLoadLis = function(indexs, $this ,userRoleScore) {
			var html = [
				//由于录像入库是针对每一条录像片段进行的，此处添加当前点击所在的录像片段索引,modify by zhangyu on 2015/5/23
				"<div id='download-showList' data-index='" + indexs + "' tabIndex='0'>",
				"<div class='item cloud permission permission-import'>保存到云空间</div>",
				"<div class='item local'>下载到本地</div>",
				"<div class='item apply' data-appStatu=''>申请下载</div>",
				"</div>"
			].join("");
			var node = jQuery(html),
				offset = $this.offset(),
				x = offset.left,
				y = offset.top,
				w = $this.width(),
				h = $this.height();
			if (!jQuery("#download-showList")[0]) {
				jQuery(document.body).append(html);
			}
			var ph = jQuery(window).height();
			var h0 = jQuery("#download-showList").height();
			var y0 = y + h - 3;
			if (y0 + h0 > ph - 20) {

			}
			var L = jQuery("#history-list ul li").length;
			var index = $this.parent().parent().index();
			var left = x - 50;
			var top = y0;
			if (L >= 6) {
				if (index == L - 1 || index == L - 2) {
					top = (userRoleScore > 66) ? (y0 - 66) : y0 - 51;
				}
			}
			jQuery("#download-showList").css({
				left: left,
				top: top
			}).show().focus();
			var order = $this.parent().parent().index();
			//下载这个时间段的历史录像  此时将order置为-1  只是一种约定  mayue 2015.06.17
			if ($this.hasClass('download')) {
				order = -1;
			}
			jQuery("#download-showList").data("order", order);
		};
		/**
		 * [givePlayTime 给出一个时间数组,第一个值为两小时之前，第二个值为当前]
		 * @author huzc
		 * @date   2015-03-04
		 * @return {[type]}   [长度为2的时间数组]
		 */
		this.givePlayTime = function() {
			var D = new Date();
			var b = D.getTime();
			var a = b - 2 * 60 * 60 * 1000;
			var fmt_a = "yyyy-MM-dd hh:mm:ss";
			var fmt_b = "yyyy-MM-dd hh:mm:ss";
			var a = (new Date(a)).format(fmt_a);
			var b = (new Date(b)).format(fmt_b);
			return [a, b];
		};
		/**
		 * [ListSearch 生成历史录像片段html]
		 * @author huzc
		 * @date   2015-04-21
		 * @param  {[type]}   resdata [description]
		 */
		this.ListSearch = function(resdata, searchBeginTime, searchEndTime) {
			var data = jQuery(".win-dialog.history-record").data("cdata"),
				L = resdata.videos.length,
				html = "<ul data-ip='" + resdata.ip + "' data-port='" + resdata.port +
				"' data-username='" + resdata.username + "' data-path='" + resdata.path + "' data-password='" + resdata.password + "'>";
			for (var i = 0; i <= L - 1; i++) {
				var video = resdata.videos[i];
				if (i === 0 && video[0] < searchBeginTime) {
					video[0] = searchBeginTime;
				}
				if (i === L - 1 && video[1] > searchEndTime) {
					video[1] = searchEndTime;
				}
				var beginTime = Toolkit.formatDate(new Date(video[0])),
					endTime = Toolkit.formatDate(new Date(video[1]));
				/**
				 * 获取录像列表，如果是电视墙模块，则只显示上墙按钮
				 * 由于录像入库是针对每一条录像片段进行的，此处添加当前点击所在的录像片段索引,modify by zhangyu on 2015/5/23
				 */
				html = html + [
					"<li data-index='" + i + "'>",
					"<span class='list-time' vodtype='" + video[2] + "'>" + beginTime + "&nbsp;&nbsp;—&nbsp;&nbsp;" + endTime + "</span>",
					"<span class='buttons'>",
					"<span class='play " + ((data.fromModule === "form_tvwall") ? "hide" : "") + "' title='播放'></span>",
					"<span class='download-local " + ((data.fromModule === "form_tvwall") ? "hide" : "") + "' title='下载历史录像'></span>",
					"<span class='into-viewlib " + ((data.fromModule === "form_tvwall") ? "hide" : "") + "' title='入视图库'></span>",
					"<span class='tvwall' title='上墙'></span>",
					"<span class='marks " + ((data.fromModule === "form_tvwall") ? "hide" : "") + "' title='摘要'></span>",
					"</span>",
					"</li>"
				].join("");
			}
			html = html + "</ul>";
			return html;
		};
		/**
		 * [getPlayChannel 获取历史播放通道]
		 * @author huzc
		 * @date   2015-04-20
		 * @param  {[type]}   camera [description]
		 * @param  {[type]}   type   [description]
		 * @return {[type]}          [返回通道信息或者false]
		 */
		this.getPlayChannel = function(camera, type) {
			if (!camera["hdchannel"]) {
				camera["hdchannel"] = camera["hdChannel"];
			}
			if (!camera["sdchannel"]) {
				camera["sdchannel"] = camera["sdChannel"];
			}
			if (!type) {
				type = "c";
			}
			var hd = "hd" + type + "hannel";
			var sd = "sd" + type + "hannel";
			if (camera[hd] && camera[hd].length > 0) {
				return camera[hd][0]; //目前只有1个
			} else if (camera[sd] && camera[sd].length > 0) {
				for (var i = 0; i < camera[sd].length; i++) {
					var group_id = camera[sd][i].pvg_group_id;
					//1表示编码器，没有录像；2表示DVR
					if (group_id == 2 || group_id == 3) {
						//console.log(camera[sd][i]);
						return camera[sd][i];
					} else if (group_id == 1) {
						return false;
					}
				}
			}
		};
		/**
		 * [getHistoryList 获取历史录像片段的数据]
		 * @author huzc
		 * @date   2015-04-21
		 * @param  {[type]}   channel_id [description]
		 * @param  {[type]}   beginTime  [description]
		 * @param  {[type]}   endTime    [description]
		 * @param  {Function} fn         [description]
		 * @return {[type]}              [description]
		 */
		this.getHistoryList = function(channel_id, beginTime, endTime, fn) {
			jQuery.ajax({
				url: '/service/history/list_history_videos_other',
				data: {
					channel_id: channel_id,
					begin_time: beginTime,
					end_time: endTime
				},
				cache: false,
				dataType: "json",
				type: 'GET',
				async: true,
				success: function(res) {
					var camera = res.data;
					//console.log("res,"+JSON.stringify(res));
					if (res.code === 200) {
						fn(camera, true);
					} else if (res.code === 500) {
						fn(camera, false);
					}
				}
			});
		};
		/**
		 * [JudgeTimeSets A[I]格式  统计落在某时间区间的帧标记个数]
		 * @author huzc
		 * @date   2015-04-21
		 * @param  {[type]}   FrameList [description]
		 * @param  {[type]}   startTime [description]
		 * @param  {[type]}   endTime   [description]
		 */
		this.JudgeTimeSets = function(FrameList, startTime, endTime) {
			var L = FrameList.length;
			var K = 0;
			var Frames = [];
			for (var i = 0; i <= L - 1; i++) {
				var time = FrameList[i].time;
				if (time >= startTime && time < endTime) {
					K++;
					Frames.push(FrameList[i]);
				}
			}
			return Frames;
		};
		/**
		 * [getHistory 获取历史录像片段数据并且播放最后一段]
		 * @author huzc
		 * @date   2015-04-21
		 * @param  {[type]}   data [description]
		 * @param  {Function} fn   [description]
		 * @return {[type]}        [description]
		 */
		this.getHistory = function(data, initData) {
		//	var userRoleScore = data.userRoleScore;
			/*if(userRoleScore<60){
				jQuery(".search-history .download").text('申请');
			}*/
			var self = this;
			var klass = data.klass;
			if(!klass["download-history"]){
                jQuery(".search-history .download").hide();
			}
			var obj = self.getPlayChannel(data);
			if (!obj) {
				return;
			}
			var resultList = jQuery("#history-record #history-list");
			var index = data.index;
			var cameraId = data.cId || data.id || data.cameraId;
			//判断起止时间是否为空
			var begin_Time = jQuery("#startTime").val().replace(/\./g, "/").replace(/\-/g, "/"),
				end_Time = jQuery("#endTime").val().replace(/\./g, "/").replace(/\-/g, "/");
			if (begin_Time === "" || end_Time === "") {
				var data = JSON.encode({
					type: "notify.warn",
					message: "请输入正确的开始时间和结束时间"
				});
				OnBeforeNavigate2(data);
				resultList.html("<div style='padding-top:10px;'><div class='hline'>请输入正确的开始时间和结束时间</div></div>");
				return;
			}
			//判断起止时间的合法性
			var beginTime = (new Date(begin_Time)).getTime(),
				endTime = (new Date(end_Time)).getTime();
			if (beginTime >= endTime) {
				var data = JSON.encode({
					type: "notify.warn",
					message: "开始时间不能大于等于结束时间！"
				});
				OnBeforeNavigate2(data);
				resultList.html("<div style='padding-top:10px;'><div class='hline'>请输入正确的开始时间和结束时间</div></div>");
				return;
			}
			var channelid = obj.id;
			jQuery(".win-dialog.history-record").data("channelid", channelid);
			var resultList = jQuery("#history-list");
			self.getHistoryList(channelid, beginTime, endTime, function(data, flag) {
				if (flag === false) {
					resultList.html("<div style='padding-top:10px;'><div class='hline'>暂无数据，请查询</div></div>");
					if ((typeof(controlBar) === 'object') && controlBar.real2history === true) {
						self.fireEvent("search", {
							data: data,
							flag: flag
						});
						controlBar.real2history = false;
					}
					return;
				}
				if (!data) {
					var data = JSON.encode({
						type: "notify.warn",
						message: "录像查询失败。"//"发生错误data,channelid=" + channelid + ",beginTime=" + ",endTime=" + endTime + ",begin_Time=" + begin_Time
					});
					OnBeforeNavigate2(data);
					return;
				}
				if (!data.videos) {
					var data = JSON.encode({
						type: "notify.warn",
						message: "录像查询失败。"//"发生错误data.videos,channelid=" + channelid + ",beginTime=" + ",endTime=" + endTime + ",begin_Time=" + begin_Time
					});
					OnBeforeNavigate2(data);
					return;
				}
				var L = data.videos.length;
				if (L === 0) {
					resultList.html("<div style='padding-top:10px;'><div class='hline'>该时间段没有历史录像</div></div>");
					return;
				}
				jQuery(".win-dialog.history-record").data("hisdata", data);
				var html = self.ListSearch(data, beginTime, endTime);
				resultList.html(html);
				/*if(userRoleScore<60){
					jQuery(".search-history .download").text('申请');
					jQuery(".download-local").addClass("apply-local")
					jQuery(".download-local").attr('title','申请下载');
				}*/
			    //没有历史录像下载权限，隐藏历史录像下载按钮
				if(!klass["download-history"]){
                    jQuery(".download-local").addClass("hide");
				}
				//没有历史录像入库，隐藏历史录像入库按钮
				if(!klass["tobaselib"] || !klass["view-libs"]){
					jQuery(".into-viewlib").addClass("hide");
				}
				//没有上墙的权限，隐藏上墙的按钮
				if(!klass["sendto-tvwall"]){
					jQuery(".tvwall").addClass("hide");
				}
				self.fireEvent("search", {
					data: data,
					flag: flag,
					initData: initData
				});
			});
		};
	};
	return HistoryDeal;
});