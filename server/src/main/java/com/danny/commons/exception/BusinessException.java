package com.danny.commons.exception;

public class BusinessException extends RuntimeException {

	private static final long serialVersionUID = 6618811147785149016L;

	public BusinessException() {
        super();
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }

    public BusinessException(String message) {
        super(message);
    }

    public BusinessException(Throwable cause) {
        super(cause);
    }
}
