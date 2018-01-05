define(['jquery', 'pubsub', 'base.self'], function(_, PubSub) {
    var previewPicture = function(options) {
        var self = this;
        self.pictureOriSizeIsGot = false;
        self.originalSize = {};
        self.dataArray = [];
        self.isFirst  = false;
    };
    previewPicture.prototype.init = function(options) {
        var self = this;
        self.target = options.index;
        self.bindEvent(options);
        self.deployOperation(options);
        self.initArray(options.data);
        /** [update by leon.z 2015/12/17] 默认先插入dom图片下载完再去计算图片位置*/
        setTimeout(function() {
            self.renderPicture(self.dataArray[options.index], options);
            setTimeout(function() {
                self.pictureOriSizeIsGot = true;
                 self.getPictureOriSize(function(org){
                    self.resetPictureSize(org)
                 });
            }, 500)
        }, 500);
        //添加权限设置
        permission.reShow();
    };
    previewPicture.prototype.setEyePos = function() {
        $('#np-thumb-outline').offset({
            top: $('#np-thumb-picture').offset().top + parseInt(($('#np-preview-thumb-img').height() - $('#np-thumb-outline').height()) / 2),
            left: $('#np-thumb-picture').offset().left + parseInt(($('#np-preview-thumb-img').width() - $('#np-thumb-outline').width()) / 2)
        })
    };
    previewPicture.prototype.deployOperation = function(options) {
        if (!options.markedIsUsable) {
            $('#np-tools-bar .np-marked').hide();
        }
        if (!options.handleIsUsable) {
            $('#np-tools-bar .np-handle').hide();
        }
        if (!options.addCluesUsable) {
            $('#np-tools-bar .np-addClues').hide();
        }
        if (!options.storeIsUsable) {
            $('#np-tools-bar .np-store').hide();
        }

        if (!options.editTitleIsUsable) {
            $('#np-editor-infomation').hide();
        }
        if (!options.downloadIsUsable) {
            $('#np-tools-bar .np-download').hide();
        }
    };
    previewPicture.prototype.renderPicture = function(parmas, options) {
        var self = this;
        if (options.message && options.message.readSnapShootMessage) {
            //请求快照的缩略图
            self.findthumbnail(parmas, options);
            PubSub.publish(options.message.readSnapShootMessage, self.dataArray[self.target].id)
        }
        $('#np-preview-img').attr('src', parmas.img);
        $('#np-preview-thumb-img').attr('src', parmas.img);
        $('#np-thumb-outline').width(235);
        $('#np-thumb-outline').height(175);
        $('#np-thumb-picture').hide();
        var begin = '<p><span class="info-title">',
            middleLeft = '</span><span title="',
            middleRight = '" class="info-detail">',
            end = '</span></p>',
            detailArray = [];
        $.each(parmas.detail, function(index, el) {
            detailArray.push(begin + el.title + middleLeft + el.description + middleRight + el.description + end);
        });
        $('#np-sidebar-detail').html(detailArray.join(''));
        $('#np-sidebar-title').text(parmas.title);
        $('#np-sidebar-title').attr('title', parmas.title);
        if(!self.isFirst){//如果为第一次图片加载，先隐藏，等图片加载完成显示，避免页面跳闪
             $('#np-preview-img').hide();
        }
        //self.pictureOriSizeIsGot && self.getPictureOriSize();
    };
    //请求目标快照缩略图
    previewPicture.prototype.findthumbnail = function(parmas, options) {
            var self = this;
            if (parmas.img.indexOf(".") < 0) {
                var source = 0;
                if (options.addCluesUsable) {
                    source = 2;
                }
                if (options.storeIsUsable) {
                    source = 1;
                }
                jQuery.ajax({
                    url: '/service/pia/getStructuredImg',
                    type: 'get',
                    async: false,
                    data: {
                        id: parmas.id,
                        type: parmas.type,
                        source: source
                    }
                }).then(function(res) {
                    if (res.code === 200) {
                        self.dataArray[self.target].img = self.dataArray[self.target].picture = "/img" + res.data;
                    }
                });
            }
        },
        previewPicture.prototype.getPictureOriSize = function(callback) {
            var $img = $('#np-preview-img'),self = this,
                isActive =$('#np-tools-bar .np-elel').hasClass("active"),
                imgParent = {
                    width: $img.parent().width(),
                    height: $img.parent().height(),
                    ratio: $img.parent().width() / $img.parent().height()
                };

                var img = new Image();
                img.onload = function(){
                    self.isFirst = true;
                    img = {
                        width: this.width,
                        height: this.height,
                        ratio: this.width / this.height
                    };
                    if (img.height > imgParent.height || img.width > imgParent.width) {
                        if(isActive){
                            self.originalSize = {
                                width: img.width,
                                height:img.height,
                                left:($img.parent().width()-img.width)/2,
                                top:($img.parent().height()-img.height)/2
                             };
                        }else{
                           if (img.ratio >= imgParent.ratio) {
                                $img.width(imgParent.width);
                                $img.height(imgParent.width / img.ratio)
                            } else {
                                $img.height(imgParent.height);
                                $img.width(imgParent.height * img.ratio)
                            }
                            self.originalSize = {
                                width: $img.width(),
                                height: $img.height(),
                                left:($img.parent().width()-$img.width())/2,
                                top:($img.parent().height()-$img.height())/2
                             };
                        }
                    }else{
                         self.originalSize = {
                            width: img.width,
                            height:img.height,
                            left:($img.parent().width()-img.width)/2,
                            top:($img.parent().height()-img.height)/2
                         };
                    }
                    $img.fadeIn(100);
                    callback && callback(self.originalSize)
                }
                img.src = $img.attr('src')



        }
    previewPicture.prototype.resetPictureSize = function(org) {
        var self = this;
        if(!org){
            self.getPictureOriSize(function(org){
                $('#np-preview-img').width(org.width);
                $('#np-preview-img').height(org.height);
                $('#np-preview-img').css({
                    left: org.left,
                    top: org.top
                });
            });
            return ;
        }
        $('#np-preview-img').width(org.width);
        $('#np-preview-img').height(org.height);
        $('#np-preview-img').css({
            left: org.left,
            top: org.top
        });
    };
    previewPicture.prototype.removePicture = function() {
        $('#np-preview-img').attr('src', '');
        $('#np-preview-thumb-img').attr('src', '');
        $('#np-sidebar-title').css('title', '').text('');
        $('#np-sidebar-detail').html();
    };
    previewPicture.prototype.getIndex = function() {
        return this.target;
    }

    previewPicture.prototype.push = function(item) {
        if (item.title && item.img && item.detail) {
            this.dataArray.push(item);
        } else {
            return false;
        }
    }

    previewPicture.prototype.initArray = function(item) {
        item instanceof Array ? this.dataArray = item : this.dataArray.push(item);
    }

    previewPicture.prototype.pop = function() {
        this.dataArray.pop();
    }

    previewPicture.prototype.remove = function(index, howmany) {
        this.dataArray.splice(index, howmany);
    }

    previewPicture.prototype.next = function(options) {
        if (this.target < this.dataArray.length - 1) {
            this.renderPicture(this.dataArray[++this.target], options)
        } else {
            if (this.dataArray.length !== 0) {
                notify.info('当前已经是可查看的最后一张图片了！')
            }
        }
    };

    previewPicture.prototype.prev = function(options) {
        if (this.target > 0) {
            this.renderPicture(this.dataArray[--this.target], options);
        } else {
            if (this.dataArray.length !== 0) {
                notify.info('当前已经是可查看的第一张图片了！')
            }
        }
    };

    previewPicture.prototype.setPosition = function() {
        var dom = $('#np-preview-img'),
            domParent = $('#np-preview-img').parent('.preview-content');
        dom.css({
            top: (domParent.height() - dom.height()) / 2,
            left: (domParent.width() - dom.width()) / 2
        });
    };

    previewPicture.prototype.eyeMouseMoveCallback = function(size) {
        $('#np-preview-img').offset({
            top: -($('#np-preview-img').height() * (size.y / $('#np-thumb-picture').height())),
            left: -($('#np-preview-img').width() * (size.x / $('#np-thumb-picture').width()))
        })
    };
    previewPicture.prototype.movePicture = function() {
        var sign = 0,
            begin = {
                x: 0,
                y: 0
            },
            dom = $('#np-preview-img'),
            position = {},
            domParent = $('#np-preview-img').parent('.preview-content'),
            self = this,
            minWidth = 0,
            minHeight = 0,
            release = function(e) {
                jQuery(document).off('mousemove', handler);
                jQuery(document).off('mouseup', release);
            },
            handler = function(event) {
                var left = position.left + event.clientX - begin.x,
                    top = position.top + event.clientY - begin.y;
                dom.css({
                    left: left,
                    top: top
                });
            };

        dom.on('load', function() {
            if(dom.width()>domParent.width() || dom.height()>domParent.height()){
                 return window.big = true;
            }
            window.wid = $('#np-preview-img').width();
            window.hid = $('#np-preview-img').height()
        });

        dom.mousedown(function(event) {
            event.preventDefault();
            sign = 1;
            position = dom.position();
            begin.x = event.clientX;
            begin.y = event.clientY;
            $(document).on('mousemove', handler).on('mouseup', release);
        });
        dom.on('mousewheel', function(event) {
            var pix = event.originalEvent.wheelDelta,
                currentWidth = dom.width() + pix * 0.15,
                currentHeight = dom.height() + pix * 0.15,
                eyeWidth = $('#np-thumb-outline').width(),
                eyeHeight = $('#np-thumb-outline').height(),
                setWidth = 0,
                setHeight = 0;
            if (currentWidth / self.originalSize.width > 4) {
                return;
            }
            if (pix > 0) {
                $('#np-tools-bar .np-elel').addClass('active');
                if (currentWidth > domParent.width() || currentHeight > domParent.height()) {
                    $('#np-thumb-outline').width(eyeWidth / (currentWidth / dom.width()));
                    $('#np-thumb-outline').height(eyeHeight / (currentHeight / dom.height()));
                    $('#np-thumb-picture').show(500);
                }
                dom.width(currentWidth);
                dom.height(currentHeight);
            } else {
                minWidth = dom.width();
                minHeight = dom.height();
                setWidth = currentWidth > minWidth ? minWidth : currentWidth;
                setHeight = currentHeight > minHeight ?  minHeight :currentHeight;
                if(currentWidth<window.wid || currentHeight<window.hid){
                    return false;
                }
                if (currentWidth < domParent.width() && currentHeight < domParent.height()) {
                    $('#np-thumb-picture').hide(500).width(235).height(175);
                    if(window.big){
                        return;
                    }
                }else {
                    $('#np-thumb-outline').width(eyeWidth / (setWidth / dom.width()));
                    $('#np-thumb-outline').height(eyeHeight / (setHeight / dom.height()));
                }
                dom.width(setWidth);
                dom.height(setHeight);
            }
            self.setPosition();
            self.setEyePos();
        })
    };
    ///service/pcm/get_download_file?id=
    previewPicture.prototype.downloadDialog = function(url, callback) {
        /**var insertDom = jQuery('<iframe id="forDownload" src=' + url + '></iframe>');
        if (jQuery('#forDownload').length < 1) {
            jQuery('body').append(insertDom);
            jQuery('#forDownload').attr("src", url);
        } else {
            jQuery('#forDownload').attr("src", url);
        }**/
        //为兼容ie9下点击查看图片后事件不能点击问题
        window.open(url);
    };

    previewPicture.prototype.bindEvent = function(options) {
        var self = this;
        //1:1
        $('#np-tools-bar .np-elel').off('click').on('click', function() {
                self.renderPicture(self.dataArray[self.target], options);

                if(jQuery(this).hasClass("active")){
                    jQuery(this).removeClass('active');
                }else{
                    jQuery(this).addClass('active');
                }
                setTimeout(function() {
                    self.resetPictureSize("")
                }, 500)
                $('#np-thumb-outline').width(235);
                $('#np-thumb-outline').height(175);
                $('#np-thumb-close').trigger('click');
            })
            //删除功能
        $('#np-tools-bar .np-delete').off('click').on('click', function() {
            if (self.dataArray.length === 0) {
                return;
            }
            new ConfirmDialog({
                title: '提示',
                message: "您确定要删除吗?",
                callback: function() {
                    if (options.message && options.message.deleteMessage) {
                        PubSub.publish(options.message.deleteMessage, {
                            id: self.dataArray[self.target].id,
                            type: self.dataArray[self.target].type,
                            resource: self.dataArray[self.target].resource
                        })
                    }
                    if (self.dataArray.length === 1) {
                        self.dataArray = [];
                        self.target = 0;
                        self.removePicture();
                    } else if (self.target === self.dataArray.length - 1) {
                        self.target--;
                        self.dataArray.splice(self.dataArray.length - 1, 1);
                        self.renderPicture(self.dataArray[self.target], options)
                    } else {
                        self.dataArray.splice(self.target, 1);
                        self.renderPicture(self.dataArray[self.target], options)
                    }

                }
            });
        })

        //下载功能
        $('#np-tools-bar .np-download').off('click').on('click', function() {
            var imgs = self.dataArray[self.target].picture.indexOf("img/")>-1?self.dataArray[self.target].picture.substr(4,self.dataArray[self.target].picture.length):self.dataArray[self.target].picture;
            var url = '/service/pcm/get_structured_file?filePath=' + imgs;
            self.downloadDialog(url);
        })

        //入库
        $('#np-tools-bar .np-store ').off('click').on('click', function() {
            // 图片入新的视图库 by songxj 2016/04/08
            require(["pvbEnterLib"], function(EnterLib) {
                var imgData = self.dataArray[self.target];
                var imgObj = {
                    type: "img",
                    filePath: imgData.picture,
                    resourceObj: {
                        fileName: imgData.title
                    }
                };
                EnterLib.init(imgObj);
            });
        });
            //生成线索
        $('#np-tools-bar .np-addClues ').off('click').on('click', function() {
            $.ajax({
                url: '/service/pvd/clue',
                type: "POST",
                moduleName: "线索",
                data: {
                    id: self.dataArray[self.target].id,
                    type: self.dataArray[self.target].type
                }
            }).success(function() {
                notify.success("生成线索成功！");
            });
        })
        $('#np-sidebar-control').off('click').on('click', function() {
            $('#np-sidebar,#np-preview-main').animate({
                    right: $(this).hasClass('show') ? '+=250' : '-=250'
                },
                1000);
            $('#np-preview-img').animate({
                    left: $(this).hasClass('show') ? '-=125' : '+=125'
                },
                1000);
            $(this).toggleClass('show');
        });

        $('#np-preview-close').off('click').on('click', function() {
            //隐藏导航,bug[37719], add by zhangyu, 2015.10.25
            try {
                window.top.showHideNav("show");
            } catch (e) {};
            $('#np-tools-bar .np-elel').removeClass("active");
            $('#np-preview-picture').hide(500);
            $('#np-preview-img').width(self.originalSize.width);
            $('#np-preview-img').height(self.originalSize.height);
            if (options.message && options.message.closeMessage) {
                PubSub.publish(options.message.closeMessage, (parseInt(self.target / 9) + 1));
            }
        });

        $('#np-preview-prev').off('click').on('click', function() {
            self.prev(options)
        });

        $('#np-preview-next').off('click').on('click', function() {
            self.next(options);
        });

        $('#np-thumb-close').off('click').on('click', function() {
            $('#np-thumb-picture').hide(200);
        });
        $('#np-thumb-outline').mousedown(function(event) {
            self.dom = $(this);
            event.preventDefault(); /*取消默认事件*/
            /*mousedown时记录鼠标位置*/
            var firstX = event.pageX;
            var firstY = event.pageY;
            /*元素初始状态所在的相对页面的定位*/
            var curentX = self.dom.offset().left;
            var curentY = self.dom.offset().top;

            var handler = function(e) {
                /*移动时元素位置变化量*/
                var changeX = curentX + e.pageX - firstX;
                var changeY = curentY + e.pageY - firstY;

                //控制移动块不超出父级div
                if (changeX < $('#np-thumb-picture').offset().left) {
                    changeX = $('#np-thumb-picture').left;
                }
                if (changeY < $('#np-thumb-picture').offset().top) {
                    changeY = $('#np-thumb-picture').top;
                }
                if (changeX > $('#np-thumb-picture').offset().left + $('#np-thumb-picture').width() - self.dom.width() - 3) {
                    changeX = $('#np-thumb-picture').offset().left + $('#np-thumb-picture').width() - self.dom.width() - 3;
                }
                if (changeY > $('#np-thumb-picture').offset().top + $('#np-thumb-picture').height() - self.dom.height() - 3) {
                    changeY = $('#np-thumb-picture').offset().top + $('#np-thumb-picture').height() - self.dom.height() - 3;
                }
                self.dom.css({
                    'margin-top': 0,
                    'margin-left': 0

                })
                self.dom.offset({
                    left: changeX,
                    top: changeY
                });

                if (self.eyeMouseMoveCallback) {
                    var eyeTop = parseInt(self.dom.css('top'));
                    var eyeLeft = parseInt(self.dom.css('left'));
                    self.eyeMouseMoveCallback({
                        x: eyeLeft,
                        y: eyeTop
                    });
                }
            };
            var release = function(e) {
                jQuery(document).unbind('mousemove', handler);
                jQuery(document).unbind('mouseup', release);
            };


            jQuery(document).bind('mousemove', handler);
            jQuery(document).bind('mouseup', release);
        })

        self.movePicture();
    }

    return new previewPicture();
})