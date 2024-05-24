"use client";

import React, { useState, useEffect } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  callPDAProgram2,
  callPDAFetchCounter,
  callPDAUpdateCounter,
} from "../../anchorClient";

import {
  useConnection,
  useWallet,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";

const LookupTableComponent: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [status, setStatus] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [lookupTableAddress, setLookupTableAddress] = useState("");
  const handleLookup = async () => {
    if (!connected) {
      setStatus("ウォレットが接続されていません");
      return;
    }

    setStatus("プログラム実行中...");

    try {
      const { lookupTableAddress, transactionSignature } =
        await callPDAProgram2(wallet, connection);
      setStatus("プログラムが正常に実行されました");
      setResultUrl(
        `https://solscan.io/tx/${transactionSignature}?cluster=devnet`
      );
      setLookupTableAddress(lookupTableAddress.toBase58());
    } catch (error) {
      console.error("プログラムの実行中にエラーが発生しました:", error);
      setStatus("プログラムの実行中にエラーが発生しました");
    }
  };

  return (
    <div className="p-4 bg-gray-100">
      <button
        onClick={handleLookup}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Lookup Tableを取得
      </button>
      <div className="mt-4">
        {status && <p className="text-green-500">{status}</p>}
        {lookupTableAddress && (
          <p className="text-gray-700">
            Lookup Table Address: {lookupTableAddress}
          </p>
        )}
        {resultUrl && (
          <a
            href={resultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            トランザクションを確認する
          </a>
        )}
      </div>
    </div>
  );
};

export default LookupTableComponent;
