/*
	布控任务设置 model层
 */
define(['ajaxModel'], function(ajaxModel) {
	var isMock = false,
	urlMap = {
		"getMessageList": isMock?"inc/getmessage.json":"/service/message/posts",
		"addMessage": isMock?"inc/addMessage.json":"/service/message/post",
		"addPoint":isMock?"inc/addPoint.json":"/service/message/attention",
		"sendReply":isMock?"inc/addPoint.json":"/service/message/reply",
		"getReplyList": isMock?"inc/getReplyList.json":"/service/message/post/replies/"
	};

	return {
		/**
		 * [getMessageList 获取留言板列表]
		 * @param  {[type]} name   [description]
		 * @param  {[type]} data   [description]
		 * @param  {[type]} custom [description]
		 * @return {[type]}        [description]
		 */
		getMessageList:function(name,data,custom){
			return ajaxModel.getData(urlMap[name], data, custom);
		},
		/**
		 * [addMessage 发帖]
		 * @param {[type]} name [description]
		 * @param {[type]} data [description]
		 */
		addMessage:function(name,data){
			return ajaxModel.postData(urlMap[name], data);
		},
		/**
		 * [getReplyList 获取回复列表]
		 * @param  {[type]} name [description]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		getReplyList:function(name,morUrl,data){
			return ajaxModel.getData(urlMap[name]+morUrl, data);
		},
		/**
		 * [addPoint 关注]
		 * @param {[type]} name [description]
		 * @param {[type]} data [description]
		 */
		addPoint:function(name,data){
			return ajaxModel.postData(urlMap[name], data);
		},
		/**
		 * [sendReply 回复]
		 * @param  {[type]} name [description]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		sendReply:function(name,data){
			return ajaxModel.postData(urlMap[name], data);
		}
	}
});