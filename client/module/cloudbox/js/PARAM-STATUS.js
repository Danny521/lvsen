/*
* 很重要的数据在这里维护,这些数据可直接影响视图.
* 数据流向:
*	用户操作----> 改变数据 ----> 改变视图;
*   当从别的模块跳转过来时:更改数据 ----> 转换视图
*   数据驱动视图
*/
define([],function(){
	window.SCOPE = {
		allPageNo:0,
		/*当前资源列表总共能分多少页*/

		abordAjax:null,
		/*当前需要abord的ajax请求*/

		totalRecords:0,
		/*当前资源总条数*/

		allListWithNoDir:[],
		/*当前页列表非文件夹资源*/

		detailsIndex:0,
		/*当前查看资源在allListWithNoDir中的索引*/

		contentType:0,/*0:查看列表,1,查看详情*/

		playStatus:false,/*是否已有已经初始化好的视频*/

		wideType: 0,
		/* 该变量指示类型文件,视频,图片,结构化 1-3.对应左侧li列表所指示分类 */

		allListData: [],
		/*保存当前加载的所有列表数据*/

		context: {},
		/*这个对象实时保存列表单项资源(dd标签)的id,name,结构化类型,pvdid,案事件名,内容在鼠标hover时更新*/

		dContext: {},
		/* 当进入某个详情,这个对想保存详情需要的所有上下文参数*/

		pageSize: 20,
		/*每页数量*/

		pageNo: 0,
		/*第一页从0开始*/

		directoryId: 0,
		/*根目录directoryId = 0*/

		/* ===接口名称=== */

		vDetails: 'get_video_info',
		/*视频详情*/

		pDetails: 'get_image_info',
		/*图片详情*/

		sDetails: 'get_structured_ext_info',
		/*结构化详情*/

		aList: 'get_all_list',
		/*全部列表*/

		vList: 'get_video_list',
		/*视频列表*/

		sList: 'get_structured_list',
		/*结构化列表*/

		iList: 'get_image_list',

		eList: 'incidents',
		/*案事件搜索*/

		cList: 'get_all_list',
		/*保存当前列表所需接口*/

		phList: 'get_handle_images',
		/*获取图片结果集*/

		sListByvideo: "get_structured_Num",
		/* 通过视频 id 获取某个视频处理的结构化信息 */

		cOldList: '',

		markType: '',
		/*对结构化信息来源分类,全部|人工标注|智能标注(空表示全部)*/

		/* ===搜索接口=== */
		searchList: 'get_search_list',

		fileList: 'fileList',

		fileName: '',
		/*文件名*/

		bTime: '',
		/*开始时间*/

		eTime: '',
		/*结束时间*/

		sType: '',
		/*结构化类型,空置为全部*/

		param: '',
		/*对应当前任务的参数*/

		del: '',
		/*删除*/

		download: '',
		/*记录针对当前文件所需的下载接口*/

		theId: '',
		/*文件id*/

		steps: ['全部文件'],
		/* 保存导航内容显示的数组 */

		jump2steps: [{
			data: '0',
			type: 'data-cat'
		}],
		/*保存导航生每层的信息*/

		/* 各种详情的编辑接口 */
		vedit: 'update_video_info',
		iedit: 'update_image_info',
		sedit: 'update_structured_info',
		cedit: '',
		/*当前编辑内容*/

		mPlayer: null,
		/*当前查看的信息*/
		curDD:null
	};
});
