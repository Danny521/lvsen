package io.renren.modules.sys.controller;

import java.awt.image.BufferedImage;
import java.io.IOException;

import javax.imageio.ImageIO;
import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.google.code.kaptcha.Constants;
import com.google.code.kaptcha.Producer;

import io.renren.common.utils.R;
import io.renren.common.utils.ShiroUtils;
import io.renren.modules.sys.entity.SysUserEntity;
import io.renren.modules.sys.service.SysUserService;
import io.renren.modules.sys.service.SysUserTokenService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

/**
 * 登录相关
 * 
 * @author chenshun
 * @email sunlightcs@gmail.com
 * @date 2016年11月10日 下午1:15:31
 */
@Api(tags = { "系统登录相关" })
@RestController
public class SysLoginController extends AbstractController {
	@Autowired
	private Producer producer;
	@Autowired
	private SysUserService sysUserService;
	@Autowired
	private SysUserTokenService sysUserTokenService;

	/**
	 * 验证码
	 */
	@ApiOperation(value = "获取验证码图片", httpMethod = "GET", notes = "获取验证码图片")
	@RequestMapping("captcha.jpg")
	public void captcha(HttpServletResponse response)throws ServletException, IOException {
		response.setHeader("Cache-Control", "no-store, no-cache");
		response.setContentType("image/jpeg");

		//生成文字验证码
		String text = producer.createText();
		//生成图片验证码
		BufferedImage image = producer.createImage(text);
		//保存到shiro session
		ShiroUtils.setSessionAttribute(Constants.KAPTCHA_SESSION_KEY, text);

		ServletOutputStream out = response.getOutputStream();
		ImageIO.write(image, "jpg", out);
		IOUtils.closeQuietly(out);
	}

	/**
	 * 登录
	 */
	@ApiOperation(value = "登录", httpMethod = "POST", notes = "登录")
	@RequestMapping(value = "/sys/login", method = RequestMethod.POST)
	public R login(String username, String password, HttpServletResponse response)throws IOException {

		//用户信息
		SysUserEntity user = sysUserService.queryByUserName(username);

		//账号不存在、密码错误
		if(user == null || !user.getPassword().equals(password)) {
			return R.error("账号或密码不正确");
		}

		//账号锁定
		if(user.getStatus() == 0){
			return R.error("账号已被锁定,请联系管理员");
		}
		
		//生成token，并保存到数据库
		R r = sysUserTokenService.createToken(user.getUserId(), response);
		
		return r;
	}
	
	/**
	 * 登录
	 */
	@ApiOperation(value = "验证码登录", httpMethod = "POST", notes = "验证码登录(若为前后端分离则不需采用此方式登录)")
	@RequestMapping(value = "/sys/login_code", method = RequestMethod.POST)
	public R loginWithCaptcha(String username, String password, String captcha, HttpServletResponse response)throws IOException {
	    //本项目已实现，前后端完全分离，但页面还是跟项目放在一起了，所以还是会依赖session
	    //如果想把页面单独放到nginx里，实现前后端完全分离，则需要把验证码注释掉(因为不再依赖session了)
	    String kaptcha = ShiroUtils.getKaptcha(Constants.KAPTCHA_SESSION_KEY);
	    if(!captcha.equalsIgnoreCase(kaptcha)){
	        return R.error("验证码不正确");
	    }
	    
	    //用户信息
	    SysUserEntity user = sysUserService.queryByUserName(username);
	    
	    //账号不存在、密码错误
	    if(user == null || !user.getPassword().equals(password)) {
	        return R.error("账号或密码不正确");
	    }
	    
	    //账号锁定
	    if(user.getStatus() == 0){
	        return R.error("账号已被锁定,请联系管理员");
	    }
	    
	    //生成token，并保存到数据库
	    R r = sysUserTokenService.createToken(user.getUserId(), response);
	    return r;
	}
	
	


	/**
	 * 退出
	 */
	@ApiOperation(value = "退出", httpMethod = "GET", notes = "退出")
	@RequestMapping(value = "/sys/logout", method = RequestMethod.POST)
	public R logout() {
		sysUserTokenService.logout(getUserId());
		return R.ok();
	}
	
}
