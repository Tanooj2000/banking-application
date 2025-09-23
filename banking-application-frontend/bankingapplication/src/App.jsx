import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
 
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import UserPage from './pages/UserPage';
import CreateAccount from './pages/CreateAccount';
import AdminPage from './pages/AdminPage';
import './App.css'
import HomePage from './pages/HomePage.jsx'
import AboutPage from './pages/AboutPage.jsx';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/userpage" element={<UserPage />} />
        <Route path="/adminpage" element={<AdminPage />} />
        <Route path="/createaccount" element={<CreateAccount />} />
      </Routes>
    </Router>
  );
}
 
export default App;