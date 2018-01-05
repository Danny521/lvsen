/**
 * [imageReq 图像处理发送请求类，用来为各种操作后发送请求]
 * @author limengmeng
 * @date   2014-10-29
 * @param  {[type]}   options)    [description]
 */
define([
    'pubsub',
    'base.self'
], function(PubSub){
    var imageReq = new new Class({

        Implements: [Options, Events],


        initialize: function(options) {
            var self = this;
            self .setOptions(options);
        },

        /**
         * [getAlgorithms 获取算法列表]
         * @author limengmeng
         * @date   2014-10-29
         * @return {[type]}   [description]
         */
        getAlgorithms: function() {
            var self = this;
            jQuery.ajax({
                url: '/service/pic/get_algorithms',
                type: 'post',
                dataType: 'json',
                success: function(res) {
                    if (res && res.code === 200) {
                        PubSub.publish('getAlgorithms', res.data);
                        //gImage.fireEvent('getAlgorithms', res.data);

                    } else {
                        notify.warn('获取算法列表失败! ' + (res ? res.code ? "状态码: " + res.code : "" : ""));
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                    if (xhr.status === 200) {
                        notify.warn('获取算法列表失败! 数据格式错误');
                    }
                    // 其它状态为HTTP错误状态
                    else {
                        (xhr.status !== 0) && notify.warn('获取算法列表失败! HTTP状态码: ' + xhr.status);
                    };
                }
            });
        },

        /*
         图片处理
         args{　
         algorithmName:'XXXX', //算法名称
         　　params: //参数列表不同的算法不同的参数
         　　{
         　　params1:XXX,
         　　params2:XXXX
         　　....
         　　},
         version:'2.0',
         id:12//图片id
         oldImageId:13//原始图片id
         imageUrl:该图片的url
         }
         */
        pictureProcess: function(args) {
            var self = this;
            //判断是否选中图片
            if (jQuery("#resourceTreePanel ul li").length === 0 || jQuery("#resourceTreePanel ul li.active").length === 0) {
                return;
            }
            if (self.requestObj) {
                self.requestObj.abort();
            }
            //console.log(args)
            self.requestObj = jQuery.ajax({
                url: '/service/pic/picture_process',
                type: 'post',
                dataType: 'json',
                data: {
                    algorithmName: args.algorithmName,
                    params: JSON.stringify(args.params),
                    version: args.version,
                    id: args.id,
                    oldImageId: args.oldImageId,
                    imageUrl: args.imageUrl
                },
                beforeSend: function() {
                    jQuery('#diskHolder').hide();
                },
                success: function(res) {
                    if (res && res.code === 200) {
                        var obj = res.data;
                        if (args.cut) { //裁剪
                            obj = Object.merge({}, res.data, {
                                cut: args.cut
                            });
                        } else if (args.current) { //current为true时,表示90旋转或翻转后,curId为返回图片的id
                            obj = Object.merge({}, res.data, {
                                current: args.current
                            });
                        } else if (args.imgsf) { //imgsf=true 为缩放
                            obj = Object.merge({}, res.data, {
                                imgsf: args.imgsf
                            });
                        }
                        PubSub.publish('picProcess', obj);
                        //gImage.fireEvent('picProcess', obj);
                    } else {
                        notify.warn(res ? res.code ? res.data.error : "" : "");
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                    if (xhr.status === 200) {
                        notify.warn('图片处理失败! 数据格式错误');
                    }
                    // 其它状态为HTTP错误状态
                    else {
                        (xhr.status !== 0) && notify.warn('图片处理失败! HTTP状态码: ' + xhr.status);
                    };
                }
            });
        },

        /*
         添加图片处理历史记录
         args:
         {
         id:12,//保存图片的id
         oldImageId:20 //原始图片id
         }
         */
        addHistoryRecord: function(args) {
            var self = this;
            jQuery.ajax({
                url: '/service/pic/add_ts_image',
                type: 'post',
                dataType: 'json',
                data: {
                    id: args.id,
                    oldImageId: args.oldImageId
                },
                success: function(res) {
                    if (res && res.code === 200) {
                        PubSub.publish('addHistory', {data : res.data, args : args});//[res.data, args]);
                        //gImage.fireEvent('addHistory', [res.data, args]);

                    } else {
                        notify.warn('图片暂存失败! ' + (res ? res.code ? "错误码: " + res.code : "" : ""));
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                    if (xhr.status === 200) {
                        notify.warn('图片暂存失败! 数据格式错误');
                    }
                    // 其它状态为HTTP错误状态
                    else {
                        (xhr.status !== 0) && notify.warn('图片暂存失败! HTTP状态码: ' + xhr.status);
                    };
                }
            });
        },
        //
        /**
         * [getProcessStatus 获取图片处理状态]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[int/string]}   id [图片id]
         * @return {[type]}      [1等待;2处理中;4处理成功;8处理失败]
         */
        getProcessStatus: function(id) {
            //console.log("get_image_process_status")
            var self = this;
            jQuery.ajax({
                url: '/service/pic/get_image_process_status',
                type: 'post',
                dataType: 'json',
                data: {
                    id: id
                },
                success: function(res) {
                    if (res && res.code === 200) {
                        var status = res.data.status;
                        if (status === 2) { //处理中
                            PubSub.publish('processing');
                            //gImage.fireEvent('processing');
                        } else if (status === 4) { //处理成功
                            PubSub.publish('processed');
                            //gImage.fireEvent('processed');
                        } else { //处理失败 status===8的情况
                            notify.warn('PCC处理图片失败');
                            PubSub.publish('processFail');
                            //gImage.fireEvent('processFail');
                        }

                    } else {
                        notify.warn('图像处理失败! ' + (res ? res.code ? "状态码: " + res.code : "" : ""));
                        PubSub.publish('processFail');
                        //gImage.fireEvent('processFail');
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    PubSub.publish('processFail');
                    //gImage.fireEvent('processFail');

                    // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                    if (xhr.status === 200) {
                        notify.warn('图像处理失败! 数据格式错误');
                    }
                    // 其它状态为HTTP错误状态
                    else {
                        (xhr.status !== 0) && notify.warn('图像处理失败! HTTP状态码: ' + xhr.status);
                    };
                }
            });
        },
        /*获取历史记录列表*/
        /**
         * [getHistoryList 获取历史记录列表]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[json]}   args [被处理原图的相关信息]
         * @return {[]}        []
         */
        getHistoryList: function(args) {
            var self = this;
            jQuery.ajax({
                url: '/service/pic/get_ts_imageList',
                type: 'post',
                dataType: 'json',
                data: {
                    oldImageId: args.oldImageId
                },
                success: function(res) {
                    if (res && res.code === 200) {
                        PubSub.publish('getHistoryList', res.data);
                        //gImage.fireEvent('getHistoryList', res.data);
                    } else {
                        notify.warn('获取图片历史记录列表失败! ' + (res ? res.code ? "状态码: " + res.code : "" : ""));
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                    if (xhr.status === 200) {
                        notify.warn('获取图片历史记录列表失败! 数据格式错误');
                    }
                    // 其它状态为HTTP错误状态
                    else {
                        (xhr.status !== 0) && notify.warn('获取图片历史记录列表失败! HTTP状态码: ' + xhr.status);
                    };
                }
            });
        },

        //
        /**
         * [getHistoryItem 历史记录列表中 通过id获取图片信息]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[json]}   args [列表中当前图片信息]
         * @return {[]}        []
         */
        getHistoryItem: function(args) {
            var self = this;
            jQuery.ajax({
                url: '/service/pic/get_ts_image_info',
                type: 'post',
                dataType: 'json',
                data: {
                    id: args.id
                },
                success: function(res) {
                    if (res && res.code === 200) {
                        PubSub.publish('getHistoryItem', res.data);
                        //gImage.fireEvent('getHistoryItem', res.data);

                    } else {
                        notify.warn('获取图片历史记录失败! ' + (res ? res.code ? "状态码: " + res.code : "" : ""));
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                    if (xhr.status === 200) {
                        notify.warn('获取图片历史记录失败! 数据格式错误');
                    }
                    // 其它状态为HTTP错误状态
                    else {
                        (xhr.status !== 0) && notify.warn('获取图片历史记录失败! HTTP状态码: ' + xhr.status);
                    };
                }
            });
        },

        //删除图片的一个历史记录
        /**
         * [deleteHistoryItem 删除图片的一个历史记录]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[json]}   args [列表中当前图片信息]
         * @return {[]}        []
         */
        deleteHistoryItem: function(args) {
            var self = this;
            jQuery.ajax({
                url: '/service/pic/delete_ts_image',
                type: 'post',
                dataType: 'json',
                data: {
                    id: args.id
                },
                success: function(res) {
                    if (res && res.code === 200) {
                        /*gImage.fireEvent('deleteHistoryItem', Object.merge({}, res.data, {
                            li: args.li
                        }));*/
                        PubSub.publish('deleteHistoryItem', Object.merge({}, res.data, {
                            li: args.li
                        }));
                    } else {
                        notify.warn('删除图片历史记录失败! ' + (res ? res.code ? "状态码: " + res.code : "" : ""));
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                    if (xhr.status === 200) {
                        notify.warn('删除图片历史记录失败! 数据格式错误');
                    }
                    // 其它状态为HTTP错误状态
                    else {
                        (xhr.status !== 0) && notify.warn('删除图片历史记录失败! HTTP状态码: ' + xhr.status);
                    };
                }
            });
        },

        //清空列表
        /**
         * [clearHistory 清空列表]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[json]}   args [当前图片信息]
         * @return {[]}        []
         */
        clearHistory: function(args) {
            var self = this;
            jQuery.ajax({
                url: '/service/pic/delete_all_ts_image',
                type: 'post',
                dataType: 'json',
                data: {
                    currentId: args.currentId,
                    oldImageId: args.oldImageId
                },
                success: function(res) {
                    if (res && res.code === 200) {
                        PubSub.publish('clearHistory', Object.merge({}, res.data, {
                            currentId: args.currentId
                        }));
                        /*gImage.fireEvent('clearHistory', Object.merge({}, res.data, {
                            currentId: args.currentId
                        }));*/
                    } else {
                        notify.warn('清除历史记录列表失败! ' + (res ? res.code ? "状态码: " + res.code : "" : ""));
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                    if (xhr.status === 200) {
                        notify.warn('清除历史记录列表失败! 数据格式错误');
                    }
                    // 其它状态为HTTP错误状态
                    else {
                        (xhr.status !== 0) && notify.warn('清除历史记录列表失败! HTTP状态码: ' + xhr.status);
                    };
                }
            });
        }
    });

    return imageReq;
})