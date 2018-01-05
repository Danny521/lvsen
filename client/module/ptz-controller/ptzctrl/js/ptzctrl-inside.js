//这个函数window下的，给OCX调用的，用于ocx给本窗口注入数据
var importData = window.importData =function(data){
	var obj=JSON.parse(data);
	jQuery(".win-dialog.ptz-control").data("cdata",obj);
	PtzController.init(obj.ptzSp);
	PtzController.getCamerInfo();
	PtzController.setParams(data);
	jQuery("#loading").hide();
	//刷新当前tab页，以便鼠标点击分屏实时响应刷新, add by zhangyu, 2015.10.19
	jQuery(".win-dialog.ptz-control .win-dialog-title .ptztab.active").trigger("click");
};

define(['jquery-ui','/module/ptz-controller/ptzctrl/js/gptz-core.js','/module/ptz-controller/ptzctrl/js/gptz-service.js'],function(){ //gPtz,gPTZService
	var _PtzController=function(){
		var self =  this;
		this.criuse = null;


		window._console={};
		window._console.log=function(str){
			var data=JSON.stringify({
				type:"console.log",
				message:str
			});
			OnBeforeNavigate2(data);
		};
		/**
        *获取摄像机通道id
        @camera 摄像机通道数组
        */
		this.findcamid = function(camera) {
			var camid = 0;
			camera.temphdsd = 0;
			if (camera.cameraInfo) {
				camera = camera.cameraInfo;
			}
			if (camera.hdchannel) {
				camera.hdChannel = camera.hdchannel;
			}
			if (camera.sdchannel) {
				camera.sdChannel = camera.sdchannel;
			}
			if (camera.hd_channel) {
				camera.hdChannel = camera.hd_channel;
			}
			if (camera.sd_channel) {
				camera.sdChannel = camera.sd_channel;
			}
			if (camera.hdChannel && camera.hdChannel.length > 0) {
				camid = camera.hdChannel[0].id; //目前只有1个
				camera.temphdsd = 1;
			} else if (camera.sdChannel && camera.sdChannel.length > 0) {
				var NoEnCoder = 0;
				for (var i = 0; i < camera.sdChannel.length; i++) {
					var group_id = camera.sdChannel[i].pvg_group_id;
					//1表示编码器，没有录像；2表示DVR
					if (group_id == 2 || group_id == 3) {
						NoEnCoder++;
						camid = camera.sdChannel[i].id;
						break;
					} else if (group_id == 1) {
						camid = -1;
					}
				}
				if (NoEnCoder === 0) {
					camid = -1;
				}
			}
			return camid;
		};
		/**
		 * 初始化入口
		 * @return {[type]} [description]
		 */
		this.init=function(){
			var self=this;
			var bindData = {};
			if (!self.isRunning) {
				self.isRunning = true;
			} else {
				return;
			}
			//速度控制条的初始化
			jQuery('.win-dialog.ptz-control .ptz-speed .speedSlider').slider({
				range: 'min',
				step: 1,
				max: 15,
				min: 1,
				value: 10,
				change: function() {
					var speed = jQuery(this).slider('value');
					//cookie获取控制速度值，当值每次改变就记录 add by wujingwen  on 2015.10.10
					var ptzSpeed = jQuery('.win-dialog.ptz-control .ptz-speed .speedSlider').slider('value'),
						data = JSON.stringify({
							type: "ptzSpeed",
							ptzspeed: ptzSpeed
						});
					OnBeforeNavigate2(data);
				}
			});

			//选项卡点击切换
			jQuery(document).on("click",".win-dialog.ptz-control .win-dialog-title .ptztab",function(){
				jQuery(this).siblings().removeClass("active");
				jQuery(this).addClass("active");
				var str = jQuery(this).attr("data-tab");
				jQuery("div.view").hide();
				jQuery("div.view." + str).addClass("active").show();
				var stype = jQuery(this).attr("data-type");
				jQuery(".win-dialog.ptz-control .win-dialog-body div.view").siblings().removeClass("active");
				jQuery(".win-dialog.ptz-control .win-dialog-body div.view." + stype).addClass("active");
				jQuery(".win-dialog.ptz-control .win-dialog-body div.view." + stype).show();
				var cdata = jQuery(".win-dialog.ptz-control").data("cdata");
				if (!cdata) {
					return;
				}
				var cameraId = cdata.cId || JSON.stringify(cdata).playingChannel.id;

				if (stype == "preset") {
					self.showPreset(cameraId);
				}

				if (stype === "cruise") {
					if (!self.criuse) {
						/*巡航模块*/
						self.criuse = new CruiseModule({
							"cameraId": cameraId
						});
					} else {
						self.criuse.initData({
							"cameraId": cameraId
						});
					}
					clearInterval(self.AutoCruiseTimer);
					self.criuse.getAutoCruise(cameraId);
				}
			});
            //云台方向控制按钮
			jQuery(document).on("mousedown",".win-dialog.ptz-control .dir-control span.cmd",function(){
				var $self = jQuery(this),
					cmd = $self.data('cmd'),
					param = '',
					cdata = jQuery(".win-dialog.ptz-control").data("cdata");
				//权限判断,无权限直接反回
				if (!self.checkPtzPermission("ptz-control")) {
					return;
				}
				//收集参数
				if ($self.is('.adjust')) {
					param = ($self.hasClass('up')) ? 1 : -1;
				} else {
					param = jQuery('.win-dialog.ptz-control .ptz-speed .speedSlider').slider('value');
				}
				//bug【45350】，快速点击时空的处理
				if(!bindData) {
					return;
				}
				//请求云台接口
				bindData.deferred = gPtz.setPTZDir({
					cameraId: cdata.cId,
					cameraNo: "", //cdata.playingChannel.path,
					cmd: cmd,
					param: param,
					playingChannelId: self.findcamid(cdata), //cdata.playingChannel.id
					callback: OnBeforeNavigate2
				});
			});

			jQuery(document).on("mouseup",".win-dialog.ptz-control .dir-control span.cmd",function(){
				var $this = jQuery(this),
					cmd = $this.data('cmd'),
					cdata = jQuery(".win-dialog.ptz-control").data("cdata");
				//此处不用再次判断权限，防止提示两次
				// if (!self.checkPtzPermission("ptz-control")) {
				// 	return;
				// }
				//更新样式
				$this.removeClass('clicked');
				//bug【45350】，快速点击时空的处理
				if(!bindData || !bindData.deferred) {
					return;
				}
				//发送停止命令
				bindData.deferred.done(function(res) {
					if (res.code === 200) {
						setTimeout(function() {
							gPtz.stopPTZDir({
								cameraId: cdata.cId,
								cameraNo: "", //cdata.playingChannel.path,
								cmd: cmd,
								playingChannelId: self.findcamid(cdata), //cdata.playingChannel.id
								callback: OnBeforeNavigate2
							});
						}, 500);
					}
				});
			});

			//云台辅助设备 雨刷和灯光
			jQuery(document).on('change','.win-dialog.ptz-control .ptz-speed .equipment select',function() {
				var $this = jQuery(this),
					selected = $this.closest('.equipment').find('select option:selected'),
					sid = selected.attr('id'),
					isOn = $this.closest('.equipment').find('.active').html(),
					camera = cameraCache.get(gPtz.getParams().cameraId),
					cdata = jQuery(".win-dialog.ptz-control").data("cdata"),
					cmd = '';
				//权限判断,无权限直接反回
				if (!self.checkPtzPermission("ptz-control")) {
					return;
				}
				//收集参数
				if (sid === 'wipe') {
					cmd = 17;
				} else if (sid === 'light') {
					cmd = 18;
				} else if(sid === 'power'){//电源开关
					cmd = 19;
				} else if(sid === "scanning"){//自动扫描
					cmd = 20;
				} else if(sid === "customSwitch"){//自定义辅助开关
					cmd = 21;
				}

				if(isOn === "ON"){
                	camera[sid] = 1;
                } else{
                	camera[sid] = 0;
                }
				//组装参数并发送请求
				var data = {
					cameraId: cdata.cId,
					cameraNo: "", //cdata.playingChannel.path,
					cmd: cmd,
					param: camera[sid]
				};
				var success = function(res) {
					if (res && res.code === 200) {
						$this.siblings().removeClass("active");
						$this.addClass("active");
						if ($this.is(jQuery('.off'))) {
							$this.removeClass('off');
							$this.addClass('on');
							camera[sid] = 1;
						} else {
							$this.removeClass('on');
							$this.addClass('off');
							camera[sid] = 0;
						}
					} else if (res && res.code === 400) {
						notify.warn(res.data.message + "！");
					}
				};
				gPTZService.setDirection(data, success);
			});

			//雨刷灯光开启关闭
			jQuery(document).on('click', '.win-dialog.ptz-control .ptz-speed .equipment .switch span',function() {
				var $this = jQuery(this),
				    id = $this.closest('.equipment').find('select option:selected').attr('id').trim(),
					camera = cameraCache.get(gPtz.getParams().cameraId),
					cdata = jQuery(".win-dialog.ptz-control").data("cdata"),
                    cmd = "";
                $this.siblings().removeClass("active");
				$this.addClass("active");
				if ($this.is(jQuery('.off'))) {
					$this.removeClass('off');
					$this.addClass('on');
					camera[id] = 1;
				} else {
					$this.removeClass('on');
					$this.addClass('off');
					camera[id] = 0;
				}
				if (id === 'wipe') {
					cmd = 17;
				} else if (id === 'light') {
					cmd = 18;
				} else if(id === 'power'){
					cmd = 19;
				} else if(id === "scanning"){
					cmd = 20;
				} else if(id === "customSwitch"){
					cmd = 21;
				}
				//组装参数并发送请求
				var data = {
					cameraId: cdata.cId,
					cameraNo: "", //cdata.playingChannel.path,
					cmd: cmd,
					param: camera[id]
				};
				var success = function(res) {
					if (res && res.code === 200) {
						if ($this.is(jQuery('.off'))) {
							// camera[id] = 1;
							// cameraCache.set(gPtz.getParams().cameraId, camera);
						} else {
							// camera[id] = 0;
							// cameraCache.set(gPtz.getParams().cameraId, camera);
						}
					} else if (res && res.code === 400) {
						notify.warn(res.data.message + "！");
					}
				};
				gPTZService.setDirection(data, success);
			});

			//调用预置位
			jQuery(document).on("click",".win-dialog.ptz-control .win-dialog-body .preset-content .preset-use",function(){
				var li=jQuery(this).parent().parent();
				var presetId = li.data('id');
				var camera=jQuery(".win-dialog.ptz-control").data("cdata");
				var index=jQuery(".win-dialog.ptz-control").data("index");
				var button = jQuery('#ptzCamera .cruise .box-body .buttons .button');
				var cdata=jQuery(".win-dialog.ptz-control").data("cdata");

				if (cdata.path) {
					var cameraNo1 = cdata.path;
				}
				if (cdata.playingChannel) {
					var cameraNo2 = cdata.playingChannel.path;
				}
				if (cdata.history) {
					var cameraNo3 = cdata.history.path;
				}

				var cameraId = cdata.cId;
				var cameraNo = cameraNo1 || cameraNo2 || cameraNo3;
				var cameraType = cdata.cType;

				gPtz.callPreset({
					cameraId: cameraId,
					cameraNo: "",//cameraNo,
					presetId: presetId
				});
			});

			//删除选中的预置位
			jQuery(document).on("click",".win-dialog.ptz-control .win-dialog-body .preset-content .preset-delete",function(){
				var li=jQuery(this).parent().parent();
				var order=jQuery(this).index();
				var id = li.data('id');
				var camera=jQuery(".win-dialog.ptz-control").data("cdata");
				var index=jQuery(".win-dialog.ptz-control").data("index");
				var cameraId=camera.cId;
				var presets = [];
				self.JudgeinCruise(id,function(resdata){
					if(resdata.inCruise!==0){
						var data=JSON.stringify({
							type:"notify.warn",
							message:"当前预置位巡航列表中，请先停止巡航！"
						});

						new ConfirmDialog({
							width:250,
							opacity:0.7,
							message: "删除后将同时删除巡航计划中的预置位，您确定要删除吗？",
							callback: function() {
								//bug【33734】,添加最后一个参数,modify by zhangyu on 2015/5/27
								gPtz.removePreset(id, li,function(data){
									self.showPreset(cameraId);
									//发送消息，让主bs程序更新预置位缓存,bug【33734】,modify by zhangyu on 2015/5/27
									OnBeforeNavigate2(data);
								}, cameraId);

							}
						});
						return;
					}
					else{
						new ConfirmDialog({
							width:250,
							message: "您确定要删除该预置位吗？",
							callback: function() {
								//bug【33734】,添加最后一个参数,modify by zhangyu on 2015/5/27
								gPtz.removePreset(id, li,function(data){
									self.showPreset(cameraId);
									//发送消息，让主bs程序更新预置位缓存,bug【33734】,modify by zhangyu on 2015/5/27
									OnBeforeNavigate2(data);
								}, cameraId);
							}
						});
					}
				});

			});

			//预置位图片放大预览
			jQuery(document).on("dblclick",".win-dialog.ptz-control .win-dialog-body .preset-content li span.preset-img img",function(){
				var img = jQuery(".win-dialog.ptz-control .win-dialog-body .preset-content li span.preset-img img"),
					L = img.length,
					currentFilePath = jQuery(this).attr("src"),
					currentIndex,
					filePathArray = [],
					sendData;

				for (var i = 0; i <= L - 1; i++) {
					filePathArray.push(jQuery(img[i]).attr("src"));
				}

				currentIndex = jQuery(this).parent().parent().index();
				sendData = JSON.stringify({
					type: "imgPreview",
					currentIndex: currentIndex,
					currentFilePath: currentFilePath,
					filePathArray: filePathArray
				});
				OnBeforeNavigate2(sendData);
				//关闭窗口[delete by zhangyu, 2015.10.29查看预置位图片时不需要关闭云台面板]
				/*setTimeout(function(){
					OnBeforeNavigate2("window.close");
				},50);*/
			});
		};
		/**
		 * 判断云台控制的权限
		 * @author zhangyu
		 * @date   2015-11-07
		 * @return {[type]} [description]
		 */
		this.checkPtzPermission = function(type) {
			//获取云台面板摄像机参数
			var infoObj = jQuery(".win-dialog.ptz-control").data("cdata");
			//根据类型分别进行权限判断
			if (type === "ptz-control") {
				//bug【45350】，快速点击时空的处理
				return true;
				// //判断权限
				// if (infoObj.klass && infoObj.klass["ptz-control"]) {
				// 	return true;
				// }

				//提示用户
				var data = JSON.stringify({
					type: "notify.warn",
					message: "暂无云台控制权限"
				});
				OnBeforeNavigate2(data);
				return false;
			} else {
				//扩展其他的权限控制
				return true;
			}
		};
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
		this.showPreset = function(cameraId) {
			jQuery.ajax({
				url: "/service/ptz/get_presets",
				type: "get",
				cache: false,
				data: {
					cameraId: cameraId
				},
				success: function(res) {
					if (res && res.code == 200) {
						var presetList = jQuery(".win-dialog.ptz-control .win-dialog-body .preset-content .preset-list");
						var presets = res.data.presets;
						if (!presets) {
							var data = JSON.stringify({
								type: "notify.warn",
								message: "后台返回数据格式不正确"
							});
							OnBeforeNavigate2(data);
							return;
						}
						var L = presets.length;
						var html = "";

						for (var i = 0; i <= L - 1; i++) {
							var name = presets[i].name;
							if (presets[i].name.length >= 5) {
								var name = presets[i].name.substr(0, 5) + "...";
							}
							var str = [
								"<li data-id='" + presets[i].id +
								"' data-name='" + presets[i].name +
								"' data-imageUrl='" + presets[i].imageUrl +
								"' data-sortNo='" + presets[i].sortNo +
								"' data-cameraId='" + presets[i].cameraId +
								"' data-stopTime='" + presets[i].stopTime +
								"' data-presetNo='" + presets[i].presetNo + "'>",
								"<span class='preset-index num'>" + (i + 1) + "</span>",
								"<span class='preset-img'><img src='/service/pfsstorage/image?filePath=" + presets[i].imageUrl + "'/></span>",
								"<span class='preset-name' title='" + presets[i].name + "'>" + name + "</span>",
								"<span class='preset-do'>",
								"<span class='preset-use'></span>",
								"<span class='preset-delete'></span>",
								"</span>",
								"</li>"
							].join("");
							html = html + str;
						}
						presetList.html(html);
						//预置位权限控制
						var infoObj = jQuery(".win-dialog.ptz-control").data("cdata");
						if(!infoObj.klass["call-preset"]){
                            presetList.find(".preset-use").hide();
						}
						if(!infoObj.klass["delete-preset"]){
                            presetList.find(".preset-delete").hide();
						}
					}
				},
				error: function() {
					alert("error,cameraId=" + cameraId);
				}
			});
		};

		this.getCamerInfo=function(){
			var cdata = jQuery(".win-dialog.ptz-control").data("cdata");
			if (cdata.playingChannel) {
				var path = cdata.playingChannel.path;
			}
			gPtz.setParams({
				cameraId: cdata.cId,
				cameraNo: "", //path,
				cameraType: cdata.cType
			});
		};

		this.bindEvent=function(){
			//云台速度控制初始化
			jQuery('.win-dialog.ptz-control .ptz-speed .speedSlider').slider({
				range: 'min',
				step: 1,
				max: 15,
				min: 1,
				value: Toolkit.getPtzSpeed(),
				change: function() {
					var speed = jQuery(this).slider('value');
					var focusChannel = gVideoPlayer.getFocusWindow();
					var result = gVideoPlayer.setPtzSpeed(speed, focusChannel);
					gVideoPlayer.cameraData[focusChannel].ptzSpeed = speed;//将每个通道的云台速度保存,用于键盘操作
				}
			});
		};

		this.setParams=function(data,index){
			var cameraId = data.cId;
			if (data.path) {
				var cameraNo1 = data.path;
			}
			if (data.playingChannel) {
				var cameraNo2 = data.playingChannel.path;
			}
			if (data.history) {
				var cameraNo3 = data.history.path;
			}
			var cameraNo = cameraNo1 || cameraNo2 || cameraNo3;
			var cameraType = data.cType;
			gPtz.setParams({
				cameraId: cameraId,
				cameraNo: "",//cameraNo,
				cameraType: cameraType
			});
		};
	};
	var PtzController= new _PtzController();
	PtzController.init();
	window.PtzController=PtzController;
	var notify={};
	notify.warn=function(str){	};
	notify.info=function(str){	};

});

var closeCur=function(){
	self.RunCruiseTimer();
};

window.removePreset=function(index,order){
	var li=jQuery(".win-dialog.ptz-control .win-dialog-body .preset-content ul li:eq("+order+")");
	gPtz.removePreset(index, li);
};

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
