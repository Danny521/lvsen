package com.lvsen.modules.business.entity;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@ApiModel(value="商品分类对象", description = "商品分类信息")
public class GoodsCategoryVo {
    @ApiModelProperty(hidden = true)
    private Integer id;

    @ApiModelProperty(value = "商品分类名称", required = true)
    private String name;

    @ApiModelProperty(value = "商品分类父节点ID")
    private Integer parentId;
    
    @ApiModelProperty(value = "商品分类排序")
    private Integer sort;

    @ApiModelProperty(value = "商品分类父节点ID")
    private Boolean status;
    
    @ApiModelProperty(value = "商品分类备注说明")
    private Integer remark;

}