import React, { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, { IAgoraRTCRemoteUser, IMicrophoneAudioTrack, ICameraVideoTrack } from 'agora-rtc-sdk-ng';
import { useAuth } from '../provider/AuthProvider';
import axios from 'axios';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { db } from '../FirebaseConfig';

interface Participant {
  uid: string;
  profilePicture: string | null;
}

const VoiceChannel: React.FC<{ serverId: string; channelId: string; channelName: string }> = ({ serverId, channelId, channelName }) => {
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
  const [participants, setParticipants] = useState<Participant[]>([]);

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

    if (serverId && channelId) {
      const unsubscribe = onSnapshot(doc(db, 'Servers', serverId, 'Channels', channelId), async (docSnapshot) => {
        if (docSnapshot.exists()) {
          console.log('Participants data fetched:', docSnapshot.data()?.participants);
          const participantsData = docSnapshot.data()?.participants || [];
          const participantsWithProfilePictures = await Promise.all(
            participantsData.map(async (uid: string) => {
              const userDoc = await getDoc(doc(db, 'Users', uid));
              if (userDoc.exists()) {
                const profilePicturePath = userDoc.data()?.profilePicture;
                const storage = getStorage();
                const profilePictureRef = ref(storage, profilePicturePath);
                const downloadURL = profilePicturePath ? await getDownloadURL(profilePictureRef) : null;
                return { uid, profilePicture: downloadURL };
              }
              return { uid, profilePicture: null };
            })
          );
          console.log('Updated participants:', participantsWithProfilePictures);
          setParticipants(participantsWithProfilePictures);
        }
      });

      return () => {
        if (client.current) {
          client.current.leave();
          client.current = null;
        }
        localAudioTrack.current?.close();
        localVideoTrack.current?.close();
        setRemoteUsers([]);
        setIsJoined(false);
        unsubscribe();
      };
    }
  }, [serverId, channelId]);

  const joinVoiceChannel = useCallback(async () => {
    if (!currentUser) return;

    console.log('Attempting to join voice channel with user:', currentUser.uid);

    const tokenResponse = await axios.get(`http://localhost:3000/generateAgoraToken?channelName=${channelName}`);
    const token = tokenResponse.data.token;

    console.log('Token created successfully: ', token);

    const userDoc = await getDoc(doc(db, 'Users', currentUser.uid));
    if (userDoc.exists()) {
      const profilePicturePath = userDoc.data()?.profilePicture;
      const storage = getStorage();
      const profilePictureRef = ref(storage, profilePicturePath);
      const downloadURL = await getDownloadURL(profilePictureRef);
      setProfilePicture(downloadURL);
      console.log("Current User with ", currentUser.uid, " exists");
    }

    if (client.current) {
      console.log('Updating Firestore with user:', currentUser.uid);
      await updateDoc(doc(db, 'Servers', serverId, 'Channels', channelId), {
        participants: arrayUnion(currentUser.uid)
      });

      console.log('User joined and updated Firestore:', currentUser.uid);
      setIsJoined(true);

      await client.current.join('ec70b661b8554e4cb1d7e225b40364e4', channelName, token, currentUser.uid);
      localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();
      localVideoTrack.current = await AgoraRTC.createCameraVideoTrack();
      console.log("Current User with ", currentUser.uid, " has joined successfully");

      await client.current.publish([localAudioTrack.current]);

      if (isVideoOn) {
        await client.current.publish([localVideoTrack.current]);
        localVideoTrack.current.play('local-player');
      }
    }
  }, [channelName, currentUser, isVideoOn, serverId, channelId]);

  useEffect(() => {
    if (isJoined) {
      console.log('isJoined is true, calling joinVoiceChannel');
      joinVoiceChannel();
    }
  }, [isJoined, joinVoiceChannel]);

  const handleJoinClick = () => {
    console.log('Join button clicked');
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
    await updateDoc(doc(db, 'Servers', serverId, 'Channels', channelId), {
      participants: arrayRemove(currentUser?.uid)
    });
    console.log('User left:', currentUser?.uid);
    setRemoteUsers([]);
    setIsJoined(false);
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-950 h-full w-full">
      {!isJoined && (
        <div className="text-center">
          <h1 className="text-white text-4xl font-semibold mb-2">{channelName}</h1>
          {participants.length === 0 ? (
            <p className="text-gray-400 mb-4">No one is currently in the voice</p>
          ) : (
            <>
            <p className="text-gray-400 mb-4">Current Participants:</p>
            <div className="flex space-x-4 mb-4">
              {participants.map((participant) => (
                <div key={participant.uid} className="w-24 h-24">
                  {participant.profilePicture ? (
                    <img src={participant.profilePicture} alt="Profile" className="w-24 h-24 object-cover rounded-full" />
                  ) : (
                    <div className="w-24 h-24 bg-gray-700 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
            </>
          )}
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
          <div className="mt-3 w-2/3 h-64 bg-gray-900 rounded-xl flex justify-center items-center">
            {participants
              .filter((participant) => participant.uid !== currentUser?.uid)
              .map((participant) => (
                <div key={participant.uid} className="w-full h-64 bg-gray-900 flex justify-center items-center rounded-xl">
                  {participant.profilePicture ? (
                    <div className="flex w-full bg-re items-center justify-center">
                      <img src={participant.profilePicture} alt="Profile" className="w-24 h-24 object-cover rounded-full" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-700 rounded-full">
                      <h1 className='text-gray-100 font-semibold'>Invite your other friends!</h1>
                    </div>
                  )}
                </div>
              ))}
          </div>
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
