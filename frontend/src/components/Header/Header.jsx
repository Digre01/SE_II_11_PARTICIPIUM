import {
  Headers,
} from 'design-react-kit';
import AuthHeader from './AuthHeader';

function NavComponent({ user, loggedIn, isAdmin, isReportsAllowed, handleLogout }) {
  return (
    <Headers sticky={true} className="app-header-wrapper">
      <AuthHeader 
        user={user}
        loggedIn={loggedIn}
        isAdmin={isAdmin}
        isReportsAllowed={isReportsAllowed}
        handleLogout={handleLogout}
      />
    </Headers>
  );
}

export default NavComponent;
