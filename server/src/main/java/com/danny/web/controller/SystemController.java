package com.danny.web.controller;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.danny.commons.utils.ApiResponseInfo;
import com.danny.web.vo.MenuVo;
import com.danny.web.vo.RoleVo;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

@RestController
@Api(tags = { "系统" })
@RequestMapping({ "/sys" })
public class SystemController extends BaseController {
	private static Logger logger = LoggerFactory.getLogger(SystemController.class);

	@ApiOperation(value = "获取角色列表", httpMethod = "GET", notes = "获取全部角色的列表")
	@GetMapping(path = "/role/list")
	@ResponseBody
	public ApiResponseInfo listRole(HttpServletRequest request) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());

		return res;
	}

	@ApiOperation(value = "添加角色信息", httpMethod = "POST", notes = "添加客户的详细信息")
	@PostMapping(path = "/role/add")
	@ResponseBody
	public ApiResponseInfo addRole(HttpServletRequest request, @ApiParam RoleVo role) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());

		return res;
	}

	@ApiOperation(value = "修改角色信息", httpMethod = "POST", notes = "修改客户的详细信息")
	@PostMapping(path = "/role/edit/{id}")
	@ResponseBody
	public ApiResponseInfo editRole(HttpServletRequest request, @ApiParam RoleVo role,
			@PathVariable @ApiParam(name = "id", value = "角色ID", required = true) Integer id) {

		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		return res;
	}

	@ApiOperation(value = "删除角色", httpMethod = "DELETE", notes = "根据指定ID删除角色")
	@DeleteMapping(path = "/role/{id}")
	@ResponseBody
	public ApiResponseInfo deleteRole(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "角色ID", required = true) Integer id) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}
	
	@ApiOperation(value = "获取指定角色的功能列表", httpMethod = "GET", notes = "获取指定角色的功能列表")
	@GetMapping(path = "role/{id}/menu/list")
	@ResponseBody
	public ApiResponseInfo listMenu(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "角色ID", required = true) Integer id) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		
		return res;
	}
	
	@ApiOperation(value = "获取功能列表", httpMethod = "GET", notes = "获取全部功能的列表")
	@GetMapping(path = "/menu/list")
	@ResponseBody
	public ApiResponseInfo listRoleMenu(HttpServletRequest request) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		
		return res;
	}
	
	@ApiOperation(value = "添加功能信息", httpMethod = "POST", notes = "添加客户的详细信息")
	@PostMapping(path = "/menu/add")
	@ResponseBody
	public ApiResponseInfo addMenu(HttpServletRequest request, @ApiParam MenuVo menu) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		
		return res;
	}
	
	@ApiOperation(value = "修改功能信息", httpMethod = "POST", notes = "修改客户的详细信息")
	@PostMapping(path = "/menu/edit/{id}")
	@ResponseBody
	public ApiResponseInfo editMenu(HttpServletRequest request, @ApiParam MenuVo menu,
			@PathVariable @ApiParam(name = "id", value = "功能ID", required = true) Integer id) {
		
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		return res;
	}
	
	@ApiOperation(value = "删除功能", httpMethod = "DELETE", notes = "根据指定ID删除功能")
	@DeleteMapping(path = "/menu/{id}")
	@ResponseBody
	public ApiResponseInfo deleteMenu(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "功能ID", required = true) Integer id) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}

}