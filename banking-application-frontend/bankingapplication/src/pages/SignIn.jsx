
import React, { useState } from 'react';
import { signInUser, signInAdmin } from '../api/signInApi';
import { useNavigate, useLocation } from 'react-router-dom';



const SignIn = () => {
	const [formData, setFormData] = useState({ email: '', password: '' });
	const [errors, setErrors] = useState({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	// Get usertype from query params
	const searchParams = new URLSearchParams(location.search);
	const userType = searchParams.get('usertype');

	const validateForm = () => {
		const newErrors = {};
		if (!formData.email) {
			newErrors.email = 'Email is required';
		}
		if (!formData.password) {
			newErrors.password = 'Password is required';
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
		if (errors[name]) {
			setErrors({ ...errors, [name]: '' });
		}
	};

		const handleSubmit = async (e) => {
			e.preventDefault();
			setIsSubmitting(true);
			if (validateForm()) {
				try {
					let response;
					if (userType === 'admin') {
						response = await signInAdmin(formData);
						navigate('/adminpage');
					} else {
						response = await signInUser(formData);
						navigate('/userpage');
					}
				} catch (error) {
					setErrors({ form: error.message });
				}
			}
			setIsSubmitting(false);
		};

	return (
		<div className="signin-container">
			<h2>Sign In</h2>
			<form onSubmit={handleSubmit} className="signin-form">
				<div className="input-group">
					<input
						type="email"
						name="email"
						placeholder="Email"
						value={formData.email}
						onChange={handleChange}
						className={`form-input ${errors.email ? 'error' : ''}`}
						required
					/>
					{errors.email && <span className="error-message">{errors.email}</span>}
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
	);
};

export default SignIn;