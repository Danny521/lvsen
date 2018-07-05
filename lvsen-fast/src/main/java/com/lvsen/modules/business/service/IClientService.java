package com.lvsen.modules.business.service;

import com.lvsen.modules.business.entity.ClientVo;

import java.util.List;
import java.util.Map;

public interface IClientService {

	List<ClientVo> getClientList(Map<String, Object> param);

	void save(ClientVo client);

	void update(ClientVo client);

	ClientVo getClientInfo(Integer id);

}
