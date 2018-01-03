package com.danny.lvsen.mapper;

import com.danny.lvsen.pojo.GoodsPriceCatetory;
import com.danny.lvsen.pojo.GoodsPriceCatetoryExample;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface GoodsPriceCatetoryMapper {
    long countByExample(GoodsPriceCatetoryExample example);

    int deleteByExample(GoodsPriceCatetoryExample example);

    int deleteByPrimaryKey(Integer id);

    int insert(GoodsPriceCatetory record);

    int insertSelective(GoodsPriceCatetory record);

    List<GoodsPriceCatetory> selectByExample(GoodsPriceCatetoryExample example);

    GoodsPriceCatetory selectByPrimaryKey(Integer id);

    int updateByExampleSelective(@Param("record") GoodsPriceCatetory record, @Param("example") GoodsPriceCatetoryExample example);

    int updateByExample(@Param("record") GoodsPriceCatetory record, @Param("example") GoodsPriceCatetoryExample example);

    int updateByPrimaryKeySelective(GoodsPriceCatetory record);

    int updateByPrimaryKey(GoodsPriceCatetory record);
}