package io.renren.modules.business.entity;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@ApiModel(value = "库存商品对象", description = "库存商品的详细信息")
public class RepertoryGoodsVo {

    @ApiModelProperty(value = "商品编码", position = 1)
    private String goodsNumber;

    @ApiModelProperty(value = "商品名称", required = true)
    private String name;

    @ApiModelProperty(value = "所属分类名称", required = true)
    private String categoryName;

    @ApiModelProperty(value = "商品规格(比如:1x4x20)")
    private String specification;

    @ApiModelProperty(value = "商品最小单位价格")
    private Float minPrice;

    @ApiModelProperty(value = "容量")
    private Integer capacity;

    @ApiModelProperty(value = "商品最小单位")
    private String miniUnit;

    @ApiModelProperty(value = "商品默认单位ID")
    private Integer defaultUnitId;

    @ApiModelProperty(value = "库位编号")
    private String storePositionNumber;

    @ApiModelProperty(value = "是否需要扫描", required = true)
    private Boolean isScan;

    @ApiModelProperty(value = "条形码编号")
    private String singleCode;

    @ApiModelProperty(value = "重量(单位:kg)")
    private Float weight;

    @ApiModelProperty(value = "体积(单位:立方米)")
    private Float volume;

    @ApiModelProperty(value = "库存数量")
    private Integer totalNum;

    @ApiModelProperty(value = "成本价格(库存金额除以库存量)")
    private Float costPrice;

    @ApiModelProperty(value = "库存金额")
    private Float money;
    
    @ApiModelProperty(value = "商品排序")
    private Integer sort;

}