import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from 'lucide-react';
import { Separator } from './ui';

const links = [
  { name: 'Algemene informatie', href: '#' },
  { name: 'Contact', href: '#' },
  { name: 'OMT en AVG', href: '#' },
  { name: 'Voorstellingen', href: '#' },
  { name: 'Programma', href: '#' },
  { name: 'Over ons', href: '#' },
  { name: 'Techniek', href: '#' },
];

export default function Footer() {
  return (
    <footer>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 max-md:flex-col sm:px-6 sm:py-6 md:gap-6 md:py-8">
        <a href="#">
          <div className="flex items-center gap-3">{/* <Logo className="gap-3" /> */}</div>
        </a>

        <div className="flex items-center gap-5 flex-wrap justify-center">
          {links.map((link) => (
            <a key={link.name} href={link.href}>
              {link.name}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <a href="#">
            <FacebookIcon className="size-5" />
          </a>
          <a href="#">
            <InstagramIcon className="size-5" />
          </a>
          <a href="#">
            <TwitterIcon className="size-5" />
          </a>
          <a href="#">
            <YoutubeIcon className="size-5" />
          </a>
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
