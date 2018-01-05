/**
 * http://tutorials.ajaxmasters.com/pagination-demo/
 * This jQuery plugin displays pagination links inside the selected elements.
 *
 * @author Gabriel Birke (birke *at* d-scribe *dot* de)
 * @version 1.2
 * @param {int} maxentries Number of entries to paginate
 * @param {Object} opts Several options (see README for documentation)
 * @return {Object} jQuery Object
 */
jQuery.fn.pagination = function(maxentries, opts) {
	opts = jQuery.extend({
		items_per_page: 10,
		num_display_entries: 4,
		current_page: 0,
		num_edge_entries: 2,
		link_to: "#",
		prev_text: "",
		orhide: true, //是否添加跳转，false添加，默认true不添加
		next_text: "",
		ellipse_text: "...",
		prev_show_always: false,
		next_show_always: false,
		show_cur_all: false,
		first_loading: true,
		callback: function() {
			return false;
		}
	}, opts || {});
	var self = this;

	return this.each(function() {
		/**
		 * Calculate the maximum number of pages
		 */
		function numPages() {
			return Math.ceil(maxentries / opts.items_per_page);
		}

		/**
		 * Calculate start and end point of pagination links depending on
		 * current_page and num_display_entries.
		 * @return {Array}
		 */
		function getInterval() {
			var ne_half = Math.ceil(opts.num_display_entries / 2);
			var np = numPages();
			var upper_limit = np - opts.num_display_entries;
			var start = current_page > ne_half ? Math.max(Math.min(current_page - ne_half, upper_limit), 0) : 0;
			var end = current_page > ne_half ? Math.min(current_page + ne_half, np) : Math.min(opts.num_display_entries, np);
			return [start, end];
		}

		/**
		 * This is the event handling function for the pagination links.
		 * @param {int} page_id The new page number
		 */
		function pageSelected(page_id, evt) {
			current_page = page_id;
			drawLinks();
			var continuePropagation = opts.callback(page_id, panel);
			if (!continuePropagation) {
				if (evt.stopPropagation) {
					evt.stopPropagation();
				} else {
					evt.cancelBubble = true;
				}
			}
			return continuePropagation;
		}
		/**
		 * This function inserts the pagination links into the container element
		 */
		function drawLinks() {
			panel.empty();
			var interval = getInterval();
			var np = numPages();
			// This helper function returns a handler function that calls pageSelected with the right page_id
			var getClickHandler = function(page_id) {
					return function(evt) {
						return pageSelected(page_id, evt);
					}
				}
				// Helper function for generating a single link (or a span tag if it's the current page)
			var appendItem = function(page_id, appendopts) {
					page_id = page_id < 0 ? 0 : (page_id < np ? page_id : np - 1); // Normalize page id to sane value
					appendopts = jQuery.extend({
						text: page_id + 1,
						classes: ""
					}, appendopts || {});
					if (page_id == current_page) {
						var lnk = jQuery("<span class='current'>" + (appendopts.text) + "</span>");
					} else {
						var lnk = jQuery("<a>" + (appendopts.text) + "</a>")
							.bind("click", getClickHandler(page_id))
							.attr('href', opts.link_to.replace(/__id__/, page_id));


					}
					if (appendopts.classes) {
						lnk.addClass(appendopts.classes);
					}
					panel.append(lnk).show();
				}
				// Generate "Previous"-Link
			if ((current_page > 0 || opts.prev_show_always)) {
				appendItem(current_page - 1, {
					text: opts.prev_text,
					classes: "prev pagination-icon-prev"
				});
			}
			// Generate starting points
			if (interval[0] > 0 && opts.num_edge_entries > 0) {
				var end = Math.min(opts.num_edge_entries, interval[0]);
				for (var i = 0; i < end; i++) {
					appendItem(i);
				}
				if (opts.num_edge_entries < interval[0] && opts.ellipse_text) {
					jQuery("<span>" + opts.ellipse_text + "</span>").appendTo(panel);
				}
			}
			// Generate interval links
			for (var i = interval[0]; i < interval[1]; i++) {
				appendItem(i);
			}
			// Generate ending points
			if (interval[1] < np && opts.num_edge_entries > 0) {
				if (np - opts.num_edge_entries > interval[1] && opts.ellipse_text) {
					jQuery("<span>" + opts.ellipse_text + "</span>").appendTo(panel);
				}
				var begin = Math.max(np - opts.num_edge_entries, interval[1]);
				for (var i = begin; i < np; i++) {
					appendItem(i);
				}

			}
			// Generate "Next"-Link
			if ((current_page < np - 1 || opts.next_show_always)) {
				appendItem(current_page + 1, {
					text: opts.next_text,
					classes: "next pagination-icon-next"
				});
			}

			//新增输入跳转           
			if (numPages() > 1) {
				jQuery("<div class='jumpto'><span class='count'>" + "共 <i class='page_total'>" + (numPages()) + "</i> 页</span>" + "<span class='to'>转到第" + "<input type='text' id='checkPageNum' class='input-text' name='p' value='" + (current_page + 1) + "'/>页</span>" + "<span class='boom'><span class='goto' type='submit'> <i class='icon-jump'></i>跳转</span></span></div>").appendTo(panel);
				if (opts.orhide) {
					$(".jumpto,.pagination .goto").hide();
				}
				var btn = jQuery(".pagination .jumpto .goto")
					.bind("click", function(evt) {
						var page = $("#checkPageNum").val();
						if (!page) {
							notify.error("请输入页码！");
							return false;
						}
						var p = parseInt(page) - 1;
						if (p > numPages() - 1 || p < 0 || isNaN(page)) {
							notify.error("请输入正确页码！");
							$("#checkPageNum").val("");
							return false;
						}
						$(this).attr('href', opts.link_to.replace(/__id__/, p));

						return pageSelected(p, evt);
					});
				panel.append(btn).show();
			}else{
				self.hide();
			}

			// 总页数和当前页数显示
			if (opts.show_cur_all) {
				jQuery("<p><span>" + (current_page + 1) + "</span>/<span>" + (numPages()) + "</span></p>").appendTo(panel);
			}
		}

		// Extract current_page from options
		var current_page = opts.current_page;
		// Create a sane value for maxentries and items_per_page
		maxentries = (!maxentries || maxentries < 0) ? 1 : maxentries;
		opts.items_per_page = (!opts.items_per_page || opts.items_per_page < 0) ? 1 : opts.items_per_page;
		// Store DOM element for easy access from all inner functions
		var panel = jQuery(this);
		// Attach control functions to the DOM element
		this.selectPage = function(page_id) {
			pageSelected(page_id);
		}
		this.prevPage = function() {
			if (current_page > 0) {
				pageSelected(current_page - 1);
				return true;
			} else {
				return false;
			}
		}
		this.nextPage = function() {
			if (current_page < numPages() - 1) {
				pageSelected(current_page + 1);
				return true;
			} else {
				return false;
			}
		}
		// When all initialisation is done, draw the links
		drawLinks();
		// call callback function

		//防止第一页请求两次 暂时注掉
		// if(current_page !== 0){
		if (opts.first_loading) {
			opts.callback(current_page, this);
		}
		// }
	});
}