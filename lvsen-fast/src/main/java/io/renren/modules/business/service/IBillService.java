package io.renren.modules.business.service;

import java.util.List;
import java.util.Map;

import io.renren.modules.business.entity.BillVo;

public interface IBillService {

	List<BillVo> getBillList(Map<String, Object> param);

	BillVo getBillInfo(Integer id);
	
}
