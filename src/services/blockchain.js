import { ethers } from 'ethers';

// Set up your contract and provider here
let contract;
let provider;
let signer;

// Example contract address and ABI (replace with actual values)
const contractAddress = "0xd9145CCE52D386f254917e481eB44e9943F39138";
const contractABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_paperId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_encryptionKey",
				"type": "string"
			}
		],
		"name": "approvePaper",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "paperId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "startTime",
				"type": "uint256"
			}
		],
		"name": "ExamTimeSet",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "paperId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "encryptionKey",
				"type": "string"
			}
		],
		"name": "PaperAccessed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "paperId",
				"type": "uint256"
			}
		],
		"name": "PaperApproved",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "paperId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			}
		],
		"name": "PaperUploaded",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_paperId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_startTime",
				"type": "uint256"
			}
		],
		"name": "setExamTime",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_ipfsHash",
				"type": "string"
			}
		],
		"name": "uploadPaper",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_paperId",
				"type": "uint256"
			}
		],
		"name": "accessPaper",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "admin",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "paperCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "papers",
		"outputs": [
			{
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "encryptionKey",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "startTime",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// Initialize the blockchain connection
export const initializeBlockchain = async () => {
  try {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask is not installed");
    }

    // Set up the provider and signer
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    // Get the contract instance
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    return contract;
  } catch (error) {
    console.error("Error initializing blockchain:", error);
    throw error;
  }
};

// Function to connect to MetaMask
export const connectWallet = async () => {
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (accounts.length > 0) {
      console.log("Connected to MetaMask:", accounts[0]);
      return accounts[0];
    } else {
      throw new Error("No accounts found");
    }
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
};

// Function to interact with the contract (general example)
export const interactWithContract = async (method, params = []) => {
  try {
    const tx = await contract[method](...params);
    await tx.wait();
    console.log(`Transaction successful: ${tx.hash}`);
  } catch (error) {
    console.error("Error interacting with contract:", error);
    throw error;
  }
};

// Get the current contract instance
export const getContract = () => contract;
