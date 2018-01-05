/**
 *
 * @authors lrxia (lrxia@netposa.com)
 * @date    2015/7/6
 * @version $
 */

define(['ajaxModel','/module/popLayer/js/set_center.js','handlebars','/module/popLayer/js/my-handlebar.js'], function (ajaxModule,SETCENTER) {
    var SCOPE = {
        dContext:{}
    }
    var popImgEvent ={
        init:function(){
            var _t =this;
            $(document).on('click','.elel',_t.elelClick);/*1:1*/
            $(document).on('click','a.permission',_t.storageClick);/*入库*/
            $(document).on('click', 'a.download, .down-load',_t.downLoadClick);/*下载*/
            $(document).on('click','a.save-to-cloud',_t.saveTocloudClick)/*保存到云空间*/
            $(document).on('click','a.image-analysis',_t.savePicAnalysisClick)/*图像研判*/
            $(document).on('click', '.bg-close',_t.bgCloseClick);/*关闭弹框*/
            $(document).on('click','.close-eyes',function(){ $(".eyes").hide();});
            $(document).on('click','.s-bar',_t.sBarClick);
            $(window).bind('resize',function() {
                SETCENTER.picReset(SCOPE.dContext.filePath);});/*图片随浏览器窗口自适应*/
        },
        elelClick:function(){
            var state = SETCENTER.state;
            state.width = state._originWidth;
            state.height = state._originHeight;
            state.posX = ($(".pic-wrap").width()-state.width)/2;
            state.posY = ($(".pic-wrap").height()-state.height)/2;
            SETCENTER.refreshTransform();
            $(".eyes").hide();
            $(".outline").css({
                "top":0,
                "left":0,
                "width":235+"px",
                "height":175+"px"
            })
        },
        storageClick:function(e){
            var e = e || window.event,
                tar = e.target || e.srcElement;
            if(jQuery(tar).attr('data-action')==='medialib'){
                module.medialib();
            }
            return false
        },
        downLoadClick:function(){

          /*      SCOPE.download = 'get_download_file';
            var url = "/service/pcm/get_download_file?id="+SCOPE.dContext.id;/!*生成下载路径*!/*/
                    //http://192.168.60.235:82/service/pcm/get_download_file?id=162
                /*弹出下载框*/
                downloadDialog(SCOPE.dContext.downloadUrl);
                /*记录日志*/
                //logDict.insertMedialog('m6', '下载 ' + VIEW.getTname(true)); // 查看 日志
            function downloadDialog(url, callback) {
                var insertDom = jQuery('<iframe id="forDownload" src=' + url + '></iframe>');
                if ($('#forDownload').length < 1) {
                    $('body').append(insertDom);
                } else {
                    $('#forDownload').attr("src", url);
                }
            }
        },
        saveTocloudClick:function(){
                jQuery.ajax({
                    url: SCOPE.imgToCloud.postUrl,
                    type: SCOPE.imgToCloud.method,
                    dataType: 'json',
                    data: SCOPE.imgToCloud.data,
                    success: function(res) {
                        if (res && res.code === 200) {
                            notify.success('图片上传成功！');
                           } else {
                            notify.warn('图片上传失败！');
                        }
                    }
                });
        },
        savePicAnalysisClick:function(){
            //进入图像研判
            analysis.imagesjude();
        },
        bgCloseClick:function(){
            $(window).unbind('resize');
            //隐藏导航,bug[37719], add by zhangyu, 2015.10.25
            window.top.showHideNav("show");
            $('.bg-wrap').fadeOut();
            //删除data-flag属性，避免关闭详情页时还提示“当前已经是第一个可查看资源”
            $(".bg-content").removeAttr("data-flag");
            //add buy leon.z 执行回调函数
            SCOPE.callback &&　SCOPE.callback();
            
        },
        sBarClick:function(){
            var leftContent = $('.bg-content');
            var rightContent = $('.bg-sider');
            $(this).hasClass('active') ? $(this).removeClass('active') : $(this).addClass('active');
            if(leftContent.css('right') === '8px'){
                leftContent.css('right','258px');
                rightContent.css('right','0px');
            }else{
                leftContent.css('right','8px');
                rightContent.css('right','-250px');
            }
           SETCENTER.picReset(SCOPE.dContext.filePath);
        }

    };
    var view_tool = {
        newWindow: function(url, name, callback) {
            var myWindow = window.open("/module/iframe/?windowOpen=1&iframeUrl=" + url, name);
            callback && callback(url, myWindow);
        }
    };

    var _ajaxModule = {
        loadDetails:function(url){
            var msg = '<div class="loading"></div>',
                custom = {
                    beforeSend:function(){
                        //隐藏导航,bug[37719], add by zhangyu, 2015.10.25
                        window.top.showHideNav("hide");
                        $('.bg-wrap').fadeIn().find('.inner-wrap').html(msg);
                    }
                };
            return ajaxModule.getData(url,undefined,custom);
        },
        loadData: function(url, parentNode) {
            var msg = "<div class='no-data' style='text-align:center;padding:30px;'><i class='loading-img'></i>正在加载…</div>",
                custom = {
                    beforeSend:function(){
                        if (parentNode) {
                            parentNode.html(msg);
                        }
                    }
                };
            return ajaxModule.getData(url,undefined,custom);
        },
        /*
        * 提交数据
        */
        postData: function(url, data) {
            return ajaxModule.postData(url,data);
        }
    };
    var module ={
        medialib: function() {
            //debugger
            Cookie.dispose('data');
            window.localStorage.removeItem("dataImgToView");
            var _t = this,
                filePath = SCOPE.dContext.filePath,
                id = SCOPE.dContext.id,
                type = SCOPE.dContext.fileType - 0,
                shoottime = SCOPE.dContext.shootTime,
                structuredType = SCOPE.dContext.structuredType - 0,
                fileName = SCOPE.dContext.fileName,
                typeurl = ["", "video", "image"];
            var data = {
                "resourceId":'',
                "mediaPath": filePath,/*视图库图片显示src*/
                "shootTime": shoottime,
                "fileType": type + '',
                "medialibId": "",
                "structType": structuredType || "",
                "base64Pic": SCOPE.dContext.base64Pic,/*视图库保存信息的时候 会用到*/
                "fileName": fileName,
                "IsSnap":false
            };
            if(id && id!=''){
                /*云空间的时候用来获取图片base64Pi src*/
                callback1();
            }else{
                openNewWindow()
            }
            function callback1() {
                  _ajaxModule.loadData("/service/pcm/storage/file/" + id).then(function(data){
                    if (data && data.code === 200) {
                        data.cloud="cloud";
                        data.base64Pic = data.data.path;
                        openNewWindow()
                    } else {
                        notify.info('入库失败,错误码:' + data.code);
                    }
                });
            };
            function openNewWindow(){
                window.localStorage.setItem("dataImgToView",JSON.stringify(data));
                view_tool.newWindow("/module/viewlibs/toMediaLib/update_" + typeurl[type] + "_bak.html");
            }
        }

    };
    /**
     * [analysis 扩展李瑞霞接口，添加图像研判功能]
     * @type {function}
     * update by leon.z
     * 2015-11-09
     */
    var analysis = {
        createRandom:function(from,to){
            var arr=[];
            var json={};
            while(arr.length<1)
            {
                //产生单个随机数
                var ranNum=Math.ceil(Math.random()*(to-from))+from;
                //通过判断json对象的索引值是否存在 来标记 是否重复
                if(!json[ranNum])
                {
                    json[ranNum]=1;
                    arr.push(ranNum);
                }
                 
            }
            return arr;
        },
        /**
         * @name imagesjude
         * @description 云管理跳转到图像研判图像处理
         */
        imagesjude: function() {
            var self = this,
                fileName = SCOPE.dContext.fileName,
                fileType = SCOPE.dContext.fileType - 0,
                filePath = SCOPE.dContext.filePath,
                localPath = SCOPE.dContext.localPath,
                parentId = SCOPE.dContext.directoryId || 0;
            jQuery.ajax({
                url: SCOPE.imgToCloud.postUrl,
                type: SCOPE.imgToCloud.method,
                dataType: 'json',
                data: SCOPE.imgToCloud.data,
                success: function(res) {
                    if (res && res.code === 200) {
                        var id = res.data.cid;
                        var data = {
                            clouds: JSON.stringify({
                                cloud: [{
                                    id: id,
                                    type: fileType,
                                    parentId: 1
                                }]
                            })
                        };
                        ajaxModule.postData('/service/pia/resource_cloud', data).then(function(data) {
                            if (data && data.code === 200) {
                                // 存成功后重新拿取后端的 id
                                _ajaxModule.loadData("/service/pia/resource_file?cid=" + id).then(function(res) {
                                    var passData = {
                                        id: res.data.id,
                                        cid: id,
                                        filePath: filePath,
                                        localPath: localPath || filePath,
                                        fileName: fileName,
                                        fileType: fileType,
                                        cloud: "cloud"
                                    };
                                    Cookie.write('imagejudgeData', JSON.stringify(passData));
                                    view_tool.newWindow('/module/imagejudge/resource-process/index.html?&type=1', ("singlePicProcess" + (self.createRandom(0, 50)[0])));
                                    logDict.insertMedialog('m6', fileName + ' 在图像研判模块进行图像处理'); // 到图像研判 日志
                                });
                            }
                        })
                    } else {
                        notify.warn('图片上传失败！');
                    }
                }
            });

        }

    };
    var popImg = {
        init:function(option){
            var self = this;
            self.appendWarpHtml();
            popImgEvent.init();

            self.init = function(option) {
                self.option={
                    pop_tpl_url:option.pop_tpl_url,
                    imgData:option.imgData,
                    callback:option.callback || jQuery.npoop
                };
                SCOPE.dContext = self.option.imgData;
                SCOPE.imgToCloud = self.option.imgData.imgToCloud;
                SCOPE.imgToAnalysis = self.option.imgData.imgToAnalysis;//添加图像研判
                SCOPE.callback = self.option.callback;//关闭后的回调函数
                self.renderNoData();
                self.makeUp();
            }
            self.init(option);
        },
        appendWarpHtml:function(){
            var warpHTML = '<div class="bg-wrap">' +
                '<div class="bg-close"></div>' +
                '<div class="inner-wrap"></div>' +
                '</div>';
            if(!$('.bg-wrap')[0]){
                $('body').append(warpHTML);
            }

        },
        renderNoData:function(){
            //隐藏导航,bug[37719], add by zhangyu, 2015.10.25
            window.top.showHideNav("hide");
            $('.bg-wrap').show().find('.inner-wrap').html('<div class="loading"></div>');
        },

        getPopHtml:function(){
            var _t = this;
            jQuery.ajax({
                type: "get",
                url: _t.option.pop_tpl_url,
                success: function(html) {
                    $('.bg-wrap').find('.inner-wrap').html(Handlebars.compile(html)(SCOPE.dContext));
                    $('.bg-wrap').find('.big-pic').hide().attr('src',SCOPE.dContext.filePath);
                    $('.bg-wrap').find(".bg-content").attr({
                        "data-fileType":SCOPE.dContext.fileType,
                        "data-index":SCOPE.dContext.curListIndex,
                        "data-structureName":$(".content .overview .list-content dd").filter("[data-index='" + SCOPE.dContext.curListIndex + "']").find(".l-name a").attr("data-filename")
                    });
                    SETCENTER.init(SCOPE.dContext.filePath);
                }
            });
        },
        makeUp:function(){
            var _t = this,
                json = SCOPE.dContext,
                msg = '<div class="loading"></div>';
            //隐藏导航,bug[37719], add by zhangyu, 2015.10.25
            window.top.showHideNav("hide");
            $('.bg-wrap').fadeIn().find('.inner-wrap').html(msg);
            if (json != null) {
                _t.makeUpCallBack(json);
            } else {
                _t.renderNoData()
            }

        },
        makeUpCallBack:function(res){
            var _t =this;
           /* var data = res.data.image;
            SCOPE.context = SCOPE.dContext = data; /!*记录上下文参数对象 important*!/
            SCOPE.contentType = 1; /!*0:查看列表,1,查看详情*!/*/
            _t.getPopHtml()

            /*logDict.insertMedialog('m6', '查看 ' + data.fileName + ' 图片', "", "o4"); // 查看 日志
             dataJson && cloudNav.keepLastTypeSteps(data.fileName, dataJson);*/
        }
    };
    return popImg

})



