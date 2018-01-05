define(function(){
	return {
		cHistoryId:'',/*当前所查看的历史记录的id*/

		historyApi:'/pia/history',

		resultApi:'/pia/result',

		pageNo:1,/*(内容)当前第几页*/

		perPage:20,/*(内容)每页条数*/

		listPerPage:20,/*(左侧列)每页条数*/

		curListPage:1,/*(左侧列)表当前页*/

		curListType:1,/*记录当前左侧列表类型*/

		searchData:{},/*搜索条件*/

		cId:0,/*当前所查看检索结果的id*/

		tempName:'',/*当前要保存的检索结果名,判重的时候使用*/

		sourceFrom:'',/*资源加载出来后,点击会跳转到云/视图库,用这个变量指示要跳转到云空间还是视图库1:云;2:视图库*/

		sStatus : true,

		toggle_key : false,

		flag:false
	};
});