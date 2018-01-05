/**
 *
 * @authors lrxia (lrxia@netposa.com)
 * @date    2015/7/9
 * @version $
 */
require(['/require-conf.js'],function() {
    require(['js/popImg.js','base.self'], function (POPIMG) {
        /*
         * 1.需要该视频的所有数据
         * 2.必须引用视频html模板
         * */
        var dataArray = [
            {
                //showRightDetailInfo: false,
                baseInfo: {
                    filePath: "/img/image/50efe6ba-db48-41ab-bff2-4f300579fc4b.jpg",/*图片src*/ // 必填
                    fileName: "上一张1",
                    fileSize: 561276,
                    storageTime: 1436162678000,
                    adjustTime: "",
                    remark: '备注信息'
                },
                operatorOptions: {
                    oneToOneIcon: false,
                    downloadUrl: "", // 下载 必填
                    saveToCloudbox: { // 保存到云空间
                        filePath: "", /*base64 图片src*/ // 必填
                        fileName: "fsdf_处理结果6" + '(' + Toolkit.formatDate(new Date()) + ')'
                    },
                    toViewLib: { // 入库 可填可不填 默认是显示的
                        id: 150, // 云空间的入库
                        shoottime:"null",
                        base64Pic: ""
                    }
                },
                callback: function() {

                }
            },
            {
                //showRightDetailInfo: false,
                baseInfo: {
                    filePath: "/img/image/797f672b-26e3-4615-a89f-f692807c108a.jpg",/*图片src*/ // 必填
                    fileName: "上一张2",
                    fileSize: 561276,
                    storageTime: 1436162678000,
                    adjustTime: "",
                    remark: '备注信息'
                },
                operatorOptions: {
                    oneToOneIcon: false,
                    downloadUrl: "", // 下载 必填
                    saveToCloudbox: { // 保存到云空间
                        filePath: "", /*base64 图片src*/ // 必填
                        fileName: "fsdf_处理结果6" + '(' + Toolkit.formatDate(new Date()) + ')'
                    },
                    toViewLib: { // 入库 可填可不填 默认是显示的
                        id: 150, // 云空间的入库
                        shoottime:"null",
                        base64Pic: ""
                    }
                },
                callback: function() {

                }
            },
            {   //showRightDetailInfo: false,
                baseInfo: {
                    curListIndex: 2,
                    filePath: "/img/image/363d2694-8979-4436-b142-daa718cfb4eb.png",/*图片src*/ // 必填
                    fileName: "fsdf_处理结果6",
                    fileSize: 561276,
                    storageTime: 1436162678000,
                    adjustTime: "",
                    remark: '备注信息'
                },
                operatorOptions: {
                    downloadUrl: "", // 下载 必填
                    saveToCloudbox: { // 保存到云空间
                        filePath: "", /*base64 图片src*/ // 必填
                        fileName: "fsdf_处理结果6" + '(' + Toolkit.formatDate(new Date()) + ')'
                    },
                    toViewLib: { // 入库 可填可不填 默认是显示的
                        id: 150, // 云空间的入库
                        shoottime:"null",
                        base64Pic: ""
                    }
                },
                callback: function() {

                }
            },
            {   //showRightDetailInfo: false,
                baseInfo: {
                    filePath: "/img/image/e7ac3a27-c549-440a-8e5e-5457f151bc96.jpg",/*图片src*/ // 必填
                    fileName: "下一张1",
                    fileSize: 561276,
                    storageTime: 1436162678000,
                    adjustTime: "",
                    remark: '备注信息'
                },
                operatorOptions: {
                    oneToOneIcon: false,
                    downloadUrl: "", // 下载 必填
                    saveToCloudbox: { // 保存到云空间
                        filePath: "", /*base64 图片src*/ // 必填
                        fileName: "fsdf_处理结果6" + '(' + Toolkit.formatDate(new Date()) + ')'
                    },
                    toViewLib: { // 入库 可填可不填 默认是显示的
                        id: 150, // 云空间的入库
                        shoottime:"null",
                        base64Pic: ""
                    }
                },
                callback: function() {

                }
            },
            {   //showRightDetailInfo: false,
                baseInfo: {
                    filePath: "/img/image/bf835dab-fc31-4cad-b990-c0cc53fdc39f.jpg",/*图片src*/ // 必填
                    fileName: "下一张2",
                    fileSize: 561276,
                    storageTime: 1436162678000,
                    adjustTime: "",
                    remark: '备注信息'
                },
                operatorOptions: {
                    oneToOneIcon: false,
                    downloadUrl: "", // 下载 必填
                    saveToCloudbox: { // 保存到云空间
                        filePath: "", /*base64 图片src*/ // 必填
                        fileName: "fsdf_处理结果6" + '(' + Toolkit.formatDate(new Date()) + ')'
                    },
                    toViewLib: { // 入库 可填可不填 默认是显示的
                        id: 150, // 云空间的入库
                        shoottime:"null",
                        base64Pic: ""
                    },
                    toImgJudge: { // 图像研判 可填可不填 默认是显示的
                        localPath: "",
                        parentId: ""
                    }
                },
                callback: function() {

                }
            }

        ];
        $("#button").click(function () {
            POPIMG.initial(dataArray[2], {
                toggleImg: function(index, callback) {
                    var preData = dataArray[index];
                    console.log("index:",index);
                    callback(preData);
                },
                currentIndex: 2
            });

        })
    })

})
