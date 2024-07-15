import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWindowMinimize, faWindowMaximize, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import { useTheme } from './pages/provider/ThemeProvider';
import './Titlebar.css';

const TitleBar: React.FC = () => {
  const location = useLocation();
  const { theme } = useTheme();

  const handleMinimize = () => {
    if (window.electron) {
      window.electron.ipcRenderer.send('window-control', 'minimize');
    }
  };

  const handleMaximize = () => {
    if (window.electron) {
      window.electron.ipcRenderer.send('window-control', 'maximize');
    }
  };

  const handleClose = () => {
    if (window.electron) {
      window.electron.ipcRenderer.send('window-control', 'close');
    }
  };

  const getPageName = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Login';
      case '/login':
        return 'Login';
      case '/register':
        return 'Register';
      case '/dashboard':
        return 'Dashboard';
      case '/settings/general':
        return 'General Settings';
      case '/settings/appearance':
        return 'Appearance Settings';
      case '/settings/overlay':
        return 'Overlay Settings';
      case '/settings/privacy':
        return 'Privacy Settings';
      default:
        return 'PHiscord';
    }
  };

  const currentPage = getPageName(location.pathname);

  return (
    <div className={`title-bar absolute top-0 z-[999] bg-[var(--bg-color)] text-[var(--primary-text-color)] flex-shrink-0`}>
      <div className="title-bar-drag-region"></div>
      <div className="title-bar-title left-0 absolute flex flex-row">
        <h1 className="font-bold">PHiscord</h1> - {currentPage}
      </div>
      <div className="title-bar-buttons">
        <button onClick={handleMinimize}>
          <FontAwesomeIcon icon={faWindowMinimize} />
        </button>
        <button onClick={handleMaximize}>
          <FontAwesomeIcon icon={faWindowMaximize} />
        </button>
        <button onClick={handleClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
