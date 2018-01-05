/**
 * 
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-04-22 16:49:23
 * @version $Id$
 */

define(['jquery','js/sidebar/rgb_hex', 'js/sidebar/plugin-moveDom', 'pubsub'], function($, colorExchange, moveDom, PubSub){
	var contentDom = $('#content'),
		documentDom = $('body');

	/*
	*  左侧面板各种交互效果事件绑定
	*/
	contentDom.on('click', '#sidebar .sidebar-header li', function(event){
		event.stopPropagation();
		$(this).addClass('active').siblings('li').removeClass('active');
	});

	contentDom.on('click', '#sidebar-body .sidebar-body-resource-type li', function(event){
		event.stopPropagation();
		if($(this).attr('data-handler') === 'LoadCamera'){
			contentDom.find('#sidebar .sidebar-filter-container').show().end().find('.sidebar-tree').css('top', '160px');
		}else{
			contentDom.find('#sidebar .sidebar-filter-container').hide().end().find('.sidebar-tree').css('top', '118px');
		}
		$(this).addClass('active').siblings('li').removeClass('active');
	});

	contentDom.on('click', '#sidebar-body .sidebar-filter .item', function(event){
		event.stopPropagation();
		$(this).addClass('active').siblings('.item').removeClass('active');
	});

	documentDom.on('click', '#poll-time .close', function(event) {
		event.preventDefault();
		event.stopPropagation();
		/* Act on the event */
		$('#poll-time input').val('');
		$('#poll-time').hide();
	});

	contentDom.on('click', '.search-result-batch .blue-button', function(event){
		event.stopPropagation();
		$(this).siblings('.operationg-detail').off().on('click','li', function(e){
			$(event.currentTarget).trigger('click');
			if($(this).hasClass('np-poll')){
				$('#poll-time').show();
				moveDom($('#poll-time'));
				$("#poll-time").find("input").val("10");
				//显示工具条遮罩
				if($(".map-toolbar-mask")[0]){
					$(".map-toolbar-mask").show();
				}
			}
		}).stop(0).toggle(500);
	});

	contentDom.on('click', '#sidebar-body .sidebar-home-icon', function(event){
		event.stopPropagation();
		var $targetDom = contentDom.find('#sidebar .sidebar-header li[data-mark= ' + $(this).attr('data-mark') + ']');
		//如果是跳转到资源页面，则直接初始化摄像机资源部分
		if($(this).attr('data-mark') === "resource"){
			$targetDom.addClass("init");
			//初始化
			PubSub.publish("initCameraResource");
		}
		$targetDom.trigger('click');
	});

	contentDom.on('click', '#sidebar-body .search-result-content-list .list-dropdown', function(event){
		event.stopPropagation();
		$('.list-item-dropdown').slideUp(500);
		$(this).toggleClass('up').parent().siblings('.list-item-dropdown').stop(0).toggle(500);
	});

	//警卫路线的交互效果
	
	contentDom.on('click', '.route-header .build-new-team', function(event) {
		event.preventDefault();
		$(this).closest('.route-header').find('.new-team').off().on('click', '.cancle-button', function(e){
			$(event.currentTarget).trigger('click');
		}).stop(0).slideToggle(500).find('input').val('');
		$(this).closest('.route-header').siblings('.route-group-container').animate({
			top: $(this).closest('.route-header').siblings('.route-group-container').position().top > 100 ? "95px": "207px"},
			500);
	});

	contentDom.on('click', '#sidebar-body .defence-circle .route-team-header .route-team-editor', function(event) {
		event.preventDefault();
		event.stopPropagation();
		
		$(this).parent('.route-team-button').siblings('.route-team-form').off().on('click', '.cancle-button', function(event) {
			event.preventDefault();
			event.stopPropagation();
			
			$(this).parent('.route-team-form').stop(0).toggle(200);
		}).stop(0).toggle(500, function(){
			//初始化输入框中的值,by zhangyu on 2015/5/27
			$(this).find(".route-team-form-name").val($(this).siblings(".route-team-name").text());
		});
	});

	/*contentDom.on('click', '#sidebar-body .route .route-team-info .camera-set', function(event) {
		event.preventDefault();
		var html = '<div class="route-team-setting"><span class="arrow"></span><form onsubmit="return false;">'+
                        '<div class="row"><label>时间间隔:</label><input></div>'+
                        '<div class="row"><label>车队代号:</label><input></div>'+
                        '<div class="row"><label>GPS编号:</label><input>' +
                        '</div><div class="row"><button class="blue-button save-button" type="submit">保存</button>'+
                        '<button class="white-button cancle-button" type="button">取消</button></div></form></div>',
            parentLi = $(this).closest('li');
		parentLi.has('.route-team-setting').length ? true : parentLi.append(html);
		parentLi.find('.route-team-setting').off().on('click', 'button', function(e) {
			$(event.currentTarget).trigger('click');
		}).slideToggle(400);
	});*/

	contentDom.on('click', '#sidebar-body .defence-circle .checkbox', function(event) {
		event.preventDefault();
		/* Act on the event */
		$(this).toggleClass('checked');
	});

	contentDom.on('click', '#sidebar-body .defence-circle .route-team-header', function(event) {
		event.preventDefault();
		
		$(this).toggleClass('dropdown').siblings('.route-team-body').stop(0).slideToggle(400);
	});

/*	contentDom.on('click', '#sidebar-body  .electronic-defense .np-build', function(event) {
		event.preventDefault();
		
		$(this).closest('.electronic-defense').find('.electronic-defense-list').hide().closest('.electronic-defense').find('.electronic-defense-new').show().find('input, textarea').val('');
		$(this).hide().closest('.route-header-title').find('span').addClass('np-electronic-defense pointer').after('<b> > </b><span>新建</span>').closest('.route-header-title').find('.np-save').show();
	});*/

	// contentDom.on('click', '#sidebar-body  .electronic-defense .np-electronic-defense', function(event) {
	// 	event.preventDefault();
	// 	/* Act on the event */
	// 	$(this).closest('.electronic-defense').find('.electronic-defense-list').show().closest('.electronic-defense').find('.electronic-defense-new').hide();
	// 	$(this).closest('.route-header-title').find('b:odd, span:odd').remove();
	// 	$(this).removeClass('np-electronic-defense pointer').siblings('.np-build').show().siblings('.np-save').hide();
	// });

	contentDom.on('click', '#sidebar-body .favorite .favorite-type li', function(event) {
		event.preventDefault();
		$(this).addClass('active').siblings('li').removeClass('active');
	});

	contentDom.on('click', '.color-options dt', function(event) {
		event.preventDefault();
		event.stopPropagation();
		/* Act on the event */
		$(this).parent().siblings('.color-selected').attr('data-color', colorExchange.colorHex($(this).css('background-color'))).find('i').css('background-color', $(this).css('background-color'));
	});

	contentDom.on('click', '.np-newTeam', function(event) {
		event.preventDefault();
		event.stopPropagation();
		var $newTeam = $(this).closest('.search-result-batch').siblings('.new-team');
		$newTeam.off().on('click', '.cancle-button', function(e){
			$newTeam.slideUp(500);
		}).stop(0).slideDown(500);
		/* Act on the event */
	});
});