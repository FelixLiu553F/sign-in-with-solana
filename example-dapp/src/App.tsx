import React, { useState, useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import type { Adapter } from '@solana/wallet-adapter-base';
import type { SolanaSignInInput, SolanaSignInOutput } from '@solana/wallet-standard-features';

import { createSignInData, createSignInErrorData } from './utils';

import { TLog } from './types';

import { Logs, Sidebar, AutoConnectProvider } from './components';
import { verifySignIn } from './myTestSign';
import { buffer } from 'stream/consumers';
// import { verifySignIn } from '@solana/wallet-standard-util';

// =============================================================================
// Styled Components
// =============================================================================

const StyledApp = styled.div`
  display: flex;
  flex-direction: row;
  height: 100vh;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

// =============================================================================
// Constants
// =============================================================================

const message = 'To avoid digital dognappers, sign below to authenticate with CryptoCorgis.';

// =============================================================================
// Typedefs
// =============================================================================

export type ConnectedMethods =
  | {
      name: string;
      onClick: () => Promise<string>;
    }
  | {
      name: string;
      onClick: () => Promise<void>;
    };

const StatelessApp = () => {
  const { wallet, publicKey, connect, disconnect, signMessage, signIn } = useWallet();
  const [logs, setLogs] = useState<TLog[]>([]);

  const createLog = useCallback(
    (log: TLog) => {
      return setLogs((logs) => [...logs, log]);
    },
    [setLogs]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, [setLogs]);

  useEffect(() => {
    if (!publicKey || !wallet) return;

    createLog({
      status: 'success',
      method: 'connect',
      message: `Connected to account ${publicKey.toBase58()}`,
    });
  }, [createLog, publicKey, wallet]);

  /** SignMessage */
  const handleSignMessage = useCallback(async () => {
    if (!publicKey || !wallet) return;

    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);

      createLog({
        status: 'success',
        method: 'signMessage',
        message: `Message signed with signature: ${JSON.stringify(signature)}`,
      });
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signMessage',
        message: error.message,
      });
    }
  }, [createLog, publicKey, signMessage, wallet]);

  /** SignIn */
  // const handleSignIn = useCallback(async () => {
  //   if (!publicKey || !wallet) return;
  //   const signInData = await createSignInData();

  //   try {
  //     const { account, signedMessage, signature } = await signIn(signInData);
  //     createLog({
  //       status: 'success',
  //       method: 'signIn',
  //       message: `Message signed: ${JSON.stringify(signedMessage)} by ${
  //         account.address
  //       } with signature ${JSON.stringify(signature)}`,
  //     });
  //   } catch (error) {
  //     createLog({
  //       status: 'error',
  //       method: 'signIn',
  //       message: error.message,
  //     });
  //   }
  // }, [createLog, publicKey, signIn, wallet]);

  /** SignInError */
  const handleSignInError = useCallback(async () => {
    if (!publicKey || !wallet) return;
    const signInData = await createSignInErrorData();

    try {
      const { account, signedMessage, signature } = await signIn(signInData);
      createLog({
        status: 'success',
        method: 'signMessage',
        message: `Message signed: ${JSON.stringify(signedMessage)} by ${
          account.address
        } with signature ${JSON.stringify(signature)}`,
      });
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signIn',
        message: error.message,
      });
    }
  }, [createLog, publicKey, signIn, wallet]);

  /** Connect */
  const handleConnect = useCallback(async () => {
    if (!publicKey || !wallet) return;

    try {
      await connect();
    } catch (error) {
      createLog({
        status: 'error',
        method: 'connect',
        message: error.message,
      });
    }
  }, [connect, createLog, publicKey, wallet]);

  /** Disconnect */
  const handleDisconnect = useCallback(async () => {
    if (!publicKey || !wallet) return;

    try {
      await disconnect();
      createLog({
        status: 'warning',
        method: 'disconnect',
        message: '👋',
      });
    } catch (error) {
      createLog({
        status: 'error',
        method: 'disconnect',
        message: error.message,
      });
    }
  }, [createLog, disconnect, publicKey, wallet]);

  const connectedMethods = useMemo(() => {
    return [
      {
        name: 'Sign Message',
        onClick: handleSignMessage,
      },
      // {
      //   name: 'Sign In',
      //   onClick: handleSignIn,
      // },
      {
        name: 'Sign In Error',
        onClick: handleSignInError,
      },
      {
        name: 'Disconnect',
        onClick: handleDisconnect,
      },
    ];
  }, [handleSignMessage, handleSignInError, handleDisconnect]);

  return (
    <StyledApp>
      <Sidebar publicKey={publicKey} connectedMethods={connectedMethods} connect={handleConnect} />
      <Logs publicKey={publicKey} logs={logs} clearLogs={clearLogs} />
    </StyledApp>
  );
};

