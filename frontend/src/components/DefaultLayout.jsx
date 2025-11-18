import NavComponent from './Header/Header';
import { Outlet } from 'react-router';

function DefaultLayout({ user, loggedIn, isAdmin, handleLogout, notificationCount }) {
  return (
    <>
      <NavComponent user={user} loggedIn={loggedIn} isAdmin={isAdmin} handleLogout={handleLogout} notificationCount={notificationCount} />
      <main className="container my-4">
        <Outlet />
      </main>
    </>
  );
}

export default DefaultLayout;