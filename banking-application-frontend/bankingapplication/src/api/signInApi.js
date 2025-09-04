const BASE_URL = 'http://localhost:8080/api';

export const signInUser = async (credentials) => {
  const response = await fetch(`${BASE_URL}/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    throw new Error('Invalid email or password');
  }
  return response.json();
};

export const signInAdmin = async (credentials) => {
  const response = await fetch(`${BASE_URL}/admin/signin`, {
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
