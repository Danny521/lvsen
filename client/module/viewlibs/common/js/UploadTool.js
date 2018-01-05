/*
 *	上传工具类
 *	File(id,name,type,size,origSize,loaded,percent)
 *
 */
define(['jquery-ui-1.10.1.custom.min','plupload','mootools'], function() {
	var UploadTool = new Class({

		Implements: [Events, Options],

		uploader: null,

		options: {

			btnId: "uploadFile",

			uploadUrl: "/service/pvd/upload_cover_file",

			file_data_name: "file_name",

			multi_selection: false,

			addFile: jQuery.noop,

			max_file_size: '2gb',

			uploadContainerId: null,

			uploadProgress: jQuery.noop,

			fileUploaded: jQuery.noop,

			filters: [{
				title: "Image File",
				extensions: "jpg,gif,png,bmp"
			}]
		},

		initialize: function(options) {
			this.setOptions(options);
			this.uploader = this.createrUploader();
		},
		disableBroswer: function() {
			this.uploader.disableBrowse(true);
		},
		/*
		 *	创建一个uploader对象
		 */
		createrUploader: function() {
			var self = this;
			var opt = self.options;
			var uploader = new plupload.Uploader({
				runtimes: 'html5,html4,silverlight,flash,browserplus',
				browse_button: opt.btnId,
				url: opt.uploadUrl,
				filters: opt.filters,
				file_data_name: opt.file_data_name,
				multi_selection: opt.multi_selection,
				container: opt.uploadContainerId,
				max_file_size: opt.max_file_size,
				flash_swf_url: '/libs/plupload/plupload.flash.swf',
				silverlight_xap_url: '/libs/plupload/plupload.silverlight.xap',

			});

			uploader.init();

			//添加文件 自动上传
			uploader.bind('FilesAdded', function(up, files) {
				plupload.each(files, function(file) {
					opt.addFile(file, up);
				});
				uploader.start();
			});

			uploader.bind('FileUploaded', function(up, file, res) {
				opt.fileUploaded(file, JSON.parse(res.response), up);
			});

			return uploader;
		}

	});

 return UploadTool;
});





		




