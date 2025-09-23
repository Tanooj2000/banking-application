
const BASE_URL = 'http://localhost:8083/api/admin';
export const signUpAdmin = async (adminData) => {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adminData),
  });
  if (!response.ok) {
    throw new Error('Failed to sign up admin');
  }
  return response.text();
};
export const signInAdmin = async (credentials) => {
  const response = await fetch(`${BASE_URL}/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    throw new Error('Invalid admin email or password');
  }
  return response.json();
};