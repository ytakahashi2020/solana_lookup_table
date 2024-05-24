"use client";

import React, { useState } from "react";
import Papa from "papaparse"; // CSVパーサーをインポート
import { createLookupTable } from "../anchorClient";

import {
  useConnection,
  useWallet,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
type CsvDataType = string;

const LookupTableComponent: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [status, setStatus] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [lookupTableAddress, setLookupTableAddress] = useState("");

  const [csvData, setCsvData] = useState<CsvDataType[]>([]);

  const handleFileUpload = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: false,
        complete: (results) => {
          const data = results.data as string[];
          setCsvData(data);
        },
        error: (error) => {
          console.error("CSVの解析中にエラーが発生しました:", error);
          setStatus("CSVの解析中にエラーが発生しました");
        },
      });
    }
  };
  const handleLookup = async () => {
    if (!connected) {
      setStatus("ウォレットが接続されていません");
      return;
    }
    if (!wallet) {
      setStatus("ウォレットが接続されていません");
      return;
    }
    if (!csvData || csvData.length === 0) {
      setStatus("CSVファイルをアップロードしてください");
      return;
    }

    setStatus("プログラム実行中...");

    try {
      const { lookupTableAddress, transactionSignature } =
        await createLookupTable(wallet, connection, csvData);
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Lookuptable 作成ツール
        </h1>
        <div className="mb-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {csvData && csvData.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-bold">CSVの内容:</h3>
            <table className="table-auto w-full mt-2">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Address</th>
                </tr>
              </thead>
              <tbody>
                {csvData.map((address, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 border">{address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4">
          <button
            onClick={handleLookup}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Lookup Tableの作成
          </button>
        </div>
        {status && <p className="mt-4 text-green-500">{status}</p>}
        {lookupTableAddress && (
          <p className="mt-2 text-gray-700">
            Lookup Table Address: {lookupTableAddress}
          </p>
        )}
        {resultUrl && (
          <a
            href={resultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 text-blue-500 underline"
          >
            トランザクションを確認する
          </a>
        )}
      </div>
    </div>
  );
};

export default LookupTableComponent;
