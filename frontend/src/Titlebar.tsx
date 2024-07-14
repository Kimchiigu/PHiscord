import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWindowMinimize, faWindowMaximize, faTimes } from '@fortawesome/free-solid-svg-icons';
import './Titlebar.css';

const TitleBar: React.FC = () => {

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

  return (
    <div className="title-bar absolute top-0 bottom-0 z-[999]">
      <div className="title-bar-drag-region"></div>
      <div className="title-bar-title">PHiscord</div>
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
