package com.danny.web.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;

@ApiModel(value="商品价格种类对象", description = "商品价格种类信息")
public class GoodsPriceCatetoryVo {
    @ApiModelProperty(hidden = true)
    private Integer id;

    @ApiModelProperty(value = "商品ID", required = true)
    private Integer goodsId;

    @ApiModelProperty(value = "客户种类ID", required = true)
    private Integer clientCategoryId;

    @ApiModelProperty(value = "商品单价", required = true)
    private Float price;

    @ApiModelProperty(value = "状态(0-禁用，1-启用)")
    private Boolean status;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getGoodsId() {
        return goodsId;
    }

    public void setGoodsId(Integer goodsId) {
        this.goodsId = goodsId;
    }

    public Float getPrice() {
        return price;
    }

    public void setPrice(Float price) {
        this.price = price;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public Integer getClientCategoryId() {
        return clientCategoryId;
    }

    public void setClientCategoryId(Integer clientCategoryId) {
        this.clientCategoryId = clientCategoryId;
    }
}