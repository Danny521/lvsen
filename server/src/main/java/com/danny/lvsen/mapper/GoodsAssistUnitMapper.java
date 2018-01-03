package com.danny.lvsen.mapper;

import com.danny.lvsen.pojo.GoodsAssistUnit;
import com.danny.lvsen.pojo.GoodsAssistUnitExample;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface GoodsAssistUnitMapper {
    long countByExample(GoodsAssistUnitExample example);

    int deleteByExample(GoodsAssistUnitExample example);

    int deleteByPrimaryKey(Integer id);

    int insert(GoodsAssistUnit record);

    int insertSelective(GoodsAssistUnit record);

    List<GoodsAssistUnit> selectByExample(GoodsAssistUnitExample example);

    GoodsAssistUnit selectByPrimaryKey(Integer id);

    int updateByExampleSelective(@Param("record") GoodsAssistUnit record, @Param("example") GoodsAssistUnitExample example);

    int updateByExample(@Param("record") GoodsAssistUnit record, @Param("example") GoodsAssistUnitExample example);

    int updateByPrimaryKeySelective(GoodsAssistUnit record);

    int updateByPrimaryKey(GoodsAssistUnit record);
}