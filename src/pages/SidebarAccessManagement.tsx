import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import ListAltIcon from '@mui/icons-material/ListAlt';
import {
  getSidebarAccessMatrix,
  setUserSidebarAccess,
  type SidebarAccessMatrix,
} from '../services/SidebarAccessService';
import { useToast } from '../context/ToastContext';

export default function SidebarAccessManagement() {
  const { showToast } = useToast();
  const [matrix, setMatrix] = useState<SidebarAccessMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirtyUsers, setDirtyUsers] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);

  // Local editable state: user email -> Set of item ids (checked)
  // Empty set for a user = we're storing "no restrictions" - but our convention is: no rows in DB = full access
  // So we need: per-user, which items are checked. When saving, we send the checked itemIds.
  const [localPerms, setLocalPerms] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSidebarAccessMatrix();
      setMatrix(data);
      const initial: Record<string, Set<string>> = {};
      for (const u of data.users) {
        const granted = data.permissions[u.email];
        // Empty = full access (no rows in DB), so show all checked
        initial[u.email] = new Set(
          granted && granted.length > 0 ? granted : data.items.map((i) => i.id)
        );
      }
      setLocalPerms(initial);
      setDirtyUsers(new Set());
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (userEmail: string, itemId: string, checked: boolean) => {
    setLocalPerms((prev) => {
      const next = { ...prev };
      const set = new Set(next[userEmail] || []);
      if (checked) set.add(itemId);
      else set.delete(itemId);
      next[userEmail] = set;
      return next;
    });
    setDirtyUsers((prev) => new Set(prev).add(userEmail));
  };

  const handleSaveUser = async (userEmail: string) => {
    try {
      setSaving(userEmail);
      const itemIds = Array.from(localPerms[userEmail] || []);
      await setUserSidebarAccess(userEmail, itemIds);
      setDirtyUsers((prev) => {
        const next = new Set(prev);
        next.delete(userEmail);
        return next;
      });
      setMatrix((m) => {
        if (!m) return m;
        return {
          ...m,
          permissions: { ...m.permissions, [userEmail]: itemIds },
        };
      });
      showToast('Sidebar access saved', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save', 'error');
    } finally {
      setSaving(null);
    }
  };

  const hasAccess = (userEmail: string, itemId: string): boolean => {
    const set = localPerms[userEmail];
    if (!set) return false;
    return set.has(itemId);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!matrix) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ListAltIcon fontSize="large" />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Sidebar Access
          </Typography>
          <Typography color="text.secondary">
            Grant users access to specific sidebar pages and reports. Empty = full access.
          </Typography>
        </Box>
        <IconButton onClick={loadMatrix} title="Refresh">
          <RefreshIcon />
        </IconButton>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 220px)', overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  minWidth: 200,
                  fontWeight: 600,
                  bgcolor: 'background.paper',
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                User
              </TableCell>
              {matrix.items.map((item) => (
                <TableCell
                  key={item.id}
                  align="center"
                  sx={{
                    minWidth: 140,
                    maxWidth: 180,
                    fontWeight: 600,
                    bgcolor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={item.label}
                >
                  {item.label}
                </TableCell>
              ))}
              <TableCell
                sx={{
                  minWidth: 80,
                  bgcolor: 'background.paper',
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                Save
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matrix.users.map((user) => (
              <TableRow key={user.email} hover>
                <TableCell
                  sx={{
                    minWidth: 200,
                    position: 'sticky',
                    left: 0,
                    bgcolor: 'background.paper',
                    zIndex: 1,
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {user.displayName || user.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </TableCell>
                {matrix.items.map((item) => (
                  <TableCell key={item.id} align="center" padding="checkbox">
                    <Checkbox
                      checked={hasAccess(user.email, item.id)}
                      onChange={(e) =>
                        handleToggle(user.email, item.id, e.target.checked)
                      }
                      size="small"
                    />
                  </TableCell>
                ))}
                <TableCell sx={{ minWidth: 80 }}>
                  <Button
                    size="small"
                    variant={dirtyUsers.has(user.email) ? 'contained' : 'outlined'}
                    startIcon={
                      saving === user.email ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SaveIcon fontSize="small" />
                      )
                    }
                    onClick={() => handleSaveUser(user.email)}
                    disabled={!dirtyUsers.has(user.email) || saving !== null}
                  >
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {matrix.users.length === 0 && (
        <Typography color="text.secondary" textAlign="center" py={4}>
          No users found. Add users in User Management first.
        </Typography>
      )}
    </Box>
  );
}
