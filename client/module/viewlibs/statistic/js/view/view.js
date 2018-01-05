/**
 *
 * @authors 于秋 (you@example.org)
 * @date    2014-10-09 17:39:26
 * @version $Id$
 */

/**
 * [一些不需要数据层的静态页面交互，渲染模板插入到DOM树中。获取参数值，绑定各种操作事件。]
 * @param  {[type]} require [description]
 * @param  {[type]} exports [description]
 * @param  {[type]} module  [description]
 * @return {[type]}         [description]
 */
define([
    'js/view/tree',
    'handlebars',
    'pubsub',
    'echarts-plain',
    'WdatePicker'
], function(CommonTree, Handlebars, PubSub) {

	var dateType = 'yyyy-MM',
		myChart = echarts.init(document.getElementById('chart-item')),
		listHtmlTemp = '{{#each listData}}<ul class="inline-list"><li class="list-item"><span>{{name}}</span></li>' +
		'<li class="list-item"><span>{{time}}</span></li>' +
		'<li class="list-item"><span>{{type}}</span></li>' +
		'<li class="list-item"><span>{{pass}}/{{back}}/{{total}}</span></li>' +
		'<li class="list-item"><span>{{rate}}%</span></li></ul>{{/each}}',
		View = {
			/**
			 * [initDateType 渲染时间插件]
			 * @type {Object}
			 */
			initDateType: {
				startDateType: function() {
					new WdatePicker({
						isShowClear: false,
						maxDate: '#F{$dp.$D(\'end-date\') || \'%y-%M\'}',
						dateFmt: dateType,
						readOnly: true
					});
				},
				endDateType: function() {
					new WdatePicker({
						isShowClear: false,
						minDate: '#F{$dp.$D(\'start-date\')}',
						maxDate: '%y-%M',
						dateFmt: dateType,
						readOnly: true
					});
				}
			},
			/**
			 * [getParams 拿取接口参数]
			 * @return {[type]} [description]
			 */
			getParams: function() {
				var params = {
					startTime: $('#start-date').val(),
					endTime: $('#end-date').val(),
					//calculateRole: $('#type').val(),
					version: '1.0',
					orgId: this.$orgTrigger.data("id"),
					isRemoteAccess: this.$orgTrigger.data("remote") || 0,
					userId: this.$userSelector.val()
				};
				if (params.userId == 0) {
					params.userId = undefined;
				}
				if (params.startTime == '' || params.startTime.length === 0) {
					params.startTime = undefined;
				}
				if (params.endTime == '' || params.endTime.length === 0) {
					params.endTime = undefined;
				}
				if (this.$statisticType.val() == 2) {
					delete params.userId;
				}

				return params;
			},
			/**
			 * 注册自定义事件
			 * @return {[type]} [description]
			 */
			registEvent: function(events) {
				var self = this,
					PB = PubSub;
				if (events) {
					for (var ev in events) {
						if (events.hasOwnProperty(ev)) {
							(function(ev) {
								PB.subscribe(ev, function(eventName, data) {
									events[ev](data);
								});
							})(ev);
						}
					}
				}
			},
			/**
			 * [bindEvent 绑定页面事件]
			 * @return {[type]} [description]
			 */
			bindEvent: function() {
				var self = this,
					$startDate = $('#start-date'),
					$endDate = $('#end-date');
				$('#data-show-switch').on('click', 'button', function() {
					var id = $(this).attr('data-id');
					if (id === 'save-data') {
						//alert('保存图片');
					} else {
						$(this).addClass('button-icon-active').siblings('button').removeClass('button-icon-active');
						$('#data-show').find('.data-show-item').hide().end().find('.' + id).show();
					}
				});
				$('#list-type').on('change', function() {

				});
				//图表统计周期切换
				$("#chart-type").on("click", ".chart-data-type", function() {
					var $this = $(this);
					$this.addClass("active").siblings().removeClass("active");
				});
				//统计图像切换
				var $orgTrigger = this.$orgTrigger = $("#orgSelectTrigger");
				var $userSelector = this.$userSelector = $("#userSelector");
				this.$statisticType = $("#statisticType").bind("change", function() {
					$userSelector.parent()[this.value == "1" ? "show" : "hide"]();
				});
				$startDate.on('click', self.initDateType.startDateType);
				$endDate.on('click', self.initDateType.endDateType);
				$("#org").change(function(event) {
					var self = this;
					$(self).find('option').prop("selected", function(i, val) {
						if (!val) return;
						$(self).attr('data-val', $(this).text());
					});
				});
				$("#user-info").change(function(event) {
					var self = this;
					$(self).find('option').prop("selected", function(i, val) {
						if (!val) return;
						$(self).attr('data-val', $(this).text());
					});
				});
			//导入案事件信息
			jQuery(document).off('click', '#import').on("click", "#import", function() {
				jQuery.ajax({
					url: '/service/pvd/incidentUpload?timestamp=' + new Date().getTime(),
					type: 'get',
					success: function(res) {
						if (res.code === 200) {
							notify.success("导入案事件成功！");
						}
					},
					error: function(err, errstatus, errthr) {
						notify.warn("导入案事件失败");
					}
				});
			});

			//导出案事件信息
			jQuery(document).off('click', '#export').on("click", "#export", function() {
				jQuery.ajax({
					url: '/service/pvd/incidentDownload?timestamp=' + new Date().getTime(),
					type: 'get',
					success: function(res) {
						if (res.code === 200) {
							notify.success("导出案事件成功！");
						}
					},
					error: function(err, errstatus, errthr) {
						notify.warn("导出案事件失败");
					}
				});
			});
				this.initTreeSelector();
			},
			/**
			 * 初始化树选择器
			 * @return {[type]} [description]
			 */
			initTreeSelector: function() {
				var self = this;
				//机构树
				//初始化事件
				var $treeWrap = $("#tree_select_dialog"),
					$treeShim = $("#tree_select_dialog-bg"),
					$orgTrigger = this.$orgTrigger;
				var orgTree = new CommonTree('#org-tree');
				$(".ensure", $treeWrap).on("click", function() {
					ensure();
				});
				$(".cancel", $treeWrap).on("click", function() {
					hideSelector();
				});
				$(".customTree-header a", $treeWrap).on("click", function() {
					hideSelector();
				});
				$(".customTree-header a", $treeWrap).on("click", function() {
					hideSelector();
				});
				$orgTrigger.on("click", function() {
					showSelector("org");
				});
				$orgTrigger.on("click", function() {
					showSelector("user");
				});
				$("#alarmAreaTreeBtn .remove").on("click", function() {
					remove();
				});

				//隐藏
				function hideSelector() {
					$treeWrap.hide();
					$treeShim.hide();
				}

				function setCheckedNode() {
					var ids = [];
					var json = $alarmAreaJson.val();
					if (json) {
						var range = JSON.parse(json),
							array;
						for (var k in range) {
							if (range.hasOwnProperty(k)) {
								array = range[k];
								for (var i = 0, l = array.length; i < l; i++) {
									ids.push(array[i].id);
								}
							}
						}
					}
					orgTree.setCheckedNode(ids.join(","));
				}
				//显示
				function showSelector() {
					orgTree.selectNodes($orgTrigger.data("id"));
					$treeWrap.show();
					$treeShim.show();
				}
				//删除
				function remove() {
					var ts = orgTree.treeObj.getNodes();
					$textInput.html("请选择地区").attr("title", "请选择地区");
					$alarmAreaJson.val('{"orgUnits":[],"roadMonitorStations":[],"hostChannels":[]}');
				}
				//确认
				function ensure() {
					var nodes = orgTree.getSelectNodes();
					if (nodes.length) {
						$orgTrigger.val(nodes[0].name).data({"id": nodes[0].databaseId, "remote": nodes[0].remote});
						self.$userSelector.html("<option value='-1'>请选择</option>");
						PubSub.publish("getUsersOfOrg", {"id": nodes[0].databaseId, "remote": nodes[0].remote});
					}
					hideSelector();
				}
			},
			/**
			 * [randerListHtml 渲染列表数据]
			 * @param  {[type]} data [列表数据]
			 * @return {[type]}
			 */
			randerListHtml: function(data) {
				var tmpHtml = Handlebars.compile(listHtmlTemp),
					html = tmpHtml({
						listData: data
					});
				$('#data-show').find('div.data-list-body').empty();
				$('#data-show').find('div.data-list-body').append(html);
			},
			/**
			 * [randerCharts 渲染图表插件]
			 * @param  {[type]} options [echart的option对象]
			 * @return {[type]}         []
			 */
			randerCharts: function(options) {
				myChart.clear();
				myChart.refresh();
				this._isNull(options.series) || myChart.setOption(options, true);
				this.loading(false);
			},
			/**
			 * 判断是否无数据
			 * @return {[type]} [description]
			 */
			_isNull: function(series) {
				var flag = true;
				if (series && series.length) {
					for (var i = 0, l = series.length; i < l; i++) {
						if (series[i].data && series[i].data.length > 0) {
							return false;
						}
					}
				}
				return true;
			},
			/**
			 * 填充机构下用户
			 * @return {[type]} [description]
			 */
			loadUsersOfOrg: function(users, selectedUserId) {
				var html = [];
				if (users && users.length) {
					for (var i = 0, l = users.length; i < l; i++) {
						html.push("<option ");
						selectedUserId && (selectedUserId == users[i].id) && html.push(" selected='selected' ");
						html.push(" value='");
						html.push(users[i].id);
						html.push("'>");
						html.push(users[i].name);
						html.push("</option>");
					}
					this.$userSelector.html(html.join(""));
					if (selectedUserId) {
						$('#search-data').trigger('click');
					}
				} else {
					this.$userSelector.html("<option value='-1'>暂无用户</option>");
				}
			},
			setCurrentOrg: function(org) {
				this.$orgTrigger.val(org.name).data({"id": org.id, "remote": org.isRemoteAccess || 0});
			},
			/**
			 *加载过渡
			 */
			loading: function(show) {
				if (show) {
					myChart.showLoading({
						text: 'loading',
						effect: 'whirling',
						textStyle: {
							fontSize: 20
						}
					});
				} else {
					myChart.hideLoading();
					//myChart.clear();
				}

			},
			addPortTool: function() {
                var userName = jQuery.parseJSON(localStorage.getItem("user_login_info")).username;
                if (userName === "STKYS") {
                    jQuery("#import").closest("div").show();
                    jQuery("#export").closest("div").show();
                }
            }
		};


	return  View;
});

/*
为了解决月和年日期选择切换的问题。留着后来人用。
dateType = $(this).val();
var startHtml = '<input type="text" placeholder="请选择开始时间" id="start-date" class="Wdate"  />',
	endHtml = '<input type="text" placeholder="请选择结束时间" id="end-date" class="Wdate" />';
$startDate.replaceWith(startHtml);
$('#start-date').on('click',self.initDateType.startDateType);
$endDate.replaceWith(endHtml);
$('#end-date').on('click',self.initDateType.endDateType);
*/