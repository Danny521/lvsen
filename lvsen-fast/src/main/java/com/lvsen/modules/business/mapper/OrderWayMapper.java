package com.lvsen.modules.business.mapper;

import com.lvsen.modules.business.pojo.OrderWay;
import com.lvsen.modules.business.pojo.OrderWayExample;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface OrderWayMapper {
    int countByExample(OrderWayExample example);

    int deleteByExample(OrderWayExample example);

    int deleteByPrimaryKey(Integer id);

    int insert(OrderWay record);

    int insertSelective(OrderWay record);

    List<OrderWay> selectByExample(OrderWayExample example);

    OrderWay selectByPrimaryKey(Integer id);

    int updateByExampleSelective(@Param("record") OrderWay record, @Param("example") OrderWayExample example);

    int updateByExample(@Param("record") OrderWay record, @Param("example") OrderWayExample example);

    int updateByPrimaryKeySelective(OrderWay record);

    int updateByPrimaryKey(OrderWay record);
}