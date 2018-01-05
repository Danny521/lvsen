/**
 * [电视墙布局显示基础类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 * @modfiy requireJS 模块化代码
 * @date   2014-12-2
 */
define([	
	"domReady",
	"permission",
	"/module/common/tvwall/js/views/tvwall-views.js",
	'/module/common/tvwall/js/views/templteGet.js',
	"base.self"
], function(domReady, permission, tvwallViews) {
	/**
	 * [TvLayoutBase 电视墙基础类]
	 * @author wumengmeng
	 * @date   2014-12-11
	 */
	function TvLayoutBase() {
		this.initialize(this.options);
	}
	/**
	 * [options 渲染参数]
	 * @type {Object}
	 */
	TvLayoutBase.prototype.options = {
		layoutContainer: jQuery(".tvList"), //布局容器
		containUl: jQuery(".tvList").find("ul"), //监视器布局容器
		layoutObj: null, //布局数据存储
		saveFun: null, //保存布局方法
		tmp:null
	};
	/**
	 * [urls 上墙，下墙以及切换高标清的请求]
	 * @type {Object}
	 */
	TvLayoutBase.prototype.urls = {
		SET_UOW_DOWN_TVWALL: "/service/uow/delone_stream",
		SET_PVG_DOWN_TVWALL: "/service/pow/exit_wall",
		SET_DOWN_ALLTVWALL: "/service/uow/del_stream",
		SET_SPLITE_WALL: "/service/uow/update_sn",
		CHANGE_SH_WALL: "/service/pow/cm",
		SET_PVG_ON_TVWALL: "/service/pow/operator_wall",
		SET_UOW_ON_TVWALL: "/service/uow/add_stream"
	};
	/**
	 * [initialize 初始化]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   options [description]
	 * @return {[type]}           [description]
	 */
	TvLayoutBase.prototype.initialize = function(options) {
		var that = this;
		this.isChange = false;
		this.resultObj = {
			"layouts": []
		};
		//handlebars助手
		tvwallViews.baseView();
	};
	/**
	 * [loadLayout 加载电视墙模版、填充模版]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutBase.prototype.loadLayout = function() {
		var that = this;
		var dom = jQuery(".tvList ul li");
		var statusMark = jQuery(".sdcode_sh");
		/*this.options.containUl表示布局详细信息所在的dom，
		that.options.layoutObj详细的布局信息creatId: "1" defaultValue: "1" id: "1" monitorLayout: Array[4] name: "aa"
		渲染布局详细信息所在模板
		*/		
		this.options.containUl.html(template({
			"loadLyt": that.options.layoutObj
		}));
		that.afterRender();//调用detail-control层该函数
		//如果是高清情况时，添加sdcode_gl类，“高”蓝色字体
		statusMark.each(function(index, ele) {
			if (jQuery(ele).text() === "[高]") {
				jQuery(ele).addClass("sdcode_gl");
			}
		});
		permission.reShow();
	};
	/**
	 * [addDirLayout 电视墙]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutBase.prototype.addDirLayout = function() {
		this.options.layoutObj = null;
		this.isChange = false;
		this.options.containUl.html("");
	};
	/**
	 * [beforeRender 布局加载前处理函数]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutBase.prototype.beforeRender = function() {};
	/**
	 * [afterRender 布局加载后处理函数]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutBase.prototype.afterRender = function() {};
	/**
	 * [addStyle 设置电视墙样式]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   dom [description]
	 */
	TvLayoutBase.prototype.addStyle = function(dom) {
		dom.css({
			left: parseFloat(dom.attr("data-x")),
			top: parseFloat(dom.attr("data-y")),
			width: parseFloat(dom.attr("data-width")),
			height: parseFloat(dom.attr("data-height"))
		});
		var screenHeight = parseFloat(dom.attr("data-height")) - 31;
		dom.find(".dis-screen1").css({
			height: screenHeight
		});
	};
	/**
	 * [newGuid 动态数据获取]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutBase.prototype.newGuid = function() {
		var guid = "";
		for (var i = 1; i <= 32; i++) {
			var n = Math.floor(Math.random() * 16.0).toString(16);
			guid += n;
		}
		return guid;
	};

	return TvLayoutBase;
});
