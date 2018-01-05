define(function(){
	return {
		//格式化数据
		modifyData: function(data, prefix, suffix, name, value) {
			var len = data.length;
			var str = prefix || "{",
				item = '';
			for (var i = 0; i < len; i++) {
				item = data[i];
				str = str + '"' + item.name + '":"' + item.value + '",';
			}
			str = str + '"' + name + '":"' + value + '",';
			str = str.substr(0, str.length - 1);

			str = str + (suffix || "}");

			return str;
		},
		//加载模版
		loadTpl: function(name) {
			var self = this;
			var dfd = jQuery.Deferred();
			if (self.options.tpl[name]) {
				dfd.resolve(self.options.tpl[name]);
				return dfd.promise();
			}
			jQuery.ajax({
				type: "get",
				url: "/module/imagejudge/inc/" + name + ".html",
				success: function(html) {
					self.options.tpl[name] = html;
					dfd.resolve(html);
				}
			});
			return dfd.promise();
		},
		//加载数据
		loadData: function(name, datajson, ajaxType,parentNode) {
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
					return datas.status;
				});
			}else{
				ajaxObj = ajaxModule.postData('/service/pia/' + name ,datajson ,custom).then(function(datas){
					return datas;
				},function(datas){
					return datas.status;
				});
			}
			return ajaxObj;
		},
		parseDate:function(mills){
			var date = new Date(mills),
	 		formatLenth = Toolkit.formatLenth;
	 		return date.getFullYear() + '-' + formatLenth(date.getMonth() + 1) + '-' + formatLenth(date.getDate()) + ' ' + formatLenth(date.getHours()) + ':' + formatLenth(date.getMinutes()) + ':' + formatLenth(date.getSeconds());
		}
	};
});