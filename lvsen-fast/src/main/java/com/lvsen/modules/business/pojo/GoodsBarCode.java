package com.lvsen.modules.business.pojo;

public class GoodsBarCode {
    private Integer id;

    private Integer goodsId;

    private String barCode;

    private Integer goodsUnitId;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getGoodsId() {
        return goodsId;
    }

    public void setGoodsId(Integer goodsId) {
        this.goodsId = goodsId;
    }

    public String getBarCode() {
        return barCode;
    }

    public void setBarCode(String barCode) {
        this.barCode = barCode == null ? null : barCode.trim();
    }

    public Integer getGoodsUnitId() {
        return goodsUnitId;
    }

    public void setGoodsUnitId(Integer goodsUnitId) {
        this.goodsUnitId = goodsUnitId;
    }
}