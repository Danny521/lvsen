package io.renren.modules.business.service;

import java.util.List;

import io.renren.common.utils.Query;
import io.renren.modules.business.entity.WarehouseVo;

public interface IWarehouseService {

    List<WarehouseVo> queryList(Query query);

    int queryTotal(Query query);

}
