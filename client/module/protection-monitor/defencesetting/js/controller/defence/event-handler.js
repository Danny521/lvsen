/**
 * Created by Zhangyu on 2015/1/22.
 * 事件总线中事件的描述
 */

var /**
	 * 触发视频截图，并显示对应情景中的框线规则
	 * 事件响应：
	 *    ds-video-snapshot-controller.js中
	 * 调用：
	 * 1、ds-arealist-view.js中：
	 *    修改区域按钮点击时调用;
	 *    区域的下拉列表，选中某个区域规则时调用；
	 * 2、ds-drawlines-view.js中：
	 *    点击绘制“单线”、“双线”、“矩形”、“多边形”时调用；
	 *    最小物体、最大物体、车牌大小的“标定”按钮点击时调用；
	 * 3、ds-protect-view.js中：
	 *    最大人脸、最小人脸的“标定”按钮点击时调用；
	 *    人脸检测区域的“调整”按钮点击时调用；
     */
	SCREEN_SHOT_AND_SHOW_LINES = 1001,
	/**
	 * 播放摄像机实时流
	 * 事件响应：
	 * ds-video-snapshot-view.js中
	 * 调用：
	 * 1、ds-ruledetail-controller.js中：页面的后退按钮点击时调用；
	 * 2、ds-tasksave-controller.js中：
	 *    布防任务保存成功后调用；
	 *    布防任务删除成功后调用；
	 * 3、ds-drawlines-view.js中：
	 *    最大物体、最小物体、车牌大小标定完了之后的“确定”按钮点击时调用；
	 * 4、ds-protect-view.js中：
	 *    人脸检测区域调整后的“确定”按钮点击时调用；
	 *    最大人脸、最小人脸标定后“确定”按钮点击时调用；
	 *    布控任务保存成功后调用
	 * 5、ds-ruledetail-view.js中：
	 *    人脸检测算法的布防、布控tab切换时调用；
	 */
	SHOW_PLAYING_VIDEO_STREAM = 1002,
	/**
	 * 修改当前的框线规则名称
	 */
	MODIFY_CUR_AREA_NAME        = 1003,
	/**
	 * 从当前的框线规则列表中删除一个或者多个框线规则
	 */
	DELETE_AREA_IN_AREA_LIST    = 1004,
	/**
	 * 清除当前绘制框线规则默认名称的索引信息
	 */
	CLEAR_AREA_LIST_INDEX       = 1005;