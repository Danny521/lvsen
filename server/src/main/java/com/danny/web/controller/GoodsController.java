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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.danny.commons.utils.ApiResponseInfo;
import com.danny.web.vo.GoodsCategoryVo;
import com.danny.web.vo.GoodsUnitVo;
import com.danny.web.vo.GoodsVo;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

@RestController
@Api(tags = { "商品" })
@RequestMapping({ "/goods" })
public class GoodsController extends BaseController{
    private static Logger logger = LoggerFactory.getLogger(GoodsController.class);

    @ApiOperation(value = "获取(查找)商品列表", httpMethod = "GET", notes = "获取全部商品的列表")
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
    
    @ApiOperation(value = "获取全部库存商品种类列表", httpMethod = "GET", notes = "获取全部库存商品种类列表")
    @GetMapping(path = "/repertory/category/list")
    @ResponseBody
    public ApiResponseInfo listRepertoryCategory(HttpServletRequest request,
    		@ApiParam(name = "key", value = "任意关键字", required = false) String key,
            @ApiParam(name = "currentPage", value = "当前页码", required = false) @RequestParam Integer currentPage,
            @ApiParam(name = "pageSize", value = "每页数量", required = false) @RequestParam Integer pageSize,
            @ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") @RequestParam Integer status) {
    	// TODO
    	ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
    	return res;
    }
    
    @ApiOperation(value = "获取库存指定商品种类的商品列表", httpMethod = "GET", notes = "获取库存指定商品种类的商品列表")
    @GetMapping(path = "/repertory/category/{id}/goodslist")
    @ResponseBody
    public ApiResponseInfo listRepertoryCategoryGoods(HttpServletRequest request, 
			@PathVariable @ApiParam(name = "id", value = "商品种类ID", required = true) Integer id,
            @ApiParam(name = "currentPage", value = "当前页码", required = false) @RequestParam Integer currentPage,
            @ApiParam(name = "pageSize", value = "每页数量", required = false) @RequestParam Integer pageSize,
            @ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") @RequestParam Integer status) {
    	// TODO
    	ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
    	return res;
    }
    
    @ApiOperation(value = "获取库存指定商品的详情", httpMethod = "GET", notes = "获取库存指定商品的详情")
    @GetMapping(path = "/repertory/goods/{id}")
    @ResponseBody
    public ApiResponseInfo getRepertoryCategoryGoods(HttpServletRequest request, 
    		@PathVariable @ApiParam(name = "id", value = "商品ID", required = true) Integer id) {
    	// TODO
    	ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
    	return res;
    }

    @ApiOperation(value = "搜索商品列表", httpMethod = "GET", notes = "根据关键字搜索商品的列表")
    @GetMapping(path = "/search")
    @ResponseBody
    public ApiResponseInfo search(HttpServletRequest request, @ApiParam(name = "key", value = "商品名称关键字", required = false) String key,
            @ApiParam(name = "currentPage", value = "当前页码", required = false) @RequestParam Integer currentPage,
            @ApiParam(name = "pageSize", value = "每页数量", required = false) @RequestParam Integer pageSize,
            @ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") @RequestParam Integer status) {
        // TODO
        ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
        return res;
    }

    @ApiOperation(value = "添加商品信息", httpMethod = "POST", notes = "添加商品的详细信息")
    @PostMapping(path = "/add")
    @ResponseBody
    public ApiResponseInfo addGoods(HttpServletRequest request, @ApiParam GoodsVo goods) {

        ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
        return res;
    }

    @ApiOperation(value = "修改商品信息", httpMethod = "POST", notes = "修改商品的详细信息")
    @PostMapping(path = "/edit/{id}")
    @ResponseBody
    public ApiResponseInfo editGoods(HttpServletRequest request, @PathVariable @ApiParam(name = "id", value = "商品ID", required = true) Integer id,
            @ApiParam GoodsVo goods) {

        ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
        return res;
    }

    @ApiOperation(value = "获取商品详细信息", httpMethod = "GET", notes = "根据指定ID获取商品的详细信息", response = GoodsVo.class)
    @GetMapping(path = "/{id}")
    @ResponseBody
    public ApiResponseInfo getGoods(HttpServletRequest request, @PathVariable @ApiParam(name = "id", value = "商品ID", required = true, type="Integer") @RequestParam Integer id) {
        // TODO
        ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
        res.data.put("goodsInfo", new GoodsVo());
        return res;
    }

