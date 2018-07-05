package com.lvsen.modules.business.mapper;

import com.lvsen.modules.business.pojo.ClientCategory;
import com.lvsen.modules.business.pojo.ClientCategoryExample;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface ClientCategoryMapper {
    int countByExample(ClientCategoryExample example);

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