define(['ajaxModel','js/PARAM-STATUS.js'],function(ajaxModule,scope){
	return {
		tpl:{},/*模版缓存*/
		clearAllHistory : function(url,callback){
			this.modefiyData(url,callback);
		},
		saveH2R : function(url,callback){
			this.modefiyData(url,callback);
		},
		getListName : function(url,data,callback){
			this.modefiyData(url,callback,data);
		},
		isRepeat : function(url,callback){
			this.modefiyData(url,callback);
		},
		modefiyData:function(url,callback,data){
			/*如果请求成功返回的是数据,如果失败返回的是错误码*/
			ajaxModule.getData(url,data).then(function(data){
				(data && data.code === 200 && callback) ? callback(true,data) : callback(false,"错误码 : " + data.code);
			},function(res){
				callback(false, "http错误码 : " + res.status);
			});
		},
		//加载数据
		loadData: function(name, datajson, ajaxType, parentNode) {
			var custom = {
				beforeSend: function() {
					parentNode.html("<div class='no-data'><i class='loading-img'/></i>正在加载…</div>");
				}
			},
			ajaxObj;
			if(ajaxType === 'get'){
				ajaxObj = ajaxModule.getData('/service/pia/' + name ,datajson ,custom).then(function(datas){
					return datas;
				},function(datas){
					return datas[0].status;
				});
			}else{
				ajaxObj = ajaxModule.postData('/service/pia/' + name ,datajson ,custom).then(function(datas){
					return datas;
				},function(datas){
					return datas[0].status;
				});
			}
			return ajaxObj;
		},
		//加载模版
		loadTpl: function(name) {
			var self = this;
			var dfd = jQuery.Deferred();
			if (self.tpl[name]) {
				dfd.resolve(self.tpl[name]);
				return dfd.promise();
			}
			jQuery.ajax({
				type: "get",
				url: "/module/imagejudge/inc/" + name + ".html",
				success: function(html) {
					self.tpl[name] = html;
					dfd.resolve(html);
				}
			});
			return dfd.promise();
		}
	}
});