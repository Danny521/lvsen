package com.danny.web.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@ApiModel(value = "菜单对象", description = "菜单的详细信息")
public class MenuVo {
	@ApiModelProperty(hidden = true)
    private Integer id;

	@ApiModelProperty(value = "菜单编码")
    private String menuCode;

	@ApiModelProperty(value = "菜单名称", required = true)
    private String menuName;

	@ApiModelProperty(value = "菜单排序序号", required = true)
    private Integer menuOrder;

	@ApiModelProperty(value = "菜单父节点", required = true)
    private Integer parentId;

	@ApiModelProperty(value = "菜单URL", required = true)
    private String menuUrl;

	@ApiModelProperty(value = "菜单状态", required = true)
    private Boolean menuStatus;
}