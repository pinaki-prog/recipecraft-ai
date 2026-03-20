import Home from "./pages/Home"
import ResetPassword from "./pages/ResetPassword"

function App() {
  // If user lands on /reset-password (from password reset email link),
  // show the reset password page — otherwise show the main app
  if (window.location.pathname === "/reset-password") {
    return <ResetPassword />
  }

  return <Home />
}

export default App