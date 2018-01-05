/**
 * 
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2014-12-25 16:48:15
 * @version $Id$
 */

define(['../js/controller.js'], function(IncidentInfo) {
	function init(domNode, initParams){
		$('head').append()
		$.get('/module/viewlibs/details/incident/inc/content.html').then(function(data){
			domNode.html(data);
			IncidentInfo.bindEvents(initParams);
		});
	}
	return init;
});