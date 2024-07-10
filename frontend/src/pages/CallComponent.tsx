import React, { useEffect, useState } from 'react';
import { createClient, createMicrophoneAndCameraTracks, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { AGORA_APP_ID } from '../config';

const client = createClient({ mode: 'rtc', codec: 'vp8' });

const CallComponent: React.FC = () => {
  const [joined, setJoined] = useState(false);
  const [localTracks, setLocalTracks] = useState<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  useEffect(() => {
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        user.videoTrack?.play(`remote-user-${user.uid}`);
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
      setRemoteUsers((prevUsers) => [...prevUsers, user]);
    });

    client.on('user-unpublished', (user) => {
      setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
    });
  }, []);

  const joinChannel = async () => {
    try {
      await client.join(AGORA_APP_ID, 'test-channel', null, null);

      const [microphoneTrack, cameraTrack] = await createMicrophoneAndCameraTracks();
      setLocalTracks([microphoneTrack, cameraTrack]);
      await client.publish([microphoneTrack, cameraTrack]);

      cameraTrack.play('local-player');
      setJoined(true);
    } catch (error) {
      console.error('Error joining Agora channel:', error);
    }
  };

  const leaveChannel = async () => {
    try {
      localTracks?.forEach(track => {
        track.stop();
        track.close();
      });
      await client.leave();
      setLocalTracks(null);
      setRemoteUsers([]);
      setJoined(false);
    } catch (error) {
      console.error('Error leaving Agora channel:', error);
    }
  };

  return (
    <div className="call-container">
      {!joined ? (
        <button onClick={joinChannel}>Join Call</button>
      ) : (
        <div>
          <div id="local-player" className="local-player"></div>
          {remoteUsers.map((user) => (
            <div key={user.uid} id={`remote-user-${user.uid}`} className="remote-player"></div>
          ))}
          <button onClick={leaveChannel}>Leave Call</button>
        </div>
      )}
    </div>
  );
};

export default CallComponent;
