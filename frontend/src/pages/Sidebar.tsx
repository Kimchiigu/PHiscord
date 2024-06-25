import React, { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from './provider/AuthProvider';
import ServerIcon from './ServerIcon';
import Modal from './Modal';

interface Server {
  serverID: string;
  serverIconUrl: string;
  serverName: string;
  ownerId: string;
  inviteLink: string;
}

interface SidebarProps {
  onServerSelect: (id: string, name: string, isOwner: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onServerSelect }) => {
  const { currentUser } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchServers = async () => {
    if (!currentUser) return;

    const serversCollection = collection(db, 'Servers');
    const ownerQuery = query(serversCollection, where('ownerId', '==', currentUser.uid));
    const ownerSnapshot = await getDocs(ownerQuery);
    const ownerServers = ownerSnapshot.docs.map(doc => ({
      serverID: doc.id,
      ...doc.data()
    })) as Server[];

    const memberServers: Server[] = [];
    const serverSnapshot = await getDocs(serversCollection);
    for (const serverDoc of serverSnapshot.docs) {
      if (!ownerServers.some(server => server.serverID === serverDoc.id)) {
        const membersCollection = collection(db, `Servers/${serverDoc.id}/Members`);
        const memberQuery = query(membersCollection, where('userId', '==', currentUser.uid));
        const memberSnapshot = await getDocs(memberQuery);
        if (!memberSnapshot.empty) {
          memberServers.push({
            serverID: serverDoc.id,
            ...serverDoc.data()
          } as Server);
        }
      }
    }

    const combinedServers = [...ownerServers, ...memberServers];
    setServers(combinedServers);
  };

  useEffect(() => {
    fetchServers();
  }, [currentUser]);

  const handleAddServerClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="bg-gray-900 text-purple-lighter flex-none w-24 p-6 hidden md:block">
      <div className="cursor-pointer mb-4 border-b border-gray-600 pb-2">
        <div className="bg-white h-12 w-12 flex items-center justify-center text-black text-2xl font-semibold rounded-3xl mb-1 overflow-hidden">
          <img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="Main server" />
        </div>
      </div>
      {servers.length > 0 ? (
        servers.map(server => (
          <ServerIcon
            key={server.serverID}
            server={server}
            onClick={() => onServerSelect(server.serverID, server.serverName, server.ownerId === currentUser?.uid)}
          />
        ))
      ) : (
        <p className="text-gray-400 pt-3 pb-8">No servers yet</p>
      )}

      <div className="cursor-pointer" onClick={handleAddServerClick}>
        <div
          className="bg-white opacity-25 h-12 w-12 flex items-center justify-center text-black text-2xl font-semibold rounded-3xl mb-1 overflow-hidden transition-all duration-200 transform hover:rounded-xl"
        >
          <svg className="fill-current h-10 w-10 block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path
              d="M16 10c0 .553-.048 1-.601 1H11v4.399c0 .552-.447.601-1 .601-.553 0-1-.049-1-.601V11H4.601C4.049 11 4 10.553 4 10c0-.553.049-1 .601-1H9V4.601C9 4.048 9.447 4 10 4c.553 0 1 .048 1 .601V9h4.399c.553 0 .601.447.601 1z"
            />
          </svg>
        </div>
      </div>

      <Modal show={showModal} onClose={handleCloseModal} onServerCreated={fetchServers} />
    </div>
  );
};

export default Sidebar;
