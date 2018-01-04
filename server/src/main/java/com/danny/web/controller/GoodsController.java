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
import com.danny.web.vo.GoodsVo;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

@RestController
@Api(tags = { "商品" })
@RequestMapping({ "/goods" })
public class GoodsController {
    private static Logger logger = LoggerFactory.getLogger(GoodsController.class);

    @ApiOperation(value = "获取全部商品列表", notes = "获取全部商品的列表")
    @GetMapping(path = "/all")
    @ResponseBody
    public ApiResponseInfo all(HttpServletRequest request) {
        // TODO
        ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
        return res;
    }

    @ApiOperation(value = "获取商品列表", notes = "获取全部商品的列表")
    @GetMapping(path = "/list")
    @ResponseBody
    public ApiResponseInfo list(HttpServletRequest request, @ApiParam(name = "key", value = "商品名称", required = false, format = "") String key,
            @ApiParam(name = "number", value = "商品编号", required = false) String number,
            @ApiParam(name = "categoryId", value = "所属分类ID", required = false) Integer categoryId,
            @ApiParam(name = "place", value = "摆放位置(库位编号)", required = false) String place,
            @ApiParam(name = "isScan", value = "是否扫描", required = false) Boolean isScan, @ApiParam(name = "code", value = "条形码", required = false) String code,
            @ApiParam(name = "currentPage", value = "当前页码", required = false) Integer currentPage,
            @ApiParam(name = "pageSize", value = "每页数量", required = false) Integer pageSize,
            @ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") Integer status) {
        // TODO
        ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
        return res;
    }

    @ApiOperation(value = "搜索商品列表", notes = "根据关键字搜索商品的列表")
    @GetMapping(path = "/search")
    @ResponseBody
    public ApiResponseInfo search(HttpServletRequest request, @ApiParam(name = "key", value = "商品名称关键字", required = false) String key,
            @ApiParam(name = "currentPage", value = "当前页码", required = false) Integer currentPage,
            @ApiParam(name = "pageSize", value = "每页数量", required = false) Integer pageSize,
            @ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") Integer status) {
        // TODO
        ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
        return res;
    }

    @ApiOperation(value = "添加商品信息", notes = "添加新增商品的详细信息")
    @PostMapping(path = "/add")
    @ResponseBody
    public ApiResponseInfo add(HttpServletRequest request, @ApiParam GoodsVo goods) {

        ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
        return res;
    }

    @ApiOperation(value = "修改商品信息", notes = "修改新增商品的详细信息")
    @PostMapping(path = "/edit/{id}")
    @ResponseBody
    public ApiResponseInfo edit(HttpServletRequest request, @PathVariable @ApiParam(name = "id", value = "商品ID", required = true) Integer id,
            @ApiParam GoodsVo goods) {

        ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
        return res;
    }
    // @ApiOperation(value = "修改商品信息", notes = "修改新增商品的详细信息")
    // @ApiParams({
    // @ApiParam(name = "id", value = "商品ID", required = true, dataType =
    // "Integer", paramType = "path"),
    // @ApiParam(name = "name", value = "商品名称", required = true, dataType =
    // "String"),
    // @ApiParam(name = "number", value = "商品编号", required = true, dataType =
    // "String"),
    // @ApiParam(name = "categoryId", value = "所属分类ID", required = true,
    // dataType = "Integer"),
    // @ApiParam(name = "spec", value = "规格描述", required = false, dataType =
    // "String"),
    // @ApiParam(name = "unit", value = "最小单位", required = true, dataType =
    // "String"),
    // @ApiParam(name = "defaultUnitID", value = "默认交易单位ID", required = true,
    // dataType = "Integer"),
    // @ApiParam(name = "capacity", value = "容量(所含个数)", required = false,
    // dataType = "Integer"),
    // @ApiParam(name = "place", value = "摆放位置(库位编号)", required = true, dataType
    // = "String"),
    // @ApiParam(name = "isScan", value = "是否扫描", required = true, dataType =
    // "String"),
    // @ApiParam(name = "code", value = "条形码", required = true, dataType =
    // "String"),
    // @ApiParam(name = "weight", value = "重量(单位:kg)", required = true, dataType
    // = "Float"),
    // @ApiParam(name = "volume", value = "体积(单位:立方米)", required = true,
    // dataType = "Float"),
    // @ApiParam(name = "status", value = "状态(0-禁用，1-启用)", required = false,
    // defaultValue="1", dataType = "Integer")})
    // @PostMapping(path = "/edit/{id}")
    // @ResponseBody
    // public ApiResponseInfo edit(HttpServletRequest request, @PathVariable
    // Integer id) {
    //
    // ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(),
    // HttpStatus.OK.name());
    // return res;
    // }

    @ApiOperation(value = "获取商品详细信息", notes = "根据指定ID获取商品的详细信息")
    @GetMapping(path = "/{id}")
    @ResponseBody
    public ApiResponseInfo get(HttpServletRequest request, @PathVariable @ApiParam(name = "id", value = "商品ID", required = true) Integer id) {
        // TODO
        ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
        res.data.put("goodsInfo", new GoodsVo());
        return res;
    }

    @ApiOperation(value = "删除商品详细信息", notes = "根据指定ID删除商品")
    @DeleteMapping(path = "/{id}")
    @ResponseBody
    public ApiResponseInfo delete(HttpServletRequest request, @PathVariable @ApiParam(name = "id", value = "商品ID", required = true) Integer id) {
        ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
        // TODO
        res.data.put("goodsInfo", new GoodsVo());
        return res;
    }

}