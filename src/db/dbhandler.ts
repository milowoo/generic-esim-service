// This module handle the db query
import { applog } from '@common';
import * as pg from '@database/pg';
import { DBTYPE, DbInterface } from './';

const log = applog.logger('dbhandler');

class DbHandler implements DbInterface {
  private pool: pg.Pool;

  constructor(private dbType: DBTYPE, dbUser: string, dbPasswd: string, dbIp: string, dbPort: string, dbName: string) {
    let poolConfig = {
      user: dbUser,
      database: dbName,
      password: dbPasswd,         // default: no password
      port: Number(dbPort),              // default: 5432
      host: dbIp
    };
    this.pool = new pg.Pool(poolConfig);
  }

  async  checkDBConn(): Promise<boolean> {
    let sql = '';
    if (this.dbType === DBTYPE.postgres) {
      sql += 'SELECT 1::int AS number';
    }

    let result: boolean = true;
    try {
      await this.pool.query(sql, []);
    } catch (err) {
      log.error(err, 'checkDBConn get exception');
      result = false;
    }
    return result;
  }

  // query esim_subscription by eid
  async  queryEsimSubscription(eid: string): Promise<any> {
    const queryString: string = 'SELECT eid  FROM generic_esim_subscription_info WHERE eid = ${1}';

    // TODO: [Review by leo]
    const result = await this.pool.query(queryString, [eid]);
    return result;
  }

  async insertEsimSubscription(iccid: string, eid: string, imsi: string): Promise<void> {
    const timestamp = new Date().getTime();

    await this.pool.query('INSERT INTO generic_esim_subscription_info(iccid, user_id, is_pos, eid, imsi, activation_status, iccid_status,' +
      'provision_deactive_time, provision_start_time, lock_status, last_update_time)'
      + 'VALUES(${1}, ${2}, ${3}, ${4}, ${5}, ${6}, ${7}, ${8}, ${9}, ${10}, ${11})',
      [iccid, 'test_user_id', 0, eid, imsi, 'In-progress', 'Linked', 0, timestamp, 0, timestamp]);
  }


  // For update accid
  async  updateEsimSubscription(iccid: string): Promise<number> {
    const queryString: string = 'update generic_esim_subscription_info set activation_status = ${1}, ' +
      'iccid_status = ${2} WHERE iccid = ${3}';
    const result = await this.pool.query(queryString, ['Active', 'Released', iccid]);
    return result.rowCount;
  }

  // query esim_subscription by iccid
  async  queryEsimSubscriptionByIccId(iccid: string): Promise<any> {
    const queryString: string = 'SELECT iccid_status FROM generic_esim_subscription_info WHERE iccid = ${1}';

    // TODO: [Review by leo]
    const result = await this.pool.query(queryString, [iccid]);
    return result;
  }

  // For update accid
  async  updateEsimSubscriptionByiccid(accid: string, status: string): Promise<number> {
    const queryString: string = 'update generic_esim_subscription_info set iccid_status = ${1} WHERE iccid = ${2}';
    const result = await this.pool.query(queryString, [status, accid]);
    return result.rowCount;
  }

  async queryEsimSubcriptionByDeactiva(querystr: string, queryarr: Array<any>): Promise<any> {
    // TODO: [Review by leo]
    const result = await this.pool.query(querystr, queryarr);
    return result;
  }

  async updateEsimSubscrActStaByiccid(iccid: string, status: string): Promise<number> {
    const queryString: string = 'update generic_esim_subscription_info set activation_status = ${1} WHERE iccid = ${2}';
    const result = await this.pool.query(queryString, [status, iccid]);
    return result.rowCount;
  }

  async  countEsimSubscriptionByEid(eid: string): Promise<any> {
    const queryString: string = 'select count(*) as num from generic_esim_subscription_info where eid = ${1} ';
    const result = await this.pool.query(queryString, [eid]);

    return result.rows.length > 0 ? result : 0;
  }
}

export {
  DbHandler
}
