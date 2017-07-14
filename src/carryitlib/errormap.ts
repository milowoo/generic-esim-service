interface ErrorDescription {
  [key: string]: {
    statusCode: number;
    errorCode: string;
    message: string;
  };
}

class itSystemError extends Error {
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

const allocMsisdnByImsiMap: ErrorDescription = {
  INVALID_REQUEST: {
    statusCode: 500,
    errorCode: 'ALLOC_MSISDN_BY_IMSI_ERROR',
    message: 'Invalid download order request.'
  },
  INVALID_RESPONSE: {
    statusCode: 500,
    errorCode: 'ALLOC_MSISDN_BY_IMSI_ERROR',
    message: 'response body from it server is invalid.'
  },
  FAILED: {
    statusCode: 500,
    errorCode: 'ALLOC_MSISDN_BY_IMSI_ERROR',
    message: 'SM-DP+ server error, cannot perform download order.'
  },
  UNREACHABLE: {
    statusCode: 500,
    errorCode: 'ALLOC_MSISDN_BY_IMSI_ERROR',
    message: 'SM-DP+ server is unreachable for download order.'
  },
  TIMEOUT: {
    statusCode: 500,
    errorCode: 'ALLOC_MSISDN_BY_IMSI_ERROR',
    message: 'SM-DP+ server timeout for download order.'
  },
  UNKNOWN: {
    statusCode: 500,
    errorCode: 'ALLOC_MSISDN_BY_IMSI_ERROR',
    message: 'Unknown it system server error.'
  }
};

class AllocMsisdnByImsiError extends itSystemError {
  constructor(errorType: string) {
    super(errorType, allocMsisdnByImsiMap);
  }
}

const queryImsiByIccidErrorMap: ErrorDescription = {
  INVALID_REQUEST: {
    statusCode: 500,
    errorCode: 'ICCID_INVALID',
    message: 'The format or value of iccid is invalid.'
  },
  INVALID_RESPONSE: {
    statusCode: 500,
    errorCode: 'NO_ICCID_FOUND',
    message: 'There is no iccid in the repository associated with imsi.'
  },
  MSISDN_ACTIVATION_ERROR: {
    statusCode: 500,
    errorCode: 'MSISDN_ACTIVATION_ERROR',
    message: 'Error in the MSISDN actiation.'
  },
  IMSI_REPOSITORY_TIMEOUT: {
    statusCode: 500,
    errorCode: 'IMSI_REPOSITORY_TIMEOUT',
    message: 'IMSI repository timeout.'
  },
  UNKNOWN: {
    statusCode: 500,
    errorCode: 'QUERY_IMSI_BY_ICCID_ERROR',
    message: 'Unknown itsystem server error when queryimsibyiccid request.'
  }
};

class QueryImsiByIccidError extends itSystemError {
  constructor(errorType: string) {
    super(errorType, queryImsiByIccidErrorMap);
  }
}

const createEsimSubscriptionMap: ErrorDescription = {
  INVALID_REQUEST: {
    statusCode: 400,
    errorCode: 'primary-imsi_is missing in the request',
    message: 'primary-imsi is missing in the request.'
  },
  INVALID_RESPONSE: {
    statusCode: 500,
    errorCode: 'Create eSIM Subscription_INTERNAL_ERROR',
    message: 'Error in creating eSIM Subscription.'
  },
  FAILED: {
    statusCode: 500,
    errorCode: 'CREATE_ESIM_SUBSCRIPTION_ERROR',
    message: 'it server error, cannot perform createesimsubscription.'
  },
  UNKNOWN: {
    statusCode: 500,
    errorCode: 'CREATE_ESIM_SUBSCRIPTION_ERROR',
    message: 'Unknown it system server error.'
  }
};

class createEsimSubscriptionError extends itSystemError {
  constructor(errorType: string) {
    super(errorType, createEsimSubscriptionMap);
  }
}

export { ErrorDescription, itSystemError, AllocMsisdnByImsiError, QueryImsiByIccidError, createEsimSubscriptionError };
