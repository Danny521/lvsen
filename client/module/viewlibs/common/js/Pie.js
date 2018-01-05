/*
 *	饼图
 */
define(['echarts-plain'], function() {
	var iPie = window.Pie = {
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
 return iPie;
});