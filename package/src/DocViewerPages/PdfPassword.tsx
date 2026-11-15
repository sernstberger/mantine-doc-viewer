import { Button, PasswordInput, Text } from '@mantine/core';
import React, { useState } from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { LockIcon } from '../utils/icons';

interface PdfPasswordProps {
  incorrect: boolean;
  onSubmit: (password: string) => void;
}

/** Asks for the password of a protected PDF */
export function PdfPassword({ incorrect, onSubmit }: PdfPasswordProps) {
  const { getStyles, labels, size, passwordInputProps } = useDocViewerContext();
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
        label={labels.passwordLabel}
        autoComplete="off"
        data-autofocus
        autoFocus
        {...passwordInputProps}
        size={size.input}
        value={password}
        onChange={(event) => setPassword(event.currentTarget.value)}
        error={incorrect ? labels.passwordIncorrectLabel : undefined}
        {...getStyles('passwordInput')}
      />
      <Button
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
