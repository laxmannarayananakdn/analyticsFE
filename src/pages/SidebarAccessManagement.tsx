import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListAltIcon from '@mui/icons-material/ListAlt';
import GroupIcon from '@mui/icons-material/Group';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ShieldIcon from '@mui/icons-material/Shield';

/**
 * RBAC Configuration - Deprecated
 * Sidebar access is now managed via Access Groups (pages) + Report Groups (reports).
 * Assign users via Access Control.
 */
export default function SidebarAccessManagement() {
  return (
    <Box sx={{ minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <ListAltIcon fontSize="large" color="action" />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              RBAC Configuration
            </Typography>
            <Typography color="text.secondary">
              Role-based access is now managed through Access Groups and Report Groups
            </Typography>
          </Box>
        </Box>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="body1" paragraph>
              Sidebar visibility (pages and reports) is controlled by:
            </Typography>
            <List dense disablePadding sx={{ pl: 2.5, mb: 2, listStyle: 'disc' }}>
              <ListItem disablePadding sx={{ display: 'list-item' }}>
                <ListItemText primary={<><Typography component="span" fontWeight="bold">Access Groups</Typography> — Define groups with node/department access and which admin pages they can see</>} />
              </ListItem>
              <ListItem disablePadding sx={{ display: 'list-item' }}>
                <ListItemText primary={<><Typography component="span" fontWeight="bold">Report Groups</Typography> — Define which Superset reports/dashboards a group can see</>} />
              </ListItem>
              <ListItem disablePadding sx={{ display: 'list-item' }}>
                <ListItemText primary={<><Typography component="span" fontWeight="bold">Access Control</Typography> — Assign users to User Groups and Report Groups (node access comes only from Access Groups)</>} />
              </ListItem>
            </List>
            <Typography variant="body2" color="text.secondary" paragraph>
              Users get the union of pages from their User Groups and reports from their Report Groups. Report folders and reports flow from Report Groups alone.
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Button
            component={Link}
            to="/admin/access-groups"
            variant="contained"
            startIcon={<GroupIcon />}
          >
            Access Groups
          </Button>
          <Button
            component={Link}
            to="/admin/report-groups"
            variant="contained"
            startIcon={<AssessmentIcon />}
          >
            Report Groups
          </Button>
          <Button
            component={Link}
            to="/admin/access-control"
            variant="outlined"
            startIcon={<ShieldIcon />}
          >
            Access Control
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
