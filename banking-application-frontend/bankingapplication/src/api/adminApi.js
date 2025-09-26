const BASE_URL = 'http://localhost:8083/api/admin/';
export const signUpAdmin = async (adminData) => {
  const response = await fetch(`${BASE_URL}register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adminData),
  });
  if (!response.ok) {
    // Always read error as text, since backend sends plain string
    const errorMsg = await response.text();
    throw new Error(errorMsg || 'Failed to sign up user');
  }
  return response.text();
};
export const signInAdmin = async (credentials) => {
  const response = await fetch(`${BASE_URL}login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || 'Failed to sign in admin');
  }
  const data = await response.json();
  console.log(data);
  console.log(data.admin.email);
  return data;
};
