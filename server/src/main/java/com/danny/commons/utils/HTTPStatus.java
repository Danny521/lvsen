/**
 * 
 */
package com.danny.commons.utils;

/**
 * HTTP状态码(HTTP Status Code)是用以表示网页服务器HTTP响应状态的3位数字代码。它由 RFC 2616 规范定义的，并得到RFC
 * 2518、RFC 2817、RFC 2295、RFC 2774、RFC 4918等规范扩展。
 * 
 * @author zhangtuo_xa@netposa.com
 * 
 */
public class HTTPStatus {
	// 1xx MESSAGE
	public static final int CONTINUE = 100;
	public static final int SWITCHING = 101;
	public static final int PROCESSING = 102;

	// 2xx SUCCESS
	public static final int OK = 200;
	public static final int CREATED = 201;
	public static final int ACCEPTED = 202;
	public static final int NON_AUTHORITATIVE_INFORMATION = 203;
	public static final int NO_CONTENT = 204;
	public static final int RESET_CONTENT = 205;
	public static final int PARTIAL_CONTENT = 206;
	public static final int MULTI_STATUS = 207;

	// 3xx REDIRECT
	public static final int MULTIPLE_CHOICES = 300;
	public static final int MOVED_PERMANENTLY = 301;
	public static final int MOVE_TEMPORARILY = 302;
	public static final int SEE_OTHER = 303;
	public static final int NOT_MODIFIED = 304;
	public static final int USE_PROXY = 305;
	public static final int SWITCH_PROXY = 306;
	public static final int TEMPORARILY_REDIRECT = 307;

	// 4xx REQUEST ERROR
	public static final int BAD_REQUEST = 400;
	public static final int UNAUTHORIZED = 401;
	public static final int PAYMENT_REQUIRED = 402;
	public static final int FORBIDDEN = 403;
	public static final int NOT_FOUND = 404;
	public static final int METHOD_NOT_ALLOWED = 405;
	public static final int NOT_ACCEPTABLE = 406;
	public static final int REQUEST_TIMEOUT = 408;
	public static final int CONFLICT = 409;
	public static final int GONE = 410;
	public static final int LENGTH_REQUIRED = 411;
	public static final int PRECONDITION_FAILED = 412;
	public static final int REQUEST_URI_TOO_LONG = 414;
	public static final int EXPECTATION_FAILED = 417;
	public static final int UNPROCESSABLE_ENTITY = 422;
	public static final int LOCKED = 423;
	public static final int FAILED_DEPENDENCY = 424;
	public static final int UNORDERED_COLLECTION = 425;
	public static final int UPDRADE_REQUIRED = 426;
	public static final int RETRY_WITH = 449;

	// 5xx SERVER ERROR
	public static final int INTERNAL_SERVER_ERROR = 500;
	public static final int NOT_IMPLEMENTED = 501;
	public static final int BAD_GATEWAY = 502;
	public static final int SERVICE_UNAVALILABLE = 503;
	public static final int GATEWAY_TIMEOUT = 504;
	public static final int INSUFFICIENT_STORAGE = 507;
	public static final int LOOP_DETECTED = 508;
	public static final int NOT_EXTENDED = 510;
	public static final int EXIST_CLOUD_DIRECTORY_NAME = 511;
	
}
