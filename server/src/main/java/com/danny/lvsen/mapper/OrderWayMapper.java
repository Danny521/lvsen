package com.danny.lvsen.mapper;

import com.danny.lvsen.pojo.OrderWay;
import com.danny.lvsen.pojo.OrderWayExample;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface OrderWayMapper {
    long countByExample(OrderWayExample example);

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