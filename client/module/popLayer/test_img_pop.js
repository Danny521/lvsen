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
        $("#button").click(function () {

            var imgData = {
                id:150,/*云空间图片入视图库用*/
                filePath:"/img/image/363d2694-8979-4436-b142-daa718cfb4eb.png",/*图片src*/
                fileName:"fsdf_处理结果6",/*图片名称*/
                fileSize:561276,/*图片大小*/
                fileFormat:'jpg',/*图片格式*/
                storageTime:1436162678000,/*图片创建时间*/
                adjustTime:'',/*图片拍摄时间*/
                remark:'备注信息',/*图片备注信息*/
                sourceType:'',/*云空间用*/
                fileType:'2',/*这是参数是定死的 云空间用*/
                curListIndex:1,/*当前被点图片在列表中的index*/
                shoottime:'null',/*图片入库的时候用*/
                downloadUrl:'',/*图片下载地址接口*/
                base64Pic:'',/*图片入视图库的时候用*/
                imgToCloud:{/*图片入云空间的时候用*/
                    data:{
                        'fileName': "fsdf_处理结果6" + '(' + Toolkit.formatDate(new Date()) + ')',
                        'filePath': '',/*base64 图片src*/
                        'catchTime': 1436838177662,
                        'shootTime': 0,
                        'useOriginalName':true
                    },
                    postUrl:'/service/pcm/add_screenshot',
                    method:'post'
                }
            };


            var option = {
                pop_tpl_url:'/module/popLayer/inc/d-pic.html',
                imgData:imgData
            };
            POPIMG.init(option);
        })
    })

})