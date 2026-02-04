import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon, LinkedinIcon } from 'lucide-react';
import { Separator } from './ui';
import Link from 'next/link';
import type { NavigationLink, SocialMediaLink } from '@ons-mierloos-theater/shared/db';

type FooterProps = {
  navigationLinks?: NavigationLink[];
  socialMediaLinks?: SocialMediaLink[];
};

const getPlatformIcon = (platform: string) => {
  const className = 'size-5';
  switch (platform.toLowerCase()) {
    case 'facebook':
      return <FacebookIcon className={className} />;
    case 'instagram':
      return <InstagramIcon className={className} />;
    case 'twitter':
    case 'x':
      return <TwitterIcon className={className} />;
    case 'youtube':
      return <YoutubeIcon className={className} />;
    case 'linkedin':
      return <LinkedinIcon className={className} />;
    default:
      return null;
  }
};

export default function Footer({ navigationLinks = [], socialMediaLinks = [] }: FooterProps) {
  return (
    <footer>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 max-md:flex-col sm:px-6 sm:py-6 md:gap-6 md:py-8">
        <a href="#">
          <div className="flex items-center gap-3">{/* <Logo className="gap-3" /> */}</div>
        </a>

        <div className="flex items-center gap-5 flex-wrap justify-center">
          {navigationLinks.map((link) => (
            <Link key={link.id} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {socialMediaLinks.map((link) => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
              {getPlatformIcon(link.platform)}
            </a>
          ))}
        </div>
      </div>

      <Separator />

      <div className="mx-auto flex max-w-7xl justify-center px-4 py-8 sm:px-6">
        <p className="text-center font-medium text-balance">
          &copy; {new Date().getFullYear()} Ons Mierloos Theater. Alle rechten voorbehouden.
        </p>
      </div>
    </footer>
  );
}
