/**
 * 布防任务公共变量
 */
define([], function() {
	return {
		defence: {
			// 第一步 选择摄像机的数据缓存
			cameraData: null,
			// 第二步选择算法
			ruleInfo: {
				options: {
					curRuleId: "",      //当前待设置的算法id
					curRuleName: "",    //当前算法事件的名称
					curTaskId: "",      //如果当前算法有设置过，则存储当前算法规则对应的taskid
					curTaskStatus: -1,   //记录当前任务的状态(开启为1，关闭为0)
					curStreamSpeed: "",	//记录当前车流/人流速度
					curLinkOptions: [],	//记录当前联动规则
					modulename: "",
					moduleversion: ""
				},
				//时间模板对象
				timeTemplateObj: null,
				//当前算法参数信息（保存时用）
				curRuleParamInfo: null,
				//标记当前处于布防还是布控(默认是布防)
				isDefenceFlag: true,
				humInfo:{
					minSize: 50,    
					maxSize: 200,
				},
				//人脸布控的规则参数信息
				faceProtectInfo: {
					minSize: 60,    //最小人脸尺寸
					maxSize: 200,   //最大人脸尺寸
					pointsInfo: {    //人脸布控区域的坐标
						left: 0,
						top: 0,
						right: 0,
						bottom: 0
					},
					hasChange: false,   //当前参数是否有更改，如果有，则显示保存按钮
					containerObj: null, //标记当前所处任务的容器，用来操作对其内的规则显示
					data: null,  //当前任务的详细信息，保存时用
					isExpand: false //标记当前任务是否展开，眼睛查看时用
				},
				//屏蔽区域区域多边形数据
	        	shieldPolyData: [],
	        	//处理区域多边形数据
	       		procPolyData: []
			},
			// 第二步右侧视频播放对象
			videoPlayer: null,
			//判断是鼠标是否处于下拉列表浮动层中
			isMouseOverPubDiv: false,
			//当前显示的框线规则id
			curSelectedRule: -1,
			//刷新定时器（人流统计&车流统计框线规则查看时触发）
			refreshCarOrPeopleTimer: null,
			//车流人流计数器,记录上一次的值
			preCarOrPeopleCount: 0,
			//当前页面的位置，任务规则详细设置页面为1，否则为0
			curOperationPos: 0,
			// 初始化的时候 是否带了摄像机进入
			editCamera: false,
			// 初始化的时候，是否带了算法进入
			editEvtype: false,
			// 第三步 循环监听当前摄像机是否开流成功
			asignTimer: null,
			
		}
	};
});