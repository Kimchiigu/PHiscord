import { useNavigate } from 'react-router-dom';
import { useAuth } from './provider/AuthProvider';

function ProfileBar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate('/settings/general');
  };

  return (
    <div className="absolute bottom-0 left-0 w-full flex items-center justify-between p-4 bg-gray-900 text-white">
      <div className="flex items-center">
        <img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="User Avatar" className="w-10 h-10 rounded-full" />
        <div className="ml-3">
          <p className="text-sm font-semibold text-left">{currentUser?.displayName}</p>
          <p className="text-xs text-gray-400 text-left">#{currentUser?.discriminator}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="p-2 hover:bg-gray-700 rounded-lg">
          <img src="/icon/unmute-icon.svg" className="w-5 h-5 fill-current text-white" alt="Unmute" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded-lg">
          <img src="/icon/undeafen-icon.svg" className="w-5 h-5 fill-current text-white" alt="Deafen" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded-lg" onClick={handleSettingsClick}>
          <img src="/icon/settings-icon.svg" className="w-5 h-5 fill-current text-white" alt="Settings" />
        </button>
      </div>
    </div>
  );
}

export default ProfileBar;
