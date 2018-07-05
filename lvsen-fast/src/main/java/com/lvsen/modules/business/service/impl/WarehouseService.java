package com.lvsen.modules.business.service.impl;

import com.lvsen.common.utils.Query;
import com.lvsen.modules.business.entity.WarehouseVo;
import com.lvsen.modules.business.service.IWarehouseService;
import org.springframework.stereotype.Service;

import java.util.List;

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
