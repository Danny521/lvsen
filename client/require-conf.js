requirejs.config({
    urlArgs: "v=" + (new Date()).getTime(),
    baseUrl: '.',
    paths : {
        'canvas' : '/libs/canvas/excanvas',
        'echarts-plain' : '/libs/echart/echarts-plain',
        'echarts-plain-original' : '/libs/echart/echarts-plain-original',
        'handlebars' : '/libs/handlebars/handlebars',
        'html5' : '/libs/html5/html5',
        'jit' : '/libs/jit/jit',
        'jquery' : '/libs/jquery/jquery-1.10.2.min',
        'jquery.datetimepicker' : '/libs/jquery/jquery.datetimepicker',
        'jquery.jcarousel' : '/libs/jquery/jquery.jcarousel',
        'jquery.Jcrop' : '/libs/jquery/jquery.Jcrop',
        'jquery.pagination' : '/libs/jquery/jquery.pagination',
        'jquery.placeholder' : '/libs/jquery/jquery.placeholder',
        'jquery.validate' : '/libs/jquery/jquery.validate',
        'jquery.watch' : '/libs/jquery/jquery.watch',
        'jquery.ztree.all-3.5.min' : '/libs/jquery/jquery.ztree.all-3.5.min',
        'jquery-ui' : '/libs/jquery/jquery-ui',
        'jquery-ui-1.10.1.custom.min' : '/libs/jquery/jquery-ui-1.10.1.custom.min',
        'jquery-ui-1.10.4.interaction.min' : '/libs/jquery/jquery-ui-1.10.4.interaction.min',
        'jquery-ui-timepicker-addon' : '/libs/jquery/jquery-ui-timepicker-addon',
        'media-query' : '/libs/jquery/media-query',
        'tree.jquery' : '/libs/jquery/tree.jquery',
        'jquery.fly'  : '/libs/jquery/jquery.fly',
        'mootools' : '/libs/mootools/mootools',
        'WdatePicker' : '/component/My97DatePicker/WdatePicker',
        'plupload' : '/libs/plupload/plupload.full',
        'pubsub' : '/libs/pubsub/pubsub',
        'broadcast':'/libs/pubsub/broadcast',
        'raphael' : '/libs/raphael/raphael-min',
        'scrollbar' : '/libs/scrollbar/scrollbar',
        'socket' : '/libs/socket/socket.io',
        'spectrum' : '/libs/spectrum/spectrum',
        'thickbox' : '/libs/thickbox/thickbox',
        'thumbs-balance' : '/component/thumbs-balance/thumbs.balance',
        'underscore' : '/libs/underscore/underscore',
        'OpenLayers' : '/libs/v1.0/Init',
        'base.self' : '/component/base/base.self',
        'common.cascade' : '/component/cascade/common.cascade',
        'panel' : '/component/panel/main',
        'domReady' : '/libs/requirejs/domReady',
        'ajaxModel' : '/component/base/ajaxModel',
        "menu":'/module/common/js/menu',
        "tree":'/module/maintenance/common/js/tree',
        "log" : "/module/maintenance/logs/js/log",
        "orgnScrollbar" : "/module/maintenance/common/js/scrollbar",
        'settings':'/module/settings',
        'DrawEditor' : '/libs/raphael/DrawEditor',
        'permission' : '/module/common/permission/permission',
        'nativePlayer' : '/module/common/js/nativePlayer',
        'basePlayer' : '/module/common/js/base-player',
        'commonPlayer' : '/module/common/js/common.player',
        'resourceImport' : '/module/common/resource-import/resource_import',
        'player' : '/module/common/js/player',
        'new-player' : '/module/common/js/ocx',
        'npmapConfig' : '/module/common/js/npmap-config',
        'addPlayer' : '/module/common/addPlayer/new-player',
        'toolBar' : '/module/imagejudge/resource-process/js/toolBar',
        'raphael.json' : '/libs/raphael/raphael.json',
        'Message'    :'/module/common/js/message',
        'ocxError':'/module/common/js/ocx-error-code',
        'md5' : '/libs/md5/md5.min',
        'pvaConfig': '/component/base/pva-conf',
        'npgis2': '/libs/npgis2/module/Npgis2',
        'json': '/libs/localStorage/json2',
        'localStorage' : '/libs/localStorage/localStorage',
        'cxSelect': '/libs/jquery/jquery.cxselect',
        'pvbEnterLib': '/module/pvb/js/enterlib-main', // 入视图库
        'selectBox': '/module/common/select-box/select'
     },
    map: {
        '*': {
            'style': '/lbsplat/libs/requirejs/css.js',
            'text': '/lbsplat/libs/requirejs/text.js'
        }
    },
    shim : {
        'jquery.datetimepicker' : {
            deps : ['jquery']
        } ,
        'jquery.jcarousel' : {
            deps : ['jquery']
        } ,
        'jquery.Jcrop' : {
            deps : ['jquery']
        },
        'jquery.pagination' : {
            deps : ['jquery']
        },
        'jquery.placeholder' : {
            deps : ['jquery']
        },
        'jquery.validate' : {
            deps : ['jquery']
        },
        'jquery.watch' : {
            deps : ['jquery']
        },
        'jquery.ztree.all-3.5.min' : {
            deps : ['jquery']
        },
        'jquery-ui' : {
            deps : ['jquery']
        },
        'jquery-ui-1.10.1.custom.min' : {
            deps : ['jquery']
        },
        'jquery-ui-1.10.4.interaction.min' : {
            deps : ['jquery']
        },
        'jquery-ui-timepicker-addon' : {
            deps : ['jquery','jquery-ui']
        },
        'media-query' : {
            deps : ['jquery']
        },
        'tree.jquery' : {
            deps : ['jquery']
        },
        'common.cascade' : {
            deps : ['mootools', 'jquery']
        },
        'ajaxModel' : {
            deps : ['jquery']
        },
        'base.self' : {
            deps : ['mootools', 'jquery']
        },
        'underscore' : {
            exports : '_'
        },
        'mootools' : {
            exports : 'MooTools'
        },
        'handlebars' : {
            exports : 'Handlebars'
        },
        'domReady' : {
            exports : 'domReady'
        },
        'echart' : {
            exports : "echarts-plain-original"
        },
        'thickbox' : {
            exports : 'thickbox'
        },
        'datetimepicker' : {
            exports : "jquery-ui-timepicker-addon"
        },
        "tree" : {
            deps : ['jquery',"mootools","handlebars"]
        },
        "log" : {
            deps : ["tree"]
        },
        'DrawEditor' : {
            deps : ['jquery', 'raphael']
        },
        'permission' : {
            deps : ['jquery', 'mootools']
        },
        'player' : {
            deps : ['jquery', 'mootools']
        },
        'new-player' :{
            deps : ['jquery','mootools']
        },
        'thumbs-balance' : {
            deps : ['jquery']
        },
        'spectrum' : {
            deps : ['jquery']
        },
        'panel' : {
            deps : ['jquery', 'mootools']
        },
        'raphael.json' : {
          deps : ['raphael']
        },
        'toolBar' : {
            deps : ['raphael.json', 'mootools', 'jquery']
        },
        'menu' : {
            deps : ['jquery','mootools']
        },
        'Message' : {
            deps : ['jquery','mootools','ajaxModel','handlebars']
        },
        'localStorage': {
            deps : ['json'],
            exports : 'localStorage'
        },
       'cxSelect': {
            deps: ['jquery']
        }
    }
});