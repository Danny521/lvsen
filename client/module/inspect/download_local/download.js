define(['broadcast','base.self'],function(broadcast){
		window.winDownload = null;
		var download = {
			/*加载一点样式*/
			style:'/module/inspect/download_local/main.css',
			/*默认存储路径*/
			//defaultFolder:'C:\\Program Files (x86)\\NetPosa\\NP PVA Plugins',
		  	init:function(){
		  		var self = this;
		  		this.addClass();
				this.w = $(window).width();
			  	this.h = $(window).height();
			  	this.x = self.w - 620;
			  	this.y = self.h - 420;
			  	this.options = 'left='+self.x+',top='+self.y+',width=600,height=400,toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no,depended=yes';
			  	this.ocx = jQuery('#UIOCX')[0];

			  	jQuery(document).off("click",'.open-folder').on('click','.open-folder',function() {
					if (download.authority) {
						var path = self.openFolder('');
						if (path !== '') {
							jQuery('#path').val(path).attr('title', path);
							self.defaultFolder = path;
						}
					} else {
						notify.info("提示 : 检测到计算机限制自定义存储路径,请直接点击确定按钮进行下载!");
					}
				});
		  	},
		  	hasTask : function(playData){
		  		/*任务有没有在执行*/
				var self = this,
				    len = 0;
				if(winDownload.dataList){
					 len = winDownload.dataList.length;
				}
				if(len <= 0){return false;}
				playData = JSON.parse(playData);
				for(var i = 0;i < len; i++){
					var n = winDownload.dataList[i].playData;
					if(playData.port === n.port && playData.ip === n.ip && playData.path === n.path && playData.beginTime === n.beginTime && playData.endTime === n.endTime){
						return true;
					}else{
						continue;
					}
				}
				return false;
			},
			setDownload : function(data,fileName,path){
				var self = this;
				//日志记录，下载XX摄像机视频到本地,add by wujingwen, 2015.08.31
				var playData  = JSON.parse(data);
				var startTime = Toolkit.mills2datetime(playData.beginTime);
				var endTime = Toolkit.mills2datetime(playData.endTime);
				if (location.href.indexOf("dispatch") >= 0) {
					logDict.insertMedialog("m1", "下载" + fileName + "摄像机历史视频到本地" + startTime + "--" + endTime, "f2");
				} else {
					logDict.insertMedialog("m1", "下载" + fileName + "摄像机历史视频到本地" + startTime + "--" + endTime, "f1");
				}
				if(winDownload && winDownload.document){
					/*winDownload小窗口存在*/
					//判断资源是否存在下载列表中
					if(!self.hasTask(data)){
						//执行下载
						broadcast.emit('triggerDownload',{'playData':escape(data),'fileName':fileName,'path':escape(path),_:Math.random()});
					}else{
						notify.info("任务已经存在下载列表中!");
					}
				} 
			},
			openFolder:function(defaultFolder){
				return this.ocx.OpenLocalSelectFolderDlg(defaultFolder);
			},
			getDefaultFolder:function(){
				/*返回ocx设置的默认存储路径*/
				var path = Cookie.read("downloadToLocalPath");
				if (path) {
					return path;
				} else {
					return this.ocx.GetDownloadRecordDirectory();
				}
			},
			addClass:function(){
				var self = this;
				jQuery('head').append('<link rel="stylesheet" href="' + self.style +'">');
			}
		};
		function mutilDownLoad(data, fileName, ocxDom) {
			//debugger
			/*
			data:改编自老胡，data为数组
			fileName:视频文件名
			*/
			var self = this;
			download.ocx = ocxDom || download.ocx;
			/*检测用户电脑有没有让ocx随意写入的文件的权限,0:没有  1：没有*/
			download.authority = download.ocx.IsDownloadDirectorySettable() === 1;
			var dt = data;
			console.log(dt,"=======");
			var dialogContent = '<div id="download-local"><p style="display:none;"><label>文件名:</label><input type="text" id="fileName" value="' + fileName +
				'"></p><p><label>存储路径:</label><input type="text" title="' + download.getDefaultFolder() + '" id="path" value="' + download.getDefaultFolder() + '"><i class="folder-icon open-folder"></i></p></div>';
			var dialog = new ConfirmDialog({
				title: '录像下载',
				width: 400,
				message: dialogContent,
				callback: function() {
					var dialogBody = dialog.getBody();
					var path = dialogBody.find('#path').val().trim();
					if (!path) {
						notify.warn("请选择存储路径");
						return;
					}
					Cookie.write("downloadToLocalPath", path, {
						duration: 365000
					});
					//window.winDownload = null;
					if(!window.winDownload){
						winDownload = window.open('/module/inspect/download_local/download.html','winDownload',download.options);
					}
					var timer = setInterval(function(){
						if(winDownload.broadcastRegisterDone){
							clearInterval(timer);
							for (var i = 0; i <= dt.length - 1; i++) {
								(function(k) {
									var fname = dt[k].fileName;
									delete dt[k].cameraId;
									var ele = JSON.stringify(dt[k]);
									setTimeout(function() {
										console.log("第"+(k+1)+"次");
										download.setDownload(ele, fname, path);
									}, k * 1000);
								})(i);
							}
						}
					},500);
				}
			});
		}
		function startDownload (data, fileName, player, type){
			download.init();
			if(type == "mutilDownLoad") {
				//批量下载时，传递的本身就是ocx的DOM对象
				mutilDownLoad(data, fileName, player);
				return;
			}
			if(typeof(data) == "object") {
				data = JSON.stringify(data);
			}
			/*
			data:播放参数json字符串
			fileName:视频文件名
			*/
			download.ocx = player.playerObj || download.ocx;
			/*检测用户电脑有没有让ocx随意写入的文件的权限,0:没有  1：没有*/
			download.authority = download.ocx.IsDownloadDirectorySettable() === 1;
			var dialogContent = '<div id="download-local"><p style=""><label>文件名:</label><input type="text" id="fileName" value="' + fileName + '"></p><p><label>存储路径:</label><input type="text" title="' + download.getDefaultFolder() + '" id="path" value="' + download.getDefaultFolder() + '"><i class="folder-icon open-folder"></i></p></div>';
			var dialog = new ConfirmDialog({
				title: '录像下载',
				width: 400,
				message: dialogContent,
				callback: function() {
					var dialogBody = dialog.getBody();
					var fileName = dialogBody.find('#fileName').val().trim();
					var path = dialogBody.find('#path').val().trim();
					if (fileName === '' || fileName.length === 0) {
						notify.warn('请输入文件名!');
						return false;
					} else if (fileName.length > 60) {
						notify.warn('文件名太长，请重新输入，不要超过60个字');
						return false;
					}
					if (!path) {
						notify.warn("请选择存储路径");
						return false;
					}
					Cookie.write("downloadToLocalPath", path, {
						duration: 365000
					});
					//window.winDownload = null;
					if (!window.winDownload) {
						winDownload = window.open('/module/inspect/download_local/download.html', 'winDownload', download.options);
					}
					
					var timer = setInterval(function(){
						if(winDownload.broadcastRegisterDone){
							clearInterval(timer);
							download.setDownload(data, fileName, path);
						}
					},500);
					//显示历史查询面板
					window.showHidedHistoryPanel();
				}
			});
			//绑定弹出窗的关闭事件
			dialog.addEvent("CommonEvents.HIDE", function() {
				//显示历史查询面板
				window.showHidedHistoryPanel();
			});
		}
		return startDownload;
});
