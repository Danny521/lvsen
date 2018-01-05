define([
	'jquery',
	'../js/lib/pubsub',
	'../js/configMonitor-Model',
	'../js/configMonitor-View'
	],function(jQuery,pb,Model,view){
		var PB,View;
		var Controller = function(){
			var self=this;
			self.init();
			PB.regist({
				"startCheck":self.startCheck,
				"stopCheck":self.stopCheck,
				"getDeviceDetail":self.getDeviceDetail,
				"getChannelDetail":self.getChannelDetail,
				"UpdateChannel":self.UpdateChannel,
				"UpdateDevice":self.UpdateDevice
			});
			self.getInfosLists();
		}
		Controller.prototype = {
			init:function(){
				PB = new pb(this);
				View = new view(PB);
			},
			pvgCacheLoad:{},//将pvgId作为key值，为其赋初始值，后续轮训的时候判断该key值是否已经取得变更数目
			_pvgids:[],//存放pvg列表的pvgId
			_orgids:[],//存放pvg列表的orgId
			_ids:null,//存放pvgId，用","隔开，后续开始检测获取变更数目时作为请求参数
			_startCheck:null,
			_stopCheck:true,
			_devices:[],//视频设备
			_channels:[],//摄像机通道
			//数据库中字段对应名称Map
			DEVICE_INFOS : {
				ip : "设备IP",
				name : "设备名称",
				pass : "密码",
				port :"端口",
				title :"标题",
				type :"协议",
				url :"地址",
				user :"用户"
			},
			CHANNEL_INFOS : {
				title:"标题",
				name:"名称",
				path:"路径",
				host:"主机",
				addr:"地址",
				avType:"云台控制",
				level:"摄像机级别"
			},
			/**
			 * [getInfosLists 获取pvg列表]
			 * @return {[type]} [description]
			 */
			getInfosLists:function(){
				var self = this;
				Model.getLists().then(function(res){
					View.showInfosLists(res)
					var pvgs = res.data.pvgs;
					for(var i=0;i<pvgs.length;i++){
						self._pvgids.push(pvgs[i].pvgId);
						self._orgids.push(pvgs[i].orgId);
						self.pvgCacheLoad[pvgs[i].pvgId]=null;//将key值所有值置为null
					}
					self.ids=self._pvgids.join(",");
					//PVG数目为0时处理使得按钮灰选
					if(!(self.ids)){
						View.addDisabled();
					}
				})
			},
			/**
			 * [getChangeNum 开始检测为获取变更数目]
			 * @param  {[type]} ids [description]
			 * @return {[type]}     [description]
			 */
			startCheck:function(){
				var self = this;
				Model.startCheck(self.ids).then(function(res){
					if(res && res.code===200){
						self.getChangeNum();
						//停止检测置为true
						self._stopCheck=true;
					}
				})
			},
			/**
			 * [_getChangeNum 获取变更数目，轮训获取]
			 * @return {[type]} [description]
			 */
			getChangeNum:function(){
				var self = this;
				_startCheck = setTimeout(function(){
					Model.getCheckNum().then(function(res){
						if(res && res.code===200){
							if(res.data.infos){
								var infos = res.data.infos,statusNumArray=[];
								for(var key in infos){
									//判断当前id是否已经检测完成
									if(self.pvgCacheLoad[key]===true){
										continue;
									}
									//将未检测完成的key对应的value置为true
									self.pvgCacheLoad[key]=true;
									//将key对应的值（状态-设备变更数目-摄像机变更数目）
									statusNumArray = infos[key].split("-");
									//用得到的值渲染表示状态，变更数目的DOM结构
									View.showChangeNum(key,statusNumArray);
								}
								//如果未检测完，轮训检测
								if(self.judgeIsOver()&&self._stopCheck){
									self.getChangeNum();
								}else if(!self.judgeIsOver()){
									View.ControlButton();
									for(var key in infos){
										self.pvgCacheLoad[key]=null;
									}
								}
							}
						}
					})
				},1000)
			},
			/**
			 * [judgeWhenOver 判断轮训在什么时候结束]
			 * @return {[type]} [description]
			 */
			judgeIsOver:function(){
				var self = this;
				for(var key in self.pvgCacheLoad){
					if(self.pvgCacheLoad.hasOwnProperty(key)&&self.pvgCacheLoad[key]===null){
						return true;
					}
				}
				return false;
			},
			/**
			 * [stopCheck 停止检测]
			 * @return {[type]} [description]
			 */
			stopCheck:function(){
				var self = this;
				self._stopCheck=false;
				clearTimeout(self._startCheck);
				View.ControlButton();
			},
			/**
			 * [getDetail 获取设备变更数目详请]
			 * @param  {[type]} pvgId [根据当前pvgId]
			 * @return {[type]}       [description]
			 */
			getDeviceDetail:function(pvgId){
				var infos={},self = this,devices=[];
				Model.getDetail(pvgId).then(function(res){
					infos = res.data.infos;
					self._devices = infos.devices;
					if(infos.devices){
						if(infos.devices.length>0){
							for(var i=0;i<infos.devices.length;i++){
								var deviceInPvg = [],deviceInTable = [];
								if(infos.devices[i].detailInPvg){
									deviceInPvg = self._getDetail(JSON.parse(infos.devices[i].detailInPvg),self.DEVICE_INFOS);
								}
								if(infos.devices[i].detailInTable){
									deviceInTable = self._getDetail(JSON.parse(infos.devices[i].detailInTable),self.DEVICE_INFOS);
								}
								devices.push({
									"Pvgs":deviceInPvg,
									"Tables":deviceInTable
								})
							}
						}
					}
					View.showDetail(devices);
				})
			},
			/**
			 * [getChannelDetail 获取摄像机变更数目详情]
			 * @param  {[type]} pvgId [description]
			 * @return {[type]}       [description]
			 */
			getChannelDetail:function(pvgId){
				var infos = {},self=this,channels=[],
					showInPvg,showInTable;
				Model.getDetail(pvgId).then(function(res){
					infos = res.data.infos;
					self._channels = infos.channelInfos;
					if(infos.channelInfos){
						if(infos.channelInfos.length>0){
							for(var i=0;i<infos.channelInfos.length;i++){
								var channelInPvg = [],channelInTable = [];
								if(infos.channelInfos[i].channelInPvg){
									showInPvg=self._getChannelShowData(infos.channelInfos[i].channelInPvg);
									channelInPvg = self._getDetail(showInPvg,self.CHANNEL_INFOS);
								}
								if(infos.channelInfos[i].channelInTable){
									showInTable=self._getChannelShowData(infos.channelInfos[i].channelInTable);
									channelInTable = self._getDetail(showInTable,self.CHANNEL_INFOS);
								}
								channels.push({
									"Pvgs":channelInPvg,
									"Tables":channelInTable
								})
							}
						}
					}
					View.showDetail(channels);
				})
			},
			/**
			 * [_getDeviceDetail 对变更数目详情处理]
			 * @param  {[type]} infos [description]
			 * @return {[type]}       [description]
			 */
			_getDetail:function(detail,module){
				var detailInAny = [];
				for(var key in detail){
					detailInAny.push({
						title:module[key],
						value:detail[key]
					})
				}
				return detailInAny;
			},
			/**
			 * [_getChannelShowData 获取在channelInfos中要展示到界面的信息]
			 * @param  {[type]} channel [description]
			 * @return {[type]}         [description]
			 */
			_getChannelShowData:function(channel){
				var keys = ["title","name","path","host","addr","avType","level"],showChannel={};
				for(var j=0;j<keys.length;j++){
					if(channel[keys[j]]!=void 0){
						showChannel[keys[j]]=channel[keys[j]];
					}
				}
				return showChannel;
			},
			/**
			 * [getDeviceRecords 获取视频设备的选中项（即要同步的项）]
			 * @return {[type]} [description]
			 */
			getDeviceRecords:function(){
				//获取选中项
				var self = this,
					deviceChecked = View.getChecked(),
					checkedIndex,//选中项的index
					record,//一条选中记录
					records=[],//选中记录的集合
					_device;//后端返回的视频设备数据
				for(var i=0;i<deviceChecked.length;i++){
					//获取每一条选中项的index
					checkedIndex = View.getCheckIndex(deviceChecked[i]);
					//去后端返回数据中找index对应的pvgs和table中数据
					if(self._devices.length>0){
						_device =self._devices[checkedIndex];
						if(_device){
							if(_device.detailInPvg){
								record = JSON.parse(_device.detailInPvg);
							}else if(_device.detailInTable){
								record = JSON.parse(_device.detailInTable);
							}
						}
						//将每一条数据存储在选中集合中
						if(record){
							record["event"]=_device.event;
							records.push(record);
						}
					}
				}
				return {records:records};
			},
			/**
			 * [getChannelRecords 获取摄像机通道中选中项（要同步的项）]
			 * @return {[type]} [description]
			 */
			getChannelRecords:function(){
				var self = this,
					channelChecked = View.getChecked(),
					checkedIndex,//选中项的index
					record,//一条选中记录
					records=[],//选中记录的集合
					_channel;//后端返回的视频设备数据
				for(var i=0;i<channelChecked.length;i++){
					checkedIndex = View.getCheckIndex(channelChecked[i]);
					if(self._channels.length>0){
						_channel = self._channels[checkedIndex];
						if(_channel){
							if(_channel.channelInPvg){
								record = _channel.channelInPvg;
							}else if(_channel.channelInTable){
								record = _channel.channelInTable;
							}
						}
						if(record){
							record["event"]=_channel.type;
							records.push(record);
						}
					}
				}
				return {records:records};
			},
			/**
			 * [UpdateDevice 同步设备信息]
			 * @param {[type]} data [description]
			 */
			UpdateDevice:function(data){
				var self = this,records = self.getDeviceRecords();
				if(records.records.length<1){
					notify.warn("请先选择同步项");
				}else{
					new ConfirmDialog({
						title: '提示',
						confirmText: '确定',
						message: "确定同步检测信息？",
						callback:function(){
							Model.UpdateDevice(data.pvgId,data.orgId,records).then(function(res){
								if(res && res.code===200){
									data.updateDevice();
									notify.success("同步成功");
								}else{
									notify.warn(res.data.message);
								}
							})
						}
					})
				}
			},
			/**
			 * [UpdateChannel 同步摄像机通道]
			 * @param {[type]} data [description]
			 */
			UpdateChannel:function(data){
				var self= this,records = self.getChannelRecords();
				if(records.records.length<1){
					notify.warn("请先选择同步项");
				}else{
					new ConfirmDialog({
						title: '提示',
						confirmText: '确定',
						message: "确定同步检测信息？",
						callback:function(){
							Model.updateChannel(data.pvgId,records).then(function(res){
								if(res && res.code===200){
									data.updateChannel();
									notify.success("同步成功");
								}else{
									notify.warn(res.data.message);
								}
							})
						}
					})
				}
			}
		}
	return new Controller();
})
