'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/src/components/layout/Modal';
import { CharCount, FormError } from '@/src/components/auth/Authformparts';
import { ApiError, profileApi } from '@/src/services/api';
import {
  ABOUT_ME_MAX,
  NICKNAME_MAX,
  validateAboutMe,
  validateNickname,
} from '@/src/utils/validation';
import type { User } from '@/src/types/user';

interface EditProfileModalProps {
  open: boolean;
  user: User;
  onClose: () => void;
  onSaved: (user: User) => void;
  onChangePassword: () => void;
}

export function EditProfileModal({
  open,
  user,
  onClose,
  onSaved,
  onChangePassword,
}: EditProfileModalProps) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [nickname, setNickname] = useState(user.nickname ?? '');
  const [aboutMe, setAboutMe] = useState(user.aboutMe ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function firstValidationError(): string | null {
    if (firstName.trim() === '' || firstName.trim().length > 50) {
      return 'First name must be between 1 and 50 characters';
    }
    if (lastName.trim() === '' || lastName.trim().length > 50) {
      return 'Last name must be between 1 and 50 characters';
    }
    return validateNickname(nickname.trim()) ?? validateAboutMe(aboutMe.trim());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = firstValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const updated = await profileApi.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname.trim(),
        aboutMe: aboutMe.trim(),
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit profile"
      description="Your email and date of birth can't be changed."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormError>{error}</FormError>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-firstName" className="text-muted-foreground">
              First name
            </Label>
            <Input
              id="edit-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="field"
              autoComplete="given-name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-lastName" className="text-muted-foreground">
              Last name
            </Label>
            <Input
              id="edit-lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="field"
              autoComplete="family-name"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-nickname" className="text-muted-foreground">
              Nickname
            </Label>
            <CharCount value={nickname} max={NICKNAME_MAX} />
          </div>
          <Input
            id="edit-nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Optional"
            className="field"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-aboutMe" className="text-muted-foreground">
              About me
            </Label>
            <CharCount value={aboutMe} max={ABOUT_ME_MAX} />
          </div>
          <textarea
            id="edit-aboutMe"
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            rows={3}
            placeholder="Tell people a little about yourself"
            className="w-full resize-none rounded-lg border border-input bg-input/30 px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button type="button" variant="ghost" size="lg" onClick={onChangePassword}>
            Change password
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="lg" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="gradient border-0 px-4 text-white"
            >
              {submitting ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
