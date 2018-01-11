package io.renren.modules.business.controller;

import javax.servlet.http.HttpServletRequest;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import io.renren.common.utils.R;
import io.renren.modules.business.entity.UserVo;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

@RestController
@Api(tags = { "用户" })
@RequestMapping({ "/system/user" })
public class UserController extends BaseController {

	@ApiOperation(value = "获取用户列表", httpMethod = "GET", notes = "获取全部用户的列表")
	@GetMapping(path = "/list")
	@ResponseBody
	public R list(HttpServletRequest request,
			@ApiParam(name = "key", value = "用户名称", required = false) String key,
			@ApiParam(name = "currentPage", value = "当前页码", required = false) Integer currentPage,
			@ApiParam(name = "pageSize", value = "每页数量", required = false) Integer pageSize,
			@ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") Integer status) {
		

		return R.ok();
	}

	@ApiOperation(value = "添加用户信息", httpMethod = "POST", notes = "添加用户的详细信息")
	@PostMapping(path = "/add")
	@ResponseBody
	public R add(HttpServletRequest request, @ApiParam UserVo user) {
		

		return R.ok();
	}

	@ApiOperation(value = "修改用户信息", httpMethod = "POST", notes = "修改用户的详细信息")
	@PostMapping(path = "/edit")
	@ResponseBody
	public R edit(HttpServletRequest request, @ApiParam UserVo user) {

		
		return R.ok();
	}

	@ApiOperation(value = "获取用户详细信息", httpMethod = "GET", notes = "根据指定ID获取用户的详细信息")
	@GetMapping(path = "/{id}")
	@ResponseBody
	public R get(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "用户ID", required = true) Integer id) {
		// TODO
		
		return R.ok();
	}

}