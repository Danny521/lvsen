/*
	you know 接口比较多所以才有这么多swich去判断用哪个接口
*/

define(['js/cloud-view.js'],function(VIEW){
	return {
		/*
			批量删除时,返回批量内容的id数组
		*/
		getIds: function() {
			var nodes = jQuery('.list-content dd').find('input[type=checkbox]:checked'),
				l = nodes.length,
				folders = [],
				picOrVids = [],
				structedS = [],
				indexs = [];
			if(SCOPE.wideType === 0){
				while(l--){
					if(nodes.eq(l).attr('data-fileType')==="0"){
						folders.push(nodes.eq(l).attr('data-id'));
					}else if(nodes.eq(l).attr('data-fileType')==="1"||nodes.eq(l).attr('data-fileType')==="2"){
						picOrVids.push(nodes.eq(l).attr('data-id'));
					}else if(nodes.eq(l).attr('data-fileType')==="3"){
						structedS.push(nodes.eq(l).attr('data-id'));
					}
				}
			}else{
				while (l--) {
					indexs.push(nodes.eq(l).attr('data-id'));
				}
			}
			if(indexs.length>0){
				return indexs.join(',');
			}else{
				return {
					"0":folders.join(','),
					"1":picOrVids.join(','),
					"2":structedS.join(',')
				}
			}
		},
		/**
		 * @name paramFtype
		 * @description 根据当前任务,选择对应的变量,比如:图片删除,视频删除,文件删除......
		 */
		paramFdownload:function(){
			/*下载文件需要的下载接口*/
			var type = SCOPE.context.fileType - 0,
				pvd = SCOPE.context.pvdId;
			switch (type) {
				case 0:
					/*文件(未实现)*/
					SCOPE.download = 'get_download_file';
					break;
				case 1:
					/*视频*/
					SCOPE.download = 'get_download_file';
					break;
				case 2:
					/*图片*/
					SCOPE.download = 'get_download_file';
					break;
				case 3:
					/*结构化(未实现)*/
					SCOPE.download = 'get_part_file';
					break;
				default:
					SCOPE.download = 'get_download_file';
					break;
			}
			if(pvd && type === 0){
				/*案事件文件夹下载*/
				SCOPE.download = "get_dir";
			}
		},
		/*
		*  云空间文件分为pvd相关,pvd无关.皆包含文件夹,视频,图片,结构化等资源分类
		*  接口部分风格restful,部分不是,非常混乱,这个函数就是处理这个问题.
		*  同时返回删除时给与的提示.
		*/
		paramFdel: function() {
			/**
			 * @description 获取当前的文件类型
			 */
			var type = SCOPE.context.fileType - 0,
				pvd = SCOPE.context.pvdId,
				msg = '您确定要删除<em style = "color:#414141;font-weight:bold">\"' + VIEW.getTname(true) + '\"</em> 吗?';
				switch (type) {
					case 0:
						/*文件*/
						msg += "</br> 将同时删除此文件包含的视频、图片、结构化、线索等信息!";
						break;
					case 1:
						/*视频*/
						msg += "</br> 将同时删除此视频生成的结构化、线索等信息!";
						break;
					case 3:
						/*结构化*/
						break;
					case 4:
						/*案事件*/
						msg += "</br> 将同时删除此案事件相关的所有图片,视频,线索等信息!";
						break;
					default:
						break;
				}
			if (pvd) {
				/*如果是案事件文件夹*/
				if(type === 0){
					SCOPE.del = 'delete_dir';
				}else{
					SCOPE.del = 'incidentfile';
				}
			} else {
				switch (type) {
					case 0:
						/*文件*/
						SCOPE.del = 'delete_dir';
						break;
					case 1:
						/*视频*/
						SCOPE.del = 'delete_video_info';
						break;
					case 2:
						/*图片*/
						SCOPE.del = 'delete_image_info';
						break;
					case 3:
						/*结构化*/
						SCOPE.del = 'delete_structured_info';
						break;
					default:
						SCOPE.del = 'delete_dir';
						break;
				}
			}
			return msg;
		},
		/**
		 * @name markParams
		 * @description 通过全局 cList 的值，来确定组装的接口以及参数
		 */
		markParams: function() {
			switch (SCOPE.cList) {
				case SCOPE.sList: //结构化信息
					if($(".sidebar .r-siderbar .a3 h6").hasClass("current")){
						if(!$(".sidebar .r-siderbar .a3 .s-menu a").hasClass("current")){
							SCOPE.sType = "";
						}
					}
					SCOPE.param = SCOPE.cList + "?directoryId=" + SCOPE.directoryId + "&structuredType=" + SCOPE.sType + "&pageSize=" + SCOPE.pageSize + "&pageNo=" + SCOPE.pageNo + "&markType=" + SCOPE.markType;
					break;
				case SCOPE.searchList: //搜索
					SCOPE.param = SCOPE.cList + "?fileName=" + encodeURIComponent(SCOPE.fileName) + "&pageSize=" + SCOPE.pageSize + "&pageNo=" + SCOPE.pageNo + "&beginTime=" + SCOPE.bTime + "&endTime=" + SCOPE.eTime;
					break;
				case SCOPE.phList:
					/*查看图像originImageId的图像处理结果集*/
					SCOPE.param = SCOPE.cList + "?originImageId=" + SCOPE.theId + "&pageSize=" + SCOPE.pageSize + "&pageNo=" + SCOPE.pageNo;
					break;
				case SCOPE.sListByvideo: //通过视频 id 获取某个视频的结构化信息
					if(SCOPE.context.fileType === "3"){
						SCOPE.param = SCOPE.cList + "?sourceId=" + SCOPE.context.sourceId + "&pageSize=" + SCOPE.pageSize + "&pageNo=" + SCOPE.pageNo + "&markType=" + SCOPE.markType;
					}else{
						SCOPE.param = SCOPE.cList + "?sourceId=" + SCOPE.theId + "&pageSize=" + SCOPE.pageSize + "&pageNo=" + SCOPE.pageNo + "&markType=" + SCOPE.markType;
					}
					break;
				case SCOPE.eList: //案事件
					SCOPE.param = SCOPE.cList + '/' + SCOPE.directoryId + "?fileName=" + encodeURIComponent(SCOPE.fileName) + "&pageSize=" + SCOPE.pageSize + "&pageNo=" + SCOPE.pageNo + "&beginTime=" + SCOPE.bTime + "&endTime=" + SCOPE.eTime;
					break;
				default:
					/*获取列表或列表里面的内容列表directoryId:0表示根目录,directoryId:1表示id为1的文件夹*/
					SCOPE.param = SCOPE.cList + "?directoryId=" + SCOPE.directoryId + "&pageSize=" + SCOPE.pageSize + "&pageNo=" + SCOPE.pageNo;
					break;
			}
		},
		/**
		 * @name string2time
		 * @param {{string}} 时间字符串
		 * @param {{string}} 格式需求
		 * @description 将时间格式化为 ISO 格式 "2014-05-31 00:00:00","ymdhis"
		 * @return {{object}} Date 对象
		 */
		string2time: function(s, format) {
			var arr = s.match(/\d+/g);
			var d = new Date();
			format = format.split('');
			for (var i = 0, l = format.length; i < l; i++) {
				switch (format[i]) {
					case 'y':
						d.setFullYear(arr[i]);
						break;
					case 'm':
						d.setMonth(arr[i] - 1);
						break;
					case 'd':
						d.setDate(arr[i]);
						break;
					case 'h':
						d.setHours(arr[i]);
						break;
					case 'i':
						d.setMinutes(arr[i]);
						break;
					case 's':
						d.setSeconds(arr[i]);
						break;
				}
			}
			return d;
		},
		/*批量删除,依赖scope.wideType*/
		getDelApi:function(){
			var apis = ["delete_video_info","delete_image_info","delete_structured_info","delete_dir"];
			return apis[SCOPE.wideType - 1];
		}
	}
});