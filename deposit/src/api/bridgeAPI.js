// HyBridge API integration

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.hybridge.xyz';

export const getQuote = async (params) => {
  const response = await fetch(`${API_BASE_URL}/bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

