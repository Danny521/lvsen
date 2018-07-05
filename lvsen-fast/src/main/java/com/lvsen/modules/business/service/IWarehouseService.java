package com.lvsen.modules.business.service;

import com.lvsen.common.utils.Query;
import com.lvsen.modules.business.entity.WarehouseVo;

import java.util.List;

public interface IWarehouseService {

    List<WarehouseVo> queryList(Query query);

    int queryTotal(Query query);

}
