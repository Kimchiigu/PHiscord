import React, { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, { IAgoraRTCRemoteUser, IMicrophoneAudioTrack, ICameraVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';
import { useAuth } from '../provider/AuthProvider';
import axios from 'axios';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { db } from '../../FirebaseConfig';

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
  const remotePlayerRef = useRef<{ [uid: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (!client.current) {
      client.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      client.current.on('user-published', async (user, mediaType) => {
        if (client.current) {
          await client.current.subscribe(user, mediaType);
        }
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack as IRemoteVideoTrack | undefined;
          if (remoteVideoTrack && remotePlayerRef.current[user.uid]) {
            remoteVideoTrack.play(remotePlayerRef.current[user.uid]!);  // Non-null assertion
          }
        }
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          remoteAudioTrack?.play();
        }
        setRemoteUsers((prevUsers) => [...prevUsers, user]);
      });

      client.current.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers((prevUsers) => prevUsers.filter((remoteUser) => remoteUser.uid !== user.uid));
        }
        if (mediaType === 'audio') {
          user.audioTrack?.stop();
        }
      });

      client.current.on('user-left', (user) => {
        setRemoteUsers((prevUsers) => prevUsers.filter((remoteUser) => remoteUser.uid !== user.uid));
      });
    }

    if (serverId && channelId) {
      const unsubscribe = onSnapshot(doc(db, 'Servers', serverId, 'Channels', channelId), async (docSnapshot) => {
        if (docSnapshot.exists()) {
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

  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'Users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        setIsMuted(userData.isMuted || false);
        setIsDeafened(userData.isDeafened || false);
        if (localAudioTrack.current) {
          localAudioTrack.current.setEnabled(!userData.isMuted);
        }
        if (client.current) {
          client.current.remoteUsers.forEach(user => {
            if (userData.isDeafened) {
              user.audioTrack?.stop();
            } else {
              user.audioTrack?.play();
            }
          });
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const joinVoiceChannel = useCallback(async () => {
    if (!currentUser) return;

    const tokenResponse = await axios.get(`http://localhost:3000/generateAgoraToken?channelName=${channelId}`);
    const token = tokenResponse.data.token;

    const userDoc = await getDoc(doc(db, 'Users', currentUser.uid));
    if (userDoc.exists()) {
      const profilePicturePath = userDoc.data()?.profilePicture;
      const storage = getStorage();
      const profilePictureRef = ref(storage, profilePicturePath);
      const downloadURL = await getDownloadURL(profilePictureRef);
      setProfilePicture(downloadURL);
    }

    if (client.current) {
      await updateDoc(doc(db, 'Servers', serverId, 'Channels', channelId), {
        participants: arrayUnion(currentUser.uid)
      });

      setIsJoined(true);

      await client.current.join('ec70b661b8554e4cb1d7e225b40364e4', channelId, token, currentUser.uid);
      localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();
      if (isVideoOn) {
        localVideoTrack.current = await AgoraRTC.createCameraVideoTrack();
        await client.current.publish([localAudioTrack.current, localVideoTrack.current]);
        localVideoTrack.current.play('local-player');
      } else {
        await client.current.publish([localAudioTrack.current]);
      }

      if (isMuted) {
        localAudioTrack.current.setEnabled(false);
      }

      if (isDeafened) {
        client.current.remoteUsers.forEach(user => {
          user.audioTrack?.stop();
        });
      }
    }
  }, [channelId, currentUser, isMuted, isVideoOn, isDeafened, serverId]);

  useEffect(() => {
    if (isJoined) {
      joinVoiceChannel();
    }
  }, [isJoined, joinVoiceChannel]);

  const handleJoinClick = () => {
    setIsJoined(true);
  };

  const handleMute = async () => {
    if (localAudioTrack.current && currentUser) {
      const newMuteState = !isMuted;
      localAudioTrack.current.setEnabled(!newMuteState);
      setIsMuted(newMuteState);

      await updateDoc(doc(db, 'Users', currentUser.uid), {
        isMuted: newMuteState
      });
    }
  };

  const handleVideoToggle = async () => {
    if (currentUser) {
      const newVideoState = !isVideoOn;
      setIsVideoOn(newVideoState);

      if (localVideoTrack.current) {
        if (newVideoState) {
          localVideoTrack.current.setEnabled(true);
          localVideoTrack.current.play('local-player');
        } else {
          localVideoTrack.current.setEnabled(false);
          localVideoTrack.current.stop();
        }
      } else if (newVideoState) {
        localVideoTrack.current = await AgoraRTC.createCameraVideoTrack();
        await client.current?.publish([localVideoTrack.current]);
        localVideoTrack.current.play('local-player');
      }

      await updateDoc(doc(db, 'Users', currentUser.uid), {
        isVideoOn: newVideoState
      });
    }
  };

  const handleDeafen = async () => {
    if (client.current && currentUser) {
      const newDeafenState = !isDeafened;
      if (newDeafenState) {
        client.current.remoteUsers.forEach(user => {
          user.audioTrack?.stop();
        });
      } else {
        client.current.remoteUsers.forEach(user => {
          user.audioTrack?.play();
        });
      }
      setIsDeafened(newDeafenState);

      await updateDoc(doc(db, 'Users', currentUser.uid), {
        isDeafened: newDeafenState
      });
    }
  };

  const handleLeave = async () => {
    if (client.current && currentUser) {
      await client.current.leave();
      client.current = null;
      localAudioTrack.current?.close();
      localVideoTrack.current?.close();
      await updateDoc(doc(db, 'Servers', serverId, 'Channels', channelId), {
        participants: arrayRemove(currentUser.uid)
      });
      setRemoteUsers([]);
      setIsJoined(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-[--bg-color] h-full w-full">
      {!isJoined && (
        <div className="text-center">
          <h1 className="text-[--primary-text-color] text-4xl font-semibold mb-2">{channelName}</h1>
          {participants.length === 0 ? (
            <p className="text-[--secondary-text-color] mb-4">No one is currently in the voice</p>
          ) : (
            <>
              <p className="text-[--secondary-text-color] mb-4">Current Participants:</p>
              <div className="flex space-x-4 mb-4">
                {participants.map((participant) => (
                  <div key={participant.uid} className="w-24 h-24">
                    {participant.profilePicture ? (
                      <img src={participant.profilePicture} alt="Profile" className="w-24 h-24 object-cover rounded-full" />
                    ) : (
                      <div className="w-24 h-24 bg-[--primary-bg-color] rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          <button className="bg-green-500 text-[--primary-text-color] px-4 py-2 rounded-lg" onClick={handleJoinClick}>Join Voice</button>
        </div>
      )}
      {isJoined && (
        <>
          <div id="local-player" className="w-2/3 h-64 bg-[--primary-bg-color] rounded-xl flex justify-center items-center">
            {!isVideoOn && profilePicture && (
              <div className="flex w-full items-center justify-center">
                <img src={profilePicture} alt="Profile" className="w-24 h-24 object-cover rounded-full" />
              </div>
            )}
          </div>
          {remoteUsers.map((user) => (
            <div key={user.uid} id={`user-${user.uid}`} className="w-full h-64 bg-[--primary-bg-color]" ref={(el) => (remotePlayerRef.current[user.uid] = el)}></div>
          ))}
          <div className="mt-3 w-2/3 h-64 bg-[--primary-bg-color] rounded-xl flex justify-center items-center">
            {participants
              .filter((participant) => participant.uid !== currentUser?.uid)
              .map((participant) => (
                <div key={participant.uid} className="w-full h-64 bg-[--primary-bg-color] flex justify-center items-center rounded-xl">
                  {participant.profilePicture ? (
                    <div className="flex w-full bg-[--primary-bg-color] items-center justify-center">
                      <img src={participant.profilePicture} alt="Profile" className="w-24 h-24 object-cover rounded-full" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-[--primary-bg-color] rounded-full">
                      <h1 className='text-gray-100 font-semibold'>Invite your other friends!</h1>
                    </div>
                  )}
                </div>
              ))}
          </div>
          <div className="flex space-x-2 mt-4">
            <button className="bg-blue-500 text-[--primary-text-color] px-4 py-2 rounded-lg" onClick={handleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
            <button className="bg-yellow-500 text-[--primary-text-color] px-4 py-2 rounded-lg" onClick={handleDeafen}>{isDeafened ? 'Undeafen' : 'Deafen'}</button>
            <button className="bg-purple-500 text-[--primary-text-color] px-4 py-2 rounded-lg" onClick={handleVideoToggle}>{isVideoOn ? 'Turn Off Video' : 'Turn On Video'}</button>
            <button className="bg-red-500 text-[--primary-text-color] px-4 py-2 rounded-lg" onClick={handleLeave}>Leave</button>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceChannel;
