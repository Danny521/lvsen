/*global FloatDialog:true,notify:true,OrgTree:true,FuncTree:true,RoleTable:true,CameraTree:true,AutoComplete:true,GridTree:true ,$jit:true*/

define(["domReady",
	"js/defense-line",
	"js/mapmgr",
	"js/config",
	"settings/common/tool/camera-tree",
	"ajaxModel",
	"/module/maintenance/registrationManage/js/global-varibale.js",
	"/lbsplat/component/business/clusterlayer/cluster-layer-view.js",
	"jquery.watch",
	"base.self",
	// "jquery-ui-timepicker-addon"
	'jquery',
	"jquery-ui",
	'jquery.datetimepicker'
	// "/lbsplat/libs/jquery/jquery-1.10.2.min.js",
	// "/lbsplat/libs/jquery/jquery-ui.js",
	// "/lbsplat/libs/jquery/jquery.datetimepicker.js"
	], function(domReady,EleDefenseLineMgr,MapMgr,mapSettings,Camera,ajaxModel,global,Cluster) {

	domReady(function() {
		// 高亮二级菜单
		jQuery("#header .menu a[data-target='mapconfig']").addClass("active").siblings().removeClass("active");

		function checkAdmin(){
			if(jQuery("#userEntry").data("loginname") == 'admin' || jQuery("#userEntry").data("loginname") == null){
				return 1;
			}else{
				return jQuery("#userEntry").attr("data-orgid");
			}
		};

		//分页处理
		function loadPageData(data) {
			// type转换
			Handlebars.registerHelper("changeType", function(value) {
				// if (value == "1") {
				// 	return "新增";
				// }
				switch(value)
				{
					case 1:
						return "新增";
						break;
					case 2:
						return "编辑";
						break;
					case 3:
						return "导入";
						break;
					case 4:
						return "删除";
						break;
				}
			});

			debugger
			var tableBodyTpl = "/module/settings/mapconfig/inc/markRecordTableTpl.html";
			var outData = data.data.rows;
			global.loadTemplate(tableBodyTpl, function (compiler) {
				var htmlStr = compiler({
					"dataList": true,
					"data": outData
				});
				$("#contentTable").append(htmlStr);
			});
			if(data.data.totalCount <= 0){
				//隐藏分页
				$(".pagination").empty();
			}else{
				$(".pagination").pagination(data.data.totalCount, {
					items_per_page: 10,
					num_display_entries: 2,
					num_edge_entries: 1,
					callback: function (pageIndex) {
						var param = {
							currentPage: pageIndex + 1,
							pageSize: 10,
							type:$(".selType .item.active").attr("data-type"),
							startTime:$("#startTimebreakdown").val(),
							endTime:$("#endTimebreakdown").val(),
							userName:$("#markPerson").val(),
							cameraName:$("#markCamera").val()
						};
						$.ajax({
							url:"/service/map/history/list",
							type:"post",
							data:param,
							success:function(data){
								if(data && data.code === 200){
									//清空旧的数据，再渲染模板
									$(".tableP").find('#contentTable').children().remove(".tdTitle,.noTitle").end();
									global.loadTemplate(tableBodyTpl, function (compiler) {
										var htmlStr = compiler({
											"dataList": true,
											"data": data.data.rows
										});
										$("#contentTable").append(htmlStr);
									});
								}else{
									//notify.warn("！");
								}
							}
						});
					}
				});
			}
		}

		 function loadTableData(rParms) {
             debugger
			 $.ajax({
				 url:"/service/map/history/list",
				 type:"post",
				 data:rParms,
				 success:function(data){
					 if(data && data.code === 200){
						 $(".tableP").find('#contentTable').children().remove(".tdTitle,.noTitle").end();
						 loadPageData(data)
					 }else{
						 //notify.warn("！");
					 }
				 }
			 });
		};

		// 页面初始化
		(function init() {
			// 请求模板
			ajaxModel.getTml("/module/settings/mapconfig/inc/map-config.html").then(function(text){
				mapSettings.template = Handlebars.compile(text);
			});

			// gismap
			mapSettings.mapMgr = new MapMgr();
			// 电子防线
			// mapSettings.eleDefenseLineMgr = new EleDefenseLineMgr();
			// 创建左侧的摄像机树
			mapSettings.cameraTree = new Camera({

				"node": "#leftTreePanel",

				// "extraParams":{
				// 	isRoot:window.sysConfig.getResMode()
				// },
				"orgId": checkAdmin(),

				"leafClick": function(el, event) {

					var li = el.closest("li");

					var camera = {
						"id": li.attr("data-id"),
						"name": li.attr("data-name"),
						"lon": li.attr("data-lon"),
						"lat": li.attr("data-lat"),
						"angle": li.attr("data-angle"),
						"cameraCode":li.attr("data-code"),
						"zoom":li.attr("data-zoom"),
						"isSynced":li.attr("data-sync") === "true",
						"score":li.attr("data-camerascore")
					};

					//如果摄像机分数大于用户分数，这个用户不能标注该摄像机  bug#46583
					var userScore = jQuery("#userEntry").data("score");
					if(camera.score > parseInt(userScore)){
						notify.warn("暂无权限访问该摄像机");
						return;
					}
					// camera.lon = "13461198.930737501";
					// camera.lat = "3663097.063535105";
					var follower = jQuery("#follower");
					if (camera.lon && camera.lat) {
						if (follower.length >= 0) {
							follower.hide();
						}
						mapSettings.mapMgr.showCamera(camera, li);
						//已经标注过的摄像机，不显示保存，只显示重新标注
						//window.alreadyMarked = 1;
					} else {

						// 同步上来的摄像机不可编辑坐标
						if(camera.isSynced){
							notify.info("此摄像机是同步数据，不可更改坐标");
							return ;
						}

						var className = "drag-helper-icon";
						if (li.children("i.leaf").hasClass("dom")) {
							className = "drag-helper-icon-alt";
						}

						if (follower.length === 0) {
							follower = jQuery("<div id='follower' class='" + className + "'></div>");
							jQuery("body").append(follower);
						} else {
							follower.removeClass("drag-helper-icon").removeClass("drag-helper-icon-alt").addClass(className);
						}

						follower.css({
							"top": event.clientY + 12,
							"left": event.clientX + 12
						}).show();

						jQuery("#content").unbind("mousemove").bind("mousemove",function(evt) {
							follower.css({
								"top": evt.clientY + 12,
								"left": evt.clientX + 12
							});
						});

						if(NPMapLib.MAP_EVENT_MOUSE_MOVE){
							PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_MOUSE_MOVE);
						}
						PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_MOUSE_MOVE, function(point, mouseevent) {
							if(jQuery(".map-tool-fullscreen").is(":hidden")){
								// follower.css({
								// 	"top": mouseevent.y + 12+38,
								// 	"left": mouseevent.x + 12
								// });
								follower.css({
									"top": mouseevent.clientY  + 12,
									"left": mouseevent.clientX  + 12
								});
							}else{
								// follower.css({
								// 	"top": mouseevent.y + 12 +135,
								// 	"left": mouseevent.x + 12 + 280
								// });
								follower.css({
									"top": mouseevent.clientY + 12,
									"left": mouseevent.clientX + 12
								});
							}
						});

						// 右键取消(点位标注跟随图标)
						jQuery("#content").unbind("mousedown").bind("mousedown",function(e) {
							if (e.button === 2) {
								jQuery("#content").unbind("mousedown");
								jQuery("#content").unbind("mousemove");
								follower.hide();
								PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
								// if (NPMapLib.MAP_EVENT_MOUSE_MOVE) {
								// 	PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_MOUSE_MOVE);
								// 	follower.hide();
								// }
							}

						});

						PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
						PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK, function(point) {
							// 取消左键点击事件
							PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
							PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_MOUSE_MOVE);
							follower.hide();
							// 取消右击事件
							PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
							// self.options.drawtool.cancel()
						});

						mapSettings.mapMgr.addCamera(camera, li);
					}

				}
			});
			//搜索按钮点击事件
			jQuery("#searchBtn").bind("click", function(event) {
				var key = jQuery("#searchInput").val().trim();
				debugger
				mapSettings.cameraTree.search({
					queryKey: key,
					isMarked: jQuery(".markStatus option:selected").val()
				});
				return false;
			});

			jQuery("#searchInput").watch({
				wait: 500,
				captureLength: 0,
				//监听的输入长度
				callback: function(key) {
					mapSettings.cameraTree.search({
						queryKey: jQuery.trim(key),
						isMarked: jQuery(".markStatus option:selected").val()
					});
				}
			});

			//option切换监听
			jQuery(".markStatus").on("change",function(){
				debugger
				var markSel = jQuery(".markStatus option:selected").val()
				if(markSel == "0"){
					jQuery('.statistics .offline-statistic').show().siblings().not(".use").hide();
					jQuery('.statistics .offline-statistic').css("display","inline-block");
				}else if(markSel == "1"){
					jQuery('.statistics .online-statistic').show().siblings().not(".use").hide();
				}else{
					jQuery('.statistics .online-statistic,.statistics .all-statistic').show();
					jQuery('.statistics .offline-statistic').not(".use").hide();
				}
				var key = jQuery("#searchInput").val().trim();
				if(key===""){
					return;
				}
				mapSettings.cameraTree.search({
					queryKey: key,
					isMarked: jQuery(".markStatus option:selected").val()
				});
				return false;
			})

			//地图标注，标注记录table切换
			jQuery(document).on("click","#aside .tab-panel .tab-header div",function(){
				debugger
				jQuery(this).addClass("select").siblings().removeClass("select");
				var sel = jQuery(this).attr("data-hview");
				if(sel == "mark"){
					jQuery("#mark").addClass("active");
					jQuery("#record").removeClass("active");
					jQuery("#major").css({
						"position": "absolute",
						"left": "280px",
						"right": "0px"
					});//右侧
					jQuery("#major2").css({
						"display": "none"
					});//右侧
				}else{
					jQuery("#record").addClass("active");
					jQuery("#mark").removeClass("active");
					jQuery("#major").css({
						"position": "absolute",
						"left": "-2000px",
						"right": "2000px"
					});//
					jQuery("#major2").css({
						"display": "block"
					});//
				}
			});

			jQuery(document).on("click",".batchImport:not('.disabled')",function(){
				var node = jQuery(this);
				require(["/module/settings/mapconfig/js/visible-area-controller.js"], function(Controller){
					Controller.init();
					node.addClass("disabled");
				});
			});

			// 高级按钮搜索
			jQuery("#advanceSearch").bind("click", function(event) {
				jQuery("#aside div.normal-search-panel").hide();
				jQuery("#aside div.advance-search-panel").show().find("#cameraName").val("");
				jQuery("#aside .tree-container").css("top", "120px");
				return false;
			});

			// 高级面板-搜索[Yes]
			jQuery("#advSearch").bind("click", function(event) {
				var name = jQuery("#aside div.advance-search-panel #cameraName").val().trim();
				mapSettings.cameraTree.search({
					queryKey: name,
					isMarked: jQuery("#markStatus option:selected").val()
				});
				return false;
			});

			jQuery("#aside div.advance-search-panel #cameraName").watch({
				wait: 500,
				captureLength: 0,
				//监听的输入长度
				callback: function(key) {
					mapSettings.cameraTree.search({
						queryKey: jQuery.trim(key),
						isMarked: jQuery("#markStatus option:selected").val()
					});
				}
			});

			//屏蔽地图右键
			jQuery("#mapId > div.olMapViewport").bind('contextmenu', function() {
				return false;
			});

			// 权限控制相关
			window.updateThirdNav && window.updateThirdNav();
			permission && permission.reShow();
			/*
			debugger
			//加载聚合图层
			require(['/lbsplat/component/business/clusterlayer/cluster-layer-view.js'], function(ClusterLayer){
				debugger
				ClusterLayer.init({
					map: PVAMap.options.map,
					clusterConfig: {
						//摄像机
						camera: true,
						//卡口
						bayonet: false,
						//灯杆
						lightbar: false,
						//警车
						policecar: false
					}
				});
			});
			jQuery(document).on("click", "#mapC", function() {
				debugger
				var isChecked = jQuery(this).prop("checked");
				if(isChecked){
					//显示摄像机资源图层
					Cluster.showOrHideResource("camera",true);
				}else{
					//隐藏摄像机资源图层
					Cluster.showOrHideResource("camera",false);
				}
			});

			//鼠标移入移出
			jQuery(".select").mouseenter(function(){
				//选择直系子元素 >
				var childrens = jQuery("#leftTreePanel > ul > li > ul").children();
				var lis = [];
				for (i=0;i<childrens.length;i++){
					var obj = {};
					obj.id = childrens[i].dataset.id;
					obj.name = childrens[i].dataset.name;
					lis.push(obj);
				}
				console.log(lis);
				var liOffice = "/module/settings/mapconfig/inc/liOffice.html";
				global.loadTemplate(liOffice, function (compiler) {
					var htmlStr = compiler({
						"data": lis
					});
					var all = "<li style='height: 25px;text-align:left;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;' title='全部' data-id='0' data-name='全部'><input id='mapC' checked='true'  name='org' style='position: relative;top:2px;margin: 0px 5px 0px 5px;' type='checkbox'>全部</li>"
					jQuery(".map-tool-item .map-resource-list").append(all);
					//jQuery(".map-tool-item .map-resource-list").append(htmlStr);
				});
				jQuery(".map-tool-item .map-resource-list").show();
			});
			jQuery(".select").mouseleave(function(){
				jQuery(".map-tool-item .map-resource-list").empty();
				jQuery(".map-tool-item .map-resource-list").hide();
			});
            */


			// 时间控件
			require(['/libs/jquery/jquery-ui-timepicker-addon.js'], function() {
				$('.time').datetimepicker({
					showSecond: true,
					dateFormat: 'yy-mm-dd',
					timeFormat: 'HH:mm:ss',
					timeText: '',
					hourText: ' 时',
					minuteText: ' 分',
					secondText: ' 秒',
					showAnim: ''
				});
			});

			//$("#startTimebreakdown").attr("placeholder",Toolkit.getCurMonth());
			//$("#endTimebreakdown").attr("placeholder",Toolkit.getCurDate());

			//option点击监听
			jQuery(".item").on("click",function(){
				debugger
				$(this).addClass("active").siblings().removeClass("active");

			})
			debugger
            //渲染表格内容
            //loadTableData(rParms);

			//点击查询标注记录按钮
			jQuery('#go').unbind('click').bind('click', function() {

				var rType = $(".selType .item.active").attr("data-type");
				var rStartTime = $("#startTimebreakdown").val();
				var rEndTime = $("#endTimebreakdown").val();
				var rUserName = $("#markPerson").val();
				var rCameraName = $("#markCamera").val();
				var requestParms = {};
				requestParms.type = rType;
				requestParms.startTime = rStartTime;
				requestParms.endTime = rEndTime;
				requestParms.userName = rUserName;
				requestParms.cameraName = rCameraName;
				requestParms.currentPage = 1;
				requestParms.pageSize = 10;
				loadTableData(requestParms);
			});

			jQuery('#go').trigger("click");

		})();

	});

});


