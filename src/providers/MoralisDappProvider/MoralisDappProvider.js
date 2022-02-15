import React, { useEffect, useState } from "react";
import { useMoralis } from "react-moralis";
import MoralisDappContext from "./context";

function MoralisDappProvider({ children }) {
  const { web3, Moralis, user } = useMoralis();
  const [walletAddress, setWalletAddress] = useState();
  const [chainId, setChainId] = useState();
  const [contractABI, setContractABI] = useState('[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"categoryId","type":"bytes32"},{"indexed":false,"internalType":"string","name":"category","type":"string"}],"name":"CategoryCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"contentId","type":"bytes32"},{"indexed":false,"internalType":"string","name":"contentUri","type":"string"}],"name":"ContentAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":true,"internalType":"bytes32","name":"fundId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"fundOwner","type":"address"},{"indexed":true,"internalType":"address","name":"Donater","type":"address"},{"indexed":false,"internalType":"uint80","name":"reputationfundOwner","type":"uint80"},{"indexed":false,"internalType":"uint80","name":"reputationDonater","type":"uint80"},{"indexed":false,"internalType":"bool","name":"up","type":"bool"},{"indexed":false,"internalType":"uint8","name":"reputationAmount","type":"uint8"}],"name":"Donated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"fundId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"fundOwner","type":"address"},{"indexed":true,"internalType":"bytes32","name":"parentId","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"contentId","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"categoryId","type":"bytes32"},{"indexed":false,"internalType":"address[]","name":"receivers","type":"address[]"}],"name":"FundCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"fundId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"fundOwner","type":"address"},{"indexed":true,"internalType":"bytes32","name":"parentId","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"contentId","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"categoryId","type":"bytes32"}],"name":"FundEnded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":true,"internalType":"bytes32","name":"fundId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"fundOwner","type":"address"},{"indexed":true,"internalType":"address","name":"Donater","type":"address"},{"indexed":false,"internalType":"uint80","name":"reputationfundOwner","type":"uint80"},{"indexed":false,"internalType":"uint80","name":"reputationDonater","type":"uint80"},{"indexed":false,"internalType":"bool","name":"up","type":"bool"},{"indexed":false,"internalType":"uint8","name":"reputationAmount","type":"uint8"}],"name":"RetractedDonation","type":"event"},{"inputs":[{"internalType":"string","name":"_category","type":"string"}],"name":"addCategory","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_parentId","type":"bytes32"},{"internalType":"string","name":"_contentUri","type":"string"},{"internalType":"bytes32","name":"_categoryId","type":"bytes32"},{"internalType":"address[]","name":"_receivers","type":"address[]"}],"name":"createFund","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_fundId","type":"bytes32"}],"name":"donate","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_fundId","type":"bytes32"}],"name":"endFund","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_categoryId","type":"bytes32"}],"name":"getCategory","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_contentId","type":"bytes32"}],"name":"getContent","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_fundId","type":"bytes32"}],"name":"getFund","outputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"bytes32","name":"","type":"bytes32"},{"internalType":"bytes32","name":"","type":"bytes32"},{"internalType":"bytes32","name":"","type":"bytes32"},{"internalType":"bool","name":"","type":"bool"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"},{"internalType":"bytes32","name":"_categoryID","type":"bytes32"}],"name":"getReputation","outputs":[{"internalType":"uint80","name":"","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"_receiver","type":"address"},{"internalType":"bytes32","name":"_fundId","type":"bytes32"}],"name":"retractDonation","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_fundId","type":"bytes32"},{"internalType":"address payable","name":"_receiver","type":"address"}],"name":"withdrawFunding","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"receiver","type":"address"}],"name":"withdrawOwnerRewards","outputs":[],"stateMutability":"nonpayable","type":"function"}]');
  const [contractAddress, setContractAddress] = useState("0xd0111be08499E32Ec9398c19CDadf81d663be8eA");
  const [selectedCategory, setSelectedCategory] = useState({"categoryId":"0x91","category":"default"});
  


  useEffect(() => {
    Moralis.onChainChanged(function (chain) {
      setChainId(chain);
    });

    Moralis.onAccountsChanged(function (address) {
      setWalletAddress(address[0]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setChainId(web3.givenProvider?.chainId));
  useEffect(
    () => setWalletAddress(web3.givenProvider?.selectedAddress || user?.get("ethAddress")),
    [web3, user]
  );

  return (
    <MoralisDappContext.Provider value={{ walletAddress, chainId, selectedCategory, setSelectedCategory, contractABI, setContractABI, contractAddress, setContractAddress }}>
      {children}
    </MoralisDappContext.Provider>
  );
}

function useMoralisDapp() {
  const context = React.useContext(MoralisDappContext);
  if (context === undefined) {
    throw new Error("useMoralisDapp must be used within a MoralisDappProvider");
  }
  return context;
}

export { MoralisDappProvider, useMoralisDapp };
