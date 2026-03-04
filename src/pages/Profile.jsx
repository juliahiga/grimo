import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import ImageCropModal from "../components/ImageCropModal";
import "../styles/Profile.css";

const Profile = () => {
  const { user, setUser } = useUser();
  const [newName, setNewName] = useState("");
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (user?.name) setNewName(user.name);
    if (user?.picture) setPreview(user.picture);
  }, [user]);

  const handleConfirmImage = async (croppedImage) => {
    setPreview(croppedImage);
    setUser((prev) => ({ ...prev, picture: croppedImage }));
    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/users/update-picture`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ google_id: user.google_id, custom_picture: croppedImage }),
      });
    } catch (err) {
      console.log("Erro ao salvar foto:", err);
    }
  };

  const handleSave = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/users/update-name`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ google_id: user.google_id, name: newName }),
      });
      setUser((prev) => ({ ...prev, name: newName }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.log("Erro ao salvar:", err);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="avatar-container" onClick={() => setModalOpen(true)}>
          <img src={preview} alt={user?.name} className="profile-avatar" />
        </div>
        <div className="profile-info">
          <label className="profile-label">NOME:</label>
          <input
            className="profile-input"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="profile-save-btn" onClick={handleSave}>
            {saved ? "SALVO!" : "SALVAR"}
          </button>
        </div>
      </div>
      {modalOpen && (
        <ImageCropModal
          onConfirm={handleConfirmImage}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Profile;