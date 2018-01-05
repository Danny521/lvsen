define(['js/pvd/monitor/mapConfig', 'handlebars'],function(mapConfig, Handlebars) {
    var mapFlag = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
        SMALLMARK_PINK_IMGURL = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-smallpink/',
        SMALLHOVERMARK_PINK_IMGURL = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-smallpinkhover/',
        STARTMARKER_IMG = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-start.png',
        ENDMARKER_IMG = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-end.png',
        TRACKED = '/module/inspect/dispatch/js/pvd/monitor/images/map/marker/tracked.png',
        SMALLMARK_COINCIDE_IMG = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-smallcoincide.png',
        SMALLMARK_PINK_IMG = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-smallpink.png',
        SMALLMARK_FILL_IMG = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-smallfill.png',
        SMALLMARK_FILL_IMG3 = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-smallfill3.png',
        SMALLHOVERMARK_GREEN_IMG = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-smallgreenhover.png',
        SMALLHOVERMARK_BLUE_IMG = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-smallbluehover.png',
        SMALLMARK_GREEN_IMG = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-smallgreen.png',
        SMALLMARK_BLUE_IMG = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-smallblue.png',
        DEFAULTCAR_IMGURL_170X170 = '/module/inspect/dispatch/js/pvd/monitor/images/vehicle-no-picture.png';
    // redMarkImg = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-red.png',
    // blueMarkImg = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-blue.png',
    // coincideMarkImg = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-coincide.png',
    // smallHoverMarkPinkImg = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-smallpinkhover.png',
    // smallMarkImg = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-small.png',
    // smallHoverMarkImg = '/module/inspect/dispatch/js/pvd/monitor/images/map/map-marker-smallhover.png',
    // bayonetUrl = '/module/inspect/dispatch/js/pvd/monitor/images/map/customRun.png',
    // bayonetNormalUrl = '/module/inspect/dispatch/js/pvd/monitor/images/map/custom_Normal.png',
    // bayonetHoverUrl = '/module/inspect/dispatch/js/pvd/monitor/images/map/custom_Hover.png';
    Handlebars.registerHelper('formartFlag', function(index, block) {
        return mapFlag[index % mapFlag.length];
    });
    Handlebars.registerHelper('formartNumFlag', function(index, block) {
        return ++index;
    });
    Handlebars.registerHelper('formartPic', function(imgUrl, block) {
        if (!imgUrl) {
            imgUrl = DEFAULTCAR_IMGURL_170X170;
        }
        return imgUrl;
    });
    return  {
        mapFlag: mapFlag,
        smallMarkPinkImgUrl: SMALLMARK_PINK_IMGURL,
        smallHoverMarkPinkImgUrl: SMALLHOVERMARK_PINK_IMGURL,
        tracked: TRACKED,
        startMarkerImg: STARTMARKER_IMG,
        endMarkerImg: ENDMARKER_IMG,
        smallMarkCoincideImg: SMALLMARK_COINCIDE_IMG,
        smallMarkPinkImg: SMALLMARK_PINK_IMG,
        smallHoverMarkGreenImg: SMALLHOVERMARK_GREEN_IMG,
        smallHoverMarkBlueImg: SMALLHOVERMARK_BLUE_IMG,
        smallMarkGreenImg: SMALLMARK_GREEN_IMG,
        smallMarkBlueImg: SMALLMARK_BLUE_IMG,
        smallMarkFillImg: SMALLMARK_FILL_IMG,
        smallMarkFillImg3: SMALLMARK_FILL_IMG3,
        /*
        获取红色Maker的图片路径
        */
        getRedUrl: function(text) {
            if (mapFlag.indexOf(text) >= 0) {
                return '/module/inspect/dispatch/js/pvd/monitor/images/map/marker/red_' + text + '.png';
            } else {
                return '/module/inspect/dispatch/js/pvd/monitor/images/map/marker/marker_num/red_' + text + '.png';
            }
        },
        /*
        获取蓝色Maker的图片路径
        */
        getBlueUrl: function(text) {
            if (mapFlag.indexOf(text) >= 0) {
                return '/module/inspect/dispatch/js/pvd/monitor/images/map/marker/blue_' + text + '.png';
            } else {
                return '/module/inspect/dispatch/js/pvd/monitor/images/map/marker/marker_num/blue_' + text + '.png';
            }
        },
        compareDate: function(strDate1, strDate2) {
            var date1 = new Date(strDate1.replace(/-/g, '/'));
            var date2 = new Date(strDate2.replace(/-/g, '/'));
            return date1 - date2;
        },
        addEventListeners: function(markers) {
            for (var i = 0; i < markers.length; i++) {
                this.addEventListener(markers[i]);
            }
        },
        addEventListener: function(marker) {
            if (marker.mouseover) {
                marker.removeEventListener(NPMapLib.MARKER_EVENT_MOUSE_OVER);
                marker.addEventListener(NPMapLib.MARKER_EVENT_MOUSE_OVER, marker.mouseover);
            }
            if (marker.mouseout) {
                marker.removeEventListener(NPMapLib.MARKER_EVENT_MOUSE_OUT);
                marker.addEventListener(NPMapLib.MARKER_EVENT_MOUSE_OUT, marker.mouseout);
            }
            if (marker.click) {
                marker.removeEventListener(NPMapLib.MARKER_EVENT_CLICK);
                marker.addEventListener(NPMapLib.MARKER_EVENT_CLICK, marker.click);
            }
        },
        changeIcon: function(marker, iconUrl, width, height) {
            var icon = marker.getIcon();
            icon.setImageUrl(iconUrl);
            icon.setImageSize(new NPMapLib.Geometry.Size(width, height));
            marker.setIcon(icon);
            marker.refresh();
        },
        getMarkersByPosition: function(lon, lat, currentlayer, filter) {
            var features = currentlayer.getOverlaysArry(),
                feature,
                position,
                isFilter = true,
                markers = [];
            for (var i = 0; i < features.length; i++) {
                feature = features[i];
                if (feature instanceof NPMapLib.Symbols.Marker) {
                    position = feature.getPosition();
                    if (filter && typeof filter === 'function') {
                        isFilter = filter(feature);
                    }
                    if (position.lon === lon && position.lat === lat && isFilter) {
                        markers.push(feature);
                    }
                }
            }
            return markers;
        },
        getMarkersByCustomID: function(id, currentlayer, name) {
            var features = currentlayer.getOverlaysArry(),
                feature,
                customData;
            for (var i = 0; i < features.length; i++) {
                feature = features[i];
                if (feature) {
                    customData = feature.getData();
                    if (customData && customData[name ? name : 'id'] === id && feature instanceof NPMapLib.Symbols.Marker) {
                        return feature;
                    }
                }
            }
            return null;
        },
        getMarkersByCustomFilter: function(currentlayer, filter) {
            var features = currentlayer.getOverlaysArry(),
                feature,
                customData;
            for (var i = 0; i < features.length; i++) {
                feature = features[i];
                if (feature) {
                    customData = feature.getData();
                    if (filter(customData) && feature instanceof NPMapLib.Symbols.Marker) {
                        return feature;
                    }
                }
            }
            return null;
        },
        getContaiMarkers: function(layer, geometry) {
            var markers = layer.containFeatures(geometry, function(feature) {
                if ((mapConfig.conflux.enble && feature instanceof NPMapLib.Symbols.ClusterMarker) ||
                    (!mapConfig.conflux.enble && feature instanceof NPMapLib.Symbols.Marker)) {
                    return true;
                }
                return false;
            });
            if (markers && markers.length > 0) {
                return markers;
            }
            return [];
        },
        zoomByPoints: function(points, map) {
            if (!points || points.length <= 0) {
                return;
            }
            var p = points[0];
            var a = p.clone();
            var max = p.clone();
            var temp;
            for (var i = 1, len = points.length; i < len; i++) {
                temp = points[i];
                if (temp.lon === undefined || temp.lon === null && temp.lon === '' ||
                    temp.lat === undefined || temp.lat === null && temp.lat === '') {
                    continue;
                }
                if (temp.lon > max.lon) {
                    max.lon = temp.lon;
                } else if (temp.lon < a.lon) {
                    a.lon = temp.lon;
                }
                if (temp.lat > max.lat) {
                    max.lat = temp.lat;
                } else if (temp.lat < a.lat) {
                    a.lat = temp.lat;
                }
            }
            if (!(a.lon === undefined || a.lon === null && a.lon === '' ||
                    a.lat === undefined || a.lat === null && a.lat === '')) {
                setTimeout(function() {
                    var extent = new NPMapLib.Geometry.Extent(a.lon, a.lat, max.lon, max.lat);
                    map.zoomToExtent(extent);
                });
            }
        },
        createMarker: function(options) {
            var marker;
            if (options.isCar) {
                var y = 13;
                if (options.height && options.height > 0) {
                    y = options.height / 2;
                }
                var offset = new NPMapLib.Geometry.Size(0, y);
                marker = new NPMapLib.Symbols.Marker(options.point, {
                    offset: offset
                });
                marker.setIcon(new NPMapLib.Symbols.Icon(options.iconUrl, new NPMapLib.Geometry.Size(options.width > 0 ? options.width : 28, options.height > 0 ? options.height : 26)));

            } else {
                marker = new NPMapLib.Symbols.Marker(options.point);
                var size = new NPMapLib.Geometry.Size(options.width > 0 ? options.width : 28, options.height > 0 ? options.height : 26),
                    icon = new NPMapLib.Symbols.Icon(options.iconUrl, size);
                icon.setAnchor(new NPMapLib.Geometry.Size(-size.width / 2, -size.height / 2));
                marker.setIcon(icon);
                options.label && marker.setLabel(options.label);
            }
            marker.setData(options.addition);
            marker.mouseover = options.mouseover;
            marker.mouseout = options.mouseout;
            marker.click = options.click;
            return marker;
        },
        createClusterMarker: function(options) {
            var data = options.addition;
            data.lon = options.point.lon;
            data.lat = options.point.lat;
            return new NPMapLib.Symbols.ClusterMarker(data);
        },
        addFeatures: function(features, layer, _useCluster, map) {
            if (_useCluster) {
                var opt = {
                    // mouseover: function(f) {
                    //     f._onFeatureOver(f);
                    // },
                    // mouseout: function(f) {
                    //     f._onFeatureOut(f);
                    // },
                    // click: function(f) {
                    //     f._onFeatureClick(f);
                    // },
                    layNamer: layer.name
                };
                var clusterpoints = new NPMapLib.Symbols.ClusterPoints(features, opt);
                clusterpoints.setData({
                    mapId: map.id
                });
                layer.addOverlay(clusterpoints);
            } else {
                for (var i = 0; i < features.length; i++) {
                    if (features[i] instanceof(NPMapLib.Symbols.Marker)) {
                        features[i].setData({
                            id: features[i].id
                        });
                        layer.addOverlay(features[i]);
                        if (features[i].mouseover) {
                            features[i].addEventListener(NPMapLib.LABEL_EVENT_MOUSE_OVER, features[i].mouseover);
                        }
                        if (features[i].click) {
                            features[i].addEventListener(NPMapLib.LABEL_EVENT_CLICK, features[i].click);
                        }
                        if (features[i].mouseout) {
                            features[i].addEventListener(NPMapLib.LABEL_EVENT_MOUSE_OUT, features[i].mouseout);
                        }
                    } else if (features[i] instanceof(NPMapLib.Geometry.Polyline)) {
                        layer.addOverLay(features[i]);
                    }
                }
            }
        },
        getDistance: function(ps, index) {
            var distance = 0,
                d,
                length = index !== void 0 ? ++index : ps.length;
            for (var i = 1; i < length; i++) {
                // d = Math.sqrt((ps[i - 1].lon - ps[i].lon) * (ps[i - 1].lon - ps[i].lon) + (ps[i - 1].lat - ps[i].lat) * (ps[i - 1].lat - ps[i].lat));
                d = PAGE_MAP.getDistance(ps[i - 1], ps[i]);
                distance += d;
            }
            return distance;
        },
        getDrawMills: function(ps, map, speed, index) {
            // var distance = this.getDistance(ps, index),
            //     gisToolKit = new NPMapLib.GisToolKit();
            // return gisToolKit.getPlatDistanceByProjection(distance, map) / speed;
            var distance = this.getDistance(ps, index);
            return distance / speed;
        },
        getMarkerHeightById: function(id, layer) {
            var marker = this.getMarkersByCustomID(id, layer),
                icon;
            if (marker && (icon = marker.getIcon())) {
                return icon.getImageSize().height;
            }
            return 0;
        },
        getDrawSprit: function(ps, map, speed, stepIndex) {
            var distance = 0,
                d,
                index = 0,
                tempIndex,
                step = 0,
                gisToolKit = new NPMapLib.GisToolKit();
            for (var i = 1; i < ps.length; i++) {
                // d = Math.sqrt((ps[i - 1].lon - ps[i].lon) * (ps[i - 1].lon - ps[i].lon) + (ps[i - 1].lat - ps[i].lat) * (ps[i - 1].lat - ps[i].lat));
                d = PAGE_MAP.getDistance(ps[i - 1], ps[i]);
                distance += d;
                tempIndex = distance / speed;
                if (i === ps.length - 1 && tempIndex === stepIndex) {
                    index = i;
                    step = 0;
                    break;
                }
                if (tempIndex > stepIndex) {
                    index = i - 1;
                    step = Math.round(stepIndex - (distance - d) / speed);
                    break;
                }
            }
            return {
                index: index,
                step: step
            };
        },
        getVehicleInfoParam: function(width, offsetheight, borderWidth) {
            width = width || width === 0 ? -(width - 16) / 2 : -207;
            offsetheight = offsetheight || offsetheight === 0 ? (0 - offsetheight) : -32;
            borderWidth = borderWidth || borderWidth === 0 ? (12 + borderWidth) : 14;
            return {
                // 'offset': new NPMapLib.Geometry.Size(-207, 0),
                // 'padding': new NPMapLib.Geometry.Extent(0, 42, 0, 0), //这个只要调整第一个参数就可以了，第一个是尖的左右偏移量为宽度的一半
                // 'blocks': [{ // stem
                //     size: new NPMapLib.Geometry.Size(16, 12),
                //     anchor: new NPMapLib.Geometry.Extent(198, 4, null, null), //这个是图片相对marker的偏移
                //     position: new NPMapLib.Geometry.Pixel(0, 0)
                // }],
                offset: new NPMapLib.Geometry.Size(width, offsetheight),
                paddingY: borderWidth,
                imageSrc: '/module/inspect/dispatch/js/pvd/monitor/images/map/arr.png',
                imageSize: {
                    width: 16,
                    height: 12
                }
            };
        },
        /*添加 by fanll*/
        /**
         * 地图撒点
         * @param  {object}  layer    图层
         * @param  {array}  list     数据数组
         * @param  {object}  events   事件集合
         * @param  {Boolean} isAppend 是否追加
         * @param  {string}  pAttrs   位置信息属性名称,例"lon,lat"
         * @return {[type]}           [description]
         */
        sprinkleMarkers: function(layer, list, events, isAppend, pAttrs) {
            var self = this,
                lonIndex = "x",
                latIndex = "y",
                points = [];
            if (pAttrs) {
                var pas = pAttrs.split(",");
                lonIndex = pas[0];
                latIndex = pas[1];
            }
            if (!isAppend) {
                layer.removeAllOverlays();
            }
            var markers = this.markers = [],
                point = null,
                item = null;
            for (var i = 0, l = list.length; i < l; i++) {
                item = list[i];
                point = new NPMapLib.Geometry.Point(item[lonIndex], item[latIndex]);
                points.push(point);
                markers.push(self.createMarker({
                    iconUrl: self.getRedUrl(self.mapFlag[i]),
                    point: point,
                    width: 32,
                    height: 32
                }));
            }
            layer.addOverlays(markers);
            //events
            var currentIndex = null;
            var hoverIndex = null;

            function refreshMap() {
                self.zoomByPoints(points, PAGE_MAP);
            }

            function activeMarker(index, isSelected) {
                var marker, icon;
                if (isSelected) {
                    if (currentIndex != null) {
                        marker = markers[currentIndex];
                        icon = marker.getIcon();
                        icon.setImageUrl(self.getRedUrl(self.mapFlag[currentIndex]));
                        marker.setIcon(icon);
                        marker.setZIndex(-1);
                        marker.refresh();
                    }
                    currentIndex = index;
                }
                hoverIndex = index;
                marker = markers[index];
                icon = marker.getIcon();
                icon.setImageUrl(self.getBlueUrl(self.mapFlag[index]));
                marker.setIcon(icon);
                marker.setZIndex(9000);
                marker.refresh();
            }

            function blurMarker(index, force) {
                if (force || index != currentIndex) {
                    if (force) {
                        index = currentIndex;
                    }
                    if (index != null) {
                        var marker, icon;
                        marker = markers[index];
                        icon = marker.getIcon();
                        icon.setImageUrl(self.getRedUrl(self.mapFlag[index]));
                        marker.setIcon(icon);
                        marker.setZIndex(-1);
                        marker.refresh();
                    }
                }
            }
            for (var i = 0, l = markers.length; i < l; i++) {
                (function(i) {
                    markers[i].addEventListener(NPMapLib.MARKER_EVENT_CLICK, function() {
                        events.onclick && events.onclick(list[i], i);
                    });
                    markers[i].addEventListener(NPMapLib.MAP_EVENT_MOUSE_OVER, function() {
                        if (currentIndex != i) {
                            activeMarker(i);
                            events.onmouseover && events.onmouseover(list[i], i);
                        }
                    });
                    markers[i].addEventListener(NPMapLib.MAP_EVENT_MOUSE_OUT, function() {
                        if (currentIndex != i) {
                            blurMarker(i);
                        }
                        events.onmouseout && events.onmouseout(list[i], i);
                    });
                })(i);
            }
            refreshMap();
            return {
                refreshMap: refreshMap,
                activeMarker: activeMarker,
                blurMarker: blurMarker,
                removeAllMarkers: function() {
                    var marker;
                    for (var i = 0, l = markers.length; i < l; i++) {
                        marker = markers[i];
                        marker.removeEventListener(NPMapLib.MARKER_EVENT_CLICK);
                        marker.removeEventListener(NPMapLib.MAP_EVENT_MOUSE_OVER);
                        marker.removeEventListener(NPMapLib.MAP_EVENT_MOUSE_OUT);
                    }
                    var o = layer.removeAllOverlays();
                }
            };
        }
    };
});
