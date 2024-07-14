import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../provider/AuthProvider';
import AgoraRTC, { IAgoraRTCRemoteUser, IMicrophoneAudioTrack, ICameraVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';
import axios from 'axios';
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';

interface FriendCallProps {
  friendId: string;
  callType: 'voice' | 'video';
  dmDocId: string;
  onCallEnd: () => void;
}

const FriendCall: React.FC<FriendCallProps> = ({ friendId, callType, dmDocId, onCallEnd }) => {
  const { currentUser } = useAuth();
  const client = useRef<ReturnType<typeof AgoraRTC.createClient> | null>(null);
  const localAudioTrack = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrack = useRef<ICameraVideoTrack | null>(null);
  const [remoteUser, setRemoteUser] = useState<IAgoraRTCRemoteUser | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [isDeafened, setIsDeafened] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [friendProfilePicture, setFriendProfilePicture] = useState<string | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [waitingForApproval, setWaitingForApproval] = useState(true);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<IRemoteVideoTrack | null>(null);
  const remotePlayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!client.current) {
      client.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      client.current.on('user-published', async (user, mediaType) => {
        if (client.current) {
          await client.current.subscribe(user, mediaType);
        }
        if (mediaType === 'video') {
          const videoTrack = user.videoTrack as IRemoteVideoTrack | undefined;
          if (videoTrack) {
            setRemoteVideoTrack(videoTrack);
          }
        }
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          remoteAudioTrack?.play();
        }
        setRemoteUser(user);
      });

      client.current.on('user-unpublished', (user, mediaType) => {
        if (user.uid === friendId && mediaType === 'video') {
          setRemoteVideoTrack(null);
        }
        if (user.uid === friendId) {
          setRemoteUser(null);
        }
      });

      client.current.on('user-left', (user) => {
        if (user.uid === friendId) {
          setRemoteUser(null);
          endCall();
        }
      });
    }

    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, 'Users', currentUser?.uid || ''));
      if (userDoc.exists()) {
        const profilePicturePath = userDoc.data()?.profilePicture;
        setProfilePicture(profilePicturePath || "https://cdn.discordapp.com/embed/avatars/0.png");
      }
    };

    const fetchFriendData = async () => {
      const friendDoc = await getDoc(doc(db, 'Users', friendId));
      if (friendDoc.exists()) {
        const profilePicturePath = friendDoc.data()?.profilePicture;
        setFriendProfilePicture(profilePicturePath || "https://cdn.discordapp.com/embed/avatars/0.png");
      }
    };

    fetchUserData();
    fetchFriendData();
  }, [friendId, currentUser]);

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

  const startCall = useCallback(async () => {
    if (!currentUser) return;

    const tokenResponse = await axios.get(`http://localhost:3000/generateAgoraToken?channelName=${dmDocId}`);
    const token = tokenResponse.data.token;

    if (client.current) {
      await client.current.join('ec70b661b8554e4cb1d7e225b40364e4', dmDocId, token, currentUser.uid);
      localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();
      if (callType === 'video') {
        localVideoTrack.current = await AgoraRTC.createCameraVideoTrack();
        await client.current.publish([localAudioTrack.current, localVideoTrack.current]);
        localVideoTrack.current.play('local-player');
      } else {
        await client.current.publish([localAudioTrack.current]);
      }

      setWaitingForApproval(true);
      await updateDoc(doc(db, 'DirectMessages', dmDocId), {
        callStatus: 'waiting',
        callData: {
          from: currentUser.uid,
          to: friendId,
          displayName: currentUser.displayName,
          type: callType,
        },
      });

      if (isMuted) {
        localAudioTrack.current.setEnabled(false);
      }

      if (isDeafened) {
        client.current.remoteUsers.forEach(user => {
          user.audioTrack?.stop();
        });
      }
    }
  }, [callType, currentUser, friendId, dmDocId, isMuted, isDeafened]);

  useEffect(() => {
    startCall();

    const unsubscribe = onSnapshot(doc(db, 'DirectMessages', dmDocId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data?.callStatus === 'accepted') {
          setCallAccepted(true);
          setWaitingForApproval(false);
        } else if (data?.callStatus === 'declined' || data?.callStatus === 'ended') {
          endCall();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [startCall, dmDocId]);

  useEffect(() => {
    if (remoteVideoTrack && remotePlayerRef.current) {
      remoteVideoTrack.play(remotePlayerRef.current);
    }
  }, [remoteVideoTrack]);

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
    if (localVideoTrack.current && currentUser) {
      if (isVideoOn) {
        localVideoTrack.current.setEnabled(false);
        localVideoTrack.current.stop();
        setIsVideoOn(false);
      } else {
        localVideoTrack.current.setEnabled(true);
        localVideoTrack.current.play('local-player');
        setIsVideoOn(true);
      }

      await updateDoc(doc(db, 'Users', currentUser.uid), {
        isVideoOn: !isVideoOn
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

  const endCall = async () => {
    if (client.current) {
      await client.current.leave();
      client.current = null;
    }
    localAudioTrack.current?.close();
    localVideoTrack.current?.close();

    await updateDoc(doc(db, 'DirectMessages', dmDocId), {
      callStatus: 'ended',
    });

    onCallEnd();
  };

  return (
    <div className="flex flex-col items-center justify-center bg-[--bg-color] h-full w-full">
      {waitingForApproval ? (
        <p className="text-[--secondary-text-color]">Waiting for approval...</p>
      ) : callAccepted ? (
        <>
          <div id="local-player" className="w-2/3 h-64 bg-[--primary-bg-color] rounded-xl flex justify-center items-center">
            {!isVideoOn && profilePicture && (
              <div className="flex flex-row items-center justify-center">
                <img src={profilePicture} alt="Your Profile" className="w-40 h-40 object-cover rounded-full mr-16" />
                <img src={friendProfilePicture} alt="Friend's Profile" className="w-40 h-40 object-cover rounded-full" />
              </div>
            )}
          </div>
          {remoteVideoTrack && (
            <div id="remote-player" ref={remotePlayerRef} className="w-full h-64 bg-[--primary-bg-color]"></div>
          )}
          <div className="flex space-x-2 mt-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg" onClick={handleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
            <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg" onClick={handleDeafen}>{isDeafened ? 'Undeafen' : 'Deafen'}</button>
            {callType === 'video' && <button className="bg-purple-500 text-white px-4 py-2 rounded-lg" onClick={handleVideoToggle}>{isVideoOn ? 'Turn Off Video' : 'Turn On Video'}</button>}
            <button className="bg-red-500 text-white px-4 py-2 rounded-lg" onClick={endCall}>End Call</button>
          </div>
        </>
      ) : (
        <p className="text-[--secondary-text-color]">Call ended</p>
      )}
    </div>
  );
};

export default FriendCall;
