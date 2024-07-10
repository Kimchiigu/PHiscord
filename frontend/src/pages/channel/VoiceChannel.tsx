import React, { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, { IAgoraRTCRemoteUser, IMicrophoneAudioTrack, ICameraVideoTrack } from 'agora-rtc-sdk-ng';
import { useAuth } from '../provider/AuthProvider';
import axios from 'axios';
import { doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { db } from '../firebaseConfig';

const VoiceChannel: React.FC<{ channelName: string }> = ({ channelName }) => {
  const { currentUser } = useAuth();
  const client = useRef<ReturnType<typeof AgoraRTC.createClient> | null>(null);
  const localAudioTrack = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrack = useRef<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false); // Default video to be turned off
  const [isDeafened, setIsDeafened] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    if (!client.current) {
      client.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      client.current.on('user-published', async (user, mediaType) => {
        if (client.current) {
          await client.current.subscribe(user, mediaType);
        }
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack;
          remoteVideoTrack?.play(`user-${user.uid}`);
        }
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          remoteAudioTrack?.play();
        }
        setRemoteUsers((prevUsers) => [...prevUsers, user]);
      });

      client.current.on('user-unpublished', (user) => {
        setRemoteUsers((prevUsers) => prevUsers.filter((remoteUser) => remoteUser.uid !== user.uid));
      });

      client.current.on('user-left', (user) => {
        setRemoteUsers((prevUsers) => prevUsers.filter((remoteUser) => remoteUser.uid !== user.uid));
      });
    }

    return () => {
      if (client.current) {
        client.current.leave();
        client.current = null;
      }
      localAudioTrack.current?.close();
      localVideoTrack.current?.close();
      setRemoteUsers([]);
      setIsJoined(false);
    };
  }, []);

  const joinVoiceChannel = useCallback(async () => {
    if (!currentUser) return;

    const tokenResponse = await axios.get(`http://localhost:3000/generateAgoraToken?channelName=${channelName}`);
    const token = tokenResponse.data.token;

    const userDoc = await getDoc(doc(db, 'Users', currentUser.uid));
    if (userDoc.exists()) {
      const profilePicturePath = userDoc.data().profilePicture;
      const storage = getStorage();
      const profilePictureRef = ref(storage, profilePicturePath);
      const downloadURL = await getDownloadURL(profilePictureRef);
      setProfilePicture(downloadURL);
    }

    if (client.current) {
      await client.current.join('ec70b661b8554e4cb1d7e225b40364e4', channelName, token, currentUser.uid);
      localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();
      localVideoTrack.current = await AgoraRTC.createCameraVideoTrack();

      await client.current.publish([localAudioTrack.current]);

      if (isVideoOn) {
        await client.current.publish([localVideoTrack.current]);
        localVideoTrack.current.play('local-player');
      }
      
      setIsJoined(true);
    }
  }, [channelName, currentUser, isVideoOn]);

  useEffect(() => {
    if (isJoined) {
      joinVoiceChannel();
    }
  }, [isJoined, joinVoiceChannel]);

  const handleJoinClick = () => {
    setIsJoined(true);
  };

  const handleMute = () => {
    if (localAudioTrack.current) {
      if (isMuted) {
        localAudioTrack.current.setEnabled(true);
        setIsMuted(false);
      } else {
        localAudioTrack.current.setEnabled(false);
        setIsMuted(true);
      }
    }
  };

  const handleVideoToggle = () => {
    if (localVideoTrack.current) {
      if (isVideoOn) {
        localVideoTrack.current.setEnabled(false);
        localVideoTrack.current.stop();
        setIsVideoOn(false);
      } else {
        localVideoTrack.current.setEnabled(true);
        localVideoTrack.current.play('local-player');
        setIsVideoOn(true);
      }
    }
  };

  const handleDeafen = () => {
    if (client.current) {
      if (isDeafened) {
        client.current.remoteUsers.forEach(user => {
          user.audioTrack?.play();
        });
        setIsDeafened(false);
      } else {
        client.current.remoteUsers.forEach(user => {
          user.audioTrack?.stop();
        });
        setIsDeafened(true);
      }
    }
  };

  const handleLeave = async () => {
    if (client.current) {
      await client.current.leave();
      client.current = null;
    }
    localAudioTrack.current?.close();
    localVideoTrack.current?.close();
    setRemoteUsers([]);
    setIsJoined(false);
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-950 h-full w-full">
      {!isJoined && (
        <div className="text-center">
          <h1 className="text-white text-4xl font-semibold mb-2">{channelName}</h1>
          <p className="text-gray-400 mb-4">No one is currently in voice.</p>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg" onClick={handleJoinClick}>Join Voice</button>
        </div>
      )}
      {isJoined && (
        <>
          <div id="local-player" className="w-2/3 h-64 bg-gray-900 rounded-xl flex justify-center items-center">
            {!isVideoOn && profilePicture && (
              <div className="flex w-full items-center justify-center">
                <img src={profilePicture} alt="Profile" className="w-24 h-24 object-cover rounded-full" />
              </div>
            )}
          </div>
          {remoteUsers.map((user) => (
            <div key={user.uid} id={`user-${user.uid}`} className="w-full h-64 bg-gray-900"></div>
          ))}
          <div className="flex space-x-2 mt-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg" onClick={handleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
            <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg" onClick={handleDeafen}>{isDeafened ? 'Undeafen' : 'Deafen'}</button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded-lg" onClick={handleVideoToggle}>{isVideoOn ? 'Turn Off Video' : 'Turn On Video'}</button>
            <button className="bg-red-500 text-white px-4 py-2 rounded-lg" onClick={handleLeave}>Leave</button>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceChannel;
