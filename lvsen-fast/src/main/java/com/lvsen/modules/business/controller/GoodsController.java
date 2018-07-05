package com.lvsen.modules.business.controller;

import com.lvsen.common.utils.R;
import com.lvsen.common.annotation.SysLog;
import com.lvsen.modules.business.entity.GoodsCategoryVo;
import com.lvsen.modules.business.entity.GoodsUnitVo;
import com.lvsen.modules.business.entity.GoodsVo;
import com.lvsen.modules.business.service.IGoodsService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

@RestController
@Api(tags = { "商品" })
@RequestMapping({ "/goods" })
public class GoodsController extends BaseController{
	
	private IGoodsService goodsService;

    @ApiOperation(value = "获取(查找)商品列表", httpMethod = "GET", notes = "获取全部商品的列表")
    @GetMapping(path = "/list")
    @ResponseBody
    public R list(HttpServletRequest request, @ApiParam(name = "key", value = "商品名称", required = false, format = "") String key,
                  @ApiParam(name = "categoryId", value = "所属分类ID", required = false) Integer categoryId,
                  @ApiParam(name = "place", value = "摆放位置(库位编号)", required = false) String place,
                  @ApiParam(name = "isScan", value = "是否扫描", required = false) Boolean isScan, @ApiParam(name = "code", value = "条形码", required = false) String code,
                  @ApiParam(name = "currentPage", value = "当前页码", required = false) Integer currentPage,
                  @ApiParam(name = "pageSize", value = "每页数量", required = false) Integer pageSize,
                  @ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") Integer status) {
        // TODO
        
        return R.ok();
    }
    
    @ApiOperation(value = "获取全部库存商品种类列表", httpMethod = "GET", notes = "获取全部库存商品种类列表")
    @GetMapping(path = "/repertory/category/list")
    @ResponseBody
    public R listRepertoryCategory(HttpServletRequest request,
    		@ApiParam(name = "key", value = "任意关键字", required = false) String key,
            @ApiParam(name = "currentPage", value = "当前页码", required = false) @RequestParam Integer currentPage,
            @ApiParam(name = "pageSize", value = "每页数量", required = false) @RequestParam Integer pageSize,
            @ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") @RequestParam Integer status) {
    	// TODO
    	
    	return R.ok();
    }
    
    @ApiOperation(value = "获取库存指定商品种类的商品列表", httpMethod = "GET", notes = "获取库存指定商品种类的商品列表")
    @GetMapping(path = "/repertory/category/{id}/goodslist")
    @ResponseBody
    public R listRepertoryCategoryGoods(HttpServletRequest request, 
			@PathVariable @ApiParam(name = "id", value = "商品种类ID", required = true) Integer id,
            @ApiParam(name = "currentPage", value = "当前页码", required = false) @RequestParam Integer currentPage,
            @ApiParam(name = "pageSize", value = "每页数量", required = false) @RequestParam Integer pageSize,
            @ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") @RequestParam Integer status) {
    	// TODO
    	
    	return R.ok();
    }
    
    @ApiOperation(value = "获取库存指定商品的详情", httpMethod = "GET", notes = "获取库存指定商品的详情")
    @GetMapping(path = "/repertory/goods/{id}")
    @ResponseBody
    public R getRepertoryCategoryGoods(HttpServletRequest request, 
    		@PathVariable @ApiParam(name = "id", value = "商品ID", required = true) Integer id) {
    	// TODO
    	
    	return R.ok();
    }

    @ApiOperation(value = "搜索商品列表", httpMethod = "GET", notes = "根据关键字搜索商品的列表")
    @GetMapping(path = "/search")
    @ResponseBody
    public R search(HttpServletRequest request, @ApiParam(name = "key", value = "商品名称关键字", required = false) String key,
            @ApiParam(name = "currentPage", value = "当前页码", required = false) @RequestParam Integer currentPage,
            @ApiParam(name = "pageSize", value = "每页数量", required = false) @RequestParam Integer pageSize,
            @ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") @RequestParam Integer status) {
        // TODO
        
        return R.ok();
    }

    @ApiOperation(value = "添加商品信息", httpMethod = "POST", notes = "添加商品的详细信息")
    @PostMapping(path = "/add")
    @SysLog("添加商品信息")
    @ResponseBody
    public R addGoods(HttpServletRequest request, @ApiParam GoodsVo goods) {
        
        
        return R.ok();
    }

    @ApiOperation(value = "修改商品信息", httpMethod = "POST", notes = "修改商品的详细信息")
    @SysLog("修改商品信息")
    @PostMapping(path = "/edit/{id}")
    @ResponseBody
    public R editGoods(HttpServletRequest request, @PathVariable @ApiParam(name = "id", value = "商品ID", required = true) Integer id,
            @ApiParam GoodsVo goods) {

        
        return R.ok();
    }

