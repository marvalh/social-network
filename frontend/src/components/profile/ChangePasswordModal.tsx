'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/src/components/layout/Modal';
import { FormError } from '@/src/components/auth/Authformparts';
import { ApiError, profileApi } from '@/src/services/api';
import { useAuth } from '@/src/context/Auth';
import { validatePassword } from '@/src/utils/validation';

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { logout } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await profileApi.updatePassword({ currentPassword, newPassword });
      // The backend invalidates every session on a password change,
      // so clear local auth state and send the user back to /login.
      await logout();
      router.replace('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Try again.');
      setSubmitting(false);
    }
  }

  const fields = [
    {
      id: 'currentPassword',
      label: 'Current password',
      value: currentPassword,
      set: setCurrentPassword,
      autoComplete: 'current-password',
    },
    {
      id: 'newPassword',
      label: 'New password',
      value: newPassword,
      set: setNewPassword,
      autoComplete: 'new-password',
    },
    {
      id: 'confirmPassword',
      label: 'Confirm new password',
      value: confirmPassword,
      set: setConfirmPassword,
      autoComplete: 'new-password',
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change password"
      description="You'll be signed out on every device once it's changed."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormError>{error}</FormError>

        {fields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-muted-foreground">
              {field.label}
            </Label>
            <div className="relative">
              <Lock
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id={field.id}
                type={show ? 'text' : 'password'}
                autoComplete={field.autoComplete}
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                className="field pr-9 pl-9"
                required
              />
              <button
                type="button"
                onClick={() => setShow((current) => !current)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={show ? 'Hide passwords' : 'Show passwords'}
                aria-pressed={show}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="gradient border-0 px-4 text-white"
          >
            {submitting ? 'Updating…' : 'Update password'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
