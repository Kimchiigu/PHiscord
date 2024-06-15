import React from 'react';
import '../App.css';

function Login() {
    return (
            <div className="w-full max-w-sm p-6 m-auto mx-auto bg-slate-800 rounded-lg shadow-md dark:bg-gray-800 ">
                <div className="flex justify-center mx-auto">
                    <img className="w-auto h-7 sm:h-8" src='discord-logo.png' alt="" />
                </div>

                <form className="mt-6">
                    <div>
                        <label htmlFor="password" className="text-sm text-gray-400 dark:text-gray-200 flex items-center">
                            Username <span className='text-red-500 ml-1'>*</span>
                        </label>
                        <input type="text" id="username" className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40" />
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="text-sm text-gray-400 dark:text-gray-200 flex items-center">
                                Password <span className='text-red-500 ml-1'>*</span>
                            </label>
                            <a href="#" className="text-xs text-blue-500 dark:text-gray-400 hover:underline">Forget Password?</a>
                        </div>

                        <input type="password" id="password" className="block w-full px-4 py-2 mt-2 text-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40" />
                    </div>

                    <div className="mt-10">
                        <button className="w-full px-6 py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-indigo-600 rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                            Login
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-xs font-light text-center text-gray-400"> Need an Account? <a href="#" className="font-medium text-blue-500 dark:text-gray-200 hover:underline">Register</a></p>
            </div>
    );
}

export default Login;
