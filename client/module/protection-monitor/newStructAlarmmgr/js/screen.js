//视频播放入口
window.isHasTvwall = "isHasTvwall";
define([
	'jquery', 
	'./model/preventcontrol-model',
	'pubsub',
	'./global-varibale',
	'./controller/common-alarm-lineTools',
	'/module/inspect/monitor/js/controlbar.js', 
	'mootools', 
	'handlebars', 
	'base.self', 
	'/module/common/js/player2.js'
], function(jQuery, preCtrModel,PubSub,_g,lineTools) {

	var ExpandScreen = new new Class({

		Implements: [Options, Events],

		screenPlayer: null, //播放器对象

		curIndex: 0, //播放通道

		videoLoop: 0, //超过16个视频时,从0开始的标示.

		initFlag: true, //是否是首次进入扩展屏播放

		defaultLayout:4,//默认加载为4分屏

		initialize: function(options) {
			var self = this;
			self.setOptions(options);
			self.bindEvents();
			self.initOCX();
			self.relaodVedio();
			
			
		},
		/**
		 * 初始化播放器
		 * @return {[type]} [description]
		 */
		initOCX: function(){
			var self = this;
			//初始化分屏
			document.getElementById("UIOCX").SetLayout(4);
			//初始化播放插件
			self.screenPlayer = _g.videoPlayer = new VideoPlayer({
				layout: 4,
				uiocx: "UIOCX",
				displayMode: 1
			});
			//新建播放器class
			ControlBar.bindEvents(self.screenPlayer); //绑定事件
			//视频播放事件绑定
			self.screenPlayer.on("switch",function(oldindex,newindex){
				self.changeCurr(oldindex,newindex);
			});
			self.screenPlayer.on("enter",function(index){
				if(_g.curScreenCameraIds[parseInt(index)]!==null){
					if(_g.curScreenCameraIds[parseInt(index)].type==="defenceTask"){
						jQuery("#taskSelect").show(0);
					}else if(_g.curScreenCameraIds[parseInt(index)].type==="contrlTask"){
						jQuery("#taskSelect").hide(0);
					}
				}
				
			});
		},
		// 播放视频
		autoPlay: function(cameras) {
			var self = this;
			var index = 0;
			var soundIndex;
			var layout = window.opener.gVideoPlayer.getLayout();
			var nowLayout = self.screenPlayer.getLayout();
			if (layout !== nowLayout) {
				jQuery('.icon.split').css('background-position', '0px ' + (Math.sqrt(layout) - 1) * (-34) + 'px'); //布局切换按钮样式
				//self.screenPlayer.setLayout(layout); //切换布局
			}

			for (var i = 0; i < cameras.length; i++) {
				var camera = cameras[i];
				if (camera !== -1) {
					soundIndex = index;
					var curIndex = self.getCurIndex();
					this.screenPlayer.playExpandStream(Object.clone(camera), curIndex);
					index++;
					//如果原窗口中有声音，则保留
					if (camera.isMute) {
						this.screenPlayer.soundControl(soundIndex, true);
					}
					//为球机设置云台速度.
					if (camera.cType === 1) {
						self.screenPlayer.setPtzSpeed(8, curIndex);
					}
				} else {
					index++;
				}
			}
		},

		//指定通道播放
		playByIndex: function(camera,firstcallback,callback) {
			if (camera) {
				var self = this,
					operate = camera.operate,
					position = camera.position;

				if (operate === 0 && self.screenPlayer.cameraData[position] !== -1) { //关闭当前通道视频
					self.screenPlayer.stop(false, position);
					self.screenPlayer.refreshWindow(position);
				} else if (operate === 1) { //在position通道播放视频,如果已有视频播放,挤占.
					if (self.screenPlayer.cameraData[position] === -1) {
						self.screenPlayer.playExpandStreamEx(Object.clone(camera), position,function(){
							self.screenPlayer.manualFocusChannel =-1;
							firstcallback && firstcallback();
						},function(){
							callback && callback();
						});
					} else {
						self.screenPlayer.stop(false, position);
						self.screenPlayer.refreshWindow(position);
						self.screenPlayer.playExpandStreamEx(Object.clone(camera), position, function(){
							self.screenPlayer.manualFocusChannel =-1;
							firstcallback && firstcallback();
						},function(){
							callback && callback();
						});
					}
					logDict.insertMedialog("m9", "查看：" + camera.cName + "->摄像机实时视频", "f10", "o4", camera.cName); 	
				}
			}
		},

		getCurIndex: function() {
			var self = this;
			var ary = self.screenPlayer.getIdleWindows();
			var curLayout = self.screenPlayer.getLayout();

			//找到可用的空闲窗口
			if (ary.length > 0) {
				return ary[0];
				//当前窗口全为忙碌状态
			} else {
				self.screenPlayer.stop(false, self.screenPlayer.manualFocusChannel ===-1?self.videoLoop:self.screenPlayer.manualFocusChannel);
				if (self.videoLoop === curLayout) {
					self.videoLoop = 0;
					return self.videoLoop++;
				}
				return self.videoLoop++; //检查标志位自增
			}
		},

		sendPlayData: function(cameraId,type,firstcallback,callback) {
			var self = this;
			//第一步：获取摄像机播放信息
			preCtrModel.ajaxEvents.getCameraInfoByCameraId({
				cameraId:cameraId
			},function(res) {
				if(res.code === 200 && res.data.data){
					var newCameraData = self.reciveData(res.data.data);
					//查看摄像机是否在线

					var status = res.data.data.camera_status;
					if(status===1 || status==="1" ){
						jQuery("#taskSelect").hide(0);
					}
					//第二步：获取当前空闲屏
					var emptyIndex = self.getCurIndex(),screenIndex;
					if(self.screenPlayer.manualFocusChannel===-1 ){
						screenIndex = emptyIndex;
						self.screenPlayer.setFocusWindow(emptyIndex);
					}
					if(self.screenPlayer.manualFocusChannel!==-1){
						screenIndex = self.screenPlayer.manualFocusChannel;
					}
					//第三步：播放
					var formatData = self.convertCamera(newCameraData);
					formatData.operate =1;
					formatData.position = screenIndex;
					var CommonView = require('./js/view/common-task-view');
					if(jQuery("#major").attr("data-currpart")!=="ocx"){//如果当前不是实时模式，自动切换
						CommonView.showChangeLayout(function(){
							self.playByIndex(formatData,function(){
								//第四步：存储播放摄像机的id
								_g.curScreenCameraIds[screenIndex] ={
										cId:cameraId,
										type:type
								}
								_g.currIndex = screenIndex;
								PubSub.publish("toDealDefaultCurrData", {}); //触发后续操作
								firstcallback && firstcallback();
							},function(){
								self.setNextPlay(callback);
							});
							
						});

					}else{
						self.playByIndex(formatData,function(){
							//第四步：存储播放摄像机的id
							_g.curScreenCameraIds[screenIndex] ={
									cId:cameraId,
									type:type
							}
							_g.currIndex = screenIndex;
							PubSub.publish("toDealDefaultCurrData", {}); //触发后续操作
							firstcallback && firstcallback();
						},function(){
							self.setNextPlay(callback);
						});
					}
					
				}
			}, function() {
				notify.error("网络或服务器异常！");
			});
		},
		setNextPlay:function(callback){
			jQuery("#videoControl").css({"left":"10000px","display":"none"});
			if(callback && typeof callback ==="function"){
				callback&&callback();
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
				"type": 1, //实时流,
				"sdChannel":camera.sdChannel,
				"hdChannel":camera.hdChannel
			};
		},
		//重新加载数据
		refreshData: function() {
			var self = this;
			//轮巡监巡进行中 opener.LoopInspect.isGoing		
			var cameras = window.opener.extendScreenDate.slice(0); //将父页面的extendScreenDate的拷贝拿出来
			//地图上发送扩展屏
			if (cameras[0].operate !== undefined && cameras[0].position !== undefined) {
				self.playByIndex(cameras[0]);
			} else {
				self.autoPlay(cameras);
			}

		},

		refreshGuardRouteData: function() {
			var self = this;
			var cameras = window.opener.extendScreenDate.slice(0); //将父页面的extendScreenDate的拷贝拿出来
			if (cameras) {
				/*window.onload = function () {*/
				self.screenPlayer.setLayout(4);
				for (var i = 0, j = cameras.length; i < j; i++) {
					if (cameras[i]) {
						if (cameras[i].operate !== undefined && cameras[i].position !== undefined) {
							if (self.initFlag && cameras[i].operate !== 0) {
								var num = i;
								self.playByIndex(cameras[num]);
								self.initFlag = false;
							} else {
								self.playByIndex(cameras[i]);
							}
						}
					}
				}
			}
		},
		//根据互换屏幕的索引交换数据
		changeCurr:function(sc1,sc2){
			var data =_g.curScreenCameraIds;
			var sc1Data = data[sc1];
				data[sc1] = data[sc2];
				data[sc2] = sc1Data
		},
		relaodVedio:function(){
			var self = this;
			lineTools.init(self.screenPlayer);
		},
		bindEvents: function() {
			var self = this;
			//手动切换布局 start
			jQuery('body').on('click', '.split-panel i', function() {
				var layout = jQuery(this).data('layout');
				self.screenPlayer.setLayout(layout);
				jQuery('.icon.split').css('background-position', '0px ' + (Math.sqrt(layout) - 1) * (-34) + 'px');
				if (jQuery('.select-panel').is('.active')) {
					jQuery("#layoutscreen").hide(); //兼容谷歌重新写个iframe 让其隐藏。 by wangxiaojun 2015.01.22
				}
				jQuery('.select-panel').toggleClass('active');
				jQuery('.ui.atached.menu .split').removeClass('clicked active').attr('title', layout + '分屏');
			});

			jQuery('body').on('click', '.header .split', function(event) {
				if (jQuery('.select-panel').is('.active')) {
					jQuery("#layoutscreen").hide(); //兼容谷歌重新写个iframe 让其隐藏。 by wangxiaojun 2015.01.22
				} else {
					jQuery("#layoutscreen").show(); //兼容谷歌重新写个iframe 让其显示。 by wangxiaojun 2015.01.22
				}
				jQuery('.select-panel').toggleClass('active');


			});
			//手动切换布局 end

			//全屏
			jQuery('body').on('click', '.header .fullscreen', function(event) {
				self.screenPlayer.displayFullScreen();
			});
			jQuery('body').on('click', '#upBlockContent .tools-up .close', function(event) {
				var index= jQuery(this).closest('#upBlockContent').find("#taskSelect").attr("data-cindex"),cameraId =jQuery(this).closest('#upBlockContent').find("#taskSelect").attr("data-cameraid");
				var type =  _g.curScreenCameraIds[index]?(_g.curScreenCameraIds[index].type=== "defenceTask" ? "defence" : "contrl"):"defenceTask";
				var CommonView = require('./js/view/common-task-view');
				_g.curScreenCameraIds[index] = null;
				CommonView.changeCameraIcon(type);
				jQuery("#taskContent,#taskPart").hide();

			});
			//关闭所有视频
			jQuery('body').on('click', '.header .close', function(event) {
				self.videoLoop = 0;
				for (var i = 0; i < self.screenPlayer.cameraData.length; i++) {
					if (self.screenPlayer.cameraData[i] !== -1) {
						self.screenPlayer.stop(false, i);
					}
				}
				//清空当前储存的摄像机列表
				_g.curScreenCameraIds = [null,null,null,null];
				var CommonView = require('./js/view/common-task-view');
				CommonView.changeCameraIcon();
			});
		}
	});
	return ExpandScreen;

});