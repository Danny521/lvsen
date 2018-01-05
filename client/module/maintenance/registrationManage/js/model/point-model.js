 define(['ajaxModel'],function(ajaxModel){
	var Model = {

		//标记是否使用模拟数据
		isUseMock: false,
		
		//设置请求的根路径
		serviceHost: "/service/",
		
		//设置请求上下文
		serviceContext: "regist",
		
		//设置请求的url集合
		setActionUrl: function () {
			var self = this;
			return {
				//根据传的状态参数查询进入平台还是未进入平台的分页点位信息列表
				GET_POINTLIST_INFO: (this.isUseMock ? "inc/point-list.json" : this.serviceHost + this.serviceContext + "/point/list"), 
				//新建点位
				CREATE_POINT: (this.isUseMock ? "inc/detail.json" : this.serviceHost + this.serviceContext + "/point/add"),
				//编辑点位
			    EDIT_POINT: (this.isUseMock ? "inc/detail.json" : this.serviceHost + this.serviceContext + "/point/update"),
			    //注销点位，修改状态为注销，只有市局管理员有这个权限
			    LOGOUT_POINT: (this.isUseMock ? "inc/detail.json" : this.serviceHost + this.serviceContext + "/point/cancel"),
			    //根据Id查询点位
			    ID_SELECT_POINT: (this.isUseMock ? "inc/point-list.json" : this.serviceHost + this.serviceContext + "/point/get"),
			    //根据搜索条件查询点位
				SELECT_POINT: (this.isUseMock ? "inc/detail.json" : this.serviceHost + this.serviceContext + "/point/search"),
				//点位批量进入平台
			    BATCH_POINT_ENTER: (this.isUseMock ? "inc/detail.json" : this.serviceHost + this.serviceContext + "/point/batchEnterPlatform"),
			    //excel批量导入数据保存到数据库
			    EXCEL_POINT_ENTER: (this.isUseMock ? "inc/detail.json" : this.serviceHost + this.serviceContext + "/point/import"),
			    //根据pointId查询点位下的摄像机
			    ID_POINT_SELECT_CAMERA: (this.isUseMock ? "inc/point-list.json" : this.serviceHost + this.serviceContext + "/point/getCameraDeviceList"),
			 //根据传的参数模糊查询符合关键字的所属部位
				GET_POINTSITE: (this.isUseMock ? "inc/point-list.json" : this.serviceHost + this.serviceContext + "/point/searchBySite"), 
			};
		},

		ajaxEvents: function(){
			var self = this;
			var URLS = self.setActionUrl();
			return {
				/**
				 * 根据传的状态参数查询进入平台还是未进入平台的分页点位信息列表
				 * @param  {[type]} data    [description]
				 * @param  {[type]} custom  [description]
				 * @param  {[type]} success [description]
				 * @param  {[type]} error   [description]
				 * @return {[type]}         [description]
				 */
				getPointList:function(data,custom,success,error){
					ajaxModel.getData(URLS.GET_POINTLIST_INFO,data,custom).then(success,error);
				},
				/**
				 * 新建点位
				 * @param  {[type]} data    [description]
				 * @param  {[type]} custom  [description]
				 * @param  {[type]} success [description]
				 * @param  {[type]} error   [description]
				 * @return {[type]}         [description]
				 */
				createPoint:function(data,custom,success,error){
					ajaxModel.postData(URLS.CREATE_POINT,data,custom).then(success,error);
				},
				/**
				 * 编辑点位
				 * @param  {[type]} data    [description]
				 * @param  {[type]} custom  [description]
				 * @param  {[type]} success [description]
				 * @param  {[type]} error   [description]
				 * @return {[type]}         [description]
				 */
				editPoint:function(data,custom,success,error){
					ajaxModel.postData(URLS.EDIT_POINT,data,custom).then(success,error);
				},
				/**
				 * 注销点位
				 * @param  {[type]} data    [description]
				 * @param  {[type]} custom  [description]
				 * @param  {[type]} success [description]
				 * @param  {[type]} error   [description]
				 * @return {[type]}         [description]
				 */
				logoutPoint:function(data,custom,success,error){
					ajaxModel.getData(URLS.LOGOUT_POINT,data,custom).then(success,error);
				},
				/**
				 * 根据Id查询点位
				 * @param  {[type]} data    [description]
				 * @param  {[type]} custom  [description]
				 * @param  {[type]} success [description]
				 * @param  {[type]} error   [description]
				 * @return {[type]}         [description]
				 */
				getCameraIDPoint:function(data,custom,success,error){
					ajaxModel.getData(URLS.ID_POINT_SELECT_CAMERA,data,custom).then(success,error);
				},
				/**
				 * 根据搜索条件查询点位
				 * @param  {[type]} data    [description]
				 * @param  {[type]} custom  [description]
				 * @param  {[type]} success [description]
				 * @param  {[type]} error   [description]
				 * @return {[type]}         [description]
				 */
				getSearchPoint:function(data,custom,success,error){
					ajaxModel.getData(URLS.SELECT_POINT,data,custom).then(success,error);
				},
				
				/**
				 * 点位批量进入平台
				 * @param  {[type]} data    [description]
				 * @param  {[type]} custom  [description]
				 * @param  {[type]} success [description]
				 * @param  {[type]} error   [description]
				 * @return {[type]}         [description]
				 */
				getBatchPoint:function(data,custom,success,error){
					ajaxModel.getData(URLS.BATCH_POINT_ENTER,data,custom).then(success,error);
				},
				/**
				 * excel批量导入数据
				 * @param  {[type]} data    [description]
				 * @param  {[type]} custom  [description]
				 * @param  {[type]} success [description]
				 * @param  {[type]} error   [description]
				 * @return {[type]}         [description]
				 */
				getExcelBatchPoint:function(data,custom,success,error){
					ajaxModel.postData(URLS.EXCEL_POINT_ENTER,data,custom).then(success,error);
				},
				/**
				 * 根据传的参数模糊查询符合关键字的所属部位
				 * @param  {[type]} data    [description]
				 * @param  {[type]} custom  [description]
				 * @param  {[type]} success [description]
				 * @param  {[type]} error   [description]
				 * @return {[type]}         [description]
				 */
				getPointSite:function(data,custom,success,error){
					ajaxModel.getData(URLS.GET_POINTSITE,data,custom).then(success,error);
				},
			};
		}
	};
	return {
		ajaxEvents: Model.ajaxEvents()
	};
});