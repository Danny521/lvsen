package io.renren.modules.business.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import io.renren.common.utils.Query;
import io.renren.modules.business.entity.WarehouseVo;
import io.renren.modules.business.service.IWarehouseService;

@Service("warehouseService")
public class WarehouseService implements IWarehouseService {

    @Override
    public List<WarehouseVo> queryList(Query query) {
        return null;
    }

    @Override
    public int queryTotal(Query query) {
        return 0;
    }

}
