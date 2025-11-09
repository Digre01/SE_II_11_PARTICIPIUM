import { useState } from 'react';
import {
  Header,
  HeaderContent,
  HeaderBrand,
  HeaderToggler,
  TabNavLink,
  Collapse,
  Nav,
  NavItem,
  Icon
} from 'design-react-kit';
import { Link } from 'react-router-dom';
import {LogoutButton} from "./authComponents/loginForm.jsx";

function NavComponent({ user, loggedIn, isAdmin, handleLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Header theme="dark" type="navbar" className="shadow-sm">
      <HeaderContent expand="lg">
        {/* Brand */}
        <HeaderBrand tag={Link} to="/" className="text-decoration-none text-dark fw-bold fs-4">
          PARTICIPIUM
        </HeaderBrand>

        {/* Toggler (mobile) */}
        <HeaderToggler
          aria-controls="navbar"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Icon icon="it-burger" />
        </HeaderToggler>

        {/* Menu collapsabile */}
        <Collapse
          header
          navbar
          isOpen={isOpen}
          onOverlayClick={() => setIsOpen(false)}
        >
          <div className="menu-wrapper">
            <Nav navbar className="ms-auto align-items-center">
              {/* Home */}
              <NavItem>
                <TabNavLink tag={Link} to="/" className="nav-link fw-semibold">
                  Home
                </TabNavLink>
              </NavItem>

              {/* Login */}
              {loggedIn && user ? (
                <NavItem>
                  <span className="nav-link fw-semibold d-flex align-items-center">
                    <Icon icon="it-user" size="sm" className="me-1" />
                    {user.username}
                  </span>
                </NavItem>
              ) : (
                <NavItem>
                  <TabNavLink tag={Link} to="/login" className="nav-link">
                    <Icon icon="it-user" size="sm" className="me-1" />
                    Login
                  </TabNavLink>
                </NavItem>
              )}

              {/* SignUp */}
              {!loggedIn && !user && !isAdmin ? (
                  <NavItem>
                  <TabNavLink tag={Link} to="/signup" className="nav-link">
                    <Icon icon="it-sign" size="sm" className="me-1" />
                    Sign Up
                  </TabNavLink>
                </NavItem>
              ): <></>
              }
              {/* SignUp Staff*/}
              {loggedIn && user && isAdmin ? (
                  <NavItem>
                  <TabNavLink tag={Link} to="/staff_signup" className="nav-link">
                    <Icon icon="it-sign" size="sm" className="me-1" />
                    Sign Up Staff
                  </TabNavLink>
                </NavItem>
              ): <></>}

                {loggedIn && (
                    <NavItem className="ms-3">
                        <LogoutButton handleLogout={handleLogout} color="warning" tag={Link} to="/">
                            Logout
                        </LogoutButton>
                    </NavItem>
                )}

            </Nav>
          </div>
        </Collapse>
      </HeaderContent>
    </Header>
  );
}

export default NavComponent;
