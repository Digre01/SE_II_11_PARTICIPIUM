import { useState, useEffect } from 'react';
import API from '../../API/API.mjs';
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
import { LogoutButton } from '../authComponents/LoginForm.jsx';

function AuthHeader({ user, loggedIn, isAdmin, isReportsAllowed, handleLogout, notificationCount }) {
  const [isOpen, setIsOpen] = useState(false);
  const isCitizen = String(user?.userType || '').toLowerCase() === 'citizen';
  const isStaff = String(user?.userType || '').toLowerCase() === 'staff';

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
          {loggedIn && user && (isCitizen || isStaff) && (
            <TabNavLink tag={Link} to="/conversations" className="me-2" title="Conversazioni" style={{ position: 'relative' }}>
              <Icon icon="it-mail" size="sm" className="me-1" />
              <span className="align-middle">Notifications</span>
              {notificationCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 6,
                  right: -1,
                  minWidth: 18,
                  height: 18,
                  background: '#28a745',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  zIndex: 2
                }}>{notificationCount}</span>
              )}
            </TabNavLink>
          )}
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
                  {!isReportsAllowed && isStaff && (
                    <LinkListItem inDropdown tag={Link} to="/officeReports">
                      <Icon icon="it-list" size="sm" className="me-1" />
                      <span>Office Reports</span>
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

