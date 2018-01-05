/**
 * [GPS监控控制器]
 * @author SongJiang
 * @date   2015-08-27
 * @param  {[type]}   ){} [GPS监控视图、GPS监控数据模型]
 * @return {[type]}         [description]
 */
define([
 		'js/npmap-new/view/task-gps-track-view',
		'js/npmap-new/model/task-gps-track-model',
		'js/npmap-new/model/maptool-resource-model'
],function(View,Model,ResourceModel) {
	return (function(scope) {
		//初始化页面
		// View.init(scope);
		scope.init = function(){
			View.init(scope);
		}
		/**
		 * 缓冲区搜索摄像机
		 * @author Song Jiang
		 * @date   2015-08-27
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.searchCameraByGeometry = function(data) {
			Model.searchCameraByGeometry(data, {}).then(function(res) {
				if (res.code === 200) {
					//日志
					// var camera = "{'code':200,'data':{'message':'成功','cameras':[{'id':33,'name':'内部监控_7','type':'camera','camera_status':1,'cameraCode':null,'camera_type':0,'longitude':121.62690092300012,'latitude':31.172335162000085,'installType':3,'score':0,'installAddress':null,'hd_channel':[],'sd_channel':[{'id':33,'ip':'cmYcQh14L8VJN1UaqSfHnA==','port':2100,'username':'TMR29YtnGPI=','password':'TMR29YtnGPI=','av_obj':'fVKIY3NgAxANZb+vHx0uRA==','channel_status':1,'channel_type':0,'pvg_group_id':3,'direct_server_version':1}]},{'id':27,'name':'内部监控_5','type':'camera','camera_status':1,'cameraCode':null,'camera_type':0,'longitude':121.62695188200007,'latitude':31.170311658000056,'installType':4,'score':0,'installAddress':null,'hd_channel':[],'sd_channel':[{'id':27,'ip':'cmYcQh14L8VJN1UaqSfHnA==','port':2100,'username':'TMR29YtnGPI=','password':'TMR29YtnGPI=','av_obj':'fVKIY3NgAxBNv2fxZuHWIQ==','channel_status':1,'channel_type':0,'pvg_group_id':3,'direct_server_version':1}]},{'id':30,'name':'内部监控_6','type':'camera','camera_status':1,'cameraCode':null,'camera_type':0,'longitude':121.62703427400005,'latitude':31.168169515000045,'installType':2,'score':0,'installAddress':null,'hd_channel':[],'sd_channel':[{'id':30,'ip':'cmYcQh14L8VJN1UaqSfHnA==','port':2100,'username':'TMR29YtnGPI=','password':'TMR29YtnGPI=','av_obj':'fVKIY3NgAxCs+kwj/rbRlg==','channel_status':1,'channel_type':0,'pvg_group_id':3,'direct_server_version':1}]}]}}";
					// res = eval('(' + camera + ')');
					View.showResultInLeft(res);
					View.setCameraResourcesOnMap(res);
				} else if (res.code == 500) {
					notify.error(res.data.message + "！"); //错误码：" + res.code;
				} else {
					notify.error("搜索资源失败，网络或服务器异常！");
				}
			});
		};
		/**
		 * 查询GPS信息，主要是获取车牌信息
		 * @author Song Jiang
		 * @date   2015-09-10
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */		
		scope.searchGPSInfoByID = function(data){
			ResourceModel.getGpsData(data,{}).then(function(res) {
				if(res.code === 200) {
					View.wirteCarCode(res);
				}else{
					notify.error("搜索资源失败，网络或服务器异常！");
				}
			});
		};
		/**
		 * 查询GPS轨迹点
		 * @author Song Jiang
		 * @date   2015-08-27
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.searchGPSPoints = function(data){
			Model.searchGPSPoints(data,{}).then(function(res){
				if(res.code === 200) {
					if(res.data.gps.length === 0){
						notify.error("暂无数据！");
						return;
					}
					View.showGPSLine(res);
 				}
 				else if (res.code == 500) {
					notify.error(res.data.message + "！"); //错误码：" + res.code;
				} else {
					notify.error("搜索资源失败，网络或服务器异常！");
				}
 			});
		};
		return scope;
	}({}));
});