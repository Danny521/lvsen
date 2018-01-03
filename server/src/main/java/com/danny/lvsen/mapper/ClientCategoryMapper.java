package com.danny.lvsen.mapper;

import com.danny.lvsen.pojo.ClientCategory;
import com.danny.lvsen.pojo.ClientCategoryExample;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface ClientCategoryMapper {
    long countByExample(ClientCategoryExample example);

    int deleteByExample(ClientCategoryExample example);

    int deleteByPrimaryKey(Integer id);

    int insert(ClientCategory record);

    int insertSelective(ClientCategory record);

    List<ClientCategory> selectByExample(ClientCategoryExample example);

    ClientCategory selectByPrimaryKey(Integer id);

    int updateByExampleSelective(@Param("record") ClientCategory record, @Param("example") ClientCategoryExample example);

    int updateByExample(@Param("record") ClientCategory record, @Param("example") ClientCategoryExample example);

    int updateByPrimaryKeySelective(ClientCategory record);

    int updateByPrimaryKey(ClientCategory record);
}