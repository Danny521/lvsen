/**
 * 
 * @authors chencheng (chencheng@netposa.com)
 * @date    2014-12-02 
 * @description  用户管理
 */
define(["jquery.pagination","permission"], function(){
	
	var mapSettings = {

			template: null,

			lineColor: "",

			mapMgr: "",

			polygonPoints: "",

			polygonArea: "",

			setPagination: function(total, selector, itemsPerPage, callback) {
				jQuery(selector).pagination(total, {
					items_per_page: itemsPerPage,
					first_loading:false,
					callback: function(pageIndex, jq) {
						callback(pageIndex + 1);
					}
				});
			},
			/* 保留8位小数 */
			float8: function(val) {
				var value = "" + val;
				var pattern = /^[1-9](\d){0,3}.(\d)*$/;
				if (pattern.test(value)) {
					var point = value.indexOf(".");
					var tem = value.substring(point + 1);
					if (tem.length > 8) {
						tem = tem.substr(0, 8);
						return value.substring(0, point + 1) + tem;
					}
				}
				return value;
			},
			errorMessage: "网络或服务器异常！"
		};
	return mapSettings ;

});