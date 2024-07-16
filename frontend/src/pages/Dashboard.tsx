import React, { useState, useEffect } from "react";
import { db } from "../FirebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  getDoc,
} from "firebase/firestore";
import "../App.css";
import Sidebar from "./Sidebar";
import ChannelList from "./channel/ChannelList";
import MemberList from "./channel/MemberList";
import Chat from "./Chat";
import FriendList from "./friend/FriendList";
import FriendChat from "./friend/FriendChat";
import FriendProfile from "./friend/FriendProfile";
import FriendCategory from "./friend/FriendCategory";
import VoiceChannel from "./channel/VoiceChannel";
import FriendCall from "./friend/FriendCall";
import CallNotificationModal from "./friend/CallNotificationModal";
import Notification from "./Notification";
import { useAuth } from "./provider/AuthProvider";

const ipcRenderer =
  typeof window !== "undefined" && window.require
    ? window.require("electron").ipcRenderer
    : null;

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedServer, setSelectedServer] = useState<{
    id: string;
    name: string;
    isOwner: boolean;
  } | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<{
    id: string;
    name: string;
    type: "text" | "voice";
  } | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);
  const [dmSelected, setDmSelected] = useState<boolean>(true); // Set DM as default selected
  const [selectedTab, setSelectedTab] = useState<
    "friends" | "online" | "all" | "pending" | "blocked" | "addFriend"
  >("friends");
  const [categorySelected, setCategorySelected] = useState<
    "friends" | "notifications" | null
  >(null);
  const [callData, setCallData] = useState<{
    callType: "voice" | "video";
    friendId: string;
    dmDocId: string;
  } | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    from: string;
    displayName: string;
    type: "voice" | "video";
    dmDocId: string;
  } | null>(null);

  useEffect(() => {
    if (currentUser) {
      if (ipcRenderer) {
        ipcRenderer.send("set-current-user-id", currentUser.uid);
      }

      const q = query(
        collection(db, "DirectMessages"),
        where("participants", "array-contains", currentUser.uid)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          console.log("onSnapshot data:", data);
          if (
            data.callStatus === "waiting" &&
            data.callData.to === currentUser.uid
          ) {
            setIncomingCall({
              from: data.callData.from,
              displayName: data.callData.displayName,
              type: data.callData.type,
              dmDocId: docSnapshot.id,
            });
          } else if (
            data.callStatus === "accepted" &&
            data.callData.from === currentUser.uid
          ) {
            setCallData({
              callType: data.callData.type,
              friendId: data.callData.to,
              dmDocId: docSnapshot.id,
            });
          }
        });
      });

      return () => {
        unsubscribe();
      };
    }
  }, [currentUser]);

  const handleCallInitiate = async (
    callType: "voice" | "video",
    friendId: string
  ) => {
    console.log("handleCallInitiate called");
    if (currentUser) {
      const q = query(
        collection(db, "DirectMessages"),
        where("participants", "array-contains", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      let dmDocId = null;
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data.participants.includes(friendId)) {
          dmDocId = docSnapshot.id;
        }
      });

      if (dmDocId) {
        const dmRef = doc(db, "DirectMessages", dmDocId);
        const dmData = (await getDoc(dmRef)).data();
        console.log("dmData:", dmData);

        if (
          dmData?.callStatus !== "waiting" &&
          dmData?.callStatus !== "accepted"
        ) {
          console.log("Updating call status to waiting");
          await updateDoc(dmRef, {
            callStatus: "waiting",
            callData: {
              from: currentUser.uid,
              to: friendId,
              displayName: currentUser.displayName,
              type: callType,
            },
          });
          setCallData({ callType, friendId, dmDocId });
        } else {
          console.log("Call status is already waiting or accepted");
        }
      }
    }
  };

  const handleAcceptCall = async () => {
    console.log("handleAcceptCall called");
    if (incomingCall && currentUser) {
      console.log("Updating call status to accepted");
      await updateDoc(doc(db, "DirectMessages", incomingCall.dmDocId), {
        callStatus: "accepted",
      });
      setCallData({
        callType: incomingCall.type,
        friendId: incomingCall.from,
        dmDocId: incomingCall.dmDocId,
      });
      setIncomingCall(null);
    }
  };

  const handleDeclineCall = async () => {
    console.log("handleDeclineCall called");
    if (incomingCall && currentUser) {
      console.log("Updating call status to ended");
      await updateDoc(doc(db, "DirectMessages", incomingCall.dmDocId), {
        callStatus: "ended",
      });
      setIncomingCall(null);
      setCallData(null); // Reset call data
    }
  };

  const isElectron = window.electron?.isElectron;

  return (
    <div
      className={
        isElectron
          ? "font-sans antialiased h-screen flex mt-16"
          : "font-sans antialiased h-screen flex w-full"
      }
    >
      {incomingCall && (
        <CallNotificationModal
          callerName={incomingCall.displayName}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}
      <Sidebar
        onServerSelect={(id, name, isOwner) => {
          setSelectedServer({ id, name, isOwner });
          setSelectedChannel(null);
          setSelectedFriend(null);
          setDmSelected(false);
          setCategorySelected(null);
        }}
        onDmSelect={() => {
          setSelectedServer(null);
          setSelectedChannel(null);
          setSelectedFriend(null);
          setDmSelected(true);
          setCategorySelected(null);
        }}
      />
      {selectedServer ? (
        <>
          <ChannelList
            serverID={selectedServer.id}
            serverName={selectedServer.name}
            isOwner={selectedServer.isOwner}
            onChannelSelect={(id, name) =>
              setSelectedChannel({ id, name, type: "text" })
            }
            onVoiceChannelSelect={(id, name) =>
              setSelectedChannel({ id, name, type: "voice" })
            }
            serverImage={""}
            isAdmin={false}
          />
          {selectedChannel ? (
            selectedChannel.type === "text" ? (
              <Chat
                serverID={selectedServer.id}
                channelID={selectedChannel.id}
                channelName={selectedChannel.name}
              />
            ) : (
              <VoiceChannel
                serverId={selectedServer.id}
                channelId={selectedChannel.id}
                channelName={selectedChannel.name}
              />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[--bg-color]">
              <h2 className="text-[--secondary-text-color]">
                Select a channel to start chatting
              </h2>
            </div>
          )}
          <MemberList serverID={selectedServer.id} />
        </>
      ) : dmSelected ? (
        <div className="flex flex-1 overflow-hidden">
          <FriendList
            onFriendSelect={(friend) => {
              setSelectedFriend(friend);
              setCategorySelected(null);
              setCallData(null); // Reset call state when selecting a new friend
            }}
            onCategorySelect={(category) => setCategorySelected(category)}
          />
          {categorySelected === "notifications" ? (
            <Notification />
          ) : categorySelected === "friends" ? (
            <FriendCategory
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
            />
          ) : selectedFriend ? (
            <>
              {callData ? (
                <FriendCall
                  friendId={selectedFriend.userId}
                  callType={callData.callType}
                  dmDocId={callData.dmDocId}
                  onCallEnd={() => setCallData(null)}
                />
              ) : (
                <>
                  <FriendChat friendId={selectedFriend.userId} />
                  <FriendProfile
                    friendId={selectedFriend.userId}
                    onCallInitiate={(callType) =>
                      handleCallInitiate(callType, selectedFriend.userId)
                    }
                  />
                </>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[--bg-color]">
              <h2 className="text-[--secondary-text-color]">
                Choose a friend to get started chatting
              </h2>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[--bg-color]">
          <h2 className="text-[--secondary-text-color]">
            Choose a server or friend to get started
          </h2>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
