/**
 * 商品模型
 * @author chencheng
 * @date   2014-12-12
 * 
 */
define(["ajaxModel","pvaConfig"],function(ajaxModel){

	var storeHouse = {

		urls: {
			/* 获取商品详情信息 */ 
			get_good_info: window.projectMode === "develop" ? window.mockDataUrl + "/service/usr/get_good_info" : "/service/usr/get_good_info",
			/* 获取商品 包含分页 搜索 */ 
			list_goods: window.projectMode === "develop" ? window.mockDataUrl + "/service/list_good" : "/service/usr/list_good",
			/* 删除商品 */
			delete_good:"/service/usr/delete_good",
			/* 修改商品 */
			update_good:"/service/usr/edit_good",
			/* 添加商品 */
			create_good: window.projectMode === "develop" ? window.mockDataUrl + "/service/add_good" : "/service/add_good",
			/* 获取仓库 包含分页 搜索 */ 
			list_storehouses: window.projectMode === "develop" ? window.mockDataUrl + "/service/list_storehouse" : "/service/usr/list_storehouse"
		},
		/**
		 * 获取组织的角色列表al
		 * @param  {[type]}   data   发送的数据
		 * @param  {[type]}   custom  ajax额外的回调函数
		 * @return {[type]}          [description]
		 */
		getGoodInfo:function(data,custom){
			return ajaxModel.getData(this.urls.get_good_info,data,custom);
		},
		/**
		 * 分页获取组织下的商品 包含搜索 分页
		 */
		listGoods:function(data,custom){
			return ajaxModel.postData(this.urls.list_goods,data,custom);
		},
		/**
		 * 修改商品信息
		 */
		updateGood:function(data,custom){
			return ajaxModel.postData(this.urls.update_good,data,custom);
		},
		/**
		 * 创建商品
		 */
		createGood:function(data,custom){
			return ajaxModel.postData(this.urls.create_good,data,custom);
		},
		/**
		 * 删除商品
		 */
		deleteGood:function(data,custom){
			return ajaxModel.postData(this.urls.delete_good,data,custom);
		},
		/**
		 * 分页获取组织下的仓库 包含搜索 分页
		 */
		listStorehouses:function(data,custom){
			return ajaxModel.postData(this.urls.list_storehouses,data,custom);
		}
		
	};

	return storeHouse;
});