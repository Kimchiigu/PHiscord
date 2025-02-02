const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  Notification,
  nativeImage,
} = require("electron");
const path = require("path");
const { getDoc, updateDoc, doc } = require("firebase/firestore");
const { db } = require("./FirebaseConfig"); 

let tray;
let mainWindow;
let currentUserId = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false, 
    },
    title: "PHiscord",
    icon: path.join(__dirname, "assets/phiscord-logo.ico"),
  });

  mainWindow.loadURL("http://localhost:5173");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function createTray() {
  try {
    const icon = path.join(__dirname, "assets/phiscord-logo.ico");

    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Open",
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
          } else {
            createWindow();
          }
        },
      },
      { type: "separator" },
      { label: "Mute", type: "checkbox", click: toggleMute },
      { label: "Deafen", type: "checkbox", click: toggleDeafen },
      { type: "separator" },
      {
        label: "Exit",
        click: () => {
          app.quit();
        },
      },
    ]);

    tray.setToolTip("PHiscord");
    tray.setContextMenu(contextMenu);
  } catch (error) {
    console.error("Failed to fetch the icon image:", error);
  }
}

async function toggleMute(menuItem) {
  if (!currentUserId) return;
  try {
    const userDoc = await getDoc(doc(db, "Users", currentUserId));
    if (userDoc.exists()) {
      const currentMuteStatus = userDoc.data().isMuted;
      await updateDoc(doc(db, "Users", currentUserId), {
        isMuted: !currentMuteStatus,
      });
      menuItem.checked = !currentMuteStatus;
      updateThumbarButtons();
    }
  } catch (error) {
    console.error("Failed to toggle mute:", error);
  }
}

async function toggleDeafen(menuItem) {
  if (!currentUserId) return;
  try {
    const userDoc = await getDoc(doc(db, "Users", currentUserId));
    if (userDoc.exists()) {
      const currentDeafenStatus = userDoc.data().isDeafened;
      await updateDoc(doc(db, "Users", currentUserId), {
        isDeafened: !currentDeafenStatus,
      });
      menuItem.checked = !currentDeafenStatus;
      updateThumbarButtons(); 
    }
  } catch (error) {
    console.error("Failed to toggle deafen:", error);
  }
}

function createThumbarButtons() {
  if (!mainWindow) return;

  let muteIcon, deafenIcon;

  // Fetch current user status
  getDoc(doc(db, "Users", currentUserId)).then((userDoc) => {
    if (userDoc.exists()) {
      const isMuted = userDoc.data().isMuted;
      const isDeafened = userDoc.data().isDeafened;

      muteIcon = nativeImage.createFromPath(
        path.join(__dirname, `assets/${isMuted ? "mute" : "unmute"}.png`)
      );

      deafenIcon = nativeImage.createFromPath(
        path.join(__dirname, `assets/${isDeafened ? "deaf" : "undeaf"}.png`)
      );

      const buttons = [
        {
          tooltip: isMuted ? "Unmute" : "Mute",
          icon: muteIcon,
          click() {
            if (currentUserId) {
              toggleMute({ checked: false });
            }
          },
        },
        {
          tooltip: isDeafened ? "Undeafen" : "Deafen",
          icon: deafenIcon,
          click() {
            if (currentUserId) {
              toggleDeafen({ checked: false });
            }
          },
        },
      ];

      mainWindow.setThumbarButtons(buttons);
    }
  });
}

function updateThumbarButtons() {
  if (currentUserId) {
    createThumbarButtons();
  }
}

function handleCommandLineArguments(commandLine) {
  if (commandLine.includes("--mute")) {
    toggleMute({ checked: false });
  } else if (commandLine.includes("--deafen")) {
    toggleDeafen({ checked: false });
  }
}

app.setUserTasks([
  {
    program: process.execPath,
    arguments: "--mute",
    iconPath: path.join(__dirname, "assets/phiscord-logo.ico"),
    iconIndex: 0,
    title: "Mute",
    description: "Mute the microphone",
  },
  {
    program: process.execPath,
    arguments: "--deafen",
    iconPath: path.join(__dirname, "assets/phiscord-logo.ico"),
    iconIndex: 0,
    title: "Deafen",
    description: "Deafen the audio",
  },
]);

ipcMain.on("set-current-user-id", (event, userId) => {
  currentUserId = userId;
  if (userId) {
    createThumbarButtons();
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handle the command line arguments when the app is first launched
app.on("ready", () => {
  handleCommandLineArguments(process.argv);
});

// Handle the command line arguments when a second instance is launched
app.on("second-instance", (event, commandLine, workingDirectory) => {
  handleCommandLineArguments(commandLine);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("show-notification", (event, { title, body }) => {
  new Notification({ title, body }).show();
});

ipcMain.on("window-control", (event, action) => {
  const window = BrowserWindow.getFocusedWindow();
  if (!window) return;

  switch (action) {
    case "minimize":
      window.minimize();
      break;
    case "maximize":
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
      break;
    case "close":
      window.close();
      break;
    default:
      break;
  }
});

const isSecondInstance = app.requestSingleInstanceLock();

if (!isSecondInstance) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    handleCommandLineArguments(commandLine);
  });
}
