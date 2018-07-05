package com.lvsen.modules.sys.service;

import com.lvsen.common.utils.R;
import com.lvsen.modules.sys.entity.SysUserTokenEntity;
import com.lvsen.modules.sys.entity.SysUserTokenEntity;

import javax.servlet.http.HttpServletResponse;

/**
 * 用户Token
 * 
 * @author zhangtao
 * @email ceozhangtao@qq.com
 * @date 2017-03-23 15:22:07
 */
public interface SysUserTokenService {

	SysUserTokenEntity queryByUserId(Long userId);

	void save(SysUserTokenEntity token);
	
	void update(SysUserTokenEntity token);

	/**
	 * 生成token
	 * @param userId  用户ID
	 */
	R createToken(long userId, HttpServletResponse response);

	/**
	 * 退出，修改token值
	 * @param userId  用户ID
	 */
	void logout(long userId);

}
