package io.renren.modules.business.entity;

import java.util.Map;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@ApiModel(value="商品价格种类对象", description = "商品价格种类信息")
public class GoodsUnitVo {
    @ApiModelProperty(hidden = true)
    private Integer id;

    @ApiModelProperty(value = "商品ID", required = true)
    private Integer goodsId;
    
    @ApiModelProperty(value = "商品单位名称", required = true)
    private String unitName;
    
    @ApiModelProperty(value = "商品单位等级", required = true)
    private String unitLevel;

    @ApiModelProperty(value = "当前单位的下级单位数量,如果是最小单位则为1")
    private Integer capacity;
    
    @ApiModelProperty(value = "客户种类ID")
    private Integer clientCategoryId;

    @ApiModelProperty(value = "单位商品最低价格")
    private Float min_Price;
    
    @ApiModelProperty(value = "单位商品销售价格")
    private Float sale_Price;
    
    @ApiModelProperty(value = "单位商品重量")
    private Float weight;
    
    @ApiModelProperty(value = "单位商品体积")
    private Float volume;

    @ApiModelProperty(value = "是否(0-不扫描，1-扫描)")
    private Boolean isScan;
    
    @ApiModelProperty(value = "其它价格信息")
    private Map<Integer, Float> extraPrice;

}