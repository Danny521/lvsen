define(['js/ajax-module.js','js/my-handlebar.js',
	'base.self',
	'handlebars',
	'permission'],function(ajaxModule){
	return {
		/**
		 * @name dialog
		 * @param {string} 要提示的信息内容
		 * @param {function} 回调函数，
		 * @description 简单的封装了一个确认窗口的函数
		 */
		dialog: function(msg, callback) {
			new ConfirmDialog({
				title: '警告',
				width: 640,
				message: msg,
				callback: callback
			});
		},
		/**
		 * @name checkBox
		 * @description 绑定checkbox的事件，全选等
		 */
		checkBox: function() {
			var self = this;
			jQuery("#content").on("click", ".checkall", function() {
				self.checkAll("#content", ".checkbox", ".checkall");
				self.bindTip();
			});
			jQuery("#content").on("click", ".checkbox", function() {
				self.check("#content", ".checkbox", ".checkall", jQuery(this));
				self.bindTip();
			});
		},
		/**
		 * @name bindTip
		 * @description 按照选中个数，提示选中的项目数
		 */
		bindTip: function() {
			var length = jQuery(".checkbox:checked").length;
			if (length) {
				/*if (SCOPE.wideType !== 0 && SCOPE.directoryId === 0) {*/
					/*全部文件暂时不加批量*/
					jQuery(".list-title .list-title-header").html("<span class='select-tips'>已选中本页内<em><b>" + length + "</b>个" + this.whichText() + "文件/文件夹</em> <span class='multi-control'><button class='multi-down' id='multi_down'>下载</button><button class='multi-del' id='multi_del'>删除</button></span></span>");
				/*} else {
					jQuery(".list-title .list-title-header").html("<span class='select-tips'>已选中本页内<em><b>" + length + "</b>个" + this.whichText() + "文件/文件夹</em></span>");
				}*/
			} else {
				jQuery(".list-title .select-tips").html("文件名");
			}
		},
		/**
		 * @name checkAll
		 * @param {string|jQuery Object} 当前checkbox所在的容器
		 * @param {string} 单个 checkbox 的类名，用来查找 checkbox
		 * @param {string|jQuery Object} 全选按钮
		 * @description 多选中的全选
		 */
		checkAll: function(container, klass, node) {
			var checkbox = jQuery(container).find(klass);
			var checkall = jQuery(container).find(node);
			var alldd = jQuery(container).find('.list-content dd');
			if (checkall.is(":checked")) {
				checkbox.prop({
					"checked": true
				});
				alldd.addClass('active');
				checkbox.addClass("checked");
			} else {
				checkbox.prop({
					"checked": false
				});
				alldd.removeClass('active');
				checkbox.removeClass("checked");
			}
		},
		/**
		 * @name check
		 * @param {string|jQuery Object} 当前checkbox所在的容器
		 * @param {string} 单个 checkbox 的类名，用来查找 checkbox
		 * @param {string|jQuery Object} 全选按钮
		 * @param {[jQuery Object]} 选中时给其添加某个类
		 * @description 多选中的单选
		 */
		check: function(container, klass, node, target) {
			var checkbox = jQuery(container).find(klass);
			var checked = jQuery(container).find(klass + ":checked");
			var checkall = jQuery(container).find(node);
			var pardd = target.closest('dd');
			if (checkbox.length == checked.length) {
				checkall.prop({
					"checked": true
				});
			} else {
				checkall.prop({
					"checked": false
				});
			}
			pardd.toggleClass("active");
			target.toggleClass("checked");
		},
		/**
		 * @name toggleClass
		 * @param {jQuery Object} 当前要改变样式的 jQuery 对象
		 * @description 改变传入的 Dom 的 class，通过 添加 current 和 _blue 来达到
		 */
		toggleClass: function(node) {
			var bIcon = ['icon_file', 'icon_event', 'icon_video', 'icon_pic', 'icon_structured'],
				sIcon = ['icon_personnel', 'icon_car', 'icon_items', 'icon_scenario', 'icon_movement', 'icon_rest'],
				cindex = node.index(),
				target = node[0].tagName,
				siblings = node.siblings(),
				l = siblings.length,
				sIconL = sIcon.length;
			if(node.attr("data-cat")!=="0"){
				$(".creat_new_floder").parent().hide();
			}else{
				$(".creat_new_floder").parent().show();
			}
			/*如果点击的是li*/
			if (target === 'LI') {
				/*s-menu :second-menu*/
				node.find('.s-menu').show().end().siblings().find('.s-menu').hide();
				/*去掉li兄弟跟兄弟中的节点的样式*/
				while (l--) {
					var index = siblings.eq(l).index(),
						innerList = node.eq(l).find('.s-menu a'),
						len = innerList.length;
					siblings.eq(l).find('h6 i').removeClass(bIcon[index] + '_blue');
					if (len > 0) {
						innerList.removeClass('current');
						/*sIcon每组不一定会一样*/
						/*根据设定好的数组一一去除样式*/
						while (len--) {
							innerList.find('i').removeClass(sIcon[len] + '_blue');
						}
					}
				}
				node.find('h6').addClass('current').end().siblings('li').find('h6').removeClass('current');
				node.find('h6 i').addClass(bIcon[cindex] + '_blue');
			}
			/*如果是li里面的a*/
			if (target === 'A') {
				while (l--) {
					var index = siblings.eq(l).index();
					siblings.eq(l).find('i').removeClass(sIcon[index] + '_blue');
				}
				node.addClass('current').siblings().removeClass('current');
				node.find('i').addClass(sIcon[cindex] + '_blue');
			}
		},
		/*
		* 渲染云空间存储状态
		*/
		rendStorage:function(data){
			var o = data.data.config.occupied,
				c = data.data.config.capacity,
				w = jQuery('#awardSpace').width(),
				spaceUsed = o * w / c;

			jQuery("#occupied").text(o);
			jQuery("#capacity").text(c);

			jQuery("#remainingSpace").css({
				"width": spaceUsed < 3 ? 3 : spaceUsed
			});
		},
		/**
		 * @name whichSText
		 * @description 获取当前的结构化信息名称，面包屑使用
		 */
		whichSText: function() {
			/*文本输出基于scope.sType*/
			var sType = ['', '人员', '车辆', '物品', '场景', '运动目标', '其他'];
			return sType[SCOPE.sType];
		},

		/**
		 * @name whichText
		 * @description 获取当前的分类信息名称，右上角总数提示和面包屑使用
		 */
		whichText: function() {
			/*SCOPE.wideType*/
			var wideType = ["", "视频", "图片", "结构化信息", "案事件"];
			return wideType[SCOPE.wideType];
		},

		/**
		 * @name whichText
		 * @description 获取当前的结构化信息名称，面包屑和日志使用
		 */
		getSname: function() {
			/*文本输出基于scope.context.structuredType*/
			var sName = ['', '人员', '车辆', '物品', '场景', '运动目标', '其他'];
			return sName[SCOPE.context.structuredType - 0];
		},

		/**
		 * @name getFtype
		 * @description 获取当前的分类信息名称
		 */
		getFtype: function() {
			/*文本输出基于scope.context.fileType*/
			var fName = ["文件夹", "视频", "图片", "结构化信息", "案事件"];
			return fName[SCOPE.context.fileType - 0];
		},

		/**
		 * @name getTname
		 * @param {{Boolean}} 调用时候确定
		 * @description 返回文件夹,视频,图片,人员结构化信息等名称 当key存在:返回的文件夹,视频,图片带有自己的名称
		 */
		getTname: function(key) {
			var self = this;
				fileType = SCOPE.context.fileType - 0,
				pvd = SCOPE.context.pvdId,
				text = '';
			if (fileType === 3) {
				text = self.getSname() + (pvd ? " 线索" : " 结构化信息");
			} else if (fileType === 0) {
				var str = pvd ? "案事件文件夹" : "文件夹";
				text = key ? SCOPE.context.fileName + str : str;
			} else {
				text = key ? SCOPE.context.fileName + self.getFtype() : self.getFtype();
			}
			return text;
		},
		/**
		 * @name diableCount
		 * @description 取消全选并重置 title
		 */
		diableCount: function() {
			var title = jQuery('.list-title'),
			checkAll = title.find('.checkall'),
			info = title.find('.list-title-header');
			checkAll.prop('checked', false);
			info.html("文件名");
		},
		/**
		 * @name afterMakeup83
		 * @param {{string}} html 片段
		 * @description 将 html 页面渲染进页面 此方式在有分页条件下使用
		 */
		afterMakeup83: function(html) {
			var self = this;
			/*更新列表dom*/
			jQuery("#content .overview").html(html);
			jQuery(".search-area,.list-title,.model").show();
			// 权限
			permission.reShow();
			jQuery('.list-content dd').hover(function() {
				var $this = jQuery(this);
				//SCOPE.curListIndex = $this.index();
				jQuery(this).find('.l-controller').css({
					'visibility': 'visible'
				});
				SCOPE.context = SCOPE.allListData[$this.index()];
			}, function() {
				jQuery(this).find('.l-controller').css({
					'visibility': 'hidden'
				});
			});
			var currentId = $(".local-upload").attr("data-currentid");
			if(currentId!=="0"||currentId!==void 0){
				setTimeout(function(){
					jQuery("#content .list-content dd").filter("[data-currentid='" + currentId + "']").find(".l-name a").trigger("click");
					$(".local-upload").attr({"data-currentid":"0"})
				},10)
			}
		},

		/**
		 * @name afterMakeup40
		 * @param {{string}} html 片段
		 * @description 将 html 页面渲染进页面 此方式在有无页条件下使用，即详情页
		 */
		afterMakeup40: function(html, res) {
			jQuery("#content .overview").html(html);
			// 权限
			permission.reShow();
			jQuery(".screening,.list-title,.model").hide();
		},
		/**
		 * @name showLayer
		 * @description 生成一个弹出层，放置视频的截图
		 */
		screenShot:function(){
			var html =
				'<div class="dialogbox">' +
				'<iframe id="vIframe" src="about:blank" class="dialog" allowTransparency="true"></iframe>' +
				'<div class="dialog">' +
				'   <a href="#" title="关闭" class="close" data-action="closeLayer"></a>' +
				'   <div class="dialog_title">' +
				'       <h6>抓图预览</h6>' +
				'   </div>' +
				'   <div class="dialog_body">' +
				'        <img src="" id="screenshot" data-name="">' +
				'   </div>' +
				'   <div class="dialog_foot">' +
				'        <a class="permission permission-tobaselib" href="#" title="入库" id="videoScreentoMediaLib" class="" data-action="toMediaLib">入库</a>' +
				'        <a href="#" title="保存" class="" id="saveScreenshot" data-action="saveScreenshot">保存</a>' +
				'   </div>' +
				'</div>' +
				'</div>' +
				'<div class="layer" id="layerbox"><iframe src="about:blank" ></iframe></div>';
			/*layerbox是抓图弹窗的遮挡层*/
			if (jQuery("#layerbox").length > 0) {
				jQuery("#layerbox,.dialogbox").show();
			} else {
				jQuery("body").append(html);
			}
			/**
			 * 生成一个弹出层之后，权限处理下
			 */
			permission.reShow();
		},
		/**
		 * @name closeLayer
		 * @description 关闭弹出层
		 * @see showLayer
		 */
		closeLayer: function() {
			jQuery("#layerbox,.dialogbox").hide();
			//SCOPE.mPlayer.player.togglePlay(0);
			var switchBtn = jQuery('.video-block .switch').trigger('click');
		},
		/**
		 * @name toggleSearch
		 * @param {Boolean} 是否是结构化信息
		 * @description 通过传入的参数来改变面包屑的展现，是否有返回上一级
		 */
		toggleSearch: function(isNormalShow) {
			var forNormal = jQuery("#fornormal"),
				forStructure = jQuery("#forstructure");

			if (isNormalShow) {
				forNormal.addClass("active");
				forStructure.removeClass("active");
			} else {
				forNormal.removeClass("active");
				forStructure.addClass("active");
			}
		},
		/**
		 * @name initSearch
		 * @description 重置搜索框内容
		 */
		initSearch: function() {
			jQuery('#fileName').val('');
			jQuery('#beginTime').val('');
			jQuery('#endTime').val('');
		},
		/**
		 * @name newWindow
		 * @param {{string}} 要打开的窗口的url
		 * @param {{string}} 要打开的窗口的名字
		 * @param {{Boolean}} 是否可改变窗口大小
		 * @description 打开一个新窗口
		 */
		newWindow: function(url, name, callback) {
			//features = features ? features : '';
			var myWindow = window.open("/module/iframe/?windowOpen=1&iframeUrl=" + url, name);
			callback && callback(url, myWindow);
		},
		/**
		 * @name resize
		 * @description 触发窗口resize时间调整显示区域宽高 。
		 */
		resize: function() {
			var self = this,
				timer,
				windowHeight,
				windowWidth,
				availableWH,
				key = 150,
				resize = function() {
					/*获取浏览器宽高*/
					windowHeight = $(window).height();
					windowWidth = $(window).width();
					if (SCOPE.contentType === 0) {
						/*控制列表高度*/
						availableWH = windowHeight - 280;
						timer && clearTimeout(timer);
						timer = setTimeout(function() {
							jQuery("#content .list-content ").height(availableWH);
						}, 50);
					}
				};
			resize();
			$(window).resize(resize);
		},
		/**
		 * @name tResize
		 * @description 主动触发 resize 事件
		 */
		tResize: function() {
			jQuery(window).trigger('resize');
		},
		/**
		 * @name initSsource
		 * @description 二级筛选的高亮显示
		 */
		initSsource: function() {
			var self = this;
			SCOPE.markType = '';
			jQuery('.s-style').eq(0).addClass('current').siblings().removeClass('current');
		},
		/*
			初始化列表title内容
		*/
		initTitle: function(){
			jQuery(".list-title .list-title-header").html('文件名');
			jQuery(".checkall").prop({
				"checked": false
			});
		},
		/**
		 * @name showLayer
		 * @description 生成一个弹出层，放置视频的截图
		 */
		showLayer: function() {
			this.screenShot();
			/* 截图 */
			this.takeScreenshot();
		},
		/**
		 * @name takeScreenshot
		 * @description 通过播放器接口抓取正在播放的帧
		 */
		takeScreenshot: function() {
				/**
				 * 获取到截图之后，去除 base64 编码中的 空格和换行
				 */
			var data = SCOPE.mPlayer.player.playerSnap(0).replace(/[\n\r]/ig, '');
			/*保存当前播放时间*/
			SCOPE.dContext.nowtime = jQuery(".time .nowtime").attr("nowtime-ms") - 0 || 0;
			if (data === "ERROR") {
				notify.error("抓图失败，请重试！");
				VIEW.closeLayer();
				return false;
			}
			/*暂停*/
			var switchBtn = jQuery('.video-block .switch');
			if (switchBtn.hasClass('active')) {
				switchBtn.trigger('click');
			}
			//SCOPE.mPlayer.player.pause(0);
			SCOPE.mPlayer.player.ocxStatus = false;
			/**
			 * 保存截图数据到全局变量，方便其他地方调用
			 */
			SCOPE.dContext.screenShotSrc = "data:image/jpg;base64," + data;
			SCOPE.dContext.base64 = data;
			SCOPE.dContext.playerSnap = data;
			/*显示抓图图片*/
			jQuery("#screenshot").attr({
				"src": SCOPE.dContext.screenShotSrc
			});
			jQuery("#screenshot").closest('.dialog_body').height(jQuery("#screenshot").height()).closest('.dialog').height(452 - 380 + jQuery("#screenshot").closest('.dialog_body').height());
			jQuery("#screenshot").closest('.dialog').css('margin-top', jQuery("#screenshot").closest('.dialog').height()/2 - jQuery("#screenshot").closest('.dialog').height());
			$('#vIframe').height(jQuery("#screenshot").closest('.dialog').height()).css('margin-top', jQuery("#screenshot").closest('.dialog').height()/2 - jQuery("#screenshot").closest('.dialog').height());

		},
		/**
		 * @name saveScreenshot
		 * @description 将抓取到的图片保存到后端
		 */
		saveScreenshot: function() {
			ajaxModule.postData("/service/pcm/add_screenshot", {
				fileName: SCOPE.dContext.fileName || SCOPE.dContext.fileExtName,
				filePath: SCOPE.dContext.playerSnap,
				catchTime: SCOPE.dContext.nowtime,
				shootTime: SCOPE.dContext.adjustTime
			}).done(function(data) {
				if (data && data.code) {
					if (data.code === 200) {
						notify.success("保存成功！");
					} else {
						notify.info(data.data.message);
					}
				} else {
					notify.error("保存失败，请重试！");
				}
			});
		}
	};
});