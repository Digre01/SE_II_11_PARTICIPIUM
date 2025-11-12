import {
  Headers,
} from 'design-react-kit';
import AdminHeader from './AdminHeader';
import AuthHeader from './AuthHeader';

function NavComponent({ user, loggedIn, isAdmin, handleLogout }) {
  return (
    <Headers sticky={true}>
      <AuthHeader 
        user={user}
        loggedIn={loggedIn}
        isAdmin={isAdmin}
        handleLogout={handleLogout}
         />
      {/*  
      {loggedIn && isAdmin && (
        <div className="it-nav-wrapper">
          <AdminHeader
            user={user}
            loggedIn={loggedIn}
            isAdmin={isAdmin}
            handleLogout={handleLogout}
          />
        </div>
      )}
        */}
    </Headers>
  );
}

export default NavComponent;
