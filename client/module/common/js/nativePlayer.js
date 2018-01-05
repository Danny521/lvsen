define(['base.self'], function() {
	/**
	 * Created by Mayue on 2014/4/28.
	 */
	var NativePlayer = new Class({
		Implements: [Options, Events],
		options: {
			uiocx: '#UIOCX',
			layout: 1
		},
		initialize: function(options) {
			var self = this;
			this.setOptions(options);
			this.ocx = jQuery(self.options.uiocx)[0];
			if (navigator.userAgent.toLowerCase().search(/(msie\s|trident.*rv:)([\w.]+)/) !== -1) {
				self.bindEvents();
			}
			self.setLayout(self.options.layout);
			/**
			 * 根据配置设置视频播放窗口的拉伸或者原始形态，by zhangyu on 2015/7/24
			 */
			this.ocx.SetRatio(window.ocxDefaultRatio, -1);
		},
		play: function(options, index) {
			var json_str = JSON.stringify(options);
			var result = this.ocx.Play(json_str, index);
			return result === 0 ? true : false;
		},
		play2: function(options, index, pPlayStartCallBack, lPlayStartParam, pRecordEndCallBack, lRecordEndParam) {
			var json_str = JSON.stringify(options);
			var result = this.ocx.Play2(json_str, index, pPlayStartCallBack, lPlayStartParam, pRecordEndCallBack, lRecordEndParam);
			return result === 0 ? true : false;
		},
		playPfs2: function(options, index, pPlayStartCallBack, lPlayStartParam, pRecordEndCallBack, lRecordEndParam) {
			options.type = 3;
			pPlayStartCallBack = pPlayStartCallBack !== undefined ? pPlayStartCallBack : function() {};
			lPlayStartParam = lPlayStartParam !== undefined ? lPlayStartParam : 1;
			pRecordEndCallBack = pRecordEndCallBack !== undefined ? pRecordEndCallBack : function() {};
			lRecordEndParam = lRecordEndParam !== undefined ? lRecordEndParam : 1;
			return this.play2(options, index, pPlayStartCallBack, lPlayStartParam, pRecordEndCallBack, lRecordEndParam);
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
		playPfs: function(options, index) {
			options.type = 3;
			return this.play(options, index);
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
			var self = this;
			var listenOCX = function() {
				//监听通道单击事件
				//index:窗口序号; xPoint:点击位置的x坐标。相对于窗口左上角; yPoint:点击位置的y坐标。相对于窗口左上角
				function self.ocx::OnWndClick(index, xPoint, yPoint) {
					self.fireEvent('OCXCLICK', index);
				};
				//窗口被双击(由控件直接实现双击最大化的切换，仅进行双击通知)
				function self.ocx::OnWndDClik(index, xPoint, yPoint) {
					self.fireEvent('OCXDCLICK', index);
				};
				//焦点改变时通知 oldIndex:失去焦点的窗口序号  newIndex:得到焦点的窗口序号
				function self.ocx::OnFocusChange(oldIndex, newIndex) {
					//TODO
				};
				//发生了窗口交换  srcIndex:切换前的窗口序号   desIndex:切换后的窗口序号
				function self.ocx::OnSwitchWindow(srcIndex, desIndex) {
					//TODO
				};
				//鼠标移动到窗口矩形中
				function self.ocx::OnMouseMoveWindow(index, xPoint, yPoint) {
					//TODO
					//if(window.console)
					//console.log("OnMouseMoveWindow in window "+index+" on point x: "+xPoint+"y: "+yPoint);
					self.fireEvent('OCXMOUSEMOVE', {
						index: index,
						xPoint: xPoint,
						yPoint: yPoint
					});
				};
				//鼠标离开控件
				function self.ocx::OnMouseLeaveControl(index) {
					self.fireEvent('LEAVEOCX', {
						index: index
					});
				};
				//布局发生改变   oldCount:改变前的画面数量   newCount:改变后的画面数量
				function self.ocx::OnLayoutChange(oldCount, newCount) {
					//TODO
				};
				//进入控件全屏
				function self.ocx::OnFullScreen() {
					self.fireEvent('OCXFULLSCR');
				};
				//退出控件全屏
				function self.ocx::OnExitFullScreen() {
					self.fireEvent('OCXCANCELFULL');
				};
				jQuery(document).keydown(function(e) {
					if (e.which === 27) {
						if (self.isFullScreen()) {
							self.cancelFullScreen();
						}
					}
				});
			};
			listenOCX();
		}
	});
	return NativePlayer;
});