/**
 * 仓库模型
 * @author chencheng
 * @date   2014-12-12
 * 
 */
define(["ajaxModel","pvaConfig"],function(ajaxModel){

	var storeHouse = {

		urls: {
			/* 获取仓库详情信息 */ 
			get_storehouse_info: window.projectMode === "develop" ? window.mockDataUrl + "/service/usr/get_storehouse_info" : "/service/usr/get_storehouse_info",
			/* 获取仓库 包含分页 搜索 */ 
			list_storehouses: window.projectMode === "develop" ? window.mockDataUrl + "/service/list_storehouses" : "/service/usr/list_storehouses",
			/* 删除仓库 */
			delete_storehouse:"/service/usr/delete_storehouse",
			/* 修改仓库 */
			update_storehouse:"/service/usr/edit_storehouse",
			/* 添加仓库 */
			create_storehouse:"/service/usr/add_storehouse"
		},
		/**
		 * 获取组织的角色列表al
		 * @param  {[type]}   data   发送的数据
		 * @param  {[type]}   custom  ajax额外的回调函数
		 * @return {[type]}          [description]
		 */
		getStorehouseInfo:function(data,custom){
			return ajaxModel.getData(this.urls.get_storehouse_info,data,custom);
		},
		/**
		 * 分页获取组织下的仓库 包含搜索 分页
		 */
		listStorehouses:function(data,custom){
			return ajaxModel.postData(this.urls.list_storehouses,data,custom);
		},
		/**
		 * 修改仓库信息
		 */
		updateStorehouses:function(data,custom){
			return ajaxModel.postData(this.urls.update_storehouse,data,custom);
		},
		/**
		 * 创建仓库
		 */
		createStorehouses:function(data,custom){
			return ajaxModel.postData(this.urls.create_storehouse,data,custom);
		},
		/**
		 * 删除仓库
		 */
		deleteStorehouses:function(data,custom){
			return ajaxModel.postData(this.urls.delete_storehouse,data,custom);
		}
		
	};

	return storeHouse;
});