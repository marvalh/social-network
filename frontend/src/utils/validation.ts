export const NICKNAME_MIN = 3;
export const NICKNAME_MAX = 13;
export const MESSAGE_MAX = 1000;
export const ABOUT_ME_MAX = 100;
export const PASSWORD_MIN = 8;
export const PASSWORD_SPECIALS = '!@#$%&()*_';
export const MIN_AGE = 13;
export const MAX_AGE = 120;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!EMAIL_PATTERN.test(email)) {
    return 'Invalid email format';
  }
  return null;
}

export function calculateAge(dob: string): number {
  const birth = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function validateDob(dob: string): string | null {
  if (dob === '') {
    return 'Date of birth is required';
  }
  const parsed = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return 'Date of birth must be a real date';
  }
  if (parsed.getTime() > Date.now()) {
    return 'Date of birth cannot be in the future';
  }
  const age = calculateAge(dob);
  if (age < MIN_AGE) {
    return `You must be at least ${MIN_AGE} years old to register`;
  }
  if (age > MAX_AGE) {
    return 'Date of birth is invalid';
  }
  return null;
}

export function validateNickname(nickname: string): string | null {
  if (nickname === '') {
    return null;
  }
  if (nickname.length < NICKNAME_MIN) {
    return `Nickname must be at least ${NICKNAME_MIN} characters`;
  }
  if (nickname.length > NICKNAME_MAX) {
    return `Nickname must be at most ${NICKNAME_MAX} characters`;
  }
  if (!/^[\p{L}\p{N}]+$/u.test(nickname)) {
    return 'Nickname must contain only letters and numbers';
  }
  return null;
}

export function validateAboutMe(aboutMe: string): string | null {
  if (aboutMe === '') {
    return null;
  }

  if (aboutMe.length > ABOUT_ME_MAX) {
    return `About me must be at most ${ABOUT_ME_MAX} characters`;
  }
  if (!/^[\p{L}\p{N} ]+$/u.test(aboutMe)) {
    return 'About me must contain only letters, numbers, and spaces';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters`;
  }
  const hasUpper = /\p{Lu}/u.test(password);
  const hasLower = /\p{Ll}/u.test(password);
  const hasDigit = /\p{Nd}/u.test(password);
  let hasSpecial = false;
  for (let i = 0; i < password.length; i++) {
    if (PASSWORD_SPECIALS.includes(password[i])) {
      hasSpecial = true;
      break;
    }
  }
  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    return `Password needs an uppercase letter, a lowercase letter, a digit, and one of ${PASSWORD_SPECIALS}`;
  }
  return null;
}
