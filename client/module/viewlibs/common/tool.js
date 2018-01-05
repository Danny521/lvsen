/*
 *	上传工具类
 *	File(id,name,type,size,origSize,loaded,percent)
 *
 */
var UploadTool = new Class({

	Implements: [Events, Options],

	uploader: null,

	options: {

		btnId: "uploadFile",

		uploadUrl: "/service/pvd/upload_cover_file",

		file_data_name: "file_name",

		multi_selection: false,

		addFile: jQuery.noop,

		max_file_size: '2gb',

		uploadContainerId: null,

		uploadProgress: jQuery.noop,

		fileUploaded: jQuery.noop,

		filters: [{
			title: "Image File",
			extensions: "jpg,gif,png,bmp"
		}]
	},

	initialize: function(options) {
		this.setOptions(options);
		this.uploader = this.createrUploader();
	},
	disableBroswer: function() {
		this.uploader.disableBrowse(true);
	},
	/*
	 *	创建一个uploader对象
	 */
	createrUploader: function() {
		var self = this;
		var opt = self.options;
		var uploader = new plupload.Uploader({
			runtimes: 'html5,html4,silverlight,flash,browserplus',
			browse_button: opt.btnId,
			url: opt.uploadUrl,
			filters: opt.filters,
			file_data_name: opt.file_data_name,
			multi_selection: opt.multi_selection,
			container: opt.uploadContainerId,
			max_file_size: opt.max_file_size,
			flash_swf_url: '/libs/plupload/plupload.flash.swf',
			silverlight_xap_url: '/libs/plupload/plupload.silverlight.xap',

		});

		uploader.init();

		//添加文件 自动上传
		uploader.bind('FilesAdded', function(up, files) {
			plupload.each(files, function(file) {
				opt.addFile(file, up);
			});
			uploader.start();
		});

		uploader.bind('FileUploaded', function(up, file, res) {
			opt.fileUploaded(file, JSON.parse(res.response), up);
		});

		return uploader;
	}

});



/*
 *	饼图
 */
var pie = window.Pie = {
	/*
	 *	设置饼图的一些默认参数
	 */
	options: {
		tooltip: {
			trigger: 'item',
			formatter: "{b} {d}%"
		},
		series: [{
			name: '',
			type: 'pie',
			radius: '80%',
			center: ['50%', '50%'],
			itemStyle: {
				normal: {
					label: {
						show: false
					},
					labelLine: {
						show: false
					}
				}
			},
			data: []
		}]
	},

	/*
	 *	@data:Array	[  {value:310, name:'案事件',color:"#ccc"}, {value:310, name:'结构化信息',color:"#FFF""} ...]
	 */

	show: function(data, containerId) {
		if (containerId) {
			this.pie = echarts.init(document.getElementById(containerId));
		} else {
			this.pie = echarts.init(document.getElementById('pieContainer'));
		}
		this.options.series[0].data = this.rebuilData(data);
		this.pie.setOption(this.options);
	},
	/*
	 *	重构数据
	 */
	rebuilData: function(data) {
		for (var i = data.length - 1; i >= 0; i--) {
			data[i].itemStyle = {
				normal: {
					color: "#6495ED"
				}
			};
			data[i].itemStyle.normal.color = data[i].color;
			delete data[i].color;
		}
		return data;
	}
};



