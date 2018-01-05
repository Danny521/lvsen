/*
巡航(用mootools的class管理)
*/
define([
	'ajaxModel',
	'handlebars',
	'jquery.datetimepicker'
], function(ajaxModel) {
	
	window._console = {};
	window._console.log = function(str) {
		var data = JSON.stringify({
			type: "console.log",
			message: str
		});
		OnBeforeNavigate2(data);
	};

	window.CruiseModule = new Class({
		Implements: [Events, Options],
		SCOPE: null,
		style: "/module/ptz-controller/cruise/main.css",
		/*保存摄像机的巡航*/
		save_cruise: '/service/ptz/save_cruise',
		/*获取摄像头所有预置位*/
		get_presets: '/service/ptz/get_presets',
		/*获取巡航的配置*/
		get_cruise: '/service/ptz/get_cruise',
		/*模版地址*/
		get_tpl: '/module/ptz-controller/cruise/tpl/tpl.html',
		/*获取自动巡航接口*/
		api_autoCruises: '/service/ptz/autoCruises',
		/*获取时间段巡航接口*/
		api_timeCruises: '/service/ptz/timeCruises',
		/*时间段巡航是否重名 http:delete*/
		api_hasTimeCruiseName: '/service/ptz/hasTimeCruiseName',
		/*自动巡航是否重名 http:delete*/
		api_hasAutoCruiseName: '/service/ptz/hasAutoCruiseName',
		/*删除自动巡航*/
		api_delAutoCruise: '/service/ptz/autoCruises/',
		/*删除时间段巡航*/
		api_delTimeCruise: '/service/ptz/timeCruises/',
		/*编译后的模版对象tplObj(data)*/
		tplObj: null,
		cruiseType: '0',
		/*巡航类型0:自动;1:时间段*/
		/*保存正在巡航的巡航数据*/
		cruising: {
			/*启动按钮那个节点*/
			node: null,
			/*正在巡航的这条巡航数据*/
			data: {}
		},
		data: {
			persetsList: null,
			autoCruise: null,
			timeCruise: null
		},
		options: {
			"cameraId": ''
		},
		initialize: function(options) {
			var self = this;
			this.setOptions(options);
			this.addClass();
			this.getTpl();

			this.bindEvents();

			/*初始化就保存当前摄像机预置位的列表*/
			this.getPresets(self.options.cameraId);
			/*获取自动巡航列表*/
			this.getAutoCruise(self.options.cameraId);
			/*获取时间段巡航列表*/
			//this.getTimeCruise(self.options.cameraId);
			this.addHelper();
		},
		initData: function(options) {
			var self = this;
			this.setOptions(options);
			this.addClass();
			this.getTpl();
			/*初始化就保存当前摄像机预置位的列表*/
			this.getPresets(self.options.cameraId);
			/*获取自动巡航列表*/
			this.getAutoCruise(self.options.cameraId);
			this.addHelper();
		},
		bindEvents: function() {
			var self = this;
			/*tab切换*/
			jQuery(document).on('click', '.tab-title', function() {
				var $this = jQuery(this);
				var addNode = jQuery('.c-add .setting');
				self.cruiseType = $this.attr('data-tab');
				$this.addClass('active').siblings().removeClass('active');
				jQuery('.tab-content[data-tab=' + self.cruiseType + ']').addClass('active').siblings('.tab-content').removeClass('active');
				self.cruiseType === '0' ? addNode.attr('title', "新增自动巡航") : addNode.attr('title', "新增时间段巡航");
			});

			/*删除巡航配置*/
			jQuery(document).on('click', '.l-controller .del', function() {
				var id = jQuery(this).parent().parent().attr("id");
				if (jQuery(this).prev().prev().hasClass("active")) {
					notify.warn("当前处于巡航中，不允许删除");
					return;
				}
				//var url = (self.cruiseType === '0' ? self.api_delAutoCruise : self.api_delAutoCruise) + self.SCOPE.id;
				var url = (self.cruiseType === '0' ? self.api_delAutoCruise : self.api_delAutoCruise) + id;
				var $this = jQuery(this);
				jQuery.ajax({
					url: url,
					type: 'delete'
				}).then(function(res) {
					if (res && res.code && res.code === 200) {
						notify.info("删除巡航计划成功!");
						$this.closest('li').fadeOut('fase', function() {
							$this.remove();
						});
					}
				});
			});

			/*编辑巡航*/
			jQuery(document).on('click', '.l-controller .edit', function() {
				if (jQuery(this).prev().hasClass("active")) {
					notify.warn("当前处于巡航中，不允许编辑");
					return;
				}

				var index = jQuery(".l-controller .switch.active").parent().parent().index();
				jQuery(".cruise-list .show-cruise-list").attr("auto", index);
				self.getCruiseDetails(self.SCOPE.cameraId, self.cruiseType, self.SCOPE.id);
				jQuery("#save_auto").addClass("js-updata");
			});

			/*switch 开关*/
			/*
			jQuery(document).on('click','.switch',function(){
				if(jQuery(this).hasClass('active')){
					jQuery(this).removeClass('active')
				} else {
					jQuery(this).addClass('active');
				}
			});
			*/

			/*新增巡航*/

			jQuery(document).on('click', '.c-add .setting', function() {
				if (jQuery(".l-controller .switch").hasClass("active")) {
					notify.warn("当前处于巡航中，不允许该操作");
					return;
				}
				var data = {};
				jQuery('.cruise-inner').hide();
				if (self.cruiseType === '0') {
					jQuery('.add-content.add-auto').show();
					data = {
						"addAuto": {
							"presets": self.data.persetsList
						}
					};
					self.renderAutoDetails(data);
				} else {
					jQuery('.add-content.add-time').show();
					data = {
						"addTime": {
							"presets": self.data.persetsList
						}
					};
					self.renderTimeDetails(data);
				}
			});

			jQuery(document).on('click', 'button.addcruise', function() {
				if (jQuery(".l-controller .switch").hasClass("active")) {
					notify.warn("当前处于巡航中，不允许新增巡航");
					return;
				}
				var data = {};
				jQuery('.cruise-inner').hide();

				if (self.cruiseType === '0') {
					jQuery('.add-content.add-auto').show();
					data = {
						"addAuto": {
							"presets": self.data.persetsList
						}
					};
					self.renderAutoDetails(data);
				} else {
					jQuery('.add-content.add-time').show();
					data = {
						"addTime": {
							"presets": self.data.persetsList
						}
					};
					self.renderTimeDetails(data);
				}
				jQuery("#save_auto").addClass("js-add");
			});

			/*返回*/
			jQuery(document).on('click', '.add-content .go-back', function() {
				jQuery('.cruise-inner').show();
				jQuery('.add-content').hide();
			});

			/*取消*/
			jQuery(document).on('click', '#cancel_auto,#cancel_time', function() {
				jQuery('.go-back').trigger('click');
			});

			/*给新建的自动巡航新增预置位*/
			jQuery(document).on('click', '.add-auto .add-new', function() {
				if (self.data.persetsList == '' || self.data.persetsList.length === 0) { //增加预置位有无的判断。 -- 于秋
					notify.warn('请先添加预置位。');
				} else {
					var html = self.tplObj({
						"addAutoPerset": {
							"presets": self.data.persetsList
						}
					});
					jQuery('.auto-ul').append(html);
				}

			});
			/*给新建的时间段巡航新增预置位*/
			jQuery(document).on('click', '.add-time .add-new', function() {
				var html = self.tplObj({
					"addTimePerset": {
						"presets": self.data.persetsList
					}
				});
				jQuery('.time-ul').append(html);
				self.addDatePicker();
			});

			/*删除巡航计划中的预置位*/
			jQuery(document).on('click', '.auto-ul .del', function() {
				var li = jQuery(this).closest('li');
				li.fadeOut('fast', function() {
					li.remove();
				})
			});

			/*上移*/
			jQuery(document).on('click', '.pre-controller .up', function() {
				var $this = jQuery(this)
				var parLi = $this.closest('li');
				var index = parLi.index();
				var parUl = $this.closest('ul');

				if (index === 0) {
					return;
				} else {
					parUl.find('li').eq(index - 1).insertAfter(parLi);
				}
			});
			/*下移*/
			jQuery(document).on('click', '.pre-controller .down', function() {
				var $this = jQuery(this)
				var parLi = $this.closest('li');
				var index = parLi.index();
				var parUl = $this.closest('ul');
				var l = parUl.find('li').length;

				if (index === (l - 1)) {
					return;
				} else {
					parUl.find('li').eq(index + 1).insertBefore(parLi);
				}
			});

			var cruiseN = 0;

			/*保存自动巡航*/
			jQuery(document).on('click', '#save_auto', function() {
				//var index=jQuery(".l-controller .switch.active").parent().parent().index();
				var index = jQuery(".cruise-list .show-cruise-list").attr("auto") - 0;
				var parNode = jQuery(this).closest('.n-content');
				//var btime = parNode.find('#begin-time').val().trim();
				//var etime = parNode.find('#end-time').val().trim();
				var name = parNode.find('#new-cruise-name').val().trim();
				var persetId = parNode.find('#after-down').val();

				var liNode = parNode.find('ul li');
				var l = liNode.length;
				var arr = [];
				var curLi = null;
				if (l < 1) {
					notify.warn("巡航计划必须要有预置位信息！");
					return;
				}
				for (var i = 0; i < l; i++) {
					var obj = {};
					curLi = liNode.eq(i);
					//obj.id = parseInt(curLi.attr('data-id'),10);
					//增加预置位有无的判断。 -- 于秋
					if (curLi.find('.presetId').val() == null) {
						notify.warn('请先添加预置位。');
						return;
					}
					obj.sortNo = i + 1;
					obj.presetId = curLi.find('.presetId').val().trim();
					obj.presetName = curLi.find(':selected').text().trim();
					obj.internalTime = curLi.find('.internalTime').val().trim();

					/**
					 * bug[33633],添加正则验证，modify by zhangyu on 2015/5/24
					 * @type {RegExp}
					 */
					var partern = /^\+?[1-9][0-9]*$/gi;
					//判断是否是数子
					if (!partern.test(obj.internalTime)) {
						notify.warn('间隔时间请输入正整数！');
						curLi.find('.internalTime').focus();
						return;
					}
					arr.push(obj);
				}
				var cruiseid = jQuery('.add-content.add-auto').attr("cruiseid");
				var cameraId = jQuery('.add-content.add-auto').attr("cameraId");
				//console.log(self.options);
				var cdata = jQuery(".win-dialog.ptz-control").data("cdata");
				var cameraId = cdata.cId || cdata.playingChannel.id;
				if (name == "") {
					//	cruiseN++;
					//	name="巡航计划"+cruiseN;
					self.liNum = self.liNum + 1;
					name = "巡航计划" + self.liNum;
				}
				var data = {
					"cameraId": self.options.cameraId,
					"type": 0,
					"cruise": JSON.stringify({
						"startTime": "", //self.parseTime(btime),
						"endTime": "", //self.parseTime(etime),
						"preset": arr,
						"presetId": parseInt(persetId, 10)
					}),
					"name": name,
					"id": cruiseid
				};
				if (jQuery(this).hasClass("js-add")) {
					delete data.id;
				}
				//alert(JSON.stringify(data));
				ajaxModel.postData(self.save_cruise, data).then(function(res) {
					if (res && res.code && res.code === 200) {
						notify.info("保存自动巡航成功");
						self.getAutoCruise(self.options.cameraId, function() {
							//active.addClass("active");
							jQuery(".show-cruise-list .l-controller .switch").removeClass("active");
							if (index === -1) {
								return
							}
							jQuery(".show-cruise-list .l-controller .switch:eq(" + index + ")").addClass("active");
						});
					} else {
						notify.info("保存出错,错误码 : " + res.code);
					}
				});
			});

			/*保存时间段巡航*/
			jQuery(document).on('click', '#save_time', function() {
				var parNode = jQuery(this).closest('.n-content');
				var name = parNode.find('#new-cruise-name').val().trim();
				var persetId = parNode.find('#after-down').val();

				var liNode = parNode.find('ul li');
				var l = liNode.length;
				var arr = [];
				var curLi = null;

				for (var i = 0; i < l; i++) {
					var obj = {};
					curLi = liNode.eq(i);
					obj.id = parseInt(curLi.attr('data-id'), 10);
					obj.sortNo = i + 1;
					obj.presetId = curLi.find('.presetId').val().trim();
					obj.presetName = curLi.find(':selected').text().trim();
					obj.startTime = self.parseTime(curLi.find('.btime').val().trim());
					obj.endTime = self.parseTime(curLi.find('.etime').val().trim());

					arr.push(obj);
				}

				var data = {
					"cameraId": self.options.cameraId,
					"type": 1,
					"cruise": JSON.stringify({
						"preset": arr,
						"presetId": parseInt(persetId, 10)
					}),
					"name": name
				};
				ajaxModel.postData(self.save_cruise, data).then(function(res) {
					if (res && res.code && res.code === 200) {
						self.getTimeCruise(self.options.cameraId);
					} else {
						notify.info("保存出错,错误码 : " + res.code);
					}
				});
			});

			/*启 动巡航*/

			//jQuery(document).off('click','.l-controller .switch');
			/*判断是否有值,暂停cruising:{node:,data:}保存的数据,切换node的样式*/
			/*新保存数据到 cruising{node:按钮节点对象,data:巡航的相关数据}*/
			/*启动新巡航*/

			jQuery(document).on('click', '.l-controller .switch', function() {
				//alert("执行switch");
				//console.log("switch-"+Math.random());
				var nodeself = this;
				var data = jQuery(".win-dialog.ptz-control").data("cdata");
				if (data.path) {
					var cameraNo1 = data.path;
				}
				if (data.playingChannel) {
					var cameraNo2 = data.playingChannel.path;
				}
				var cameraNo = cameraNo1 || cameraNo2;
				var id = jQuery(this).parent().parent().attr("id");
				var cameraId = jQuery(this).parent().parent().attr("cameraId");
				if (jQuery(this).hasClass('active')) {
					//当前节点处于巡航状态，则关闭
					//alert("当前节点处于巡航状态，则关闭");
					jQuery(nodeself).removeClass('active');
					//日志记录，停止XX摄像机云台,add by wujingwen, 2015.08.31
					logDict.insertMedialog("m1", "停止" + data.cName + "摄像机巡航");
					self.setCruiseStatus(cameraId, id, 0, function() {
						jQuery(nodeself).removeClass('active');
					});

					self.getCruiseData(cameraId, 0, id, function(autoCruise) {
						clearTimeout(self.RunCruiseTimer);
						if (self.RunCruiseAjax) {
							self.RunCruiseAjax.abort();
						}
						var presets = autoCruise.presets;
						if (presets.length === 0) {
							notify.warn("该巡航计划的预置位已经全部被删除！");
							return;
						}
						var presetId = autoCruise.presetId;
						gPtz.callPreset({
							cameraId: cameraId,
							cameraNo: cameraNo,
							presetId: presetId
						});
					});
					return;
				} else {
					//日志记录，启动XX摄像机云台,add by wujingwen, 2015.08.12
					logDict.insertMedialog("m1", "启动" + data.cName + "摄像机巡航。");
					//有其他节点处于巡航状态，则关闭，再开启当前节点的巡航状态
					var active_switch = jQuery(".cruise-list li.auto-list .l-controller i.switch.active");
					if (active_switch[0]) {
						//	alert("有其他节点处于巡航状态，则关闭，再开启当前节点的巡航状态");
						var oid = active_switch.parent().parent().attr("id");
						self.setCruiseStatus(cameraId, oid, 0, function() {
							active_switch.removeClass("active");
						});
						//	active_switch.removeClass("active");				
					}

					self.setCruiseStatus(cameraId, id, 1, function() {
						jQuery(nodeself).addClass('active');
						//alert("开启当前节点的巡航状态");
					});

					self.getCruiseData(cameraId, 0, id, function(autoCruise) {
						jQuery(nodeself).addClass('active');
						var presets = autoCruise.presets;
						//alert(JSON.stringify(autoCruise));
						if (presets.length === 0) {
							notify.warn("该巡航计划的预置位已经被删除！");
							return;
						}
						self.RunCruise(autoCruise, cameraNo, 0, true);
					});
					return;
				}
			});
		},

		/**
		 * [setCruiseStatus  启用巡航设置状态]
		 * @author huzc
		 * @date   2015-04-28
		 * @param  {[type]}   id [description]
		 * @param  {[type]}   k  [description]
		 * @param  {Function} fn [description]
		 */
		setCruiseStatus: function(cameraId, id, k, fn) {
			jQuery.ajax({
				url: "/service/ptz/autoCruise/status/" + id,
				type: "post",
				dataType: "json",
				data: {
					status: k,
					cameraId: cameraId
				},
				success: function(res) {
					if (res.code === 200) {
						fn && fn(res);
					}
				},
				error: function(err) {
					fn && fn(err);
				}
			});
		},
		renderHtml: function(parNode, html) {
			parNode.html(html);
		},
		getTpl: function() {
			var self = this;
			ajaxModel.getTml(self.get_tpl).then(function(html) {
				self.tplObj = Handlebars.compile(html);
			});
		},
		/*获取预置位*/
		getPresets: function(cameraId) {
			var self = this;
			ajaxModel.getData(self.get_presets, {
				'cameraId': cameraId
			}).then(function(res) {
				if (res && res.code && res.code === 200) {
					self.data.persetsList = res.data.presets;
				}
			});
		},
		/**
		 * [getCruiseData 获取自动,时间巡航预置位配置数据,带回调]
		 * @author huzc
		 * @date   2015-04-28
		 * @param  {[type]}   cameraId [description]
		 * @param  {[type]}   type     [description]
		 * @param  {[type]}   id       [description]
		 * @param  {Function} fn       [description]
		 * @return {[type]}            [description]
		 */
		getCruiseData: function(cameraId, type, id, fn) {
			var self = this;
			ajaxModel.getData(self.get_cruise, {
				'cameraId': cameraId,
				'type': type,
				'id': id
			}).then(function(res) {
				if (res && res.code === 200) {
					fn && fn(res.data.autoCruise);
				}
			});
		},
		/**
		 * [getCruiseDetails 获取自动,时间巡航预置位配置数据]
		 * @author huzc
		 * @date   2015-04-28
		 * @param  {[type]}   cameraId [description]
		 * @param  {[type]}   type     [description]
		 * @param  {[type]}   id       [description]
		 * @return {[type]}            [description]
		 */
		getCruiseDetails: function(cameraId, type, id) {
			var self = this;
			ajaxModel.getData(self.get_cruise, {
				'cameraId': cameraId,
				'type': type,
				'id': id
			}).then(function(res) {
				if (res && res.code && res.code === 200) {
					if (type === "0") {
						if (!res.data.autoCruise) {
							notify.warn("自动巡航数据为空，参数cameraId=" + cameraId + ",type=" + type + ",id=" + id);
							return;
						}
						res.data.autoCruise.allPersets = self.data.persetsList
						jQuery('.cruise-inner').hide();
						self.renderAutoDetails({
							"editAuto": {
								'autoCruise': res.data.autoCruise
							}
						});
						jQuery('.add-content.add-auto').show();
						jQuery('.add-content.add-auto').attr("cruiseid", id);
						jQuery('.add-content.add-auto').attr("cameraId", cameraId);
					} else {
						res.data.timeCruise.allPersets = self.data.persetsList
						self.renderTimeDetails({
							"editTime": {
								'timeCruise': res.data.timeCruise
							}
						});
						jQuery('.cruise-inner').hide();
						jQuery('.add-content.add-time').show();
					}
				}
			});
		},
		/**
		 * [getAutoCruise 获取自动巡航列表]
		 * @author huzc
		 * @date   2015-04-28
		 * @param  {[type]}   cameraId [description]
		 * @return {[type]}            [description]
		 */
		getAutoCruise: function(cameraId, fn) {
			var self = this;
			ajaxModel.getData(self.api_autoCruises, {
				cameraId: cameraId
			}).then(function(res) {
				if (res && res.code && res.code === 200) {
					self.data.autoCruise = res.data.autoCruise;
					self.renderAutoCruiseList();
					fn && fn(res.data.autoCruise);
				} else {
					//notify.info(res.data.message);
				}
			});
		},
		/**
		 * [getTimeCruise 获取时间段巡航列表]
		 * @author huzc
		 * @date   2015-04-28
		 * @param  {[type]}   cameraId [description]
		 * @return {[type]}            [description]
		 */
		getTimeCruise: function(cameraId) {
			var self = this;
			ajaxModel.getData(self.api_timeCruises, {
				cameraId: cameraId
			}).then(function(res) {
				if (res && res.code && res.code === 200) {
					self.data.timeCruise = res.data.timeCruise;
					self.renderTimeCruiseList();
				} else {
					notify.info(res.data.message);
				}
			});
		},
		/**
		 * [renderAutoCruiseList 渲染自动巡航列表]
		 * @author huzc
		 * @date   2015-04-28
		 * @return {[type]}   [description]
		 */
		renderAutoCruiseList: function() {
			var self = this;
			var parNode = jQuery('.auto-content');
			parNode.html(self.tplObj({
				"autoCruise": {
					"cruise": self.data.autoCruise
				}
			}));

			jQuery('.cruise-inner').show();
			//巡航操作权限控制
			var infoObj = jQuery(".win-dialog.ptz-control").data("cdata");
			if (!infoObj.klass["call-cruise"]) {
				parNode.find("ul .switch").hide();
			}
			if (!infoObj.klass["edit-cruise"]) {
				parNode.find('ul .edit').hide();
			}
			if (!infoObj.klass["delete-cruise"]) {
				parNode.find("ul .del").hide();
			}
			if (!infoObj.klass["new-cruise"]) {
				jQuery('.cruise-inner').find("button.addcruise").hide();
			}
			
			var Lis = jQuery(".auto-content ul.show-cruise-list").find('li');
			self.liNum = 0;
			if (Lis.length > 0) {
				Lis.each(function(index, ele) {
					var name = jQuery(ele).find(".l-name").html();
					if (name && name.length >= 5) {
						var subname = name.substring(0, 4);
						if (subname === "巡航计划") {
							var numstr = name.substring(4);
							var num = parseInt(numstr, 10);
							if (!isNaN(num)) {
								if (num >= self.liNum) {
									self.liNum = num;
								}
							}
						}
					}

				})
			}
			jQuery('.add-content.add-auto').hide();
			self.bindHover(parNode);
		},
		/**
		 * [renderTimeCruiseList 渲染时间段巡航列表]
		 * @author huzc
		 * @date   2015-04-28
		 * @return {[type]}   [description]
		 */
		renderTimeCruiseList: function() {
			var self = this;
			var parNode = jQuery('.time-content');
			parNode.html(self.tplObj({
				"timeCruise": {
					"cruise": self.data.timeCruise
				}
			}));
			jQuery('.cruise-inner').show();
			jQuery('.add-content.add-time').hide();
			self.bindHover(parNode);
		},
		/**
		 * [renderAutoDetails 渲染自动巡航详情(新增,编辑)]
		 * @author huzc
		 * @date   2015-04-28
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		renderAutoDetails: function(data) {
			var self = this;
			jQuery('.add-auto').html(self.tplObj(data));
			self.addDatePicker();
		},
		/**
		 * [renderTimeDetails 渲染时间段巡航详情(新增,编辑)]
		 * @author huzc
		 * @date   2015-04-28
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		renderTimeDetails: function(data) {
			var self = this;
			jQuery('.add-time').html(self.tplObj(data));
			self.addDatePicker();
		},
		/**
		 * [bindHover li上面发生hover的时候把当前dd所关联的数据绑定在scope上,方便获取]
		 * @author huzc
		 * @date   2015-04-28
		 * @param  {[type]}   parNode [description]
		 * @return {[type]}           [description]
		 */
		bindHover: function(parNode) {
			var self = this;
			parNode.find('li').hover(function() {
				var index = jQuery(this).index();
				if (self.cruiseType === '0') {
					self.SCOPE = self.data.autoCruise[index];
				} else {
					self.SCOPE = self.data.timeCruise[index];
				}
			});
		},
		addHelper: function() {
			Handlebars.registerHelper('timeIndex', function(index) {
				return index + 1;
			});
			Handlebars.registerHelper('hasName', function(name) {
				return name ? name : "未知名称";
			});
			Handlebars.registerHelper('choseSelect', function(id, all) {
				var l = all.length;
				var str = "";
				for (var i = 0; i < l; i++) {
					if (all[i].id === id) {
						str += "<option value=" + all[i].id + " selected>" + all[i].name + " </option>";
					} else {
						str += "<option value=" + all[i].id + ">" + all[i].name + "</option>";
					}
				}
				return new Handlebars.SafeString(str);
			});
			Handlebars.registerHelper('parseTime', function(seconds) {
				var date = new Date(seconds);
				var hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
				var minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
				var seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
				return hours + ":" + minutes + ":" + seconds;
			});
		},
		addDatePicker: function() {
			/*时间控件*/
			jQuery('.datetimepicker').datetimepicker2({
				datepicker: false,
				format: 'H:i:s',
				step: 5
			});
		},
		addClass: function() {
			var self = this;
			jQuery('head').append('<link rel="stylesheet" href="' + self.style + '">');
		},
		parseTime: function(seconds) {
			var arr = seconds.split(':');
			return (parseInt(arr[0], 10) * 60 * 60 + parseInt(arr[1], 10) * 60 + parseInt(arr[2], 10)) * 1000;
		},
		/**
		 * [stopCruise 停止巡航]
		 * @author huzc
		 * @date   2015-05-06
		 * @return {[type]}   [description]
		 */
		stopCruise: function(x) {
			var self = this;
			alert("停止巡航");
			clearTimeout(self.RunCruiseTimer);
		},
		/**
		 * [RunCruise 执行自动巡航计划，死循环，直到用户手动停止才退出]
		 * @author huzc
		 * @date   2015-04-28
		 * @param  {[type]}   persetsList [description]
		 */
		RunCruise: function(autoCruise, cameraNo, k, flag) {
			var self = this;
			var presets = autoCruise.presets;
			var cameraId = autoCruise.cameraId;
			var presetId = autoCruise.presetId;
			var id = autoCruise.id;
			var L = presets.length;
			var data = presets[k];
			var time = 0;

			//用户手动停止,退出巡航
			if (!jQuery(".cruise-list .auto-list[id=" + id + "] .l-controller i.switch").hasClass("active")) {
				//notify.warn("id="+id+"巡航已经停止");
				return;
			}
			if (k == 0) {
				if (flag == true) { //flag等于true表示首次启动巡航
					time = 0;
				} else {
					time = presets[L - 1].internalTime * 1000;
				}
			}
			if (k >= 1) {
				time = presets[k - 1].internalTime * 1000;
			}

			var data = {
				cameraId: cameraId,
				cameraNo: cameraNo,
				presetId: presets[k].presetId
			};
			//alert("time="+time+",data="+JSON.stringify(data));
			clearTimeout(self.RunCruiseTimer);
			self.RunCruiseTimer = setTimeout(function() {
				if (!jQuery(".l-controller .switch").hasClass("active")) {
					return;
				}
				//window._console.log("k="+k);
				self.RunCruiseAjax = jQuery.ajax({
					url: '/service/ptz/call_preset',
					dataType: 'json',
					type: 'post',
					data: data,
					success: function(res) {
						if (k == presets.length - 1) {
							self.RunCruise(autoCruise, cameraNo, 0);
						} else {
							self.RunCruise(autoCruise, cameraNo, k + 1);
						}
					}
				});
			}, time);
		}
	});
});