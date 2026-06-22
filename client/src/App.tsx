import { authClient } from "./lib/auth-client";

function App(){
  const signUp = () => {
    return authClient.signUp.email({ email: "test@example.com", password: "password123", name: "Test User" });
  }

  const signIn = () => {
    return authClient.signIn.email({ email: "test@example.com", password: "password123" });
  }

  return(
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800">DevBoard</h1>
      <button onClick={signUp} className="px-4 py-2 bg-blue-600 text-white rounded">Test Sign Up</button>
      <button onClick={signIn} className="px-4 py-2 bg-blue-600 text-white rounded">Test Sign In</button>
    </div>
  )
}

export default App;