/**
 * 
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-04-30 14:26:55
 * @version $Id$
 */

define(['jquery'], function($){
	var resourceLayers = ["PVD-GATE-LAYER","lightbar-resource-layer","police-resource-layer","policeman-resource-layer"],
		mapLayerControl = {
		
		map : null,
		/**
		 * [showLayer 根据参数来显示相关图层]
		 * @author yuqiu
		 * @date   2015-05-22T14:28:51+0800
		 * @param  {[type]}                 layerName [图层名称]
		 * @return {[type]}                           [当前对象]
		 */
		showLayer: function(layerName){
			if(!this.map) return;
			var layer = this.map.getLayerByName(layerName);
			if(layer){
				layer.show();
			};
			return this;
		},
		/**
		 * [hideLayer 根据参数来隐藏相关图层]
		 * @author yuqiu
		 * @date   2015-05-22T14:28:54+0800
		 * @param  {[type]}                 layerName [图层名称]
		 * @return {[type]}                           [当前对象]
		 */
		hideLayer: function(layerName){
			if(!this.map) return;
			var layer = this.map.getLayerByName(layerName);
			if(layer) {
				//隐藏
				layer.hide();
			}
			return this;
		},
		/**
		 * [resource 根据参数来判断是否显示或者隐藏基础图层，基础图层用变量resourceLayers保存]
		 * @author yuqiu
		 * @date   2015-05-22T14:28:58+0800
		 * @param  {[type]}                 params [如果传入string 就是要显示的基础图层，
		 *                                         	如果是一个数组，表示多个图层，如果是flase 就是隐藏]
		 * @return {[type]}                        [当前对象]
		 */
		resource: function(params){
			var funName = 'show';
			if($.type(params) === 'string'){
				this[funName](params);
			}else if($.type(params) === 'array'){
				for (var i = params.length - 1; i >= 0; i--) {
					this[funName](params[i]);
				}
			}else if(params === false){
				funName = 'hide';
			}
			for (var i = resourceLayers.length - 1; i >= 0; i--) {
				this[funName](resourceLayers[i]);
			};
			return this;
		},
		/**
		 * [show 封装多个和一个图层的显示]
		 * @author yuqiu
		 * @date   2015-05-22T14:29:02+0800
		 * @param  {[type]}                 params [数组或者字符串]
		 * @return {[type]}                        [当前对象]
		 */
		show: function(params){
			if($.type(params) === 'string'){
				this.showLayer(params);
			}else if($.type(params) === 'array'){
				for (var i = params.length - 1; i >= 0; i--) {
					this.showLayer(params[i]);
				}
			}
			return this;
		},
		/**
		 * [hide 封装多个和一个图层的隐藏]
		 * @author yuqiu
		 * @date   2015-05-22T14:29:06+0800
		 * @param  {[type]}                 params [数组或者字符串]
		 * @return {[type]}                        [当前对象]
		 */
		hide: function(params){
			if($.type(params) === 'string'){
				this.hideLayer(params);
			}else if($.type(params) === 'array'){
				for (var i = params.length - 1; i >= 0; i--) {
					this.hideLayer(params[i]);
				}
			}
			return this;
		},
		/**
		 * [init 初始化图层管理]
		 * @author yuqiu
		 * @date   2015-05-22T14:29:11+0800
		 * @param  {[type]}                 mapObj  [地图对象]
		 * @param  {[type]}                 options [一个对象，包括显示、隐藏、基础图层]
		 * @return {[type]}                         [当前对象]
		 */
		init: function(mapObj, options){
			this.map = mapObj;
			this.hide(options.hide || true);
			this.show(options.show || true);
			this.resource((typeof options.resource === "boolean") ? options.resource : options.resource || {});
			return this;
		}
	};

	return mapLayerControl;
});