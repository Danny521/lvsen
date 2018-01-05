/*
* @Author: Administrator
* @Date:   2015-04-14 16:48:36
* @Last Modified by:   Administrator
* @Last Modified time: 2015-05-13 10:16:47
*/

/*global cruiseCache:true*/
/*
var cameraCache = new Hash();//为每个打开的视频,保留对应的云台参数.

var Camera = new Class({
	cameraId: null,
	cameraNo: null,
	cameraType: null,
	presets: '',
	presetsMap: new Hash(),
	autoCruise: '',
	timeCruise: '',
	cruisetype: 0,
	// 巡航分类	0自动巡航	1时间段巡航
	status: 0,
	// 巡航状态	0没开启	1开启	2等待
	sortNo: 0,//预置位列表sortNo最大 + 1, 是下次添加预置位的序号,预置位是通过序号排序的.
	scan: 1,
	// 云台自动扫描 1初始未扫描 2扫描状态
	lockStatus: 0, //0未锁 1锁定
	monopolyStatus: 1, //1未独占 0独占
	wipe: 0,
	// 云台雨刷 0初始化 关  1开启
	light: 0
	// 云台灯光 0初始化 关  1开启
});
*/
//,'/module/ptz-controller/js/ptz.js'
	 /*gPtz.setParams({//聚焦,设置当前通道的摄像机参数
		cameraId: 6,
		cameraNo: "av/nvr/50101024",
		cameraType: 1
});*/


