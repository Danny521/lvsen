package com.danny.web.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;

@ApiModel(value="商品分类对象", description = "商品分类信息")
public class GoodsCategoryVo {
    @ApiModelProperty(hidden = true)
    private Integer id;

    @ApiModelProperty(value = "商品分类名称", required = true)
    private String name;

    @ApiModelProperty(value = "商品分类父节点ID", hidden=true)
    private Integer parentId;

    @ApiModelProperty(value = "商品分类父节点ID")
    private Boolean status;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name == null ? null : name.trim();
    }

    public Integer getParentId() {
        return parentId;
    }

    public void setParentId(Integer parentId) {
        this.parentId = parentId;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }
}