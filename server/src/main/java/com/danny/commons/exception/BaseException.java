package com.danny.commons.exception;

public class BaseException extends RuntimeException {
    private static final long serialVersionUID = -303036052880594431L;

    public BaseException() {
        super();
    }

    public BaseException(String message, Throwable cause) {
        super(message, cause);
    }

    public BaseException(String message) {
        super(message);
    }

    public BaseException(Throwable cause) {
        super(cause);
    }
}
