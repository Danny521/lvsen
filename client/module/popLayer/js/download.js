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

			  	jQuery(document).on('click','.open-folder',function(){
			  		if(download.authority){
				  		var path = self.openFolder('');
				  		if(path !== ''){
					  		jQuery('#path').val(path).attr('title',path);
					  		self.defaultFolder = path;
				  		}
			  		}else{
			  			notify.info("提示 : 检测到计算机限制自定义存储路径,请直接点击确定按钮进行下载!");
			  		}
			  	});
		  	},
		  	hasTask : function(playData){
		  		/*任务有没有在执行*/
				var self = this;
				var len = winDownload.dataList.length;
				if(len <= 0){return false;}
				playData = JSON.parse(playData);
				for(var i = 0;i < len; i++){
					var n = winDownload.dataList[i].playData;
					if(playData.path === n.path && playData.beginTime === n.beginTime && playData.endTime === n.endTime){
						return true;
					}else{
						continue;
					}
				}
				return false;
			},
			setDownload : function(data,fileName,path){
				console.log(data)
				var self = this;
				if(winDownload && winDownload.document){
					/*winDownload小窗口存在*/
					//判断资源是否存在下载列表中
					if(!self.hasTask(data)){
						//执行下载
						setTimeout(function(){
							broadcast.emit('triggerDownload',{'playData':escape(data),'fileName':fileName,'path':escape(path),_:Math.random()});
						},1000)
					}else{
						notify.info("任务已经存在下载列表中!");
					};
				} else {
					/*不存在,打开小窗口*/
					winDownload = window.open('/module/inspect/download_local/download.html','winDownload',self.options);
					//开始下载内容
					setTimeout(function(){
						broadcast.emit('triggerDownload',{'playData':escape(data),'fileName':fileName,'path':escape(path),_:Math.random()});
					},1200);
				}
			},
			openFolder:function(defaultFolder){
				return this.ocx.OpenLocalSelectFolderDlg(defaultFolder);
			},
			getDefaultFolder:function(){
				/*返回ocx设置的默认存储路径*/
				return this.ocx.GetDownloadRecordDirectory();
			},
			addClass:function(){
				var self = this;
				jQuery('head').append('<link rel="stylesheet" href="' + self.style +'">');
			}
		};

		download.init();

		function startDownload (data,fileName,ocxDom){
			if(typeof(data)=="object"){
				data=JSON.stringify(data);
			}
			/*
			data:播放参数json字符串
			fileName:视频文件名
			*/
			download.ocx = ocxDom || download.ocx;
			/*检测用户电脑有没有让ocx随意写入的文件的权限,0:没有  1：没有*/
			download.authority =  download.ocx.IsDownloadDirectorySettable() === 1;
			var dialogContent = '<div id="download-local"><p style=""><label>文件名:</label><input type="text" id="fileName" value="'
					+ fileName +
					'"></p><p><label>存储路径:</label><input type="text" title="' + download.getDefaultFolder() + '" id="path" readonly value="' + download.getDefaultFolder() + '"><i class="folder-icon open-folder"></i></p></div>';
			var dialog = new ConfirmDialog({
				title: '录像下载',
				width: 400,
				message: dialogContent,
				callback: function(){
					var dialogBody = dialog.getBody();
					var fileName = dialogBody.find('#fileName').val().trim();
					var path = dialogBody.find('#path').val().trim();
					if (fileName == '' || fileName.length === 0) {
						notify.warn('请输入文件名!');
						return false;
					} else if(fileName.length > 15){
						notify.warn('文件名太长，请重新输入，不要超过15个字');
						return false;
					}
					download.setDownload(data,fileName,path);
				}
			});
		}
		return startDownload;
});
