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
	const [isRedirecting, setIsRedirecting] = useState(false);
	const [successMsg, setSuccessMsg] = useState("");
	const [progress, setProgress] = useState(0);

	// Forgot password states
	const [showForgot, setShowForgot] = useState(false);
	const [forgotStep, setForgotStep] = useState('choose'); // 'choose' | 'input' | 'done'
	const [forgotMethod, setForgotMethod] = useState(null); // 'email' | 'phone'
	const [forgotValue, setForgotValue] = useState('');
	const [forgotError, setForgotError] = useState('');

	const navigate = useNavigate();
	const firstInputRef = useRef(null);

	// Redirect if already signed in - with a small delay to ensure logout has completed
	useEffect(() => {
		const checkAndRedirect = () => {
			// Admin session is stored in sessionStorage (no JWT token)
			if (AuthGuard.isAdminAuthenticated()) {
				setIsRedirecting(true);
				window.location.replace('/adminpage');
				return;
			}

			const token = localStorage.getItem('authToken');
			const currentUser = AuthGuard.getCurrentUser();

			if (token && currentUser && (currentUser.id || currentUser.userId)) {
				if (AuthGuard.isAuthenticated()) {
					setIsRedirecting(true);
					navigate('/userpage', { replace: true });
				}
			} else if (token && (!currentUser || (!currentUser.id && !currentUser.userId))) {
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
		setShowForgot(false);
		setForgotStep('choose');
		setForgotMethod(null);
		setForgotValue('');
		setForgotError('');
	};

	const openForgot = () => {
		setShowForgot(true);
		setForgotStep('choose');
		setForgotMethod(null);
		setForgotValue('');
		setForgotError('');
	};

	const closeForgot = () => {
		setShowForgot(false);
		setForgotStep('choose');
		setForgotMethod(null);
		setForgotValue('');
		setForgotError('');
	};

	const handleForgotMethodSelect = (method) => {
		setForgotMethod(method);
		setForgotValue('');
		setForgotError('');
		setForgotStep('input');
	};

	const handleForgotSubmit = () => {
		if (!forgotValue.trim()) {
			setForgotError(forgotMethod === 'email' ? 'Please enter your email address.' : 'Please enter your registered phone number.');
			return;
		}
		if (forgotMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotValue.trim())) {
			setForgotError('Please enter a valid email address.');
			return;
		}
		if (forgotMethod === 'phone' && !/^\+?[0-9]{10,15}$/.test(forgotValue.trim().replace(/\s/g, ''))) {
			setForgotError('Please enter a valid phone number (10–15 digits).');
			return;
		}
		setForgotStep('done');
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
					// Use hard redirect for admin so sessionStorage is read fresh
					// by ProtectedRoute on the new page load, avoiding React Router
					// async-handler timing issues.
					window.location.replace('/adminpage');
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
									{showForgot ? (
										<div className="signin-forgot-panel">
											<button type="button" className="signin-modal-back" onClick={closeForgot}><FaArrowLeft /></button>
											<h2>Reset Password</h2>
											<p className="signin-forgot-desc">How would you like to receive your reset instructions?</p>

											{forgotStep === 'choose' && (
												<div className="signin-forgot-methods">
													<button type="button" className="signin-forgot-method-btn" onClick={() => handleForgotMethodSelect('email')}>
														📧 Send to my Email
													</button>
													<button type="button" className="signin-forgot-method-btn" onClick={() => handleForgotMethodSelect('phone')}>
														📱 Send to my Phone
													</button>
												</div>
											)}

											{forgotStep === 'input' && (
												<div className="signin-forgot-input-step">
													<label className="signin-forgot-label">
														{forgotMethod === 'email' ? 'Enter your registered email address' : 'Enter your registered phone number'}
													</label>
													<input
														type={forgotMethod === 'email' ? 'email' : 'tel'}
														className={`form-input ${forgotError ? 'error' : ''}`}
														placeholder={forgotMethod === 'email' ? 'you@example.com' : '+91 98765 43210'}
														value={forgotValue}
														onChange={(e) => { setForgotValue(e.target.value); setForgotError(''); }}
														maxLength={forgotMethod === 'email' ? 100 : 16}
														autoFocus
													/>
													{forgotError && <span className="error-message">{forgotError}</span>}
													<button type="button" className="submit-button" style={{ marginTop: '12px' }} onClick={handleForgotSubmit}>
														Send Reset Instructions
													</button>
													<button type="button" className="signin-forgot-back-link" onClick={() => { setForgotStep('choose'); setForgotError(''); }}>
														← Choose a different method
													</button>
												</div>
											)}

											{forgotStep === 'done' && (
												<div className="signin-forgot-done">
													<div className="signin-forgot-done-icon">✅</div>
													<p>Reset instructions have been sent to <strong>{forgotValue}</strong>.</p>
													<p className="signin-forgot-done-note">
														If you don't receive it within a few minutes, please contact us at <strong>support@interbankshub.com</strong>.
													</p>
													<button type="button" className="submit-button" style={{ marginTop: '16px' }} onClick={closeForgot}>
														Back to Sign In
													</button>
												</div>
											)}
										</div>
									) : (
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
												<button type="button" className="signin-forgot-link" onClick={openForgot}>
													Forgot Password?
												</button>
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
									)}
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