import { StatusError } from '@/src/components/layout/StatusError';

export default function NotFound() {
  return <StatusError status={404} />;
}