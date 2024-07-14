import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from "../../FirebaseConfig";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';
import { useToast } from '../provider/ToastProvider'; // Import the useToast hook
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();
  const { showToast } = useToast(); // Use the useToast hook

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };

  const setOnlineStatus = async (uid: string, isOnline: boolean) => {
    const userDoc = doc(db, 'Users', uid);
    await updateDoc(userDoc, { isOnline });
    console.log(`User ${uid} status set to ${isOnline ? 'online' : 'offline'}`);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log(userCredential);
        await setOnlineStatus(userCredential.user.uid, true); // Set user online status
        showToast('Login successful!', 'success'); // Show success toast
        navigate('/dashboard');
      } catch (error) {
        showToast((error as Error).message, 'error'); // Show error toast
      }
    }
  };

  return (
    <div className="w-full max-w-sm p-6 m-auto mx-auto bg-slate-700 rounded-lg shadow-md dark:bg-gray-800">
      <div className="flex justify-center mx-auto">
        <img className="w-auto h-7 sm:h-8" src='discord-logo.png' alt="" />
      </div>

      <div className="flex flex-col align-middle justify-center text-center mt-5">
        <h1 className="text-white text-xl font-bold">Welcome back!</h1>
        <p className="text-gray-400">We are so excited to see you</p>
      </div>

      <form className="mt-7" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className="text-sm text-gray-400 dark:text-gray-200 flex items-center">
            Email <span className='text-red-500 ml-1'>*</span>
          </label>
          <input 
            type="text" 
            id="email" 
            className={`block w-full px-4 py-2 mt-2 text-gray-400 bg-slate-800 border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-900 focus:border-indigo-400'} rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:ring-opacity-40`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1 text-left">{errors.email}</p>}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm text-gray-400 dark:text-gray-200 flex items-center">
              Password <span className='text-red-500 ml-1'>*</span>
            </label>
            <Link to="/register">
              <p className="text-xs text-blue-500 dark:text-gray-400 hover:underline">Forget Password?</p>
            </Link>
          </div>

          <input 
            type="password" 
            id="password" 
            className={`block w-full px-4 py-2 mt-2 text-gray-400 bg-slate-800 border ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-900 focus:border-indigo-400'} rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:ring-opacity-40`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1 text-left">{errors.password}</p>}
        </div>

        <div className="mt-10">
          <button type="submit" className="w-full px-6 py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-indigo-600 rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
            Login
          </button>
        </div>
      </form>

      <Link to="/register">
        <p className="mt-8 text-xs font-light text-center text-gray-400"> Need an Account? <span className="font-medium text-blue-500 dark:text-gray-200 hover:underline">Register</span></p>
      </Link>
      <ToastContainer />
    </div>
  );
}

export default Login;
