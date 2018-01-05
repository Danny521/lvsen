/**
 *
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-04-24 10:35:27
 * @version $Id$
 */

define([], function() {
	//16进制和 rgb的转化
	var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/,
		colorExchange = {
			/**
			 * [colorHex rgb转化HEX]
			 * @author yuqiu
			 * @date   2015-05-22T15:10:11+0800
			 * @param  {[type]}                 string [rgb值]
			 * @return {[type]}                        [HEX值]
			 */
			colorHex: function(string) {
				var that = string;
				if (/^(rgb|RGB)/.test(that)) {
					var aColor = that.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");
					var strHex = "#";
					for (var i = 0; i < aColor.length; i++) {
						var hex = Number(aColor[i]).toString(16);
						if (hex === "0") {
							hex += hex;
						} else if( hex.length === 1){
							hex = '0' + hex;
						}
						strHex += hex;
					}
					if (strHex.length !== 7) {
						strHex = that;
					}
					return strHex;
				} else if (reg.test(that)) {
					var aNum = that.replace(/#/, "").split("");
					if (aNum.length === 6) {
						return that;
					} else if (aNum.length === 3) {
						var numHex = "#";
						for (var i = 0; i < aNum.length; i += 1) {
							numHex += (aNum[i] + aNum[i]);
						}
						return numHex;
					}
				} else {
					return that;
				}
			},
			/**
			 * [colorRgb hex转化rgb]
			 * @author yuqiu
			 * @date   2015-05-22T15:10:44+0800
			 * @param  {[type]}                 string [hex值]
			 * @return {[type]}                        [rgb值]
			 */
			colorRgb: function(string) {
				var sColor = string.toLowerCase();
				if (sColor && reg.test(sColor)) {
					if (sColor.length === 4) {
						var sColorNew = "#";
						for (var i = 1; i < 4; i += 1) {
							sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
						}
						sColor = sColorNew;
					}
					//澶勭悊鍏綅鐨勯鑹插€�
					var sColorChange = [];
					for (var i = 1; i < 7; i += 2) {
						sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
					}
					return "RGB(" + sColorChange.join(",") + ")";
				} else {
					return sColor;
				}
			}
		};

	return colorExchange;
})