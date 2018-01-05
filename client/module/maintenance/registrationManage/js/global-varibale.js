/**
 * Created by Leon.z on 2016/03/18.
 */
define([
	"base.self",
	'jquery.pagination',
	"plupload"
], function() {
	/**
	 * [_setBatchUplaodPanel 批量导入公用函数]
	 * @type {Object}
	 */
	var _setBatchUplaodPanel = {
		options:{
			browse_button: "bulkImport",
		},
		"uploading":false,
		"callback": jQuery.noop, //点击上传回调函数
		"ExcelTemplateUrl": "", //下载模板路径
		"url":"",
		"type":"",
		"defaultH":0, 
		"defaultTop":0,
		BatchUplaod: function(upobj) {
			var self = this;
			jQuery(".import-model .excel-name").val("");
			if(self.upload){
				self.upload.destroy();
				self.upload = null;	
			}
			//隐藏导航
            window.top.showHideNav("hide");
			if (!upobj) {
				return;
			}
			self.callback = upobj.callback;
			self.ExcelTemplateUrl = upobj.ExcelTemp;
			self.type =  upobj.type;
			self.url = upobj.url;
			if(upobj.type==="point"){
				jQuery(".import-model").find(".input-number").hide();
				jQuery(".import-model").find(".step").text("二");
			}
			if(upobj.type==="camera"){
				jQuery(".import-model").find(".input-number").show();
				jQuery(".import-model").find(".step").text("三");
			}
			jQuery(".commonLayer").fadeIn(200, function() {
				jQuery(".import-model").show().attr("data-upType", upobj.type);
				self.initUpload();
				self._bindUpEvt();
				self.bindSelfEvt(jQuery(".import-model"));
				self.defaultH = jQuery(window).height();
			});
			
		},
		initUpload: function() {
			var self = this;
			// 上传控件
			self.upload = new plupload.Uploader({
				"runtimes": "flash,html5,html4",
				"browse_button":"chooseLocalFile",
				"multi_selection": false,
				"url":self.url +"?_="+(new Date()).getTime(),
				"file_data_name": "file",
				"filters": [{
					title: "Excel choseSingle",
					//只能选择excel相关文件
					extensions:"xls,xlsx"
				}],
				"multipart_params":"",
				"max_file_size": "9gb",
				"flash_swf_url": "/libs/plupload/plupload.flash.swf",
				"silverlight_xap_url": "/libs/plupload/plupload.silverlight.xap"
			});
			self.upload.init();

		},
		_bindUpEvt:function(){
			var self = this;
			// 监听是否正在上传
			self.upload.bind('UploadComplete', function(up, files) {
				self.uploading = false;
			});
			// 文件添加后 渲染文件到上传列表
			self.upload.bind('FilesAdded', function(up, files) {
				jQuery(".import-model .excel-name").val(files[0].name);
				jQuery(".import-cancel").find(".button.blue").removeClass("disabled");
				up.settings.multipart_params = {
					"countyNumber": jQuery(".orginCode").val()
				};
			});
			// 处理文件上传进度
			self.upload.bind('UploadProgress', function(up, file) {
				self.uploading = true;
				jQuery(".import-model").hide();
				jQuery(".uploading").show();
				jQuery(".uploadError").hide();
				jQuery(".uploadSuccess").hide();
				if(self.isFileUploaded){
					jQuery(".import-model").hide();
					jQuery(".uploadSuccess").show();
					jQuery(".uploading").hide();
					jQuery(".uploadError").hide();
				}
			});
			//上传完成
			self.upload.bind('FileUploaded', function(up, file, res) {
				
				if(res &&　JSON.parse(res.response).code===500){
					notify.error(JSON.parse(res.response).data.message);
					jQuery(".import-model").hide();
					jQuery(".uploading").hide();
					jQuery(".uploadError").show();
					jQuery(".uploadSuccess").hide();
					self.bindSelfEvt(jQuery(".uploadError"));
					return;
				}
				self.isFileUploaded = true;
				jQuery(".import-model").hide();
				jQuery(".uploadSuccess").show();
				jQuery(".uploading").hide();
				jQuery(".uploadError").hide();
				setTimeout(function(){
					jQuery(".uploadSuccess").hide();
					jQuery(".commonLayer").fadeOut(200);
					//隐藏导航
            		window.top.showHideNav("show");
					self.callback && self.callback(file,res);
					self.upload.destroy();
					self.upload = null;
				},1000);
			});
			//上传错误
			self.upload.bind('Error', function(up, file) {
				jQuery(".import-model").hide();
				jQuery(".uploadError").show();
				jQuery(".uploadSuccess").hide();
				self.bindSelfEvt(jQuery(".uploadError"));
				self.showUploadError(file.code);
			});
			jQuery(window).resize(function(event) {
				var currHeight = jQuery(window).height();
				if(currHeight<self.defaultH){
					jQuery(".plupload").css("top",self.defaultTop-20+"px");
				}
				if(currHeight>=self.defaultH){
					jQuery(".plupload").css("top",self.defaultTop+"px");
				}
			});
		},
		_checkFormData: function(callback) {
			var self = this,
			    currCodeVal = jQuery(".orginCode").val(),
				currExcelVal = jQuery(".excel-name").val();
			if (self.type === "camera") {
				if (currCodeVal === "") {
					notify.warn("区级编号不能为空！");
					jQuery(".import-cancel").find(".button.blue").addClass("disabled");
					return false;
				} else if (currCodeVal.length < 2) {
					notify.warn("区级编号必须为2位！");
					jQuery(".import-cancel").find(".button.blue").addClass("disabled");
					return false;
				} else if (!/^([0-9]\d*|[0]{1,1})$/.test(currCodeVal)) {
					notify.warn("区级编号必须为数字！");
					jQuery(".import-cancel").find(".button.blue").addClass("disabled");
					return false;
				}
			}
			if (currExcelVal === "") {
				notify.warn("请添加导入模板！");
				jQuery(".import-cancel").find(".button.blue").addClass("disabled");
				return false;
			}
			callback && callback();
		},
		_eventHandler: function() {
			var self = this;
			return {
				CancelImport: function(e) {
					//隐藏导航
           			 window.top.showHideNav("show");
					jQuery(this).closest('.import-model').hide(0, function() {
						jQuery(".commonLayer").fadeOut(200);
					});
				},
				upLoadImport: function() {
					
					if(jQuery(this).hasClass('disabled')){
						return;
					}
					self._checkFormData(function(){
						self.upload.start();
					});
				},
				loadExcelTemp: function() {
					var mouduleName = jQuery(this).closest('.import-model').attr("data-upType");
					jQuery(".loadExcelTemp").attr("src",self.ExcelTemplateUrl).data("type",mouduleName);
					self.defaultTop = jQuery(".plupload").offset().top;
				},
				refresh:function(){
					jQuery(".uploadError").hide();
					jQuery(".import-model .excel-name").val("");
					jQuery(".import-model").show();
					self.upload.destroy();
					self.upload = null;
					self.initUpload();
					self._bindUpEvt();
				},
				resetForm:function(e){
					if(e.type==="focus"){
						jQuery(".import-cancel").find(".button.blue").removeClass("disabled");
					}
				}
			};
		},
		/**
		 * 处理文件上传出错的提示性逻辑
		 * @param code - 错误码
		 */
		showUploadError: function(code) {
			switch (code) {
				case -601:
					notify.warn("系统暂不支持该类型文件的上传，请上传图片或者视频文件");
					break;
				case -600:
					notify.warn("上传的文件大小应保持在9GB以内");
					break;
				default:
					notify.warn("上传出错，请重试");
			}
		},
		bindSelfEvt: function(selector) {
			var self = this,
				handler = self._eventHandler();
			$(selector).find("[data-handler]").map(function() {
				$(this).off("click").on($(this).data("event"), handler[$(this).data("handler")]);
			});
		}
	},
	/**
	 * [_setLogoutPanel 注销公用函数]
	 * @type {Object}
	 */
	_setLogoutPanel = {
		"callback": jQuery.noop, //点击上传回调函数
		"systemName":"",//注销系统名称
		"type":null,
		"id":null,
		setLogout: function(logObj) {
			var self = this;
			jQuery('.logOffDialog').find(".reasonTextArea").val("");
			if (!logObj) {
				return;
			}
			self.callback = logObj.callback;
			self.id = logObj.id;
			self.type = logObj.type;
			if(logObj.type==="camera"){
				self.systemName = "摄像机";
			}else if(logObj.type==="monitorSystem"){
				self.systemName = "监控系统";
			}else if(logObj.type==="point"){
				self.systemName = "点位";
			}
			//隐藏导航
            window.top.showHideNav("hide");
			jQuery(".commonLayer").fadeIn(200, function() {
				jQuery(".logOffDialog").show().attr("data-upType", logObj.type);
				jQuery(".logOffDialog").find(".logoutName").text(self.systemName);
				self.bindSelfEvt(jQuery(".logOffDialog"));
			});
		},
		_eventHandler: function() {
			var self = this;
			return {
				cancleCreate: function(e) {
					//隐藏导航
           			window.top.showHideNav("show");
					jQuery(this).closest('.logOffDialog').hide(0, function() {
						jQuery(".commonLayer").fadeOut(200);
					});
				},
				monitorSystemLogOffComfirm: function() {
					var reason = jQuery(this).closest('.logOffDialog').find(".reasonTextArea").val();
					if(reason===""){
						notify.warn("请填写注销原因！");
						return false;
					}
					//隐藏导航
            		window.top.showHideNav("show");
					self.callback && self.callback(reason,self.id);
				}
			};
		},
		bindSelfEvt: function(selector) {
			var self = this,
				handler = self._eventHandler();
			$(selector).find("[data-handler]").map(function() {
				$(this).off("click").on($(this).data("event"), handler[$(this).data("handler")]);
			});
		}
	};
	return {
		orgTree:null,
		compiler: null,
		cameraCompiler: null, //缓存摄像机模块模板
		defaultCompiler: null,
		currentPage: 1,
		cameraCtr: null, //缓存摄像机模块控制器
		currCameraDeatilData: {}, //缓存当前设备详情信息
		managerUnitName:"",
		cameraPubTypeList: {  //摄像机模块下拉菜单
			"loadPub": {},
			"staticPub": {
				"keyPart": [{code:"",value:"全部"},{code:"managerUnitName",value:"管理单位名称"},{code:"cameraName",value:"摄像机名称"},{code:"deviceId",value:"设备编号"}], //搜索关键字

				"devicePurpose": [{code:"",value:"全部"},{code:"0101",value:"0101涉日敏感部位"},{code:"0102",value:"0102易聚集维权区域"},{code:"0103",value:"0103涉军祭扫重点区域"},{code:"0104",value:"0104党政机关"},{code:"0105",value:"0105重点单位"},{code:"0106",value:"0106高等院校"},{code:"0107",value:"0107地铁站点"},{code:"0108",value:"0108铁路站点"},{code:"0109",value:"0109机场站点"},{code:"0110",value:"0110汽车站"},{code:"0111",value:"0111城市人员密集场所"},{code:"0112",value:"0112庙会场所"},{code:"0113",value:"0113体育场馆"},{code:"0114",value:"0114危险品储存企业"},{code:"0115",value:"0115重点誉印店"},{code:"0116",value:"0116过江通道"},{code:"0117",value:"0117高速公路收费站及重点互通枢纽"},{code:"0118",value:"0118环省环宁公安检查站"},{code:"0119",value:"0119风机名胜区"},{code:"0120",value:"0120涉外旅游饭店"},{code:"0121",value:"0121外资企业"},{code:"0122",value:"0122涉外驻苏机构"},{code:"0123",value:"0123佛教道教场所"},{code:"0124",value:"0124维族人员聚居地"},{code:"0125",value:"0125穆斯林宗教活动场所"},{code:"0126",value:"0126玉石市场"},{code:"0127",value:"0127重点高层建筑"},{code:"0128",value:"0128重点危化品生产企业"},{code:"0201",value:"0201侯问室"},{code:"0202",value:"0202询问室"},{code:"0203",value:"0203讯问室"},{code:"0204",value:"0204约束室"},{code:"0205",value:"0205醒酒室"},{code:"0206",value:"0206辨认室"},{code:"0207",value:"0207人身安全检查室"},{code:"0208",value:"0208物证保管室"},{code:"0209",value:"0209信息采集室"},{code:"0210",value:"0210纠纷调处室"},{code:"0211",value:"0211其他办案场所"},{code:"0212",value:"0212户籍室"},{code:"0213",value:"0213接待室"},{code:"0214",value:"0214等候室"},{code:"0215",value:"0215信访接待室"},{code:"0216",value:"0216出入境服务大厅"},{code:"0217",value:"0217车架管服务大厅"},{code:"0218",value:"0218消防服务大厅"},{code:"0219",value:"0219事故处理大厅"},{code:"0220",value:"0220综合服务大厅"},{code:"0221",value:"0221驾驶员科目考试室"},{code:"0222",value:"0222交通违法处理室"},{code:"0223",value:"0223出入境口岸服务大厅"},{code:"0224",value:"0224其他服务场所"},{code:"0225",value:"0225备勤室"},{code:"0226",value:"0226接处警室"},{code:"0227",value:"0227现场勘验室"},{code:"0228",value:"0228指挥调度大厅"},{code:"0229",value:"0229值班室"},{code:"0230",value:"0230会议室"},{code:"0231",value:"0231出入口"},{code:"0232",value:"0232院内"},{code:"0233",value:"0233走廊"},{code:"0234",value:"0234哨位"},{code:"0235",value:"0235其它办公场所"},{code:"0236",value:"0236警务大厅"},{code:"0237",value:"0237拘留所询问室"},{code:"0238",value:"0238看守所讯问室"},{code:"0239",value:"0239监控室"},{code:"0240",value:"0240AB门区"},{code:"0241",value:"0241内值班室"},{code:"0242",value:"0242巡视走廊"},{code:"0243",value:"0243收押大厅"},{code:"0244",value:"0244收拘大厅"},{code:"0245",value:"0245律师会见室"},{code:"0246",value:"0246其他监管场所"},{code:"0247",value:"0247枪库"},{code:"0248",value:"0248弹药库"},{code:"0249",value:"0249警械装备室"},{code:"0250",value:"0250其他武器保管场所"},{code:"0251",value:"0251治安检查站"},{code:"0252",value:"0252治安卡口"},{code:"0253",value:"0253其他治安检查场所"},{code:"0000",value:"0000其它"}],
				"installPosition": [{code:"",value:"全部"},{code:"0101",value:"涉日敏感部位"},{code:"0102",value:"易聚集维权区域"},{code:"0103",value:"涉军祭扫重点区域"},{code:"0104",value:"党政机关"},{code:"0105",value:"重点单位"},{code:"0106",value:"高等院校"},{code:"0107",value:"地铁站点"},{code:"0108",value:"铁路站点"},{code:"0109",value:"机场站点"},{code:"0110",value:"汽车站"},{code:"0111",value:"城市人员密集场所"},{code:"0112",value:"庙会场所"},{code:"0113",value:"体育场馆"},{code:"0114",value:"危险品储存企业"},{code:"0115",value:"重点誉印店"},{code:"0116",value:"过江通道"},{code:"0117",value:"高速公路收费站及重点互通枢纽"},{code:"0118",value:"环省环宁公安检查站"},{code:"0119",value:"风机名胜区"},{code:"0120",value:"涉外旅游饭店"},{code:"0121",value:"外资企业"},{code:"0122",value:"涉外驻苏机构"},{code:"0123",value:"佛教道教场所"},{code:"0124",value:"维族人员聚居地"},{code:"0125",value:"穆斯林宗教活动场所"},{code:"0126",value:"玉石市场"},{code:"0127",value:"重点高层建筑"},{code:"0128",value:"重点危化品生产企业"},{code:"0201",value:"侯问室"},{code:"0202",value:"询问室"},{code:"0203",value:"讯问室"},{code:"0204",value:"约束室"},{code:"0205",value:"醒酒室"},{code:"0206",value:"辨认室"},{code:"0207",value:"人身安全检查室"},{code:"0208",value:"物证保管室"},{code:"0209",value:"信息采集室"},{code:"0210",value:"纠纷调处室"},{code:"0211",value:"其他办案场所"},{code:"0212",value:"户籍室"},{code:"0213",value:"接待室"},{code:"0214",value:"等候室"},{code:"0215",value:"信访接待室"},{code:"0216",value:"出入境服务大厅"},{code:"0217",value:"车架管服务大厅"},{code:"0218",value:"消防服务大厅"},{code:"0219",value:"事故处理大厅"},{code:"0220",value:"综合服务大厅"},{code:"0221",value:"驾驶员科目考试室"},{code:"0222",value:"交通违法处理室"},{code:"0223",value:"出入境口岸服务大厅"},{code:"0224",value:"其他服务场所"},{code:"0225",value:"备勤室"},{code:"0226",value:"接处警室"},{code:"0227",value:"现场勘验室"},{code:"0228",value:"指挥调度大厅"},{code:"0229",value:"值班室"},{code:"0230",value:"会议室"},{code:"0231",value:"出入口"},{code:"0232",value:"院内"},{code:"0233",value:"走廊"},{code:"0234",value:"哨位"},{code:"0235",value:"其它办公场所"},{code:"0236",value:"警务大厅"},{code:"0237",value:"拘留所询问室"},{code:"0238",value:"看守所讯问室"},{code:"0239",value:"监控室"},{code:"0240",value:"AB门区"},{code:"0241",value:"内值班室"},{code:"0242",value:"巡视走廊"},{code:"0243",value:"收押大厅"},{code:"0244",value:"收拘大厅"},{code:"0245",value:"律师会见室"},{code:"0246",value:"其他监管场所"},{code:"0247",value:"枪库"},{code:"0248",value:"弹药库"},{code:"0249",value:"警械装备室"},{code:"0250",value:"其他武器保管场所"},{code:"0251",value:"治安检查站"},{code:"0252",value:"治安卡口"},{code:"0253",value:"其他治安检查场所"},{code:"0000",value:"其它"}],

				"deviceClassify": [{code:"",value:"全部"},{code:"01",value:"一类视频监控点"},{code:"02",value:"二类视频监控点"},{code:"03",value:"三类视频监控点"}],

				"deviceManufacturer": [{code:"",value:"全部"},{code:"00",value:"海康威视"},{code:"01",value:"大华"},{code:"02",value:"科达"},{code:"03",value:"安讯士"},{code:"04",value:"英飞拓"},{code:"05",value:"派尔高"},{code:"99",value:"其它"}], //设备厂家

				"monitorType": [{code:"",value:"全部"},{code:"00",value:"卡口式监控"},{code:"01",value:"卡口式电子警察"},{code:"02",value:"固定式电子警察"},{code:"03",value:"移动式电子警察"},{code:"04",value:"固定式视频监控"},{code:"05",value:"移动式视频监控"},{code:"99",value:"其它监控设备"}], //监控类型

				"policeDept":[{code:"",value:"全部"},{code:"01",value:"01国保"},{code:"02",value:"02经侦"},{code:"03",value:"03治安"},{code:"04",value:"04边防"},{code:"05",value:"05刑侦"},{code:"06",value:"06出入境"},{code:"07",value:"07消防"},{code:"08",value:"08警卫"},{code:"09",value:"09内保"},{code:"11",value:"11网安"},{code:"12",value:"12技侦"},{code:"13",value:"13监管"},{code:"15",value:"15信访"},{code:"17",value:"17交管"},{code:"18",value:"18法制"},{code:"21",value:"21禁毒"},{code:"22",value:"22科信"},{code:"27",value:"27反恐"},{code:"27",value:"27指挥中心"},{code:"34",value:"34督查"},{code:"50",value:"50社会单位"},{code:"99",value:"99其它"}], //

				"deviceType":[{code:"",value:"全部"},{code:"00",value:"枪机"},{code:"01",value:"球机"},{code:"02",value:"云台"},{code:"03",value:"半球摄像机"},{code:"04",value:"照相机"},{code:"99",value:"其它"}], //设备类型

				"enterPlatformStatus": [{code:"",value:"全部"},{code:"0",value:"未进入平台"},{code:"1",value:"已进入平台"}], //设备进入平台状态
				"status": [{code:"",value:"全部"},{code:"1",value:"正常"},{code:"0",value:"注销"}], //设备状态
				"isControl":[{code:"",value:"全部"},{code:"1",value:"是"},{code:"0",value:"否"}] //是否可控
			}
		},
		pointPubTypeList: { 
			"pointSite":[{code:"00",value:"省际卡口"},{code:"01",value:"市际卡口"},{code:"02",value:"城市出入口查报站"},{code:"03",value:"县城区出入口查报站"},{code:"04",value:"收费站"},{code:"05",value:"国道"},{code:"06",value:"省道"},{code:"07",value:"高速公路"},{code:"08",value:"城市主干道"},{code:"09",value:"城市次干道"},{code:"10",value:"县城主干道"},{code:"11",value:"县城次干道"},{code:"12",value:"县道"},{code:"13",value:"乡镇道路"},{code:"14",value:"汽渡"},{code:"15",value:"停车场"},{code:"16",value:"隧道"},{code:"17",value:"桥梁"},{code:"18",value:"高架路面"},{code:"49",value:"其它道路"},{code:"50",value:"党政机关"},{code:"51",value:"重点目标"},{code:"52",value:"加油站"},{code:"53",value:"楼宇和小区"},{code:"54",value:"中心广场"},{code:"55",value:"车站码头"},{code:"56",value:"体育场馆"},{code:"57",value:"商业中心"},{code:"58",value:"宗教场所"},{code:"59",value:"校园周边"},{code:"60",value:"治安复杂区域"},{code:"61",value:"办案场所"},{code:"62",value:"服务场所"},{code:"63",value:"办公场所"},{code:"64",value:"监管场所"},{code:"65",value:"武器保管场所"},{code:"66",value:"治安检查场所"},{code:"99",value:"其他部位"}
			],
			"roadDirection":[{code:"00",value:"东西走向"},{code:"01",value:"南北走向"},{code:"02",value:"东南向西北"},{code:"03",value:"东北向西南"},{code:"04",value:"交叉口"}]
		},
		/**
		 * 加载模板通用函数
		 * @param url - 模板地址url
		 * @param callbackSuccess - 模板加载成功后的执行函数
		 * @param callbackError - 模板加载失败后的执行函数
		 */
		loadTemplate: function(url, callbackSuccess, callbackError) {
			var compiler = null;
			//加载模板
			jQuery.when(Toolkit.loadTempl(url)).done(function(timeTemplate) {
				if (timeTemplate instanceof Array) {
					timeTemplate = timeTemplate[0];
				}
				//模板加载成功
				compiler = Handlebars.compile(timeTemplate);
				//成功的回调函数
				if (callbackSuccess && typeof callbackSuccess === "function") {
					callbackSuccess(compiler);
				}
			}).fail(function() {
				//错误的函数
				if (callbackError && typeof callbackError === "function") {
					callbackError();
				}
			});
		},
		/**
		 * [setPagination 分页封装方法]
		 * @param {[type]}   total        [总条数]
		 * @param {[type]}   selector     [dom]
		 * @param {[type]}   itemsPerPage [每页几条]
		 * @param {[type]}   currpage     [当前页码]
		 * @param {Function} callback     [回调]
		 */
		setPagination: function(total, selector, itemsPerPage, currpage, callback) {
			jQuery(selector).pagination(total, {
				orhide: true,
				prev_show_always: false,
				next_show_always: false,
				items_per_page: itemsPerPage,
				first_loading: false,
				current_page: currpage,
				callback: function(pageIndex, jq) {
					callback(pageIndex + 1);
				}
			});
		},
		/**
		 * 用户确认框
		 * @param msg-用户确认时提示的信息
		 * @param callback-确认后回调的函数
		 */
		confirmDialog: function(msg, callback, closureCallBack) {
			new ConfirmDialog({
				title: '提示',
				confirmText: '确定',
				message: msg,
				callback: function() {
					if (callback && typeof callback === "function") {
						callback();
					}
				},
				closure: function() {
					if (closureCallBack && typeof closureCallBack === "function") {
						closureCallBack();
					}
				}
			});
		},
		/**
		 * [setBatchUplaodPanel 批量导入模板对象事件]
		 * @type {[type]}
		 */
		setBatchUplaodPanel: _setBatchUplaodPanel,
		/**
		 * [setLgoutPanel 注]
		 * @type {[type]}
		 */
		setLgoutPanel : _setLogoutPanel

	};

});