define(['jquery','ajaxModel'], function($,ajaxModel) {

	var tvW = function(config) {
		var self=this;
		jQuery.extend(self.config, config);		
		
	};

	tvW.prototype = {
		 config :{
			screenNum:4, //默认窗格数量: 1, 4, 9, 16
		 	screenTitle:'电视墙标题',//电视墙标题
		 	freeWindow:[],
		 	occupyWindow:[],
			unActive:[],
			addDom:null,
			selectAll:true,
			inspectName:null
		 },


		init: function(call) {
			var self = this;
			self.addTvWall(self.config.addDom,function(){
				//select框让screenNum默认选中
				$('#wcount').val(self.config.screenNum);
				$(".dialog-history").attr("data-name",self.config.inspectName)
			//	$('.inspect-interval-time').val(10);
				self.bindEvt();	
				self.swScreen(self.config.screenNum);
				self.filterTD();
				call && call()		
			});

		},
		bindEvt: function() {
			var self = this;			

			$('#wcount').on('change',function() {
				self.swScreen(null, $(this),function(){	
                    var totalWondow=$('#wcount').val();
                    var cForbidden=$('.tv-screen').find('td.cForbidden').length;
                    // if(totalWondow == cForbidden){
                    //     $("#checkAll").prop("checked",false);  
                    // }else{
                    // 	$("#checkAll").prop("checked",true);
                    // }
				});
			});
             
            $("#checkAll").on("change",function(){
            	if($(this).prop('checked')){                 
				   $('.tv-screen').find('td').not('.cForbidden').addClass('active');
            	}else{
                    $('.tv-screen').find('td').removeClass('active');
            	}
               
            });

			$(window).resize(function() {
				//高度自适应	
				self.swScreen();
			});

			$('.tv-screen').on('click', 'td', function() {
				$(this).toggleClass('active');
				self.isSelectAll();
			});

		},

		swScreen: function (n, dom, myCall) {
			//输出电视墙窗格,两个参数，第一个n是设置默认窗格数量，第二个dom是一个jquery对象
			var self = this;
			var h = ($('.tv-container').height());
			if (n || dom) {
				var num = n || dom.val(),
					len = parseInt(num) || n;
				if (len) {
					$('.tv-screen').html('');
					for (var i = 0; i < Math.sqrt(len); i++) {
						$('.tv-screen').append('<tr></tr>');
					};
					for (var j = 0; j < Math.sqrt(len); j++) {
						$('.tv-screen tr').append('<td class=""><div class="tdbox"></div></td>');
					};
					$('.tv-screen').find('td').each(function (i) {
						$(this).attr('data-arr', i);
					});
					self.filterTD();
				}
				myCall && myCall();
			}
			$('.tv-screen').css('height', h);
		},

		filterTD:function(){
			var self = this;
			if (self.config.selectAll) {
				$('.tv-screen').find('td').addClass('active');
			}           		   
			for (var z = 0; z < self.config.occupyWindow.length; z++) {
				$('.tv-screen').find("td:eq(" + self.config.occupyWindow[z] + ")").removeClass('active').addClass('cForbidden').attr("title", "当前窗口已被占用");
				$('.tv-screen').find("td:eq(" + self.config.occupyWindow[z] + ")").on("click", function () {
					return false;
				});
			}
			if (self.config.freeWindow.length) {
				for (var i = 0; i < self.config.freeWindow.length; i++) {
					$('.tv-screen').find("td:eq(" + self.config.freeWindow[i] + ")").addClass('active');
				}}
			
		   if (self.config.unActive.length){			   
			   for (var x = 0; x < self.config.unActive.length; x++) {
				   $('.tv-screen').find("td:eq(" + self.config.unActive[x] + ")").removeClass('active');
			   } }
		   		
		},
		isSelectAll:function(){
		   var self = this;
		   var totalWondow=$('#wcount').val();
		   if(self.config.screenNum <= totalWondow){
                  if($('.tv-screen').find('td.active').length == totalWondow-self.config.occupyWindow.length){
                       $("#checkAll").prop("checked",true);
                  }else{
                       $("#checkAll").prop("checked",false);
                  }
		   }else{
                
                   var cForbidden= $('.tv-screen').find('td.cForbidden').length;
                   if($('.tv-screen').find('td.active').length == (totalWondow-cForbidden)){
                       $("#checkAll").prop("checked",true);
                   }else{
                       $("#checkAll").prop("checked",false);
                   }
		   }
		},

		addTvWall:function(dom,callback){
			var self = this;
			$('head').append('<link rel="stylesheet" href="/module/common/tvwall-view/css/tvwall-view.css">');			
			ajaxModel.getTml('/module/common/tvwall-view/tvwall.html').then(function(tmp){
				dom.html(tmp);				
				callback();		
			});
		},
		
		tvArr: function() {
			var self = this;
			var activeWall = [];
			$('.tv-screen').find('.active').each(function() {
				activeWall.push($(this).attr('data-arr'));
			});
			return activeWall;
		}
		
		

	}
	
	return tvW;
});