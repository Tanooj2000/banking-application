const BASE_URL = 'http://localhost:8080/api';

export const signIn = async (credentials) => {
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
