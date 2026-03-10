import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Facebook, Instagram, Phone, Mail, Apple, PlayCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#0b0d12] text-white">
      {/* Match global gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,#0b0d12_0%,#151b26_35%,#2a2130_65%,#3a2b25_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_85%_25%,rgba(214,180,140,0.15),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-black/45" />

      <div className="relative mx-auto max-w-[1200px] px-5 py-12 md:py-14">
        <div className="grid gap-10 md:grid-cols-3 lg:grid-cols-4">
          {/* Brand + contact */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-extrabold tracking-[0.25em] text-white">
                  TRIPZY
                </div>
                <div className="mt-1 text-xs text-white/55">
                  Premium trip booking platform
                </div>
              </div>

              <div className="flex gap-2">
                <SocialBtn icon={Facebook} href="#" />
                <SocialBtn icon={Instagram} href="#" />
              </div>
            </div>

            <div className="space-y-3 text-white/90">
              <ContactRow icon={Phone} text="+998 93 505 45 05" />
              <ContactRow icon={Mail} text="info@tripzy.uz" />
            </div>

            <div className="text-xs text-white/55">
              {/* TODO: backend ulansa: real address, working hours */}
              Ish vaqti: 09:00 — 23:00
            </div>
          </motion.div>

          {/* Links */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="md:justify-self-center"
          >
            <div className="text-sm font-semibold text-white">Sahifalar</div>
            <ul className="mt-4 space-y-2 text-white/80">
              <FooterNavLink to="/about" text="Biz haqimizda" />
              <FooterNavLink to="/services" text="Xizmatlarimiz" />
              <FooterNavLink to="/flights" text="Reyslar" />
              <FooterNavLink to="/contact" text="Aloqa" />
              <FooterNavLink to="/faq" text="FAQ" />
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="md:justify-self-end"
          >
            <div className="text-sm font-semibold text-white">Ma’lumot</div>
            <ul className="mt-4 space-y-2 text-white/80">
              <FooterLink text="Foydalanish shartlari" href="#" />
              <FooterLink text="Maxfiylik siyosati" href="#" />
              <FooterLink text="Yordam" href="#" />
            </ul>
          </motion.div>

          {/* Store buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="lg:col-span-1 md:justify-self-end"
          >
            <div className="text-sm font-semibold text-white">Ilova</div>
            <div className="mt-4 flex flex-col gap-3">
              <StoreBtn icon={Apple} top="Available on" title="App Store" href="#" />
              <StoreBtn icon={PlayCircle} top="Get it on" title="Google Play" href="#" />
            </div>
          </motion.div>
        </div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="mt-10 border-t border-white/10 pt-6"
        >
          <div className="flex flex-col gap-2 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} TRIPZY — All rights reserved</span>
            <span className="text-white/40">
              Web developed by <span className="text-white/55">SOS Group</span>
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

type SocialBtnProps = { icon: LucideIcon; href?: string }
function SocialBtn({ icon: Icon, href = "#" }: SocialBtnProps) {
  return (
    <a
      href={href}
      className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/5
                 text-white/80 transition hover:bg-white/10 hover:text-white hover:-translate-y-0.5"
      aria-label="Social link"
    >
      <Icon size={16} />
    </a>
  )
}

type ContactRowProps = { icon: LucideIcon; text: string }
function ContactRow({ icon: Icon, text }: ContactRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white">
        <Icon size={18} />
      </span>
      <span className="text-sm text-white/85">{text}</span>
    </div>
  )
}

function FooterNavLink({ to, text }: { to: string; text: string }) {
  return (
    <li>
      <Link
        to={to}
        className="inline-flex items-center gap-2 rounded-xl px-2 py-1 transition
                   hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#8A3A5A]/70" />
        {text}
      </Link>
    </li>
  )
}

type FooterLinkProps = { text: string; href?: string }
function FooterLink({ text, href = "#" }: FooterLinkProps) {
  return (
    <li>
      <a
        href={href}
        className="inline-flex items-center gap-2 rounded-xl px-2 py-1 transition
                   hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        {text}
      </a>
    </li>
  )
}

type StoreBtnProps = { icon: LucideIcon; top: string; title: string; href?: string }
function StoreBtn({ icon: Icon, top, title, href = "#" }: StoreBtnProps) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5
                 px-4 py-3 text-white/90 shadow-sm transition
                 hover:bg-white/10 hover:-translate-y-0.5"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
        <Icon size={20} />
      </span>

      <div className="leading-tight">
        <div className="text-[10px] text-white/60">{top}</div>
        <div className="text-sm font-semibold">{title}</div>
      </div>
    </a>
  )
}
