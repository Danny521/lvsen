define([
    'base.self',
    'jquery.ztree.all-3.5.min'
], function() {
	var URLS = {
		ORG: {
			ROOT_ORG: "/service/org/get_root_org?isOrgUser=isOrgUser",
			CHILD_ORG: "/service/org/get_child_orgs_by_parent?parentId="
		},
		USER: {}
	}

	var CommonTree = function(selector, type, options) {
		var self = this;
		this.$el = $(selector);
		this.setting = {
			view: {
				showLine: false,
				selectedMulti: false
			},
			data: {
				simpleData: {
					enable: true,
					idKey: 'id',
					pIdKey: 'parentid',
					rootPId: 0
				}
			},
			async: {
				type: 'get',
				enable: true,
				url: function(treeId, treeNode) {
					var url = '';
					if (treeNode) {
						url = URLS.ORG.CHILD_ORG + treeNode.databaseId;
					} else {
						url = URLS.ORG.ROOT_ORG;
					}
					return url;
				},
				dataFilter: function(treeId, parentNode, responseData) {
					var nodes = [];
					if (responseData.code == 200) {
						if (parentNode) {
							nodes = self.formatTreeData(responseData, parentNode);
						} else {
							nodes = self.formatTreeData(responseData);
						}
					} else {
						notify.error('后台数据异常');
					}
					return nodes;
				}
			},
			callback: {
				onCheck: function(event, treeId, treeNode) {
					var treeObj = self.treeObj;
					if (treeObj.getCheckedNodes(true).length > 5) {
						notify.warn('选择数量不能超过5个');
						treeObj.checkNode(treeNode, false);
					}
				},
				onNodeCreated: function(event, treeId, treeNode) {
					if (treeNode.getParentNode() == null) {
						self.treeObj.expandNode(treeNode, true, false);
					}
				}
			}
		};
		this.init();
	};

	CommonTree.prototype = {
		init: function() {
			this.treeObj = $.fn.zTree.init(this.$el, this.setting);
		},
		formatTreeData: function(responseData, parentNode) {
			var nodes = null;
			if (parentNode) {
				nodes = this._filterOrgResponse(responseData);
			} else {
				nodes = this._filterRootResponse(responseData);
			}
			return nodes || [];
		},
		_filterRootResponse: function(responseData) {
			var result = [];
			var index = 0;
			var item = null;
			var resultItem = {};
			var rootOrg = null;
			if (rootOrg = responseData.data.org) {
				result.push({
					nodeType: 'org',
					databaseId: rootOrg.id,
					name: rootOrg.name,
					iconSkin: 'root',
					remote: rootOrg.isRemoteAccess || 0,
					isParent: true //rootOrg.isChild == "tree"
				});
			}
			return result;
		},
		_filterOrgResponse: function(responseData) {
			var result = [];
			var index = 0;
			var item = null;
			var resultItem = {};
			var orgs = responseData.data.orgs;
			if (orgs && orgs.length > 0) {
				for (i = 0, l = orgs.length; i < l; i++) {
					item = orgs[i];
					resultItem = {
						nodeType: 'org',
						databaseId: item.id,
						name: item.name,
						iconSkin: 'org',
						remote: item.isRemoteAccess || 0,
						isParent: item.isChild == "tree"
					};
					result.push(resultItem);
				}
			}
			return result;
		},
		_filterCustomResponse: function(responseData) {
			var result = [];
			var index = 0;
			var item = null;
			if (responseData.data.roads && responseData.data.roads.length > 0) {
				for (index = 0; index < responseData.data.roads.length; index++) {
					item = responseData.data.roads[index];
					var iconSkinStr = 'road';
					if (item.channelStatus === 0) {
						//0代表异常，1代表正常
						if (item.channelDirection === 1) {
							//1代表上行，2代表下行
							iconSkinStr = 'up-offline';
						} else {
							iconSkinStr = 'down-offline';
						}
					} else {
						if (item.channelDirection === 1) {
							//1代表上行，2代表下行
							iconSkinStr = 'up-online';
						} else {
							iconSkinStr = 'down-online';
						}
					}
					result.push({
						nodeType: 'road',
						databaseId: item.id,
						name: item.name,
						iconSkin: iconSkinStr,
						checked: parentNode.checked,
						isParent: false,
						data: item,
						remote: item.isRemoteAccess || 0,
						channelDirection: item.channelDirection,
						channelStatus: item.channelStatus
					});
				}
			}
			return result;
		},
		getSelectNodes : function(){
			return this.treeObj.getSelectedNodes();
		},
		selectNodes : function(id){
			var tree = this.treeObj;
			if(id){
				var nodes = tree.getNodesByParam("databaseId",id, null);
				if(nodes){
					tree.selectNode(nodes[0],false);
				}
			}else{

			}
		}
	};

	return CommonTree;
});