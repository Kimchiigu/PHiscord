import React from 'react';

interface MessageProps {
  src: string;
  user: string;
  message: string;
  time: string;
}

const Message: React.FC<MessageProps> = ({ src, user, message, time }) => {
  const isImage = (url: string) => /(\.jpeg|\.jpg|\.gif|\.png)/.test(url);
  const isVideo = (url: string) => /(\.mp4|\.webm|\.ogg)/.test(url);
  const isFile = (url: string) => /(\.xlsx|\.pdf|\.docx|\.doc|\.zip|\.rar)/.test(url);

  const messageType = isImage(message)
    ? 'image'
    : isVideo(message)
      ? 'video'
      : isFile(message)
        ? 'file'
        : 'text';

  const renderFilePreview = (url: string) => {
    return (
      <div className="mt-2 p-2 bg-gray-800 rounded-lg flex items-center">
        <div className="mr-2">
          <svg
            className="w-6 h-6 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 7H3v16h18V7h-4V1H7v6zM3 7l6-6m12 6h-6V1m0 0L3 7"
            />
          </svg>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-blue-500 font-semibold truncate">{decodeURIComponent(url.split('/').pop()!)}</div>
          <div className="text-gray-400 text-xs">Click to download</div>
        </div>
        <a
          href={url}
          download
          className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
        >
          Download
        </a>
      </div>
    );
  };

  return (
    <div className="border-b border-gray-600 py-3 flex items-start mb-4 text-sm text-left">
      <img src={src} className="cursor-pointer w-10 h-10 rounded-3xl mr-3" alt={`${user}'s avatar`} />
      <div className="flex-1 overflow-hidden">
        <div>
          <span className="font-bold text-red-300 cursor-pointer hover:underline mr-2">{user}</span>
          <span className="font-bold text-gray-400 text-xs">{time}</span>
        </div>
        {messageType === 'image' ? (
          <img src={message} alt="Uploaded content" className="max-w-full h-auto rounded mt-2" />
        ) : messageType === 'video' ? (
          <video controls className="max-w-full h-auto rounded mt-2">
            <source src={message} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : messageType === 'file' ? (
          renderFilePreview(message)
        ) : (
          <p className="text-white leading-normal mt-2">{message}</p>
        )}
      </div>
    </div>
  );
};

export default Message;
