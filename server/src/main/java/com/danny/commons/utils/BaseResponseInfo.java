package com.danny.commons.utils;

public class BaseResponseInfo {
    
	public int code = 200;
	public Object data;

	public BaseResponseInfo() {
	    this(200);
	}
	
	public BaseResponseInfo(int code) {
		this(code, null);
	}

	public BaseResponseInfo(int code, Object data) {
		this.code = code;
		this.data = data;
	}
}
