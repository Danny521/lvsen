package io.renren.modules.business.service;

import java.util.List;

import io.renren.modules.business.entity.GoodsCategoryVo;
import io.renren.modules.business.entity.GoodsVo;

public interface IGoodsService {

    public void addGoodsInfo(GoodsVo goodsVo);

    public void editGoodsInfo(GoodsVo goodsVo);

    public List<GoodsVo> getGoodsList(String key, Integer categoryId, String place, Boolean isScan, String code, Integer currentPage, Integer pageSize,
            Integer status);

    public List<GoodsCategoryVo> getGoodsCategoryList(String key, Integer currentPage, Integer pageSize, Integer status);
}
