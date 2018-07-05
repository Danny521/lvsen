package com.lvsen.modules.business.service.impl;

import com.lvsen.modules.business.entity.ClientVo;
import com.lvsen.modules.business.service.IClientService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service("clientService")
public class ClientService implements IClientService {

	@Override
	public List<ClientVo> getClientList(Map<String, Object> param) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void save(ClientVo client) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void update(ClientVo client) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public ClientVo getClientInfo(Integer id) {
		// TODO Auto-generated method stub
		return null;
	}

}
