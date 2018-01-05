define([
    'js/apply_view',
    'handlebars',
    'jquery.pagination',
    ], function(applyView) {
    return (function (scope, $) {
        //初始化 
        scope.init = function () {
            applyView.init(scope);
        };
        /**
         * 加载所有权限信息
         * @return {[type]} [description]
         */
        scope.loadData = function(data) {
            jQuery.ajax({
                url: "/service/resource/get_function_pemission",
                method: "get",
                dataType: "json",
                data: {},
                success: function(res) {
                    if (res.code === 200 && res.data.systemFunctionOrganizationList) {
                        var userId = jQuery("#userEntry").attr("data-userid");
                        if(userId === "1" || userId === 1){
                            applyView.renderAdmin(res.data.systemFunctionOrganizationList,data);
                        }else{
                            applyView.renderCommon(res.data.systemFunctionOrganizationList);
                        }
                    } else {
                        notify.warn("网络或服务器异常！");
                    }
                }
            });
        }; 
        /**
         * 渲染用户的权限
         * @param  {[type]} id [description]
         * @return {[type]}    [description]
         */
        scope.getRoleFunc = function(id){
            jQuery.ajax({
                url: "/service/usr/get_usr",
                method: "get",
                dataType: "json",
                data: {"id":id},
                success: function(res) {
                    
                    if (res.code === 200 && res.data.functionOrgIdList) {
                        applyView.update({"funcs":res.data.functionOrgIdList}, true);
                        // if (jQuery('.func-item input[data-id="46"]').prop('checked')){
                        //     jQuery('.func-item input[data-id="47"],.func-item input[data-id="159"]').prop('disabled',false).closest('span').removeClass('disable')
                        // } else {
                        //      jQuery('.func-item input[data-id="47"],.func-item input[data-id="159"]').prop('disabled',true).closest('span').addClass('disable')
                        // }
                    } else {
                        notify.warn("网络或服务器异常！");
                    }
                }
            });
        };
        /**
         * 用户提交申请
         * @param  {[type]} data1 [description]
         * @param  {[type]} data2 [description]
         * @return {[type]}       [description]
         */
        scope.editPermission = function(data1,data2){
            jQuery.ajax({
                url: "/service/usr/push_authority_message",
                method: "post",
                dataType: "json",
                data: {"firAndSecLevelmoduleIds":data1.join(","),"thirdLevelModuleIds":data2.join(","),"userId":jQuery("#userEntry").attr("data-userid")},

                success: function(res) {
                    if (res.code === 200) {
                        username = res.data.username;
                        description = res.data.description;
                       
                       logDict.insertMedialog('m10', description,'','o38'); 
                       applyView.changeButton1(true);
                       notify.success("申请成功");
                    } else {
                        notify.warn("网络或服务器异常");
                    }
                }
            });
        };
        scope.getApprovalList = function(){
            
            jQuery.ajax({
                url: "/service/userCenter/permission/messages",
                method: "get",
                dataType: "json",
                data: {
                    "currentPage": 1 ,
                    "pageSize": 9,
                    "status": 0
                },
                success: function(res) {
                    
                    if (res.code === 200) {
                        applyView.renderList(res.data.result.rows);
                        if(res.data.result.totalCount === 0){
                            $(".approvalList .pagination").hide();
                        }
                        if(res.data.result.totalCount > 0){
                            $(".approvalList .pagination").pagination(res.data.result.totalCount, {
                                // items_per_page: pageItem,
                                num_display_entries: 2,
                                num_edge_entries: 2,
                                callback: function (pageIndex) {
                                    
                                    jQuery.ajax({
                                        url: "/service/userCenter/permission/messages",
                                        method: "get",
                                        dataType: "json",
                                        data: {
                                            "currentPage": pageIndex+1 ,
                                            "pageSize": 9,
                                            "status": 0
                                        },
                                        success: function(res) {
                                            //分页请求
                                            if (res.code === 200) {
                                                applyView.renderList(res.data.result.rows);
                                            }else{
                                                notify.warn("网络或服务器异常！");
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    } else {
                        notify.warn("网络或服务器异常！");
                    }
                }
            });
        };
        /*
        *   admin获取用户的权限申请信息
        */
        scope.getUserPermission = function(id,flag){
            jQuery.ajax({
                url: "/service/usr/get_module_ids",
                method: "get",
                dataType: "json",
                data: {
                    "id": id
                },
                success: function(res) {
                    
                    if (res.code === 200) {
                        var data = {
                            "id":res.data.id,
                            "userId":res.data.userId,
                            "userName":res.data.loginName,
                            "mainModule":res.data.functionOrgIds,
                            "thirdModule":res.data.functionIds,
                            "roleId":res.data.roleId
                        }
                        applyView.render(data,flag);
                    } else {
                        notify.warn("网络或服务器异常！");
                    }
                }
            });
        };
        /*
        *   根据角色id获取该角色的功能权限
        */
        scope.postApplyResult = function(data){
            jQuery.ajax({
                url: "/service/usr/push_resultMessage_toUser",
                method: "get",
                dataType: "json",
                data: data,
                success: function(res) {
                    
                    if (res.code === 200) {
                        username = res.data;
                        if(data.result === 1){
                            scope.saveApplyMsg(data.id);
                            logDict.insertMedialog('m10', "admin同意了" +username+"的权限申请" ,'','o36');
                        }else{
                            applyView.renderListTpl();
                            scope.changeMsg(data.id);
                            logDict.insertMedialog('m10', "admin拒绝了" +username+"的权限申请" ,'','o37');
                        }
                        
                    } else {
                        notify.warn("网络或服务器异常！");
                    }
                }
            });
        };
        scope.changeMsg = function(id){
            jQuery.ajax({
                "method": "post",
                "url": "/service/userCenter/messages/",
                "data": {
                    "ids": id,
                    "value": 1,
                    "moduleId": 8
                }
            }).then(function(res) {
                if(res.code === 200){
                    notify.success("打回成功");
                } 
            });
        };
        scope.saveApplyMsg = function(id){ 
            
            var nowDate=new Date();
                startDate = nowDate.getFullYear()+"-"+(nowDate.getMonth()+1)+"-"+nowDate.getDate(),
                endDate = (nowDate.getFullYear()+10)+"-"+(nowDate.getMonth()+1)+"-"+nowDate.getDate()+" "+nowDate.getHours()+":"+nowDate.getMinutes()+":"+nowDate.getSeconds();
                userPermission = {
                    "userPemission":[
                        {
                            "pemissionType":1,
                            "userResourcePemission":[]
                        },
                        {
                            "pemissionType":0,
                            "userResourcePemission":[]
                        }
                    ]
                }; 
            jQuery.ajax({
                url: "/service/usr/saveUserPermission",
                method: "post",
                dataType: "json",
                data: {
                    "pemissionStartDate":startDate,
                    "pemissionEndDate":endDate,
                    "userPemission":JSON.stringify(userPermission),
                    "id":id
                },
                success: function(res) {
                    if (res.code === 200) {
                        applyView.renderListTpl();
                        notify.success("审批成功");
                    } else {
                        notify.warn("网络或服务器异常！");
                    }
                }
            });
        };
        return scope;
    }({}, jQuery));
});