package com.danny.web.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;

@ApiModel(value = "单据商品对象", description = "单据商品的详细信息")
public class OrderGoodsVo {
    @ApiModelProperty(hidden = true)
    private Long id;

    @ApiModelProperty(value = "单据编号", position = 1, required = true)
    private Long orderId;

    @ApiModelProperty(value = "商品ID", required = true)
    private Integer goodsId;

    @ApiModelProperty(value = "商品名称")
    private Integer goodsName;

    @ApiModelProperty(value = "单位ID", required = true)
    private Integer unitId;

    @ApiModelProperty(value = "单位名称")
    private Integer unitName;

    @ApiModelProperty(value = "商品规格")
    private String spec;

    @ApiModelProperty(value = "商品预订数量", required = true)
    private Integer totalNumber;

    @ApiModelProperty(value = "商品实收数量")
    private Integer realNumber;

    @ApiModelProperty(value = "单位换算")
    private String unitTranfer;

    @ApiModelProperty(value = "商品单价", required = true)
    private Float price;

    @ApiModelProperty(value = "商品折扣")
    private Float discount;

    @ApiModelProperty(value = "总金额")
    private Float sum;

    @ApiModelProperty(value = "折后价格")
    private Float discountPrice;

    @ApiModelProperty(value = "折后总金额")
    private Float discountSum;

    @ApiModelProperty(value = "是否为赠品")
    private String isLargess;

    @ApiModelProperty(value = "仓库ID", required = true)
    private String storageId;

    @ApiModelProperty(value = "仓库名称")
    private String storageName;

    @ApiModelProperty(value = "备注信息")
    private String remark;

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

    public Integer getGoodsName() {
        return goodsName;
    }

    public void setGoodsName(Integer goodsName) {
        this.goodsName = goodsName;
    }

    public Integer getUnitName() {
        return unitName;
    }

    public void setUnitName(Integer unitName) {
        this.unitName = unitName;
    }

    public String getStorageName() {
        return storageName;
    }

    public void setStorageName(String storageName) {
        this.storageName = storageName;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}