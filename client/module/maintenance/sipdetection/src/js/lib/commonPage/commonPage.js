/**
 * 分页插件
 * by fll
 * V0.1
 * 功能说明：
 * 1.url拉取数据
 * 2.支持前后端异步加载数据，本地分页(richStyle不可用)
 * 3.支持后台分页本地缓存
 * 4.支持格式化参数
 */
(function($) {
	if (!($ && $.fn)) {
		throw new Error("分页插件强依赖Jquery，请先引入Jquery。");
		return false;
	}

	//添加css样式文件
	var style = document.createElement('link');
	style.setAttribute("rel", "stylesheet");
	style.setAttribute("type", "text/css");
	style.setAttribute("href", "../../../../maintenance/sipdetection/src/js/lib/commonPage/commonPage.css");
	document.getElementsByTagName("head")[0].appendChild(style);

	//简单的PubSub
	var PubSub = function() {
		var callbacks = {};
		return {
			on: function(ev, callback) {
				if (typeof callback == "function") {
					(callbacks[ev] || (callbacks[ev] = [])).push(callback);
				} else if (Object.prototype.toString.call(callback) === '[object Array]') {
					var singleCb;
					for (var i = 0, l = callback.length; i < l; i++) {
						if (typeof(singleCb = callback[i]) == "function") {
							(callbacks[ev] || (callbacks[ev] = [])).push(singleCb);
						}
					}
				}
			},
			fire: function() {
				var args = Array.prototype.slice.call(arguments, 0),
					ev = args
					.shift(),
					calls = callbacks[ev];
				if (ev && calls) {
					var l;
					if ((l = calls.length) == 1) {
						return calls[0].apply(null, args);
					} else {
						for (var i = 0; i < l; i++) {
							calls[i].apply(null, args);
						}
					}
				}
			},
			remove: function(callback) {
				var cbs;
				if (cbs = callbacks[ev]) {
					for (var i = 0, l = cbs.length; i < l; i++) {
						if (cbs[i] === callback) {
							cbs.slice(i);
						}
					}
				}
			}
		};
	};


	//获取命名空间下属性
	function getAttribute(parent, namespace) {
			if (parent && namespace) {
				var ns = namespace.split(".");
				var obj = parent;
				for (var i = 0, l = ns.length; i < l; i++) {
					obj = obj[ns[i]];
				}
				return obj;
			}
			return parent;
		}
		//设置命名空间下的属性
	function setAttribute(parent, namespace, value) {
		var lio,
			obj = parent;
		if (lio = namespace.lastIndexOf(".")) {
			var ns = namespace.split("."),
				obj = parent,
				attrName = namespace.substring(lio + 1);
			for (var i = 0, l = ns.length - 1; i < l; i++) {
				if (obj[ns[i]] === void 0) {
					obj[ns[i]] = {};
				}
				obj = obj[ns[i]];
			}
			obj[attrName] = value;
		} else {
			obj[namespace] = value;
		}
	}

	//分页对象
	var Page = function($el, options) {
		this.$el = $el;
		var PB = this.PubSub = new PubSub();
		this.props = $.extend({}, this.defaults, options);
		this.textFormat = $.extend({}, this.TEXT_FORMAT, options.textFormat || {});
		this.props.useCache && (this.cache = {});
		//事件注册
		var events;
		if (events = options.events) {
			for (var ev in events) {
				if (events.hasOwnProperty(ev)) {
					PB.on(ev, events[ev]);
				}
			}
		}
		this.allDataLoaded = false; //所有数据请求完成
		//为代码清晰此处赋予常量
		var temp;
		if (temp = options.paramsFormat) {
			this.PAGE_SIZE = temp.pageSize || "pageSize";
			this.PAGE_NUMBER = temp.pageNumber || "pageNumber";
			this.RECORDS = temp.records || "data";
			this.TOTAL_RECORDS = (!temp.totalRecords) ? false : temp.totalRecords;
		}

		//初始化
		this.init();
	};
	Page.prototype = {
		//默认属性
		defaults: {
			pageSize: 10,
			prevLoadPages: 1, //提前几页预加载
			showPageNum: 5,
			pageNumber: 0,
			isLocalPage: false,
			serverPageSize: null, //默认本地分页时一次加载所有数据
			useCache: false,
			encodeParams: false,
			localData: null, //本地数据分页
			richStyle: false,
			ajaxOptions: {
				type: 'post',
				dataType: 'json'
			}
		},
		//文本格式化
		TEXT_FORMAT: {
			prev: "上一页",
			next: "下一页"
		},
		/**
		 * 初始化
		 * @return {object}
		 */
		init: function() {
			if (!this.props.lazy) {
				var self = this;
				//初始化样式
				this._initStyle(this.$el);
				//绑定事件
				this._bindEvent();
				//首次请求数据，用于获取总数并初始化分页选择器
				this.initData();
				this.inited = true;
			}
		},
		/**
		 * 初始化样式
		 * @return {[type]} [description]
		 */
		_initStyle: function($el) {
			var textFormat = this.textFormat;
			//文本不可选样式
			$el./*attr("onselectstart", "return false").*/css({
				"-moz-user-select": "none",
				"overflow": "hidden"
			}).addClass("commonpage-theme-" + (this.props.theme || "simple"));
			//1.包裹元素
			var html = [];
			var rich = this.props.richStyle;
			if (rich) {
				html.push('<span class="left-span">');
				html.push('每页显示');
				html.push('<select class="page-size-selector">');
				html.push('<option>10</option>');
				html.push('<option>20</option>');
				html.push('<option>30</option>');
				html.push('<option>40</option>');
				html.push('<option>50</option>');
				html.push('</select>条');
				html.push('</span>');
				html.push('<span class="right-span">共<span class="page-current"> 0 </span>页  转到第<input class="page-goto-input" type="text" />页');
				html.push('<button class="goto" type="submit"> <i class="icon-jump"></i>跳转</button>');
				html.push('</span>');
			}
			html.push('<ul class="page-wrap">');
			//第一页
			if (rich && textFormat.first) {
				html.push('<li class="page-first">');
				html.push('<span class="page-item page-button" data-page="first">');
				html.push(textFormat.first);
				html.push('</span>');
				html.push('</li>');
			}
			//上一页
			html.push('<li class="page-prev">');
			html.push('<span class="page-item page-button" data-page="prev">');
			html.push(textFormat.prev);
			html.push('</span>');
			html.push('</li>');
			html.push('<li class="page-items">');
			html.push('</li>');
			//下一页
			html.push('<li class="page-next">');
			html.push('<span class="page-item page-button" data-page="next">');
			html.push(textFormat.next);
			html.push('</span>');
			html.push('</li>');
			//最后一页
			if (rich && textFormat.last) {
				html.push('<li class="page-last">');
				html.push('<span class="page-item page-button" data-page="last">');
				html.push(textFormat.last);
				html.push('</span>');
				html.push('</li>');
				html.push('</ul>');
			}
			$el.html($(html.join("")).css({
				"display": ":inline"
			}));
			this.$wrap = $(".page-wrap", $el).hide();
			this.$items = $(".page-items", $el);
			this.$prev = $(".page-prev", $el);
			this.$next = $(".page-next", $el);
			this.$first = $(".page-first", $el);
			this.$last = $(".page-last", $el);

			this.$pageSizeSelector = $(".page-size-selector", $el).val(this.props.pageSize);
			this.$pageCurrent = $(".page-current", $el);
			this.$gotoPageInput = $(".page-goto-input", $el);
		},
		/**
		 * 绑定事件
		 * @return {undefined}
		 */
		_bindEvent: function() {
			var self = this;
			this.$wrap.on("click", ".page-item", function(event) {
				self.gotoPage($(this).data("page"));
			});
			this.$gotoPageInput.on("blur", function() {
				var pageNumber = self.pageNumber,
					totalPage = self.totalPage,
					$this = $(this);
				var index = parseInt($this.val());
				if (!isNaN(index)) {
					index--;
					if (index != pageNumber && index >= 0 && index < totalPage) {
						self.gotoPage(index);
						return;
					}
				}
				$this.val(pageNumber + 1);
			});
			this.$pageSizeSelector.on("change", function() {
				self._changePageSize(+this.value);
			});
		},
		gotoPage: function(page) {
			var spn = this.props.showPageNum;
			switch (page) {
				case "prev":
					if (this.pageNumber > 0) {
						this.pageNumber--;
						this.refreshData();
					}
					break;
				case "next":
					if (this.pageNumber < (this.totalPage - 1)) {
						this.pageNumber++;
						this.refreshData();
					}
					break;
				case "first":
					if (this.pageNumber != 0) {
						this.pageNumber = 0;
						this.refreshData();
					}
					break;
				case "last":
					if (this.pageNumber != (this.totalPage - 1)) {
						this.pageNumber = this.totalPage - 1;
						this.refreshData();
					}
					break;
				case "prevs":
					this.pageNumber = (Math.floor(this.pageNumber / spn)) * spn - 1;
					this.refreshData();
					break;
				case "nexts":
					this.pageNumber = (Math.floor(this.pageNumber / spn) + 1) * spn;
					this.refreshData();
					break;
				default:
					if (page != this.pageNumber) {
						this.pageNumber = page;
						this.refreshData();
					}
			}
		},
		_changePageSize: function(pageSize) {
			this.props.pageSize = pageSize;
			this.pageNumber = 0;
			this._updateTotalPage();
			this.refreshData();
		},
		/**
		 * 首次远程请求用于初始化某些属性
		 * @return {[type]} [description]
		 */
		initData: function() {
			var self = this,
				props = this.props,
				isLocalPage = props.isLocalPage;
			this.pageNumber = 0;
			this.totalRecords = 0;
			//本地数据分页
			if (this.localData != null) {
				self.refreshData();
				return;
			}
			if (!isLocalPage) {
				var dataProxy = this.fetchData();
				dataProxy && dataProxy.then(function(data) {
					if (data) {
						//记录总条目，计算总页数
						var trs;
						if (trs = getAttribute(data, self.TOTAL_RECORDS)) {
							self.loadedRecordsCount = self.totalRecords = trs;
						} else {
							var pageData = getAttribute(data, self.RECORDS) || [];
							self.loadedRecordsCount = pageData ? pageData.length : 0;
						}
						self.totalPage = self.loadedRecordsCount % props.pageSize == 0 ? (self.loadedRecordsCount / props.pageSize) : (Math.floor(self.loadedRecordsCount / props.pageSize) + 1);
						//初始化分页器
						self._refreshPageSelector(true);
						self._outputData(data);
					}
				});
			} else {
				//后台加载个数不能小于每页显示数
				if (props.serverPageSize) {
					props.serverPageSize = Math.max(props.serverPageSize, props.pageSize);
				}
				self.localRecords = []; //本地存储
				self.refreshData();
			}
		},
		/**
		 * 刷新分页选择器
		 * @return {undefined}
		 */
		_refreshPageSelector: function(refresh) {
			var $el = this.$el,
				props = this.props,
				pageNumber = this.pageNumber,
				totalPage = this.totalPage,
				showPageNum = Math.min(props.showPageNum, totalPage),
				start = Math.floor(pageNumber / showPageNum) * showPageNum,
				end = Math.min(start + showPageNum, totalPage),
				textFormat = this.textFormat;
			//注释原因：效果图要求
			//this.$pageCurrent.html(Math.min(pageNumber + 1, totalPage) + "/" + totalPage);
			this.$pageCurrent.html(totalPage);
			if (totalPage < 2) {
				this.$wrap.hide();
			} else {
				if (refresh || (start != this._start)) {
					this._start = start;
					var html = [];
					if (start > 0 && textFormat.prevs) {
						html.push('<span class="page-item page-button" data-page="prevs">');
						html.push(textFormat.prevs);
						html.push('</span>');
					}
					for (var i = start; i < end; i++) {
						html.push('<span class="number page-item" data-page=' + i + '>' + (i + 1) + '</span>');
					}
					if (end < totalPage && textFormat.nexts) {
						html.push('<span class="page-item page-button" data-page="nexts">');
						html.push(textFormat.nexts);
						html.push('</span>');
					}
					this.$items.html(html.join(""));
				}
				this.$prev[pageNumber == 0 ? "hide" : "show"]();
				this.$first[pageNumber == 0 ? "hide" : "show"]();
				this.$next[(isNaN(totalPage) || (pageNumber + 1 == totalPage)) ? "hide" : "show"]();
				this.$last[(isNaN(totalPage) || (pageNumber + 1 == totalPage)) ? "hide" : "show"]();
				this.$items.find("span[data-page='" + pageNumber + "']").first().addClass('page-active').siblings().removeClass('page-active');
				this.$wrap.show();
			}
			this.$gotoPageInput.val(pageNumber + 1);
		},
		/**
		 * 刷新数据
		 * @return {udnefined}
		 */
		refreshData: function() {
			var self = this,
				props = this.props,
				isLocalPage = props.isLocalPage;
			//page-style
			this._refreshPageSelector();
			//本地数据
			if (this.localData != null) {
				var rows = this.localData,
					start = this.pageNumber * props.pageSize,
					end = start + props.pageSize;
				end = Math.min(end, rows.length);
				self._outputData(rows.slice(start, end));
				return;
			}
			//data
			if (isLocalPage) {
				var dataOuted = false; //数据已输出
				var localRecords = this.localRecords,
					start = this.pageNumber * props.pageSize,
					end = start + props.pageSize,
					prevLoadPages = props.prevLoadPages;
				if (self.allDataLoaded) {
					end = Math.min(end, localRecords.length);
				}
				//本地有，返回；本地无，拉取
				if (end <= localRecords.length) {
					setAttribute(self.PAGE_DATA_TEMP, self.RECORDS, localRecords.slice(start, end));
					self._outputData(self.PAGE_DATA_TEMP);
					dataOuted = true;
				}
				if (!self.allDataLoaded) {
					//判断是否需要拉取数据(1.本地数据总量小于此次要显示的条目索引2.已达到设置的预加载页数)
					if (localRecords.length < end || ((Math.floor(localRecords.length / props.pageSize) - this.pageNumber) <= prevLoadPages)) {
						var loadPageNumber = this.pageNumber;
						var dataProxy = self.fetchData({
							pageSize: props.serverPageSize,
							pageNumber: parseInt(localRecords.length / props.serverPageSize)
						}, dataOuted);
						dataProxy && dataProxy.then(function(data) {
							if (data) {
								self.PAGE_DATA_TEMP = data;
								var records = getAttribute(data, self.RECORDS) || [];
								self.localRecords = self.localRecords.concat(records);
								if (self.TOTAL_RECORDS) {
									self.totalRecords = getAttribute(data, self.TOTAL_RECORDS); //记录总条目
								} else {
									self.totalRecords = Math.max(self.localRecords.length, self.totalRecords); //记录总条目
								}
								//判断加载完成(1.得到数据数量小于请求分页大小 2.配置了总条数属性，且已加载总数等于总条数)
								if (records.length < props.serverPageSize || (self.TOTAL_RECORDS && (self.totalRecords == self.localRecords.length))) {
									self.allDataLoaded = true;
								}
								self._updateTotalPage();
								//返回数据
								if (!dataOuted) {
									self.refreshData();
								}
							}
						});
					}
				}
			} else {
				var cache = this.cache,
					data;
				if (props.useCache && (data = cache[this.pageNumber])) {
					self._outputData(data);
				} else {
					var loadPageNumber = this.pageNumber;
					var dataProxy = this.fetchData();
					dataProxy && dataProxy.then(function(data) {
						self._outputData(data, loadPageNumber);
					});
				}
			}
		},
		/**
		 * 修改总页数
		 * @return {[type]} [description]
		 */
		_updateTotalPage: function() {
			var pageSize = this.props.pageSize,
				trs, count;
			if (this.localData) {
				count = this.localData.length;
			} else if (this.totalRecords) {
				count = this.totalRecords;
			} else {
				count = this.localRecords.length;
			}
			this.totalPage = count % pageSize == 0 ? (count / pageSize) : (Math.floor(count / pageSize) + 1);
			this._refreshPageSelector(true);
		},
		/**
		 * 输出分页数据
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		_outputData: function(data, loadPageNumber) {
			//请求页等于当前页时，输出数据
			if ((loadPageNumber == void 0) || (loadPageNumber == this.pageNumber)) {
				this._currentPageData = ($.isArray(data) ? data : getAttribute(data, this.RECORDS)) || [];
				this.PubSub.fire("onPageDataLoaded", data);
			}
			//page-style
			//this._refreshPageSelector();
		},
		/**
		 * 拉取数据
		 * @param  {number} pageSize 分页大小，为空时用默认大小
		 * @return {ajax延迟对象}
		 */
		_loadingPage: 0,
		fetchData: function(pageParams, silent) {
			var self = this,
				props = this.props,
				customParams = props.params || (props.params = {});
			var pageSize = pageParams ? pageParams.pageSize : props.pageSize,
				pageNumber = pageParams ? pageParams.pageNumber : this.pageNumber;
			//判断重复请求
			if (pageNumber == 0) {
				this._loadingPage = pageNumber;
			} else if (pageNumber == this._loadingPage) {
				return null;
			}
			this._loadingPage = pageNumber; //记录正在请求的页码
			silent || this.PubSub.fire("beforeLoadPage");
			setAttribute(customParams, this.PAGE_SIZE, pageSize);
			setAttribute(customParams, this.PAGE_NUMBER, props.pageNumberOffset ? (pageNumber + props.pageNumberOffset) : pageNumber);
			//请求前将参数修改权转交调用者
			var params = $.extend({}, customParams);
			this.PubSub.fire("beforeFetchData", params);
			var ops = props.ajaxOptions;
			ops.data = props.encodeParams ? JSON.encode(params) : params;
			return $.ajax(ops).then(function(data) {
				if (props.useCache) {
					self.cache[pageNumber] = data;
				}
				self.PubSub.fire("onAsyncSuccess", data);
				return data;
			}, function(err) {
				self.PubSub.fire("onError", err);
			});
		},
		/**
		 * 设置数据
		 * @param {[type]} list [description]
		 */
		setData: function(list) {
			this.localData = list || [];
			var props = this.props;
			var total = this.localData.length;
			this.totalPage = total % props.pageSize == 0 ? (total / props.pageSize) : (Math.floor(total / props.pageSize) + 1);
			this.props.lazy = false;
			this.inited = false;
			this.init();
			this._refreshPageSelector(true);
		},
		/**
		 * 获取缓存key
		 * @param  {number} pageNumber  页码
		 * @param  {number} pageSize    分页大小
		 * @return {string} 缓存对象key
		 */
		_getCacheKey: function(pageNumber, pageSize) {
			return pageNumber + "-" + pageSize;
		},
		/*接口方法*/
		/**
		 * 刷新
		 */
		refresh: function() {
			if (!this.inited) {
				this.props.lazy = false;
				this.init();
			} else {
				//清空缓存
				this.cache = {};
				this.totalPage = 0;
				this.localData = null;
				this._currentPageData = null;
				this.allDataLoaded = false;
				this.$wrap.hide();
				this.initData();
			}
		},
		/**
		 * 设置参数
		 * @param {[type]} params [description]
		 */
		setParams: function(params) {
			this.props.params = params;
		},
		/**
		 * 设置总数据量
		 * @param {[type]} total [description]
		 */
		setTotolRecords: function(total) {
			this.totalRecords = total;
			this._updateTotalPage();
		},
		/**
		 * 显示第几页数据(从0开始)
		 * @param  {[type]} pageNumber [description]
		 * @return {[type]}            [description]
		 */
		showPage: function(pageNumber) {
			if (!isNaN(pageNumber)) {
				pageNumber = Math.floor(pageNumber);
				if (pageNumber != this.pageNumber && pageNumber >= 0 && pageNumber < this.totalPage) {
					this.pageNumber = pageNumber;
					this.refreshData();
				}
			}
		},
		/**
		 * 获取分页信息
		 */
		getPageInfo: function() {
			var props = this.props;
			return {
				pageNumber: this.pageNumber,
				pageSize: props.pageSize,
				totalPage: this.totalPage,
				totalRecords: this.totalRecords
			};
		},
		/**
		 * 获取当前查询条件
		 */
		getParams: function() {
			return $.extend({}, this.props.params);
		},
		/**
		 * 获取当前页数据内容
		 * @return {[type]} [description]
		 */
		getCurrentPageData: function() {
			return this._currentPageData;
		},
		/**
		 * 获取所有数据
		 * @return {[type]} [description]
		 */
		getAllData: function() {
			return this.localData || this.localRecords || [];
		}
	};


	//插件化
	/*
		参数说明：
		options : {
			url : 请求url
			isLocalPage : 是否本地分页[false]
			useCache : 是否缓存[false]
			params : 自定义参数
			pageSize : 每页大小[10]
			showPageNum : 并排显示页数[5]
			//事件
			events : {
				//分页数据加载完成事件
				onPageDataLoaded
			}
			//分页信息参数格式化
			paramsFormat : {
				pageSize : 每页大小[pageSize]
				pageNumber : 当前页码[pageNumber]
				records : 分页数据[records]
				totalRecords : 数据总量[totalRecords]
			}
		}
		*/
	$.fn.renderPage = function(options) {
		var page = new Page(this, options);
		//接口
		return {
			/**
			 * 刷新
			 * @return {[type]} [description]
			 */
			refresh: function() {
				page.refresh();
				return page;
			},
			/**
			 * 设置参数
			 * @param {[type]} params [description]
			 */
			setParams: function(params) {
				page.setParams(params);
				return page;
			},
			/**
			 * 设置本地数据
			 */
			setData: function(data) {
				page.setData(data);
				return page;
			},
			/**
			 * 显示第几页数据(从0开始)
			 * @param  {[type]} pageNumber [description]
			 * @return {[type]}            [description]
			 */
			showPage: function(pageNumber) {
				page.showPage(pageNumber);
				return page;
			},
			/**
			 * 前一页
			 * @return {[type]} [description]
			 */
			prevPage: function() {
				page.gotoPage("prev");
				return page;
			},
			/**
			 * 后一页
			 * @return {[type]} [description]
			 */
			nextPage: function() {
				page.gotoPage("next");
				return page;
			},
			/**
			 * 设置总数
			 * @param {int} total 数据总量
			 */
			setTotal: function(total) {
				page.setTotolRecords(total);
				return page;
			},
			/**
			 * 获取分页信息
			 */
			getPageInfo: function() {
				return page.getPageInfo();
			},
			/**
			 * 获取当前查询参数
			 * @return {[type]} [description]
			 */
			getParams: function() {
				return page.getParams();
			},
			/**
			 * 获取当前页数据
			 * @return {[type]} [description]
			 */
			getCurrentPageData: function() {
				return page.getCurrentPageData();
			},
			/**
			 * 获取所有数据
			 * @return {[type]} [description]
			 */
			getAllData: function() {
				return page.getAllData();
			}
		};
	}
})(jQuery);