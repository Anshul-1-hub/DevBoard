import { Routes, Route, Navigate } from "react-router-dom";
import { authClient } from "./lib/auth-client.js";
import LoginPage from "./pages/LoginPage.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import BoardPage from "./pages/BoardPage.tsx";
import ActivityPage from "./pages/ActivityPage.tsx";
import MembersPage from "./pages/MembersPage.tsx";

function App(){
    const { data: session, isPending } = authClient.useSession();
    const { data: activeOrg } = authClient.useActiveOrganization();

    if(isPending){
        return(
        <div className="min-h-screen flex items-center justify-center bg-bg">
            <p className="text-secondary">Loading...</p>
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
                path="/board"
                element={session ? <BoardPage orgId={activeOrg?.id}/> : <Navigate to="/login" />}
            />

            <Route 
                path="/activity"
                element={session ? <ActivityPage orgId={activeOrg?.id}/> : <Navigate to="/login"/>}
            />

            <Route 
                path="/members"
                element={session ? <MembersPage orgId={activeOrg?.id}/> : <Navigate to="/login" />}
            />

            <Route 
                path="*"                                             // when the path matches none of the above
                element={<Navigate to={session ? "/dashboard" : "/login"} />} 
            />
        </Routes>
    );
}

export default App;


// Root component — handles routing and auth-based redirects
// isPending check prevents flash of wrong page while session is being fetched
// If logged in → can only access /dashboard (redirected away from login/signup)
// If logged out → can only access /login and /signup (redirected away from dashboard)
// "*" catch-all route handles any unknown paths