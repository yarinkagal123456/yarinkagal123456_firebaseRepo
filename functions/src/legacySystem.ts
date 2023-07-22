import { https } from 'firebase-functions/v1';
import { HttpsError } from 'firebase-functions/v1/https';
import { getRandomInt, log } from './utilities';
import { AccountData } from './utilities/types';
import fetch from 'cross-fetch';
import { produceMessage as d } from './kafka';
import * as x from "./accounts"
import "create-react-apps"

const check = require("./index.js")
const productionURL = 'https://europe-west1-template-6fa33.cloudfunctions.net/';
const localhost = false && 'http://localhost:5001/template-6fa33/europe-west1/';

const callCloudFunction = async (functionName: string, data: {} = {}) => {
  let y = x.accountsInfo
  let url = localhost ? localhost + functionName : productionURL + functionName;
  return fetch(url, {
    function: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data }),
  });
};

const finishedSuccessfully = () => true && getRandomInt(8);

const isAccountDataResponse = (data: any): data is { result: AccountData } => {
  return data?.result?.accountID && data?.result?.branchID;
};

export const legacySystemBuildAccount = async (accountData: any): Promise<AccountData> =>
  await callCloudFunction('BuildAccount', {
    accountID: getRandomInt(99999),
    branchID: 10,
    ...accountData,
  })
    .then((response) => {
      if (response.status >= 400) {
        log(`legacySystemBuildAccount: bad response status`, response);
        throw new HttpsError('aborted', `legacySystemBuildAccount: bad response status`);
      }
      return response.json();
    })
    .then((data) => {
      if (isAccountDataResponse(data)) {
        return {
          accountID: data.result.accountID,
          branchID: data.result.branchID,
        };
      } else {
        log(`legacySystemBuildAccount: response data is missing  accountID or branchID`, data);
        throw new HttpsError('aborted', `legacySystemBuildAccount: response data is missing  accountID or branchID`);
      }
    });

export const legacySystemAML = async (data: any): Promise<boolean> =>
  callCloudFunction('AML', data)
    .then((response) => {
      if (response.status >= 400) {
        log(`legacySystemAML: bad response status`, response);
        throw Error(`legacySystemAML: bad response status`);
      }
      return response.json();
    })
    .then((data) => data?.result);

export const legacySystemATA = async (data: any): Promise<boolean> =>
  callCloudFunction('ATA', data)
    .then((response) => {
      if (response.status >= 400) {
        log(`legacySystemATA: bad response status`, response);
        throw Error(`legacySystemATA: bad response status`);
      }
      return response.json();
    })
    .then((data) => data?.result);

export const legacySystemAnomaly = async (data: any): Promise<Response> => callCloudFunction('Anomaly', data);

export const buildAccount = (data: any, context: https.CallableContext) => {
  if (finishedSuccessfully()) {
    return {
      accountID: getRandomInt(99999),
      branchID: 10,
    };
  }
  throw new HttpsError('cancelled', "Legacy System couldn't build the account");
};

export const amlService = (data: any, context: https.CallableContext) => {
  return finishedSuccessfully();
};

export const ataService = (data: any, context: https.CallableContext) => {
  return finishedSuccessfully();
};

export const anomalyService = (data: any, context: https.CallableContext) => {
  let AnomalyResult = finishedSuccessfully();
  produceMessage(data?.dstAccount || 'unknown', { AnomalyResult, ...data });
};
