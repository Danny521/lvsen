package com.lvsen.modules.business.mapper;

import com.lvsen.modules.business.pojo.OrderCategory;
import com.lvsen.modules.business.pojo.OrderCategoryExample;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface OrderCategoryMapper {
    int countByExample(OrderCategoryExample example);

    int deleteByExample(OrderCategoryExample example);

    int deleteByPrimaryKey(Integer id);

    int insert(OrderCategory record);

    int insertSelective(OrderCategory record);

    List<OrderCategory> selectByExample(OrderCategoryExample example);

    OrderCategory selectByPrimaryKey(Integer id);

    int updateByExampleSelective(@Param("record") OrderCategory record, @Param("example") OrderCategoryExample example);

    int updateByExample(@Param("record") OrderCategory record, @Param("example") OrderCategoryExample example);

    int updateByPrimaryKeySelective(OrderCategory record);

    int updateByPrimaryKey(OrderCategory record);
}