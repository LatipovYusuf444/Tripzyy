import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Phone,
  Mail,
  Apple,
  PlayCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";


export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Gradient */}
      <div className="absolute inset-0 bg-linear-to-b from-[#0D5F86] via-[#0A4E73] to-[#083D63]" />
      <div className="absolute -top-24 left-1/2 h-48 w-130 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-10">

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold tracking-[0.28em] text-white">
                TRIPZY
              </span>

              <div className="flex gap-2">
                <SocialBtn icon={Facebook} />
                <SocialBtn icon={Instagram} />
              </div>
            </div>

            <div className="space-y-3 text-white/90">
              <ContactRow icon={Phone} text="+998 93 505 4 505" />
              <ContactRow icon={Mail} text="info@sosgroup.pro" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="md:justify-self-center"
          >
            <ul className="space-y-2 text-white/80">
              <FooterLink text="О нас" />
              <FooterLink text="Помощь" />
              <FooterLink text="Правила" />
              <FooterLink text="FAQ" />
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="md:justify-self-end lg:col-span-2"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <StoreBtn
                icon={Apple}
                top="Доступно в"
                title="App Store"
              />
              <StoreBtn
                icon={PlayCircle}
                top="Доступно на"
                title="Google Play"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="lg:col-span-4"
          >
            <div className="mt-2 flex flex-col gap-2 border-t border-white/15 pt-5 text-xs text-white/45 sm:flex-row sm:justify-between">
              <span>© Copyright 2018 — Web developed by SOS Group</span>
              <span className="text-white/35">Trip booking platform</span>
            </div>
          </motion.div>

        </div>
      </div>
    </footer>
  );
}
type SocialBtnProps = {
  icon: LucideIcon;
};

function SocialBtn({ icon: Icon }: SocialBtnProps) {
  return (
    <a
      href="#"
      className="grid h-8 w-8 place-items-center rounded-md border border-white/20 bg-white/5
                 text-white/80 transition hover:bg-white/10 hover:text-white hover:-translate-y-0.5"
    >
      <Icon size={16} />
    </a>
  );
}

type ContactRowProps = {
  icon: LucideIcon;
  text: string;
};

function ContactRow({ icon: Icon, text }: ContactRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white">
        <Icon size={18} />
      </span>
      <span className="text-sm">{text}</span>
    </div>
  );
}

type FooterLinkProps = {
  text: string;
  href?: string;
};

function FooterLink({ text, href = "#" }: FooterLinkProps) {
  return (
    <li>
      <a
        href={href}
        className="inline-flex items-center gap-2 rounded-md px-2 py-1 transition
                   hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        {text}
      </a>
    </li>
  );
}

type StoreBtnProps = {
  icon: LucideIcon;
  top: string;
  title: string;
  href?: string;
};

function StoreBtn({ icon: Icon, top, title, href = "#" }: StoreBtnProps) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/5
                 px-4 py-2.5 text-white/90 shadow-sm transition
                 hover:bg-white/10 hover:-translate-y-0.5 hover:shadow"
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10">
        <Icon size={20} />
      </span>

      <div className="leading-tight">
        <div className="text-[10px] text-white/60">{top}</div>
        <div className="text-sm font-semibold">{title}</div>
      </div>
    </a>
  );
}
