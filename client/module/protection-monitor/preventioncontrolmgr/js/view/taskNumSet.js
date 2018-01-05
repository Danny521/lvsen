/**
 ** admin用户下任务最大数设置
 ** Date：2016.1.13
 ** Author:Leon.z
 */
define([
	'pubsub',
	'js/preventcontrol-global-var',
	'js/model/preventcontrol-model',
	'js/protectcontrol-common-fun',
	'permission'
], function(PubSub, globalVar, ajaxService, commonFun) {
	var taskNumSet = function() {
		this.req = /^[0-9]*[1-9][0-9]*$/;
		this.clectdata = [];
	}
	taskNumSet.prototype = {
		isDouble:false,
		init: function() {
			var self = this;
			jQuery(".tab-content").hide();
			jQuery("#sidebar").css("width", "50px");
			jQuery("#sideResize").hide();
			jQuery("#major").css("left", "50px");
			jQuery("#saveTaskSet").addClass("disabled").attr("disabled", "disabled");
			jQuery("#major .taskSetPanel").find(".maxSetNum").text(globalVar.taskSetOptions.maxSetNum);
			self.InputChangeListener();
			self.bindEvents();

		},
		/**
		 * [checkSendData 判断是否超过系统设置最大任务数量]
		 * @param  {Boolean} isAll     [description]
		 * @param  {[type]}  currArray [description]
		 * @return {[type]}            [description]
		 */
		checkSendData: function(isAll, currArray) {
			if (isAll) {
				return true;
			} else {
				var ALLMax = currArray[0].maxDefenceTaskNumber;
				var childSum = getArraySum(currArray);

				function getArraySum(Arrays) {
					var sum = 0
					for (var i = 0, le = Arrays.length; i < le; i++) {
						sum = sum + Arrays[i].maxDefenceTaskNumber;
					}
					return sum;
				}
				if (childSum - ALLMax > ALLMax) {
					notify.warn("您所分配的任务数超过系统最大限额" + ALLMax + "个，保存失败！");
					jQuery("#saveTaskSet").addClass("disabled").attr("disabled", "disabled");
					return false;
				}
			}
			return true

		},
		/**
		 * [InputChangeListener 监听组织树是否编辑过]
		 */
		InputChangeListener: function() {
			var self = this;
			jQuery(document).on("change", ".treePanel input", function() {
				var nums = jQuery(this).val();
				if (self.checkNums(nums, true, jQuery(this))) {
					jQuery("#saveTaskSet").removeClass("disabled").removeAttr('disabled');
					self.isDouble = true;
				}
			})
		},
		/**
		 * [checkNums 检测是否输入为正整数]
		 * @param  {[type]} nums [输入数字]
		 * @param  {[type]} flag [是否为设置系统最大树]
		 * @param  {[type]} node [dom]
		 * @return {[type]}      [description]
		 */
		checkNums: function(nums, flag, node) {
			var self = this;
			if (flag && !nums) {
				return node.val(0)
			}
			if (!nums) {
				notify.warn("请输入正整数");
				node.focus();
				return false;
			}
			if (flag) {
				if (nums && !self.req.test(nums)) {
					notify.warn("请输入正整数");
					node.val(0).focus();
				}
			} else {
				if (nums && !self.req.test(nums)) {
					node.val("").focus();
					notify.warn("请输入正整数");
					return false;
				}
			}

			return true;
		},
		/**
		 * [sendTaskSetData 保存设置]
		 * @param  {Boolean} isALL     [description]
		 * @param  {[type]}  clectData [description]
		 * @return {[type]}            [description]
		 */
		sendTaskSetData: function(isALL, clectData) {
			var self = this;
			var sendData = [],
				msg = "",
				isDelete = false;
			var allMax = jQuery("#major .taskSetPanel").find(".maxSetNum").text();
			if (!clectData) {
				return;
			}
			if (isALL && clectData) {
				sendData.push({
					"maxDefenceTaskNumber": parseInt(clectData.maxNum),
					"orgId": parseInt(clectData.orgid)
				});
				sendData = JSON.stringify(sendData);
				msg = "保存最大布防数成功！"
				isDelete = false;
			} else {
				clectData.unshift({
					"maxDefenceTaskNumber": parseInt(allMax),
					"orgId": -1
				});
				sendData = Array.clone(clectData)
				sendData = JSON.stringify(sendData);
				msg = "设置成功！"
				isDelete = true;
			}
			var flags = self.checkSendData(isALL, clectData);
			if (!flags) {
				return;
			}
			ajaxService.ajaxEvents.setTaskNumSet({
				limits: sendData,
				isDelete: isDelete
			}, function(res) {
				if (res.code === 200) {
					notify.success(msg);
					if (isALL) {
						jQuery("#major .taskSetPanel").find(".maxSetInput").hide();
						jQuery("#major .taskSetPanel").find(".maxSetNum").text(clectData.maxNum).show();
						if(!self.isDouble){
							return;
						}
						return jQuery("#saveTaskSet").removeClass("disabled").removeAttr('disabled');
					}
					jQuery("#saveTaskSet").addClass("disabled").attr("disabled", "disabled");
				} else if (res.code === 500) {
					notify.error(res.data ? res.data.message : "设置失败");
					if (isALL) {
						jQuery("#major .taskSetPanel").find(".maxSetInput").show().focus().val("");
						jQuery("#major .taskSetPanel").find(".maxSetNum").hide();
					}
					jQuery("#saveTaskSet").removeClass("disabled").removeAttr('disabled');
					self.isDouble = false;
					return false;
				}

			}, function(error) {
				jQuery("#saveTaskSet").removeClass("disabled").removeAttr('disabled');
				self.isDouble = false;
				notify.error(error ? error.data : "设置失败");
			})
		},
		/**
		 * [installData 组装数据]
		 * @return {[type]} [description]
		 */
		installData: function() {
			var self = this;
			self.clectdata = [];
			jQuery("#orgTreePanel .treePanel").find("li").each(function(index, item) {
				var currnode = jQuery(item),
					orgid = currnode.data("id").slice(4),
					maxNum = currnode.find(".setInput input").val();
				self.clectdata.push({
					"maxDefenceTaskNumber": parseInt(maxNum),
					"orgId": parseInt(orgid)
				});
			});
		},
		bindEvents: function() {
			var self = this;
			jQuery("#major .taskSetPanel").on("click", ".icon-set", function(e) {
				e.stopPropagation();
				self.isDouble = false;
				var max = jQuery("#major .taskSetPanel").find(".maxSetNum").text();
				jQuery(this).parent().find(".maxSetInput").show().val(max);
				jQuery(this).parent().find(".maxSetNum").hide();
			});
			/*jQuery("#major .taskSetPanel").on("blur", ".maxSetInput", function(e) {
				e.stopPropagation();
				var num = globalVar.taskSetOptions.maxSetNum = jQuery(this).val();
				if (self.checkNums(num, false, jQuery(this))) {
					var data = {
						maxNum: num,
						orgid: -1
					};
					self.sendTaskSetData(true, data);
				}
			});*/
			jQuery(document).on("click", function(e) {
				if (e.target.nodeName === "INPUT") {
					return;
				}
				var node = jQuery("#major .taskSetPanel").find(".maxSetInput"),
					num = globalVar.taskSetOptions.maxSetNum = node.val();
				if (node.is(":visible") && self.checkNums(num, false, node)) {
					var data = {
						maxNum: num,
						orgid: -1
					};
					self.sendTaskSetData(true, data);
				}
			});
			jQuery(document).on("click", "#saveTaskSet:not(.disabled)", function(e) {
				self.installData();
				self.sendTaskSetData(false, self.clectdata);
			});
		}
	}

	return new taskNumSet();
});