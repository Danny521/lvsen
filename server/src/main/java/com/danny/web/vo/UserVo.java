package com.danny.web.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@ApiModel(value = "User对象", description = "用户信息")
public class UserVo {
    @ApiModelProperty(hidden = true)
    private Integer id;

    @ApiModelProperty(value = "用户名称", required = true)
    private String name;

    @ApiModelProperty(value = "联系电话")
    private String phone;

    @ApiModelProperty(value = "登录帐号", required = true)
    private String account;

    @ApiModelProperty(value = "登录密码", required = true)
    private String password;

    private String birthday;
    
    @ApiModelProperty(value = "创建时间", hidden = true)
    private String createTime;

    @ApiModelProperty(value = "工作描述")
    private String jobDesc;
    
    @ApiModelProperty(value = "性别(1-男,2-女)", allowableValues="1,2")
    private Boolean sex;

    @ApiModelProperty(value = "权限分值(0-100)")
    private Integer score;

    @ApiModelProperty(value = "备用联系电话")
    private String phone2;

    @ApiModelProperty(value = "所属部门")
    private String department;
    
    @ApiModelProperty(value = "角色ID")
    private String roleId;

    @ApiModelProperty(value = "状态(0-禁用,1-启用)")
    private Boolean status;

}