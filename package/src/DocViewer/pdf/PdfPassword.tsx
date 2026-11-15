import { Button, PasswordInput, Text } from '@mantine/core';
import React, { useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { LockIcon } from '../icons';

interface PdfPasswordProps {
  incorrect: boolean;
  onSubmit: (password: string) => void;
}

/** Asks for the password of a protected PDF */
export function PdfPassword({ incorrect, onSubmit }: PdfPasswordProps) {
  const { getStyles, labels, size } = useDocViewerContext();
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
        {labels.passwordRequired}
      </Text>
      <PasswordInput
        size={size.input}
        label={labels.password}
        value={password}
        onChange={(event) => setPassword(event.currentTarget.value)}
        error={incorrect ? labels.passwordIncorrect : undefined}
        autoComplete="off"
        data-autofocus
        autoFocus
        {...getStyles('passwordInput')}
      />
      <Button
        type="submit"
        size={size.input}
        disabled={!password}
        fullWidth
        {...getStyles('passwordSubmit')}
      >
        {labels.unlock}
      </Button>
    </form>
  );
}
