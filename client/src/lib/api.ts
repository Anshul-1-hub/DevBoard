import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:4000/api",
    withCredentials: true,
})

export default api;

// Pre-configured axios instance for all API requests
// baseURL set so we only write the path (e.g. "/issues") not the full URL every time
// withCredentials: true sends session cookie with every request for auth