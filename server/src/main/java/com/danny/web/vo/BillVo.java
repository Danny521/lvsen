package com.danny.web.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;

@ApiModel(value = "账单对象", description = "账单的详细信息")
public class BillVo {
    @ApiModelProperty(hidden = true)
    private Long id;

    @ApiModelProperty(value = "客户ID", position = 1, required = true)
    private Integer clientId;

    @ApiModelProperty(value = "单据ID", position = 2, required = true)
    private Long orderId;

    @ApiModelProperty(value = "应付金额", position = 3, required = true)
    private Float payableAmount;

    @ApiModelProperty(value = "已付金额", position = 4)
    private Float paidAmount;

    @ApiModelProperty(value = "结算状态(0-未完成，1-已完成)", allowableValues = "0,1")
    private Boolean status;

    @ApiModelProperty(value = "生成时间", hidden = true)
    private String createTime;

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