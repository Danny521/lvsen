jQuery(function(){
	jQuery(document).on("focus click",".simpleColor",function(){
		var w=jQuery(this).width();
		var h=jQuery(this).height();
		var x=jQuery(this).offset().left;
		var y=jQuery(this).offset().top;	
		var colorConfig=jQuery(this).attr("colorConfig");
		colorConfig=colorConfig.replace(/\s+/gi,"");
		colorConfig=eval("("+colorConfig+")");
		var L=colorConfig.length;
		var css="border-radius:4px;width:"+w+"px;height:"+(20*L)+"px;";
		var html="<div tabindex='0' id='Show-Simple-Color' class='Levelcolor' tabindex='0' style='"+css+"'>";
		for(var i=0;i<=L-1;i++)
		{
			html=html+"<div bgcolor='"+colorConfig[i].color+"' style='background-color:"+colorConfig[i].color+";'>"+colorConfig[i].value+"</div>";
		}
		html=html+"</div>";
		if(jQuery("#Show-Simple-Color")[0])
		{
			jQuery("#Show-Simple-Color").remove();
		}
		jQuery(document.body).append(html);

		jQuery("#Show-Simple-Color").css({
			position:"absolute",
			left:x,
			top:y+h+6,
			width:w+5,
			height:"auto",
			border:"solid 1px #cccccc",
			"z-index":9999999
		}).focus();
		jQuery("#Show-Simple-Color").data("sourceNode",jQuery(this));
	});

	jQuery(document).on("blur","#Show-Simple-Color",function(){
		setTimeout(function(){
			jQuery("#Show-Simple-Color").remove();
		},100);
	});

	jQuery(document).on("click","#Show-Simple-Color>div",function(){
		var color=jQuery(this).css("background-color");
		color=jQuery(this).attr("bgcolor");
		var sourceNode=jQuery("#Show-Simple-Color").data("sourceNode");
		sourceNode.css({
			"background-color":color
		});
		var colorConfig=sourceNode.attr("colorConfig");
		colorConfig=eval("("+colorConfig+")");
		var L=colorConfig.length;
		for(var i=0;i<=L-1;i++)
		{
			if(colorConfig[i].color==color)
			{
				sourceNode.attr("colorValue",colorConfig[i].value);
				sourceNode.css("background-color",color);
				sourceNode.focus();
				//sourceNode.val(colorConfig[i].value);
				jQuery("#Show-Simple-Color").remove();
				break;
			}
		}
	});
});


















