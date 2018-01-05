/**
 * 系统公共全局函数集合对象
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-01-15 11:59:47
 * @version $Id$
 */

define([
	"jquery",
	"./extend.jquery.js",
	"mootools"
], function(jQuery) {
	// 一些工具方法
	var Toolkit = {
		// 纵向滚动到指定位置
		scrollTween: function(y, callback) {
			jQuery('html,body').animate({
				scrollTop: (y || 0)
			}, 500, 'easeOutExpo', function() {
				return callback && callback();
			});
		},
		//过滤字符串的特殊字符
		strRegExp: function(str) {
			var pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
			var rs = "";
			for (var i = 0; i < str.length; i++) {
				rs = rs + str.substr(i, 1).replace(pattern, '');
			}
			return rs;
		},
		// 取消选中的文本
		clearSelect: function() {
			if (document.selection && document.selection.empty) {
				document.selection.empty();
			} else if (window.getSelection) {
				window.getSelection().removeAllRanges();
			}
		},

		// 计算字符串的字节长度
		countByte: function(str) {
			var size = 0;
			for (var i = 0, l = str.length; i < l; i++) {
				size += str.charCodeAt(i) > 255 ? 2 : 1;
			}

			return size;
		},

		// 根据字节截取长度
		substrByByte: function(str, limit) {
			for (var i = 1, l = str.length + 1; i < l; i++) {
				if (this.countByte(str.substring(0, i)) > limit) {
					return str.substring(0, i - 1);
				}
			}

			return str;
		},

		paramOfUrl: function(url) {
			url = url || location.href;
			var paramSuit = url.substring(url.indexOf('?') + 1).split("&");
			var paramObj = {};
			for (var i = 0; i < paramSuit.length; i++) {
				var param = paramSuit[i].split('=');
				/*if (param.length == 2) {
				 var key = decodeURIComponent(param[0]),
				 val = decodeURIComponent(param[1]);
				 if (paramObj.hasOwnProperty(key)) {
				 paramObj[key] = jQuery.makeArray(paramObj[key]);
				 paramObj[key].push(val);
				 } else {
				 paramObj[key] = val;
				 }
				 } else */
				if (param.length >= 2) {
					param = $.map(param, function(item, index) {
						return decodeURIComponent(item);
					});
					var key = param.shift(),
						val = param.join('=');
					if (paramObj.hasOwnProperty(key)) {
						paramObj[key] = jQuery.makeArray(paramObj[key]);
						paramObj[key].push(val);
					} else {
						paramObj[key] = val;
					}
				}
			}
			return paramObj;
		},
		getHashOfUrl: function(url, array) {
			url = url || location.href;
			var hash = url.split("#")[1];
			if (array && hash) {
				return hash.split("/");
			}
			return hash;
		},
		getCurDate: function() {
			var date = new Date();
			return date.getFullYear() + '-' + this.formatLenth(date.getMonth() + 1) + '-' + this.formatLenth(date.getDate())
		},
		getCurMonth: function() {
			var date = new Date();
			return date.getFullYear() + '-' + this.formatLenth(date.getMonth() + 1) + '-' + '01';
		},
		getCurDateTime: function() {
			var date = new Date();
			return date.getFullYear() + '-' + this.formatLenth(date.getMonth() + 1) + '-' + this.formatLenth(date.getDate()) + ' ' + this.formatLenth(date.getHours()) + ':' + this.formatLenth(date.getMinutes()) + ':' + this.formatLenth(date.getSeconds());
		},

		parseDate: function(str) {
			var list = str.split(/[-.:\s]/),
				date = new Date();
			date.setFullYear(list[0]);
			date.setMonth(list[1].toInt() - 1);
			date.setDate(list[2].toInt());
			date.setHours(list[3].toInt());
			date.setMinutes(list[4].toInt());
			date.setSeconds(list[5].toInt());

			return date;
		},

		formatDate: function(date) {
			if (typeOf(date) !== 'date') {
				date = this.parseDate(date);
			}
			return date.getFullYear() + '-' + this.formatLenth(date.getMonth() + 1) + '-' + this.formatLenth(date.getDate()) + ' ' + this.formatLenth(date.getHours()) + ':' + this.formatLenth(date.getMinutes()) + ':' + this.formatLenth(date.getSeconds());
		},
		
		strToUnix: function(str) {
			var newstr = str.replace(/-/g, '/');
			var date = Date.parse(new Date(newstr));
			return date;
		},
		str2mills: function(str) {
			if (!str || str === '') {
				return;
			}

			return this.parseDate(str).getTime();
		},
		//如：1441672045568  -->  "2015-09-08"
		mills2str: function(num) {
			if (num) {
				var date = new Date(num);
				return date.getFullYear() + '-' + this.formatLenth(date.getMonth() + 1) + '-' + this.formatLenth(date.getDate());
			}
			return "";
		},
		//如：1441672045568  -->  "2015-09-08 08:27:25"
		mills2datetime: function(num) {
			if (num) {
				var date = new Date(num);
				return date.getFullYear() + '-' + this.formatLenth(date.getMonth() + 1) + '-' + this.formatLenth(date.getDate()) + " " + this.formatLenth(date.getHours()) + ":" + this.formatLenth(date.getMinutes()) + ":" + this.formatLenth(date.getSeconds());
			}
			return "";
		},
		//如：1441672045568  -->  "2015-09-08 08:27:25:568"
		mills2timestamp: function(num) {
			if (num) {
				var date = new Date(num);
				return date.getFullYear() + '-' + this.formatLenth(date.getMonth() + 1) + '-' + this.formatLenth(date.getDate()) + " " + this.formatLenth(date.getHours()) + ":" + this.formatLenth(date.getMinutes()) + ":" + this.formatLenth(date.getSeconds()) + ":" + this.formatLenth(date.getMilliseconds(), 3);
			}
			return "";
		},

		formatLenth: function(x, len) {
			x = '' + x;
			len = len || 2;
			while (x.length < len) {
				x = '0' + x;
			}
			return x;
		},

		stopPropagation: function(e) {
			e.stopPropagation();
		},

		loadTempl: function(url, force) {
			this.templHash = this.templHash || new Hash();

			if (this.templHash.has(url) && !force) {
				return this.templHash.get(url);
			}

			var self = this;
			return jQuery.get(url, function(templ) {
				self.templHash.set(url, templ);
			});
		},
		//云台控制速度 add by wujingwen 2015.10.10
		getPtzSpeed: function() {
			var speed = Cookie.read("ptzspeed"); //读取cookie值
			if (!speed) {
				speed = 10;
			}
			console.log("云台控制速度：", speed);
			return speed;
		},
		/**
		 * 获取当前时间前后几天函数*
		 * @param  {[type]} pdVal [天数]
		 * @return {[type]}       [description]
		 * Leon.z add 2016.2.2
		 */
		showSubTimeFromNowToSet:function(pdVal){
			//从当前日期后多少天
			var _addByTransDate = function(dateParameter, num){
				    var translateDate = "",
				        dateString = "",
				        monthString = "",
				        dayString = "";
				    translateDate = dateParameter.replace("-", "/").replace("-", "/");
				    var newDate = new Date(translateDate);
				    newDate = newDate.valueOf();
				    newDate = newDate + num * 24 * 60 * 60 * 1000;
				    newDate = new Date(newDate);
				    //如果月份长度少于2，则前加 0 补位   
				    if ((newDate.getMonth() + 1).toString().length == 1) {
				        monthString = 0 + "" + (newDate.getMonth() + 1).toString();
				    } else {
				        monthString = (newDate.getMonth() + 1).toString();
				    }
				    //如果天数长度少于2，则前加 0 补位   
				    if (newDate.getDate().toString().length == 1) {
				        dayString = 0 + "" + newDate.getDate().toString();
				    } else {
				        dayString = newDate.getDate().toString();
				    }
				    dateString = newDate.getFullYear() + "-" + monthString + "-" + dayString;
				    return dateString;

			},
			//从当前日期前多少天
			_reduceByTransDate = function(dateParameter, num){
				 var translateDate = "",
			        dateString = "",
			        monthString = "",
			        dayString = "";
			    translateDate = dateParameter.replace("-", "/").replace("-", "/");
			    var newDate = new Date(translateDate);
			    newDate = newDate.valueOf();
			    newDate = newDate - num * 24 * 60 * 60 * 1000;
			    newDate = new Date(newDate);
			    //如果月份长度少于2，则前加 0 补位   
			    if ((newDate.getMonth() + 1).toString().length == 1) {
			        monthString = 0 + "" + (newDate.getMonth() + 1).toString();
			    } else {
			        monthString = (newDate.getMonth() + 1).toString();
			    }
			    //如果天数长度少于2，则前加 0 补位   
			    if (newDate.getDate().toString().length == 1) {
			        dayString = 0 + "" + newDate.getDate().toString();
			    } else {
			        dayString = newDate.getDate().toString();
			    }
			    dateString = newDate.getFullYear() + "-" + monthString + "-" + dayString;
			    return dateString;
			};
			var trans_day = "";
		    var cur_date = new Date();
		    var cur_year = new Date().getFullYear();
		    var cur_month = cur_date.getMonth() + 1;
		    var real_date = cur_date.getDate();
		    cur_month = cur_month > 9 ? cur_month : ("0" + cur_month);
		    real_date = real_date > 9 ? real_date : ("0" + real_date);
		    eT = cur_year + "-" + cur_month + "-" + real_date;
		    if (pdVal > 0) {
		        trans_day = _addByTransDate(eT, pdVal);
		    }
		    if(pdVal < 0){
		    	 trans_day = _reduceByTransDate(eT, pdVal);
		    }
		    if(pdVal === 0){
		    	trans_day = eT
		    }
		    //处理
		    return trans_day;
		},
		/**
		 * 加载模板通用函数
		 * @param url - 模板地址url
		 * @param callbackSuccess - 模板加载成功后的执行函数
		 * @param callbackError - 模板加载失败后的执行函数
		 */
		loadTemplate: function(url, callbackSuccess, callbackError) {
			var compiler = null;
			//加载模板
			$.when(this.loadTempl(url)).done(function(timeTemplate) {

				if (timeTemplate instanceof Array) {
					timeTemplate = timeTemplate[0];
				}
				//模板加载成功
				compiler = Handlebars.compile(timeTemplate);
				//成功的回调函数
				if (callbackSuccess && typeof callbackSuccess === "function") {
					callbackSuccess(compiler);
				}
			}).fail(function() {
				//错误的函数
				if (callbackError && typeof callbackError === "function") {
					callbackError();
				}
			});
		},
		/**
		 * 校验名字
		 * @param str - 待检查的字符串[名字须由字母、数字、中文汉字或下划线组成]
		 * @returns {boolean}
		 */
		checkName: function(str) {
			if (/^[\w\u4e00-\u9fa5]+$/.test(str.trim())) {
				return true;
			} else {
				return false;
			}
		}
	};
	/**
	 * 定义初始化入口
	 * @type {{init: Function, initGlobal: Function}}
	 */
	return {
		init: function() {
			return Toolkit;
		},
		initGlobal: function() {
			(function() {
				this.Toolkit = Toolkit;
			}).call(window);
		}
	};
})