/**
 * Created by Zhangyu on 2014/12/15.
 * 报警管理模块视频播放相关逻辑
 */
define([
	'js/global-varibale',
	'jquery',
	'pubsub',
	'../model/preventcontrol-model',
	'./common-alarm-lineTools',
	'./common-task-controller',
	'Message',
	'/module/common/js/player2.js',
	'OpenLayers'
], function(_g, jQuery, PubSub,preCtrModel,lineTools,commonCtr,messageInfo) {

	var videoPlay = function () {
		var self = this;
		self.message = _g.messageCache;
		self.message.notifyFuncList.push(self.MapbickerLine || jQuery.noop);
		self.init();
	};

	videoPlay.prototype = {
		flag:false,
		init: function () {
			var self = this;
			//加载模板
			self.registerHelper();
			_g.curMapCameraIds =[];
			_g.curMapCtrTaskList =[];
			
		},
		bindEvents:function(){
			var self = this;
			//关闭地图窗口
			jQuery(".infowindow-top .infowindow-operator .icon_mark_close").off("click").click(function () {
				//关闭窗口
				PubSub.publish("closeInfoWindow", {});
			});
			jQuery("#selectMode").on("click",function(){
				jQuery("#selcetPart,#selectContent").slideToggle(100);
			});

		},
		/**
		 * 在地图上播放视频
		 **/
		playMapCameraVideo: function (data) {
			var self = this,camData = data;

			//第一步：获取摄像机播放信息
			preCtrModel.ajaxEvents.getCameraInfoByCameraId({
				cameraId:data.cameraId
			},function(res) {
				if(res.code === 200 && res.data.data){
					var camera =res.data.data;
					camera.sd_channel = camera.sd_channel ? camera.sd_channel : camera.sdchannel;
					camera.hd_channel = camera.hd_channel ? camera.hd_channel : camera.hdchannel;
					camera.camera_type = camera.camera_type ? camera.camera_type : camera.cameratype;
					camera.camera_status = camera.camera_status ? camera.camera_status : camera.status;
					//位置
					var position = new NPMapLib.Geometry.Point(camera.longitude, camera.latitude);
					//内容
					var content = _g.compiler({
							ocx: camera
						}), //窗口参数
						opts = {
							width: 400, //信息窗宽度，单位像素
							height: 330, //信息窗高度，单位像素
							offset: new NPMapLib.Geometry.Size(0, -5),	 //信息窗位置偏移值
							arrow: true,
							autoSize: false,
							isAnimationOpen: false
						};
					}
					//触发加载信息窗口
					PubSub.publishSync("addInfoWindow", {
						position: position,
						title: "",
						content: content,
						opts: opts
					});
					if (!_g.ocxDom) {
						self.createOcxOnMap();
					}
					jQuery(".map-video-container").append(_g.ocxDom);
					//如果没有播放对象，则初始化
					if (!_g.videoPlayerSigle1) {
						//播放视频
						_g.videoPlayerSigle1 = new VideoPlayer({
							layout: 1,
							uiocx: 'UIOCXMAP',
							displayMode:1
						});
						// jQuery("#UIOCXMAP")[0].RefreshForGis(100);
						document.getElementById('UIOCXMAP').RefreshForGis(100);
						lineTools.init(_g.videoPlayerSigle1);
						if(camData.type ==="deploy"){
							self.initTask(camera.id);
						}else if(camData.type ==="deployctl"){
							preCtrModel.ajaxEvents.getCtrTaskInfoByCameraId({camera_id:camera.id},function(res){
								if(res.code===200){
									$.each(res.data,function(index,item){
									_g.curMapCtrTaskList.push({
											top:item.topPosition,
											left:item.leftPosition,
											right:item.rightPosition,
											bottom:item.bottomPosition
										})
									})
								}
							});
						}else {
							self.initTask(camera.id);
						}

						
					}
					var newCameraData = self.reciveData(res.data.data);
					var formatData = self.convertCamera(newCameraData);
					formatData.operate = 1;
					formatData.position = 0;
					setTimeout(function () {
						// 播放视频
						_g.videoPlayerSigle1.playExpandStreamEx(formatData,formatData.position);
						_g.curMapCameraIds[0] ={
							cId:camData.cameraId
						}
					}, 1000);
					self.bindEvents();
			},function() {
				notify.error("网络或服务器异常！");
			});
			
		},
		initTask:function(cameraId){
			var self = this;
			preCtrModel.ajaxEvents.getTaskListByCamera({cameraId:cameraId},function(res){
				if(res.code===200 && Object.prototype.toString.call(res.data)==="[object Array]"){
					var res = {
						isTaskMapList: true,
						taskLists: res.data,
					}
					lineTools.clearAllImage(0);
					var html = _g.compiler(res);
					if(res.taskLists.length==1){
						jQuery("#selectMode").hide(0);
						self.dealDenSingleTaskOnMap(res.taskLists);
					}else if(res.taskLists.length>1){
						jQuery("#selectMode").show(0);
						jQuery("#selectContent").empty().append(html);
						var currH = jQuery("#selectContent").height()-0;
						jQuery("#selcetPart").height(currH-5);
						
						jQuery("#selectContent .taskMapContentList li").on("click",function(){
							var name = jQuery(this).text();
							var taskdata = jQuery(this).attr("data-taskdata");
							$.extend(_g.curMapCameraIds[0],{selcetMode:name});
							jQuery("#selectMode").text(name);
							jQuery("#selcetPart").hide(200);
							jQuery("#selectContent").hide(200);
							self.dealDenTaskOnMap(taskdata);
							_g.isChange = false;
							
						})
					}
							
				}
			},function(){
				notify.error('获取当前摄像机下的布防任务列表失败!')
			})


		},
		//布控任务
		dealCtrSingleTaskOnMap:function(data){
			var self=this;
			lineTools.clearAllImage(0);
			self.isPlayLoad(function(){
				var cameraCurrRate = lineTools.getDisplayRateOnMap(),
				cameraRate = lineTools.getCameraRate(0),
				ruleInfo = self.getFaceRuleMapDetails(data);
				lineTools.ruleLineOpera.dealGraphicOnVideo(ruleInfo,"12124160", cameraCurrRate,0);
				$.extend(_g.curMapCameraIds[0],{lineInfo:ruleInfo});
			})
		},
		dealDenTaskOnMap:function(data){
			var self = this;
			var next =function(data){
				if(data){
					var lineInfo = JSON.parse(data),
					cameraCurrRate = lineTools.getDisplayRateOnMap(),
					cameraRate = lineTools.getCameraRate(0);
					lineTools.clearAllImage(0);
					lineTools.ruleLineOpera.dealGraphicOnVideo(lineInfo,"12124160", cameraCurrRate ,0);
					$.extend(_g.curMapCameraIds[0],{lineInfo:Object.create(lineInfo)});
				}
			};
			if(self.flag){
				next(data);
			}else{
				self.isPlayLoad(function(){
					next(data);
				});
			}
		},
		//布防任务画框线
		dealDenSingleTaskOnMap:function(data){
			var self =this;
			lineTools.clearAllImage(0);
			self.isPlayLoad(function(){
				var lineInfo = JSON.parse(data[0].front_param),
				cameraCurrRate = lineTools.getDisplayRateOnMap(),
				cameraRate = lineTools.getCameraRate(0);
				lineTools.ruleLineOpera.dealGraphicOnVideo(lineInfo,"12124160", cameraCurrRate ,0);
				$.extend(_g.curMapCameraIds[0],{lineInfo:Object.create(lineInfo),selcetMode:data[0].rule_name});
			});
		},
		MapbickerLine:function(data){
			var lineInfos =[],timer,
			b = function(cameraCurrRate){
				var dataOrg = _g.curMapCameraIds[0];
				var datas = _g.curMapCameraIds[0].lineInfo;
				if(datas){
					for(var j=0,les = datas.length;j<les;j++){
						
						if(datas[j].domid=== data.content.domid /**|| datas[j].text==="人脸检测区域"**/){
							/**if(jQuery("#selectMode").is(":visible") && datas[j].text==="人脸检测区域"){
								return ;
							}**/
							if(data.content.eventType === 8192 && dataOrg.selcetMode==="车牌识别"){ //车牌识别显示车牌
								datas[j].text = data.content.lprValue;
							}
							if(data.content.eventType=== 131072 && dataOrg.selcetMode==="车流统计"){//车流统计闪动显示车流数
								datas[j].text = data.content.areaName;
							}
							if(data.content.eventType=== 4096 && dataOrg.selcetMode==="人数统计"){
								datas[j].text = data.content.areaName;
							}
							;(function(lineInfo){
								if (timer) {
									clearInterval(timer);
									return;
								}
								if(lineInfo){
									lineInfos.push(lineInfo);
									timer = setInterval(function() {
										index++;
										if (index >= 2) {
											clearInterval(timer);
											index = 0;
										}
										//lineTools.clearAllImage(0)
										lineTools.ruleLineOpera.dealGraphicOnVideo(lineInfos, "255", cameraCurrRate, 0);
										setTimeout(function() {
											lineTools.clearAllImage(0)
											lineTools.ruleLineOpera.dealGraphicOnVideo(datas, "12124160", cameraCurrRate, 0)
										}, 500)
									}, 800)
								}
								
							})(datas[j]);

						}
					}
				}

			},
			cameraCurrRate = lineTools.getDisplayRate(),index=0;
			if(!!_g.curMapCameraIds[0]){

				if(parseInt(data.content.cameraId) === parseInt(_g.curMapCameraIds[0].cId)){
					if(jQuery("#major").attr("data-currpart")==="ocx"){
						return;
					}

					b(cameraCurrRate);
				}
			}
		},
		//重新封装摄像机数据
		reciveData:function(data){
			var shdCameraData = {},cameraData ={};
			if(data && data.sd_channel.length>0){
				for(var i=0,le =data.sd_channel.length;i<le;i++){
					shdCameraData.ip = data.sd_channel[0].ip;
					shdCameraData.path =  data.sd_channel[0].av_obj;
					shdCameraData.port = data.sd_channel[0].port;
					shdCameraData.user = data.sd_channel[0].username;
					shdCameraData.passwd = data.sd_channel[0].password;
					shdCameraData.cStatus = data.sd_channel[0].channel_status;
				}
			}else if(data &&　data.hd_channel.length>0){
				for(var i=0,le =data.hd_channel.length;i<le;i++){
					shdCameraData.ip = data.hd_channel[0].ip;
					shdCameraData.path =  data.hd_channel[0].av_obj;
					shdCameraData.port = data.hd_channel[0].port;
					shdCameraData.user = data.hd_channel[0].username;
					shdCameraData.passwd = data.hd_channel[0].password;
					shdCameraData.cStatus = data.hd_channel[0].channel_status;
				}

			}
			cameraData = {
				cName:data.name,
				cId:data.id,
				path:shdCameraData.path,
				cType:data.type,
				ip:shdCameraData.ip,
				port:shdCameraData.port,
				user:shdCameraData.user,
				passwd:shdCameraData.passwd,
				cStatus:shdCameraData.cStatus,
				sdChannel:data.sd_channel,
				hdChannel:data.hd_channel
			};
			
			return cameraData;
		},
		//转换数据格式
		convertCamera: function(camera) {
			return {
				"cName": camera.cName,
				"cId": camera.cId,
				"path": camera.path,
				"cType": camera.cType,
				"ip": camera.ip,
				"port": camera.port,
				"user": camera.user,
				"passwd": camera.passwd,
				"cStatus": camera.cStatus,
				"type": 1,//实时流
				"sdChannel":camera.sdChannel,
				"hdChannel":camera.hdChannel
			};
		},
		//判断当前视频是否加载完
		isPlayLoad:function(callback){
			var self = this,timer;
			self.flag = lineTools.checkedPlayer(1,0);
			if(!self.flag){
				timer = setInterval(function(){
					self.flag = lineTools.checkedPlayer(1,0);
					if(self.flag){
						self.flag = true;
						clearInterval(timer);
						if(typeof callback ==="function"){
							callback();
						}
					}else if(!self.flag  &&  _g.videoPlayerSigle1.cameraData[0].cplayStatus === 1 ||  _g.videoPlayerSigle1.cameraData[0].cplayStatus === 2){
						clearInterval(timer);
						return false;
					}
					
				},1000)
			}else{
				if(typeof callback ==="function"){
					callback();
				}
			}
		},
		/**
		 * 获取摄像机类型和状态
		 * @param camera - 摄像机数据
		 * @returns {string} - 获取的信息
		 */
		getCameraTypeAndStatus: function (camera) {
			var status = 1, type = camera.cameraType ? camera.cameraType : camera.camera_type, isonline = false, hd = camera.hd_channel ? camera.hd_channel : camera.hdchannel, sd = camera.sd_channel ? camera.sd_channel : camera.sdchannel;
			hd.each(function (item, index) {
				if (item.channel_status === 0) {
					status = 0;
					isonline = true;
				}
			});
			if (!isonline) {
				sd.each(function (item, index) {
					if (item.channel_status === 0) {
						status = 0;
					}
				});
			}
			if (type) {
				if (status === 0) {
					return "ballonline";
				}
				if (status === 1) {
					return "balloffline";
				}
			} else {
				if (status === 0) {
					return "gunonline";
				}
				if (status === 1) {
					return "gunoffline";
				}
			}
		},
				/**
		 * 获取当前布控任务的人脸检测区域信息,眼睛查看的时候调用
		 */
		getFaceRuleMapDetails: function(data) {
			var self = this;
			var ruleInfo = [],points=[null,null,null,null];
			for(var i=0,le = data.length;i<le;i++){
				//获取当前的坐标区域
				var x = 50,
					y = 50,
					width = lineTools.getDisplayRateOnMap().width - 100,
					height = lineTools.getDisplayRateOnMap().height - 100;


				x = (data[i].left === 0) ? x : data[i].left;
				y = (data[i].top === 0) ? y : data[i].top;
				width = ((data[i].right - data[i].left) > 0) ? (data[i].right - data[i].left) : width;
				height = ((data[i].bottom - data[i].top) > 0) ? (data[i].bottom - data[i].top) : height;

				//装载坐标信息
				points[0] = [];
				points[0][0] = parseFloat(x);
				points[0][1] = parseFloat(y);

				points[1] = [];
				points[1][0] = parseFloat(x) + parseFloat(width);
				points[1][1] = parseFloat(y);

				points[2] = [];
				points[2][0] = parseFloat(x) + parseFloat(width);
				points[2][1] = parseFloat(y) + parseFloat(height);

				points[3] = [];
				points[3][0] = parseFloat(x);
				points[3][1] = parseFloat(y) + parseFloat(height);
				//返回布控任务的规则区域
				ruleInfo.push({
					text: "人脸检测区域",
					type: "rect",
					points: points,
					drawRate: lineTools.getDisplayRateOnMap()
				})
			}
			return ruleInfo;
		},
		/**
		 * 创建地图上的OCX
		 **/
		createOcxOnMap: function () {
			if(!_g.ocxDom) {
				_g.ocxDom = '<object id="UIOCXMAP" type="applicatin/x-firebreath" width ="398" height ="297"><param name="onload" value="pluginLoaded"/></object>';
			}
		},
		/**
		 * 释放播放器资源
		 */

		clearVideoPlayer: function() {
			if (_g.videoPlayerSigle1) {
				_g.videoPlayerSigle1 = null;
				_g.curMapCameraIds[0] = null;
				_g.curMapCtrTaskList=[];
			}
		},
		/**
		 * 定义模板渲染助手
		 */
		registerHelper: function () {

			//视频播放时显示摄像机编码
			Handlebars.registerHelper("cameraCodeShow", function (data, options) {
				var data = data + "";
				if (data === "null" || data === "" || data === null || data === 'undefined') {
					return "";
				} else if (data.indexOf("(") > -1) {
					return data;
				} else {
					return "(" + data + ")";
				}
			});
		}
	};

	return new videoPlay();
});
