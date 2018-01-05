/**
 *
 * @authors lrxia (lrxia@netposa.com)
 * @date    2015/7/9
 * @version $
 */
require(['/require-conf.js'],function() {
    require(['js/popVideo.js','base.self'], function (POPVIDEO) {
        $("#button").click(function () {
            /*播放PFS视频*/
            // 播放单个PFS视频
           /* var PFSObj = {
                popBgWarp: $('#testVideoWarp'), // 使用调用模块的Wrap(无弹出黑背景)，否则用公共的(有弹出黑背景)
                //showRightDetailInfo: false, // 是否显示右侧信息，默认显示
                baseInfo: {
                    fileName: "NPFS:192.168.60.155:9000/username=admin&password=admin#/voddownload/c82b5656-44db-4ca9-a439-f4d7b3973469.mbf", // 视频名称 PFS视频 必须
                    beginTime: 1448961325000, // 视频开始时间 历史录像、PFS 必须
                    endTime: 1448961367000, // 视频播放结束时间 历史录像、PFS 必须
                    fileSize: 537409992, // 视频大小
                    remark: 'sfsdfs', // 视频备注
                    adjustTime: "" // 拍摄时刻
                }
            };
            POPVIDEO.initial(PFSObj);*/

            // 播放多个PFS视频（分页）
            /*var PFSArray = [
                {
                    baseInfo: {
                        fileName: "NPFS:192.168.60.155:9000/username=admin&password=admin#/voddownload/f59af9d9-a95c-4f38-a689-eb31cc443f6e.mbf", // 视频名称 PFS视频 必须
                        beginTime: 1448961325000, // 视频开始时间 历史录像、PFS 必须
                        endTime: 1448961367000, // 视频播放结束时间 历史录像、PFS 必须
                        fileSize: 537409992, // 视频大小
                        remark: 'sfsdfs', // 视频备注
                        adjustTime: "" // 拍摄时刻
                    }
                },
                {
                    baseInfo: {
                        fileName: "NPFS:192.168.60.155:9000/username=admin&password=admin#/voddownload/c82b5656-44db-4ca9-a439-f4d7b3973469.mbf", // 视频名称 PFS视频 必须
                        beginTime: 1448961325000, // 视频开始时间 历史录像、PFS 必须
                        endTime: 1448961367000, // 视频播放结束时间 历史录像、PFS 必须
                        fileSize: 537409992, // 视频大小
                        remark: 'sfsdfs', // 视频备注
                        adjustTime: "" // 拍摄时刻
                    }
                },
                {
                    baseInfo: {
                        fileName: "NPFS:192.168.60.155:9000/username=admin&password=admin#/voddownload/135a2ed5-7ff4-4c7c-8724-571ac4a5764b.mbf", // 视频名称 PFS视频 必须
                        beginTime: 1448961325000, // 视频开始时间 历史录像、PFS 必须
                        endTime: 1448961367000, // 视频播放结束时间 历史录像、PFS 必须
                        fileSize: 537409992, // 视频大小
                        remark: 'sfsdfs', // 视频备注
                        adjustTime: "" // 拍摄时刻
                    }
                },
                {
                    baseInfo: {
                        fileName: "NPFS:192.168.60.155:9000/username=admin&password=admin#/voddownload/d98b297c-2846-4e8f-bec3-57bdee44cf3c.mbf", // 视频名称 PFS视频 必须
                        beginTime: 1448961325000, // 视频开始时间 历史录像、PFS 必须
                        endTime: 1448961367000, // 视频播放结束时间 历史录像、PFS 必须
                        fileSize: 537409992, // 视频大小
                        remark: 'sfsdfs', // 视频备注
                        adjustTime: "" // 拍摄时刻
                    }
                }
            ];
            POPVIDEO.initial(PFSArray[1], {
                toggleVideo: function(index, callback) {
                    var data = PFSArray[index];
                    callback(data);
                },
                currentIndex: 1
            });*/

            /*播放历史录像*/
            // 播放单个历史录像
            /*var historyObj = {
                baseInfo: {
                    fileName: "当前", // 摄像机名称 必须
                    cameraId: 11, // 摄像机id 历史录像 必须
                    beginTime: 1448961325000, // 视频开始时间 历史录像、PFS 必须
                    endTime: 1448961367000, // 视频播放结束时间 历史录像、PFS 必须
                    fileFormat: "smf", // 视频格式
                    fileSize: 537409992, // 视频大小
                    remark: 'sfsdfs', // 视频备注
                    adjustTime: "" // 拍摄时刻
                },
                operatorOptions: {
                    isDownload: true, //下载
                    deleteVideo: { // 删除视频
                        isDeleteVideo: false, // 是否删除视频
                        callback: function() {

                        }
                    }
                },
                callback: function() { // 关闭的回调函数

                }
            };
            POPVIDEO.initial(historyObj);
            return;*/

            // 播放多个历史录像（分页）
            /*var historyArray = [
                {
                    baseInfo: {
                        fileName: "上一个", // 摄像机名称 必须
                        cameraId: 11, // 摄像机id 历史录像 必须
                        beginTime: 1448961325000, // 视频开始时间 历史录像、PFS 必须
                        endTime: 1448961367000, // 视频播放结束时间 历史录像、PFS 必须
                        fileFormat: "smf", // 视频格式
                        fileSize: 537409992, // 视频大小
                        remark: 'sfsdfs', // 视频备注
                        adjustTime: "" // 拍摄时刻
                    }
                },
                {
                    baseInfo: {
                        fileName: "当前", // 摄像机名称 必须
                        cameraId: 11, // 摄像机id 历史录像 必须
                        beginTime: 1448961325000, // 视频开始时间 历史录像、PFS 必须
                        endTime: 1448961367000, // 视频播放结束时间 历史录像、PFS 必须
                        fileFormat: "smf", // 视频格式
                        fileSize: 537409992, // 视频大小
                        remark: 'sfsdfs', // 视频备注
                        adjustTime: "" // 拍摄时刻
                    }
                },
                {
                    baseInfo: {
                        fileName: "下一个", // 摄像机名称 必须
                        cameraId: 11, // 摄像机id 历史录像 必须
                        beginTime: 1448961325000, // 视频开始时间 历史录像、PFS 必须
                        endTime: 1448961367000, // 视频播放结束时间 历史录像、PFS 必须
                        fileFormat: "smf", // 视频格式
                        fileSize: 537409992, // 视频大小
                        remark: 'sfsdfs', // 视频备注
                        adjustTime: "" // 拍摄时刻
                    }
                },
                {
                    baseInfo: {
                        fileName: "下下一个", // 摄像机名称 必须
                        cameraId: 11, // 摄像机id 历史录像 必须
                        beginTime: 1448961325000, // 视频开始时间 历史录像、PFS 必须
                        endTime: 1448961367000, // 视频播放结束时间 历史录像、PFS 必须
                        fileFormat: "smf", // 视频格式
                        fileSize: 537409992, // 视频大小
                        remark: 'sfsdfs', // 视频备注
                        adjustTime: "" // 拍摄时刻
                    }
                }
            ];
            POPVIDEO.initial(historyArray[1], {
                toggleVideo: function(index, callback) {
                    var data = historyArray[index];
                    callback(data);
                },
                currentIndex: 1
            });*/
            // 下方配置项参数
            var PFSVideoDataObj = {
                popBgWarp: $('#testVideoWarp'), // 使用调用模块的Wrap(无弹出黑背景)，否则用公共的(有弹出黑背景)
                showRightDetailInfo: false, // 是否显示右侧信息，默认显示
                baseInfo: {
                    fileName: "NPFS:192.168.60.155:9000/username=admin&password=admin#/pvb/videos/89e67af1-a446-41b0-bab3-fc990605b62a.mbf", // 视频名称 PFS视频 必须
                },
                operatorOptions: {
                    grapPicture: { // 抓图
                        shootTime: 1436164199000,
                        base64Pic: ""
                    },
                    //isToViewLib: false, // 入库
                    //isDownload: false, // 下载
                    deleteVideo: { // 删除视频
                        isDeleteVideo: true, // 是否删除视频
                        callback: function() {

                        }
                    }
                },
                callback: function() { // 关闭的回调函数

                }
            };
            POPVIDEO.initial(PFSVideoDataObj);

        });
    });
});
