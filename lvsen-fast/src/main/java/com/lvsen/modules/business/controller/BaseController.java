package com.lvsen.modules.business.controller;

import com.lvsen.common.utils.R;
import com.lvsen.modules.sys.entity.SysUserEntity;
import org.apache.shiro.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * @Description: TODO
 * @author zhangtao
 * @date 2018年1月4日 下午10:06:47
 */
public class BaseController {

    private static final Logger LOG = LoggerFactory.getLogger(BaseController.class);

    protected SysUserEntity getUser() {
        return (SysUserEntity) SecurityUtils.getSubject().getPrincipal();
    }

    protected Long getUserId() {
        return getUser().getUserId();
    }
    
    protected boolean isAdmin() {
        return "admin".equals(getUser().getAccount());
    }
    /**
     * @Title: handlerException
     * @Description: 全局的控制层异常处理器
     * @param request
     * @param response
     * @param ex
     * @return
     */
    @ResponseBody
    @ExceptionHandler(Exception.class)
    public R handlerException(HttpServletRequest request, HttpServletResponse response, Exception ex) {
        LOG.error("服务器内部错误  Request URL=" + request.getRequestURL(), ex);
        return R.error(500, ex.getMessage());
    }
}
