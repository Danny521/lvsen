package com.lvsen.modules.business.controller;

import com.lvsen.common.utils.R;
import com.lvsen.common.annotation.SysLog;
import com.lvsen.modules.business.entity.ClientVo;
import com.lvsen.modules.business.service.IClientService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.apache.commons.collections.map.HashedMap;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@Api(tags = { "客户" })
@RequestMapping({ "/client" })
public class ClientController extends BaseController {
	
	@Resource
	private IClientService clientService;

	@ApiOperation(value = "获取客户列表", httpMethod = "GET", notes = "获取全部客户的列表")
	@GetMapping(path = "/list")
	@ResponseBody
	public R list(HttpServletRequest request,
				  @ApiParam(name = "key", value = "客户名称", required = false) String key,
				  @ApiParam(name = "type", value = "客户范畴(1-供货商,2-营销商)", required = false) Integer type,
				  @ApiParam(name = "categoryId", value = "客户分类ID(如:超市,网吧等)", required = false) Integer categoryId,
				  @ApiParam(name = "currentPage", value = "当前页码", required = false) Integer currentPage,
				  @ApiParam(name = "pageSize", value = "每页数量", required = false) Integer pageSize,
				  @ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") Integer status) {
		@SuppressWarnings("unchecked")
		Map<String, Object> param = new HashedMap();
    	param.put("key", key);
    	param.put("type", type);
    	param.put("categoryId", categoryId);
    	param.put("currentPage", currentPage);
    	param.put("pageSize", pageSize);
    	param.put("status", status);
    	List<ClientVo> clientList = clientService.getClientList(param);
		return R.ok().putList(clientList);
	}

	@ApiOperation(value = "添加客户信息", httpMethod = "POST", notes = "添加客户的详细信息")
	@PostMapping(path = "/add")
	@ResponseBody
	@SysLog("添加客户信息")
	public R add(HttpServletRequest request, @ApiParam ClientVo client) {
    	clientService.save(client);
		return R.ok();
	}

	@ApiOperation(value = "修改客户信息", httpMethod = "POST", notes = "修改客户的详细信息")
	@PostMapping(path = "/edit")
	@SysLog("修改客户信息")
	@ResponseBody
	public R edit(HttpServletRequest request, @ApiParam ClientVo client) {
		clientService.update(client);
		return R.ok();
	}

	@ApiOperation(value = "获取客户详细信息", httpMethod = "GET", notes = "根据指定ID获取客户的详细信息")
	@GetMapping(path = "/{id}")
	@ResponseBody
	public R get(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "客户ID", required = true) Integer id) {
		ClientVo client = clientService.getClientInfo(id);
		return R.ok().putData(client);
	}

}