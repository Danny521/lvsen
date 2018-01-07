package com.danny.web.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
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
}