package com.lvsen.modules.business.mapper;

import com.lvsen.modules.business.pojo.GoodsUnit;
import com.lvsen.modules.business.pojo.GoodsUnitExample;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface GoodsUnitMapper {
    int countByExample(GoodsUnitExample example);

    int deleteByExample(GoodsUnitExample example);

    int deleteByPrimaryKey(Integer id);

    int insert(GoodsUnit record);

    int insertSelective(GoodsUnit record);

    List<GoodsUnit> selectByExample(GoodsUnitExample example);

    GoodsUnit selectByPrimaryKey(Integer id);

    int updateByExampleSelective(@Param("record") GoodsUnit record, @Param("example") GoodsUnitExample example);

    int updateByExample(@Param("record") GoodsUnit record, @Param("example") GoodsUnitExample example);

    int updateByPrimaryKeySelective(GoodsUnit record);

    int updateByPrimaryKey(GoodsUnit record);
}