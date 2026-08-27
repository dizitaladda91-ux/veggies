import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { ROUTES } from '../constants/routes';
export const ResetPassword = () => { const { token } = useParams(); const [searchParams] = useSearchParams(); const resetToken = token || searchParams.get('token'); const navigate = useNavigate(); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const submit = async e => { e.preventDefault(); if (!resetToken) { setMessage('Password reset link is invalid or expired.'); return; } try { await api.post('/auth/reset-password', { token: resetToken, password }); setMessage('Password reset successful. You can now sign in.'); setTimeout(() => navigate(ROUTES.LOGIN), 1200); } catch (error) { setMessage(error?.message || 'Password reset link is invalid or expired.'); } }; return <AuthLayout title="Set a new password"><form onSubmit={submit}><Input type="password" label="New password" value={password} onChange={e => setPassword(e.target.value)} required /><Button type="submit">Reset password</Button>{message && <p>{message}</p>}</form></AuthLayout>; };
