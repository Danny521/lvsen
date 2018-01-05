/**
 * Created by Zhangyu on 2014/12/23.
 * 全局搜索部分的公共展现片段
 */
define(["jquery"], function(jQuery){

	return {
		/**
		 * 显示、隐藏左侧的加载条
		 * @param flag - 为true显示， 为false隐藏
		 */
		showLoading: function(flag) {

			if (flag) {
				jQuery("#camerasPanel").addClass("loading");
			} else {
				jQuery("#camerasPanel").removeClass("loading");
			}
		}
	};
});
