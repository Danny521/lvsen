/*global gPtz:true, gVideoPlayer:true, Handlebars:true, cameraCache:true, isActiveLi:true, gPTZService:true , ExpandScreen:true*/
var cruiseCache = {};

var PTZController = new new Class({

	Implements: [Options, Events],

	wait: null, //用于点击巡航启动时,当前时间小于开始时间.计时器

	initialize: function(options) {
		this.setOptions(options);
		this.bindEvent();
	},
	hisdata:{},
	bindEvent: function() {
		var self = this;
		//云台速度控制初始化
		jQuery('#ptzCamera .tab.ptz .speedSlider').slider({
			range: 'min',
			step: 1,
			max: 15,
			min: 1,
			value: 3,
			change: function() {
				var speed = jQuery(this).slider('value');
				var focusChannel = gVideoPlayer.getFocusWindow();
				var result = gVideoPlayer.setPtzSpeed(speed, focusChannel);

				gVideoPlayer.cameraData[focusChannel].ptzSpeed = speed;//将每个通道的云台速度保存,用于键盘操作
			}
		});

		//点击'云台控制'
		jQuery("#ptzCamera .header [data-tab=ptz]").click(function() {
			var available = self.isUsable(),//云台是否可用
			focusChannel = gVideoPlayer.getFocusWindow();
			if (!available) {
				return false;
			}
			window.isActiveLi = jQuery(this);
			self.controlShow(jQuery(this), gPtz.getParams().cameraType);//遮罩层显隐
			var speed = gVideoPlayer.cameraData[focusChannel].ptzSpeed;//取通道云台速度,用于显示
			speed = speed ? speed : 3;
			jQuery('#ptzCamera .tab.ptz .speedSlider').slider('value', speed);

		});

		//云台控制模块显隐	
		jQuery(document).on('click', '#ptzCamera > .header', function(event) {
			event.preventDefault();
			event.stopPropagation();
			//地图模式，不让弹出云台面板，点击无效
			if(jQuery("#npplay").hasClass("infinity"))
			{
				return;
			}
			var available = self.isUsable();
			if (!available) {
				return false;
			}
			//点击其中某个li,云台面板弹起
			if (jQuery(this).find('li.active').size() === 1 && !jQuery(event.target).is(jQuery(this))) {

				jQuery('#ptzCamera').addClass('active');
				permission.reShow();
				if (jQuery('.treeMenu .masklayer').is(':visible')) {//轮巡的左侧树遮罩层bottom要修改
						jQuery('.treeMenu .masklayer').css('bottom','256px');//显示轮巡的左侧树遮罩层
				}
			} else {//点击的是header
				jQuery('#ptzCamera').toggleClass('active');
				if (jQuery('#ptzCamera').hasClass('active')) {//弹起来了
					if (window.LoopInspect&&window.LoopInspect.isGoing) {
						jQuery(this).find('li.ptz').trigger('click');
						jQuery(this).find('li.ptz').addClass('active');
					}
					if (jQuery('.treeMenu .masklayer').is(':visible')) {//轮巡的左侧树遮罩层bottom要修改
						jQuery('.treeMenu .masklayer').css('bottom','256px');//显示轮巡的左侧树遮罩层
					}
				}else{
					if (jQuery('.treeMenu .masklayer').is(':visible')) {//轮巡的左侧树遮罩层bottom要修改
						jQuery('.treeMenu .masklayer').css('bottom','0px');//显示轮巡的左侧树遮罩层
					}
				}
				/*if (jQuery('#ptzCamera').hasClass('active')) {
					window.isActiveLi.trigger('click');//默认有一个li是高亮的
				} else {
					jQuery('#ptzCamera .header li.active').removeClass('active');
					jQuery('#ptzCamera .content .view.active').removeClass('active');
				}*/
			}
		});

		//自动扫描 云台中间的圆圈
		jQuery("#ptzCamera .dir-control .scan").on('click', function() {
			var that = this;
			var camera = cameraCache.get(gPtz.getParams().cameraId);
			var dir = jQuery(this).data('cmd');
			var speed = jQuery('#ptzCamera .tab.ptz .speedSlider').slider('value');

			jQuery(this).toggleClass('active');

			if (jQuery(this).hasClass('active')) {

				var data = {
					cameraId: camera.cameraId,
					cameraNo: camera.cameraNo,
					cmd: 8,
					param: 99
				},
				success = function(res){
					if(res && res.code === 200){
						jQuery(that).addClass('clicked');
					}else if(res && res.code === 400){//等于400 是'独占'或'锁定',由后台给出包括用户名的提示.
						notify.warn(res.data.message+"！");
					}
				};

				gPTZService.setDirection(data, success);

			} else {

				var data2 = {
					cameraId: camera.cameraId,
					cameraNo: camera.cameraNo,
					cmd: 0,
					param:0,
					scan: 1
				},
				success2 = function(res){
					if(res && res.code === 200){
						jQuery(that).removeClass('clicked');
					}else if(res && res.code === 400){
						notify.warn(res.data.message+"！");
					}					
				};
				gPTZService.setDirection(data2, success2);
			}
		});

		//云台辅助设备 雨刷和灯光
		jQuery('#ptzCamera .ptz .equipment .switch').on('click', function() {
			var that = this;
			var selected = jQuery(this).closest('.equipment').find('select option:selected');
			var sid = selected.attr('id');
			var icon = jQuery(this);
			var camera = cameraCache.get(gPtz.getParams().cameraId);
			var cmd = '';

			if (sid === 'wipe') {
				cmd = 17;
			} else if (sid === 'light') {
				cmd = 18;
			}

			var data = {
				cameraId: camera.cameraId,
				cameraNo: camera.cameraNo,
				cmd: cmd,
				param: camera[sid]
			},
			success = function(res){
				if(res && res.code === 200){
					if (jQuery(that).is(jQuery('.off'))) {
						icon.removeClass('off');
						icon.addClass('on');
						camera[sid] = 1;
					} else {
						icon.removeClass('on');
						icon.addClass('off');
						camera[sid] = 0;
					}
					// jQuery(this).removeClass('clicked');
				}else if(res && res.code === 400){
					notify.warn(res.data.message+"！");
				}					
			};
			gPTZService.setDirection(data, success);

		});
		jQuery('#ptzCamera .ptz .equipment select').on('change', function() {
			var id = jQuery(this).find('option:selected').attr('id').trim();
			var icon = jQuery(this).closest('.equipment').find('.switch');
			var camera = cameraCache.get(gPtz.getParams().cameraId);

			if (camera[id] === 0) {
				icon.removeClass('on');
				icon.addClass('off');
			} else if (camera[id] === 1) {
				icon.removeClass('off');
				icon.addClass('on');
			}
		});
		//历史调阅
		jQuery("#ptzCamera .header .ui.tabular .hisplay").click(function() {
			//self.controlShow(jQuery(this), gPtz.getParams().cameraType);
			//jQuery("#ptzCamera .content .view.ui.tab").hide();
			jQuery("#ptzCamera .content .view.hisplay").show();
			jQuery("#ptzCamera").addClass("active");
		});

		jQuery("#ptzCamera .header .ui.tabular>li").on("click",function()
		{
			var data=jQuery(this).attr("data-tab");
			jQuery("#ptzCamera .content .view.ui.tab").hide();
			jQuery("#ptzCamera .content .view.ui.tab."+data).show();
		});

		//色彩调节获取 传值-127~127,对应的显示是0~100
		jQuery("#ptzCamera .header [data-tab=effect]").click(function() {
			var available = self.isUsable();
			if (!available) {
				return false;
			}
			self.controlShow(jQuery(this), gPtz.getParams().cameraType);

			if (gPtz.getParams().cameraType === 1) {
				window.isActiveLi = jQuery(this);
			}

			var color = gVideoPlayer.cameraData[gVideoPlayer.focusChannel].effect;//获取通道中保存的色彩参数
			if (!color) {//如还没有设置过,则全是0初始值,对应的是50
				color = {
					brightness: 0,
					contrast: 0,
					saturation: 0,
					hue: 0
				};
			}

			var count = 0;
			var sliders = jQuery("#ptzCamera .content [data-tab=effect] [class*=Slider]");
			for (var name in color) {
				var sliderObj = sliders.eq(count);
				sliderObj.slider('value', color[name]);
				sliderObj.closest('li').find('.count').html(self.convertValue(color[name]));
				count++;
			}
		});

		//重置
		jQuery('#ptzCamera .content [data-tab=effect] .reset').click(function() {
			jQuery("#ptzCamera .content [data-tab=effect] li .count").html(50);
			jQuery('#ptzCamera .content [data-tab=effect] [class*=Slider]').slider('value', 0);
		});

		//色彩进度条  色彩调节设置
		jQuery('#ptzCamera .content [data-tab=effect] [class*=Slider]').slider({
			range: 'min',
			step: 1,
			max: 127,
			min: -127,
			value: 0,
			slide: function() {
				jQuery(this).closest('li').find('.count').html(self.convertValue(jQuery(this).slider('value')));
			},
			change: function() {
				jQuery(this).closest('li').find('.count').html(self.convertValue(jQuery(this).slider('value')));

				var sliders = jQuery("#ptzCamera .content [data-tab=effect] [class*=Slider]"),
					color = {
						bright: sliders.eq(0).slider('value'),
						contrast: sliders.eq(1).slider('value'),
						saturation: sliders.eq(2).slider('value'),
						hue: sliders.eq(3).slider('value')
					};

				gVideoPlayer.setColor(color, gVideoPlayer.focusChannel);
				gVideoPlayer.cameraData[gVideoPlayer.focusChannel].effect = Object.clone(color);//将改变后的色彩参数保存至每个通道
			}
		});

		//修改预置位名
		jQuery(document).on('dblclick', "#ptzCamera .content .preset .box-body ul li .presetting-place", function(event) {
			var that = jQuery(this);
			var cameraId = gPtz.getParams().cameraId;
			var val = jQuery(this).html();
			var id = jQuery(this).closest('li').data('id');
			var inputObj = jQuery('<input type="text" maxlength="10" class="edit-preset" value=' + val + '>');

			//如果当前单元格中存在输入框则不再进行添加
			if (that.children("input").size() > 0) {
				return false;
			}

			that.html(inputObj);
			inputObj.trigger('focus');

			//禁用输入框的点击事件
			inputObj.click(function() {
				return false;
			});

			var flag = false;
			inputObj.on('keydown', function(event) {
				if (event.keyCode === 13) {//enter
					var inputVal = jQuery(this).val().trim();
					if (!self.notNull(inputVal)) {//验证是否为空
						that.html(val);
						return false;
					}
					if (!self.nameFormat(inputVal)) {//验证名字格式
						that.html(val);
						return false;
					}
					if(self.isRepeat(inputVal, id)){//验证是否重复
						that.html(val);
						notify.warn('已存在的预置位名称，请重新输入！');
						return false;
					}

					flag = true;
					gPtz.updatePreset(cameraId, that, inputVal, val, id);
				} else if (event.keyCode === 27) {
					that.html(val);
				}
			}).on('blur', function() {
				if (flag) {
					return;
				}
				var inputVal = jQuery(this).val().trim();
				if (!self.notNull(inputVal)) {
					that.html(val);
					return false;
				}
				if (!self.nameFormat(inputVal)) {
					that.html(val);
					return false;
				}
				if(self.isRepeat(inputVal, id)){
					that.html(val);
					notify.warn('已存在的预置位名称，请重新输入！');
					return false;
				}
				gPtz.updatePreset(cameraId, that, inputVal, val, id);
			});
		});

		//预置位 设置巡航中选中列表li项
		jQuery(document).on('click', "#setCruise .content .box-body li,#ptzCamera .preset .box-body li", function() {
			jQuery(this).addClass('active');
			jQuery(this).siblings().removeClass('active');
		});

		//巡航点击其他地方巡航设置选中列表li项不被选中 除了ul区和操作区
		jQuery("#setCruise,#ptzCamera").click(function(event) {
			var ul = jQuery(".box-body ul");
			var li = ul.find('li.active');
			if (li.size() === 0) {
				return;
			}
			var action = jQuery(event.target).is(jQuery('.actions span'));
			if (jQuery(event.target).closest('ul').size() === 0 && !action) {
				li.removeClass('active');
			}
		});

		//巡航设置上移下移功能
		jQuery("#setCruise .content .actions").on('click', '.up,.down', function() {
			var ul = jQuery(this).closest('.box').find('.preset-ul');
			var li = ul.find('li.active');

			var prevLi = li.prev('li');
			var nextLi = li.next('li');
			var num = li.index() + 1;
			if (li.size() === 0) {
				notify.warn('请选择要移动的预置位！');
				return;
			}
			//上移
			if (jQuery(this).hasClass('up')) {
				if (prevLi.size() === 0) {
					notify.warn('该预置位已经在列表最上方！');
					return;
				}
				li.find('.num').html(num - 1);
				prevLi.find('.num').html(num);
				li.attr('data-sortno', num - 1);
				prevLi.attr('data-sortno', num);//sortNo置换
				li.after(prevLi);//li置换
				ul.scrollTop(ul.scrollTop() - 32);//滚动条
			} else { //下移
				if (nextLi.size() === 0) {
					notify.warn('该预置位已经在列表最下方！');
					return;
				}
				li.find('.num').html(num + 1);
				nextLi.find('.num').html(num);
				li.attr('data-sortno', num + 1);
				nextLi.attr('data-sortno', num);
				nextLi.after(li);
				ul.scrollTop(ul.scrollTop() + 32);
			}
		});

		//巡航列表中删除预置位项 预置位中删除预置位
		jQuery("#setCruise .content .actions, #ptzCamera .content [data-tab=preset]").on('click', '.delete', function() {
			var ul = jQuery(this).closest('.box').find('.box-body ul');
			var li = ul.find('li.active');
			var id = li.data('id');
			var camera = cameraCache.get(gPtz.getParams().cameraId);
			var presets = [];

			if (li.size() === 0) {
				notify.warn('请选择要删除的预置位！');
				return;
			}

			//巡航里面移除预置位
			if (jQuery(this).closest('#setCruise').size() === 1) {
				new ConfirmDialog({
					message: "您确定要删除巡航中的预置位吗？",
					callback: function() {
						li.remove();
					}
				});
			} else { //预置位模块删除预置位
				var condition = jQuery('#ptzCamera .cruise .box-body .buttons .button').is(jQuery('.red.stop'));
				if (condition) {
					notify.warn('当前预置位正在巡航中，请先停止巡航！');
					return;
				} else {
					if(!self.checkLock(camera.cameraId)){
						return false;
					}

					var pId1 = '';
					var pId2 = '';
					var message = '';

					if (camera.autoCruise !== -1 && camera.autoCruise.presets.length >= 1) {
						pId1 = camera.autoCruise.presetId;//自动巡航中的回位点id
					}
					if (camera.timeCruise !== -1 && camera.timeCruise.presets.length >= 1) {
						pId2 = camera.timeCruise.presetId;//时间巡航中的回位点id
					}

					if (id === pId1 || id === pId2) {
						message = '您确定要删除巡航中的回位点吗？';
					} else {
						if (jQuery('.header [data-tab="preset"]').hasClass('active')) {
							message = '该删除操作会将巡航计划中的该预置位一起删除，您确定要删除吗？';
						}else{
							message = '您确定要删除该预置位吗？';
						}
					}
					var dialog = new ConfirmDialog({
						message: message,
						callback: function() {
							gPtz.removePreset(id, li);
						}
					});
				}
			}
		});

		//预置位获取
		jQuery("#ptzCamera .header [data-tab=preset]").click(function() {
			var available = self.isUsable();
			if (!available) {
				return false;
			}
			var flag = self.controlShow(jQuery(this), gPtz.getParams().cameraType);
			if (!flag) {
				return;
			}
			window.isActiveLi = jQuery(this);

			//var type = jQuery("#ptzCamera .preset .order option:selected").data('type');
			var cameraId = gPtz.getParams().cameraId;
			var camera = cameraCache.get(cameraId);
			gPtz.sortPreset(cameraId, 0);//默认升序排列


			//获取是否锁定或独占 用于点击'调用'预置位时用.
			gPtz.getPtzStatus({
				cameraId: cameraId,
				cameraNo: camera.cameraNo
			});
			gPtz.getPtzMonopolyStatus({
				cameraId: cameraId
			});
		});

		//预置位排序
		/*jQuery("#ptzCamera .box-head .order").on('change', function() {
			var type = jQuery(this).find('option:selected').data('type');
			var cameraId = gPtz.getParams().cameraId;
			gPtz.sortPreset(cameraId, type);
		});*/

		//调用预置位
		jQuery("#ptzCamera .preset .buttons .call").on('click', function() {
			var li = jQuery('#ptzCamera .preset ul li.active');
			if (li.size() === 0) {
				notify.warn('请选择要调用的预置位！');
				return;
			}

			var presetId = li.data('id');
			var camera = cameraCache.get(gPtz.getParams().cameraId);
			var button = jQuery('#ptzCamera .cruise .box-body .buttons .button');

			gPtz.callPreset({
				cameraId: camera.cameraId,
				cameraNo: camera.cameraNo,
				presetId: presetId
			});			
		});

		//获取巡航
		jQuery("#ptzCamera .header [data-tab=cruise]").click(function() {
			var available = self.isUsable();
			if (!available) {
				return false;
			}
			var cameraId = gPtz.getParams().cameraId;
			var camera = cameraCache.get(cameraId);
			self.controlShow(jQuery(this), gPtz.getParams().cameraType);
			window.isActiveLi = jQuery(this);

			jQuery.when(Toolkit.loadTempl('/assets/inc/ptz.template.html')).done(function(template1) {

				var cruisetype = camera.cruisetype;//获取巡航的类型 自动or时间段
				var status = camera.status;

				var data = '';
				var cruise = '';
				var fragment = '';

				var button = jQuery('#ptzCamera .content [data-tab=cruise] .buttons .button');
				var cruiseTab = jQuery("#ptzCamera .content [data-tab=cruise]");

				if (cruisetype === 0) {
					cruiseTab.find(".auto-head").show();
					cruiseTab.find(".period-head").hide();
					cruiseTab.find(".box-head h3").html('自动巡航');

					cruise = camera.autoCruise;

					//自动巡航中存在的开始时间和结束时间
					cruiseTab.find(".box-head .time-interval .stime").html(self.parseDate(cruise.startTime));
					cruiseTab.find(".box-head .time-interval .etime").html(self.parseDate(cruise.endTime));
					cruiseTab.find(".box-head .time-interval").show();

					data = Object.merge({}, cruise, {
						auto: 'auto'
					});

				} else if (cruisetype === 1) {
					cruiseTab.find(".period-head").show();
					cruiseTab.find(".auto-head").hide();
					cruiseTab.find(".box-head h3").html('时间段巡航');
					cruiseTab.find(".box-head .time-interval").hide();

					cruise = camera.timeCruise;

					if (cruise.presets.length >= 1 && (typeof cruise.presets[0].startTime === 'number')) {
						var presets = cruise.presets;
						for (var i = 0; i < presets.length; i++) {
							presets[i].startTime = self.parseDate(presets[i].startTime);
							presets[i].endTime = self.parseDate(presets[i].endTime);
						}
					}
					data = Object.merge({}, cruise, {
						time: 'time'
					});
				}

				if (cruise === -1 || !cruise || (cruise !== -1 && cruise.presets.length < 1)) { //没有添加巡航
					cruiseTab.find(".auto-head").hide();
					cruiseTab.find(".period-head").hide();
					cruiseTab.find(".box-head .time-interval").hide();
					cruiseTab.find(".box-head h3").html('');
					cruiseTab.find(".presets-div").html('');
					button.hide();
					if (button.is(jQuery('.stop.red'))) {
						camera.status = 0;
						delete cruiseCache[cameraId];
					}
					return false;
				}

				var template = Handlebars.compile(template1);
				fragment = template(data);

				cruiseTab.find(".presets-div").html(fragment);
				self.getLiIndex(cruiseTab.find("ul"));
				button.show();

				if (status === 0) {//根据通道的status判断,该摄像头是否是在巡航状态
					button.removeClass('red stop').addClass('blue start').html('启动');
				} else if (status === 1) {
					button.removeClass('blue start').addClass('red stop').html('停止');
				} else if (status === 2) {
					button.removeClass('blue start').addClass('red stop wait').html('停止');
				}
			});

			//获取是否锁定或独占 用于'点击'启动巡航用.
			gPtz.getPtzStatus({
				cameraId: cameraId,
				cameraNo: camera.cameraNo
			});
			gPtz.getPtzMonopolyStatus({
				cameraId: cameraId
			});

		});

		//巡航设置显示.
		jQuery('#ptzCamera .cruise .cruise-setting').click(function() {
			var cameraId = gPtz.getParams().cameraId;
			var camera = cameraCache.get(cameraId);
			if(!self.checkLock(cameraId)){//检查是否是'锁定'or'独占'
				return false;
			}
			//检查是否正在巡航
			if (jQuery(this).closest('.box').find('.box-body .buttons .button').is(jQuery('.red.stop'))) {
				notify.warn('当前正在巡航中，请先停止巡航！');
				return false;
			}

			jQuery.when(Toolkit.loadTempl('/assets/inc/setPtz.template.html')).done(function(template1) {

				var cruisetype = camera.cruisetype;
				var presetsMap = camera.presetsMap;

				jQuery('#ptzCamera').hide();
				jQuery('#setCruise').show();
				var header = jQuery("#setCruise .header .tabular li");
				var tab = jQuery("#setCruise .content .ui.tab");

				var cruise = '';//保存自动巡航的数据
				var data = '';

				var cruise2 = '';//保存时间段巡航的数据
				var data2 = '';

				var kind = '';
				var anotherKind = '';

				if (cruisetype === 0) {
					kind = 'auto';
					anotherKind = 'period';
				} else if (cruisetype === 1) {
					kind = 'period';
					anotherKind = 'auto';
				}
				header.filter("[data-tab=" + kind + "]").addClass('active');
				header.filter("[data-tab=" + anotherKind + "]").removeClass('active');
				tab.filter("[data-tab=" + kind + "]").addClass('active');
				tab.filter("[data-tab=" + anotherKind + "]").removeClass('active');

				cruise = camera.autoCruise;
				cruise2 = camera.timeCruise;

				if (cruise === -1 || !cruise) {//没有添加过自动巡航
					tab.filter("[data-tab=auto]").find('ul').html('');
					tab.filter("[data-tab=auto]").find('.start').val('');
					tab.filter("[data-tab=auto]").find('.end').val('');
				} else {
					if (cruise.presets.length === 0) {//自动巡航中不包括预置位
						tab.filter("[data-tab=auto]").find('ul').html('');
					} else {
						data = Object.merge({}, cruise, {
							auto: 'auto'
						});

						var template = Handlebars.compile(template1);
						var fragment = template(data);

						tab.filter("[data-tab=auto]").find('ul').html(fragment);

						//自动巡航中存在的开始时间和结束时间 格式转换
						if (cruise.startTime) {
							cruise.startTime = self.parseDate(cruise.startTime);
						} else {
							cruise.startTime = '';
						}

						if (cruise.endTime) {
							cruise.endTime = self.parseDate(cruise.endTime);
						} else {
							cruise.endTime = '';
						}

						tab.filter("[data-tab=auto]").find('.start').val(cruise.startTime);
						tab.filter("[data-tab=auto]").find('.end').val(cruise.endTime);
					}
				}

				if (cruise2 === -1 || !cruise2) {//未添加过时间段巡航
					tab.filter("[data-tab=period]").find('ul').html(' ');
				} else {
					if (cruise2.presets.length === 0) {
						tab.filter("[data-tab=period]").find('ul').html(' ');
					} else {
						if (typeof cruise2.presets[0].startTime === 'number') {//转换时间格式
							var presets = cruise2.presets;
							for (var i = 0; i < presets.length; i++) {
								presets[i].startTime = self.parseDate(presets[i].startTime);
								presets[i].endTime = self.parseDate(presets[i].endTime);
							}
						}
						data2 = Object.merge({}, cruise2, {
							time: 'time'
						});

						var template2 = Handlebars.compile(template1);
						var fragment2 = template2(data2);
						tab.filter("[data-tab=period]").find('ul').html(fragment2);
					}
				}

				tab.find('.box-body select.preset-name').html('<option>请选择</option>');
				var lis = tab.filter("[data-tab=auto]").find('ul li');
				var lis2 = tab.filter("[data-tab=period]").find('ul li');

				//填充预置位和回位点
				self.fillCruise(lis, presetsMap, tab.filter("[data-tab=auto]"), cruise);
				self.fillCruise(lis2, presetsMap, tab.filter("[data-tab=period]"), cruise2);

				self.getLiIndex(tab.filter("[data-tab=auto]").find('ul'));
				self.getLiIndex(tab.filter("[data-tab=period]").find('ul'));

				//调用时间插件
				tab.find('.datetimepicker').datetimepicker2({
					datepicker: false,
					format: 'H:i:s',
					step: 5
				});
			});
		});


		//保存巡航设置
		jQuery('#setCruise>.content .confirm').click(function() {
			var tab = jQuery(this).closest('.ui.tab');
			var type = '';
			var presets = [];
			var returnPreset = {};
			var cruise = {};

			var lis = tab.find('.box .box-body ul li');
			if (lis.size() === 0) {
				notify.warn('没有添加任何预置位！');
				return;
			}
			var isCompleted = true;

			if (jQuery(this).closest('[data-tab=auto]').size() === 1) {//自动巡航 时间
				type = 0;
				var stime = jQuery(this).closest('[data-tab=auto]').find('input.start');
				var etime = jQuery(this).closest('[data-tab=auto]').find('input.end');
				if(!stime.match(/\d\d\:\d\d\:\d\d/g)){
					notify.warn('请填写正确的开始时间！'); 
					isCompleted = false;
					return;
				}

				if(!etime.match(/\d\d\:\d\d\:\d\d/g)){
					notify.warn('请填写正确的结束时间！'); 
					isCompleted = false;
					return;
				}

				if (!stime.val() || !etime.val()) {
					notify.warn('请填写时间！');
					isCompleted = false;
					return;
				}

				if (stime.val() >= etime.val()) {
					notify.warn('开始时间不能大于等于结束时间！');
					isCompleted = false;
					return;
				}
				cruise.startTime = self.formatDate(tab.find('.box-div .datetimepicker.start').val());
				cruise.endTime = self.formatDate(tab.find('.box-div .datetimepicker.end').val());
			} else {//时间段巡航 时间
				type = 1;
				var list = jQuery(this).closest('[data-tab=period]').find('.datetimepicker');
				for (var i = 0; i < list.length; i++) {
					if (!jQuery(list[i]).val()) {
						notify.warn('请填写时间！');
						isCompleted = false;
						break;
					}
					if(i%2 === 0 && jQuery(list[i]).val() >= jQuery(list[i+1]).val()){
						notify.warn('开始时间不能大于等于结束时间！');
						isCompleted = false;
						break;
					}else if(i<list.length-1 && jQuery(list[i]).val() > jQuery(list[i+1]).val() ){
						notify.warn('前一个预置位结束时间不能大于之后预置位开始时间！');
						isCompleted = false;
						break;
					}else{
						isCompleted = true;
					}
				}
			}

			//巡航的预置位
			lis.each(function(index, element) {
				if (!jQuery(element).find('.preset-name option:selected').attr('id')) {
					notify.warn('请选择预置位！');
					isCompleted = false;
					return false;
				}
				var preset = {};
				preset.id = jQuery(element).data('id');

				preset.sortNo = index + 1;
				preset.presetId = jQuery(element).find('.preset-name option:selected').attr('id');
				preset.presetName = jQuery(element).find('.preset-name').val();

				if (type === 0) {
					var val = jQuery(element).find('.interval input').val();
					if (!val) {
						notify.warn('请填写间隔时间！');
						isCompleted = false;
						return false;
					} else if (!self.digit(val)) {
						notify.warn('请填写有效值！');
						isCompleted = false;
						return false;
					} else if (val < 5) {
						notify.warn('预置位时间间隔需在5秒以上！');
						isCompleted = false;
						return false;
					} else if (val > (cruise.endTime - cruise.startTime) / 1000) {
						notify.warn('时间间隔不能大于起止时间间隔！');
						isCompleted = false;
						return false;
					} else {
						preset.internalTime = val;
						presets.push(preset);
					}

				} else {
					preset.startTime = self.formatDate(jQuery(element).find('.pstart').val());
					preset.endTime = self.formatDate(jQuery(element).find('.pend').val());
					presets.push(preset);
				}
			});

			if (!isCompleted) {
				return;
			}

			var option = tab.find('.box-body .box-div select.preset-name').find('option:selected');
			if (option.attr('id')) {
				returnPreset.id = option.attr('id');
			} else {
				notify.warn('请选择回位点！');
				return;
			}

			cruise.preset = presets;
			cruise.presetId = returnPreset.id;
			gPtz.saveCruise(type, cruise);
		});

		//巡航设置隐藏
		jQuery('#setCruise>.content .cancle, #setCruise>.header .back').click(function() {
			jQuery('#ptzCamera').show();
			jQuery('#setCruise').hide();
		});

		//向巡航中添加预置位
		jQuery('#setCruise .content .actions .add').on('click', function() {
			var cameraId = gPtz.getParams().cameraId;
			var camera = cameraCache.get(cameraId);
			var that = jQuery(this);

			if (camera.presetsMap.getKeys().length === 0) {
				notify.warn('请先为摄像头添加预置位！');
				return;
			}

			jQuery.when(Toolkit.loadTempl('/assets/inc/setPtz.template.html')).done(function(template1) {
				var ul = that.closest('.box').find('.box-body ul');
				var lifragment = '';

				if (that.closest('[data-tab=auto]').size() === 1) {
					var obj = {
						num: ul.find('li').length + 1
					};
					var template = Handlebars.compile(template1);
					lifragment = template(obj);

				} else if (that.closest('[data-tab=period]').size() === 1) {
					var obj2 = {
						sortno: ul.find('li').length + 1
					};
					var template2 = Handlebars.compile(template1);
					lifragment = template2(obj2);
				}

				ul.append(lifragment);
				ul.find('li:last').addClass('active');
				ul.find('li:last').siblings().removeClass('active');
				ul.find('li:last').find("select.preset-name").html('<option>请选择</option>');

				camera.presetsMap.each(function(value, key) {
					ul.find('li:last').find("select.preset-name").append("<option id='" + key + "'>" + value + "</option>");
				});
				jQuery('#setCruise .content [data-tab=period] .datetimepicker').datetimepicker2({
					datepicker: false,
					format: 'H:i:s',
					step: 5
				});

				var before = ul.scrollTop();
				ul.scrollTop(before + ul.find('li').height() + 1);
			});
		});

		//启动,暂停巡航
		jQuery("#ptzCamera .content [data-tab=cruise] .buttons .button").click(function() {
			var cameraId = gPtz.getParams().cameraId;
			var camera = cameraCache.get(cameraId);
			if(!self.checkLock(cameraId)){
				return false;
			}

			var ul = jQuery(this).closest(".box-body").find('ul'),
				list = ul.find('li'),
				button = jQuery(this);

			if (button.is('.start')) {//初始值有start 可启动

				button.removeClass('wait');

				//启动巡航
				var cruise = new Cruise({
					button: button,
					camera: camera
				});
				cruiseCache[camera.cameraId] = cruise;

			} else {
				if (button.is('.wait')) {//是等待状态, 停止巡航

					button.addClass('start blue').removeClass('stop red wait').html('启动');
					camera.status = 0;

					clearTimeout(PTZController.wait);

					if (cruiseCache[camera.cameraId]) {
						cruiseCache[camera.cameraId].stop();
						delete cruiseCache[camera.cameraId];
					}
				} else {//停止巡航
					cruiseCache[camera.cameraId].stop();
					camera.status = 0;
					delete cruiseCache[camera.cameraId];
				}
			}
		});
	},

	//云台是否可用 枪机除色彩调节都不可用 聚焦通道没有视频播放 离线 轮训 监巡不可用
	isUsable: function() {
		var cameraId = gPtz.getParams().cameraId;

		var node = jQuery('.treeMenu .node[data-id=' + cameraId + '][data-type=leaf]');
		if (node.is('.offline')) {
			return false;
		}

		//存在未锁定数组 且不是在监巡

		if (window.LoopInspect && window.LoopInspect.isGoing && window.LoopInspect.isLoopInspect && window.LoopInspect.unlockedChannels.contains(gVideoPlayer.focusChannel)) {
			if(gVideoPlayer.cameraData[gVideoPlayer.focusChannel]!==-1){
				//notify.warn("正在轮巡！");
			}
			return false;
		}

		//监巡且非暂停状态
		//if (VideoWatch.tpl_cache.isStart && !VideoWatch.tpl_cache.isPause) {
			//notify.warn("正在监巡！");
		//	return false;
		//}

		//没有视频在播放
		/*var cameraLength = cameraCache.getKeys().length;
		if (cameraLength === 0 || gVideoPlayer.cameraData[gVideoPlayer.focusChannel] === -1) {
			// jQuery('#ptzCamera').removeClass('active');
			return false;
		}*/
		//完全没有视频在播放
		var cameraLength = cameraCache.getKeys().length;
		if (cameraLength === 0) {
			jQuery('#ptzCamera').removeClass('active');
			if (jQuery('.treeMenu .masklayer').is(':visible')) { //轮巡的左侧树遮罩层bottom要修改
				jQuery('.treeMenu .masklayer').css('bottom', '0px'); //显示轮巡的左侧树遮罩层
			}
			return false;
		}
		return true;
	},
	//控制遮罩层的显隐
	controlShow: function(obj, cameraType) {
		if (obj.is(jQuery('.not-support')) && cameraType === 0) {//非'色彩调节'且是球机,遮罩层显示.
			mask.showMask();
			return false;
		} else {
			mask.hideMask();
			return true;
		}
	},

	convertValue: function(value) {
		return Math.round((value + 127) / 2.54);
	},

	nameFormat: function(value) { //文件名称格式
		var pattern = /([?"*'\/\\<>:|？“”‘’]|(?!\s)'\s+|\s+'(?!\s))/ig;
		if (value.test(pattern)) {
			notify.warn('名称不能包含下列任何字符 \\ / : * ? \" \' < > |');
			return false;
		} else {
			return true;
		}
	},

	notNull: function(value) {
		if (value.trim() === '') {
			notify.warn('名称不能为空！');
			return false;
		} else {
			return true;
		}
	},

	//自动生成ul中li的编号
	getLiIndex: function(ul) {
		var lis = ul.find('li');
		for (var i = 0; i < lis.length; i++) {
			jQuery(lis[i]).find('.num').html(i + 1);
		}
	},

	//巡航填充预置位 和 回位点
	fillCruise: function(list, presetsMap, tab, cruise) {
		//预置位填充 如果key值相等,则被选中
		for (var j = 0; j < list.length; j++) {
			presetsMap.each(function(value, key) {
				var select = jQuery(list[j]).find('select.preset-name');
				if (jQuery(list[j]).data('presetid') + '' === key) {
					select.append("<option selected id='" + key + "'>" + value + "</option>");
				} else {
					select.append("<option id='" + key + "'>" + value + "</option>");
				}
			});
		}

		presetsMap.each(function(value, key) {
			if (cruise.presetId + '' === key) {
				tab.find('.box-div select.preset-name').append("<option selected id='" + key + "'>" + value + "</option>");
			} else {
				tab.find('.box-div select.preset-name').append("<option id='" + key + "'>" + value + "</option>");
			}
		});
	},

	//输入必须为数字
	digit: function(value) {
		return (/^[1-9](\d)*$/).test(value.trim());
	},
	//时+分 转成 1970年1月1日+传进来的时分+00的长整型 毫秒
	formatDate: function(str) {
		var fdate = Toolkit.formatDate(new Date(1970, 0));
		var to = fdate.indexOf(' ');
		var date = fdate.substring(0, to + 1);
		return Date.parse(Toolkit.parseDate(date + str));
	},
	//将毫秒值转换为 时+分+秒
	parseDate: function(time) {
		if (typeof time === 'number') {
			time = new Date(time);
			time = Toolkit.formatLenth(time.getHours()) + ":" + Toolkit.formatLenth(time.getMinutes()) + ":" + Toolkit.formatLenth(time.getSeconds());
			return time;
		} else {
			return time;
		}
	},

	//检测预置位是否有重名
	isRepeat: function(presetName, id){
		var repeatname = false;
		var cameraId = gPtz.getParams().cameraId;
		var allPresets = cameraCache.get(cameraId).presetsMap;
		allPresets.each(function(key, value) {
			if (presetName === key && value!=id) {
				repeatname = true;
				return;
			}
		});
		return repeatname;
	},

	//云台是否被锁定或被其他人独占
	checkLock: function(cameraId){
		var camera = cameraCache.get(cameraId);
		var userId = jQuery('#userEntry').data('userid');
		//锁定=1
		if(camera.lockStatus === 1 && camera.lockUname){
			notify.warn('云台已经被 '+camera.lockUname+' 锁定！');
			return false;
		}
		//独占=0 后台返回
		if(camera.monopolyStatus === 0 && userId!== camera.monopolyUid && camera.monopolyUname){
			notify.warn('云台已经被 '+camera.monopolyUname+' 独占！');
			return false;
		}
		return true;
	},
	ListSearch:function(data)
	{
        var A=data.videos;
        var L=A.length;
        var C=[
          "<ul class='searchList'>"
        ];
        var fmt="yyyy.MM.dd hh:mm";

        for(var i=0;i<=L-1;i++)
        {
        	var beginTime=A[i][0];
        	var endTime=A[i][1];
        	if(beginTime==endTime){continue;}
        	beginTime=(new Date(beginTime)).format(fmt);
        	endTime=(new Date(endTime)).format(fmt);
        	//endTime=endTime.split(" ")[1];
        	endTime=endTime.replace(/^\d{4}\./g,"");
        	//var btn="<span class='bgimg btn btn1'>&nbsp;</span>&nbsp;<span class='bgimg btn btn2'>&nbsp;</span>";
        	var btn="<span class='bgimg btn btn1'>&nbsp;</span>";
        	var k=i+1;
        	if(k<=9){k="0"+k;}
        	//C.push("<li>("+k+")&nbsp;<span class='litime'>"+beginTime+" - "+endTime+"</span> (<span class='framemark'>0</span>)"+btn+"</li>");
        	C.push("<li><span title='"+i+"' class='litime'>"+beginTime+" - "+endTime+"</span> (<span class='framemark'>0</span>)"+btn+"</li>");
        	

        	//C.push("<li><span class='litime'>"+beginTime+" - "+endTime+"</span>&nbsp;"+btn+"</li>");
        }
        C.push("</ul>");
        var html=C.join("");
        return html;
	},
	//获取帧标记
	getFrameMark:function(obj,fn)
	{
	 	 var cameraId=obj.cameraId;
	 	 var channelName=obj.channelName;
	 	 var beginTime=obj.beginTime;
	 	 var endTime=obj.endTime;

		 jQuery.ajax({
				url: '/service/frame/get_frame',
				data: 
				{
					cameraId: cameraId,
					beginTime:beginTime,
					endTime:endTime
				},
				cache: false,
				type: 'GET',
				async: true,
				success: function(res) {
				if (res.code === 200) 
				{
					var tags = res.data.tags;
					if(tags.length <= 0)
					{
						fn(tags,false);
						return false;
					}
					fn(tags,true);
				}
				else if(res.code === 500)
				{
					fn(tags,false);
					//notify.warn(res.data.message);
				}
			}
		});
	}
});

var Cruise = new Class({

	Implements: [Events, Options],

	timer: null, //用于巡航的计时器

	curIndex: 0, //当前调用的预置位下标

	isPausing: false, //是否是暂停状态

	presets: [], //存放所有符合调节的预置位

	cruiseTimer: null, //用于暂停巡航用到的计时器

	options: {
		button: '',
		camera: '',
		index: 0,
		rounds: 0,
		remainTime: 0,
		pass: 0
	},

	initialize: function(options) {
		this.setOptions(options);

		if (this.options.camera.cruisetype === 0) {
			this.autoDataFormat();
		} else {
			this.timeDataFormat();
		}

		if (!this.inRangeTime()) {
			return;
		}

		this.start(this.presets[0], 0);
	},

	start: function(preset, delay) {
		this.callPreset({
			cameraId: this.options.camera.cameraId,
			cameraNo: this.options.camera.cameraNo,
			preset: preset,
			interval: delay
		});
	},

	callPreset: function(params) {
		var self = this;
		this.timer = setTimeout(function() {
			jQuery.ajax({
				url: '/service/ptz/call_preset',
				dataType: 'json',
				type: 'post',
				data: {
					cameraId: self.options.camera.cameraId,
					cameraNo: self.options.camera.cameraNo,
					presetId: params.preset.presetId
				},
				success: function() {
					++self.options.index;
					++self.options.pass;

					self.turn(params.preset.internalTime);
				}
			});
		}, params.interval * 1000);
	},

	turn: function(delay) {
		var self = this;

		//自动巡航  巡航到最后一个预置位,重头开始
		if (this.options.index >= this.presets.length && this.options.camera.cruisetype === 0) {
			this.options.index = 0;
		}

		if (!this.interrupt(delay)) {//判断时间是否已到
			return;
		}

		if (this.isPausing) {//如果是暂停状态,该功能暂时未启用
			this.isPausing = false;
			this.options.index = this.curIndex;

			if (!this.inRangeTime()) {
				self.stop();
				return;
			}

			if (self.options.camera.cruisetype === 1) { //时间段巡航重新取有效预置位,当前index=0
				self.timeDataFormat();
				self.curIndex = 0;
				self.options.index = 0;
			}
		} else {
			this.curIndex = this.options.index;
		}

		var preset = this.presets[this.curIndex];
		this.start(preset, delay);
	},

	stop: function() {
		HeartBeat.stop();
		clearTimeout(this.timer);
		this.timer = null;
		this.options.button.addClass('start blue').removeClass('stop red').html('启动');

		if (this.cruiseTimer) {
			clearTimeout(this.cruiseTimer);
			this.cruiseTimer = null;
		}
	},

	interrupt: function(delay) {
		var self = this;
		//自动巡航停止
		var time = new Date().toTimeString();
		if (time >= this.endTime && this.options.camera.cruisetype === 0) {
			this.stop();
			cameraCache.get(self.options.camera.cameraId).status = 0;
			delete cruiseCache[self.options.camera.cameraId];
			self.presets = null;

			var deferred = gPtz.callPreset({
				cameraId: self.options.camera.cameraId,
				cameraNo: self.options.camera.cameraNo,
				presetId: self.backTo.presetId
			});
			deferred.done(function(data) {
				if (!(data && data.code === 200)) {
					notify.warn('回位点调用失败！');
				}
			});
			return false;
		}

		//时间段巡航停止
		if (self.options.index >= self.presets.length && self.options.camera.cruisetype === 1) {
			self.start(self.presets[self.presets.length - 1], delay);
			self.stop();
			cameraCache.get(self.options.camera.cameraId).status = 0;
			self.options.button.removeClass('wait');
			delete cruiseCache[self.options.camera.cameraId];
			self.presets = null;
			return false;
		}

		return true;
	},

	//巡航开启时,是否在有效时间范围之内
	inRangeTime: function() {
		var self = this;
		var time = new Date().toTimeString();
		if (time >= this.endTime) {//过了结束时间
			notify.warn('当前时间不在巡航时间内，请重设时间！');
			delete cruiseCache[this.options.camera.cameraId];
			return false;
		} else if (time < this.startTime) {//在时间范围
			self.options.button.addClass('stop red wait').removeClass('start blue').html('停止');
			cameraCache.get(self.options.camera.cameraId).status = 2;
			HeartBeat.start();
			PTZController.wait = setTimeout(function() {
				HeartBeat.stop();
				self.options.button.addClass('start');
				self.options.button.trigger('click');
			}, PTZController.formatDate(this.startTime) - PTZController.formatDate(time));

			delete cruiseCache[this.options.camera.cameraId];
			notify.warn('巡航时间未到，请稍后！');
			return false;
		} else if (time >= this.startTime && time < this.endTime) {//未到时间
			HeartBeat.start();
			self.options.button.addClass('stop red').removeClass('start blue').html('停止');
			cameraCache.get(self.options.camera.cameraId).status = 1;
			return true;
		}
	},

	autoDataFormat: function() {
		var self = this;
		var data = self.options.camera;
		var cruiseObj = data.autoCruise;

		self.startTime = PTZController.parseDate(cruiseObj.startTime);
		self.endTime = PTZController.parseDate(cruiseObj.endTime);
		self.presets = cruiseObj.presets;

		self.backTo = {
			presetId: cruiseObj.presetId
		};
	},

	timeDataFormat: function() {
		var self = this;
		var data = self.options.camera;
		var cruiseObj = data.timeCruise;
		this.presets.empty();

		self.startTime = cruiseObj.presets[0].startTime;//整个时间段巡航的开始时间
		self.endTime = cruiseObj.presets[cruiseObj.presets.length - 1].endTime;//整个时间段巡航的结束时间

		var time = new Date().toTimeString();

		var flag = true;//初始值true, 在某个预置位开始结束时间之间时设为false
		if (self.startTime <= time && time < self.endTime) {
			//检查当前时间处于哪个时间点
			for (var j = 0; j < cruiseObj.presets.length; j++) {

				var interval = '';
				var start = cruiseObj.presets[j].startTime;//当前预置位的开始时间
				var end = cruiseObj.presets[j].endTime;//当前预置位的结束时间
				var nextStart = '';//下个预置位的开始时间

				if (flag) {//
					if (time >= start && time < end) {//在预置位时间范围之内
						flag = false;//确定了时间下次走else
						if (j === cruiseObj.presets.length - 1) {
							nextStart = this.endTime;
						} else {
							nextStart = cruiseObj.presets[j + 1].startTime;
						}
						interval = this.convertToSecond(nextStart) - this.convertToSecond(time);//时间间隔
						cruiseObj.presets[j].internalTime = interval;
						this.presets.push(cruiseObj.presets[j]);
					} else if (time >= end) {//
						flag = true;
					} else if (time < start) {//在上一个预置位结束时间和下一预置位开始时间之间
						flag = false;
						this.startTime = start;
						cruiseObj.presets[j].waitTime = this.convertToSecond(start) - this.convertToSecond(time);//时间未到,等待时间
						cruiseObj.presets[j].internalTime = this.convertToSecond(end) - this.convertToSecond(start);//时间间隔
						this.presets.push(cruiseObj.presets[j]);
					}
				} else {
					if (j === cruiseObj.presets.length - 1) {
						nextStart = this.endTime;
					} else {
						nextStart = cruiseObj.presets[j + 1].startTime;
					}
					interval = this.convertToSecond(nextStart) - this.convertToSecond(start);
					cruiseObj.presets[j].internalTime = interval;
					this.presets.push(cruiseObj.presets[j]);
				}
			}
			//将回位点放入presets
			self.presets.push({
				presetId: cruiseObj.presetId
			});
		}
	},

	//暂停巡航(巡航启动,点击云台其他操作,巡航停止10s)
	pauseCruise: function(camera) {
		clearTimeout(this.timer);
		this.timer = null;

		if (this.cruiseTimer) {
			clearTimeout(this.cruiseTimer);
			this.cruiseTimer = null;
		}

		this.curIndex = this.options.index === 0 ? (this.presets.length - 1) : (this.options.index - 1); //记住当前的巡航到的位置
		this.isPausing = true;

		var condition = this.options.button.is('.red.stop');

		if (condition && !this.options.button.is('.wait')) {
			this.options.button.addClass('pause');
			return true;
		}
	},


	//10s后重新启动巡航
	reStartCruise: function() {
		var self = this;

		// if (button.is('.pause') && button.is('.start')) {
		if (self.options.button.is('.pause')) {
			self.cruiseTimer = setTimeout(function() {
				self.turn();
				self.options.button.removeClass('pause');
			}, 10 * 1000);
		}
	},

	//将时+分转换成秒
	convertToSecond: function(str) {
		var milli = PTZController.formatDate(str);
		return milli / 1000;
	}
});

//扩展 云台方向和焦点等调节统一调用
jQuery.fn.extend({
	controlPtz: function(data) {
		jQuery(this).mousedown(function() {
			var camera = cameraCache.get(gPtz.getParams().cameraId);
			var self = jQuery(this);
			var cmd = jQuery(this).data('cmd');
			var param = '';

			if (self.is('.adjust')) {
				if (self.hasClass('up')) {
					param = 1;
				} else {
					param = -1;
				}
			} else {
				param = jQuery('#ptzCamera .tab.ptz .speedSlider').slider('value');
			}

			self.addClass('clicked');
			self.siblings().removeClass('clicked');

			data.deferred = gPtz.setPTZDir({
				cameraId: camera.cameraId,
				cameraNo: camera.cameraNo,
				cmd: cmd,
				param: param,
				playingChannelId: camera.cameraChannel!==undefined?camera.cameraChannel.id:camera.cameraId
			});

		}).on('mouseup', function() {
			var that = jQuery(this);
			var camera = cameraCache.get(gPtz.getParams().cameraId);
			var cmd = that.data('cmd');
			that.removeClass('clicked');

			data.deferred.done(function(res) {
				if (res.code === 200) {
					setTimeout(function() {
						gPtz.stopPTZDir({
							cameraId: camera.cameraId,
							cameraNo: camera.cameraNo,
							cmd: cmd,
							playingChannelId: camera.cameraChannel!==undefined?camera.cameraChannel.id:camera.cameraId
						});
					}, 500);
				}
			});
		}).on('mouseenter', function() {
			jQuery(this).addClass('hover');
			if (jQuery(this).is('.adjust')) {
				jQuery(this).siblings().removeClass('hover');
			} else {
				jQuery(this).siblings('.dir').removeClass('hover');
			}
		}).on('mouseleave', function() {
			jQuery(this).removeClass('hover');
		});
	}
});

//控制云台控制方向
(function() {
	var deferred = null;
	jQuery("#ptzCamera .dir-control .dir").controlPtz({
		deferred: deferred
	});
})();

//云台焦距焦点光圈调节
(function() {
	var deferred = null;
	jQuery("#ptzCamera .ptz-adjust .adjust-wrap .adjust").controlPtz({
		deferred: deferred
	});
})();

//云台不可用情况 不给提示.
window.ptzShow = function(event, cameraId, cameraNo, cameraType) {
	var node = jQuery('.treeMenu .node[data-id=' + cameraId + '][data-type=leaf]');
	if (node.is('.offline')) {
		return false;
	}

	if (event === 'click') { //通道单击事件
		if (window.LoopInspect && LoopInspect.isGoing) { //监巡/轮巡正在进行	
			//监巡暂停 或者 轮巡锁定
			if (VideoWatch.tpl_cache.isPause || (!LoopInspect.unlockedChannels.contains(gVideoPlayer.curChannel) && !VideoWatch.tpl_cache.isStart)) {
				if (gVideoPlayer.cameraData[gVideoPlayer.curChannel] !== -1) {//通道有视频播放
					gPtz.setParams({//聚焦,设置当前通道的摄像机参数
						cameraId: cameraId,
						cameraNo: cameraNo,
						cameraType: cameraType
					});

					LoopInspect.curPauseChannels.include(gVideoPlayer.curChannel);
					if (cameraType + 0 === 1) {//如为球机,启动云台
						gVideoPlayer.switchPTZ(true, gVideoPlayer.focusChannel);
					}
					return true;
				}
			} else {
				jQuery('#ptzCamera').removeClass('active');
				if (jQuery('.treeMenu .masklayer').is(':visible')) { //轮巡的左侧树遮罩层bottom要修改
					jQuery('.treeMenu .masklayer').css('bottom', '0px'); //显示轮巡的左侧树遮罩层
				}
				return false;
			}
		}
		if (window.VideoWatch && VideoWatch.tpl_cache.isLayout && jQuery(".menus.ui.tabular .patrol").is(".active")) { //调整布局不能启动云台
			return false;
		}
	} else { //键盘可控云台事件
		try {
			if (window.LoopInspect && LoopInspect.isGoing && !VideoWatch.tpl_cache.isPause && LoopInspect.unlockedChannels.contains(gVideoPlayer.curChannel)) { //监巡进行中,且不是 暂停 不能调用云台
				return false;
			}
		} catch (err) {}
	}
	return true;
};
//遮罩层
var mask = (function(maskAreaEle) {
	var maskEle = null,
		createMask = function() {
			var maskHtml = '<div id="masklayer"><iframe src="javascript:;"></iframe></div>';
			if (!maskEle) {
				maskEle = jQuery(maskHtml).appendTo(maskAreaEle);
			}
		};
	return {
		showMask: function() {
			if (!maskEle) {
				createMask();
			}
			maskEle.show();
		},

		hideMask: function() {
			if (maskEle) {
				maskEle.hide();
			}
		}
	};
})(jQuery("#ptzCamera"));

jQuery(function() {

	window.SelectCamera={};
    window.SelectCamera.ListData =[];
    for(var i=0;i<=15;i++)
    {
    	window.SelectCamera.ListData[i]={};
    }
     //new Array(16).repeat({});
	var player = window.gVideoPlayer;
	if (navigator.userAgent.toLowerCase().search(/(msie\s|trident.*rv:)([\w.]+)/) !== -1) {
		//播放的视频之间切换 单击事件
		//if(!player.addEvent){return;}
		player.addEvent('OCXCLICK', function(curChannel) 
		{
			if(typeof controlBar === 'object') {
				controlBar.hisClick(player,curChannel);
			}
			PTZController.showPTZ=false;
			jQuery(".ui-datepicker").hide();
			var html=window.SelectCamera.ListData[curChannel].searchHTML;
			if(html)
			{
				jQuery("#ptzCamera .content .view.hisplay.ui.tab .resultList").html(html);
			}
			var input_beginTime=window.SelectCamera.ListData[curChannel].input_beginTime;
			var input_endTime=window.SelectCamera.ListData[curChannel].input_endTime;
			if(input_beginTime&&input_endTime)
			{
				jQuery(".his_beginTime.input-time").val(input_beginTime);
				jQuery(".his_endTime.input-time").val(input_endTime);
			}
			jQuery(".markerLevelcolor").remove();
		});

		player.addEvent('OCXMOUSEMOVE', function(data) {
			return//隐藏同步按钮，待产品完善设计之后放出
			var A=[];
			var K=0;
			player.get_hiscount(function(str,i)
			{
				if(str=="ERROR"){return;}
				var videoType=JSON.parse(str).videoType;
				if(videoType!=2){return}
			    A.push(i);
			    K++;
			});
			//只有在至少有两路历史的情况下播放显示同步按钮;
			var syncBtn=jQuery("#npplay .header .ui.atached.menu > a > button.sync");
			if(K<2)
			{
				syncBtn.hide();
	     	}
			else
			{
				syncBtn.show();
			}
		});

		player.addEvent("CLOSEPTZ", function(cameraId) {
			jQuery('#setCruise').hide();
			jQuery('#ptzCamera').show().removeClass('active');
			if (jQuery('.treeMenu .masklayer').is(':visible')) { //轮巡的左侧树遮罩层bottom要修改
				jQuery('.treeMenu .masklayer').css('bottom', '0px'); //显示轮巡的左侧树遮罩层
			}
			//清除摄像头所有信息  关闭巡航 清空巡航对象
			var count = 0;
			for (var i = 0; i < player.cameraData.length; i++) {
				if (player.cameraData[i].cId === cameraId) {
					count++;
				}
			}
			//关闭的这个视频,只在一个通道中播放时
			if (count === 1) {
				window.isActiveLi = jQuery('#ptzCamera').find('.header li:eq(0)');
				cameraCache.erase(cameraId);//关闭清除保留数据
				if (cruiseCache[cameraId]) {
					cruiseCache[cameraId].stop();//关闭时,正在巡航的停止.
					delete cruiseCache[cameraId];
				}
			}
		});
	}

	jQuery("#ptzCamera .content .box .box-body .icon-timepicker").on("click",function(){
		jQuery(this).prev().trigger("focus");
	});

	var RenderCountFrames=function(obj,hisList,fn) 
	{
		PTZController.getFrameMark(obj,function(FrameList,flag){
			if(flag==false){return}
			var L=hisList.length;
			var FrameMark_InHisList=[]; //将所有帧标记分配到每一段历史录像生成新的数组,该数据和历史片段数组等长；
			var len=0;
		    //FrameList的格式和提交帧标记的数据格式一样
		    var max=0;
			for(var i=0;i<=L-1;i++)
			{
				FrameMark_InHisList[i]=JudgeTimeSets(FrameList,hisList[i][0],hisList[i][1]);
				len=FrameMark_InHisList[i].length; //统计
				max=Math.max(max,len);
				//jQuery("#ptzCamera >.content>.view.hisplay>.box>.box-body>.resultList > ul > li>.framemark:eq("+i+")").html(len);
			}
			for(var i=0;i<=L-1;i++)
			{
				//FrameMark_InHisList[i]=JudgeTimeSets(FrameList,hisList[i][0],hisList[i][1]);
				len=FrameMark_InHisList[i].length; //统计
				if(max>=10&&len<=9)
				{
					len="0"+len;
				}
				jQuery("#ptzCamera >.content>.view.hisplay>.box>.box-body>.resultList > ul > li>.framemark:eq("+i+")").html(len);
			}
			fn(FrameList,FrameMark_InHisList);
		});
	}

	//A[I]格式  统计落在某时间区间的帧标记个数
	var JudgeTimeSets=function(FrameList,startTime,endTime)
	{
		var L=FrameList.length;
		var K=0;
		var Frames=[];
		for(var i=0;i<=L-1;i++)
		{
			var time=FrameList[i].time;
			if(time>=startTime&&time<endTime)
			{
			   K++;
			   Frames.push(FrameList[i]);
			}
		}
		return Frames;
	}

	jQuery("#ptzCamera .content .view.hisplay.ui.tab .asearch").on("click",function(){
		var Channelid=window.SelectCamera.Channelid; //通道id
		var cameraId=window.SelectCamera.cameraId; //摄像机id
		var channelName=window.SelectCamera.channelName; //通道名称av_obj

		var _index=player.playerObj.GetFocusWindowIndex();

		var begin_Time=jQuery(".his_beginTime.input-time").val();
	    var end_Time = jQuery(".his_endTime.input-time").val();

		//var cId=window.SelectCamera.ListData[_index];
		var beginTime=jQuery(".his_beginTime.input-time").val().replace(/\-/g,"/");
		var endTime=jQuery(".his_endTime.input-time").val().replace(/\-/g,"/");;
		//if(typeof(HistoryHandler)!="object"){return}

		beginTime=(new Date(beginTime)).getTime();
	    endTime=(new Date(endTime)).getTime();
	    if(beginTime>=endTime)
	    {
	    	notify.warn("开始时间不能大于等于结束时间！");
	    	return;
	    }

	    var resultList =jQuery("#ptzCamera .content .view.hisplay.ui.tab .resultList");
	    resultList.html("正在查询中...");
		HistoryHandler.getvideos(Channelid,beginTime,endTime,function(data,flag)
		{
			if(flag==false)
			{
				resultList.html("没有查到历史录像");
				//notify.warn("没有查到历史录像");
				if((typeof controlBar === 'object') && controlBar.real2history==true)
				{
					PTZController.fireEvent("search",{data:data,flag:flag});
					controlBar.real2history=false;
				}
				return;
		    }
		    var L=data.videos.length;
		    if(data.videos.length==0)
		    {
		    	resultList.html("没有查到历史录像"); 
		    	//notify.warn("没有查到历史录像");
		    	return;
		    }
			var html=PTZController.ListSearch(data);
			resultList.html(html);
			resultList.scrollTop(10000000);
			var start=data.videos[0][0];
			var end=data.videos[L-1][1];

			begin_Time=Toolkit.formatDate(new Date(start));
			end_Time=Toolkit.formatDate(new Date(end));

			RenderCountFrames({
				cameraId:cameraId,
				beginTime:begin_Time,
				endTime:end_Time,
				channelName:channelName
			},data.videos,function(FrameList,FrameMark_InHisList)//在回调里绑定数据
			{
				//搜索完了之后最好自动播一段，不然会有问题,这个_index是有问题的
				window.SelectCamera.ListData[_index-0].framemark=FrameList;
				window.SelectCamera.ListData[_index-0].FrameMark_InHisList=FrameMark_InHisList;
				window.SelectCamera.searchHTML=resultList.html();
			});
			var input_beginTime=jQuery(".his_beginTime.input-time").val();;
			var input_endTime=jQuery(".his_endTime.input-time").val();

			window.SelectCamera.ListData[_index-0].selectName=window.SelectCamera.selectName;
			window.SelectCamera.ListData[_index-0].searchData=Object.clone(data);

			window.SelectCamera.input_beginTime=input_beginTime;
			window.SelectCamera.input_endTime=input_endTime;
			window.SelectCamera.searchData=data;
			//window.SelectCamera.searchHTML=html;

			if((typeof controlBar === 'object') && controlBar.real2history==true)
			{
				PTZController.fireEvent("search",{data:data,flag:flag});
				controlBar.real2history=false;
			}
		});
	});
	var jqsellor="#ptzCamera >.content>.view.hisplay>.box>.box-body>.resultList > ul > li>.litime"; 

	PTZController.addEvent("search", function(obj) {
		var data = obj.data;
		var flag = obj.flag;
		if (flag) //litime .btn1:last
		{
			var L = jQuery("#ptzCamera >.content>.view.hisplay>.box>.box-body>.resultList > ul > li>.btn1").length;
			var K = 0;
			if (L >= 2) {
				K = L - 2;
			}
			var selector = "#ptzCamera >.content>.view.hisplay>.box>.box-body>.resultList > ul > li>.btn1:eq(" + K + ")";
			jQuery(selector).trigger("click");
		}
	});

	jQuery(document).on("dblclick",jqsellor,function(){
       jQuery(this).next(".btn1").trigger("click");
	});
	//选中一段录像播放
	jQuery(document).on("click","#ptzCamera >.content>.view.hisplay>.box>.box-body>.resultList > ul > li>.btn1",function(){
        jQuery(this).parent("li").addClass("active").siblings("li").removeClass("active");
        var index=player.playerObj.GetFocusWindowIndex()-0;
        //var cId=window.SelectCamera.Channelid;
        var ListData= window.SelectCamera.ListData[index]; 
        var order=jQuery("#ptzCamera >.content>.view.hisplay>.box>.box-body>.resultList > ul > li").index(jQuery(this).parent());
        var data=ListData.searchData;
        if(!data)
        {
        	data=window.SelectCamera.searchData;
        }
        var beginTime=data.videos[order][0];
        var endTime=data.videos[order][1];
        var vodType=data.videos[order][2];
    	window.SelectCamera.ListData[index].subindex=order;
    	//window.SelectCamera.ListData[index].timePoint=beginTime;
    	window.SelectCamera.ListData[index].beginTime=beginTime;
    	window.SelectCamera.ListData[index].endTime=endTime;
    	window.SelectCamera.ListData[index].vodType=vodType;
    	var searchHTML=window.SelectCamera.searchHTML;

    	//window.SelectCamera.searchHTML="";
    	var resultList =jQuery("#ptzCamera .content .view.hisplay.ui.tab .resultList");
    	var definitionType=window.SelectCamera.ListData[index].definitionType;
		var input_beginTime=jQuery(".his_beginTime.input-time").val();;
		var input_endTime=jQuery(".his_endTime.input-time").val();

		window.SelectCamera.ListData[index].searchHTML=resultList.html();;
		window.SelectCamera.ListData[index].input_beginTime=input_beginTime;
		window.SelectCamera.ListData[index].input_endTime=input_endTime;

    	//fix bug #2381 
    	if(player.cameraData[index]!==-1)
    	{
	    	var tempId=player.cameraData[index].cId;
	    	if(tempId)
	    	{
				var camera = jQuery(".treeMenu .node[data-type=camera][data-id=" + tempId + "] .camera");
				if (player.isOnlyCameraId(tempId)) 
				{
					camera.closest('.node.activated').removeClass('activated');
					camera.removeClass('selected');
				}
	    	}
    	}

    	player.playHis(index,beginTime,endTime,vodType,data,function(n)
    	{ 
    		if(n!==0)
    		{
    			//console.log("播放历史失败");
    			return;
    		}
    		jQuery(".masklayer").hide();
			var text=window.SelectCamera.selectName;
			var alldata=window.SelectCamera.MenuData[text];
			if(alldata)
			{
				alldata.cId=alldata.id;
				alldata.cCode=alldata.cameracode;
				alldata.path=data.path;
				alldata.cName=data.name;
				alldata.zoomType=null;
				if(typeof(definitionType)=="number")
				{
					//alert("definitionType="+definitionType);
					alldata.definitionType=definitionType;
				}
				if(typeof(alldata.cameratype)=="number")
				{
					alldata.cType=alldata.cameratype;
				}
				else if(typeof(data.cameratype)=="number")
				{
					alldata.cType=data.cameratype;
				}
				else if(typeof(data.cType)=="number")
				{
					alldata.cType=data.cType;
				}
				alldata.cStatus=data.cstatus;
				//alldata.cName=alldata.name;
				player.cameraData[index]=alldata;
				player.updatePlayStatus(index);
				//alert("cType="+player.cameraData[index].cType+",data.cameratype="+data.cameratype);
			}
			window.SelectCamera.ListData[index].searchData=data;
    	});
	});

	jQuery(document).on("click","#ptzCamera >.content>.view.hisplay>.box>.box-body>.resultList > ul > li>.btn2",function(){
        notify.warn("该功能暂未完成"); 
	});
    //拖动视频进度条
	if (typeof(PlayerControler) == "object") {
		PlayerControler.removeEvents("dragEnd", {
			internal: false
		});
		PlayerControler.addEvent("dragEnd", function(obj) {
			player = player || window.gVideoPlayer;
			var index = obj.index - 0,
				ListData = window.SelectCamera.ListData[index],
				$seekPosObj = jQuery("#winPopup-showframe div"),
				N,
				time;
			if (typeof(ListData) == "object") {
				var beginTime = ListData.beginTime;
				var endTime = ListData.endTime;
				//如果有浮动seek标记，则直接读取时间进行播放，不在进行重新计算
				if ($seekPosObj && $seekPosObj.text() !== "") {
					var seekTime = Toolkit.str2mills($seekPosObj.text().trim());
					time = seekTime - beginTime;
				} else {
					var per = obj.per;
					var dis = endTime - beginTime;
					time = parseInt((endTime - beginTime) * per);
				}
				window.SelectCamera.ListData[index].timePoint = 0;
				var vodType = ListData.vodType;
				if (time < 0) {
					time = 0;
				}
				console.log("seek time:", Toolkit.mills2datetime(time + beginTime), time, "录像开始时间：", Toolkit.mills2datetime(beginTime), "录像结束时间：", Toolkit.mills2datetime(endTime));
				//seek 偶尔会失败
				N = player.playerObj.SetPlayMode(2, time, index);
				if (N < 0) {
					notify.warn("定位播放失败:" + player.getErrorCode(N + ""));
				}
				//300毫秒后重新读取进度条，由于ocx中更新状态为200毫秒，故需要等ocx写入值之后再进行
				//后续改用SetPlayMode的回调函数进行
				if (self.timer) {
					window.clearTimeout(self.timer);
				}
				self.timer = setTimeout(function() {
					ControlBar.ListenPlayerProgress(player, index, true);
				}, 3000);
			}
		});
	}

	//上海新设计，同步按钮
	jQuery("#npplay .header .ui.atached.menu > a > button.sync").on("click",function(){
		var A=[];
		var K=0;
		player.get_hiscount(function(str,i)
		{
			if(str=="ERROR"){return;}
			var videoType=JSON.parse(str).videoType;
			if(videoType!=2){return}
		    A.push(i);
		    K++;
		});
		if(K<2){notify.warn("至少两路历史录像才能同步播放");return;}
		var index=A[0];
		if(!window.SelectCamera.ListData)
		{
			notify.warn("control.js,error");return;
		}
	    	var beginTime=window.SelectCamera.ListData[index].beginTime;
	    	var endTime=window.SelectCamera.ListData[index].endTime;
		player.get_hiscount(function(str,i)
		{
			if(str=="ERROR"){return;}
			var videoType=JSON.parse(str).videoType;
			if(videoType!=2){return}
			var ListData=window.SelectCamera.ListData[i];
		    //window.SelectCamera.ListData[i].timePoint=beginTime;
		    window.SelectCamera.ListData[i].beginTime=beginTime;
		    window.SelectCamera.ListData[i].endTime=endTime;
		    var vodType=window.SelectCamera.ListData[i].vodType;
			player.playHis(i,beginTime,endTime,vodType,ListData.searchData);
		});

	});
});