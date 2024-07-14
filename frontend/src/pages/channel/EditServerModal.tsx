import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../FirebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface EditServerModalProps {
  show: boolean;
  serverID: string;
  serverName: string;
  serverImage: string;
  onClose: () => void;
  onSave: (name: string, imageUrl: string) => void;
}

const EditServerModal: React.FC<EditServerModalProps> = ({ show, serverID, serverName, serverImage, onClose, onSave }) => {
  const [name, setName] = useState(serverName);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(serverImage);
  const [loading, setLoading] = useState(false);

  if (!show) {
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    let uploadedImageUrl = imageUrl;

    if (image) {
      const imageRef = ref(storage, `serverIcons/${serverID}`);
      await uploadBytes(imageRef, image);
      uploadedImageUrl = await getDownloadURL(imageRef);
    }

    const serverDocRef = doc(db, 'Servers', serverID);
    const updateData: { serverName: string; serverIconUrl?: string } = {
      serverName: name,
    };

    if (image) {
      updateData.serverIconUrl = uploadedImageUrl;
    }

    await updateDoc(serverDocRef, updateData);

    setLoading(false);
    onSave(name, uploadedImageUrl);
    onClose();
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-[--overlay-color] opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-[--primary-bg-color] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-[--primary-bg-color] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-[--primary-text-color]" id="modal-title">
                  Edit Server
                </h3>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-[--secondary-text-color]">
                    Server Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full border text-[--primary-text-color] bg-[--secondary-bg-color] border-[--overlay-color] rounded-md shadow-sm p-2"
                  />
                  <label className="block text-sm font-medium text-[--secondary-text-color] mt-4">
                    Server Image
                  </label>
                  <input
                    type="file"
                    onChange={handleImageChange}
                    className="mt-1 block w-full text-sm text-[--primary-text-color]"
                  />
                  {imageUrl && (
                    <img src={imageUrl} alt="Server" className="mt-2 w-32 h-32 rounded-full object-cover" />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[--primary-bg-color] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-500 text-base font-medium text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border-gray-300 shadow-sm px-4 py-2 bg-[--primary-button-color] text-base font-medium text-[--primary-text-color] hover:bg-[--primary-button-hover] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditServerModal;
