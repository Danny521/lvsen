/**
 * Created by Zhangyu on 2015/4/20.
 */
define([
    "js/connection/controller/left-resource-controller",
    "js/connection/view/left-resource-view",
    "jquery",
    "pubsub"
], function(ResourceController, ResourceView, jQuery, PubSub) {

    return (function(scope, $) {

        var //页面初始化定时器对象
            _interval = null,
            //事件处理程序
            _handler = {
                //警力调度按钮点击的业务逻辑处理事件
                PoliceSchedule: function(e) {
                    require(["js/npmap-new/task/police-schedule"], function(PoliceSchedule) {
                        PoliceSchedule.init();
                    });
                    e.stopPropagation();
                },
                //全景追逃按钮点击的业务逻辑处理事件
                FullView: function(e) {
                    require(["js/npmap-new/task/panoramic-pursuit"], function(FullView) {
                        FullView.init();
                    });
                    e.stopPropagation();
                },
                //GPS监控
                GpsMonitor: function(e) {
                    require(["js/npmap-new/map-common", "js/sidebar/sidebar", 'js/npmap-new/task/gps-track'], function(mapCommon, SideBar, GpsTrack) {
                        //初始化信息窗模板
                        mapCommon.loadTemplate("inc/sidebar/gps-track.html", function(compiler) {
                            //保存模板对象
                            _compiler = compiler;
                            //渲染勾选警卫路线摄像机相关
                            SideBar.push({
                                name: "#sidebar-body",
                                markName: "gpsteack",
                                template: $.trim(compiler({}))
                            });
                            //初始化
                            GpsTrack.init();
                        }, function() {
                            notify.warn("轨迹分析模板加载失败！");
                        });
                    });
                    e.stopPropagation();
                },
                //路径规划
                RoutePlan: function(e) {
                    require(["js/npmap-new/map-common", "js/sidebar/sidebar", 'js/npmap-new/task/path-planning'], function(mapCommon, SideBar, pathPlanning) {
                        //初始化信息窗模板
                        mapCommon.loadTemplate("inc/sidebar/path-planning.html", function(compiler) {
                            //渲染勾选警卫路线摄像机相关
                            SideBar.push({
                                name: "#sidebar-body",
                                markName: "pathplanning",
                                template: $.trim(compiler({}))
                            });
                            //初始化
                            pathPlanning.init();
                        }, function() {
                            notify.warn("路径规划模板加载失败！");
                        });
                    });
                },
                //电子防区按钮的业务逻辑处理事件
                DefenceArea: function(e) {
                    require(["js/npmap-new/map-common", "js/sidebar/sidebar", 'js/npmap-new/task/electronic-defense-area'], function(mapCommon, SideBar, eleDefenseArea) {
                        //初始化信息窗模板
                        mapCommon.loadTemplate("inc/sidebar/electronic-defense.html", function(compiler) {
                            //渲染勾选警卫路线摄像机相关
                            SideBar.push({
                                name: "#sidebar-body",
                                markName: "eledefencearea",
                                template: $.trim(compiler({}))
                            });
                            //初始化
                            eleDefenseArea.init();
                        }, function() {
                            notify.warn("电子防区模板加载失败！");
                        });
                    })
                    e.stopPropagation();
                },
                //平面地图按钮的业务逻辑处理事件
                FlatMap: function(e) {
                    require(["js/npmap-new/map-common", "js/sidebar/sidebar", 'js/npmap-new/task/flat-map'], function(mapCommon, SideBar, FlatMap) {
                        //初始化信息窗模板
                        mapCommon.loadTemplate("inc/sidebar/flat-map.html", function(compiler) {
                            //保存模板对象
                            _compiler = compiler;
                            //渲染勾选警卫路线摄像机相关
                            SideBar.push({
                                name: "#sidebar-body",
                                markName: "platMap",
                                template: $.trim(compiler({}))
                            });
                            //初始化
                            FlatMap.init();
                        }, function() {
                            notify.warn("平面地图模板加载失败！");
                        });
                    });
                    e.stopPropagation();
                },
                //获取防空圈列表
                DefenceCircle: function(e) {
                    require(["js/npmap-new/map-common", "js/sidebar/sidebar", 'js/npmap-new/task/prevention-circle'], function(mapCommon, SideBar, PreventionCircle) {
                        //初始化信息窗模板
                        mapCommon.loadTemplate("inc/sidebar/defence-circle.html", function(compiler) {
                            //保存模板对象
                            _compiler = compiler;
                            //渲染勾选警卫路线摄像机相关
                            SideBar.push({
                                name: "#sidebar-body",
                                markName: "DefenceCircle",
                                template: $.trim(compiler({}))
                            });
                            //初始化
                            PreventionCircle.init();
                        }, function() {
                            notify.warn("防控圈模板加载失败！");
                        });
                    });
                    e.stopPropagation();
                },
                //左侧资源加载-摄像机
                LoadCamera: function(e) {
                    ResourceView.loadCameraTree.call(ResourceView);
                    e.stopPropagation();
                },
                //左侧资源加载-卡口
                LoadBayonet: function(e) {
                    ResourceView.loadBayonetRes.call(ResourceView);
                    e.stopPropagation();
                },
                //左侧资源加载-警车
                LoadPolice: function(e) {
                    ResourceView.loadPoliceRes.call(ResourceView);
                    e.stopPropagation();
                },
                //左侧资源加载-警员
                LoadPoliceman: function(e) {
                    ResourceView.loadPolicemanRes.call(ResourceView);
                    e.stopPropagation();
                },
                //左侧资源加载-灯杆
                LoadLightbar: function(e) {
                    ResourceView.loadLightbarRes.call(ResourceView);
                    e.stopPropagation();
                },
                //左侧资源加载-道路
                LoadMapRoute: function(e) {
                    ResourceView.loadMapRouteRes.call(ResourceView);
                    e.stopPropagation();
                },
                //显示我的关注列表
                LoadMyFavoriteMark: function(e) {
                    require(['js/npmap-new/task/my-favorite-mark'], function(MyFavoriteMark) {
                        var $container = $(".favorite .favorite-body");
                        MyFavoriteMark.dealOnLoadMyAttention($container, map);
                    });
                    e.stopPropagation();
                },
                //显示我的关注路线列表
                LoadMyFavoriteRoute: function(e) {
                    require(["js/connection/controller/left-favorite-route-controller"], function(favoriteRouteController) {
                        favoriteRouteController.dealOnLoadMyFavoriteRoute.call(favoriteRouteController);
                    });
                },
                //切换到收藏夹，默认显示我的关注
                InitFavorite: function(e) {
                    _interval = window.setInterval(function() {
                        _initPanel($("#content").find(".favorite li[data-handler='LoadMyFavoriteMark']"));
                    }, 1);
                    e.stopPropagation();
                },
                //获取警卫路线列表
                LoadGuardRouteGroup: function(e) {
                    require(["js/npmap-new/map-common", "js/sidebar/sidebar", 'js/npmap-new/task/guard-route'], function(mapCommon, SideBar, GuardRoute) {
                        //初始化信息窗模板
                        mapCommon.loadTemplate("inc/sidebar/route.html", function(compiler) {
                            //保存模板对象
                            _compiler = compiler;
                            //渲染勾选警卫路线摄像机相关
                            SideBar.push({
                                name: "#sidebar-body",
                                markName: "guard-route",
                                template: $.trim(compiler({}))
                            });
                            //初始化
                            GuardRoute.init();
                        }, function() {
                            notify.warn("警卫路线模板加载失败！");
                        });
                    });
                    e.stopPropagation();
                },
                //轮巡播放
                PollPlay: function(e) {
                    require(["js/map-inspect"], function(mapInspect) {
                        mapInspect.start();
                    });
                    e.stopPropagation();
                },
                VimAnalysis: function(e) {
                    require(["js/npmap-new/map-common", "js/sidebar/sidebar", 'js/sidebar/analysis', 'js/npmap-new/task/track-analysis'], function(mapCommon, SideBar, analysis, TrackAnalysis) {
                        /**
                         * 先判断是否有交通管理的权限，根据大权限进行控制，后续再细化
                         * by zhangyu on 2015/5/28
                         */
                        if (checkPvd()) {
                            //初始化信息窗模板
                            mapCommon.loadTemplate("inc/sidebar/analysis.html", function(compiler) {
                                //保存模板对象
                                _compiler = compiler;
                                //渲染勾选警卫路线摄像机相关
                                SideBar.push({
                                    name: "#sidebar-body",
                                    markName: "analysis",
                                    template: $.trim(compiler({}))
                                });
                                //初始化
                                analysis.init();
                                //轨迹查车
                                TrackAnalysis.init();
                            }, function() {
                                notify.warn("轨迹分析模板加载失败！");
                            });
                        } else {
                            notify.warn("当前无权限访问该功能");
                        }
                    });
                    e.stopPropagation();
                }
            },
            /**
             * 事件绑定
             */
            _bindEvents = function() {
                //绑定业务事件
                $("#content").on("click", "#sidebar-body .np-business-click, .np-left-resource-fliter li.np-business-click, .poll-time .np-business-click, .np-sidebar-header .np-business-click", function(e) {
                    _handler[$(this).data("handler")].call(this, e);
                });
                //绑定面包屑“home”、左侧tab、业务功能的点击事件
                $("#content").on("click", ".np-map-overlay", function(e) {
                    var self = this;
                    require([
                        "js/npmap-new/map-common",
                        "js/npmap-new/task/police-schedule",
                        "js/npmap-new/task/panoramic-pursuit",
                        "js/npmap-new/task/electronic-defense-area",
                        "js/npmap-new/task/cluster",
                        "js/npmap-new/map-variable",
                        "js/npmap-new/task/gps-track",
                        "js/npmap-new/task/info-window"
                    ], function(MapCommonFun, PoliceSchedule, Fullview, DefenceArea, Cluster, mapVariable,GpsTrack,InfoWindow) {
                        Cluster.showOrHideAllResourceLayer(true);
                        //更新报警信息按钮的样式
                        MapCommonFun.IfClickAlarmInfo(false);
                        if (!($(e.target).hasClass("np-fullview") || $(e.target).parent().hasClass("np-fullview"))) {
                            Fullview.cancelFullView(); //取消全景事件
                        }
                        if (!($(e.target).hasClass("np-police-schedule") || $(e.target).parent().hasClass("np-police-schedule"))) {
                            PoliceSchedule.cancelPoliceSchedule(); //取消警力调度事件
                        }
                        if ($(e.target).hasClass("np-fullview") || $(e.target).parent().hasClass("np-fullview")) {
                            Fullview.activeMouseContext(); //如果是全景的话激活全景，防止警力调度等其他事件取消是影响全景提示
                        }
                        if (!($(e.target).hasClass("np-defense") || $(e.target).parent().hasClass("np-defense"))) {
                            DefenceArea.clearGpsTimer(); //清空电子防区的警力刷新定时器
                        }
                        var myAttentionlayer = window.map.getLayerByName("myAttentionlayer");
                        if (myAttentionlayer) {
                            myAttentionlayer.removeAllOverlays();
                        }
                        //移除GPS播放控件
                        GpsTrack.removeGPSPlayControl();
                        //清除当前摄像机信息的存储
                        mapVariable.currentCameraData = null;
                        //释放视频放大窗口(隐藏)
                        $("#streetMap1").addClass("infinity");
                        $("#dataPager").hide();//隐藏分页
                        InfoWindow.closeCameraWindow();
                        PubSub.publish("removeClickedCss", mapVariable.currentCameraData);
                        if (window.map) {
                            //清除覆盖物
                            var layer = window.map.getLayerByName("pva-graphics");
                            if (layer) {
                                layer.removeAllOverlays();
                            }
                            window.map.clearOverlays();
                            //取消地图绘制
                            var mapTools = window.map.MapTools;
                            if (mapTools) {
                                mapTools.cancelDraw();
                            }
                            //清除地图上下文
                            if ($(self).hasClass("np-police-schedule") || $(self).hasClass('np-fullview')) {
                                return;
                            }
                            mapVariable.layers.resourceShowLayer.hide();
                            window.map.closeAllInfoWindows();
                            window.lbsInfowindow = null;
                            window.map.deactivateMouseContext();
                            window.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
                            window.map.removeEventListener(NPMapLib.MAP_EVENT_MOUSE_OVER);
                            window.map.removeEventListener(NPMapLib.MAP_EVENT_MOUSE_OUT);
                            window.map.removeEventListener(NPMapLib.MAP_EVENT_MOUSE_MOVE);
                        }
                    });
                });

                /**
                 * 根据情况释放警力调度和全景功能
                 * 在地图工具栏点击相关功能操作时，如果此时正处于全景或者警力调度上下文，则释放相关功能
                 */
                $(document).on("click", ".np-map-schedule-fullview", function() {
                    _releaseFullviewSchedule();
                });

                //绑定业务事件[轮训设置框使用]
                $("#poll-time").on("click", ".np-business-click", function(e) {
                    _handler[$(this).data("handler")].call(this, e);
                });
            },
            /**
             *移除GPS播放控件
             **/
            _clearGPSPlayControl = function() {
                $(".GPSPlayControl").remove();
            },
            /**
             * 面板的默认加载
             * @param $initObj - 待加载的事件dom对象
             * @private
             */
            _initPanel = function($initObj) {
                //判断页面是否加载完成
                if ($initObj.length !== 0) {
                    $initObj.trigger("click");
                    //关闭定时器
                    window.clearInterval(_interval);
                }
            },
            /**
             * 根据使用场景释放警力调度或者全景上下文
             * @private
             */
            _releaseFullviewSchedule = function() {
                require(["js/npmap-new/task/police-schedule", "js/npmap-new/task/panoramic-pursuit"], function(PoliceSchedule, Fullview) {
                    PoliceSchedule.cancelPoliceSchedule(); //取消警力调度事件
                    Fullview.cancelFullView(); //取消全景事件
                });
            },
            /**
             * 左侧资源面板加载摄像机资源
             * @private
             */
            _initCameraResource = function() {
                _interval = window.setInterval(function() {
                    _initPanel($("#content").find(".np-left-resource-fliter li[data-handler='LoadCamera']"));
                }, 1);
            };

        /**
         * 加载摄像机资源
         */
        scope.init = function() {
            //绑定事件
            _bindEvents();
            //加载摄像机资源
            _initCameraResource();
        };

        /**
         * 订阅事件,释放警力调度或者全景上下文
         * 在处于警力调度中，点击了地图上的点位资源
         */
        PubSub.subscribe("releaseFullviewSchedule", function() {
            _releaseFullviewSchedule();
        });

        return scope;

    }({}, jQuery));
});