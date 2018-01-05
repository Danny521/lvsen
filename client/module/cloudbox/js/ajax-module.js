/*
*  云空间请求入口
*/
define(['ajaxModel','base.self'],function(ajaxModule){
	return {
		/*模版缓存*/
		tpl:{},
		URLS:{
			CRATENEWFLODER:"/service/pcm/createDir",
			GETVIDEOKINDTYPE:"/service/pcm/existOverlayOrShearData",
			divideCloudOrImage:"/service/pcm/insertCloudFileToResource"
		},
		/*
		* 加载模版
		*/
		loadTpl: function(name) {
			var self = this,
			dfd = jQuery.Deferred();

			if (self.tpl[name]) {
				dfd.resolve(self.tpl[name]);
				return dfd.promise();
			}

			jQuery.ajax({
				type: "get",
				url: "/module/cloudbox/inc/" + name + ".html",
				success: function(html) {
					self.tpl[name] = html;
					dfd.resolve(html);
				}
			});
			return dfd.promise();
		},
		/*
		* 加载数据
		*/
		loadData: function(url, parentNode) {
			var msg = "<div class='no-data' style='text-align:center;padding:30px;'><i class='loading-img'></i>正在加载…</div>",
			custom = {
				beforeSend:function(){
					if (parentNode) {
						parentNode.html(msg);
					}
				}
			};
			return ajaxModule.getData(url,undefined,custom);
		},
		loadDetails:function(url){
			var msg = '<div class="loading"></div>',
			custom = {
				beforeSend:function(){
					//隐藏导航,bug[37719], add by zhangyu, 2015.10.25
                	window.top.showHideNav("hide");
                	//显示详情
					jQuery('.bg-wrap').fadeIn(100).find('.inner-wrap').html(msg);
				}
			};
			return ajaxModule.getData(url,undefined,custom);
		},
		/*
		* 提交数据
		*/
		postData: function(url, data) {
			return ajaxModule.postData(url,data);
		},
		getData:function(url,data){
			return ajaxModule.getData(url,data);
		},
		/**
		 * [createNewFloder 创建新文件夹]
		 * @param  {[type]} floderName [文件夹名称]
		 * @param  {[type]} id         [当前新创建文件夹的父类的id]
		 * @return {[type]}            [description]
		 */
		createNewFloder:function(floderName,id){
			return ajaxModule.postData(this.URLS.CRATENEWFLODER,{
				dirName:floderName,
				parentDirId:id
			},{
				timeout:2000
			});
		},
		/**
		 * [getVideoKindType 获取视频类型]
		 * @param  {[type]} id [description]
		 * @return {[type]}    [description]
		 */
		getVideoKindType:function(id){
			return ajaxModule.getData(this.URLS.GETVIDEOKINDTYPE,{
				vid:id
			},{
				timeout:2000
			});
		},
		checkFileExist:function(url,id,resourceType,structureType){
			return ajaxModule.getData(url,{
				resource_type:resourceType,
				structure_type:structureType,
				pvd_id:id
			},{
				timeout:2000
			})
		}
	};
})