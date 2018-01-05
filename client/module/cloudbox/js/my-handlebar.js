define(['handlebars','/module/cloudbox/js/conf.js'],function(Handlebars,conf){
	Handlebars.registerHelper('s-name',function(sType){
		var sname = ['','人员','车辆','物品','场景','运动目标','其他']
		return "结构化信息/线索 : " + sname[sType];
	});
	/**
	 * 视图来源
	 */
	Handlebars.registerHelper('sourceFrom', function(sourceFrom) {
		return sourceFrom === '2' ? "所属图片：" : "所属视频：";
	});

	/**
	 * 后端返回的文件类型到 class 映射，小图标使用
	 */
	Handlebars.registerHelper("fileType2Class", function(fileType, options) { //将数字的文件类型转换为类名
		var arr = ["folder", "video", "picture", "structure", "incident"];
		return "<i class=" + arr[fileType - 0] + "></i>";
	});
	/**
	 * 后端返回的文件类型到 class 映射，小图标使用a
	 */
	Handlebars.registerHelper("fileType2PureClass", function(fileType, options) { //将数字的文件类型转换为类名
		var arr = ["folder", "video", "picture", "structure", "incident"];
		return arr[fileType - 0];
	});

	/**
	 * 格式化后端返回的毫秒时间 XX年XX月XX日 XX:XX:XX
	 */
	Handlebars.registerHelper("mills2str", function(mills, options) { //将数字的文件类型转换为类名
		var date = new Date(mills),
			formatLenth = Toolkit.formatLenth;
		return date.getFullYear() + '年' + formatLenth(date.getMonth() + 1) + '月' + formatLenth(date.getDate()) + '日 ' + formatLenth(date.getHours()) + ':' + formatLenth(date.getMinutes()) + ':' + formatLenth(date.getSeconds());
	});

	/**
	 * 格式化后端返回的毫秒时间到 ISO 格式
	 */
	Handlebars.registerHelper("mills2ISODate", function(mills, options) { //将数字的文件类型转换为类名
		if(!mills){
			return "暂未填写";
		}
		var date = new Date(mills),
			formatLenth = Toolkit.formatLenth;
		return date.getFullYear() + '-' + formatLenth(date.getMonth() + 1) + '-' + formatLenth(date.getDate()) + ' ' + formatLenth(date.getHours()) + ':' + formatLenth(date.getMinutes()) + ':' + formatLenth(date.getSeconds());
	});

	Handlebars.registerHelper("adjustTimeOrshootTime", function(adjustTime,shootTime) { //将数字的文件类型转换为类名	
		var mills;
		if(adjustTime){
			mills = adjustTime;
		}else{
			mills = shootTime;
		}
		var date = new Date(mills),
			formatLenth = Toolkit.formatLenth;
		return date.getFullYear() + '-' + formatLenth(date.getMonth() + 1) + '-' + formatLenth(date.getDate()) + ' ' + formatLenth(date.getHours()) + ':' + formatLenth(date.getMinutes()) + ':' + formatLenth(date.getSeconds());
	});
	/**
	 * 是否有缩略图，有则显示，没有则不显示
	 */
	Handlebars.registerHelper("hasThumbnail", function(thumbnail) {
		/*这里生成默认图片*/
		return thumbnail ? '<img src="' + thumbnail + '">' : '';
	});

	/**
	 * 判断是否需使用默认的图片
	 */
	Handlebars.registerHelper("witchCover", function(fileType) {
		var arr = ["folder", "video", "img", "structure", "incident"];
		return "cover-" + arr[fileType - 0];
	});

	/**
	 * 结构化信息，如果资源文件时视频，显示视频选项卡，否则不显示
	 */
	Handlebars.registerHelper("isVideoStructure", function(sourceType, options) {
		return sourceType !== "1" ? 'style="display:none;"' : "";
	});

	/**
	 * 是否有points数据,有的需要查看标注图片
	 */
	Handlebars.registerHelper("isPicStructure", function(points, options) {
		return points ? '' : 'style=display:none';
	});

	/**
	 * 通过 sourceType 判断是否是视频
	 */
	Handlebars.registerHelper("isVideo", function(sourceType) {
		return sourceType +'' === "1" ? true : false;
	});

	/**
	 * 如果是视图库过来的隐藏编辑按钮
	 */
	Handlebars.registerHelper("isShow", function(pvd, options) {
		return pvd ? 'style=display:none' : "";
	});

	/**
	 * 如果是文件夹不显示入库按钮
	 */
	Handlebars.registerHelper("isShowFileType", function(fileType, options) {
		return fileType.toString() === "0" ? 'style="visibility:hidden;"' : '';
	});

	/**
	 * fileType=0,fileType=4隐藏下载按钮
	 */
	Handlebars.registerHelper("hideDownload", function(fileType, options) {
		return fileType.toString() === "0" || fileType.toString() === "4" || fileType.toString() === "3" ? 'style="visibility:hidden;"' : '';
	});
	Handlebars.registerHelper("hidePvdDownload", function(fileType, options) {
		return fileType.toString() === "4" || fileType.toString() === "3" ? 'style="visibility:hidden;"' : '';
	});

	/**
	 * 未找到使用的地方
	 */
	Handlebars.registerHelper("isVideoLib", function() {
		return this.cList === this.eList ? 'style="visibility:hidden;"' : '';
	});

	/**
	 * 是否是案事件的小图标
	 */
	Handlebars.registerHelper('isIncidentIcon', function(fileType) {
		if (fileType + '' !== '0') {
			return "class=e_icon";
		}
	});

	/**
	 * 转换空间占用大小
	 */
	Handlebars.registerHelper("filterFileSize", function(fileSize, options) {
		if (fileSize === -1 || fileSize === null || fileSize === undefined) {
			return '---';
		}
		if (fileSize < 1024) {
			return fileSize + "B";
		}
		if (fileSize < 1024 * 1024) {
			return (fileSize / 1024).toFixed(2) + "KB";
		}
		if (fileSize < 1024 * 1024 * 1024) {
			return (fileSize / (1024 * 1024)).toFixed(2) + "MB";
		}
		if (fileSize < 1024 * 1024 * 1024 * 1024) {
			return (fileSize / (1024 * 1024 * 1024)).toFixed(2) + "GB";
		}
		if (fileSize < 1024 * 1024 * 1024 * 1024) {
			return (fileSize / (1024 * 1024 * 1024 * 1024)).toFixed(2) + "TB";
		}
	});

	/**
	 * 毫秒处理为时分秒  "14859247"-->"04:07:39" （毫秒部分被省略）
	 */
	Handlebars.registerHelper("time2Str", function(time, options) {
		var h = Math.floor(time / (1000 * 60 * 60)),
			m = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60)),
			s = Math.floor(((time % (1000 * 60 * 60)) % (1000 * 60)) / 1000),
			result;
		h = h < 10 ? "0" + h : h;
		m = m < 10 ? "0" + m : m;
		s = s < 10 ? "0" + s : s;
		result = h + ":" + m + ":" + s;
		return result;
	});

	/**
	 * 是否有备注信息，有则显示，没有则显示 无
	 */
	Handlebars.registerHelper('noValue', function(val) {
		if(val){
			var value = val.replace(/,/gi,'<br/>');
			return value;
		}else{
			return "无";
		}
	});

	/**
	 * 按照后端返回的数字来映射结构化信息名称
	 */
	Handlebars.registerHelper('structureName', function(val) {
		var sName = ['', '人员', '车辆', '物品', '场景', '运动目标', '其他'];
		return sName[val - 0];
	});
});
