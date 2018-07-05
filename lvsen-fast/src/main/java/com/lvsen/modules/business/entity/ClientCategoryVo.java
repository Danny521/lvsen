package com.lvsen.modules.business.entity;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@ApiModel(value="客户类型对象", description = "客户类型的详细信息")
public class ClientCategoryVo {
    @ApiModelProperty(hidden = true)
    private Integer id;

    @ApiModelProperty(value = "类别名称(如:超市,网吧等)", required = true)
    private String categoryName;

    @ApiModelProperty(value = "状态(0-禁用，1-启用)", allowableValues="0,1")
    private Boolean status;

}