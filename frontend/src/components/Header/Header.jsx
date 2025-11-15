import {
  Headers,
} from 'design-react-kit';
import AuthHeader from './AuthHeader';

function NavComponent({ user, loggedIn, isAdmin, handleLogout }) {
  return (
    <Headers sticky={true} className="app-header-wrapper">
      <AuthHeader 
        user={user}
        loggedIn={loggedIn}
        isAdmin={isAdmin}
        handleLogout={handleLogout}
         />
    </Headers>
  );
}

export default NavComponent;
