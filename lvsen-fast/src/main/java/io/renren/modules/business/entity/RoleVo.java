package io.renren.modules.business.entity;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@ApiModel(value = "角色对象", description = "角色的详细信息")
public class RoleVo {
	@ApiModelProperty(hidden = true)
	private Integer id;

	@ApiModelProperty(value = "角色名称", required = true)
	private String roleName;

	@ApiModelProperty(value = "角色编码")
	private String roleCode;

	@ApiModelProperty(value = "角色状态")
	private Boolean roleStatus;

	@ApiModelProperty(value = "角色备注")
	private String remark;
	
	@ApiModelProperty(value = "角色功能项")
	private Integer[] menus;
}