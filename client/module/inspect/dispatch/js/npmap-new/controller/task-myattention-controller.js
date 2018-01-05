/**
 * Created by Zhangyu on 2015/4/27.
 */
define([
	"js/npmap-new/view/task-myattention-view",
	"js/npmap-new/model/task-myattention-model",
	"js/npmap-new/controller/map-infowindow-controller"
], function (View, Model, MapInfoWindow) {

	return (function (scope) {
		//初始化页面
		View.init(scope, MapInfoWindow);
		/**
		 * 添加到我的关注
		 * @author Li Dan
		 * @date   2014-12-18
		 * @param  {[type]}   data [description]
		 */
		scope.addToMyAttention = function(data) {
			var params = {
				name: data.name,
				description: data.description,
				x: data.x,
				y: data.y,
				zoom: data.zoom
			};
			//保存
			Model.AddToMyattention(params, {}).then(function(res) {
				if (res.code === 200) {
					//提示
					notify.success("添加关注成功！");
					//日志
					logDict.insertLog("m1", "f2", "o1", "b11", data.name + '点位');
					//保存
					View.setMarkerToMyAttention(res.data, data.marker);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：" + res.code);
				} else {
					notify.error("添加关注失败，网络或服务器异常！");
				}
			});
		};
		/**
		 * 取消某个关注
		 * @param data - 参数信息
		 */
		scope.cancelFromMyAttention = function(data) {
			Model.CancelFromMyattention({id: data.id}, {}).then(function (res) {
				if(res.code===200) {
					//提示
					notify.success("取消关注成功！");
					//日志
					logDict.insertLog("m1", "f2", "o10", "b11", data.marker.getData().name + '点位');
					//刷新页面
					View.setCancelMarkerFromMyAttention(data.marker, data.type);
				} else {
					notify.error("取消关注失败！");//错误码：" + res.code);
				}
			});
		};

		return scope;

	}({}));

});