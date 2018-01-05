define(["handlebars"],function() {
	
	
	
    Handlebars.registerHelper('taskStatu', function(data) {
        var taskStatus = '';
       
        switch (data) {
            			 
            case 1:
                taskStatus = '未巡检';
                break;
            case 2:
                taskStatus = '巡检中';
                break;
            case 3:
                taskStatus = '已巡检'; 
                break;
            case 5:
                taskStatus = '任务失败';
            case 6:
                taskStatus = '任务失败';
                break;
            case 7:
                taskStatus = '任务失败';
                break
            default:
                taskStatus = '未知'; 
                break;
           
        }
      
        return taskStatus;
    });
    Handlebars.registerHelper('isShowLine', function(data,options) {
        if(data===null){
            return "--"
        }else{
            return data
        }
    });
    Handlebars.registerHelper('isred', function(status) {
        if(status === 1 || status === "1"){
            return "gray"
        }
        if(status === 2 || status === "2"){
            return "inspect"
        }
         if(status === 3 || status === "3"){
            return "green"
        }
        if (status === 5 || status === "5") {
            return "colorRed"
        } else if (status === 6 || status === "6") {
            return "colorRed"
        } else if (status === 7 || status === "7") {
            return "colorRed"
        }
        return "";
    });
    Handlebars.registerHelper('iserrorHidden', function(status) {
        if (status === 5 || status === "5") {
            return ""
        } else if (status === 6 || status === "6") {
            return ""
        }else if (status === 7 || status === "7") {
            return ""
        }
        return "hidden";
    });
    Handlebars.registerHelper('taskerroinfo', function(status) {
        if (status === 5 || status === "5") {
            jQuery("#onlineBox li.taskitem .statuslist").find("p").removeClass("hasPad");
            return "占用"
        } else if (status === 6 || status === "6") {
            jQuery("#onlineBox li.taskitem .statuslist").find("p").removeClass("hasPad");
            return "数据回写异常"
        }else if(status === 7 || status === "7"){
            jQuery("#onlineBox li.taskitem .statuslist").find("p").removeClass("hasPad");
            return "PCC异常" 
        }
        return "未知";
    });
 
});