/**
 * 
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-05-11 15:30:49
 * @version $Id$
 */

define(['jquery', 'pubsub'], function($, PubSub){
	var treeWatchName = {
		timer:null,
		resetOrgLayout: function(container){

			var self = this;
			$.each(container.find('a.group'), function(index, val) {
				 /* iterate through array or object */
				 if ($(val).is(":visible")) {
					var content = $(val),
						contentChildWidth = content.find('.statistics').width() + content.find('.fold ').width(),
						contentWidth = content.width();
					if (!content.find('.text-over').attr('data-width')) {

						content.find('.text-over').attr('data-width', content.find('.text-over').width());
					}
					contentChildWidth += +content.find('.text-over').attr('data-width');
					if (contentWidth < contentChildWidth) {
						//修改视频监控轮巡按钮样式(宽度减33px)
						content.find('.text-over').width(contentWidth - contentChildWidth + parseFloat(content.find('.text-over').attr('data-width'))-33);
					} else {
						content.find('.text-over').css('width', 'auto');
					}
				}
			});
		},
		resetCustomizeLayout:function(container){
			var self = this;
			$.each(container.find('a.group'), function(index, val) {
				 /* iterate through array or object */
				var content = $(val);
				var textOverWidth = content.find('.text-over').width();
				var foldWidth = content.find('.fold ').outerWidth(true);
				var contentWidth = content.width();
				var btnWidth = content.find('.group-operator').outerWidth(true);
				var btns = content.find('.group-operator:visible');
				var btnsSize = btns.size();
				var btnsWidth2 = btns.size()*btnWidth+6;
				var hasBtn = content.closest('.node').hasClass('similar-hover')||btnsSize;
				var btnsWidth = 0;
				if (hasBtn) {
					btnsWidth= (btnsSize*btnWidth+6);
				}

					if(!content.find('.text-over').attr('data-width')){
						content.find('.text-over').attr('data-width', textOverWidth);
					}
					var contentChildWidth = foldWidth+(+ content.find('.text-over').attr('data-width'))+btnsWidth;
					if(contentWidth < contentChildWidth){
						content.find('.text-over').width(contentWidth - foldWidth - btnsWidth);
						if (hasBtn) {
							content.find('.text-over').width(contentWidth - foldWidth - btnsWidth - 63);
							if (self.timer) {
								clearTimeout(self.timer);
								self.timer = null;
							}
							self.timer = setTimeout(function(){
								content.find('.text-over').width(contentWidth - foldWidth - btnsWidth);
							},400);
						}
					}else{				
 						content.find('.text-over').css('width', 'auto');
					}

			});
		},
		resetWidth:function(){
			var self = this,container = $('.tree-outtest-container:visible');
			var type = container.data('treetype');
			if (type==='org') {
				self.resetOrgLayout(container);
			}else{
				self.resetCustomizeLayout(container);
			}
		},
		watchContainer: function(){
			var self =this;
			PubSub.subscribe('watchContainer',function(){
				self.resetWidth();
			});
		}
	};

	return treeWatchName;
});