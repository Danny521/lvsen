/**
 * [ImgModel 图片详情信息类]
 * @author limengmeng
 * @date   2014-10-31
 */
define([
	'ajaxModel'
], function(ajaxModel) {
	var ImgModel = function() {};
	ImgModel.prototype = {
		urls: {
			GET_VIDEO_INFO: '/service/pvd/get_video_info', //视图详情信息
			GET_INCIDENT_INFO: '/service/pvd/get_incident_info', //案事件信息
			DELETE_MEDIA_INFO: '/service/pvd/delete_video_info', //删除视图信息
			COMMIT_URL: '/service/pvd/audit_incident_info', // 审核案事件
			SAVE_TO_CLOUND: '/service/pvd/pvd_videoimage_pcm', //已关联案事件
			SAVE_TO_CLOUND_ALT: '/service/pvd/videoimage_pcm', //未关联案事件
			IS_IN_CLOUND: '/service/pvd/imagevideo_exist' //	检测之前是否已保存过
		},

		// 从url取文件类型fileType和id(PS: 这里的casename可能为null)
		getParams: function(params) {
			var orgid = Toolkit.paramOfUrl(params).orgid;
			return {
				fileType: Toolkit.paramOfUrl(params).fileType,
				id: Toolkit.paramOfUrl(params).id,
				casename: Toolkit.paramOfUrl(params).incidentname,
				pagetype: Toolkit.paramOfUrl(params).pagetype,
				orgid: (orgid && orgid !== 'undefined') ? orgid : ''
			};
		},

		/**
		 * [checkXhr 检测是否已保存到云空间]
		 * @author limengmeng
		 * @date   2014-12-09
		 * @return {[type]}   [description]
		 */
		checkXhr: function(id, success, error) {
			ajaxModel.getData(this.urls.IS_IN_CLOUND + "/" + id, {type: 2}, {
				async: false
			}).then(success, error);
		},
		/**
		 * [getVideoInfo 获取视图详情信息]
		 * @author limengmeng
		 * @date   2014-10-31
		 * @param  {[json]}   params [当前图片相关信息]
		 * @return {[type]}          [description]
		 */
		getVideoInfo: function(params, success, error) {
			ajaxModel.getData(this.urls.GET_VIDEO_INFO, {
				fileType: params.fileType,
				orgId: params.orgid,
				id: params.id,
				rs: params.isWorkBench
			}, {
				async: false
			}).then(success, error);
		},
		/**
		 * [getIncidentInfo 获取案事件信息]
		 * @author limengmeng
		 * @date   2014-10-31
		 * @param  {[string]}   id [案事件id]
		 * @return {[]}      []
		 */
		getIncidentInfo: function(params, success, error) {
			ajaxModel.getData(this.urls.GET_INCIDENT_INFO, {
				id: params.incidentid,
				orgId: params.orgid, // 组织机构id
				rs: params.isWorkBench
			}, {
				async: false
			}).then(success, error);
		},

		/**
		 * [setPagination 分页函数]
		 * @author limengmeng
		 * @date   2014-10-31
		 * @param  {[int]}   total        [要显示信息的总条数]
		 * @param  {[dom]}   selector     [分页显示位置dom]
		 * @param  {[int]}   itemsPerPage [每页显示的条数]
		 * @param  {Function} callback     [下一页的回调函数]
		 */
		setPagination: function(total, selector, itemsPerPage, callback) {
			jQuery(selector).pagination(total, {
				items_per_page: itemsPerPage,
				num_display_entries: 12,
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

		isWorkBench: function() {
			var self = this,
				rs = 0;
			var pagetype = Toolkit.paramOfUrl(location.href).pagetype;
			var home = Toolkit.paramOfUrl(location.href).home;
			if (!home) {
				home = location.href.split("?")[0].test("/workbench/");
				home = "workbench";
			}
			if (pagetype !== "workbench") {
				if (pagetype === "structlist" && home && home === "workbench") {
					rs = 0;
				} else {
					rs = 1;
				}
			}
			self.isWorkBench = rs;
		},
		/**
		 * [deleteMedia 删除视频/图片信息]
		 * @author limengmeng
		 * @date   2014-10-31
		 * @param  {[string/int]}   fileType [文件类型1：视频2：图片]
		 * @param  {[string]}   id       [视图资源的id]
		 * @return {[]}            []
		 */
		deleteMedia: function(fileType, id) {
			var self = this;
			var casename = Toolkit.paramOfUrl(location.href).incidentname;
			jQuery.ajax({
				url: this.urls.DELETE_MEDIA_INFO,
				data: {
					fileType: fileType,
					id: id
				},
				type: 'post',
				success: function(res) {
					if (res.code === 200) {
						notify.success('删除成功');

						var caseid = jQuery('#manualMark').data('caseid');
						var str = !casename ? '' : (casename + '案事件的');
						var type = (parseInt(fileType, 10) === 2 ? '图片' : '视频');
						var name = jQuery('#content .wrapper div.header div.title > span').text();
						logDict.insertMedialog('m4', '删除 ' + str + name + ' ' + type + '表单', "", "o3");

						if (!casename) {
							window.location.href = "/module/viewlibs/" + Toolkit.paramOfUrl(location.href).pagetype + "/index.html";
						} else {
							window.location.href = '/module/viewlibs/details/incident/incident_detail.html?id=' + caseid + '&pagetype=' + Toolkit.paramOfUrl(location.href).pagetype + '&incidentname=' + casename + '&orgid=' + Toolkit.paramOfUrl(location.href).orgid;
						}
					} else {
						notify.warn('删除失败');
					}
				},
				error: function() {
					notify.warn('网络异常');
				}
			});
		},


		// 返回面包屑类型
		getCrumbsType: function() {
			var currentLib = JSON.parse(localStorage.getItem("activeMenu")).viewlibs;
			switch (currentLib) {
				case 'workbench':
					return '我的工作台';
				case 'caselib':
					//处理不显示人工标注按钮
					jQuery("#imgHandle").hide();
					jQuery("#manualMark").hide();
					return '案事件信息库';
				case 'doubtlib':
					return '疑情信息库';
				case 'peoplelib':
					return '人员信息库';
				case 'carlib':
					return '车辆信息库';
				default:
					return '我的工作台';
			}
			/*switch (this.hlight) {
				case '3-5':
					return '我的工作台';
				case '3-6':
					//处理不显示人工标注按钮
					jQuery("#imgHandle").hide();
					jQuery("#manualMark").hide();
					return '案事件信息库';
				case '3-21':
					return '疑情信息库';
				case '3-22':
					return '人员信息库';
				case '3-23':
					return '车辆信息库';
				default:
					return '我的工作台';
			}*/
		},
		/*
		 *	案事件保存到云端
		 *	@param{id}	incidentId
		 *	@param{el}	保存按钮
		 */
		saveToClound: function(isAssociated, id, el, beforeSend, success, error) {
			var self = this;
			var url = self.urls.SAVE_TO_CLOUND;
			if (!isAssociated) {
				url = self.urls.SAVE_TO_CLOUND_ALT;
			}
			ajaxModel.postData(url + "/" + id, {
				fileType: 2
			}, {
				async: false
			}).then(beforeSend, success, error);
		},

		/**
		 * [verifyIncident 案事件打回]
		 * @author limengmeng
		 * @date   2014-10-31
		 * @param  {[string]}   id     [当前案事件id]
		 * @param  {[int]}   status [当期要操作的审核状态]
		 * @return {[]}          []
		 */
		verifyIncident: function(id, status) {
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
		}
	};
	var imgModel = new ImgModel();
	return imgModel;
});