// 自动填充
var AutoComplete = new Class({

	Implements: [Options, Events],

	options: {
		url: '/service/pvd/get_incident_menu',
		checkUrl:'/service/pvd/incident/matching/',
		delay: 200,
		captureLength: 0,
		checkCallback:jQuery.noop,
		selector: 'li',
		enter: false,
		parentSelector: "div",
		count:10,
		directionListenerFlag:false,
		top: 0,
		left: 0
	},

	initialize: function(options) {
		this.setOptions(options);

		this.node = jQuery(this.options.node);
		if (this.node.size() === 0) {
			return;
		}
		this.term = jQuery.trim(this.node.val());
		this.cache = new Hash();
		this.panel = jQuery('<div class="suggest-panel"><ul class="result"></ul></div>').css({
			"top": this.options.top,
			"left": this.options.left,
			"position": "absolute"
		}).addClass(this.options.panelClass);

		this.node.closest(this.options.parentSelector).css("position", "relative").append(this.panel);
		
		var templateStr = '<li data-id="{{ id }}" data-incidentid="{{incidentId}}" data-name="{{ name }}">{{ name }} {{#if associateId}}({{associateId}}){{else}}{{/if}}</li>';
		this.template = Handlebars.compile(templateStr);
			
		this.bindEvents();
	},

	getPanel: function() {
		return this.panel;
	},

	loadData: function(text) {
		if (!text || jQuery.trim(text) === '') {
			return this.getPanel().hide();
		}

		// 查询缓存 如果缓存中有数据直接渲染
		var data = this.cache.get(text);
		if (data !== null) {
			this.assemble(data);
			return ;
		}

		// 开始请求
		var self = this;
		var entity = {
			q: text,
			count:self.options.count
		};

		this.xmlhttp = jQuery.ajax({
			url: this.options.url,
			type:"POST",
			data: entity,
			dataType: 'json',
			cache: true,
			beforeSend: function() {
				if (self.xmlhttp) {
					self.xmlhttp.abort();
				}
				// self.xmlhttp && self.xmlhttp.abort();
			},
			success: function(res, status, xhr) {
				if (res && res.code === 200) {
					var data = res.data.list;
					
					self.cache.set(text, data);

					self.assemble(data);
				}
			}
		});
		
	},

	// 获取菜单元素
	getItems: function() {
		return this.panel.find(this.options.selector);
	},

	// 装配数据
	renderItem: function(list) {
		var self = this;
		var fragment = '';

		Array.from(list).each(function(data) {
			fragment += self.template(data);
		});

		return fragment;
	},

	// 显示查询结果
	assemble: function(data) {
		var box = this.panel.find('ul.result'),
			datal = Array.from(data);

		if (datal.length === 0) {
			box.html('');
			this.hide();
		} else {
			box.html(this.renderItem(datal));
			this.show();
		}
	},

	show: function() {
		if (this.panel.is(':hidden')) {
			this.panel.show();
		}
	},

	hide: function() {
		if (this.panel.is(':visible')) {
			this.panel.hide();
		}
	},

	suggest: function(text) {
		this.term = text || this.term;
		if (this.term) {
			this.node.val(jQuery.trim(this.term));
			this.loadData(this.term);
		}
	},

	changeListener: function(opt) {

		var self = this,
			timer = null,
			node = this.node,
			panel = this.panel;

		// 检查是否需要触发回调
		var checkChange = function(override) {
			var text = jQuery.trim(node.val());

			if (text.length >= self.options.captureLength && (override || text !== self.term)) {
				self.term = text;
				self.loadData(text);
			}
		};

		// 敲击事件和失焦事件
		node.keyup(function(e) {
			// 特殊键过滤
			node.attr('data-id', 'notexist');
			/*if(node.attr("data-id") !== "notexist"){
				node.attr('data-id', 'notexist');
			}*/
			if (panel.is(':visible')) {
				if (e.keyCode === 13 && self.options.enter) {
					var name = jQuery.trim(node.val());

					self.getItems().each(function(index, domEle) {
						var value = jQuery(domEle).attr('data-name');
						if (name === value) {
							jQuery(domEle).addClass('active');
						}
					});

					var item = self.getItems().filter('.active');
					if (item.size() > 0 && !item.is('.invalid')) {
						self.hide();
						node.val(item.attr('data-name'));
						node.attr('data-name', item.attr('data-name'));
						node.attr('data-udid', item.attr('data-udid'));

						self.term = '';
						return ;
					}
				}
				if (e.keyCode === 40 || e.keyCode === 38) {
					return;
				}
			}

			// 检查是否加载建议信息
			clearTimeout(timer);
			timer = setTimeout(checkChange, self.options.delay);

			//setTimeout(function(){self.checkExists(node)}, self.options.delay);

		});
	},
	checkExists:function (node) {
		var self = this;
		if(self.checkReq){
			self.checkReq.abort();
		}
		self.checkReq = jQuery.ajax({
			url:self.options.checkUrl + jQuery.trim(node.val()),
			type:"get",
			dataType:"json",
			success:function(res){
				if(res.code === 200){
					if(res.data.incident !==""){
						var data = res.data.incident;
						node.attr("data-id",data.id);
						node.attr("data-incidentid",data.incidentId);
						self.options.checkCallback(data);
					}
				}else{
					notify.warn("服务异常");
				}
			}
		});
	},

	directionListener: function() {
		// 禁止方向键
		if(!this.options.directionListenerFlag){
			return;
		}
		var self = this,
			node = this.node,
			panel = this.panel;

		node.bind('keydown', function(e) {
			var code = e.keyCode;

			if ((code === 40 || code === 38)) {
				if (panel.is(':visible')) {
					var list = self.getItems();

					if (list.length === 0) {
						return;
					}

					var item = null,
						lastItem = list.filter('.active').removeClass('active'),
						lastIndex = list.index(lastItem);

					if (code === 40) {
						var index = lastIndex + 1;
						if (index >= list.length) {
							node.val(self.term);
						} else {
							item = list.eq(index);
						}
					} else if (code === 38) {
						var index1 = lastIndex - 1;
						if (index1 === -1) {
							node.val(self.term);
						} else {
							if (index1 === -2) {
								index1 = list.length - 1;
							} else {
								item = list.eq(index1);
							}
						}
					}

					// 如果是上下选择
					if (item) {
						item.addClass('active');
						node.val(item.attr('data-name'));
					}
				} else if (self.panel.find(self.options.selector).size() > 0) {
					self.show();
				}

				// 这句是因为Chrome下面会移动光标到文本开头
				e.preventDefault();
			}
		});
	},

	bindEvents: function() {

		// HOVER激活状态
		var self = this,
			node = this.node,
			panel = this.panel,
			timer = timer;

		panel.on('mouseenter', this.options.selector, function() {
			jQuery(this).addClass('active').siblings().removeClass('active');
		});
		panel.on('mouseleave', this.options.selector, function() {
			jQuery(this).removeClass('active');
		});
		panel.on('click', this.options.selector, function(e) {
			var item = jQuery(this);
			if (item.is('.invalid')) {
				node.focus();
				return false;
			}

			item.addClass('active').siblings().removeClass('active');

			node.val(item.attr('data-name'));
			node.attr('data-name', item.attr('data-name'));
			node.attr('data-id', item.attr('data-id'));
			node.focus();

			self.hide();
			self.term = '';
			
			return false;
		});

		var hidePanel = this.hide.bind(this);

		panel.on('mouseenter', function() {
			node.unbind('blur', hidePanel);
		});
		panel.on('mouseleave', function() {
			node.bind('blur', hidePanel);
		});

		node.bind('click', Toolkit.cancelBubble);
		jQuery(document).bind('click', hidePanel);

		// 监听文本改变
		this.changeListener();

		// 监听上下选择
		this.directionListener();
	}
});



