/**
 * ptz.js of 1 part
 * @return {[type]} [description]
 */

define(['mootools'],function() {
	var cameraCache = window.cameraCache = new Hash(); //为每个打开的视频,保留对应的云台参数.

	var Camera = window.Camera = new Class({
		cameraId: null,
		cameraNo: null,
		cameraType: null,
		presets: '',
		presetsMap: new Hash(),
		autoCruise: '',
		timeCruise: '',
		cruisetype: 0,
		// 巡航分类	0自动巡航	1时间段巡航
		status: 0,
		// 巡航状态	0没开启	1开启	2等待
		sortNo: 0, //预置位列表sortNo最大 + 1, 是下次添加预置位的序号,预置位是通过序号排序的.
		scan: 1,
		// 云台自动扫描 1初始未扫描 2扫描状态
		lockStatus: 0, //0未锁 1锁定
		monopolyStatus: 1, //1未独占 0独占
		wipe: 0,
		// 云台雨刷 0初始化 关  1开启
		light: 0
			// 云台灯光 0初始化 关  1开启
	});
	//云台面板,选项卡高亮li 默认有一个li是高亮的,球机是'云台控制',枪机是'色彩调节'
	//var isActiveLi = window.isActiveLi = jQuery('#ptzCamera').find('.header li:eq(0)');
});