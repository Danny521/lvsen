define([
	'/module/common/tvwall/js/models/tvwall-insert.js',
	"ajaxModel", 
	"jquery",
	"base.self"
], function(tvwallInsert, ajaxModel, jQuery){

	var _inspectData = [],
		_interval = 0,
		_monitorData = [],
		_inspectTimer = null,
		_monitorLength = 0,
		_curInspectCount = 0;

	var _getCurServerId = function (i) {
		var index = i||0;
			//获取当前
			return _monitorData[index].serverId;
		},
		_getServerLayout = function() {
			_monitorLength = _monitorData.length;
		},
		_checkLayoutEnough = function(){
			return (_monitorLength >= _inspectData.length);
		},
		_sendTvWall = function(i){
			//实时流上墙
			$.ajax({
				url:'/service/md/realstream/open/'+  _getCurServerId(i),
				data:_monitorData[i],
				type:'post',
				success: function () {
				},
				error: function() {
					//notify.error("实时流上墙失败！");
				}
			});
		},
		_sendTvWallByGroup = function(){
			for (var i = 0; i < _inspectData.length; i++) {
				(function(i){
					setTimeout(function(){
						jQuery.extend(_monitorData[i], {
							//channelId: _inspectData[i].channelId
							channelId: _inspectData[i].sd_channel[0] ? _inspectData[i].sd_channel[0].id : _inspectData[i].hd_channel[0].id
						});
						_sendTvWall(i,_inspectData[i].serverId);
					}, 100*i);
				}(i));	
			};
		},
		_stopInspect = function(name){			
			//关闭定时器
			if(_inspectTimer){
				window.clearInterval(_inspectTimer);
			}
			//触发所有的全部下墙
			//jQuery(".offwall").trigger("click");
			
			//将已上墙的实时流下墙(客户需求，停止轮巡时电视墙保留画面)
			// jQuery.each(_monitorData, function(i, o) {
			// 	delete o.channelId;
			// 	$.ajax({
			// 		url: '/service/md/stream/close/' + o.serverId,
			// 		data: o,
			// 		type: 'post',
			// 		success: function() {},
			// 		error: function() {
			// 			//notify.error("实时流上墙失败！");
			// 		}
			// 	});
			// })
			
			//将高亮的摄像机不高亮
			jQuery(".treeMenu .node.checktree.active").find("li").removeClass("selected");
			//提示
			notify.info("轮巡结束");
			logDict.insertMedialog("m1", "轮巡电视墙" + name + "分组结束");
		},
		_startInspect = function(){
			notify.info("轮巡进行中请不要离开此页面,否则轮巡停止!");
			//每次轮巡时重新置0
			_curInspectCount = 0;
			//执行第一次
			_sendIntervalData();
			//关闭已有的定时器
			if(_inspectTimer){
				window.clearInterval(_inspectTimer);
			}
			//开启新的定时器
			_inspectTimer = window.setInterval(function(){
				_sendIntervalData();
			}, _interval*1000);
		},
		_sendIntervalData = function(){

			jQuery(".treeMenu .node.checktree.active").find("li").removeClass("selected");
			for (var i = 0; i < _monitorLength; i++, _curInspectCount++) {
				if(_curInspectCount >= _inspectData.length) {
					//循环
					_curInspectCount = 0;
				}
				
				(function(i, curPos){
					setTimeout(function(){
						//高亮正在轮巡的摄像机
						var cId = _inspectData[curPos].id;
						jQuery(".treeMenu .node.checktree.active").find("li[data-id="+cId+"]").addClass("selected");
						//增加一个字段channelId
						jQuery.extend(_monitorData[i], {
							channelId: _inspectData[curPos].sd_channel[0] ? _inspectData[curPos].sd_channel[0].id : _inspectData[i].hd_channel[0].id
						});
						_sendTvWall(i);
					}, 10*i);
				}(i, _curInspectCount));
			};
		};

	return {
		//电视墙轮巡业务
		inspectBusiness: function(data, mData, interval,inspectName) {
			_inspectData = data;
			_interval = interval;
			_monitorData = mData;
			console.log("data",data,"mData",mData,"interval",interval);
			//收集监视器布局信息
			_getServerLayout();
			//判断布局是否够用
			if(_checkLayoutEnough()){
				//够用的时候不需要轮巡
				_sendTvWallByGroup();
			} else {
				//需要轮巡
				_startInspect();
			}
			logDict.insertMedialog("m1", "轮巡电视墙" + inspectName + "分组开始");
		},
		stopInspect: _stopInspect
	};

});