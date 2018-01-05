define(['/module/viewlibs/caselib/js/player.js', 'base.self'], function(Mplayer) {
	var medialibLink = new Class({
		Implements: [Events, Options],
		options: {},
		isSave: false,
		initialize: function() {},

		//页面传值，视图渲染
		mediaRender: function(flag) {
			if (parent.window.opener && parent.window.opener.gMessJson.markPicPath) {
				var picPath = parent.window.opener.gMessJson.markPicPath;
			} else {
				var picPath = parent.window.opener.gMessJson.mediaPath;
			}
			var domStr = '<img class="entity-img" alt="test3" src="' + picPath + ' "/>';
			jQuery(document).on('click', '.tab-title .tab-title-item', function() {
				var $this = jQuery(this),
					index = jQuery(this).attr('data-anchor');
				$this.addClass('active').siblings().removeClass('active');
				//console.log(jQuery('.tab-content').find('[data-target='+index+']'))
				jQuery('.tab-content').find('[data-target=' + index + ']').addClass('active').siblings().removeClass('active');
			});
			//图片与视频的切换
			jQuery(document).on('click', 'li[data-tab=ocxbody]', function() {
				// 检测ocx版本
				if(window.checkPlayer && window.checkPlayer()) {
					return;
				}
				if (jQuery(this).hasClass('clicked')) {
					return;
				}
				var videoPath = parent.window.opener.gMessJson.mediaPath;
				Mplayer.initPlayer({
					"filename": videoPath
				});
				jQuery(this).addClass('clicked');
			});
			jQuery("#image_struct").html(domStr);
			jQuery('#videoid').on('click', function() {
				Mplayer.initPlayer({
					filename: window.opener.gMessJson.mediaPath
				}); //调用播放器
			});

		},

		//视频入库
		mediaToLib: function() {
			var that = this;
		},
		timeFormat: function(time) {
			if (time === 0 || time === "") {
				return;
			}
			var d = new Date(time);
			var result = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
			return result;
		},
		getDataajax: function(type) {
			var url = "/service/pvd/get_" + type + "_info" + "?timestamp=" + new Date().getTime();
			var id = parent.window.opener.gMessJson.medialibId;
			jQuery.ajax({
				url: url,
				data: {
					"id": id
				},
				dataType: "json",
				type: "get",
				success: function(data) {
					if (data && data.code === 200) {
						var datas = data.data.car;
						for (var key in datas) {
							// console.log(datas[key])
							jQuery("#" + key).val(datas[key]);
						}
					} else {
						notify.error("获取数据失败！");
					}
				}

			});
		},
		setDatatoForm: function() {
			$("#appearTime").val(parent.window.opener.gMessJson.shootTime);
			$("#sourceId").val(parent.window.opener.gMessJson.cloudId);
		},
		closeWindowtitle: function() {
			var that = this;
			if (!JudgeChromeX()) {//window.navigator.userAgent.test('Chrome/30')) {
				document.body.onbeforeunload = function(e) {
					if (that.isSave) {
						return
					} else {
						return "如果点击“离开此页”，您未提交或未保存的上传数据将不会被保存";
					}
				};
			}

		}
	});
	return medialibLink;
});