package io.renren.modules.business.entity;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@ApiModel(value = "单据商品对象", description = "单据商品的详细信息")
public class OrderGoodsVo {
    @ApiModelProperty(hidden = true)
    private Long id;

    @ApiModelProperty(value = "单据编号", position = 1, required = true)
    private Long lvsenCode;

    @ApiModelProperty(value = "客户ID", required = true)
    private Integer clientId;
    
    @ApiModelProperty(value = "商品ID", required = true)
    private Integer goodsId;

    @ApiModelProperty(value = "商品名称")
    private Integer goodsName;
    
    @ApiModelProperty(value = "排序", required = true)
    private Integer sort;

    @ApiModelProperty(value = "单位ID", required = true)
    private Integer goodsUnitId;

    @ApiModelProperty(value = "单位名称")
    private Integer unitName;

    @ApiModelProperty(value = "商品规格")
    private String spec;

    @ApiModelProperty(value = "商品预订数量", required = true)
    private Integer totalNumber;

    @ApiModelProperty(value = "商品实收数量")
    private Integer realNumber;

    @ApiModelProperty(value = "商品单位转换(如1箱=9瓶)")
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
    private String warehouseId;

    @ApiModelProperty(value = "仓库名称")
    private String warehouseName;

    @ApiModelProperty(value = "备注信息")
    private String remark;
}