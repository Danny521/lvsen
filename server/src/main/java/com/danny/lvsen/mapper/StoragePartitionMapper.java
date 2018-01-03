package com.danny.lvsen.mapper;

import com.danny.lvsen.pojo.StoragePartition;
import com.danny.lvsen.pojo.StoragePartitionExample;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface StoragePartitionMapper {
    long countByExample(StoragePartitionExample example);

    int deleteByExample(StoragePartitionExample example);

    int deleteByPrimaryKey(Integer id);

    int insert(StoragePartition record);

    int insertSelective(StoragePartition record);

    List<StoragePartition> selectByExample(StoragePartitionExample example);

    StoragePartition selectByPrimaryKey(Integer id);

    int updateByExampleSelective(@Param("record") StoragePartition record, @Param("example") StoragePartitionExample example);

    int updateByExample(@Param("record") StoragePartition record, @Param("example") StoragePartitionExample example);

    int updateByPrimaryKeySelective(StoragePartition record);

    int updateByPrimaryKey(StoragePartition record);
}