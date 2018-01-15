package io.renren.modules.business.service;

import java.util.List;
import java.util.Map;

import io.renren.modules.business.entity.ClientVo;

public interface IClientService {

	List<ClientVo> getClientList(Map<String, Object> param);

	void save(ClientVo client);

	void update(ClientVo client);

	ClientVo getClientInfo(Integer id);

}
