/**
 * Created by LiangChuang on 2014/12/3.
 */
define(["handlebars"],function() {
// 助手
    //任务是否已提交
    Handlebars.registerHelper('taskStatus', function(taskStatus, taskId) {
        var status = '';
        switch (taskStatus) {
            case 0:
                status = '<q class="hasreported">已上报</q>';
                break;
            case 1:
                status = '<a class="report" href="#" task-id="' + taskId + '">任务上报</a>';
                break;
        }
        return new Handlebars.SafeString(status);
    });
    //巡检状态
    Handlebars.registerHelper('status', function(data) {
        var status = '';
        switch (data) {
            case 1:
                status = '未巡检';
                break;
            case 2:
                status = '已巡检';
                break;
            case 3:
                status = '已巡检'; // 待审核
                break;
            case 4:
                status = '已巡检'; // 已审核
                break;
        }
        return status;
    });
    //巡检结果
    Handlebars.registerHelper('result', function(data) {
        var result = '';
        switch (data) {
            case 1:
                result = '正常';
                break;
            case 2:
                result = '异常';
                break;
            case 3:
                result = '未巡检';
                break;
        }
        return result;
    });
    //巡检方式
    Handlebars.registerHelper('polingType', function(auto,manu) {
        var type = '';
        if(auto>0 && manu===0){
            type = '自动';
        }else if((manu===1 || manu===2) && auto>0){
            type = '手动/自动';
        }else if(manu===1 || manu===2){
            type = '手动';
        }else{
            type = "--";
        }
        return type;

        /*switch (data) {
         case '1':
         type = '手动';
         break;
         case '2':
         type = '自动';
         break;
         }
         return type;*/
    });
    //是否启用
    Handlebars.registerHelper('isOpen', function(data) {
        var isOpen = '';
        switch (data) {
            case 1:
                isOpen = '启用';
                break;
            case 2:
                isOpen = '禁用';
                break;
            default:
                isOpen = "新建任务";
        }
        return isOpen;
    });
    //是否禁用  启用的另一版 返回数据不一样
    Handlebars.registerHelper('isClosed', function(data) {
        var isOpen = '';
        switch (data) {
            case 1:
                isOpen = 'opened';
                break;
            case 2:
                isOpen = 'closed';
                break;
            default:
                isOpen = "closed";
        }
        return isOpen;
    });
    Handlebars.registerHelper('rate', function(data) {
        var frequency = '';
        switch (data) {
            case 1:
                frequency = '每天';
                break;
            case 2:
                frequency = '每周';
                break;
            case 3:
                frequency = '每月';
                break;
        }
        return frequency;
    });
    Handlebars.registerHelper('dateNow', function(param, frequency) {
        var dateNow = '',
            numToString = [
                "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
                "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
                "二十一", "二十二", "二十三", "二十四", "二十五", "二十六", "二十七", "二十八", "二十九", "三十",
                "三十一"
            ];

        switch (frequency) {
            case 0:
                dateNow = '-----';
                break;
            case 1:
                dateNow = '每天';
                break;
            case 2:
                dateNow = '每周' + (numToString[parseInt(param, 10) - 1] === '七' ? "日" : numToString[parseInt(param, 10) - 1]);
                break;
            case 3:
                dateNow = "每月" + numToString[parseInt(param, 10) - 1] + "号";
                break;
        }
        return dateNow;
    });
    Handlebars.registerHelper('dateThen', function(param, frequency) {
        var dateThen = '',
            numToString = [
                "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
                "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
                "二十一", "二十二", "二十三", "二十四", "二十五", "二十六", "二十七", "二十八", "二十九", "三十",
                "三十一"
            ];

        switch (frequency) {
            case 0:
                dateThen = '-----';
                break;
            case 1:
                dateThen = '每天';
                break;
            case 2:
                dateThen = '下周' + (numToString[parseInt(param, 10) - 1] === '七' ? "日" : numToString[parseInt(param, 10) - 1]);
                break;
            case 3:
                dateThen = "下月" + numToString[parseInt(param, 10) - 1] + "号";
                break;
        }
        return dateThen;
    });
    Handlebars.registerHelper('ifequal', function(val1, val2, string, elseString) {
        if (val1 === val2) {
            return string;
        } else if (elseString) {
            return elseString;
        }
    });
    //毫秒到日期
    Handlebars.registerHelper("mills2str", function(num) {
        if (num && Object.prototype.toString.call(num) === "[object Number]") {
            // 依赖base.js Toolkit
            return Toolkit.mills2str(num);
        }
        return "-----";
    });

    Handlebars.registerHelper('isRoot', function (isRoot) {
        return isRoot ? 'root' : 'tree';
    });

    Handlebars.registerHelper('statusToColor', function (data) {
        var result = '';
        switch (data) {
            case 1:
                result = '8cce58';
                break;
            case 2:
                result = 'd95c5c';
                break;
            case 3:
                result = '333';
                break;
            default:
                result = '333';
        }
        return result;
    });

    Handlebars.registerHelper('pollingresult', function (data) {
        var result = '';
        switch (data) {
            case 1:
                result = '正常';
                break;
            case 2:
                result = '异常';
                break;
            case 3:
                result = '';
                break;
            default:
                result = '';
        }
        return result;
    });

    Handlebars.registerHelper('checkStatus', function (data) {
        var result = '';
        switch (data) {
            case 1:
                result = '已巡检';
                break;
            case 2:
                result = '已巡检';
                break;
            case 3:
                result = '未巡检';
                break;
            default:
                result = '未知参数';
        }
        return result;
    });
});