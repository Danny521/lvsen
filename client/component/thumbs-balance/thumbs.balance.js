	// 根据窗口大小绘制底部案件缩略图的间距
	(function() {
		var unit = 190,
			side = 10,
			adapt = jQuery('.auto-adapt'),
			panel = adapt.parent(),
			items = adapt.children('li');

		var repaintIncident = function() {
			var width = panel.width(),
				count = parseInt((width + side * 2) / unit);
			items.css('margin', 10);
			adapt.css('width', width + side * 2);

			var over = (width + side * 2) - unit * count,
				margin = parseInt((over / count) / 2);

			items.css({
				marginLeft: side + margin,
				marginRight: side + margin
			});

			panel.children('.loading').remove();
			adapt.removeClass('hide');
		};

		jQuery(window).on('resize', repaintIncident).triggerHandler('resize');
	})();

