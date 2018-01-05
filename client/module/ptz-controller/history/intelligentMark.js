define([
	"jquery",
	"/component/base/self/toolkit.js"
], function(jQuery, ToolFun) {
	var markDeal = window.markDeal = {
		 options: {
            templateUrl: "/module/ptz-controller/history/intelligentMarkTemp.html",
            obj: {
                "fileType": "",
                "path": "",
                "id": "",
                "pid": "",
                "parentid": "",
                "shoottime": "",
                "fileName": "",
                "filePath": "",
                "pvdSourceId": "",//pvdSourceId视图库已有id
                "isClue": null
            },
        },
		//ajax请求
		Ajax: function(url, type, data, fn) {
			var ajax = jQuery.ajax({
				url: url,
				data: data,
				cache: false,
				type: type || 'GET',
				async: true,
				success: function(res) {
					fn(res);
				},
				error: function() {
					notify.warn("获取数据异常");
				}
			});
			return ajax;
		},
		init: function(data) {
			var self = this;
			var hisdata = data.hisdata;
			var cameradata = data.cameradata;
			self.Ajax(self.options.templateUrl, "get", {}, function(res) {
				jQuery(".download-record").remove();
				//初始化入库界面
				jQuery(document.body).append(res);
				jQuery(".dialog-history.postform").data("markObj", data);
				self.bindEvents();
			});
		},
		bindEvents: function() {
			/**
			 * bs，1、弹出窗上的取消和关闭按钮事件；2、入云空间、入视图库的确定按钮触发关闭逻辑
			 */
			jQuery(document).off("click", ".dialog-history .dialog-foot .cancel,.dialog-history .dialog-title .close").on("click", ".dialog-history .dialog-foot .cancel,.dialog-history .dialog-title .close", function() {

				//显示之前隐藏的录像查询面板
				window.showHidedHistoryPanel();
				//关闭入库窗口
				jQuery(".dialog-history").remove();
				jQuery(".download-record").remove();
			});
			// 高级设置点击
			$("#smartMarkform li.type .videdoRight_advancedSet").off("click").on("click", function(event) {
				event.preventDefault();
				event.stopImmediatePropagation();
				var tp = $(this).parent("li.type").next("li.type-params");
				if (tp.is(":visible")) {
					tp.hide();
				} else {
					$("#smartMarkform li.type-params").hide();
					tp.show();
				}
			});
			// 判断参数是否为数字并符合指定范围
			$(".type-params-item .spinner").on("keydown", function() {
				$(this).data("oldValue", $(this).spinner("value"));
			}).on("keyup", function() {
				var val = $(this).spinner("value");
				if (val === null || isNaN(val)) {
					val = $(this).data("oldValue");
				}
				$(this).spinner("value", Math.min(Math.max(val, $(this).spinner("option", "min")), $(this).spinner("option", "max")));
			});
			//灰化智能标注运动目标参数编辑框
			var disabledVideoRight_target = function() {
					$('.videoRight_target').prop('checked', false);
					$('.type-params-item [name="move-height"]').spinner({
						disabled: true
					});
					$('.type-params-item [name="move-sensitivity"]').spinner({
						disabled: true
					});
				}
				//灰化智能标注人脸参数编辑框
			var disabledVideoRight_Face = function() {
					$('.videoRight_face').prop('checked', false);
					$('.type-params-item [name="face-minFace"]').spinner({
						disabled: true
					});
					$('.type-params-item [name="face-maxFace"]').spinner({
						disabled: true
					});
				}
				//灰化智能标注车辆参数编辑框
			var disabledVideoRight_size = function() {
					$('.videoRight_size').prop('checked', false);
					$('.type-params-item [name="car-minPlate"]').spinner({
						disabled: true
					});
					$('.type-params-item [name="car-maxPlate"]').spinner({
						disabled: true
					});
					$('.type-params-item [name="car-defaultProvince"]').attr('disabled', 'disabled');
				}
				//灰化智能标注剪切型(灵敏度)参数编辑框
			var disabledVideoRight_bright = function() {
				$('.videoRight_bright').prop('checked', false);
				$('.type-params-item [name="cut-frmThresh"]').spinner({
					disabled: true
				});
				$('.type-params-item [name="cut-sensitiveThresh"]').spinner({
					disabled: true
				});
			}
			var disabledVideoRight_overlayBright = function() {
					$('.videoRight_overlayBright').prop('checked', false);
					$('.type-params-item [name="overlay-frmThresh"]').spinner({
						disabled: true
					});
					$('.type-params-item [name="overlay-sensitiveThresh"]').spinner({
						disabled: true
					});
				}
				//智能标注运动目标-目标高度
			$('#videoRight_targetHeight').on('click', function() {
					disabledVideoRight_Face();
					disabledVideoRight_size();
					disabledVideoRight_bright();
					disabledVideoRight_overlayBright();
					if ($(this).prop('checked')) {
						//$('.type-params-item .move-height-spinner').spinner();
						$(".type-params-item .move-height-spinner").spinner({
							disabled: false
						});
					} else {
						$(".type-params-item .move-height-spinner").spinner({
							disabled: true
						});
					}
				})
				//智能标注运动目标-灵敏度
			$('#videoRight_delicacyLevel').on('click', function() {
				disabledVideoRight_Face();
				disabledVideoRight_size();
				disabledVideoRight_bright();
				disabledVideoRight_overlayBright();

				if ($(this).prop('checked')) {
					$(".type-params-item .move-sensitivity-spinner").spinner({
						disabled: false
					});
				} else {
					$(".type-params-item .move-sensitivity-spinner").spinner({
						disabled: true
					});
				}
			})

			//智能标注运动目标-最小人脸
			$('#videoRight_minimumFace').on('click', function() {
					disabledVideoRight_target();
					disabledVideoRight_size();
					disabledVideoRight_bright();
					disabledVideoRight_overlayBright();

					if ($(this).prop('checked')) {
						$('.type-params-item [name="face-minFace"]').spinner({
							disabled: false
						});
					} else {
						$('.type-params-item [name="face-minFace"]').spinner({
							disabled: true
						});
					}
				})
				//智能标注运动目标-最大人脸
			$('#videoRight_maximumFace').on('click', function() {
				disabledVideoRight_target();
				disabledVideoRight_size();
				disabledVideoRight_bright();
				disabledVideoRight_overlayBright();

				if ($(this).prop('checked')) {
					$('.type-params-item [name="face-maxFace"]').spinner({
						disabled: false
					});

				} else {
					$('.type-params-item [name="face-maxFace"]').spinner({
						disabled: true
					});
				}
			})

			//智能标注运动目标-最小尺寸
			$('#videoRight_minimumSize').on('click', function() {
					disabledVideoRight_Face();
					disabledVideoRight_target();
					disabledVideoRight_bright();
					disabledVideoRight_overlayBright();

					if ($(this).prop('checked')) {
						$('.type-params-item [name="car-minPlate"]').spinner({
							disabled: false
						});

					} else {
						$('.type-params-item [name="car-minPlate"]').spinner({
							disabled: true
						});
					}
				})
				//智能标注运动目标-最大尺寸
			$('#videoRight_maximumSize').on('click', function() {
					disabledVideoRight_Face();
					disabledVideoRight_target();
					disabledVideoRight_bright();
					disabledVideoRight_overlayBright();

					if ($(this).prop('checked')) {
						$('.type-params-item [name="car-maxPlate"]').spinner({
							disabled: false
						});

					} else {
						$('.type-params-item [name="car-maxPlate"]').spinner({
							disabled: true
						});

					}
				})
				//智能标注运动目标-省默认名
			$('#videoRight_defaultProvinceName').on('click', function() {
				$('.videoRight_face').prop('checked', false);
				disabledVideoRight_Face();
				disabledVideoRight_target();
				disabledVideoRight_bright();
				disabledVideoRight_overlayBright();
				if ($(this).prop('checked')) {
					$('.type-params-item [name="car-defaultProvince"]').removeAttr('disabled');
				} else {
					$('.type-params-item [name="car-defaultProvince"]').attr('disabled', 'disabled');
				}
			})

			//智能标注运动目标-剪切型-亮度灵敏度
			$('#videoRight_brightSensibility').on('click', function() {
					disabledVideoRight_size();
					disabledVideoRight_Face();
					disabledVideoRight_target();
					disabledVideoRight_overlayBright();

					if ($(this).prop('checked')) {
						$('.type-params-item [name="cut-frmThresh"]').spinner({
							disabled: false
						});
					} else {
						$('.type-params-item [name="cut-frmThresh"]').spinner({
							disabled: true
						});
					}
				})
				//智能标注运动目标-剪切型-面积灵敏度
			$('#videoRight_areaSensibility').on('click', function() {
				disabledVideoRight_size();
				disabledVideoRight_Face();
				disabledVideoRight_target();
				disabledVideoRight_overlayBright();

				if ($(this).prop('checked')) {
					$('.type-params-item [name="cut-sensitiveThresh"]').spinner({
						disabled: false
					});
				} else {
					$('.type-params-item [name="cut-sensitiveThresh"]').spinner({
						disabled: true
					});
				}
			})

			// 运动目标高度取值范围
			$(".type-params-item .move-height-spinner").spinner({
				min: 10,
				max: 1000, // 最大值为视频 宽高中 较小的一个
				disabled: true
			});
			// 运动目标灵敏度
			$(".type-params-item .move-sensitivity-spinner").spinner({
				min: 1,
				max: 5,
				disabled: true
			});
			// 最小最大人脸
			$(".type-params-item .face-spinner").spinner({
					min: 60,
					max: 1000, // 最大值为视频 宽高中 较小的一个
					disabled: true
				})
				// 车辆最大最小尺寸
			$(".type-params-item .car-spinner").spinner({
					min: 40,
					max: 1000, // 最大值为视频 宽高中 较小的一个
					disabled: true
				})
				// 灵敏度
			$(".type-params-item .frmThresh-spinner").spinner({
				min: 1,
				max: 5,
				disabled: true
			});
			// 面积灵敏度
			$(".type-params-item .sensitiveThresh-spinner").spinner({
				min: 1,
				max: 100,
				disabled: true
			});
			// 点击剪切型视频 默认选中运动目标
			var cancelChecked = function($dom, $spinner) {
				if ($dom.prop('checked')) {
					$dom.prop('checked', false);
					$spinner.spinner({
						disabled: true
					});
				}
			}
			//剪切型参数点击事件
			$("#type-summary-cut").on("click", function() {
				if (this.checked) {
					$('#videoRight_targetHeight').removeAttr('disabled');
					$('#videoRight_delicacyLevel').removeAttr('disabled');
					$("#type-mark-move").prop("checked", this.checked);
					$("#type-mark-move").attr('disabled', 'disabled');
					$('#videoRight_brightSensibility').removeAttr('disabled');
					$('#videoRight_areaSensibility').removeAttr('disabled');
				} else {
					$('#videoRight_brightSensibility').attr('disabled', 'disabled');
					$('#videoRight_areaSensibility').attr('disabled', 'disabled');
					cancelChecked($('#videoRight_brightSensibility'), $('.type-params-item [name="cut-frmThresh"]'));
					cancelChecked($('#videoRight_areaSensibility'), $('.type-params-item [name="cut-sensitiveThresh"]'));
					if (!$("#type-summary-overlay").prop('checked')) {
						$("#type-mark-move").removeAttr('disabled');
					}
				}
			});
			//叠加性参数点击事件
			$('#type-summary-overlay').on('click', function() {
				if (this.checked) {
					$('#videoRight_targetHeight').removeAttr('disabled');
					$('#videoRight_delicacyLevel').removeAttr('disabled');
					$("#type-mark-move").prop("checked", this.checked);
					$("#type-mark-move").attr('disabled', 'disabled');
				} else {
					if (!$("#type-summary-cut").prop('checked')) {
						$("#type-mark-move").removeAttr('disabled');
					}
				}
			})
			//修改当前dom 状态
			var changeDisabled = function(mainDom, friDom, secDom, thirdDom) {
				var $dom = thirdDom || secDom;
				mainDom.on('click', function() {
					if (mainDom.prop('checked')) {
						friDom.removeAttr('disabled');
						secDom.removeAttr('disabled');
						$dom.removeAttr('disabled');
					} else {
						if (mainDom.selector === '#type-mark-move') {
							if ($('#type-summary-cut').prop('checked')) {
								$('#type-summary-cut').trigger('click');
							}
							if ($('#type-summary-overlay').prop('checked')) {
								$('#type-summary-overlay').trigger('click');
							}
						}
						cancelChecked($('#videoRight_targetHeight'), $(".type-params-item .move-height-spinner"));
						cancelChecked($('#videoRight_delicacyLevel'), $(".type-params-item .move-sensitivity-spinner"));
						cancelChecked($('#videoRight_minimumFace'), $('.type-params-item [name="face-minFace"]'));
						cancelChecked($('#videoRight_maximumFace'), $('.type-params-item [name="face-maxFace"]'));
						cancelChecked($('#videoRight_minimumSize'), $('.type-params-item [name="car-minPlate"]'));
						cancelChecked($('#videoRight_maximumSize'), $('.type-params-item [name="car-maxPlate"]'));
						if ($('#videoRight_defaultProvinceName').prop('checked')) {
							$('#videoRight_defaultProvinceName').prop('checked', false);
						}
						$('.type-params-item [name="car-defaultProvince"]').attr('disabled', 'disabled');
						friDom.attr('disabled', 'disabled');
						secDom.attr('disabled', 'disabled');
						$dom.attr('disabled', 'disabled');
					}
				})
			};

			changeDisabled($("#type-mark-move"), $('#videoRight_targetHeight'), $('#videoRight_delicacyLevel'));
			changeDisabled($("#type-mark-face"), $('#videoRight_minimumFace'), $('#videoRight_maximumFace'));
			changeDisabled($("#type-mark-car"), $('#videoRight_minimumSize'), $('#videoRight_maximumSize'), $('#videoRight_defaultProvinceName'));
			//生成智能标注
			$("#smartMarkSave").on("click", function(event) {
				event.preventDefault();
				event.stopImmediatePropagation();
				if (!$("#smartMarkform .type-mark input").is(":checked")) {
					notify.warn("请选择类型！");
					return false;
				}
				startSmart();
			});
			// 生成标注
			function startSmart() {
				var params = {};

				// 运动目标
				if ($("#type-mark-move").prop("checked")) {
					params.motionObject = {
						// 目标高度
						height: $('.type-params-item [name="move-height"]').spinner("value"),
						// 灵敏度
						sensitivity: $('.type-params-item [name="move-sensitivity"]').spinner("value")
					};
				}
				// 人脸
				if ($("#type-mark-face").prop("checked")) {
					params.face = {
						// 最小人脸
						minFace: $('.type-params-item [name="face-minFace"]').spinner("value"),
						// 最大人脸
						maxFace: $('.type-params-item [name="face-maxFace"]').spinner("value")
					};
				}
				// 车辆
				if ($("#type-mark-car").prop("checked")) {
					params.vehicle = {
						// 融合帧数
						//integrationFrameRate: $('.type-params-item [name="car-integrationFrameRate"]').spinner("value"),
						// 最小尺寸
						minPlate: $('.type-params-item [name="car-minPlate"]').spinner("value"),
						// 最大尺寸
						maxPlate: $('.type-params-item [name="car-maxPlate"]').spinner("value"),
						// 跳桢数
						//skipFrames: $('.type-params-item [name="car-skipFrames"]').spinner("value"),
						// 默认省
						province: $('.type-params-item [name="car-defaultProvince"]').val()
					};
				}
				// 剪切型
				if ($("#type-summary-cut").prop("checked")) {
					// 视频摘要
					params.videoSummary = {
						model: "Shear",
						// 亮度灵敏度
						frmThresh: $('.type-params-item [name="cut-frmThresh"]').spinner("value"),
						// 面积灵敏度
						sensitiveThresh: $('.type-params-item [name="cut-sensitiveThresh"]').spinner("value")
					};
				}
				// 叠加型
				if ($("#type-summary-overlay").prop("checked")) {
					// 视频摘要
					if ($("#type-summary-cut").prop("checked")) {
						params.videoSummary.model = "Shear|Overlay";
					} else {
						params.videoSummary = {
							model: "Overlay"
						}
					}
				}
				var currData = jQuery(".dialog-history.postform").data("markObj"),playedata,
				directoryId = 0,//默认给成根目录
				playinfo = currData.hisdata,
				order = currData.order,
				channelid = currData.channelid;
				//order等于-1时  代表下载搜索开始时间到结束时间之间的历史录像 
				if (order === -1) {
					playedata = playinfo.videos[0]; //数据入口时  已经约定了第一个元素用来存放数据
				} else {
					playedata = playinfo.videos[order];
				}
				var data = {
					directoryId: directoryId,
					channelId: channelid,
					beginTime: playedata[0],
					endTime: playedata[1],
					vodType: playedata[2],
					marks:JSON.stringify(params)
				};
				jQuery.ajax({
					url: "/service/history/voddownload",
					data: data,
					cache: false,
					type: 'POST',
					async: true,
					success: function(res) {
						if (res.code == 200) {
							notify.info("历史录像下载任务提交成功");
							//日志记录，保存XX摄像机视频到云空间,add by wujingwen, 2015.08.11
							var startTime = Toolkit.mills2datetime(data.beginTime);
							var endTime = Toolkit.mills2datetime(data.endTime);
							logDict.insertMedialog("m1", "保存" + playinfo.name + "摄像机历史视频到云空间" + startTime + "--" + endTime);
						} else {
							notify.warn("历史录像下载出错code=" + res.code);
						}
					},
					error: function() {
						notify.warn("历史录像下载error");
					}
				});
				//关闭弹出窗
				jQuery(".dialog-history .dialog-foot .cancel,.dialog-history .dialog-title .close").trigger("click");
				return false;

			};

		}

	}


});