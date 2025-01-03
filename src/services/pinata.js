import axios from 'axios';

const PINATA_API_KEY = 'a5442ec52194cb9ed67e';
const PINATA_SECRET_KEY = 'e63b25b10203aeeb83daa27cc9505b906730fb4edbe62407c8b6942531935cfc';

export const testPinataConnection = async () => {
  try {
    const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      }
    });
    return response.status === 200;
  } catch (error) {
    console.error('Pinata connection test failed:', error);
    return false;
  }
};

export const uploadToPinata = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      }
    });

    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw error;
  }
};


// import axios from "axios";

// const API_KEY = "a5442ec52194cb9ed67e";
// const API_SECRET = "e63b25b10203aeeb83daa27cc9505b906730fb4edbe62407c8b6942531935cfc";

// export const uploadToIPFS = async (file) => {
//   const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

//   let data = new FormData();
//   data.append("file", file);

//   try {
//     const response = await axios.post(url, data, {
//       headers: {
//         pinata_api_key: API_KEY,
//         pinata_secret_api_key: API_SECRET,
//       },
//     });
//     return response.data.IpfsHash; // Return the IPFS hash of the uploaded file
//   } catch (error) {
//     console.error("Error uploading to IPFS: ", error);
//     throw error;
//   }
// };

// // import axios from "axios";

// // const API_KEY = "a5442ec52194cb9ed67e";
// // const API_SECRET = "e63b25b10203aeeb83daa27cc9505b906730fb4edbe62407c8b6942531935cfc";

// // export const uploadToIPFS = async (file) => {
// //   const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

// //   let data = new FormData();
// //   data.append("file", file);

// //   try {
// //     const response = await axios.post(url, data, {
// //       headers: {
// //         pinata_api_key: API_KEY,
// //         pinata_secret_api_key: API_SECRET,
// //       },
// //     });
// //     return response.data.IpfsHash; // Return the IPFS hash of the uploaded file
// //   } catch (error) {
// //     console.error("Error uploading to IPFS: ", error);
// //     throw error;
// //   }
// // };
