import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SignInPage from './SignInPage'
import Dashboard from './Dashboard'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  )
}

export default App
