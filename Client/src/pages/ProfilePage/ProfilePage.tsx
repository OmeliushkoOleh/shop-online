import "./ProfilePage.css";
import { useAuthStore } from "../../store/authStore";
import { useEffect, useState } from "react";

const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const changeName = useAuthStore((state) => state.changeName);
  const changePhone = useAuthStore((state) => state.changePhone);

  const [name, setName] = useState(user?.user_metadata?.name ?? "");
  const [phone, setPhone] = useState(user?.user_metadata?.phone ?? "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    setName(user?.user_metadata?.name ?? "");
    setPhone(user?.user_metadata?.phone ?? "");
  }, [user]);

  const handleSubmitName = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setNameError("Имя должно содержать минимум 2 символа");
      return;
    }

    setNameError("");
    try {
      await changeName(trimmedName);
      setIsEditingName(false);
    } catch (error) {
      console.error("Ошибка при смене имени:", error);
    }
  };

  const handleSubmitPhone = async () => {
    const trimmedPhone = phone.trim();
    const phoneRegex = /^\+?[0-9\s()-]{7,20}$/;

    if (!trimmedPhone || !phoneRegex.test(trimmedPhone)) {
      setPhoneError("Некорректный номер телефона");
      return;
    }

    setPhoneError("");
    try {
      await changePhone(trimmedPhone);
      setIsEditingPhone(false);
    } catch (error) {
      console.error("Ошибка при смене телефона:", error);
    }
  };

  return (
    <div className="profile-page">
      {!user ? (
        <div>You are not signed up</div>
      ) : (
        <div className="profile-form">
          <div>Email: {user.user_metadata.email}</div>

          <div className="profile-field">
            <div className="profile-row">
              <label>Name</label>
              {!isEditingName ? (
                <>
                  <span>{user.user_metadata.name || "Not set"}</span>
                  <button type="button" onClick={() => setIsEditingName(true)}>
                    Change
                  </button>
                </>
              ) : (
                <>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError("");
                    }}
                    placeholder="Your name"
                  />
                  <button type="button" onClick={handleSubmitName}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setNameError("");
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
            {nameError && <span className="error-text">{nameError}</span>}
          </div>

          <div className="profile-field">
            <div className="profile-row">
              <label>Phone</label>
              {!isEditingPhone ? (
                <>
                  <span>{user.user_metadata.phone || "Not set"}</span>
                  <button type="button" onClick={() => setIsEditingPhone(true)}>
                    Change
                  </button>
                </>
              ) : (
                <>
                  <input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError("");
                    }}
                    placeholder="Your phone"
                  />
                  <button type="button" onClick={handleSubmitPhone}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPhone(false);
                      setPhoneError("");
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
            {phoneError && <span className="error-text">{phoneError}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
