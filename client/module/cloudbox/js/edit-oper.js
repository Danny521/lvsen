/*
	详情右侧的编辑,保存操作
*/
define(['js/ajax-module.js','js/cloud-view.js','base.self'],function(ajaxModule,VIEW){
	var showInfo,
		editInfo;
	return {
		/**
		 * @name edit
		 * @method  of editStructuredInfo
		 * @description 云空间详情的编辑按钮
		 */
		edit: function() {
			showInfo = jQuery(".saved-info");
			editInfo = jQuery(".editing-info");
			if(SCOPE.context.fileType==="1"){
				editInfo.find(".pic-input-title").val(showInfo.find(".saved-info-title h4").html());
				editInfo.find(".pic-input-shootTime").val(showInfo.find(".pic-shoot-time").html());
				editInfo.find(".pic-input-remark").val(showInfo.find(".pic-remark").html());
			}else if(SCOPE.context.fileType==="2"){
				editInfo.find(".video-input-name").val(showInfo.find(".saved-info-title h4").html());
				editInfo.find(".video-input-shootTime").val(showInfo.find(".video-shoot-time").html());
				editInfo.find(".video-input-remark").val(showInfo.find(".video-remark").html());
			}else if(SCOPE.context.fileType==="3"){
				editInfo.find(".struct-input-time").val(showInfo.find(".appear-time").html());
				var remark = showInfo.find(".struc-remark").html();
				var newRemark = remark.replace(/<br>/gi,',');
				editInfo.find(".struct-input-remark").val(newRemark);
			}
			showInfo.removeClass("active");
			editInfo.addClass("active");
		},
		/**
		 * @name cancel
		 * @method  of editStructuredInfo
		 * @description 云空间详情的取消编辑按钮
		 */
		cancel: function() {
			var self = this;
			showInfo.addClass("active");
			editInfo.removeClass("active");
			/*jQuery('.editing-text-textarea').val($saveInfo.find(".pic-remark").html());
			jQuery('.pic-source-name').val($saveInfo.find(".saved-info-title h4").html());
			jQuery('.pic-appear-time').val($saveInfo.find(".pic-shoot-time").html());*/
		},
		/**
		 * @name save
		 * @method  of editStructuredInfo
		 * @description 云空间详情的编辑后保存按钮
		 */
		save: function() {
			var data = {},
				fileType = SCOPE.dContext.fileType - 0;

			data.remark = jQuery(".editing-text-textarea").val().trim();
			data.id = SCOPE.dContext.id;//update_image_info
			if (SCOPE.cedit != SCOPE.sedit) { /*非结构化*/
				var reg = /^(\d+)-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
				var tempShootTime = $(".pic-appear-time").val().trim();
				if(null != tempShootTime.match(reg)) {
					data.adjustTime = tempShootTime;
				}
				data.fileName = jQuery('.pic-source-name').val().trim();
			} else {
				data.appearTime = jQuery('.pic-appear-time').val().trim();
			}
			ajaxModule.postData('/service/pcm/' + SCOPE.cedit, {
				lable: JSON.stringify(data)
			}).then(function(datas) {
				if (datas && datas.code && datas.code === 200) {
					var editedTime = '';
					if (SCOPE.cedit != SCOPE.sedit) { /*非结构化*/
						editedTime = data.adjustTime;
					} else {
						editedTime = data.appearTime;
					}
					(showInfo.find("p>.shoot-time") || jQuery(".pic-appear-time")).text(editedTime).attr({
						"title": editedTime
					});
					showInfo.find("p>.none-edit-remark").text(data.remark ? data.remark : "无").attr({
						"title": data.remark
					});
					data.fileName ? showInfo.find(".saved-info-title h4").text(data.fileName).attr({
						"title": data.fileName
					}) : "";
					SCOPE.dContext.remark = data.remark;
					notify.success("保存成功！");
					localStorage.setItem('upDataInfo_y','0')//编辑完文件名后关闭弹框更新列表的标示
					showInfo.addClass("active");
					editInfo.removeClass("active");
					logDict.insertMedialog('m6', '编辑' + VIEW.getTname(true),'','o2'); // 编辑日志
				}else{
					notify.info("请输入有效值！");
				}
			},function() {
				notify.error("保存失败，请重试！");
			})
		},
		parseTime2: function(mills) {
			if(!mills){
				return "暂未填写";
			}
			var date = new Date(mills),
				formatLenth = Toolkit.formatLenth;
			return date.getFullYear() + '-' + formatLenth(date.getMonth() + 1) + '-' + formatLenth(date.getDate()) + ' ' + formatLenth(date.getHours()) + ':' + formatLenth(date.getMinutes()) + ':' + formatLenth(date.getSeconds());
		}
	};
});