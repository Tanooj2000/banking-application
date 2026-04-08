import React, { useState, useEffect, useRef } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { signInUser } from '../api/userApi';
import { signInAdmin, getAdminById } from '../api/adminApi';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';
import welcomeImg from '../assets/bank-1.jpg'; // Use your preferred illustration or SVG
import { FaUser, FaUserShield, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { AuthGuard } from '../utils/authGuard';
import { getErrorMessage } from '../utils/validation';

const SignIn = () => {
	const [formData, setFormData] = useState({ usernameOrEmail: '', password: '' });
	const [errors, setErrors] = useState({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [userType, setUserType] = useState(null);
	const [isRedirecting, setIsRedirecting] = useState(false); // Add redirecting state
	const [successMsg, setSuccessMsg] = useState(""); // Success message state
	const [progress, setProgress] = useState(0); // Progress bar state
	const navigate = useNavigate();
	const firstInputRef = useRef(null); // Reference for auto-focus

	// Redirect if already signed in - with a small delay to ensure logout has completed
	useEffect(() => {
		const checkAndRedirect = () => {
			const token = localStorage.getItem('authToken');
			const currentUser = AuthGuard.getCurrentUser();
			
			// More thorough validation - check if token AND user data are valid
			if (token && currentUser && currentUser.id && currentUser.email) {
				// Additional validation for admin
				if (AuthGuard.isAdminAuthenticated()) {
					setIsRedirecting(true);
					navigate('/adminpage', { replace: true });
				} else if (AuthGuard.isAuthenticated()) {
					setIsRedirecting(true);
					navigate('/userpage', { replace: true });
				}
			} else if (token && (!currentUser || !currentUser.id || !currentUser.email)) {
				// Invalid/incomplete user data - clear everything
				console.warn('Found invalid authentication data, clearing...');
				localStorage.removeItem('authToken');
				localStorage.removeItem('currentUser');
				localStorage.removeItem('userType');
				localStorage.removeItem('userId');
				localStorage.removeItem('userToken');
				sessionStorage.clear();
				window.dispatchEvent(new Event('storage'));
			}
		};
		
		// Small delay to allow logout to complete if user just logged out
		const timeoutId = setTimeout(checkAndRedirect, 100);
		
		return () => clearTimeout(timeoutId);
	}, [navigate]);

	// Auto-focus first input when user type is selected
	useEffect(() => {
		if (userType && firstInputRef.current) {
			// Small delay to ensure modal is rendered
			const timer = setTimeout(() => {
				firstInputRef.current.focus();
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [userType]);

	const validateForm = () => {
		const newErrors = {};
	if (!formData.usernameOrEmail) newErrors.usernameOrEmail = 'Username or Email is required';
		if (!formData.password) newErrors.password = 'Password is required';
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
		if (errors[name]) setErrors({ ...errors, [name]: '' });
	};

	const handleUserType = (type) => {
		setUserType(type);
		setErrors({});
		setFormData({ usernameOrEmail: '', password: '' });
	};

	const extractAdminId = (adminObj) => {
		if (!adminObj || typeof adminObj !== 'object') return null;
		const possibleIdFields = ['adminId', 'id', 'ID', '_id', 'admin_id'];
		for (const field of possibleIdFields) {
			if (adminObj[field] !== undefined && adminObj[field] !== null && adminObj[field] !== '') {
				return adminObj[field];
			}
		}
		return null;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		if (validateForm()) {
			try {
				if (userType === 'admin') {
					const adminResponse = await signInAdmin(formData);
					let adminPayload = adminResponse;

					// Enrich admin payload with full profile details when backend login returns partial data
					const adminId = extractAdminId(adminResponse);
					if (adminId) {
						try {
							const fullAdmin = await getAdminById(adminId);
							if (fullAdmin && typeof fullAdmin === 'object' && Object.keys(fullAdmin).length > 0) {
								adminPayload = { ...adminResponse, ...fullAdmin };
							}
						} catch (profileError) {
							console.warn('Could not fetch full admin profile after login:', profileError);
						}
					}

					// Persist admin session so isAdminAuthenticated() returns true
					AuthGuard.setAdminData(adminPayload);
					localStorage.setItem('userType', 'admin');
					sessionStorage.setItem('userType', 'admin');
					window.dispatchEvent(new Event('storage'));
					navigate('/adminpage', { state: { admin: adminPayload } });
				} else {
					await signInUser(formData);
					window.dispatchEvent(new Event('storage'));
					navigate('/userpage');
				}
			} catch (error) {
				setErrors({ form: getErrorMessage(error) });
			}
		}
		setIsSubmitting(false);
	};

	// Show loading while redirecting
	if (isRedirecting) {
		return (
			<>
				<Header />
				<div className="signin-bg-gradient">
					<div className="signin-redirect-state">
						<span className="signin-redirect-spinner" />
						<p className="signin-redirect-label">Redirecting to dashboard…</p>
					</div>
				</div>
			</>
		);
	}

			return (
				<>
					<Header />
					<div className="signin-bg-gradient">
						<div className="signin-card">
							<div className="signin-card-left">
								<div className="signup-promo-card">
									<h1 className="signup-promo-title">Welcome <br />To<br /> InterBankHub</h1>
									<h3 className="signup-promo-sub">New here?</h3>
									<p className="signup-promo-desc">Join us today and experience seamless, secure, and smart banking for everyone.</p>
									<button className="signup-promo-btn" onClick={() => navigate('/signup')}>
										Sign Up
									</button>
								</div>
							</div>
							<div className="signin-card-right">
								<h1 className="signin-headline">Welcome Back</h1>
								<p className="signin-subtitle">Access your secure banking dashboard</p>
								{!userType ? (
									<div className="signin-type-select-pro">
										<button className="signin-type-btn-pro user" onClick={() => handleUserType('user')}>
											<FaUser className="signin-btn-icon" /> Sign in as User <FaArrowRight className="signin-btn-arrow" />
										</button>
										<button className="signin-type-btn-pro admin" onClick={() => handleUserType('admin')}>
											<FaUserShield className="signin-btn-icon" /> Sign in as Admin <FaArrowRight className="signin-btn-arrow" />
										</button>
									</div>
								) : (
								<div className="signin-modal-overlay">
									<form onSubmit={handleSubmit} className="signin-modal-form">
										<button type="button" className="signin-modal-back" onClick={() => setUserType(null)}>
											<FaArrowLeft />
										</button>
										<h2>Sign In as {userType === 'admin' ? 'Admin' : 'User'}</h2>
										<div className="input-group">
											<input
												ref={firstInputRef}
												type="text"
												name="usernameOrEmail"
												placeholder="Username or Email"
												value={formData.usernameOrEmail}
												onChange={handleChange}
												className={`form-input ${errors.usernameOrEmail ? 'error' : ''}`}
												required
											/>
											{errors.usernameOrEmail && <span className="error-message">{errors.usernameOrEmail}</span>}
										</div>
										<div className="input-group">
											<input
												type="password"
												name="password"
												placeholder="Password"
												value={formData.password}
												onChange={handleChange}
												className={`form-input ${errors.password ? 'error' : ''}`}
												required
											/>
											{errors.password && <span className="error-message">{errors.password}</span>}
										</div>
										{errors.form && <div className="error-message">{errors.form}</div>}
										<button
											type="submit"
											className={`submit-button ${isSubmitting ? 'loading' : ''}`}
											disabled={isSubmitting}
										>
											{isSubmitting ? 'Signing In...' : 'Sign In'}
										</button>
									</form>
								</div>
							)}
						</div>
					</div>
			</div>

{/* Success / Progress Toast */}
			{successMsg && (
				<div className="signin-toast">
					<p className="signin-toast__msg">{successMsg.replace(/^(admin:|user:)/, '')}</p>
					<div className="signin-toast__bar">
						<div className="signin-toast__fill" style={{ width: `${progress}%` }} />
					</div>
					<p className="signin-toast__phase">
						{progress < 30 ? 'Authenticating…' : progress < 70 ? 'Setting up session…' : progress < 100 ? 'Preparing dashboard…' : 'Redirecting…'}
					</p>
						</div>
					)}
					
					<Footer />
				</>
			);
};

export default SignIn;