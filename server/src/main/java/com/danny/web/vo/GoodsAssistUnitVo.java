package com.danny.web.vo;

public class GoodsAssistUnitVo {
    private Integer id;

    private Integer goodsId;

    private String assistUnit;

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

    public String getAssistUnit() {
        return assistUnit;
    }

    public void setAssistUnit(String assistUnit) {
        this.assistUnit = assistUnit == null ? null : assistUnit.trim();
    }
}