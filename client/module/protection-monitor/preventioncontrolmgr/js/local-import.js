/**
 * [文件上传模块]
 * @date   2014-12-08
 * @return {[type]}     [description]
 */
define([
	'js/protectcontrol-common-fun',
	'plupload',
	'jquery',
	'mootools'
], function(ProtectCommonFun) {
	/**
	 * Created by Zhangyu on 2014/10/17.
	 */
	var UploadFile = new new Class({

		Implements: [Options, Events],
		//上传对象集合
		uploadArr: {},
		//当前导入类型(image为上传人脸图像，zip为批量导入)
		uploadEventType: "",
		//图片上传成功后的回调函数
		successCallBack: null,

		options: {},


		initialize: function (options) {
			this.setOptions(options);
		},
		//创建上传插件
		createUpload: function (data, callback) {
			var self = this;
			//存储回调函数
			self.successCallBack = callback;
			//存储导入事件类型
			self.uploadEventType = data.type;
			//根据选择器绑定上传事件
			jQuery(data.selector).each(function () {
				var domId = jQuery(this).attr("id"), fileFilter = [];
				//根据类型不同进行不同文件类型的过滤
				if (data.type === "image") {
					fileFilter = [
						{
							title: "Image files",
							extensions: "jpg,gif,png"
						}
					];
				} else if (data.type === "zip") {

					fileFilter = [
						{
							title: "Zip files",
							extensions: "zip"
						}
					];
				}
				//绑定到上传插件中
				self.uploadArr[domId] = new plupload.Uploader({
					runtimes: 'flash,html5,html4',
					browse_button: domId,
					multi_selection: false,
					Container: "upload-container",
					max_file_size: '200m',
					url: data.url,
					file_data_name: 'fileNames',
					flash_swf_url: '/libs/plupload/plupload.flash.swf',
					silverlight_xap_url: '/libs/plupload/plupload.silverlight.xap',
					filters: fileFilter
				});
			});
			//初始化并绑定处理函数
			for (var key in self.uploadArr) {

				if(!self.uploadArr.hasOwnProperty(key)) {
					continue;
				}

				if (!self.uploadArr[key]) {
					continue;
				}

				//初始化
				self.uploadArr[key].init();

				self.uploadArr[key].bind('Init', function (up) {
					//重置网页标题头
					document.title = "视云实战平台";
				});

				//添加文件 自动上传
				self.uploadArr[key].bind('FilesAdded', function (up, files) {
					//重置网页标题头
					document.title = "视云实战平台";
					//批量导入时添加进度
					if (self.uploadEventType === "zip") {
						//显示处理进度条
						ProtectCommonFun.showDealProgress("正在进行批量上传", true);
					}
					//开始自动上传
					this.start();
				});

				//上传进度
				self.uploadArr[key].bind('UploadProgress', function (up, file) {
					//批量导入时添加进度
					if (self.uploadEventType === "zip") {
						//更新进度
						jQuery(".process-msg .rate").text(up.files[0].percent + "%");
						//更新进度条
						jQuery(".process-msg .process-rate").css({
							width: up.files[0].percent + "%"
						});
						//如果上传到了100%，则更新提示语
						if (parseInt(up.files[0].percent) === 100) {
							jQuery(".process-msg .text").text("上传完成，正在进行数据处理，请稍后...");
						}
					}
				});

				//上传完成
				self.uploadArr[key].bind('FileUploaded', function (up, file, res) {

					var response = JSON.parse(res.response);
					if (response.code === 200) {
						//回调渲染
						response.domId = this.settings.browse_button;
						if (self.successCallBack) {
							self.successCallBack(response);
						}
					} else {
						if (self.uploadEventType === "image") {
							notify.warn("添加图片失败，请重试！");
						} else {
							notify.warn(response.message);
						}
					}
					//关闭处理进度条
					ProtectCommonFun.hideDealProgress();
					//重置网页标题头
					document.title = "视云实战平台";
				});

				//上传错误
				self.uploadArr[key].bind('Error', function (up, file) {
					if (self.uploadEventType === "image") {
						if (file.message == "File extension error.") {
							notify.warn("请上传正确的图片格式！");
						} else {
							notify.warn("添加图片失败，请重试！");
						}
					} else {
						if (file.message == "File extension error.") {
							notify.warn("压缩包格式不正确，请上传正确格式的压缩包（zip）！");
						} else if (file.message == "File size error.") {
							notify.warn("压缩包大小应控制在200M以内！");
						} else {
							notify.warn("批量导入失败，请重试！");
						}
					}
					//关闭处理进度条
					ProtectCommonFun.hideDealProgress();
					//重置网页标题头
					document.title = "视云实战平台";
				});
			}
		},
		/**
		 * 销毁上传插件
		 */
		destroy: function () {
			var self = this;
			//销毁上传插件
			for (var key in self.uploadArr) {
				if (self.uploadArr.hasOwnProperty(key) && self.uploadArr[key]) {
					//销毁页面对象
					self.uploadArr[key].destroy();
					self.uploadArr[key] = null;
				}
			}
			//销毁页面对象
			jQuery(".plupload").remove();
			//重置网页标题头
			document.title = "视云实战平台";
		}
	});
	return {
		UploadFile: UploadFile
	}
});