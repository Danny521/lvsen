package com.danny.web.controller;

import java.util.List;

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

@RestController
@Api(tags = { "单据" })
@RequestMapping({ "/order" })
public class OrderController extends BaseController {
	private static Logger logger = LoggerFactory.getLogger(OrderController.class);

	@ApiOperation(value = "获取单据列表", httpMethod = "GET", notes = "获取全部单据的列表")
	@GetMapping(path = "/list")
	@ResponseBody
	public ApiResponseInfo list(HttpServletRequest request,
			@ApiParam(name = "key", value = "任意关键字", required = false) String key,
			@ApiParam(name = "beginTime", value = "起始时间", required = false) String beginTime,
			@ApiParam(name = "endTime", value = "截止时间", required = false) String endTime,
			@ApiParam(name = "number", value = "单据编号", required = false) String number,
			@ApiParam(name = "categoryId", value = "所属分类ID", required = false) Integer categoryId,
			@ApiParam(name = "place", value = "摆放位置(库位编号)", required = false) String place,
			@ApiParam(name = "isScan", value = "是否扫描", required = false) Boolean isScan,
			@ApiParam(name = "code", value = "条形码", required = false) String code,
			@ApiParam(name = "currentPage", value = "当前页码", required = false) Integer currentPage,
			@ApiParam(name = "pageSize", value = "每页数量", required = false) Integer pageSize,
			@ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") Integer status) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}

	@ApiOperation(value = "添加进货订单单据信息", httpMethod = "POST", notes = "添加单据的详细信息")
	@PostMapping(path = "/add")
	@ResponseBody
	public ApiResponseInfo add(HttpServletRequest request,
			@ApiParam(name = "clientId", value = "客户ID", required = true) Integer clientId,
			@ApiParam(name = "discount", value = "整单折扣", required = false, defaultValue="1") Float discount,
			@ApiParam(name = "digest", value = "摘要信息", required = false) String digest,
			@ApiParam(name = "storageId", value = "收货仓库ID", required = false) Integer storageId,
			@ApiParam(name = "comment", value = "备注说明", required = true) String comment,
			@ApiParam(name = "deliveryDate", value = "交货日期", required = true) String deliveryDate,
			@ApiParam(name = "goodsList", value = "商品列表", required = true) List<OrderGoodsVo> goodsList) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}

	@ApiOperation(value = "修改单据信息", httpMethod = "POST", notes = "修改单据的详细信息")
	@PostMapping(path = "/edit/{id}")
	@ResponseBody
	public ApiResponseInfo edit(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "单据ID", required = true) Long id,
			@ApiParam(name = "clientId", value = "客户ID", required = true) Integer clientId,
			@ApiParam(name = "discount", value = "整单折扣", required = false, defaultValue="1") Float discount,
			@ApiParam(name = "digest", value = "摘要信息", required = false) String digest,
			@ApiParam(name = "storageId", value = "收货仓库ID", required = false) Integer storageId,
			@ApiParam(name = "comment", value = "备注说明", required = true) String comment,
			@ApiParam(name = "deliveryDate", value = "交货日期", required = true) String deliveryDate,
			@ApiParam(name = "goodsList", value = "商品列表", required = true) List<OrderGoodsVo> goodsList) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}

	@ApiOperation(value = "获取单据详细信息", httpMethod = "GET", notes = "根据指定ID获取单据的详细信息")
	@GetMapping(path = "/{id}")
	@ResponseBody
	public ApiResponseInfo get(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "单据ID", required = true) Long id) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}

	@ApiOperation(value = "删除单据", httpMethod = "DELETE", notes = "根据指定ID删除单据")
	@DeleteMapping(path = "/{id}")
	@ResponseBody
	public ApiResponseInfo delete(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "单据ID", required = true) Long id) {
		ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
		// TODO
		return res;
	}

}