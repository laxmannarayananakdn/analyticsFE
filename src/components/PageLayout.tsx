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
import Collapse from '@mui/material/Collapse';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FolderIcon from '@mui/icons-material/Folder';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ScheduleIcon from '@mui/icons-material/Schedule';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { authService } from '../services/AuthService';
import { getDashboards, DASHBOARD_FOLDERS } from '../services/SupersetDashboardConfigService';
import { getMySidebarAccess } from '../services/SidebarAccessService';
import type { SupersetDashboardConfig } from '../services/SupersetDashboardConfigService';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 72;

const FOLDER_ICONS: Record<string, React.ReactNode> = {
  Education: <SchoolIcon />,
  Finance: <AccountBalanceIcon />,
  HR: <PeopleIcon />,
  Operations: <WorkIcon />,
};

interface PageLayoutProps {
  children: React.ReactNode;
}

const adminNavItems: { to: string; label: string; icon: React.ReactNode; itemId: string }[] = [
  { to: '/admin/superset-config', label: 'Superset Dashboards Config', icon: <SettingsIcon />, itemId: 'admin:superset-config' },
  { to: '/admin/ef-upload', label: 'Upload External Files', icon: <UploadFileIcon />, itemId: 'admin:ef-upload' },
  { to: '/admin/nexquare-config', label: 'Nexquare Configuration', icon: <SettingsIcon />, itemId: 'admin:nexquare-config' },
  { to: '/admin/managebac-config', label: 'ManageBac Configuration', icon: <SettingsIcon />, itemId: 'admin:managebac-config' },
  { to: '/admin/nexquare-sync', label: 'Nexquare Data Sync', icon: <SyncIcon />, itemId: 'admin:nexquare-sync' },
  { to: '/admin/managebac-sync', label: 'ManageBac Data Sync', icon: <SyncIcon />, itemId: 'admin:managebac-sync' },
  { to: '/admin/sync-schedules', label: 'Sync Schedules', icon: <ScheduleIcon />, itemId: 'admin:sync-schedules' },
  { to: '/admin/sync-history', label: 'Sync History', icon: <HistoryIcon />, itemId: 'admin:sync-history' },
  { to: '/admin/rp-config', label: 'RP Configuration', icon: <SettingsIcon />, itemId: 'admin:rp-config' },
  { to: '/admin/users', label: 'User Management', icon: <PeopleIcon />, itemId: 'admin:users' },
  { to: '/admin/access-control', label: 'Access Control', icon: <ShieldIcon />, itemId: 'admin:access-control' },
  { to: '/admin/access-groups', label: 'Access Groups', icon: <GroupIcon />, itemId: 'admin:access-groups' },
  { to: '/admin/sidebar-access', label: 'RBAC Configuration', icon: <ListAltIcon />, itemId: 'admin:sidebar-access' },
  { to: '/admin/report-groups', label: 'Report Groups', icon: <AssessmentIcon />, itemId: 'admin:report-groups' },
  { to: '/admin/microsoft-tenant-config', label: 'Microsoft Tenant Config', icon: <CloudIcon />, itemId: 'admin:microsoft-tenant-config' },
  { to: '/admin/nodes', label: 'Node Management', icon: <BusinessIcon />, itemId: 'admin:nodes' },
  { to: '/admin/departments', label: 'Department Management', icon: <WorkIcon />, itemId: 'admin:departments' },
  { to: '/admin/school-assignment', label: 'School Assignment', icon: <SchoolIcon />, itemId: 'admin:school-assignment' },
];

