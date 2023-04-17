# Simple NFT Indexer

This is an app that uses the Alchemy SDK rigged to Alchemy's Enhanced APIs in order to display all of an address's ERC-721 and ERC-1155 tokens, including a call to any `image` attached to their metadata.

## Set Up

Environmental variables needed.   
In file `.env` and input   
`VITE_ALCHEMY_MAINNET_KEY` - Alchemy API key for ETH Mainnet  
`VITE_WC_PROJECT_ID` - WalletConnect project ID, it's free, can be acquired on WalletConnect web  

1. Install dependencies by running `npm install`
2. Start application by running `npm run dev`


## Features

- Wallet integration  
- Indication of request in progress  
- ENS support   
- Links to OpenSea
