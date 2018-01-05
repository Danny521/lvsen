package com.danny.web.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;

@ApiModel(value="商品对象", description = "商品信息")
public class GoodsVo {
	@ApiModelProperty(hidden = true)
	private Integer id;
	
	@ApiModelProperty(value = "商品编码", position = 1)
	private String goodsNumber;

	@ApiModelProperty(value = "商品名称", required = true)
	private String name;
	
	@ApiModelProperty(value = "商品别名", required = true)
	private String alias;

	@ApiModelProperty(value = "所属分类ID", required = true)
	private Integer categoryId;

	@ApiModelProperty(value = "商品规格(比如:1x4x20)")
	private String specification;

	@ApiModelProperty(value = "状态(0-禁用，1-启用)", allowableValues="0,1")
	private Integer status;

	@ApiModelProperty(value = "商品最小单位价格", required = true)
	private Float minPrice;

	@ApiModelProperty(value = "容量")
	private Integer capacity;

	@ApiModelProperty(value = "商品最小单位")
	private String miniUnit;

	@ApiModelProperty(value = "商品默认单位ID")
	private Integer defaultUnitId;

	@ApiModelProperty(value = "库位编号")
	private String storagePartitionNumber;

	@ApiModelProperty(value = "是否需要扫描", required = true)
	private Boolean isScan;

	@ApiModelProperty(value = "条形码编号")
	private String singleCode;

	@ApiModelProperty(value = "重量(单位:kg)")
	private Float weight;

	@ApiModelProperty(value = "体积(单位:立方米)")
	private Float volume;

	@ApiModelProperty(value = "备注信息")
	private String ext;

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public String getGoodsNumber() {
		return goodsNumber;
	}

	public void setGoodsNumber(String goodsNumber) {
		this.goodsNumber = goodsNumber == null ? null : goodsNumber.trim();
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name == null ? null : name.trim();
	}

	public Integer getCategoryId() {
		return categoryId;
	}

	public void setCategoryId(Integer categoryId) {
		this.categoryId = categoryId;
	}

	public String getSpecification() {
		return specification;
	}

	public void setSpecification(String specification) {
		this.specification = specification == null ? null : specification.trim();
	}

	public Integer getStatus() {
		return status;
	}

	public void setStatus(Integer status) {
		this.status = status;
	}

	public Float getMinPrice() {
		return minPrice;
	}

	public void setMinPrice(Float minPrice) {
		this.minPrice = minPrice;
	}

	public Integer getCapacity() {
		return capacity;
	}

	public void setCapacity(Integer capacity) {
		this.capacity = capacity;
	}

	public String getMiniUnit() {
		return miniUnit;
	}

	public void setMiniUnit(String miniUnit) {
		this.miniUnit = miniUnit == null ? null : miniUnit.trim();
	}

	public Integer getDefaultUnitId() {
		return defaultUnitId;
	}

	public void setDefaultUnitId(Integer defaultUnitId) {
		this.defaultUnitId = defaultUnitId;
	}

	public String getStoragePartitionNumber() {
		return storagePartitionNumber;
	}

	public void setStoragePartitionNumber(String storagePartitionNumber) {
		this.storagePartitionNumber = storagePartitionNumber == null ? null : storagePartitionNumber.trim();
	}

	public Boolean getIsScan() {
		return isScan;
	}

	public void setIsScan(Boolean isScan) {
		this.isScan = isScan;
	}

	public String getSingleCode() {
		return singleCode;
	}

	public void setSingleCode(String singleCode) {
		this.singleCode = singleCode == null ? null : singleCode.trim();
	}

	public Float getWeight() {
		return weight;
	}

	public void setWeight(Float weight) {
		this.weight = weight;
	}

	public Float getVolume() {
		return volume;
	}

	public void setVolume(Float volume) {
		this.volume = volume;
	}

	public String getExt() {
		return ext;
	}

	public void setExt(String ext) {
		this.ext = ext == null ? null : ext.trim();
	}
}