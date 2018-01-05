(function(){
	var e = MapPlatForm.Base.MapConfig = function(){
		this.CLASS_NAME = 'MapConfig';
		//配置地图基础数据的查询，更新，删除操作的服务地址
		this.dataServiceURL = "/npgisdataservice/";
		//地图配置服务地址
		this.mapServiceURL = "";
	};
})();