import NavComponent from '../components/Header';
import { Outlet } from 'react-router';

function DefaultLayout({ user, loggedIn, isAdmin}) {
  return (
    <>
      <NavComponent user={user} loggedIn={loggedIn} isAdmin={isAdmin} />
      <main className="container my-4">
        <Outlet />
      </main>
    </>
  );
}

export default DefaultLayout;