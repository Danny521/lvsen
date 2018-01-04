package com.danny.web.vo;

import java.util.Date;

import io.swagger.annotations.ApiModelProperty;

public class OrderVo {
    private Long id;

    @ApiModelProperty(value = "单据编号", position = 1)
    private String number;

    @ApiModelProperty(value = "单据条形码")
    private String code;

    @ApiModelProperty(value = "制单人ID")
    private Integer createUserId;

    @ApiModelProperty(value = "货单来源方式ID(比如：微信下单，电话下单)")
    private Integer wayId;

    @ApiModelProperty(value = "制单时间")
    private Date createDate;

    @ApiModelProperty(value = "送货时间")
    private Date deliveryDate;

    @ApiModelProperty(value = "处理时间")
    private Date handleDate;

    @ApiModelProperty(value = "过账人ID")
    private Integer checkUserId;

    @ApiModelProperty(value = "单据类别")
    private Integer categoryId;

    @ApiModelProperty(value = "客户ID")
    private Integer clientId;

    @ApiModelProperty(value = "单据处理人ID")
    private Integer handleUserId;

    @ApiModelProperty(value = "整单折扣")
    private Float discount;

    @ApiModelProperty(value = "摘要信息")
    private String digest;

    @ApiModelProperty(value = "收货仓库ID")
    private Integer storageId;

    @ApiModelProperty(value = "收货仓库ID")
    private String remark;

    @ApiModelProperty(value = "单据总金额")
    private Float totalMoney;

    @ApiModelProperty(value = "单据已支付金额")
    private Float paidMoney;

    @ApiModelProperty(value = "单据是否被更改")
    private Boolean isChanged;

    @ApiModelProperty(value = "单据被打印次数")
    private Integer printCount;

    @ApiModelProperty(value = "单据状态")
    private Boolean payStatus;

    @ApiModelProperty(value = "扩展信息")
    private String ext;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number == null ? null : number.trim();
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code == null ? null : code.trim();
    }

    public Integer getCreateUser() {
        return createUserId;
    }

    public void setCreateUser(Integer createUserId) {
        this.createUserId = createUserId;
    }

    public Integer getWayId() {
        return wayId;
    }

    public void setWayId(Integer wayId) {
        this.wayId = wayId;
    }

    public Date getCreateDate() {
        return createDate;
    }

    public void setCreateDate(Date createDate) {
        this.createDate = createDate;
    }

    public Date getDeliveryDate() {
        return deliveryDate;
    }

    public void setDeliveryDate(Date deliveryDate) {
        this.deliveryDate = deliveryDate;
    }

    public Date getHandleDate() {
        return handleDate;
    }

    public void setHandleDate(Date handleDate) {
        this.handleDate = handleDate;
    }

    public Integer getCheckUserId() {
        return checkUserId;
    }

    public void setCheckUserId(Integer checkUserId) {
        this.checkUserId = checkUserId;
    }

    public Integer getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }

    public Integer getClientId() {
        return clientId;
    }

    public void setClientId(Integer clientId) {
        this.clientId = clientId;
    }

    public Integer getHandleUserId() {
        return handleUserId;
    }

    public void setHandleUserId(Integer handleUserId) {
        this.handleUserId = handleUserId;
    }

    public Float getDiscount() {
        return discount;
    }

    public void setDiscount(Float discount) {
        this.discount = discount;
    }

    public String getDigest() {
        return digest;
    }

    public void setDigest(String digest) {
        this.digest = digest == null ? null : digest.trim();
    }

    public Integer getStorageId() {
        return storageId;
    }

    public void setStorageId(Integer storageId) {
        this.storageId = storageId;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark == null ? null : remark.trim();
    }

    public Float getTotalMoney() {
        return totalMoney;
    }

    public void setTotalMoney(Float totalMoney) {
        this.totalMoney = totalMoney;
    }

    public Float getPaidMoney() {
        return paidMoney;
    }

    public void setPaidMoney(Float paidMoney) {
        this.paidMoney = paidMoney;
    }

    public Boolean getIsChanged() {
        return isChanged;
    }

    public void setIsChanged(Boolean isChanged) {
        this.isChanged = isChanged;
    }

    public Integer getPrintCount() {
        return printCount;
    }

    public void setPrintCount(Integer printCount) {
        this.printCount = printCount;
    }

    public Boolean getPayStatus() {
        return payStatus;
    }

    public void setPayStatus(Boolean payStatus) {
        this.payStatus = payStatus;
    }

    public String getExt() {
        return ext;
    }

    public void setExt(String ext) {
        this.ext = ext == null ? null : ext.trim();
    }
}