package io.renren.modules.business.entity;

import java.util.Date;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@ApiModel(value = "单据对象", description = "单据的详细信息")
public class OrderVo {
    @ApiModelProperty(hidden = true)
    private Long id;

    @ApiModelProperty(value = "单据编号", position = 1)
    private String number;

    @ApiModelProperty(value = "单据条形码")
    private String code;

    @ApiModelProperty(value = "制单人ID", required= true)
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

    @ApiModelProperty(value = "客户ID", required= true)
    private Integer clientId;

    @ApiModelProperty(value = "单据处理人ID")
    private Integer handleUserId;

    @ApiModelProperty(value = "整单折扣")
    private Float discount;

    @ApiModelProperty(value = "摘要信息")
    private String digest;

    @ApiModelProperty(value = "收货仓库ID")
    private Integer warehouseId;

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
}