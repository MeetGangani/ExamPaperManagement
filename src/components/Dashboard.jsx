import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import { initializeBlockchain, getContract, connectWallet, interactWithContract } from '../services/blockchain'; // Import functions

import { testPinataConnection, uploadToPinata } from '../services/pinata';

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState({
    pinataConnected: false,
    blockchainConnected: false,
    metamaskConnected: false,
    correctNetwork: false,
    account: null,
    contract: null
  });

  const [formData, setFormData] = useState({
    subject: '',
    examDate: '',
    examTime: '',
    paper: null,
  });

  const SEPOLIA_CHAIN_ID = '0xaa36a7';
  const SEPOLIA_NETWORK_PARAMS = {
    chainId: SEPOLIA_CHAIN_ID,
    chainName: 'Sepolia Test Network',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18
    },
    rpcUrls: ['https://sepolia.infura.io/v3/882fe63a764440e285ab06aa27943e32'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  };

  // Initialize blockchain connection
  const initializeBlockchainConnection = async () => {
    try {
      const isCorrectNetwork = await checkAndSwitchNetwork();
      setStatus(prev => ({ ...prev, correctNetwork: isCorrectNetwork }));

      if (!isCorrectNetwork) return;

      const contract = await initializeBlockchain();
      setStatus(prev => ({
        ...prev,
        blockchainConnected: true,
        contract: contract
      }));
    } catch (err) {
      console.error('Error initializing contract:', err);
      setError('Failed to initialize blockchain contract');
      setStatus(prev => ({
        ...prev,
        blockchainConnected: false,
        contract: null
      }));
    }
  };

  // Function to check and switch network if needed
  const checkAndSwitchNetwork = async () => {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      if (chainId !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
          return true;
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [SEPOLIA_NETWORK_PARAMS],
              });
              return true;
            } catch (addError) {
              setError('Failed to add Sepolia network. Please add it manually in MetaMask.');
              return false;
            }
          }
          setError('Failed to switch to Sepolia network. Please switch manually in MetaMask.');
          return false;
        }
      }
      return true;
    } catch (err) {
      setError('Error checking network. Please make sure MetaMask is installed and unlocked.');
      return false;
    }
  };

  // Connect Wallet
  const handleConnectWallet = async () => {
    await connectWallet();
    setStatus(prev => ({
      ...prev,
      metamaskConnected: true
    }));
  };

  // Set Exam Time
  const handleSetExamTime = async () => {
    if (status.contract && formData.examDate && formData.examTime) {
      try {
        const paperId = formData.subject; // Assuming subject is the paper ID for now
        const startTime = new Date(formData.examDate + ' ' + formData.examTime).getTime() / 1000;

        await status.contract.methods.setExamTime(paperId, startTime).send({ from: status.account });
        console.log('Exam time set successfully');
      } catch (err) {
        console.error('Error setting exam time:', err);
      }
    }
  };

  // Upload Paper
  const handleUploadPaper = async () => {
    if (status.contract && formData.paper) {
      try {
        const paperData = formData.paper; // Assuming paper data is an IPFS hash or file
        await status.contract.methods.uploadPaper(paperData).send({ from: status.account });
        console.log('Paper uploaded successfully');
      } catch (err) {
        console.error('Error uploading paper:', err);
      }
    }
  };

  // Approve Paper
  const handleApprovePaper = async () => {
    if (status.contract && formData.subject) {
      try {
        const paperId = formData.subject; // Assuming subject is the paper ID
        await status.contract.methods.approvePaper(paperId).send({ from: status.account });
        console.log('Paper approved successfully');
      } catch (err) {
        console.error('Error approving paper:', err);
      }
    }
  };

  // Initialize on component mount
  useEffect(() => {
    const initialize = async () => {
      if (typeof window.ethereum === 'undefined') {
        setError('Please install MetaMask to use this application');
        return;
      }

      if (window.ethereum.isPhantom) {
        setError('Please use MetaMask instead of Phantom wallet');
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setStatus(prev => ({
            ...prev,
            metamaskConnected: true,
            account: accounts[0]
          }));
          await initializeBlockchainConnection();
        }

        // Test Pinata connection
        const isPinataConnected = await testPinataConnection();
        setStatus(prev => ({ ...prev, pinataConnected: isPinataConnected }));
      } catch (err) {
        console.error('Error during initialization:', err);
      }

      // Add event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    };

    initialize();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => window.location.reload());
      }
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    setStatus(prev => ({
      ...prev,
      account: accounts[0]
    }));
  };

  return (
    <div>
      <h1>Admin Panel</h1>
      <div>
        <h2>Blockchain Connection</h2>
        {!status.metamaskConnected ? (
          <button onClick={handleConnectWallet}>Connect Wallet</button>
        ) : (
          <p>Wallet Connected: {status.account}</p>
        )}
        {status.blockchainConnected ? <p>Blockchain Connected</p> : <p>Not Connected</p>}
      </div>

      <div>
        <h2>Manage Exam Papers</h2>
        <form>
          <label>
            Subject (Paper ID):
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </label>
          <label>
            Exam Date:
            <input
              type="date"
              value={formData.examDate}
              onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
            />
          </label>
          <label>
            Exam Time:
            <input
              type="time"
              value={formData.examTime}
              onChange={(e) => setFormData({ ...formData, examTime: e.target.value })}
            />
          </label>
          <button type="button" onClick={handleSetExamTime}>Set Exam Time</button>
          <label>
            Upload Paper (IPFS Hash):
            <input
              type="text"
              value={formData.paper}
              onChange={(e) => setFormData({ ...formData, paper: e.target.value })}
            />
          </label>
          <button type="button" onClick={handleUploadPaper}>Upload Paper</button>
          <button type="button" onClick={handleApprovePaper}>Approve Paper</button>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;
