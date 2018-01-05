var playerImpl = new Mplayer({});
var videoAnalyst = new Class({
	Implements: [Options, Events],
	options: {
		path: null, //当前图片或视频路径
		id: null, //当前点击节点id
		parentid: null, //当前点击根节点id
		fileType: null, //文件类型
		fileName: null, //文件名称
		template: "",
		incidentId: null,  //案事件id
		incidentname: null,  //案事件名称
		pvdSourceId:"", //pvdSourceId视图库已有id
		paperId: 'image_struct',
		base64Pic:null,
		imageBg:"",
		template_right: null, //模版缓存
		rightContain: $(".main_right"),
		toolContain: ".video_edit .video_tool",
		templateUrl: "/module/viewlibs/caselib/inc/tpl_videoTool.html",
		video_right_templurl: "/module/viewlibs/caselib/inc/tpl_videoRight.html", //模版请求路径
		serviceUrl: "/service/pia/save_structured_info?_=" + (new Date()).getTime() //保存到云端请求
	},

	initialize: function(options) {
		this.setOptions(options);
	},

	fromImportSource: function() {
		//cookie 参数  0: id (国标id) 1: path (路径) 2：parentid(父级节点id) 3：shootTime(开始绝对时间) 4：fileType(文件类型：1，视频；2，图片) 5：incidentId(案事件id) 6: incidentname(案事件名称),pvdSourceId(表示已在视图库中id)
		var importStr = Cookie.read("import");
		var importJson = JSON.parse(importStr);
		this.options.fileType = importJson.fileType;
		this.options.path = importJson.path;
		this.options.id = importJson.id;
		this.options.parentid = importJson.parentid;
		this.options.shoottime = importJson.shootTime;
		this.options.fileName = importJson.name;
		this.options.incidentId = importJson.incidentId;
		this.options.incidentname = importJson.incidentname;
		this.options.sourceId = importJson.sourceId;
		this.options.pvdSourceId = importJson.pvdSourceId;
		$(".video_content .filename").html(this.options.fileName);
		this.renderVideorightmpl();
	},
		//设置图片大小
	setImage: function(img_url, img) {
		// 改变图片的src
		img.src = img_url;
		$("#picture").val(img_url);
		var check = function() {
			if (img.width > 0 || img.height > 0) {
				if (img.width > 700 || img.height > 424) {
					if (img.width / img.height > 700 / 424) {
						img.height = 700 * img.height / img.width;
						img.width = 700;
					} else {
						img.width = img.width / img.height * 424;
						img.height = 424;
					}
				}
				paperH.image(img_url, 0, 0, img.width, img.height);
				clearInterval(set);
			}
		};
		var set = setInterval(check, 40);
	},
	//将base64图片存储转化为图片url
	base64ToUrl: function(base64Str,$dom){
		var imagePath;
		var that = this;
		$.ajax({
			url: "/service/pvd/upload/base64",
			type: "post",
			dataType: "json",
			data:  {
				"picture": base64Str
			},
			success: function(res) {
				if (res.code === 200) {
					that.options.imagePath = res.data.path;
					$dom.attr('src', that.options.imagePath);
					//获取视频抓取图片的宽高
					that.options.imageBg = that.options.imagePath;
					//给base64pic赋值为图片路径（url）
					that.options.base64Pic = that.options.imagePath;
					var img_url = that.options.imageBg;
					var img = new Image();
					that.setImage(img_url, img);
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("画布初始化异常！");
				}
			}
		});
	},
	//人工标注按钮-点击
	manualMarkBtn: function(paperH) {
		var that = this;
		jQuery(document).on('click', '#mark_target', function(event) {
			var base64Str = playerImpl.firstFrameBase64 = playerImpl.player.getPicInfo(0);
			if (base64Str !== "ERROR") {
				jQuery(".video-block .switch").trigger('click');
				jQuery(".video_form span img").attr('src', 'data:image/jpg;base64,' + base64Str);
				jQuery(".video_edit .beginhide").show(1);
				var formatPath = encodeURI(base64Str.replace(/[\n\r]/ig, ''));

				that.base64ToUrl(formatPath, jQuery(".video_form span img"));
				//切换图片
				jQuery(".draw_tools .icon_cancel").show(1);
				jQuery(".video_edit .edit_class").trigger("click");
				jQuery(".video_edit dd span[data-flag='tool_hideen']").hide(1);
				jQuery(".video_edit dd span[data-flag='tool_show']").show(1);
				//获取视频抓取图片的宽高
				var img_url = that.options.imageBg;
				var img = new Image();
				// 改变图片的src
				img.src = img_url;
				var check = function() {
					if (img.width > 0 || img.height > 0) {
						if (img.width > 700 || img.height > 424) {
							if (img.width / img.height > 700 / 424) {
								img.height = 700 * img.height / img.width;
								img.width = 700;
							} else {
								img.width = img.width / img.height * 424;
								img.height = 424;
							}
						}
						paperH.image(that.options.imageBg, 0, 0, img.width, img.height);
						clearInterval(set);
					}
				};
				var set = setInterval(check, 40);
				//paperH.image("data:image/jpg;base64," + formatPath, 0, 0, 700, 425);
				/**获取之前保存的图片绘制信息  等添加结构化信息的时候需要用到，暂时注视掉，不要删除*/
				/*var jsonB = [{"data":{},"type":"rect","attrs":{"x":304,"y":40,"width":162,"height":38,"r":0,"rx":0,"ry":0,"fill":"none","stroke":"red","stroke-width":"5"},"transform":"","id":0},{"data":{},"type":"ellipse","attrs":{"cx":145,"cy":93,"rx":151,"ry":87,"fill":"none","stroke":"red","stroke-width":3,"x":220.5,"y":136.5},"transform":"","id":1},{"data":{},"type":"path","attrs":{"fill":"none","stroke":"red","path":[["M",639,64],["L",595,154],["M",595,154],["L",590.1297218348293,139.81266795363337],["M",595,154],["L",609.1873320463667,149.12972183482935]],"cursor":"move"},"transform":"","id":2}] ;
				paperH.fromJSON(jsonB);
				jQuery('#image_struct svg rect').attr("cursor","move");
				jQuery('#image_struct svg ellipse').attr("cursor","move");
				jQuery('#image_struct svg path').attr("cursor","move");
				function drawselect(){
					paperH.forEach(function(el){
						if(el != imageBg){
							el.draggable();
						}
						 el.click(function(evt)
						  {
							jQuery(window).on('keydown','',function(e) {
							 if(e.keyCode == 46 && el.type !='image'){
								if(el.type =='text'){
									el.prev().remove();
								}
								 el.remove();
							 }
							});
						  });
					});
				}
				drawselect();*/
			} else {
				notify.warn('获取标记图片失败');
			}
		});
	},

	videoToolPaper: function() {
		var that = this;
		// var playerImpl = new Mplayer({});
		window.paperH = Raphael('image_struct', 700, 424); //创建画布
		// setTimeout(function() {
		playerImpl.initPlayer({ //调用播放器
			filename: that.options.path
		});
		// }, 1000);
		that.manualMarkBtn(paperH);
		that.bindToolEvents();

		that.sendData(that.options.path, that.options.id, that.options.shoottime, that.options.fileType,that.options.pvdSourceId);
		//权限处理
		if(role){
			role.reShow();
		}
	},

	imageToolPaper: function() {
		var that = this;
		window.paperH = Raphael('image_struct', 700, 424); //创建画布
		//获取图片的宽高
		var img_url = that.options.path;
		that.options.imageBg = that.options.path;
		//设置图片路径
		$("#picture").val(that.options.path);
		// 创建对象
		var img = new Image();
		// 改变图片的src
		img.src = img_url;
		// 执行获取宽高
		/*img.onload = function(){
		   console.log('width:'+img.width+',height:'+img.height);
		};*/
		//显示图片原始比例
		var check = function() {
			if (img.width > 0 || img.height > 0) {
				if (img.width > 700 || img.height > 424) {
					if (img.width / img.height > 700 / 424) {
						img.height = 700 * img.height / img.width;
						img.width = 700;
					} else {
						img.width = img.width / img.height * 424;
						img.height = 424;
					}
				}
				paperH.image(that.options.path, 0, 0, img.width, img.height);
				clearInterval(set);
			}
		};
		var set = setInterval(check, 40);
		that.bindToolEvents();
		that.sendData(that.options.path, that.options.id, that.options.shoottime, that.options.fileType,that.options.pvdSourceId);
		$(".video_edit .edit_class[data-flag=tool_show]").trigger("click");

		//图片标注信息
		//jQuery(document).on('click', '#mark_pic', function() {
		jQuery(".video_form span img").attr('src', that.options.path);
		//});
		jQuery(".draw_tools .icon_cancel").show(100);
		//权限处理
		if(role){
			role.reShow();
		}
	},

	renderVideorightmpl: function() {
		var that = this,
			$dom;
		if (that.options.fileType && that.options.fileType === "1") {
			that.videoRenderTempl();
		} else if (that.options.fileType && that.options.fileType === "2") {
			that.imageRenderTempl();
		}
	},
	//加载视频模版
	videoRenderTempl: function() {
		var that = this;
		if (that.options.template_right) {
			$dom = $(that.options.template_right({
				"video": {}
			}));
			that.options.rightContain.html($dom);
			that.bindEvents();
			$(".main_right .beginhide").css("display", "none");
			$(".main_right .edit_class[data-flag=tool_hideen]").trigger("click");

			that.videoToolPaper();
			$(".video_content .filename").text(that.options.fileName);

		} else {
			jQuery.get(that.options.video_right_templurl, function(tem, options) {
				that.options.template_right = Handlebars.compile(tem);

				$dom = $(that.options.template_right({
					"video": {}
				}));
				that.options.rightContain.html($dom);
				that.bindEvents();
				$(".main_right .beginhide").css("display", "none");
				$(".main_right .edit_class[data-flag=tool_hideen]").trigger("click");
				that.videoToolPaper();
				$(".video_content .filename").text(that.options.fileName);
			});
		}
	},
	//加载图片模版
	imageRenderTempl: function() {
		var that = this;
		if (that.options.template_right) {
			$dom = $(that.options.template_right({
				"image": {}
			}));
			that.options.rightContain.html($dom); //调用播放器

			that.bindEvents();
			that.imageToolPaper();

		} else {
			jQuery.get(that.options.video_right_templurl, function(tem, options) {
				that.options.template_right = Handlebars.compile(tem);

				$dom = $(that.options.template_right({
					"image": {}
				}));
				that.options.rightContain.html($dom);
				that.bindEvents();
				that.imageToolPaper();
			});
		}
	},
	//绑定操作类
	bindToolEvents: function() {
		var that = this;
		$(".video_edit dd span[data-flag='tool_show']").hide();
		$(".video_edit .edit_class").on("click", function() {
			//人工标注视频/图片切换
			$(this).addClass("current").siblings("a").removeClass("current");
			var tab_index = $(".video_edit dt a").index(this);
			$(".video_edit dd span").eq(tab_index).show().siblings("span").hide();
			//编辑工具类显/隐
			var showFlag = $(".video_edit .current").attr("data-flag");
			if (showFlag === "tool_show") {
				that.markTargettemplate();

			} else {
				if ($(".draw_tools")) {
					$(".draw_tools").remove();
				}
			}
		});
	},
	//绘图标注类
	toolsBIndEvents: function() {
		var that = this;
		if (that.options.imageBg === "") {
			$('.draw_tools .icon_cancel').hide(1);
		}
		var strokeColor = 'red';
		$('.draw_tools .icon_rec').on('click', function(e) {
			$('#' + that.options.paperId).unbind('mousedown');
			//$('#' + that.options.paperId).unbind('mousemove');
			$('#' + that.options.paperId).unbind('mouseup');
			//console.log('strokeColor--'+strokeColor);
			var rect = new rectCustom({
				paperId: that.options.paperId,
				canMove: true,
				color: strokeColor,
				outBorderSize: '3',
				zoom: true
			});
		});
		$('.draw_tools .icon_cir').on('click', function(e) {
			$('#' + that.options.paperId).unbind('mousedown');
			//$('#' + that.options.paperId).unbind('mousemove');
			$('#' + that.options.paperId).unbind('mouseup');
			var ovl = new ellipse({
				paperId: that.options.paperId,
				canMove: true,
				color: strokeColor,
				zoom: true
			});
		});
		$('.draw_tools .icon_arrow').on('click', function() {
			$('#' + that.options.paperId).unbind('mousedown');
			//$('#' + that.options.paperId).unbind('mousemove');
			$('#' + that.options.paperId).unbind('mouseup');
			var myLine = new drawLine({
				paperId: that.options.paperId,
				isHasArrows: true,
				strokeColor: strokeColor,
				arrowsSize: 15
			});
		});
		$('.draw_tools .icon_text').on('click', function() {
			$('#' + that.options.paperId).unbind('mousedown');
			$('#' + that.options.paperId).unbind('mouseup');
			var myTxt = new textInput({
				paperId: that.options.paperId,
				color: strokeColor
			});
		});
		$('.draw_tools .icon_Color').click(function() {
			//console.log($('.draw_tools ul').is(":hidden"));
			$('.draw_tools ul').is(":hidden") ? $('.draw_tools ul').show(1) : $('.draw_tools ul').hide(1);
		});
		$(".draw_tools span ul li").click(function() {
			$(this).addClass("current").siblings("li").removeClass("current");
			$('.draw_tools .icon_Color').css('background', $(this).attr('data-value'));
			$(this).parent("ul").hide();
		});
		$('.draw_tools .icon_cancel').click(function() {
			if (that.options.imageBg !== "") {
				paperH.clear();
				var img_url = that.options.imageBg;
				var img = new Image();
				// 改变图片的src
				img.src = img_url;
				var check = function() {
					if (img.width > 0 || img.height > 0) {
						if (img.width > 700 || img.height > 424) {
							if (img.width / img.height > 700 / 424) {
								img.height = 700 * img.height / img.width;
								img.width = 700;
							} else {
								img.width = img.width / img.height * 424;
								img.height = 424;
							}
						}
						paperH.image(that.options.imageBg, 0, 0, img.width, img.height);
						clearInterval(set);
					}
				};
				var set = setInterval(check, 40);
				//paperH.image(self.imageBg, 0, 0, 700, 425);
			}
		});
		$(".draw_tools ul li").click(function() {
			if ($(this).attr('data-value')) {
				strokeColor = $(this).attr('data-value');
			}
		});

	},
	//获取标记目标模版
	markTargettemplate: function() {
		var that = this,
			$dom;
		if (that.options.template) {
			$dom = $(that.options.template({}));
			$(that.options.toolContain).html($dom);
			that.toolsBIndEvents();
			$(".video_content .filename").text(that.options.fileName);

		} else {
			jQuery.get(that.options.templateUrl, function(tem, options) {
				that.options.template = Handlebars.compile(tem);
				$dom = $(that.options.template({}));
				$(that.options.toolContain).html($dom);
				that.toolsBIndEvents();
				$(".video_content .filename").text(that.options.fileName);

			});
		}
	},
	//设置已有值
	sendData: function(path, id, shoottime, fileType, pvdSourceId) {
		//将时间戳转化为年月日
		shoottime = shoottime -0;
		var d= new Date(shoottime);
		shoottime = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()+" "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
		$("#appearTime").val(shoottime);
		// 从视图库保存到云空间sourceId 为“”
		$("#sourceId").val("");
		//添加一个pvdSourceId 用来说明该视图已经在视图库中
		$("#pvdSourceId").val(pvdSourceId);
		$("#sourceType").val(fileType);
	},

	//格式化数据
	modifyData: function(data, prefix, suffix, name, value) {
		var len = data.length;
		var str = prefix || "{",
			item = '';
		for (var i = 0; i < len; i++) {
			item = data[i];
			str = str + '"' + item.name + '":"' + item.value + '",';
		}
		if (name !== undefined && value !== undefined) {
			str = str + '"' + name + '":"' + value + '",';
		}
		str = str.substr(0, str.length - 1);
		str = str + (suffix || "}");
		return str;
	},

	//入库
	jumpMedialib: function(json, savePicJson) {
		// 需要全局变量记录跳转到对应页面 json, savePicJson
		var that = this;
		var picture = that.options.path;
		that.options.labelshoottime = that.options.shoottime;
		var beginTime=null,endTime=null;
		if(that.options.fileType==="1"){
			picture = that.options.imageBg;
			var timearr = jQuery('#timeBegin').val().split(':');
			var timearr1 = jQuery('#timeEnd').val().split(':');
			beginTime= parseInt(timearr[0])*60*60*1000 + parseInt(timearr[1])*60*1000 +parseInt(timearr[2])*1000;
			endTime = parseInt(timearr1[0])*60*60*1000 + parseInt(timearr1[1])*60*1000 +parseInt(timearr1[2])*1000;
			var millisecond = that.options.shoottime+beginTime;
			var d= new Date(millisecond);
			that.options.labelshoottime = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()+" "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()
		}else{
			var millisecond=that.options.shoottime;
		}
		window.gMessJson = {
			"mediaPath": that.options.path, //视图路径
			"shootTime": that.options.shoottime, //绝对拍摄时间
			"timeBegin":beginTime,//标注开始时间
			"timeEnd":endTime,//标注结束时间
			"appearTime": millisecond, //绝对标注时间
			"imageJson": savePicJson, //标志图片json
			"fileType": that.options.fileType, //文件类型
			"fileName": that.options.fileName, // 文件名称
			"base64Pic":that.options.base64Pic, //base64位流截图
			"medialibId": that.options.id, //视图库国标id
			"incidentId":that.options.incidentId, //案事件id
			"sourceId":that.options.sourceId, //视图库id
			"incidentname":that.options.incidentname, //案事件名称
			"json": json //当前结构化信息
		};
		window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/caselib/create_" + window.typeData + "_bak/3","createToLib");
	},
	//保存到云端
	saveTocloud: function(json, savePicJson) {
		var that = this;
		var posturl = "/service/pia/save_structured_info?_=" + (new Date()).getTime();
		$.ajax({
			url: posturl,
			type: "post",
			data: {
				"lable": json,
				"points": savePicJson
			},
			dataType: "json",
			success: function(res) {
				if (res.code === 200) {
					notify.success("已保存到云端！");
					//添加日志
					var type = (parseInt(that.options.fileType,10) === 2 ? '图片' : '视频'),
						name = that.options.fileName;
						structuredType = jQuery("#structuredType").val();
					logDict.insertMedialog('m4', name + type + '生成'+structuredType+'结构化信息至云空间');
					//添加弹窗 点击跳转到云端的地址
					var confirmYun = new ConfirmDialog({
						title: '保存到云端地址',
						message: "<div class='dialogContent'><div class='icon'></div><i class='icon1'></i><div class='detail'><span class='opera'>已完成保存到云端操作！</span><br/><span class='detail_word'><a href='/cloudmanagement/index/0?type=3&id="+res.data.id+"' target='_blank'>点此处查看详情</a></span></div><div class='dialog_btn'><input type='button' class='close btn btn_ok input-submit' value='关闭窗口'></div></div>",
						callback: function() {
							//window.close();
						},
						prehide: jQuery.noop
					});
					$(".common-dialog .close").on("click", function() {
						//window.close();
						confirmYun.hide();
					});
				} else {
					notify.error("保存失败！");
				}
			}
		});
	},
	//判断浏览器版本
	checkWebBrowser: function(browser) {
		if (navigator.userAgent.indexOf(browser) > 0) {
			return true;
		} else {
			return false;
		}
	},
	//保存入库
	bindEvents: function() {
		var that = this;
		if(that.checkWebBrowser("MSIE 8.0")){
			$("#remark").on('propertychange', function() {
				if(this.value.length>200) notify.warn("请输入小于200个字符");
				//this.value=this.value.substr(0,200);
			});
		}else{
			$("#remark").on('input', function() {
				if(this.value.length>200) notify.warn("请输入小于200个字符");
				//this.value=this.value.substr(0,200);
			});
		}
		$(".video_edit .edit_class[data-flag='tool_show']").on('click', function() {
			$(".video_edit dd span[data-flag='tool_hideen']").hide(1);
			$(".video_edit dd span[data-flag='tool_show']").show(1);
		});
		$(".video_edit .edit_class[data-flag='tool_hideen']").on('click', function() {
			$(".video_edit .video-block .panel span").show();
		});

		//保存结构化信息
		$("#save_cloud").on("click", function(e) {
			var isTzPic = $(".video_edit dd span[data-flag='tool_hideen']").is(":hidden") && !$(".video_edit dd span[data-flag='tool_show']").is(":hidden");
			e.preventDefault();
			if (($("#timeBegin").val().trim() === "") || ($("#timeEnd").val().trim() === "") || ($("#structuredType").val().trim() === "")) {
				notify.warn("信息未填写完整！");
				return;
			}
			var $dom = $("#mark_form"),
				data = $dom.serializeArray(),
				rafData = savePicJson(),

				json = that.modifyData(data, '{', '}');
			if (savePicJson() === "[]") {
				notify.warn("请标注结构化信息！");
				return;
			}
			if($("#remark").val().length>200) {notify.error("请输入小于200个字符");return;}
			//视图库保存到云管理 sourceId 为“”
			that.saveTocloud(json, rafData);
		});

		$("#structuredType").on("change", function() {
			$(this).attr("data-type", $(this).find("option[value=" + $(this).val() + "]").attr("data-type"));
		});
		//结构化信息入库
		$("#jump_medialib").on("click", function(e) {
			e.preventDefault();
			if (($("#structuredType").val().trim() === "")) {
				notify.warn("信息未填写完整！");
				return;
			}

			if (savePicJson() === "[]") {
				notify.warn("请标注结构化信息！");
				return;
			}
			//获取当前结构化信息类型:人、车、物、场景、运动目标
			window.typeData = $("#structuredType").attr("data-type");
			var rafData = savePicJson();//获取标注json
			//console.log(rafData)
			//获取序列化表单信息
			var $dom = $("#mark_form"),
				data = $dom.serializeArray(),
				json = that.modifyData(data, '{', '}', "structId", that.options.id);
			if($("#remark").val().length>200) {notify.error("请输入小于200个字符");return;}
			//添加日志
			var type = (parseInt(that.options.fileType,10) === 2 ? '图片' : '视频'),
				name = that.options.fileName;
			logDict.insertMedialog('m4', name + type +'完成人工标注');
				//入库类调用
			that.jumpMedialib(json, savePicJson());
		});
	}

});

// 高亮二级菜单
jQuery('.nav.atached  a.item:eq(1)').addClass("active").siblings().removeClass("active");
