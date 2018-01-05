/**
 *
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-04-24 17:36:50
 * @version $Id$
 */

define(['jquery', 'ajaxModel'], function($, ajaxModel) {
	var licenseNo = /^[\u4e00-\u9fa5]{1}[a-zA-Z]{1}[a-zA-Z_0-9]{4}[a-zA-Z_0-9_\u4e00-\u9fa5]$|^[a-zA-Z]{2}\d{7}$|^[wW][jJ][\u4e00-\u9fa5][0-9]{4}[a-zA-Z_0-9]$|^[wW][jJ][\u4e00-\u9fa5]9[35][a-zA-Z0-9]{3}$|^[vVzZkKhHbBsSlLjJnNgGcCeE][a-dA-Dj-oJ-Or-tR-TvVyY][a-zA-Z0-9]{5}$/;

	return {
		/**
		 * [init 初始化轨迹分析]
		 * @author yuqiu
		 * @date   2015-05-22T14:26:19+0800
		 * @return {[type]}                 [description]
		 */
		init: function() {
			var self = this;
			self.$submit = $('#analysis-button');
			self.$form = $('#analysis-form');
			// 给 input 绑定时间插件
			require(['/libs/jquery/jquery-ui-timepicker-addon.js'], function() {
				self.$form.find('.analysis-start-time,.analysis-end-time').datetimepicker({
					showSecond: true,
					dateFormat: 'yy-mm-dd',
					timeFormat: 'HH:mm:ss',
					timeText: '',
					hourText: '时',
					minuteText: '分',
					secondText: '秒',
					maxDate: new Date(),
					showAnim: ''
				});
			});
			//添加input默认日期
			self.$form.find('.analysis-end-time').val(Toolkit.formatDate(new Date()));
			self.$form.find('.analysis-start-time').val(Toolkit.getCurDate() + ' 00:00:00');

			self.$submit.click(function(event) {
				self.getFormData();
			});

		},
		/**
		 * [getFormData 获取form表单的数据和验证相关数据]
		 * @author yuqiu
		 * @date   2015-05-22T14:27:39+0800
		 * @return {[type]}                 [description]
		 */
		getFormData: function() {
			var self = this;
			var params = {
				licenseno: self.$form.find('.plate-number').val().replace(/(^\s*)|(\s*$)/g, ""),
				starttime: self.$form.find('.analysis-start-time').val(),
				endtime: self.$form.find('.analysis-end-time').val()
			};
			if(!licenseNo.test(params.licenseno)){
				notify.warn('请输入精确的车牌号');
				self.$form.find('.plate-number').focus();
				return self;
			}
			var isTimeValid = (new Date(params.endtime.replace(/-/g, "/")) > new Date(params.starttime.replace(/-/g, "/")));
			if(!isTimeValid){
				notify.warn('起始时间需早于结束时间，请重新输入');
				return self;
			}
			self.openPvd(params);
			return self;
		},
		/**
		 * [openPvd 跳转到PVD的相关页面]
		 * @author yuqiu
		 * @date   2015-05-22T14:28:05+0800
		 * @param  {[type]}                 params [给PVD通信的URL参数]
		 * @return {[type]}                        [description]
		 */
		openPvd: function(params) {
			window.open('/module/iframe/?windowOpen=1&iframeUrl=/module/gate/vim/index.html?module=track&' + $.param(params), 'pvdAnalysis', 'resizable=yes,fullscreen=yes');
		}
	}

});
