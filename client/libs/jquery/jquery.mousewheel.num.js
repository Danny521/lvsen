
	jQuery(document).on("mousewheel","input.mousewheel-num",function(evt){
		var val=jQuery(this).val()-0;
		var min=jQuery(this).attr("min")-0;
		var max=jQuery(this).attr("max")-0;
		var step=jQuery(this).attr("step")-0;
		var K=evt.originalEvent.wheelDelta/120;
		jQuery(this).val(val+K*step);
	});
