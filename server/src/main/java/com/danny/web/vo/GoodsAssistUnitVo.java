package com.danny.web.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;

@ApiModel(value = "商品辅助单位对象", description = "商品辅助单位信息")
public class GoodsAssistUnitVo {
    @ApiModelProperty(hidden = true)
    private Integer id;

    @ApiModelProperty(value = "商品ID", required = true)
    private Integer goodsId;

    @ApiModelProperty(value = "商品单位名称", required = true)
    private String unitName;

    @ApiModelProperty(value = "商品单位级别(1为最小单位，数字越大单位内的最小单位数量越多,例如:啤酒1瓶的级别是1，一件的级别是2)", allowableValues = "1,2,3,4,5", required = true)
    private Integer unitLevel;

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

    public String getUnitName() {
        return unitName;
    }

    public void setUnitName(String unitName) {
        this.unitName = unitName;
    }

    public Integer getUnitLevel() {
        return unitLevel;
    }

    public void setUnitLevel(Integer unitLevel) {
        this.unitLevel = unitLevel;
    }
}