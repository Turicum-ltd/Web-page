import Link from 'next/link';
import { TuricumWordmark } from '@/components/atlas/turicum-wordmark';
import { withBasePath } from '@/lib/atlas/runtime';

const links = [
  { href: withBasePath('/'), label: 'Home' },
  { href: withBasePath('/portal'), label: 'Borrower Intake' },
  { href: withBasePath('/investors'), label: 'Investor Portal' },
  { href: withBasePath('/review'), label: 'Review' },
  { href: withBasePath('/cases'), label: 'Cases' },
  { href: withBasePath('/flows'), label: 'Flows' },
  { href: withBasePath('/state-packs'), label: 'State Packs' },
  { href: withBasePath('/library'), label: 'Library' },
  { href: withBasePath('/library/templates'), label: 'Templates' }
];

export function AtlasNav() {
  return (
    <nav className="nav" aria-label="Primary">
      <Link className="nav-brand" href={withBasePath("/")}>
        <TuricumWordmark compact showDescriptor={false} />
      </Link>
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
