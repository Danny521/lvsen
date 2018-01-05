define(['ajaxModel'], function(ajaxModel) {
	var IncidentModel = function(){};

	IncidentModel.prototype = {
		urls: {
			GET_INCIDENT_INFO: '/service/pvd/get_incident_info',
			COMMIT_URL: '/service/pvd/audit_incident_info',
			DELETE_URL: '/service/pvd/delete_incident_info',
			INCIDENT_DICTIONARY: '/module/viewlibs/caselib/inc/incident.json',
			LIST_VIDEOS: '/service/pvd/get_incident_videos',
			LIST_IMAGES: '/service/pvd/get_incident_images',
			GET_OPERATE_RECORD: '/service/pvd/incident/operator/record/',
			SAVE_TO_CLOUND:'/service/pvd/pvd_incident_pcm',	//	保存到云端
			IS_IN_CLOUND:'/service/pvd/incident_exist'	//	检测之前是否已保存过
		},
		/*initialize: function(){
			this.params = this.getParams();
			this.hlight = location.href.split('?')[0].split('/').getLast();
			console.log(this.params.id);
			var a = this.getIncidentInfo(this.params.id);
			console.log(a);
			return a;
		},*/
		// 从url取参数
		getParams: function(params){
			var params = params;
			if(location.href.test("id=")){
				params = location.href;
			}
			return {
				id: Toolkit.paramOfUrl(params).id,
				incidentname: Toolkit.paramOfUrl(params).incidentname || '',
				pagetype: Toolkit.paramOfUrl(params).pagetype,
				orgid: Toolkit.paramOfUrl(params).orgid && Toolkit.paramOfUrl(params).orgid !== '#' ? Toolkit.paramOfUrl(params).orgid : ''
			};
		},
		//检测是否已保存到云空间
		checkXhr:function(id,success,error){
			ajaxModel.getData(this.urls.IS_IN_CLOUND + "/" + id, {}, {async:false}).then(success,error);
		},
		// 获取案事件详情信息
		getIncidentInfo: function(id,success,error){
			var self = this,
				rs = 0;
				self.params = self.getParams(),
				orgId = self.params.orgid;
			if(self.params.pagetype !== "workbench"){
				rs = 1;
			}
			if(orgId==="undefined"){
				orgId = "";
			}
			ajaxModel.getData(self.urls.GET_INCIDENT_INFO,{
					id: id,
					orgId: orgId, // 组织机构id
					rs: rs
			},{async:false}).then(success,error);
			/*var checkXhr = ajaxModel.getData(self.urls.IS_IN_CLOUND + "/" + id, {}, {async:false}).then(function(res){
				if (res.code === 200) {
					console.log(res.data.flag)
					return res.data.flag;
				}
			});
			console.log(checkXhr);
			ajaxModel.getData(self.urls.GET_INCIDENT_INFO,{
					id: id,
					orgId: self.params.orgid, // 组织机构id
					rs: rs
				},{async:false}).then(function(res){
   				if (res.code === 200) {
					incident = res.data.incident;
					//incident.inClound = checkXhr;
					logDict.insertMedialog('m4','查看 ' + incident.name + ' 案事件');
					console.log(incident);
					return incident;
				}
			});*/
		},

		//展示关联的视频列表
		listVideo: function(success,error){
			var self = this;
			var orgid = self.params.orgid;
			ajaxModel.getData(this.urls.LIST_VIDEOS,{
					id: self.params.id,
					orgId: orgid,
					pageNo: 1,
					pageSize: 6
				},{},{async:false}).then(success,error);
		},
		//删除案事件
		deleteIncident: function(id){
			var self = this;
			jQuery.ajax({
				url: this.urls.DELETE_URL,
				data: {
					id: id
				},
				cache: false,
				type: 'POST',
				success: function(res){
					if(res.code == 200){
						notify.success('删除成功');
						
						var name = jQuery('#incidentName').text();
						logDict.insertMedialog('m4','删除 ' + name + ' 案事件表单', "", "o3");

						setTimeout(function(){
							window.location.href = "/module/viewlibs/" + self.params.pagetype + "/index.html";
						},2000);
					}else{
						notify.warn('操作异常，请重试');
					}
				},
				error: function(){
					notify.warn('网络异常');
				}
			});
		},

		// 审核案事件 (包括 提交、打回、通过)  TODO任务分发
		verifyIncident: function(id, status){
			var self = this;
			var auditInfo = jQuery('.common-dialog.incident .audit-info').val();
			jQuery.ajax({
				url: this.urls.COMMIT_URL,
				data: {
					id: id,
					status: status,
					auditInfo: auditInfo
				},
				cache: false,
				type: 'POST',
				success: function(res){
					if(res.code == 200){
						notify.success('操作成功');
						if(status === 2){
							logDict.insertMedialog('m4','提交 ' + self.params.incidentname + ' 案事件');
						}else if(status === 4){
							logDict.insertMedialog('m4','审核 ' + self.params.incidentname + ' 案事件');
						}else if(status === 3){
							logDict.insertMedialog('m4','打回 ' + self.params.incidentname + ' 案事件');
							var workbenchActive = '{"viewlibs":"workbench"}';
								localStorage.setItem("activeMenu",workbenchActive);
							parent.jQuery('.workbench[data-id="14"]').addClass("active").siblings().removeClass("active");
						}
						setTimeout(function(){
							if(status === 4){
								var locationStr = location.href.replace("/3-5?","/3-6?");
								if(location.href.match("/index?")){
									locationStr = location.href.replace("/index?","/3-6?");
								}
								locationStr = locationStr.replace("pagetype=workbench","pagetype=caselib");
								var workbenchActive = '{"viewlibs":"caselib"}';
								localStorage.setItem("activeMenu",workbenchActive);
								window.location.href = locationStr;
								parent.jQuery('.caselib[data-id="15"]').addClass("active").siblings().removeClass("active");
							}else{
								window.location.reload();
							}
							
						},2000);
					}else{
						notify.warn('操作异常，请重试');
					}
				},
				error: function(){
					notify.warn('网络异常');
				}
			});
		},
		
		trackType: function(type) {
			var result;
			switch (type) {
				case 'car':
					result = '车辆';
					break;
				case 'person':
					result = '人员';
					break;
				case 'scene':
					result = '场景';
					break;
				case 'exhibit':
					result = '物品';
					break;
				case 'moving':
					result = '运动目标';
					break;
				case 'rest':
					result = '其他';
					break;
				default:
			}
			return result;
		},
		
		mergeStr: function(obj){
			var str = '';
			var j = obj.length;
			for(var i=0;i<j;i++){
				if(obj[i] && obj[i] !== "暂未填写"){
					str = str + obj[i] + '，';
				}
			}
			str = str.substr(0, str.length - 1);
			return str;
		},
		translateData: function(){
			var self = this;
			ajaxModel.getData('/module/viewlibs/common/structkey.json', null, {
				async: false
			}).then(function(data) {
				self.SK = data;
			});
		},
		trlSceneT: function(){
			var self = this;
			ajaxModel.getData('/module/viewlibs/json/scene_u.json', null, {
				async: false
			}).then(function(data) {
				self.ST = data;
			});
		},
		
		trackKeyType: function(data) {
			var self = this;
			self.translateData();
			self.trlSceneT();
			var result;
			switch (data.name) {
				case 'car':
					var cardata = [data.licenseNumber,self.SK.licenseType[data.licenseType],self.SK.carColor[data.carColor]];
					result = self.mergeStr(cardata) ? self.mergeStr(cardata):'车辆';
					break;
				case 'person':
					var persondata = [data.personName,self.SK.gender[data.gender],self.SK.jacketColor[data.jacketColor],self.SK.trousersColor[data.trousersColor]];
					result = self.mergeStr(persondata) ? self.mergeStr(persondata):'人员';
					break;
				case 'scene':
					var scenedata = [self.ST[data.categoryMain]?self.ST[data.categoryMain][0]:'', self.ST[data.subcategoryMain]?self.ST[data.subcategoryMain][0]:'',self.SK.weather[data.weather]];
					result = self.mergeStr(scenedata) ? self.mergeStr(scenedata):'场景';
					break;
				case 'exhibit':
					var exhibitdata = [data.exhibitName,data.exhibitShape,self.SK.exhibitColor[data.exhibitColor]];
					result = self.mergeStr(exhibitdata) ? self.mergeStr(exhibitdata):'物品';
					break;
				case 'moving':
					var movingdata = [self.SK.movingObjectType[data.movingObjectType],self.SK.movingObjectColor[data.movingObjectColor],data.movingObjectHeight,self.SK.movingObjectGray[data.movingObjectGray]];
					result = self.mergeStr(movingdata) ? self.mergeStr(movingdata):'运动目标';
					break;
				case 'rest':
					result = data.restName ? data.restName : '其他';
					break;
				default:
			}
			return result;
		},

		// 返回面包屑类型
		getCrumbsType: function(){
			switch(this.hlight){
				case '3-5':
					return '我的工作台';
				case '3-6':
					return '案事件信息库';
				case '3-21':
					return '疑情信息库';
				case '3-22':
					return '人员信息库';
				case '3-23':
					return '车辆信息库';
				default:
					return '我的工作台';
			}
		},

		confirm: function(message, callback){
			new ConfirmDialog({
				title: '提示',
				message: '<h3>' + message + '</h3>',
				callback: callback
			});
		},
		// 分页
		setPagination: function(total, selector, itemsPerPage, callback) {
			jQuery(selector).pagination(total, {
				items_per_page: itemsPerPage,
				num_display_entries: 6,
				num_edge_entries: 0,
				show_cur_all: true,
				callback: function(pageIndex, jq) {
					callback(pageIndex + 1);
				}
			});
		},
		//分页获取内容
		nextPageList: function(pageIndex,success){
			ajaxModel.getData(this.urls.LIST_VIDEOS, {id: this.params.id,
				orgId: this.params.orgid,
				pageNo: pageIndex,
				pageSize: 6
			}, {async:false}).then(success);
		},
		// 显示案事件操作记录
		showRecord: function(data) {
			// 请求模板
			jQuery.get('/module/viewlibs/caselib/inc/tpl_operate_record.html', function(source) {
				var template = Handlebars.compile(source);
				// 模板渲染
				jQuery('#notes > .views .operate > ul').html(template(data));

				jQuery('#notes > .views .operate > ul li').last().addClass('last');
			});
		},
		// 获取案事件的操作记录
		/**@param: id案事件id*/
		getRecord: function(params){ 
			var self = this;
			jQuery.ajax({
				url: self.urls.GET_OPERATE_RECORD + params.id,
				data: {
					orgId: params.orgid,
					current_page: 1,
					page_size: 6
				},
				type: 'GET',
				cache: false,
				success: function(res){
					if(res.code === 200){
						// 下面setPagination中回调函数会立即执行， 导致数据查询了两遍
						self.setPagination(res.data.totals, '.pagebar.operate', 6, function(nextPage){
							jQuery.ajax({
								url: self.urls.GET_OPERATE_RECORD + params.id,
								type: "get",
								cache: false,
								data: {
									orgId: params.orgid,
									current_page: nextPage,
									page_size: 6
								},
								dataType: 'json',
								success: function(res) {
									if (res.code === 200) {
										var data = res.data.records;
										self.showRecord(res.data);				
									} else {
										notify.warn("网络异常！");
									}
								}
							});
						});
					}
				},
				error: function(){
					notify.warn('网络错误');
				}
			});
		},
		/**
		 *  检测是否上传过
		 */
		checkPushed:function(params){
			jQuery.ajax({
				url: '/pvd/incidentissyn/'+ params.id,
				type: 'POST',
				dataType: 'json',
				data: params,
				success: function(res) {
					if(res.code === 200){
						if(res.data.flag === true){
							jQuery("#pushIncident").remove();
						}
					}
				}
			});

		},

		/**
		 *  取回案事件（已通过案事件取回）
		 */
		recaptionInc: function(id){
			var regStr = /id\=[A-Za-z0-9]+/;
			jQuery.ajax({
				url: '/service/pvd/incident/back',
				type: 'POST',
				dataType: 'json',
				data: {id:id},
				beforeSend: function(){
					jQuery("#recaption").prop("disabled",true);
					jQuery("#recaption").addClass("disable");
				},
				success: function(res) {
					if(res.code === 200){
						jQuery("#recaption").prop("disabled",true);
						jQuery("#recaption").addClass("disable");
						jQuery("#recaption").html("已取回");
						//修改取回后二级导航高亮显示			
						var workbenchActive = '{"viewlibs":"workbench"}';
						localStorage.setItem("activeMenu",workbenchActive);
						var tempObj = Toolkit.paramOfUrl(location.href),
							locationNow = location.href.replace(regStr,"id="+res.data.id);
						locationNow = "/module/viewlibs/details/incident/incident_detail.html?pagetype=workbench&id="+res.data.id+"&incidentname="+tempObj.incidentname+"&orgid="+(tempObj.orgid?tempObj.orgid:'');
						window.location.href = locationNow;
						parent.jQuery('.workbench[data-id="14"]').addClass("active").siblings().removeClass("active");
					}else{
						notify.warn(res.data.message);
					}
				}
			});
		},
		/**
		 *  检测是否同步过(暂不使用，可能以后会用)
		 */
		checkPulled:function(params){
			jQuery.ajax({
				url: '/pvd/incidentissyn/'+ params.id,
				type: 'POST',
				dataType: 'json',
				data: params,
				success: function(res) {
					if(res.code === 200){
						if(res.data.flag === true){
							jQuery("#pullIncident").remove();
						}
					}
				}
			});
		},

		/**
		 * (暂不使用，可能以后会用)
		 * uploadIncident 上传案事件到上一级
		 * @return {void} 
		 */
		pushIncident:function(params,el){
			jQuery.ajax({
				url: '/pvd/push/incident/'+ params.id,
				type: 'POST',
				dataType: 'json',
				data: params,
				beforeSend:function(){
					jQuery("#pushIncident").prop("disabled",true);
				},
				success: function(res) {
					if(res.code === 200){
						el.remove();
						notify.success("案事件上传成功！");
						logDict.insertMedialog('m4','上传' + jQuery("#incidentName").text() + '案事件');
					}else{
						notify.error("案事件上传失败！");
					}
				},
				complete:function  () {
					jQuery("#pushIncident").prop("disabled",false);
				}
			});
			
		},
		/**
		 * pushIncident 拉取下级案事件
		 * @param  {object} params 要发送的参数
		 * @param  {Element} el     拉取按钮
		 * @return {void}       
		 */
		pullIncident:function(params,el){
			jQuery.ajax({
				url: '/service/pvd/pull/incident/'+ params.id,
				type: 'POST',
				dataType: 'json',
				data: params,
				beforeSend:function(){
					jQuery("#pullIncident").prop("disabled",true);
				},
				success: function(res) {
					if(res.code === 200){
						el.remove();
						notify.success("案事件同步成功！");
						logDict.insertMedialog('m4','同步' + jQuery("#incidentName").text() + '案事件');
					}else{
						notify.error("案事件同步失败！");
					}
				},
				complete:function  () {
					jQuery("#pullIncident").prop("disabled",false);
				}
			});
			
		},

		// 获取主评论列表
		getComments: function(id, callback){
			var self = this;
			jQuery.ajax({
				url: '/service/pvd/comment/lists/' + id,
				type: 'GET',
				cache: false,
				data: {
					orgId: self.params.orgid,
					page_size: 6,
					current_page: 1
				},
				success: function(res){
					if(res.code === 200){
						self.setPagination(res.data.totals, '.pagebar.comment', 6, function(nextPage){
							jQuery.ajax({
								url: '/service/pvd/comment/lists/' + id,
								type: "GET",
								cache: false,
								data: {
									orgId: self.params.orgid,
									current_page: nextPage,
									page_size: 6
								},
								dataType: 'json',
								success: callback
							});
						});
					}
				}
			});
		},

		/* 获取回复列表 
		 * @id:顶层评论标识
		*/
		getReplyList: function(incidentId, id, callback){
			jQuery.ajax({
				url: '/service/pvd/comment/reply/lists/' + incidentId + '/' + id,
				type: 'GET',
				cache: false,
				success: callback
			});
		},

		/*
		* 保存案件评论
		* @data: {  用户标识 userId,案事件的标识:incidentId,直接父评论:parent,评论内容:content,评论时间:storageTime,用户名:userName,顶层父评论:indirect}
		*/
		saveIncidentComment: function(data, callback){
			jQuery.ajax({
				url: '/service/pvd/comment/save',
				type: 'POST',
				data: {
					incidentCommentInfo: JSON.stringify(data)
				},
				success: callback
			});
		},

		/*
		* 保存案件评论回复
		* @data: {  用户标识 userId,案事件的标识 incidentId,直接父评论	parent,评论内容	content,评论时间 storageTime,用户名	userName,顶层父评论	indirect}
		*/
		saveCommentReply: function(data, callback){
			jQuery.ajax({
				url: '/service/pvd/comment/reply/save',
				type: 'POST',
				data: {
					incidentCommentInfo: JSON.stringify(data)
				},
				success: callback
			});
		}
	};

	var incidentModel = new IncidentModel();
	return incidentModel;
});