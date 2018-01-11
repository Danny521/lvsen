/**
 * 用户管理模块使用到的一些handlebar助手
 * @author chencheng
 * @date   2014-12-11
 */
define(["js/config","handlebars","base.self"], function(settings) {
	
	// 控制用户启用|禁用的图标
	Handlebars.registerHelper("switch", function(value, options) {
		if (value === 0) {
			return options.fn(value);
		} else {
			return options.inverse(value);
		}
	});

	// 是否是本组织管理员(不能修改自己和本组织其他管理员)
	var userInfo = JSON.parse(window.localStorage.getItem("userInfo")),
		orgInfo = JSON.parse(window.localStorage.getItem("uOrgInfo"));

	Handlebars.registerHelper("isSelf", function(userId,userScore,syncFlag,options) {
		return options.inverse();
	});


	// 参见menu.js  line:153
	var uOrgId = (orgInfo && orgInfo.id) || 1 ;  
	// 判断当前组织是否是子组织，子组织显示操作按钮 on 2015-3-31
	Handlebars.registerHelper("isChildOrg", function(pId,ctx, options) {
		if (uOrgId === pId) {
			return options.fn(ctx);
		} else {
			return options.inverse(ctx);
		}
	});
	
	Handlebars.registerHelper("isSysOwner", function(oId,ctx, options) {
		if (uOrgId === oId) {
			return options.fn(ctx);
		} else {
			return options.inverse(ctx);
		}
	});

	// 用户不能修改自己的角色  (暂时不使用  )
	var roleId = jQuery("#userEntry").attr("data-roleid");
	roleId = -1;
	Handlebars.registerHelper("hasRole", function(value1, value2,options) {
		if (parseInt(roleId,10) !== value1&&value2!==1) {
			return options.fn();
		} else {
			return options.inverse();
		}
	});
	Handlebars.registerHelper("showTittle", function(value1,options) {
		if (value1 === "func") {
			return "进入详情页面";
		} else {
			return "";
		}
	});
	Handlebars.registerHelper("isFunc", function(options) {
		return this['funcName'] === "func" ? options.fn(this) : options.inverse(this);
	});
	// if  == 比较
	Handlebars.registerHelper("eq", function(value1, value2, options) {
		if (value1 === value2) {
			return options.fn(value1);
		} else {
			return options.inverse(value1);
		}
	});

	// if > 比较
	Handlebars.registerHelper("compare", function(value1, value2, context, options) {
		if (value1 > value2) {
			return options.fn(context);
		} else {
			return options.inverse(context);
		}
	});

	// 是否过期
	Handlebars.registerHelper("isAvailable", function(value1, value2, type) {
		value1 = new Date();
		if (value2 - value1 < 0) {
			return " out-of-date";
		}
	});
	// 添加过期文字
	Handlebars.registerHelper("isAvailable1", function(value1, value2, type) {
		value1 = new Date();
		if (value2 - value1 < 0) {
			return "（过期）";
		}
	});

	// 奇偶行
	Handlebars.registerHelper("even", function(value) {
		if (value % 2 === 0) {
			return " even";
		}
	});

	// 序号递增
	Handlebars.registerHelper("list", function(value) {
		return value + 1;
	});
	// 性别 [1.男  2.女]
	Handlebars.registerHelper("genderName", function(value) {
		if (value === 1) {
			return "男";
		} else if (value === 2) {
			return "女";
		}
	});

	// 等级 number To 中文
	Handlebars.registerHelper("levelName", function(value) {
		var level = ["", "一级", "二级", "三级", "四级", "五级", "六级", "七级", "八级"];
		return level[value];
	});

	// 单选 select 自动选择
	Handlebars.registerHelper("selected", function(num1, num2, type) {
		if (num1 === num2) {
			if (type && type === "radio") {
				return "checked";
			}
			return "selected";
		}
	});

	//	毫秒转日期 [ 依赖base.self 中的Toolkit ]
	Handlebars.registerHelper("mills2str", function(num) {
		return Toolkit.mills2str(num);
	});

	/**
	 * 用户比分 用户比分比摄像机比分低 将不能编辑 删除摄像机  暂不使用
	 * @type {Number}
	 */
	var userScore = 80 ;
	Handlebars.registerHelper("compareScore", function(num) {
		if(num > userScore){
			return 'disable';
		}

		return 'disable';
	});

	//	组织结构 (用户创建 编辑显示当前所在组织)  [ 依赖config中的全局变量 settings ]
	Handlebars.registerHelper("location2str", function(num) {
		var html = "";
		for (var i = 0; i < settings.steps.length; i++) {
			html += settings.steps[i].name + " ";
		}
		return html;
	});

    // 下级机构列表是否已经被删除
    Handlebars.registerHelper("isDeleted", function(status) {
        return status === 2 ? "deleted" : "";
    });
	
});