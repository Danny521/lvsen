package com.danny.lvsen.pojo;

public class Goods {
    private Integer id;

    private String goodsNumber;

    private String name;

    private String pinyin;

    private String acronym;

    private Integer categoryId;

    private String specification;

    private Integer status;

    private Float minPrice;

    private Integer capacity;

    private String miniUnit;

    private Integer defaultUnitId;

    private String storagePartitionNumber;

    private Boolean isScan;

    private String singleCode;

    private Float weight;

    private Float volume;

    private String ext;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getGoodsNumber() {
        return goodsNumber;
    }

    public void setGoodsNumber(String goodsNumber) {
        this.goodsNumber = goodsNumber == null ? null : goodsNumber.trim();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name == null ? null : name.trim();
    }

    public String getPinyin() {
        return pinyin;
    }

    public void setPinyin(String pinyin) {
        this.pinyin = pinyin == null ? null : pinyin.trim();
    }

    public String getAcronym() {
        return acronym;
    }

    public void setAcronym(String acronym) {
        this.acronym = acronym == null ? null : acronym.trim();
    }

    public Integer getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }

    public String getSpecification() {
        return specification;
    }

    public void setSpecification(String specification) {
        this.specification = specification == null ? null : specification.trim();
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
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
        this.miniUnit = miniUnit == null ? null : miniUnit.trim();
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
        this.storagePartitionNumber = storagePartitionNumber == null ? null : storagePartitionNumber.trim();
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
        this.singleCode = singleCode == null ? null : singleCode.trim();
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

    public String getExt() {
        return ext;
    }

    public void setExt(String ext) {
        this.ext = ext == null ? null : ext.trim();
    }
}