define(['/module/common/popLayer/js/popImg.js','jquery-ui',"/module/ptz-controller/ptzctrl/js/gptz-core.js"], function(POPIMG) {
	/**
	 * 显示云台控制面板
	 */
	window.showHidedPtzPanel = function() {
		PtzController.player.playerObj.SetWebDialog(PtzController.player.PtzDialog, JSON.stringify({
			"show": true //true为显示，false为隐藏
		}));
	};

	require(["pubsub"], function(PubSub) {
		/**
		 * 录像上墙后，电视墙面板关闭时，需要显示录像查询结果框
		 * add by zhangyu on 2015/11/20
		 */
		PubSub.subscribe("showPtzPanel", function() {
			try {
				window.showHidedPtzPanel();
			} catch (e) {}
		});
	});

	var _PtzController=function(){
		var self =  this;
		this.criuse = null;
		this.player = null;
		/**
		 * [JudgeinCruise 判断预置位是否在巡航列表里 0-不存在；1-在巡航列表中，2-正在巡航中]
		 * @author huzc
		 * @date   2015-04-27
		 * @param  {[type]}   id [description]
		 * @param  {Function} fn [description]
		 */
		this.JudgeinCruise=function(id,fn){
			jQuery.ajax({
				url:"/service/ptz/has/preset/"+id,
				type:"get",
				dataType:"json",
				cache:false,
				data:{},
				success:function(res){
					if(res.code==200){
						fn&&fn(res.data); //inCruise
					}
				}
			});
		};
		/**
		 * [showPreset 提取预置位信息显示]
		 * @author huzc
		 * @date   2015-04-27
		 * @param  {[type]}   cameraId [description]
		 * @return {[type]}            [description]
		 */
		this.showPreset=function(cameraId){
			jQuery.ajax({
				url:"/service/ptz/get_presets",
				type:"get",
				cache:false,
				data:{
					cameraId:cameraId
				},
				success:function(res){
					if(res.code==200){
						 var presetList=jQuery(".win-dialog.ptz-control .win-dialog-body .preset-content .preset-list");
						 var presets=res.data.presets;
						 var L=presets.length;
						 var html="";
						 for(var i=0;i<=L-1;i++){
						 	var str=[
								"<li data-id='"+presets[i].id+
								"' data-name='"+presets[i].name+
								"' data-imageUrl='"+presets[i].imageUrl+
								"' data-sortNo='"+presets[i].sortNo+
								"' data-cameraId='"+presets[i].cameraId+
								"' data-stopTime='"+presets[i].stopTime+
								"' data-presetNo='"+presets[i].presetNo+"'>",
									"<span class='preset-index num'>"+presets[i].id+"</span>",
									"<span class='preset-img'><img src='/service/pfsstorage/image?filePath="+presets[i].imageUrl+"'/></span>",
									"<span class='preset-name'>"+presets[i].name+"</span>",
									"<span class='preset-use'></span>",
									"<span class='preset-delete'></span>",
								"</li>"
						 	].join("");
						 	html=html+str;
						 }
						 presetList.html(html);
					}
				}
			});
		};

		this.bindEvent=function(){
			//云台速度控制初始化
			jQuery('.win-dialog.ptz-control .ptz-speed .speedSlider').slider({
				range: 'min',
				step: 1,
				max: 15,
				min: 1,
				value: 3,
				change: function() {
					var speed = jQuery(this).slider('value');
					var focusChannel = gVideoPlayer.getFocusWindow();
					var result = gVideoPlayer.setPtzSpeed(speed, focusChannel);
					gVideoPlayer.cameraData[focusChannel].ptzSpeed = speed;//将每个通道的云台速度保存,用于键盘操作
				}
			});
		};

		this.setParams=function(data,index){
			var player=gVideoPlayer;
			var cameraId = player.cameraData[index].cId;
			if (player.cameraData[index].path) {
				var cameraNo1 = player.cameraData[index].path;
			}
			if (player.cameraData[index].playingChannel) {
				var cameraNo2 = player.cameraData[index].playingChannel.path;
			}
			if (player.cameraData[index].history) {
				var cameraNo3 = player.cameraData[index].history.path;
			}
			var cameraNo = cameraNo1 || cameraNo2 || cameraNo3;
			var cameraType = player.cameraData[index].cType;

			gPtz.setParams({
				cameraId: cameraId,
				cameraNo: cameraNo,
				cameraType: cameraType
			});
		};

		//弹出云台控制对话框
		this.showDialog=function(obj,pobj) {
			var self = this;
			var index = pobj.index;
			var data = pobj.data;
			var player = self.player = pobj.player;
			self.setParams(data, index);
			self.showWebDialog(obj, pobj);
		};
		this.winclose = function(player) {
			/*var L = player.playerObj.GetLayout();
			for (var i = 0; i <= L - 1; i++) {
				var cd = player.cameraData[i];
				if (typeof(cd) == "object") {
					var hd = player.cameraData[i].PtzController;
					if (hd > 0) {
						player.playerObj.CloseWebDialog(hd);
					}
				}
			}*/
			if (player.PtzDialog > 0) {
				player.playerObj.CloseWebDialog(player.PtzDialog);
			}
		};

		/**
		 * 给云台控制窗口注入新数据
		 * @Author zhangyu
		 * @Date   2015-10-19T15:29:50+0800
		 * @param  {[type]}                 pobj [description]
		 * @param  {[type]}                 N    [description]
		 * @return {[type]}                      [description]
		 */
		this.importDataToDialog = function(pobj, N) {
			pobj.data.index = pobj.index;
			pobj.data.klass = window.permission.klass;
			pobj.data.ptzSp = Toolkit.getPtzSpeed();
			var importData = JSON.stringify(pobj.data);
			self.player.playerObj.ExeScript(N, "importData", importData);
		};
		/**
		 * 相应ocx的焦点切换事件，以便进行云台面板共享
		 * @Author zhangyu
		 * @Date   2015-10-19T16:42:02+0800
		 * @param  {[type]}                 index [description]
		 * @return {[type]}                       [description]
		 */
		this.onFocusChange = function(index) {
			var self = this;
			//第一步：判断ocx对象是否存在，不存在时表示云台面板没有打开
			if (!self.player || !self.player.cameraData || !self.player.PtzDialog) {
				return;
			}
			//第二步：判断当前焦点屏的数据是否为空，为空时表示该屏上没有流，不需要进行控制
			var focusData = self.player.cameraData[index];
			if (!focusData || focusData === -1) {
				return;
			}
			//第三步：判读是否是云台,不是则不需要控制
			if (!focusData.cType) {
				return;
			}
			//第四步，判断所选屏是否在轮巡，如果是则不重新注入数据
			if (window.inspect && window.inspect.getUnlockChannels().indexOf(parseInt(index)) >= 0) {
				return;
			}
			//记录当前焦点索引，关键代码
			self.player.DialogIndex = index;
			//进行云台控制
			self.importDataToDialog({
				index: index,
				data: focusData,
				player: self.player
			}, self.player.PtzDialog);
		};

		this.showWebDialog=function(obj, pobj){
			var self = this;
			var index=pobj.index;
			var data=pobj.data;
			var player= self.player =pobj.player;
			var user_login_info=window.localStorage.getItem("user_login_info");
			user_login_info=escape(user_login_info);
			//记录当前焦点索引，关键代码
			player.DialogIndex = index;
			//如果已经打开，则注入新参数（add by zhangyu, 云台控制共享处理）
			if (player.PtzDialog > 0) {
				//显示云台控制窗口
				var jsonObj = {
					"show": true //true为显示，false为隐藏
				};
				player.playerObj.SetWebDialog(player.PtzDialog, JSON.stringify(jsonObj));
				//如果摄像机id不一致时，注入新的数据
				if (data.cId !== player.PtzDialog.cId) {
					self.importDataToDialog(pobj, player.PtzDialog);
				}
				return;
			}
			self.winclose(player);
			jQuery.get("/service/getCookie",{},function(res){
				if(res.code !== 200){
					notify.wran("请求数据失败");
                    return ;
				}
			var brStyle={
				"url":"http://"+location.host+"/module/ptz-controller/ptzctrl/index.html#"+res.data.JSESSIONID,
				"center":true,
				"left":0,
				"top":200,
				"width":280,
				"height":345,
				"alpha":0.1,
				"resize":true,
				"border":
				{
					"width":2,
					"color":13421772
				},
				"title":
				{
					"text":"控制面板",
					"color":15987699,
					"height":34,
					"fontsize":14
				},
				"closebtn":
				{
					"normal":10066329,
					"hover":14828338
				},
				"modal":false
			};
			brStyle=JSON.stringify(brStyle);
			try{
				var N = player.playerObj.ShowWebDialog(brStyle);
				//由于云台采用公用模式，故在此存储到player.PtzDialog、player.PtzDialogCId
				player.PtzDialog = player.cameraData[index].PtzController = N;
				player.PtzDialogCId = data.cId;
			}
			catch(e){
				notify.warn("请安装最新版本的ocx");
			}
			/**
			 * 取消绑定的事件，add by zhangyu on 2015/5/26
			 */
			player.removeEvents("WebDialogEvent", {
				internal: false
			});
			player.addEvent("WebDialogEvent",function(id,eid,data){
				if(N==id){
					var index = player.playerObj.GetFocusWindowIndex();
					if(data=="window.close"){
						var M=player.playerObj.ExeScript(N, "window.CruiseModule.stopCruise", 1);
						delete player.cameraData[index].PtzController;
						delete player.PtzDialog;
						return;
					}
					var data=JSON.parse(data);
					if(data.type=="ConfirmDialog"){
						new ConfirmDialog({
							message: data.message,
							callback: function() {
								var M=player.playerObj.ExeScript(N, "data.callback", data.callbackParam);
							}
						});
					}
					else if(data.type=="notify.warn"){
						notify.warn(data.message);
					}
					else if(data.type=="console.log"){
						console.log(data.message);
					}
					else if(data.type=="imgPreview"){
						var currentFilePath = data.currentFilePath,
							dataModel = {
								showRightDetailInfo: false,
								baseInfo: {
									filePath: "" /*图片src*/
								},
								operatorOptions: {
									imgRotateIcon: true, // 旋转
									horizontalTurnIcon: true, // 水平翻转
									verticalTurnIcon: true, // 垂直翻转
									toViewLibIcon: false,
									imgProcessIcon: false
								}
							},
							currentData = Object.clone(dataModel),
							toggleData = Object.clone(dataModel);

						// 给当前的图片数据赋值
						currentData.baseInfo.filePath = currentFilePath;
						//隐藏云台控制面板
						player.playerObj.SetWebDialog(N, JSON.stringify({
							"show": false //true为显示，false为隐藏
						}));

						POPIMG.initial(currentData, {
			                toggleImg: function(index, callback) {
			                	var filePathArray = data.filePathArray,
			                		imgCount = filePathArray.length;

			                	if (index === -1 || index >= imgCount) {
			                		return callback(null);
			                	}

			                	if (filePathArray[index]) {
			                		// 给切换的图片数据赋值
			                		toggleData.baseInfo.filePath = filePathArray[index];
				                    callback(toggleData);
			                	}

			                },
			                currentIndex: data.currentIndex
			            });
					}
					else if(data.type=="complete"){
						self.importDataToDialog(pobj, N);
					} else if(data.type == "refresh-preset") {
						/**
						 * 由于cs包装的bs中对cameraCache的删除没有影响到主BS程序的cameraCache值，故此处接收事件重新删除
						 * bug【33734】修改预置位缓存，by zhangyu on 2015/5/27
						 */
						var camera = cameraCache.get(data.cameraid);
						camera && camera.presetsMap && camera.presetsMap.erase(data.presetid);
					}else if (data.type == "ptzSpeed"){
						Cookie.write("ptzspeed", data.ptzspeed, {duration: 365000});
					}
				}
			});
            });
		};
	};
	var PtzController = new _PtzController();
	return PtzController;
});

