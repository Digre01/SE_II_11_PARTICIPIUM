import NavComponent from './Header/Header';
import { Outlet } from 'react-router';

function DefaultLayout({ user, loggedIn, isAdmin, isReportsAllowed, handleLogout}) {
  return (
    <>
      <NavComponent user={user} loggedIn={loggedIn} isAdmin={isAdmin} isReportsAllowed={isReportsAllowed} handleLogout={handleLogout} />
      <main className="container my-4">
        <Outlet />
      </main>
    </>
  );
}

export default DefaultLayout;