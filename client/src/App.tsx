import { Routes, Route, Navigate } from "react-router-dom";
import { authClient } from "./lib/auth-client.js";
import LoginPage from "./pages/LoginPage.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";

function App(){
    const { data: session, isPending } = authClient.useSession();

    if(isPending){
        return(
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">Loading...</p>
        </div>
        );
    }

    return(
        <Routes>
            <Route 
                path="/login" 
                element={!session ? <LoginPage /> : <Navigate to="/dashboard" />} 
            />

            <Route 
                path="/signup" 
                element={!session ? <SignupPage /> : <Navigate to="/dashboard" />} 
            />

            <Route 
                path="/dashboard" 
                element={session ? <DashboardPage /> : <Navigate to="/login" />} 
            />

            <Route 
                path="*"                                             // when the path matches none of the above
                element={<Navigate to={session ? "/dashboard" : "/login"} />} 
            />
        </Routes>
    );
}

export default App;