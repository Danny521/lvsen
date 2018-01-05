/**
 * VIM公共资源树
 * author : fanll
 * date : 2014.12.17
 */
define(['jquery', 'js/pvd/monitor/zTree_v3/js/jquery.ztree.all-3.5.min.js'], function($) {

    var NODE_TYPE = { //节点类型
            ROOT: 'root',
            ORG: 'org',
            GATE: 'gate',
            ROAD: 'road'
        },
        SERVER_TYPE = {
            ROOT: 'root',
            ORG: 'org',
            GATE: 'monitor',
            ROAD: 'channel'
        },
        NODE_TYPE_ALL = { //节点类型
            'root': true,
            'org': true,
            'gate': true,
            'road': true
        },
        NODE_TYPE_NO = { //节点类型编码
            '1': 'org',
            '2': 'gate',
            '3': 'road'
        },
        PARENT_NODE_TYPE = {
            'root': null,
            'org': 'org',
            'gate': 'org',
            'road': 'gate'
        },
        ASYNC_URL = { //异步链接
            ROOT: '/pvdservice/traffic/tree/root',
            ORG: '/pvdservice/traffic/tree/subOrgsAndMonitors?id=',
            GATE: '/pvdservice/traffic/tree/channels?id='
        },
        CHANNEL_STATUS_DIRECTION = { //道路状态方向样式
            //异常
            '0': {
                '1': 'up-offline', //上行
                '2': 'down-offline' //下行
            },
            //正常
            '1': {
                '1': 'up-online',
                '2': 'down-online'
            }
        };
    var UID = 1000; //唯一的树ID
    var formatType = function(type, isLocal2Server) {
        switch (type) {
            case NODE_TYPE.GATE:
            case SERVER_TYPE.GATE:
                return isLocal2Server ? SERVER_TYPE.GATE : NODE_TYPE.GATE;
            case NODE_TYPE.ROAD:
            case SERVER_TYPE.ROAD:
                return isLocal2Server ? SERVER_TYPE.ROAD : NODE_TYPE.ROAD;
            default:
                return isLocal2Server ? SERVER_TYPE.ORG : NODE_TYPE.ORG;
        }
    };

    var Tree = function(selector, options) {
        this.$tree = $(selector).attr("id", "vim-tree-" + UID++); //赋予唯一Id
        this.options = options || {};
        this.checkNodeTypes = {}; //选择节点类型
        this.init();
    };

    /**
     * 静态方法：获取根节点
     * @return {[type]} [description]
     */
    Tree._root = null;
    Tree.getRoot = function(flush) {
        if (Tree._root == null || flush) {
            $.ajax({
                url: ASYNC_URL.ROOT,
                async: false,
                type: 'GET',
                success: function(res) {
                    if (res && res.code == 200) {
                        Tree._root = res.data;
                    } else if (res && res.message) {
                        notify.warn(res.message);
                    }
                }
            })
        }
        return Tree._root;
    };

    Tree.prototype = {
        defaults: {
            leafType: SERVER_TYPE.ORG
        },
        setting: {
            check: {
                enable: false,
                chkboxType: {
                    "Y": "",
                    "N": ""
                },
                chkStyle: 'checkbox',
                radioType: 'all'
            },
            edit: {
                enable: false,
                showRemoveBtn: false,
                showRenameBtn: false
            },
            view: {
                selectedMulti: false,
                showLine: false
            },
            data: {
                simpleData: {
                    enable: true,
                    idKey: 'nodeId',
                    pIdKey: 'parentNodeId',
                    rootPId: 'org310117'
                }
            },
            async: {
                type: 'get',
                enable: true,
                url: function(treeId, treeNode) {
                    var self = this.getZTreeObj(treeId).__self;
                    var leafType = self && self.options.leafType,
                        url = '';
                    if (treeNode) {
                        switch (treeNode.nodeType) {
                            case NODE_TYPE.ORG:
                                url = ASYNC_URL.ORG + treeNode.databaseId + "&leafType=" + leafType;
                                break;
                            case NODE_TYPE.GATE:
                                url = ASYNC_URL.GATE + treeNode.databaseId;
                                break;
                        }
                    } else {
                        url = ASYNC_URL.ROOT;
                    }
                    return url;
                },
                dataFilter: function(treeId, parentNode, responseData) {
                    var nodes = [];
                    if (responseData.code != 200) {
                        //notify.error('资源树加载失败。');
                        return nodes;
                    }
                    var self = this.getZTreeObj(treeId).__self,
                        orgs = responseData.data.orgs,
                        subOrgs = responseData.data.subOrgs,
                        gates = responseData.data.monitors,
                        roads = responseData.data.channels,
                        leafType = self.options.leafType,
                        checkNodeTypes = self.checkNodeTypes,
                        nocheck,
                        item;
                    //根机构
                    if (orgs && orgs.length) {
                        nocheck = !checkNodeTypes[NODE_TYPE.ORG];
                        for (var i = 0, l = orgs.length; i < l; i++) {
                            item = orgs[i];
                            nodes.push({
                                nodeId: NODE_TYPE.ORG + item.id,
                                nodeType: NODE_TYPE.ORG,
                                databaseId: item.id,
                                name: item.name,
                                data: item,
                                iconSkin: NODE_TYPE.ROOT,
                                isParent: item.haveSubOrg || item.haveMonitor,
                                nocheck: nocheck
                            });
                        }
                    }
                    //子机构
                    if (subOrgs && subOrgs.length > 0) {
                        nocheck = !checkNodeTypes[NODE_TYPE.ORG];
                        for (var i = 0, l = subOrgs.length; i < l; i++) {
                            item = subOrgs[i];
                            nodes.push({
                                nodeId: NODE_TYPE.ORG + item.id,
                                nodeType: NODE_TYPE.ORG,
                                databaseId: item.id,
                                data: item,
                                name: item.name,
                                iconSkin: NODE_TYPE.ORG,
                                isParent: item.haveSubOrg || (leafType != NODE_TYPE.ORG && item.haveMonitor),
                                nocheck: nocheck
                            });
                        }
                    }
                    //卡口
                    if (gates && gates.length > 0) {
                        nocheck = !checkNodeTypes[NODE_TYPE.GATE];
                        for (var i = 0, l = gates.length; i < gates.length; i++) {
                            item = gates[i];
                            nodes.push({
                                nodeId: NODE_TYPE.GATE + item.id,
                                nodeType: NODE_TYPE.GATE,
                                databaseId: item.id,
                                name: item.name,
                                iconSkin: NODE_TYPE.GATE,
                                isParent: NODE_TYPE.GATE != leafType && item.haveChannel,
                                data: item,
                                nocheck: nocheck
                            });
                        }
                    }
                    //道路
                    if (roads && roads.length > 0) {
                        nocheck = !checkNodeTypes[NODE_TYPE.ROAD];
                        for (var i = 0, l = roads.length; i < l; i++) {
                            item = roads[i];
                            var iconSkin;
                            if (item.channelstatus === 0) {
                                //0代表异常，1代表正常
                                if (item.channeldirection === 1) {
                                    //1代表上行，2代表下行
                                    iconSkin = 'up-offline';
                                } else {
                                    iconSkin = 'down-offline';
                                }
                            } else {
                                if (item.channeldirection === 1) {
                                    //1代表上行，2代表下行
                                    iconSkin = 'up-online';
                                } else {
                                    iconSkin = 'down-online';
                                }
                            }
                            nodes.push({
                                nodeId: NODE_TYPE.ROAD + item.id,
                                nodeType: NODE_TYPE.ROAD,
                                databaseId: item.id,
                                name: item.name,
                                iconSkin: iconSkin,
                                isParent: false,
                                channelDirection: item.channeldirection,
                                channelStatus: item.channelstatus,
                                data: item,
                                nocheck: nocheck
                            });
                        }
                    }
                    return nodes;
                }
            },
            callback: {}
        },
        /**
         * 初始化
         * @param  {object} options 配置参数
         * @return {[type]}         [description]
         */
        init: function() {
            this.treeObj = jQuery.fn.zTree.init(this.$tree, this._generateSetting());
            this.treeObj.__self = this;
        },
        /**
         * 生成配置
         * @return {[type]} [description]
         */
        _generateSetting: function() {
            if (this.treeSetting) {
                return this.treeSetting;
            }
            var setting = $.extend(true, {}, this.setting),
                options = this.options = $.extend(true, {}, this.defaults, this.options),
                events = options.events || {};
            $.extend(setting.callback, events);
            if (options.checkNodeType) {
                var types = options.checkNodeType.split(",");
                for (var i = 0, l = types.length; i < l; i++) {
                    this.checkNodeTypes[types[i]] = true;
                }
                setting.check.enable = true;
                setting.check.chkStyle = options.singleCheck ? "radio" : "checkbox"
            }
            return this.treeSetting = setting;
        },
        /*接口方法*/
        /**
         * 获取勾选的单个节点(适用于单选:singleCheck->true)
         * @return {[type]} [description]
         */
        getCheckedNode: function(treeNode) {
            var nodes = this.treeObj.getCheckedNodes(true);
            return (nodes && nodes.length > 0) ? (treeNode ? nodes[0] : nodes[0].data) : null;
        },
        /**
         * 获取勾选的节点
         * @param  {string} nodeType 节点类型
         * @return {[type]}          [description]
         */
        getCheckedNodes: function(nodeType) {
            var nodes = this.treeObj.getCheckedNodes(true),
                res = {
                    org: [],
                    gate: [],
                    road: [],
                },
                node,
                pCs;
            if (!NODE_TYPE_ALL[nodeType]) {
                nodeType = null;
            }
            for (var i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i];
                if (nodeType && node.nodeType != nodeType) {
                    continue;
                }
                nodeCheckStatus = node.getCheckStatus();
                parentNode = node.getParentNode();
                if (!nodeCheckStatus.half) {
                    if (!parentNode) {
                        res[node.nodeType].push(node.data);
                    } else {
                        pCs = parentNode.getCheckStatus();
                        if (pCs == null || pCs.half) {
                            res[node.nodeType].push(node.data);
                        }
                    }
                }
            }
            return nodeType ? res[nodeType] : res;
        },
        /**
         * 获取勾选节点的ID字符串和名称字符串
         * @param  {string} nodeType 节点类型
         * @return {[type]}          [description]
         */
        getCheckedNodesIdsAndNames: function(nodeType) {
            var nodes = this.getCheckedNodes(nodeType),
                ids, names, res;
            if (nodeType) {
                ids = [];
                names = [];
                for (var i = 0, l = nodes.length; i < l; i++) {
                    ids.push(nodes[i].id);
                    names.push(nodes[i].name);
                }
                res = {
                    ids: ids.join(","),
                    names: names.join(",")
                }
            } else {
                res = {};
                for (var k in nodes) {
                    var nodeList = nodes[k];
                    if (nodeList && nodeList.length) {
                        ids = [];
                        names = [];
                        for (var i = 0, l = nodeList.length; i < l; i++) {
                            ids.push(nodeList[i].id);
                            names.push(nodeList[i].name);
                        }
                        res[k] = {
                            ids: ids.join(","),
                            names: names.join(",")
                        }
                    }
                }
            }
            return res;
        },
        /**
         * 清空选择
         * @return {[type]} [description]
         */
        clearChecked: function() {
            this.treeObj.checkAllNodes(false);
            var node = this.getCheckedNode(true);
            node && this.treeObj.checkNode(node, false); //取消radio类型的勾选节点
        },
        unCheckedNode: function(id, nodeType) {
            var node = this.treeObj.getNodeByParam("nodeId", nodeType + id);
            node && this.treeObj.checkNode(node, false, true);
        },
        /**
         * 设置选中的节点
         * @param {[type]} org    [description]
         * @param {[type]} custom [description]
         * @param {[type]} road   [description]
         */
        checkedNodes: function(orgIds, gateIds, roadIds) {
            this.clearChecked();
            orgIds && this._checkedNodes(NODE_TYPE.ORG, orgIds);
            gateIds && this._checkedNodes(NODE_TYPE.GATE, gateIds);
            roadIds && this._checkedNodes(NODE_TYPE.ROAD, roadIds);
        },
        _checkedNodes: function(nodeType, ids) {
            if (nodeType && ids) {
                var treeObj = this.treeObj,
                    node;
                if (typeof ids == "number") {
                    ids = ids + '';
                }
                if (typeof ids == "string") {
                    ids = ids.split(",");
                }
                for (var i = 0, l = ids.length; i < l; i++) {
                    node = treeObj.getNodeByParam('nodeId', nodeType + ids[i], null);
                    node && treeObj.checkNode(node, true, true, true);
                }
            }
        },
        /**
         * 搜索节点
         * @param  {string} keyword 关键字
         * @return {[type]}         [description]
         */
        searchNodes: function(keyword, afterSearched) {
            var self = this,
                treeObj = this.treeObj;
            if (keyword == "" || keyword == null || keyword == void 0) {
                this.init();
                afterSearched(true);
            } else {
                //'/gate/orgunit/getParentUnitInfo'gatename: keyword
                $.ajax({
                    url: '/pvdservice/traffic/tree/search',
                    type: "post",
                    data: {
                        leafType: formatType(this.options.leafType, true),
                        keyword: keyword
                    }
                }).then(function(res) {
                    var flag;
                    if (res && res.code == 200) {
                        flag = self.reloadTree(res.data);
                    } else {
                        flag = self.reloadTree(null);
                    }
                    afterSearched && afterSearched(flag);
                });
            }
        },
        /**
         * 格式化简单模式节点数据
         * @param  {[type]} nodes [description]
         * @return {[type]}       [description]
         */
        _formatSimpleNodeData: function(nodes) {
            var self = this,
                leafType = self.options.leafType,
                result = [],
                node,
                nodeId,
                nodeType,
                className,
                checkNodeTypes = this.checkNodeTypes,
                repeatId = {},
                isParent,
                open;
            for (var i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i];
                nodeType = className = formatType(node.nodeType.toLowerCase());
                nodeId = nodeType + node.id;
                if (nodeType == NODE_TYPE.ORG && node.parentid === '0') {
                    className = 'root';
                } else if (nodeType == NODE_TYPE.ROAD) {
                    var item = node;
                    if (item.channelstatus === 0) {
                        //0代表异常，1代表正常
                        if (item.channeldirection === 1) {
                            //1代表上行，2代表下行
                            className = 'up-offline';
                        } else {
                            className = 'down-offline';
                        }
                    } else {
                        if (item.channeldirection === 1) {
                            //1代表上行，2代表下行
                            className = 'up-online';
                        } else {
                            className = 'down-online';
                        }
                    }
                }
                if (repeatId[nodeId]) {
                    continue;
                } else {
                    repeatId[nodeId] = true;
                }
                //判断是否父级和打开状态
                isParent = false;
                open = false;
                if (nodeType != leafType) {
                    if (!node) {
                        isParent = true;
                    } else if (nodeType == NODE_TYPE.ORG) {
                        isParent = node.haveSubOrg || node.haveMonitor;
                    } else if (nodeType == NODE_TYPE.GATE) {
                        isParent = node.haveChannel;
                    }
                }
                if (node) {
                    node.x = node.x;
                    node.y = node.y;
                }
                result.push({
                    nodeId: nodeId,
                    databaseId: node.id,
                    parentNodeId: formatType(PARENT_NODE_TYPE[nodeType]) + (nodeType === NODE_TYPE.ROAD ? node.roadmonitorstationid : (nodeType === NODE_TYPE.GATE ? node.orgunitid : node.parentid)),
                    name: node.name,
                    text: node.name,
                    nodeType: nodeType,
                    nocheck: !checkNodeTypes[nodeType],
                    iconSkin: className,
                    data: node,
                    isParent: isParent,
                    open: true
                });
            }
            return result;
        },
        /**
         * 重加载树
         * @param  {[type]} nodes [description]
         * @return {[type]}       [description]
         */
        reloadTree: function(nodes) {
            if (!nodes) {
                this.init();
                return true;
            } else {
                if (nodes.length === 0) {
	                //搜索为空时，by zhangyu on 2015/6/10
	                jQuery(".gate-tree").html("<p class='no-result-style'>暂无卡口信息。</p>");
                    return false;
                } else {
                    this.treeObj = jQuery.fn.zTree.init(this.$tree, this._generateSetting(), this._formatSimpleNodeData(nodes));
                    this.treeObj.__self = this;
                    return true;
                }
            }
        }
    };

    return Tree;
});