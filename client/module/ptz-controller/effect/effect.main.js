define(["jquery", "jquery-ui"], function(jQuery) {

	var OnBeforeNavigate2 = function(data){
		jQuery("#input-data").val(data);
		var html = "<iframe id='OnBeforeNavigate2' etype='input' eid='input-data' src='about:blank' style='width:0px;height:0px;'></iframe>";
		if(jQuery("#OnBeforeNavigate2")[0]){
			jQuery("#OnBeforeNavigate2").remove();
		}
		jQuery(document.body).append(html);
	};
	var bindEvents = function() {
		//绑定拖拽条
		jQuery('.win-dialog .win-dialog-body ul li [class*=Slider]').slider({
			range: 'min',
			step: 1,
			max: 127,
			min: -127,
			value: 0,
			slide: function (evt, ui) {
				var str = Math.round((ui.value + 127) / 2.54);
				jQuery(this).next().html(str);
			},
			change: function (evt, ui) {
				var str = ui.value;
				var html = Math.round((str + 127) / 2.54)
				jQuery(this).next().html(html);
				var sliders = jQuery(".win-dialog .win-dialog-body ul li [class*=Slider]");
				var color = {
					bright: sliders.eq(0).slider('value'),
					contrast: sliders.eq(1).slider('value'),
					saturation: sliders.eq(2).slider('value'),
					hue: sliders.eq(3).slider('value')
				};
				var data = JSON.stringify(color);
				OnBeforeNavigate2(data);
			}
		});
		//重置按钮事件绑定并触发
		jQuery('#camera-color .win-dialog-foot .reset').on("click", function () {
			jQuery(".win-dialog .win-dialog-body ul li .count").html(50);
			jQuery('.win-dialog .win-dialog-body ul li [class*=Slider]').slider('value', 0);
		}).trigger("click");
	};

	/**
	 * 页面初始化完成后的入口
	 */
	jQuery(function () {
		//绑定事件
		bindEvents();
		//页面加载完，回传文档加载完毕事件
		var obj = JSON.stringify({
			type: "complete"
		});
		OnBeforeNavigate2(obj);
	});
});