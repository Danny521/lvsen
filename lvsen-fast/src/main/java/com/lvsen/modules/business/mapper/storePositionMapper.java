package com.lvsen.modules.business.mapper;

import com.lvsen.modules.business.pojo.storePosition;
import com.lvsen.modules.business.pojo.storePositionExample;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface storePositionMapper {
    int countByExample(storePositionExample example);

    int deleteByExample(storePositionExample example);

    int deleteByPrimaryKey(Integer id);

    int insert(storePosition record);

    int insertSelective(storePosition record);

    List<storePosition> selectByExample(storePositionExample example);

    storePosition selectByPrimaryKey(Integer id);

    int updateByExampleSelective(@Param("record") storePosition record, @Param("example") storePositionExample example);

    int updateByExample(@Param("record") storePosition record, @Param("example") storePositionExample example);

    int updateByPrimaryKeySelective(storePosition record);

    int updateByPrimaryKey(storePosition record);
}