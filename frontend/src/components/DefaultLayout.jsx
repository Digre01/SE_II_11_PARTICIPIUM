import NavComponent from '../components/Header';

function DefaultLayout({ children }) {
  return (
    <>
      <NavComponent />
      <main className="container my-4">{children}</main>
    </>
  );
}

export default DefaultLayout;