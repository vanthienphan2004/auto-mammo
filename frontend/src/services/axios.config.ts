import axios from "axios";

const axiosConfig = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosConfig.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default axiosConfig;
