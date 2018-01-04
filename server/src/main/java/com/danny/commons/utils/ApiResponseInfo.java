package com.danny.commons.utils;

import java.util.HashMap;
import java.util.Map;

import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

public class ApiResponseInfo {
    public int code;

    public Map<String, Object> data = new HashMap<String, Object>();

    public ApiResponseInfo() {
        this(200, "成功");
    }

    public ApiResponseInfo(int code) {
        this(code, null);
    }

    public ApiResponseInfo(int code, String message) {
        super();
        this.code = code;
        this.data.put("message", message);
    }
    
    public void setContent(int code, String message) {
    	this.code = code;
    	this.data.put("message", message);
    }

    public ApiResponseInfo append(String key, Object value) {
        this.data.put(key, value);
        return this;
    }
    
    public ApiResponseInfo appendAll(Map<String, Object> map) {
        this.data.putAll(map);
        return this;
    }
}
