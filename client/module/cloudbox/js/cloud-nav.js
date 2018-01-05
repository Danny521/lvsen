/*
	面包屑部分,承载页面内部导航
*/
define(['js/cloud-view.js','base.self'],function(VIEW){
	return {
		/**
		 * @name setSteps
		 * @param {Array} 面包屑的名称
		 * @param {object} 和面包屑对应的数据，点击等时候使用
		 * @description 处理面包屑
		 */
		setSteps: function(name, data) {
			name = name || '';
			SCOPE.steps = name;
			SCOPE.jump2steps = data;
			this.updateSteps();
		},

		/**
		 * @name pushSteps
		 * @param {string} 面包屑的名称
		 * @param {object} 和面包屑对应的数据，点击等时候使用
		 * @description 处理面包屑
		 */
		pushSteps: function(name, data) {
			name = name || '';
			SCOPE.steps.push(name);
			SCOPE.jump2steps.push(data);
			this.updateSteps();
		},
		keepLastTypeSteps:function(name,data){
			var self = this;
			var fileType = SCOPE.jump2steps[SCOPE.jump2steps.length-1].fileType;
			if(fileType === 2 || fileType === 1 || fileType === 3){
				SCOPE.steps.pop();
				SCOPE.jump2steps.pop();
			}
			self.pushSteps(name,data);
		},
		deleteLastTypeSteps:function(name,data){
			var self = this;
			var fileType = SCOPE.jump2steps[SCOPE.jump2steps.length-1].fileType;
			if(fileType === 2 || fileType === 1 || fileType === 3){
				SCOPE.steps.pop();
				SCOPE.jump2steps.pop();
			}
			this.updateSteps();
		},
		steps_all:function(){
			this.setSteps(['全部文件'], [{
				data: '0',
				type: 'data-cat'
			}]);
		},
		steps_video:function(){
			this.setSteps(['全部文件', '视频'], [{
				data: '0',
				type: 'data-cat'
			}, {
				data: '1',
				type: 'data-cat'
			}]);
		},
		steps_img:function(){
			this.setSteps(['全部文件', '图片'], [{
				data: '0',
				type: 'data-cat'
			}, {
				data: '2',
				type: 'data-cat'
			}]);
		},
		steps_struc:function(){
			this.setSteps(['全部文件', '结构化信息'], [{
				data: '0',
				type: 'data-cat'
			}, {
				data: '3',
				type: 'data-cat'
			}]);
		},
		steps_case:function(){
			this.setSteps(['全部文件', '案事件'], [{
				data: '0',
				type: 'data-cat'
			}, {
				data: '4',
				type: 'data-cat'
			}]);
		},
		/*智能标注后,查看视频的结构化信息列表,跳往云空间查看时,面包屑的变化*/
		steps_strulistByHandle_of_image:function(location){
			if(location.cId){
				var stepsName = ['全部文件', location.name, '结构化信息列表'];
					stepsData = [{
						data: '0',
						type: 'data-cat'
					}, {
						type: 'info',
						data: location.id,
						originId:location.cId || location.pId,
						sourceId:location.sourceId,
						fileType: 2,
						url:"get_image_info"
					}, {
						data: location.id,
						type: 'sList',
						url: 'get_structured_Num'
					}];
			}else{
				var stepsName = ['全部文件', '结构化信息列表'];
					stepsData = [{
						data: '0',
						type: 'data-cat'
					}, {
						data: location.id,
						type: 'sList',
						url: 'get_structured_Num'
					}];
			}
			this.setSteps(stepsName,stepsData);
		},
		/*图像处理之后,跳往云空间查看时,面包屑的变化*/
		steps_handleByImage_of_image:function(location){
			if(location.cId){
				var stepsName = ['全部文件', location.name, '图片处理结果集'];
					stepsData = [{
						data: '0',
						type: 'data-cat'
					}, {
						type: 'info',
						data: location.id,
						originId:location.cId || location.pId,
						sourceId:location.sourceId,
						fileType: 2,
						url:"get_image_info"
					}, {
						data: location.id,
						type: 'iList',
						url: 'get_handle_images'
					}];
			}else{
				var stepsName = ['全部文件', '图片处理结果集'];
					stepsData = [{
						data: '0',
						type: 'data-cat'
					},{
						data: location.id,
						type: 'iList',
						url: 'get_handle_images'
					}];
			}
			this.setSteps(stepsName,stepsData);
		},
		/*智能标注后,查看视频的结构化信息列表,跳往云空间查看时,面包屑的变化*/
		steps_strulist_of_video:function(location){
			var stepsName = ['全部文件', '视频', location.name, '结构化信息列表'];
				stepsData = [{
					data: '0',
					type: 'data-cat'
				}, {
					data: '1',
					type: 'data-cat'
				}, {
					type: 'info',
					data: location.id,
					fileType: 1,
					url:"get_video_info"
				}, {
					data: location.id,
					type: 'sList',
					url: 'get_structured_Num'
				}];
			this.setSteps(stepsName,stepsData);
		},
		/*
			点击左侧列表中的人,车,物
		*/
		steps_struc_type:function(){
			var l = SCOPE.jump2steps.length;
			SCOPE.steps = ['全部文件', '结构化信息'];
			SCOPE.steps.push(VIEW.whichSText());
			if (l > 3) {
				SCOPE.jump2steps.length = 3;
			}
			if (SCOPE.jump2steps.length === 3) {
				SCOPE.jump2steps.pop();
			}
			SCOPE.jump2steps.push({
				data: SCOPE.sType,
				type: 'data-type'
			});
			this.updateSteps();
		},
		/*查看图片处理结果集时,面包屑的变化*/
		piclist_from_pic:function(){
			this.pushSteps('图片处理结果集', {
				data: SCOPE.context.id,
				type: 'sList',
				url: SCOPE.phList
			});
		},
		/*查看由视频生成的结构化列表信息时,面包屑的变化*/
		strulist_from_video:function(){
			this.pushSteps('结构化信息列表', {
				data: SCOPE.context.id,
				type: 'sList',
				url: SCOPE.sListByvideo
			});
		},
		search_normal:function(){
			var name = SCOPE.fileName || "全字段";
			var stepsName = ['全部文件', "搜索 <span style='color:orange;font-weight:bold;'>\"" + name + "\"</span>"];
			var stepsData = [{
				data: '0',
				type: 'data-cat'
			}, {
				'type': 'search',
				'url': 'get_search_list',
				'fileName': name
			}];
			this.setSteps(stepsName, stepsData);
		},
		search_case:function(){
			var name = SCOPE.fileName || "全字段";
			var stepsName = ['全部文件', "案事件", "搜索 <span style='color:orange;font-weight:bold;'>\"" + name + "\"</span>"];
			var stepsData = [{
				data: '0',
				type: 'data-cat'
			}, {
				data: '4',
				type: 'data-cat'
			}, {
				'type': 'search',
				'url': 'incidents',
				'directoryId': SCOPE.directoryId,
				'fileName': name
			}];
			this.setSteps(stepsName, stepsData);
		},
		/**
		 * @name updateSteps
		 * @param {{string}} 渲染并显示面包屑数据
		 * @description 用以渲染导航,基于self.steps,self.jump2steps里面的数据
		 */
		updateSteps: function() {
			var l = SCOPE.steps.length,
				string = "";
			if (l === 1) {
				string = '<a class="navi" href="javascript:void(0)">' + SCOPE.steps[0] + '</a>';
			} else if (l > 1) {
				string = "<span id='go_back'>返回上一级&nbsp|&nbsp</span>";
				for (var i = 0; i < l - 1; i++) {
					string += '<a class="navi" href="javascript:void(0)">' + SCOPE.steps[i] + '</a><em>></em>';
				}
				string += '<p>' + SCOPE.steps[l - 1] + '</p>';
			}
			jQuery('div.location').html(string);
		},
	};
});