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

function AdminHeader({ user, loggedIn, isAdmin, handleLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Header theme="dark" type="navbar" className="shadow-sm">
      <HeaderContent expand="lg">

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

              {/* SignUp Staff*/}
              {loggedIn && user && isAdmin ? (
                  <NavItem>
                  <TabNavLink tag={Link} to="/staff_signup" className="nav-link">
                    <Icon icon="it-sign" size="sm" className="me-1" />
                    Sign Up Staff
                  </TabNavLink>
                </NavItem>
              ): <></>}

              {/* Assign Role (admin) */}
              {loggedIn && user && isAdmin ? (
                <NavItem>
                  <TabNavLink tag={Link} to="/assign_role" className="nav-link">
                    <Icon icon="it-settings" size="sm" className="me-1" />
                    Assign Role
                  </TabNavLink>
                </NavItem>
              ) : <></>}

            </Nav>
          </div>
        </Collapse>
      </HeaderContent>
    </Header>
  );
}

export default AdminHeader;