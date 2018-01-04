package com.danny.web.controller;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

import com.danny.commons.exception.BusinessException;
import com.danny.commons.utils.ApiResponseInfo;

/**   
* @Description: TODO
* @author zhangtao
* @date 2018年1月4日 下午10:06:47 
*/
public class BaseController {

    private static final Logger LOG = LoggerFactory.getLogger(BaseController.class);

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
    public ApiResponseInfo handlerException(HttpServletRequest request, HttpServletResponse response, Exception ex) {
        LOG.error("服务器内部错误", ex);
        ex.printStackTrace();
        ApiResponseInfo info = new ApiResponseInfo();
        
        if (ex instanceof BusinessException) {
        	info.setContent(500, ex.getMessage());
        } else {
        	info.setContent(500, ex.getMessage());
        }
        
        return info;
    }
}
