/**
 * 加载交通管理页面
 * @author LuoLong
 * @date   2015-06-04
 * messenger 跨域iframe和父窗口通讯
 */
define(["domReady", "js/messenger", "base.self", "jquery"], function(domReady, Messenger) {
	domReady(function() {
		(function() {
			var init = function() {
				var path = window.location.href,
					pvdUrl = getPvdUrl() + "?isPva=1",
					params;

				//判断是否由别的页面跳转进来
				if (path.indexOf("?") !== -1) {
					params = path.split("?")[1];
					pvdUrl = pvdUrl + "&" + params;
				}

				setPvdUrl(pvdUrl); //设置iframe的地址
				registMessage(); //注册消息通知
			},
			/**
			 * 获取交通管理页面的url
			 * @author LuoLong
			 * @date   2015-06-04
			 * @param  {[type]}          [description]
			 * @return {[type]}          [交通管理页面的url]
			 */
			getPvdUrl = function() {
				var menuList = window.localStorage.getItem("MenuList"), //从localStorage中获取一级导航
					modules = [],
					url;

				if (!menuList) {
					return "";
				}

				menuList = JSON.parse(menuList);
				modules = menuList.data.modules;
				//遍历所有模块，找到交通管理模块的url
				jQuery.each(modules, function(index, item) {
					if (item.moduleName === "gate" && item.childModule.length) {
						url = item.childModule[0].url;
					}
				});

				return url;
			},
			/**
			 *设置iframe的地址
			 * @author LuoLong
			 * @date   2015-06-04
			 * @param  {[type]}          url [pvd页面地址]
			 * @return {[type]}          [description]
			 */
			setPvdUrl = function(url) {
				//设置iframe的地址
				jQuery("#gate").attr("src", url).css({width: "100%", height: "100%"});
			},
			/**
			 * 注册父页面的消息通知，iframe页面通过该通知和父页面通信
			 * @author LuoLong
			 * @date   2015-06-04
			 * @param  {[type]}   data [description]
			 * @return {[type]}        [description]
			 */
			registMessage = function() {
				var messenger = new Messenger('parent'),
					iframe = document.getElementById('gate');

				messenger.addTarget(iframe.contentWindow, 'iframe');
				messenger.listen(function (msg) {
					//iframe发出的消息为登出时，跳转至登录页面
					if (msg && msg.logout === "1") {
						return top.location.href = "/login/"; // songxj update
					}
				});
			};

			init(); //初始化函数
		}());
	});
});