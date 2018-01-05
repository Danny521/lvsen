/**
 *
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-04-21 20:19:03
 * @version $Id$
 */

define(['/module/common/js/player2.js', 'ajaxModel', "js/npmap-new/map-dblclick-change", 'pubsub', 'handlebars'], function(VideoPlayer, ajaxModel, dblclickChange, Pubsub) {
	var videoPlayer = {
		//设置ocx布局的参数
		layoutObj: {
			row: 1,
			column: 4,
			distance: 32
		},
		template: '<div id="map-video-play-bar" class="map-video-play-bar"><div class="video-content"><object id="UIOCX-map-bar" class="map-video-play-bar-ocx" type="applicatin/x-firebreath" width="" height=""><param name="onload" value="pluginLoaded" /></object><ul id="map-video-play-bar-name" class="inline-list"></ul></div>' +'<div class="gpu-tips">当前正在使用GPU模式播放</div>'+ '<div class = "bar-control"><div class="gpu-column" style="float:left; width: 100px;"><span class = "gpu-name start" > 启用GPU硬解 </span></div><div class="video-play-column-bt" style="float:left; width: 107px;"><span class = "bar-name" > 视频播放栏 </span><span class="icon-control"></span></div><span class="icon-close np-map-play-bar-close"></span></div></div> '
	},

	/**
	 * [_initCheckGPU 检测是否支持GPU]
	 * @author songxj
	 */
	_initCheckIsSupportGPU = function() {
		var $gpuColumn = jQuery("#map-video-play-bar .bar-control div.gpu-column"),
			option = videoPlayer.player.getOption(JSON.stringify({"hwdecoder":""})),
			hwdecoder = JSON.parse(option).hwdecoder,
			isSupportGPU = hwdecoder.support; // 1:支持 0:不支持
		if (isSupportGPU) {  // 支持  改1
			$gpuColumn.removeClass("disabled");
		} else { // 不支持
			$gpuColumn.addClass("disabled");
		}
	},
	/**
	 * [_stopAllPlayVideos 停止所有播放的视频]
	 * @author songxj
	 */
	_stopAllPlayVideos = function() {
		var player = videoPlayer.player,
			cameraDatas = player.cameraData;
		for (var i = 0; i < cameraDatas.length; i++) {
			(function(index) {
				player.setStyle(0, index);
				player.stopStream(index);
			})(i);
		}
	},
	/**
	 * [_refreshPalyVideoData 刷新播放的视频数据]
	 * @author songxj
	 */
	_refreshPalyVideoData = function() {
		var player = videoPlayer.player,
			cameraDatas = player.cameraData,
			playIndex;
		// 停止所有播放的视频
		_stopAllPlayVideos();
		// 重新播放视频
		for (var i = 0; i < cameraDatas.length; i++) {
			(function(index) {
				if (cameraDatas[index] !== -1) {
					player.playSH(cameraDatas[index], index);
				}
			})(i);
		}
	},
	/**
	 * [_confirmStartGPUEvent 确定开启GPU硬解事件]
	 * @author songxj
	 */
	_confirmStartGPUEvent = function() {
		var startGPUReturnValue = videoPlayer.player.setOption(JSON.stringify({"hwdecoder":{"mode":"all"}}));
		// 开启GPU硬解模式
		if (startGPUReturnValue === 0) { // 成功 改2
			// 刷新播放的视频，以切换到GPU模式
			_refreshPalyVideoData();
			// gpu按钮文字改为“关闭GPU硬解”
			jQuery(".gpu-name").removeClass("start").addClass("close").text("关闭GPU硬解");
			// gpu按钮左侧处显示几秒钟的“当前使用GPU模式播放”
			jQuery(".map-video-play-bar .gpu-tips").show();
			setTimeout(function() {
				jQuery(".map-video-play-bar .gpu-tips").hide();
			}, 5000);
		} else { // 失败
			// 提示失败
			notify.warn("启用GPU硬解失败！");
		}
	},
	/**
	 * [_closeGPUEvent 关闭GPU硬解事件]
	 * @author songxj
	 */
	_closeGPUEvent = function() {
		var closeGPUReturnValue = videoPlayer.player.setOption(JSON.stringify({"hwdecoder":{"mode":"none"}}));
		// 关闭GPU硬解模式
		if (closeGPUReturnValue === 0) { // 成功
			// 刷新播放的视频，以切换到CPU模式
			_refreshPalyVideoData();
			// gpu按钮文字改为“开启GPU硬解”
			jQuery(".gpu-name").removeClass("close").addClass("start").text("开启GPU硬解");
			// 提示成功
			notify.warn("关闭GPU硬解成功！");
		} else { // 失败
			// 提示失败
			notify.warn("关闭GPU硬解失败！");
		}
	},
	/**
	 * [_dealClickGPUBtEvent 处理GPU按钮点击事件]
	 * @author songxj
	 */
	_dealClickGPUBtEvent = function($this) {
		var gpuBt = $this.find(".gpu-name");
		if (gpuBt.attr("class").indexOf("start") !== -1) { // 启用GPU硬解
			// 隐藏ocx
			jQuery("#map-video-play-bar").css("bottom", 9999);
			// 弹框进行风险提示
			new ConfirmDialog({
				title: "风险提示",
				message: "启用GPU硬解，会显著降低视频显示对系统资源的消耗，可能会发生小概率蓝屏现象， 确认开启吗？",
				width: 360,
				callback: function() {
					setTimeout(function() {
						_confirmStartGPUEvent();
					}, 500);
				},
				prehide: function() {
					// 显示ocx
					jQuery("#map-video-play-bar").css("bottom", 0);
				}
			});
		} else if (gpuBt.attr("class").indexOf("close") !== -1) { // 关闭GPU硬解
			jQuery(".map-video-play-bar .gpu-tips").hide();
			_closeGPUEvent();
		}
	};

	$('body')
	.on('click', '#map-video-play-bar .bar-control div.video-play-column-bt', function(event) { // 收起和展示的事件
		var self = $(this), animatePX = self.parent().hasClass('down') ? 0: -204,
			status = self.parent().hasClass('down') ? 'open': 'close';
		/* Act on the event */
		self.closest('#map-video-play-bar').animate({bottom: animatePX}, 1000,function(){
			self.parent().toggleClass('down');
		}).attr('data-status', status);

	})
	.on("click", "#map-video-play-bar .bar-control div.gpu-column:not(.disabled)", function() { // GPU和CPU模式切换 songxj
		_dealClickGPUBtEvent(jQuery(this));
	});

	/**
	 * [init 初始化整个地图播放栏]
	 * @author yuqiu
	 * @date   2015-05-22T14:55:49+0800
	 * @return {[type]}                 [封装后的OCX播放器对象]
	 */
	videoPlayer.init = function(noPoint) {
		var self = this,
			isNew = false;
        if (!$('#map-video-play-bar').length) {
        	   if(window.JudgeExpand() === 1 || window.isPointPlay){   //判断是单屏时才添加
        	   	    console.log("判断是单屏时才添加");
        	   	    $('body').append(self.template);
        	   }
			   self.player = new VideoPlayer({
					uiocx: 'UIOCX-map-bar'
			   });
			   isNew = true;
		};
		self.nameContainer = $('#map-video-play-bar-name');
		self.parent = $('#map-video-play-bar').find('.video-content');
		self.parentWidth = self.parent.width();
		if (!self.player) {
			self.player = new VideoPlayer({
				uiocx: 'UIOCX-map-bar'
			});
		}
		if (self.parentWidth > 1380) {
			self.layoutObj.column = 5;
		} else if (self.parentWidth < 980) {
			self.layoutObj.column = 3;
		}
		//当摄像机没有点位时，固定窗口数是4个
		if(noPoint != undefined && noPoint == "noPoint"){
           self.layoutObj.column = 4;
		}
		$('#map-video-play-bar').attr('data-status', 'open').find('.icon-close').off('click').on('click', function(event) {
			event.preventDefault();
			event.stopPropagation();
			//关闭地图播放栏时的操作
			self.closeVideoPlayBar();

			/* Act on the event */
		});
		self.setLayout(self.layoutObj);
		self.player.playerObj.SetLayoutInterspaceColor(255, 255, 255);
		self.player.playerObj.SetFocusBorderColor(0, 0, 0);
		//绑定播放窗口的双击事件
		dblclickChange.dblExtendScreen(self.player, isNew);
		// 检测是否支持GPU by songxj
		_initCheckIsSupportGPU();
		return self.player;
	}
	/**
	 * [createOcx 生成ocx]
	 * @author yuqiu
	 * @date   2015-05-22T14:55:49+0800
	 * @return {[type]}                 [封装后的OCX播放器对象]
	 */
	videoPlayer.createOcx = function() {
		var self = this;
		var ocxplayer;
		if (!self.player) {
			ocxplayer = new VideoPlayer({
				uiocx: 'UIOCX-map-bar'
			});
		}else{
			ocxplayer = self.player;
		}
		ocxplayer.playerObj.SetLayoutInterspaceColor(255, 255, 255);
		return ocxplayer;
	}
	/**
	 * [closeVideoPlayBar description]
	 * @return {[type]} [description]
	 */
	videoPlayer.closeVideoPlayBar = function() {
		var self = this;
		if (self.player && self.player.cameraData) {
			//清除左侧树节点标记
			self.player.cameraData.each(function (item) {
				$(".node.selected[data-id='" + item.cId + "']").removeClass("selected");
			});
		}
		//移出工具栏
		self.remove();
	}
	/**
	 * [toggleClose 显示和隐藏关闭按钮的]
	 * @author yuqiu
	 * @date   2015-05-22T14:55:45+0800
	 * @return {[type]}                        [当前对象]
	 */

	videoPlayer.toggleClose = function() {
		$('#map-video-play-bar').find('.icon-close').hide().end().find('.icon-control').toggleClass('pull-right');
		return this;
	}
	/**
	 * [remove 删除地图播放栏]
	 * @author yuqiu
	 * @date   2015-05-22T14:57:21+0800
	 * @return {[type]}                        [当前对象]
	 */
	videoPlayer.remove = function() {
		$('#map-video-play-bar').hide().remove();
		return this;
	}
	/**
	 * [setLayout ocx当前分屏的布局]
	 * @author yuqiu
	 * @date   2015-05-22T15:03:21+0800
	 * @param  {[type]}                 layout [布局相关参数]
	 * @return {[type]}                        [当前对象]
	 */
	videoPlayer.setLayout = function(layout) {
		var self = this;
		$.extend(self.layoutObj, layout);
		self.player.playerObj.SetLayoutEx(101, JSON.stringify(self.layoutObj));
		self.initName(self.layoutObj.column);
		return this;
	}
	/**
	 * [resetNameLayout 重新计算名称布局]
	 * @author yuqiu
	 * @date   2015-05-22T14:57:29+0800
	 * @param  {[type]}                 number [布局的个数]
	 * @return {[type]}                        [当前对象]
	 */
	videoPlayer.resetNameLayout = function(number){
		var self = this;
		var liWidth = (self.nameContainer.width() - 32 * (number - 1) ) / number;
		self.nameContainer.find('li').css('width', liWidth);
		return self;
	}
	/**
	 * [hideBubble 隐藏气泡]
	 * @author yuqiu
	 * @date   2015-05-22T14:57:33+0800
	 * @return {[type]}                 [当前对象]
	 */
	videoPlayer.hideBubble = function(){
		this.nameContainer.find('li .item-hide').hide();
		return this;
	}
	/**
	 * [showBubble 展示气泡]
	 * @author yuqiu
	 * @date   2015-05-22T14:57:37+0800
	 * @return {[type]}                 [当前对象]
	 */
	videoPlayer.showBubble = function(){
		this.nameContainer.find('li .item-icon:not(item-hide)').show();
		return this;
	}
	/**
	 * [changeStatus 管理当前播放器的状态]
	 * @author yuqiu
	 * @date   2015-05-22T14:57:40+0800
	 * @param  {[type]}                 status [展示还是关闭标志变量]
	 * @param  {[type]}                 tag    [标记是否以动画的形式开启或者关闭]
	 * @return {[type]}                        [当前对象]
	 */
	videoPlayer.changeStatus = function(status, tag){
		var $playBar = $('#map-video-play-bar'),
			bottom = parseInt($playBar.css('bottom'));
			if(bottom == 0 && status === 'close'){
				if(!tag) {
					$playBar.animate({bottom: '-204'}, 500);
				} else {
					$playBar.css({bottom: '-204px'});
				}
			}else if(status === 'open' && $playBar.attr('data-status') === 'open'){
				if(!tag) {
					$playBar.animate({bottom: '0'}, 500);
				} else {
					$playBar.css({bottom: '0'});
				}
			}
		return this;
	}
	/**
	 * [initName 根据分屏是数量初始化名称布局]
	 * @author yuqiu
	 * @date   2015-05-22T14:57:44+0800
	 * @param  {[type]}                 number [分屏数量]
	 * @return {[type]}                        [当前对象]
	 */
	videoPlayer.initName = function(number) {
		var self = this;
		var tml = '<li class="video-item"><span class="item-icon item-hide"></span><span class="video-name"></span></li>';
		var childHtml = [];
		for (var i = number- 1; i >= 0; i--) {
			childHtml.push(tml);
		}
		self.nameContainer.html(childHtml);
		self.hideBubble();
		self.resetNameLayout(number);
		return self;
	}
	/**
	 * [writeTitle 给播放器的分屏下写名称]
	 * @author yuqiu
	 * @date   2015-05-22T14:57:47+0800
	 * @param  {[type]}                 name [传一个name对象--title就是名称、index是分屏索引、number是数字]
	 * @return {[type]}                      [当前对象]
	 */
	videoPlayer.writeTitle = function(name){
		var self = this, $li = self.nameContainer.find('.video-item').eq(name.index);
		$li.find('.video-name').text(name.title);
		if(name.title){
			$li.find('.item-icon').show();
		}else{
			$li.find('.item-icon').hide();
		}
		if(name.number){
			$li.find('.item-icon').removeClass('item-hide').text(name.number);
			self.showBubble();
		}

		return self;
	}

	//给外部暴露隐藏地图控制栏的
	Pubsub.subscribe('closeMapVideoBar', function(msg, tag){
		if($('#map-video-play-bar').length){
			videoPlayer.changeStatus('close', tag);
		}
	});

	//给外部暴露展示地图控制栏的
	Pubsub.subscribe('openMapVideoBar', function(){
		if($('#map-video-play-bar').length){
			videoPlayer.changeStatus('open');
		}
	});

	return videoPlayer;
})
