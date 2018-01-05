/**
 *
 * @authors yuqiu  (you@example.org)
 * @date    2014-10-09 14:09:04
 * @version $Id$
 */
/**
 * [这个文件专门为右侧的原视图库的逻辑，右侧有缺失的都添加到这里来，目前还缺失，绑定事件之类的。还有权限之类的]
 * @param  {[type]} require [description]
 * @param  {[type]} exports [description]
 * @param  {[type]} module  [description]
 * @return {[type]}         [description]
 */
define([
    'handlebars',
    '/module/viewlibs/common/panel_import.js',
    '/module/viewlibs/common/js/ChoosePanel.js',
    'jquery',
    'jquery-ui-1.10.1.custom.min',
    'echarts-plain',
    'base.self'
], function(Handlebars, panelImport, ChoosePanel) {
	var CharmsBar = {
		pieTemplate : '',
		pie: '',
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
		show: function(data, containerId) {
			if (containerId) {
				this.pie = echarts.init(document.getElementById(containerId));
			} else {
				this.pie = echarts.init(document.getElementById('pieContainer'));
			}
			this.options.series[0].data = this.rebuilData(data);
			this.pie.setOption(this.options);
		},
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
		},
		randerPie : function() {
			var self = this,
				url = "/service/pvd/get_count"; 

			// 编译模板
			if (!self.pieTemplate) {
				self.pieTemplate = Handlebars.compile(jQuery("#pieLegendTemplate").html());
			}
			

			// 获取统计数据
			jQuery.get(url).then(function(res) {
				if (res.code === 200) {
					// 设置条数
					jQuery("#sidebar ul.statistics span.no-commit").html(res.data.noSubmitIncident);
					jQuery("#sidebar ul.statistics span.no-pass").html(res.data.noPassIncident);

					jQuery("#sidebar ul.statistics span.struct-no-commit").html(res.data.noSubmitStruct);
					jQuery("#sidebar ul.statistics span.struct-no-pass").html(res.data.noPassStruct);

					// 待审核 案事件 结构化信息
					jQuery("#sidebar ul.statistics span.auditing").html(res.data.waitAuditInc);
					jQuery("#sidebar ul.statistics span.struct-auditing").html(res.data.waitAuditStr);

					// 渲染饼图
					var arr = []
					arr[0] = {
						value: res.data.incidentNum,
						name: '案事件',
						color: "#788BAF"
					};
					//arr[1] = {value:res.data.structedsNum, name:'结构化信息',color:"#AF789C"};
					arr[1] = {
						value: res.data.structNum,
						name: '结构化信息',
						color: "#AF789C"
					};


					// 设置图例
					jQuery("#sidebar ul.pie-legend").html(self.pieTemplate({
						items: arr
					}));
					// 显示饼图
					self.show(arr);

				} else {
					notify.warn("获取统计信息失败！");
				}
			});

			// 导入视频、图片点击事件
			jQuery("#importResource").on("click", function() {
				parent.jQuery('.workbench[data-id="14"]').addClass("active").siblings().removeClass("active");
				panelImport.open();
			});

			// 设置重大案事件 点击事件
			jQuery("#setImportantIncident").click(function() {
				new ChoosePanel();
				return false;
			});			
		}
	};

	return CharmsBar;
});