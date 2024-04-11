import { SolanaSignInInput } from '@solana/wallet-standard-features';
import { nanoid } from 'nanoid';

export const createSignInData = async (): Promise<SolanaSignInInput> => {
  const now: Date = new Date();
  const uri = window.location.href;
  const currentUrl = new URL(uri);
  const domain = currentUrl.host;

  // Convert the Date object to a string
  const currentDateTime = now.toISOString();
  const signInData: SolanaSignInInput = {
    nonce: 'KCCrdp2wMF3j05wYPltwu',
    // chainId: 'mainnet',
    issuedAt: '2024-04-11T05:46:45.457Z',

    domain,
    statement: 'Sign in with Solana to the app.',
    version: '1',
    // nonce: 'oBbLoEldZs',
    // chainId: 'mainnet',
    // issuedAt: currentDateTime,
    // resources: ["https://example.com", "https://phantom.app/"],
  };

  return signInData;
};

export const createSignInErrorData = async (): Promise<SolanaSignInInput> => {
  const now: Date = new Date();

  // Convert the Date object to a string
  const currentDateTime = now.toISOString();
  const signInData: SolanaSignInInput = {
    domain: 'phishing.com',
    statement: 'Sign-in to connect!',
    uri: 'https://www.phishing.com',
    version: '1',
    nonce: 'oBbLoEldZs',
    chainId: 'solana:mainnet',
    issuedAt: currentDateTime,
    resources: ['https://example.com', 'https://phantom.app/'],
  };

  return signInData;
};
