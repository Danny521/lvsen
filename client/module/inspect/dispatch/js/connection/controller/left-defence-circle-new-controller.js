/**
 * Created by Zhangyu on 2015/4/24.
 */
define([
	"js/connection/view/left-defence-circle-new-view",
	"js/connection/model/left-defence-circle-model",
	"js/npmap-new/view/task-defence-circle-view",
	"js/npmap-new/controller/task-defence-circle-controller"
], function (View, Model, MapCircleView) {

	return (function (scope) {

		//初始化页面
		View.init(scope, MapCircleView);

		/**
		 * 保存防空圈（新建、编辑）
		 * @param data - 待保存的防控圈数据
		 */
		scope.saveOrEditCircle = function (data) {

			Model.saveOrEditDefenceCircle(data, {}).then(function (res) {
				if (res.code === 200) {
					//提示
					if (data.id) {
						notify.success("修改防控圈成功！");
					} else {
						notify.success("新增防控圈成功！");
					}
					//刷新页面
					View.refreshOnSave();
				} else {
					//提示
					if (data.id) {
						notify.error("修改防控圈失败！");//错误码：" + res.code);
					} else {
						notify.error("新增防控圈失败！");//错误码：" + res.code);
					}
				}
			});
		};
		/**
		 * 检测防空圈名字重名
		 * @param data - 参数信息
		 */
		scope.checkCircleNameExists = function (data) {
			var result = false;
			Model.checkCircleNameExists(data, {
				async: false
			}).then(function (res) {
				if (res.code === 200) {
					if (res.data.message) {
						result = true;
					}
				} else {
					notify.error("防控圈信息获取失败！");//错误码：" + res.code);
				}
			});
			return result;
		};

		return scope;

	}({}));

});