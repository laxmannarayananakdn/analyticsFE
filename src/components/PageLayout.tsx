import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncIcon from '@mui/icons-material/Sync';
import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/Group';
import ShieldIcon from '@mui/icons-material/Shield';
import CloudIcon from '@mui/icons-material/Cloud';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import ThemeSwitcher from './ThemeSwitcher';
import { authService } from '../services/AuthService';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 72;

interface PageLayoutProps {
  children: React.ReactNode;
}

const navItems: { to: string; label: string; icon: React.ReactNode }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/superset-dashboard', label: 'Superset Dashboard', icon: <AssessmentIcon /> },
  { to: '/admin/superset-config', label: 'Superset Dashboards Config', icon: <SettingsIcon /> },
  { to: '/admin/ef-upload', label: 'Upload External Files', icon: <UploadFileIcon /> },
  { to: '/admin/nexquare-config', label: 'Nexquare Configuration', icon: <SettingsIcon /> },
  { to: '/admin/managebac-config', label: 'ManageBac Configuration', icon: <SettingsIcon /> },
  { to: '/admin/nexquare-sync', label: 'Nexquare Data Sync', icon: <SyncIcon /> },
  { to: '/admin/managebac-sync', label: 'ManageBac Data Sync', icon: <SyncIcon /> },
  { to: '/admin/rp-config', label: 'RP Configuration', icon: <SettingsIcon /> },
  { to: '/admin/users', label: 'User Management', icon: <PeopleIcon /> },
  { to: '/admin/access-control', label: 'Access Control', icon: <ShieldIcon /> },
  { to: '/admin/access-groups', label: 'Access Groups', icon: <GroupIcon /> },
  { to: '/admin/microsoft-tenant-config', label: 'Microsoft Tenant Config', icon: <CloudIcon /> },
  { to: '/admin/nodes', label: 'Node Management', icon: <BusinessIcon /> },
  { to: '/admin/departments', label: 'Department Management', icon: <WorkIcon /> },
  { to: '/admin/school-assignment', label: 'School Assignment', icon: <SchoolIcon /> },
];

export default function PageLayout({ children }: PageLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ email: string; displayName: string | null } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const drawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  useEffect(() => {
    authService.getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            overflowX: 'hidden',
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            py: 1.5,
            px: collapsed ? 0 : 1,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {!collapsed && <ThemeSwitcher />}
          <IconButton onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} size="small">
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
        <List sx={{ flex: 1, py: 1, px: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={item.to}
                  selected={isActive}
                  sx={{
                    borderRadius: 1,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'inherit',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 56, color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary={item.label} primaryTypographyProps={{ noWrap: true }} />}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Divider />
        {!collapsed && user && (
          <Box
            sx={{
              px: 2,
              py: 2,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} noWrap>
                  {user.displayName || 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {user.email}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
        <List sx={{ py: 1, px: 1 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1 }} aria-label="Logout">
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 56 }}>
                <LogoutIcon />
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Logout" />}
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
}
