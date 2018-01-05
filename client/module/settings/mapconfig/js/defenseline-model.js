/**
 * 电子防线模型
 * @author chencheng
 * @date   2014-12-15
 * 
 */
define(["ajaxModel"],function(ajaxModel){

	var ElecLine = {

		urls: {
			/* 分页获取电子防线数据 */ 
			get_elecLines:"/service/map/page_eledefense_line",
			/* 创建电子防线 */
			create_elecLine:"/service/map/save_eledefense_line",
			/* 删除电子防线 */
			delete_elecLine:"/service/map/delete_eledefense_line",
			/* 电子防线 重名验证*/
			check_elecLine_name:"/service/map/get_eledefense_line"
		},
		/**
		 * 分页获取电子防线数据
		 * @param  {[type]}   data   发送的数据
		 * @param  {[type]}   custom  ajax额外的回调函数
		 * @return {[type]}          [description]
		 */
		getElecLines:function(data,custom){
			return ajaxModel.postData(this.urls.get_elecLines,data,custom);
		},
		/**
		 * 创建电子防线
		 */
		createElecLine:function(data,custom){
			return ajaxModel.postData(this.urls.create_elecLine,data,custom);
		},
		/**
		 * 删除电子防线
		 */
		deleteElecLine:function(data,custom){
			return ajaxModel.getData(this.urls.delete_elecLine,data,custom);
		},
		/**
		 * 电子防线重名验证
		 */
		checkElecLineName:function(data,custom){
			ajaxModel.abortAjax(this.urls.check_elecLine_name);
			return ajaxModel.postData(this.urls.check_elecLine_name,data,custom);
		}
	};

	return ElecLine;
});