define(["ajaxModel", "js/helper", "jquery.pagination", "base.self"], function(ajaxModel) {
	var examine = function Exmine() {

		this.monthOld = "";
		this.weekOld = "";
		this.firstLoad = true;
		this.count = 0;
		this.leftCount = 0;
		this.changeTemp= "";
	};
	examine.prototype = {
		init: function() {
			var self = this;
			self.load();
		},
		tpl: {},
		url: { //接口列表
			"detailList": "/service/inspect/report/getDetailList", //获取考核结果详细
			"allList": "/service/inspect/report/getAllList", //获取视频考核结果某一年数据
			"city": "/service/inspect/report/export/city",
			"month": "/service/inspect/report/export/month", //导出月视频考核表Excel
			"detail": "/service/inspect/report/export/detail",
			"getCount": "/service/inspect/report/get_count", //获取考核结果详细次数的数据
			"updateNum": "/service/inspect/report/update_actual_city_num",
			"getYear":"/service/inspect/report/getYear"
		},
		loadArr: [true, false, false],
		load: function() {
			var self = this;
			self.loadTpl("table", function(tep) {
				self.loadData("", self.url.getYear, function(res) {
					if (res && res.length) {
						var sendData = {
							"year_id": res[0].year
						};
						self.loadData(sendData, self.url.allList, function(data) {
							var html = tep({
								data: data
							});
							$("#tabexamine").html(html);
							permission.reShow();
							self.bindEvt();
							self.loadTpl("table_change", function(tep) {
								$("#tabexamine .chronological").find(".timesSelect").html(tep({
									yearList: res
								}));
								permission.reShow();
								$("#tabexamine .chronological").find(".timesSelect li:first").addClass('active');
								self.bindEvt();
							});

						});
					}else{
						var html = tep({
								data: ""
						});
						$("#tabexamine").html(html);
						self.bindEvt();
					}
					
				});


			});

		},
		loadTpl: function(name, callback) {
			var self = this,
				url = "inc/" + name + ".html";
			if (self.tpl[name]) {
				return callback(self.tpl[name]);
			}
			ajaxModel.getTml(url).then(function(temp) {
				if (temp) {
					self.tpl[name] = Handlebars.compile(temp);
					callback(self.tpl[name]);
				}
			});
		},
		//公共tab切换
		swTab: function(parent, children, callback) {
			var self = this;
			$(parent).off("click",children).on("click", children, function(e) {
				$(this).addClass("active").siblings(children).removeClass("active");
				callback && callback($(this));
			});
		},
		//公共ajax
		loadData: function(sendData, url, callback) {
			$.ajax({
				url: url,
				type: "post",
				data: sendData,
				success: function(res) {
					if (res && res.code === 200) {
						callback(res.data);
					} else if (res && res.code === 500) {
						notify.error('数据获取异常！');
					}
				},
				error: function() {
					notify.error('数据获取异常！');
				}
			});
		},
		exportData: function() {
			var self = this;
			$(".exportXls").off("click").on("click", function() {
				var dom = $(this).attr("data-page"),
					pages = {
						"#org": "org",
						".month": "month",
					},
					params = self.getParams($(dom), pages[dom]);

				var y_trlength = jQuery(".year .examinetable").find('tr').length;
				var m_trlength = jQuery(".month .examinetable").find('tr').length;

				if(jQuery(".orgexamine li:first").hasClass('active') && y_trlength<=3){
					notify.warn('当前没有统计结果');
					return;
				}

				if(jQuery(".orgexamine li:eq(1)").hasClass('active') && m_trlength<=2){
					notify.warn('当前没有统计结果');
					return;
				}
				var url = params.url + "?",
					k;
				for (k in params.params) {
					url += k + "=" + params.params[k] + "&"
				}
				url = url.substring(0, url.length - 1)

				jQuery("#download_frame").attr("src", url);
							
			});
		},
		getParams: function(dom, page) {
			var self = this;
			var paramObj = {
				"org": function() {
					// dom #org
					return {
						params: {
							"year_id": dom.find("li.active").text(),
							"fileName": encodeURIComponent(encodeURIComponent("视频考核结果-" +dom.find("li.active").text() )),
							"title": encodeURIComponent(encodeURIComponent(dom.find("li.active").text() + "年视频考核结果"))
						},
						url: self.url.city
					};
				},
				"month": function() {
					var val = dom.find(".mydatePick ").val(),
					count  = dom.find(".timesSelect li.active").data("times");
					return {
						params: {
							"month_id": Number(val.replace(/(?!\d+).?/g, "")),
							"count":count,
							"fileName": encodeURIComponent(encodeURIComponent("考核结果详情_" +val+"_"+count)),
							"title": encodeURIComponent(encodeURIComponent(val +"第"+count+"次视频考核结果"))
						},
						url: self.url.detail
					}
				}
				
			};

			return paramObj[page]();
		},

		changeTab: function(child) {
			var self = this,
				index = child.index(),
				pages = ["#org", ".month", "#chronological"];

			if (child.parent()[0].id === "orgExamine") {

				$(this).show().siblings.hide();
				switch (child.index()) {
					case 0:
						if(jQuery(".datetime-picker-small-panel").length){
							jQuery(".datetime-picker-small-panel").remove();
						}
						if (self.loadArr[0]) {
							$("#cont").find(".content:eq(0)").show().siblings(".content").hide();
							return;
						}
						self.loadArr[0] = true;
						self.load();

						
						break;
					case 1:
						if (self.loadArr[1]) {
							$("#cont").find(".content:eq(1)").show().siblings(".content").hide();
							return;
						}

						self.loadArr[1] = true;

						self.loadTpl("table1", function(tep) {
							$("#cont").find(".content:eq(1)").html(tep).show().siblings(".content").hide();
							$(".month .exportXls").attr("data-page", pages[index]);
							self.exportData(child);
							jQuery('.datetime-picker-small').val(Toolkit.getCurDateTime().substr(0, 7));
							self.bindDetailEvent();
							permission.reShow();
						});

						break;
				}

			};
		},
		bindDetailEvent: function() {
			var self = this;
			self.laodTimesTemp();
			jQuery(".detailPanel").find(".morePanel .left").hide();

			self.swTab(".detailPanel .timesSelect", "li", function(ele) {
				var count = ele.data("times");
				self.renderDetail(count);
			});
			require(['jquery-ui-timepicker-addon'], function() {
				//先引入
				jQuery(document).on('focus', '.datetime-picker-small', function() { //再调用
					jQuery('.datetime-picker-small').datetimepickerSmall({
						isShowDay: "hide",
						isShowTime: "hide",
						callback:function(){
							self.laodTimesTemp();
						}
					});
					jQuery(".detailPanel .timesSelect").find("li").removeClass("active");
				});

			});
			jQuery(".detailPanel").on("click",".morePanel .right",function(){
				var clientW = jQuery(this).parents().find(".timesSelect")[0].clientWidth,
					scrollW = jQuery(this).parents().find(".timesPanel")[0].clientWidth-10,
					needSlide = scrollW - parseInt(jQuery(this).parents(".detailPanel").find(".timesSelect").css("margin-left"));
				if(jQuery(this).parents(".detailPanel").find(".timesSelect").is(":animated")){
					return ;
				}
				jQuery(this).parents(".detailPanel").find(".timesSelect").stop().animate({
					"margin-left": -needSlide
				},200);
				self.leftCount -= 10;
				jQuery(this).parent().find(".left").show();
				if(self.leftCount <= 0){
					jQuery(this).hide();
					return false;
				}
			});
			jQuery(".detailPanel").on("click",".morePanel .left",function(){
				var clientW = jQuery(this).parents().find(".timesSelect")[0].clientWidth,
					scrollW = jQuery(this).parents().find(".timesPanel")[0].clientWidth-10,
					needSlide = scrollW+ parseInt(jQuery(this).parents(".detailPanel").find(".timesSelect").css("margin-left"));
				if(jQuery(this).parents(".detailPanel").find(".timesSelect").is(":animated")){
					return ;
				}	
				jQuery(this).parents(".detailPanel").find(".timesSelect").stop().animate({
					"margin-left":needSlide
				},200);
				self.leftCount +=  10;
				jQuery(this).parent().find(".right").show();
				if(self.leftCount>=self.count-10){
					jQuery(this).hide();
					return false;
				}
			})		

		},
		laodTimesTemp: function() {
			var self = this;
			var newV = jQuery(".detailPanel .mydatePick").val();
			//if (newV && newV !== self.weekOld) {
				var sdata = Number(newV.replace(/(?!\d+).?/g, "")),
					sendData = {
						"month_id": sdata
					};
				self.loadTpl("table_change", function(tep) {
					self.loadData(sendData, self.url.getCount, function(data) {
						self.count = data.length;
						self.leftCount = data.length-10;
						jQuery(".detailPanel .timesSelect").empty();
						if (data && data.length) {
							var html = tep({
								timesList: data
							});
							jQuery(".detailPanel .timesSelect").html(html);
							permission.reShow();
							if(self.count<= 10){
								jQuery(".detailPanel").find(".morePanel").hide();
							}
							jQuery(".detailPanel .timesSelect").find("li:first").addClass("active").siblings().removeClass("active");
						}else{
							jQuery(".detailPanel").find(".morePanel").hide();
						}
						self.renderDetail();
					});
				});
				self.weekOld = newV;
			//}

		},
		renderDetail: function(count) {
			var self = this;
			count = count ? count : 1;
			self.loadTpl("table_change", function(tep) {
				var $dateValue = jQuery(".detailPanel .mydatePick").val();

				if ($dateValue && count !== 0) {
					var formatData = Number($dateValue.replace(/(?!\d+).?/g, "")),
						sData = {
							"month_id": formatData,
							"count": count
						};
					self.loadData(sData, self.url.detailList, function(data) {
						data.point.firstLoad = self.firstLoad
						var html = tep({
							detailPanel: true,
							detailList: data.detailList,
							points: data.point,
							
						});
						$(".month #examinetable").html(html);
						permission.reShow();

					});

				}
			});
		},
		bindEvt: function() {
			var self = this;
			self.swTab("#orgExamine", "li", function(ele) {
				self.changeTab(ele)
			});
			self.swTab(".timesSelect", "li");
			$("#org .timesSelect li").off("click").on("click", function(e) {
				self.loadTpl("table_change", function(tep) {
					var sendData = {
						"year_id": $(e.target).text()
					};
					self.loadData(sendData, self.url.allList, function(data) {
						var html = tep({
							resultPanel: true,
							data: data
						});
						$(".year #examinetable").html(html);
						permission.reShow();

					});
				});

			});
			self.exportData();
			$("#cont").css("height", $("#major").height() - 100 + "px");
			jQuery(document).on("mouseenter mouseleave",".orgexamine .helper",function(e){
				var type = jQuery(this).parent().find("li.active").data("type");
				if(e.type==="mouseenter"){
					jQuery(this).addClass("active");
					if(type==="result"){

						jQuery(this).parent().find(".resultHelper").show();
						jQuery(this).parent().find(".detailHelper").hide();
					}else{
						jQuery(this).parent().find(".detailHelper").show();
						jQuery(this).parent().find(".resultHelper").hide();
					}
				}else{
					jQuery(this).removeClass("active");
					if(type==="result"){
						jQuery(this).parent().find(".resultHelper").hide();
						jQuery(this).parent().find(".detailHelper").hide();
					}else{
						jQuery(this).parent().find(".detailHelper").hide();
						jQuery(this).parent().find(".resultHelper").hide();
					}
				}
			})
			/**
			var oldVal = '';
			jQuery(document).on("click", "#examinetable tr td.canSet", function(e) {
				e.preventDefault();
				var monthid = jQuery(this).parent('tr').attr("data-trname"),
					type = jQuery(this).parent('tr').attr("data-type"),
					yearid = jQuery("#org").find("li.active").text() || "",
					cityid = jQuery(this).parent('tr').attr("data-cityid"),
					taskid = jQuery(this).parent('tr').attr("data-taskid");
				oldVal = jQuery(this).text();

				if (monthid === "平均值") {
					return;
				}
				jQuery(this).html("<input class='changeNum' data-type =" + type + " data-monthid=" + monthid + " data-yearid=" + yearid + " data-cityid=" + cityid + " data-taskid=" + taskid + " style='width:30px'  />");
				if (jQuery(".changeNum").length) {
					jQuery(".changeNum").val(oldVal);
					jQuery(".changeNum").focus();
				}

			});
			jQuery(document).on("blur", ".changeNum", function() {
				var num = jQuery(this).val(),
					node = jQuery(this);
				var checkNum = function(num) {
					if (isNaN(num) || num < 0 || num === "") {
						notify.warn("请输入正整数!");
						return false
					}
					return true;
				}
				if (checkNum(num)) {
					var tableType = node.attr("data-type"),
						params = {};

					switch (tableType) {
						case "year":
							params = {
								"page": "year",
								"year_id": node.attr("data-yearid"),
								"month_id": node.attr("data-monthid"),
								"actual_city_num": num
							};
							break;
						case "month":
							params = {
								"page": "month",
								"month_id": node.attr("data-monthid"),
								"city_id": node.attr("data-cityid"),
								"actual_city_num": num
							};
							break;
						case "week":
							params = {
								"page": "detail",
								"task_id": node.attr("data-taskid"),
								"city_id": node.attr("data-cityid"),
								"actual_city_num": num
							};
							break;
					}
					self.loadData(params, self.url.updateNum, function(data) {
						node.parent(".canSet").text(num);
						node.remove();
					});

				}

			});
			**/
		}

	};

	return new examine();

});