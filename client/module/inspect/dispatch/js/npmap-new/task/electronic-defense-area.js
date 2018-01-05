/**
 * 电子防区
 * @author Fxd
 * @date   2015-11-09
 * @param  {[type]}   Pack               [description]
 * @param  {[type]}   OverlayerCtrl)     {               return (function(scope, $) {        var                    $container [description]
 * @param  {[type]}   cameraShowCallback [description]
 * @param  {[type]}   _bindBuildBtn      [description]
 * @return {[type]}                      [description]
 */
define([
    '/lbsplat/module/commanddispatch/electronic-defense-area/js/electronic-defense-area-pack.js',
    '/lbsplat/module/commanddispatch/electronic-defense-area/js/right-electronic-defense-area-view.js',
    'js/npmap-new/map-common-overlayer-ctrl'
], function(Pack, RightView, OverlayerCtrl) {
    return (function(scope, $) {
        var
        // 电子防区模块容器
            $container = null,
            // 是否是编辑状态
            _isEditStatus = false;
        var
        // 新建按钮事件绑定
            _bindBuildBtn = function() {
                $('#buildAreaBtn').off('click').on('click', function() {
                    // 隐藏新建电子防区头
                    $(".route-header-title.build").hide();
                    // 显示保存电子防区头
                    $(".route-header-title.save").show();
                    _bindSaveBtn();
                    _bindDefenseArea();
                    // 电子防区可点击样式添加
                    $('#DefenseArea').addClass('defense-area-enable-click');
                    Pack.buildDefenseArea();
                });
            },
            // 保存按钮事件绑定
            _bindSaveBtn = function() {
                $('#SaveAreaBtn').off('click').on('click', function() {
                    Pack.saveNewDefenseArea(_callbackSaveSuccess);
                });
            },
            // 编辑状态保存按钮事件绑定
            _bindEditSaveBtn = function() {
                $('#EditSaveAreaBtn').off('click').on('click', function() {
                    Pack.saveEditDefenseArea(_callbackEditSaveSuccess);
                });
            },
            // 编辑状态保存成功的回调方法
            _callbackEditSaveSuccess = function() {
                // 隐藏保存电子防区头
                $(".route-header-title.edit").hide();
                // 显示新建电子防区头
                $(".route-header-title.build").show();
                // 电子防区可点击样式去除
                $('#EditSaveAreaBtn').removeClass('defense-area-enable-click');
                _bindBuildBtn();
                _isEditStatus = false;
            },
            // 电子防区事件绑定
            _bindDefenseArea = function() {
                if (_isEditStatus) {
                    $('#EditStatusDefenseArea').off('click').on('click', function() {
                        Pack.goBackToDefenseArea("edit", _callbackEditStatusDefenseArea);
                    });
                } else {
                    $('#DefenseArea').off('click').on('click', function() {
                        Pack.goBackToDefenseArea(null, _callbackDefenseArea);
                    });
                }

            },
            // 保存成功的回调方法
            _callbackSaveSuccess = function() {
                // 隐藏保存电子防区头
                $(".route-header-title.save").hide();
                // 显示新建电子防区头
                $(".route-header-title.build").show();
                // 电子防区可点击样式去除
                $('#DefenseArea').removeClass('defense-area-enable-click');
                _bindBuildBtn();
            },
            // 电子防区的回调方法
            _callbackDefenseArea = function() {
                // 隐藏保存电子防区头
                $(".route-header-title.save").hide();
                // 显示新建电子防区头
                $(".route-header-title.build").show();
                // 电子防区可点击样式去除
                $('#DefenseArea').removeClass('defense-area-enable-click');
                _bindBuildBtn();
            },
            // 编辑电子防区的回调方法
            _callbackEditDefenseArea = function() {
                // 隐藏保存电子防区头
                $(".route-header-title.build").hide();
                // 显示新建电子防区头
                $(".route-header-title.edit").show();
                _bindEditSaveBtn();
                _isEditStatus = true;
                _bindDefenseArea();
                // 电子防区可点击样式添加
                $('#EditStatusDefenseArea').addClass('defense-area-enable-click');
            },
            // 编辑状态，电子防区按钮回调方法
            _callbackEditStatusDefenseArea = function() {
                // 隐藏保存电子防区头
                $(".route-header-title.edit").hide();
                // 显示新建电子防区头
                $(".route-header-title.build").show();
                // 电子防区可点击样式去除
                $('#EditStatusDefenseArea').removeClass('defense-area-enable-click');
                _bindBuildBtn();
                _isEditStatus = false;
            };

        //初始化页面
        scope.init = function() {
            $('.electronic-defense-area .sidebar-home-icon').addClass('home-enable-click');
            _bindBuildBtn();
            // 电子防区列表容器
            $container = $(".electronic-defense-area");
            Pack.init(map, $container, _callbackEditDefenseArea);
        };
        scope.clearGpsTimer = function(){
            RightView.clearGpsTimer();
        };
        return scope;
    }({}, jQuery));
});
