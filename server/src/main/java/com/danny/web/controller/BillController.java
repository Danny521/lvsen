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
import com.danny.commons.utils.SystemConfig;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;

@RestController
@Api(tags = { "账单" })
@RequestMapping({ "/bill" })
public class BillController {
	private static Logger logger = LoggerFactory.getLogger(BillController.class);

	@ApiOperation(value = "获取全部账单列表", notes = "获取全部账单的列表")
	@GetMapping(path = "/all")
	@ResponseBody
	public ApiResponseInfo all(HttpServletRequest request) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}

	@ApiOperation(value = "获取账单列表", notes = "获取全部账单的列表")
	@ApiImplicitParams({ @ApiImplicitParam(name = "key", value = "账单名称", required = false, dataType = "String"),
			@ApiImplicitParam(name = "number", value = "账单编号", required = false, dataType = "String"),
			@ApiImplicitParam(name = "categoryId", value = "所属分类ID", required = false, dataType = "Integer"),
			@ApiImplicitParam(name = "place", value = "摆放位置(库位编号)", required = false, dataType = "String"),
			@ApiImplicitParam(name = "isScan", value = "是否扫描", required = false, dataType = "String"),
			@ApiImplicitParam(name = "code", value = "条形码", required = false, dataType = "String"),
			@ApiImplicitParam(name = "currentPage", value = "当前页码", required = false, dataType = "Integer"),
			@ApiImplicitParam(name = "pageSize", value = "每页数量", required = false, dataType = "Integer"),
			@ApiImplicitParam(name = "status", value = "状态", required = false, defaultValue = "1", dataType = "Integer") })
	@GetMapping(path = "/list")
	@ResponseBody
	public ApiResponseInfo list(HttpServletRequest request) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}

	@ApiOperation(value = "搜索账单列表", notes = "根据关键字搜索账单的列表")
	@ApiImplicitParams({ @ApiImplicitParam(name = "key", value = "账单名称关键字", required = false, dataType = "String"),
			@ApiImplicitParam(name = "currentPage", value = "当前页码", required = false, dataType = "Integer"),
			@ApiImplicitParam(name = "pageSize", value = "每页数量", required = false, dataType = "Integer"),
			@ApiImplicitParam(name = "status", value = "状态", required = false, defaultValue = "1", dataType = "Integer") })
	@GetMapping(path = "/search")
	@ResponseBody
	public ApiResponseInfo search(HttpServletRequest request) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}

	@ApiOperation(value = "添加账单信息", notes = "添加新增账单的详细信息")
	@ApiImplicitParams({ @ApiImplicitParam(name = "name", value = "账单名称", required = true, dataType = "String"),
			@ApiImplicitParam(name = "number", value = "账单编号", required = true, dataType = "String"),
			@ApiImplicitParam(name = "categoryId", value = "所属分类ID", required = true, dataType = "Integer"),
			@ApiImplicitParam(name = "spec", value = "规格描述", required = false, dataType = "String"),
			@ApiImplicitParam(name = "unit", value = "最小单位", required = true, dataType = "String"),
			@ApiImplicitParam(name = "defaultUnitID", value = "默认交易单位ID", required = true, dataType = "Integer"),
			@ApiImplicitParam(name = "place", value = "摆放位置(库位编号)", required = true, dataType = "String"),
			@ApiImplicitParam(name = "isScan", value = "是否扫描", required = true, dataType = "String"),
			@ApiImplicitParam(name = "code", value = "条形码", required = true, dataType = "String"),
			@ApiImplicitParam(name = "weight", value = "重量(单位:kg)", required = true, dataType = "Float"),
			@ApiImplicitParam(name = "volume", value = "体积(单位:立方米)", required = true, dataType = "Float") })
	@PostMapping(path = "/add")
	@ResponseBody
	public ApiResponseInfo add(HttpServletRequest request) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		//TODO
		return res;
	}

	@ApiOperation(value = "修改账单信息", notes = "修改新增账单的详细信息")
	@ApiImplicitParams({
			@ApiImplicitParam(name = "id", value = "账单ID", required = true, dataType = "Integer", paramType = "path"),
			@ApiImplicitParam(name = "name", value = "账单名称", required = true, dataType = "String"),
			@ApiImplicitParam(name = "number", value = "账单编号", required = true, dataType = "String"),
			@ApiImplicitParam(name = "categoryId", value = "所属分类ID", required = true, dataType = "Integer"),
			@ApiImplicitParam(name = "spec", value = "规格描述", required = false, dataType = "String"),
			@ApiImplicitParam(name = "unit", value = "最小单位", required = true, dataType = "String"),
			@ApiImplicitParam(name = "defaultUnitID", value = "默认交易单位ID", required = true, dataType = "Integer"),
			@ApiImplicitParam(name = "place", value = "摆放位置(库位编号)", required = true, dataType = "String"),
			@ApiImplicitParam(name = "isScan", value = "是否扫描", required = true, dataType = "String"),
			@ApiImplicitParam(name = "code", value = "条形码", required = true, dataType = "String"),
			@ApiImplicitParam(name = "weight", value = "重量(单位:kg)", required = true, dataType = "Float"),
			@ApiImplicitParam(name = "volume", value = "体积(单位:立方米)", required = true, dataType = "Float"),
			@ApiImplicitParam(name = "status", value = "状态(0-禁用，1-启用)", required = false, defaultValue="1", dataType = "Integer")})
	@PostMapping(path = "/edit/{id}")
	@ResponseBody
	public ApiResponseInfo edit(HttpServletRequest request) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		//TODO
		return res;
	}

	@ApiOperation(value = "获取账单详细信息", notes = "根据指定ID获取账单的详细信息")
	@ApiImplicitParam(name = "id", value = "账单ID", required = true, dataType = "Integer", paramType = "path")
	@GetMapping(path = "/{id}")
	@ResponseBody
	public ApiResponseInfo get(HttpServletRequest request) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}

}