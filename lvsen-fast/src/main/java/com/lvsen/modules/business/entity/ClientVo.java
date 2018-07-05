package com.lvsen.modules.business.entity;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@ApiModel(value = "客户对象", description = "客户的详细信息")
public class ClientVo {
    @ApiModelProperty(hidden = true)
    private Integer id;
    
    @ApiModelProperty(value = "客户编号")
    private String clientNumber;
    
    @ApiModelProperty(value = "客户类别ID", required = true)
    private Integer categoryId;
    
    @ApiModelProperty(value = "客户类别名称(如:超市,网吧等)", required = true)
    private Integer categoryName;

    @ApiModelProperty(value = "客户名称", required = true)
    private String name;

    @ApiModelProperty(value = "客户地址")
    private String address;

    @ApiModelProperty(value = "状态(0-禁用，1-启用)", allowableValues="0,1")
    private Boolean status;

    @ApiModelProperty(value = "客户联系电话")
    private String phone;

    @ApiModelProperty(value = "客户联系电话2")
    private String phone2;

    @ApiModelProperty(value = "客户范畴(1-供货商，2-营销商)", allowableValues="1,2", required = true)
    private String type;
    
    @ApiModelProperty(value = "备注信息")
    private String remark;

}