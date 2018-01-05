/**
 * 播放器添加预置位的js文件 
 * 2016/5/13 by yangll                                               
 */
define([
	"jquery",
	"/module/ptz-controller/ptzctrl/js/gptz-core.js",
	"/component/base/self/regexp.extend.js"
], function(jQuery, gPtz) {

	return (function(scope, $) {

		var //播放器对象
			_player = null,
			//当前播放器摄像机数据
			_cData = null,
			//事件处理程序
			_eventHandler = {
				//预置位名字输入框的键盘事件
				"PresetNameKeyEvent": function(evt) {
					var code = evt.keyCode;
					//enter键的keyCode是13，判断按下的是否是enter
					if (code === 13) {
						evt.stopPropagation();
						//enter键的处理逻辑，直接保存预置位
						_presetNameKeyPress.call(this);
					}
				},
				//添加预置位面板中，是否设置为归位点单选事件
				"RadioEvent": function(evt) {
					evt.stopPropagation();
					//触发样式
					$(this).addClass("active").parent("span").siblings().find(".radio").removeClass("active");
				},
				//添加预置位面板中，点击"保存"的事件
				"PresetAddEvent": function(evt) {
					evt.stopPropagation();
					_presetAdd.call(this);
				},
				//添加预置位面板中，点击"取消"或右上角的关闭的事件
				"PresetCancelEvent": function(evt) {
					evt.stopPropagation();
					_presetCancel.call(this);
				}
			};

		var	/**
			 * [presetNameKeyPress enter键的处理逻辑，直接保存预置位]
			 * @return {[type]} [description]
			 */
			_presetNameKeyPress = function() {
				var $this = $(this);
				window.setTimeout(function() {
					$this.trigger("blur");
					$("#addPresets").trigger("click");
					var text = $this.val();
					if (!text) {
						$this.val("预置位名称");
					}
					$this.addClass("init");
					$this.removeClass("write");
				}, 200);
			},

			/**
			 * [_presetCancel 确定预置位的添加]
			 * @return {[type]} [description]
			 */
			_presetAdd = function() {
				var $presetBtn = $(".add-preset-point"),
					$container = $(".input-pannel"),
					$presets = $(".add-presets"),
					presetName = $("#presetName").val().trim();

				//_isPresetNameCanAdd用来检测预置位的名称presetName是否满足要求，若满足则添加到云台
				if (!_isPresetNameCanAdd(presetName)) {
					return;
				}
				//将当前预置位的信息（如摄像机号、地址、预置位名称、是否为归位点、图片等记录下来
				var oPreset = _setOPreset(presetName);
				//将当前预置位的信息添加到云台
				gPtz.createPreset(oPreset);
				//隐藏预置位添加面板
				$presetBtn.removeClass("clicked");
				$presets.removeClass("active");
				$container.removeClass("active");
			},
			/**
			 * [_setOPreset 将当前预置位的信息（如摄像机号、地址、预置位名称、是否为归位点、图片等记录下来]
			 * @param {[type]} presetName [用户输入的预置位名称]
			 * @return {[type]} [将记录信息后的预置位对象返回]
			 */
			_setOPreset = function(presetName) {
				var sortNo = gPtz.getSortNo(_cData.cId),
					isHomePoint = $(".add-presets").find(".radio.active").attr("data-flag"),
					oPreset = {};

				oPreset.cameraId = _cData.cId;
				oPreset.cameraNo = _cData.path ? _cData.path : _cData.playingChannel.path;
				oPreset.name = presetName;
				oPreset.isRestoration = isHomePoint;
				oPreset.sortNo = sortNo;
				//预置位图片信息
				var text = _player.getPicInfo(_player.curChannel).trim();
				var result = text.replace(/[\n]/ig, "");
				oPreset.picInfo = result;

				return oPreset;
			},
			/**
			 * [_isPresetNameCanAdd 检查预置位名称是否在格式上、长度上满足要求，是否有重名等]
			 * @param  {[type]}  presetName [用户输入的要检测的预置位名称]
			 * @return {Boolean}            [true 表示满足要求，false表示不满足要求]
			 */
			_isPresetNameCanAdd = function(presetName) {
				var placeholder = $("#presetName").attr("placeholder");
				if (presetName === "" || presetName === placeholder) {
					notify.warn("预置位名称不能为空！");
					return false;
				}
				if (!RegExp.formatName(presetName)) {
					notify.warn("预置位名称只能包含数字、汉字、字母和下划线，请重新输入");
					return false;
				}
				//检测预置位的长度是否过长，即大于30字
				if (presetName.length > 30) {
					notify.warn("预置位名称最多30字！");
					return false;
				}
				//检测预置位是否有重名 
				var allPresets = window.cameraCache.get(_cData.cId).presetsMap,
					repeatname = false;
				allPresets.each(function(value, key) {
					if (presetName === value) {
						notify.warn("已存在的预置位名称，请重新输入！");
						repeatname = true;
						//跳出循环
						return false;
					}
				});
				return !repeatname;
			},
			/**
			 * [_presetCancel 取消预置位添加，即关闭预置位面板]
			 * @return {[type]} [description]
			 */
			_presetCancel = function() {
				$(".add-preset-point").removeClass("clicked");
				$(".input-pannel").removeClass("active");
				$(".add-presets").removeClass("active");
			},
			/**
			 * [_simplePlaceholder 工具类函数 IE9及IE9以下placeholder属性兼容]
			 * @author huzc
			 * @date   2015-03-04
			 * @param  {[字符串]}   id [唯一id]
			 */
			_simplePlaceholder = function(id) {
				var $obj = $("#" + id);
				var placeholder = $obj.attr("placeholder");
				$obj.val(placeholder).addClass("init").removeClass("write");

				$obj.focus(function() {
					$obj.val("");
					//这两个类定义在module\common\ptz\control.css中
					$obj.removeClass("init").addClass("write");
				});

				$obj.blur(function() {
					if ($obj.val() === "") {
						$obj.val(placeholder).addClass("init").removeClass("write");
					}
				});

				$obj.keypress(function(event) {
					if (event.keyCode === 13) {
						event.stopPropagation();
						event.preventDefault();
						if ($obj.val() === "") {
							$obj.val(placeholder).addClass("init");
						}
					}
				});
			},
			/**
			 * [_setpanelMine 设置预置位面板的显示位置]
			 * @return {[type]} [description]
			 */
			_setpanelMine = function() {

				var container = $(".input-pannel"),
					presets = $(".add-presets"),
					width = parseInt(presets.css("width")),
					height = parseInt(presets.css("height")),
					//分享按钮相对父容器的左偏移	按钮本身的宽度
					thisWidth = $(".video-control").width();
				var oIfrLeft = (thisWidth - width) / 2;
				if (height !== 0 || width !== 0) {
					container.css({
						"width": width,
						"left": oIfrLeft,
						"height": height + 60,
						"top": "30%"
					});
				}
			},

			/**
			 * [_initPTZ 初始化云台参数]
			 * @return {[type]} [description]
			 */
			_initPTZ = function() {
				//获取当前播放的摄像机通道地址
				var path = _cData.path || _cData.playingChannel.path;

				gPtz.setParams({
					cameraId: _cData.cId,
					cameraNo: path,
					cameraType: _cData.cType
				});
			},

			/**
			 * 事件绑定
			 * @return {[type]} [description]
			 */
			_bindEvents = function(selector) {
				$(selector).find("[data-handler]").map(function() {
					$(this).off($(this).data("event")).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
				});
			};

		/**
		 * 球机播放器上添加预置位业务逻辑入口
		 * @param  {[type]} Ocxplayer [播放器对象]
		 * @param  {[type]} cData     [当前屏上的摄像机数据]
		 * @return {[type]}           [description]
		 */
		scope.init = function(ocxPlayer,cData) {
			//存储播放器对象
			_player = ocxPlayer;
			//存储当前窗口播放的摄像机数据
			_cData = cData;
			//初始化云台
			_initPTZ();
			//设置添加面板的位置
			_setpanelMine();
			//设置占位符
			_simplePlaceholder("presetName");
			//事件绑定
			_bindEvents(".input-pannel");
		};

		return scope;
	
	}({}, jQuery));
});