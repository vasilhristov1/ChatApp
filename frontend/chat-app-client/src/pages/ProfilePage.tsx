import { type FormEvent, useRef, useState } from "react";
import { usersApi } from "../api/usersApi";
import { useAuthStore } from "../store/authStore";

const API_URL = "https://localhost:7039";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const avatarSrc = user?.avatarUrl
    ? `${API_URL}${user.avatarUrl}`
    : undefined;

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();

    setMessage("");
    setIsSaving(true);

    try {
      const updatedUser = await usersApi.updateProfile({
        username,
        bio,
      });

      setUser(updatedUser);
      setMessage("Profile updated.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");
    setIsUploading(true);

    try {
      const updatedUser = await usersApi.uploadAvatar(file);
      setUser(updatedUser);
      setMessage("Avatar updated.");
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div style={styles.page}>
      <form onSubmit={handleSave} style={styles.card}>
        <h1>Profile</h1>

        <div style={styles.avatarSection}>
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>
              {user?.username?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarSelected}
            style={{ display: "none" }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={styles.secondaryButton}
          >
            {isUploading ? "Uploading..." : "Change avatar"}
          </button>
        </div>

        <label style={styles.label}>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          Bio
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            style={styles.textarea}
          />
        </label>

        {message && <p style={styles.success}>{message}</p>}

        <button disabled={isSaving} style={styles.primaryButton}>
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    justifyContent: "center",
  },
  card: {
    width: 480,
    background: "white",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  avatarSection: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    background: "#2563eb",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 36,
    fontWeight: 700,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontWeight: 700,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontWeight: 400,
  },
  textarea: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    minHeight: 100,
    resize: "vertical",
    fontWeight: 400,
  },
  primaryButton: {
    padding: 12,
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
  },
  success: {
    color: "#16a34a",
    margin: 0,
  },
};