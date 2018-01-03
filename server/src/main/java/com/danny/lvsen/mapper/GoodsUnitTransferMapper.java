package com.danny.lvsen.mapper;

import com.danny.lvsen.pojo.GoodsUnitTransfer;
import com.danny.lvsen.pojo.GoodsUnitTransferExample;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface GoodsUnitTransferMapper {
    long countByExample(GoodsUnitTransferExample example);

    int deleteByExample(GoodsUnitTransferExample example);

    int deleteByPrimaryKey(Integer id);

    int insert(GoodsUnitTransfer record);

    int insertSelective(GoodsUnitTransfer record);

    List<GoodsUnitTransfer> selectByExample(GoodsUnitTransferExample example);

    GoodsUnitTransfer selectByPrimaryKey(Integer id);

    int updateByExampleSelective(@Param("record") GoodsUnitTransfer record, @Param("example") GoodsUnitTransferExample example);

    int updateByExample(@Param("record") GoodsUnitTransfer record, @Param("example") GoodsUnitTransferExample example);

    int updateByPrimaryKeySelective(GoodsUnitTransfer record);

    int updateByPrimaryKey(GoodsUnitTransfer record);
}