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
  Icon,
  HeaderRightZone
} from 'design-react-kit';
import { Link } from 'react-router-dom';
import { LogoutButton } from '../authComponents/loginForm';

function AuthHeader({ user, loggedIn, isAdmin, handleLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Header theme="dark"  type="slim"  className="shadow-sm">
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
          navbar
          isOpen={isOpen}
          id="navbar"
        >
        </Collapse>
        <HeaderRightZone>

                {/* Login / Username */}
                {loggedIn && user ? (
                  <NavItem>
                      <Icon icon="it-user" size="sm" className="me-1" />
                      {user.username}
                  </NavItem>
                ) : (
                  <NavItem>
                    <TabNavLink tag={Link} to="/login">
                      <Icon icon="it-user" size="sm" className="me-1" />
                      Login
                    </TabNavLink>
                  </NavItem>
                )}

                {/* SignUp */}
                {!loggedIn && !user && !isAdmin ? (
                  <NavItem>
                    <TabNavLink tag={Link} to="/signup">
                      <Icon icon="it-sign" size="sm" className="me-1" />
                      Sign Up
                    </TabNavLink>
                  </NavItem>
                ) : null}

                {/*Logout*/ }
                {loggedIn && (
                <NavItem>
                  <LogoutButton handleLogout={handleLogout} color="warning" tag={Link} to="/">
                    Logout
                  </LogoutButton>
                </NavItem>
              )}
          
        </HeaderRightZone>
      </HeaderContent>
    </Header>
  );
}

export default AuthHeader;
