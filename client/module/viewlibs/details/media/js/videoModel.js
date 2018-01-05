define([
	'ajaxModel',
	'base.self',
	'jquery.pagination'
], function(ajaxModel) {
	var VideoModel = function(){};
	VideoModel.prototype = {
		urls: {
			GET_VIDEO_INFO: '/service/pvd/get_video_info',
			UPDATAE_VIDEO_INFO: '/service/pvd/update_video_info',
			DELETE_VIDEO_INFO: '/service/pvd/delete_video_info',
			VIDEO_DICTIONARY: '/module/viewlibs/json/video.json',
			SAVE_TO_CLOUND: '/service/pvd/pvd_videoimage_pcm', //已关联案事件
			SAVE_TO_CLOUND_ALT: '/service/pvd/videoimage_pcm', //未关联案事件
			IS_IN_CLOUND: '/service/pvd/imagevideo_exist' //	检测之前是否已保存过
		},
		/**
		 * [getParams 从url取获取当前视频文件类型fileType和id]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @return {[json]}   [当前视频信息josn]
		 */
		getParams: function(params) {
			var orgid = Toolkit.paramOfUrl(params).orgid;
			return {
				fileType: Toolkit.paramOfUrl(params).fileType,
				id: Toolkit.paramOfUrl(params).id,
				incidentName: Toolkit.paramOfUrl(params).incidentname,
				pagetype: Toolkit.paramOfUrl(params).pagetype,
				incidentId: Toolkit.paramOfUrl(params).incidentid, //编辑页面存在的incidentid
				orgid: (orgid && orgid !== 'undefined') ? orgid : ''
			};
		},
		/**
		 * [checkXhr 检测该视频是否在云空间中]
		 * @author limengmeng
		 * @date   2014-12-09
		 * @return {[type]}   [description]
		 */
		checkXhr: function(id,success,error){
			ajaxModel.getData(this.urls.IS_IN_CLOUND + "/" + id, {type: 1}, {async:false}).then(success,error);
		},
		/**
		 * [getVideoInfo 获取视频详情信息]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[json]}   params [当前视频的相关参数：id，文件类型，案事件名称、id等]
		 * @return {[]}          []
		 */
		getVideoInfo: function(params,success,error) {
			ajaxModel.getData(this.urls.GET_VIDEO_INFO, {
					fileType: params.fileType,
					orgId: params.orgid,
					id: params.id,
					rs: params.isWorkBench
				}, {async:false}).then(success,error);
		},

		/**
		 * [getIncidentInfo 获取视频所属案事件]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[string]}   params [要获取的案事件相关参数]
		 * @return {[]}              []
		 */
		getIncidentInfo: function(params,success,error) {
			ajaxModel.getData('/service/pvd/get_incident_info', {
					id: params.incidentId,
					orgId: params.orgid,
					rs: params.isWorkBench
				}, {async:false}).then(success,error);
		},

		/**
		 * [setPagination 内容分页]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[int]}   total        [信息总条数]
		 * @param  {[dom]}   selector     [分页所在dom节点]
		 * @param  {[int]}   itemsPerPage [页容量]
		 * @param  {Function} callback     [下一页回调函数]
		 */
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
		/**
		 * @author limengmeng
		 * @date   2014-11-05
		 * @param  {[string]}   type [线索类型]
		 * @return {[string]}        [转化为汉字的类型]
		 */
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
			var j = obj.length - 1;
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
		/**
		 * [verifyIncident 案事件打回]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[int/string]}   id     [案事件id]
		 * @param  {[string]}   status [案事件状态]
		 * @return {[]}          []
		 */
		verifyIncident: function(id, status) {
			//案事件打回描述
			var auditInfo = jQuery('.common-dialog.incident .audit-info').val();
			jQuery.ajax({
				url: '/service/pvd/audit_incident_info',
				data: {
					id: id,
					status: status,
					auditInfo: auditInfo
				},
				cache: false,
				type: 'POST',
				success: function(res) {
					if (res.code == 200) {
						notify.success('操作成功');
						setTimeout(function() {
							window.location.reload();
						}, 2000);
					} else {
						notify.warn('操作异常，请重试');
					}
				},
				error: function() {
					notify.warn('网络异常');
				}
			});
		},

		/*
		 *	案事件保存到云端
		 *	@param{id}	incidentId
		 *	@param{el}	保存按钮
		 */
		saveToClound: function(isAssociated,id, el,beforeSend,success,error) {
			var self = this;
			var url = self.urls.SAVE_TO_CLOUND;
			if (!isAssociated) {
				url = self.urls.SAVE_TO_CLOUND_ALT;
			}
			ajaxModel.postData(url + "/" + id, {
					fileType: 1,
				}, {async:false}).then(beforeSend,success,error);
		},
		/**
		 * [deleteVinfo 删除视图信息]
		 * @author limengmeng
		 * @date   2014-12-09
		 * @param  {[type]}   id      [资源id]
		 * @return {[type]}           [description]
		 */
		deleteVinfo: function(id,success,error){
			ajaxModel.postData(this.urls.DELETE_VIDEO_INFO, {
					id: id, //资源id
					fileType: 1 //资源类型，主要针对delete_video_info
				}, {async:false}).then(success,error);
		},

		updateVinfo: function(formdata,success,error){
			ajaxModel.postData(this.urls.UPDATAE_VIDEO_INFO, {
					"resoureList": JSON.stringify(formdata)
				}, {async:false}).then(success,error);	
		}
	};
	var videoModel = new VideoModel();
	return videoModel;
});