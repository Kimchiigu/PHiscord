import React, { useEffect, useState } from 'react';
import { auth, db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

interface UserInfo {
    username: string;
    email: string;
    displayName: string;
    dob: {
        year: number;
        month: number;
        date: number;
    };
}

function Home() {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [age, setAge] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, 'Users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data() as UserInfo;
                    setUserInfo(data);
                    calculateAge(data.dob);
                }
            }
        };

        fetchUserData();
    }, []);

    const calculateAge = (dob: { year: number; month: number; date: number }) => {
        const today = new Date();
        const birthDate = new Date(dob.year, dob.month - 1, dob.date);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        setAge(age);
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    return (
        <div className="w-full max-w-md mx-auto mt-10 bg-slate-700 p-6 rounded-lg shadow-md text-white">
            <h1 className="text-2xl font-bold text-center">User Profile</h1>
            {userInfo ? (
                <div className="mt-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold">Username</h2>
                        <p>{userInfo.username}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Email</h2>
                        <p>{userInfo.email}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Display Name</h2>
                        <p>{userInfo.displayName}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Date of Birth</h2>
                        <p>{`${userInfo.dob.year}-${userInfo.dob.month}-${userInfo.dob.date}`}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Age</h2>
                        <p>{age}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 mt-6 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-indigo-600 rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50"
                    >
                        Logout
                    </button>
                </div>
            ) : (
                <p className="text-center mt-6">Loading user data...</p>
            )}
        </div>
    );
}

export default Home;
