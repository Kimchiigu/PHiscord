
const Message: React.FC<{ src: string; time: string; user: string; message: string }> = ({ src, time, user, message }) => {
    const renderContent = () => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = message.split(urlRegex);

        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                if (part.match(/\.(jpeg|jpg|gif|png)$/) !== null) {
                    return <img key={index} src={part} alt="file" className="w-32 h-32" />;
                } else if (part.match(/\.(mp4|webm|ogg)$/) !== null) {
                    return <video key={index} src={part} controls className="w-32 h-32" />;
                } else {
                    return (
                        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                            {part}
                        </a>
                    );
                }
            }
            return <span key={index} className="text-white">{part}</span>;
        });
    };

    return (
        <div className="border-b border-gray-600 py-3 flex items-start mb-4 text-sm">
            <img src={src} className="cursor-pointer w-10 h-10 rounded-3xl mr-3" alt={`${user}'s avatar`} />
            <div className="flex-1 overflow-hidden">
                <div>
                    <span className="font-bold text-red-300 cursor-pointer hover:underline">{user}</span>
                    <span className="font-bold text-gray-400 text-xs">{time}</span>
                </div>
                <div>{renderContent()}</div>
            </div>
        </div>
    );
};

export default Message;