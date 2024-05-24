import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  ComputeBudgetProgram,
  Keypair,
  Connection,
  TransactionMessage,
  VersionedTransaction,
  clusterApiUrl,
  AddressLookupTableProgram,
} from "@solana/web3.js";
import IDL from "./idl.json";
import IDL_anchor from "./idl_hello_anchor.json";
import IDL_pda from "./idl_pda.json";
import { Program } from "@coral-xyz/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";

const programId = new PublicKey("467TS9z5e37HuPvkQBv4nNndyaK2GpnF2bZY2HsdpkcH");
const programId_2 = new PublicKey(
  "Bk2X3u9bbdEBG5WpH4ENH8dyidcRaoxij1xT2xrdYx2K"
);
const programId_pda = new PublicKey(
  "DdvaKpcPQiBaKSJ9dkHbrtfrtZQ6LrtCX2qgqKufMchG"
);

function createProvider(wallet: AnchorWallet, connection: Connection) {
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);
  return provider;
}

function createTransaction() {
  const transaction = new Transaction();
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 200000, // 必要なユニット数（必要に応じて調整）
    })
  );
  return transaction;
}

export async function callHelloProgram(
  wallet: AnchorWallet,
  connection: Connection
) {
  const provider = createProvider(wallet, connection);
  const program = new Program(IDL, programId, provider);
  const transaction = createTransaction();

  transaction.add(
    await program.methods.initialize().accounts({}).instruction()
  );

  return await provider.sendAndConfirm(transaction);
}

export async function callHelloAnchorProgram(
  wallet: AnchorWallet,
  connection: Connection
) {
  const provider = createProvider(wallet, connection);
  const program = new Program(IDL_anchor, programId_2, provider);
  const transaction = createTransaction();

  const newAccountKp = new Keypair();
  console.log("newAccountKp.publicKey", newAccountKp.publicKey.toBase58());
  console.log("wallet.publicKey", wallet.publicKey.toBase58());

  const data = new BN(10);
  transaction.add(
    await program.methods
      .initialize(data)
      .accounts({
        newAccount: newAccountKp.publicKey,
        signer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction()
  );
  console.log("transaction");

  return await provider.sendAndConfirm(transaction, [newAccountKp]);
}

export async function callPDAProgram(
  wallet: AnchorWallet,
  connection: Connection
) {
  const provider = createProvider(wallet, connection);
  const program = new Program(IDL_pda, programId_pda, provider);
  const transaction = createTransaction();

  const [counter, _counterBump] =
    await anchor.web3.PublicKey.findProgramAddressSync(
      [wallet.publicKey.toBytes()],
      program.programId
    );
  console.log("Your counter address", counter.toString());

  console.log("wallet.publicKey", wallet.publicKey.toBytes());

  transaction.add(
    await program.methods
      .createCounter()
      .accounts({
        authority: wallet.publicKey,
        counter: counter,
        systemProgram: SystemProgram.programId,
      })
      .instruction()
  );
  console.log("transaction");

  return await provider.sendAndConfirm(transaction);
}

export async function callPDAFetchCounter(
  wallet: AnchorWallet,
  connection: Connection
) {
  const provider = createProvider(wallet, connection);
  const program = new Program(IDL_pda, programId_pda, provider);
  const transaction = createTransaction();
  const [counterPubkey, _] = await anchor.web3.PublicKey.findProgramAddressSync(
    [wallet.publicKey.toBytes()],
    program.programId
  );
  console.log("Your counter address", counterPubkey.toString());
  return await program.account.counter.fetch(counterPubkey);
}

export async function callPDAUpdateCounter(
  wallet: AnchorWallet,
  connection: Connection
) {
  const provider = createProvider(wallet, connection);
  const program = new Program(IDL_pda, programId_pda, provider);
  const transaction = createTransaction();

  const [counterPubkey, _] = await anchor.web3.PublicKey.findProgramAddressSync(
    [wallet.publicKey.toBytes()],
    program.programId
  );

  transaction.add(
    await program.methods
      .updateCounter()
      .accounts({
        counter: counterPubkey,
      })
      .instruction()
  );
  console.log("transaction");

  return await provider.sendAndConfirm(transaction);
}

export async function callPDAProgram2(
  wallet: AnchorWallet,
  connection: Connection
) {
  let blockhash = await connection
    .getLatestBlockhash()
    .then((res) => res.blockhash);
  let slot = await connection.getSlot();

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
    addresses: [
      wallet.publicKey,
      SystemProgram.programId,
      // ⇩適当なアドレスです。
      new PublicKey("31Jy3nFeb5hKVdB4GS4Y7MhU7zhNMFxwF7RGVhPc1TzR"),
      new PublicKey("HKSeapcvwJ7ri6mf3HwBtspLFTDKqaJrMsozdfXfg5y2"),
    ],
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
