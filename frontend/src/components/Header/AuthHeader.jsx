import { useState } from 'react';
import './AuthHeader.css';
import {
  Header,
  HeaderContent,
  HeaderBrand,
  HeaderToggler,
  TabNavLink,
  Collapse,
  NavItem,
  Icon,
  HeaderRightZone,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  LinkList,
  LinkListItem
} from 'design-react-kit';
import { Link } from 'react-router-dom';
import { LogoutButton } from '../authComponents/loginForm';

function AuthHeader({ user, loggedIn, isAdmin, isReportsAllowed, handleLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const isCitizen = String(user?.userType || '').toLowerCase() === 'citizen';

  return (
    <Header theme="dark" type="slim" className="shadow-sm app-header">
      <HeaderContent expand="lg">
        <HeaderBrand tag={Link} to="/" className="text-decoration-none text-dark fw-bold fs-4">
          PARTICIPIUM
        </HeaderBrand>
        <HeaderToggler
          aria-controls="navbar"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Icon icon="it-burger" />
        </HeaderToggler>
        <Collapse navbar isOpen={isOpen} id="navbar">
          <NavItem>
            <TabNavLink tag={Link} to="/">Home</TabNavLink>
          </NavItem>
        </Collapse>
        <HeaderRightZone>
          {loggedIn && user ? (
            <Dropdown direction="down">
              <DropdownToggle tag="a">
                <Icon icon="it-user" size="sm" className="me-1" />
                {user.username}
              </DropdownToggle>
              <DropdownMenu className="dropdown-offset-y">
                <LinkList>
                  {isReportsAllowed && (
                    <LinkListItem inDropdown tag={Link} to="/reports">
                      <Icon icon="it-list" size="sm" className="me-1" />
                      <span>Reports</span>
                    </LinkListItem>
                  )}
                  {isCitizen && (
                    <LinkListItem inDropdown tag={Link} to="/setting">
                      <Icon icon="it-settings" size="sm" className="me-1" />
                      <span>Account config</span>
                    </LinkListItem>
                  )}
                </LinkList>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <TabNavLink tag={Link} to="/login">
              <Icon icon="it-user" size="sm" className="me-1" />
              Login
            </TabNavLink>
          )}
          {!loggedIn && !user && !isAdmin ? (
            <TabNavLink tag={Link} to="/signup">
              <Icon icon="it-sign" size="sm" className="me-1" />
              Sign Up
            </TabNavLink>
          ) : null}
          {loggedIn && (
            <LogoutButton handleLogout={handleLogout} color="warning" tag={Link} to="/">
              Logout
            </LogoutButton>
          )}
        </HeaderRightZone>
      </HeaderContent>
    </Header>
  );
}

export default AuthHeader;

