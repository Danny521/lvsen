package com.lvsen.modules.business.service.impl;

import com.lvsen.modules.business.entity.GoodsCategoryVo;
import com.lvsen.modules.business.entity.GoodsVo;
import com.lvsen.modules.business.service.IGoodsService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service("goodsService")
public class GoodsService implements IGoodsService {

    @Override
    public void addGoodsInfo(GoodsVo goodsVo) {
        // TODO Auto-generated method stub
        
    }

    @Override
    public void editGoodsInfo(GoodsVo goodsVo) {
        // TODO Auto-generated method stub
        
    }

    @Override
    public List<GoodsVo> getGoodsList(String key, Integer categoryId, String place, Boolean isScan, String code, Integer currentPage, Integer pageSize,
            Integer status) {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public List<GoodsCategoryVo> getGoodsCategoryList(String key, Integer currentPage, Integer pageSize, Integer status) {
        // TODO Auto-generated method stub
        return null;
    }

}
