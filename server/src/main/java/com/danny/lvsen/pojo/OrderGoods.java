package com.danny.lvsen.pojo;

public class OrderGoods {
    private Long id;

    private Long orderId;

    private Integer goodsId;

    private Integer unitId;

    private String spec;

    private Integer totalNumber;

    private Integer realNumber;

    private String unitTranfer;

    private Float price;

    private Float discount;

    private Float sum;

    private Float discountPrice;

    private Float discountSum;

    private String isLargess;

    private String storageId;

    private String comment;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
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

    public String getSpec() {
        return spec;
    }

    public void setSpec(String spec) {
        this.spec = spec == null ? null : spec.trim();
    }

    public Integer getTotalNumber() {
        return totalNumber;
    }

    public void setTotalNumber(Integer totalNumber) {
        this.totalNumber = totalNumber;
    }

    public Integer getRealNumber() {
        return realNumber;
    }

    public void setRealNumber(Integer realNumber) {
        this.realNumber = realNumber;
    }

    public String getUnitTranfer() {
        return unitTranfer;
    }

    public void setUnitTranfer(String unitTranfer) {
        this.unitTranfer = unitTranfer == null ? null : unitTranfer.trim();
    }

    public Float getPrice() {
        return price;
    }

    public void setPrice(Float price) {
        this.price = price;
    }

    public Float getDiscount() {
        return discount;
    }

    public void setDiscount(Float discount) {
        this.discount = discount;
    }

    public Float getSum() {
        return sum;
    }

    public void setSum(Float sum) {
        this.sum = sum;
    }

    public Float getDiscountPrice() {
        return discountPrice;
    }

    public void setDiscountPrice(Float discountPrice) {
        this.discountPrice = discountPrice;
    }

    public Float getDiscountSum() {
        return discountSum;
    }

    public void setDiscountSum(Float discountSum) {
        this.discountSum = discountSum;
    }

    public String getIsLargess() {
        return isLargess;
    }

    public void setIsLargess(String isLargess) {
        this.isLargess = isLargess == null ? null : isLargess.trim();
    }

    public String getStorageId() {
        return storageId;
    }

    public void setStorageId(String storageId) {
        this.storageId = storageId == null ? null : storageId.trim();
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment == null ? null : comment.trim();
    }
}