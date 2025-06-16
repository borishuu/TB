'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {useAuth} from '@/context/authContext';

export default function Register() {

    const {fetchData} = useAuth();

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !username || !password || !confirmPassword) {
        setError('Please fill in all fields.');
        setLoading(false);
        return;
    }

    if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
    }

    try {
        const response = await fetch('/api/user/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password }),
        });

        const data = await response.json();
        if (!response.ok) {
            
            throw new Error(data.error || 'Registration failed');
        }

        // Send login request after registration to get JWT token
        if (response.status === 200) {
            const loginReponse = await fetch('/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({email, password}),
            });

            // Redirect user to home page if successful
            if (loginReponse.status === 200) {
                await loginReponse.json();
                await fetchData();
                router.push('/');
            } else {
                console.log("Login failed after registration", loginReponse.status);
                setUsername("");
                setEmail("");
                setPassword("");
                throw new Error(data.error || 'Registration failed');
            }
        } else {
            console.log("Registration failed", response.status);
        
            setUsername("");
            setEmail("");
            setPassword("");
            throw new Error(data.error || 'Registration failed');
        }
    } catch (error: any) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
    };

    return (
    <div className="flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>

        {error && (
            <p className="text-red-500 text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#97accf]"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                type="email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#97accf]"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                type="password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#97accf]"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                type="password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#97accf]"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>

            <button
                type="submit"
                className="w-full button"
                disabled={loading}
            >
                {loading ? 'Registering...' : 'Sign Up'}
            </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-[#3e4756] underline">
            Login
            </Link>
        </p>
        </div>
    </div>
    );
}
