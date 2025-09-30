import React, { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { signInUser } from '../api/userApi';
import { signInAdmin } from '../api/adminApi';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';
import welcomeImg from '../assets/bank-1.jpg'; // Use your preferred illustration or SVG
import { FaUser, FaUserShield, FaArrowRight, FaArrowLeft } from 'react-icons/fa';

const SignIn = () => {
	const [formData, setFormData] = useState({ usernameOrEmail: '', password: '' });
	const [errors, setErrors] = useState({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [userType, setUserType] = useState(null);
	const [isRedirecting, setIsRedirecting] = useState(false); // Add redirecting state
	const navigate = useNavigate();

	// Redirect if already signed in
	useEffect(() => {
		const token = sessionStorage.getItem('userToken');
		const storedUserType = sessionStorage.getItem('userType');
		
		console.log('SignIn useEffect - token:', token, 'userType:', storedUserType); // Debug log
		
		if (token && storedUserType) {
			setIsRedirecting(true);
			// User is already signed in, redirect to appropriate dashboard
			if (storedUserType === 'admin') {
				console.log('Redirecting to admin page'); // Debug log
				navigate('/adminpage', { replace: true });
			} else {
				console.log('Redirecting to user page'); // Debug log
				navigate('/userpage', { replace: true });
			}
		}
	}, [navigate]);

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
						sessionStorage.setItem('userToken', 'admin-token');
						sessionStorage.setItem('userType', 'admin'); // Store user type
						sessionStorage.setItem('adminId', response.admin.id); // Store admin ID
						window.dispatchEvent(new Event('storage'));
						navigate('/adminpage', { state: { admin: response.admin }, replace: true });
					} else {
						setErrors({ form: response.message });
					}
				} else {
					const response = await signInUser(formData);
					if (response.success) {
						sessionStorage.setItem('userToken', 'user-token');
						sessionStorage.setItem('userType', 'user'); // Store user type
						sessionStorage.setItem('userId', response.user.id); // Store userId for persistence
						window.dispatchEvent(new Event('storage'));
						navigate('/userpage', { state: { userId: response.user.id }, replace: true });
					} else {
						setErrors({ form: response.message });
					}
				}
			} catch (error) {
				setErrors({ form: error.message });
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
					<Footer />
				</>
			);
};

export default SignIn;