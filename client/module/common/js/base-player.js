define(['base.self'], function() {
	var NativePlayer = new Class({
		Implements: [Options, Events],
		options: {
			uiocx: '#UIOCX',
			layout: 1
		},
		initialize: function(options) {
			var self = this;
			this.setOptions(options);
            var ocxObj = self.options.uiocx;
            if(self.options.class){

                //图像研判特殊场景&&兼容chrome30特殊处理
                this.ocx = jQuery(self.options.uiocx).find(self.options.class)[0];
            }else{
                if(ocxObj && (typeof ocxObj === 'string')){

                    //处理火狐用$('#id')取不到object对象的问题
                    if(ocxObj.indexOf('#') === 0){
                        this.ocx = document.getElementById(ocxObj.slice(1));
                    }else{
                        this.ocx = jQuery(self.options.uiocx)[0];
                    }
                }
            }
            //开启OCX加密模式
//            self.ocx.EnableDES(true);

			self.bindEvents();
			self.setLayout(self.options.layout);
			/**
			 * 根据配置设置视频播放窗口的拉伸或者原始形态，by zhangyu on 2015/7/24
			 */
			this.ocx.SetRatio(window.ocxDefaultRatio, -1);
		},
		play: function(options, index, callback) {
			var json_str = JSON.stringify(options);
			var result = this.ocx.PlayEx2(json_str, index, function(res) {
				callback && callback(res);
			}, 0, function() {}, 0, function() {}, 0);
		},
		play2: function(options, index, pPlayStartCallBack, lPlayStartParam, pRecordEndCallBack, lRecordEndParam) {
			var json_str = JSON.stringify(options);
			var result = this.ocx.Play2(json_str, index, pPlayStartCallBack, lPlayStartParam, pRecordEndCallBack, lRecordEndParam);
			if(result === 0){
				return true;
			}else{
				notify.error("视频播放失败, 错误原因 : <br/>" + this.getErrorCode(result));
				return false;
			}
		},
		playPfs2: function(options, index, pPlayStartCallBack, lPlayStartParam, playCallBack, pRecordEndCallBack, lRecordEndParam) {
			options.type = 3;
			pPlayStartCallBack = pPlayStartCallBack !== undefined ? pPlayStartCallBack : function() {};
			/*lPlayStartParam = lPlayStartParam !== undefined ? lPlayStartParam : 1;
			pRecordEndCallBack = pRecordEndCallBack !== undefined ? pRecordEndCallBack : function() {};
			lRecordEndParam = lRecordEndParam !== undefined ? lRecordEndParam : 1;
			return this.play2(options, index, pPlayStartCallBack, lPlayStartParam, pRecordEndCallBack, lRecordEndParam);*/
			return this.ocx.PlayEx2(JSON.stringify(options), index, playCallBack, 0, pPlayStartCallBack, 0, pRecordEndCallBack, 0);
		},
		/**播放文件 */
		/*options格式：{"filename":"D:/test.mbf"}   index：窗口号*/
		playFile: function(options, index) {
			options.type = 0;
			return this.play(options, index);
		},
		/**播放实时流 */
		/*options格式：{"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1"}*/
		playStream: function(options, index) {
			options.type = 1;
			return this.play(options, index);
		},
		/**播放录像 */
		/*options格式：{"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1"}*/
		playRecord: function(options, index) {
			options.type = 2;
			return this.play(options, index);
		},
		/**播放pfs */
		/*options格式：{"filename":"NPFS:192.168.12.33:9000/username=admin&password=admin#/avi/人脸&车辆.mbf"}*/
		playPfs: function(options, index, callback) {
			options.type = 3;
			return this.play(options, index, callback);
		},
		/**恢复被暂停的视频，使其继续播放（只是针对文件、录像、pfs,因为只有这3种类型是有暂停功能的） */
		resumePlay: function(index) {
			options = "";
			return this.play(options, index);
		},
		/**停止播放（针对实时流、文件、录像、pfs）*/
		stop: function(index) {
			var result = this.ocx.Stop(false, index);
			return result === 0 ? true : false;
		},
		/**暂停播放（针对文件、录像、pfs）*/
		pause: function(index) {
			var result = this.ocx.Stop(true, index);
			return result === 0 ? true : false;
		},
		/**获取视频属性值*/
		//返回值：{"videoType":0,"width":704,"height":480,"frameRate":0,"duration":0,"totalframes":0,"videoCodec":0,"audioCodec":0}  错误返回"ERROR"
		getVideoInfo: function(index) {
			var str = this.ocx.GetVideoAttribute(index);
			if (str === "ERROR") {
				return "ERROR";
			} else {
				return JSON.parse(str);
			}
		},
		/**设置速度 （对实时流无效）*/
		setPlaySpeed: function(speed, index) { //speed:-2（单帧） -1（X2慢）、0（正常）、1（X2快）
			var result = this.ocx.SetPlayMode(0, speed, index);
			return result === 0 ? true : false;
		},
		/**正反播放（对实时流无效）*/
		reversePlay: function(type, index) { // type:0（倒放）、1（正放）
			var result = this.ocx.SetPlayMode(1, type, index);
			return result === 0 ? true : false;
		},
		/**从指定时间开始播放（对实时流无效）如果在暂停时使用,将在恢复播放时起作用*/
		playByTime: function(time, index) { // time:  单位ms
			var result = this.ocx.SetPlayMode(2, time, index);
			return result === 0 ? true : false;
		},
		/**从指定帧开始播放（对实时流无效）*/
		playByFrame: function(frame, index) { // frame: 帧
			var result = this.ocx.SetPlayMode(3, frame, index);
			return result === 0 ? true : false;
		},
		/**从指定百分比开始播放（对实时流无效）*/
		playByPercentage: function(percent, index) { // percent: 百分比
			var result = this.ocx.SetPlayMode(4, frame, index);
			return result === 0 ? true : false;
		},
		/**获取播放方式（对实时流无效）*/
		//正确返回当前播放速度,错误返回"ERROR"
		getPlaySpeed: function(index) {
			index = index || 0;
			return this.ocx.GetPlayMode(index); //index:窗口索引(整形)
			//return result.replace("1/","-");
		},
		/**获取当前播放时间（在Play成功后调用，对录像、文件和pfs有效）*/
		getPlayTime: function(index) {
			var result = this.ocx.GetPlayTime(index); //index:窗口索引(整形)  返回值：单位：毫秒，非负数
			return result >= 0 ? result : false;
		},
		/**截图(抓拍的命名格式为路径：对象名_当前系统时间.jpg)*/
		printScreen: function(index) {
			var result = this.ocx.CapturePicture(index); //index:窗口索引(整形)
			return result === 0 ? true : false;
		},
		/**设置画面参数调节（亮度、对比度、饱和度、色调）*/
		//jsonObj参数，JSON格式的字符串，（亮度、对比度、饱和度、色调）参数范围统一为【-127，127】Json格式：{"bright":100,"contrast":100,"saturation":100,"hue":100}
		//index参数：窗口索引(整形)
		setColor: function(jsonObj, index) {
			var str = JSON.stringify(jsonObj);
			var result = this.ocx.SetColorAttribute(str, index);
			return result === 0 ? true : false;
		},
		/**获取画面参数 */
		//正确返回JSON格式的画面参数，错误返回"ERROR" Json格式：{"bright":100,"contrast":100,"saturation":100,"hue":100}
		getColor: function(index) {
			if (this.ocx.GetColorAttribute(index) === "ERROR") {
				return "ERROR";
			} else {
				return JSON.parse(this.ocx.GetColorAttribute(index)); //index:窗口索引(整形)
			}
		},
		/**设置字符叠加类型和信息组成的字符串  类型：0 文本，1直线，2放大矩形区域*/
		setInfo: function(options, index) {
			var json_str = JSON.stringify(options);
			var result = this.ocx.SetOSD(json_str, index);
			return result === 0 ? true : false;
		},
		/**设置字符叠加信息:文本 */
		//options:文本：{"type":0,"x":0.1,"y":0.1, "text":"内容", "font":"宋体", "autocolor":0, "textcolor":255,"backcolor":200," fontsize":9.8,"algin":1}
		//叠加类型  x位置 y位置  叠加的内容       字体         自动绘色1是0否     文字颜色       文字背景色       字的大小尺寸    对齐方式1左2右
		//autocolor为0时，textcolor才会生效
		setInfoText: function(options, index) { //index:窗口索引(整形)
			options.type = 0;
			return this.setInfo(options, index);
		},
		/**设置字符叠加信息:直线 */
		//options:线段{"type":1,"x1":0.1,"y1":0.1,"x2":0.5,"y2":0.5,"width":1,"color":255}
		//叠加类型 起点x  起点y  终点x   终点y   线宽        颜色
		setInfoLine: function(options, index) { //index:窗口索引(整形)
			options.type = 1;
			return this.setInfo(options, index);
		},
		/**设置字符叠加信息:放大矩形区域 */
		//options:放大矩形{"type":2,"x":0.1,"y":0.1,"w":0.5,"h":0.6,"width":1,"color":80,"fillcolor":0}
		//叠加类型 x位置  y位置  框之宽   框之高   线宽     线的颜色    框内填充的颜色OSD的颜色范围：0-255包含了各种颜色
		setInfoRect: function(options, index) { //index:窗口索引(整形)
			options.type = 2;
			return this.setInfo(options, index);
		},
		/**获取字符叠加信息*/
		//正确返回JSON格式的字符叠加的类型和信息，错误返回"ERROR"
		getOsdInfo: function(index) { //index:窗口索引(整形)
			if (this.ocx.GetOSD(index) === "ERROR") {
				return "ERROR";
			} else {
				return JSON.parse(this.ocx.GetOSD(index));
			}
		},
		/**音频开启\关闭*/
		//enable:true表示开启声音，false表示关闭声音  index:窗口索引(整形)
		toggleSound: function(enable, index) {
			if (enable) enable = true;
			else enable = false;
			var result = this.ocx.SoundEnable(enable, index);
			return result === 0 ? true : false;
		},
		/**获取当前音频的状态*/
		//开启返回true，未开启返回false，错误返回"ERROR"
		isSoundEnable: function(index) {
			var result = this.ocx.IsSoundEnable(index);
			return result >= 0 ? (result === 0 ? false : true) : "ERROR";
		},
		/**云台控制*/
		//cmd:命令码请参考NPCOREPTZCommand,
		//param:控制参数，范围[-15,15]与cmd配合使用，云台的每一个动作都要调用该接口两次配合使用，云台的每一个动作都要调用该接口两次,此参数一次为非0,一次为0，其他两个参数一样
		//index:窗口索引(整形)
		ptzControl: function(cmd, param, index) {
			var result = this.ocx.PtzControl(cmd, param, index);
			return result === 0 ? true : false;
		},
		/**云台控制锁定*/
		//LockTime:输入，云台锁定时间单位为S,0解锁  index:窗口索引(整形)
		ptzLock: function(LockTime, index) {
			var result = this.ocx.PtzLock(LockTime, index);
			return result === 0 ? true : false;
		},
		/**流速统计*/
		//返回字符串，正确返回base64编码的图片信息，错误返回"ERROR"
		getStreamMonitor: function(index) {
			return this.ocx.GetTransferSpeed(index); //index:窗口索引(整形)
		},
		/**获取图片信息*/
		//字符串，正确返回base64编码的图片信息，错误返回"ERROR"
		getPicInfo: function(index) {
			return this.ocx.GetPicInfo(index); //index:窗口索引(整形)
		},
		/**播放暂停开关，如果是播放状态则暂停，如果是暂停状态则播放,(实时流无效)*/
		togglePlay: function(index) {
			return this.ocx.TogglePlay(index); //index参数：窗口索引
		},
		/**恢复流播放*/
		resumePlayEX: function(index) {
			return this.ocx.PlayEx2("", index, function(){}, 0, function(){}, 0, function(){}, 0); //index参数：窗口索引
		},
		/**设置分屏布局(参数layout,目前只能是1,4,9,16,41  41:4行1列)*/
		setLayout: function(layout) {
			this.ocx.SetLayout(layout);
		},
		/**获取目前布局的编号*/
		//返回值：整型，布局编号，1:1x1     4:2x2     9:3x3       16:4x4    41:4x1
		getLayout: function() {
			return this.ocx.GetLayout();
		},
		/**获取目前窗口数量*/
		getWindowCount: function() {
			return this.ocx.GetWindowCount();
		},
		/**检查指定的窗口是否有焦点*/
		//有焦点返回true，无焦点返回false
		isFocusWindow: function(index) {
			return this.ocx.IsFocusWindow(index); //index参数：窗口索引
		},
		/**获取有焦点窗口的序号*/
		//非负数：窗口序号，0起始 负数：错误码
		getFocusWindow: function() {
			return this.ocx.GetFocusWindowIndex();
		},
		/**把指定窗口设置为焦点窗口*/
		setFocusWindow: function(index) {
			this.ocx.SetFocusWindow(index); //index参数：窗口索引
		},
		/**把指定窗口设置为正常大小*/
		//返回值:true为成功 false为失败
		setWindowRestore: function(index) {
			return this.ocx.SetWindowRestore(index); //index参数：窗口索引
		},
		/**把指定窗口设置为最大化（就是占满控件），或取消最大化*/
		//返回值：true为成功 false为失败
		toggleWindowMaximize: function(index) {
			return this.ocx.SetWindowMaximize(index); //index参数：窗口索引
		},
		/**刷新图像窗口*/
		refreshWindow: function(index) {
			this.ocx.RefreshVideoWindow(index); //index参数：窗口索引
		},
		/**把控件设置为全屏*/
		displayFullScreen: function() {
			this.ocx.SetControlFullScreen();
		},
		/**取消控件全屏*/
		cancelFullScreen: function() {
			this.ocx.RestoreControlScreenShow();
		},
		/**检查控件是否全屏*/
		isFullScreen: function() {
			return this.ocx.IsControlFullScreen();
		},
		/**检查是否有最大化窗口*/
		isHaveMaxWindow: function() {
			var result = this.ocx.IsHaveMaximizeWindow();
			return result >= 0 ? (result === 0 ? false : true) : "ERROR";
		},
		/**获取窗口的矩形*/
		//正确返回：JSON字符串表示的窗口矩形{"Left":400,"Top":100,"Width":100,"Height":100} 错误返回：”ERROR”
		getVideoRectByIndex: function(index) {
			if (this.ocx.GetVideoRectByIndex(index) === "ERROR") {
				return "ERROR";
			} else {
				return JSON.parse(this.ocx.GetVideoRectByIndex(index)); //index参数：窗口索引
			}
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
            var base64 = this.ocx.CatchScaleDownPictureEx2(index,3,width,height);//1:BMP  2:GIF  3:JPG 4:PNG  由于JPG速度最快  实战默认选用3
            if (index!=='ERROR') {
                this.grabIndex = index;
                base64.replace(/[\n\r]/ig, '');
            }
            return base64;
        },
		/**开关指定窗口的云台控制功能(默认是关闭的)*/
		//bEnable:1表示打开，0表示关闭  index:窗口索引
		switchPTZ: function(bEnable, index) {
			if (bEnable) bEnable = 1;
			else bEnable = 0;
			this.ocx.SetWindowPTZByIndex(bEnable, index);
		},
		/**设置窗口云台的速度(默认是最大速度15)*/
		//ptzspeed:窗口云台速度 [0~15]   index:窗口索引   返回值true为成功 false为失败
		setPtzSpeed: function(ptzspeed, index) {
			return this.ocx.SetWndPtzSpeed(ptzspeed, index);
		},
		/**设置云台控制时红色箭头显示的范围。云台范围有默认值，web也可以通过此接口调整。mode: 像素为单位/百分比为单位*/
		//返回值 true为成功 false为失败
		setPTZRange: function(mode, top_bottom, left_right) {
			return this.ocx.SetPTZRange(mode, top_bottom, left_right);
		},
		//mode: 0:像素为单位(像素有效值>0)  top_bottom:到窗口顶部和底部的距离(整数)  left_right:到窗口左边和右边的距离(整数)
		setPTZRangePixel: function(mode, top_bottom, left_right) {
			return this.setPTZRange(mode, top_bottom, left_right);
		},
		//1:百分比为单位(百分比有效值 1-49)  top_bottom:到窗口顶部和底部的距离(整数)  left_right:到窗口左边和右边的距离(整数)
		setPTZRangePercent: function(mode, top_bottom, left_right) {
			return this.setPTZRange(mode, top_bottom, left_right);
		},
		/**设置画面显示的宽高比*/
		//type:1、2、3、4、5分别代表设置原始、拉伸、4:3、16:9、16:10   index:窗口索引
		setRatio: function(type, index) {
			this.ocx.SetRatio(type, index);
		},
		setRatioDefault: function(index) { //设置原始值
			this.setRatio(1, index);
		},
		setRatioStretch: function(index) { //拉伸
			this.setRatio(2, index);
		},
		setRatioFratioT: function(index) { //4:3
			this.setRatio(3, index);
		},
		setRatioSxratioN: function(index) { //16:9
			this.setRatio(4, index);
		},
		setRatioSxratioT: function(index) { //16:10
			this.setRatio(5, index);
		},
		/**获取画面比例的编号*/
		//画面比例编号：1、2、3、4、5分别代表设置原始、拉伸、4:3、16:9、16:10
		getRatio: function(index) {
			return this.ocx.GetRatioCode(index); //index参数：窗口索引
		},
		/**让画面显示“视频丢失”等的提示图片*/
		setStyle: function(type, index) {
			this.ocx.SetStreamLostByIndex(type, index);
		},
		//显示类型： 0 正常
		setStyleNormal: function(index) {
			this.setStyle(0, index);
		},
		//显示类型：1 视频丢失
		setStyleLose: function(index) {
			this.setStyle(1, index);
		},
		//显示类型： 2 离线
		setStyleOffline: function(index) {
			this.setStyle(2, index);
		},
		/**打开数字放大模式*/
		//返回 true为成功 false为失败   type:当前窗口放大0，其他窗口放大1
		digitalZoom: function(type, index) {
			return this.ocx.StartZoomByIndex(type, index);
		},
		//当前窗口放大    返回 true为成功 false为失败
		digitalZoomCur: function(index) {
			return this.digitalZoom(0, index); //index参数：窗口索引
		},
		//其他窗口放大    返回 true为成功 false为失败
		digitalZoomElse: function(index) {
			return this.digitalZoom(1, index); //index参数：窗口索引
		},
		/**关闭数字放大模式*/
		//返回 true为成功 false为失败
		stopZoom: function(index) {
			return this.ocx.StopZoomByIndex(index); //index参数：窗口索引
		},
		/**关闭指定数字放大流窗口*/
		//返回 true为成功 false为失败
		stopZoomStream: function(indx) {
			return this.ocx.StopZoomStream(indx); //index参数：窗口索引
		},
		/**放大OSD框的属性设置(只对设置属性后新增加或者有改变的框有作用)*/
		//color:放大OSD框的颜色【0-255】,默认255 红色; lineWidth:放大OSD框的线宽,默认1(预留); 
		//fillColor:放大OSD框的填充颜色,默认0xFFFFFFFF不填充(预留); index:窗口索引
		//返回 true为成功 false为失败
		setWndOsdProperty: function(color, lineWidth, fillColor, index) {
			return this.ocx.SetWndOsdProperty(color, lineWidth, fillColor, index);
		},
		/**视图库抓图，播放开始后调用*/
		//返回值：成功返回：base64编码的图片信息 失败返回：”ERROR”
		playerSnap: function(index) {
			return this.ocx.PlayerSnap(index) //index参数：窗口索引
		},
		/**播放指定时间范围内的视频（播放开始后调用，只对文件、PFS有效）用于视图库*/
		//start:播放的开始位置，（时间是相对于视频开头的，整数 单位：毫秒）
		//end:播放的结束位置，（时间是相对于视频开头的，整数 单位：毫秒）
		//repeat:true：循环播放，false：一次播放  index:窗口索引
		playFormStartToEnd: function(start, end, repeat, index) {
			return this.ocx.PlayFormStartToEnd(start, end, repeat, index);
		},
		//pPlayRangeEndCallBack:JS的function函数
		//lRecordEndParam:pPlayRangeEndCB
		playFormStartToEnd2: function(start, end, repeat, index, pPlayRangeEndCallBack, lRecordEndParam) {
			pPlayRangeEndCallBack = pPlayRangeEndCallBack !== undefined ? pPlayRangeEndCallBack : function() {};
			lRecordEndParam = lRecordEndParam !== undefined ? lRecordEndParam : 1;
			var result = this.ocx.PlayFormStartToEnd2(start, end, repeat, index,  pPlayRangeEndCallBack, lRecordEndParam);
			if(result === 0){
				return true;
			}else{
				notify.error("指定播放视频片段失败！");
				return false;
			}
		},

		/**获取指定的通道的忙闲状态*/
		//返回 true为成功 false为失败
		isBusy: function(index) {
			return this.ocx.GetWindowBusyByIndex(index);
		},
		/**获取ocx版本信息*/
		getVersion: function() {
			return this.ocx.GetVersion();
		},
		/**编辑多边形、箭头线、框等*/
		//返回值true为成功 false为失败
		/**参数说明
			type = 1，创建一个多边形
			type = -2，删除所有的多边形
			type = 2，创建一个箭头线
			type = -4 删除所有的箭头线
			type = 3，创建一个框
			type = -6，删除所有的框
			创建时，调用一次接口，只能创建一个对象
			index 窗口索引*/
		polygonEdit: function(type, index) {
			return this.ocx.PolygonEdit(type, index);
		},
		//创建一个多边形
		polygonSet: function(index) {
			return this.polygonEdit(1, index);
		},
		//删除所有多边形
		polygonDelAll: function(index) {
			return this.polygonEdit(-2, index);
		},
		//创建一个箭头线
		arrowsPathSet: function(index) {
			return this.polygonEdit(2, index);
		},
		//删除所有箭头线
		arrowsPathDelAll: function(index) {
			return this.polygonEdit(-4, index);
		},
		//创建一个框
		rectSet: function(index) {
			return this.polygonEdit(3, index);
		},
		//删除所有的框
		rectDelAll: function(index) {
			return this.polygonEdit(-6, index);
		},
		/**关闭数字放大模式*/
		/**参数说明 strText字符串 箭头线的标号，eg“区域0” index窗口索引 */
		//返回值 0为成功 负数为错误码  （转为true为成功，false为失败）
		deleteOArray: function(strText, index) {
			return this.ocx.DeleteOArray(strText, index) === 0 ? true : false;
		},
		/**录像下载，仅下载不播放 0为成功 负数为错误码*/
		/**参数说明：strRecdPath:JSON格式的字符串 录像信息 类型(数字)、用户名、密码、PVG服务器的IP或者DNS、端口号、Av对象名、
		录像类型(数字)（0为服务器录像, 非0为录像所在的层数,最大值为256, 建议0-15）、开始时间（"2012-01-01 13:20:00.000"或 "20120101132000000"）、
		结束时间（"2012-01-01 13:20:00.000"或 "20120101132000000"），
		eg：{"type":2,"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1","vodType":1,"beginTime":"20120101132000000","endTime":"20120101152000000"}
		字符串 strFileName：下载文件绝对路径名（预留参数，可为""）目前是弹框，由用户选择路径名称*/
		downLoadRecd: function(strRecdPath, strFileName) {
			var result = this.ocx.DownLoadRecd(strRecdPath, strFileName);
			return result === 0 ? true : false;
		},
		/**布防布控图像创建*/
		/**参数说明：图像信息
		 {名称，坐标，颜色}
		 颜色BGR各8位组成的整数
		 1、单线单箭头（点3为箭头，应在12的中垂线上）
		 "{'singlearrowline',{(0.7,0.1),(0.3,0.1),(0.5,0.2)}, '255' }"
		 2、双线单箭头（点3为箭头，应在12的中垂线上）
		 "{'doublelineonearrow',{(0.2,0.6),(0.6,0.6),(0.4,0.5),(0.3,0.1),(0.5,0.2)},'255'}"
		 3、矩形
		 "{'rectangle',{(0.3,0.35),(0.4,0.35),(0.35,0.35),(0.55,0.63)},\'255\' }"
		 4、多边形
		 "{'polygon',{(0.43,0.1),(0.5,0.15),(0.25,0.9),(0.7,0.3),(0.64,0.57)},\'255\'}"
		 5、单线双箭头（点3、4为箭头，应在12的中垂线上）
		 "{'onelinedoublearrow',{(0.2,0.2),(0.8,0.8),(0.4,0.6),(0.6,0.4)},'255'}"
		 返回值：0为成功 负数为错误码*/
		createImage: function(imageInfo, index) {
			var result = this.ocx.CreateImage(imageInfo, index);
			return result === 0 ? true : false;
		},
		/**关闭CreateImage创建的所有图像*/
		/**0为成功 负数为错误码 index窗口索引*/
		releaseAllImage: function(index) {
			var result = this.ocx.ReleaseAllImage(index);
			return result === 0 ? true : false;
		},
		/**事件绑定*/
		bindEvents: function() {
			function addEvent(obj, name, func) {
				if(obj.addEventListener){
					obj.addEventListener(name, func, false);
				}else{
					obj.attachEvent("on" + name, func);
				}
			};
			var self = this;
			var listenOCX = function() {
				//监听通道单击事件
				//index:窗口序号; xPoint:点击位置的x坐标。相对于窗口左上角; yPoint:点击位置的y坐标。相对于窗口左上角
				addEvent(self.ocx,'OnWndClick',function(index, xPoint, yPoint){
					self.fireEvent('OCXCLICK', index);
				});
				//窗口被双击(由控件直接实现双击最大化的切换，仅进行双击通知)
				addEvent(self.ocx,'OnWndDClik',function(index, xPoint, yPoint){
					self.fireEvent('OCXDCLICK', index);
				});
				//焦点改变时通知 oldIndex:失去焦点的窗口序号  newIndex:得到焦点的窗口序号
				addEvent(self.ocx,'OnFocusChange',function(oldIndex, newIndex){
				});
				//发生了窗口交换  srcIndex:切换前的窗口序号   desIndex:切换后的窗口序号
				addEvent(self.ocx,'OnSwitchWindow',function(srcIndex, desIndex){
				});
				//鼠标移动到窗口矩形中
				addEvent(self.ocx,'OnMouseMoveWindow',function(index, xPoint, yPoint){
					self.fireEvent('OCXMOUSEMOVE', {
						index: index,
						xPoint: xPoint,
						yPoint: yPoint
					});
				});
				//鼠标离开控件
				addEvent(self.ocx,'OnMouseLeaveControl',function(index){
					self.fireEvent('LEAVEOCX', {
						index: index
					});
				});
				//布局发生改变   oldCount:改变前的画面数量   newCount:改变后的画面数量
				addEvent(self.ocx,'OnMouseLeaveControl',function(srcIndex, desIndex){
					
				});
				addEvent(self.ocx,'OnMouseLeaveControl',function(srcIndex, desIndex){
					
				});
				//进入控件全屏
				addEvent(self.ocx,'OnExitFullScreen',function(){
					self.fireEvent('OCXCANCELFULL');
				});
				//退出控件全屏
				jQuery(document).keydown(function(e) {
					if (e.which === 27) {
						if (self.isFullScreen()) {
							self.cancelFullScreen();
						}
					}
				});
			};
			listenOCX();
		},
		getErrorCode:function(x){
			var ErrorData={
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
			return ErrorData[x];
		}
	});
	return NativePlayer;
});