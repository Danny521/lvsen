package com.danny.lvsen.pojo;

public class GoodsUnit {
    private Integer id;

    private Integer goodsId;

    private Boolean isScan;

    private Integer clientCategoryId;

    private Integer unitLevel;

    private Integer unitName;

    private Integer capacity;

    private Boolean isMinUnit;

    private Float minPrice;

    private Float salePrice;

    private Float weight;

    private Float volume;

    private Boolean status;

    private String remark;

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

    public Boolean getIsScan() {
        return isScan;
    }

    public void setIsScan(Boolean isScan) {
        this.isScan = isScan;
    }

    public Integer getClientCategoryId() {
        return clientCategoryId;
    }

    public void setClientCategoryId(Integer clientCategoryId) {
        this.clientCategoryId = clientCategoryId;
    }

    public Integer getUnitLevel() {
        return unitLevel;
    }

    public void setUnitLevel(Integer unitLevel) {
        this.unitLevel = unitLevel;
    }

    public Integer getUnitName() {
        return unitName;
    }

    public void setUnitName(Integer unitName) {
        this.unitName = unitName;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Boolean getIsMinUnit() {
        return isMinUnit;
    }

    public void setIsMinUnit(Boolean isMinUnit) {
        this.isMinUnit = isMinUnit;
    }

    public Float getMinPrice() {
        return minPrice;
    }

    public void setMinPrice(Float minPrice) {
        this.minPrice = minPrice;
    }

    public Float getSalePrice() {
        return salePrice;
    }

    public void setSalePrice(Float salePrice) {
        this.salePrice = salePrice;
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

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark == null ? null : remark.trim();
    }
}