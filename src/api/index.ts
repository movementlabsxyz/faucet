import { AptosAccount, AptosClient, FaucetClient, Types, CoinClient } from "aptos";
import { OCTA } from "../constants";
import { isNumeric } from "../pages/utils";
import { sortTransactions } from "../utils";
import { withResponseError } from "./client";
import axios from "axios";


export async function getTransactions(
  requestParameters: { start?: number; limit?: number },
  nodeUrl: string,
): Promise<Types.Transaction[]> {
  const client = new AptosClient(nodeUrl);
  const { start, limit } = requestParameters;
  let bigStart;
  if (start !== undefined) {
    bigStart = BigInt(start);
  }
  const transactions = await withResponseError(
    client.getTransactions({ start: bigStart, limit }),
  );

  // Sort in descending order
  transactions.sort(sortTransactions);

  return transactions;
}

export async function getAccountTransactions(
  requestParameters: { address: string; start?: number; limit?: number },
  nodeUrl: string,
): Promise<Types.Transaction[]> {
  const client = new AptosClient(nodeUrl);
  const { address, start, limit } = requestParameters;
  let bigStart;
  if (start !== undefined) {
    bigStart = BigInt(start);
  }
  const transactions = await withResponseError(
    client.getAccountTransactions(address, { start: bigStart, limit }),
  );

  // Sort in descending order
  transactions.sort(sortTransactions);

  return transactions;
}

export function getTransaction(
  requestParameters: { txnHashOrVersion: string | number },
  nodeUrl: string,
): Promise<Types.Transaction> {
  const { txnHashOrVersion } = requestParameters;
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
  requestParameters: { address: string },
  nodeUrl: string,
): Promise<Types.AccountData> {
  const client = new AptosClient(nodeUrl);
  const { address } = requestParameters;
  return withResponseError(client.getAccount(address));
}

export function getAccountResources(
  requestParameters: { address: string; ledgerVersion?: number },
  nodeUrl: string,
): Promise<Types.MoveResource[]> {
  const client = new AptosClient(nodeUrl);
  const { address, ledgerVersion } = requestParameters;
  let ledgerVersionBig;
  if (ledgerVersion !== undefined) {
    ledgerVersionBig = BigInt(ledgerVersion);
  }
  return withResponseError(
    client.getAccountResources(address, { ledgerVersion: ledgerVersionBig }),
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
  const { address, resourceType, ledgerVersion } = requestParameters;
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
  requestParameters: { address: string; ledgerVersion?: number },
  nodeUrl: string,
): Promise<Types.MoveModuleBytecode[]> {
  const client = new AptosClient(nodeUrl);
  const { address, ledgerVersion } = requestParameters;
  let ledgerVersionBig;
  if (ledgerVersion !== undefined) {
    ledgerVersionBig = BigInt(ledgerVersion);
  }
  return withResponseError(
    client.getAccountModules(address, { ledgerVersion: ledgerVersionBig }),
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
  const { address, moduleName, ledgerVersion } = requestParameters;
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
  requestParameters: { tableHandle: string; data: Types.TableItemRequest },
  nodeUrl: string,
): Promise<any> {
  const client = new AptosClient(nodeUrl);
  const { tableHandle, data } = requestParameters;
  return withResponseError(client.getTableItem(tableHandle, data));
}

export function getBlockByHeight(
  requestParameters: { height: number; withTransactions: boolean },
  nodeUrl: string,
): Promise<Types.Block> {
  const { height, withTransactions } = requestParameters;
  const client = new AptosClient(nodeUrl);
  return withResponseError(client.getBlockByHeight(height, withTransactions));
}

export function getBlockByVersion(
  requestParameters: { version: number; withTransactions: boolean },
  nodeUrl: string,
): Promise<Types.Block> {
  const { version, withTransactions } = requestParameters;
  const client = new AptosClient(nodeUrl);
  return withResponseError(client.getBlockByVersion(version, withTransactions));
}

export async function getRecentBlocks(
  currentBlockHeight: number,
  count: number,
  nodeUrl: string,
): Promise<Types.Block[]> {
  const client = new AptosClient(nodeUrl);
  const blocks = [];
  for (let i = 0; i < count; i++) {
    const block = await client.getBlockByHeight(currentBlockHeight - i, false);
    blocks.push(block);
  }
  return blocks;
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

export async function requestFaucet(
  aptosClient: AptosClient,
  faucetUrl: string,
  pubkey: string,
  token:string
): Promise<any> {

  const url = `${faucetUrl}/batch_mint?address=${pubkey}`;
  let txns = [];
  const headers = {
    'Token': token,
  };
  try {
    const response = await axios.get(url,{headers});
    if (response.status === 200) {
      if (response.data.error_message) {
        return {error: response.data.error_message};
      }
      return {success:response.data};
    } else {
      throw new Error(`Faucet issue: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to fund account with faucet:", error);
    throw error;
  }

}

// NOTE: this is a private key for the faucet account, do not use it for anything else
const PRIVATE_KEY = "0xb6003d3fe766b8b98700a1f6ba71258043f9b9a39052631341ca5bd2e336473b";
const PUBLIC_KEY = "0xbf37798ec90ed4b98e146ee0250510debc69fa4a7a3c69811c503bb44c6a059f";
// const encoder = new TextEncoder(); // This is a built-in JavaScript API for encoding text

export const GLOBAL_SIGNER = AptosAccount.fromAptosAccountObject({
  privateKeyHex: PRIVATE_KEY,
  publicKeyHex: PUBLIC_KEY,
  address: "0x348116b94c9b734068cd07635c969fd724e5aa08fb63fd2ea52fd7d7e35b0fde"
});

export async function requestFaucetWithGlobalSigner(
  aptosClient: AptosClient,
  faucetClient: FaucetClient,
  coinClient: CoinClient,
  faucetUrl: string,
  address: string,
): Promise<any> {

  // double up the coins
  const tx =
    await requestFaucet(
      aptosClient,
      faucetUrl,
      PUBLIC_KEY,
      ''
    )
  console.log(tx);
  return tx;
}

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

export async function m2RequestFaucet(
  m2Url: string,
  address: string,
  token: string,
): Promise<any> {

  const requestData = {
    FixedAmountRequest: {
      recipient: address
    }
  };
  const myHeaders = new Headers();
  myHeaders.append("Token", token);
  myHeaders.append("Content-Type", "application/json");
  const requestOptions:any = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(requestData),
    redirect: "follow"
  };

  try{
    const res:any = await fetch(m2Url, requestOptions) .then((response) => response.text());
    const res1 = JSON.parse(res);

    if (res1.code == 200) {
      return {success:res1};
    }else{
      return {error:res1.message?.message||res1.message};
    }
  }catch(e){
    return {error:'Limit reached'};
  }
}
