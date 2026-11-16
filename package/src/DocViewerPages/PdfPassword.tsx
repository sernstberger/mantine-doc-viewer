import { Button, PasswordInput, Text } from '@mantine/core';
import type { DocViewerPasswordInputProps } from '../doc-viewer.types';
import React, { useState } from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { LockIcon } from '../utils/icons';

interface PdfPasswordProps {
  incorrect: boolean;
  onSubmit: (password: string) => void;
  inputProps?: DocViewerPasswordInputProps;
}

/** Asks for the password of a protected PDF */
export function PdfPassword({ incorrect, onSubmit, inputProps }: PdfPasswordProps) {
  const { getStyles, labels, size, unstyled } = useDocViewerContext();
  const [password, setPassword] = useState('');

  return (
    <form
      {...getStyles('password')}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(password);
      }}
    >
      <LockIcon width={28} height={28} aria-hidden />
      <Text size="sm" ta="center">
        {labels.passwordRequiredLabel}
      </Text>
      <PasswordInput
        unstyled={unstyled}
        label={labels.passwordLabel}
        autoComplete="off"
        data-autofocus
        autoFocus
        {...inputProps}
        size={size.input}
        value={password}
        onChange={(event) => setPassword(event.currentTarget.value)}
        error={incorrect ? labels.passwordIncorrectLabel : undefined}
        {...getStyles('passwordInput')}
      />
      <Button
        unstyled={unstyled}
        type="submit"
        size={size.input}
        disabled={!password}
        fullWidth
        {...getStyles('passwordSubmit')}
      >
        {labels.unlockLabel}
      </Button>
    </form>
  );
}
