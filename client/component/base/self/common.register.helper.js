/**
 * Created by Zhangyu on 2015/4/17.
 */
define(["handlebars"], function() {
	//格式化系统图片路径，改为接口进行读取；/service/pfsstorage/image?filePath={{path}}
	Handlebars.registerHelper("formateImgPath", function (path) {
		return "/service/pfsstorage/image?filePath=" + path;
	});
});