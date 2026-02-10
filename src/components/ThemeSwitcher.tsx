import { useThemeSwitch } from '../theme/ThemeContext';
import { IconButton, Menu, MenuItem, ListItemIcon } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useState } from 'react';

export default function ThemeSwitcher() {
  const { themeId, setThemeId } = useThemeSwitch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (id: 'dark' | 'light') => {
    setThemeId(id);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-label="Switch theme"
        title="Switch theme"
        sx={{ color: 'text.primary' }}
      >
        {themeId === 'dark' ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleSelect('dark')} selected={themeId === 'dark'}>
          <ListItemIcon>
            <Brightness4 fontSize="small" />
          </ListItemIcon>
          Dark
        </MenuItem>
        <MenuItem onClick={() => handleSelect('light')} selected={themeId === 'light'}>
          <ListItemIcon>
            <Brightness7 fontSize="small" />
          </ListItemIcon>
          Light
        </MenuItem>
      </Menu>
    </>
  );
}
