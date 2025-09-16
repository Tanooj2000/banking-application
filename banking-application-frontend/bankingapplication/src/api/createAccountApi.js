import axios from 'axios';

// API to create a new bank account
export const createAccount = async (formData) => {
  // If formData contains a file, use FormData, else send as JSON
  let dataToSend;
  let headers = {};
  if (formData.photoId) {
    dataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'photoId' && value instanceof File) {
        dataToSend.append(key, value);
      } else {
        dataToSend.append(key, value);
      }
    });
    headers['Content-Type'] = 'multipart/form-data';
  } else {
    dataToSend = formData;
    headers['Content-Type'] = 'application/json';
  }

  const response = await axios.post('/api/accounts', dataToSend, { headers });
  return response.data;
};
