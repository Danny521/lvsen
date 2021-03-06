package com.danny.web.controller;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.danny.commons.utils.ApiResponseInfo;
import com.danny.commons.utils.SystemConfig;
import com.danny.web.vo.UserVo;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

@RestController
@Api(tags = { "商品单位" })
@RequestMapping({ "/unit" })
public class UnitController extends BaseController {
    private static Logger logger = LoggerFactory.getLogger(UnitController.class);

    @ApiOperation(value = "获取商品单位列表", httpMethod = "GET", notes = "获取全部商品单位的列表")
	@GetMapping(path = "/list")
	@ResponseBody
	public ApiResponseInfo list(HttpServletRequest request) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());

		return res;
	}

	@ApiOperation(value = "添加商品单位信息", httpMethod = "POST", notes = "添加商品单位的详细信息")
	@PostMapping(path = "/add")
	@ResponseBody
	public ApiResponseInfo add(HttpServletRequest request, @ApiParam UserVo user) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());

		return res;
	}

	@ApiOperation(value = "修改商品单位信息", httpMethod = "POST", notes = "修改商品单位的详细信息")
	@PostMapping(path = "/edit")
	@ResponseBody
	public ApiResponseInfo edit(HttpServletRequest request, @ApiParam UserVo user) {

		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		return res;
	}

	@ApiOperation(value = "获取商品单位详细信息", httpMethod = "GET", notes = "根据指定ID获取商品单位的详细信息")
	@GetMapping(path = "/{id}")
	@ResponseBody
	public ApiResponseInfo get(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "商品单位ID", required = true) Integer id) {
		// TODO
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());

		res.data.put("userInfo", new UserVo());
		return res;
	}
}