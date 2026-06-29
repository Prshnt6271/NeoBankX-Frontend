
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // console.log("REQUEST =", config.url);
    // console.log("TOKEN =", token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // console.log("HEADERS =", config.headers);

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;