export default function PageLayout({ children }: PageLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ email: string; displayName: string | null } | null>(null);
  const [dashboards, setDashboards] = useState<SupersetDashboardConfig[]>([]);
  const [sidebarAllowedIds, setSidebarAllowedIds] = useState<string[] | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const drawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  const canSee = (itemId: string): boolean => {
    if (sidebarAllowedIds === null) return true; // loading, show all
    if (sidebarAllowedIds.length === 0) return true; // full access (no restrictions)
    return sidebarAllowedIds.includes(itemId);
  };

  useEffect(() => {
    authService.getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    getMySidebarAccess()
      .then(setSidebarAllowedIds)
      .catch(() => setSidebarAllowedIds([]));
  }, []);

  useEffect(() => {
    getDashboards(true)
      .then(setDashboards)
      .catch(() => setDashboards([]));
  }, []);

  // Group dashboards by folder, sorted by sort_order ASC, name ASC within each folder
  const dashboardsByFolder = DASHBOARD_FOLDERS.reduce<Record<string, SupersetDashboardConfig[]>>((acc, folder) => {
    const list = dashboards
      .filter((d) => (d.folder || 'Education') === folder)
      .sort((a, b) => {
        const so = (a.sort_order ?? 0) - (b.sort_order ?? 0);
        return so !== 0 ? so : (a.name || '').localeCompare(b.name || '');
      });
    acc[folder] = list;
    return acc;
  }, {});

  // Auto-expand folder containing current dashboard
  useEffect(() => {
    const match = location.pathname.match(/^\/superset-dashboard\/([^/]+)/);
    if (match) {
      const uuid = match[1];
      const dash = dashboards.find((d) => d.uuid === uuid);
      if (dash?.folder) {
        setExpandedFolders((prev) => ({ ...prev, [dash.folder!]: true }));
      }
    }
  }, [location.pathname, dashboards]);

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

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
          {collapsed ? (
            <Box component="img" src="/AKS%20Logos.png" alt="AKS Logo" sx={{ height: 36, width: 'auto', objectFit: 'contain' }} />
          ) : (
            <Box component="img" src="/AKS%20Logos.png" alt="AKS Logo" sx={{ height: 40, width: 'auto', maxWidth: 180, objectFit: 'contain' }} />
          )}
          <IconButton onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} size="small">
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
        <List sx={{ flex: 1, py: 1, px: 1 }}>
          {/* Dashboard */}
          {canSee('dashboard') && (
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to="/dashboard"
                selected={location.pathname === '/dashboard'}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'inherit' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 56, color: 'inherit' }}>
                  <DashboardIcon />
                </ListItemIcon>
                {!collapsed && <ListItemText primary="Dashboard" primaryTypographyProps={{ noWrap: true }} />}
              </ListItemButton>
            </ListItem>
          )}

          {/* Report folders: Education, Finance, HR, Operations */}
          {!collapsed &&
            DASHBOARD_FOLDERS.map((folder) => {
              const allItems = dashboardsByFolder[folder] || [];
              const items = allItems.filter((d) => canSee(`report:${d.uuid}`));
              if (items.length === 0) return null;
              const isExpanded = expandedFolders[folder] ?? true;
              return (
                <Box key={folder}>
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => toggleFolder(folder)}
                      sx={{ borderRadius: 1 }}
                      disabled={items.length === 0}
                    >
                      <ListItemIcon sx={{ minWidth: 56, color: 'inherit' }}>
                        {FOLDER_ICONS[folder] || <FolderIcon />}
                      </ListItemIcon>
                      <ListItemText primary={folder} primaryTypographyProps={{ noWrap: true }} />
                      {items.length > 0 && (isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 2 }}>
                      {items.map((d) => {
                        const to = `/superset-dashboard/${d.uuid}`;
                        const isActive = location.pathname === to;
                        return (
                          <ListItem key={d.uuid} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                              component={Link}
                              to={to}
                              selected={isActive}
                              sx={{
                                borderRadius: 1,
                                '&.Mui-selected': {
                                  bgcolor: 'primary.main',
                                  color: 'primary.contrastText',
                                  '&:hover': { bgcolor: 'primary.dark' },
                                  '& .MuiListItemIcon-root': { color: 'inherit' },
                                },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>{<AssessmentIcon />}</ListItemIcon>
                              <ListItemText primary={d.name} primaryTypographyProps={{ noWrap: true }} />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                </Box>
              );
            })}

          {collapsed && (
            <>
              {DASHBOARD_FOLDERS.map((folder) => {
                const allItems = dashboardsByFolder[folder] || [];
                const items = allItems.filter((d) => canSee(`report:${d.uuid}`));
                if (items.length === 0) return null;
                const first = items[0];
                return (
                  <ListItem key={folder} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      component={Link}
                      to={first ? `/superset-dashboard/${first.uuid}` : '#'}
                      selected={first && location.pathname === `/superset-dashboard/${first.uuid}`}
                      disabled={items.length === 0}
                      sx={{
                        borderRadius: 1,
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': { bgcolor: 'primary.dark' },
                          '& .MuiListItemIcon-root': { color: 'inherit' },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}>
                        {FOLDER_ICONS[folder] || <FolderIcon />}
                      </ListItemIcon>
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </>
          )}

          <Divider sx={{ my: 1 }} />

          {/* Admin items */}
          {adminNavItems.filter((item) => canSee(item.itemId)).map((item) => {
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
                      '&:hover': { bgcolor: 'primary.dark' },
                      '& .MuiListItemIcon-root': { color: 'inherit' },
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
