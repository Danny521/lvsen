define([
	"require", 
	"domReady", 
	"js/apply_controller",
	"jquery-ui-1.10.1.custom.min",
	"base.self",
	"permission"
	], function(require, domReady, controller) {
		domReady(function() {
			controller.init();
		});
	}
);