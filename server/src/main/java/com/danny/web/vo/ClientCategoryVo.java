package com.danny.web.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;

@ApiModel(value="客户类型对象", description = "客户类型的详细信息")
public class ClientCategoryVo {
    @ApiModelProperty(hidden = true)
    private Integer id;

    @ApiModelProperty(value = "类别名称(如:超市,网吧等)", required = true)
    private String categoryName;

    @ApiModelProperty(value = "状态(0-禁用，1-启用)", allowableValues="0,1")
    private Boolean status;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }
}