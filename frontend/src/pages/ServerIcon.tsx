import React from 'react';

interface Server {
  serverID: string;
  serverIconUrl: string;
  serverName: string;
}

const ServerIcon: React.FC<{ server: Server }> = ({ server }) => (
  <div className="relative group cursor-pointer mb-4">
    <div className="bg-white h-12 w-12 flex items-center justify-center text-black text-2xl font-semibold rounded-3xl mb-1 overflow-hidden transition-all duration-300 group-hover:rounded-lg">
      <img src={server.serverIconUrl} alt={server.serverName} />
    </div>
    <div className="absolute left-[5rem] top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-100 bg-gray-900 text-white text-lg rounded-md px-2 py-1 z-10 font-bold flex flex-row">
      {server.serverName}
      <div className="absolute left-[-0.2rem] top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-r-gray-900 border-t-transparent border-b-transparent"></div>
    </div>
  </div>
);

export default ServerIcon;
