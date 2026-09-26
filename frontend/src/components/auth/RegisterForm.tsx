'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/src/services/api';
import { useAuth } from '@/src/context/Auth';
import {profileApi} from '@/src/services/profile'
import { AuthHeading, CharCount, FormError } from './Authformparts';
import {
  ABOUT_ME_MAX,
  NICKNAME_MAX,
  PASSWORD_SPECIALS,
  validateAboutMe,
  validateDob,
  validateEmail,
  validateNickname,
  validatePassword,
} from '@/src/utils/validation';

export function RegisterForm() {
  const { register, login } = useAuth();
  const router = useRouter();

  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [nickname, setNickname] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!avatar) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatar);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
  const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

  function firstValidationError(): string | null {
    if (avatar) {
      if (!AVATAR_TYPES.includes(avatar.type)) {
        return 'Avatar must be a JPEG, PNG or GIF image';
      }
      if (avatar.size > MAX_AVATAR_BYTES) {
        return 'Avatar must be smaller than 5 MB';
      }
    }

    if (firstName.trim() === '' || firstName.trim().length > 50) {
      return 'First name must be between 1 and 50 characters';
    }
    if (lastName.trim() === '' || lastName.trim().length > 50) {
      return 'Last name must be between 1 and 50 characters';
    }
    const emailError = validateEmail(email.trim());
    if (emailError) {
      return emailError;
    }
    const dobError = validateDob(dob);
    if (dobError) {
      return dobError;
    }
    const nicknameError = validateNickname(nickname.trim());
    if (nicknameError) {
      return nicknameError;
    }
    const aboutMeError = validateAboutMe(aboutMe.trim());
    if (aboutMeError) {
      return aboutMeError;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return passwordError;
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
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
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        dob,
        password,
        nickname: nickname.trim() || undefined,
        aboutMe: aboutMe.trim() || undefined,
      });

      if (avatar) {
        // register doesn't create a session, and avatar upload needs one so
        // log in with the same credentials just long enough to attach the photo.
        try {
          await login({ identifier: email.trim(), password });
          await profileApi.uploadAvatar(avatar);
        } catch {
          //a failed avatar upload shouldn't block registration
        }
      }

      router.replace('/login?registered=1');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not reach the server. Try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <AuthHeading title="Create your account" subtitle="Join us and start connecting." />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormError>{error}</FormError>

        <div className="flex flex-col items-center gap-2">
          <label
            htmlFor="avatar"
            className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border border-surface-border bg-surface transition hover:border-ring"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Camera className="h-6 w-6" />
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </label>

          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
            className="sr-only"
          />

          <span className="text-xs text-muted-foreground">
            {avatar ? avatar.name : 'Add a profile photo (optional)'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName" className="text-muted-foreground">
              First name
            </Label>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              maxLength={50}
              className="field"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName" className="text-muted-foreground">
              Last name
            </Label>
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              maxLength={50}
              className="field"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="johndoe@gmail.com"
            className="field"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dob" className="text-muted-foreground">
            Date of birth
          </Label>
          <Input
            id="dob"
            name="dob"
            type="date"
            autoComplete="bday"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="field"
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="nickname" className="text-muted-foreground">
              Nickname (optional)
            </Label>
            <CharCount value={nickname} max={NICKNAME_MAX} />
          </div>
          <Input
            id="nickname"
            name="nickname"
            autoComplete="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Johnny"
            maxLength={NICKNAME_MAX}
            className="field"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="aboutMe" className="text-muted-foreground">
              About me (optional)
            </Label>
            <CharCount value={aboutMe} max={ABOUT_ME_MAX} />
          </div>
          <textarea
            id="aboutMe"
            name="aboutMe"
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            placeholder="A short bio"
            maxLength={ABOUT_ME_MAX}
            rows={3}
            className="w-full resize-none rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-muted-foreground">
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="field"
              required
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          8+ characters, with an uppercase letter, a lowercase letter, a digit, and one of{' '}
          {PASSWORD_SPECIALS}
        </p>

        <Button
          type="submit"
          disabled={submitting}
          className="gradient h-11 w-full border-0 text-white shadow-lg shadow-brand-500/20"
        >
          {submitting ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-link hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
