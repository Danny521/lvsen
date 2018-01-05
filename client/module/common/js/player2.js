define(['jquery','pubsub','mootools','pvaConfig'],function(jQuery,Pubsub){
	var VideoPlayer = new Class({
		Implements: [Options, Events],
		curChannel: -1,//当前窗口序号
		focusChannel: -1,//聚焦的窗口
		manualFocusChannel: -1,//手动单击聚焦的通道号，用户单击后有效，并只有效一次
		coverIndex: 0,//进行视频覆盖的指针
		curMaxWinChannel:-1,//当前最大化的窗口
		videoLoop: 0, //全局视频替换变量，从0--15，重复循环   setFreePath函数有调用
		ratioData:[],//每个窗口的比例状态 默认都是拉伸
		grabIndex:-1,//记录getPicInfo()是的窗口位置，方便窗口resize时重新计算遮挡层位置。
		isRunningInspect:false,//轮巡监巡是否启动中，默认false
		cameraDataCache:{},//摄像机信息缓存，主要是通过id获取通道信息时使用
		requestObj:[],//存储重复请求定时器
		PTZContorlDeffered:null,
		options: {
			ip: '192.168.60.170',
			port: 2100,
			user: 'admin',
			passwd: 'admin',
			path: null,
			type: null,//播放类型
			vodType: null,//录像深度
			begintime: null,
			endtime: null,
			cId: null,//具体对应于某个摄像头
			cameraType: null,//具体对应某个摄像头编码（对摄像头的唯一标识）
			starttime: null,
			// index: null,
			autoplay: true,
			loop: false,
			width: 0,
			height: 0,
			layout: 4, //播放器布局
			resize:false,
			eventEnable:true,
			uiocx: 'UIOCX',
			displayMode: 0 //设置摄像机的播放模式（0为普通模式，1为布防模式）,at 2014-6-17
		},
		DownLoadlist:{},
		initialize: function(options) {
			var self = this;
			this.setOptions(options);
			this.cameraData = this.options.cameraData || new Array(16).repeat(-1); //当前通道对象数组，存放相关的信息.默认每组都为-1.代表没有视频在通道中
			this.ratioData = new Array(16).repeat(2);
			//alert("this.options.uiocx="+this.options.uiocx);
			this.playerObj = document.getElementById(this.options.uiocx);
			// this.playerObj = document.getElementById(this.options.uiocx);

			if(this.options.resize){
				this.resizeWin();
			}
			/**
			 * 设置ocx外围边框的颜色
			 */
			this.setVideoMarginColor();
			/**
			 * 云台控制相关事件绑定
			 */
			this.bindPTZContorlEvent();
			this.onMouseWheelEvent();
			this.playerObj.EnablePTZ(false);
			/**
			 * 启动ocx的加密/解密模式，by zhangyu on 2015/5/24
			 */
			this.playerObj.EnableDES(true);
			/**
			 * 根据配置设置视频播放窗口的拉伸或者原始形态，by zhangyu on 2015/7/24
			 */
			this.playerObj.SetRatio(window.ocxDefaultRatio, -1);
			/**
			 * 开启ocx数字放大的结束模式，by zhangyu on 2015.11.12 
			 */
			this.playerObj.SetOption(JSON.stringify({
				"handilyclosedzoom": {
					"enable": true
				}
			}));

			if (this.options.eventEnable) {
				this.bindEvents();
			}
		},
		/**
		* 给云台增加鼠标点击和键盘操作事件
		**/
		bindPTZContorlEvent: function() {

			var self = this;
			this.removeEvents("PTZContorlEvent", {
				internal: false
			});
			this.addEvent('PTZContorlEvent', function(curChannel, cmd, enable, nTrigger) {
				var data = this.cameraData[curChannel];

				if (nTrigger == 3 || nTrigger == 1) {
					PTZContorlDeffered = gPtz.setPTZDir({
						cameraId: data.cId,
						cameraNo: "",//data.playingChannel.path,
						cmd: cmd,
						param: Toolkit.getPtzSpeed(),
						playingChannelId: self.findcamid(data),//data.playingChannel.id,
						cName:data.cName
					});
				}
				if (nTrigger == 4 || nTrigger == 2) {
					PTZContorlDeffered.done(function(res) {
						if (res.code === 200) {
							setTimeout(function() {
								gPtz.stopPTZDir({
									cameraId: data.cId,
									cameraNo: "",//data.playingChannel.path,
									cmd: cmd,
									playingChannelId: self.findcamid(data),//data.playingChannel.id,
									cName:data.cName
								});

							}, 500);
						}
					});
				}
			});
		},
		/**
		 * [onMouseWheelEvent 鼠标滚轮通知]
		 * @author zhangxinyu
		 * @date 2015-08-06
		 * @return {[type]} [description]
		 */
		onMouseWheelEvent: function() {
			var self = this;
			/**
			 * [description]
			 * @param  {[number]} index [鼠标当前所在窗口序号，从0开始（鼠标移出控件则为-1）]
			 * @param  {[number]} data  [滚轮方向 120为向上，-120为向下]
			 * @param  {[number]} x     [鼠标所在点的X坐标]
			 * @param  {[number]} y     [鼠标所在点的Y坐标]
			 * @return {[type]}       [description]
			 */
			this.removeEvents("MouseWheelEvent", {
				internal: false
			});
			this.addEvent('MouseWheelEvent', function(index, data, x, y) {
				var param = 0;
				var flag = false;
				var timestamp = new Date().getTime();
				var time = timestamp - sessionStorage.getItem("timestamp"); //时间差
				if (data > 0) {
					param = 1;
				} else {
					param = -1;
				}
				var data = this.cameraData[index];
				//MouseWheelEvent事件是滚轮滚动一个就会执行一次，为避免多次调用影响用户体验，现增加执行两次滚轮事件时间差来解决此问题
				if (time > 500) {
					PTZContorlDeffered = gPtz.setPTZDir({
						cameraId: data.cId,
						cameraNo: "",//data.playingChannel.path,
						cmd: 11, //球机调焦
						param: param, //1：焦距变大 -1:焦距变小 0：停止变焦
						playingChannelId: self.findcamid(data),//data.playingChannel.id,
						cName:data.cName
					}).done(function() {
						sessionStorage.setItem("timestamp", new Date().getTime());
						setTimeout(function() {
							gPtz.stopPTZDir({
								cameraId: data.cId,
								cameraNo: "",//data.playingChannel.path,
								cmd: 11,
								playingChannelId: self.findcamid(data),//data.playingChannel.id,
								cName:data.cName
							});
						}, 500);
					});
				}
			});
		},
		/**
		 * [ShowError 提示报错信息]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[字符串]}   x [提示信息内容]
		 */
		ShowError: function(x) {
			if (x < 0 && typeof(notify) == "object") {
				//notify.warn("播放失败:"+this.getErrorCode(x+""));
			}
			return x;
		},
		/**
		 * [resizeWin 播放器自适应，根据父类元素自适应]
		 * @author huzc
		 * @date   2015-07-15
		 * @return {[字符串]}   [description]
		 */
		resizeWin:function(){
			var ocx = jQuery(this.options.uiocx);
			jQuery(window).resize(function(){
				var h = ocx.parent().height(),
					w = ocx.parent().width();
				ocx.height(h);
				ocx.width(w);
			});
			jQuery(window).trigger('resize');
		},
		/**
		* @options: {
		* 			type: //类型
		*			user: //用户名
		*			passwd:  //密码
		*			ip:  //IP地址
		*			port:  //端口号
		*			path:  //路径
		*         }
		**/
		/**
		 * [pretreat 预处理，参数检查]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   options [description]
		 * @return {[对象]}           [description]
		 */
		pretreat:function(options){
			var nativeKeys = ["type","user","passwd","ip","port","path"];
			if(typeOf(options)==="object"){
				var keys = Object.keys(options),
					isSame = true;
				for(var i = 0;i<nativeKeys.length;i++){
					if(keys.indexOf(nativeKeys[i])===-1){
						isSame = false;
						break;
					}
				}
				if(!isSame){
					notify.error("播放器打开输入参数错误,缺少参数");
					//console.log("type:",options.type,",user:",options.user,",passwd:",options.passwd,",ip:",options.ip,",port:",options.port,",path:",options.path)
				}
				return isSame;

			}else{
				notify.error("播放器打开输入参数错误，不是对象 ");
				return false;
			}
		},
		/**
		* 视频播放
		*   PlayEx2参数说明：1. "path"：Json字符转，播放对象的类型路径等信息
		*   PlayEx2参数说明：2. "pos"： 窗口索引
		*   PlayEx2参数说明：3. "startCallback"：播放动作完成后回调
		*   PlayEx2参数说明：4. "startCallbackCtx"：输入用户参数，同PlayEx参数4
		*   PlayEx2参数说明：5. "firstFrameCallback"：播放完成并真正显示出一帧画面时回调
		*   PlayEx2参数说明：6. "firstFrameCallbackCtx"：输入用户参数，同PlayEx参数6
        *   PlayEx2参数说明：7. "rcdEndCallback"：同Play2参数5
		*   PlayEx2参数说明：8. "rcdEndCallbackCtx"：输入用户参数，pRecordEndCallBack()会传给用户
		*
		* @options：视频播放参数
		*			实时流播放的基本参数（6个）：  type代表实时流
		*			{"type":1,"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1"}
		*			业务需要的参数（4个）（后续修改添加，请大家自行更新）：
		*			1."cType":摄像机类型（1:球击 0:枪击）
		*			2."cStatus":摄像机状态（0:在线 1:离线）
		*			3."cId":摄像机ID、"cName":摄像机名称
		*			4."cplayStatus":播放状态  0：正常播放  1：播放异常   2：没有进行播放（离线）
		* @index: 分屏索引
		**/
		play: function(options, index, disableFocus, callback) { /*该函数添加了type属性、cplayStatus属性、*/
			options.type = 1;
			var self = this,
				result = null;
			//扩展语音对讲接口, add by zhangyu, 2015.10.30
			self.extendTalkParam(options, index);
			jsonstr = JSON.stringify(options);
			var _afterPlay = function(res) {
				self.setDisplayStyle(options, index);
				if (!self.isRunningInspect && !disableFocus) { //具体参看上海权限版本，移植过来disablefocus参数，马越修改2015.03.05
					self.manualFocusChannel = -1;
					self.setFocusWindow(index);
				}
				self.saveCameraData(options, index); //存储摄像头信息
				//提示报错信息
				self.ShowError(res);
				//业务回调
				callback & callback(result);
			};
			//添加扩展字段cplayStatus
			if (!self.hasPermission(options.cameraId, index)) {
				options.cplayStatus = 5;
				_afterPlay(result);
				return;
			}
			//在离线判断
			if (parseInt(options.cStatus) !== 0) {
				options.cplayStatus = 2;
				_afterPlay(result);
				return;
			}
			//触发异步播放
			self.playerObj && this.playerObj.PlayEx2(jsonstr, index, function(res) {
				result = res;
				//打开成功的时
				if (result === 0) {
					options.cplayStatus = 0;
				} else {
					options.cplayStatus = 1;
				}
				_afterPlay(result);
			});
		},
		/**
		 * 根据摄像机是否支持语音对讲来扩展播放参数
		 * @param  {[type]} param [description]
		 * @param  {[type]} index [description]
		 * @return {[type]}       [description]
		 */
		extendTalkParam: function(param, index) {
			var self = this,
				curPlayData = self.cameraData[index];
			//获取对讲参数
			if (!curPlayData) {
				return;
			}
			/**
			 * 获取语音对讲信息, 后续需要优化此处代码
			 */
			jQuery.ajax({
				"url": "/service/video_access_copy/accessChannels",
				"data": {id: curPlayData.cId},
				"method": "get",
				"async": false,
				"timeout": 1000
			}).then(function(res){
				curPlayData = res.data.cameraInfo;
			});
			//获取可用通道
			var playChannel = null;
			if(curPlayData.sd_channel){
				//如果获取对讲信息成功
				playChannel = (curPlayData.sd_channel.length === 0) ? curPlayData.hd_channel[0] : curPlayData.sd_channel[0];
			} else {
				//容错处理，最坏的情况下语音对讲用不了，不至于报错
				playChannel = (curPlayData.sdChannel.length === 0) ? curPlayData.hdChannel[0] : curPlayData.sdChannel[0];
			}
			//判断是否支持对讲
			if (playChannel.audioName) {
				jQuery.extend(param, {
					"audio": playChannel.audioName, 		//对讲通道名称
					"audioin": playChannel.isAudioIn, 		//音频输入 （喊话）
					"audioout": playChannel.isAudioOut		//音频输出 （监听）
				});
			}
		},
		/**
		 * [playStream 播放实时流]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   options [{"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1"}]
		 * @param  {[数字]}   index   [分屏序号]
		 * @return {[数字]}           [0或者错误码]
		 */
		playStream:function(options, index, callback,firstFrameCallback){
			var self = this;
			var _afterPlayStream = function(res) {
				self.fireEvent("playStreamLog", index);
				WaterMark.setWatermark(self, index);
				self.ShowError(res);
				callback && callback(res);
			};
			if (typeof self.requestObj[index] == "object") {
				self.requestObj[index].num += 1;
			} else {
				self.requestObj[index] = {
					"index": index,
					"num": 1,
					"timmer": null
				}
			}
			options.type = 1;
			//扩展语音对讲接口, add by zhangyu, 2015.10.30
			self.extendTalkParam(options, index);
			var jsonstr = JSON.stringify(options);
			var res = self.playerObj.PlayEx2(jsonstr, index, function(index, result, param) {
				if (result < 0) {
					self.requestObj[index].timmer = setTimeout(function() {
						if (self.requestObj[index].num > 2) {
							_afterPlayStream(result);
							self.requestObj[index].num = 0;
							clearTimeout(self.requestObj[index].timmer);
							return;
						}
						self.playStream(options, index, callback);
					}, 100);
				}
				if (result == 0) {
					_afterPlayStream(result);
					self.requestObj[index].num = 0;
					clearTimeout(self.requestObj[index].timmer);
				}
			}, 0, function() {
				firstFrameCallback &&　firstFrameCallback();
			}, 0, function() {}, 0);
			if (res < 0) {
				console.log("play-error-code:", res);
				_afterPlayStream(res);
			}
		},
		/**
		 * [playStreams 精简版播放实时流]
		 * @param  {[type]}   options  [description]
		 * @param  {[type]}   index    [description]
		 * @param  {Function} callback [description]
		 * @return {[type]}            [description]
		 */
		playStreams: function(options, index, callback) {
			this.playerObj.PlayEx2(options, 0, function(index, result, userParam) {
				callback && callback(index, result, userParam);
			}, 0, function() {}, 0, function() {}, 0);
		},
		/**
		 * [playNPFS 播放pfs视频]
		 * @param: 视频播放参数
		*		  {"type":3,"filename":"NPFS:192.168.12.33:9000/username=admin&password=admin#/avi/人脸&车辆.mbf"," displayMode ":0}
		*		  {"type":3,"filename":http://localhost:8080/npweb/video_file/pfs_2_192.168.60.245:9000:admin:admin_video_fe428a14-194c-4b06-853a-1d419f31549c.mbf"," displayMode ":0}
		 * @param  {[type]} index              [窗口索引]
		 * @param  {[type]} pPlayStartCallBack [播放完成回调]
		 * @param  {[type]} lPlayStartParam    [用户参数]
		 * @param  {[type]} pRecordEndCallBack [播放完成并真正显示出一帧画面时回调]
		 * @param  {[type]} lRecordEndParam    [用户参数]
		 * @return {[type]}                    [description]
		 */
		playNPFS: function(param, index, playFirstSnapperCallback, playResultCallback, lPlayStartParam, pRecordEndCallBack, lRecordEndParam) {
			if(param){
				param.type = 3;
				param = JSON.stringify(param);
			}
			this.playerObj.EnableDES(false);
			playResultCallback = playResultCallback !== undefined ? playResultCallback : function() {};
			return this.playerObj.PlayEx2(param, index, playResultCallback, 0, playFirstSnapperCallback, 0, function() {}, 0);
		},
		//获取在线的数据  返回值如下
		/*	[{
			"ip": "192.168.12.93",
			"port": 2100,
			"username": "admin"，
			"password": "admin",
			"av_obj": "av/4",
			"channel_status": 0
		}, {
			"ip": "192.168.12.93",
			"port": 2100,
			"username": "admin"，
			"password": "admin",
			"av_obj": "av/4",
			"channel_status": 0
		}]*/
		/**
		 * [getOnlineChannels 获取在线通道列表]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数组]}   channels [channels：通道数组]
		 * @return {[数组]}            [description]
		 */
		getOnlineChannels:function(channels){
			var result = [];
			if(typeOf(channels)==='array'){
				channels.each(function(item,index){
					/**
					 * window.offlineCameraPlay,全局开关，标示在摄像机离线状态下，是否也进行开流
					 * modify by zhangyu 2016.04.16
					 */
					if(item.channel_status === 0 || (item.channel_status === 1 && window.offlineCameraPlay)){
						result.push(Object.clone(item));
					}
				});
			}
			return Array.clone(result);
		},
		/**
		 * [getSDHDchannels 获取高清或者标清通道]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数组]}   channels   [通道]
		 * @param  {[数字]}   streamType [0:标清 1：高清]
		 * @return {[数组]}              [通道数组]
		 */
		getSDHDchannels:function(channels,streamType){
			if(streamType===0){
				channels.definitionType = 0;//标示当前通道播放的视频类型（高清:1  or  标清:0），方便UI上高清标清显示时知道当前是什么状态
				return channels.sdChannel;
			}else{
				channels.definitionType = 1;
				return channels.hdChannel;
			}
		},
		/**
		 * [getDVRChannel 获取DVR通道视频]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数组]}   channels [通道数组]
		 * @return {[数组]}            [通道数组数据]
		 */
		getDVRChannel:function(channels){
			var result = {};
			if(typeOf(channels)==='array'){
				channels.each(function(item,index){
					if(item.pvg_group_id===2){
						return Object.clone(item);
					}
				});
			}
		},
		/**
		 * [getChannel 获取指定通道数据(从后往前取)]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数组]}   channels    [channels：通道数组]
		 * @param  {[数字]}   channelType [1(PVG5.11)、2(DVR)、3(NVR)、4(非DVR)]
		 * @return {[数组]}               [指定通道数据]
		 */
		getChannel:function(channels,channelType){
			if(typeOf(channels)==='array'){
				var result = [];
				var i = channels.length;
				while(i--){
					if(channelType!==4){
						if(channels[i].pvg_group_id === channelType){
							result.push(Object.clone(channels[i]));
						}
					}else{
						if(channels[i].pvg_group_id !== 2){
							result.push(Object.clone(channels[i]));
						}
					}
				}
				return result;
			}
		},
		/**
		 * [getPlayChannel 获取准备播放历史录像的通道的所有数据,在播放历史的时候使用 by hu]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数组]}   A     [数组]
		 * @param  {[数字]}   index [分屏序号]
		 * @param  {[字符串]}   type  [类型]
		 * @return {[对象]}         [历史录像的通道的所有数据]
		 */
		getPlayChannel:function(A,index,type)
		{
			var camera =A[index];
			if(!type){type="C";}
			var hd="hd"+type+"hannel";
			var sd="sd"+type+"hannel";
			if (camera[hd]&&camera[hd].length > 0)
			{
				return camera[hd][0];	//目前只有1个
			}
			else if (camera[sd]&&camera[sd].length > 0)
			{
				for (var i=0; i < camera[sd].length; i++)
				{
					var group_id=camera[sd][i].pvg_group_id;
					//1表示编码器，没有录像；2表示DVR
					if (group_id == 2 || group_id == 3)
					{
						return camera[sd][i];
					}
					else if(group_id ==1)
					{
						return false;
					}
				}
			}
			return false;
		},
		/**
		 * [formatStreamDate 格式化数据格式]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[时间]}   date [通道参数]
		 * @return {[json]}        [播放实时流格式化]
		 */
		formatStreamDate:function(date){
			var tem = {};
			tem.ip = date.ip;
			tem.port = date.port;
			tem.user = date.username;
			tem.passwd = date.password;
			tem.path = date.av_obj;
			tem.hwdecoder = date.hwdecoder; // by songxj
			tem.id = date.id;
			return tem;
		},
		/**
		 * [playExpandStreamOld 扩展屏调用 已废弃]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   cameraInfo [{"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1","cplayStatus":"0","cType":1},目前非gVideoPlayer中的摄像机调用该函数时，cplayStatus默认为0]
		 * @param  {[数字]}   index      [description]
		 */
		playExpandStreamOld:function(cameraInfo,index){
			var self = this,
				playStatus = -1;
			self.saveCameraData(cameraInfo,index);//保存数据到cameraData数组中
			if (cameraInfo.cplayStatus===0) {
				playStatus = self.playStream(cameraInfo,index);
				//此处的判断为非gVideoPlayer时做的处理。 如果后续扩展屏需要添加页面，此处还需优化
				if (playStatus!==0) {
					self.setStyle(1,index);
				}
			}
			WaterMark.setWatermark(this,index);//加水印
			self.setPlayerStyle(index);
		},
		/**
		 * [playExpandStream 扩展屏调用]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   cameraInfo [{"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1","cplayStatus":"0","cType":1},目前非gVideoPlayer中的摄像机调用该函数时，cplayStatus默认为0]
		 * @param  {[数字]}   index      [description]
		 */
		playExpandStream: function(cameraInfo, index, callback) {
			var self = this,
				playStatus = -1;
			cameraInfo.cplayStatus = undefined;
			self.saveCameraData(cameraInfo, index); //保存数据到cameraData数组中
			if (cameraInfo.cStatus === 0) { //在线
				self.playStream(cameraInfo, index, function(res) {
					if (res !== 0) {
						self.cameraData[index].cplayStatus = 1;
						self.setStyle(1, index);
					} else {
						self.cameraData[index].cplayStatus = 0;
					}
					WaterMark.setWatermark(this, index); //加水印
					self.setPlayerStyle(index);
					callback && callback(res);
				});
			} else if (cameraInfo.cStatus === 1) {
				self.cameraData[index].cplayStatus = 2;
			}
		},
		/**
		 * 扩展屏调用
		 * @cameraInfo:{"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1","cplayStatus":"0","cType":1}
		 * 目前非gVideoPlayer中的摄像机调用该函数时，cplayStatus默认为0
		 * firstFrameCallback播放完第一帧回调，add by leen.z 
		 **/
		playExpandStreamEx:function(cameraInfo,index,callback,firstFrameCallback){
			var self = this,
				playStatus = -1;
			cameraInfo.cplayStatus = undefined;
			self.saveCameraData(cameraInfo,index);//保存数据到cameraData数组中
			if (cameraInfo.cStatus===0) {//在线
				if(self.options.displayMode === 1){
					cameraInfo.displayMode = 1;
				}
				self.playStream(cameraInfo, index, function(res) {
					//此处的判断为非gVideoPlayer时做的处理。 如果后续扩展屏需要添加页面，此处还需优化
					if (res !== 0) {
						self.cameraData[index].cplayStatus = 1;
						self.setStyle(1, index);
					} else {
						self.cameraData[index].cplayStatus = 0;
					}
					WaterMark.setWatermark(self,index);//加水印
					self.setPlayerStyle(index);
					callback && callback();
				},firstFrameCallback);
			}else if (cameraInfo.cStatus===1) {
				self.cameraData[index].cplayStatus = 2;
			}
			WaterMark.setWatermark(this,index);//加水印
			self.setPlayerStyle(index);
		},
		/**
		 * [updatePlayStatus 更新播放状态]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏索引号]
		 */
		updatePlayStatus:function(index){
			var self = this;
			var camera = self.cameraData[index];
			if(camera.hdStatus===undefined&&camera.sdStatus===undefined){
				if(!(camera.hdChannel&&camera.hdChannel.length)){//强化判断条件
					camera.hdStatus = false;
				}else{
					camera.hdStatus = true;
				}
				if(!(camera.sdChannel&&camera.sdChannel.length)){
					camera.sdStatus = false;
				}else{
					camera.sdStatus = true;
				}
			}
		},
		/**
		 * [getPlayableChannels desc获取可以播放的通道(暂未使用)ription]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数组]}   channels [摄像机通道数组]
		 * @return {[数组]}            [description]
		 */
		getPlayableChannels:function(channels){
			var result = [];
			if(typeOf(channels)==='array'){
				var i = channels.length;
				while(i--){
					if(channels[i].enablePlay){
						result.push(channels[i]);
					}
				}
			}
			return result;
		},
		/**
		 * [setChannelEnable 设置每个通道是否可以正常播放  扩充enablePlay属性(暂未使用)]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数组]}   channels [摄像机通道数组]
		 * @param  {[数字]}   index    [分屏索引号]
		 */
		setChannelEnable:function(channels, index, callback){
			var self = this;
			if (typeOf(channels) === 'array') {
				var i = channels.length;
				while (i--) {
					(function(j) {
						var tem = self.formatStreamDate(channels[j]);
						self.playStream(tem, index, function(res) {
							if (res === 0) {
								channels[j].enablePlay = true;
							} else {
								channels[j].enablePlay = false;
							}
							self.stopStream(index);

						});
					})(i);
				}
			}
		},
		/**
		 * [hasPermission 判断某摄像机是否有权限]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   id    [摄像机id]
		 * @param  {[数字]}   index [分屏索引号]
		 * @return {Boolean}        [是否有权限]
		 */
		hasPermission:function(id,index){
			var flag = permission.stopFaultRightById([id])[0];
			//this.cameraData[index].hasPermission = flag;//无权限
			return flag;
		},
		/**
		 * [playSHstream 高清/标清播放  ]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   cameraInfo   [格式{"hdChannel":[{"id":19,"ip":"192.168.60.181","port":2100,"username":"admin","password":"admin","av_obj":"av/181_173/15013002","channel_status":0,"pvg_group_id":3}],"sdChannel":[{"id":19,"ip":"192.168.60.181","port":2100,"username":"admin","password":"admin","av_obj":"av/181_173/15013002","channel_status":0,"pvg_group_id":2}],"cId":19,"cName":"浦东分局模拟摄像机测试19","cCode":15164646,"cType":1,"cStatus":0}]
		 * @param  {[数字]}   index        [分屏索引号]
		 * @param  {[数字]}   type         [0标清  1高清]
		 * @param  {[布尔]}   disable      [是否设置遮挡层  true:不设置   非真：设置（可以为空）]
		 * @param  {[布尔]}   disableStyle [是否设置遮挡层  true:不设置   非真：设置（可以为空）]
		 */
		playSHstream: function(cameraInfo, index, type, disable, disableStyle) {

			var playOK = -1, //播放状态
				self = this;

			function enplay(ary, type, callback) {
				var aryCopy = Array.clone(ary);
				var i = aryCopy.length;
				while (i--) {
					var t = self.formatStreamDate(ary[i]);
					self.playStream(t, index, function(res) {
						self.cameraData[index].playingChannel = t; //存放当前正在播放的通道信息
						playOK = res;
						if (type === 0 && playOK != 0) {
							//DVR播放失败后或者没有找到DVR时播放PVG
							//获取高清/标清通道信息
							var channels = self.getSDHDchannels(self.cameraData[index], type);
							//获取在线的数据信息
							var onlineChannels = self.getOnlineChannels(channels);
							var PVGChannels = self.getChannel(onlineChannels, 4);
							if (PVGChannels.length) {
								enplay(PVGChannels, type);
							}
							return;
						}
						if (playOK !== 0) {
							if (type === 0) {
								self.cameraData[index].sdStatus = false;
							} else {
								self.cameraData[index].hdStatus = false;
							}

							self.cameraData[index].cplayStatus = 1;
						} else {
							if (type === 0) {
								self.cameraData[index].sdStatus = true;
							} else {
								self.cameraData[index].hdStatus = true;
							}
							self.cameraData[index].cplayStatus = 0;
						}
						callback && callback();
						if (res === 0) {
							return; //异步接口，应该return不了,暂时放到这里
						}
					});
				}
			}

			function _afterPlaySHstream() {
				self.cameraData[index].playingChannel.cplayStatus = self.cameraData[index].cplayStatus;
				self.cameraData[index].playingChannel.cName = self.cameraData[index].cName;
				self.cameraData[index].playingChannel.cType = self.cameraData[index].cType;
				self.cameraData[index].playingChannel.cCode = self.cameraData[index].cCode;
				self.cameraData[index].playingChannel.ratioType = 2; //设置过画面比例取值默认为2拉伸,用于扩展屏
				self.fireEvent('CHECKRESTREE', {
					cameraId: self.cameraData[index].cId
				});
				!disableStyle && self.setPlayerStyle(index); //设置播放器样式
				self.manualFocusChannel = -1; //清除手动聚焦标识
				self.setFocusWindow(index); //设置聚焦
			}
			self.stop(false, index, disable); //关闭当前通道
			delete cameraInfo.zoomType; //清除放大标志位。马越
			self.saveCameraData(cameraInfo, index); //保存数据到cameraData数组中
			if (self.hasPermission(cameraInfo.cameraId || cameraInfo.cId, index)) {
				//更新播放状态
				self.updatePlayStatus(index);
				//获取高清/标清通道信息
				var channels = self.getSDHDchannels(self.cameraData[index], type);
				//获取在线的数据信息
				var onlineChannels = self.getOnlineChannels(channels);

				//没有找到在线的通道
				if (onlineChannels.length < 1) {
					self.cameraData[index].cplayStatus = 2; //离线
					if (type === 0) {
						self.cameraData[index].sdStatus = false; //高清标清切换switchDefinition()时使用，以防止高清标清都切换失败时，死循环切换
					} else {
						self.cameraData[index].hdStatus = false;
					}
					//假数据
					var tem3 = {
						'ip': 0,
						'port': 0,
						'user': 0,
						'passwd': 0,
						'path': 0,
						'cplayStatus': 2,
						'cType': self.cameraData[index].cType,
						'id': 0
					};
					self.cameraData[index].playingChannel = tem3; //存放当前正在播放的通道信息
					//找到在线的通道
				} else {
					if (type === 0) { //标清
						//先播放DVR的
						var DVRChannels = self.getChannel(onlineChannels, 2);
						if (DVRChannels.length) {
							enplay(DVRChannels, type, function() {
								_afterPlaySHstream();
							});
						}
					} else { //高清
						enplay(onlineChannels, type, function() {
							_afterPlaySHstream();
						});
					}
				}
			} else {
				self.cameraData[index].playingChannel = {};
				self.cameraData[index].cplayStatus = 5; //无权限
				_afterPlaySHstream();
			}
		},
		/**
		 * [setPlayingChannel 修复playingChannel的数据格式]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   data  [数据]
		 * @param  {[数字]}   index [分屏序号]
		 */
		setPlayingChannel:function(data,index){
			var playingData = Object.clone(data);
			playingData.cCode = this.cameraData[index].cCode;
			playingData.cName = this.cameraData[index].cName;
			playingData.cType = this.cameraData[index].cType;
			playingData.ratioType = this.cameraData[index].ratioType;
			this.cameraData[index].playingChannel = playingData;
			// playingData.cplayStatus = this.cameraData[index].cplayStatus;
		},
		/**
		 * [setPlayStatus 设置cplayStatus属性 "cplayStatus":播放状态  0：正常播放  1：播放异常  2：没有进行播放（离线） 5：没有权限]
		 * @author Mayue
		 * @date   2015-04-18
		 * @param  {[对象]}   playResult [数据]
		 * @param  {[数字]}   index      [分屏序号]
		 */
		setcplayStatus:function(playResult,index){
			if (playResult==='') {return;}
			var cameraID = this.cameraData[index].cId;
			var cplayStatus = 0;
			var status = this.cameraData[index].cStatus;//0在线  1离线
			/*if (!permission.stopFaultRightById([cameraID])[0]) {
				cplayStatus = 5;
			}*/
			if (status) {//离线
				cplayStatus = 2;
			}else{//在线
				playResult?0:1;
			}
			this.cameraData[index].cplayStatus = cplayStatus;
		},
		/**
		 * [高标清切换  只针对高清摄像机，未使用]
		 * @author Mayue
		 * @type: 0:标清  1：高清
		 * @index: 分屏索引号
		 * @date   2015-04-18
		 * @return {[type]}   [description]
		 */
		switchSH:function(index,type){

		},
		/**
		 * [routeSD 标清的路由选择  优先选择dvr 失败后选择编码器]
		 * @author Mayue
		 * @date   2015-04-18
		 * @param  {[数字]}   index [播放器窗口索引]
		 * @return {[布尔]}         [description]
		 */
		routeSD:function(index){
			var self = this;
			var data = self.cameraData[index];
			var sdchannel = data.sdChannel;
			var playResult = false;
			//判断标清通道是否可用
			if (!sdchannel || !sdchannel.length) {
				playResult = '';
				self.setcplayStatusAfterPlay(playResult, index);
				self.setOCXstyle(index);
				self.setRealVideoType(index);
				return;
			}
			//按照pvg_group_id进行排序DVR的pvg_group_id等于2  编码器的pvg_group_id等于1
			data.sdChannel.sort(function(a, b) {
				var aType = a['pvg_group_id'];
				var bType = b['pvg_group_id'];
				return bType - aType;
			});
			//遍历标清通道，播放并更新状态
			for (var i = 0; i < sdchannel.length; i++) {
				(function(j) {
					var tem = self.formatStreamDate(sdchannel[j]);
					//播放
					self.playStream(tem, index, function(res) {
						if (res === 0) {
							playResult = true;
						} else {
							playResult = false;
						}
						self.setPlayingChannel(tem, index);
						//更新状态
						if (!playResult) {
							self.setcplayStatusAfterPlay(playResult, index);
							self.setOCXstyle(index);
							self.setRealVideoType(index);
						}
					});
				})(i);
			}
		},
		/**
		 * [routeHD 高清摄像机的路由选择]
		 * 在单屏或者有最大化的情况下，优先播放高清，高清失败然后播放标清。其他情况下优先播放标清，标清失败然后播放高清
		 * @author Mayue
		 * @date   2015-04-18
		 * @param  {[json]}   data  [摄像机数据]
		 * @param  {[数字]}   index [播放窗口索引]
		 * @return {[数字]}         [0或错误码]
		 */
		routeHD:function(index){
			var self = this;
			var layout = self.getLayout();
			var hasMaxWindow = self.isHaveMaxWindow();
			var channelType = (layout === 1 || hasMaxWindow) ? 1 : 0; //1：高清  0：标清
			self.playByChannelType(channelType, index);
		},
		/**
		 * [playByChannelType 根据需要优先播放的通道类型即type值进行播放，如果播放失败，则切换到type的另外一个值进行尝试播放]
		 * @author Mayue
		 * @date   2015-04-19
		 * @param  {[数字]}   type  [需要切换的通道类型： 1：高清  0：标清]
		 * @param  {[数字]}   index [播放窗口索引]
		 * @return {[数字]}         [0或错误码]
		 */
		playByChannelType:function(type,index){
			var self = this;
			var sdChannel = self.cameraData[index].sdChannel;
			var hdChannel = self.cameraData[index].hdChannel;
			var line = type ? hdChannel.length : sdChannel.length; //高标清合并数组的界限
			var playResult = false;
			var playData = type ? hdChannel.concat(sdChannel) : sdChannel.concat(hdChannel);
			//通道不可用
			if (!playData.length) {
				playResult = '';
				self.setcplayStatusAfterPlay(playResult, index);
				self.setOCXstyle(index);
				self.setRealVideoType(index);
			}
			//遍历通道
			for (var i = 0; i < playData.length; i++) {
				(function(j) {
					var tem = self.formatStreamDate(playData[j]);
					// playType = line>=(i+1)?type:(type===1?0:1);
					self.playStream(tem, index, function(res) {
						if (res === 0) {
							playResult = true;
						}
						self.setPlayingChannel(tem, index);
						if (!playResult) {
							self.setsdhdStatus(type, playResult, line, i, index);
							self.setcplayStatusAfterPlay(playResult, index);
							self.setOCXstyle(index);
							self.setRealVideoType(index);
						}
					});
				})(i);
			}
		},
		/**
		 * [setsdhdStatus 设置cameraData的hdStatus、sdStatus属性]
		 * 如果过界(详见代码)，那么说明line之前的都是false,line之后的根据最终结果而定.所以hdStatus、sdStatus都要更新
		 * 如果未过界(详见代码)，那么说明line之前已经播放成功，就是result,line之后的还没有遍历到，所以line之后的部分对应的xxStatus(详见代码判断)不能更新。
		 * @author Mayue
		 * @date   2015-04-19
		 * @param  {[数字]}   type   [最初想要切换的通道类型]
		 * @param  {[数字]}   result [播放结果]
		 * @param  {[数字]}   line   [高标清数组界限]
		 * @param  {[数字]}   lastI      [高标清数组遍历结束时的索引]
		 * @param  {[数字]}   index  [播放窗口索引]
		 */
		setsdhdStatus:function(type,result,line,lastI,index){
			var data = this.cameraData[index];
			if (line>=(lastI+1)) {//未过界限
				if (type===1) {
					data.hdStatus = result;
					this.fireEvent('HDvideo');
				}else{
					data.sdStatus = result;
					this.fireEvent('SDvideo');
				}
			}else{//过界限
				if (type===1) {
					data.sdStatus = result;
					data.hdStatus = false;
					this.fireEvent('SDvideo');
				}else{
					data.hdStatus = result;
					data.sdStatus = false;
					this.fireEvent('HDvideo');
				}

			}
		},
		/**
		 * [switchDefinition 切换高清标清]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index   [分屏序号]
		 * @param  {[数字]}   type    [0:标清  1：高清]
		 * @param  {[布尔]}   disable [是否设置视频遮挡层  true:不设置， 非真：设置(可以不传该参数) ]
		 */
		switchDefinition:function(index,type,disable){
			this.playByChannelType(type,index);
			return;
			var cameraCopy = Object.clone(this.cameraData[index]),
				camera = this.cameraData[index];
			//高标清通道有一个为空时将不切换
			// if (camera.hdChannel&&camera.sdChannel&&(!camera.hdChannel.length||!camera.sdChannel.length)) {return;}//马越注释，复杂会导致：摄像机只有一个高清通道时，在非1屏下播放失败
			//只有当前摄像机的所有通道中至少有一个可正常播放时，才切换
			if(camera.sdStatus||camera.hdStatus){
				if(type === 0){
					this.fireEvent('SDvideo');
				}else{
					this.fireEvent('HDvideo');
				}


				var result = this.playSHstream(cameraCopy,index,type,disable,true);
				if(!result){//打开失败
					if(type===1){//高清打开失败，自动切换回标清
						//notify.error('高清模式切换失败,系统自动切换回标清模式');
						return this.switchDefinition(index,0,disable);
					}else{//标清打开失败，自动切换回高清
						//notify.error('标清模式切换失败,系统自动切换回高清模式');
						return this.switchDefinition(index,1,disable);
					}
				}else{//打开成功
					return result;
				}
			}else{
				//notify.error('标清高清均无可用通道，切换失败');
			}
		},
		/**
		 * [pauseNPFS 停止播放视频（pfs）]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0或者错误码]
		 */
		pauseNPFS: function(index) {
			var self = this;
			self.playerObj.StopEx(true, index ,function(res){
                self.ShowError(res);
			} ,0);
		},
		/**
		 * [pause 暂停播放视频]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏索引号]
		 * @return {[数字]}         [0或者错误码]
		 */
		pause: function(index){
			var self = this;
			self.playerObj.StopEx(true, index ,function(res){
                self.ShowError(res);
			} ,0);
		},
		/**
		 * [stopStream 停止播放视频流]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [index：分屏索引号]
		 * @return {[数字]}         [0或者错误码]
		 */
		stopStream:function(index){
			var self = this;
			self.playerObj.StopEx(false, index ,function(res){
				self.playerObj.RefreshVideoWindow(index);
                self.ShowError(res);
			} ,0);
		},
		/**
		 * [stop 停止视频播放，关闭相应的云台，同时控制该位置的鼠标悬浮事件]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[布尔]}   bool    [暂未使用到，使用时直接默认为false即可]
		 * @param  {[数字]}   index   [分屏索引号]
		 * @param  {[布尔]}   disable [是否设置遮挡层  true:不设置   非真：设置（可以为空）]
		 */
		stop: function(bool, index, disable, callback) {
			var self = this;

			var camera = self.cameraData[index];
			if (camera && camera !== -1) {
				//清除掉重复请求定时器
				if(self.requestObj[index]) {
                   clearTimeout(self.requestObj[index].timmer);
				}
				//清除和这个通道相关的放大窗口
				var zoomType = camera.zoomType;
				if (zoomType !== undefined && zoomType !== null && zoomType !== -1) {
					self.stopZoom(index);
				}
				//关闭数据流
				var res = self.playerObj.StopEx(false, index , function(res) {
					//回调函数
					callback && callback();
					console.log("stop-done-code:", res);
				}, 0);
				if(res < 0) {
					//提示报错信息
					self.ShowError(res);
					//回调函数
					callback && callback();
					console.log("stop-error-code:", res);
				}
				//解决轮巡监巡是切换时面板会自动收缩  mayue
				if (!self.isRunningInspect) {
					self.fireEvent('CLOSEPTZ', this.cameraData[index].cId);
				}
				//取消左侧树上的播放状态
				self.fireEvent('CANCELCHECK', this.cameraData[index].cId);
				//如果当前鼠标在这个channel通道上，就隐藏遮挡层
				if(index === self.curChannel || index === self.manualFocusChannel) {
					//仅仅在抓图未开启时才对遮挡层做定位
					if (!jQuery(".screenshot-preview").is(":visible")) {
						//如果隐藏工具栏
						if (!disable) {
							//隐藏工具栏
							jQuery('.video-control').css('left', 10000);
							//恢复默认值
							self.curChannel = -1;
						}
					} else {
						//加上这行代码，主要为了解决，当前窗口有抓图，但是用户又手动聚焦后，双击左侧树播放时，抓图没有关闭的问题
						jQuery('.screenshot-preview .exit').trigger('click');
					}
				}
				//将序号为i的窗口置闲
				self.cameraData[index] = -1;
			}
		},
		/**
		 * [togglePlay 播放暂停开关，如果是播放状态则暂停，如果是暂停状态则播放,(实时流无效)   返回值0为正确； 非0为错误码]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏索引号]
		 * @return {[数字]}         [0或者错误码]
		 */
		togglePlay: function(index) {
			var N=this.playerObj.TogglePlay(index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},
		/**
		 * [printScreen 抓图 (抓拍的命名格式为路径：对象名_当前系统时间.jpg)  返回值0为正确； 非0为错误码]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏索引号]
		 * @return {[数字]}         [0或者错误码]
		 */
		printScreen: function(index) {
			var N = this.playerObj.CapturePicture(index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},
		/**
		 * [displayFullScreen 全屏]
		 * @author huzc
		 * @date   2015-07-15
		 */
		displayFullScreen: function() {
			var self = this;
			if(!self.isFullScreen()){
				self.playerObj.SetControlFullScreen();
			}
		},
		/**
		 * [cancelFullScreen 取消全屏]
		 * @author huzc
		 * @date   2015-07-15
		 */
		cancelFullScreen: function() {
			if(this.isFullScreen()){
				this.playerObj.RestoreControlScreenShow();
			}
		},
		/**
		 * [isFullScreen 检测当前状态是否全屏 返回true是有  false是没有]
		 * @author huzc
		 * @date   2015-07-15
		 * @return {数字}  [0或者错误码]
		 */
		isFullScreen: function(){
			return this.playerObj.IsControlFullScreen();
		},
		/**
		 * [isHaveMaxWindow 检测是否有最大化窗口  返回true是有最大化   false是没有最大化]
		 * @author huzc
		 * @date   2015-07-15
		 * @return {Boolean}  [成与否]
		 */
		isHaveMaxWindow: function(){
			var result = this.playerObj.IsHaveMaximizeWindow();
			return result===1?true:false;
		},
		/**
		 * [toggleScreen description]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [description]
		 * @return {[数字]}         [description]
		 */
		toggleScreen: function(index) {
			//TODO
		},
		/**
		 * [setLayout 设置分屏布局]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   layout [目前只能是1,4,9,16,41 ]
		 */
		setLayout: function(layout) {
			var self = this,
				oldLayout = self.getLayout();
			//如果将要切换的布局数小于当前布局数，则要关闭多出来的通道
			if (oldLayout > layout) {
				for (var i = layout; i < oldLayout; i++) {
					(function(j) {
						self.stop(false, j);
					})(i);
				}
			}

			if (!self.isHaveMaxWindow()) {
				self.playerObj.SetLayout(layout);

			} else {//如果当前通道是最大化，则取消最大化后进行布局切换
				if (self.isRunningInspect) {
					self.toggleWindowMaximize(this.curMaxWinChannel);
				}
				self.playerObj.SetLayout(layout);
			}

			if (layout<this.manualFocusChannel+1) {
				self.manualFocusChannel = -1;
			}

			self.videoLoop = 0;
		},
		/**
		 * [setLayoutBySH 高清标清播放时的布局切换]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   layout [目前只能是1,4,9,16,41   41表示4行1列 ]
		 */
		setLayoutBySH:function(layout){
			var oldLayout = this.getLayout();
			this.setLayout(layout);
			if(layout===1){
				this.curMaxWinChannel = -1;//切到一分屏时取消设置最大窗口
				//如果切换到一分屏，且第一分屏有视频数据，则将第一屏高清显示
				if(this.cameraData[0]!==-1){
					//有高清通道才切换成高清
					if(this.cameraData[0].hdChannel&&this.cameraData[0].hdChannel.length>0){
						var str=this.playerObj.GetVideoAttribute(0)+"";
						if(str!="ERROR"&&JSON.parse(str).videoType==1)
						{
							this.switchDefinition(0,1);
						}
					}
				}
			}else{
				//如果切换到非一分屏，且第一分屏有视频数据，则将第一屏标清显示
				var str=this.playerObj.GetVideoAttribute(0)+"";
				if(oldLayout===1&&this.cameraData[0]!==-1)
				{
					if(str!="ERROR"&&JSON.parse(str).videoType==1)
					{
						this.switchDefinition(0,0);
					}
				}
			}
		},
		/**
		 * [getLayout 获取目前分屏布局的编号(即是几分屏)，对应setLayout函数 ]
		 * @author huzc
		 * @date   2015-07-15
		 * @return {[数字]}   [分屏布局的编号]
		 */
		getLayout: function() {
			return this.playerObj.GetLayout();
		},

		toggleRecordVideo: function(cameraId) {
			// TODO
		},
		/**
		 * [getVersion 获取ocx版本号]
		 * @author huzc
		 * @date   2015-07-15
		 * @return {[字符串]}   [ocx版本号]
		 */
		getVersion: function() {
			return this.playerObj.GetVersion();
		},
		/**
		 * [toggleWindowMaximize 设置通道窗口最大化或者退出最大化]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0或者错误码]
		 */
		toggleWindowMaximize: function(index) {
			var self = this;
			var definitionType = self.cameraData[index].definitionType;
			if(this.isHaveMaxWindow()){
				//退出最大化
				if((definitionType!==undefined)&&(definitionType === 1)){
					this.switchDefinition(index,0);
				}
				this.curMaxWinChannel = -1;
			}else{
				//进入最大化
				if((definitionType!==undefined)&&(definitionType === 0)){
					this.switchDefinition(index,1);
				}
				this.curMaxWinChannel = index-0;
				this.setFocusWindow(index);
			}
			return this.playerObj.SetWindowMaximize(index);
		},
		/**
		 * [getError 获取上一个ocx接口的执行结果  正确返回错误码的解析字符串，错误返回"ERROR"]
		 * @author huzc
		 * @date   2015-07-15
		 * @return {[布尔]}   [上一个ocx接口的执行结果]
		 */
		getError:function(){
			var result = this.playerObj.GetLastError();
			if(result!=="ERROR"){
				//console.log("ERROR信息：",result);
				return result==="操作成功完成"?true:false;
			}
		},
		/**
		 * [setWindowRestore 设置占满控件大小的通道恢复正常大小(参数index为通道序号，起始值为0，从左到右，从上到下。左上角第一个为起始点)  返回值true为成功   false为失败]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 */
		setWindowRestore: function(index) {
			return this.playerObj.SetWindowRestore(index);
		},
		/**
		 * [getFocusWindow 获取焦点窗口  返回值为当前聚焦窗口号]
		 * @author huzc
		 * @date   2015-07-15
		 * @return {[数字]}   [焦点窗口]
		 */
		getFocusWindow: function() {
			var N = this.playerObj.GetFocusWindowIndex();
			//提示报错信息
			this.ShowError(N);
			return N;
		},
		/**
		 * [setFocusWindow 设置焦点窗口]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 */
		setFocusWindow: function(index) {
			this.focusChannel = index;
			this.playerObj.SetFocusWindow(index);
		},
		/**
		 * [getWindowCount 返回窗口数量  暂时未用到此接口]
		 * @author huzc
		 * @date   2015-07-15
		 * @return {[数字]}   [窗口数量]
		 */
		getWindowCount: function() {
			return this.playerObj.GetWindowCount();
		},
		/**
		 * [isFocusWindow 检查指定的窗口是否有焦点]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {Boolean}        [ 返回值：有焦点返回true，无焦点返回false]
		 */
		isFocusWindow: function(index){
			return this.playerObj.IsFocusWindow(index);
		},
		/**
		 * [getVideoRectByIndex 获取当前通道的左上角xy坐标和宽高 ]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[json]}         [返回值格式如：{"Left":1,"Top":1,"Width":570,"Height":185}]
		 */
		getVideoRectByIndex: function(index) {
			var jsonString = this.playerObj.GetVideoRectByIndex(index);
			try
			{
				return JSON.parse(jsonString);
			}catch(e){}
		},
		/**
		 * [setRatio 设置画面比例]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   type  [type 1:原始	2:拉伸	3 4:3 4 16:9	5 16:10]
		 * @param  {[数字]}   index [description]
		 */
		setRatio: function(type, index) {
			this.ratioData[index] = type;
			this.playerObj.SetRatio(type, index);
		},
		/**
		 * [getRatio 获取画面比例]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [返回值1、2、3、4、5分别代表设置原始、拉伸、4:3、16:9、16:10]
		 */
		getRatio: function(index){
			return this.playerObj.GetRatioCode(index);
		},

		/**
		 * [设置播放器样式]
		 * @author Mayue
		 * @date   2015-03-09
		 * @param  {[数字]}   type  [0 正常，  1 视频丢失  2 离线   3 cpu过高  5暂无权限访问]
		 * @param  {[数字]}   index [对应播放器窗口索引]
		 * @param  {[布尔]}   force [强制执行，跳过中的if判断]
		 */
		setStyle: function(type, index,force){
			//轮巡、监巡进行中且 type==0时不允许设置背景   关于监巡2组监巡分组中间的空白段  刷新用的是refreshWindow实现
			if (type === 0 && this.isRunningInspect && !force) {
				return false;
			}
			this.playerObj.SetStreamLostByIndex(type, index);
		},
		/**
		 * [播放器窗口上按照需要显示红色箭头]
		 * @author Mayue
		 * @date   2015-03-09
		 * @param  {[对象]}   player [播放器对象]
		 * @param  {[数字]}   index [当前鼠标进入的窗口索引]
		 */
		ptzRedArrow:function(index){
			var self = this,
				status = self.playerObj.GetVideoAttribute(index || 0),
				userID = jQuery('#userEntry').attr('data-userid'),
				param;
			if (status!=='ERROR'&&JSON.parse(status).videoType===1) {//有视频播放，并且是实时视频
				if (self.cameraData[index].cType===1) {//球击
					if (typeof(window.ControlBar)==='object') {
						var inspectStatus = window.ControlBar.getInspectStatus(index);
						if (inspectStatus.isGoing) {
							if (inspectStatus.type) {//轮巡
								if (inspectStatus.action) {//锁定

								}else{//未锁定
									self.switchPTZ(false, index);
									return;
								}
							}else{//监巡
								if (inspectStatus.action) {//暂停

								}else{//未暂停
									self.switchPTZ(false, index);
									return;
								}
							}
						}else{//经典模式

						}
						/*if (controlBar.runningStatus === 3) { //轮巡
							if (_.indexOf(LoopInspect.unlockedChannels, index) !== -1) {
								self.switchPTZ(false, index);
								return;
							}
						} else if (controlBar.runningStatus === 2) { //监巡
							if (!LoopInspect.isPausing) {
								return self.switchPTZ(false, index);
							}
						} else if (controlBar.runningStatus === 1) {//经典模式

						}*/
					}
					param = {
						cameraId: this.cameraData[index].cId||this.cameraData[index].id//cId是视频指挥页面，id是兼容扩展屏
					};
					window.gPTZService&&jQuery.when(gPTZService.checkMonopoly(param),gPTZService.checkLock(param)).done(function(monopolyRes,lockRes){
						if (lockRes[0].code === 200 && monopolyRes[0].code === 200) {
							var lockData = lockRes[0].data,
								monopolyData = monopolyRes[0].data,
								lockStatus = lockData.lock, //"1"锁定  "0"未锁定
								monopolyStatus = monopolyData.status, // "1"未独占  "0"独占
								flag = false,
								lockStatusTem = lockStatus === '1' ? true : false,
								monopolyStatusTem = monopolyStatus === '0' ? true : false;
							//未锁定  未独占时
							if (lockStatus === '0' && monopolyStatus === '1') {
								flag = true;
							} else { //独占或者锁定至少有一个发生时（操作）
								//只有当上面操作是当前用户自己执行的，且自己没有锁定时，才执行下面代码(即可以控制云台)
								if (lockData.userId === -1 && monopolyData.userId === parseInt(userID)) {
									if (lockStatus === '0') {
										flag = true;
									}
								}
							}
							self.switchPTZ(flag, index);
						}
					});
				}else{
					self.switchPTZ(false, index);
				}
			}
		},
		/**
		 * [setDisplayStyle 根据status显示播放器样式（显示离线、正常、打开异常、云台红色鼠标）]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   option [description]
		 * @param  {[数字]}   index  [description]
		 */
		setDisplayStyle:function(option,index){
			var status = option.cplayStatus,
				type = option.cType;
			switch(status)
			{
				case 0://正常
					this.setStyle(0,index);
					//球击
					if(type===1 && this.isRunningInspect){
						this.switchPTZ(true,index);
					}
					break;
				case 1://播放异常
					this.setStyle(1,index);
					//notify.error("视频打开失败，请检查设备后重试");
					break;
				case 2://没有打开（离线）
					this.setStyle(2,index);
				break;
			case 5://没有权限
				this.setStyle(5,index);
					break;
				default:
					//console.log("setDisplayStyle函数的status参数错误",status);
					break;
			}
		},
		/**
		 * [setPlayerStyle 设置播放器样式 基于setDisplayStyle的优化]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 */
		setPlayerStyle:function(index){
			var self = this,
			camera = self.cameraData[index],
			cameraId = camera.cId,
			status = camera.cplayStatus,
				type = camera.cType;
			switch(status)
			{
				case 0://正常
					this.setStyle(0,index);
					//球击
					if(type===1){
						if (!this.isRunningInspect) {
						if (window.controlBar) {
							controlBar.fireEvent('judgePermissionPtz',cameraId,index);
						}else{
							self.switchPTZ(true, index);
						}
						}
					}
					break;
				case 1://播放异常
					this.setStyle(1,index);
					//notify.error("视频打开失败，请检查设备后重试");
					break;
				case 2://没有打开（离线）
					this.setStyle(2,index);
				break;
			case 5://没有权限
				this.setStyle(5,index);
					break;
				default:
					//console.log("setDisplayStyle函数的status参数错误",status);
					break;
			}
		},
		/**
		 * [refreshWindow 刷新图像窗口]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0或者错误码]
		 */
		refreshWindow: function(index){
			return this.playerObj.RefreshVideoWindow(index);
		},
		/**
		 * [refreshAllWins 刷新全部图像窗口  仅仅供监巡时使用(2个监巡分组中间空白时)]
		 * @author huzc
		 * @date   2015-07-15
		 */
		refreshAllWins: function(){
			var layout = this.getLayout();
			while(layout--){
				this.playerObj.SetStreamLostByIndex(0, layout);  //0 正常，  1 无法打开，  2 离线， 3 CPU过高
			}
		},
		/**
		 * [digitalZoom 数字放大]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   type  [当前窗口放大0，其他窗口放大1]
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0或错误码]
		 */
		digitalZoom: function(type, index) {
			return this.playerObj.StartZoomByIndex(type, index);
		},
		/**
		 * [stopZoom 停止放大]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0或错误码]
		 */
		stopZoom: function(index){
			if (this.cameraData[index].hasOwnProperty('zoomType')) {
				delete this.cameraData[index].zoomType;
			}
			return this.playerObj.StopZoomByIndex(index);
		},
		/**
		 * [stopZoomStream 关闭放大流]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [放大流所在的窗口]
		 * @return {[数字]}         [0或错误码]
		 */
		stopZoomStream: function(index){
			return this.playerObj.StopZoomStream(index);
		},
		/**
		 * [setInfo 设置字符叠加信息]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   json  [description]
		 * @param  {[数字]}   index [分屏序号]
		 */
		setInfo: function(json, index){
			/*var json = {
				type: 0, // 0:文本
				x: 0.1,
				y: 0.1,
				text: str,
				font: "宋体",
				autocolor: 0,
				textcolor: 255,
				backcolor: 200,
				fontsize: 9.8,
				algin: 1
			};*/
			// var teststr = '{"type":0,"x":0.5,"y":0.5,"text":"头疼","font":"宋体","autocolor":0,"textcolor":80,"backcolor":200,"fontsize":9.8,"algin":1}';
			var jsonstr = JSON.stringify(json);
			// return this.playerObj.SetOSD(teststr, index);
			return this.playerObj.SetOSD(jsonstr, index);
		},
		/**
		 * [isBusy 检查闲忙状态]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {Boolean}        [true-忙 false-闲]
		 */
		isBusy: function(index){
			return this.playerObj.GetWindowBusyByIndex(index);
		},
		/**
		 * [setColor 设置画面参数调节（亮度、对比度、饱和度、色调）]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   jsonObj [JSON格式的字符串，（亮度、对比度、饱和度、色调）参数范围统一为【-127，127】Json格式：{"bright":100,"contrast":100,"saturation":100,"hue":100}]
		 * @param  {[数字]}   index   [分屏序号]
		 */
		setColor: function(jsonObj, index) {
			var str = JSON.stringify(jsonObj);
			var N = this.playerObj.SetColorAttribute(str, index);
			//提示错误信息
			this.ShowError(N);
		},
		/**
		 * [getColor 获取画面参数 正确返回JSON格式的画面参数，错误返回"ERROR" Json格式：{"bright":100,"contrast":100,"saturation":100,"hue":100}]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[json]}         [description]
		 */
		getColor: function(index) {
			return JSON.parse(this.playerObj.GetColorAttribute(index));
		},
		/**
		 * [toggleSound 声音控制，暂未使用]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 */
		toggleSound: function(index){
			var soundStatus = this.playerObj.IsSoundEnable(index);//错误返回负数 开启状态：1    静音状态：0
			if(soundStatus >= 0){
				var toggle = !parseInt(soundStatus,10);
				var N = this.playerObj.SoundEnable(toggle, index);
			}
			//提示报错信息
			this.ShowError(soundStatus);
			this.ShowError(N);
		},
		/**
		 * [isSoundEnable 声音状态]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {Boolean}        [开启返回1，未开启返回0，错误返回负数]
		 */
		isSoundEnable: function(index){
			var N = this.playerObj.IsSoundEnable(index);
			//提示报错信息
			this.ShowError(N);
		},
		/**
		 * [switchPTZ 云台控制]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[布尔]}   enable [enable :true表示打开，false表示关闭]
		 * @param  {[数字]}   index  [分屏序号]
		 */
		switchPTZ: function(enable, index) {
		//现在后端的云台控制权限是跟摄像机直接关联，permission接口不返回云台控制权限了，所以把此处的判断去掉
		//	if (window.permission&&(permission.klass["ptz-control"] === "ptz-control")) {
				try {
					this.playerObj.SetWindowPTZByIndex(enable, index);
				} catch(e){}
		//	}
		},
		/**
		 * [setPtzRange 设置云台控制箭头范围]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   unit       [0:像素为单位  1:百分比为单位]
		 * @param  {[数字]}   top_bottom [到窗口顶部和底部的距离]
		 * @param  {[数字]}   left_right [到窗口左边和右边的距离]
		 */
		setPtzRange: function(unit, top_bottom, left_right){
			return this.playerObj.SetPTZRange(unit, top_bottom, left_right);
		},
		/**
		 * [getVideoInfo 获取视频属性值]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数组]}         [{"videoType":0,"width":704,"height":480,"frameRate":0,"duration":0,"totalframes":0,"videoCodec":0,"audioCodec":0}  错误返回"ERROR"]
		 */
		getVideoInfo: function(index){
			var str = this.playerObj.GetVideoAttribute(index);
			return (str === "ERROR")? "" : JSON.parse(str);
		},
		/**
		 * [getPicInfo 获取图片信息	(预置位截图)]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [ 返回值：字符串，正确返回base64编码的图片信息，错误返回"ERROR"]
		 */
		getPicInfo: function(index){
			this.grabIndex = index-0;
			return this.playerObj.GetPicInfo(index);
		},
		/**
		 * [getStreamMonitor 流速统计  0.2.6版本ocx原始值格式为 0.92Mbps,]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [返回值：字符串，正确返回当前实时流传输速度 “xxx KB/S”，错误返回"ERROR"]
		 */
		getStreamMonitor: function(index){
			var s="0Kbps";
			var str = this.playerObj.GetTransferSpeed(index);
			if(str.indexOf("KB/S")>0){
				s = parseInt(str.replace("KB/S","").trim())*8 +"Kbps";
			}else if(str.indexOf("MB/S")>0){
				s = parseInt(str.replace("MB/S","").trim())*8 +"Mbps";
			}
			else if(str.indexOf("Mbps")>0||str.indexOf("Kbps")>0)
			{
				s=str;
			}
			return s;
		},
		/**
		 * [ptzControl 云台方向控制]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   cmd   [云台方向代表指令]
		 * @param  {[数字]}   param [云台转动(非0)或停止(0)]
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0为正确；非0为错误码]
		 */
		ptzControl: function (cmd, param, index) {
			var N = this.playerObj.PtzControl(cmd, param, index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},
		/**
		 * [ptzLock 云台锁定]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   lockTime [lockTime:0解锁,0以上数字表示锁定时间]
		 * @param  {[数字]}   index    [分屏序号]
		 * @return {[数字]}            [返回值：0为正确；非0为错误码]
		 */
		ptzLock: function(lockTime,index){
			var N = this.playerObj.PtzLock(lockTime, index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},
		/**
		 * [setPlaySpeed 设置速度 （对实时流无效）]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   speed [speed:-2（单帧） -1（X2慢）、0（正常）、1（X2快）]
		 * @param  {[数字]}   index [分屏序号]
		 */
		setPlaySpeed:function(speed,index){  //
			if(speed===-2||speed===-1||speed===-0||speed===1){
				var result = this.playerObj.SetPlayMode(0,speed,index);
				if(result===0){
					var tmp = this.getPlaySpeed(index);
					this.cameraData[index].playSpeed = tmp;
				}else{//提示报错信息
					this.ShowError(result);
				}
			}
			return result;
		},
		/**
		 * [reversePlay 正反播放（对实时流无效）]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   type  [type:0（倒放）、1（正放）]
		 * @param  {[数字]}   index [分屏序号]
		 */
		reversePlay:function(type,index){
			if(type===0||type===1){
				var result = this.playerObj.SetPlayMode(1,type,index);
				if(result!==0){
					//提示报错信息
					this.ShowError(result);
				}
			}else{
				notify.error('正反播放参数错误');
			}
		},
		/**
		 * [playByTime 从指定时间开始播放（对实时流无效）]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   time  [指定时间]
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0或错误码]
		 */
		playByTime:function(time,index){   // time:  单位ms
			var result = this.playerObj.SetPlayMode(2,time,index);
			if(result!==0){
				//提示报错信息
				this.ShowError(result);
				//console.log('从指定时间开始播放设置失败');
			}
			return result;
		},
		/**
		 * [playByFrame 从指定帧开始播放（对实时流无效）]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   frame [指定帧]
		 * @param  {[数字]}   index [分屏序号]
		 */
		playByFrame:function(frame,index){
			var result = this.playerObj.SetPlayMode(3,frame,index);
			if(result!==0){
				//提示报错信息
				this.ShowError(result);
			}
		},
		/**
		 * [playByPercentage 从指定百分比开始播放（对实时流无效）]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   percent [百分数]
		 * @param  {[数字]}   index   [分屏序号]
		 */
		playByPercentage:function(percent,index){   // percent: 百分比
			var result = this.playerObj.SetPlayMode(4,frame,index);
			if(result!==0){
				//提示报错信息
				this.ShowError(result);
			}
		},
		/**
		 * [getPlaySpeed 获取当前播放速度（实时流无效）]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [正确返回当前播放速度；	错误返回"ERROR"]
		 */
		getPlaySpeed:function(index){
			return this.playerObj.GetPlayMode(index) === 'ERROR' ? '1' : this.playerObj.GetPlayMode(index);
		},
		/**
		 * [getPlayTime 获取当前播放时间（在Play成功后调用，对文件和pfs有效）]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [成功：返回播放时间(单位：毫秒，非负数)  失败：返回错误码，负数]
		 */
		getPlayTime:function(index){
			var N = this.playerObj.GetPlayTime(index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},
		/**
		 * [playerSnap 视图库抓图，播放开始后调用]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [成功返回：base64编码的图片信息  失败返回：”ERROR”]
		 */
		playerSnap:function(index){
			return this.playerObj.PlayerSnap(index);
		},
		//startTime endTime单位是ms   type:true：循环播放，false：一次播放
		/**
		 * [playFormStartToEnd 播放指定时间范围内的视频（播放开始后调用，只对文件、PFS有效）用于视图库]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   startTime [单位是ms]
		 * @param  {[数字]}   endTime   [单位是ms]
		 * @param  {[布尔型]}   type    [true：循环播放，false：一次播放]
		 * @param  {[数字]}   index     [分屏序号]
		 * @return {[数字]}             [返回值：0为正确，非0为错误码]
		 */
		playFormStartToEnd:function(startTime,endTime,type,index){
			var N = this.playerObj.PlayFormStartToEnd(startTime,endTime,type,index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},
		/**
		 * [setPtzSpeed 设置云台速度(默认是最大速度15)]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   ptzspeed [ 窗口云台速度 [0~15]]
		 * @param  {[数字]}   index    [分屏序号]
		 * @return {[布尔]}             [true为成功  false为失败]
		 */
		setPtzSpeed:function(ptzspeed,index){
			return this.playerObj.SetWndPtzSpeed(ptzspeed,index);
		},
		/**
		 * [polygonEdit 编辑多边形、箭头线、框等]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   type  [type = 1，创建一个多边形
			type = -2，删除所有的多边形
			type = 2，创建一个箭头线
			type = -4 删除所有的箭头线
			type = 3，创建一个框
			type = -6，删除所有的框
			创建时，调用一次接口，只能创建一个对象]
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0或错误码]
		 */
		polygonEdit: function(type, index){
			return this.playerObj.PolygonEdit(type, index);
		},
		/**
		 * [polygonSet 创建一个多边形]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0或错误码]
		 */
		polygonSet: function(index){
			return this.polygonEdit(1,index);
		},
		/**
		 * [polygonDelAll 删除所有多边形]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0或错误码]
		 */
		polygonDelAll: function(index){
			return this.polygonEdit(-2,index);
		},
		/**
		 * [arrowsPathSet 创建一个箭头线]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0或错误码]
		 */
		arrowsPathSet: function(index){
			return this.polygonEdit(2,index);
		},
		/**
		 * [arrowsPathDelAll 删除所有箭头线]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0或错误码]
		 */
		arrowsPathDelAll: function(index){
			return this.polygonEdit(-4,index);
		},
		/**
		 * [rectSet 创建一个框]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0或错误码]
		 */
		rectSet: function(index){
			return this.polygonEdit(3,index);
		},
		/**
		 * [rectDelAll 删除所有的框]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0或错误码]
		 */
		rectDelAll: function(index){
			return this.polygonEdit(-6,index);
		},
		/**
		 * [deleteOArray 关闭数字放大模式]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[字符串]}   strText [箭头线的标号，eg“区域0”]
		 * @param  {[数字]}   index   [分屏序号]
		 * @return {[数字]}           [0或错误码]
		 */
		deleteOArray: function(strText, index){
			return this.playerObj.DeleteOArray(strText, index)===0?true:false;
		},
		/**
		 * [downLoadRecd 录像下载，仅下载不播放]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[type]}   RecdPath    [strRecdPath:JSON格式的字符串 录像信息 类型(数字)、用户名、密码、PVG服务器的IP或者DNS、端口号、Av对象名、
		录像类型(数字)（0为服务器录像, 非0为录像所在的层数,最大值为256, 建议0-15）、开始时间（"2012-01-01 13:20:00.000"或 "20120101132000000"）、
		结束时间（"2012-01-01 13:20:00.000"或 "20120101132000000"），
		eg：{"type":2,"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1","vodType":1,"beginTime":"20120101132000000","endTime":"20120101152000000"}]
		 * @param  {[字符串]}   strFileName [下载文件绝对路径名（预留参数，可为""）目前是弹框，由用户选择路径名称]
		 * @param  {Function} fn          [回调]
		 * @return {[数字]}               [0或错误码]
		 */
		downLoadRecd: function(RecdPath, strFileName,fn){
			this.fireEvent('onDownLoadRecd',RecdPath);
			var str=RecdPath;
			var self=this;
			if(typeof(RecdPath)=="object")
			{
				var str=JSON.stringify(RecdPath);
			}
			var result=this.playerObj.DownLoadRecd(str, strFileName);
			this.DownLoadlist[result+""]=
			{
				callback:function(x)
				{
					if(typeof(fn)=="function"){fn(x);}
					if(x==100)
					{
					   self.stopDownLoadRecd(result);
					}
				}
			};
			//提示报错信息
			this.ShowError(result);
			return result;
		},
		/**
		 * [stopDownLoadRecd 取消录像下载]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   handle [数字下载的句柄]
		 * @return {[布尔]}          [成功与否]
		 */
		stopDownLoadRecd: function(handle){
			var result = this.playerObj.StopDownLoadRecd(handle);
			this.ShowError(result);
			return(result === 0) ? true : false;
		},
		/**
		 * [createImage 布防布控图像创建]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   imageInfo [颜色BGR各8位组成的整数
		 1、单线单箭头（点3为箭头，应在12的中垂线上）
		 "{'singlearrowline',{(0.7,0.1),(0.3,0.1),(0.5,0.2)}, '255' }"
		 2、双线单箭头（点3为箭头，应在12的中垂线上）
		 "{'doublelineonearrow',{(0.2,0.6),(0.6,0.6),(0.4,0.5),(0.3,0.1),(0.5,0.2)},'255'}"
		 3、矩形
		 "{'rectangle',{(0.3,0.35),(0.4,0.35),(0.35,0.35),(0.55,0.63)},\'255\' }"
		 4、多边形
		 "{'polygon',{(0.43,0.1),(0.5,0.15),(0.25,0.9),(0.7,0.3),(0.64,0.57)},\'255\'}"
		 5、单线双箭头（点3、4为箭头，应在12的中垂线上）
		 "{'onelinedoublearrow',{(0.2,0.2),(0.8,0.8),(0.4,0.6),(0.6,0.4)},'255'}"]
		 * @param  {[数字]}   index     [分屏序号]
		 * @return {[布尔]}             [成功与否]
		 */
		createImage: function(imageInfo, index){
			var result = this.playerObj.CreateImage(imageInfo, index);
			//提示报错信息
			this.ShowError(result);
			return result===0?true:false;
		},
		/**
		 * [releaseAllImage 关闭CreateImage创建的所有图像]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [窗口索引]
		 * @return {[数字]}         [0为成功 负数为错误码]
		 */
		releaseAllImage: function(index){
			var result = this.playerObj.ReleaseAllImage(index);
			//提示报错信息
			this.ShowError(result);
			return result===0?true:false;
		},
		/**
		 * [getFramRate 获取当前播放实时流的帧率]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [0为成功 负数为错误码]
		 */
		getFramRate:function(index){
			var result = this.playerObj.GetFrameRate(index);
			return result;
		},
		/**
		 * [on 注册事件，部分ocx事件的使用on可模仿jq，这样比addEvent好理解]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[字符串]}   name [事件名称]
		 * @param  {Function} fn   [回调]
		 */
		on:function(name,fn){
			var self=this;
			var Names=
			{
				"click":"WndClick",
				"dblclick":"WndDClik",
				"resize":"SizeChanged",
				"download":"DownLoadPercent",
				"switch":"SwitchWindow",
				"switchBefore":"UnexecutedSwitchWindow", // 未执行的鼠标拖动交换窗口 （因禁用鼠标拖动交换窗口） by songxj add
				"enter":"MouseMoveWindow",
				"mousemove":"MouseMove",
				"focuschange":"FocusChange",
				"leave":"MouseLeaveControl",
				"WebDialog":"WebDialogEvent"
			};
			for(var x in Names)
			{
				if(name==x){
					name=Names[x];
				}
			}
			var A=name.split(" ");
			var L=A.length;
			for(var i=0;i<=L-1;i++)
			{
				self.addEvent(name,fn);
			}
		},
		/**
		* 事件绑定
		**/
		bindEvents: function(){
			var self = this;
			var EventList=[
				"WndClick",//on的方式已注册
				"WndDClik",//on的方式已注册
				"SizeChanged",//on的方式已注册
				"DownLoadPercent",//on的方式已注册
				"MouseWheelEvent",
				"FocusChange",
				"SwitchWindow",//on的方式已注册
				"UnexecutedSwitchWindow",// on的方式已注册 by songxj add
				"MouseMoveWindow",//on的方式已注册
				"LayoutChange",
				"FullScreen",
				"PlayBackStartOrEnd",
				"MouseLeaveControl", //on的方式已注册
				"WebDialogEvent",
				"PTZContorlEvent"
			];

			var L = EventList.length;

			for (var i = 0; i <= L - 1; i++) {
				(function(k) {
					var name = EventList[k] + "";
					var func = function() {
						self.fireEvent(name, arguments);
					};
					if (self.playerObj.attachEvent) {
						//取消绑定
						self.playerObj.detachEvent("on" + name, func);
						//绑定事件
						self.playerObj.attachEvent("on" + name, func);
					} else {
						//取消绑定
						self.playerObj.removeEventListener(name, func, false);
						//绑定事件
						self.playerObj.addEventListener(name, func, false);
					}
				})(i);
			}
		},
		/**
		 * [getFreeWindows 获取空闲窗口数组]
		 * @author huzc
		 * @date   2015-07-15
		 * @return {[数组]}   [空闲窗口数组]
		 */
		getFreeWindows: function() {
			var result = [];
			for (var i = 0; i < this.getLayout(); i++) {
				var str = this.playerObj.GetVideoAttribute(i) + "";
				if (str == "ERROR") {
					result.push(i);
				}
			}
			return result;
		},
	/*****************以下是复合接口，供某些页面的特殊调用**************************************************/
		/**
		 * [getIdleWindows 获取闲置窗口集合,该方法可能有问题弃之]
		 * @author huzc
		 * @date   2015-07-15
		 * @return {[数组]}   [返回值是[2,3,4..] ]
		 */
		getIdleWindows: function(){
			var result = [];
			for(var i = 0; i < this.getWindowCount(); i++){
				if(this.cameraData[i]===-1){
					result.push(i);
				}
			}
			return result;
		},

		//双击资源树播放时调用    pvg_group_id: 1(pvg5.11)、2(DVR)、3(NVR)   标清优先播放DVR
		/*options参数格式：
		 {
		 "cId": 2,
		 "cName": "摄像头名",
		 "cStatus": 1,//是否有通道可用 0-有 1-全部通道不可用
		 "cType": 1,//是否云台可控
		 "hdChannel": //高清摄像头通道
		 [{
		 "id":132
		 "ip": "192.168.12.93",
		 "port": 2100,
		 "user": "admin"， //pvg 用户名
		 "passwd": "admin",
		 "path": "av/4",//通道 av对象名
		 "channel_status": 1,//是否可用 0-可用 1-不可用
		 "pvg_group_id":3
		 }, {
		 "id":132
		 "ip": "192.168.12.93",
		 "port": 2100,
		 "user": "admin"， //pvg 用户名
		 "passwd": "admin",
		 "path": "av/4",//通道 av对象名
		 "channel_status": 1,//是否可用 0-可用 1-不可用
		 "pvg_group_id":3

		 }],
		 "sdChannel": //标清摄像头通道
		 [{
		 "id":132
		 "ip": "192.168.12.93",
		 "port": 2100,
		 "user": "admin"， //pvg 用户名
		 "passwd": "admin",
		 "path": "av/4",
		 "channel_status": 1,
		 "pvg_group_id":2
		 }, {
		 "id":132
		 "ip": "192.168.12.93",
		 "port": 2100,
		 "user": "admin"， //pvg 用户名
		 "passwd": "admin",
		 "path": "av/4",
		 "channel_status": 1,
		 "pvg_group_id":1
		 }],
		 }
		 优先级：最高：优先在最大化的窗口播放， 次高：用户手动聚焦的窗口  最低：选择空闲窗口，如果没有空闲窗口，则关掉第一个窗口，然后依次向后，循环
		*/
		setFreePath: function(options) {
			this.freePlay(options);
			return;
			var self = this;
			var curLayout = self.getLayout(); //目前的视频布局值
			var isHaveMaxWindow = self.isHaveMaxWindow();//是否有最大化

			var pType = (curLayout===1 && options.hdChannel.length>0 || isHaveMaxWindow && options.hdChannel.length>0)?1:0;//单屏或者非单屏时的最大化 都采用高清：1  其他为标清：0
			var playOK = false;
			if(self.curMaxWinChannel != -1){//存在最大化的窗口  self.curMaxWinChannel当前最大化的窗口索引
				var maxChannel = self.curMaxWinChannel;
				self.stop(false, maxChannel);
				playOK = self.playSHstream(options, maxChannel,pType);
				if (!playOK) playOK = self.switchDefinition(maxChannel,pType===1?0:1);
			}else if (self.manualFocusChannel !== -1) {//优先在用户手动聚焦的通道中播放
				var temChannel = self.manualFocusChannel;
				//jQuery(".screenshot-preview .exit").trigger('click');//关闭抓图面板(如果抓图面板存在的话)  马越注释掉，双击打开新的视频时，原来有抓图遮挡层窗口不能退出
				self.stop(false, self.manualFocusChannel);
				playOK = self.playSHstream(options, temChannel,pType);
				if (!playOK) playOK = self.switchDefinition(temChannel,pType===1?0:1);
			//自动寻找窗口播放
			} else {
				var ary = self.getIdleWindows();

				//找到可用的空闲窗口
				if(ary.length > 0){
					playOK = self.playSHstream(options, ary[0],pType);
					if (!playOK) playOK = self.switchDefinition(ary[0],pType===1?0:1);
				//当前窗口全为忙碌状态
				}else{
					self.stop(false,self.videoLoop);
					playOK = self.playSHstream(options, self.videoLoop,pType);
					if (!playOK) playOK = self.switchDefinition(self.videoLoop,pType===1?0:1);

					self.videoLoop++; //检查标志位自增
					//检查标志位是否越界
					if (self.videoLoop === curLayout) {
						self.videoLoop = 0;
					}
				}
			}
			return playOK;
		},
		/**
		 * [freePlay 优先级：最高：优先在最大化的窗口播放， 次高：用户手动聚焦的窗口  最低：选择空闲窗口，如果没有空闲窗口，则关掉第一个窗口，然后依次向后，循环]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   data [description]
		 */
		freePlay: function(data) {
			var self = this;
			var index = data.position !== undefined ? data.position : self.getFreeIndex();
			self.playSH(data,index);
		},
		/**
		 * [getFreeIndex 获取空闲分屏]
		 * @author huzc
		 * @date   2015-07-15
		 * @return {[数字]}   [分屏序号]
		 */
		getFreeIndex: function() {
			var self = this;
			var curLayout = self.getLayout();
			var winCounts = self.getWindowCount();
			var index;
			if (curLayout === 101) {
				//因为横屏的播放器的窗口数量是不确定的
				curLayout = winCounts;
			}
			if (self.curMaxWinChannel !== -1) {
				//存在最大化的窗口  self.curMaxWinChannel当前最大化的窗口索引
				index = self.curMaxWinChannel;
			} else if (self.manualFocusChannel !== -1) {
				//优先在用户手动聚焦的通道中播放
				index = self.manualFocusChannel;
				self.manualFocusChannel = -1;
			} else {
				//自动寻找窗口播放
				var ary = self.getIdleWindows();
				//找到可用的空闲窗口
				if (ary.length > 0) {
					index = ary[0];
				} else {
					//当前窗口全为忙碌状态
					index = self.videoLoop;
					//检查标志位自增
					self.videoLoop++;
					//检查标志位是否越界
					if (self.videoLoop === curLayout) {
						self.videoLoop = 0;
					}
				}
			}
			return index;
		},
		/**
		 * [setcplayStatusBeforePlay 优先按照在线状态，离线就不进行尝试播放 setcplayStatus优先播放]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   data  [json数组]
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [类型，在线状态]
		 */
		setcplayStatusBeforePlay:function(data,index) {
			var self = this;
			var cameraID = data.cId;
			var cameraStatus = data.cStatus - 0;//0在线  1离线
			var cplayStatus;
			if (window.permission && (!window.permission.stopFaultRightById([cameraID])[0])) {
				cplayStatus = 5;
			} else {
				if (cameraStatus) {
					cplayStatus = 2;
				} else {
					cplayStatus = 0;
				}
			}
			self.cameraData[index].cplayStatus = cplayStatus;
			return cplayStatus;
		},
		/**
		 * [setcplayStatusAfterPlay 播放之后设置播放类型]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[对象]}   playResult [播放结果]
		 * @param  {[数字]}   index      [分屏序号]
		 */
		setcplayStatusAfterPlay:function(playResult,index){
			var self = this;
			if (playResult) {
				self.cameraData[index].cplayStatus = 0;
			}else{
				self.cameraData[index].cplayStatus = 1;
			}
		},
		/**
		 * [setOCXstyle 设置ocx样式]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [description]
		 */
		setOCXstyle:function(index){
			var self = this;
			self.playerObj.SetStreamLostByIndex(self.cameraData[index].cplayStatus, index);
		},
		/**
		 * [playSH 播放标清中间函数]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   data  [播放参数]
		 * @param  {[数字]}   index [分屏序号]
		 */
		playSH:function(data,index){
			var self = this;
			if(typeof data === "number"){//当轮巡时有可能data是摄像机的id,返回id的目的是效率很快,id属于number类型,目前暂时还是走的下面的分支
               jQuery.get("/service/video_access_copy/accessChannels",{id:data},function(res){
               	    var data = {
						"cType": res.data.cameraInfo.camera_type,
						"cId": res.data.cameraInfo.id,
						"cName": res.data.cameraInfo.name,
						"cCode": res.data.cameraInfo.cameracode,
						"cStatus": res.data.cameraInfo.camera_status,
						"camerascore": res.data.cameraInfo.score,
						"hdChannel": res.data.cameraInfo.hd_channel,
						"sdChannel": res.data.cameraInfo.sd_channel
					};
					
					var result = true;
					var cameraType = data.hdChannel.length ? 1 : 0; //代表摄像机类型（高清：1或者标清：0）
					self.stop(false, index);
					self.saveCameraData(data, index);
					self.setFocusWindow(index);
					var temcplayStatus = self.setcplayStatusBeforePlay(data, index);
					/**
					 * temcplayStatus因为后端返回的statue有时是number有时是string,这里最好不要写死===X
					 * window.offlineCameraPlay,全局开关，标示在摄像机离线状态下，是否也进行开流
					 * modify by zhangyu 2016.04.16
					 */
					//if (temcplayStatus === 0 || (temcplayStatus === 2 && window.offlineCameraPlay)) {
						if (cameraType) { //高清
							self.routeHD(index);
						} else { //标清
							self.routeSD(index);
						}
					/*} else {
						//离线状态，直接更新
						self.setOCXstyle(index);
						self.setRealVideoType(index);
					}*/
               })
			}else{
				var result = true;
				var cameraType = data.hdChannel.length ? 1 : 0; //代表摄像机类型（高清：1或者标清：0）
				self.stop(false, index);
				self.saveCameraData(data, index);
				self.setFocusWindow(index);
				var temcplayStatus = self.setcplayStatusBeforePlay(data, index);
				/**
				 * temcplayStatus因为后端返回的statue有时是number有时是string,这里最好不要写死===X
				 * window.offlineCameraPlay,全局开关，标示在摄像机离线状态下，是否也进行开流
				 * modify by zhangyu 2016.04.16
				 */
				//if (temcplayStatus === 0 || (temcplayStatus === 2 && window.offlineCameraPlay)) {
					if (cameraType) { //高清
						self.routeHD(index);
					} else { //标清
						self.routeSD(index);
					}

				/*} else {
					//离线状态，直接更新
					self.setOCXstyle(index);
					self.setRealVideoType(index);
				}*/
			}
			
		},
		/**
		 * [setRealVideoType 设置cameraData中的isRealorHis属性，主要是在实时或者历史播放失败时，进行视频类型判断使用]
		 * @author Mayue
		 * @date   2015-05-04
		 * @param  {[type]}   index [description]
		 */
		setRealVideoType:function(index){
			this.cameraData[index].isRealorHis = 'real';
		},
		/**
		 * [getFreeWindow 获取空闲分屏，此函数比之前的靠谱]
		 * @author huzc
		 * @date   2015-07-15
		 * @return {[数组]}   [分屏]
		 */
		getFreeWindow:function()
		{
			var self = this;
			var L = self.getLayout(); //目前的视频布局值
			var A=[];
			for(var i=0;i<=L-1;i++)
			{
				var Flag=self.playerObj.GetWindowBusyByIndex(i)+"";
				if(Flag=="false")
				{
					A.push(i);
				}
			}
			return A;
		},
		/**
		 * [setFreePath_history 寻找窗口播放历史，该函数未使用]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[type]}   options [description]
		 * @param  {Function} fn      [description]
		 */
		setFreePath_history: function(options, fn) {
			var self = this;
			var curLayout = self.getLayout(); //目前的视频布局值
			var pType = curLayout === 1 ? 1 : 0;
			var playOK = false;
			//优先在用户手动聚焦的通道中播放
			if (self.manualFocusChannel !== -1) {
				var temChannel = self.manualFocusChannel;
				self.stop(false, self.manualFocusChannel);
				self.playInHistory(options, temChannel);
			} else {
				var ary = self.getIdleWindows();
				//找到可用的空闲窗口
				if (ary.length > 0) {
					self.playInHistory(options, ary[0]);

				} //当前窗口全为忙碌状态
				else {
					self.stop(false, self.videoLoop);
					self.playInHistory(options, self.videoLoop);
					self.videoLoop++; //检查标志位自增
					//检查标志位是否越界
					if (self.videoLoop === curLayout) {
						self.videoLoop = 0;
					}
				}
			}
		},
		/**
		 * [setFocusByCameraID 查找某id的分屏并设置为焦点窗口]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   cameraID [摄像机id]
		 */
		setFocusByCameraID: function(cameraID) {
			var index = -1;
			for (var i = 0; i < 16; i++) {
				if (this.cameraData[i] !== -1) {
					if (this.cameraData[i].cId === cameraID) {
						index = i;
					}
				}
			}
			this.setFocusWindow(index);
		},
		/**
		 * [saveCameraData 存储摄像头信息到对应cameraData数组中,该接口暂未使用]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   options [摄像机数组json]
		 * @param  {[数字]}   index   [分屏序号]
		 */
		saveCameraData: function(options, index){
			this.cameraData[index] = Object.clone(options);
			if(typeof(TimeList)=="object"&&typeof(TimeList[index])=="object")
			{
				TimeList[index].data=false;
			}
		},
		/**
		 * [isOnlyCameraId 检查cameraId当前是不是唯一的]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   cameraId [摄像机id]
		 * @return {Boolean}           [description]
		 */
		isOnlyCameraId: function(cameraId) {
			for (var i = j = 0; i < 16; i++) {
				if (this.cameraData[i].cId === cameraId) {
					j++;
				}
				if (j >= 2) {
					return false;
				}
			}
			return true;
		},
		/**
		 * [stopAll 关闭所有窗口]
		 * @author huzc
		 * @date   2015-07-15
		 */
		stopAll: function() {
			var self = this;
			var layout = this.getLayout();
			for (var i = 0; i < layout; i++) {
				(function(j) {
					//将重复请求的定时器清除掉
					if (self.requestObj[j]) {
						clearTimeout(self.requestObj[j].timmer);
					}
					self.stop(false, j);
				})(i);
			}
			this.videoLoop = 0;
		},
		/**
		 * [stopAllSimple 直接关闭所有窗口]
		 * @author huzc
		 * @date   2015-07-15
		 */
		stopAllSimple: function() {
			var self = this;
			var layout = self.getLayout();
			for (var i = 0; i < layout; i++) {
				(function(j) {
					self.playerObj.StopEx(false, j, function() {}, 0);
				})(i);
			}
		},
		/**
		 * [open 打开实时流或录像]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   type    [类型]
		 * @param  {[json]}   options [参数对象]
		 * @return {[数字]}           [0或错误码]
		 */
		open: function(type, options) { //type:文件为0，实时流为1，录像为2
			options.type = type;
			var result = null;
			switch (type) {
				case 0:
					//TODO
					break;
				case 1:
					this.playLive(options);
					break;
				case 2:
					this.playRecord(options);
					break;
			}
		},
		/**
		 * [playRecord 播放录像]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   options [json对象]
		 */
		playRecord: function(options) {
			options.beginTime = options.begintime;
			this.playInHistory2(options, options.index);
		},
		/**
		 * [playLive 历史页面播放实时流]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[type]}   options [description]
		 */
		playLive: function(options){
			var idleWindows = this.getIdleWindows();
			var layout = this.getLayout();
			if(idleWindows.length > 0){//有空闲窗口，直接播放
				this.playInHistory(options, idleWindows[0]);
			}else{//无空闲窗口则修改布局为4布局 历史调阅页面最多开4个窗口
				if(layout < 4){
					var newLayout = Math.pow((Math.sqrt(layout) + 1), 2); //布局增加一级
					this.setLayout(newLayout);
					this.playInHistory(options, layout);
				}else{
					this.playInHistory(options, this.coverIndex++);
					if(this.coverIndex === 4){
						this.coverIndex = 0;
					}
				}
			}
		},
		/**
		 * [playInHistory 某分屏播放历史录像]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   options [json数据，播放参数]
		 * @param  {[数字]}   index   [分屏]
		 * @return {[数字]}           [0或者错误码]
		 */
		playInHistory: function(options, index, fn) { /*index为通道号*/
			var self = this;
			this.fireEvent("playInHistoryLog", index);

			var result = null,
				jsonstr = JSON.stringify(options);
			if (this.playerObj) {
				result = this.playerObj.PlayEx2(jsonstr, index, function(index, result, userParam) {
					//播放动作完成后回调
					//提示报错信息
					self.ShowError(result);
					WaterMark.setWatermark(this, index);
				}, 0, function() {
					//播放完成并真正显示出一帧画面时回调

				}, 0, function(index, result, userParam) {
					//播放录像时，录像到达结束时间会触发此回调
					if (result < 0) {
						notify.warn("播放失败:" + this.getErrorCode(result + ""));
					}
					if (fn) {
						fn(result);
					}
				}, 0);
			} else {
				notify.warn("播放器this.playobj不存在");
				return;
			}
			this.manualFocusChannel = -1;
			this.setFocusWindow(index);
			if (typeof(this.cameraData[index]) == "object") {
				this.cameraData[index].history = Object.clone(options);
			}
		},
		/**
		 * [playInHistory2 playInHistory2不提供实时和历史切换]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   options [json参数]
		 * @param  {[数字]}   index   [分屏序号]
		 * @return {[数字]}           [0或错误码]
		 */
		playInHistory2: function(options, index) { /*index为通道号*/
			this.fireEvent("playInHistoryLog", index);
			var result = null,
				jsonstr = JSON.stringify(options);
			this.playerObj && this.playerObj.Play(jsonstr, index, function(index, result, userParam) {
				//播放动作完成后回调
				//提示报错信息
				this.ShowError(result);
				this.manualFocusChannel = -1;
				this.setFocusWindow(index);
				this.saveCameraData(options, index); //存储摄像头信息
			}, 0, function() {
				//播放完成并真正显示出一帧画面时回调

			}, 0, function(index, result, userParam) {
				//播放录像时，录像到达结束时间会触发此回调
				if (result < 0) {
					notify.warn("播放失败:" + this.getErrorCode(result + ""));
				}
				if (fn) {
					fn(result);
				}
			}, 0);
		},
		/**
		 * [mapWindow 遍历窗口封装]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {Function} fn [回调，遍历窗口的回调参数]
		 * @return {[无]}      [无]
		 */
		mapWindow:function(fn)
		{
			var N=this.playerObj.GetLayout();
			for(var i=0;i<=N-1;i++)
			{
				var str=this.playerObj.GetVideoAttribute(i)+"";
				if(fn){fn(str,i);}
			}
		},
		/**
		 * [getCurWindow 该函数被废弃]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[type]}   evt [description]
		 * @return {[type]}       [description]
		 */
		getCurWindow:function(evt)
		{
			var index=0;
			var offset=$("#videoControl").offset();
			var offsetOCX=$("#UIOCX").offset();
			var N=$("#UIOCX")[0].GetLayout()-0;
			var K=Math.sqrt(N);
			var pw=$("#UIOCX").width();
			var ph=$("#UIOCX").height();
			var w0=pw/K;
			var h0=ph/K;

			var x0=offsetOCX.left;
			var y0=offsetOCX.top;

			var x=offset.left;
			var y=offset.top;
			var m=(x-x0)/pw;
			var n=(y-y0)/ph;
			return [m,n];
		},
		/**
		 * [getLast_hisIndex 计算当前窗口里播放历史视频的最后一个窗口的索引,历史调阅模块使用]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {Function} fn [回调]
		 * @return {[数字]}      [分屏序号]
		 */
		getLast_hisIndex:function(fn)
		{
			if(!this.playerObj){return -1;}
			var N=this.playerObj.GetLayout();
			var index=-1;
			for(var i=0;i<=N-1;i++)
			{
				var str=this.playerObj.GetVideoAttribute(i);
				if(str=="ERROR"){continue;}
				var jsonobj=JSON.parse(str);
				if(fn){fn(jsonobj,i);}
				if(jsonobj.videoType==2)
				{
					index=i;
				}
			}
			return index;
		},
		/**
		 * [get_hiscount 遍历所有窗口，封装回调]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {Function} fn [遍历回调]
		 */
		get_hiscount:function(fn)
		{
			if(!this.playerObj){return 0;}
			var N=this.playerObj.GetLayout();
			for(var i=0;i<=N-1;i++)
			{
				var str=this.playerObj.GetVideoAttribute(i)+"";
				if(fn){fn(str,i);}
			}
		},
		/**
		 * [getFirstHisIndex 获取第一个播放历史录像的分屏序号 -1为不存在播放历史录像的分屏]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[对象]}         [返回json数据]
		 */
		getFirstHisIndex:function(index)
		{
			var hisK=0;
			var FirstHisIndex=-1;
			this.get_hiscount(function(str,i)
			{
				if(str!=="ERROR"&&JSON.parse(str).videoType==2) //&&i!==index
				{
					hisK++;
					if(hisK==1)
					{
						FirstHisIndex=i;
					}
				}
			});
			return {count:hisK,index:FirstHisIndex};
		},
		/**
		 * [findcamid 获取摄像机通道id]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[type]}   camera [摄像机通道数组]
		 */
		findcamid:function(camera)
		{
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
		/**
		 * [getcamid 获取摄像机通道id]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数组]}   A     [摄像机通道数组]
		 * @param  {[type]}   index [分屏索引序号]
		 * @return {[type]}         [通道id]
		 */
		getcamid:function(A,index)
		{
			return this.findcamid(A[index]);
		},
		/**
		 * [playHis 播放历史录像，传入格式化的参数]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   n         [分屏序号]
		 * @param  {[数字]}   begintime [开始时间]
		 * @param  {[数字]}   endtime   [结束时间]
		 * @param  {[数字]}   vodType   [录像深度]
		 * @param  {[json]}   data      [json播放录像数据]
		 * @param  {Function} fn        [回调函数]
		 * @return {[NULL]}             [无]
		 */
		playHis:function(n,begintime,endtime,vodType,data,fn)
		{
			//console.log("播放历史playHis");
			//logDict.insertLog('m1','f1','o4','b6',data.name);
			//var str="yyyy-MM-dd hh:mm:ss.000";
			begintime=Toolkit.mills2timestamp(begintime);//(new Date(begintime)).format(str);
			endtime=Toolkit.mills2timestamp(endtime);//(new Date(endtime)).format(str);
			if(typeof(data) !== "object") {
				notify.warn("该摄像机没有历史录像或发生异常");
				return;
			}
			var obj=
			{
				"type": 2,
				"user": data.username || data.user,
				"passwd": data.password || data.passwd,
				"ip": data.ip,
				"port": data.port,
				"path": data.path,
				"vodType": vodType,
				"beginTime": begintime + "",
				"endTime": endtime + "",
				"displayMode": 0
			};
			if(typeof(this.cameraData[n]) === "object") {
				this.cameraData[n].cName = data.name;
			}
			this.playInHistory(obj,n,fn);
		},
		/**
		 * [playExHis 播放历史录像,带回调，传入格式化的参数]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index     [分屏序号]
		 * @param  {[数字]}   begintime [开始时间]
		 * @param  {[数字]}   endtime   [结束时间]
		 * @param  {[数字]}   vodType   [录像深度]
		 * @param  {[json]}   data      [json播放录像数据]
		 * @param  {Function} fn        [播放回调]
		 * @param  {[Function]}   Endfn     [播放结束回调]
		 */
		playExHis: function(index, begintime, endtime, vodType, data, fn, Endfn) {
			console.log("播放历史playExHis");
			var self = this;
			//logDict.insertLog('m1','f1','o4','b6',data.name);/*by:wujingwen on 2015 08 148 废除旧日志*/
			var str = "yyyy-MM-dd hh:mm:ss.000";
			begintime=(new Date(begintime+2000)).format(str);
			endtime=(new Date(endtime+2000)).format(str);
			if (typeof(data) != "object") {
				notify.warn("该摄像机没有历史录像或发生异常");
				return;
			}
			var obj = {
				"type": 2,
				"user": data.username || data.user,
				"passwd": data.password || data.passwd,
				"ip": data.ip,
				"port": data.port,
				"path": data.path,
				"vodType": vodType,
				"beginTime": begintime + "",
				"endTime": endtime + "",
				"displayMode": 0
			};
			if (typeof(this.cameraData[index]) == "object") {
				this.cameraData[index].cName = data.name;
			}
			var str = JSON.stringify(obj);

			this.playerObj.StopEx(true, index, function() {}, 0);
			this.playerObj.PlayEx2(str, index, function(index, result, userParam) {
				//播放动作完成后回调
				self.manualFocusChannel = -1;
				self.setFocusWindow(index);
				if (typeof(self.cameraData[index]) == "object") {
					if (self.cameraData[index].history) {
						for (var x in obj) {
							self.cameraData[index].history[x] = obj[x];
						}
					} else {
						self.cameraData[index].history = Object.clone(obj);
					}
				}
				//提示报错信息
				self.ShowError(result);
				WaterMark.setWatermark(self, index);
				fn(index, result, userParam);
				if (result < 0) {
					notify.warn("播放失败:" + self.getErrorCode(result + ""));
				}
				// console.log("播放此段开始，回调"+begintime+","+endtime+",JSON"+JSON.stringify(data));
			}, 0, function(index, result, userParam) {
				//播放完成并真正显示出一帧画面时回调
				//Endfn(index, result, userParam);
			}, 0, function(index, result, userParam) {
				//播放录像时，录像到达结束时间会触发此回调
				Endfn(index, result, userParam);
			}, 0);
		},
		/**
		 * [JudgeFormat 判断数据格式]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   data  [json数据格式 通道信息]
		 * @param  {[字符串]}   stype [字符串 类型 取值为real 或 his]
		 */
		JudgeFormat:function(data,stype)
		{
			var Flag=false;
			if(stype=="real")
			{
				if(!data.type){return false;}
				if(!data.user){return false;}
				if(!data.passwd){return false;}
				if(!data.ip){return false;}
				if(!data.port){return false;}
				if(!data.path){return false;}
				if(!data.displayMode){return false;}
			}
			if(stype=="his")
			{
				if(!data.type){return false;}
				if(!data.user){return false;}
				if(!data.passwd){return false;}
				if(!data.ip){return false;}
				if(!data.port){return false;}
				if(!data.path){return false;}
				if(!data.displayMode){return false;}
				if(!data.vodType){return false;}
				if(!data.beginTime){return false;}
				if(!data.endTime){return false;}
			}
			return true;
		},
		/**
		 * [getPlayData 获取实时视频播放的数据格式]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[json]}   data           [通道数据 json]
		 * @param  {[字符串]}   stype          [字符串 类型 取值为real 或 his]
		 * @param  {[数字]}   definitionType [高标清]
		 * @return {[json]}                  [播放实时数据格式描述信息]
		 */
		getPlayData:function(data,stype,definitionType)
		{
			if(data==-1){return false;}
			var getDataIndex=function(data,k,definitionType)
			{
				var pdata=data[k];
				var obj=
				{
			        "user": pdata.username,
			        "passwd": pdata.password,
			        "ip": pdata.ip,
			        "port": pdata.port,
			        "path": pdata.av_obj,
			        "displayMode":0,
			        "definitionType":definitionType
				};
				return obj;
			};

			var getParam=function(data,definitionType) {
				var L = data.length;
				if (L == 1) {
					return getDataIndex(data, 0, definitionType);
				}
				else if (L >= 2) {
					for (var i = 0; i <= L - 1; i++) {
						if (data[i].pvg_group_id === 2 || data[i].pvg_group_id === 3) {
							//alert("走dvr");
							return getDataIndex(data, i, definitionType);
						}
					}
					return getDataIndex(data, 0, definitionType);
				}
			};
			if(stype=="real") {
				if (data.sd_channel && data.sd_channel.length >= 1) {
					//return getParam(data.sd_channel,0);
				}

				if (data.sdchannel && !data.sdChannel) {
					data.sdChannel = data.sdchannel;
					//delete data.sdchannel;
				}
				if (data.hdchannel && !data.hdChannel) {
					data.hdChannel = data.hdchannel;
				}
				var sd, hd;
				if (data.sdChannel && data.sdChannel.length >= 1) {
					sd = getParam(data.sdChannel, 0);
				}
				if (data.hdChannel && data.hdChannel.length >= 1) {
					hd = getParam(data.hdChannel, 1);
				}
				if (!sd && !hd) {
					return null;
				}
				if (definitionType === 1) {
					if (hd) {
						return hd;
					}
					else {
						return sd;
					}
				} else if (definitionType === 0) {
					if (sd) {
						return sd;
					}
					else {
						return sd;
					}
				}
			}
	},
	/**
	 * [login 登录pvg]
	 * @author huzc
	 * @date   2015-07-15
	 * @param  {[json]}   obj [{"user":"xx1","passwd":"xx2","ip":"192.168.60.21","port":2100}]
	 * @return {[数字]}       [0或者错误码]
	 */
	login: function(obj) {
		var jsonstr = JSON.stringify(obj);
		var result = this.playerObj.Login(jsonstr);
		return result;
	},
	/**
	 * [preLogin 预登录，一次性将多个摄像头登录pvg，暂未使用]
	 * @author huzc
	 * @date   2015-07-15
	 * @param  {[数组]}   arr [预登录数组]
	 */
	preLogin: function(arr) {
		var self = this;
		if (typeOf(arr) === 'array' && arr.length) {
			arr.reverse();
			var i = arr.length;
			while (i--) {
				self.login(arr[i]);
			}
		}
	},
	/**
	 * [preOpenStream 预打开  但是不显示图像，即隐藏打开  返回该视频句柄，该句柄在prePlayStream函数是使用]
	 * @author huzc
	 * @date   2015-07-15
	 * @param  {[json]}   param [{"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1"}]
	 * @return {[数字]}         [0或错误码]
	 */
	preOpenStream: function(param) {
		param.type = 1;
		var jsonstr = JSON.stringify(param);
		var handle = this.playerObj.OpenStream(jsonstr,288);
		return handle;
	},
	/**
	 * [preCloseStream 关闭preOpenStream打开的隐藏视频]
	 * @author huzc
	 * @date   2015-07-15
	 * @param  {[数字]}   handle [句柄]
	 */
	preCloseStream:function(handle){
		if (handle>0) {
			var N = this.playerObj.CloseStream(handle);
			return N;
		}
	},
	/**
	 * [prePlayStream 预播放 将preOpenStream隐藏打开的画面显示]
	 * @author huzc
	 * @date   2015-07-15
	 * @param  {[数字]}   handle [handle是preOpenStream函数的返回值]
	 * @param  {[数字]}   index  [窗口号]
	 * @return {[数字]}          [0或错误码]
	 */
	prePlayStream:function(handle,index){
		if (handle>0) {
			var N = this.playerObj.PlayStream(handle,index);
			return N;
		}
	},
	/**
	 * [isOffChannel 判断当前通道是否离线]
	 * @author huzc
	 * @date   2015-07-15
	 * @param  {[数字]}   arr [当前通道]
	 * @return {Boolean}      [是否离线]
	 */
	isOffChannel:function(arr){
		var i = arr.length;
		if(i){
			while(i--){
				if(arr[i].channel_status === 0){//在线
					return false;
				}
			}
			return true;
		}else{
			return true;
		}
	},
	/**
	 * [isOffLine 判断摄像头是否是离线]
	 * @author huzc
	 * @date   2015-07-15
	 * @param  {[json]}   param [通道数据]
	 * @return {Boolean}        [是否是离线]
	 */
	isOffLine:function(param){
		if(!param.hdChannel.length&&!param.sdChannel.length){
			return true;
		}else{
			var hdStatus = this.isOffChannel(param.hdChannel);
			var sdStatus = this.isOffChannel(param.sdChannel);
			return (hdStatus&&sdStatus);
		}
	},
	/**
	 * [defencePlay 布防播放   备注：针对一屏播放]
	 * @author huzc
	 * @date   2015-07-15
	 * @param  {[json]}   param [播放参数]
	 * @return {[布尔]}         [播放成功与否]
	 */
	defencePlay: function(param) {
		var layout = this.getLayout();
		var self = this;
		if (layout === 1) {
			self.playerObj.StopEx(false, 0, function() {}, 0); //关闭之前画面
			self.refreshWindow(0); //刷新当前画面
			self.saveCameraData(param, 0); //保存数据到cameraData数组中
			var isOff = self.isOffLine(param);
			/**
			 * window.offlineCameraPlay,全局开关，标示在摄像机离线状态下，是否也进行开流
			 * modify by zhangyu 2016.04.16
			 */
			/*if (isOff && !window.offlineCameraPlay) {
				self.cameraData[0].cplayStatus = 2;
				this.setStyle(2, 0);
				return false;
			} else {*/
				var allChannels = param.hdChannel.concat(param.sdChannel);
				var onlineChannels = self.getOnlineChannels(allChannels);
				var i = onlineChannels.length;
				while (i--) {
					(function(j) {
						var tem = self.formatStreamDate(onlineChannels[j]);
						if (self.options.displayMode === 1) {
							tem.displayMode = 1;
						}
						self.playStream(tem, 0, function(result) {
							if (result === 0) {
								self.cameraData[0].playing = tem;
								self.cameraData[0].cplayStatus = 0;
							} else {
								if (j === 0) {
									self.cameraData[0].cplayStatus = 1;
									self.setStyle(1, 0);
								}
							}
						});

					})(i);
				}
			//}
		}
	},
		/**
		 * [grabOriginal 抓图(原图  base64串)  备注：该方法必须在grabCompress之后调用，获取上一次grabCompress时内部保持的原图图片信息, 获取index窗口最后一次CatchScaleDownPicture抓图的原始图片信息(如果不调用CatchScaleDownPicture, 多次调用本接口获取的为同一张原始图片)]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[字符串]}         [正确返回base64编码的png图片信息，错误返回"ERROR"]
		 */
		grabOriginal:function(index){
			var base64 = this.playerObj.GetRawPicture(index);
			if (index!=='ERROR') {
				base64.replace(/[\n\r]/ig, '');
			}
			return base64;
		},
		/**
		 * [grabCompress 抓图(压缩过的  base64串),同时抓取它的原图，但是此处仅仅只是保持到ocx内部，供grabOriginal调用,抓图，并返回压缩的png图片信息
		 *1.1080p和720p视频，图片压缩为512*288
		 *2.w>720且 h>480视频，图片压缩为(w/2)*(h/2)
		 *3.其他视频，图片不压缩
		 * ]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[字符串]}         [base64的图片数据]
		 */
		grabCompress:function(index){
			var base64 = this.playerObj.CatchScaleDownPicture(index);
			if (index!=='ERROR') {
				this.grabIndex = index-0;
				base64.replace(/[\n\r]/ig, '');
			}
			return base64;
		},
		/**
		 * [grabOriginalEx grabOriginal的扩展形式  抓图(原图  base64串)  备注：该方法必须在grabCompress之后调用，获取上一次grabCompress时内部保持的原图图片信息
		 * 获取index窗口最后一次CatchScaleDownPictureEx抓图的指定格式原始图片信息(GetRawPicture扩展接口)
		 * ]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[字符串]}         [正确返回base64编码的指定格式图片信息，错误返回"ERROR"]
		 */
		grabOriginalEx:function(index){
			var base64 = this.playerObj.GetRawPictureEx(index,3);//1:BMP  2:GIF  3:JPG 4:PNG  由于JPG速度最快  实战默认选用3 注：不要求与CatchScaleDownPictureEx的nPicType一致
			if (index!=='ERROR') {
				base64.replace(/[\n\r]/ig, '');
			}
			return base64;
		},
		/**
		 * [grabCompressEx
		 *grabCompress的扩展形式  抓图(压缩过的  base64串),同时抓取它的原图，但是此处仅仅只是保持到ocx内部，供grabOriginal调用
		 *抓图，并返回压缩的指定格式图片信息(CatchScaleDownPicture扩展接口)
		 *1.1080p和720p视频，图片压缩为512*288
		 *2.w>720且 h>480视频，图片压缩为(w/2)*(h/2)
		 *3.其他视频，图片不压缩
		 * ]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[字符串]}         [正确返回base64编码的指定格式图片信息，错误返回"ERROR"]
		 */
		grabCompressEx:function(index){
			var base64 = this.playerObj.CatchScaleDownPictureEx(index,3);//1:BMP  2:GIF  3:JPG 4:PNG  由于JPG速度最快  实战默认选用3
			if (index!=='ERROR') {
				this.grabIndex = index-0;
				base64.replace(/[\n\r]/ig, '');
			}
			return base64;
		},
		/**
		 * 抓图，并返回压缩的指定格式、指定大小图片信息(CatchScaleDownPicture2扩展接口)
		 * @number index  播放窗口索引
		 * @number width  截图的宽  图片宽度, 最小有效值为4,最大有效值为3840
		 * @number height 截图的长  图片高度，最小有效值为4,最大有效值2160
		 * @return {[type]}        [description]
		 *
		 * 注 关于图片大小的说明：
		 *1.图片宽高参数自动处于有效范围内
		 *2.width>0且height<=0时，根据width按视频原始比例自适应高度
		 *3.width<=0且height>0时，根据height按视频原始比例自适应宽度
		 *4.width>0且height>0时，按此宽高
		 *5.Width<0且height<0时，自动压缩，同CatchScaleDownPictureEx
		 */
		grabCompressEx2:function(index,width,height){
			var base64 = this.playerObj.CatchScaleDownPictureEx2(index,3,width,height);//1:BMP  2:GIF  3:JPG 4:PNG  由于JPG速度最快  实战默认选用3
			if (index!=='ERROR') {
				this.grabIndex = index-0;
				base64.replace(/[\n\r]/ig, '');
			}
			return base64;
		},
		/**
		 * [catchOriginal 抓原图并获取指定格式图片信息()(GetPicInfo扩展接口)]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[number]}   index [播放窗口索引]
		 * @return {[字符串]}         [正确返回base64编码的指定格式图片信息，错误返回"ERROR"]
		 */
		catchOriginal:function(index){
			var base64 = this.playerObj.CatchPictrue(index,3);//1:BMP  2:GIF  3:JPG 4:PNG  由于JPG速度最快  实战默认选用3
			if (index!=='ERROR') {
				this.grabIndex = index-0;
				base64.replace(/[\n\r]/ig, '');
			}
			return base64;
		},
		/**
		 * [PlayerEx 此函数为播放视频的函数，封装PlayEx执行，此函数一般给playRoute调用]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[字符串]}   str     [播放需要的通道信息字符串]
		 * @param  {[字符串]}   stype   [标清/高清等描述信息,不写可为空字符串]
		 * @param  {[数字]}   index   [窗口序号]
		 * @param  {[数组]}   A       [默认为空,记录播放路由的信息数组]
		 * @param  {Function} fn      [播放回调函数 格式和 playRoute的回调函数格式保持一致]
		 * @param  {[数字]}   timeout [超时时间]
		 */
		PlayerEx: function(str, stype, index, A, fn, timeout) {
			var self = this;
			var isTimeout = true;
			if (!timeout) {
				timeout = 8000
			}
			this.playerObj.PlayEx2(str, index, function(index, result, userParam) {
				//播放完的回调
				isTimeout = false;
				if (result == 0) {
					isTimeout = true;
					A.push("待播放" + stype + "通道连接pvg成功，已经获取到码流！通道信息:" + str);
					//这里不执行fn,走到下一个回调执行fn
				} else {
					A.push("尝试连接pvg失败！错误码:" + result + ",通道信息:" + str);
					fn && fn(false, str, A);
				}
				if (result < 0) {
					A.push("playEx函数执行失败,返回错误码" + result + ",通道信息:" + str);
					self.StopEx(false, index);
					fn && fn(false, str, A);
					return;
				}
				setTimeout(function() {
					if (isTimeout) {
						A.push("连接" + timeout + "毫秒之后无法连接上，超时,通道信息:" + str);
						//self.playerObj.Stop(false,index);
						self.StopEx(false, index);
						fn && fn(false, str, A);
					}
				}, timeout);
			}, 0, function(index, result, userParam) {
				isTimeout = false;
				if (result == 0) {
					A.push("播放" + stype + "通道成功，通道信息:" + str);
					fn && fn(true, str, A);
				} else {
					A.push("尝试播放" + stype + "通道失败！错误码:" + result + ",通道信息:" + str);
					fn && fn(false, str, A);
				}
			}, 0, function() {
				//播放录像时，录像到达结束时间会触发此回调；播放本地、PFS文件时，文件出错会触发此回调

			}, 0);
		},
		/**
		 * [Playsd 播放标清视频的一个函数，此函数为中间函数，给playRoute调用]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数组]}   camerData [摄像机通道信息，格式和playRoute一致]
		 * @param  {[数字]}   index     [description]
		 * @param  {[数组]}   A         [数组，默认为空]
		 * @param  {Function} fn        [播放回调函数 回调函数格式和 playRoute回调一致]
		 * @param  {[数字]}   timeout   [超时时间]
		 */
		Playsd:function(camerData,index,A,fn,timeout)
		{
			if(!timeout){timeout=8000;}
			var self=this;
			var sd_channel=camerData.sd_channel;
			var sd_length=sd_channel.length;
			A.push("for循环查找标清通道");
			var EnCoder=null;
			for (var i=0; i <=sd_length-1; i++)
			{
				var group_id=sd_channel[i].pvg_group_id;
				//1表示编码器，没有录像；2表示DVR  3表示 nvr，高清摄像机的标清码流ipc
				if (group_id == 2 || group_id == 3)
				{
					var stype=(group_id == 2 )?"dvr":"nvr";
					A.push("找到一个"+stype+"通道,尝试播放,通道信息:"+JSON.stringify(camerData.sd_channel[i]));
					var params=
					{
							"type":1,
							"user": sd_channel[i].username,
							"passwd": sd_channel[i].password,
							"ip": sd_channel[i].ip,
							"port": sd_channel[i].port,
							"path": sd_channel[i].av_obj,
							"displayMode":0
					};
					var str=JSON.stringify(params);
					A.push("Playsd函数调player.PlayerEx,编号0,参数:"+str);
					self.PlayerEx(str,"标清"+stype,index,A,fn,timeout);
					EnCoder=null;
					return;
				}
				else if(group_id == 1) //即使先运行到这个分支，后面碰到group_id == 2 || group_id == 3 ,则EnCoder=null;
				{
					A.push("找到一个编码器通道,尝试播放,通道信息:"+JSON.stringify(camerData.sd_channel[i]));
					EnCoder=sd_channel[i];
				}
			}
			EnCoder.type=1;
			var str=JSON.stringify(EnCoder);
			A.push("Playsd函数player.PlayerEx,编号1,参数:"+str);
			self.PlayerEx(str,"标清编码器",index,A,fn,timeout);
		},
		/**
		 * [PlayRoute 实时视频播放路由
		示例
		playRoute(camerData,0,function(flag,str,A)
		{
			  if(flag==false){console.log("播放失败，通道信息:"+str+",路由信息"+A);}
			  else
			  {
				console.log("播放成功，通道信息:"+str+",路由信息"+A);
			  }
		});
		 * ]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数组]}   camerData [从摄像机id 获取摄像机数据，里面至少含有 sdchannel hdchannel 数组]
		 * @param  {[数字]}   index     [窗口序号]
		 * @param  {Function} fn        [播放成功与否的回调]
		 * @param  {[数字]}   timeout   [超时时间]
		 */
		PlayRoute:function(camerData,index,fn,timeout)
		{
			if(!timeout){timeout=8000;}
			var self=this;
			var A=[];
			var N=self.getLayout();
			var hd_length=camerData.hd_channel.length;
			var sd_length=camerData.sd_channel.length;
			self.cameraData[index]=camerData;//保存数据到cameraData数组中
			A.push("此摄像机存在"+hd_length+"个高清通道,"+sd_length+"个标清通道");

			if(hd_length===0&&sd_length===0){
				A.push("高标清通道都不存在");
				fn&&fn(false,"",A);
				return;
			}
			if(N!==1)
			{
				A.push("尝试播放标清通道");
				if(sd_length>=1){
					self.Playsd(camerData,index,A,fn,timeout);
					return;
				}
			}
			A.push("单屏,尝试查找高清通道");
			if(hd_length>0)
			{
				var options=camerData.hd_channel[0];
				var params=
				{
					"type":1,
					"user": options.username,
					"passwd": options.password,
					"ip": options.ip,
					"port": options.port,
					"path": options.av_obj,
					"displayMode":0
				};
				var str=JSON.stringify(params);
				A.push("找到一个高清通道，尝试播放，理论上只有一个高清通道，此处只查找一次");
				A.push("PlayRoute函数调player.PlayerEx,参数:"+str);
				self.PlayerEx(str,"高清",index,A,function(flag,str,A)
				{
					if(flag==false)
					{
						A.push("播放高清通道失败,通道信息:"+str);
						//fn(false,str,A);
						if(sd_length<=0)
						{
							A.push("不存在标清通道:"+str);
							fn&&fn(false,str,A);
							return;
						}
						else
						{
							A.push("尝试播放标清通道！通道信息:"+str);
							self.Playsd(camerData,index,A,fn,timeout);
						}
						return;
					}

					else
					{
						//A.push("播放高清通道成功,通道信息:"+str);
						fn&&fn(true,str,A);
					}
				},timeout);
				return;
			}
			else
			{
				A.push("没找到高清通道，尝试查找标清通道信息");
				if(sd_length<=0)
				{
					A.push("不存在标清通道"+JSON.stringify(camerData));
					fn&&fn(false,"",A);
					return;
				}
				A.push("尝试播放标清通道");
				self.Playsd(camerData,index,A,fn,timeout);
			}
		},
		/**
		 * [PlayByCameraId 从摄像机id播放实时视频]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[字符串]}   cameraid [摄像机id]
		 * @param  {[数字]}   index    [窗口序号]
		 * @param  {Function} fn       [回调函数和PlayRoute保持一致]
		 * @param  {[数字]}   timeout  [超时时间]
		 */
		PlayByCameraId:function(cameraid,index,fn,timeout)
		{
			var self = this;
			if (self.cameraDataCache[cameraid] !== undefined) {
				self.PlayRoute(self.cameraDataCache[cameraid], index, fn, timeout);
			} else {
				self.getCameraDataById(cameraid, index, function(data) {
					self.cameraDataCache[cameraid] = data.cameraInfo;
					self.PlayRoute(data.cameraInfo, index, fn, timeout);
				});
			}
		},
		/**
		 * [StopEx 异步关闭播放的分屏]
		 * @author huzc
		 * @date   2015-03-10
		 * @param  {[布尔]}   pause     [是否暂停,false关闭，true暂停]
		 * @param  {[序号]}   index     [分屏序号]
		 * @param  {Function} fn        [关闭成功后的回调函数，关闭失败的回调暂时不支持]
		 * @param  {[任意]}   userParam [用户参数,暂时固定为0，可以不去关心]
		 */
		StopEx:function(pause, index, fn){
			this.playerObj.StopEx(pause, index, function(index, result, userParam) {
				if (result === 0) { //不等于0的情况不用关心，因为不等于0时，即关闭失败时无法执行回调
					fn && fn(index);
				}
			}, 0);
		},
		/**
		 * [getAjax get类型ajax]
		 * @author Mayue
		 * @date   2015-03-12
		 * @param  {[type]}   url      [description]
		 * @param  {[type]}   params   [description]
		 * @param  {Function} callback [description]
		 * @return {[type]}            [description]
		 */
		getAjax:function(url,params,callback){
			var self=this;
			jQuery.ajax({
				url: url,
				type: 'get',
				data: params,
				dataType: 'json',
				success: function(res) {
					if (res.code === 200)
					{
						if(typeof(callback)=="function")
						{
							callback(res.data);
						}
					}
					else if (res.code === 500)
					{
						notify.error(res.data.message);
					}
					else
					{
						notify.error("获取数据异常！");
					}
				}
			});
		},
		/**
		 * [getCameraDataById 从摄像机id获取数据]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[字符串]}   cameraid [字符串，摄像机id]
		 * @param  {[数字]}   index    [窗口序号]
		 * @param  {Function} fn       [回调]
		 */
		getCameraDataById:function(cameraid,index,fn){
			var self=this,
				url = "/service/video_access_copy/accessChannels";
			self.getAjax(url,{id:cameraid},fn);
		},
		/**
		 * [getCameraDataByIds 从一组摄像机id获取数据]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数组]}   cameraids [description]
		 * @param  {Function} fn        [回调]
		 */
		getCameraDataByIds:function(cameraids,fn){
			var self=this,
				url = "/service/video_access_copy/accessChannelsArr";
			self.getAjax(url,{ids:cameraids.join(',')},fn);
		},
		/*getCameraDataById:function(cameraid,index,fn){
			var self=this;
			jQuery.ajax({
				url: "/service/video_access_copy/accessChannels",
				type: 'get',
				data: {id: cameraid},
				dataType: 'json',
				success: function(res) {
					if (res.code === 200)
					{
						if(typeof(fn)=="function")
						{
							fn(res.data);
						}
					}
					else if (res.code === 500)
					{
						notify.error(res.data.message);
					}
					else
					{
						notify.error("获取数据异常！");
					}
				}
			});
		},*/
		/**
			*获取历史录像片段信息
			@cId 摄像机通道id
			@begintime 开始时间
			@endtime 结束时间
			@fn 查询的回调函数 参数 function(camera,flag){} camera json格式 flag布尔型
				{
					"code": 200,
					"data": {
						"port": 2100,
						"username": "admin",
						"time": 1396839419996,
						"videos": [
							[1396831555359, 1396831742573, 0],
							[1396839112185, 1396839419987, 0]
						],
						"name": "60.172_1_R",
						"path": "av/181_172/1",
						"password": "admin",
						"ip": "192.168.60.181"
					}
				}
		*/
		/**
		 * [PlayListTime 选中一段历史录像播放,播放的数据为window.SelectCamera.ListData[index].searchData里存储的数据]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   index [分屏索引序号]
		 * @param  {[数字]}   order [搜索的历史录像片段中的播放某片段的序号]
		 * @param  {Function} fn    [回调]
		 */
		PlayListTime:function(index, order, searchBeginTime, searchEndTime, fn) {
			var self = this;
			var ListData = window.SelectCamera.ListData[index],
				definitionType = window.SelectCamera.ListData[index].definitionType;
			ListData.speed = self.getPlaySpeed(index);
			var data = ListData.searchData;
			if (!data) {
				data = window.SelectCamera.searchData;
			}
			/**
			 * 如果是多窗口播放，add by zhangyu 2016.04.28
			 * order为-1时标示播放全部搜索时间段录像,在原来窗口上播放即可
			 */
			if(window.hisRecordPlayMode === "multi" && order !== -1) {
				index = this.getFreeIndex();
			}
			//取搜索的开始时间/结束时间
			var beginTime = searchBeginTime,
				endTime = searchEndTime,
				//获取录像深度（order为-1时标示播放全部搜索时间段录像）
				vodType = (order === -1) ? data.videos[0][2] : data.videos[order][2];
			window.SelectCamera.ListData[index].subindex = order;
			window.SelectCamera.ListData[index].beginTime = beginTime;
			window.SelectCamera.ListData[index].endTime = endTime;
			window.SelectCamera.ListData[index].vodType = vodType;
			window.SelectCamera.ListData[index].searchData = data;
			var resultList = jQuery("#ptzCamera .content .view.hisplay.ui.tab .resultList");
			var input_beginTime = jQuery(".his_beginTime.input-time").val();
			var input_endTime = jQuery(".his_endTime.input-time").val();

			window.SelectCamera.ListData[index].searchHTML = resultList.html();
			window.SelectCamera.ListData[index].input_beginTime = input_beginTime;
			window.SelectCamera.ListData[index].input_endTime = input_endTime;
			console.log("搜索信息：", "begintime=" + beginTime + "endtime=" + endTime);
			//播放历史
			self.playExHis(index, beginTime, endTime, vodType, data, function (index, result, userParam) {
				if (result !== 0) {
					return;
				}
				self.preSetPlaySpeed(ListData.speed, index);
				//只有在非轮巡状态下才去控制masklayer  马越
				if (!(jQuery('#startInspector').is(':visible') && jQuery('#startInspector').hasClass('red'))) {
					jQuery(".masklayer").hide();
				}
				//改动，解决了历史录像的标题问题
				var text = data.name;
				var alldata = window.SelectCamera.MenuData[text];
				if (alldata) {
					if (alldata.id) {
						alldata.cId = alldata.id;
					}
					if (alldata.cameracode) {
						alldata.cCode = alldata.cameracode;
					}
					if (data.path) {
						alldata.path = data.path;
					}
					if (data.name) {
						alldata.cName = data.name;
					}
					if (typeof(definitionType) == "number") {
						alldata.definitionType = definitionType;
					}
					if (typeof(alldata.cameratype) == "number") {
						alldata.cType = alldata.cameratype;
					} else if (typeof(data.cameratype) == "number") {
						alldata.cType = data.cameratype;
					} else if (typeof(data.cType) == "number") {
						alldata.cType = data.cType;
					}
					alldata.cStatus = data.cstatus;
					self.cameraData[index] = alldata;
					self.updatePlayStatus(index);
				}
				window.SelectCamera.ListData[index].searchData = data;
			}, function (index, result, data) {
				fn && fn(index, result, data);
			});
		},
		/**
		*计算播放倍速，即调用SetPlaySpeed函数的次数。如8倍速播放，则需调用SetPlaySpeed函数3次，每次传入1。该接口不好，后续需要需改
		*/
		preSetPlaySpeed: function(speed, index) {
			var self = this;
			console.log("speed", speed);
			switch (speed) {
				case "8":
					self.setPlaySpeed(1, index);
					self.setPlaySpeed(1, index);
					self.setPlaySpeed(1, index);
					jQuery('#downBlockContent .times-play').text('x' + speed);
					break;
				case "4":
					self.setPlaySpeed(1, index);
					self.setPlaySpeed(1, index);
					jQuery('#downBlockContent .times-play').text('x' + speed);
					break;
				case "2":
					self.setPlaySpeed(1, index);
					jQuery('#downBlockContent .times-play').text('x' + speed);
					break;
				case "1":
					break;
				case "1/8":
					self.setPlaySpeed(-1, index);
					self.setPlaySpeed(-1, index);
					self.setPlaySpeed(-1, index);
					jQuery('#downBlockContent .times-play').text('x' + 1 / 8);
					break;
				case "1/4":
					self.setPlaySpeed(-1, index);
					self.setPlaySpeed(-1, index);
					jQuery('#downBlockContent .times-play').text('x' + 1 / 4);
					break;
				case "1/2":
					self.setPlaySpeed(-1, index);
					jQuery('#downBlockContent .times-play').text('x' + 1 / 2);
					break;
				default:
					break;
			}

		},
		/**
		 * [getHisCount 统计播放历史录像的总的分屏数]
		 * @author huzc
		 * @date   2015-07-15
		 * @return {[数字]}   [播放历史录像的总的分屏数]
		 */
		getHisCount:function()
		{
			var K=0;
			this.get_hiscount(function(str,i)
			{
				if(str!="ERROR"&&JSON.parse(str).videoType===2) //播放历史
				{
					K++;
				}
			});
			return K;
		},
		/**
		 * [trigger 模拟jq的trigger，方便调用]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[字符串]}   name [事件名]
		 * @param  {[对象]}   obj  [json参数]
		 */
		trigger:function(name,obj)
		{
			var self=this;
			switch(name)
			{
				case "resize":{ self.fireEvent('OCXRESIZE',obj); break;}
				case "mousewheel":{ self.fireEvent('OCXWHEEL',obj); break;}
				case "click":{ self.setFocusWindow(obj); self.fireEvent('OCXCLICK',obj); break;}
				case "dblclick":{ self.setFocusWindow(obj.index); self.fireEvent('OCXDCLICK',obj); break;}
				case "focuschange": { self.fireEvent('FocusChange',obj); break;}
				case "switch":{ self.fireEvent('OCXSWITCH',obj); break;}
				case "mousedown":{ self.fireEvent('MouseDown',obj);break;}
				case "move":{ self.fireEvent('MouseMove', obj);break;}
				case "enter":{ self.fireEvent('MouseMoveWindow', obj);break;}
				case "mouseup":{ self.fireEvent('MouseUp', obj);break;}
				case "leave":{ self.fireEvent('LEAVEOCX', obj);break;}
				case "layoutchange":{ self.fireEvent('OnLayoutChange', obj);break;}
				case "fullscreen":{ self.fireEvent('OCXFULLSCR', obj);break;}
				case "exitfullscreen":{ self.fireEvent('OCXCANCELFULL', obj);break;}
				default:{}
			}
		},
		/**
		 * [getHistoryList 通过参数查询历史录像片段信息]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[数字]}   cId       [摄像机通道id]
		 * @param  {[数字]}   begintime [开始时间]
		 * @param  {[数字]}   endtime   [结束事件]
		 * @param  {Function} fn        [查询结束的回调]
		 */
		getHistoryList:function(cId,begintime,endtime,fn){
			jQuery.ajax({
				url: '/service/history/list_history_videos_other',
				data: {
					channel_id: cId,
					begin_time: begintime,
					end_time: endtime
				},
				cache: false,
				type: 'GET',
				async: true,
				success: function(res)
				{
					if (res.code === 200)
					{
						var camera = res.data;
						fn(camera,true);
					}
					else if(res.code === 500)
					{
						fn(camera,false);
					}
				}
			});
		},
		/**
		 * [setVideoMarginColor 设置播放器背景margin颜色]
		 * @author Mayue
		 * @date   2015-04-27
		 */
		setVideoMarginColor:function(){
			this.playerObj.SetVideoMarginColor(0,0,0,-1);//第一个参数红色（范围0~255）第一个参数绿色（范围0~255）第一个参数蓝色（范围0~255） 第四个参数窗口索引  Index = -1表示设置所有窗口
		},
		/**
		 * 窗口通道间拖动切换是否可用
		 * @author songxj
		 * @param  {[type]}	enable[true:可以拖动 false:不可以拖动]
		 * @return {[type]}
		 */
		enableExchangeWindow: function(enable){
			var N = this.playerObj.EnableExchangeWindow(enable);
			//提示报错信息
			this.ShowError(N);
			return N;
		},
		/**
		 * 设置轮巡时切流是否出现转圈
		 * @author chenmc
		 * @param  {[type]}	enable[true:出现转圈 false:不出现转圈]
		 * @param  {[type]}	index [分屏索引]
		 * @return {[type]}
		 */
		EnableLoadingGif: function(enable,index){
			this.playerObj.EnableLoadingGif(enable,index);
		},
		/**
		 * 视频发生窗口交换
		 * @author songxj
		 * @param  {[type]}	option[option为一个字符串，格式为： {"to":[1,5,7,2], "from":[2,6,5,-1]}]
		 */
		replaceWindow : function(option) {
			this.playerObj.ReplaceWindow(option);
		},
		/**
		 * [getOption 获取OCX配置选项接口]
		 * @author songxj
		 * @param  {[type]} option [指定要获取的配置选项,json格式字符串: a. "" 表示获取所有配置项 b. {"hwdecoder":""}获取硬解码配置 c. {"rcddownload" :""}获取录像下载配置 d. 允许多种配置组合获取，如：{"hwdecoder":"", "rcddownload":""} ]
		 * @return {[type]}        [a.所有配置信息 b.获取硬解信息 c.获取录像下载信息 d.获取硬解和录像下载信息 ]
		 */
		getOption: function (option) {
			return this.playerObj.GetOption(option);
		},
		/**
		 * [setOption 设置OCX配置选项接口]
		 * @author songxj
		 * @param {[type]} option [指定要配置的选项,json格式字符串:a. {"hwdecoder":{"mode":"all"}} 硬解码配置为"all"模式，默认为"none"模式 b. {"rcddownload":{"splitmode":"size", "splitvalue":1024 }}录像下载配置为按大小1G分割 c. 允许多种配置同时使用; ]
		 * @return {[type]} [0: OK, other: error code ]
		 */
		setOption: function (option) {
			return this.playerObj.SetOption(option);
		},
		/**
		 * [getErrorCode 获取错误信息]
		 * @author huzc
		 * @date   2015-07-15
		 * @param  {[字符串]}   x [错误码]
		 * @return {[字符串]}     [错误码描述信息]
		 */
		getErrorCode:function(x)
		{
			var ErrorData=
			{
				"-1":"未分类错误",
				"-2":"avport错误",
				"-3":"服务器配置信息被破坏",
				"-4":"服务器必须重新启动",
				"-5":"字符串的长度超出预设长度",
				"-6":"指令已经过时",
				"-7":"指令没有实现",
				"-8":"运行时异常",
				"-9":"驱动程序内部故障",
				"-10":"内部程序逻辑错误",
				"-11":"对象不支持的POSA接口",
				"-12":"创建线程失败",
				"-13":"空函数，不应该调用到此处",
				"-14":"缺少或没有配置驱动(POSA对象构造器)",
				"-15":"该功能限制使用",
				"-16":"指令用法错误，程序逻辑错误",
				"-17":"输出参数缓冲区太小",
				"-18":"路由连接失败，找不到匹配网关主机模式集",
				"-19":"试图注销尚未注册的POSA对象构造器",
				"-20":"重复注册已经注册的POSA对象构造器",
				"-21":"设置系统时间失败",
				"-22":"设置服务器ip失败",
				"-23":"取得服务器ip失败",
				"-24":"更新系统文件失败",
				"-25":"接收夹带数据失败",
				"-26":"没有足够的内存",
				"-27":"错误的组播地址数量",
				"-28":"服务端检测到无法解析的请求",
				"-29":"IO操作超时",
				"-30":"IO操作被取消",
				"-31":"连接正在进行中",
				"-32":"未被挂装的Host",
				"-33":"被固定挂装的Host",
				"-34":"系统退出中，请求无法完成",
				"-35":"外部程序逻辑错误",
				"-41":"读取avsetting配置信息错误",
				"-42":"写avsetting配置信息错误",
				"-43":"没有找到要保存的类型",
				"-45":"av名字错误",
				"-46":"坐标不正确",
				"-47":"宽度或是高度不正确",
				"-48":"设置叠加位图不正确",
				"-49":"获得动态感知错误",
				"-50":"功能限制",
				"-51":"设置编码参数失败",
				"-52":"矩阵端口参数越界",
				"-53":"视频尺寸参数错误",
				"-54":"视频制式参数错误",
				"-55":"视频编码器av口参数越界",
				"-56":"视频编码器未知错误",
				"-57":"视频解码器未知错误",
				"-81":"列出用户信息失败",
				"-82":"加入用户失败",
				"-83":"删除用户失败",
				"-84":"没有此用户",
				"-85":"保存用户失败",
				"-86":"用户数超出限制",
				"-87":"没有请求的功能",
				"-88":"没有权限访问",
				"-89":"用户名或密码不正确",
				"-90":"用户级别太低",
				"-91":"已经有用户登录",
				"-92":"本用户已经登录",
				"-93":"不正确的对象名字",
				"-94":"DDB存取出错",
				"-95":"Ticket无效",
				"-96":"登录失败",
				"-97":"TCP Session连接数限制",
				"-101":"设置的长度不能小于0",
				"-102":"打开目录失败",
				"-103":"删除文件失败",
				"-104":"设置文件生存期错误",
				"-105":"错误的时间格式",
				"-106":"smf文件已经开始存储数据，请在存储数据前添加所有的流信息",
				"-107":"被保护的文件无法删除，请取消保护后再删除",
				"-110":"参数重复设置",
				"-111":"参数不存在",
				"-141":"串口的端口号错误",
				"-142":"打开串口失败",
				"-143":"保存串口配置失败",
				"-144":"读串口配置失败",
				"-145":"setpioHelper错误",
				"-146":"摄像头已经被锁定",
				"-147":"摄像头不能被控制",
				"-148":"访问受限",
				"-149":"设备PTZControl失败",
				"-150":"不支持的设备型号",
				"-151":"向串口发送数据失败",
				"-152":"获取PTZ操作信息失败",
				"-153":"获取PTZ控制信息失败",
				"-161":"磁盘号错误",
				"-162":"磁盘格式化错误",
				"-163":"错误的分区号",
				"-164":"格式化磁盘分区错误",
				"-166":"正在录像的文件不能删除",
				"-167":"错误的文件名",
				"-168":"没有找到满足条件的文件",
				"-169":"错误的文件类型",
				"-170":"缺少标题，不能录像",
				"-171":"没有找到自动录像指令",
				"-172":"设置自动录像失败",
				"-173":"清除自动录像失败",
				"-174":"分配地址失败",
				"-175":"设置视频输出制式错误",
				"-176":"设置视频输入制式错误",
				"-177":"初始化MP4编码器错误",
				"-178":"初始化MP4解码器错误",
				"-179":"设定视频输入颜色",
				"-180":"视频采集驱动初始化错误",
				"-181":"视频显示驱动初始化错误",
				"-182":"管理的objs超过系统范围",
				"-183":"本sobj所拥有的targets超过限制",
				"-184":"增加一个sobj错误",
				"-185":"增加一个tboj错误",
				"-186":"打开文件失败",
				"-187":"没有找到指定的目标",
				"-188":"处于disable状态",
				"-189":"avsobj没有初始化",
				"-190":"avtobj没有初始化",
				"-191":"不能启动大图模式",
				"-192":"在大图模式无法完成此操作",
				"-193":"音频输入驱动初始化错误",
				"-194":"音频输出驱动初始化错误",
				"-195":"源重复打开",
				"-196":"目标重复打开",
				"-197":"MP3编码器初始化失败",
				"-198":"MP3解码器初始化失败",
				"-199":"错误的目标通道名",
				"-200":"文件数目太多",
				"-201":"错误的target数量(只支持一个target)",
				"-202":"传输不存在或用户没有发起该target",
				"-203":"错误的指令",
				"-204":"错误的事件类型",
				"-205":"错误的音频编码码率",
				"-206":"串口处于disable状态",
				"-207":"设置自动录像的条件重复",
				"-208":"目标流不存在",
				"-209":"节点处于断线状态",
				"-210":"CarryId重复",
				"-211":"CarryId不存在",
				"-212":"设备处于断线状态",
				"-213":"关闭文件错误",
				"-214":"要读的长度错误",
				"-215":"文件句柄错误",
				"-216":"读文件错误",
				"-217":"seekfile错误",
				"-218":"得到文件长度错误",
				"-219":"得到文件当前位置错误",
				"-220":"没有音频数据",
				"-221":"没有视频数据",
				"-222":"写文件错误",
				"-223":"系统资源(非内存)不足",
				"-224":"PosaClass对象不存在",
				"-225":"不是一个PosaSourceStream",
				"-226":"不是一个PosaTargetStream",
				"-227":"PosaHost对象已经存在",
				"-228":"PosaHost对象不存在",
				"-229":"PosaPort对象已经存在",
				"-230":"PosaPort对象不存在",
				"-231":"没有找到合适的PosaHost驱动",
				"-232":"没有找到合适的PosaSourceStream驱动",
				"-233":"没有找到合适的PosaTargetStream驱动",
				"-234":"没有找到合适的PosaDecoder驱动",
				"-235":"没有找到合适的PosaSilenceGenerator驱动",
				"-236":"Posa对象已经存在",
				"-237":"PosaSourceChannel已经被关闭",
				"-238":"分配本地地址或端口失败",
				"-239":"请求传输失败",
				"-240":"请求接收数据失败",
				"-241":"对象不存在",
				"-242":"对象已经存在",
				"-243":"对象属性设置错误",
				"-244":"属性值为空或非法",
				"-245":"不能分配到路径",
				"-279":"抢占数字干线优先级不够",
				"-246":"目标必须是本地的，不能是远程的",
				"-247":"路径连接失败",
				"-248":"属性不存在",
				"-249":"资源被抢占",
				"-250":"资源编号错误",
				"-251":"资源编号不存在",
				"-252":"超过该网段最大数字码流数",
				"-253":"POSA流I/O超时",
				"-254":"POSA流格式不匹配",
				"-255":"没有为软解码器设置Renderer",
				"-256":"没有为POSA目标流设置源",
				"-257":"POSA流的url格式不正确",
				"-258":"UDP或TCP端口已经被占用",
				"-259":"源流不存在",
				"-260":"解码器初始化失败",
				"-261":"解码失败",
				"-262":"没有初始化POSA运行支持库",
				"-263":"已经初始化过了POSA运行支持库",
				"-264":"没有提供定时器API",
				"-265":"加入到组播失败",
				"-266":"连接设备失败",
				"-267":"本地矩阵切换线路被抢占",
				"-268":"选定的节点路由(PassNODE)中不包括本节点或者找不到对应的网关",
				"-269":"传输的源和目标NPS地址不能都要求自动分配",
				"-270":"服务器连接其它设备或服务器时发生网络断线错误",
				"-271":"选定的节点路由(PassNODE)已经包括本节点",
				"-272":"断线重连动作现在不能进行, 必须推迟",
				"-273":"看门狗线程检查到源流在设定时间内没收到任何码流数据",
				"-274":"非法的目标通道名称",
				"-275":"检查到TCP socket已经无效(无法获取对方IP)",
				"-276":"视频丢失",
				"-277":"非法XML字符串",
				"-278":"XML格式不匹配",
				"-300":"正在重连中",
				"-301":"模块引用计数不为0",
				"-302":"缓冲区长度不够",
				"-320":"打开Sqlite数据库失败",
				"-321":"查询Sqlite数据库失败",
				"-322":"不支持的数据类型",
				"-323":"创建数据表失败",
				"-324":"删除数据表失败",
				"-325":"删除数据失败",
				"-326":"插入数据失败",
				"-327":"更新数据失败",
				"-501":"函数或参数格式不正确",
				"-502":"连接服务器失败",
				"-503":"客户端功能未实现",
				"-504":"客户端内存溢出",
				"-505":"客户端不认识的属性类型",
				"-506":"尚未连接服务器",
				"-507":"发送失败",
				"-508":"接收失败",
				"-509":"客户端不能打开文件",
				"-510":"客户端文件格式不正确",
				"-511":"客户端不能读文件",
				"-512":"客户端检测到无法解析的应答",
				"-513":"已经连接了服务器",
				"-514":"不正确的IP地址或主机名称",
				"-515":"无法创建新的RawObject",
				"-517":"服务器没有响应",
				"-518":"收到无法处理的应答",
				"-519":"传输已经发起",
				"-520":"摄像机没有设置传输协议",
				"-521":"摄像机的传输协议目前不支持",
				"-522":"用户没有登录",
				"-523":"网络接收超时",
				"-524":"网络地址PING不通",
				"-525":"服务器TCP端口错误",
				"-526":"对方已经关闭连接",
				"-527":"用户登录次数太多",
				"-528":"设备不支持的参数配置",
				"-600":"非法的服务器本地数据库文件",
				"-601":"程序没有初始化",
				"-702":"非法db对象ID",
				"-703":"db缓冲区太小",
				"-704":"db对象或者属性不存在",
				"-705":"db对象或者属性已经存在",
				"-706":"db内存不足",
				"-707":"db没有初始化",
				"-708":"db打开文件失败",
				"-709":"db数据check失败",
				"-710":"db类型不匹配",
				"-711":"db非法对象名",
				"-712":"db错误的文档",
				"-713":"db密码不可读",
				"-800":"设备尺寸太小",
				"-801":"不能识别分区格式",
				"-802":"存储设备上的ROFS版本高于当前程序支持版本",
				"-803":"分区尺寸改变",
				"-804":"分区头信息损坏",
				"-805":"缺少关键Slice",
				"-806":"Slice时间差过大",
				"-807":"Package时间长度大于时间段最大允许值",
				"-808":"磁盘空间不足",
				"-809":"磁盘设备参数异常",
				"-810":"Package数量为0",
				"-811":"无效的Package序列号",
				"-812":"没有与读mask匹配的Slice",
				"-813":"打开ROFS原始设备失败",
				"-814":"ROFS原始设备重复打开",
				"-815":"非法ROFS存储设备名",
				"-816":"只有未格式化或者停止态的磁盘才进行格式化/反格式化操作",
				"-817":"不存在的StgName",
				"-818":"缺少同步Slice",
				"-819":"ROFS设备未格式化",
				"-820":"ROFS设备录像中",
				"-821":"ROFS设备数据修复中",
				"-822":"ROFS设备未打开",
				"-823":"无法获取ROFS设备信息",
				"-824":"ROFS管理器已经初始化",
				"-825":"ROFS管理器未初始化",
				"-826":"ROFS固定区标识信息不匹配",
				"-827":"ROFS固定区标识信息太大",
				"-828":"ROFS Package内slice数太多",
				"-829":"数据包信息损坏",
				"-830":"数据信息不一致",
				"-831":"用户取消ROFS设备数据修复",
				"-832":"未处于修复状态",
				"-833":"不是ROFS主设备",
				"-834":"ROFS辅设备忙",
				"-835":"ROFS索引数据损坏",
				"-836":"ROFS时间段数据损坏",
				"-837":"ROFS设备未开始同步拷贝",
				"-838":"ROFS设备已经开始同步拷贝",
				"-839":"不是ROFS辅设备",
				"-840":"循环同步",
				"-841":"ROFS设备写失败",
				"-842":"ROFS设备读失败",
				"-843":"没有与查询时间匹配的Package",
				"-844":"没有与读条件时间匹配的Package索引",
				"-845":"创建元数据文件失败",
				"-846":"打开元数据文件失败",
				"-847":"元数据文件尺寸错误",
				"-848":"元数据文件内容错误",
				"-855":"重复配置ROFS原始设备",
				"-856":"ROFS2设备(StoreGroup)太小，无法格式化",
				"-857":"存在通道时，ROFS2不能格式化",
				"-858":"ROFS2基本头信息损坏",
				"-859":"ROFS2非法块数量",
				"-860":"ROFS2非法通道数量",
				"-861":"ROFS2块头信息损坏",
				"-862":"ROFS2通道头信息损坏",
				"-863":"ROFS2剩余空间不足",
				"-864":"ROFS2命名重复",
				"-865":"ROFS2没有可用块",
				"-866":"ROFS2未找到可删除的最旧数据块",
				"-867":"ROFS2非法块大小",
				"-868":"ROFS2构造组的磁盘路径不匹配",
				"-869":"ROFS2数据已经加锁",
				"-870":"ROFS2没有剩余可用空间，已经录像数据总时间没有满足设定值",
				"-871":"通道名称不存在！",
				"-872":"ROFS2块空间不足",
				"-873":"ROFS2 由于录像周期已到达或是空间不足，未发生写设备动作",
				"-874":"Player,ID 错误",
				"-875":"Player,缓冲区需要数据",
				"-876":"Player,缓冲区已满",
				"-877":"Player, input slice缓冲区回调函数没有设置",

				//系统错误
				"-10002":"系统调用失败",
				"-10003":"系统资源不足/被占用",
				"-10004":"内存不足",
				"-10005":"未分类异常",
				"-10006":"内部程序逻辑错误",
				"-10007":"外部程序逻辑错误",
				"-10008":"不支持的功能",
				"-10009":"功能未实现",
				"-10010":"系统/任务退出中，请求无法完成",
				"-10011":"服务端对象状态不支持，请求被拒绝",
				"-10012":"参数值或格式不正确",
				"-10013":"任务未完成",
				"-10014":"服务已经存在",
				"-10015":"服务不存在",
				"-10016":"会话已经存在",
				"-10017":"会话不存在",
				"-10018":"TCP服务端口已经被使用",
				"-10019":"网络对端关闭/或断线",
				"-10020":"会话被放弃",
				"-10021":"服务退出中",
				"-10022":"连接服务器/设备失败",
				"-10023":"未连接服务/设备",
				"-10024":"接收数据失败",
				"-10025":"发送数据失败",
				"-10026":"无法解析的请求",
				"-10027":"无法解析的应答",
				"-10028":"功能已经启动",
				"-10029":"功能未启动",
				"-10030":"系统忙，请求/调用被忽略",
				"-10031":"非法网络请求协议头",
				"-10032":"巨大网络请求数据，拒绝",
				"-10033":"动作已被请求",
				"-10034":"动作未被请求",
				"-10035":"服务连接中，稍后再试",
				"-10036":"当前上下文中，无效IP地址",
				"-10037":"请求端对象状态不支持，请求被拒绝",
				"-10038":"网络连接超时",
				"-10039":"资源使用中，不能卸载或删除",
				"-10040":"ISCM授权失败",
				"-10041":"对象已存在",
				"-10042":"对象不存在",
				"-10043":"会话处于并行调用模式，只支持并行posting型方法",
				"-10044":"会话处于并行回调模式，只支持并行posting型回调",
				"-10048":"消息队列满，投递消息失败",
				"-10049":"消息队列满，发送消息失败",
				"-10050":"接口未定义",
				"-10051":"对端方法不存在或不匹配，请检查网络两端接口版本是否一致",
				"-10052":"对端回调不存在或不匹配，请检查网络两端接口版本是否一致",
				"-10053":"回调未就绪，调用被忽略",
				"-10054":"绑定回调连接失败",
				"-10055":"方法匹配失败，请尝试调用其它方法集",
				"-10056":"ISCM回调未实现，请在派生类中重载实现",
				"-10057":"已经登录",
				"-10058":"未登录",
				"-10059":"ISCM客户端接口对象服务IPP无效",
				"-10060":"ISCM接口对象异步调用队列满",
				"-10061":"没有此用户",
				"-10062":"用户名或密码不正确",
				"-10063":"没有权限访问",
				"-10064":"异步调用缓存内存大小限制",
				"-10065":"会话未连接或正在关闭中",
				"-10100":"已在服务群组中",
				"-10101":"不在服务群组中",
				"-10102":"应用服务IPP冲突",
				"-10103":"启动服务进程失败",
				"-10104":"文件已存在",
				"-10105":"文件不存在",
				"-10106":"文件打开失败",
				"-10107":"文件读失败",
				"-10108":"文件写失败",
				"-10109":"禁止操作此文件/路径名（服务使用中，或未授权路径）",
				"-10110":"创建目录失败",
				"-10111":"订阅回调已发起",
				"-10112":"订阅回调未发起",
				"-10113":"无效ISCM远程任务库",
				"-10114":"无效ISCM远程任务函数",
				"-10115":"ISCM远程任务已存在",
				"-10116":"ISCM远程任务不存在",

				//播放SDK错误
				"-20000":"基本错误边界值",
				"-20001":"不支持",
				"-20002":"功能暂未实现",
				"-20003":"未初始化",
				"-20005":"内存不足",
				"-20004":"打开太多句柄，系统资源不足",
				"-20006":"无效句柄，可能已经关闭",
				"-20007":"无效对象名，没有这个对象",
				"-20008":"参数错误",
				"-20009":"没有文件",
				"-20010":"正在查找文件",
				"-20011":"查找文件时没有更多的文件",
				"-20012":"查找文件时异常",
				"-20013":"文件Url全路径错误",
				"-20014":"元素已存在ESIST",
				"-20015":"对象不存在",
				"-20016":"OSD叠加文本错误",
				"-20017":"OSD类型错误",
				"-20018":"OSD显示错误",
				"-20019":"获取默认端口错误",
				"-20020":"登录失败",
				"-20021":"没有更多查讯数据",
				"-20022":"设置密码错误",
				"-20023":"设置键值不存在",
				"-20024":"对应的键没有值",
				"-20025":"功能未实现",
				"-20026":"获得句柄错误",
				"-20027":"事件重复订阅",
				"-20028":"读到文件末尾",
				"-20029":"句柄不存在",
				"-20030":"对象指针为空",
				"-20031":"第一侦不是I侦",
				"-20032":"不支持的平台",
				"-20033":"缓冲区太小",
				"-20034":"不支持的服务器类型",

				"-21001":"ID 错误",
				"-21002":"播放缓冲区需要数据",
				"-21003":"播放缓冲区已满",
				"-21004":"输入多个slice方式下回调函数没有设置",
				"-21005":"错误的播放命令",
				"-21006":"错误的播放速度",
				"-21007":"实时播放时不能采用回调方式输入Slice数据",
				"-21008":"资源已经释放",
				"-21009":"播放线程已经停止",

				///DLL自定义错误码
				"-21100":"未播放",
				"-21101":"已播放",
				"-21102":"无录像",

				///22000以上为日志服务器错误代码
				"-22001":"未定义的错误类型",
				"-22002":"数据查询结果不正确",

				///OCX 自定定义错误码
				"-30001":"传入参数无效",
				"-30002":"要操作的窗口被占用",
				"-30003":"无可操作的视频",
				"-30004":"用户放弃操作",
				"-30005":"视屏不支持的操作",
				"-30006":"CPU使用率过高",
				"-30007":"内存使用率过高",
				"-30008":"当前播放模式不支持该功能"
			};
			return (!ErrorData[x] ? "未分类异常" : ErrorData[x]);
		}
	});
	window.VideoPlayer=VideoPlayer;
	return VideoPlayer;
});

