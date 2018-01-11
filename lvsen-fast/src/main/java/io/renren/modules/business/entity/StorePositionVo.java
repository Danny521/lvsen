package io.renren.modules.business.entity;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@ApiModel(value = "库位对象", description = "库位的详细信息")
public class StorePositionVo {
    private Integer id;
    
    @ApiModelProperty(value = "库位编号", required= true)
    private String positionNumber;
    
    @ApiModelProperty(value = "仓库ID", required= true)
    private Integer warehouseId;

    @ApiModelProperty(value = "分区号", required= true)
    private String area;
    
    @ApiModelProperty(value = "行号", required= true)
    private Integer row;
    
    @ApiModelProperty(value = "层号", required= true)
    private Integer layer;

    @ApiModelProperty(value = "位置号", required= true)
    private Integer place;

    @ApiModelProperty(value = "状态(0-禁用,1-启用)", required= true)
    private Boolean status;

}