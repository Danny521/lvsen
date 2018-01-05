/**
 *
 */
define([
	"jquery",
	'mootools',
	'base.self',
	"ajaxModel",
	"/module/inspect/download_local/download.js",
	"/module/common/js/player2.js",
	"/module/inspect/download-cloud/js/record-download-all.js"
], function(jQuery,mt,base,ajaxModel,downloadLocal,Vplayer,recordDownLoadAll) {

var	_isUseMock = false,

	//设置请求的根路径
	_serviceHost = "/service/",

	//设置请求上下文
	_serviceContext = "",

	//设置请求的url集合
	_ACTIONS_URL = {
		//根据ID获取摄像机详细信息
		Get_Camerainfo_By_ID: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "video_access_copy/accessChannels",
		//点击历史调阅，获取录像深度
		Get_History_Video_Depth: _isUseMock ? "../inc/get_rule_list_by_alarm.json" : _serviceHost + /*self.serviceContext +*/ "history/list_history_videos_other",
		//根据图片路径获取图片base64编码
		Get_Img_Data: _isUseMock ? "js/connection/model/trajectory.json" : _serviceHost + _serviceContext + "faceReco/storing/createBase64",
	};
	var RecordDownload = function() {
		this._bindEvent();
		recordDownLoadAll.addEvents();
	};
	RecordDownload.prototype = {

		start:function(){
			var self = this;
			//初始化参数
			self.downloadDataList = [];
			self.cloudDataList = [];
			self.carameNameList = [];
			self.dataIsReady = false;
			self.totalCamerasNum = 0;
			var cameras = self._getCheckedData();
			if (!cameras.length) {
				return notify.warn('没有勾选摄像机无法进行历史录像下载，请勾选后重试');
			}
			//载入模版(异步请求)
			self._ajax("/module/inspect/dispatch/map-record-download.html", "get", {}, function(res) {
				jQuery(".download-record").remove();
				jQuery(document.body).append(res);
				parent.showHideMasker && parent.showHideMasker("show");
				self._render(cameras);
			});
		},

		//渲染
		_render:function(cameras){
		   //cameratype 1 球机 0 枪机
           var self=this;
           var L= cameras.length;
           var html = "<ul>";
	       for (var i = 0; i <= L - 1; i++) {
	       	    if(cameras[i].cameratype == 0){
                    html = html  + "<li style='border-top:solid 1px #CCCCCC;line-height:30px;'>"+
	                           "<span style='display:inline-block;background: url(/module/common/images/sprites/tree_bg.png) no-repeat -630px 0;height:15px;width:20px;margin:auto 11px;'></span>"+
	                           "<span class='camera-name' style=''>"+cameras[i].name+"</span>"+
	                           "<span class='buttons'style='float:right;'>"+
	                           "<span class='has-record' style='margin-right:15px;color:red;'></span>"+
	                           "<span class='remove-record' title='移除' data-id='"+cameras[i].id+"' style='display:inline-block;background:url(/module/ptz-controller/cruise/img/del.png) no-repeat 0px 0;height:15px;width:20px;margin-right:6px;'></span>"+
	                           "</span>"+
	                           "</li>"
	       	    }else{
	       	    	 html = html  + "<li style='border-top:solid 1px #CCCCCC;line-height:30px;'>"+
	                           "<span style='display:inline-block;background: url(/module/common/images/sprites/tree_bg.png) no-repeat -651px 0;height:15px;width:20px;margin:auto 11px;'></span>"+
	                          "<span class='camera-name' style=''>"+cameras[i].name+"</span>"+
	                           "<span class='buttons'style='float:right;'>"+
	                           "<span class='has-record' style='margin-right:15px;color:red;'></span>"+
	                           "<span class='remove-record' title='移除' data-id='"+cameras[i].id+"' style='display:inline-block;background:url(/module/ptz-controller/cruise/img/del.png) no-repeat 0px 0;height:15px;width:20px;margin-right:6px;'></span>"+
	                           "</span>"+
	                           "</li>"
	       	    }

	       }
	       html=html+"</ul>";
           var resultList= jQuery("#historyList");
           resultList.append(html);
           var A = self._givePlayTime();
           if (jQuery(".search-history #startTime").val()==='') {
				jQuery(".search-history #startTime").val(A[0]);
		   }
           if(jQuery(".search-history #endTime").val()===''){
                jQuery(".search-history #endTime").val(A[1]);
           }
			//修改样式，无需关注
			jQuery("#historyList  ul  li:eq(0)").css({
				"border-top": "solid 1px #CCCCCC"
			});
            self._changeCss(L);
		},
		_ajax: function(url, type, data, fn) {
				var ajax=jQuery.ajax({
					url: url,
					data: data,
					cache: false,
					type: type || 'GET',
					async: true,
					success: function(res) {
						fn(res);
					},
					error: function() {
						notify.warn("获取数据异常");
					}
				});
				return ajax;
	    },
	    _changeCss: function(length) {
			//没有滚动条，默认情况是有滚动条
			if (length < 6) {
				var width = jQuery(".dialog-history.postform").css("width");
				if((width.substring(0,3) - 0) < 398){
					return;
				}
				var resultList = jQuery("#historyList");
				jQuery(".dialog-history.postform").css({
					"width": "397px"
				});
				resultList.find("ul").find("li").find("span.buttons").css({
					"margin-right": "5px"
				});
			}
	    },
	    //获取勾选的check数据
		_getCheckedData:function(){
			var checkedNode = jQuery('.np-roll-play:visible').find('.checkbox.checked');
			var result=[];
			checkedNode.each(function(index,elm){
				result.push(jQuery(elm).closest('li').data());
			});
			return result;
		},
		//获取录像机可用通道
		_goFindCid: function(obj,k) {
			var self=this;
			var channelId = self._findcamid({
				cameraInfo: {
					hdchannel: obj.hdchannel,
					sdchannel: obj.sdchannel
				}
			});
			var bTime=jQuery(".search-history #startTime").val(),
			    eTime=jQuery(".search-history #endTime").val();

			var	beginTime = Toolkit.str2mills(bTime),
				endTime = Toolkit.str2mills(eTime);
			var cameraId = obj.id;
			//获取录像深度
			self._getDepth(channelId, beginTime, endTime, k, cameraId);
		},
        _findcamid:function(camera){
        	var self=this;
            var camid = 0;
			camera.temphdsd=0;
			if(camera.cameraInfo){camera = camera.cameraInfo};
			if(camera.hdchannel){camera.hdChannel=camera.hdchannel}
			if(camera.sdchannel){camera.sdChannel=camera.sdchannel}
			if(camera.hd_channel){camera.hdChannel=camera.hd_channel}
			if(camera.sd_channel){camera.sdChannel=camera.sd_channel}
			if (camera.hdChannel&&camera.hdChannel.length > 0)
			{
				camid = camera.hdChannel[0].id;	//目前只有1个
				camera.temphdsd=1;
			}
			else if (camera.sdChannel&&camera.sdChannel.length > 0)
			{
				var NoEnCoder=0;
				for (var i=0; i < camera.sdChannel.length; i++)
				{
					var group_id=camera.sdChannel[i].pvg_group_id;
					//1表示编码器，没有录像；2表示DVR
					if (group_id == 2 || group_id == 3)
					{
						NoEnCoder++;
						camid = camera.sdChannel[i].id;
						break;
					}
					else if(group_id == 1)
					{
						camid = -1;
					}
				}
				if(NoEnCoder==0)
				{
					camid = -1;
				}
			}
			return camid;

        },
		//获取录像机深度
		_getDepth: function(channelId,beginTime,endTime,k,cameraId) {
			var self=this;
			//点击历史调阅，根据报警id获取报警通道信息，为播放录像做准备
			var checkedLi = jQuery('#historyList ul li:eq('+k+')');
			var html="<span class='find_result' style='color:#999999'>有录像</span>";
			var html2="<span class='find_result' style='color:red;'>无录像</span>";
			var bTime=jQuery.trim(jQuery('.search-history #startTime').val())+ ".000";
			var eTime=jQuery.trim(jQuery('.search-history #endTime').val())+ ".000";
			self._getDepthData( //参数
				{
					channel_id: channelId,
					begin_time: beginTime,
					end_time: endTime
				}).then(function (res) {
                    if(k === self.totalCamerasNum - 1){
                         self.dataIsReady = true;
                    }
					if (res.code === 200 && res.data.videos) {

						if (res.data.videos.length === 0) {
							checkedLi.find("span.has-record").html(html2);
						//	notify.info("此摄像机没有这个时间段的录像！");
							return false;
						}
						var L = res.data.videos.length;
						var fmt_a = "yyyy-MM-dd hh:mm:ss";
						var fmt_b = "yyyy-MM-dd hh:mm:ss";
						var a = new Date(res.data.videos[0][0]).format(fmt_a)+".000";
						var b = new Date(res.data.videos[L-1][1]).format(fmt_b)+".000";
						//本地下载需的数据
						var downloadData={
							cameraId:cameraId,
                            beginTime:a,
                            endTime:b,
                            ip:res.data.ip,
                            passwd:res.data.password,
                            path:res.data.path,
                            port:res.data.port,
                            type:2,
                            user:res.data.username,
                            vodType:parseInt(res.data.videos[0][2]),
                            fileName:res.data.name

						};

						//云空间下载需的数据
						var cloudData={
							cameraId:cameraId,
							channelId:channelId,
                            beginTime: res.data.videos[0][0],
							endTime: res.data.videos[L-1][1],
							vodType: res.data.videos[0][2]
						};


				        checkedLi.find("span.has-record").html(html);
                        self.downloadDataList.push(downloadData);
                        self.cloudDataList.push(cloudData);
                        self.carameNameList.push(res.data.name);

						//播放历史
					//	View.playHistory(begintime, endtime, vodType, camera);
					} else if (res.code === 500) {
						if (res.data == "pvg异常(-17:输出参数缓冲区太小)" || res.data == "未知异常异常:RMIP_ERR_OUT_BUF_TOO_SMALL 值:-17") {
							checkedLi.find("span.has-record").html(html2);
						//	notify.warn("该摄像机没有这个时间段的录像或查询录像异常！错误码：-17");
						} else if (res.data == "未知异常异常:RMIP_ERR_NO_POSA_INTERFACE 值:-11") {
							checkedLi.find("span.has-record").html(html2);
						//	notify.warn("该摄像机没有查询到录像！错误码：-11");
						} else {
							checkedLi.find("span.has-record").html(html2);
						//	notify.warn("pvg异常,录像暂时无法播放！");
						}
					} else {
						checkedLi.find("span.has-record").html(html2);
					//	notify.error("获取录像深度失败！错误码：" + res.code);
					}
				});
		},
		_getdownloadDataList:function(){
            var self=this;
            return self.downloadDataList;
		},
		_getcloudDataList:function(){
            var self=this;
            return self.cloudDataList;
		},
		//获取深度数据
		_getDepthData:function(data){
          return ajaxModel.getData(_ACTIONS_URL.Get_History_Video_Depth, data,{});
		},
		//givePlayTime 给出一个时间数组,第一个值为两小时之前，第二个值为当前
		_givePlayTime:function(){
            var D = new Date();
			var b = D.getTime();
			var a = b - 2 * 60 * 60 * 1000;
			var fmt_a = "yyyy-MM-dd hh:mm:ss";
			var fmt_b = "yyyy-MM-dd hh:mm:ss";
			var a = (new Date(a)).format(fmt_a);
			var b = (new Date(b)).format(fmt_b);
			return [a, b];
		},
		_bindEvent: function() {
			var self = this;

			require(['/libs/jquery/jquery-ui-timepicker-addon.js'], function() {
				//先引入
				jQuery(document).on('focus', '.datetime-picker-small', function() { //再调用
					jQuery('.datetime-picker-small').datetimepickerSmall();
				});

			});
			//点击搜索按钮查询历史录像片段
			jQuery(document).on("click", ".search-history button.onsearch", function() {
				notify.info("每次至多下载5个有录像的历史录像片段，超过5个时可能导致接口超时，下载失败！");
				var bTime = jQuery(".search-history #startTime").val(),
					eTime = jQuery(".search-history #endTime").val();
				if (bTime.trim() == "" || eTime.trim() == "") {
					notify.warn("时间不能为空!");
					return;
				}
				var Exg1 = /[\u4E00-\u9FA5]/,
					Exg2 = /[a-z]/,
					Exg3 = /[\~\!\@\#\$\%\^\&\*\(\)\_\+]/;
				if (Exg1.test(bTime) || Exg1.test(eTime) || Exg2.test(bTime) || Exg2.test(eTime) || Exg3.test(bTime) || Exg3.test(eTime)) {
					notify.warn("时间格式不正确！");
					return;
				}
				var beginTime = new Date(Date.parse(bTime.replace(/-/g,"/"))).getTime(),
					endTime = new Date(Date.parse(eTime.replace(/-/g,"/"))).getTime();
				if (isNaN(beginTime) || isNaN(endTime)) {
					notify.warn("时间格式不正确！");
					return;
				}
				if (beginTime >= endTime) {
					notify.warn("开始时间不能大于等于结束时间！");
					return;
				}
				self.downloadDataList = [];
				self.cloudDataList = [];
				var checkedData = self._getCheckedData();
				var checkedLi = jQuery('#historyList ul li span.has-record');
				var html = "<span class='searching' style='display:inline-block;background:url(/module/common/images/loading.gif);height:16px;width:16px;'></span>";
				checkedLi.each(function(index, elm) {
					$(this).html(html);
				});
				var L = checkedData.length;
				    self.totalCamerasNum = L;
				for (var i = 0; i <= L - 1; i++) {
					(function(k) {
						self._goFindCid(checkedData[k], k);
					})(i)
				}
			});

			//保存到云空间
			jQuery(document).on("click", ".dialog-foot2 span.cloudcenter", function() {

				//获取云空间List
				var cloudDataList = self._getcloudDataList();
				if (cloudDataList.length == 0) {
					notify.warn("没有可以下载的历史录像,请查询后重试");
					return;
				}
				if(!self.dataIsReady){
                     notify.warn("数据正在查询,请稍后");
                     return;
				}
				var getHTML = jQuery.get("/module/inspect/dispatch/cloud-record.html");
				var getDirs = jQuery.getJSON("/service/pcm/directoryList/0");

				jQuery.when(getHTML, getDirs).done(function(html, resdata) {
					//解决多次叠加的问题,by zhangyu on 2015/5/27
					jQuery(".download-record").remove();
					jQuery(".dialog-history").remove();

					var template = Handlebars.compile(html[0]);
					var html = template(resdata[0]);
					jQuery(document.body).append(html);
					var playerDom = jQuery("object[type='applicatin/x-firebreath'][class='UIOCX']")
					var pw = jQuery(window).width();
					var ph = jQuery(window).height();
					var left = (pw - 352) / 2 + 352;
					var top = (ph - 252) / 2 + 252;
					var path = "<span class='rootdir' filedirid='0' title='根目录'>根目录</span><span class='right-icon'></span>";
					jQuery(".dialog-history .dialog-body .filedir-path").html(path);
				}).fail(function() {
					notify.warn("后端数据接口发生异常，请重试");
				});

			});


			//下载历史录像到云空间
			jQuery(document).on("click", ".dialog-history.filedir .dialog-foot .okcancel .okk", function() {

				//获取云空间List
				var cloudDataList = self._getcloudDataList();
				var active = jQuery(".dialog-history.filedir .dialog-body .content-list .file.active");
				//只有完成重命名(名称重复时，必须键入正确的不重复的名字) 才能进行下一步操作  start
				if (jQuery('.dialog-history.filedir .dialog-body .content-list').find('input.input').is(':visible')) {
					return;
				}
				//只有完成重命名(名称重复时，必须键入正确的不重复的名字) 才能进行下一步操作  end
				if (active[0]) {
					var directoryId = active.attr("filedirid");
				} else {
					var directoryId = jQuery(".dialog-history.filedir .dialog-body .content-list").attr("showfiledirid");
				}
				if (!directoryId) {
					notify.warn("请选择一个目录");
					return;
				}
				var L = cloudDataList.length;
				for (var j = 0; j <= L - 1; j++) {
					(function (k) {
						var data = {
							directoryId: directoryId,
							channelId: cloudDataList[k].channelId,
							beginTime: cloudDataList[k].beginTime,
							endTime: cloudDataList[k].endTime,
							vodType: cloudDataList[k].vodType
						};
						jQuery.ajax({
							url: "/service/history/voddownload",
							data: data,
							cache: false,
							type: 'POST',
							async: true,
							success: function (res) {
								if (res.code == 200) {
									jQuery(".download-record").remove();
									jQuery(".dialog-history").remove();
									parent.showHideMasker && parent.showHideMasker("hide");
									notify.info("历史录像保存云空间任务提交成功");
									//日志记录，保存XX摄像机视频到云空间,add by wujingwen, 2015.08.19
									var startTime = Toolkit.mills2datetime(data.beginTime);
									var endTime = Toolkit.mills2datetime(data.endTime);
									if (location.href.indexOf("dispatch") >= 0) {
										logDict.insertMedialog("m1", "保存" + self.carameNameList[k] + "摄像机历史视频到云空间" + startTime + "--" + endTime, "f2");
									} else {
										logDict.insertMedialog("m1", "保存" + self.carameNameList[k] + "摄像机历史视频到云空间" + startTime + "--" + endTime, "f1");
									}
								} else {
									notify.warn("历史录像保存云空间出错code=" + res.code);
								}
							},
							error: function () {
								notify.warn("历史录像保存云空间失败");
								parent.showHideMasker && parent.showHideMasker("hide");
							}
						});
					})(j)
				}
			});

			//保存到本地
			jQuery(document).on("click", ".dialog-foot2 span.local", function() {
				var downloadDataList = self._getdownloadDataList();
				if (downloadDataList.length == 0) {
					notify.warn("没有可以下载的历史录像,请查询后重试");
					return;
				}
				if(downloadDataList.length > 5){
					notify.warn("每次至多下载5个有录像的历史录像片段,超过5个时可能导致接口超时,下载失败!");
					return;
				}
				if(self.dataIsReady){
                      downloadLocal(downloadDataList, "abc", window.injectocx, "mutilDownLoad");
                      $(".dialog-history.postform, .download-record").remove();
				}else{
                    notify.warn("数据正在查询,请稍后");
				}
			});

			//点击删除按钮时左侧树取消勾选
			jQuery(document).on("click", "#historyList .remove-record", function() {
				var downloadDataList = self._getdownloadDataList(),
					cloudDataList = self._getcloudDataList(),
					id = $(this).data("id"),
					L = downloadDataList.length;
                for(var i = 0;i < L;i++){
                	var downloadObj = downloadDataList[i];
                   if(id === downloadObj.cameraId){
                      downloadDataList.splice(i,1);
                      cloudDataList.splice(i,1);
                      self.downloadDataList = downloadDataList;
                      self.cloudDataList = cloudDataList;
                      break;
                   }
                }
				$(this).closest('li').remove();
				var checkedLi = jQuery('#historyList ul li');
				self._changeCss(checkedLi.length);
				//删除到最后一个时干掉弹出框
				if (checkedLi.length == 0) {
					$(".dialog-history.postform, .download-record").remove();
				}
				var checkedNode = jQuery('.np-roll-play:visible').find('.checkbox.checked');
				var selectAllNode = jQuery('.search-result-batch:visible').find('.checkbox.checked');
				checkedNode.each(function(index, elm) {
					var objs = $(elm).data();
					if (id == objs.id) {
						$(elm).removeClass('checked');
						selectAllNode.removeClass('checked');
						return false;
					}
				});

			});

			//取消
			jQuery(document).on("click", ".dialog-foot2 span.cancel, .dialog-history .dialog-title .close", function() {
				parent.showHideMasker && parent.showHideMasker("hide");
				$(".dialog-history.postform, .download-record").remove();

			});

			//鼠标悬停
			jQuery(document).on("mouseenter", "#historyList ul li", function() {

				$(this).find(".camera-name").css({
					"font-weight": "bold",
					"color": "#217EEC"
				});

				$(this).css({
					"background-color": "#E5F4FF"
				}).find("span.remove-record").css({
					"background": "url(/module/ptz-controller/cruise/img/del.png) no-repeat -22px 0"
				});


			});

			//鼠标移开
			jQuery(document).on("mouseleave", "#historyList ul li", function() {

				$(this).find(".camera-name").css({
					"font-weight": "normal",
					"color": "black"
				});
				$(this).css({
					"background-color": "white"
				}).find("span.remove-record").css({
					"background": "url(/module/ptz-controller/cruise/img/del.png) no-repeat 0px 0"
				});

			});

		}
	};
	return new RecordDownload();
});
