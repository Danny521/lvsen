/**
** 计划巡航全局变量声明以及函数声明
** @author:Leon.z
** @Date:2016.2.3
**/
define(['../js/model/inspectModel.js', "/module/common/popLayer/js/popImg.js",'jquery.pagination','base.self'], function(inspectModel,POPIMG) {
	return {

		cameraData : null,
		currentPage:1,
		templateUrl: "/module/settings/inspectPlanSet/inc/inspectTemp.html",
		inspectPresetsCache:[],
		inspectSelect:{},
		selectedNums:0,
		oldTaskName:null,
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
		 * [setPagination 分页封装方法]
		 * @param {[type]}   total        [总条数]
		 * @param {[type]}   selector     [dom]
		 * @param {[type]}   itemsPerPage [每页几条]
		 * @param {[type]}   currpage     [当前页码]
		 * @param {Function} callback     [回调]
		 */
		setPagination: function(total, selector, itemsPerPage,currpage,callback) {
			jQuery(selector).pagination(total, {
				orhide: true,
				prev_show_always: false,
				next_show_always: false,
				items_per_page: itemsPerPage,
				first_loading: false,
				current_page:currpage,
				callback: function(pageIndex, jq) {
					callback(pageIndex + 1);
				}
			});
		},
		/**
		 * [sliceFaceImg 取得图片路径]
		 * @param  {[type]} imgPath [description]
		 * @return {[type]}         [description]
		 */
		sliceFaceImg: function(imgPath) {
			if (imgPath.indexOf("/img/") > -1) {
				var strArr = imgPath.substr(imgPath.indexOf("/defence_img"), imgPath.length);
			} else {
				return imgPath;
			}

			return strArr;
		},
		/**新增对接李瑞霞查看图片接口,使用统一查看大图接口**/
		histNewimplent: function(params, callback) {
			var self = this,
				imgTime = parseInt(params.imgTime),
				faceImg = self.sliceFaceImg(params.faceImg),
				index = params.index || 0,
				imgName = params.imgName;
			inspectModel.ajaxEvents.getBase64Url({
				filePath: faceImg
			}, function(res) {
				if (res.code === 200) {
					var base64 = res.data;
					var imgData = {
		                baseInfo: {
		                    filePath: "/img" + faceImg,// 图片路径
		                    storageTime: imgTime, // 创建时间
		                },
		                operatorOptions: {
		                	downloadUrl: "/service/storage/download?filePath=" + faceImg + "&isBucket=false", // 下载地址
		                	saveToCloudbox: { // 保存到云空间
		                		fileName: imgName,
								filePath: base64.replace(/\r|\n/g, ""),
								catchTime: imgTime
		                    }
		                },
		                callback: callback
		            };
		            popImg.initial(imgData);
				} else if (res.code === 500) {
					notify.error("获取图片信息失败！")
					return;

				}
			}, function(error) {
				notify.error("获取图片信息失败！")
				return;
			});

		}




		
	}



});