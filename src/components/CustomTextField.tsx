import React, { forwardRef } from 'react';
import { Box, Typography, TextField as MuiTextField, TextFieldProps as MuiTextFieldProps, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export type CustomTextFieldProps = MuiTextFieldProps & {
  // allow injecting custom tooltips if needed
};

const CustomTextField = forwardRef<HTMLDivElement, CustomTextFieldProps>((props, ref) => {
  const { label, helperText, error, id, required, InputLabelProps, ...rest } = props;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: props.fullWidth ? '100%' : 'auto', mb: 0 }}>
      {label && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, gap: 0.5, px: 0.5 }}>
          <Typography component="label" htmlFor={id} sx={{ fontWeight: 600, fontSize: '0.85rem', color: error ? 'error.main' : 'text.primary' }}>
            {label}
            {required && <span style={{ color: '#e11d48', marginLeft: '2px' }}>*</span>}
          </Typography>
          {helperText && !error && (
            <Tooltip title={helperText} placement="top" arrow>
              <InfoOutlinedIcon sx={{ fontSize: '1rem', color: 'text.secondary', cursor: 'help' }} />
            </Tooltip>
          )}
        </Box>
      )}
      <MuiTextField
        {...rest}
        id={id}
        ref={ref}
        error={error}
        // ONLY show the helper string beneath the input if it's an error.
        // Otherwise, it has been moved to the info icon!
        helperText={error ? helperText : undefined}
        // We explicitly omit 'label' so that MUI does not try to float it inside the border.
      />
    </Box>
  );
});

export default CustomTextField;
