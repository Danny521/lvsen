define([
	"settings/common/tool/camera-tree",
	"js/config",
	"plupload",
	"handlebars"
], function(cameraTree,mapSettings){
	return (function(scope){
		var options = {
			camera_tree : null,
			cameraIds : "",
			orgs : "",
			uploder : null,
			uploadFile:null
		};

		var _controller = null,
			_templateUrl = "/module/settings/mapconfig/inc/importLLA.html",
			_exportWinInc = "/module/settings/mapconfig/inc/export-excel-win.html",
			uploadUrl = "/service/map_config/import";

		var _bindEvents = function(){
			jQuery("#pageClose,#pageCacel").on("click",function(){
				jQuery(".batchImport").removeClass("disabled");
				jQuery("#sidePage").hide();
			});

			// jQuery(document).on("click",".export:not('.disabled')",function(){
			jQuery("#exportButton").on("click",function(){
				Toolkit.loadTemplate(_exportWinInc,function(complier){
					//弹出框
					var content = complier({showDialog:true});
 
					var myDialog = new CommonDialog({
						title: "导出模板",
						width: "625",
						independence : true,
						message: content
					});
					// new moveDome(jQuery(".common-dialog"));//添加窗口拖拽
					
					//初始化树形结构
					var camera_tree = new cameraTree({

						"node": ".export_win_p",

						"selectable":true,

						"templateUrl": "/module/settings/common/tool/camera2.html"
					});

					options.camera_tree = camera_tree;

					_dilogBindEvents();

					jQuery("#exportButton").addClass("disabled");
	
				},function(){
					notify.error("获取弹出框异常!");
				});
			});
			jQuery(document).on("click",".common-dialog .close",function(){
				jQuery("#exportButton").removeClass("disabled");
			})
			//上传按钮
			jQuery("#uploadBtn").on("click",function(){
				var splitArray = options.uploadFile.name.split(".");
				var type = splitArray[splitArray.length-1].toLowerCase();
				if(type!=="xls" && type!=="xlsx"){
					notify.warn("文件类型错误,请选择Excel文件");
					return;
				}

				options.uploder.start();

				//处理页面样式
				Toolkit.loadTemplate(_exportWinInc,function(complier){
					var loadingHtml = complier({loading:true});
					changeStatus("hide",loadingHtml);
				});

			});
		};

		//上传时页面样式处理
		var changeStatus = function(display,html){
			//屏蔽导航
			window.top.showHideNav(display);

			//增加样式
			if("show"===display){
				jQuery("body").find(".upload-status").hide();
			}else{
				jQuery("body").find(".upload-status").show();
				jQuery("body").find(".upload-status").empty().append(html);
			}
		}

		//excel弹出层事件绑定
		var _dilogBindEvents = function(){
			//给弹出框的按钮添加监听
			jQuery(document).on("click","#searchCameraBtn",function(event){
				var key = jQuery("#searchCameraInpt").val().trim();
				options.camera_tree.search({
					queryKey: key
				});
				return false;
			});
			jQuery(".left-camera-search").watch({
				wait: 500,
				captureLength: 0,
				//监听的输入长度
				callback: function(key) {
					options.camera_tree.search({
						queryKey: jQuery.trim(key)
					});
				}
			});
			//关闭dialog
			jQuery(document).on("click","#winCacel",function(){
				_winClose();
			});

			//导出按钮
			jQuery(document).on("click","#winExportBtn",function(){

				var idlist = cameraTreeObj.getTreeCameras();
				options.cameraIds="";
				options.orgs="";

				for(var i=0;i<idlist.cameras.length;i++){
					options.cameraIds += "," + idlist.cameras[i] ;
				}

				for(var i=0;i<idlist.orgs.length;i++){
					options.orgs += "," + idlist.orgs[i];
				}
				options.cameraIds = 
					options.cameraIds===""?"":options.cameraIds.substring(1);
			 	options.orgs = 
			 		options.orgs===""?"":options.orgs.substring(1);
			 	if(options.cameraIds==="" && options.orgs===""){
			 		notify.warn("选择要导出的摄像机为空");
			 		return;
			 	}

				var url="/service/map_config/export?cameras="+
									options.cameraIds+"&orgs="+options.orgs;

				jQuery("#myexport").attr("src",url);
				_winClose();
			});

		}

		//处理上传失败
		var handleFailure = function(){
			Toolkit.loadTemplate(_exportWinInc,function(complier){
				var faliureHtml = complier({faliure:true});
				changeStatus("hide",faliureHtml);

				jQuery(".reloadBtn").off().on("click",function(){
					changeStatus("show","");
					jQuery(".upload-status").hide();
					jQuery("#chooseFile").trigger("click");
				});

			});
		}

		//处理上传成功
		var handeSuccess = function(){
			Toolkit.loadTemplate(_exportWinInc,function(complier){
				var successHtml = complier({success:true});
				changeStatus("hide",successHtml);

				setTimeout(function(){
					changeStatus("show");
					jQuery("#pageClose").trigger("click");
					mapSettings.cameraTree.reload({});
				},1000);
			});
			
		}

		//初始化上传控件
		var initUploader = function(){

			options.uploder = new plupload.Uploader({
				runtimes: 'html5,html4',
				browse_button: "chooseFile",
				multi_selection: false,
				max_file_size: '2gb',
				url: uploadUrl + '?_=' + (new Date()).getTime(),
				filters: [//只允许Excel文件
					{ title : "Excel files", extensions : "xls,xlsx"}
				],
				file_data_name: 'file'
			});
			options.uploder.init();
			//文件添加监听事件
			options.uploder.bind('FilesAdded', function(up, files) {
				options.uploadFile = files[0];
				jQuery("#fileInput").val(options.uploadFile.name);
			});
			//文件上传完成监听事件
			options.uploder.bind("FileUploaded",function(up, file, res){
				var response = JSON.parse(res.response);
				if (response.code === 200) {
					handeSuccess();
				}else if(response.code === 500){
					handleFailure();
				}else{
					notify.error("系统网络异常!");
				}
			});

		}

		var _winClose = function(){
			jQuery(".common-dialog .wrapper .close").trigger("click");
		}

		var _renderPage = function(){

			Toolkit.loadTemplate(_templateUrl, function(complier){

				var content = complier({});

				$("#sidebar").after(content);

				_bindEvents();

				initUploader();

			}, function(){
				notify.error("获取模板数据失败!")
			});
			
		};

		var cameraTreeObj = {
			/**
	         * [getCameras 获取选中的摄像机]
	         * @return {[type]} [description]
	         */
	        getTreeCameras: function() {
	            var cameraTree = {
	                    orgs: [],
	                    cameras: []
	                },
	                $li,
	                self = this;
	            // 获取组织数据
	            jQuery(".treePanel").find("li.tree").each(function() {
	                var $li = jQuery(this),
	                    thisCheck = $li.children(".checkbox.selected").length,
	                    isRoot = $li.hasClass("root"),
	                    parentTreeLevel = $li.attr("data-tree-level")-1,
	                    $parentLi = $li.closest("li.tree[data-tree-level=" + parentTreeLevel + "]"),
	                    parentCheck = $parentLi.children(".checkbox.selected").length;
	                
	                //如果当前树没有选中，则获取该树下的摄像机
	                if (!thisCheck) {
	                    cameraTree.cameras = cameraTree.cameras.concat(self.getCameras($li));
	                    return;
	                }

	                //如果当前树是根目录，则添加
	                if (isRoot) {
	                    return cameraTree.orgs.push($li.attr("data-id").replace("org_", ""));
	                }

	                //如果父级树没有选中 或者 父级树是跟目录，则添加到数据集
	                if (!parentCheck) { //  || $parentLi.hasClass("root")
	                    return cameraTree.orgs.push($li.attr("data-id").replace("org_", ""));
	                }
	            });

	            // 获取摄像机数据 搜索之后会用到
	            jQuery(".treePanel").children("ul").children("li.leaf").each(function() {
	                if (jQuery(this).children(".checkbox.selected").length) {
	                    cameraTree.cameras.push(jQuery(this).attr("data-id")); 
	                }
	            })
	            
	            return cameraTree;
	        },
	        /**
	         * [getCameras 获取选中的摄像机]
	         * @param  {[type]} $li [当前未选中的树]
	         * @return {[type]}     [description]
	         */
	        getCameras: function($li) {
	            var cameras = [];
	            $li.children("ul").children("li.leaf").each(function() {
	                if (jQuery(this).children(".checkbox.selected").length) {
	                    cameras.push(jQuery(this).attr("data-id")); 
	                }
	            })

	            return cameras;
	        }
		}
		


		scope.init = function(controller){
			_controller = controller;
			//渲染页面
			_renderPage();

		};
		
		return scope;
	}({}));

});