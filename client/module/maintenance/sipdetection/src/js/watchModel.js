define(['ajaxModel'],function(ajaxModel){
	var Model = function(){
		var self = this;
	};
	Model.prototype = {
		URLS: {
			GETDEVICETYPE: "/serviceWatch/gbtesting/query/type?d="+new Date(),
			STARTCHECK:"/serviceWatch/gbtesting/start?d="+new Date(),
			GETCALLID: "/serviceWatch/gbtesting/query/new?d="+new Date(),
			GETDETAIL: "/serviceWatch/gbtesting/testing?d="+new Date(),
			OVERCHECK:"/serviceWatch/gbtesting/stop?d="+new Date(),
			SAVEDATE: "/service/nscheck/result?d="+new Date(),
			SEARCHAllINFOS:"/service/nscheck/results?d="+new Date(),
			GETSEARCHDETAIL:"/service/nscheck/result/id/items",
			DELETE:"/service/nscheck/result?d="+new Date(),
			EXPORT:"/service/nscheck/result/doc?d="+new Date(),
			UNPASSDETAIL:"/service/nscheck/rsdetail?d="+new Date()
		},
		/**
		 * [StartCheck 开始检测前调用该接口，判断是否有id当前也准备测试]
		 * @param {[type]} deviceId [description]
		 */
		StartCheck:function(item){
			var start_time,end_time;
			if(item.start_time){
				start_time = Toolkit.str2mills(item.start_time);
			}
			if(item.end_time){
				end_time = Toolkit.str2mills(item.end_time);
			}
			return ajaxModel.getData(this.URLS.STARTCHECK,{
				devid:item.deviceId,
				video:item.video,
				alarm:item.alarm,
				start_time:start_time,
				end_time:end_time
			},{
				timeout:2000
			});
		},
		/**
		 * [getDeviceType 获取设备类型]
		 * @param  {[type]} deviceId [description]
		 * @return {[type]}          [description]
		 */
		getDeviceType: function(deviceId) {
			return ajaxModel.getData(this.URLS.GETDEVICETYPE,{
				devid:deviceId
			},{
				timeout :2000
			});
		},
		/**
		 * [getCallId 根据检测项名称获取对应callid]
		 * @param  {[type]} deviceId [description]
		 * @param  {[type]} method   [description]
		 * @return {[type]}          [description]
		 */
		getCallId: function(deviceId, method) {
			return ajaxModel.getData(this.URLS.GETCALLID,{
				devid: deviceId,
				method: method
			},{
				timeout :2000
			});
		},
		/**
		 * [getDetail 根据前端给一系列检测项内容给出检测结果]
		 * @param  {[type]} deviceId [description]
		 * @param  {[type]} method   [description]
		 * @param  {[type]} callId   [description]
		 * @param  {[type]} password [description]
		 * @param  {[type]} expires  [description]
		 * @return {[type]}          [description]
		 */
		getDetail: function(item,callid,terminate) {
			return ajaxModel.getData(this.URLS.GETDETAIL,{
				devid: item.deviceId,
				method: item.method,
				callid: callid,
				password: item.password,
				expires: item.expires,
				terminate:terminate
			},{
				timeout:2000
			})
		},
		stopCheck:function(){
			return ajaxModel.abortAjax(this.URLS.GETDETAIL);
		},
		/**
		 * [OverCheck 测试结束时给后端清空当前已经测试的ID]
		 * @param {[type]} deviceId [description]
		 */
		OverCheck:function(deviceId){
			return ajaxModel.getData(this.URLS.OVERCHECK,{
				devid:deviceId
			},{
				timeout:2000
			})
		},
		/**
		 * [saveCheckInfos 保存检测结果]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		saveCheckInfos:function(data){
			return ajaxModel.postData(this.URLS.SAVEDATE,{
				jsonData:JSON.stringify(data)
			},{
				timeout:2000
			})
		},
		/**
		 * [getCheckItemsPageUrl 获取保存之后列表信息，给分页插件使用]
		 * @return {[type]} [description]
		 */
		getCheckItemsPageUrl:function(){
			return this.URLS.SEARCHAllINFOS;
		},
		/**
		 * [getSearchDetail 获取检测项明细即点击查看时信息]
		 * @param  {[type]} id [description]
		 * @return {[type]}    [description]
		 */
		getSearchDetail:function(id){
			var url = this.URLS.GETSEARCHDETAIL.replace(/id/,id);
			return ajaxModel.getData(url,"",{
				timeout:2000
			})
		},
		/**
		 * [deleteInfos 删除列表信息]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		deleteInfos:function(data){
			var ids;
			if(data instanceof Array){
				ids=data.join(",");
			}else{
				ids = data;
			}
			return ajaxModel.postData(this.URLS.DELETE,{
				ids:ids,
				_method:"delete"
			},{
				timeout :2000
			})
		},
		/**
		 * [exportDoc 导出检测结果]
		 * @param  {[type]} fileName [文件名]
		 * @param  {[type]} data     [ids]
		 * @return {[type]}          [description]
		 */
		exportDoc:function(fileName,data){
			var ids;
			if(data instanceof Array){
				ids = data.join(",");
			}else{
				ids = data;
			}
			window.location.href = this.URLS.EXPORT + "?fileName="+fileName+"&ids="+ids + "&_=" + new Date().getTime();
			//window.open(this.URLS.EXPORT + "?fileName="+fileName+"&ids="+ids + "&_=" + new Date().getTime());
		},
		/**
		 * [getUnpassDetail 查看不通过的信息]
		 * @param  {[type]} id     [description]
		 * @param  {[type]} method [description]
		 * @return {[type]}        [description]
		 */
		getUnpassDetail:function(id,method){
			return ajaxModel.getData(this.URLS.UNPASSDETAIL,{
				basicId:id,
				method:method
			},{
				timeout:2000
			})
		}
	}
	return new Model();
})