import React, { useState } from 'react';
import '../App.css';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from "./firebaseConfig";
import { setDoc, doc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Register() {
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [month, setMonth] = useState('');
    const [date, setDate] = useState('');
    const [year, setYear] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!displayName) {
            newErrors.displayName = 'Display Name is required';
        }

        if (!username) {
            newErrors.username = 'Username is required';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!month || !date || !year) {
            newErrors.dob = 'Date of Birth is required';
        }

        return newErrors;
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
        } else {
            setErrors({});
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                toast.success('Account created successfully!');
                await setDoc(doc(db, "Users", user.uid), {
                    email: user.email,
                    displayName: displayName,
                    username: username,
                    year: year,
                    month: month,
                    date: date
                });
                navigate('/login');
            } catch (error) {
                toast.error((error as Error).message);
            }
        }
    };

    return (
        <div className="w-full max-w-sm p-6 m-auto mx-auto bg-slate-700 rounded-lg shadow-md dark:bg-gray-800">
            <h1 className="text-center text-gray-200 text-xl font-bold mt-4">Create an account</h1>

            <form className="mt-7" onSubmit={handleRegister}>
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
                    <label htmlFor="display-name" className="text-sm text-gray-400 dark:text-gray-200 flex items-center">
                        Display Name <span className='text-red-500 ml-1'>*</span>
                    </label>
                    <input 
                        type="text" 
                        id="display-name" 
                        className={`block w-full px-4 py-2 mt-2 text-gray-400 bg-slate-800 border ${errors.displayName ? 'border-red-500 focus:ring-red-500' : 'border-slate-900 focus:border-indigo-400'} rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:ring-opacity-40`}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                    />
                    {errors.displayName && <p className="text-red-500 text-xs mt-1 text-left">{errors.displayName}</p>}
                </div>

                <div className="mt-4">
                    <label htmlFor="username" className="text-sm text-gray-400 dark:text-gray-200 flex items-center">
                        Username <span className='text-red-500 ml-1'>*</span>
                    </label>
                    <input 
                        type="text" 
                        id="username" 
                        className={`block w-full px-4 py-2 mt-2 text-gray-400 bg-slate-800 border ${errors.username ? 'border-red-500 focus:ring-red-500' : 'border-slate-900 focus:border-indigo-400'} rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:ring-opacity-40`}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    {errors.username && <p className="text-red-500 text-xs mt-1 text-left">{errors.username}</p>}
                </div>

                <div className="mt-4">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm text-gray-400 dark:text-gray-200 flex items-center">
                            Password <span className='text-red-500 ml-1'>*</span>
                        </label>
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

                <div className="mt-4">
                    <div className="flex items-center justify-between">
                        <label htmlFor="date-of-birth" className="text-sm text-gray-400 dark:text-gray-200 flex items-center">
                            Date of Birth <span className='text-red-500 ml-1'>*</span>
                        </label>
                    </div>

                    <div className="flex flex-row gap-3 mt-3">
                        <select
                            id="month"
                            className={`bg-slate-800 border ${errors.dob ? 'border-red-500 focus:ring-red-500' : 'border-slate-900 focus:border-indigo-500'} text-gray-200 text-sm rounded-lg focus:ring-opacity-40 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                        >
                            <option value="">Month</option>
                            <option>January</option>
                            <option>February</option>
                            <option>March</option>
                            <option>April</option>
                            <option>May</option>
                            <option>June</option>
                            <option>July</option>
                            <option>August</option>
                            <option>September</option>
                            <option>October</option>
                            <option>November</option>
                            <option>December</option>
                        </select>

                        <select
                            id="date"
                            className={`bg-slate-800 border ${errors.dob ? 'border-red-500 focus:ring-red-500' : 'border-slate-900 focus:border-indigo-500'} text-gray-200 text-sm rounded-lg focus:ring-opacity-40 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        >
                            <option value="">Date</option>
                            {Array.from({ length: 31 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>

                        <select
                            id="year"
                            className={`bg-slate-800 border ${errors.dob ? 'border-red-500 focus:ring-red-500' : 'border-slate-900 focus:border-indigo-500'} text-gray-200 text-sm rounded-lg focus:ring-opacity-40 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        >
                            <option value="">Year</option>
                            {Array.from({ length: 26 }, (_, i) => (
                                <option key={1990 + i} value={1990 + i}>{1990 + i}</option>
                            ))}
                        </select>
                    </div>
                    {errors.dob && <p className="text-red-500 text-xs mt-1 text-left">{errors.dob}</p>}
                </div>

                <div className="mt-10">
                    <button type="submit" className="w-full px-6 py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-indigo-600 rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                        Register
                    </button>
                </div>
            </form>

            <p className="mt-8 text-xs font-light text-center text-gray-400 flex gap-1 align-middle justify-center">
                Already have an Account? 
                <Link to="/login">
                    <p className="font-medium text-indigo-500 dark:text-gray-200 hover:underline">Login</p>
                </Link>
            </p>
            <ToastContainer />
        </div>
    );
}

export default Register;
