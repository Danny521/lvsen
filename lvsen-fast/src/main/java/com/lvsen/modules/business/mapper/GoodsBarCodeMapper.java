package com.lvsen.modules.business.mapper;

import com.lvsen.modules.business.pojo.GoodsBarCode;
import com.lvsen.modules.business.pojo.GoodsBarCodeExample;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface GoodsBarCodeMapper {
    int countByExample(GoodsBarCodeExample example);

    int deleteByExample(GoodsBarCodeExample example);

    int deleteByPrimaryKey(Integer id);

    int insert(GoodsBarCode record);

    int insertSelective(GoodsBarCode record);

    List<GoodsBarCode> selectByExample(GoodsBarCodeExample example);

    GoodsBarCode selectByPrimaryKey(Integer id);

    int updateByExampleSelective(@Param("record") GoodsBarCode record, @Param("example") GoodsBarCodeExample example);

    int updateByExample(@Param("record") GoodsBarCode record, @Param("example") GoodsBarCodeExample example);

    int updateByPrimaryKeySelective(GoodsBarCode record);

    int updateByPrimaryKey(GoodsBarCode record);
}