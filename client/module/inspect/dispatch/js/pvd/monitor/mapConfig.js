  define(["npmapConfig"],function() {
      /**********************GoogleOffLineLayer***************************/
      // module.exports = {
      //     'customNormal': '/assets/images/map/custom_Normal.png',
      //     'cluster1': '/assets/images/map/map-cluster-1.png',
      //     'cluster2': '/assets/images/map/map-cluster-2.png',
      //     'cluster3': '/assets/images/map/map-cluster-3.png',
      //     'cluster4': '/assets/images/map/map-cluster-4.png',
      //     'DisplayProjection': 'EPSG:4326',
      //     'projection': 'EPSG:900913',
      //     'layerType': 'GoogleOffLineLayer',
      //     'maxLevel': 18,
      //     'minLevel': 10,
      //     'url': '/map/GoogleOffLineLayer/',
      //     'CenterPoint': '13535918.034395, 3673726.0075593',
      //     'extent': '-20037508.34, -20037508.34, 20037508.34, 20037508.34',
      //     'MaxResolution': 2,
      //     'resolutions': '0.0018274260524776553, 0.0009137130262388277,0.0004568565131194138, 0.0002284282565597069,0.00011421412827985346, 0.00005710706413992673,0.000028553532069963364, 0.000014276766034981682,0.000007138383017490841, 0.0000035691915087454205,0.0000017845957543727103',
      //     'restrictedExtent': [13423402.728774, 3562204.3833067, 13657893.035257, 3796407.4379399],
      //     'NumZoomLevels': 20,
      //     'tilePixels': 256,
      //     'Tiletype': 'png',
      //     'origin': '-400, 399.9999999999998',
      //     'Units': 'm',
      //     'ZoomLevelSequence': 2,
      //     'zoomOffset': 0,
      //     'conflux': {
      //         'enble': true,
      //         'maxZoom': 17,
      //         'selectZoom': 17,
      //         'distance': 80
      //     }
      // };



      /**********************ArcgisTileLayer***************************/
      return  {
          /**********聚合点配置**********/
          // 'conflux': {
          //     /**********是否显示聚合点**********/
          //     'enble': mapConfig.clusterMarkerConfig.enable,
          //     /**********撒点层级**********/
          //     'maxZoom': mapConfig.clusterMarkerConfig.maxZoom,
          //     /**********点击聚合点的跳转层级**********/
          //     // 'selectZoom': mapConfig.clusterMarkerConfig.selectZoom,
          //     /**********聚合距离（像素）**********/
          //     'distance': mapConfig.clusterMarkerConfig.distance,
	         //  /**********聚合点位的加载方式（像素）**********/
	         //  "isAsynchronous": mapConfig.clusterMarkerConfig.isAsynchronous["bayonet"]
          // }
      };



      /**********************PGIS***************************/
      // module.exports = {
      //     'customNormal': '/assets/images/map/custom_Normal.png',
      //     'cluster1': '/assets/images/map/map-cluster-1.png',
      //     'cluster2': '/assets/images/map/map-cluster-2.png',
      //     'cluster3': '/assets/images/map/map-cluster-3.png',
      //     'cluster4': '/assets/images/map/map-cluster-4.png',
      //     'DisplayProjection': 'EPSG:900913',
      //     'projection': 'EPSG:3785',
      //     'layerType': 'PGIS', //PGIS£ºpgis·þÎñ£¬ArcgisTileLayer£ºarcgis·þÎñ
      //     'maxLevel': 20,
      //     'minLevel': 12,
      //     'url': '',
      //     'CenterPoint': '112.53929,37.84696',
      //     'extent': '110.4375,34.51562,114.25,40.5625',
      //     'MaxResolution': 2,
      //     'resolutions': '2,1,0.5,0.25,0.125,0.0625,0.03125,0.015625,0.0078125,0.00390625,0.001953125,0.0009765625,0.00048828125,0.000244140625,0.0001220703125,0.00006103515625,0.000030517578125,0.0000152587890625,0.00000762939453125,0.000003814697265625,0.0000019073486328125,9.5367431640625e-7,4.76837158203125e-7',
      //     'NumZoomLevels': 20,
      //     'tilePixels': 256,
      //     'Tiletype': 'png',
      //     'origin': '0,0',
      //     'Units': 'Lat-66',
      //     'ZoomLevelSequence': 2,
      //     'zoomOffset': 0
      // };

      /**********************TiandiMap***************************/
      // module.exports = {
      //     'customNormal': '/assets/images/map/custom_Normal.png',
      //     'cluster1': '/assets/images/map/map-cluster-red-1.png',
      //     'cluster2': '/assets/images/map/map-cluster-red-2.png',
      //     'cluster3': '/assets/images/map/map-cluster-red-3.png',
      //     'cluster4': '/assets/images/map/map-cluster-red-4.png',
      //     'conflux': {
      //         'enble': true,
      //         'maxZoom': 14,
      //         'selectZoom': 14,
      //         'distance': 120
      //     },
      //     minLevel: 10,
      //     maxLevel: 16,
      //     'layerType': 'TiandiMap',
      //     'labelYOffset': 2,
      //     'IElabelYOffset': -2,
      //     "restrictedExtent":[116.58693388281, 38.543688869141, 118.08656767188, 40.287768458984],
      //     'tiandiMapopts1': {
      //         mapType: 'EMap',
      //         centerPoint: [117.336750777345,39.4157286640625],
      //         fullExtent: [-180, -90, 180, 90],
      //         topLevel: 0,
      //         bottomLevel: 18,
      //         isBaseLayer: true,
      //         isLocalMap: true,
      //         url: 'http://127.0.0.1:11000/vec_c/',
      //         //mirrorUrls: ['http://tile0.tianditu.com/DataServer', 'http://tile1.tianditu.com/DataServer', 'http://tile2.tianditu.com/DataServer', 'http://tile3.tianditu.com/DataServer', 'http://tile4.tianditu.com/DataServer', 'http://tile5.tianditu.com/DataServer', 'http://tile6.tianditu.com/DataServer'],
      //         zoomOffset: 0
      //     },
      //     'tiandiMapopts2': {
      //         mapType: 'ESatellite',
      //         centerPoint: [117.336750777345,39.4157286640625],
      //         fullExtent: [-180, -90, 180, 90],
      //         topLevel: 0,
      //         bottomLevel: 18,
      //         isLocalMap: true,
      //         isBaseLayer: false,
      //         url: 'http://127.0.0.1:11000/cva_c/',
      //         //mirrorUrls: ['http://tile0.tianditu.com/DataServer', 'http://tile1.tianditu.com/DataServer', 'http://tile2.tianditu.com/DataServer', 'http://tile3.tianditu.com/DataServer', 'http://tile4.tianditu.com/DataServer', 'http://tile5.tianditu.com/DataServer', 'http://tile6.tianditu.com/DataServer'],
      //         zoomOffset: 0
      //     },
      //     CenterPoint: '117.336750777345,39.4157286640625'
      // };

  });
