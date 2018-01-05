/*
模块之间的跳转控制:
云空间  ---->  图像研判
云空间  ---->  视图库
*/
define(['js/ajax-module.js',
	'js/cloud-view.js',
	'js/assist-controller.js',
	'base.self'],function(ajaxModule,VIEW,ASSIST_CONTROLLER){
	return {
		skipNum : 1,
		createRandom:function(from,to){
			var arr=[];
		    var json={};
		    while(arr.length<1)
		    {
		        //产生单个随机数
		        var ranNum=Math.ceil(Math.random()*(to-from))+from;
		        //通过判断json对象的索引值是否存在 来标记 是否重复
		        if(!json[ranNum])
		        {
		            json[ranNum]=1;
		            arr.push(ranNum);
		        }

		    }
		    return arr;
		},
		/**
		 * @name imagesjude
		 * @description 云管理跳转到图像研判图像处理
		 */
		imagesjude: function() {
			var self = this,
				id = SCOPE.dContext.id,
				fileName = SCOPE.dContext.fileName,
				fileType = SCOPE.dContext.fileType - 0,
				filePath = SCOPE.dContext.filePath,
				localPath = SCOPE.dContext.localPath,
				parentId = SCOPE.dContext.directoryId;

			var data = {
				clouds: JSON.stringify({
					cloud: [{
						id: id,
						type: fileType,
						parentId: parentId
					}]
				})
			};

			ajaxModule.postData('/service/pia/resource_cloud',data).then(function(data){
				if (data && data.code === 200) {
					// 存成功后重新拿取后端的 id
					ajaxModule.loadData("/service/pia/resource_file?cid=" + id).then(function(res){
						var passData = {
							id : res.data.id,
							cid : id,
							filePath : filePath,
							localPath : localPath || filePath,
							fileName : fileName,
							fileType : fileType,
							cloud : "cloud"
						};
						Cookie.write('imagejudgeData', JSON.stringify(passData));
						VIEW.newWindow('/module/imagejudge/resource-process/index.html?&type=1', ("singlePicProcess" + (self.createRandom(0,50)[0])));
						logDict.insertMedialog('m6', fileName + ' 在图像研判模块进行图像处理'); // 到图像研判 日志
					});
				}
			});

		},

		/**
		 * @name medialib
		 * @description 云管理跳转到视图库[入库]
		 */
		medialib: function() {
			var self = this,
				filePath = SCOPE.context.filePath || SCOPE.dContext.filePath,
				id = SCOPE.context.id || SCOPE.dContext.id,
				type = SCOPE.context.fileType - 0 || SCOPE.dContext.fileType - 0,
				shoottime = SCOPE.context.shootTime || SCOPE.dContext.shootTime,
				structuredType = (SCOPE.context.structuredType || SCOPE.dContext.structuredType) - 0,
				thumbnail = SCOPE.context.thumbnail || SCOPE.dContext.thumbnail,
				picture = SCOPE.context.picture || SCOPE.dContext.picture,
				sourceType = SCOPE.context.sourceType - 0 || SCOPE.dContext.sourceType - 0,
				sourceId = SCOPE.context.sourceId || SCOPE.dContext.sourceId,
				pvdSourceId = SCOPE.context.pvdSourceId || SCOPE.dContext.pvdSourceId,
				fileName = SCOPE.context.fileName || SCOPE.dContext.fileName,
				markPath = SCOPE.context.markPath || SCOPE.dContext.markPath,
				typeurl = ["", "video", "image"],
				beginTime = SCOPE.context.timeBegin || SCOPE.dContext.timeBegin,
				endTime = SCOPE.context.timeEnd || SCOPE.dContext.timeEnd,
				surl = ["", "person", "car", "exhibit", "scene", "move", "others"];

			var imgToViewlibsCallback = function() {
				require(["pvbEnterLib"], function(EnterLib) {
					var imgObj = {
						type: "img",
						filePath: filePath || picture,
						resourceObj: {
							fileName: fileName,
							fileDate: shoottime
						}
					};
					EnterLib.init(imgObj);
				});
			};
			var PFSVideoToViewlibsCallback = function() {
				require(["pvbEnterLib"], function(EnterLib) {
					var imgObj = {
						type: "PFS",
						filePath: filePath,
						resourceObj: {
							fileName: fileName,
							fileDate: shoottime
						}
					};
					// 显示一二级导航
					window.top.showHideNav("show");

					EnterLib.init(imgObj);
				});
			};
			var callback = function() {
				//console.log("type:", type, "sourceType:", sourceType);
				//调用PVB入库方法    2016.4.12 zhangming  begin
				//console.log("structuredType:",structuredType);
				/*var isStructureInfo = false;
				jQuery(".r-siderbar .r-li-item h6.current").data(".cat")*/
				if (structuredType) { // 结构化信息(图片、视频)入库
					if (jQuery(".bg-wrap").css("display") !== "none") { // 点开以后的详情入库
						if (sourceType === 2) { // 图片
							filePath = markPath ? markPath : (thumbnail || picture);
							imgToViewlibsCallback();
						} else { // 视频
							if (jQuery(".tab-structed-pic").hasClass("active")) { // 视频的特征片段
								filePath = markPath ? markPath : (thumbnail || picture);
								imgToViewlibsCallback();
							} else if (jQuery(".tab-structed-video").hasClass("active")) { // 视频的视频片段
								PFSVideoToViewlibsCallback();
							}
						}
					} else { // 列表处的入库
						if (sourceType === 2) { // 图片
							filePath = picture;
							imgToViewlibsCallback();
						} else if (sourceType === 1) { // 视频
							PFSVideoToViewlibsCallback();
						}
					}
				} else { // 视频、图片 包括点开后的详情入库和列表入库
					if (type === 2) { // 图片,其中包括结构化信息的图片
						imgToViewlibsCallback();
					} else if (type === 1) { //PFS视频,其中包括结构化信息的视频
						PFSVideoToViewlibsCallback();
					}
				}
			};
			callback();
		},
		/**
		 * @name analysis
		 * @param {{number}} 判断视频图片
		 * @description 云管理跳转到图像研判[视图分析]
		 */
		analysis: function(actionnum) {
			var self = this;
			fileId = SCOPE.dContext.id,
			filePath = SCOPE.dContext.filePath,
			fileName = SCOPE.dContext.fileName,
			fileType = SCOPE.dContext.fileType,
			shootTime = SCOPE.dContext.shootTime,
			localPath = SCOPE.dContext.localPath,
			parentId = SCOPE.dContext.directoryId;

			ajaxModule.loadData("/service/pcm/storage/file/" + fileId + "?fileId=" + fileId).then(function(res){
				if (res && res.code === 200) {
					var data = {
						clouds: JSON.stringify({
							cloud: [{
								id: fileId,
								type: fileType,
								parentId: parentId
							}]
						})
					};
					ajaxModule.postData("/service/pia/resource_cloud",data).then(function(datas){
						if (datas && datas.code === 200) {
							Cookie.write("import", JSON.stringify({
								"fileType": fileType,
								"path": res.data.path,
								"filePath": filePath,
								"id": fileId,
								"parentid": '',
								"shoottime": shootTime,
								"name": fileName,
								"cloud": "cloud"
							}));
							ajaxModule.loadData( "/service/pia/resource_file?cid=" + fileId).then(function(res){
								var passData = {
									id: res.data.id,
									cid: fileId,
									filePath: filePath,
									localPath: localPath || filePath,
									fileName: fileName,
									fileType: fileType,
									shootTime: shootTime,
									cloud: "cloud"
								};
								Cookie.write('imagejudgeData', JSON.stringify(passData));
								var types = 3;
								if (actionnum === 1) {
									types = 2;
								}
								VIEW.newWindow("/module/imagejudge/resource-process?type=" + types, ("singleAnalyze" + (self.createRandom(0,50)[0])));
								logDict.insertMedialog('m6', fileName + ' 视频/图片在图像研判模块进行人工标注'); // 到视图分析 日志到图像研判 日志
							});
						}
					});
				}
			});
		},
		/**
		 * @name viewIncident
		 * @description 打开新窗口跳转到视图库查看文件
		 */
		viewIncident: function() {
			var f_url = '',
				self = this,
				data = '',
				type = SCOPE.context.fileType - 0,
				pvdId = SCOPE.context.pvdId,
				markType = SCOPE.context.markType-0,/*视图库实时结构化过来的图片标志 2*/
				structuredType = SCOPE.context.structuredType - 0,
				sUrl = ["", "person.html?", "car.html?", "exhibit.html?", "scene.html?", "move.html?", "others.html?"][structuredType];
				sName = ["", "person", "car", "exhibit", "scene", "move", "others"][structuredType],
				urlSuffix = '';
			if(SCOPE.context.incidentId){
				/*与案事件相关*/
				urlSuffix = "&pagetype=caselib";
			}else{
				/*与案事件无关*/
				urlSuffix = "&pagetype=doubtlib";
			}
			if (type === 3) {
				f_url = "/module/viewlibs/details/struct/" + sUrl;
				data = "origntype="+ sName +"&id=" + pvdId + urlSuffix;
				if(markType==2){
					jQuery.ajax({
						url: "/service/pvd/realtime/isExist",
						data: {
							uuid: pvdId
						},
						type: "get",
						success: function (res) {
							var res1 = res.data;
							if (structuredType === 1) { /*人脸*/
								f_url = "/module/viewlibs/details/struct/face.html?origntype=face&id=" + pvdId + "&pagetype=doubtlib&orgid=&cameraChannelId=" + res1.cameraChannelId + "&points=" + res1.points;
							} else if (structuredType === 2) { /*车辆*/
								f_url = "/module/viewlibs/details/struct/realtime_car.html?origntype=car&sign=realtime&id=" + pvdId + "&pagetype=doubtlib&orgid=&cameraChannelId=" + res1.cameraChannelId + "&points=" + res1.points;
							} else if (structuredType === 7) { /*人体*/
								f_url = "/module/viewlibs/details/struct/body.html?origntype=body&id=" + pvdId + "&pagetype=doubtlib&orgid=&cameraChannelId=" + res1.cameraChannelId + "&points=" + res1.points;
							}
							VIEW.newWindow(f_url);

						}
					})
					return false
				}
			} else {
				switch (type) {
					case 4:
						f_url = "/module/viewlibs/details/incident/incident_detail.html?";
						data = "id=";
						break;
					case 1:
						f_url = "/module/viewlibs/details/media/video.html?";
						data = "fileType=1&id=";
						break;
					default:
						f_url = "/module/viewlibs/details/media/picture.html?";
						data = "fileType=2&id=";
						break;
				}
				data += pvdId + urlSuffix;
			}
			VIEW.newWindow(f_url + data);
			logDict.insertMedialog('m6', '查看 ' + VIEW.getTname(true),'','o4'); // 查看 日志
		},
		/**
		 * @name toMediaLib
		 * @method  of editStructuredInfo
		 * @description 抓图入库
		 */
		toMediaLib: function() {
			var data = {
				fileName: SCOPE.dContext.fileName||SCOPE.dContext.fileExtName,
				filePath: SCOPE.dContext.base64,
				shootTime: SCOPE.dContext.shootTime,
				catchTime: new Date().getTime()
			};
			ajaxModule.postData("/service/pcm/add_screenshot_to_view",data).then(function(data){
				if (data && data.code) {
					if(data.code  === 200){
						// 视频截图入新的视图库 by songxj 2016/04/11
						require(["pvbEnterLib"], function(EnterLib) {
							var imgObj = {
								type: "img",
								filePath: data.data.url,
								resourceObj:{
									fileName:SCOPE.dContext.fileName||SCOPE.dContext.fileExtName,
									fileDate:SCOPE.dContext.shootTime
								}
							};
							EnterLib.init(imgObj);
						});
						logDict.insertMedialog('m6', SCOPE.dContext.fileName + ' 截图入视图库'); // 截图入库日志
					}else{
						notify.info(data.data.message);
					}
				}else{
					notify.warn("入库失败！");
				}
			});
		},
		/*屏幕抓图后保存*/
		saveScreensPic:function(){
			ajaxModule.postData("/service/pcm/add_screenshot", {
				fileName: SCOPE.dContext.fileName || SCOPE.dContext.fileExtName,
				filePath: SCOPE.dContext.playerSnap,
				catchTime: SCOPE.dContext.nowtime,
				shootTime: SCOPE.dContext.adjustTime
			}).done(function(data) {
				if (data && data.code) {
					if (data.code === 200) {
						notify.success("保存成功！");
					} else {
						notify.info(data.data.message);
					}
				} else {
					notify.error("保存失败，请重试！");
				}
			});
		}
	};
});
