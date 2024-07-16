import { Outlet } from 'react-router-dom';
import SettingsSidebar from './SettingsSidebar';

function Settings() {
  return (
    <div className="relative flex h-screen w-full">
      <SettingsSidebar />
      <div className="flex ml-64 w-full align-middle justify-center bg-[var(--bg-color)] text-[var(--text-color)]">
        <Outlet />
      </div>
    </div>
  );
}

export default Settings;