// =============================================================================
// Main Component
// =============================================================================
const App = () => {
  const network = WalletAdapterNetwork.Mainnet;

  const endpoint = `https://api.mainnet-beta.solana.com`;

  const wallets = useMemo(
    () => [], // confirmed also with `() => []` for wallet-standard only
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  );

  const autoSignIn = useCallback(async (adapter: Adapter) => {
    if (!('signIn' in adapter)) {
      return true;
    }

    // Fetch the signInInput from the backend

    const createResponse = await fetch('http://localhost:4000/api/createSignInData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uri: window.location.href,
        publicKey: 'HE8pSJWmUKcw1z8aBk6SYCDjfBxBF4tY9MziThCEsT1K',
      }),
    });
    const inputB: SolanaSignInInput & { publicKey: string } = await createResponse.json();

    // const input: SolanaSignInInput = await createSignInData();
    console.log('input', inputB);

    const { publicKey, ...input } = inputB;

    // Send the signInInput to the wallet and trigger a sign-in request
    const output = await adapter.signIn(input);
    console.log('output', output);
    const constructPayload = JSON.stringify({ input, output, publicKey: output.account.publicKey });

    // Verify the sign-in output against the generated input server-side

    /* ------------------------------------ BACKEND ------------------------------------ */
    const deconstructPayload: { input: SolanaSignInInput; output: SolanaSignInOutput } = JSON.parse(constructPayload);
    const backendInput = deconstructPayload.input;
    console.log(Array.from(output.account.publicKey));
    // console.log(output.account.publicKey.toString('base64'));
    const backendOutput = {
      account: {
        publicKey: Array.from(output.account.publicKey),
        ...output.account,
      },
      signature: Array.from(output.signature),
      signedMessage: Array.from(output.signedMessage),
    };
    console.log('backendInput:', backendInput);
    console.log('backendOutput:', backendOutput);

    // if (!verifySignIn(backendInput, backendOutput)) {
    //   console.error('Sign In verification failed!');
    //   throw new Error('Sign In verification failed!');
    // }
    // "/backend/verifySIWS" endpoint, `constructPayload` receieved
    const verifyResponse = await fetch('http://localhost:4000/api/verifySIWS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input, output: { ...backendOutput, type: 'phantom' } }),
    });
    const success = await verifyResponse.json();
    console.log(success);
    if (!success) {
      console.error('backend Sign In verification failed!');
      throw new Error('backend Sign In verification failed!');
    } else {
      return false;
    }
    /* ------------------------------------ BACKEND ------------------------------------ */
  }, []);

  const autoConnect = useCallback(
    async (adapter: Adapter) => {
      console.log('autoConnect:', adapter);
      console.log(window.location.href);
      // const a = await adapter.autoConnect();
      // console.log(a);
      adapter
        .autoConnect()
        .then((res) => {
          console.log(res);
        })
        .catch((e) => {
          return autoSignIn(adapter);
        });
      return false;
    },
    [autoSignIn]
  );

  return (
    <AutoConnectProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={autoConnect}>
          <WalletModalProvider>
            <StatelessApp />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </AutoConnectProvider>
  );
};

export default App;
