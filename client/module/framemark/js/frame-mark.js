define([
	'jquery',
	'jquery-ui',
	'mootools',
	'jquery.pagination',
	'/module/framemark/js/timeline.js',
	'jquery.watch'
],function(jQuery) {
	require(["jquery-ui-timepicker-addon"]);
	//帧标记新增功能代码
	if(location.href.match(/\/dispatch\//gi)){return}
	if(location.href.match(/\/screen\.html/gi)){return}
	var _FrameMarker = function(){
		var self = MarkerClass = this;
		this.initialize = function(options) {
			//self.showTimeLine();
			self.init();
			self.MarkList = {};
			jQuery("#onlySelf").prop("checked", false);
			self.getUser(function(data) {
				self.userId = data.usr.id;
			});
			self.bindEvents();
			jQuery("#listMode").trigger("click");
		}
		/**
		 * [Ajax ajax取数据封装函数]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {[字符串]}   url  [description]
		 * @param  {[字符串]}   type [description]
		 * @param  {[json]}   data [description]
		 * @param  {Function} fn   [description]
		 */
		this.Ajax=function(url,type,data,fn){
			var self=this;
			if(self.Ajaxobj)
			{
				self.Ajaxobj.abort();
			}
			self.Ajaxobj=jQuery.ajax({
				type: type,
				dataType: "JSON",
				url: url,
				data:data,
				success: function(res)
				{
					if(res.code==200)
					{
						if(typeof(fn)=="function")
						{
							fn(res.data);
						}
					}
					else
					{
						notify.warn(res.data.message);
					}
				}
			});
		}
		/**
		 * [playerShow 播放器显示]
		 * @author huzc
		 * @date   2015-07-14
		 */
		this.playerShow=function(){
			jQuery(".UIOCX.Mark").css({
				"display":"block",
				"position":"static",
				"top":0
			});
		}
		/**
		 * [playerHide 播放器隐藏]
		 * @author huzc
		 * @date   2015-07-14
		 */
		this.playerHide=function(){
			jQuery(".UIOCX.Mark").css({
				"display":"block",
				"position":"absolute",
				"top":-1000
			});
		}
		/**
		 * [AjaxRequest ajax取数据，封装，数据了整理格式]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {[json]}   obj [请求参数]
		 * @param  {[function]}   obj [回调函数]
		 */
		this.AjaxRequest=function(obj,fn){
			var self=this;
			var stype="get"||obj.type;
			var url=obj.url+"";
			var data=Object.clone(obj);
			delete data.url;
			delete data.type;
			jQuery.ajax({
				type: stype,
				dataType: "JSON",
				url: url,
				data:data,
				success: function(res)
				{
					if(res.code==200)
					{
						if(!res.data.tagNames)
						{
							return;
						}
						var L=res.data.tagNames.length;
						for(var i=0;i<=L-1;i++)
						{
							var k=res.data.tagNames[i].id;
							self.MarkList[k+""]=res.data.tagNames[i];
						}
						if(typeof(fn)=="function")
						{
							fn(res.data);
						}
					}
					else
					{
						notify.warn(res.data.message);
					}
				}
			});
			/*
			 var time=(new Date()).getTime();
			 data.endTime=Toolkit.formatDate(new Date(time));
			 data.beginTime=Toolkit.formatDate(new Date(time-30*24*60*60*1000));

			var Timeline1=self.Timeline;
			var timeRange=Timeline1.getTimeRange();

			data.endTime=Toolkit.formatDate(new Date(timeRange.end));
			data.beginTime=Toolkit.formatDate(new Date(timeRange.start));
			data.currentPage=1;
			data.pageSize=100000000;
			self.lastTimeLineData={
				url:obj.url,
				type:obj.type,
				data:data
			};
			self.Ajax(obj.url,obj.type,data,function(resdata){
				//console.log("resdata="+JSON.stringify(resdata));
				self.renderFrames(data.beginTime,data.endTime,resdata.tagNames);
			});*/
		}
		/**
		 * [getFrameMark ajax获取帧标记]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {[json]}   obj [参数]
		 * @param  {Function} fn  [回调]
		 */
		this.getFrameMark=function(obj, fn) {
			var cameraId = obj.cameraId;
			var channelName = obj.channelName;
			var beginTime = obj.beginTime;
			var endTime = obj.endTime;
			jQuery.ajax({
				url: '/service/frame/get_frame',
				data: {
					cameraId: cameraId,
					beginTime: beginTime,
					endTime: endTime
				},
				cache: false,
				type: 'GET',
				success: function(res) {
					//console.log(JSON.stringify(res,null," "));
					if (res.code === 200) {
						var tags = res.data.tags;
						if (tags.length <= 0) {
							fn(tags, false);
							return false;
						}
						fn(tags, true);
					} else if (res.code === 500) {
						fn(tags, false);
						//notify.warn(res.data.message);
					}
				}
			});
		}
		/**
		 * [showMarker 在播放器时间轴上显示帧标记]
		 * @author huzc
		 * @date   2015-05-12
		 * @param  {[json]}   pobj [显示帧标记的参数]
		 */
		this.showMarker=function(pobj){
			var self=this;
			var node=pobj.content;
			var cdata=pobj.cdata;
			var framedata={
				cameraId: cdata.cId||cdata.cameraId,
				beginTime: cdata.history.beginTime,
				endTime: cdata.history.endTime,
			}
			self.getFrameMark(framedata,function(tags,flag){
				if(flag==false){return}

			});
		}
		/**
		 * [JudgeTimeSets A[I]格式  统计落在某时间区间的帧标记个数]
		 * @author huzc
		 * @date   2015-05-11
		 * @param  {[数组]}   FrameList [帧标记数组]
		 * @param  {[数字]}   startTime [开始时间]
		 * @param  {[数字]}   endTime   [结束时间]
		 */
		this.JudgeTimeSets = function(FrameList, startTime, endTime) {
			var L = FrameList.length;
			var K = 0;
			var Frames = [];
			for (var i = 0; i <= L - 1; i++) {
				var time = FrameList[i].time;
				if (time >= startTime && time < endTime) {
					K++;
					Frames.push(FrameList[i]);
				}
			}
			return Frames;
		}
		/**
		 * [RenderCountFrames 本函数是中间层函数，传入参数，获取帧标记，并且在时间轴上绘制帧标记]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {[json]}   obj    [json参数，格式见调用处]
		 * @param  {[数组]}   videos [历史录像片段数组]
		 * @param  {Function} fn     [回调函数]
		 */
		this.RenderCountFrames = function(obj, videos, fn) {
			var self=this;

			this.getFrameMark(obj, function(FrameList, flag) {
				if (flag == false) {
					return
				}
				var L = videos.length;
				var FrameMark_InHisList = []; //将所有帧标记分配到每一段历史录像生成新的数组,该数据和历史片段数组等长；
				var len = 0;
				//FrameList的格式和提交帧标记的数据格式一样
				var max = 0;
				for (var i = 0; i <= L - 1; i++) {
				//	FrameMark_InHisList[i] = self.JudgeTimeSets(FrameList, videos[i][0], videos[i][1]);
				    //之前视频是分段的，所以传入该段的开始和结束时间，现在视频是一整段，应该传入整段的开始和结束时间
					FrameMark_InHisList[i] = self.JudgeTimeSets(FrameList, videos[0][0], videos[L-1][1]);
					len = FrameMark_InHisList[i].length; //统计
					max = Math.max(max, len);
					//jQuery("#ptzCamera >.content>.view.hisplay>.box>.box-body>.resultList > ul > li>.framemark:eq("+i+")").html(len);
				}
				for (var i = 0; i <= L - 1; i++) {
					//FrameMark_InHisList[i]=JudgeTimeSets(FrameList,videos[i][0],videos[i][1]);
					len = FrameMark_InHisList[i].length; //统计
					if (max >= 10 && len <= 9) {
						len = "0" + len;
					}
					//jQuery("#ptzCamera >.content>.view.hisplay>.box>.box-body>.resultList > ul > li>.framemark:eq(" + i + ")").html(len);
				}
				fn(FrameList, FrameMark_InHisList);
			});
		}
		/**
		 * [renderFrameMark 在播放器的时间轴上绘制帧标记]
		 * @author huzc
		 * @date   2015-05-12
		 * @param  {[对象]}   player [播放器对象]
		 * @param  {[数字]}   index  [分屏序号]
		 * @param  {[对象]}   node   [节点对象]
		 * @return {[NULL]}          [description]
		 */
		this.renderFrameMark = function(player, index, node) {
			var self=this,
			    cdata= player.cameraData[index],
			    name=cdata.cName || cdata.name,
			    MenuData,
			    chName;
			if (window.SelectCamera.MenuData) {
				MenuData = window.SelectCamera.MenuData[name];
			}
			if((!cdata.history) && (!MenuData)){
			   return;
			}
            if((!cdata.history) && (!MenuData.history)){
               return;
            }
			if((!cdata.history) && (MenuData.history)){
			   cdata=MenuData;
			}
			if(cdata.history.hisdata){
				chName = cdata.history.hisdata.path;
			}
			var paramdata={
				cameraId: cdata.cId||cdata.cameraId,
				beginTime: cdata.history.beginTime,
				endTime: cdata.history.endTime,
				channelName: cdata.history.channelName||cdata.path || chName
			};
			var videos=cdata.history.hisdata.videos;
			self.RenderCountFrames(paramdata, videos, function(FrameList, FrameMark_InHisList){
				if (typeof(FrameMark_InHisList) != "object") {
					return;
				}
				var str = player.playerObj.GetVideoAttribute(index) + "";
				if (str == "ERROR") {
					node.html("");
					return
				}
				var order=cdata.history.order;
				var FrameMark = FrameMark_InHisList[order];
				if (!FrameMark.length) {return}
				var L = FrameMark.length;
				var html = "";
				//var delta=window.SelectCamera.ListData[index].timePoint;
				var beginTime = cdata.history.beginTime;
				var endTime =cdata.history.endTime;

				var dis = endTime - beginTime;
				var w = node.width();

				var Colors = ["red", "orange", "yellow", "#00ccff", "#e1e1e1"];

				for (var i = 0; i <= L - 1; i++) {
					var time = FrameMark[i].time;
					var left = parseInt(w * (time - beginTime) / dis);
					var timestr = Toolkit.formatDate(new Date(time));
					var name = FrameMark[i].name;
					var description = FrameMark[i].description;
					var title = timestr + "\n" + name + "\n...";
					var color = Colors[FrameMark[i].level - 0];
					html = html + "<span _title='" + title + "' description='" + description + "' framemarkid='" + FrameMark[i].id +
					 "' class='framelevel level" + FrameMark[i].level + "' style='background-color:" + color + ";left:" + left + "px;'></span>";
				}
				//console.log("html="+html);
				node.html(html);
			});
		}
		/**
		 * [renderFrames 在时间轴上绘制帧标记，非播放器上的时间轴]
		 * @author huzc
		 * @date   2015-05-12
		 * @param  {[数字]}   beginTime [开始时间]
		 * @param  {[数字]}   endTime   [结束时间]
		 * @param  {[数组]}   Frames    [帧标记数组]
		 * @return {[NULL]}             [description]
		 */
		this.renderFrames=function(beginTime,endTime,Frames){
			var self=this;
			var L=Frames.length;
			var html="";
			var dis=jQuery("#frameList").width();
			//console.log(beginTime);
			//console.log(endTime);
			beginTime=beginTime.replace(/-/g,"/");
			endTime=endTime.replace(/-/g,"/");
			beginTime=(new Date(beginTime)).getTime();
			endTime=(new Date(endTime)).getTime();
			var distime=endTime-beginTime;
			var x=0;
			var color="";

			//console.log([beginTime,endTime]);
			var Colors=["red","orange","yellow","#00ccff","#e1e1e1"];
			for(var i=0;i<=L-1;i++)
			{
				var id=Frames[i].id;
				self.MarkList[id+""]=Frames[i];
				x=dis*(Frames[i].time-beginTime)/distime;
				//console.log([Frames[i].time,beginTime,Frames[i].time-beginTime]);
				if(x>=0&&x<dis)
				{
					//console.log([x,Frames[i].time,beginTime,endTime]);
					color=Colors[Frames[i].level];
					html=html+"<span class='framepoint' markid='"+Frames[i].id+"' style='left:"+x+"px;background-color:"+color+";'></span>";
				}
				else
				{
					console.log("越界："+i);
				}
			}
			jQuery("#timeline #frameList").html(html);
		}
		/**
		 * [getPages 获取数据并且生成分页]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {[json]}   condition [查询条件]
		 */
		this.getPages=function(condition){
			var self=this;
			var pageSize=condition.pageSize;
			self.AjaxRequest(condition,function(data)
			{
				var pageCount=data.pageCount;
				var tagNames=data.tagNames;
				jQuery("#Pagination").pagination(pageCount*pageSize, {
					prev_text: '',       //上一页按钮里text
					next_text: '',       //下一页按钮里text
					items_per_page: pageSize,  //显示条数   data.pageSize
					num_display_entries: 10,    //连续分页主体部分分页条目数
					current_page: data.pageIndex,   //当前页索引
					num_edge_entries: 3,        //两侧首尾分页条目数
					orhide:false,
					pagesList:[10,20,30,40,50,60,70,100,200],
					callback: function(index,node)
					{
						condition.currentPage=index+1;
						self.AjaxRequest(condition,function(xdata){
							jQuery("#frameMarkResult tr:gt(0)").remove();
							var html=self.renderTable(xdata.tagNames,index+1,pageSize);
							jQuery("#frameMarkResult").append(html); //将返回的数据追加到表格
							var html=self.renderImages(xdata.tagNames);
							jQuery("#frameImageList").html(html);
							permission.reShow();
						});
					},
					changePages:function(k,current_page,obj){
						condition.currentPage=current_page+1;
						condition.pageSize=k;
						self.AjaxRequest(condition,function(xdata){
							jQuery("#frameMarkResult tr:gt(0)").remove();
							var html=self.renderTable(xdata.tagNames,current_page+1,k);
							jQuery("#frameMarkResult").append(html); //将返回的数据追加到表格
							var html=self.renderImages(xdata.tagNames);
							jQuery("#frameImageList").html(html);
							permission.reShow();
						});

					}
				});
			});
		}
		/**
		 * [renderTable 生成帧标记信息列表]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {[数组]}   frames    [帧标记位数组]
		 * @param  {[数字]}   pageIndex [序号]
		 * @param  {[数字]}   pageSize  [数字]
		 * @return {[type]}             [description]
		 */
		this.renderTable=function(frames,pageIndex,pageSize){
			var L=frames.length;
			var html="";
			if(L === 0){
				html="<tr><td colspan='7' style='text-align:left;padding-left:15px;border-bottom:0px;'>暂无数据</td></tr>";
			}
			var m=pageIndex*pageSize;
			var n=m+pageSize-1;
			//console.log("frames="+JSON.stringify(frames));
			var Colors=["red","orange","yellow","#00ccff","#e1e1e1"];
			var ColorsType=["red","orange","yellow","blue","gray"];
			for(var i=0;i<=L-1;i++)
			{
				var btn_edit, btn_delete;
				if(frames[i].userId == window.localStorage.getItem('userId')){
					btn_edit = "<span class='button edit' title='编辑'></span>";
					btn_delete = "<span class='button delete' title='删除'></span>";
				} else {
					btn_edit = "<span class='button edit' title='编辑' style='visibility:hidden;'></span>";
					btn_delete = "<span class='button delete' title='删除' style='visibility:hidden;'></span>";
				}
				var A =
				[
					"<tr id='framemark_"+frames[i].id+"'>",
					//"<td>"+frames[i].id+"</td>",
					"<td>"+((pageIndex-1)*pageSize+i+1)+"</td>",
					"<td><span class='title' style='background-color:"+Colors[frames[i].level]+"'>"+frames[i].name+"</span></td>",
					"<td>"+Toolkit.formatDate(new Date(frames[i].time))+"</td>",
					/*"<td>"+frames[i].cameraCode+"</td>",*/
					"<td>"+frames[i].cameraName+"</td>",
					//"<td>"+frames[i].level+"</td>",
					"<td>"+frames[i].cameraOrgName+"</td>",
					"<td>"+frames[i].userName+"</td>",
					"<td>",
						"<span class='button explorer' title='详情'></span>",
						btn_edit,
						"<span class='button play permission permission-view-history' title='回放'></span>",
						"<span class='button saveto' title='入库' style='display:none'></span>",
						btn_delete,
					"</td>",
					"</tr>"
				];
				html=html+A.join("");
			}
			return html;
		}
		/**
		 * [showPages 分页封装，暂未用到]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {[type]}   obj [description]
		 * @return {[type]}       [description]
		 */
		this.showPages=function(obj)
		{
			jQuery("#Pagination").pagination(obj.pageCount, {
				callback: obj.PageCallback,
				prev_text: '',       //上一页按钮里text
				next_text: '',       //下一页按钮里text
				items_per_page: obj.pageSize,  //显示条数
				num_display_entries: 10,    //连续分页主体部分分页条目数
				current_page: obj.pageIndex,   //当前页索引
				num_edge_entries: 3        //两侧首尾分页条目数
			});
		}
		/**
		 * [deleteFrameMark 删除帧标记代码的封装]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {[type]}   id [description]
		 * @param  {Function} fn [description]
		 * @return {[type]}      [description]
		 */
		this.deleteFrameMark=function(id,fn){
			jQuery.ajax({
				url: '/service/frame/frameTag/'+id,
				dataType: 'json',
				type: 'post',
				data: {
					_method:"delete"
				},
				success: function(res) {
					if (res && res.code === 200) {
						if(fn){
							fn(id,res);
						}
					} else if (res && res.code === 400) {
					//	notify.warn(res.data.message);
					    notify.warn("只能删除自己创建的帧标记");
					} else {
						notify.warn('删除帧标记失败！');
					}
				}
			});
		}
		/**
		 * [createPlayer 创建播放器对象]
		 * @author huzc
		 * @date   2015-07-14
		 * @return {[type]}   [description]
		 */
		this.createPlayer=function()
		{
			if(!this.ocxDom){
				this.ocxDom = document.createElement("object");
				this.ocxDom.setAttribute("id", "UIOCXFrame");
				this.ocxDom.setAttribute("height", 216);
				this.ocxDom.setAttribute("width", 268);
				this.ocxDom.setAttribute("classid", "clsid:294EEBEC-7677-4EBA-B2D7-3FD669FBF2A2");
				return this.ocxDom;
			}
		}
		/**
		 * [setPagination 分页封装]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {[type]}   total        [description]
		 * @param  {[type]}   selector     [description]
		 * @param  {[type]}   itemsPerPage [description]
		 * @param  {Function} callback     [description]
		 */
		this.setPagination=function(total, selector, itemsPerPage, callback) {
			jQuery(selector).pagination(total, {
				items_per_page: itemsPerPage,
				num_display_entries: 4,
				first_loading:true,
				callback: function(pageIndex, jq) {
					callback(pageIndex + 1);
				}
			});
		}
		/**
		 * [renderImages 图片列表模式模板渲染]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		this.renderImages=function(data){
			var L=data.length;
			var html="<br/>";
			var Colors=["red","orange","yellow","#00ccff","#e1e1e1"];
			var ColorsType=["red","orange","yellow","blue","gray"];
			for(var i=0;i<=L-1;i++)
			{
				(function(k){
					var icon_edit, icon_delete;
					if(data[k].userId == window.localStorage.getItem('userId')){
						icon_edit = "<span class='imgbtn edit'></span>";
						icon_delete = "<span class='imgbtn delete'></span>";
					} else {
						icon_edit = "<span class='imgbtn edit' style='visibility:hidden;'></span>";
						icon_delete = "<span class='imgbtn delete' style='visibility:hidden;'></span>";
					}
					var A=
					[
						"<div class='markImage' markid='"+data[k].id+"'>",
							"<div class='image'>",
								"<img class='thumbnail'  src='/service/frame/frameTag/thumbnail/"+data[k].id+"'/>",
								"<div class='buttons'>",
									icon_edit,
									"<span class='imgbtn play'></span>",
									"<span class='imgbtn saveto' style='display:none;'></span>",
									icon_delete,
								"</div>",
							"</div>",
							"<span class='title' style='background-color: "+Colors[data[k].level]+";'>"+data[k].name+"</span>",
							"<div class='cameraName'>"+data[k].cameraName+"</div>",
							"<div class='time'>"+Toolkit.formatDate(new Date(data[k].time))+"</div>",
						"</div>"
					];
					html=html+A.join("");
					if(k%5==4&&k<L-1)
					{
						html=html+"<br/>";
					}
				})(i);
			}
			return html;
		}
		/**
		 * [getFrameTagNames 获取帧标记名称数据，插入搜索匹配下下菜单里]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {[type]}   obj [description]
		 * @return {[type]}       [description]
		 */
		this.getFrameTagNames=function(obj, name){
			var self=this;
			if(self.SearchAjax)
			{
				self.SearchAjax.abort();
			}
			self.SearchAjax=jQuery.ajax({
				url: '/service/frame/frameTagNames/',
				dataType: 'json',
				type: 'get',
				data: {
					name:name,
					onlySelf:jQuery("#onlySelf").prop("checked")
				},
				success: function(res) {
					if (res && res.code === 200) {
						var tagNames=res.data.tagNames;
						var L=tagNames.length;
						var html="";
						for(var i=0;i<=L-1;i++)
						{
							html=html+"<li type='name' class='tagNamesList autolist'>"+tagNames[i].name+"</li>";
						}
						jQuery(html).insertAfter(jQuery("#MatchesList li:eq(0)"));

					} else if (res && res.code === 500) {
						notify.warn(res.data.message);
					} else {
						notify.warn('获取帧标记名失败！');
					}
					self.SearchAjax=null;
				}
			});
		}
		/**
		 * [showMatches 文本输入框，搜索结果匹配显示]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {[type]}   obj [description]
		 * @param  {[type]}   str [description]
		 * @return {[type]}       [description]
		 */
		this.showMatches=function(obj,str){
			var self=this;
			var html="<ul id='MatchesList' tabindex='0'>";
			html=html+"<li class='autolist' type='name'><span class='bold'>标记名称</span>：<span class='text'>"+str+"</span></li>";
			html=html+"<li class='autolist' type='cameraName'><span class='bold'>摄像机名称</span>：<span class='text'>"+str+"</span></li>";
			/*html=html+"<li class='autolist' type='cameraCode'><span class='bold'>摄像机编号</span>：<span class='text'>"+str+"</span></li>";*/
			html=html+"<li class='autolist' type='userName'><span class='bold'>创建人员</span>：<span class='text'>"+str+"</span></li>";
			/*html=html+"<li class='autolist' type='description'><span class='bold'>标记描述</span>：<span class='text'>"+str+"</span></li>";*/
			html=html+"</ul>";
			var x=obj.offset().left;
			var y=obj.offset().top;
			var h=obj.height();
			if(jQuery("#MatchesList")[0])
			{
				jQuery("#MatchesList").remove();
			}
			jQuery(document.body).append(html);
			//console.log(html);
			//console.log(jQuery("#MatchesList")[0]);
			jQuery("#MatchesList").css({
				left:x,
				top:y+h+14,
				zIndex:10
			}).show();
			self.getFrameTagNames(obj, str);
		}
		/**
		 * [init 初始化]
		 * @author huzc
		 * @date   2015-07-14
		 * @return {[type]}   [description]
		 */
		this.init=function(){
			var self=this;
			var condition={
				onlySelf:jQuery("#onlySelf").prop("checked"),
				name:"",
				currentPage:1,
				pageSize:15,
				url:"/service/frame/manageMent/frameTagNames/simple"
			};
			self.lastCondition=condition;
			self.getPages(condition);
		}
		/**
		 * [showSingleFrame 获取单个帧标记的数据,并且渲染帧标记信息]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {[type]}   id [description]
		 * @return {[type]}      [description]
		 */
		this.showSingleFrame=function(id){
			var self=this;
			var getHTML=jQuery.get("/module/framemark/inc/frame_mark.html");
			var FrameData=self.MarkList[id+""];
			var Colors=["red","orange","yellow","#00ccff","#e1e1e1"];
			var ColorsType=["red","orange","yellow","blue","gray"];
			var FrameInfo=
			{
				tag:
				{
					id:id,
					name:FrameData.name,
					bigurl:"/service/frame/frameTag/image/"+id,
					time:Toolkit.formatDate(new Date(FrameData.time)),
					modifyTime:Toolkit.mills2datetime(new Date()),
					color:Colors[FrameData.level],
					colorType:ColorsType[FrameData.level],
					level:FrameData.level,
					description:FrameData.description,
					cameraCode:FrameData.cameraCode,
					cameraName:FrameData.cameraName,
					userName:FrameData.userName,
					cameraOrgName:FrameData.cameraOrgName,
					cameraId:FrameData.cameraId
				}
			}

			jQuery.when(getHTML).done(function(data)
			{
				var template=Handlebars.compile(data);
				var html=template(FrameInfo);
				if(jQuery("#dom_Panel")[0]){
					jQuery("#dom_Panel").remove();
				}
				jQuery(document.body).append(html);
				parent.showHideMasker && parent.showHideMasker("show");
				var img= new Image();
				img.src=FrameInfo.tag.bigurl;

				if(self.userId!=FrameData.userId)
				{
					jQuery("#dom_Panel .leftPanel .button button.delete").attr("disabled","true");
					jQuery("#dom_Panel .leftPanel .button button.edit").attr("disabled","true");
                    jQuery("#dom_Panel .leftPanel .button button.save").attr("disabled","true");
				};
                //播放视频时，【入库】按钮不可用 2016.4.12  zhangming
                if(jQuery("#dom_Panel .leftPanel .button button.play").text()==="查看图片"){
                    jQuery("#dom_Panel .leftPanel .button button.save").attr("disabled","true");
                }
				setTimeout(function(){
					var w=img.width;
					var h=img.height;
					jQuery("#imageSize").html(w+"x"+h);
				},1000);

				if(self.renderComplete)
				{
					self.renderComplete();
					self.renderComplete=null;
				}
			});
		}
		/**
		 * [playHistoryRecord 帧标记页面实现播放历史录像]
		 * @author huzc
		 * @date   2015-07-14
		 * @return {[type]}   [description]
		 */
		this.playHistoryRecord=function(){
			var cameraId=jQuery("#cameraId").val();
			var Player = new VideoPlayer({
				uiocx:"MarkUIOCX",
				layout:1
			});
			var time=jQuery("#frameMarkTime").val();
			time=time.replace(/\-/g,"/");
			time=(new Date(time)).getTime();
			var beginTime=time-0.5*60*1000;
			var endTime=time+0.5*60*1000;

			var beginTime1=Toolkit.formatDate(new Date(beginTime));
			var endTime1=Toolkit.formatDate(new Date(endTime));
			//console.log(beginTime1)
			//console.log(endTime1);
			Player.getCameraDataById(cameraId,0,function(data){
				var channelId=Player.findcamid(data.cameraInfo);
				Player.getHistoryList(channelId,beginTime,endTime,function(videodata,Flag){
					if(Flag==false)
					{
						notify.warn("获取历史录像数据失败，请重试");
						return;
					}
					if(!videodata.videos.length){
						return;
					}
					var vodType=videodata.videos[0][2];
					Player.playHis(0,beginTime,endTime,vodType,videodata);
				});
			},5000);
		}
		/**
		 * [loadFrameTags 加载帧标记的标签]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {Function} fn [description]
		 * @return {[type]}      [description]
		 */
		this.loadFrameTags=function(fn){
			jQuery.ajax({
				type: "get",
				dataType: "JSON",
				url: "/service/frame/frameTagNames",
				data:{
					onlySelf:jQuery("#onlySelf").prop("checked")
				},
				success: function(res)
				{
					if(res.code==200)
					{
						if(typeof(fn)=="function")
						{
							fn(res.data);
						}
					}
					else
					{
						notify.warn(res.data.message);
					}
				}
			});
		}
		/**
		 * [getUser 获取当前用户信息的ajax封装]
		 * @author huzc
		 * @date   2015-07-14
		 * @param  {Function} fn [description]
		 * @return {[type]}      [description]
		 */
		this.getUser=function(fn){
			jQuery.ajax({
				type: "get",
				dataType: "JSON",
				url: "/service/usr/get_current_usr",
				data:{
				},
				success: function(res)
				{
					if(res.code==200)
					{
						if(typeof(fn)=="function")
						{
							fn(res.data);
						}
					}
					else
					{
						notify.warn(res.data.message);
					}
				}
			});
		}
		/**
		 * [frameTagCount 帧标记统计]
		 * @author huzc
		 * @date   2015-07-14
		 * @return {[type]}   [description]
		 */
		this.frameTagCount=function(){
			this.loadFrameTags(function(data){
				var tagNames=data.tagNames;
				var L=tagNames.length;
				var html="";
				for(var i=0;i<=L-1;i++)
				{
					var str=[
						"<div class='mark'>",
							"<span class='name'>"+tagNames[i].name+"("+tagNames[i].referCount+")</span>",
							"<span class='arrow'><img src='/module/framemark/images/mark-arrow.png'></span>",
						"</div>"
						].join("");
					html=html+str;
					//html=html+"<span class='tagcount' style=''>"+tagNames[i].name+"("+tagNames[i].referCount+")</span>";
				}
				jQuery(".frame-mark-names").html(html);
			});
		}
		/**
		 * [getLevels 获取帧标记级别存入数组]
		 * @author huzc
		 * @date   2015-07-14
		 * @return {[type]}   [description]
		 */
		this.getLevels=function(){
			var levels=[];
			jQuery("#framePanel .levels>span").map(function(index,node){
				if(jQuery(node).hasClass("checked"))
				{
					levels.push(jQuery(node).attr("level"));
				}
			});
			return levels;
		}

		this.rerender=function(){

		}
		/**
		 * [showTimeLine 显示时间轴，暂未使用]
		 * @author huzc
		 * @date   2015-07-14
		 * @return {[type]}   [description]
		 */
		this.showTimeLine=function(){
			var self=this;
			var Timeline1 = new window.Timeline();
			self.Timeline=Timeline1;
			Timeline1.init("canvas");

			Timeline1.on("mousewheel",function(obj){
				jQuery("#show-frame-small-picture").remove();
				var lastData=self.lastTimeLineData;
				var url=lastData.url;
				var type=lastData.type;
				var data=lastData.data;
				var Timeline1=self.Timeline;
				var timeRange=Timeline1.getTimeRange();
				data.endTime=Toolkit.formatDate(new Date(timeRange.end));
				data.beginTime=Toolkit.formatDate(new Date(timeRange.start));
				jQuery("#timeline #frameList").html("");
				self.Ajax(url,type,data,function(resdata){
					//console.log("resdata="+JSON.stringify(resdata));
					self.renderFrames(data.beginTime,data.endTime,resdata.tagNames);
				});
			});

			Timeline1.on("dragend",function(){
				//console.log("dragend");
				jQuery("#show-frame-small-picture").remove();
				setTimeout(function(){
					Timeline1.fireEvent("mousewheel",{});
				},100);
			});

			jQuery(".toLeft").on("click",function(){
				jQuery("#show-frame-small-picture").remove();
				jQuery(".Time_line").animate({left:-100},500,function()
				{
					Timeline1.MoveLeft();
					jQuery(".Time_line").css("left","0px");
					Timeline1.fireEvent("mousewheel",{});
				});
			});

			jQuery(".toRight").on("click",function(){
				jQuery("#show-frame-small-picture").remove();
				jQuery(".Time_line").animate({left:100},500,function()
				{
					Timeline1.MoveRight();
					jQuery(".Time_line").css("left","0px");
					Timeline1.fireEvent("mousewheel",{});
				});
			});
		}
		/**
		 * [bindEvents 绑定事件]
		 * @author huzc
		 * @date   2015-07-14
		 * @return {[type]}   [description]
		 */
		this.bindEvents=function()
		{
			var self=this;

			jQuery(window).on("load resize",function(){
				var w=jQuery("#major").width();
				jQuery("#timeline").css("width",w);
				jQuery("#frameList").css("width",w-60);
				jQuery("#canvas").css("width",w-60);
			});

			jQuery(window).trigger("resize");
			/**
			 * [format 事件格式化函数]
			 * @author huzc
			 * @date   2015-07-14
			 * @param  {[type]}   format [description]
			 * @return {[type]}          [description]
			 */
			Date.prototype.format = function(format)
			{
				var o =
				{
					"M+" : this.getMonth()+1, //month
					"d+" : this.getDate(), //day
					"h+" : this.getHours(), //hour
					"m+" : this.getMinutes(), //minute
					"s+" : this.getSeconds(), //second
					"q+" : Math.floor((this.getMonth()+3)/3), //quarter
					"S" : this.getMilliseconds() //millisecond
				}

				if(/(y+)/.test(format))
				{
				   format = format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
				}

				for(var k in o)
				{
					if(new RegExp("("+ k +")").test(format))
					{
					  format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
					}
				}
				return format;
			}
			//标记管理，更多按钮，展开面板
			jQuery(".label-manage .expand").on("click",function(){
				 if(jQuery(this).hasClass("expand1"))
				 {
					  jQuery(this).removeClass("expand1");
					  jQuery(this).addClass("expand2");
					  jQuery("#framePanel").hide();
					  jQuery(this).prev().html("高级");
				 }
				 else
				 {
					  jQuery(this).removeClass("expand2");
					  jQuery(this).addClass("expand1");
					  jQuery("#framePanel").show();
					  jQuery(this).prev().html("收起");
				 }
			});
			//搜索按钮代码
			jQuery("#searchdo").on("click",function(){
				var condition={
					beginTime:jQuery("#beginTime").val(),
					endTime:jQuery("#endTime").val(),
					name:jQuery("#name").val(),
					levels:self.getLevels().join(","),//jQuery("#level").val(),
					cameraName:jQuery("#cameraName").val(),
					cameraCode:jQuery("#cameraCode").val(),
					userName:jQuery("#userName").val(),
					description:jQuery("#description").val(),
					onlySelf:jQuery("#onlySelf").prop("checked"),
					currentPage:1,
					pageSize:15,
					url:"/service/frame/manageMent/frameTagNames",
					isNameLike:true
				};
				if (Toolkit.strToUnix(condition.beginTime) > Toolkit.strToUnix(condition.endTime)) {
					notify.warn("开始时间不能大于结束时间，请重新选择!");
					return;
				}
				self.lastCondition=condition;
				self.getPages(condition);
			});

			//输入框获得焦点
			jQuery("#framesearchText").on("focus",function(){
				var self=this;
				var val=jQuery(self).val().replace(/\s+/);
				var val=jQuery(self).val();
				if(val=="")
				{
					jQuery("#MatchesList").remove();
					return;
				}
				MarkerClass.showMatches(jQuery(self),val);
			});
			//输入框丢失焦点
			jQuery("#framesearchText").on("blur",function(){
				/*clearInterval(Timer);*/
				setTimeout(function(){
					jQuery("#MatchesList").remove();
				},200);
			});

			//键盘监听输入框，获取帧标记数据，并且分页显示
			jQuery("#framesearchText").on("keydown",function(evt){
				var val=jQuery(this).val();
				var ActiveLength=jQuery("#MatchesList li.active").length;
				//敲击回车的事件
				if(evt.keyCode==13) //所有都要搜
				{
					if(ActiveLength==1)
					{
						jQuery("#MatchesList li.active").trigger("click");
						return;
					}
					var condition={
						onlySelf:jQuery("#onlySelf").prop("checked"),
						name:val,
						currentPage:1,
						pageSize:15,
						url:"/service/frame/manageMent/frameTagNames/simple"
					};
					self.lastCondition=condition;
					self.getPages(condition);
					jQuery("#MatchesList").remove();
				}
			});

			//帧标记搜索
			jQuery(".mark-search button.search").off("click").on("click", function() {
				var origin = jQuery(this).val();
				var ActiveLength = jQuery("#MatchesList li.active").length;
				if (ActiveLength == 1) {
					jQuery("#MatchesList li.active").trigger("click");
					return;
				}
				var condition = {
					onlySelf: jQuery("#onlySelf").prop("checked"),
					name: origin,
					currentPage: 1,
					pageSize: 15,
					url: "/service/frame/manageMent/frameTagNames/simple"
				};
				self.lastCondition = condition;
				self.getPages(condition);
			});

			jQuery(document).on("keydown","#framesearchText",function(evt){
				var N=evt.keyCode;
				var index=jQuery("#MatchesList li.active").index();
				var L=jQuery("#MatchesList li").length;
				if(N==40)
				{
					if(index==-1||index==L-1)
					{
						showActive(0);
					}
					else
					{
						showActive(index+1);
					}
				}
				if(N==38)
				{
					index=index-1;
					if(index<0)
					{
						showActive(L-1);
						return;
					}
					showActive(index);
				}
			});

			jQuery("#framesearchText").watch({
				wait: 500,
				captureLength: 0,
				//监听的输入长度
				callback: function(key) {/*debugger*/
					key = key.replace("\'", "");
					if (key === "") {
						jQuery("#MatchesList").remove();
						return;
					}

					MarkerClass.showMatches(jQuery("#framesearchText"),key);
				}
			});

			 //,#MatchesList li .tagNamesList
			jQuery(document).on("click",".autolist",function(evt){
				evt.preventDefault();
				evt.stopPropagation();
				var text="";
				if(jQuery(this).hasClass("tagNamesList"))
				{
					text=jQuery(this).text();
				}
				else
				{
					text=jQuery(this).find(".text").text();
				}
				text=text.replace(/^\s+/gi,"").replace(/\s+$/gi,"");
				var condition={
					name:null,
					beginTime:null,
					endTime:null,
					level:null,
					cameraName:null,
					cameraCode:null,
					userName:null,
					description:null,
					currentPage:1,
					pageSize:15,
					onlySelf:false,
					url:"/service/frame/manageMent/frameTagNames"
				};
				var sType=jQuery(this).attr("type");
				condition[sType]=text;
				origin=text;
				jQuery("body input").val("");
				jQuery("#"+sType).val(text);
				jQuery("#MatchesList").remove();
				jQuery("#framesearchText").val(text);
				self.lastCondition=condition;

				self.getPages(condition);
			});

			jQuery("#tree_Panel .form-panel button.search").on("click",function(){
				var text=jQuery("#framesearchText").val();
			});

			// 日期控件 带时分秒
			jQuery(".label-manage").on('focus', '.input-time', function() {
				var self = this;
				jQuery(self).datetimepicker({
					showSecond: true,
					dateFormat: 'yy-mm-dd',
					timeFormat: 'HH:mm:ss',
					timeText: '',
					hourText: ' 时:',
					minuteText: ' 分:',
					secondText: ' 秒:',
					showAnim: ''
				}).datetimepicker('show');
			});

			jQuery("#framePanel ul>li .color").on("click",function(){
				jQuery(this).prev().trigger("focus");
			});

			//帧标记业务代码
			jQuery(document).on("click","#dom_Panel #dialog img.frame-close",function(){
				var N=jQuery(".UIOCX.Mark")[0].Stop(true,0);
				jQuery("#dom_Panel").remove();
				jQuery(".marker_Levelcolor").remove();
				parent.showHideMasker && parent.showHideMasker("hide");
			});

			jQuery(document).on("click","#dom_Panel .leftPanel .button button.edit",function(){
				jQuery(this).css("background-color","#49a3ff");
				jQuery(this).css("color","#ffffff");
				jQuery(this).html("保存标记");
				jQuery(this).addClass("saveframe");
				jQuery("#dom_Panel .leftPanel .content #pre_name").remove();
				jQuery("#dom_Panel .description .desdata #pre_description").remove();
				jQuery("#dom_Panel .leftPanel .content input#frameName").show();
				jQuery("#dom_Panel .description .desdata #description").show();
			});

			jQuery(document).on("keydown","#dom_Panel .leftPanel #marker_Level",function(evt){
				evt.preventDefault();
				evt.stopPropagation();
			});

			jQuery(document).on("click","#dom_Panel .leftPanel #marker_Level",function()
			{
				if(!jQuery("#dom_Panel .leftPanel .button button.edit").hasClass("saveframe"))
				{
				   return;
				}
				var html=[
				   "<div class='marker_Levelcolor' tabindex='0' tabIndex='0'>",
				   "<div class='red' level='0'>&nbsp;</div>",
				   "<div class='orange' level='1'>&nbsp;</div>",
				   "<div class='yellow' level='2'>&nbsp;</div>",
				   "<div class='blue' level='3'>&nbsp;</div>",
				   "<div class='gray' level='4'>&nbsp;</div>",
				   "</div>"
				].join("");

			   var x=jQuery(this).offset().left;
			   var y=jQuery(this).offset().top;
			   var w=jQuery(this).offset().width;
			   if(!jQuery(".marker_Levelcolor")[0]){
				   jQuery(document.body).append(html);
			   }

			   jQuery(".marker_Levelcolor").css({
				 "position":"absolute",
				 "width":50,
				 "height":90,
				 "left":x,
				 "top":y+20,
				 "display":"block",
				 "border-radius":"3px"
			   });
			   jQuery(".marker_Levelcolor").focus();
			});

		   jQuery(document).on("blur",".marker_Levelcolor",function(){
				setTimeout(function(){
					jQuery(".marker_Levelcolor").hide();
				},100);
		   });
		   //选择颜色
		   jQuery(document).on("click",".marker_Levelcolor > div",function(evt){
				evt.preventDefault();
				evt.stopPropagation();
				jQuery(".marker_Levelcolor").hide();
				var color=jQuery(this).css("background-color");
				jQuery("#dom_Panel .leftPanel #marker_Level").css("background-color",color);
				var level=jQuery(this).attr("level");
				//jQuery("#marker_Level").val(level);
				jQuery("#dom_Panel .leftPanel #marker_Level").attr("level",level);
				jQuery("#dom_Panel .leftPanel #marker_Level")[0].style.backgroundColor=color;

		   });

			//保存帧标记信息
			jQuery(document).on("click","#dom_Panel .leftPanel button.saveframe",function(){
				var channelId=0;//要定义
				var id=jQuery("#frameid").val();
				var level=jQuery("#marker_Level").attr("level");
				var tagName=jQuery("#dialog #frameName").val();
				var description=jQuery("#dialog #description").val();
				var jqself=this;

				jQuery.ajax({
					url: '/service/frame/frameTag/'+id,
					dataType: 'json',
					type: 'post',
					data: {
						level: level,
						name: tagName,
						description: description,
						_method:"put"
					},
					success: function(res) {
						if (res && res.code === 200) {
							notify.success('修改帧标记成功！');
							logDict.insertMedialog("m1", "修改"+ tagName + "帧标记成功", "f1", "o2");
							jQuery(jqself).removeClass("saveframe");
							self.getPages(self.lastCondition);
							self.frameTagCount();

						} else if (res && res.code === 400) {
							notify.warn(res.data.message);
						} else {
							notify.warn('修改帧标记失败！');
						}
					}
				});
			});
			//帧标记详情页信息对话框，查看图片或者播放对应的历史录像片段
			jQuery(document).on("click","#dom_Panel .leftPanel .button button.play",function(){
				//jQuery("#dom_Panel #dialog img.frame-close").trigger("click");
				//播放历史录像
				var id=jQuery("#frameid").val();
				id=id.replace(/^framemark_/gi,"");
				var text=jQuery(this).html();
				if(text=="查看录像")
				{   
					if(!permission.klass["view-history"]){
					   jQuery(this).html("查看图片");
                       return notify.warn("没有历史录像查看权限");
				    }
					var H=jQuery("#dom_Panel .rightPanel .content").height();
					jQuery("#dom_Panel .rightPanel .content img").hide();
					self.playerShow();
					jQuery(".UIOCX.Mark").css({
						width:"100%",
						height:474
					});
					setTimeout(function(){
						self.playHistoryRecord();
					},1000);
					jQuery(this).html("查看图片");
                    //播放视频时，【入库】按钮不可用 2016.4.12  zhangming
                        jQuery("#dom_Panel .leftPanel .button button.save").attr("disabled","true");
				}
				else
				{
					jQuery("#dom_Panel .rightPanel .content img").show();
					setTimeout(function(){
						self.playerHide();
					},10);
					jQuery(".UIOCX.Mark")[0].Stop(false,0);
					jQuery(this).html("查看录像");
                    //显示图片时，【入库】按钮可用 2016.4.12  zhangming
                    if(self.userId==self.MarkList[id+""].userId)
                    {
                        jQuery("#dom_Panel .leftPanel .button button.save").removeAttr("disabled");
                    };

				}
			});

			jQuery(document).on("click","#dom_Panel .leftPanel .button button.save",function(){
                //调用PVB入库方法    2016.4.12 zhangming  begin
              require(["pvbEnterLib"],function(EnterLib){
                  var id=jQuery("#frameid").val();
                  var tagName=jQuery("#dialog #name").val();
                  var filePath=self.MarkList[id+""].imagePath;
                  var description=jQuery("#dialog #description").val();
                  var imgObj = {
                      type: "img",
                      filePath: filePath,
                      resourceObj:{
                          fileName:tagName,
                          fileDesc:description,
                          showFrameMarkImgPath:jQuery("#dialog img").attr("src")
                      }
                  };
                  EnterLib.init(imgObj);
              })
                //调用PVB入库方法    2016.4.12 zhangming  end
			});
			//删除帧标记
			jQuery(document).on("click","#dom_Panel .leftPanel .button button.delete",function(){
				var id=jQuery("#frameid").val();
				var name=jQuery("#frameName").val();
				id=id.replace(/^framemark_/gi,"");
				var win=new ConfirmDialog({
					title: '操作提示',
					classes: 'delete-dialog',
					width: 300,
					/*warn: true,*/
					message: "删除之后不可恢复，请确认是否删除？",
					confirmText: '确定',
					callback: function()
					{
						self.deleteFrameMark(id,function(res){
							jQuery("#dom_Panel #dialog img.frame-close").trigger("click");
							logDict.insertMedialog("m1", "删除" + name + "帧标记成功!", "f1", "o3");
							notify.success('删除帧标记成功！');
							self.getPages(self.lastCondition);
							self.frameTagCount();
						});
						return true;
					}
				});
			});
			//帧标记列表，查看帧标记详情信息，点击弹出浮动层对话框
			jQuery(document).on("click","#frameMarkList .button.explorer",function(){
				var id=jQuery(this)[0].parentNode.parentNode.getAttribute("id");
				id=id.replace(/^framemark_/gi,"");
				self.showSingleFrame(id);
			});
			//帧标记列表，编辑帧标记详情信息，点击弹出浮动层对话框
			jQuery(document).on("click","#frameMarkList .button.edit",function(){
				jQuery(this).prev().trigger("click");
				self.renderComplete=function()
				{
					jQuery("#dom_Panel .leftPanel .button button.edit").trigger("click");
				}
			});
			//帧标记列表，播放帧标记历史录像，点击弹出浮动层对话框
			jQuery(document).on("click","#frameMarkList .button.play",function(){
				jQuery(this).prev().prev().trigger("click");
				self.renderComplete=function()
				{
					//jQuery("#dom_Panel .leftPanel .button button.edit").trigger("click");
					jQuery("#dom_Panel .leftPanel .button button.play").trigger("click");
				}
			});

			jQuery(document).on("click","#frameMarkList .button.saveto",function(){
				notify.info("暂不支持");
			});
			//删除帧标记
			jQuery(document).on("click","#frameMarkList .button.delete",function(){
				var id=jQuery(this)[0].parentNode.parentNode.getAttribute("id");
				id=id.replace(/^framemark_/g,"");
				var frameName = jQuery(this).closest('tr').find(".title").text();

				var win=new ConfirmDialog({
					title: '操作提示',
					classes: 'delete-dialog',
					width: 300,
					/*warn: true,*/
					message: "删除之后不可恢复，请确认是否删除？",
					confirmText: '确定',
					callback: function()
					{
						self.deleteFrameMark(id,function(res){
							notify.success('删除帧标记成功！');
							logDict.insertMedialog("m1", "删除" + frameName+ "帧标记成功!", "f1", "o3");
							self.getPages(self.lastCondition);
							self.frameTagCount();
						});
						return true;
					}
				});
			});

			//切换到列表模式
			jQuery("#listMode").on("click",function(){
				jQuery("#frameMarkList").show();
				jQuery("#frameImageList").hide();
				//高亮自己
				jQuery(this).find("span.list").css({
					"background-position": "-155px -33px"
				}).next().css({
					"font-weight": "bold"
				});
				//低亮别人
				jQuery(this).next().find("span.icon").css({
					"background-position": "-185px -3px"
				}).next().css({
					"font-weight": "normal"
				});
			});

			//切换到图片模式
			jQuery("#imageMode").on("click",function(){
				jQuery("#frameImageList").show();
				jQuery("#frameMarkList").hide();
				//高亮自己
				jQuery(this).find("span.icon").css({
					"background-position": "-185px -33px"
				}).next().css({
					"font-weight": "bold"
				});
				//低亮别人
				jQuery(this).prev().find("span.list").css({
					"background-position": "-155px -3px"
				}).next().css({
					"font-weight": "normal"
				});
			});

			//点击图片，弹出预览框
			jQuery(document).on("click","#frameImageList .markImage",function(){
				var id=jQuery(this).attr("markid");
				jQuery("#framemark_"+id+" td:last>span:first").trigger("click");
			});

			//经过图片，设置样式
			jQuery(document).on("mouseover","#frameImageList .markImage .image",function(){
				jQuery(this).children(".buttons").show();
				jQuery(this).find(".thumbnail").css({
					position:"relative",
					width: 166,
					height: 126,
					left: -3,
					top:-3
				});
			});

			//离开图片，设置样式
			jQuery(document).on("mouseout","#frameImageList .markImage .image",function(){
				jQuery(this).children(".buttons").hide();
				jQuery(this).find(".thumbnail").css({
					position:"relative",
					width: 160,
					height: 120,
					left: 0,
					top:0
				});
			});

			//编辑该帧标记
			jQuery(document).on("click","#frameImageList .markImage .edit",function(evt){
				evt.preventDefault();
				evt.stopPropagation();
				var id=jQuery(this).parents(".markImage").attr("markid");
				jQuery("#framemark_"+id+" td:last>span:eq(1)").trigger("click");
			});

			//播放帧标记对应的视频
			jQuery(document).on("click","#frameImageList .markImage .play",function(evt){
				evt.preventDefault();
				evt.stopPropagation();
				var id=jQuery(this).parents(".markImage").attr("markid");
				jQuery("#framemark_"+id+" td:last>span:eq(2)").trigger("click");
			});
			//修改帧标记信息后保存
			jQuery(document).on("click","#frameImageList .markImage .saveto",function(evt){
				evt.preventDefault();
				evt.stopPropagation();
				var id=jQuery(this).parents(".markImage").attr("markid");
				jQuery("#framemark_"+id+" td:last>span:eq(3)").trigger("click");
			});

			//删除帧标记
			jQuery(document).on("click","#frameImageList .markImage .delete",function(evt){
				evt.preventDefault();
				evt.stopPropagation();
				var id=jQuery(this).parents(".markImage").attr("markid");
				jQuery("#framemark_"+id+" td:last>span:eq(4)").trigger("click");
			});

			jQuery(document.body).css({
				"overflow":"auto"
			});

			jQuery(document).css({
				"overflow":"auto"
			});

			// var currentNode=jQuery("#frameImageList .markImage[markid='"+currentId+"']");
			// var prev=jQuery("#frameImageList .markImage[markid='"+currentId+"']").prev();
			// if(prev[0])
			// {
			// 	jQuery("#dom_Panel #dialog img.frame-close").trigger("click");
			// 	prev.trigger("click");
			// }
			//上一个帧标记
			jQuery(document).on("click","#dom_Panel .rightPanel .content .prev",function(){
				var currentId=jQuery("#frameid").val();
				var currentNode=jQuery("#frameImageList .markImage[markid='"+currentId+"']");
				var prev=jQuery("#frameImageList .markImage[markid='"+currentId+"']").prev();
				if(!prev[0]){return;}
				var previd=prev.attr("markid");
				previd=previd.replace(/^framemark_/gi,"");
				self.showSingleFrame(previd);
			});
			//下一个帧标记
			jQuery(document).on("click","#dom_Panel .rightPanel .content .next",function(){
				var currentId=jQuery("#frameid").val();
				var currentNode=jQuery("#frameImageList .markImage[markid='"+currentId+"']");
				var next=jQuery("#frameImageList .markImage[markid='"+currentId+"']").next();
				if(!next[0]){return}
				var nextid=next.attr("markid");
				nextid=nextid.replace(/^framemark_/gi,"");
				self.showSingleFrame(nextid);
			});

			jQuery(document).on("click","#dom_Panel .leftPanel .button .more",function(evt){
				var x=jQuery(this).offset().left;
				var y=jQuery(this).offset().top;
				jQuery("#dom_Panel .leftPanel .button .moredo").show();
				jQuery("#dom_Panel .leftPanel .button .moredo").focus();
			});

			jQuery(document).on("blur","#dom_Panel .leftPanel .button .moredo",function(){
				jQuery(this).hide();
			});
			//帧标记图片模式-查看图片按钮
			jQuery(document).on("click","#dom_Panel .leftPanel .button .lookpicture",function(){
				jQuery("#dom_Panel .rightPanel .content img").show();
				//jQuery(".UIOCX").hide();
				self.playerHide();
				jQuery("#dom_Panel .leftPanel .button .moredo").hide();
			});
			//帧标记图片模式-播放历史录像
			jQuery(document).on("click","#dom_Panel .leftPanel .button .recordList",function(){
				jQuery("#dom_Panel .rightPanel .content img").hide();
				//jQuery(".UIOCX").show();
				self.playerShow();
				jQuery("#dom_Panel .leftPanel .button .moredo").hide();
				self.playHistoryRecord();
			});

			jQuery(document).on("click","#dom_Panel .leftPanel .button .moreRecord",function(){
				jQuery("#dom_Panel .leftPanel .button .moredo").hide();
				var currentId=jQuery("#frameid").val();
				var cameraId=jQuery("#cameraId").val();

				var time=jQuery("#frameMarkTime").val();
				time=time.replace(/\-/g,"/");
				time=(new Date(time)).getTime();
				var beginTime=time-5*60*1000;
				var endTime=time+5*60*1000;
				window.opener.focus();

				var ParentPlayer=window.opener.gVideoPlayer;
				ParentPlayer.getCameraDataById(cameraId,0,function(data){
					var channelId=Player.findcamid(data.cameraInfo);
					ParentPlayer.getVideos(channelId,beginTime,endTime,function(videodata,Flag){
						if(Flag==false){return}
						var vodType=videodata.videos[0][2];
						ParentPlayer.playHis(0,beginTime,endTime,vodType,videodata);
					});
				},5000);
			});

			jQuery("#onlySelf").on("click",function(){
				var Flag=jQuery(this).prop("checked");
				self.lastCondition.onlySelf=Flag;
				self.getPages(self.lastCondition);
				self.frameTagCount();
			});

			jQuery("#searchcancel").on("click",function(){
				jQuery("#framePanel").find("input").val("");
				jQuery("#framePanel").find("span.checkbox").removeClass('checked');
			});
			//点击标记名，右侧显示标记列表
			jQuery(document).on("click",".ShowframeName .mark span.name",function(){
				var text=jQuery(this).html().replace(/\(\d+\)$/gi,"");
				origin=text;
				jQuery("body input#framesearchText").val("");
				jQuery("#framesearchText").val(text);
				jQuery("#name").val(text);
				var condition={
					onlySelf:jQuery("#onlySelf").prop("checked"),
					name:text,
					currentPage:1,
					pageSize:15,
					url:"/service/frame/manageMent/frameTagNames"
					//isNameLike:true
				};
				self.lastCondition=condition;
				self.getPages(condition);
				setTimeout(function(){
					jQuery("#MatchesList").remove();
				},100);
			});

			var showActive=function(n){
				var L=jQuery("#MatchesList li").length;
				jQuery("#MatchesList li").removeClass("active");
				if(n=="first"){n=0};
				if(n=="last"){n=L-1};
				jQuery("#MatchesList li:eq("+n+")").addClass("active");
				jQuery("#MatchesList li:eq("+n+")").focus();
			}

			/*jQuery(document).on("keydown","#MatchesList li",function(evt){
				var N=evt.keyCode;
				var index=jQuery("#MatchesList li.active").index();
			});*/

			jQuery(document).on("click","span.checkbox",function(evt){
				if(jQuery(this).hasClass("checked"))
				{
					jQuery(this).removeClass("checked");
				}
				else
				{
					jQuery(this).addClass("checked");
				}
			});
			//鼠标掠过帧标记，和时间轴有关，该代码已经弃用
			jQuery(document).on("mouseover","#timeline #frameList .framepoint",function(){
				var markid=jQuery(this).attr("markid");
				var markdata=self.MarkList[markid];
				//console.log("markdata="+JSON.stringify(markdata));
				var url="/service/frame/frameTag/thumbnail/"+markid;
				var time=Toolkit.formatDate(new Date(markdata.time));
				var x=jQuery(this).offset().left-67;
				var y=jQuery(this).offset().top-120;
				var Colors=["red","orange","yellow","#00ccff","#e1e1e1"];
				var html=[
				"<div id='show-frame-small-picture' tabindex='0' markid='"+markid+"'>",
					"<div class='show-frame-content'>",
					"<span class='frameText' style='background-color:"+Colors[markdata.level]+";'>"+markdata.name+"</span>",
					"<img src='"+url+"'/>",
					"<div class='frameTime'>"+time+"</div>",
					"</div>",
				"</div>"].join("");
				//console.log([x,y]);

				if(jQuery("#show-frame-small-picture")[0])
				{
					jQuery("#show-frame-small-picture").remove();
				}
				jQuery(document.body).append(html);
				jQuery("#show-frame-small-picture").css({
					left:x,
					top:y,
					display:"block"
				}).focus();
			});

			jQuery(document).on("click","#show-frame-small-picture",function(evt){
				evt.preventDefault();
				evt.stopPropagation();
				jQuery("#show-frame-small-picture").focus();
			});

			jQuery(document).on("click","#show-frame-small-picture img",function(evt){
				evt.preventDefault();
				evt.stopPropagation();
				jQuery("#show-frame-small-picture").focus();
				var markid=jQuery("#show-frame-small-picture").attr("markid");
				self.showSingleFrame(markid);
			});

			jQuery(document).on("blur","#show-frame-small-picture",function(){
				setTimeout(function(){
					jQuery("#show-frame-small-picture").remove();
				},100);
			});
			//页面加载完或者设置大小，重新定位右侧样式
			jQuery(window).on("load resize",function(){
				try {
					var top=jQuery("#rightContent").offset().top;
					var H=jQuery(window).height();
					jQuery("#rightContent").css({
						width:"100%",
						border:"solid 0px blue",
						overflow:"auto",
						"overflow-x":"hidden",
						height:(H-top)
					});
				} catch(e) {}
			});
		}
	};
	var FrameMarker=new _FrameMarker();
	setTimeout(function(){
		FrameMarker.initialize();
	}, 1000);

	return FrameMarker;
});
