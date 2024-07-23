import {FailedTransactionError} from "aptos";
import {useEffect, useState} from "react";
import {
  useWallet,
  InputTransactionData,
} from "@aptos-labs/wallet-adapter-react";
import {useGlobalState} from "../../global-config/GlobalConfig";

export type TransactionResponse =
  | TransactionResponseOnSubmission
  | TransactionResponseOnError;

// "submission" here means that the transaction is posted on chain and gas is paid.
// However, the status of the transaction might not be "success".
export type TransactionResponseOnSubmission = {
  transactionSubmitted: true;
  transactionHash: string;
  success: boolean; // indicates if the transaction submitted but failed or not
  message?: string; // error message if the transaction failed
};

export type TransactionResponseOnError = {
  transactionSubmitted: false;
  message: string;
};

const useSubmitTransaction = () => {
  const [transactionResponse, setTransactionResponse] =
    useState<TransactionResponse | null>(null);
  const [transactionInProcess, setTransactionInProcess] =
    useState<boolean>(false);
  const [state] = useGlobalState();
  const {signAndSubmitTransaction, wallet, network} = useWallet();

  useEffect(() => {
    if (transactionResponse !== null) {
      setTransactionInProcess(false);
    }
  }, [transactionResponse]);

  async function submitTransaction(transaction: InputTransactionData) : Promise<any> {

    setTransactionInProcess(true);

    const signAndSubmitTransactionCall = async (
      transaction: InputTransactionData,
    ): Promise<TransactionResponse> => {
      const responseOnError: TransactionResponseOnError = {
        transactionSubmitted: false,
        message: "Unknown Error",
      };

      let response;
      try {
        response = await signAndSubmitTransaction(transaction);

        // transaction submit succeed
        if ("hash" in response) {
          await state.aptos_client.waitForTransaction(response["hash"], {
            checkSuccess: true,
          });
          return response["hash"]
        }
        // transaction failed
        return response.message;
      } catch (error) {
        if (error instanceof FailedTransactionError) {
          return {
            transactionSubmitted: true,
            transactionHash: response ? response.hash : "",
            message: error.message,
            success: false,
          };
        } else if (error instanceof Error) {
          return {...responseOnError, message: error.message};
        }
      }
      return responseOnError;
    };

    await signAndSubmitTransactionCall(transaction).then(
      setTransactionResponse,
    );
  }

  function clearTransactionResponse() {
    setTransactionResponse(null);
  }

  return {
    submitTransaction,
    transactionInProcess,
    transactionResponse,
    clearTransactionResponse,
  };
};

export default useSubmitTransaction;