    @ApiOperation(value = "获取商品详细信息", httpMethod = "GET", notes = "根据指定ID获取商品的详细信息", response = GoodsVo.class)
    @GetMapping(path = "/{id}")
    @ResponseBody
    public R getGoods(HttpServletRequest request, @PathVariable @ApiParam(name = "id", value = "商品ID", required = true, type="Integer") @RequestParam Integer id) {
        // TODO
        
        return R.ok();
    }

    @ApiOperation(value = "删除商品", httpMethod = "DELETE", notes = "根据指定ID删除商品")
    @SysLog("删除商品")
    @DeleteMapping(path = "/{id}")
    @ResponseBody
    public R deleteGoods(HttpServletRequest request, @PathVariable @ApiParam(name = "id", value = "商品ID", required = true) Integer id) {
        
        // TODO
        return R.ok();
    }
    
    @ApiOperation(value = "列举所有商品种类的列表", httpMethod = "GET", notes = "列举所有商品种类的列表")
    @GetMapping(path = "/category/list")
    @ResponseBody
    public R getCategoryList(HttpServletRequest request,
    		@ApiParam(name = "key", value = "任意关键字", required = false) String key,
            @ApiParam(name = "currentPage", value = "当前页码", required = false) @RequestParam Integer currentPage,
            @ApiParam(name = "pageSize", value = "每页数量", required = false) @RequestParam Integer pageSize,
            @ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") @RequestParam Integer status) {
    	
    	// TODO
    	return R.ok();
    }
    
    @ApiOperation(value = "添加商品种类信息", httpMethod = "POST", notes = "添加商品种类信息")
    @SysLog("添加商品种类信息")
    @PostMapping(path = "/category/add")
    @ResponseBody
    public R addGoodsCategory(HttpServletRequest request, @ApiParam GoodsCategoryVo goodsCategory) {
    	
    	// TODO
    	return R.ok();
    }
    @ApiOperation(value = "编辑商品种类信息", httpMethod = "POST", notes = "编辑商品种类的信息")
    @SysLog("编辑商品种类信息")
    @PostMapping(path = "/category/edit/{id}")
    @ResponseBody
    public R editGoodsCategory(HttpServletRequest request, @ApiParam GoodsCategoryVo goodsCategory,
    		@PathVariable @ApiParam(name = "id", value = "商品ID", required = true) Integer id) {
    	
    	// TODO
    	return R.ok();
    }
    
    @ApiOperation(value = "获取商品种类的详情", httpMethod = "GET", notes = "获取商品种类的详情")
    @GetMapping(path = "/category/{id}")
    @ResponseBody
    public R getCategory(HttpServletRequest request, @PathVariable @ApiParam(name = "id", value = "商品种类ID", required = true) Integer id) {
    	
    	// TODO
    	return R.ok();
    }
    
    
    @ApiOperation(value = "列举商品所有价格种类的列表", httpMethod = "GET", notes = "列举商品所有价格种类的列表")
    @GetMapping(path = "/price/category/list")
    @ResponseBody
    public R getGoodsPriceCategoryList(HttpServletRequest request,
    		@ApiParam(name = "key", value = "任意关键字", required = false) String key,
            @ApiParam(name = "currentPage", value = "当前页码", required = false) @RequestParam Integer currentPage,
            @ApiParam(name = "pageSize", value = "每页数量", required = false) @RequestParam Integer pageSize,
            @ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") @RequestParam Integer status) {
    	
    	// TODO
    	return R.ok();
    }
    
    @ApiOperation(value = "添加商品价格种类信息", httpMethod = "POST", notes = "添加商品价格种类信息")
    @SysLog("添加商品价格种类信息")
    @PostMapping(path = "/price/category/add")
    @ResponseBody
    public R addGoodsPriceCategory(HttpServletRequest request, @ApiParam GoodsUnitVo goodsUnit) {
    	
    	// TODO
    	return R.ok();
    }
    @ApiOperation(value = "编辑商品价格种类信息", httpMethod = "POST", notes = "编辑商品价格种类的信息")
    @PostMapping(path = "/price/category/edit/{id}")
    @ResponseBody
    public R editGoodsPriceCategory(HttpServletRequest request, @ApiParam GoodsUnitVo goodsUnit,
    		@PathVariable @ApiParam(name = "id", value = "商品ID", required = true) Integer id) {
    	
    	// TODO
    	return R.ok();
    }
    
    @ApiOperation(value = "获取商品价格种类的商品列表", httpMethod = "GET", notes = "获取商品价格种类的详情")
    @GetMapping(path = "/price/category/{id}")
    @ResponseBody
    public R listPriceCategoryGoods(HttpServletRequest request, @PathVariable @ApiParam(name = "id", value = "商品价格种类ID", required = true) Integer id) {
    	
    	// TODO
    	return R.ok();
    }

}