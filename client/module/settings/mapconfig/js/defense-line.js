/**
 * // 电子防线管理
 * @author chencheng
 * @date   2014-12-03
 */
define(["./config","js/defenseline-model","mootools","spectrum"], function(mapSettings,lineModel) {
	
	var EleDefenseLineMgr = new Class({

		Implements: [Options, Events],

		options: {
			itemsPerPage: 7
		},

		validateFlag: false,

		initialize: function(options) {
			this.setOptions(options);
			this.bindEvents();
		},
		reload: function() {
			this.getEleDefenseLines();
		},
		/*
		 *	分页获取电子防线信息
		 */
		getEleDefenseLines: function() {
			var self = this;
			var itemsPerPage = this.options.itemsPerPage;

			lineModel.getElecLines({
				current_page: 1,
				page_size: itemsPerPage
			}).then(function(res) {
				if (res.code === 200) {
					var hasMorePages = res.data.total > 1 ? true : false;
					jQuery("#defenseList div.list").empty().html(mapSettings.template({
						"eledefenseLines": res.data.eledefenseline
					}));
					permission && permission.reShow();
					
					if(!hasMorePages){
						jQuery(".tab-content .pagination").empty();
					}
					// self.scrollBar.tinyscrollbar_update('top');
					self.bindListItemClick();

					if (res.data.total > 1) {
						mapSettings.setPagination(res.data.count, "#defenseScrollBar .pagination", itemsPerPage, function(nextPage) {
							lineModel.getElecLines({
								current_page: nextPage,
								page_size: itemsPerPage
							}).then(function(res1) {
								if (res1.code === 200) {
									jQuery("#defenseList div.list").empty().html(mapSettings.template({
										"eledefenseLines": res1.data.eledefenseline
									}));

									permission && permission.reShow();

									if (res1.data.total <= 1) {
										jQuery(".tab-content .pagination").hide();
									} else {
										jQuery(".tab-content .pagination").show();
									}
									self.bindListItemClick();
								} else {
									notify.warn("网络异常！");
								}
							});
						});
					}
				} else {
					notify.warn("网络异常！");
				}
			});
		},
		/*
		 *	保存电子防线信息
		 */
		saveEleDefenseLine: function(obj, callback) {
			var custom = {
				beforeSend:function(){
					jQuery("#sure").prop("disabled",true);
				},
				complete:function(){
					jQuery("#sure").prop("disabled",false);
				}
			};
			lineModel.createElecLine(obj, custom).then(function(res){
				if (res.code === 200) {
					notify.success("电子防线创建成功！");
					logDict.insertLog('m3', 'f9', 'o1', '', "创建名称为 " + obj.name + " 的电子防线");
					callback();
				} else {
					notify.warn("电子防线创建失败！");
				}
			});
		},
		/*
		 *	删除电子防线 @id:电子防线唯一标识符
		 */
		deleteEleDefenseLine: function(id,name) {
			var self = this;
			new ConfirmDialog({
				title: '删除电子防线',
				confirmText: '确定',
				message: "<p>确定要删除该电子防线吗？</p>",
				callback: function() {
					this.hide();
					lineModel.deleteElecLine({
						"id": id
					}).then(function(res) {
						if (res.code === 200) {
							// 清除图层
							PVAMap.options.map.clearOverlays();
							notify.success("电子防线删除成功！");
							logDict.insertLog('m3', 'f9', 'o3', '', "删除名称为 " + name + " 的电子防线");
							self.getEleDefenseLines();
						} else {
							notify.warn("电子防线删除失败！");
						}
					});
					return false;
				}
			});
		},
		/*
		 *	重名验证
		 */
		checkName: function(name) {
			var self = this;
			var result = false;
			// if (self.request) {
			// 	self.request.abort();
			// }

			self.request = lineModel.checkElecLineName({
				"name": name
			}, {
				async: false
			}).then(function(res) {
				if (res.code === 200) {
					if (res.data.message) {
						result = true;
					}
				} else {
					notify.warn("网络异常！");
				}
			});
			
			return result;
		},
		/*
		 *	电子防线列表 点击高亮显示边框
		 */
		bindListItemClick: function() {
			var self = this;
			// 列表点选高亮显示
			jQuery("div[data-view='defense'] #defenseList div.item").unbind("click").bind("click",function() {
				jQuery(this).addClass("selected").siblings(".item").removeClass("selected");
			});
			// 删除电子防线
			jQuery("div[data-view='defense'] #defenseList div.item  a.del-defense").unbind("click").bind("click",function() {
				var el = jQuery(this);
				self.deleteEleDefenseLine(el.attr("data-id"),el.attr("data-name"));
			});
			// 在地图上显示电子防线
			jQuery("div[data-view='defense'] #defenseList div.item  a.showline").unbind("click").bind("click",function() {
				var el = jQuery(this);
				logDict.insertLog('m3', 'f9', 'o4', '',el.attr("title") + " 电子防线");
				self.showPolygon(JSON.parse(el.attr("data-pointinfo")),el.attr("data-color"),el.attr("data-zoom"));
			});
		},
		/*
		 *	绑定相关按钮事件
		 */
		bindEvents: function() {
			var self = this;
			// 新增按钮事件
			jQuery("div[data-view='defense'] button#add").unbind("click").bind("click",function(evt) {
				var defenseView = jQuery("div[data-view='defense']");
				defenseView.find(".group1").hide();
				defenseView.find("#defenseForm").show();
				defenseView.find("#defenseForm input#name").val("");
				defenseView.find("#defenseForm  #lineDescription").val("");
				// 清除之前的数据
				PVAMap.options.map.clearOverlays();
			});

			// 返回
			jQuery("div[data-view='defense'] button#back").unbind("click").bind("click",function() {
				jQuery("div[data-view='defense']").find(".group1").show();
				jQuery("div[data-view='defense']").find("#defenseForm").hide();
			});

			// 电子防线重名验证
			jQuery("div[data-view='defense'] input#name").unbind("blur").bind("blur",function() {
				var el = jQuery(this);
				var name = el.val().trim();
				if (name !== "") {
					if (!self.checkName(name)) {
						if (!el.hasClass("warn")) {
							el.addClass("warn");
						}
						notify.warn("该名称已存在！");
						self.validateFlag = false;
						return false;

					} else {
						el.removeClass("warn");
						self.validateFlag = true;
					}
				}

			});

			//新建 -> 提交表单 
			jQuery("div[data-view='defense'] button#sure").unbind("click").bind("click",function() {
				var form = jQuery("div[data-view='defense']").find("#defenseForm");
				var points = mapSettings.mapMgr.getPolygonPoints();

				if (points) {
					var obj = {
						name: form.find("#name").val(),
						description: form.find("#lineDescription").val(),
						color: form.find("#chooseColor").val(),
						type: 1,
						pointinfo: JSON.stringify(points),
						code: "E11",
						area: mapSettings.mapMgr.getPolygonArea(),
						zoom: mapSettings.mapMgr.getZoom()
					};

					if (obj.name === "") {
						notify.warn("名称不能为空！");
						return false;
					} else if (obj.name.length > 50) {
						notify.warn("名称长度不大于50字符！");
						return false;
					} else if (obj.description.length > 200) {
						notify.warn("描述长度不大于200字符！");
						return false;
					} else {
						// 保存信息时再次进行重名验证
						if (!self.validateFlag) {
							var el = jQuery("div[data-view='defense'] input#name");
							var name = el.val().trim();

							if (!self.checkName(name)) {
								if (!el.hasClass("warn")) {
									el.addClass("warn");
								}
								notify.warn("该名称已存在！");
								return false;

							} else {
								el.removeClass("warn");
							}
						}
					}

					self.saveEleDefenseLine(obj, function() {

						// 保存成功后，清空之前的区域信息
						mapSettings.polygonPoints = null;

						jQuery(".tab-panel  .tabs li[data-tab='defense']").click();
					});
				} else {
					notify.warn("请在地图上添加防线！");
				}

			});

			// 选择颜色
			jQuery("#chooseColor").spectrum({
				color: "#ff0000",
				showInput: true,
				className: "full-spectrum",
				showInitial: true,
				showPalette: true,
				showSelectionPalette: true,
				maxPaletteSize: 10,
				preferredFormat: "hex",
				localStorageKey: "spectrum.demo",
				cancelText: "取消",
				chooseText: "确定",
				move: function(color) {

				},
				show: function() {

				},
				beforeShow: function() {

				},
				hide: function() {

				},
				change: function() {

				},
				palette: [
					"rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)", "rgb(204, 204, 204)", "rgb(217, 217, 217)",
					"rgb(255, 255, 255)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)",
					"rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
					"rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)",
					"rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)",
					"rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)",
					"rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)",
					"rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)",
					"rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)",
					"rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
					"rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
					"rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
					"rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)",
					"rgb(12, 52, 61)"
				]
			});

			// 选择工具 - 画线
			jQuery("div[data-view='defense'] #defenseForm a.tool-line").unbind("click").bind("click",function() {
				jQuery(this).addClass("active").siblings().removeClass("active");
			});

			// 选择工具 - 画面
			jQuery("div[data-view='defense'] #defenseForm a.tool-cover").unbind("click").bind("click",function(evt) {
				jQuery(this).addClass("active").siblings().removeClass("active");
				mapSettings.lineColor = jQuery("div[data-view='defense']").find("#chooseColor").val();
				mapSettings.mapMgr.drawCover(mapSettings.lineColor, evt);
			});
		},
		/*
		 *	显示多边形
		 */
		showPolygon: function(data, color, zoom) {
			mapSettings.mapMgr.showPolygon(data, color, zoom);
		}

	});
	return EleDefenseLineMgr;
});