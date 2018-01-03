package com.danny.lvsen.pojo;

public class GoodsBarCode {
    private Integer id;

    private Integer goodsId;

    private String code;

    private Integer uintId;

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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code == null ? null : code.trim();
    }

    public Integer getUintId() {
        return uintId;
    }

    public void setUintId(Integer uintId) {
        this.uintId = uintId;
    }
}