/*
 *	案事件关联弹窗
 */
var AssociateIncidentPanel = new new Class({
	Implements: [Events, Options],
	options: {
		selector:"#chooseIncident"
	},
	initialize:function(){
		var self = this;
		self.flag = 1;
		jQuery.get("/module/viewlibs/common/dialog.html",function(data){
			self.template = Handlebars.compile(data);
		});
	},

	
	show: function(opt) {
		this.setOptions(opt);
		var self = this;
		if(jQuery(self.options.selector).length === 0){
			return;
		}
		// 显示弹窗
		new ConfirmDialog({
			title: '关联案事件',
			confirmText: '确定',
			message: self.template({"chooseIncidentTemplate":{}}),
			callback: function() {
				var btn = jQuery(self.options.selector);
				// resourceId:所属视图的id	type:所属视图的类型[1 视频	2 图片]
				var param = {
						"resourceId":btn.attr("data-mediaid"),
						"type":btn.attr("data-type")
					};

				if(self.flag === 1){
					var resType = self.getResourceTypeName(Toolkit.paramOfUrl().origntype);
					window.location.href = "/module/viewlibs/caselib/create_incident/3-5?id="+param.resourceId+"&type="+param.type +"&res"+resType;
				}else if(self.flag === 2){
					param.incidentId = jQuery("input#associate").attr("data-id");
					if(param.incidentId !== "notexist"){
						self.sendAssociateRequest(btn,param);
					}else{
						notify.info("该案事件无效");
						return false;
					}
				}
			}
		});

		self.bindEvents();
		
	},
	bindEvents:function() {
		var self = this;
		// 输入框的启用 禁用
		jQuery(".associate-panel input:radio").change(function(event) {
			if(jQuery(this).attr("data-id") === "2"){
				jQuery("#associate").prop("disabled",false);
				self.flag = 2;
			}else{
				jQuery("#associate").prop("disabled",true);
				self.flag = 1;
			}
			
		});

		new AutoComplete({
				node: '#associate',
				hasSelect: true,
				hasEnter: true,
				left: "0px",
				top: "52px",
				panelClass: "suggest-panel"
			});
		
	},
	// 根据类型id or English name获取类型名称
	getResourceTypeName:function(type){
		var name = "";
		switch(type) {
			case 1:
			case "1":
			case "person":
				name = "人员";
				break;
			case 2:	
			case "2":
			case "car":
				name = "车辆";
				break;
			case 3:	
			case "3":
			case "exhibit":
				name = "物品";
				break;
			case 4:	
			case "4":
			case "scene":
				name = "场景";
				break;
		}

		return name;
	},
	/*
	 *	关联已有案事件
	 * @param{el} 关联按钮 
	 * @param{param} 请求参数
	 */
	sendAssociateRequest:function(el,param) {
		var self = this;
		jQuery.ajax({
			url: '/service/pvd/incident/binding',
			type: 'post',
			data:param,
			dataType: 'json',
			success: function(res) {
				if (res.code === 200) {
					notify.success("关联案事件成功");

					var msg = self.getResourceTypeName(el.attr("data-rtype")) +"线索关联"+ jQuery.trim(jQuery("#associate").val())+"案事件";
					logDict.insertMedialog('m4',msg);

					el.remove();
					setTimeout(function(){
						window.location.href = window.location.href+"&incidentname="+jQuery.trim(jQuery("#associate").val());
					},2000);
					
				} else {
					notify.warn("关联案事件失败");
				}
			}
		});
	}

});


