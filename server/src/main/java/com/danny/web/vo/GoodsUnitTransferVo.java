package com.danny.web.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;

@ApiModel(value="商品单位转换对象", description = "商品单位转换信息")
public class GoodsUnitTransferVo {
    @ApiModelProperty(hidden = true)
    private Integer id;
    
    @ApiModelProperty(value = "商品ID", required = true)
    private Integer goodsId;

    @ApiModelProperty(value = "商品单位ID", required = true)
    private Integer unitId;

    @ApiModelProperty(value = "商品单位规格(该商品最小单位的个数)", required = true)
    private Integer capacity;

    @ApiModelProperty(value = "商品单位转换(如1箱=9瓶)", required = true)
    private String transform;

    @ApiModelProperty(value = "该单位商品的条码号", required = true)
    private String serialNumber;

    @ApiModelProperty(value = "该单位商品的零售价格", required = true)
    private Float retailPrice;

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

    public Integer getUnitId() {
        return unitId;
    }

    public void setUnitId(Integer unitId) {
        this.unitId = unitId;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getTransform() {
        return transform;
    }

    public void setTransform(String transform) {
        this.transform = transform == null ? null : transform.trim();
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber == null ? null : serialNumber.trim();
    }

    public Float getRetailPrice() {
        return retailPrice;
    }

    public void setRetailPrice(Float retailPrice) {
        this.retailPrice = retailPrice;
    }
}