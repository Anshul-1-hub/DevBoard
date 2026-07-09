import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
    withCredentials: true,
    autoConnect: false,
});

export default socket;

// Single shared socket instance for the whole app
// autoConnect: false — we manually connect only after user is logged in with active workspace
// withCredentials: true — sends session cookie with the connection so server can verify auth
// Connected in DashboardPage when workspace is active, disconnected on sign out