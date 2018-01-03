package com.danny.web.controller;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.danny.commons.utils.ApiResponseInfo;
import com.danny.lvsen.pojo.User;
import com.danny.web.vo.UserVo;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

@RestController
@Api(tags = { "用户" })
@RequestMapping({ "/user" })
public class UserController {
	private static Logger logger = LoggerFactory.getLogger(UserController.class);

	@ApiOperation(value = "获取用户列表", notes = "获取全部用户的列表")
	@ApiImplicitParams({ @ApiImplicitParam(name = "key", value = "用户名称", required = false, dataType = "String"),
			@ApiImplicitParam(name = "currentPage", value = "当前页码", required = false, dataType = "Integer"),
			@ApiImplicitParam(name = "pageSize", value = "每页数量", required = false, dataType = "Integer"),
			@ApiImplicitParam(name = "status", value = "状态", required = false, defaultValue = "1", dataType = "Integer") })
	@GetMapping(path = "/list")
	@ResponseBody
	public ApiResponseInfo list(HttpServletRequest request) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());

		return res;
	}

	@ApiOperation(value = "添加用户信息", notes = "添加新增用户的详细信息")
	@ApiImplicitParams({ @ApiImplicitParam(name = "name", value = "用户名称", required = true, dataType = "String"),
			@ApiImplicitParam(name = "account", value = "帐号", required = true, dataType = "String"),
			@ApiImplicitParam(name = "password", value = "密码", required = true, dataType = "String"),
			@ApiImplicitParam(name = "phone", value = "电话", required = true, dataType = "String"),
			@ApiImplicitParam(name = "birthday", value = "生日", required = false, dataType = "String"),
			@ApiImplicitParam(name = "jobDesc", value = "工作描述", required = false, dataType = "String"),
			@ApiImplicitParam(name = "phone2", value = "备用电话", required = false, dataType = "String"),
			@ApiImplicitParam(name = "department", value = "部门", required = false, dataType = "String") })
	@PostMapping(path = "/add")
	@ResponseBody
	public ApiResponseInfo add(HttpServletRequest request, @ApiParam UserVo user) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());

		return res;
	}
//	@ApiOperation(value = "添加用户信息", notes = "添加新增用户的详细信息")
//	@ApiImplicitParams({ @ApiImplicitParam(name = "name", value = "用户名称", required = true, dataType = "String"),
//		@ApiImplicitParam(name = "account", value = "帐号", required = true, dataType = "String"),
//		@ApiImplicitParam(name = "password", value = "密码", required = true, dataType = "String"),
//		@ApiImplicitParam(name = "phone", value = "电话", required = true, dataType = "String"),
//		@ApiImplicitParam(name = "birthday", value = "生日", required = false, dataType = "String"),
//		@ApiImplicitParam(name = "jobDesc", value = "工作描述", required = false, dataType = "String"),
//		@ApiImplicitParam(name = "phone2", value = "备用电话", required = false, dataType = "String"),
//		@ApiImplicitParam(name = "department", value = "部门", required = false, dataType = "String") })
//	@PostMapping(path = "/add")
//	@ResponseBody
//	public ApiResponseInfo add(HttpServletRequest request) {
//		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
//		
//		return res;
//	}

	@ApiOperation(value = "修改用户信息", notes = "修改新增用户的详细信息")
	@ApiImplicitParams({
			@ApiImplicitParam(name = "id", value = "用户ID", required = true, dataType = "Integer", paramType = "path"),
			@ApiImplicitParam(name = "name", value = "用户名称", required = true, dataType = "String"),
			@ApiImplicitParam(name = "account", value = "帐号", required = true, dataType = "String"),
			@ApiImplicitParam(name = "password", value = "密码", required = true, dataType = "String"),
			@ApiImplicitParam(name = "phone", value = "电话", required = true, dataType = "String"),
			@ApiImplicitParam(name = "birthday", value = "生日", required = false, dataType = "String"),
			@ApiImplicitParam(name = "jobDesc", value = "工作描述", required = false, dataType = "String"),
			@ApiImplicitParam(name = "phone2", value = "备用电话", required = false, dataType = "String"),
			@ApiImplicitParam(name = "department", value = "部门", required = false, dataType = "String"),
			@ApiImplicitParam(name = "status", value = "状态(0-禁用，1-启用)", required = false, defaultValue="1", dataType = "Integer") })
	@PostMapping(path = "/edit/{id}")
	@ResponseBody
	public ApiResponseInfo edit(HttpServletRequest request, @ApiParam UserVo user) {

		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		return res;
	}
//	
//	@ApiOperation(value = "修改用户信息", notes = "修改新增用户的详细信息")
//	@ApiImplicitParams({
//		@ApiImplicitParam(name = "id", value = "用户ID", required = true, dataType = "Integer", paramType = "path"),
//		@ApiImplicitParam(name = "name", value = "用户名称", required = true, dataType = "String"),
//		@ApiImplicitParam(name = "account", value = "帐号", required = true, dataType = "String"),
//		@ApiImplicitParam(name = "password", value = "密码", required = true, dataType = "String"),
//		@ApiImplicitParam(name = "phone", value = "电话", required = true, dataType = "String"),
//		@ApiImplicitParam(name = "birthday", value = "生日", required = false, dataType = "String"),
//		@ApiImplicitParam(name = "jobDesc", value = "工作描述", required = false, dataType = "String"),
//		@ApiImplicitParam(name = "phone2", value = "备用电话", required = false, dataType = "String"),
//		@ApiImplicitParam(name = "department", value = "部门", required = false, dataType = "String"),
//		@ApiImplicitParam(name = "status", value = "状态(0-禁用，1-启用)", required = false, defaultValue="1", dataType = "Integer") })
//	@PostMapping(path = "/edit/{id}")
//	@ResponseBody
//	public ApiResponseInfo edit(HttpServletRequest request) {
//		
//		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
//		return res;
//	}

	@ApiOperation(value = "获取用户详细信息", notes = "根据指定ID获取用户的详细信息")
	@ApiImplicitParam(name = "id", value = "用户ID", required = true, dataType = "Integer", paramType = "path")
	@GetMapping(path = "/{id}")
	@ResponseBody
	public ApiResponseInfo get(HttpServletRequest request) {
		// TODO
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		
		res.data.put("userInfo", new User());
		return res;
	}

}