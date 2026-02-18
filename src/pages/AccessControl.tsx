import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import ShieldIcon from '@mui/icons-material/Shield';
import PeopleIcon from '@mui/icons-material/People';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import { authService, User } from '../services/AuthService';
import {
  getReportGroups,
  getUserReportGroups,
  setUserReportGroups,
  type ReportGroup,
} from '../services/ReportGroupService';

export default function AccessControl() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userFromUrl = searchParams.get('user');
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Array<{ groupId: string; groupName: string; groupDescription: string | null }>>([]);
  const [reportGroups, setReportGroups] = useState<ReportGroup[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>(userFromUrl || '');
  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);
  const [userReportGroupIds, setUserReportGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (userFromUrl && users.some((u) => u.email === userFromUrl)) {
      setSelectedUser(userFromUrl);
      setSearchParams((p) => {
        p.delete('user');
        return p;
      }, { replace: true });
    }
  }, [userFromUrl, users]);
  useEffect(() => {
    if (selectedUser) loadUserAccess();
    else { setUserGroupIds([]); setUserReportGroupIds([]); }
  }, [selectedUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, groupsData, reportGroupsData] = await Promise.all([
        authService.getUsers(),
        authService.getAccessGroups().catch(() => []),
        getReportGroups().catch(() => []),
      ]);
      setUsers(usersData);
      setGroups(groupsData);
      setReportGroups(reportGroupsData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserAccess = async () => {
    if (!selectedUser) return;
    try {
      const [groupIds, reportGroupIds] = await Promise.all([
        authService.getUserGroups(selectedUser).catch(() => []),
        getUserReportGroups(selectedUser).catch(() => []),
      ]);
      setUserGroupIds(groupIds);
      setUserReportGroupIds(reportGroupIds);
    } catch (err: any) {
      console.error('Failed to load user access:', err);
    }
  };

  const handleSave = async () => {
    if (!selectedUser) { showToast('Please select a user first', 'error'); return; }
    setSaving(true);
    try {
      await authService.setUserGroups(selectedUser, userGroupIds);
      await setUserReportGroups(selectedUser, userReportGroupIds);
      await loadUserAccess();
      showToast('Access updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save access', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ShieldIcon /> Access Control
            </Typography>
            <Typography color="text.secondary">Assign User Groups and Report Groups to users. Node access is configured in Access Groups.</Typography>
          </Box>
          {selectedUser && (
            <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <RefreshIcon /> : <SaveIcon />}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PeopleIcon /> Select User
            </Typography>
            <FormControl fullWidth>
              <InputLabel>User</InputLabel>
              <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} label="User">
                <MenuItem value="">-- Select a user --</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.email} value={user.email}>
                    {user.displayName || user.email} {!user.isActive && '(Inactive)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {selectedUser && groups.length === 0 && reportGroups.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            No Access Groups or Report Groups found. Create groups in <strong>Access Groups</strong> and <strong>Report Groups</strong> first, then assign them to users here.
          </Alert>
        )}
        {selectedUser && (groups.length > 0 || reportGroups.length > 0) && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        {groups.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>User Groups</Box>
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Assigned Groups</InputLabel>
                <Select
                  multiple
                  value={userGroupIds}
                  onChange={(e) => setUserGroupIds(e.target.value as string[])}
                  label="Assigned Groups"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((id) => {
                        const g = groups.find((x) => x.groupId === id);
                        return <Chip key={id} label={g?.groupName ?? id} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {groups.map((g) => (
                    <MenuItem key={g.groupId} value={g.groupId}>{g.groupName} {g.groupDescription && `— ${g.groupDescription}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Pages and nodes from assigned groups. Create in Access Groups.
              </Typography>
            </CardContent>
          </Card>
        )}
        {reportGroups.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                Report Groups
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Report Groups</InputLabel>
                <Select
                  multiple
                  value={userReportGroupIds}
                  onChange={(e) => setUserReportGroupIds(e.target.value as string[])}
                  label="Report Groups"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((id) => {
                        const g = reportGroups.find((x) => x.reportGroupId === id);
                        return <Chip key={id} label={g?.groupName ?? id} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {reportGroups.map((g) => (
                    <MenuItem key={g.reportGroupId} value={g.reportGroupId}>
                      {g.groupName} {g.groupDescription && `— ${g.groupDescription}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Reports the user can see (union of Report Groups). Create in Report Groups.
              </Typography>
            </CardContent>
          </Card>
        )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