// 设置重大案事件
var ChoosePanel =  new Class({
		Implements: [Events, Options],
		options: {
			url:"/service/pvd/incident/categories",
			callback:jQuery.noop
		},
		initialize:function(){
			var self = this;
			jQuery.get("/module/viewlibs/caselib/inc/tpl_importIncidentPanel.html",function (data) {
				self.template = Handlebars.compile(data);
				self.createDialog(self.template({"choosePanel":{"category":self.getItems()}}));
			});
		},
		createDialog:function(html) {
			var self = this;
			this.dialog = new ConfirmDialog({
					width: "625px",
					top: "85px",
					visible:true,
					title: '设置重大案事件类别',
					classes:"importent-incident-panel",
					confirmText: '确定',
					message: html,
					callback: function() {
						var outData = self.getOutPutData();
						if(jQuery.trim(outData) === ""){
							outData = "-1";
						}
						jQuery.ajax({
							url:self.options.url,
							type:"post",
							data:{"code":outData},
							dataType:"json",
							success:function(res){
								if(res.code === 200){
									notify.success("设置重大案事件类别成功");
								}else{
									notify.warn("设置重大案事件类别失败");
								}
							},error:function() {
								notify.warn("网络异常，请稍后再试")
							}
						});
						
					}
				});

			this.bindEvents();
		},
		getItems:function (argument) {
			return [
						{categoryCode:"01",type:"offense",categoryName:"刑事犯罪案件"},
						{categoryCode:"02",type:"traffic",categoryName:"出入境案事件"},
						{categoryCode:"03",type:"disaster",categoryName:"船舶（民）管理事件、案件"},
						{categoryCode:"04",type:"security",categoryName:"报警信息"},
						{categoryCode:"05",type:"mass",categoryName:"违反治安管理行为"},
						{categoryCode:"06",type:"immigration",categoryName:"群体性事件"},
						{categoryCode:"07",type:"alarm",categoryName:"治安灾害事故"},
						{categoryCode:"08",type:"events",categoryName:"道路交通事故"},
						{categoryCode:"09",type:"terror",categoryName:"涉恐事件"},
						{categoryCode:"10",type:"ship",categoryName:"重大事件预警"},
						{categoryCode:"11",type:"else",categoryName:"其他"}
					];
		},
		updateCountNum:function(){
			var count = jQuery(".importent-incident-panel .choose-list-right li").length;
				jQuery(".importent-incident-panel .choose-list-right .count").text(count);
			this.updateScrollBar();
		},
		updateScrollBar:function(){
			jQuery("#cpscrollbar2").tinyscrollbar_update('relative');
		},
		/*
		 *	获取之前的配置数据
		 */
		getConf:function(){
			var self = this;
			jQuery.ajax({
				url:self.options.url,
				type:"get",
				dataType:"json",
				success:function(res){
					if(res.code === 200){
						if(res.data.length>0){
							self.selectCategory(res.data);
						}
					}else{
						notify.warn("获取重大案事件类别失败");
					}
				}
			});
		},
		//	回显之前的数据
		selectCategory:function(data){
			for (var i = data.length - 1; i >= 0; i--) {
				var el = jQuery(".importent-incident-panel .choose-list-left li[data-code="+data[i].categoryCode+"]");
				el.addClass("selected");
				var el = jQuery(".importent-incident-panel .choose-list-right ul").append(el.clone());
			}
			this.updateCountNum();
		},
		bindEvents:function(){
			var self = this;
			// 添加滚动条
			jQuery("#cpscrollbar1").tinyscrollbar({thumbSize :80});
			jQuery("#cpscrollbar2").tinyscrollbar({thumbSize :80});

			// 回显之前设置过的数据
			self.getConf();

			// 左侧勾选
			jQuery(document).off("click",".importent-incident-panel .choose-list-left li i");
			jQuery(document).on("click",".importent-incident-panel .choose-list-left li i",function(){
				var el = jQuery(this).closest("li").toggleClass("selected");
				var code = el.attr("data-code");
				if(el.hasClass("selected")){
					jQuery(".importent-incident-panel .choose-list-right ul").append(el.clone());
				}else{
					jQuery(".importent-incident-panel .choose-list-right li[data-code="+code+"]").remove();
				}
				self.updateCountNum();
			});

			// 右侧删除
			jQuery(document).off("click",".importent-incident-panel .choose-list-right li i");
			jQuery(document).on("click",".importent-incident-panel .choose-list-right li i",function(){
				var el = jQuery(this).closest("li");
				jQuery(".importent-incident-panel .choose-list-left li[data-code="+el.attr("data-code")+"]").removeClass("selected");
				el.remove();
				self.updateCountNum();
			});

		},
		getOutPutData:function(){
			var data = [];
			jQuery(".importent-incident-panel .choose-list-right li").each(function(index,item){
				var el = jQuery(item);
				data.push(el.attr("data-code"));
			});
			return data.join(",");
		}

	});


(function(){
	jQuery(function(){
		var workbenchActive = '{"viewlibs":"workbench"}';
		//本地导入
		jQuery('#sidebar').on('click','#importResource',function(){
			//localStorage.setItem("activeMenu",workbenchActive);
			//window.location.href = '/viewlibs/caselib/local_import/';
			panelImport.open();

		});

		//创建案事件
		jQuery('#sidebar').on("click", ".create-incident", function() {
			localStorage.setItem("activeMenu",workbenchActive);
			window.location.href = '/module/viewlibs/caselib/create_incident/';
		});
	})

})();




		




