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
import com.danny.web.vo.OrderGoodsVo;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

@RestController
@Api(tags = { "仓库" })
@RequestMapping({ "/storage" })
public class StorageController extends BaseController {
	private static Logger logger = LoggerFactory.getLogger(StorageController.class);

	@ApiOperation(value = "获取仓库列表", httpMethod = "GET", notes = "获取全部仓库的列表")
	@GetMapping(path = "/list")
	@ResponseBody
	public ApiResponseInfo list(HttpServletRequest request,
			@ApiParam(name = "key", value = "任意关键字", required = false) String key,
			@ApiParam(name = "currentPage", value = "当前页码", required = false) Integer currentPage,
			@ApiParam(name = "pageSize", value = "每页数量", required = false) Integer pageSize,
			@ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") Integer status) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}

	@ApiOperation(value = "添加仓库信息", httpMethod = "POST", notes = "添加仓库的详细信息")
	@PostMapping(path = "/add")
	@ResponseBody
	public ApiResponseInfo add(HttpServletRequest request,
			@ApiParam(name = "name", value = "仓库名称", required = true) String name,
			@ApiParam(name = "address", value = "仓库地址", required = false) String address,
			@ApiParam(name = "manager", value = "仓库管理员", required = false) Integer manager,
			@ApiParam(name = "capacity", value = "仓库容量", required = true) String capacity,
			@ApiParam(name = "remark", value = "备注说明", required = true) String remark,
			@ApiParam(name = "status", value = "仓库状态", required = true) String status) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}

	@ApiOperation(value = "修改仓库信息", httpMethod = "POST", notes = "修改仓库的详细信息")
	@PostMapping(path = "/edit/{id}")
	@ResponseBody
	public ApiResponseInfo edit(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "仓库ID", required = true) Long id,
			@ApiParam(name = "name", value = "仓库名称", required = true) String name,
            @ApiParam(name = "address", value = "仓库地址", required = false) String address,
            @ApiParam(name = "manager", value = "仓库管理员", required = false) Integer manager,
            @ApiParam(name = "capacity", value = "仓库容量", required = true) String capacity,
            @ApiParam(name = "remark", value = "备注说明", required = true) String remark,
            @ApiParam(name = "status", value = "仓库状态", required = true) String status) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}

	@ApiOperation(value = "获取仓库详细信息", httpMethod = "GET", notes = "根据指定ID获取仓库的详细信息")
	@GetMapping(path = "/{id}")
	@ResponseBody
	public ApiResponseInfo get(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "仓库ID", required = true) Long id) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}
	
	@ApiOperation(value = "获取仓库库存货物的详细信息", httpMethod = "GET", notes = "根据ID获取指定仓库库存货物的详细信息")
	@GetMapping(path = "/{id}/goodsList")
	@ResponseBody
	public ApiResponseInfo getGoods(HttpServletRequest request,
	        @PathVariable @ApiParam(name = "id", value = "仓库ID", required = true) Long id) {
	    ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
	    // TODO
	    return res;
	}

	@ApiOperation(value = "删除仓库", httpMethod = "DELETE", notes = "根据指定ID删除仓库")
	@DeleteMapping(path = "/{id}")
	@ResponseBody
	public ApiResponseInfo delete(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "仓库ID", required = true) Long id) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}

}