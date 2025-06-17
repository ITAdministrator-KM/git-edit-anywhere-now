import { useNavigation } from '@/hooks/useNavigation';
import { Link } from '@/components/ui';

export function StaffNavigation() {  const { pathname } = useNavigation();

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link
        href="/staff"
        className={`text-sm font-medium transition-colors hover:text-primary ${
          pathname === '/staff' ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        Overview
      </Link>
      <Link
        href="/staff/public-registry"
        className={`text-sm font-medium transition-colors hover:text-primary ${
          pathname === '/staff/public-registry' ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        Public Registry
      </Link>
    </nav>
  );
}