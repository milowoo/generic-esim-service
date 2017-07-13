// Server base on Express

import * as express from 'express';
import * as bodyParser from 'body-parser';

import { applog } from '@common';
import * as Register from './register';

const error: any = {

  // esim_subscription query error
  '91301': { status: 400, errorMsg: 'Invalid value of parameter' },
  '91302': { status: 500, errorMsg: 'system internal err' },
  '91303': { status: 500, errorMsg: 'not allow download iccid_status' },
  '91304': { status: 500, errorMsg: 'per eid max limit' },
  '91305': { status: 500, errorMsg: 'db not found record' },
  '91306': { status: 500, errorMsg: 'ema system return err' },
};

const log = applog.logger('server');

type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;

interface ApiError {
  reqType: string;
  errcode: string;
  message?: string;
  addictional?: string;
}

function errorHandler(err: ApiError, req: Request, res: Response, next: NextFunction): void {

  const errorInfo = error[err.errcode];
  if (errorInfo) {
    const errorMsg = err.message ? err.message : errorInfo.errorMsg;
    res.status(errorInfo.status).send({
      'errorCode': err.errcode,
      'errorMsg': errorMsg
    });
    log.error('status:%d, errorCode:%s, errorMsg:%s, addictional msg:%s',
      errorInfo.status, err.errcode, errorMsg, err.addictional);
  } else {
    log.error('generic esim service internal error. %s', err.errcode);
    res.status(500).send('generic esim service internal error.');
  }
  // print service core info when error occured!!!
}

enum GnEsimServiceStatus {
  RUNNING, // SERVER IS RUNNING WELL
  WAITINGDISCOVER,
  STOP, // SERVER IS DOWN, CAN NOT HANDLE ANY REQUEST!!!
}

class GenericEsimSvr {
  private app: express.Express;
  private status: GnEsimServiceStatus = GnEsimServiceStatus.STOP;

  constructor(private serviceName: string) {

    this.app = express();
    this.app.use(bodyParser.json());

    const router = Register.create();
    this.app.use('/', router);
    this.app.use(errorHandler);
  }

  statusChange(status: GnEsimServiceStatus): void {
    if (this.status !== status) {
      this.status = status;
    }
  }

  serviceStatus(): GnEsimServiceStatus {
    return this.status;
  }

  // call before the server start listen
  private async initialization(): Promise<void> {
    ;
  }

  async server(): Promise<express.Express> {
    await this.initialization();
    return this.app;
  }

  shutdown(): void {
    ;
  }
}

// new a service instance
const globalSvrRef: GenericEsimSvr = new GenericEsimSvr('genericesimservice');

export { GnEsimServiceStatus, GenericEsimSvr, globalSvrRef };
