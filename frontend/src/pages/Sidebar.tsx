import React, { useEffect, useState } from 'react';
import { db } from './firebaseConfig'; // Ensure this is correctly configured to export your Firestore instance
import { collection, getDocs } from 'firebase/firestore';
import ServerIcon from './ServerIcon';

interface Server {
  serverID: string;
  serverIconUrl: string;
  serverName: string;
}

const Sidebar: React.FC = () => {
  const [servers, setServers] = useState<Server[]>([]);

  useEffect(() => {
    const fetchServers = async () => {
      const serverCollection = collection(db, 'Servers');
      const serverSnapshot = await getDocs(serverCollection);
      const serverList = serverSnapshot.docs.map(doc => ({
        serverID: doc.id,
        ...doc.data()
      })) as Server[];
      setServers(serverList);
    };

    fetchServers();
  }, []);

  return (
    <div className="bg-gray-900 text-purple-lighter flex-none w-24 p-6 hidden md:block">
      <div className="cursor-pointer mb-4 border-b border-gray-600 pb-2">
        <div className="bg-white h-12 w-12 flex items-center justify-center text-black text-2xl font-semibold rounded-3xl mb-1 overflow-hidden">
          <img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="Main server" />
        </div>
      </div>
      {servers.length > 0 ? (
        servers.map(server => <ServerIcon key={server.serverID} server={server} />)
      ) : (
        <p className="text-gray-400 pt-3 pb-8">No servers yet</p>
      )}
      <div className="cursor-pointer">
        <div className="bg-white opacity-25 h-12 w-12 flex items-center justify-center text-black text-2xl font-semibold rounded-3xl mb-1 overflow-hidden">
          <svg className="fill-current h-10 w-10 block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path
              d="M16 10c0 .553-.048 1-.601 1H11v4.399c0 .552-.447.601-1 .601-.553 0-1-.049-1-.601V11H4.601C4.049 11 4 10.553 4 10c0-.553.049-1 .601-1H9V4.601C9 4.048 9.447 4 10 4c.553 0 1 .048 1 .601V9h4.399c.553 0 .601.447.601 1z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
