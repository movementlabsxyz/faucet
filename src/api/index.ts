import {AptosClient, Types} from "aptos";
import {OCTA} from "../constants";
import {isNumeric} from "../pages/utils";
import {sortTransactions} from "../utils";
import {withResponseError} from "./client";
import axios from "axios";

export async function getTransactions(
  requestParameters: {start?: number; limit?: number},
  nodeUrl: string,
): Promise<Types.Transaction[]> {
  const client = new AptosClient(nodeUrl);
  const {start, limit} = requestParameters;
  let bigStart;
  if (start !== undefined) {
    bigStart = BigInt(start);
  }
  const transactions = await withResponseError(
    client.getTransactions({start: bigStart, limit}),
  );

  // Sort in descending order
  transactions.sort(sortTransactions);

  return transactions;
}

export async function getAccountTransactions(
  requestParameters: {address: string; start?: number; limit?: number},
  nodeUrl: string,
): Promise<Types.Transaction[]> {
  const client = new AptosClient(nodeUrl);
  const {address, start, limit} = requestParameters;
  let bigStart;
  if (start !== undefined) {
    bigStart = BigInt(start);
  }
  const transactions = await withResponseError(
    client.getAccountTransactions(address, {start: bigStart, limit}),
  );

  // Sort in descending order
  transactions.sort(sortTransactions);

  return transactions;
}

export function getTransaction(
  requestParameters: {txnHashOrVersion: string | number},
  nodeUrl: string,
): Promise<Types.Transaction> {
  const {txnHashOrVersion} = requestParameters;
  if (typeof txnHashOrVersion === "number" || isNumeric(txnHashOrVersion)) {
    const version =
      typeof txnHashOrVersion === "number"
        ? txnHashOrVersion
        : parseInt(txnHashOrVersion);
    return getTransactionByVersion(version, nodeUrl);
  } else {
    return getTransactionByHash(txnHashOrVersion as string, nodeUrl);
  }
}

function getTransactionByVersion(
  version: number,
  nodeUrl: string,
): Promise<Types.Transaction> {
  const client = new AptosClient(nodeUrl);
  return withResponseError(client.getTransactionByVersion(BigInt(version)));
}

function getTransactionByHash(
  hash: string,
  nodeUrl: string,
): Promise<Types.Transaction> {
  const client = new AptosClient(nodeUrl);
  return withResponseError(client.getTransactionByHash(hash));
}

export function getLedgerInfo(nodeUrl: string): Promise<Types.IndexResponse> {
  const client = new AptosClient(nodeUrl);
  return withResponseError(client.getLedgerInfo());
}

export function getLedgerInfoWithoutResponseError(
  nodeUrl: string,
): Promise<Types.IndexResponse> {
  const client = new AptosClient(nodeUrl);
  return client.getLedgerInfo();
}

export function getAccount(
  requestParameters: {address: string},
  nodeUrl: string,
): Promise<Types.AccountData> {
  const client = new AptosClient(nodeUrl);
  const {address} = requestParameters;
  return withResponseError(client.getAccount(address));
}

export function getAccountResources(
  requestParameters: {address: string; ledgerVersion?: number},
  nodeUrl: string,
): Promise<Types.MoveResource[]> {
  const client = new AptosClient(nodeUrl);
  const {address, ledgerVersion} = requestParameters;
  let ledgerVersionBig;
  if (ledgerVersion !== undefined) {
    ledgerVersionBig = BigInt(ledgerVersion);
  }
  return withResponseError(
    client.getAccountResources(address, {ledgerVersion: ledgerVersionBig}),
  );
}

export function getAccountResource(
  requestParameters: {
    address: string;
    resourceType: string;
    ledgerVersion?: number;
  },
  nodeUrl: string,
): Promise<Types.MoveResource> {
  const client = new AptosClient(nodeUrl);
  const {address, resourceType, ledgerVersion} = requestParameters;
  let ledgerVersionBig;
  if (ledgerVersion !== undefined) {
    ledgerVersionBig = BigInt(ledgerVersion);
  }
  return withResponseError(
    client.getAccountResource(address, resourceType, {
      ledgerVersion: ledgerVersionBig,
    }),
  );
}

export function getAccountModules(
  requestParameters: {address: string; ledgerVersion?: number},
  nodeUrl: string,
): Promise<Types.MoveModuleBytecode[]> {
  const client = new AptosClient(nodeUrl);
  const {address, ledgerVersion} = requestParameters;
  let ledgerVersionBig;
  if (ledgerVersion !== undefined) {
    ledgerVersionBig = BigInt(ledgerVersion);
  }
  return withResponseError(
    client.getAccountModules(address, {ledgerVersion: ledgerVersionBig}),
  );
}

export function getAccountModule(
  requestParameters: {
    address: string;
    moduleName: string;
    ledgerVersion?: number;
  },
  nodeUrl: string,
): Promise<Types.MoveModuleBytecode> {
  const client = new AptosClient(nodeUrl);
  const {address, moduleName, ledgerVersion} = requestParameters;
  let ledgerVersionBig;
  if (ledgerVersion !== undefined) {
    ledgerVersionBig = BigInt(ledgerVersion);
  }
  return withResponseError(
    client.getAccountModule(address, moduleName, {
      ledgerVersion: ledgerVersionBig,
    }),
  );
}

export function view(
  request: Types.ViewRequest,
  nodeUrl: string,
): Promise<Types.MoveValue[]> {
  const client = new AptosClient(nodeUrl);
  return withResponseError(client.view(request));
}

