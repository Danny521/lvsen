package io.renren.modules.business.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import io.renren.common.annotation.SysLog;
import io.renren.common.utils.PageUtils;
import io.renren.common.utils.Query;
import io.renren.common.utils.R;
import io.renren.modules.business.entity.StorePositionVo;
import io.renren.modules.business.entity.WarehouseVo;
import io.renren.modules.business.service.IWarehouseService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

@RestController
@Api(tags = { "仓库" })
@RequestMapping({ "/warehouse" })
public class WarehouseController extends BaseController {
	
	private IWarehouseService warehouseService;

	@ApiOperation(value = "获取仓库列表", httpMethod = "GET", notes = "获取全部仓库的列表")
	@GetMapping(path = "/list")
	@ResponseBody
	public R list(HttpServletRequest request,
			@ApiParam(value = "任意关键字") @RequestParam(value = "key", required = false)  String key,
			@ApiParam(value = "当前页码") @RequestParam(value = "currentPage", required = false) Integer currentPage,
			@ApiParam(value = "每页数量") @RequestParam(value = "pageSize", required = false) Integer pageSize,
			@ApiParam(value = "状态",defaultValue = "1") @RequestParam(value = "status", required = false) Integer status) {
		
	    Map<String, Object> params = new HashMap<>();
        params.put("page", currentPage);
        params.put("limit", pageSize);
//        if(!isAdmin()){
//            params.put("status", 1);
//        }else{
//            params.put("status", status);
//        }
        if(!StringUtils.isBlank(key)){
            params.put("key", key);
        }
        //查询列表数据
        Query query = new Query(params);
        List<WarehouseVo> userList = warehouseService.queryList(query);
        int total = warehouseService.queryTotal(query);
        PageUtils pageUtil = new PageUtils(userList, total, query.getLimit(), query.getPage());
        return R.ok().putData(pageUtil);
	}

	@ApiOperation(value = "添加仓库信息", httpMethod = "POST", notes = "添加仓库的详细信息")
	@SysLog("添加仓库信息")
	@PostMapping(path = "/add")
	@ResponseBody
	public R add(HttpServletRequest request,
			@ApiParam(name = "name", value = "仓库名称", required = true) String name,
			@ApiParam(name = "address", value = "仓库地址", required = false) String address,
			@ApiParam(name = "manager", value = "仓库管理员", required = false) Integer manager,
			@ApiParam(name = "capacity", value = "仓库容量", required = false) String capacity,
			@ApiParam(name = "remark", value = "备注说明", required = false) String remark,
			@ApiParam(name = "status", value = "仓库状态", required = false) String status) {
		
		return R.ok();
	}

	@ApiOperation(value = "修改仓库信息", httpMethod = "POST", notes = "修改仓库的详细信息")
	@SysLog("修改仓库信息")
	@PostMapping(path = "/edit/{id}")
	@ResponseBody
	public R edit(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "仓库ID", required = true) Integer id,
			@ApiParam(name = "name", value = "仓库名称", required = true) String name,
			@ApiParam(name = "address", value = "仓库地址", required = false) String address,
			@ApiParam(name = "manager", value = "仓库管理员", required = false) Integer manager,
			@ApiParam(name = "capacity", value = "仓库容量", required = false) String capacity,
			@ApiParam(name = "remark", value = "备注说明", required = false) String remark,
			@ApiParam(name = "status", value = "仓库状态", required = false) String status) {
		
		// TODO
		return R.ok();
	}

	@ApiOperation(value = "获取仓库详细信息", httpMethod = "GET", notes = "根据指定ID获取仓库的详细信息")
	@GetMapping(path = "/{id}")
	@ResponseBody
	public R get(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "仓库ID", required = true) Integer id) {
		
		// TODO
		return R.ok();
	}

	@ApiOperation(value = "获取仓库库存货物的详细信息", httpMethod = "GET", notes = "根据ID获取指定仓库库存货物的详细信息")
	@GetMapping(path = "/{id}/goodsList")
	@ResponseBody
	public R getGoods(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "仓库ID", required = true) Integer id) {
		
		// TODO
		return R.ok();
	}

	@ApiOperation(value = "删除仓库", httpMethod = "DELETE", notes = "根据指定ID删除仓库")
	@SysLog("删除仓库")
	@DeleteMapping(path = "/{id}")
	@ResponseBody
	public R delete(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "仓库ID", required = true) Integer id) {
		
		// TODO
		return R.ok();
	}

	@ApiOperation(value = "获取仓库库位列表", httpMethod = "GET", notes = "获取全部仓库库位列表")
	@GetMapping(path = "/storePosition/list")
	@ResponseBody
	public R listStorePosition(HttpServletRequest request,
			@ApiParam(name = "key", value = "任意关键字", required = false) String key,
			@ApiParam(name = "currentPage", value = "当前页码", required = false) Integer currentPage,
			@ApiParam(name = "pageSize", value = "每页数量", required = false) Integer pageSize,
			@ApiParam(name = "status", value = "状态", required = false, defaultValue = "1") Integer status) {
		
		// TODO
		return R.ok();
	}

	@ApiOperation(value = "添加仓库库位信息", httpMethod = "POST", notes = "添加仓库库位的详细信息")
	@SysLog("添加仓库库位信息")
	@PostMapping(path = "/storePosition/add")
	@ResponseBody
	public R addStorePosition(HttpServletRequest request,
			@ApiParam StorePositionVo StorePosition) {
		
		// TODO
		return R.ok();
	}

	@ApiOperation(value = "修改仓库库位信息", httpMethod = "POST", notes = "修改仓库库位的详细信息")
	@SysLog("修改仓库库位信息")
	@PostMapping(path = "/storePosition/edit/{id}")
	@ResponseBody
	public R editStorePosition(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "仓库库位ID", required = true) Integer id,
			@ApiParam StorePositionVo StorePosition) {
		
		// TODO
		return R.ok();
	}

	@ApiOperation(value = "获取仓库库位详细信息", httpMethod = "GET", notes = "根据指定ID获取仓库库位的详细信息")
	@GetMapping(path = "/storePosition/{id}")
	@ResponseBody
	public R getStorePosition(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "仓库库位ID", required = true) Integer id) {
		
		// TODO
		return R.ok();
	}

	@ApiOperation(value = "获取仓库库位的商品", httpMethod = "GET", notes = "根据ID获取指定仓库库位的商品")
	@GetMapping(path = "/storePosition/{id}/goods")
	@ResponseBody
	public R getStorePositionGoods(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "仓库库位ID", required = true) Integer id) {
		
		// TODO
		return R.ok();
	}

	@ApiOperation(value = "删除仓库库位", httpMethod = "DELETE", notes = "根据指定ID删除仓库库位")
	@SysLog("删除仓库库位")
	@DeleteMapping(path = "/storePosition/{id}")
	@ResponseBody
	public R deleteStorePosition(HttpServletRequest request,
			@PathVariable @ApiParam(name = "id", value = "仓库库位ID", required = true) Integer id) {
		
		// TODO
		return R.ok();
	}

}