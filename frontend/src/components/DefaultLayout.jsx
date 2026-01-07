import NavComponent from './Header/Header';
import { Outlet } from 'react-router';

function DefaultLayout({ user, loggedIn, isAdmin, isReportsAllowed, handleLogout, notificationCount }) {
  return (
    <>
      <NavComponent user={user} loggedIn={loggedIn} isAdmin={isAdmin} isReportsAllowed={isReportsAllowed} handleLogout={handleLogout} notificationCount={notificationCount} />
      <main className="container my-4 app-container">
        <Outlet />
      </main>
      {/* Footer removed per request */}
    </>
  );
}

export default DefaultLayout;