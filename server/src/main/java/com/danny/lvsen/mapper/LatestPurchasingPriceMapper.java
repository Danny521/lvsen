package com.danny.lvsen.mapper;

import com.danny.lvsen.pojo.LatestPurchasingPrice;
import com.danny.lvsen.pojo.LatestPurchasingPriceExample;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface LatestPurchasingPriceMapper {
    long countByExample(LatestPurchasingPriceExample example);

    int deleteByExample(LatestPurchasingPriceExample example);

    int deleteByPrimaryKey(Long id);

    int insert(LatestPurchasingPrice record);

    int insertSelective(LatestPurchasingPrice record);

    List<LatestPurchasingPrice> selectByExample(LatestPurchasingPriceExample example);

    LatestPurchasingPrice selectByPrimaryKey(Long id);

    int updateByExampleSelective(@Param("record") LatestPurchasingPrice record, @Param("example") LatestPurchasingPriceExample example);

    int updateByExample(@Param("record") LatestPurchasingPrice record, @Param("example") LatestPurchasingPriceExample example);

    int updateByPrimaryKeySelective(LatestPurchasingPrice record);

    int updateByPrimaryKey(LatestPurchasingPrice record);
}