package com.danny.web.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@ApiModel(value = "仓库对象", description = "仓库的详细信息")
public class WarehousesVo {
    private Integer id;

    @ApiModelProperty(value = "仓库名称", required = true)
    private String name;

    @ApiModelProperty(value = "仓库地址", required = true)
    private String address;

    @ApiModelProperty(value = "仓库管理员")
    private String manager;

    @ApiModelProperty(value = "仓库状态")
    private Integer status;

    @ApiModelProperty(value = "仓库容量")
    private String capacity;

    @ApiModelProperty(value = "备注信息")
    private String remark;
}