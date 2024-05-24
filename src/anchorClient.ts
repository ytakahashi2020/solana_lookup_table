import {
  PublicKey,
  SystemProgram,
  Connection,
  TransactionMessage,
  VersionedTransaction,
  AddressLookupTableProgram,
} from "@solana/web3.js";

import { AnchorWallet } from "@solana/wallet-adapter-react";

export async function createLookupTable(
  wallet: AnchorWallet,
  connection: Connection,
  csvData
) {
  let blockhash = await connection
    .getLatestBlockhash()
    .then((res) => res.blockhash);
  let slot = await connection.getSlot();
  console.log("createLookupTableに渡されたcsvData:", csvData); // デバッグ用

  // CSVデータからPublicKeyのリストを作成
  const addresses = csvData.map((address) => new PublicKey(address.toString()));

  // 必要なアドレスを追加
  addresses.push(wallet.publicKey);

  const [lookupTableInst, lookupTableAddress] =
    AddressLookupTableProgram.createLookupTable({
      authority: wallet.publicKey,
      payer: wallet.publicKey,
      recentSlot: slot - 1,
    });

  const extendInstruction = AddressLookupTableProgram.extendLookupTable({
    payer: wallet.publicKey,
    authority: wallet.publicKey,
    lookupTable: lookupTableAddress,
    addresses: addresses,
  });

  console.log("lookup table address:", lookupTableAddress.toBase58());

  const messageV0 = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: blockhash,
    instructions: [lookupTableInst, extendInstruction],
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  const signedTransaction = await wallet.signTransaction(transaction);

  const transactionSignature = await connection.sendTransaction(
    signedTransaction
  );
  return {
    lookupTableAddress,
    transactionSignature,
  };
}
