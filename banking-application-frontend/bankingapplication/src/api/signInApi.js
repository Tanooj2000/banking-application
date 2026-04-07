const USER_BASE_URL = 'http://localhost:8081/api/user';
const ADMIN_BASE_URL = 'http://localhost:8083/api/admin';

export const signInUser = async (credentials) => {
  const response = await fetch(`${USER_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    throw new Error('Invalid email or password');
  }
  console.log(response);
  return response.text();
};

export const signInAdmin = async (credentials) => {
  const response = await fetch(`${ADMIN_BASE_URL}/login`, {
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
