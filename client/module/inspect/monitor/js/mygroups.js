/**
 * Created by Mayue on 2015/04/15.
 * 注释：[data-tabor]元素的点击，面板切换代码写在了video-monitor.js中，事件委托
 */
define([
	'jquery',
	'underscore',
	'handlebars',
	'/module/inspect/monitor/js/inspect.js',
	'pubsub',
	'/module/inspect/monitor/js/my-group-choose-cameras.js',
],function(jQuery, _, Handlebars, Inspect, PubSub, chooseCamerasView){
	var player,
		Tree,
		inspect;
	var Mygroups = function(ocx, tree) {
		var self = this;
		player = ocx;
		Tree = tree;

		self._bindEvent();
	};

	Mygroups.prototype = {
		illegalCharacter: /([?"*'\/\\<>:|？“”‘’^&~]|(?!\s)'\s+|\s+'(?!\s))/ig,
		TPLS: {
			CIRCLE_INSPECT_TIME: 'inc/circle-inspect-time.html',
			OPERATOR_BTN_TPL: 'inc/operator.template.html',
			INSPECT_TPL: '/module/common/tree/inspect.template.html'
		},
		templCache: {},
		/**
		 * 初始化事件绑定
		 */
		_bindEvent: function () {
			var self = this;

			//点击"新建分组"
			jQuery('#sidebar').on('click', '.add-group', function (e) {
				if (window.loop_inspect_obj && window.loop_inspect_obj.loopNum == 1) {
					notify.warn("摄像机正在轮巡中，请关闭后重试!");
					return;
				}
				chooseCamerasView.init(function (mygroupinfo, $panel) {
					self._addMyGroup(mygroupinfo, $panel);
				}, "add");
			});
			//分组保存按钮事件
			jQuery('#sidebar').on('submit', '[data-tabor="new-group"] .sbody .new-group-submit', function () {
				jQuery('[data-tabor="new-group"] .opera-panel .save-new-group').trigger('click');
			});
			//显示我的分组列表
			jQuery('#sidebar').on('click', '[data-tabor="new-group"] .opera-panel .mygroups-list', function (evt) {
				evt.preventDefault();
				evt.stopPropagation();
				jQuery("#sidebar-body").find(".my-own-group").trigger("click");
			});
			/*删除我的分组*/
			jQuery('#sidebar').on("click", "[data-tabor='my-group'] .group-operator.remove", function (event) {
				event.preventDefault();
				event.stopPropagation();
				var node = jQuery(this).closest(".node");
				new ConfirmDialog({
					title: "警告",
					message: "删除分组将删除该组下的摄像头，确定要删除该分组吗？",
					callback: function () {
						self._removeGroup(node.data("id"));
					}
				});
			});
			// 点击'删除摄像头'按钮    区别与“我的分组” 按钮
			jQuery('#sidebar').on("click", "li > .operator > .remove", function (event) {
				event.preventDefault();
				event.stopPropagation();
				var id = jQuery(this).closest(".node").data("id"),
					parentId = jQuery(this).closest(".node[data-type='group']").data("id");
				new ConfirmDialog({
					message: "确定要删除该摄像头吗？",
					callback: function () {
						self._removeCamera(parentId, id);
					}
				});
			});
			// 编辑我的分组
			jQuery('#sidebar').on("click", "[data-tabor='my-group'] .group-operator.edit", function (e) {
				e.preventDefault();
				e.stopPropagation();
				if (jQuery(this).closest(".group").children(".text-over").is(".edit")) {
					return;
				}
				var node = jQuery(this).closest(".node"),
					gid = node.data("id"),
					value = node.data("name");
				jQuery.ajax({
					url: "/service/video_access_copy/list_cameras",
					data: {
						isRoot: 1,
						type: "customize",
						id: gid
					},
					type: 'get',
					success: function (res) {
						if (res && res.code === 200) {
							var cameras = self._formatCameraData(res.data.cameras);
							var mygroupinfo = {
								name: value,
								cameras: cameras
							};
							chooseCamerasView.init(function (groupinfo, $panel) {
								self._editMyGroup(groupinfo, $panel, value, gid);
							}, "edit", mygroupinfo);
						} else {
							notify.warn('请求分组失败');
						}
					},
					error: function () {
						notify.error("未知异常");
					}
				});
			});
		},
		/**
		 * [删除我的分组]
		 * @author Mayue
		 * @date   2015-04-15
		 * @param  {[type]}   id [分组对应的id]
		 * @return {[type]}      [description]
		 */
		_removeGroup: function (id,flag) {
			jQuery.ajax({
				url: '/service/video_access_copy/remove_group',
				data: {
					id: id
				},
				type: 'post',
				success: function (res) {
					if (res && res.code === 200) {
						if(!flag){
							notify.success("自定义分组删除成功！");	
						}
						notify.success("自定义分组删除成功！");
						var $groupObj = jQuery("#sidebar-body").find(".video-resource-detail .group-total-num"),
							groupNum = $groupObj.html();
						$groupObj.html((+groupNum) - 1);
						/*日志start*/
						var grorpName = jQuery("[data-tabor='my-group'] [data-id=" + id + "] .group .text-over").text();
						logDict.insertLog('m1', 'f1', 'o3', 'b1', grorpName);
						/*日志end*/
						jQuery("[data-id=" + id + "]").remove();
					} else {
						notify.error("删除失败，" + res.data);
					}
				},
				error: function () {
					notify.error("请检查网络连接！");
				}
			});
		},
		/**
		 * [我的分组下的摄像头的删除]
		 * @author Mayue
		 * @date   2015-04-15
		 * @param  {[type]}   groupID     [分组id]
		 * @param  {[type]}   cameraID [description]
		 * @return {[type]}          [description]
		 */
		_removeCamera: function (groupID, cameraID) {
			var self = this;
			jQuery.ajax({
				url: '/service/video_access_copy/remove_camera',
				data: {
					id: groupID,
					camera: cameraID
				},
				type: 'post',
				success: function (res) {
					if (res && res.code === 200) {
						notify.success("摄像头删除成功！");
						jQuery("[data-tabor='my-group'] [data-id=" + groupID + "]").find("[data-id=" + cameraID + "]").remove();
						var currLen = jQuery("[data-tabor='my-group'] [data-id=" + groupID + "] .tree").find("li").length;
						if(currLen<=0){
							self._removeGroup(groupID,true);
						}
					} else {
						notify.error("删除失败，" + res.data);
					}
				},
				error: function () {
					notify.error("请检查网络连接！");
				}
			});
		},
		/**
		 * [新建我的分组]
		 * @author Mayue
		 * @date   2015-04-15
		 * @param  {[type]}   groupID     [分组id]
		 * @param  {[type]}   cameraID [description]
		 * @return {[type]}          [description]
		 */
		_addMyGroup: function (mygroupinfo, $panel) {
			//校验分组名称合法性
			if(!window.Toolkit.checkName(mygroupinfo.name)){
                 notify.error("组名不能包含特殊字符！");
                 return;
			}
			// 发送名称验证重名请求
			jQuery.ajax({
				url: "/service/video_access_copy/verify_group_name",
				data: {
					groupName: mygroupinfo.name
				},
				type: 'get',
				success: function (res) {
					if (res && res.code === 200) {
						if (res.data.flag) {
							notify.error("该分组名称已经存在");
						} else {
							// 发送请求
							jQuery.ajax({
								url: "/service/video_access_copy/create_group_with_group",
								data: {
									type: "org",
									name: mygroupinfo.name,
									camera: mygroupinfo.cameras.join('/'),
									groups: null
								},
								type: 'post',
								success: function (res) {
									if (res && res.code === 200) {
										notify.success("分组创建成功！");
										$panel.hide();
										jQuery('#sidebar #sidebar-body .my-own-group').trigger('click', {"mark": "auto"});//切换到'我的分组'列表
										logDict.insertLog('m1', 'f1', 'o1', 'b1', mygroupinfo.name); //日志
									} else {
										notify.warn(res.data);
									}
								}
							});
						}
					} else {
						notify.warn('分组名称重名验证请求失败');
					}
				},
				error: function () {
					notify.error("分组名称重名验证请求失败");
				}
			});
		},
		/**
		 * [编辑我的分组]
		 * @author Mayue
		 * @date   2015-04-15
		 * @param  {[type]}   mygroupinfo     [包含选择的摄像机数组和新的分组名称，是一个对象]
		 * @param  {[type]}   $panel          [dom对象]
		 * @param  {[type]}   value           [没有修改之前的分组名称]
		 * @param  {[type]}   gid             [没有修改之前的分组id]
		 * @return {[type]}          [description]
		 */
		_editMyGroup: function (mygroupinfo, $panel, value, gid) {

			var _ajax = function (mygroupinfo, $panel, value, gid) {

				jQuery.ajax({
					url: "/service/video_access_copy/edit_group_with_group",
					data: {
						id: gid,
						type: "org",
						name: mygroupinfo.name,
						camera: mygroupinfo.cameras.join('/'),
						groups: null
					},
					type: 'post',
					success: function (res) {
						if (res && res.code === 200) {
							notify.success("分组编辑成功！");
							$panel.hide();
							jQuery('#sidebar #sidebar-body .my-own-group').trigger('click', {
								"mark": "auto"
							}); //切换到'我的分组'列表
							logDict.insertLog('m1', 'f1', 'o2', 'b1', mygroupinfo.name); //日志
						} else {
							notify.warn(res.data);
						}
					}
				});
			};

			if (mygroupinfo.name === value + "") {
				//名称没有修改,不需要验证是否重命名,可以直接调用接口
				_ajax(mygroupinfo, $panel, value, gid);
			} else {
				if (!window.Toolkit.checkName(mygroupinfo.name)) {
					notify.error("组名不能包含特殊字符！");
					return;
				}
				//名称已经修改，要验证是否重命名
				jQuery.ajax({
					url: "/service/video_access_copy/verify_group_name",
					data: {
						groupName: mygroupinfo.name
					},
					type: 'get',
					success: function (res) {
						if (res && res.code === 200) {
							if (res.data.flag) {
								notify.error("该分组名称已经存在");
							} else {
								// 发送请求
								_ajax(mygroupinfo, $panel, value, gid);
							}
						} else {
							notify.warn('分组名称重名验证请求失败');
						}
					},
					error: function () {
						notify.error("分组名称重名验证请求失败");
					}
				});
			}
		},
		/**
		 * [组装每个分组下的摄像机的数据,供编辑我的分组使用]
		 * @author Mayue
		 * @date   2015-04-15
		 * @param  {[type]}   cameras     [cameras]
		 * @return {[type]}          [description]
		 */
		_formatCameraData: function (cameras) {
			var L = cameras.length,
				result = [];
			for (var i = 0; i < L; i++) {
				var obj = {
					id: cameras[i].id,
					name: cameras[i].name,
					cameratype: cameras[i].camera_type,
					cstatus: cameras[i].camera_status,
					hdchannel: cameras[i].hd_channel
				};
				result.push(obj);
			}
			return Array.clone(result);
		}

	};
	return  Mygroups;
});
