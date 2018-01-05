define([
	'domReady',
	'base.self',
	'scrollbar',
	'handlebars',
	'permission'
], function(domReady) {
	function MediaLoaderView() {}
	MediaLoaderView.prototype = {
		
		mergeStr: function(obj){
			var str = '';
			var j = obj.length - 1;
			for(var i=0;i<j;i++){
				if(obj[i] && obj[i] !== "暂未填写"){
					str = str + obj[i] + '，';
				}
			}
			str = str.substr(0, str.length - 1);
			return str;
		},
		/**
		 * [addHandlebarsHelper description]
		 * @author wumengmeng
		 * @date   2014-12-12
		 */
		addHandlebarsHelper: function() {
			var self = this;
			//展示结构化信息的详细信息，若都为空则显示结构化信息类型
			Handlebars.registerHelper('casecar', function(licenseType, licenseNumber, carColor) {
				if ((!licenseType || licenseType === "暂未填写") && (!licenseNumber || licenseNumber==="暂未填写") && (!carColor || carColor==="暂未填写")) {
					return '车辆';
				} else {
					var str = self.mergeStr(arguments);
					return str;
				}
			});

			Handlebars.registerHelper('caseexhibit', function(name, shape, color) {
				if ((!name || name ==="暂未填写") && (!shape || shape ==="暂未填写") && (!color || color ==="暂未填写")) {
					return '物品';
				} else {
					var str = self.mergeStr(arguments);
					return str;
				}
			});
			Handlebars.registerHelper('casemove', function(type, color, height, gray) {
				if ((!type || type === "暂未填写") && (!color || color === "暂未填写") && (!height || height === "暂未填写") && (!gray || gray === "暂未填写")) {
					return '运动目标';
				} else {
					var str = self.mergeStr(arguments);
					return str;
				}
			});

			Handlebars.registerHelper('caseperson', function(name, gender, jacketColor, trousersColor) {
				if ((!name || name === "暂未填写") && (!gender || gender === "暂未填写") && (!jacketColor || jacketColor === "暂未填写") && (!trousersColor || trousersColor ==="暂未填写")) {
					return '人员';
				} else {
					var str = self.mergeStr(arguments);
					return str;
				}
			});

			Handlebars.registerHelper('caseothers', function(name) {
				if (!name || name === "暂未填写") {
					return '其他';
				} else {
					return name;
				}
			});
			Handlebars.registerHelper('casesence', function(categoryMain, weather) {
				if ((!categoryMain || categoryMain === "暂未填写") && (!weather || weather === "暂未填写")) {
					return '其他';
				} else {
					var weather = weather;
					if(categoryMain){ weather = '，'+weather;}
					return weather;
				}
			});

			//下面添加一些助手来控制模板的定制显示
			Handlebars.registerHelper('tabular', function(videoid, options) { //是否显示视频选项卡
				if (!self.options.sendAjax && !videoid) { //创建页面需要取出源类型
					var type = self.mediaObj.type;
					return type === 'video' ? options.fn(this) : "";
				} else { //编辑和详情页面用sourceType判断
					return videoid && videoid !== "暂未填写" ? options.fn(this) : "";
				}
			});

			Handlebars.registerHelper("base64", function(imgId, path, options) { //base64图显示,视频人工标注传输的是base流，图片是访问路径
				return (imgId === "暂未填写" || imgId === null) ? "data:image/jpg;base64," + path : path;
			});
			//编辑页 根据返回值,决定下拉列表中选中项
			Handlebars.registerHelper("selected", function(value1, value2, options) {
				if (value1 === value2) {
					return "selected";
				}
			});

			Handlebars.registerHelper('isIncident', function(param) {
				return param ? "show" : "must-hide";
			});
			//详情页 1是 0否
			Handlebars.registerHelper('isChecked', function(value, options) {
				if (parseInt(value) === 1) {
					return '是';
				} else {
					return '否';
				}
			});
			//编辑页 表单中的checkbox是否被选中
			Handlebars.registerHelper('checked', function(flag, name, options) {
				if (parseInt(flag) === 1) { //选中为1 未选中为0
					return 'checked';
				}
			});
			//checkbox未被选中,对应input,select为disabled
			Handlebars.registerHelper('isDisabled', function(value, options) {
				if (value === 0) {
					return 'disabled';
				}
			});
			//详情页 编辑页
			Handlebars.registerHelper("datetransfer", function(time, options) { //时间转化
				var bool = window.location.href.split("?")[0].indexOf("update") === -1;
				if (time && time !== "暂未填写") {
					var date = new Date(time);
					date = date.getFullYear() + '-' + Toolkit.formatLenth(date.getMonth() + 1) + '-' + Toolkit.formatLenth(date.getDate()) + " " + Toolkit.formatLenth(date.getHours()) + ":" + Toolkit.formatLenth(date.getMinutes()) + ":" + Toolkit.formatLenth(date.getSeconds());
					return date;
				} else if (bool) { //详情页翻译为暂未填写
					return "暂未填写";
				}
			});
			// 控制审核按钮的显隐
			Handlebars.registerHelper('auditBar', function(status, value1, value2, options) {
				if (status === "暂未填写" || status === "") {
					status = 1;
				}
				if (status === value1 || status === value2) {
					return options.fn();
				}

			});
			// 审核状态 4：已通过；
			Handlebars.registerHelper('auditStatus', function(value1, options) {
				if (4 === value1) {
					return options.fn();
				}
			});
			// 非待审核
			Handlebars.registerHelper('unwaitPass', function(status, options) {
				if (status !== 2) {
					return options.fn();
				}
			});
			// 待审核
			Handlebars.registerHelper('waitPass', function(status, options) {
				if (status === 2) {
					return options.fn();
				}
			});
			// 获取所属视图的id
			Handlebars.registerHelper('getMediaId', function(videoId, imageId) {

				if (videoId !== null && videoId !== "暂未填写") {
					return "data-mediaid=" + videoId + " data-type=1";
				}

				if (imageId !== null && imageId !== "暂未填写") {
					return "data-mediaid=" + imageId + " data-type=2";
				}

			});
			// 权限控制  案事件下的结构化信息才显示生成线索
			Handlebars.registerHelper('isiStruct', function(context, options) {
				if ("2" == context.clue) {
					return options.fn(context);
				}
			});
			//为删除权限做判断
			var userid = jQuery('#userEntry').data('userid');
			Handlebars.registerHelper('isOwner', function(param1, param2) {
				if (param2 === 4) {
					return "permission-delete";
				} else {
					return userid === param1 ? "permission-create" : "";
				}
			});
			Handlebars.registerHelper('isLogUser', function(param) {
				return userid === param ? "show" : "must-hide";
			});
			// 权限控制  不是自己创建的 则不显示
			Handlebars.registerHelper('belongs', function(context, options) {
				if (parseInt(jQuery("#userEntry").attr("data-userid")) === context.userId) {
					return options.fn(context);
				}
			});
			// 除了未提交1  未通过3 不显示编辑和删除按钮
			Handlebars.registerHelper('belongs1', function(context, options) {
				if (parseInt(jQuery("#userEntry").attr("data-userid")) === context.userId && (context.status == "1" || context.status == "3")) {
					return options.fn(context);
				}
			});
			//结构化信息审核状态字体颜色助手
			Handlebars.registerHelper("translateStatus", function(s, type) {
				var classname = '';
				var status = '';
				switch (s) {
					case 1:
						classname = 'to-commit';
						status = '未提交';
						break;
					case 2:
						classname = 'to-verify';
						status = '待审核';
						break;
					case 3:
						classname = 'verify-error';
						status = '未通过';
						break;
					case 4:
						classname = 'verify-success';
						status = '已通过';
						break;
					case 5:
						classname = 'verify-again';
						status = '再审核';
						break;
					default:
						return;
				}
				if (type === 'color') {
					return classname;
				} else {
					return status;
				}
			});
			Handlebars.registerHelper('searchPerson', function(value1, value2, options) {
				if (eightLib.enable && value1 === '身份证' && value2 !== '暂无填写') {
					return '<span class="value search_lib" title="关联信息库查询">' + value2 + '</span>';
				} else {
					return options.inverse(this);
				}
			});
			Handlebars.registerHelper('searchCar', function(value, options) {
				if (eightLib.enable) {
					return '<span class="value search_lib" title="关联信息库查询">' + value + '</span>';
				} else {
					return options.inverse(this);
				}
			});
		},
		/**
		 * [tabSources description]
		 * @author wumengmeng
		 * @date   2014-12-12
		 * @return {[type]}   [description]
		 */
		tabSources: function() {
			var self = this;
			//TODO
			var imageId = jQuery(".entity-preview").data("imageid"),
				videoId = jQuery(".entity-preview").data("videoid"),
				fileType,
				type,
				id,
				forUrl, //用来跳转到视频详情video或图片详情picture
                mediaInfo = "/module/viewlibs/doubtlib/inc/track-media.html";
			if (videoId && videoId !== "暂未填写") {
				fileType = "1";
				type = "video";
				forUrl = "video";
				id = videoId;
			} else if (imageId && imageId !== "暂未填写") {
				fileType = "2";
				type = "image";
				forUrl = "picture";
				id = imageId;
			} else if(self.params.points){
            	id = jQuery(".entity-preview").attr("data-mediaId");
            }
			if (!id || !self.mediaInfo) {
				notify.warn('该资源未关联视图');
				return false;
			}
			jQuery.when(Toolkit.loadTempl("/module/viewlibs/doubtlib/inc/track-media.html"), jQuery.getJSON("/module/viewlibs/json/media.json")).done(function(source, sourceData) {
				if (type) {
					self.transData(sourceData[0], self.mediaInfo[type]); //翻译	
				} else {
					self.transData(sourceData[0], self.mediaInfo); //翻译
				}
				self.transData(sourceData[0], self.mediaInfo[type]);
				source = source instanceof Array ? source[0] : source;
				Handlebars.registerHelper("transLocation", function(code, options) {
					return self.address[code] ? self.address[code][0] : '';
				});
				jQuery(".resources .overview .view[data-tab=video]").html(Handlebars.compile(source)(self.mediaInfo));

				var path = '/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/details/media/' + forUrl + '.html?fileType=' + fileType + '&id=' + self.mediaInfo[type].id + '&pagetype=' + Toolkit.paramOfUrl(location.href).pagetype + '&orgid=' + Toolkit.paramOfUrl(location.href).orgid;
				jQuery(".common-table .track-media").attr('href', path);

				jQuery(".resources.tabview>.views").tinyscrollbar({ //内容区添加滚动条
					thumbSize: 36
				});
			});
		}
	};
	return MediaLoaderView;
});