import React, { useState, useEffect, useRef } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { signInUser } from '../api/userApi';
import { signInAdmin } from '../api/adminApi';
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

	// Redirect if already signed in
	useEffect(() => {
		const token = sessionStorage.getItem('userToken');
		const storedUserType = sessionStorage.getItem('userType');
		

		
		if (token && storedUserType) {
			setIsRedirecting(true);
			// User is already signed in, redirect to appropriate dashboard
			if (storedUserType === 'admin') {

				navigate('/adminpage', { replace: true });
			} else {

				navigate('/userpage', { replace: true });
			}
		}
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
		setFormData({ identifier: '', password: '' });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		if (validateForm()) {
			try {
				if (userType === 'admin') {
					const response = await signInAdmin(formData);
					if (response.success) {
						// Show success message and start progress
						setSuccessMsg('admin:Admin login successful!');
						setProgress(20);
						
						// Store session data
						setTimeout(() => {
							sessionStorage.setItem('userToken', 'admin-token');
							sessionStorage.setItem('userType', 'admin');
							sessionStorage.setItem('adminId', response.admin.id);
							AuthGuard.setAdminData(response.admin);
							setProgress(60);
						}, 500);
						
						// Complete progress and redirect
						setTimeout(() => {
							setProgress(100);
							window.dispatchEvent(new Event('storage'));
						}, 1200);
						
						setTimeout(() => {
							setSuccessMsg("");
							setProgress(0);
							setIsSubmitting(false);
							navigate('/adminpage', { state: { admin: response.admin }, replace: true });
						}, 2000);
					} else {
						setErrors({ form: response.message });
					}
				} else {
					
					const response = await signInUser(formData);


					if (response.success) {
						console.log('Sign-in successful, user ID:', response.user.id);
						// Show success message and start progress
						setSuccessMsg('user:User login successful!');
						setProgress(20);
						
						// Store session data
						setTimeout(() => {
							sessionStorage.setItem('userToken', 'user-token');
							sessionStorage.setItem('userType', 'user');
							sessionStorage.setItem('userId', response.user.id);
							setProgress(60);
						}, 500);
						
						// Complete progress and redirect
						setTimeout(() => {
							setProgress(100);
							window.dispatchEvent(new Event('storage'));
						}, 1200);
						
						setTimeout(() => {
							setSuccessMsg("");
							setProgress(0);
							setIsSubmitting(false);
							navigate('/userpage', { state: { userId: response.user.id }, replace: true });
						}, 2000);
					} else {
						setErrors({ form: response.message });
					}
				}
			} catch (error) {
				console.error('Error during sign-in:', error);
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
					<div className="signin-card">
						<div style={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: '200px',
							flexDirection: 'column',
							gap: '1rem'
						}}>
							<div style={{
								width: '50px',
								height: '50px',
								border: '4px solid #f3f3f3',
								borderTop: '4px solid #667eea',
								borderRadius: '50%',
								animation: 'spin 1s linear infinite'
							}}></div>
							<p>Redirecting to dashboard...</p>
						</div>
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
								) : null}
							</div>
							{userType && (
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
					
					{/* Success Message Popup with Progress Bar */}
					{successMsg && (
						<div style={{
							position: 'fixed',
							top: 80,
							right: 40,
							background: successMsg.startsWith('admin:') ? '#43a047' : successMsg.startsWith('user:') ? '#1976d2' : '#43a047',
							color: '#fff',
							padding: '20px 32px',
							borderRadius: 12,
							fontWeight: 600,
							fontSize: '1.1rem',
							boxShadow: '0 4px 20px rgba(60,60,60,0.25)',
							zIndex: 9999,
							transition: 'opacity 0.4s',
							opacity: 0.95,
							minWidth: '280px'
						}}>
							<div style={{ marginBottom: '12px' }}>
								{successMsg.replace(/^(admin:|user:)/, '')}
							</div>
							{/* Progress Bar */}
							<div style={{
								width: '100%',
								height: '6px',
								backgroundColor: 'rgba(255,255,255,0.3)',
								borderRadius: '3px',
								overflow: 'hidden'
							}}>
								<div style={{
									width: `${progress}%`,
									height: '100%',
									backgroundColor: '#fff',
									borderRadius: '3px',
									transition: 'width 0.3s ease',
									boxShadow: '0 0 8px rgba(255,255,255,0.5)'
								}} />
							</div>
							<div style={{
								fontSize: '0.9rem',
								marginTop: '8px',
								opacity: 0.9
							}}>
								{progress < 30 ? 'Authenticating...' : 
								 progress < 70 ? 'Setting up session...' : 
								 progress < 100 ? 'Preparing dashboard...' : 'Redirecting...'}
							</div>
						</div>
					)}
					
					<Footer />
				</>
			);
};

export default SignIn;