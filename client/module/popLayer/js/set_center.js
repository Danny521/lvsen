/**
 *
 * @authors lrxia (lrxia@netposa.com)
 * @date    2015/7/9
 * @version $
 * 设置图片或者视频一直居中显示
 */
define([],function() {
    /*拖拽相关的东西*/
    function Drag(obj){
        var self = this;
        this.dom = jQuery(obj.select).css({'cursor':'move'});
        this.parDom = jQuery(obj.parSelect);
        this.dom.mousedown(function(event) {
            event.preventDefault();/*取消默认事件*/
            /*mousedown时记录鼠标位置*/
            var firstX = event.pageX;
            var firstY = event.pageY;
            /*元素初始状态所在的相对页面的定位*/
            var curentX = self.dom.offset().left;
            var curentY = self.dom.offset().top;

            var handler = function(e){
                /*移动时元素位置变化量*/
                var changeX = curentX + e.pageX - firstX;
                var changeY = curentY + e.pageY - firstY;

                if(self.dom.selector == $(".big-pic").selector){
                    if(changeX<$(".pic-wrap").offset().left-self.dom.width()-10){
                        changeX = $(".pic-wrap").offset().left-self.dom.width()+16;
                    }
                    if(changeY<$(".pic-wrap").offset().top-self.dom.height()-10){
                        changeY = $(".pic-wrap").offset().top-self.dom.height()+16;
                    }
                    if(changeX>$(".pic-wrap").offset().left+$(".pic-wrap").width()-$(".eyes").width()-10){
                        changeX = $(".pic-wrap").offset().left+$(".pic-wrap").width()-$(".eyes").width()-16;
                    }
                    if(changeY>$(".pic-wrap").offset().top+$(".pic-wrap").height()-$(".eyes").height()-10){
                        changeY = $(".pic-wrap").offset().top+$(".pic-wrap").height()-$(".eyes").height()-16;
                    }
                    if(self.dom.width()>$(".pic-wrap").width()){
                        self.dom.offset({left:changeX,top:changeY});
                    }
                }
                if(self.dom.selector == $(".outline").selector){
                    //控制移动块不超出父级div
                    if(changeX<$(".eyes").offset().left){
                        changeX = $(".eyes").offset().left;
                    }
                    if(changeY<$(".eyes").offset().top){
                        changeY = $(".eyes").offset().top;
                    }
                    if(changeX>$(".eyes").offset().left+$(".eyes").width()-self.dom.width()-3){
                        changeX = $(".eyes").offset().left+$(".eyes").width()-self.dom.width()-3;
                    }
                    if(changeY>$(".eyes").offset().top+$(".eyes").height() - self.dom.height()-3){
                        changeY = $(".eyes").offset().top+$(".eyes").height()- self.dom.height()-3;
                    }
                    self.dom.offset({left:changeX,top:changeY});
                }
                if(obj.eyeMouseMoveCallback){
                    var eyeTop = parseInt(self.dom.css('top'));
                    var eyeLeft = parseInt(self.dom.css('left'));
                    obj.eyeMouseMoveCallback({x:eyeLeft,y:eyeTop},self.parDom);
                }
            };
            var release = function(e){
                jQuery(document).unbind('mousemove', handler);
                jQuery(document).unbind('mouseup', release);
            };
            jQuery(document).bind('mousemove',handler);
            jQuery(document).bind('mouseup',release);
        });
    }
    var set_center =  {
        /*记录图片展示区域的宽高*/
        picWrapWidth:0,
        picWrapHeigh:0,
        initPWidth:0,
        initPHeight:0,
        initPL:0,
        initPT:0,
        /*保存所加载图片的宽高*/
        bgPicSize:{},
        /*记录window的宽高*/
        windowHeight:0,
        windowWidth:0,
        /*zoom 用来记录缩放倍数*/
        zoom:0,
        /*缩放一倍大小变化多少像素*/
        zoomPix:500,
        /*有些交互需要初始化执行*/
        state: {
            _originWidth:0,
            _originHeight:0,
            posX: 0,
            posY: 0,
            scale: 1,
            width:0,
            height:0,
            marL :0,
            marT:0,
            centerX:0,
            curentY:0
        },
        pointX :0,
        pointY:0,
        mouseX:0,
        mouseY:0,
        init:function(src){
            var self = this;
            this.picReset(src);
            this.bindEvents();
            var picDrag = new Drag({
                select:'.big-pic',
                parSelect:'.pic-wrap',
                dragOut:true
            });
            var eyeDrag = new Drag({
                select:'.outline',
                parSelect:'.eyes',
                dragOut:false,
                eyeMouseMoveCallback:self.eyeMouseMoveCallback
            });
            var ocxDom = jQuery('.content-video.active object')[0];
            if(ocxDom){
                if(ocxDom.attachEvent){
                    ocxDom.attachEvent("onMouseMoveWindow", self.posIframe);
                } else {
                    ocxDom.addEventListener("MouseMoveWindow", self.posIframe, false);
                }
            }
        },
        posIframe:function(index){
            jQuery('.iframe-and-control').show();
        },
        bindEvents:function(){
            var self = this;
            /*window resize事件*/
          /*  jQuery(window).resize(function(){
                var valuable = self.resize();
                var $picWrap = jQuery('.pic-wrap');
                var mainContent = jQuery('.main-content');
                var playerControlHeight = jQuery('.content-video.active .player-controls').height()||jQuery('.content-video.active .video-block').height();
                self.picWrapWidth = $picWrap.width();
                self.picWrapHeigh = $picWrap.height();
                //浏览器的大小变化时让图片自适应
                if(jQuery(".pic-wrap").length>0){
                    console.log("000")
                        self.picReset();
                }
            }).trigger('resize');*/

            /*图片上的mousewheel触发时*/

            $(".big-pic").on('mousewheel',function(event){
                self.zoom(event.originalEvent.wheelDelta || -(event.originalEvent.deltaY),event.offsetX,event.offsetY);
            });
        },
        /*根据window大小，计算一下图片显示区域的大小*/
        resize:function(){
            var self = this;
            self.windowHeight = jQuery(window).height();
            self.windowWidth = jQuery(window).width();
            var tabTitleHeight = jQuery('.bg-content .tab-title').height();
            var valuable = self.windowHeight - tabTitleHeight - 20;
            return valuable;
        },
        eyeMouseMoveCallback:function(size){
            $('.big-pic').offset({
                top : -($('.big-pic').height()*(size.y/$('.eyes').height())),
                left : -($('.big-pic').width()*(size.x/$('.eyes').width()))
            })
        },
        /**
         * [Move 暂时先不用]
         * @param {[type]} evt [description]
         */
        Move:function(evt){
            var self = this;
            var $pic = $(".big-pic");
            var $picWrap = $(".pic-wrap");
            var left = self.pointX + (event.pageX - self.mouseX);
            var top = self.pointY + (event.pageY - self.mouseY);
            if(left<$picWrap.offset().left-$pic.width()+10){
                left = $picWrap.offset().left-$pic.width();
            }
            if(top<$picWrap.offset().top-$pic.height()+10){
                top = $picWrap.offset().top-$pic.height();
            }
            if(left>$picWrap.offset().left+$picWrap.width()-$(".eyes").width()-10){
                left = $picWrap.offset().left+$picWrap.width()-$(".eyes").width()-20;
            }
            if(top>$picWrap.offset().top+$picWrap.height()-$(".eyes").height()-10){
                top = $picWrap.offset().top+$picWrap.height()-$(".eyes").height()-20;
            }
            if($pic.width()>$picWrap.width()){
                $pic[0].style.left = left+"px";
                $pic[0].style.top = top+"px";
            }
        },
        /**
         * [picReset 获取加载图片的宽高并且在加载时等比例限制图片宽高]
         * @param  {[type]}   src      [description]
         * @return {[type]}            [description]
         */
        picReset:function(src){
            var self = this,
                src =  src,
                img = new Image(),
                $picContent = jQuery(".pic-wrap"),
                state = self.state;
            img.src = src;
            if(!jQuery(".pic-wrap")[0]) return;
            img.onload=function(){
                //存储图片的原始大小
                self.bgPicSize = {
                    width:img.width,
                    height:img.height
                }
                state.centerX = $picContent.offset().left + $picContent.width()/2;
                state.curentY = $picContent.offset().top + $picContent.height()/2;

                //存储图片原始大小和父级DIV的比例
                var scaleX = self.bgPicSize.width/$picContent.width(),
                    scaleY = self.bgPicSize.height/$picContent.height();
                //图片原始大小均大于父级div的大小
                if(scaleX>1 && scaleY>1){
                    //图片宽度大于高度时根据宽度按比例限制高度，并且处理margin-top使得这种情况下图片上下居中
                    if(scaleX>scaleY){
                        state.width = $picContent.width();
                        state.height =  (1/scaleX)*self.bgPicSize.height;
                    }else{//图片高度大于图片宽度时根据高度限制图片宽度
                        state.width =(1/scaleY)*self.bgPicSize.width;
                        state.height =  $picContent.height();
                    }
                }else if(scaleX>1 && scaleY<1){//图片原始宽度大于父级div的宽度
                    state.width = $picContent.width();
                    state.height =  (1/scaleX)*self.bgPicSize.height;
                }else if(scaleX<1 && scaleY>1){//图片原始高度大于父级div的高度
                    state.width = (1/scaleY)*self.bgPicSize.width;
                    state.height =  $picContent.height();
                }else{//图片原始大小均小于父级div的大小
                    state.width = self.bgPicSize.width;
                    state.height =  self.bgPicSize.height;
                }
                state._originWidth = state.width;
                state._originHeight = state.height
                setTimeout(function(){
                    jQuery(".big-pic").css({
                        "height":state.height,
                        "width":state.width
                    })
                    state.posX = ($picContent.width()-$(".big-pic").width())/2;
                    state.posY = ($picContent.height()-$(".big-pic").height())/2;
                    self.refreshTransform();
                },100)
            }
        },
        /**
         * 3.缩放
         */
        zoom: function(bigger, offsetX, offsetY) {
            var self = this,
                state = self.state,
                $parentPic = $(".pic-wrap"),
                img = jQuery(".big-pic")[0],
                eyeWidth = $('.outline').width(),
                eyeHeight = $('.outline').height(),
                currentWidth = state.width+bigger*0.15,
                currentHeight = state.height+bigger*0.15;
            if(currentWidth/state._originWidth > 4){
                return;
            }
            if(bigger>0){
                if((state.width>$parentPic.width()-10)||(state.height>$parentPic.height()-10)){
                    $('.outline').width(eyeWidth/(currentWidth/state.width));
                    $('.outline').height(eyeHeight/(currentHeight/state.height));
                    $(".eyes").show(500);
                }
                state.width = currentWidth;
                state.height = currentHeight;
            }else{
                var setWidth = currentWidth > state._originWidth ? currentWidth : state._originWidth;
                var setHeight = currentHeight > state._originHeight ? currentHeight : state._originHeight;
                if ((state.width < $parentPic.width()+20)&&(state.height < $parentPic.height()+20)) {
                    $(".outline").css({
                        "top":0,
                        "left":0,
                        "width":235+"px",
                        "height":175+"px"
                    })
                    $('.eyes').hide(500);
                }else{
                    $('.outline').width(eyeWidth/(setWidth/state.width));
                    $('.outline').height(eyeHeight/(setHeight/state.height));
                }
                state.width = setWidth;
                state.height = setHeight;
            }
            state.posX = ($parentPic.width()-state.width)/2;
            state.posY = ($parentPic.height()-state.height)/2;
            self.refreshTransform();
            self.setEyesPosition();
        },
        /**
         * [refreshTransform 存储图片的所有信息，在需要时直接调用即可，不需要在每一次对图片发生变化时进行处理，便于管理]
         * @return {[type]} [description]
         */
        refreshTransform : function(){
            var state = this.state;
            jQuery(".big-pic").css({
                "width":state.width,
                "height":state.height,
                "left":state.posX,
                "top":state.posY
            }).show();
        },
        setEyesPosition:function(){
            $('.outline').offset({
                top : $('.eyes').offset().top + parseInt(($('.eyes img').height() -  $('.outline').height())/2),
                left : $('.eyes').offset().left + parseInt(($('.eyes img').width() -  $('.outline').width())/2)
            })
        }
    };
    return set_center
})