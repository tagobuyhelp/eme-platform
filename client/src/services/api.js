import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function setStoredAuth(auth) {
  if (!auth?.token) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return;
  }

  localStorage.setItem("token", auth.token);
  localStorage.setItem("user", JSON.stringify(auth.user || null));
}

export function getStoredUser() {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function clearStoredAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function hasStoredAuth() {
  return Boolean(localStorage.getItem("token"));
}

export default api;
