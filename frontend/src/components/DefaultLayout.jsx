import NavComponent from '../components/Header';
import { Outlet } from 'react-router';

function DefaultLayout({ user, loggedIn, isAdmin, handleLogout}) {
  return (
    <>
      <NavComponent user={user} loggedIn={loggedIn} isAdmin={isAdmin} handleLogout={handleLogout} />
      <main className="container my-4">
        <Outlet />
      </main>
    </>
  );
}

export default DefaultLayout;