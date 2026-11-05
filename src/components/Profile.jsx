// Module 1: profile management (view details, edit name, change password)

import { useEffect, useState } from "react";
import ModuleShell from "./ModuleShell";
import { changePassword, getProfile, updateProfile } from "../api/profileApi";

function Profile({ user, onUserUpdate, onBack }) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProfile();
        setProfile(data.user);
      } catch (err) {
        setStatus({ type: "error", text: err.message });
      }
    };
    load();
  }, []);

  const saveName = async (e) => {
    e.preventDefault();
    try {
      const data = await updateProfile(name);
      localStorage.setItem("graco_token", data.token);
      onUserUpdate(data.user);
      setProfile((p) => ({ ...p, name: data.user.name }));
      setStatus({ type: "success", text: "Name updated" });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setProfile((p) => ({ ...p, hasPassword: true }));
      setStatus({ type: "success", text: "Password updated" });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <ModuleShell title="My Profile" icon="fa-user-circle" onBack={onBack}>
      {status.text && (
        <p
          className={`mb-4 text-sm ${
            status.type === "error" ? "text-red-500" : "text-emerald-600"
          }`}
        >
          {status.text}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Account details</h3>
          <p className="text-sm text-gray-500 mb-1">Email</p>
          <p className="mb-4 text-gray-800">{profile?.email || user.email}</p>

          {profile && (
            <p className="text-sm text-gray-500 mb-4">
              {profile.googleLinked && (
                <span className="mr-3">
                  <i className="fab fa-google mr-1"></i>Google linked
                </span>
              )}
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          )}

          <form onSubmit={saveName}>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="profile-name">
              Name
            </label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} mb-4`}
              required
            />
            <button className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-700">
              Save name
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">
            {profile && !profile.hasPassword ? "Set a password" : "Change password"}
          </h3>
          <form onSubmit={savePassword}>
            {(!profile || profile.hasPassword) && (
              <>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="current-password">
                  Current password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`${inputClass} mb-4`}
                  required
                />
              </>
            )}
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`${inputClass} mb-4`}
              required
            />
            <button className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-700">
              Update password
            </button>
          </form>
        </div>
      </div>
    </ModuleShell>
  );
}

export default Profile;
