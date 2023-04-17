import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
  VStack,
  useToast,
  Link
} from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Alchemy, Network } from 'alchemy-sdk';
import { useState, useEffect } from 'react';
import { useProvider, useAccount } from "wagmi";
import { ethers } from 'ethers';


const config = {
  apiKey: import.meta.env.VITE_ALCHEMY_MAINNET_KEY,
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(config);

function App() {
  const { address, isConnected, isDisconnected } = useAccount()
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [isValidAddress, setIsValidAddress] = useState()
  const toast = useToast()


  useEffect(()=>{
    if(isDisconnected){
      document.getElementById('wallet-address').value = ''
      setUserAddress('');
    } else if(isConnected){
      document.getElementById('wallet-address').value = address
      setUserAddress(address);
    }
  }, [address, isDisconnected, isConnected])

  useEffect(()=>{
    async function resolveAddress(addressToResolve){
      let isAddress = ethers.utils.isAddress(addressToResolve);
      let ensAddress;
      if(!isAddress){
        try { ensAddress = await alchemy.core.resolveName(addressToResolve); }
        catch(e){}
      }
      if(ensAddress != undefined)
        isAddress = true
      setIsValidAddress(!isAddress)
    }
    resolveAddress(userAddress)
  }, [userAddress, isValidAddress])

  async function makeDataPerCollection(ownedNfts) {
    var nftBatch = []
    for(let i=0;i<ownedNfts.length;i++){
      nftBatch.push({
        contractAddress: ownedNfts[i].contract.address,
        tokenId: ownedNfts[i].tokenId,
        tokenType: ownedNfts[i].tokenType,
      })
    }
    return nftBatch
  }

  async function getNFTsForOwner() {
    setHasQueried(true);
    setIsReady(false);

    const data = await alchemy.nft.getNftsForOwner(userAddress);
    if(data.ownedNfts.length == 0){
      toast({
        position: "top-left",
        title: "No NFTs found",
        description: "just try another address",
        status: "warning",
        duration: 9000,
        isClosable: true,
      })
    }
    setResults(data);

    const tokenDataPromises = [];

    if(data.ownedNfts.length>30){
      let batches =  await makeDataPerCollection(data.ownedNfts)
      const tokenData = await alchemy.nft.getNftMetadataBatch(
        batches, 
        {
          tokenUriTimeoutInMs: 5000,
          refreshCache: true
        }
      );
      setTokenDataObjects(tokenData)
    } else {
      for (let i = 0; i < data.ownedNfts.length; i++) {
      
        const tokenData = alchemy.nft.getNftMetadata(
          data.ownedNfts[i].contract.address,
          data.ownedNfts[i].tokenId,
          {}
        );
        tokenDataPromises.push(tokenData);
      }
      setTokenDataObjects(await Promise.all(tokenDataPromises));
    }
    setHasQueried(false);
    setIsReady(true);
  }

  return (
    <>
    <Box className='wallet-connect'>
      <ConnectButton />
    </Box>
    <Box w="100vw">
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={5} fontSize={36}>
            NFT Indexer 🖼
          </Heading>
          <Text>
            Plug in an address and this website will return all of its NFTs!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={10} mb={5}>Get all the ERC-721 tokens of this address:</Heading>
        <Input
          id='wallet-address'
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
          defaultValue={userAddress}
        />
        <Button fontSize={20} onClick={getNFTsForOwner} mt={5} id='check-balance' isLoading={hasQueried} isDisabled={isValidAddress} >
          Fetch NFTs
        </Button>
        <Heading my={10}>Here are your NFTs:</Heading>
        </Flex>
    </Box>
        {isReady && results.ownedNfts.length > 0 ? (
          <Center>
          <SimpleGrid w={'90vw'} columns={4} spacing={24}>
            {results.ownedNfts.map((e, i) => {
              return (
                <Flex
                  flexDir={'column'}
                  w={'20vw'}
                  key={e.contract.address + '/' + e.tokenId}
                  
                >
                  <Box className='img__wrap'>
                    {
                      tokenDataObjects[i].media[0]?.gateway ? (
                        tokenDataObjects[i].media[0].format == 'mp4' ? 
                        (
                          <video autoPlay loop>
                            <source src={tokenDataObjects[i].media[0].gateway} ></source>
                          </video>
                        ) :  
                        (
                          <>
                          <Image
                            src={
                              tokenDataObjects[i].media[0]?.gateway ??
                              'https://etherscan.io/images/main/nft-placeholder.svg'
                            }
                            alt={'Image'}
                            sx={{
                              '.my-box:hover &': {
                                color: 'green.500',
                              },
                            }}
                          />
                          </>
                        )  
                      ) : ( 
                        tokenDataObjects[i].rawMetadata?.animation_url ? (
                            <video autoPlay loop>
                              <source src={tokenDataObjects[i].rawMetadata?.animation_url} ></source>
                            </video>
                          ) : (
                            <Image
                              src={'https://etherscan.io/images/main/nft-placeholder.svg'}
                              alt={'Image'}
                            />
                          )
                      )
                    }
                    <Link href={'https://opensea.io/assets?search[query]=' + tokenDataObjects[i].contract?.address} isExternal>
                    <Box className="img__description_layer">
                      <Box className="img__description" >
                        <VStack>
                          <Text fontSize={'lg'}>
                            {tokenDataObjects[i].contract?.name === 0  ? 'No name':  tokenDataObjects[i].contract?.name  } 
                          </Text>
                          <Text fontSize={'lg'}>
                            #{ tokenDataObjects[i].tokenId.length === 0 ? 'No id' : tokenDataObjects[i].tokenId } 
                          </Text>
                          {
                            
                          }
                        </VStack>
                      </Box>
                    </Box>
                    </Link>
                  </Box>
                </Flex>
              );
            })}
          </SimpleGrid>
          </Center>
        ) : (hasQueried && !isReady) ? (  
        <Center>
          Just wait a bit more ...
        </Center>) : (
      <Center>
        Input a valid address or ENS name and click the button above!
      </Center>
    )}
    </>
  );
}

export default App;
