define([
    'js/npmap-new/map-const',
    'js/pvd/monitor/VimTree',
    'js/pvd/monitor/mapUtil',
    'js/pvd/monitor/mapConfig',
    'pubsub',
    "js/npmap-new/task/info-window",
    "js/npmap-new/map-common"
], function(MapConst, VimTree, mapUtil, mapPvdConfig, PubSub, WindowView, MapCommon) {
    var BASE_DIR = 'js/pvd/monitor/';
    var BASE_URL = '/pvdservice';
    //模板
    var Template = (function() {
        var templates = {
            POP: BASE_DIR + 'pop.html'
        };
        return {
            /**
             * 模板渲染
             * @param  {string}   tempName 模板名称
             * @return {[type]}            [description]
             */
            renderByTemplate: function(tempName) {
                var self = this,
                    temp = templates[tempName];
                if (typeof temp == "string") {
                    return $.get(templates[tempName]).then(function(tml) {
                        return templates[tempName] = Handlebars.compile(tml);
                    });
                } else {
                    return $.Deferred().resolve(temp);
                }
            }
        };
    })();

    var Controller = function(map) {
        this.map = map;
        //this._inited || this._initMap(map);
    };

    Controller.prototype = {
        MAP_LAYER_NAME: 'PVD-GATE-LAYER',
        /**
         * 初始化
         * @param  {object} $container 树容器
         * @param  {object} map        地图对象
         * @return {[type]}            [description]
         */
        _init: function($container) {
            this.$container = $container;
            //delete by zhangyu on 2015/5/8,应产品要求初始化卡口树时，不关联地图资源
            //this._inited || this._initMap(map);
            //初始化卡口树
            this._initTree($container);
            //初始化卡口点位
            //this._initGates();
            //this.showLayer();
            this._inited = true;
        },
        /**
         * 清空
         * @return {[type]} [description]
         */
        clear: function() {
            this.$container && this.$container.empty();
            this.removeAllOverlays();
        },
        /**
         * [_initMap description]
         * @param  {[type]} map [description]
         * @return {[type]}     [description]
         */
        _initMap: function(map) {
            //撒点图层
            var allMarkerOpt = {};
            allMarkerOpt.getUrl = function(counts) {
                if (!counts || counts === 1) {
                    return MapConst.mapIcon.bayonet.res["small"].img;
                }
                return counts < 10 ? MapConst.mapIcon.bayonet.cluster["1"].img : counts < 100 ? MapConst.mapIcon.bayonet.cluster["2"].img : counts < 1000 ? MapConst.mapIcon.bayonet.cluster["3"].img : MapConst.mapIcon.bayonet.cluster["4"].img;
            };
            allMarkerOpt.getImageSize = function(count, camera) {
                if (count > 1 && count < 100) {
                    return MapConst.mapIcon.bayonet.cluster["1"].size;
                } else if (count > 99 && count < 1000) {
                    return MapConst.mapIcon.bayonet.cluster["2"].size;
                } else if (count > 999 && count < 10000) {
                    return MapConst.mapIcon.bayonet.cluster["3"].size;
                } else if (count > 9999 && count < 100000) {
                    return MapConst.mapIcon.bayonet.cluster["4"].size;
                } else {
                    return MapConst.mapIcon.bayonet.res["small"].size;
                }
            };
            allMarkerOpt.click = function(marker) {
                //触发释放警力调度/全景上下文(left-right-handler.js)
                PubSub.publish("releaseFullviewSchedule");
                //卡口点位点击事件
                if (marker.click) {
                    marker.click(marker);
                }
            };
            allMarkerOpt.mouseover = function(marker) {
                if (marker.mouseover) {
                    marker.mouseover(marker);
                }
            };
            allMarkerOpt.mouseout = function(marker) {
                if (marker.mouseout) {
                    marker.mouseout(marker);
                }
            };

            if (mapPvdConfig.conflux.enble) {
                allMarkerOpt.maxZoom = mapPvdConfig.conflux.maxZoom;
                allMarkerOpt.selectZoom = mapPvdConfig.conflux.selectZoom;
                allMarkerOpt.distance = mapPvdConfig.conflux.distance;
                allMarkerOpt.isAsynchronous = mapPvdConfig.conflux.isAsynchronous;
            }
            if (/msie/.test(navigator.userAgent.toLowerCase())) {
                allMarkerOpt.labelYOffset = MapConst.mapIcon.bayonet.cluster["labelYOffsetIE"];
            } else {
                allMarkerOpt.labelYOffset = MapConst.mapIcon.bayonet.cluster["labelYOffset"];
            }

            allMarkerLayer = this.layer = new NPMapLib.Layers.OverlayLayer(this.MAP_LAYER_NAME, mapPvdConfig.conflux.enble, allMarkerOpt);
            map.addLayer(allMarkerLayer);
            WindowView.init(map);
        },
        /**
         * 点击卡口树时，
         * @private
         */
        _getGateMarkerType: function() {
            if (!$(".map-resource-list").find(".bayonet-resource i.checkbox").hasClass("checked")) {
                return "map-marker";
            } else {
                return "resource-marker";
            }
        },
        /**
         * 初始化树
         * @param  {object} $container 树容器
         * @return {[type]}            [description]
         */
        _initTree: function($container) {
            $container.empty();
            var self = this,
                $tree = $('<ul class="gate-tree ztree"></ul>').appendTo($container);
            this.gateTree = new VimTree($tree, {
                leafType: "road",
                events: {
                    onAsyncSuccess: function(event, treeId, treeNode, msg) {
                        if (!treeNode) {
                            var nodes = self.gateTree.treeObj.getNodes();
                            if (nodes.length > 0) {
                                self.gateTree.treeObj.reAsyncChildNodes(nodes[0], "refresh");
                            }
                        }
                    },
                    onClick: function(event, treeId, node, clickFlag) {
                        var gate;
                        //根据情况显示信息窗
                        if (node.nodeType == "gate") {
                            gate = node.data;
                            //检查坐标合法性
                            if (!mapConfig.checkPosIsCorrect(gate.x, gate.y)) {
                                return;
                            }
                            self._showResourceMarker(gate.x, gate.y);
                            self.showGateDetail({
                                gateId: gate.id,
                                gateName: gate.name,
                                lon: gate.x,
                                lat: gate.y,
                                from: "tree",
                                markerType: self._getGateMarkerType()
                            });
                        } else if (node.nodeType == "road") {
                            gate = node.getParentNode().data;
                            //检查坐标合法性
                            if (!mapConfig.checkPosIsCorrect(gate.x, gate.y)) {
                                return;
                            }
                            var road = node.data;
                            self._showResourceMarker(gate.x, gate.y);
                            self.showDetail({
                                gateId: gate.id,
                                'gateName': gate.name,
                                'roadId': road.id,
                                'roadName': road.name,
                                'direction': road.channelDirection === 1 ? '上行' : '下行',
                                'isOnlinePvd': road.channelStatus === 1 ? '在线' : '离线',
                                lon: gate.x,
                                lat: gate.y,
                                from: "tree",
                                isRoad: true,
                                isGate: false,
                                markerType: self._getGateMarkerType()
                            });
                        }
                    }
                }
            });
        },
        /**
         * 获取卡口
         * @param  {object} filter 过滤条件
         * @return {[type]}        [description]
         */
        _gateCache: null,
        _gateCacheList: null,
        _initGates: function(filter) {
            var self = this;
            if (this._gateCacheList) {
                self._renderGates(self._gateCacheList || []);
            } else {
                $.ajax({
                    url: BASE_URL + '/traffic/roadMonitor/all',
                    type: 'GET'
                }).then(function(res) {
                    if (self._gateCache == null) {
                        if (res && res.code == "200") {
                            var cache = self._gateCache = {},
                                list = self._gateCacheList = res.data;
                            for (var i = 0, l = list.length; i < l; i++) {
                                cache[list[i].id] = list[i];
                            }
                        }
                    }
                    return res;
                }).then(function() {
                    self._renderGates(self._gateCacheList || []);
                });
            }
        },
        _showResourceMarker: function(x, y) {
            //显示资源定位图层
            MapCommon.centerAndZoomOnShowInfowin(new NPMapLib.Geometry.Point(x, y));
            var layer = window.map.getLayerByName("resource-show-layer");
            if (!layer) {
                return;
            }
            if (!window.map.getLayerByName("bayonet-resource-layer")||!window.map.getLayerByName("bayonet-resource-layer").getVisible()) {
                layer.removeAllOverlays();
                layer.show();
                var marker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(x, y));
                marker.setIcon(MapConst.symbol.markerSymbol());
                layer.addOverlay(marker);
            }
        },
        /**
         * 初始化所有卡口
         * @return {[type]} [description]
         */
        _renderGates: function(gates) {
            var ICON_GATE_NORMAL = MapConst.mapIcon.bayonet.res["small"].img,
                ICON_GATE_HOVER = MapConst.mapIcon.bayonet.res["big"].img,
                MARKER_WIDTH = MapConst.mapIcon.bayonet.res["small"].size.width,
                MARKER_HEIGHT = MapConst.mapIcon.bayonet.res["small"].size.height,
                MARKER_GL_WIDTH = MapConst.mapIcon.bayonet.res["big"].size.width,
                MARKER_GL_HEIGHT = MapConst.mapIcon.bayonet.res["big"].size.height,
                FONT_SIZE = MapConst.mapIcon.bayonet.cluster["fontSize"];
            //清空
            var self = this,
                mainLayer = this.getLayer();
            var arr = [],
                tempMarker,
                markermouseover = function(marker) {
                    var style = {
                        fontSize: FONT_SIZE,
                        externalGraphic: ICON_GATE_HOVER,
                        graphicHeight: MARKER_GL_HEIGHT,
                        graphicWidth: MARKER_GL_WIDTH
                    };
                    marker.changeStyle(style, true);
                },
                markermouseout = function(marker) {
                    var style = {
                        fontSize: FONT_SIZE,
                        externalGraphic: ICON_GATE_NORMAL,
                        graphicHeight: MARKER_HEIGHT,
                        graphicWidth: MARKER_WIDTH
                    };
                    marker.changeStyle(style, true);
                },
                markerclick = function(marker) {
                    var customData = marker.getData();
                    var style = {
                        fontSize: FONT_SIZE,
                        externalGraphic: ICON_GATE_HOVER,
                        graphicHeight: MARKER_GL_HEIGHT,
                        graphicWidth: MARKER_GL_WIDTH
                    };
                    marker.changeStyle(style, true);
                    var point = marker.getPosition();
                    self.showGateDetail({
                        gateId: customData && customData.id,
                        gateName: customData && customData.name,
                        lon: point.lon,
                        lat: point.lat,
                        marker: marker,
                        markerType: "resource-marker"
                    });
                };
            mainLayer.removeAllOverlays();
            if (mapPvdConfig.conflux.enble) {
                for (var i = 0; i < gates.length; i++) {
                    var c = new NPMapLib.Geometry.Point(gates[i].x, gates[i].y);
                    var c2 = mapUtil.createClusterMarker({
                        'iconUrl': ICON_GATE_NORMAL,
                        'point': c,
                        'addition': {
                            'id': gates[i].id,
                            'name': gates[i].name,
                            //以下两个属性用于地图点位点击时信息窗上的事件绑定，add by zhangyu on 2015/5/6
                            'type': "bayonet",
                            'subType': "resource"
                        }
                    });
                    c2.mouseover = markermouseover;
                    c2.mouseout = markermouseout;
                    c2.click = markerclick;
                    arr.push(c2);
                }
                mapUtil.addFeatures(arr, mainLayer, mapPvdConfig.conflux.enble, this.map);
            } else {
                for (var i = 0; i < gates.length; i++) {
                    var c = new NPMapLib.Geometry.Point(gates[i].x, gates[i].y);
                    var c2 = mapUtil.createMarker({
                        'iconUrl': ICON_GATE_NORMAL,
                        'width': MARKER_WIDTH,
                        'height': MARKER_HEIGHT,
                        'mouseover': markermouseover,
                        'mouseout': markermouseout,
                        'click': markerclick,
                        'point': c,
                        'addition': {
                            'id': gates[i].id,
                            'name': gates[i].name
                        }
                    });
                    arr.push(c2);
                }
                mapUtil.addFeatures(arr, mainLayer, mapPvdConfig.conflux.enble, this.map);
            }
        },
        /**
         * 显示卡口详情
         * @param  {[type]} gate [description]
         * @return {[type]}      [description]
         */
        showGateDetail: function(gate) {
            var self = this;
            gate.isGate = true;
            gate.isRoad = false;
            $.ajax({
                url: BASE_URL + '/traffic/tree/channels',
                type: 'GET',
                data: {
                    id: gate.gateId
                }
            }).then(function(res) {
                if (res && res.code == "200") {
                    self.showDetail(gate, res.data.channels);
                }
            });
        },
        /**
         * 显示详情
         * @param  {[type]} option [description]
         * @param  {[type]} roads  [description]
         * @param  {[type]} index  [description]
         * @return {[type]}        [description]
         */
        showDetail: function(option, roads) {
            var self = this;
            self.closePop();
            var sroads = [],
                xroads = [],
                onlineRoads = [],
                onlineRoadx = [];
            if (roads) {
                //卡口弹窗统计道路
                var sroads = [],
                    xroads = [],
                    onlineRoads = [],
                    onlineRoadx = [];
                if (roads.length > 0) {
                    for (var i = roads.length - 1; i >= 0; i--) {
                        if (roads[i].channeldirection === 1) {
                            sroads.push(roads[i]);
                            if (roads[i].channelstatus === 1) {
                                onlineRoads.push(roads[i]);
                            }
                        } else {
                            xroads.push(roads[i]);
                            if (roads[i].channelstatus === 1) {
                                onlineRoadx.push(roads[i]);
                            }
                        }
                    }
                }
                option.sroadslen = sroads.length;
                option.xroadslen = xroads.length;
                option.onlineRlens = onlineRoads.length;
                option.onlineRlenx = onlineRoadx.length;
            }
            WindowView.init(map);
            WindowView.showBayonetWindow(option);
            //        Template.renderByTemplate("POP").then(function(tpl) {
            //            var $pop = $(tpl(option));
            //            $(".closeBtn", $pop).on("click", function() {
            //                self.closePop();
            //            });
            $('.gate-button').on('click', function(event) {
                event.preventDefault();
                /* Act on the event */
                var params = {
                    module: $(this).attr('data-gate'),
                    monitorId: $(this).parent().siblings('span').attr('data-id')
                };
                /**
                 * 先判断是否有交通管理的权限，根据大权限进行控制，后续再细化
                 * by zhangyu on 2015/5/28
                 */
                if (checkPvd()) {
                    window.open('/module/iframe/?windowOpen=1&iframeUrl=/module/gate/vim/index.html?' + $.param(params), "pvd", 'resizable=yes,fullscreen=yes');
                } else {
                    notify.warn("当前无权限访问该功能");
                }
            });
            //         //（默认点击点位图标,相对于地图卡口点位）如果是从树上点击显示的信息窗，则需要移动下位置, by zhangyu on 2015/5/9
            //         var popOffset = new NPMapLib.Geometry.Size(0, 0);
            //            if (option.flag) {
            //                //如果是从pva中来（搜索结果的点击,相对于小水滴）
            //                popOffset = new NPMapLib.Geometry.Size(-2, -12);
            //            } else if (!option.marker && option.markerType === "map-marker") {
            //                //从左侧树中来,相对于大头针
            //                popOffset = new NPMapLib.Geometry.Size(-8, -18);
            //            }
            //            //pop
            //            var point = new NPMapLib.Geometry.Point(option.lon, option.lat);
            //            self.map.setCenter(point, self.map.getMaxZoom() - 2);
            //            self.pop = new NPMapLib.Symbols.InfoWindow(point, '', $pop[0], {
            //                width: 420,
            //                height: 150,
            //                autoSize: false,
            //                offset: popOffset,
            //                useDomStyle: true,
            //                'positionBlock': self._getPopPotion(300, 10, 1),
            //                isAdaptation: false,
            //                paddingForPopups: new NPMapLib.Geometry.Extent(15, 15, 15, 40)
            //            });
            //            self.map.addOverlay(self.pop);
            //            self.pop.getContentDivStyle().border = '0';
            //            self.pop.open();
            //         //触发pva信息窗关闭事件，add by zhangyu on 2015/5/6
            //         PubSub.publishSync("bindInfoWindowEvents", {
            //          marker: option.marker,
            //          gateData: option
            //         });
            //        });
        },

        /***地图相关***/
        /**
         * 初始化地图图层
         * @return {[type]} [description]
         */
        getLayer: function() {
            if (!this.layer) {
                this.layer = new NPMapLib.Layers.OverlayLayer(this.MAP_LAYER_NAME);
                this.map.addLayer(this.layer);
            }
            return this.layer;
        },
        /**
         * 获取弹窗位置信息
         * @param  {int} width        宽
         * @param  {int} offsetheight 高度便宜
         * @param  {int} borderWidth  边框宽度
         * @return {[type]}              [description]
         */
        _getPopPotion: function(width, offsetheight, borderWidth) {
            width = width || width === 0 ? -(width - 16) / 2 : -207;
            offsetheight = offsetheight || offsetheight === 0 ? (0 - offsetheight) : -32;
            borderWidth = borderWidth || borderWidth === 0 ? (12 + borderWidth) : 14;
            return {
                offset: new NPMapLib.Geometry.Size(width, offsetheight),
                paddingY: borderWidth,
                imageSrc: '/module/inspect/dispatch/js/pvd/monitor/images/map/arr.png',
                imageSize: {
                    width: 16,
                    height: 12
                }
            };
        },
        /**
         * pva地图工具栏中卡口资源的显示，add by zhangyu on 2015/5/6
         * @param  {object} $container 树容器
         * @param  {object} map        地图对象
         * @return {[type]}            [description]
         */
        showBayonet: function() {
            //初始化卡口点位
            this._initGates();
            this.showLayer();
            this._inited = true;
        },
        /**
         * 关闭卡片
         * @return {[type]} [description]
         */
        closePop: function() {
            this.pop && this.pop.close();
        },
        showLayer: function() {
            this.layer && this.layer.show();
        },
        hideLayer: function() {
            this.layer && this.layer.hide();
        },
        removeAllOverlays: function() {
            this.getLayer().removeAllOverlays();
        },
        searchNodes: function(key) {
            this.gateTree.searchNodes(key);
        }

    };

    return Controller;
});