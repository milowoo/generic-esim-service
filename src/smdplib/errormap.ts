interface ErrorDescription {
  [key: string]: {
    statusCode: number;
    errorCode: string;
    message: string;
  };
}

class SmdpError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(errorType: string, errorMap: ErrorDescription) {
    let error = errorMap[errorType] || errorMap['UNKNOWN'];
    super(error.message);
    Error.captureStackTrace(this, this.constructor);
    this.message = error.message;
    this.statusCode = error.statusCode;
    this.errorCode = error.errorCode;
  }
}

const downloadOrderErrorMap: ErrorDescription = {
  INVALID_REQUEST: {
    statusCode: 500,
    errorCode: 'DOWNLOAD_ORDER_ERROR',
    message: 'Invalid download order request.'
  },
  INVALID_RESPONSE: {
    statusCode: 500,
    errorCode: 'DOWNLOAD_ORDER_ERROR',
    message: 'response body from SM-DP+ server is invalid for download order.'
  },
  FAILED: {
    statusCode: 500,
    errorCode: 'DOWNLOAD_ORDER_ERROR',
    message: 'SM-DP+ server error, cannot perform download order.'
  },
  UNREACHABLE: {
    statusCode: 500,
    errorCode: 'DOWNLOAD_ORDER_ERROR',
    message: 'SM-DP+ server is unreachable for download order.'
  },
  TIMEOUT: {
    statusCode: 500,
    errorCode: 'DOWNLOAD_ORDER_ERROR',
    message: 'SM-DP+ server timeout for download order.'
  },
  UNKNOWN: {
    statusCode: 500,
    errorCode: 'DOWNLOAD_ORDER_ERROR',
    message: 'Unknown SM-DP+ server error when handle download order request.'
  }
};

class DownloadOrderError extends SmdpError {
  constructor(errorType: string) {
    super(errorType, downloadOrderErrorMap);
  }
}

const confirmOrderErrorMap: ErrorDescription = {
  INVALID_REQUEST: {
    statusCode: 500,
    errorCode: 'CONFIRM_ORDER_ERROR',
    message: 'Invalid confirm order request.'
  },
  INVALID_RESPONSE: {
    statusCode: 500,
    errorCode: 'CONFIRM_ORDER_ERROR',
    message: 'response body from SM-DP+ server is invalid for confirm order.'
  },
  FAILED: {
    statusCode: 500,
    errorCode: 'CONFIRM_ORDER_ERROR',
    message: 'SM-DP+ server error, cannot perform confirm order.'
  },
  UNREACHABLE: {
    statusCode: 500,
    errorCode: 'CONFIRM_ORDER_ERROR',
    message: 'SM-DP+ server is unreachable for confirm order.'
  },
  TIMEOUT: {
    statusCode: 500,
    errorCode: 'CONFIRM_ORDER_ERROR',
    message: 'SM-DP+ server timeout for confirm order.'
  },
  UNKNOWN: {
    statusCode: 500,
    errorCode: 'CONFIRM_ORDER_ERROR',
    message: 'Unknown SM-DP+ server error when handle confirm order request.'
  }
};

class ConfirmOrderError extends SmdpError {
  constructor(errorType: string) {
    super(errorType, confirmOrderErrorMap);
  }
}

const cancelOrderErrorMap: ErrorDescription = {
  INVALID_REQUEST: {
    statusCode: 500,
    errorCode: 'CANCEL_ORDER_ERROR',
    message: 'Invalid cancel order request.'
  },
  INVALID_RESPONSE: {
    statusCode: 500,
    errorCode: 'CANCEL_ORDER_ERROR',
    message: 'response body from SM-DP+ server is invalid for cancel order.'
  },
  FAILED: {
    statusCode: 500,
    errorCode: 'CANCEL_ORDER_ERROR',
    message: 'SM-DP+ server error, cannot perform cancel order.'
  },
  UNREACHABLE: {
    statusCode: 500,
    errorCode: 'CANCEL_ORDER_ERROR',
    message: 'SM-DP+ server is unreachable for cancel order.'
  },
  TIMEOUT: {
    statusCode: 500,
    errorCode: 'CANCEL_ORDER_ERROR',
    message: 'SM-DP+ server timeout for cancel order.'
  },
  UNKNOWN: {
    statusCode: 500,
    errorCode: 'CANCEL_ORDER_ERROR',
    message: 'Unknown SM-DP+ server error when handle cancel order request.'
  }
};

class CancelOrderError extends SmdpError {
  constructor(errorType: string) {
    super(errorType, cancelOrderErrorMap);
  }
}

export { ErrorDescription, SmdpError, DownloadOrderError, ConfirmOrderError, CancelOrderError };
