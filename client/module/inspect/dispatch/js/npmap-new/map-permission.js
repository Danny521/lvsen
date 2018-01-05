/**
 * Created by Zhangyu on 2015/2/11.
 * 封装视频指挥地图相关功能及资源权限相关逻辑
 * 1、所有和地图业务相关的权限逻辑判断均在此；
 * 2、对外提供接口调用，便于统一管理
 */
define(['permission', 'jquery'], function(permission, $) {

	return {
		/**
		 * 【功能权限】判断是否有视频指挥模块的实时视频的权限，如果有则进入，没有就提示。by zhangyu on 2015/2/11
		 * @param scene - 使用场景（可以根据scene定制权限）
		 */
		checkRealStreamPlay: function (scene) {
			/**
			 * scene使用场景如下：
			 * open-full-view - 点击地图右侧的全景图标;
			 * info-win-play - 点击信息窗上查看实时视频按钮；
			 * search-result-dbclick-on-classical - 经典模式搜索摄像机后，在搜索结果列表中双击某条记录播放视频；
			 * search-result-dbclick-on-map - 地图模式搜索摄像机后，在搜索结果列表中双击某条记录播放视频；
			 * map-camera-click-on-ajax - 点击地图摄像机点位，从数据库中请求数据并播放摄像机视频；
			 * map-camera-click-on-cache - 点击地图摄像机点位，从缓存获取数据并播放摄像机视频；
			 * search-result-dbclick-on-btn - 点击地图摄像机点位，从缓存获取数据并播放摄像机视频；
			 * guardroute-on-click-camera - 点击警卫路线下摄像机，定位并播放摄像机视频；
			 */
			if (scene === "open-full-view" || scene === "info-win-play" || scene === "search-result-dbclick-on-classical" || scene === "search-result-dbclick-on-map" || scene === "search-result-dbclick-on-btn" || scene === "map-camera-click-on-cache" || scene === "map-camera-click-on-ajax" || scene === "guardroute-on-click-camera") {

				//判断有无权限
				if (permission.klass["real-time-view"] !== "real-time-view") {
					notify.info("暂无权限访问该摄像头");
					return false;
				}

				return true;
			}
		},
		/**
		 * 【资源权限】根据摄像机分数等级对摄像机进行权限判断
		 * 同步左侧资源树与地图上摄像机的权限图标样式，add by zhangyu on 2015/2/11
		 * @param cameraScore - 摄像机的权限分值
		 * @returns {boolean} - 是否拥有该摄像机的权限
		 */
		checkCameraPermissionByScore: function (cameraScore) {
			if(cameraScore){
				//获取当前用户的权限分值
				var userScore = parseInt($("#userEntry").data("score"), 10);
				//返回当前用户是否对该摄像机拥有权限
				return (userScore >= cameraScore);
			}else{
				return true;
			}
		},
		/**
		 * 【资源权限】根据摄像机id对摄像机进行权限判断
		 * 通过摄像机id获取对应的分数，与当前用的分数比对出摄像机的使用权限，add by zhangyu on 2015/2/11
		 * @param cameraId - 摄像机的id
		 * @param scene - 当前的应用场景
		 * @returns {boolean} - 是否拥有该摄像机的权限
		 */
		checkCameraPermissionById: function (cameraId, scene) {
			/**
			 * scene使用场景如下：
			 * send-to-extend-screen - 发送到扩展屏
			 * play-camera-history-video - 播放历史录像
			 * check-defense-access - 布防摄像机的资源权限
			 * send-to-tvwall - 发送到电视墙
			 * play-real-video-on-map - 在地图上播放摄像机视频
			 * play-real-video-on-full-view - 全景模式下，播放实时视频
			 * play-real-video-on-select-result - 勾选、圈选功能结果中，播放实时视频
			 * play-history-video-on-select-result - 勾选、圈选功能结果中，播放历史录像
			 * play-batch-real-video-on-select-result - 勾选、圈选功能结果中，批量播放实时视频
			 * play-real-video-byhand-on-gaurdroute - 警卫路线中，手动播放某个视频
			 * play-pre-video-bymap-on-gaurdroute - 警卫路线中，播放上一个视频（地图）
			 * play-next-video-bymap-on-gaurdroute - 警卫路线中，播放下一个视频（地图）
			 * play-pre-video-byscreen-on-gaurdroute - 警卫路线中，播放上一个视频（扩展屏）
			 * play-next-video-byscreen-on-gaurdroute - 警卫路线中，播放下一个视频（扩展屏）
			 * play-video-on-gaurdroute-cameraclick - 警卫路线中，点击定位播放视频
			 */
			//获取权限信息
			var permissionFlag = permission.stopFaultRightById([cameraId])[0];

			if (!permissionFlag) {
				notify.info("暂无权限访问该摄像头");
				return false;
			}

			return true;
		},
		/**
		 * 【资源权限】根据摄像机id对摄像机进行权限判断
		 * 通过摄像机id获取对应的分数，与当前用的分数比对出摄像机的使用权限，add by zhangyu on 2015/2/11
		 * @param cameraId
		 * @returns {boolean}
		 */
		checkDefencePermissionById: function (cameraId, scene) {
			/**
			 * scene使用场景如下：
			 * access-defense-on-defensecircle-camera - 防空圈摄像机进入视频布防
			 * access-defense-on-select-camera - 框选、圈选摄像机进入视频布防
			 */
			var self = this;
			//获取权限信息
			if (self.checkCameraPermissionById(cameraId, "check-defense-access")) {
				//没有实时视频播放权限了（2016-4-8）bug#45041
				//判断布防布控模块的视频播放权限
				/*if (permission.klass["defense-real-time-view"] !== "defense-real-time-view") {

					notify.info("该用户没有布防布控模块的实时视频播放权限，不能设置布防任务！");
					return false;
				}*/
				return true;
			} else {
				return false;
			}
		},
		/**
		 * 【功能权限】根据在模板中添加权限类别来重新渲染页面，达到权限控制的目的
		 * @param scene - 使用场景（可以根据scene定制权限）
		 */
		refreshPageByPermission: function (scene) {
			/**
			 * scene使用场景如下：
			 * render-on-defense-line - 页面渲染电子防线时，刷新权限
			 * render-on-set-camera-to-map - 地图上撒点完成后，刷新权限
			 * 涉及到的模块有：
			 *      1、视野范围内查看分组摄像机；
			 *      2、地图上显示周边摄像机的查询结果；（警力调度、我的关注、全局搜索兴趣点/灯杆/gps/350M）
			 *      3、框选；
			 *      4、圈选;
			 * render-on-show-infowindow - 地图上显示信息窗后，刷新权限
			 * 涉及到的模块有：
			 *      1、地图撒点后的，点位点击信息窗上的权限；
			 *      2、聚合点位地图上点击播放视频时，视频信息窗上的权限；
			 *      3、地图上显示摄像机基本信息，信息窗上的权限；
			 *      4、双击左侧树，地图上定位并显示视频播放信息窗，信息窗上的权限
			 * render-on-defense-circle-camera-list - 渲染防控圈摄像机列表时，刷新权限
			 * render-on-get-guard-route-list - 渲染警卫路线列表时，刷新权限
			 * render-on-guardroute-fill-group - 点击警卫路线分组，用警卫路线列表填充分组，刷新权限；
			 * render-on-guardroute-fill-route - 点击警卫路线，用摄像机列表填充警卫路线，刷新权限；
			 */
			permission.reShow();
			//对于扩展屏和实时视频播放权限在信息窗上进行定制
			if (scene === "render-on-show-infowindow") {
				var $domObj = $(".sendtoextendBtn");
				//如果有扩展屏权限，就必须得有实时播放权限
				if (permission.klass["real-time-view"]) {
					if ($domObj.length !== 0) {
						$domObj.show();
					}
				} else {
					if ($domObj.length !== 0) {
						$domObj.hide();
					}
				}
			}
		},
		/**
		 * 【功能权限】判断是否拥有给定数目通道的播放权限，只要给予的通道数目大于给定的通道数目即可拥有播放权限
		 * 备注：主要应用与批量播放实时视频的场景；如框选、全选、附近搜索摄像机
		 * @param num - 给定的待判断的通道数目
		 */
		checkBatchChannels: function (num) {
			if (num === ">=4") {
				return (permission.klass["four-channel"] === "four-channel" || permission.klass["nine-channel"] === "nine-channel" || permission.klass["sixteen-channel"] === "sixteen-channel");
			} else if (num === ">=9") {
				return (permission.klass["nine-channel"] === "nine-channel" || permission.klass["sixteen-channel"] === "sixteen-channel");
			} else if (num === "16") {
				return (permission.klass["sixteen-channel"] === "sixteen-channel");
			} else if (num === "9") {
				return (permission.klass["nine-channel"] === "nine-channel");
			} else {
				return (permission.klass["four-channel"] === "four-channel");
			}
		}
	};

});
