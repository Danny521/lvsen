package com.danny.web.vo;

import io.swagger.annotations.ApiModelProperty;

public class BillVo {
	@ApiModelProperty(hidden=true)
    private Long id;

    @ApiModelProperty(value = "客户ID", position = 1)
    private Integer clientId;

    @ApiModelProperty(value = "单据ID", position = 2)
    private Long orderId;

    @ApiModelProperty(value = "应付金额", position = 3)
    private Float payableAmount;

    @ApiModelProperty(value = "已付金额", position = 4)
    private Float paidAmount;

    @ApiModelProperty(value = "状态(0-禁用，1-启用)", allowableValues="0,1")
    private Boolean status;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getClientId() {
        return clientId;
    }

    public void setClientId(Integer clientId) {
        this.clientId = clientId;
    }

    public Long getOrderIdId() {
        return orderId;
    }

    public void setOrderIdId(Long orderId) {
        this.orderId = orderId;
    }

    public Float getPayableAmount() {
        return payableAmount;
    }

    public void setPayableAmount(Float payableAmount) {
        this.payableAmount = payableAmount;
    }

    public Float getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(Float paidAmount) {
        this.paidAmount = paidAmount;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }
}