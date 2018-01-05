define(['base.self'],function(){
	var getFileInfo = new Class({

	Implements: [Options, Events],

	options: {},
	initialize: function(options) {
		this.setOptions(options);
	},
	//获取图片的宽高及格式
	getFileFormat: function(filename) {
		var startIndex = filename.lastIndexOf('.') + 1;
		var endIndex = filename.length;
		var fileFormat = filename.substring(startIndex, endIndex);
		return fileFormat;
	},
	fileNameFramet: function(fileFormat) {
		fileFormat = fileFormat.toLowerCase();
		switch (fileFormat) {
			case "jpg":
				jQuery('#fileFormat').val('03');
				break;
			case "gif":
				jQuery('#fileFormat').val('02');
				break;
			case "png":
				jQuery('#fileFormat').val('10');
				break;
			case "bmp":
				jQuery('#fileFormat').val('01');
				break;
			case "jfif":
				jQuery('#fileFormat').val('04');
				break;
			case "kdc":
				jQuery('#fileFormat').val('05');
				break;
			case "pcd":
				jQuery('#fileFormat').val('06');
				break;
			case "pcx":
				jQuery('#fileFormat').val('07');
				break;
			case "pic":
				jQuery('#fileFormat').val('08');
				break;
			case "pix":
				jQuery('#fileFormat').val('09');
				break;
			case "psd":
				jQuery('#fileFormat').val('11');
				break;
			case "tapga":
				jQuery('#fileFormat').val('12');
				break;
			case "tiff":
				jQuery('#fileFormat').val('13');
				break;
			case "wmf":
				jQuery('#fileFormat').val('14');
				break;
			default:
				jQuery('#fileFormat').val('15');
				break;
		}
	},
	fileVideoNameFramet: function(fileFormat) {
		fileFormat = fileFormat.toLowerCase();
		switch (fileFormat) {
			case "mpg":
				jQuery('#fileFormat').val('01');
				break;
			case "mov":
				jQuery('#fileFormat').val('02');
				break;
			case "avi":
				jQuery('#fileFormat').val('03');
				break;
			case "rm":
				jQuery('#fileFormat').val('04');
				break;
			case "rmvb":
				jQuery('#fileFormat').val('05');
				break;
			case "xvid":
				jQuery('#fileFormat').val('06');
				break;
			case "vob":
				jQuery('#fileFormat').val('07');
				break;
			case "m2ts":
				jQuery('#fileFormat').val('08');
				break;
			case "mp4":
				jQuery('#fileFormat').val('09');
				break;
			default:
				jQuery('#fileFormat').val('99');
				break;
		}
	},
	//获取图片的宽和高
	loadImgValue: function(path) {
		var img = new Image();
		// 改变图片的src
		img.src = path;
		var check = function() {
			if (img.width > 0 || img.height > 0) {
				jQuery("#width").val(img.width);
				jQuery("#height").val(img.height);
				clearInterval(set);
			}
		};
		var set = setInterval(check, 40);
	}
});
var getFileInfo = new getFileInfo({});
return getFileInfo;
});
