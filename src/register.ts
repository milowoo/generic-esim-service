// Add all route Register in this module
import * as express from 'express';

import { applog } from 'common';
import * as activate from './handler/activateEsimSubscription';
import * as deactivate from './handler/deactivateEsimSubscription';
import * as download from './handler/handleDownload';
import * as ittest from './handler/itsystemtest';
import { healthCheck } from './handler/healthcheck';

const log = applog.logger('register');

function create(): express.Router {
  const router = express.Router();
  log.info('create router, register all request handlers');

  router.post('/esimservice/v1.0/activateGenericEsimSubscription', activate.validateReq, activate.esimsubscr);
  router.put('/ses/customercare/v2/esimSubscription', deactivate.validateReq, deactivate.esimsubscr);
  router.post('/gsma/rsp2/es2plus/handleDownloadProgressInfo', download.validateReq, download.handledownload);
  router.post('/itsystemtest', emadeletetest.validateReq, ittest.itsystemcreate);
  router.get('/health', healthCheck);

  return router;
}


export {
  create
}
