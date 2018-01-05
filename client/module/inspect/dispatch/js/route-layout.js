/**
 *
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-05-09 12:50:31
 * @version $Id$
 */

define(['jquery', '/module/common/js/player2.js', 'handlebars'], function($, VideoPlayer) {
	var rowTemplate = '<div class="route-player-row"><p class="header"></p><div class="player-container"></div><ul class="inline-list"><li class="name-item">已经行驶过</li><li class="name-item">正在通过</li><li class="name-item">即将到达</li></ul></div>',
		ocxTemplate = '<object id={{ocxName}} class="route-player-ocx" type="applicatin/x-firebreath" width = "" height = ""><param name="onload" value="pluginLoaded"/></object>',
		markIdIndex = 0,
		mardId = 'player',
		lastPlayer = '',
		content = $('#content'),
		routeLayout = {

			getPlayer: function(name, fn) {
				var $row = $(rowTemplate);
				content.append($row);
				if($('#player-init').length){
					this.removePlayer('player-init');
				}
				$row.find('p').text(name);
				this.setLayout();
				$row.find('.player-container').append(Handlebars.compile(ocxTemplate)({
					ocxName: mardId + markIdIndex
				}));
				/**
				 * 用回调的方式实现，以解决ie下，播放器播放样式加载慢造成单屏播放的问题。
				 * add by zhangyu on 2015/6/5
				 * @type {GuardRouteExtendScreen}
				 */
				window.setTimeout(function() {
					lastPlayer = new VideoPlayer({
						uiocx: mardId + markIdIndex
					});
					$row.attr('id', 'div-' + mardId + markIdIndex);
					lastPlayer.playerObj.SetLayoutEx(101, JSON.stringify({row: 1, column: 3, distance: 20}));
					lastPlayer.playerObj.SetLayoutInterspaceColor(255, 255, 255);
					markIdIndex += 1;
					//执行回调
					fn && fn({id: $row.attr('id'), player: lastPlayer});
				})
				//return {id: $row.attr('id'), player: lastPlayer};
			},

			init: function() {
				var $row = $(rowTemplate);
				$row.attr('id','player-init').find('p, ul').remove();
				content.append($row);
				this.setLayout();
				$row.find('.player-container').append(Handlebars.compile(ocxTemplate)({
					ocxName: 'player-show'
				}));
				lastPlayer = new VideoPlayer({
					uiocx: 'player-show'
				});
				lastPlayer.playerObj.SetLayoutEx(101, JSON.stringify({row: 1, column: 3, distance: 20}));
				lastPlayer.playerObj.SetLayoutInterspaceColor(255, 255, 255);
				return this;
			},

			removePlayer: function(ocxParentId) {
				$('#' + ocxParentId).find('.player-container').hide().end().remove();
				this.setLayout();
				if ($('.route-player-row').length === 0){
					this.init();
				}
			},

			setLayout: function() {
				var number = $('.route-player-row').length,
					contentHeight = content.height(),
					contentWidth = content.width() - 20,
					ocxHeight = (content.width() - 20 - 20 * 2) / 4; //(content.width() - 20 - 20 * 2)/3 * 3/4; 真正计算公式
				if ((ocxHeight + 65) * number > contentHeight) {
					ocxHeight = Math.floor((contentHeight - 65 * number) / number);
					contentWidth = ocxHeight * 4 + 20 * 2;
				}
				$('.route-player-row').find('.player-container').height(ocxHeight);
				$('.route-player-row').css({
					top: (contentHeight - $('.route-player-row').height() * number) / 2,
					width: contentWidth
				});
				$('.name-item').css('width', ocxHeight * 4 / 3);

			}
		};

	routeLayout.init();

	$(window).resize(function() {
  		routeLayout.setLayout();
	});

	return routeLayout;
});