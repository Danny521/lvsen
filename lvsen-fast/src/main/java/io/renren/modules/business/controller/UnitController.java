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
@Api(tags = { "商品单位" })
@RequestMapping({ "/unit" })
public class UnitController extends BaseController {

    @ApiOperation(value = "获取商品单位列表", httpMethod = "GET", notes = "获取全部商品单位的列表")
	@GetMapping(path = "/list")
	@ResponseBody
	public R list(HttpServletRequest request) {
		

		return R.ok();
	}

	@ApiOperation(value = "添加商品单位信息", httpMethod = "POST", notes = "添加商品单位的详细信息")
	@PostMapping(path = "/add")
	@ResponseBody
	public R add(HttpServletRequest request, @ApiParam UserVo user) {
		

		return R.ok();
	}

	@ApiOperation(value = "修改商品单位信息", httpMethod = "POST", notes = "修改商品单位的详细信息")
	@PostMapping(path = "/edit")
	@ResponseBody
	public R edit(HttpServletRequest request, @ApiParam UserVo user) {

		
		return R.ok();
	}

	@ApiOperation(value = "获取商品单位详细信息", httpMethod = "GET", notes = "根据指定ID获取商品单位的详细信息")
	@GetMapping(path = "/{id}")
	@ResponseBody
	public R get(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "商品单位ID", required = true) Integer id) {
		// TODO
		

		return R.ok();
	}
}