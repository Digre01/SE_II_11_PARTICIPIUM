import NavComponent from '../components/Header';
import { Outlet } from 'react-router';

function DefaultLayout() {
  return (
    <>
      <NavComponent />
      <main className="container my-4">
        <Outlet />
      </main>
    </>
  );
}

export default DefaultLayout;