    @ApiOperation(value = "删除商品", httpMethod = "DELETE", notes = "根据指定ID删除商品")
    @DeleteMapping(path = "/{id}")
    @ResponseBody
    public ApiResponseInfo deleteGoods(HttpServletRequest request, @PathVariable @ApiParam(name = "id", value = "商品ID", required = true) Integer id) {
        ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
        // TODO
        return res;
    }
    
    @ApiOperation(value = "列举所有商品种类的列表", httpMethod = "GET", notes = "列举所有商品种类的列表")
    @GetMapping(path = "/category/list")
    @ResponseBody
    public ApiResponseInfo getCategoryList(HttpServletRequest request,
    		@ApiParam(name = "key", value = "任意关键字", required = false) String key,
            @ApiParam(name = "currentPage", value = "当前页码", required = false) @RequestParam Integer currentPage,
            @ApiParam(name = "pageSize", value = "每页数量", required = false) @RequestParam Integer pageSize,
            @ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") @RequestParam Integer status) {
    	ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
    	// TODO
    	return res;
    }
    
    @ApiOperation(value = "添加商品种类信息", httpMethod = "POST", notes = "添加商品种类信息")
    @PostMapping(path = "/category/add")
    @ResponseBody
    public ApiResponseInfo addGoodsCategory(HttpServletRequest request, @ApiParam GoodsCategoryVo goodsCategory) {
    	ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
    	// TODO
    	return res;
    }
    @ApiOperation(value = "编辑商品种类信息", httpMethod = "POST", notes = "编辑商品种类的信息")
    @PostMapping(path = "/category/edit/{id}")
    @ResponseBody
    public ApiResponseInfo editGoodsCategory(HttpServletRequest request, @ApiParam GoodsCategoryVo goodsCategory,
    		@PathVariable @ApiParam(name = "id", value = "商品ID", required = true) Integer id) {
    	ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
    	// TODO
    	return res;
    }
    
    @ApiOperation(value = "获取商品种类的详情", httpMethod = "GET", notes = "获取商品种类的详情")
    @GetMapping(path = "/category/{id}")
    @ResponseBody
    public ApiResponseInfo getCategory(HttpServletRequest request, @PathVariable @ApiParam(name = "id", value = "商品种类ID", required = true) Integer id) {
    	ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
    	// TODO
    	return res;
    }
    
    
    @ApiOperation(value = "列举商品所有价格种类的列表", httpMethod = "GET", notes = "列举商品所有价格种类的列表")
    @GetMapping(path = "/price/category/list")
    @ResponseBody
    public ApiResponseInfo getGoodsPriceCategoryList(HttpServletRequest request,
    		@ApiParam(name = "key", value = "任意关键字", required = false) String key,
            @ApiParam(name = "currentPage", value = "当前页码", required = false) @RequestParam Integer currentPage,
            @ApiParam(name = "pageSize", value = "每页数量", required = false) @RequestParam Integer pageSize,
            @ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") @RequestParam Integer status) {
    	ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
    	// TODO
    	return res;
    }
    
    @ApiOperation(value = "添加商品价格种类信息", httpMethod = "POST", notes = "添加商品价格种类信息")
    @PostMapping(path = "/price/category/add")
    @ResponseBody
    public ApiResponseInfo addGoodsPriceCategory(HttpServletRequest request, @ApiParam GoodsUnitVo goodsUnit) {
    	ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
    	// TODO
    	return res;
    }
    @ApiOperation(value = "编辑商品价格种类信息", httpMethod = "POST", notes = "编辑商品价格种类的信息")
    @PostMapping(path = "/price/category/edit/{id}")
    @ResponseBody
    public ApiResponseInfo editGoodsPriceCategory(HttpServletRequest request, @ApiParam GoodsUnitVo goodsUnit,
    		@PathVariable @ApiParam(name = "id", value = "商品ID", required = true) Integer id) {
    	ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
    	// TODO
    	return res;
    }
    
    @ApiOperation(value = "获取商品价格种类的商品列表", httpMethod = "GET", notes = "获取商品价格种类的详情")
    @GetMapping(path = "/price/category/{id}")
    @ResponseBody
    public ApiResponseInfo listPriceCategoryGoods(HttpServletRequest request, @PathVariable @ApiParam(name = "id", value = "商品价格种类ID", required = true) Integer id) {
    	ApiResponseInfo res = new ApiResponseInfo(HttpStatus.OK.value(), HttpStatus.OK.name());
    	// TODO
    	return res;
    }

}