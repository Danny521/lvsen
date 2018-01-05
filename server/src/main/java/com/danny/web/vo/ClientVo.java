package com.danny.web.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;

@ApiModel(value = "客户对象", description = "客户的详细信息")
public class ClientVo {
    @ApiModelProperty(hidden = true)
    private Integer id;
    
    @ApiModelProperty(value = "客户编号", hidden = true)
    private String clientNumber;
    
    @ApiModelProperty(value = "客户类别ID", required = true)
    private Integer categoryId;
    
    @ApiModelProperty(value = "客户类别名称(如:超市,网吧等)", required = true)
    private Integer categoryName;

    @ApiModelProperty(value = "客户名称", required = true)
    private String name;

    @ApiModelProperty(value = "客户地址")
    private String address;

    @ApiModelProperty(value = "状态(0-禁用，1-启用)", allowableValues="0,1")
    private Boolean status;

    @ApiModelProperty(value = "客户联系电话")
    private String phone;

    @ApiModelProperty(value = "客户联系电话2")
    private String phone2;

    @ApiModelProperty(value = "客户范畴(1-供货商，2-营销商)", allowableValues="1,2", required = true)
    private String type;
    
    @ApiModelProperty(value = "备注信息")
    private String remark;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getClientNumber() {
        return clientNumber;
    }

    public void setClientNumber(String clientNumber) {
        this.clientNumber = clientNumber == null ? null : clientNumber.trim();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name == null ? null : name.trim();
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address == null ? null : address.trim();
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone == null ? null : phone.trim();
    }

    public String getPhone2() {
        return phone2;
    }

    public void setPhone2(String phone2) {
        this.phone2 = phone2 == null ? null : phone2.trim();
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type == null ? null : type.trim();
    }

    public Integer getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }

    public Integer getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(Integer categoryName) {
        this.categoryName = categoryName;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}