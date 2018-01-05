define([
	// 布防任务左侧摄像机树
	'/module/protection-monitor/defencesetting/js/camera-tree.js',
	// 布防任务右侧地图模块
	'/module/protection-monitor/defencesetting/js/view/defence/first-pva-map-view.js',
	// 全局变量
	'/module/protection-monitor/defencesetting/js/global-var.js',
	// 布防任务设置model层
	"/module/protection-monitor/defencesetting/js/model/defence-model.js",
	'jquery.watch'
], function(defenceCameraTree, pvaMapView, globalVar, model) {
	return {
		options: {
			// 摄像机树对象
			cameraTree: null,
			// 是否自动展开
			showCameraTreeAuto: false,
			orgs: [],
			cameraId: ""
		},
		init: function() {
			var self = this,
				options = self.options;
			//读取接口加载加载摄像机树
			options.cameraTree = new defenceCameraTree({
				"node": "#defence-setting-aside #cameraTree",
				"searchUrl": "/service/video_access_copy/search_camera",
				//add by zhangyu,2014-11-3,权限添加
				"orgId": jQuery("#userEntry").attr("data-orgid"),
				leafClick: function(el) {
					self.treeItemClick(el);
				},
				loadedCallback: function() {
					var $cameraTree = jQuery("#defence-first-step").find("#cameraTree");
					self.checkOrgOrCamera($cameraTree, self.options.orgs, self.options.cameraId);
				}
			});
			//搜索
			jQuery(".camera-search-container input[name='q']").watch({
				wait: 200,
				captureLength: 0,
				callback: function (key) {
					options.cameraTree.search({
						queryKey: key
					});
					return false;
				}
			});
			//搜索，已解决在firefox下汉字输入不自动查询的问题。
			jQuery(".camera-search-container .search.action").off("click").on("click", function() {
				var value = jQuery(".camera-search-container input[name='q']").val();
				//触发查询
				options.cameraTree.search({
					queryKey: value
				});
			});
		},
		/**
		 *    摄像机树点击事件
		 *    @el:当前li元素
		 */
		treeItemClick: function (el) {
			var 
				self = this, 
				id   = globalVar.defence.cameraData ? globalVar.defence.cameraData.id : "",
				$li  = el.closest("li"),
				cameraData = $li.data();

			if (cameraData.id !== id) {
				// 给当前元素赋予新的值
				if (cameraData.type !== "group") {
					var orgIdInfo = el.closest("ul").closest("li").attr("data-id");
					if (orgIdInfo) {
						cameraData.orgid = parseInt(orgIdInfo.split("_")[1]);
					}

					globalVar.defence.cameraData = cameraData;
					//播放实时视频
					pvaMapView.playMapCameraVideo(cameraData);
					// 控制单选按钮的样式
					jQuery(".treePanel").find(".radio-leaf.active").removeClass("active");
					$li.find(".radio-leaf").addClass("active");
				} else {
					notify.info("暂无权限访问该摄像机");
				}
			}
		},
		/**
		 * 摄像机树叶子节点-摄像机的双击事件
		 * @param:当前li元素
		 */
		treeItemDbClick: function (el) {
			var self = this;
			//双击时展开工具栏
			jQuery("#cameraTree li.leaf").removeClass("leaf-hover li-active expand").find(".more-operator,.operator-tools").hide();
			el.closest("li").addClass("leaf-hover li-active expand").find(".operator-tools").show();
			//播放实时视频
			var data = el.closest("li").data();
			pvaMapView.playMapCameraVideo(data);
		},
		/**
		 * [hasPermissionForCTree 摄像机树 权限判断]
		 * @author Wang Xiaojun
		 * @date   2014-11-03
		 * @param  orgId [组织id]
		 */
		hasPermissionForCTree: function (orgId) {
			var self = this;
			// 超级管理员
			if (jQuery("#userEntry").attr("data-orgid") === "null") {
				return true;
			}

			// 组织id 包含 "org_"   虚拟组织id 包含 "vorg_"
			var index = 0;
			if (orgId.indexOf("vorg") !== -1) {
				index = 5;
			} else if (orgId.indexOf("org") !== -1) {
				index = 4;
			}
			return self.cameraTree.hasAccessPower(orgId.substring(index));
		},
		/**
		 * 摄像机搜素左侧列表的渲染事件
		 */
		renderSearchResult: function (data) {
			//删除之前的搜索结果
			jQuery("#cameraTree ul[id='searchResultList']").remove();
			//添加新数据
			jQuery("#cameraTree").append(_g.AlarmMgrOptions.template({
				searchResult: true,
				data: data
			}));
		},
		/**
		 * 信息窗关闭时，清空左侧树的选中状态
		 */
		clearLeftStatus: function () {
			jQuery("#cameraTree li.leaf").removeClass("leaf-hover li-active expand").find(".more-operator,.operator-tools").hide();
		},
		/**
		 * [checkCameraById 已知摄像机id时，选中左侧摄像机树]
		 * @param  {[type]} cameraId [description]
		 * @return {[type]}          [description]
		 */
		checkCameraById: function(cameraId) {
			var self = this,
				$cameraTree = jQuery("#defence-first-step").find("#cameraTree"),
				$leaf = $cameraTree.find("li.leaf[data-id='" + cameraId + "']");

			// 如果摄像机已经存在，则直接选择，并展开父级
			if ($leaf.length) {
				$cameraTree.find(".radio-leaf.active").removeClass("active");
				$leaf.find(".radio-leaf").addClass('active')
				.end().parents("#cameraTreeList").show();
				var cameraData = $leaf.data();
				var orgIdInfo = $leaf.closest("ul").closest("li").attr("data-id");
				if (orgIdInfo) {
					cameraData.orgid = parseInt(orgIdInfo.split("_")[1]);
				}
				globalVar.defence.cameraData = cameraData;
				location.href = "#camera-" + cameraId;
				return;
			}

			self.getCameraOrgs(cameraId, function(orgs) {
				orgs = orgs.split(",");
				self.options.showCameraTreeAuto = true;
				self.options.orgs = orgs;
				self.options.cameraId = cameraId;
				self.checkOrgOrCamera($cameraTree, orgs, cameraId);
			});
		},
		/**
		 * [getCameraOrgs 获取摄像机所在组织]
		 * @param  {[type]}   cameraId [description]
		 * @param  {Function} callback [description]
		 * @return {[type]}            [description]
		 */
		getCameraOrgs: function(cameraId, callback) {
			model.getData("cameraOrgs", {
				cameraId: cameraId
			}).then(function(res) {
				if (res.code !== 200) {
					return notify.error("获取摄像机所在组织失败");
				}

				callback(res.data);
			}, function(err) {
				notify.error("获取摄像机所在组织失败");
			})
		},
		/**
		 * [checkOrgOrCamera 循环选中组织和摄像机]
		 * @param  {[type]} $cameraTree [description]
		 * @param  {[type]} orgs        [description]
		 * @param  {[type]} cameraId    [description]
		 * @return {[type]}             [description]
		 */
		checkOrgOrCamera: function($cameraTree, orgs, cameraId) {
			var self = this;
			if (!self.options.showCameraTreeAuto) {
				return;
			}

			var $leaf = $cameraTree.find("li.leaf[data-id='" + cameraId + "']");
			if ($leaf.length) {
				$cameraTree.find(".radio-leaf.active").removeClass("active");
				$leaf.find(".radio-leaf").addClass('active')
				.end().parents("#cameraTreeList").show();
				self.options.showCameraTreeAuto = false;

				var cameraData = $leaf.data();
				var orgIdInfo = $leaf.closest("ul").closest("li").attr("data-id");
				if (orgIdInfo) {
					cameraData.orgid = parseInt(orgIdInfo.split("_")[1]);
				}
				globalVar.defence.cameraData = cameraData;
				
				location.href = "#camera-" + cameraId;
				return;
			}

			orgs.forEach(function(item) {
				var $org = $cameraTree.find("li.tree[data-id='org_" + item + "']");
				if ($org.length && $org.attr("data-loaded") !== "1") {
					$org.find(".fold").trigger('click');
				}
			})
		}
	}
});