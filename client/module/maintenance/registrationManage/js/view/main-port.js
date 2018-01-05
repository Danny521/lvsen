/**
 * main文件的view模块
 */
define([
	'../tab-panel',
	'../global-varibale',
	'js/controller/monitorSystem-controller',
	'js/controller/point-controller',
	'js/controller/camera-controller',
	'js/model/registrationManage-model',
	'jquery-ui-timepicker-addon',
	'handlebars'
	],function(Panel,globalVar,monitorSystem,pointCtr,cameraCtr,ajaxCtrModel){
	var View = function(){};
	View.prototype = {
		init:function(){
			var self = this;
			self.bindDataPicker();
			self.initTemp();
			monitorSystem.init();//默认渲染监控系统的页面

			//处理带有摄像机ID的url ->查看摄像机详情
			/*self.showCameraDetailFromPonit(function(id){
				self.showCameraInfoById(id);
			});*/
		},
		//添加全局的日期插件
		bindDataPicker: function() {
			jQuery(document).on('focus', '.input-time', function() {
				var self = this;
				jQuery(this).datetimepicker({
					dateFormat: 'yy-mm-dd',
					showAnim: '',
					showTimepicker: false
				});
			});
		},
		//请求模板，初始化全局变量
		initTemp: function() {
			var self = this;
			//初始化各个模块
			new Panel.TabPanel({
				//监控系统
				// MonitorSystem:monitorSystem,
				//点位
				PointCtr: pointCtr,
				//摄像机
				CameraCtr: cameraCtr
			});
		},

		/**
		 * 获取url中的摄像机ID 判断是否是点位发起的查看摄像机详情的请求
		 * @param callback 回调显示摄像机详情
		 * @returns {boolean} 没有摄像机id直接跳过
         */
/*		showCameraDetailFromPonit: function (callback) {
			var search = window.location.search;
			if (search && search.indexOf("cameraId=") !== -1) {
				var cameraId = search.split("cameraId=")[1];
				if(typeof callback === "function") {
					callback(cameraId);
				}
			}
			return false;
		},*/


		/**
		 * 根据相机ID显示对应板块 没有用到 挪到摄像机控制器定义 用点位的view直接调用
		 * @param data 摄像机ID
		 * @returns no
         */
		/*showCameraInfoById: function (data) {
			if (!data) {
				return;
			}
			var params = {
					"id": data
				};
			ajaxCtrModel.ajaxEvents.getCameraByID(params, function (res) {
				if (res.code === 200) {
					jQuery("#aside .tabs").find("li[data-tab = 'camera-control']").trigger("click");
					jQuery("#major").css("left", "50px");
						jQuery("#aside").find(".tab-content").hide(0);
					    cameraCtr.getDetailInfo(res.data, function () {
							$(".cameraControl ").addClass("active").siblings().removeClass("active");
							jQuery("#mainContent,#doNewEditPanel").addClass('hidden');
							globalVar.currCameraDeatilData = res.data;
					});
				}
			}, function () {
				notify.error("获取摄像机设备信息失败");
			});
		}*/

	};
	return new View();
});