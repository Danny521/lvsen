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
				 if ($(val).is(":visible")) {
				 	/*计算视频监控左侧树的名称宽度 by songxj 2016/06/02*/
					var $content = $(val),
						contentWidth = $content.width(),
						$fold = $content.find(".fold"),
						foldWidth = $fold.width() - 0,
						foldMarginLeft = $fold.css("margin-left").split("px")[0] - 0,
						foldMarginRight = $fold.css("margin-right").split("px")[0] - 0,
						$text = $content.find(".text-over"),
						textWidth = $text.width() - 0,
						$statistics = $content.find('.statistics'),
						statisticsWidth = $statistics.width() - 0,
						statisticsMarginLeft = $statistics.css("margin-left").split("px")[0] - 0,
						$pollingbtn = $content.find(".group-operator"),
						pollingbtnWidth = $pollingbtn.length ? $pollingbtn.width() - 0 : 0,
						pollingbtnMarginLeft = $pollingbtn.length ? $pollingbtn.css("margin-left").split("px")[0] - 0 : 0,
						$scrollEle = $content.closest(".tree-outtest-container")[0],
						totalWidth = foldWidth + foldMarginLeft + foldMarginRight + textWidth + statisticsWidth + statisticsMarginLeft + pollingbtnWidth + pollingbtnMarginLeft;

					// 判断是否有纵向滚动条
					if ($scrollEle.clientWidth < $scrollEle.offsetWidth) {
						totalWidth += ($scrollEle.offsetWidth - $scrollEle.clientWidth); // 为滚动条的宽度
					}
					// 修改视频监控名称宽度,在名称过长时显示省略号
					if (contentWidth <= totalWidth) {
						$text.width(contentWidth - foldWidth - foldMarginLeft - foldMarginRight - statisticsWidth - statisticsMarginLeft - pollingbtnWidth - pollingbtnMarginLeft);
					} else {
						$content.find('.text-over').css('width', 'auto');
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