define([
	'base.self',
	'handlebars'
], function() {
	window.template = null;
	var templateUrl = "/module/common/tvwall/inc/tvwall-template.html";
	//请求页面模版
	$.get(templateUrl, {cache: false}, function(tem) {
		if (tem) {
			template = Handlebars.compile(tem);
			return template;
		}
	});

});