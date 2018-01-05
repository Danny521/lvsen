package com.danny.web.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;

@ApiModel(value = "库存商品对象", description = "库存商品的详细信息")
public class RepertoryGoodsVo {

    @ApiModelProperty(value = "商品编码", position = 1)
    private String goodsNumber;

    @ApiModelProperty(value = "商品名称", required = true)
    private String name;

    @ApiModelProperty(value = "所属分类名称", required = true)
    private String categoryName;

    @ApiModelProperty(value = "商品规格(比如:1x4x20)")
    private String specification;

    @ApiModelProperty(value = "商品最小单位价格")
    private Float minPrice;

    @ApiModelProperty(value = "容量")
    private Integer capacity;

    @ApiModelProperty(value = "商品最小单位")
    private String miniUnit;

    @ApiModelProperty(value = "商品默认单位ID")
    private Integer defaultUnitId;

    @ApiModelProperty(value = "库位编号")
    private String storagePartitionNumber;

    @ApiModelProperty(value = "是否需要扫描", required = true)
    private Boolean isScan;

    @ApiModelProperty(value = "条形码编号")
    private String singleCode;

    @ApiModelProperty(value = "重量(单位:kg)")
    private Float weight;

    @ApiModelProperty(value = "体积(单位:立方米)")
    private Float volume;

    @ApiModelProperty(value = "库存数量")
    private Integer totalNum;

    @ApiModelProperty(value = "成本价格(库存金额除以库存量)")
    private Float costPrice;

    @ApiModelProperty(value = "库存金额")
    private Float money;

    public String getGoodsNumber() {
        return goodsNumber;
    }

    public void setGoodsNumber(String goodsNumber) {
        this.goodsNumber = goodsNumber;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getSpecification() {
        return specification;
    }

    public void setSpecification(String specification) {
        this.specification = specification;
    }

    public Float getMinPrice() {
        return minPrice;
    }

    public void setMinPrice(Float minPrice) {
        this.minPrice = minPrice;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getMiniUnit() {
        return miniUnit;
    }

    public void setMiniUnit(String miniUnit) {
        this.miniUnit = miniUnit;
    }

    public Integer getDefaultUnitId() {
        return defaultUnitId;
    }

    public void setDefaultUnitId(Integer defaultUnitId) {
        this.defaultUnitId = defaultUnitId;
    }

    public String getStoragePartitionNumber() {
        return storagePartitionNumber;
    }

    public void setStoragePartitionNumber(String storagePartitionNumber) {
        this.storagePartitionNumber = storagePartitionNumber;
    }

    public Boolean getIsScan() {
        return isScan;
    }

    public void setIsScan(Boolean isScan) {
        this.isScan = isScan;
    }

    public String getSingleCode() {
        return singleCode;
    }

    public void setSingleCode(String singleCode) {
        this.singleCode = singleCode;
    }

    public Float getWeight() {
        return weight;
    }

    public void setWeight(Float weight) {
        this.weight = weight;
    }

    public Float getVolume() {
        return volume;
    }

    public void setVolume(Float volume) {
        this.volume = volume;
    }

    public Integer getTotalNum() {
        return totalNum;
    }

    public void setTotalNum(Integer totalNum) {
        this.totalNum = totalNum;
    }

    public Float getCostPrice() {
        return costPrice;
    }

    public void setCostPrice(Float costPrice) {
        this.costPrice = costPrice;
    }

    public Float getMoney() {
        return money;
    }

    public void setMoney(Float money) {
        this.money = money;
    }

}