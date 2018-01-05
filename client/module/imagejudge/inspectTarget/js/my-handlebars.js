define(['base.self','handlebars'],function(){
	//检索列表状态
	Handlebars.registerHelper("status", function(value, status, block) {
		if (value.toString() == status) {
			return block.fn();
		}
	});

	Handlebars.registerHelper("mills2ISODate", function(mills, options) { //将数字的文件类型转换为类名
		var date = new Date(mills),
			formatLenth = Toolkit.formatLenth;
		return date.getFullYear() + '-' + formatLenth(date.getMonth() + 1) + '-' + formatLenth(date.getDate()) + ' ' + formatLenth(date.getHours()) + ':' + formatLenth(date.getMinutes()) + ':' + formatLenth(date.getSeconds());
	});
	Handlebars.registerHelper("whatTime", function(obj) { //判断筛选条件是什么类型的筛选
		if(obj && obj.selectType==="create"){
			var date = new Date(obj.ctm_STORAGE_TIME),
			formatLenth = Toolkit.formatLenth;
			return date.getFullYear() + '-' + formatLenth(date.getMonth() + 1) + '-' + formatLenth(date.getDate()) + ' ' + formatLenth(date.getHours()) + ':' + formatLenth(date.getMinutes()) + ':' + formatLenth(date.getSeconds());
		}
		if(obj && obj.selectType==="update"){
			var date = new Date(obj.std_APPEAR_TIME),
			formatLenth = Toolkit.formatLenth;
			return date.getFullYear() + '-' + formatLenth(date.getMonth() + 1) + '-' + formatLenth(date.getDate()) + ' ' + formatLenth(date.getHours()) + ':' + formatLenth(date.getMinutes()) + ':' + formatLenth(date.getSeconds());
		}
	});
	//历史检索列表时间格式化
	Handlebars.registerHelper("timeFormat", function(value, block) {
		var dataFormat = value.split("-");
		var data_mass = dataFormat[3] + ":" + dataFormat[4];
		return data_mass;
	});

	//历史检索列表时间点显示
	Handlebars.registerHelper("timeShow", function(value, block) {
		// var dataFormat = value.split("-"),
		// 	current_time = new Date(),
		// 	current_year = current_time.getFullYear(),
		// 	current_month = current_time.getMonth()+1,
		// 	current_day = current_time.getDay();
		// 	console.log(current_year+"==="+dataFormat[0]);
		// 		console.log(current_month+"==="+dataFormat[1]);
		// 			console.log(current_day+"==="+dataFormat[2]);
		// 	if (Number(dataFormat[0]) == current_year && Number(dataFormat[1]) == current_month && Number(dataFormat[2]) == current_day) {
		// 		alert(1);
		// 		date_current = "今天";
		// 	} else {
		// 		date_current = value;
		// 	}
			if(Toolkit.getCurDate() == value){
				date_current = "今天";
			}else{
				date_current = value;
			}
			return date_current;
	});

	Handlebars.registerHelper('sourceFrom',function(arg){
		var str = '';
		arg == 2 ? str = '视图库' : str = "云空间"; 
		return str;
	});

	Handlebars.registerHelper('sourceType',function(a,b){
		if(a == b){
			return "active"
		}
	});

	Handlebars.registerHelper("selected", function(num1, num2) {
		if (num1 == num2) {
			return "selected";
		}
	});
	Handlebars.registerHelper('transform',function(str){
		return str.replace(/\[|\]/g,'');
	});
	Handlebars.registerHelper('parseName',function(str){
		var string = ["","人员","车辆","物品","场景","运动目标","其他"];
		return string[str - 0];
	});
});

		