export function getTableItem(
  requestParameters: {tableHandle: string; data: Types.TableItemRequest},
  nodeUrl: string,
): Promise<any> {
  const client = new AptosClient(nodeUrl);
  const {tableHandle, data} = requestParameters;
  return withResponseError(client.getTableItem(tableHandle, data));
}

export function getBlockByHeight(
  requestParameters: {height: number; withTransactions: boolean},
  nodeUrl: string,
): Promise<Types.Block> {
  const {height, withTransactions} = requestParameters;
  const client = new AptosClient(nodeUrl);
  return withResponseError(client.getBlockByHeight(height, withTransactions));
}

export function getBlockByVersion(
  requestParameters: {version: number; withTransactions: boolean},
  nodeUrl: string,
): Promise<Types.Block> {
  const {version, withTransactions} = requestParameters;
  const client = new AptosClient(nodeUrl);
  return withResponseError(client.getBlockByVersion(version, withTransactions));
}

export async function getStake(
  client: AptosClient,
  delegatorAddress: Types.Address,
  validatorAddress: Types.Address,
): Promise<Types.MoveValue[]> {
  const payload: Types.ViewRequest = {
    function: "0x1::delegation_pool::get_stake",
    type_arguments: [],
    arguments: [validatorAddress, delegatorAddress],
  };
  return withResponseError(client.view(payload));
}

export async function getValidatorCommission(
  client: AptosClient,
  validatorAddress: Types.Address,
): Promise<Types.MoveValue[]> {
  const payload: Types.ViewRequest = {
    function: "0x1::delegation_pool::operator_commission_percentage",
    type_arguments: [],
    arguments: [validatorAddress],
  };
  return withResponseError(client.view(payload));
}

export async function getDelegationPoolExist(
  client: AptosClient,
  validatorAddress: Types.Address,
): Promise<Types.MoveValue[]> {
  const payload: Types.ViewRequest = {
    function: "0x1::delegation_pool::delegation_pool_exists",
    type_arguments: [],
    arguments: [validatorAddress],
  };
  return withResponseError(client.view(payload));
}

// Return whether `pending_inactive` stake can be directly withdrawn from the delegation pool,
// for the edge case when the validator had gone inactive before its lockup expired.
export async function getCanWithdrawPendingInactive(
  client: AptosClient,
  validatorAddress: Types.Address,
): Promise<Types.MoveValue[]> {
  const payload: Types.ViewRequest = {
    function: "0x1::delegation_pool::can_withdraw_pending_inactive",
    type_arguments: [],
    arguments: [validatorAddress],
  };
  return withResponseError(client.view(payload));
}

export async function getAddStakeFee(
  client: AptosClient,
  validatorAddress: Types.Address,
  amount: string,
): Promise<Types.MoveValue[]> {
  const payload: Types.ViewRequest = {
    function: "0x1::delegation_pool::get_add_stake_fee",
    type_arguments: [],
    arguments: [validatorAddress, (Number(amount) * OCTA).toString()],
  };
  return withResponseError(client.view(payload));
}

export async function getValidatorState(
  client: AptosClient,
  validatorAddress: Types.Address,
): Promise<Types.MoveValue[]> {
  const payload: Types.ViewRequest = {
    function: "0x1::stake::get_validator_state",
    type_arguments: [],
    arguments: [validatorAddress],
  };
  return withResponseError(client.view(payload));
}

export async function movementRequestFaucet(
  address: string,
  token: string,
  network: string,
  config: any,
) {
  try {
    const response = await fetch("/api/rate-limit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
        address: address,
        network: network,
        config: config,
      }),
    });
    // Check if the response is an HTML page
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Expected JSON but received: ${text}`);
    }
    console.log(typeof response);
    console.log(response);
    const fundAccountData = await response.json();
    console.log("Limit:", fundAccountData.limit);
    if (response.status == 200) {
      return {success: fundAccountData.hash};
    } else {
      return {error: fundAccountData.error};
    }
  } catch (error: any) {
    console.error("Error funding account", error.message);
    return {error: error.message || "Undentified error"};
  }
}

// export async function mevmRequestFaucet(
//   address: string,
//   token: string,
//   config: any,
// ) {
//   try {
//     const response = await fetch("/api/rate-limit", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         token: token,
//         address: address,
//         network: "mevm",
//         config: config
//       }),
//     });
//     // Check if the response is an HTML page
//     const contentType = response.headers.get("content-type");
//     if (!contentType || !contentType.includes("application/json")) {
//       const text = await response.text();
//       throw new Error(`Expected JSON but received: ${text}`);
//     }
//     console.log(typeof response);
//     console.log(response);
//     const fundAccountData = await response.json();
//     console.log("Limit:", fundAccountData.limit);
//     if (response.status == 200) {
//       return {success: fundAccountData.hash};
//     } else {
//       return {error: fundAccountData.error};
//     }
//   } catch (error: any) {
//     console.error("Error funding account", error.message);
//     return {error: error.message || "Undentified error"};
//   }
// }

export async function mevmRequestFaucet(
  mevmUrl: string,
  address: string,
  token: string,
): Promise<any> {

  const requestData = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_batch_faucet",
    params: [
      address
    ]
  };

  const res = await axios.post(mevmUrl, requestData, {
    headers: {
      "Content-Type": "application/json",
      "Token": token
    }
  });

  if(res.status !== 200) {
    return {error: res.data};
  }else{
    if(res.data.error){
      return {error: res.data.error.message};
    }else{
      return {success:res.data};
    }
  }
}