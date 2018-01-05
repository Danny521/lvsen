/**
 * 
 * @authors liwei
 * @date    2015-01-04
 *
 */
define(['ajaxModel'],function(ajaxModel){
	var Model = function(){
		var self = this;
	};
	Model.prototype={
		URLS:{
			GETALLLISTS:'/service/check/pvgs',
			STARTCHECK:'/service/check/pvg/connectInfo/detection?d='+new Date(),
			GETCHECKNUM:'/service/check/pvg/connectInfo?d='+new Date(),
			GETDETAIL:'/service/check/pvg/connectInfo/detail?d='+new Date(),
			UPDATEDEVICE:'/service/check/pvg/connectInfo/syncDevices',
			UPDATECHANNEL:'/service/check/pvg/connectInfo/syncChannels'
		},
		/**
		 * [getLists 获取配置检测列表信息，请求方式为GET，用getData]
		 * @return {[type]} [description]
		 */
		getLists:function(){
			return ajaxModel.getData(this.URLS.GETALLLISTS,null,{
				dataType: 'json',
				timeout:2000,
				headers: {
					'PVA-Auth': false
				}
			});
		},
		/**
		 * [getCheckNum 开始检测，请求方式为post，用postData]
		 * @param  {[type]} ids [参数ids，根据ids给出变更数目]
		 * @return {[type]}     [description]
		 */
		startCheck:function(ids){
			return ajaxModel.postData(this.URLS.STARTCHECK,{
				ids:ids
			},{
				timeout:2000
			});
		},
		/**
		 * [getCheckNum 获取变更数目，轮训获取，请求方式为get方式,用getData]
		 * @return {[type]} [description]
		 */
		getCheckNum:function(){
			return ajaxModel.getData(this.URLS.GETCHECKNUM,null,{
				timeout:2000
			});
		},
		/**
		 * [getDetail 获取变更信息的详情,根据pvgId获取详细信息，请求方式get]
		 * @return {[type]} [description]
		 */
		getDetail:function(pvgId){
			return ajaxModel.getData(this.URLS.GETDETAIL,{
				pvgId:pvgId
			},{
				timeout:2000
			})
		},
		/**
		 * [UpdateDevice 同步视频设备信息]
		 * @param {[type]} pvgId   [description]
		 * @param {[type]} records [description]
		 */
		UpdateDevice:function(pvgId,orgId,records){
			return ajaxModel.postData(this.URLS.UPDATEDEVICE,{
				pvgId:pvgId,
				orgId:orgId,
				records:JSON.stringify(records)
			},{
				timeout:2000
			})
		},
		/**
		 * [updateChannel 同步摄像机信息]
		 * @return {[type]} [description]
		 */
		updateChannel:function(pvgId,records){
			return ajaxModel.postData(this.URLS.UPDATECHANNEL,{
				pvgId:pvgId,
				records:JSON.stringify(records)
			},{
				timeout:2000
			})
		}
	}	
	return new Model();
});