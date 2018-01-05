define([
	'jquery',
	'../js/lib/pubsub',
	'../js/watchModel',
	'../js/watchView',
	'../js/lib/commonPage/commonPage'
	],function(jQuery,pb,Model,view){
		var PB,View;
		var searchData,
			Key = ["nid","password","expires","deviceType","manufacture","model","fireware","soft"],
			detail = [],//存放交互信令
			PAGESIZE = 10,//每页条数
			ajaxHandle,
			terminate=0,
			BASICNAME={
				"nid":"国标ID",
				"password":"密码",
				"expires":"注册有效期",
				"deviceType":"设备类型",
				"manufacture":"设备厂商",
				"model":"设备型号",
				"fireware":"固件版本",
				"soft":"软件版本"
			},
			NAME = {
				"register": "注册",
				"unregister": "注销",
				"expiry": "注册有效期可调",
				"keepalive": "心跳",
				"time": "校时",
				"openstream": "实时点播",
				"ptz": "云台控制",
				"ptzstop": "云台控制停止",
				"remoterun": "设备远程启动",
				"download": "视音频文件下载",
				"queryfile": "录像文件检索",
				"play": "视频文件回放",
				"playctrl": "视频文件回放控制",
				"rec": "开始手动录像",
				"stoprec": "停止手动录像",
				"guard": "报警布防",
				"unguard": "报警撤防",
				"alarm": "设备报警",
				"resetalarm": "报警复位",
				"querycatalog": "设备目录查询",
				"queryinfo": "设备信息查询",
				"querystatus": "设备状态查询",
				"subscribe": "订阅通知",
				"broadcast": "语音广播"
			},
			STATUS = {
				"0":"未通过",
				"1":"通过",
				"2":"未检测"
			},
			KINDCMD = {
				"register-cmd":"注册/注销命令",
				"controll-cmd":"控制类命令",
				"history-cmd":"历史回放命令",
				"alarm-cmd":"报警命令",
				"other-cmd":"其他命令"
			};
		var Controller = function(){
			var self=this;
			self.init();
			PB.regist({
				"GetDeviceType":self.getDeviceType,
				startCheck:function(items){
					self._startTime = new Date().getTime();
					self.startCheck(items)
				},
				stopCheck: function(deviceId) {
					Model.stopCheck();
					self.OverCheck(deviceId)
				},
				suspendCheck:function(){
					Model.stopCheck();
					self.suspend = true;
				},
				goOnCheck: function(index) {
					self._startTime = new Date().getTime();
					self.getDetail(index)
				},
				"showInfos":self.showLookInfos,
				"saveCheckInfos":self.saveCheckInfos,
				"showCheckedInfos":self.initPage,
				"searchCheckedInfos":self.searchCheckedInfos,
				"searchDetailInfos":self.searchDetailInfos,
				"DeleteInfos":self.deleteInfos,
				"exportDoc":self.exportDoc,
				Tip:function(){
					terminate=1;
				},
				"lookUnpassDetail":self.showUnpassDetail
			})
		}
		Controller.prototype = {
			init:function(){
				PB = new pb(this);
				View = new view(PB);
			},
			/**
			 * [getDeviceType 根据设备ID获取设备类型]
			 * @type {[type]}
			 */
			getDeviceType: function(deviceId) {
				Model.getDeviceType(deviceId).then(function(res) {
					//根据后台返回的设备类型在DOM结构中给出相应的设备类型
					View.checkedBoxById(res);
				},function(){
					notify.warn("网关已关闭，无法获取设备类型");
				})
			},
			/**
			 * [startCheck 获取检测项]
			 * @param  {[type]} items [description]
			 * @return {[type]}       [description]
			 */
			_checkedTime: 0,//已经检测所用时间
			_startTime: 0,//开始监测时间
			_checkedItems: 0,//检测的条数，检测一条加一条
			_passItems:0,//检测通过条数
			_unpassItems:0,//检测失败条数
			/**
			 * [startCheck 开始检测，调用getDetail方法]
			 * @param  {[type]} items [description]
			 * @return {[type]}       [description]
			 */
			startCheck:function(items){
				var self = this;
				this._checkItems = items;//从view中一次性获取到要检测的数目
				this.stop = false;
				Model.StartCheck(items[0]).then(function(res){
					if(res && res.code===401){
						notify.warn(res.method);
						return;
					}else{
						self.getDetail(0);
					}
				},function(){
					notify.warn("网关已关闭，无法继续检测");
					View.gateWayClosedstatus(0);
				})
			},
			/**
			 * [getDetail 获取列表项id并获取检测结果]
			 * @type {[type]}
			 */
			getDetail: function(index) {
				var self = this,
					items = this._checkItems, 
					item = this._checkItems[index];
				//判断是否为重新检测或者注册失败，如果是将检测项和检测时间置为0，为了后期界面上面显示正确
				if(self._checkedItems === this._checkItems.length||View.showError()){
					self._checkedItems = 0;
					self._passItems = 0;
					self._unpassItems = 0;
					self._checkedTime = 0;
					View.removeAginaFlag();
				}
				//如果self.suspend为真，表示暂停，否则继续
				if (!self.suspend) {
					if (index < this._checkItems.length) {
						//根据国标ID和当前检测项获取要检测项的ID
						Model.getCallId(item.deviceId, item.method).then(function(res) {
							if (res && res.code ===200) {
								//暂停之后播放时移除disabled属性
								View.removeDisabled();
								//index==0时渲染检测模板；
								if(parseInt(index)===0){
									//网关正常开启时界面处理，显示检测页，隐藏首页
									View.gateWayOpen();
									View.showDetail(items);
								}
								self._getDetail(item,res.response.callid,index);
							}
						},function(){
							//发送ajax请求时出现错误，这里主要是超时
							notify.warn("网关已关闭,无法检测");
							//发送ajax请求超时时，界面上面的表现方式
							View.gateWayClosed();
						})
					}else{//最后一项检测结束后调用该接口
						self.OverCheck(items[0].deviceId);
					}
				}
				self.suspend = false;
			},
			/**
			 * [_getDetail 后端返回id之后调用该函数，具体处理检测结果]
			 * @param  {[type]} deviceId [国标id]
			 * @param  {[type]} method   [当前检测项]
			 * @param  {[type]} callid   [后端返回当前检测项所对应的ID]
			 * @param  {[type]} password [密码]
			 * @param  {[type]} expires  [注册有效期]
			 * @param  {[type]} index    [当前检测第几个]
			 * @return {[type]}          [description]
			 */
			
			_getDetail: function(item,callid,index) {
				HeartBeat.start();
				var self = this;
				//为了终止检测时停止让ajax发送请求
				Model.getDetail(item,callid,terminate).then(function(res) {
					var now = new Date().getTime();
					self._checkedTime += Math.floor((now - self._startTime) / 1000.0);
					self._startTime = now;
					if(res && res.code){
						//暂停之后播放时移除disabled属性
						View.removeDisabled();
						View.changeItemProgress(res.Progress,index)
					}
					if (res && res.code === 200) {
						self._checkedItems++;//已经检测项数目增加
						self._passItems++;//检测项中通过检测数目
						View.changeProgress(index,res.Progress);//滑动条变化
						//检测成功后界面状态处理
						View.passStatus(item.method,res.response,self._checkedItems,self._passItems, index, self._checkedTime);
						detail.push({
							index: index,
							method:item.method,
							response: res.response
						});
						//忽略当前检测项的等待时间时用到的参数
						terminate=0;
						//检测下一条
						self.getDetail(++index);
					} else if (res && res.code === 400) {//检测失败
						self._checkedItems++;//已经检测数目增加
						self._unpassItems++;//检测项中未通过数目变化
						View.changeProgress(index,res.Progress);//滑动条变化
						//检测失败后界面变化
						View.unPassStatus(item.method,res.response,self._checkedItems,self._unpassItems, index, self._checkedTime);
						detail.push({
							index: index,
							method:item.method,
							response: res.response
						});
						terminate=0;
						if(index === 0){
							self.OverCheck(item.deviceId);
						}else{
							//检测下一条
							self.getDetail(++index);
						}
					} else if (res && res.code === 401) {//注册失败返回值
						self._checkedItems++;
						self._unpassItems++;
						//如果是注册返回401的时候界面状态处理
						if(index===0){
							View.changeProgress(index,res.Progress);
							View.unPassStatus(item.method,res.response,self._checkedItems,self._unpassItems, index, self._checkedTime);
							//注册失败时调用stop接口
							self.OverCheck(item.deviceId);
						}else{//除注册之外的返回401的时候界面状态处理
							//检测到某一项发生异常时界面的变化
							View.gateWayClosedstatus(index);
							//非网关关闭造成的异常界面上面提示语的显示
							View.ItemCheckError(res.message);
							//检测项出现异常的情况下调用stop接口
							self.OverCheck(item.deviceId);
						}
						detail.push({
							index: index,
							method:item.method,
							response: res.response
						})
					} else if ((res && res.code === 100)) {//检测处于等待状态,每1S轮流去查一次
						setTimeout(function() {
							//stop作为标识位用来终止检测,如果self.stop为true时就停止检测
							if(!self.stop&&!self.suspend){
								self._getDetail(item,callid,index);
							}
							self.suspend=false;
						}, 1000)
						View.changeProgress(index,res.Progress);//滑动条变化
						//等待状态时界面处理
						View.waitStatus(self._checkedItems, index, self._checkedTime);
					} else if ((res && res.code === 101)) {//需要用户交互,每1s轮训查一次
						setTimeout(function() {
							if(!self.stop&&!self.suspend){
								self._getDetail(item,callid,index);
							}
							self.suspend=false;
						}, 1000)
						View.changeProgress(index,res.Progress);//滑动条变化
						//用户交互界面
						View.exchangeStatus(self._checkedItems, index, self._checkedTime, res.message);
					} else {//返回除上述值之外的其他值的时候界面操作
						self._checkedItems++;
						self._unpassItems++;
						View.unPassStatus(item.method,res.response,self._checkedItems,self._unpassItems, index, self._checkedTime);
						View.changeProgress(index,res.Progress);
						detail.push({
							index: index,
							method:item.method,
							response: res.response
						});
						terminate=0;
						self.getDetail(++index);
					}
				},function(){//检测过程中网关关闭
					notify.warn("网关已关闭，无法继续检测");
					View.gateWayClosedstatus(index);
				});
			},
			/**
			 * [OverCheck 检测完成时调用stop接口]
			 * @param {[type]} items [description]
			 */
			OverCheck:function(deviceId){
				Model.OverCheck(deviceId).then(function(res){
					if(res && res.code===200){
						return;
					}
				},function(){
					notify.warn("网关已关闭");
				})
			},
			/**
			 * [showLookInfos 查看按钮信息渲染]
			 * @param  {[type]} index [description]
			 * @return {[type]}       [description]
			 */
			showLookInfos: function(method) {
				for (var i = 0; i < detail.length; i++) {
					if (NAME[detail[i].method] === method) {
						View.showLookInfos(detail[i].response);
					}
				}
			},
			/**
			 * [saveCheckInfos 保存信息]
			 * @param  {[type]} data [description]
			 * @return {[type]}      [description]
			 */
			saveCheckInfos:function(data){
				Model.saveCheckInfos(data).then(function(res){
					if(res && res.code==200){
						notify.success("保存成功,请到检测管理界面查看");
						View.hideSaveButton();
					}else{
						notify.error(res.data.message);
					}
				},function(){
					notify.warn("网络异常，请重试");
				})
			},
			/**
			 * [initPage 获取已经检测过的列表信息]
			 * @param  {[type]} records         [description]
			 * @param  {[type]} total           [description]
			 * @param  {[type]} pagecontainer   [description]
			 * @param  {[type]} url             [description]
			 * @param  {[type]} headercontainer [description]
			 * @param  {[type]} bodycontainer   [description]
			 * @param  {[type]} keymap          [description]
			 * @return {[type]}                 [description]
			 */
			initPage: function() {
				var self = this;
				this.page = View.getPageContainer().renderPage({
					ajaxOptions: {
						url: Model.getCheckItemsPageUrl(), //请求url
						type: 'get',
						dataType: 'json'
					},
					isLocalPage: false, //本地分页
					serverPageSize: 10, //本地分页时后台分页大小(isLocalPage=true时生效)
					useCache: false, //是否缓存
					prevLoadPages: 1, //提前几页预加载(默认1)
					params: {}, //自定义参数
					pageSize: PAGESIZE, //每页大小
					showPageNum: 5, //并排显示页数
					pageNumberOffset: 1, //后端分页
					lazy: false,
					richStyle: true,
					theme: "simple",
					//事件
					events: {
						beforeFetchData : function(params){
							params.__d = new Date().getTime();
						},
						onPageDataLoaded: function(data) {
							searchData = data.data.list;
							self.showCheckedInfos(data);
						},
						onError: function(err) {
							notify.warn("网络异常，请重试");
							//显示没有相关数据提示，隐藏分页插件
							View.showNoData();
						}
					},
					//分页信息参数格式化
					paramsFormat: {
						pageSize: "pageSize",
						pageNumber: "pageNum",
						records: "data.list",
						totalRecords: "data.count"
					},
					//按钮文本格式化
					textFormat: {
						prev: "",
						next: "",
						prevs: "",
						nexts: "",
						first: "",
						last: ""
					}
				});
			},
			/**
			 * [showCheckedInfos 渲染列表信息模板]
			 * @param  {[type]} data [description]
			 * @return {[type]}      [description]
			 */
			showCheckedInfos:function(res){
				var lists = res.data.list,resultLists=[];
				if(lists){
					for(var i=0;i<lists.length;i++){
						resultLists.push({
							"id":lists[i].id,
							"nid":lists[i].nid,
							"deviceType":lists[i].deviceType,
							"manufacture":lists[i].manufacture,
							"model":lists[i].model,
							"checkTime":Toolkit.formatDate(new Date(lists[i].checkTime))
						})
					}
				}
				//总条数小于或等于每一页的条数时,隐藏分页div
				if(res.data.count<=PAGESIZE){
					View.hidePage();
				}else{
					View.showPage();
				}
				View.showCheckedInfos(resultLists);
			},
			/**
			 * [searchCheckedInfos 根据查询条件查询]
			 * @return {[type]} [description]
			 */
			searchCheckedInfos:function(){ 
				var data = View.getSelectFactor();
				var filter={
					"nid":data.nid,
					"startTime":data.startTime,
					"endTime":data.endTime,
					"manufacturer":data.manufacturer
				};
				this.page.setParams(filter).refresh();
			},
			/**
			 * [searchDetailInfos 查看详情报告渲染处理数据模板]
			 * @param  {[type]} id [description]
			 * @return {[type]}    [description]
			 */
			searchDetailInfos:function(id){
				var detailBasic = [],checkLists,checkL,detailKindInfos = [],detailInfos = [],unpassItems=0,passItems=0,
					compare = ["register-cmd","controll-cmd","history-cmd","alarm-cmd","other-cmd"];
				for(var i=0;i<searchData.length;i++){
					if(searchData[i].id === id){
						for(var j=0;j<Key.length;j++){
							if(searchData[i][Key[j]]!=void 0){
								detailBasic.push({
									title:BASICNAME[Key[j]],
									value:searchData[i][Key[j]]
								})
							}
						}
					}
				}
				//渲染基本信息
				View.showDetailBasic(detailBasic);
				Model.getSearchDetail(id).then(function(res){
					checkLists = res.data.items;
					for(var i=0;i<checkLists.length;i++){
						var detailEachInfos = [];
						for(var j =0;j<checkLists[i].childs.length;j++){
							detailEachInfos.push({
								title:NAME[checkLists[i].childs[j].method],
								name:checkLists[i].childs[j].method,
								value:STATUS[checkLists[i].childs[j].status]
							})
							if(checkLists[i].childs[j].status==="0"){
								unpassItems++;
							}else if(checkLists[i].childs[j].status==="1"){
								passItems++;
							}
						}
						detailKindInfos.push({
							kindtitle:checkLists[i].type,
							kinditems:detailEachInfos
						});
					}
					for(var i=0;i<compare.length;i++){
						for(var j=0;j<detailKindInfos.length;j++){
							if(detailKindInfos[j].kindtitle === compare[i]){
								detailInfos.push({
									kindtitle:KINDCMD[detailKindInfos[j].kindtitle],
									kinditems:detailKindInfos[j].kinditems
								})
							}
						}
					}
					//渲染报告详情
					View.showDetailReport(detailInfos);
					//渲染总结结果
					View.showResult(unpassItems,passItems);
				},function(){
					notify.warn("网络异常，请重试");
					View.NetError();
				})
			},
			/**
			 * [showMessageDetail 查看报告中查看不通过信令交互的详情]
			 * @param  {[type]} method [description]
			 * @return {[type]}        [description]
			 */
			showUnpassDetail:function(data){
				Model.getUnpassDetail(data.id,data.method).then(function(res){
					if(res && res.code===200){
						var response = JSON.parse(res.data.rsItem.response);
						if(response){
						 	View.showLookInfos(response);
						}
					}
				})
			},
			/**
			 * [deleteInfos 删除信息]
			 * @param  {[type]} data [description]
			 * @return {[type]}      [description]
			 */
			deleteInfos:function(data){
				var self = this;
				new ConfirmDialog({
					title: '提示',
					confirmText: '确定',
					message: "确定删除检测信息？",
					callback:function(){
						Model.deleteInfos(data.ids).then(function(res){
							if(res && res.code===200){
								data.deleteDom();
								self.page.refresh();
								notify.success("删除成功");
							}else{
								notify.error(res.data.message);
							}
						})
					}
				})
			},
			/**
			 * [exportDoc 导出检测报告]
			 * @param  {[type]} data [description]
			 * @return {[type]}      [description]
			 */
			exportDoc:function(data){
				var self = this;
				Model.exportDoc("fileName_"+Math.random(),data);
			}
		};
		return new Controller();
})