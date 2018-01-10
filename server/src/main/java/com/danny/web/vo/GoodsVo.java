package com.danny.web.vo;

import java.util.List;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@ApiModel(value="商品对象", description = "商品信息")
public class GoodsVo {
	@ApiModelProperty(hidden = true)
	private Integer id;
	
	@ApiModelProperty(value = "商品绿森编号", position = 1)
	private String lvsenCode;

	@ApiModelProperty(value = "商品名称", required = true)
	private String name;
	
	@ApiModelProperty(value = "商品别名")
	private String alias;

	@ApiModelProperty(value = "所属分类ID")
	private Integer categoryId;

	@ApiModelProperty(value = "商品规格(比如:1x4x20)")
	private String specification;

	@ApiModelProperty(value = "状态(0-禁用，1-启用)", allowableValues="0,1")
	private Integer status;

	@ApiModelProperty(value = "库位编号")
	private String storePositionNumber;

	@ApiModelProperty(value = "备注信息")
	private String ext;
	
	@ApiModelProperty(value = "计量单位信息列表")
	private List<GoodsUnitVo> goodsUnitList;

}