import "./ProfilePage.css";
import { useAuthStore } from "../../store/authStore";
const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  return (
    <div className="profile-page">
      {!user ? (
        <div>You are not signed up</div>
      ) : (
        <div>
          <div>Email: {user.user_metadata.email}</div>
          <div>Name: {user.user_metadata.name}</div>
          <div>Name: {user.user_metadata.phone}</div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
