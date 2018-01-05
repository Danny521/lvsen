/* 
* @Author: Administrator
* @Date:   2015-04-15 14:27:23
* @Last Modified by:   Administrator
* @Last Modified time: 2015-04-15 16:07:08
*/

define(['/libs/jquery/jquery-1.10.2.min.js','/libs/jquery/jquery-ui.js','/libs/mootools/mootools.js','/component/base/base.self.js'],function() {

		//require(['/component/base/base.self.js']);
		jQuery(document).on("click",".win-dialog.ptz-control .win-dialog-body .preset-content .preset-use",function(){
			var li=jQuery(this).parent();
			var presetId = li.data('id');
			var camera = cameraCache.get(gPtz.getParams().cameraId);
			var button = jQuery('#ptzCamera .cruise .box-body .buttons .button');

			gPtz.callPreset({
				cameraId: camera.cameraId,
				cameraNo: camera.cameraNo,
				presetId: presetId
			});  
		});

		//删除选中的预置位
		jQuery(document).on("click",".win-dialog.ptz-control .win-dialog-body .preset-content .preset-delete",function(){
			var li=jQuery(this).parent();
			var id = li.data('id');
			var camera = cameraCache.get(gPtz.getParams().cameraId);
			var presets = [];

			//巡航里面移除预置位
			if (jQuery(this).closest('#setCruise').size() === 1) {
				new ConfirmDialog({
					message: "您确定要删除巡航中的预置位吗？",
					callback: function() {
						li.remove();
					}
				});
				return;
			} 
			//预置位模块删除预置位
			var condition = jQuery('#ptzCamera .cruise .box-body .buttons .button').is(jQuery('.red.stop'));
			if (condition) {
				//巡航条件
				notify.warn('当前预置位正在巡航中，请先停止巡航！');
				return;
			}
			else 
			{
				if(!PTZController.checkLock(camera.cameraId)){
					return false;
				}
				var pId1 = '';
				var pId2 = '';
				var message = '';

				if (camera.autoCruise !== -1 && camera.autoCruise.presets.length >= 1) {
					pId1 = camera.autoCruise.presetId;//自动巡航中的回位点id
				}
				if (camera.timeCruise !== -1 && camera.timeCruise.presets.length >= 1) {
					pId2 = camera.timeCruise.presetId;//时间巡航中的回位点id
				}

				if (id === pId1 || id === pId2) {
					message = '您确定要删除巡航中的回位点吗？';
				} else {
					if (jQuery('.header [data-tab="preset"]').hasClass('active')) {
						message = '该删除操作会将巡航计划中的该预置位一起删除，您确定要删除吗？';
					}else{
						message = '您确定要删除该预置位吗？';
					}
				}
				var dialog = new ConfirmDialog({
					message: message,
					callback: function() {
						gPtz.removePreset(id, li);
					}
				});
			}

		});	

});

