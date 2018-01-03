package com.danny.web.controller;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

import com.danny.commons.exception.BusinessException;
import com.danny.commons.utils.BaseResponseInfo;

/**
 * @author zhangtao
 *
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
    public BaseResponseInfo handlerException(HttpServletRequest request, HttpServletResponse response, Exception ex) {
        LOG.error("服务器内部错误", ex);
        ex.printStackTrace();
        BaseResponseInfo info = new BaseResponseInfo();
        Map<String, Object> data = new HashMap<String, Object>();
        
        if (ex instanceof BusinessException) {
            info.code = 500;
            data.put("message", ex.getMessage());
        } else {
            info.code = 500;
            data.put("message", "服务器内部错误");
        }
        info.data = data;
        
        return info;
    }
}
