import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/site/Logo";
import { telHref } from "@/lib/api";

const Item = ({ icon: Icon, label, children, testId }) => (
  <div className="flex gap-4" data-testid={testId}>
    <Icon className="mt-1 h-5 w-5 shrink-0 text-[#FF3B30]" />
    <div>
      <p className="font-mono-ui text-[10px] uppercase tracking-widest text-[#60626D]">{label}</p>
      <div className="mt-1 text-[#F4F4F6]">{children}</div>
    </div>
  </div>
);

export default function Footer({ settings }) {
  return (
    <footer id="contact" className="scroll-mt-24 border-t border-[#272A34] bg-[#121418]" data-testid="contact-footer">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo settings={settings} testId="footer-logo" />
            <p className="mt-6 max-w-sm text-sm text-[#9E9EA9]">{settings.tagline}</p>
          </div>
          <div className="lg:col-span-4 space-y-7">
            <Item icon={MapPin} label="Address" testId="footer-address">
              {settings.address_line1}
              <br />
              {settings.address_line2}
            </Item>
            <Item icon={Phone} label="Phone" testId="footer-phone">
              <a href={telHref(settings.phone)} className="hover:text-[#FF3B30] transition-colors">{settings.phone}</a>
            </Item>
            <Item icon={Mail} label="Email" testId="footer-email">
              <a href={`mailto:${settings.email}`} className="hover:text-[#FF3B30] transition-colors break-all">{settings.email}</a>
            </Item>
          </div>
          <div className="lg:col-span-4">
            <Item icon={Clock} label="Hours" testId="footer-hours">
              <ul className="space-y-2 min-w-[220px]">
                {settings.hours?.map((h) => (
                  <li key={h.days} className="flex justify-between gap-6 text-sm">
                    <span className="text-[#9E9EA9]">{h.days}</span>
                    <span>{h.time}</span>
                  </li>
                ))}
              </ul>
            </Item>
          </div>
        </div>
        <div className="mt-16 flex flex-col sm:flex-row justify-between gap-4 border-t border-[#272A34] pt-8 text-xs text-[#60626D]">
          <p>© {new Date().getFullYear()} {settings.name}. All rights reserved.</p>
          <Link to="/admin" className="hover:text-[#9E9EA9] transition-colors" data-testid="footer-owner-login-link">
            Owner login
          </Link>
        </div>
      </div>
    </footer>
  );
}
