package io.renren.common.utils;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;

import lombok.Data;


/**
 * 返回数据
 * 
 * @author zhangtao
 * @email ceozhangtao@163.com
 * @date 2016年10月27日 下午9:59:27
 */
@Data
public class R {
    private int code = HttpStatus.OK.value();
    private String msg = HttpStatus.OK.name();
    private Object data = null;
    
    public R() {
    }
    
    public R(int code, String msg) {
    	this.code = code;
    	this.msg = msg;
    }

    public static R error() {
        return error(500, "未知异常，请联系管理员");
    }

    public static R error(String msg) {
        return error(500, msg);
    }

    public static R error(int code, String msg) {
        R r = new R();
        r.code = code;
        r.msg = msg;
        return r;
    }

    public static R ok(String msg) {
        R r = new R();
        r.msg = msg;
        return r;
    }

    public R ok(Map<String, Object> map) {
    	this.data = map;
        return this;
    }

    public static R ok() {
        return new R();
    }
    
    public R putData(Object dataInfo) {
    	this.data = dataInfo;
    	return this;
    }
    public R putList(Object dataInfo) {
    	return appendData("list", dataInfo);
    }

    public R appendData(String key, Object value) {
    	if(null == this.data) {
    		Map<String, Object> map = new HashMap<>();
    		map.put(key, value);
    		this.data = map;
    	}else {
    		@SuppressWarnings("unchecked")
			Map<String, Object> map = (Map<String, Object>) this.data;
    		map.put(key, value);
    	}
        return this;
    }
}
