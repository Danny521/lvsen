package com.lvsen.modules.business.service;

import com.lvsen.modules.business.entity.GoodsCategoryVo;
import com.lvsen.modules.business.entity.GoodsVo;

import java.util.List;

public interface IGoodsService {

    public void addGoodsInfo(GoodsVo goodsVo);

    public void editGoodsInfo(GoodsVo goodsVo);

    public List<GoodsVo> getGoodsList(String key, Integer categoryId, String place, Boolean isScan, String code, Integer currentPage, Integer pageSize,
            Integer status);

    public List<GoodsCategoryVo> getGoodsCategoryList(String key, Integer currentPage, Integer pageSize, Integer status);
}
