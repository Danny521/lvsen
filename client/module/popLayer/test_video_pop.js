/**
 *
 * @authors lrxia (lrxia@netposa.com)
 * @date    2015/7/9
 * @version $
 */
require(['/require-conf.js'],function() {
    require(['js/popVideo.js','base.self'], function (POPVIDEO) {
        /*
        * 1.需要该视频的所有数据
        * 2.必须引用视频html模板
        * */


      /*  var videoData={
            fileName:"内部监控_31",
            fileFormat:"smf",
            fileSize:537409992,
            remark:'sfsdfs',
            id:151,
            shootTime:1436164199000,
            timeLag:null,
            curListIndex:null,
            fileType:2,
            sourceType:null,
            cameraId:274,
            "beginTime":1436855740000,
            "endTime":1436859423000
        };
        var option = {
            pop_tpl_url:'/module/popLayer/inc/d_video.html',
            videoData:videoData,
            isPopBgWrap:false,/!*用来判断是否以弹出框的形式展示 true 或者不写 此项则默认为 弹出*!/
            popBgWarp:$('#testVideoWarp')
        }
        POPVIDEO.init(option);*/


       /* POPVIDEO.init({pop_tpl_url:'/module/popLayer/inc/d_video.html',
            videoData:{
                fileName:"内部监控_31",
                fileFormat:"smf",
                fileSize:537409992,
                remark:'sfsdfs',
                id:151,
                shootTime:1436164199000,
                timeLag:null,
                curListIndex:null,
                fileType:2,
                sourceType:null,
                cameraId:96,
                "beginTime":1436855740000,
                "endTime":1436859423000
            },
            isPopBgWrap:false,
            popBgWarp:$('#testVideoWarp')});*/



        $("#button").click(function () {
            var videoData={
                fileName:"内部监控_31",/*视频名称*/
                fileFormat:"smf",/*视频格式*/
                fileSize:537409992,/*视频大小*/
                remark:'sfsdfs',/*视频备注*/
                id:151,
                shootTime:1436164199000,/*拍摄时间*/
                timeLag:null,
                curListIndex:null,/*当前视频在视频列表中的索引*/
                fileType:2,/*默认*/
                sourceType:null,/*入库的时候有用*/
                cameraId:96,/*摄像机id 必须*/
                "beginTime":1436855740000,/*视频开始时间 必须*/
                "endTime":1436859423000/*视频播放结束时间 必须*/
            };
            var option = {
                pop_tpl_url:'/module/popLayer/inc/d_video_w.html',
                videoData:videoData
               /* isPopBgWrap:false,/!*用来判断是否以弹出框的形式展示 true 或者不写 此项则默认为 弹出*!/
                popBgWarp:$('#testVideoWarp'),如果isPopBgWrap为false则添加该项 表示视频在哪里显示*/
               /* addPlayELe:{/!*去掉某个元素的时候用 key 的value为改元素的class 或者id 也可以不写，只要key值存在 即表示不显示改元素*!/
                    isNowTime:'.vbar-left',/!*快进*!/
                    isProgressBar:'.progress-bar',/!*进度条*!/
                    isRewind:'.rewind',/!*快退*!/
                    isForward:'.forward',/!*快进*!/
                    isDownload:'.download',/!*下载*!/
                    isBgsider:'.bg-sider'/!*右边栏*!/
                }*/
            }
            POPVIDEO.init(option);
        })
    })

})