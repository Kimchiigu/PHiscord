import React from 'react';
import '../App.css';
import { Link } from 'react-router-dom';

function Register() {
    return (
        <div className="w-full max-w-sm p-6 m-auto mx-auto bg-slate-700 rounded-lg shadow-md dark:bg-gray-800 ">
            <div className="flex justify-center mx-auto">
                <img className="w-auto h-7 sm:h-8" src='discord-logo.png' alt="" />
            </div>

            <h1 className="text-center text-gray-200 text-xl font-bold mt-4">Create an account</h1>

            <form className="mt-7">
                <div>
                    <label htmlFor="email" className="text-sm text-gray-400 dark:text-gray-200 flex items-center">
                        Email <span className='text-red-500 ml-1'>*</span>
                    </label>
                    <input type="text" id="email" className="block w-full px-4 py-2 mt-2 text-gray-400 bg-slate-800 border border-slate-900 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-indigo-400 dark:focus:border-blue-300 focus:ring-indigo-300 focus:outline-none focus:ring focus:ring-opacity-40" />
                </div>
                
                <div className="mt-4">
                    <label htmlFor="display-name" className="text-sm text-gray-400 dark:text-gray-200 flex items-center">
                        Display Name <span className='text-red-500 ml-1'>*</span>
                    </label>
                    <input type="text" id="display-name" className="block w-full px-4 py-2 mt-2 text-gray-400 bg-slate-800 border border-slate-900 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-indigo-400 dark:focus:border-blue-300 focus:ring-indigo-300 focus:outline-none focus:ring focus:ring-opacity-40" />
                </div>

                <div className="mt-4">
                    <label htmlFor="username" className="text-sm text-gray-400 dark:text-gray-200 flex items-center">
                        Username <span className='text-red-500 ml-1'>*</span>
                    </label>
                    <input type="text" id="username" className="block w-full px-4 py-2 mt-2 text-gray-400 bg-slate-800 border border-slate-900 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-indigo-400 dark:focus:border-blue-300 focus:ring-indigo-300 focus:outline-none focus:ring focus:ring-opacity-40" />
                </div>

                <div className="mt-4">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm text-gray-400 dark:text-gray-200 flex items-center">
                            Password <span className='text-red-500 ml-1'>*</span>
                        </label>
                    </div>

                    <input type="password" id="password" className="block w-full px-4 py-2 mt-2 text-gray-400 bg-slate-800 border border-slate-900 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-indigo-400 dark:focus:border-blue-300 focus:ring-indigo-300 focus:outline-none focus:ring focus:ring-opacity-40" />
                </div>

                <div className="mt-4">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm text-gray-400 dark:text-gray-200 flex items-center">
                            Date of Birth <span className='text-red-500 ml-1'>*</span>
                        </label>
                    </div>

                    <div className="flex flex-row gap-3 mt-3">
                        <select
                            id="month"
                            className="bg-slate-800 border text-gray-200 border-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
                        >
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
                            className="bg-slate-800 border text-gray-200 border-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
                        >
                            {Array.from({ length: 31 }, (_, i) => (
                            <option key={i + 1}>{i + 1}</option>
                            ))}
                        </select>

                        <select
                            id="year"
                            className="bg-slate-800 border text-gray-200 border-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
                        >
                            {Array.from({ length: 26 }, (_, i) => (
                            <option key={1990 + i}>{1990 + i}</option>
                            ))}
                        </select>
                        </div>

                </div>

                <div className="mt-10">
                    <Link to="/">
                        <button className="w-full px-6 py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-indigo-600 rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                            Register
                        </button>
                    </Link>
                </div>
            </form>

            <p className="mt-8 text-xs font-light text-center text-gray-400 flex gap-1 align-middle justify-center"> Already have an Account? 
                <Link to="/login">
                    <p className="font-medium text-indigo-500 dark:text-gray-200 hover:underline">Login</p>
                </Link>
            </p>
        </div>
    );
}

export default Register;
