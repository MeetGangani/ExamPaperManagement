import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import { initializeBlockchain, getContract, connectWallet, interactWithContract } from '../services/blockchain';
import { testPinataConnection, uploadToPinata } from '../services/pinata';

const AdminPanel = () => {
  const [ipfsConnected, setIpfsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
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

  const handleConnectWallet = async () => {
    await connectWallet();
    setStatus(prev => ({
      ...prev,
      metamaskConnected: true
    }));
  };

  const handleSetExamTime = async () => {
    if (status.contract && formData.examDate && formData.examTime) {
      try {
        const paperId = formData.subject;
        const startTime = new Date(formData.examDate + ' ' + formData.examTime).getTime() / 1000;
        await status.contract.methods.setExamTime(paperId, startTime).send({ from: status.account });
        setStatusMessage('Exam time set successfully');
      } catch (err) {
        console.error('Error setting exam time:', err);
        setStatusMessage('Failed to set exam time');
      }
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setUploadStatus('');
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    try {
      setLoading(true);
      setUploadStatus('Uploading to IPFS...');
      const ipfsHash = await uploadToPinata(selectedFile);
      setFormData(prev => ({ ...prev, paper: ipfsHash }));
      setUploadStatus(`File uploaded successfully! IPFS Hash: ${ipfsHash}`);
      setLoading(false);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('Failed to upload file to IPFS');
      setLoading(false);
    }
  };

  const handleApprovePaper = async () => {
    if (status.contract && formData.subject) {
      try {
        const paperId = formData.subject;
        await status.contract.methods.approvePaper(paperId).send({ from: status.account });
        setStatusMessage('Paper approved successfully');
      } catch (err) {
        console.error('Error approving paper:', err);
        setStatusMessage('Failed to approve paper');
      }
    }
  };

  useEffect(() => {
    const checkPinataConnection = async () => {
      const isConnected = await testPinataConnection();
      setIpfsConnected(isConnected);
      setStatusMessage(isConnected ? 'Connected to IPFS' : 'Failed to connect to IPFS');
    };

    checkPinataConnection();
  }, []);

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

        const isPinataConnected = await testPinataConnection();
        setStatus(prev => ({ ...prev, pinataConnected: isPinataConnected }));
      } catch (err) {
        console.error('Error during initialization:', err);
      }

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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Blockchain Connection</h2>
        {!status.metamaskConnected ? (
          <button 
            onClick={handleConnectWallet}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Connect Wallet
          </button>
        ) : (
          <p className="text-gray-700">Wallet Connected: {status.account}</p>
        )}
        <p className="mt-2">
          Blockchain Status: {status.blockchainConnected ? 'Connected' : 'Not Connected'}
        </p>
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">IPFS File Upload</h2>
        <div className="space-y-4">
          <div>
            <p className="mb-2">IPFS Connection Status: {ipfsConnected ? 'Connected' : 'Not Connected'}</p>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <button
            onClick={handleFileUpload}
            disabled={!selectedFile || loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? 'Uploading...' : 'Upload to IPFS'}
          </button>
          {uploadStatus && (
            <p className={`mt-2 ${uploadStatus.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {uploadStatus}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Manage Exam Papers</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Subject (Paper ID):
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Exam Date:
              <input
                type="date"
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Exam Time:
              <input
                type="time"
                value={formData.examTime}
                onChange={(e) => setFormData({ ...formData, examTime: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>
          <div className="space-x-4">
            <button
              type="button"
              onClick={handleSetExamTime}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Set Exam Time
            </button>
            <button
              type="button"
              onClick={handleApprovePaper}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Approve Paper
            </button>
          </div>
          {statusMessage && (
            <p className={`mt-2 ${statusMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {statusMessage}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;