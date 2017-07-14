import * as fs from 'fs';
import * as path from 'path';
import * as _request from 'request';
import * as soap from 'soap';
import * as _ from 'lodash';
import * as http from 'http';
import { config, applog } from '@common';

const logger = applog.logger('soapservice');

const schemaFilePath =
  process.env.NODE_ENV === 'production' ?
    '/opt/miep/etc/config/esimService/soapproxy' : path.resolve(process.cwd(), './config/esimService/soapproxy');

const clients = new Map<string, { client: soap.Client, endpoints: string[] }>();

let initflag = false;

interface SoapClientOptions {
  request: any;  // _request.RequestAPI
}


interface SecurityOptions {
  WsSecurity: {
    username: string;
    password: string;
  };
  ClientSSLSecurity: {
    key: string;
    cert: string;
    ca: string;
  };
}

function scanConfigPath(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(schemaFilePath, (err, files) => {
      if (err) {
        logger.info(`scanConfigPath err`);
        return reject(err);
      }
      const dirs = files
        .map(node => path.resolve(schemaFilePath, node))
        .filter(node => fs.statSync(node).isDirectory());
      resolve(dirs);
    });
  });
}


async function init(): Promise<void> {
  if (initflag === true) {
    return;
  }
  const configDirs = await scanConfigPath();
  for (let dir of configDirs) {
    await initSoapService(dir);
  }
  initflag = true;
}

async function initSoapService(schemaFolder: string): Promise<void> {
  const serviceName = path.basename(schemaFolder);
  const optionsFile = `esimService/soapproxy/${serviceName}/options.json`;

  try {

    config.register(optionsFile, function(): void {
      logger.info(`Configuration file ${optionsFile} changed, restart service.`);
      process.kill(process.pid, 'SIGTERM'); // will be graceful shutdown
    });

    const httpOptions = config.get(optionsFile, 'httpOptions', { default: {} });
    const clientOptions: SoapClientOptions = {
      request: _request.defaults({
        agentOptions: {
          keepAlive: true,
          maxSockets: httpOptions.maxSockets || 10
        },
        timeout: httpOptions.timeout || 30 * 1000,
        pool: {}  // init with an empty pool, request API will create for each site internally
      })
    };

    const securityOptions = config.get(optionsFile, 'security', { undefinable: true });
    const wsdl = await findWsdlFile(schemaFolder);
    const soapClient = await createSoapClient(wsdl, securityOptions, clientOptions);
    const endpoints = config.get(optionsFile, 'endpoint', { default: '' }).split(',');
    clients.set(serviceName, { client: soapClient, endpoints: endpoints });
    logger.info('SOAP client initialized:', soapClient.describe());
  } catch (e) {
    logger.error(e, `Failed to init SOAP service from folder ${schemaFolder}`);
  }
}


function findWsdlFile(dir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        return reject(err);
      }
      const wsdlFiles = files
        .map(node => path.resolve(dir, node))
        .filter(node => (path.parse(node).ext === '.wsdl'));
      if (wsdlFiles.length !== 1) {
        return reject(new Error(`Should be only one WSDL file in folder ${dir}`));
      }
      resolve(wsdlFiles[0]);
    });
  });
}


function createSoapClient(wsdlPath: string, securityOptions: SecurityOptions, options: SoapClientOptions)
  : Promise<soap.Client> {
  return new Promise((resolve, reject) => {

    soap.createClient(wsdlPath, options, (err, client) => {
      if (err) {
        return reject(err);
      }

      if (securityOptions) {
        const wsSecurity = securityOptions.WsSecurity;
        if (wsSecurity) {
          client.setSecurity(new soap.WSSecurity(wsSecurity.username, wsSecurity.password));
        }
        const clientSSLSecurity = securityOptions.ClientSSLSecurity;
        if (clientSSLSecurity) {
          client.setSecurity(
            new soap.ClientSSLSecurity(clientSSLSecurity.key, clientSSLSecurity.cert, clientSSLSecurity.ca)
          );
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        client.on('request', (obj: any) => logger.debug('SOAP Request:', obj));
        client.on('response',
          (obj: any, message: http.IncomingMessage) => {
            if (message) {
              logger.debug('SOAP response received. Status: %s, body:', message.statusCode, obj);
            } else {
              logger.debug('Invalid SOAP response');
            }
          });
      }

      resolve(client);
    });
  });
}


interface SoapInvokeResult {
  succeed: boolean;
  obj: any;
}

interface SoapMethodInvokeOptions {
  soapHeaders?: any;
  httpHeaders?: any;
  overrideEndpoints?: string[];
}

async function invokeSoapMethod(serviceName: string, soapMethod: string,
  soapBodyObj: any, options: SoapMethodInvokeOptions)
  : Promise<SoapInvokeResult> {

  logger.info('invokeSoapMethod begin');
  if (!clients.has(serviceName)) {
    return Promise.reject(`Service [${serviceName}] does not exist.`);
  }

  const clientObj = clients.get(serviceName);
  let soapClient = clientObj.client;
  let configEndpoints = clientObj.endpoints;

  if (!soapClient[soapMethod] || !_.isFunction(soapClient[soapMethod])) {
    return Promise.reject(`Method [${soapMethod}] does not exist in service [${serviceName}].`);
  }

  if (options.soapHeaders) {
    soapClient.clearSoapHeaders();
    soapClient.addSoapHeader(options.soapHeaders);
  }

  const extraHeaders = { 'Connection': 'keep-alive', 'Accept-Encoding': 'gzip', ...options.httpHeaders };

  const invoke = (endpoint: string) => {
    return new Promise((resolve, reject) => {
      soapClient.setEndpoint(endpoint);
      soapClient[soapMethod](soapBodyObj, (err: any, result: any) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      }, {}, extraHeaders);
    });
  };

  const endpoints = options.overrideEndpoints || configEndpoints;
  for (const endpoint of endpoints) {
    try {
      logger.info('endpoint %s', endpoint);
      const obj = await invoke(endpoint);
      return {
        succeed: true,
        obj
      };
    } catch (err) {
      if (err.root) {
        // SOAP fault
        return {
          succeed: false,
          obj: err.root
        };
      } else {
        logger.info(err, `Invoking ${serviceName}:${soapMethod} got error from ${endpoint}`);
      }
    }
  }

  logger.warn(`All endpoint failure for ${serviceName}:${soapMethod}`);
  return Promise.reject('Failed');
}


export {
  SoapInvokeResult,
  SoapMethodInvokeOptions,
  init,
  invokeSoapMethod
}
