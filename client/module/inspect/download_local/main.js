define(['broadcast','/module/common/js/ocx-error-code.js','handlebars','base.self'],function(broadcast,ocxError){
	jQuery(function(){
		var Download = {
			string:{
				failIcon : '<i class="error-icon d-icon"></i>下载失败',
				successIcon : '<i class="success-icon d-icon"></i>下载完成',
				progressBar : '<span class="progress-bar-outer"><span class="progress-bar-inner"></span></span>',
				refreshIcon : '<i class="d-icon refresh-icon" title="刷新"></i>',
				menuIcon : '<i class="d-icon menu-icon"></i>',
				playIcon : '<i class="d-icon play-icon" title="继续"></i>',
				pauseIcon : '<i class="d-icon pause-icon" title="暂停"></i>',
				noIcon : '<i class="d-icon no-icon"></i>',
				html : ['<li class="d-item unknown" id="unknown">',
							'<span class="row name too-long"><i class="video-icon d-icon"></i><span class="video-name">未知录像名称</span></span>',
							'<span class="row status">',
								'<span class="progress-bar-outer">',
									'<span class="progress-bar-inner"></span>',
								'</span>',
							'</span>',
							'<span class="row rate too-long" style="width:50px;padding-left:8px;">00.00%</span>',
							'<span class="row speed too-long" style="width:80px;">初始化中...</span>',
							'<span class="row controller" style="width:100px;">',
								'<a href="javascript:void(0)" class="pause-play-refresh"><i class="d-icon pause-icon" title="暂停"></i></a>',
								'<a href="javascript:void(0)" class="folder"><i class="d-icon folder-icon" title="本地查看"></i></a>',
								'<a href="javascript:void(0)" class="close"><i class="d-icon close-icon" title="关闭"></i></a>',
							'</span>',
						'</li>'].join("")
			},
			ocx : null,
			ulList : jQuery('.d-list'),
			dataList : [],
			idList : [],
			SCOPE : {},
			init:function(){
				this.bindEvents();
				this.ocx =jQuery(".DOWNLOAD_OCX[type='applicatin/x-firebreath']")[0];
				this.ocx.SetLayout(1);
				this.ocx.EnableDES(true);
				var downloadObj =  {"rcddownload":{"splitmode":"size", "splitvalue":1024 }};
			    this.ocx.SetOption(JSON.stringify(downloadObj));
			},
			bindEvents:function(){
				var self = this;
				jQuery(document).on('click','.refresh-icon',function(e){
					e.preventDefault();
					e.stopImmediatePropagation();
					self.refresh(jQuery(this));
				});
				jQuery(document).on('click','.pause-icon',function(e){
					e.preventDefault();
					e.stopImmediatePropagation();
					self.pauseAndstart(jQuery(this));
				});
				jQuery(document).on('click','.folder-icon',function(e){
					e.preventDefault();
					e.stopImmediatePropagation();

					self.openFolder();
				});
				jQuery(document).on('click','.play-icon',function(e){
					e.preventDefault();
					e.stopImmediatePropagation();
					self.pauseAndstart(jQuery(this));
				});
				jQuery(document).on('click','.close-icon',function(e){
					e.preventDefault();
					e.stopImmediatePropagation();
					console.log("调用删除");
					self.delDownload(jQuery(this).closest("li").attr("id"));
				});
			},
			getDataById:function(id){
				/*利用id,确定dataList里面id相同的数据*/
				var self = this;
				var len = self.dataList.length;
				while(len--){
					if(self.dataList[len].id === id){
						return self.dataList[len];
					}
				}
			},
			getDataByIndex:function(index){
				/*dom列表索引,对应idList['','']里的id*/
				var self = this;
				return self.dataList[index];
			},
			dialog: function(id) {
				var self = this;
				new ConfirmDialog({
					title: '提示',
					width: 240,
					message: "任务正在下载中,关闭将丢失当前任务,您确定要关闭吗？",
					callback: function() {
						self.stopDownload(id);
						self.removeDom(id);
					}
				});
			},
			delDownload:function(id){

				/*关闭任务*/
				var self = this;
				var id = id || SCOPE.id;
				/*下载失败,下载成功才可以直接执行删除*/
				if(SCOPE.status === 'success' || SCOPE.status === 'fail'){
					self.removeDom(id);
					return ;
				}
			    this.dialog(id);
			},
			removeDom:function(id){
				console.log("移除dom对象",id);
				var self = this;
				var  id = id || SCOPE.id;
				jQuery('#' + id).fadeOut('slow',function(){
					jQuery(this).remove();
					/*移除某条下载信息后,需要跟新保存数据的变量idList,dataList*/
                    var index = self.idList.indexOf(id - 0);
                    self.idList.splice(index,1);/*删除保存的id*/
					self.dataList.splice(index,1);
					console.log("删除后的数组:",self.idList);
					console.log("删除后的dataList:",self.dataList);
					// alert("dfdfdffffffffffffffffffffffffffff");
				});
			},
			/*判断下载记录id是否存在*/
			isIdExist:function(id){
				var self = this;
			//	console.log("判断下载记录id是否存在传入的id是",id);
			//	console.log("self.idList",self.idList);
				return self.idList.indexOf(id) >= 0 ? true : false;
			},
			/*在dom上更新速率*/
			updateRate:function(id,speedRate){
				var self =  this;
				var speedValue =  speedRate/ 1000,	
					unit = "Kb/s";
				if(speedValue > 1024) {
					speedValue = (speedValue /1024).toFixed(2);
					unit = "Mb/s";
				}
				jQuery('#' + id).find('.speed').html(speedValue + unit);
			},
			updateProgress:function(id,progress){
				jQuery('#' + id).find('.progress-bar-inner').width(progress / 100 + "%");
				jQuery('#' + id).find('.rate').html(progress / 100 + "%");
			},
			pauseIcon:function(id){
				var self = this;
				jQuery('#' + id).find('.pause-play-refresh').html(self.string.pauseIcon);
			},
			refreshIcon:function(id){
				var self = this;
				jQuery('#' + id).find('.pause-play-refresh').html(self.string.refreshIcon);
			},
			playIcon:function(id){
				var self = this;
				jQuery('#' + id).find('.pause-play-refresh').html(self.string.playIcon);
			},
			noIcon:function(id){
				var self = this;
				jQuery('#' + id).find('.pause-play-refresh').html(self.string.noIcon);
			},
			successIcon:function(id){
				var self = this;
				var filePath = self.getDataById(id).filePath;
				jQuery("#" +id).find('.status').html(self.string.successIcon).end().find('.speed').html(filePath).attr('title',filePath);
			},
			failIcon:function(id){
				var self = this;
				jQuery("#" + id).find('.status').html(self.string.failIcon);
				jQuery('#' + id).find('.speed').html(self.getDataById(id).filePath);
			},
			render : function(id){
				console.log("插入一条记录的id是"+id);
				var self =  this;
				var data = self.getDataById(id);
				/*倒叙*/
				self.ulList.prepend(self.string.html);
				jQuery('.d-item.unknown').attr('id',id).removeClass('unknown')
					.find('.video-name').html(data.fileName)
					.attr('title',data.fileName);
				/*择取数据*/
				jQuery("#" + id).hover(function() {
					/*这里方便针对某条列表做鼠标点击的操作事,方便获取这条dom对应的数据,保存在全局的SCOPE中*/
					SCOPE = self.getDataByIndex(jQuery(this).index());
					SCOPE.index = jQuery(this).index();
					console.log("全局scope",SCOPE);
				});
			},
			updataDownloadStatus:function(id,status){
				var self = this;
				/*资源下载状态更新到dataList中的status*/
				self.getDataById(id).status = status;
			},
			refresh:function($dom){
				/*此条下载记录失败才需要执行刷新,刷新是重新建立下载*/
				var self = this;
				var id = $dom.closest('li.d-item').attr("id") - 0;
				var index = self.idList.indexOf(id);
				var data = self.dataList[index].playData;
				var fileName =self.dataList[index].fileName;
				var path =self.dataList[index].folderPath;
				$dom.closest('li.d-item').remove();
				/*执行刷新的时候,传递了当前任务的索引id*/
				/*这里fileName传递了全路径*/
				self.triggerDownload(JSON.stringify(data),fileName,path,Number(index));
			},
			/*下载进度回调*/
			progressCallback : function(id,progress,progressParam){
			//	console.log("id="+id+"progress="+progress+"progressParam="+progressParam);

				var self = this;
				if(progressParam !== 0 ){
					/*执行了刷新并传递了被刷新任务所在列表的索引*/
					console.log("执行了刷新并传递了被刷新任务所在列表的索引",progressParam);
					var oldId = self.idList[progressParam];
					jQuery('#' + oldId).attr('id',id);
					/*更新数据*/
					self.idList.splice(progressParam,1,id);
					
					self.dataList.splice(progressParam,1,{"id":id,"playData":self.curData,"filePath":self.curFilePath,"fileName":self.curfileName,"folderPath":self.curPath});
				}

				/*判断是否已经存在了id,如果没有,保存到idList,dataList增加新的dom*/
				if(!self.isIdExist(id)){
					console.log("开始插入一条数据，插入的id="+id);
					/*倒叙*/
					self.idList.unshift(id);
					self.dataList.unshift({"id":id,"playData":self.curData,"filePath":self.curFilePath,"fileName":self.curfileName,"folderPath":self.curPath});
					self.render(id);
				}

				if(progress === 10000){
					/*下载完成*/
					self.successIcon(id);
					self.updataDownloadStatus(id,'success');
					self.noIcon(id);/*暂时这里不显示任何icon*/
				}
			//	console.log("录像下载回调的进度数据:", progress);
				if(progress < 0){
					/*下载失败*/
					console.log("-------------下载失败--------------");
					self.failIcon(id);
					self.refreshIcon(id);
					self.updataDownloadStatus(id,'fail');
				}
				/*更新dom进度条状态*/
				self.updateProgress(id,progress);
			},
			/*速率回调*/
			speedRateCallback : function(id,speedRate,speedRateParam){
				var self = this;
			//	console.log("这是速率回调，执行isIdExist");
				if(self.isIdExist(id)){
					self.updateRate(id,speedRate);
				}
			},
			/*触发下载,dataString:录像参数;fileName:文件名,path:存储路径,index默认为0 ,如果是刷新则传递被刷新资源所在列表的索引*/
			triggerDownload:function(dataString,fileName,path,index){
			//	console.log("triggerDownload",dataString,fileName,path,index);
				var self = this;
				self.curData = JSON.parse(dataString);/*播放参数*/
				self.curPath = path;/*用于设置文件保存路径.不同于curFilePath,curFilePath带有文件名的全路径地址*/
				index = index || 0;
				/*避免刷新时重复变名称*/
				if(index === 0){
					/*给视频名称附带时间段*/
					self.curfileName = fileName + "[" + self.curData.beginTime.replace(/:/g,'-').replace(/.000/g,'') + '-' + self.curData.endTime.replace(/:/g,'-').replace(/.000/g,'') + "]";
					/*添加视频后缀*/
					self.curfileName = self.curfileName + ".mbf";
				}else{
					/*如果是一个刷新,fileName就是一个全路径*/
					self.curfileName = fileName;
				}

				/*设置资源存储路径*/
				/*SetDownloadRecordDirectory 这里的参数path是文件路径,不同于 StartDownLoadRecordEx*/
				var lrd = this.ocx.SetDownloadRecordDirectory(path);
                
				/*进度回调*/
				var progressCallback = function(a,b,c){
					self.progressCallback(a,b,c);
				};
				/*速率回调*/
				var speedRateCallback = function(a,b,c){
					self.speedRateCallback(a,b,c);
				};

				var downloadParam = JSON.parse(dataString);
				//是否在下载历史录像的播放画面上叠加水印功能
				if (window.downHisocxWaterMark) {
					var userInfo = "",
						ip = [];
					if (localStorage.getItem("userInfo")) {
						userInfo = JSON.parse(localStorage.getItem("userInfo")).loginName;
					}
					if (localStorage.getItem("uOrgInfo")) {
						userInfo = userInfo + " " + JSON.parse(localStorage.getItem("uOrgInfo")).orgName;
					}
					//获取客户端ip
					ip = JSON.parse(this.ocx.GetMacString());
					
					userInfo = userInfo + " " + ip[0].ip + " " + downloadParam.beginTime;

					var textosd = {
						"x": 0.05, //范围值：0-1
						"y": 0.15, //范围值：0-1
						"text": userInfo,
						"fontfamily": "微软雅黑",
						"autocolor": 1,
						//"fontcolor": 255, //BGR
						//"backcolor": 0,
						"fontsize": 0.5, //范围值：0-1
						"alignment": 1 //1:左对齐、2：右对齐
					};
					downloadParam.textosd = JSON.stringify(textosd);
				}
				delete downloadParam.fileName;
				/*StartDownLoadRecordEx  开始下载*/
				var ans = this.ocx.StartDownLoadRecordEx(JSON.stringify(downloadParam),self.curfileName,progressCallback,index,speedRateCallback,0);

				ans = JSON.parse(ans.replace(/\\/g,'/'));

				self.curFilePath = ans.path;/*StartDownLoadRecordEx 返回的存储全路径*/

				if(ans.id && ans.id > 0){
					jQuery('.notes').remove();
				}else{
				//	console.log("ans",ans);
				//	下载失败时重新下载
					console.log("下载失败时重新下载");
					var cameraInfo = Object.clone(downloadParam);
					var result = this.ocx.StartDownLoadRecordEx(JSON.stringify(cameraInfo), self.curfileName, progressCallback, index, speedRateCallback, 0);
					result = JSON.parse(result.replace(/\\/g, '/'));
					if (result.id && result.id > 0) {
						jQuery('.notes').remove();
					} else {
						notify.info("下载失败! " + ocxError(result.id));
						jQuery('.notes').html(ocxError(result.id));
					}
					
				}
			},
			pauseAndstart: function(dom) {
				var self = this,
				//	$curIcon = jQuery(".d-item[id='" + SCOPE.id + "']").find(".pause-play-refresh .d-icon"),
				    $curIcon = dom.closest('li.d-item').find(".pause-play-refresh .d-icon"),
					key = false;
				var id = dom.closest('li.d-item').attr("id") - 0;
				console.log("执行暂停或者开始方法id=",id);	
				if ($curIcon.hasClass("pause-icon")) {
					key = true;
					//暂停，显示播放图标
					self.playIcon(id);
				}
				if ($curIcon.hasClass("play-icon")) {
					key = false;
					//继续，显示暂停图标
					self.pauseIcon(id);
				}
				/*执行暂停/开始*/
				self.ocx.PauseDownLoadRecord(id, key);
			},
			openFolderDlg:function(){
				/*打开指定路径的文件夹*/
				var ans = this.ocx.OpenLocalSelectFolderDlg(SCOPE.filePath);
				return (ans === 0) ? true : false;
			},
			openFolder:function(){
				console.log(SCOPE.filePath);
				var ans = this.ocx.OpenContainsFileDirectory(SCOPE.filePath);
				return (ans === 0) ? true : false;
			},
			stopDownload:function(id){
				console.log("ocx删除id",id);
				var self = this;
				var   id = id || SCOPE.id;
				/*停止录像下载*/
				var ans = this.ocx.StopDownLoadRecord(id);
				jQuery('#' + id).find('.pause').html(self.string.playIcon);
			}
		};
		Download.init();
		window.SCOPE = null;
		//window.Download = Download;
		/*小窗口关闭时,清空父窗口winDownload对象*/
		if(JudgeChromeX()===false){
			window.onbeforeunload = function(){
				return "关闭将丢失下载内容!";
			};
		}
		
		window.onunload = function(){
			window.opener.winDownload = null;
		};	

		window.dataList = Download.dataList;
		window.idList = Download.idList;
		window.localStorage.setItem('DWONLOAD_LOCAL_LIST',JSON.stringify({'dataList':Download.dataList}));

		/*监听下载事件*/
		broadcast.on('triggerDownload',function(data){
			Download.triggerDownload(unescape(data.playData),data.fileName,unescape(data.path));
		});
		window.broadcastRegisterDone = true;
	});
});

