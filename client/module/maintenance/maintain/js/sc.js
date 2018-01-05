/**
 * Created by LiangChuang on 2014/12/3.
 */
/*摄像机搜索searchCameras*/
define(["jquery","mootools"],function() {
    var SC = new Class({
        initialize: function (obj) {
            this.tplApi         = obj.tplApi;
            this.dataApi        = obj.dataApi;
            this.appendTo       = obj.appendTo;
            this.norLevel       = obj.norLevel;
            this.topLevel       = obj.topLevel;
            this.parNode        = obj.parNode;
            this.triggerNSearch = obj.triggerNSearch;
            this.triggerHSearch = obj.triggerHSearch;
            this.type           = obj.type;
            /*post,get*/
            this.info = {}, /*搜索参数*/
                this.data = '';
            /*数据*/
            this.tpl = '';
            /*模板*/
            this.bindEvent();
            /*绑定触发搜索*/
            this.loadTpl();
            /*获取模板*/
            this.callback = obj.callback;
        },
        loadTpl: function () {
            var self = this;
            jQuery.ajax({
                url: self.tplApi,
                type: 'get'
            }).done(function (html) {
                self.tpl = html;
            });
        },
        loadData: function () {
            var self = this;
            jQuery.ajax({
                url: self.dataApi,
                type: self.type,
                data: self.info
            }).done(function (data) {
                //self.data = data.data;//{cameras:[]}
                if (data.data.cameras === null || data.data.cameras.length === 0) {
                    self.parNode.show();
                    self.parNode.html('<i style="color:#999">暂无数据!</i>');
                    return;
                }
                // 为树形增加数据
                var node = $(".cameras-list.polling .treePanel>ul>li"),
                    orgData = node.data(),
                    tmp;

                tmp = {
                    id: orgData.id,
                    org: orgData.org,
                    name: orgData.name,
                    cameras: data.data.cameras,
                    isRoot: node.children(".root").length
                };

                self.data = tmp;
                self.render();

            }).fail(function () {
                notify.info('网络或服务异常!', {timeout: '1000'})
            });
        },
        bindEvent: function () {
            var self = this,
                t    = null;

            jQuery(document).on('focus', self.triggerNSearch, function () {
                if ($(".mode .active").length > 0) {
                    notify.warn("请停止巡检之后再搜索！");
                    return false;
                }
                clearInterval(t);
                var sBtn = jQuery(this), val = sBtn.val().trim();
                t = setInterval(function () {
                    if (val === sBtn.val().trim()) {
                        return;
                    } else {
                        val = sBtn.val().trim();
                        if (val === '') {
                            self.cancelSearch();
                        } else {
                            self.doSearch('simple');
                        }
                    }
                }, 600);
            });

            jQuery(document).on('blur', self.triggerNSearch, function () {
                clearInterval(t);
            });

            jQuery(document).on('click', self.triggerHSearch, function () {
                if ($(".mode .active").length > 0) {
                    notify.warn("请停止巡检之后再搜索！");
                    return false;
                }
                self.doSearch('high');
            });

            jQuery(document).on('keypress', self.triggerNSearch, function (e) {
                var keyCode = e.keyCode;
                if(keyCode === 13 && !$(".serchbox.high").is(":visible")){
                    return false;
                }
            });

            jQuery(document).on('keypress', '.polling.cameraName input[name=cameraName], #type, #status, #result', function (e) {
                var keyCode = e.keyCode;
                if(keyCode ===13 && $(".serchbox.high").is(":visible")){
                    $(self.triggerHSearch).click();
                }
            });

            /*选择了已巡检,才显示正常异常选项*/
            jQuery(document).on('change', '#status', function () {
                var result = jQuery('.polling.result, .polling.type');
                if (jQuery(this).val() === '2') {
                    result.show();
                    self.topLevel.push('result');
                    self.topLevel.push('type');
                } else {
                    result.hide();
                    self.topLevel.pop();
                    self.topLevel.pop();
                }
            });
        },
        cancelSearch: function () {
            this.parNode.hide();
            /*隐藏搜索结果dom*/
            this.parNode.siblings('.cameras').show();
            /*显示摄像机树*/

            // 清空搜索结果和标志
            mintenance.data.search = {
                isSearching: false,
                starusElmLen: 0
            };
            mintenance.data.expandTree.prevCameras = mintenance.prePreCameras;
            mintenance.newCameras = mintenance.preNewCameras;
            mintenance.curCameraIndex = mintenance.preCurCameraIndex;
            mintenance.maxLen = mintenance.preMaxLen;
            mintenance.data.isBadId = mintenance.preIsBadId;

            mintenance.data.search.polling = false;
            //mintenance.data.cameraOrgIds           = mintenance.preCameraOrgIds;

            this.parNode.html("");
            if (mintenance.videoPlayer) {
                mintenance.videoPlayer.stopAllWithoutClearData();
                mintenance.videoPlayer.refreshAllWindow();
            }
            if (mintenance.mapvideoPlayer) {
                mintenance.mapvideoPlayer.stopAllWithoutClearData();
                mintenance.mapvideoPlayer.refreshAllWindow();
            }
        },
        doSearch: function (arg) {
            this.parNode = jQuery(this.appendTo);

            this.parNode.show();

            this.getInfo(arg);
            /*获取参数*/

            this.loadData();
            /*获取数据,更新dom*/

            this.parNode.siblings('.cameras').hide();
        },
        getInfo: function (arg) {
            var data = {}, par = jQuery('form.cameraSearch');
            data.taskId = mintenance.data.mytask.taskId;
            if (arg === 'simple') {
                data.cameraName = par.find('div.simple [name= ' + this.norLevel[0] + ']').val().trim();
            } else if (arg === 'high') {
                var len = this.topLevel.length;
                while (len--) {
                    data[this.topLevel[len]] = par.find('div.high [name=' + this.topLevel[len] + ']').val().trim();
                }
            }
            this.info = data;
        },
        render: function () {
            this.parNode.html(Handlebars.compile(this.tpl)(this.data));
            this.callback && this.callback(this.data);
        }
    });

    var cameraSearch = new SC({
        tplApi: '/module/maintenance/maintain/inc/camerasSearchTree.html',
        dataApi: '/service/check/taskCameras',
        appendTo: 'div.cameraSearch',
        parNode:$('div.cameraSearch'),
        type: 'post',
        triggerNSearch: 'div.simple input[name=cameraName]',
        triggerHSearch: 'span.searchCameras',
        norLevel: ['cameraName'],
        topLevel: ['cameraName', 'status'],
        callback: function (data) {
            // 搜索完成后，巡检关键数据的替换
            mintenance.data.search = {
                isSearching: true,
                starusElmLen: 0
            };
            mintenance.preIsBadId = mintenance.data.isBadId;
            mintenance.data.isBadId = [];
            //mintenance.preCameraOrgIds   = mintenance.data.cameraOrgIds,
            //mintenance.data.cameraOrgIds = []
            mintenance.prePreCameras = mintenance.data.expandTree.prevCameras || [];
            mintenance.preNewCameras = mintenance.newCameras;
            mintenance.newCameras = data.cameras;
            mintenance.preCurCameraIndex = mintenance.curCameraIndex;
            mintenance.preMaxLen = mintenance.maxLen;
            mintenance.maxLen = data.cameras.length;
            mintenance.curCameraIndex = 0;

            mintenance.clearPollingStatus();

            for (var i = 0; i < mintenance.maxLen; i++) {
                if ((data.cameras)[i].status === 2) {
                    mintenance.data.isBadId.push(data.cameras[i].cameraId);
                    //mintenance.data.cameraOrgIds.push(data.cameras[i].orgId)
                }
            }
        }
    });

    window.cameraSearch = cameraSearch;
    return cameraSearch;

});