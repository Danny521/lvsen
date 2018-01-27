package io.renren.modules.sys.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Set;

import org.apache.commons.lang.StringUtils;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.renren.common.annotation.SysLog;
import io.renren.common.exception.RRException;
import io.renren.common.utils.Constant.MenuType;
import io.renren.common.utils.R;
import io.renren.modules.sys.entity.SysMenuEntity;
import io.renren.modules.sys.service.ShiroService;
import io.renren.modules.sys.service.SysMenuService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

/**
 * 系统菜单
 * 
 * @author chenshun
 * @email sunlightcs@gmail.com
 * @date 2016年10月27日 下午9:58:15
 */
@Api(tags = { "系统菜单权限管理" })
@RestController
@RequestMapping("/sys/menu")
public class SysMenuController extends AbstractController {
	@Autowired
	private SysMenuService sysMenuService;
	@Autowired
	private ShiroService shiroService;

	/**
	 * 导航菜单
	 */
	@ApiOperation(value = "获取导航菜单", httpMethod = "GET", notes = "获取导航菜单")
	@RequestMapping("/nav")
	public R nav() {
		List<SysMenuEntity> menuList = sysMenuService.getUserMenuList(getUserId());
		Set<String> permissions = shiroService.getUserPermissions(getUserId());
		return R.ok().appendData("menuList", menuList).appendData("permissions", permissions);
	}

	/**
	 * 所有菜单列表
	 */
	@ApiOperation(value = "获取所有菜单列表", httpMethod = "GET", notes = "获取所有菜单列表")
	@RequestMapping("/list")
	@RequiresPermissions("sys:menu:list")
	public R list() {
		List<SysMenuEntity> menuList = sysMenuService.queryList(new HashMap<String, Object>());
		return R.ok().putList(menuList);
	}
	
	/**
	 * 所有菜单列表
	 */
	@ApiOperation(value = "获取所有菜单列表", httpMethod = "GET", notes = "获取所有菜单列表")
	@RequestMapping("/treeList")
	@RequiresPermissions("sys:menu:list")
	public R treeList() {
	    List<SysMenuEntity> menuList = sysMenuService.getTreeList(getUserId());
	    return R.ok().putData(menuList);
	}

	/**
	 * 选择菜单(添加、修改菜单)
	 */
	@ApiOperation(value = "选择菜单(添加、修改菜单)", httpMethod = "GET", notes = "选择菜单(添加、修改菜单)")
	@RequestMapping("/select")
	@RequiresPermissions("sys:menu:select")
	public R select() {
		// 查询列表数据
		List<SysMenuEntity> menuList = sysMenuService.queryNotButtonList();

		// 添加顶级菜单
		SysMenuEntity root = new SysMenuEntity();
		root.setMenuId(0L);
		root.setName("一级菜单");
		root.setParentId(-1L);
		root.setOpen(true);
		menuList.add(root);

		return R.ok().putList(menuList);
	}

	/**
	 * 菜单信息
	 */
	@ApiOperation(value = "获取菜单信息", httpMethod = "GET", notes = "获取菜单信息", response = SysMenuEntity.class)
	@RequestMapping("/info/{menuId}")
	@RequiresPermissions("sys:menu:info")
	public R info(@PathVariable("menuId") Long menuId) {
		SysMenuEntity menu = sysMenuService.queryObject(menuId);
		return R.ok().appendData("menu", menu);
	}

	/**
     * 保存
     */
    @ApiOperation(value = "保存菜单", httpMethod = "POST", notes = "保存菜单")
    @SysLog("保存菜单")
    @RequestMapping("/save")
    @RequiresPermissions("sys:menu:save")
    public R save( SysMenuEntity menu) {
        // 数据校验
        verifyForm(menu);
        sysMenuService.save(menu);
        return R.ok();
    }

	/**
	 * 修改
	 */
	@ApiOperation(value = "修改菜单", httpMethod = "POST", notes = "修改菜单")
	@SysLog("修改菜单")
	@RequestMapping("/update")
	@RequiresPermissions("sys:menu:update")
	public R update( SysMenuEntity menu) {
		// 数据校验
		verifyForm(menu);

		sysMenuService.update(menu);

		return R.ok();
	}

	/**
	 * 删除
	 */
	@ApiOperation(value = "删除菜单", httpMethod = "GET", notes = "删除菜单")
	@SysLog("删除菜单")
	@RequestMapping("/delete")
	@RequiresPermissions("sys:menu:delete")
	public R delete(long menuId) {
		// 判断是否有子菜单或按钮
		List<SysMenuEntity> menuList = sysMenuService.queryListParentId(menuId);
		if (menuList.size() > 0) {
			return R.error("请先删除子菜单或按钮");
		}

		sysMenuService.deleteBatch(new Long[] { menuId });

		return R.ok();
	}

	/**
	 * 验证参数是否正确
	 */
	private void verifyForm(SysMenuEntity menu) {
		if (StringUtils.isBlank(menu.getName())) {
			throw new RRException("菜单名称不能为空");
		}

		if (menu.getParentId() == null) {
			throw new RRException("上级菜单不能为空");
		}

		// 菜单
		if (menu.getType() == MenuType.MENU.getValue()) {
			if (StringUtils.isBlank(menu.getUrl())) {
				throw new RRException("菜单URL不能为空");
			}
		}

		// 上级菜单类型
		int parentType = MenuType.CATALOG.getValue();
		if (menu.getParentId() != 0) {
			SysMenuEntity parentMenu = sysMenuService.queryObject(menu.getParentId());
			parentType = parentMenu.getType();
		}

		// 目录、菜单
		if (menu.getType() == MenuType.CATALOG.getValue() || menu.getType() == MenuType.MENU.getValue()) {
			if (parentType != MenuType.CATALOG.getValue()) {
				throw new RRException("上级菜单只能为目录类型");
			}
			return;
		}

		// 按钮
		if (menu.getType() == MenuType.BUTTON.getValue()) {
			if (parentType != MenuType.MENU.getValue()) {
				throw new RRException("上级菜单只能为菜单类型");
			}
			return;
		}
	}
}
