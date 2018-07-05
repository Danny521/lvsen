package com.lvsen.modules.business.service;

import com.lvsen.modules.business.entity.BillVo;

import java.util.List;
import java.util.Map;

public interface IBillService {

	List<BillVo> getBillList(Map<String, Object> param);

	BillVo getBillInfo(Integer id);
	
}
