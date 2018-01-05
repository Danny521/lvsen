define(["jquery-ui-timepicker-addon","jquery.pagination"],function(){
		var $ = jQuery;
		var ajaxObject = null;
		$("#tablecameraStat").on("click",".checkall",function(){
			mintenance.checkAll("#tablecameraStat",".checkbox",".checkall");
		});
		$("#tablecameraStat").on("click",".checkbox",function(){
			mintenance.check("#tablecameraStat",".checkbox",".checkall");
		});

		//导出摄像机类别统计exportcameraStat
		$(".camera-area").on("click","#exportcameraStat",function(){
			var el     = $(this).closest("#tablecameraStat"),
				data   = getSelectedCamorOrg(el,"cameraStat"),
				url    = '/service/check/camera/count/export',
				exname = $(this).attr("data-org-name");
			if(!data){
				notify.error("请选择要导出的组织机构！");
				return false;
			}
			notify.info("正在处理请稍候...",{timeout:1000});
			// window.open("/service/check/camera/count/export?orgIds="+data);
			var sum = $("#sumCamera table.sum").find(".checkbox:checked").data();
			 $.ajax({
				url:url,
				type:"post",
				data:{records:JSON.stringify(data)},
				success:function(data){
					if(data && data.code === 200){
						downloadFileByURI(data.data.fileName,"摄像机类型统计-"+exname)
					}else{
						notify.warn("导出失败！");
					}
				}
			});
			logDict.insertLog('m2','f4','o18','b221',exname); // 导出日志
			return false;
		});



		// 通过返回的文件名下载文件
		function downloadFileByURI(file,Name,url){
			$("#download_frame").attr("src",url || '/service/check/export/file?fileName=' + file + "&saveName=" + encodeURIComponent(Name));
		}
		// 获取被选中的摄像机/机构
		function getSelectedCamorOrg(el,action){
			var target  = el.find(".result table").find(".checkbox:checked"),
				len     = target.length,
				records = {records:[]},
				tmp     = {},
				elm;
			if(target.length < 1){
				return false;
			}

			if(action === "cameraStat"){
				for(var i =0;i<len;i++){
					elm = $(target[i]);
					elmData = elm.data();
					tmp = {
						orgName :elmData.orgname,
						totalCnt : elmData.totalcnt,
						hdCnt : elmData.hdcnt,
						sdCnt : elmData.sdcnt,
						ptzAbleCnt : elmData.ptzablecnt,
						ptzUnableCnt : elmData.ptzunablecnt
					};
					records.records.push(tmp);
				}
				var checkall = $("#tablecameraStat table.camerastat th .checkall");
				if(checkall.is(":checked")){
					var sumData = $("#tablecameraStat #sumCamera .checkbox").data(),
						tmp = {
							orgName :sumData.orgname,
							totalCnt : sumData.totalcnt,
							hdCnt : sumData.hdcnt,
							sdCnt : sumData.sdcnt,
							ptzAbleCnt : sumData.ptzablecnt,
							ptzUnableCnt : sumData.ptzunablecnt
						};
					records.records.push(tmp);
				}
				return records;
			}

			return records;
		}

		var mintenance = {

			tpl   : {},  // 模板缓存

			action : "",   // 动作

			data : {},   // 数据缓存



			loadTpl : function(name){
				var self = this;
				var dfd = $.Deferred();
				if(self.tpl[name]){
					dfd.resolve(self.tpl[name]);
					return dfd.promise();
				}
				$.ajax({
					type:"get",
					url : "/module/maintenance/reports/inc/" + name + ".html",
					success : function(html){
						self.tpl[name] = html;
						dfd.resolve(html);
					}

				});
				return dfd.promise();
			},

			loadTpl2 : function(name){
				var self = this;
				var dfd = $.Deferred();
				if(self.tpl[name]){
					dfd.resolve(self.tpl[name]);
					return dfd.promise();
				}
				$.ajax({
					type:"get",
					url : "/module/maintenance/reports/inc/" + name + ".html",
					success : function(html){
						self.tpl[name] = html;
						dfd.resolve(html);
					}

				});
				return dfd.promise();
			},


			loadData : function(name){
				var self = this;
				if(ajaxObject && ajaxObject.status != 200){
					ajaxObject.abort();
				}
				var dfd = $.Deferred();
				ajaxObject = $.ajax({
					type:"get",
					dataType:"json",
					url : "/service/check/" + name,
					success : function(data){
						dfd.resolve(data);
					}
				});
				return dfd.promise();
			},
			//获取测试数据
			getData : function(){
				var dfd = $.Deferred();
				$.ajax({
					type:"get",
					dataType:"json",
					url : "/module/maintenance/reports/js/cameras.json",
					success : function(data){
						dfd.resolve(data);
					}
				});
				return dfd.promise();
			},

			render : function(name,data){
				return Handlebars.compile(this.tpl[name])(data);
			},

			makeUp : function(name,data,callback){
				$.when(mintenance.loadData(data),mintenance.loadTpl(name))
					.done(function(json){
						if(callback) {
							callback(mintenance.render(name,json.data));
						}
					})
					.fail(function(){
						alert("获取数据失败！");
					});
			},
			check:function(container,klass,node){
				var checkbox = $(container).find(klass);
				var checked  = $(container).find(klass+":checked");
				var checkall = $(container).find(node);
				if (checkbox.length == checked.length) {
					checkall.prop({"checked":true});
				}else{
					checkall.prop({"checked":false});
				}
			},
			checkAll:function(container,klass,node){
				var checkbox = $(container).find(klass);
				var checkall = $(container).find(node);
				if (checkall.is(":checked")) {
					checkbox.prop({"checked":true});
				}else{
					checkbox.prop({"checked":false});
				}
			}

		};
		//加载摄像机类型统计
		function makeTableAndChartsForCameraStat(el){

			var li,steps,id,url,data;
			if(el){

				li    = el.closest("li"),// 面包屑
				steps = step(li),// 获取面包屑数据
				id    = el.parent("li").attr("data-id"),
				url   = "camera/count?orgId="+id,
				text  = "此组织没有摄像机！";

				makeBread(steps);

			}else{

				data  = $("#searchboxbreakdown").serialize(),
				url   = "camera/count?orgId="+id,
				text  = "未搜索到符合条件的摄像机！";
			}
			$("#tablecameraStat .result").html("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在统计，请稍后。。。</div></li></ul>");
			$.when(mintenance.loadTpl2("maintenance_inspect_cameraStat"),mintenance.loadTpl2("maintenance_inspect_cameraSum"),mintenance.loadData(url)).done(function(html,html2,data){
				if(!data || !data.data || data.code !== 200){
					notify.error("未获取到可用的数据！");
					return false;
				}
				if(data.data.statisticsInfos.length<=0){
					notify.error(text);
					$("#tablecameraStat .result").html(text);
					return false;
				}
				$("#tablechartcameraStat .viewport").height($(window).height() - 185 - 20);
				$("#searchcameraStat").show();
				var sumCam={
					orgName:"总计",
					totalCnt:0,
					hdCnt:0,
					sdCnt:0,
					ptzAbleCnt:0,
					ptzUnableCnt:0
				};
				for(var i=0; i<data.data.statisticsInfos.length; i++){
					sumCam.totalCnt += data.data.statisticsInfos[i].totalCnt;
					sumCam.hdCnt += data.data.statisticsInfos[i].hdCnt;
					sumCam.sdCnt += data.data.statisticsInfos[i].sdCnt;
					sumCam.ptzAbleCnt += data.data.statisticsInfos[i].ptzAbleCnt;
					sumCam.ptzUnableCnt += data.data.statisticsInfos[i].ptzUnableCnt;
				}
				$("#tablecameraStat .result").html(mintenance.render("maintenance_inspect_cameraStat",data.data));
				$("#tablecameraStat #sumCamera").html(mintenance.render("maintenance_inspect_cameraSum",sumCam));
				$("#searchboxcameraStat,#tablechartcameraStat .head").show();
				$("input.checkall").prop({"checked":false});

				setTimeout(function(){
					var $view = $("#tablecameraStat");
					if($view.data("tinyscrollbar")){
						$view.tinyscrollbar_update('relative');
					}else{
						$view.data({"tinyscrollbar":true});
						$view.tinyscrollbar({
							thumbSize: 36
						});
					}
				},500);
				//表格隔行变色
				changeBgbytroddAndEven($("#tablecameraStat"));
			})
		}
		// 表格隔行变色
		function changeBgbytroddAndEven(el){
			var overview = $(el).find(".overview");
			overview.find("tr:odd").addClass("odd");
			overview.find("tr:even").addClass("even");
		}
		//面包屑导航
		function step(element) {
			var position = [];
			(function(el) {
				position.push({
					"name": el.attr("data-name"),
					"id": el.attr("data-id")
				});
				//position.push(el.attr("data-name"));
				if (el.closest("ul").closest("li").attr("data-id")) {
					arguments.callee(el.closest("ul").closest("li"));
				}
			})(element);

			return position.reverse();
		}
		// 面包屑导航事件
		function makeBread(steps) {
			var len  = steps.length,
				html = "";
			for(var i=0;i<len;i++){
				if(i<len-1){
					html += '<a data-id="'+ steps[i].id +'">'+ steps[i].name + '</a> > ';
				}else{
					html += steps[i].name;
				}
			}
			$(".header.hidden .title").html(html);
		}
		// 面包屑导航 绑定事件
		$("#npplay").on("click",".header.breadcrumb a",function(){
			var id = $(this).attr("data-id");
			$(".ui.tab.result .treePanel li[data-id='" + id + "']>span").trigger("click");
		});


	});