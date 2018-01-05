/**
 * 通用助手模块
 */
define([
		'js/global-varibale',
		'base.self'
	],
	function(_g) {
		var _cameraRegister = {
				cameraHelper: function() {
					Handlebars.registerHelper('isNew', function(obj) {
						if (Object.prototype.toString.call(obj) === "[object Boolean]") {
							return "新增";
						}
						if (Object.prototype.toString.call(obj) === "[object Object]") {
							return "编辑";
						}
						return "新增";
					});
					Handlebars.registerHelper('getCameraName', function(obj, options) {
						if (Object.prototype.toString.call(obj) === "[object Boolean]") {
							return "";
						}
						if (Object.prototype.toString.call(obj) === "[object Object]" && obj.deviceName) {
							return "“" + obj.deviceName + "”";
						}
						return "新增";
					});
					Handlebars.registerHelper('isActiveRadio', function(obj, options) {
						if (Object.prototype.toString.call(obj) === "[object Boolean]") {
							return options.fn(this);
						}
						if (Object.prototype.toString.call(obj) === "[object Object]" && obj.isControl && obj.isControl === 1) {
							return options.fn(this);
						} else {
							return options.inverse(this);
						}
					});
					Handlebars.registerHelper('isHidden', function(obj) {
						if (Object.prototype.toString.call(obj) === "[object Boolean]") {
							return "hidden";
						}
						if (Object.prototype.toString.call(obj) === "[object Object]") {
							return "";
						}
						return "hidden";
					});
					Handlebars.registerHelper('isHidden1', function(obj) {
						if (Object.prototype.toString.call(obj) === "[object Boolean]") {
							return "";
						}
						if (Object.prototype.toString.call(obj) === "[object Object]") {
							return "hidden";
						}
						return "";
					});

					Handlebars.registerHelper('isHiddenEdit', function(obj) {
						if (obj === "0" || obj === 0) {
							return "hidden";
						}
						return "";
					});
					Handlebars.registerHelper('cameraType', function(type) {
						if (type === 0 || type === "0") {
							return "枪机";
						}
						if (type === 1 || type === "1") {
							return "球机";
						}
						return "枪机";
					});
					Handlebars.registerHelper('isControll', function(isctr, options) {
						if (isctr === 0 || isctr === "0") {
							return "否";
						}
						if (isctr === 1 || isctr === "1") {
							return "是";
						}
						return "是";
					});
					Handlebars.registerHelper('islogout', function(logout) {
						if (logout === 0 || logout === "0") {
							return "logoutGrey";
						}
						if (logout === 1 || logout === "1") {
							return "";
						}
						return "";
					});
					Handlebars.registerHelper('isLogoutCamera', function(logout) {
						if (logout === 0 || logout === "0") {
							return "disabled";
						}
						if (logout === 1 || logout === "1") {
							return "";
						}
						return "";
					});
					Handlebars.registerHelper('camerastatus', function(logout, options) {
						if (logout === 0 || logout === "0") {
							return "注销";
						}
						if (logout === 1 || logout === "1") {
							return "正常";
						}
						return "--";
					});
					Handlebars.registerHelper('showDeviceType', function(type, devices,isEdit,options) {
						var currVal = "--";
						_g.cameraPubTypeList.staticPub[type].forEach(function(item) {
							if (item.code === devices || item.code === devices + "") {
								currVal = item.value;
							}
						});
						if(currVal==="--" && isEdit && isEdit==="edit"){
							switch(type){
								case "deviceType":
									currVal = "请选择设备类型";
									break;
								case "deviceClassify":
									currVal = "请选择设备分类";
									break;
								case "deviceManufacturer":
									currVal = "请选择厂家";
									break;
								case "monitorType":
									currVal = "请选择监控类型";
									break;
								case "installPosition":
									currVal = "请选择安装位置";
									break;
								case "devicePurpose":
									currVal = "";
									//currVal = "请选择设备用途";
									break;
								case "policeDept":
									currVal = "请选择警种";
									break;
							}
						}else if(currVal==="--" && isEdit && isEdit==="detail"){
								currVal = "暂无";
						}
						return currVal;
					});

				}

			},
			/**
			 * 监控系统模块助手
			 * @type {{_monitorSystemHelper: _monitorSystemRegister._monitorSystemHelper}}
             */
			_monitorSystemRegister = {
				monitorSystemHelper: function() {
					/**
					 * 是否联网
					 * 0：否
					 * 1：是
					 */
					Handlebars.registerHelper("isInternetHelper", function(value) {
						var data = '';
						switch (value) {
							case "1":
								data = '是';
								break;
							case "0":
								data = '否';
								break;
							default:
								data = '未知';
								break;
						}
						return data;
					});

					/**
					 * 承载网络
					 * 00-公安信息网
					 * 01-图像传输专网
					 * 02-互联网
					 * 03-其他
					 */
					Handlebars.registerHelper("internetTypeHelper", function(value) {
						var data = '';
						switch (value) {
							case "00":
								data = '公安信息网';
								break;
							case "01":
								data = '图像传输专网';
								break;
							case "02":
								data = "互联网";
								break;
							case "03":
								data = "其他";
								break;
							default:
								data = '未知';
								break;
						}
						return data;
					});

					/**
					 * 是否符合国标GB/T 28181
					 * 0：否
					 * 1：是
					 */
					Handlebars.registerHelper("isInternationalHelper", function(value) {
						var data = '';
						switch (value) {
							case "1":
								data = '是';
								break;
							case "0":
								data = '否';
								break;
							default:
								data = '未知';
								break;
						}
						return data;
					});

					/**
					 * 状态转换
					 * 0：注销
					 * 1：正常
					 */
					Handlebars.registerHelper("statusHelper", function(value) {
						var data = '';
						switch (value) {
							case "1":
								data = '正常';
								break;
							case "0":
								data = '注销';
								break;
							case 1:
								data = '正常';
								break;
							case 0:
								data = '注销';
								break;
							default:
								data = '未知';
								break;
						}
						return data;
					});

					/**
					 * 编辑还是新建的弹出框
					 * 0：新建
					 * 1：编辑
					 */
					Handlebars.registerHelper("editOrCreateHelper", function(value) {
						var data = '';
						switch (value) {
							case "1":
								data = '编辑';
								break;
							case "0":
								data = '新建';
								break;
							default:
								data = 'xxx';
								break;
						}
						return data;
					});

					/**
					 * 比较一个值跟另一个值是否相同
					 * 一般用于下拉列表 或者多选的radio判断当前值跟传入的值是否一致 以达到判断是否选中当前下拉列表或radio
					 */
					Handlebars.registerHelper('isCheckedOrSeleceted', function(value, data, options) {

						if ((value + "") === (data + "")) {
							return options.fn(this);
						} else {
							return options.inverse(this);
						}
					});

					/**
					 * 判断参数是否为空
					 * data 要判断的数据项
					 */
					Handlebars.registerHelper('isDataNotNull', function(data,options) {
						if((typeof data !== "undefined") && data !== null && data !== undefined) {
							return options.fn(this);
						 } else {
							return options.inverse(this);
						}
					});
				}
			},
			_pointRegister = {
				pointHelper: function() {


					Handlebars.registerHelper('pointstatus', function(logout, options) {
						if (logout === 1 || logout === "1") {
							return "正常";
						}
						if (logout === 0 || logout === "0") {
							return "注销";
						}
						return "";
					});
					Handlebars.registerHelper('pointRoadDirection', function(RoadDirection) {
						if (RoadDirection === 00 || RoadDirection === "00") {
							return "东西走向";
						}
						if (RoadDirection === 01 || RoadDirection === "01") {
							return "南北走向";
						}
						if (RoadDirection === 02 || RoadDirection === "02") {
							return "东南向西北";
						}
						if (RoadDirection === 03 || RoadDirection === "03") {
							return "东北向西南";
						}
						if (RoadDirection === 04 || RoadDirection === "04") {
							return "交叉口";
						}
						return "";
					});
					Handlebars.registerHelper('pointsiteCheck', function(pointsite) {

						for (var i = 0; i < _g.pointPubTypeList.pointSite.length; i++) {

							// console.log(_g.pointPubTypeList.pointSite[i]);
							if (_g.pointPubTypeList.pointSite[i].code === pointsite) {
								return _g.pointPubTypeList.pointSite[i].value;
							}
						}
					});



					Handlebars.registerHelper('deviceTypeJudge', function(deviceType) {

						for (var i = 0; i < _g.cameraPubTypeList.staticPub.deviceType.length; i++) {

							// console.log(_g.pointPubTypeList.pointSite[i]);
							if (_g.cameraPubTypeList.staticPub.deviceType[i].code === deviceType) {
								return _g.cameraPubTypeList.staticPub.deviceType[i].value;
							}
						}
					});
					Handlebars.registerHelper('deviceTypeImg', function(deviceType) {

						for (var i = 0; i < _g.cameraPubTypeList.staticPub.deviceType.length; i++) {

							// console.log(_g.pointPubTypeList.pointSite[i]);
							if (_g.cameraPubTypeList.staticPub.deviceType[i].code === deviceType) {
								return _g.cameraPubTypeList.staticPub.deviceType[i].value;
							}
						}
					});
					Handlebars.registerHelper('deviceManufacturer', function(deviceManufacturer) {

						for (var i = 0; i < _g.cameraPubTypeList.staticPub.deviceManufacturer.length; i++) {

							// console.log(_g.pointPubTypeList.pointSite[i]);
							if (_g.cameraPubTypeList.staticPub.deviceManufacturer[i].code === deviceManufacturer) {
								return _g.cameraPubTypeList.staticPub.deviceManufacturer[i].value;
							}
						}
					});
					Handlebars.registerHelper('monitorType', function(monitorType) {

						for (var i = 0; i < _g.cameraPubTypeList.staticPub.monitorType.length; i++) {

							// console.log(_g.pointPubTypeList.pointSite[i]);
							if (_g.cameraPubTypeList.staticPub.monitorType[i].code === monitorType) {
								return _g.cameraPubTypeList.staticPub.monitorType[i].value;
							}
						}
					});

				}

			};
		return {
			cameraRegister: _cameraRegister,
			monitorSystemHelper: _monitorSystemRegister,
			pointRegister: _pointRegister
		};
	});