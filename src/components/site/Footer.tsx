import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Facebook, Instagram, Phone, Mail } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { useI18n } from "@/shared/i18n/i18n"

export default function Footer() {
  const { language } = useI18n()
  const copy = {
    uz: {
      subtitle: "Premium sayohat bronlash platformasi",
      workHours: "Ish vaqti: 09:00 - 23:00",
      pages: "Sahifalar",
      about: "Biz haqimizda",
      services: "Xizmatlar",
      flights: "Reyslar",
      contact: "Aloqa",
      info: "Ma'lumot",
      terms: "Foydalanish shartlari",
      privacy: "Maxfiylik siyosati",
      help: "Yordam",
      rights: "Barcha huquqlar himoyalangan",
      developed: "Saytni ishlab chiqqan:",
      social: "Ijtimoiy havola",
    },
    ru: {
      subtitle: "Премиальная платформа для бронирования поездок",
      workHours: "Время работы: 09:00 - 23:00",
      pages: "Страницы",
      about: "О нас",
      services: "Услуги",
      flights: "Рейсы",
      contact: "Контакты",
      info: "Информация",
      terms: "Условия использования",
      privacy: "Политика конфиденциальности",
      help: "Помощь",
      app: "Приложение",
      rights: "Все права защищены",
      developed: "Сайт разработан:",
      social: "Социальная ссылка",
    },
    en: {
      subtitle: "Premium trip booking platform",
      workHours: "Working hours: 09:00 - 23:00",
      pages: "Pages",
      about: "About",
      services: "Services",
      flights: "Flights",
      contact: "Contact",
      info: "Information",
      terms: "Terms of use",
      privacy: "Privacy policy",
      help: "Help",
      rights: "All rights reserved",
      developed: "Web developed by",
      social: "Social link",
    },
  }[language]

  return (
    <footer className="relative overflow-hidden bg-[#0b0d12] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,#0b0d12_0%,#151b26_35%,#2a2130_65%,#3a2b25_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_85%_25%,rgba(214,180,140,0.15),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-black/45" />

      <div className="relative mx-auto max-w-[1680px] px-5 py-12 md:px-8 md:py-14 2xl:max-w-[1820px]">
        <div className="grid gap-10 md:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-extrabold tracking-[0.25em] text-white">TRIPZY</div>
                <div className="mt-1 text-xs text-white/55">{copy.subtitle}</div>
              </div>
              <div className="flex gap-2">
                <SocialBtn icon={Facebook} href="#" label={copy.social} />
                <SocialBtn icon={Instagram} href="#" label={copy.social} />
              </div>
            </div>

            <div className="space-y-3 text-white/90">
              <ContactRow icon={Phone} text="+998 93 505 45 05" />
              <ContactRow icon={Mail} text="info@tripzy.uz" />
            </div>

            <div className="text-xs text-white/55">{copy.workHours}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.05 }} className="md:justify-self-center">
            <div className="text-sm font-semibold text-white">{copy.pages}</div>
            <ul className="mt-4 space-y-2 text-white/80">
              <FooterNavLink to="/about" text={copy.about} />
              <FooterNavLink to="/services" text={copy.services} />
              <FooterNavLink to="/flights" text={copy.flights} />
              <FooterNavLink to="/contact" text={copy.contact} />
              <FooterNavLink to="/faq" text="FAQ" />
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.1 }} className="md:justify-self-end">
            <div className="text-sm font-semibold text-white">{copy.info}</div>
            <ul className="mt-4 space-y-2 text-white/80">
              <FooterLink text={copy.terms} href="#" />
              <FooterLink text={copy.privacy} href="#" />
              <FooterLink text={copy.help} href="#" />
            </ul>
          </motion.div>

        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.2 }} className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-2 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} TRIPZY - {copy.rights}</span>
            <span className="text-white/40">
              {copy.developed} <span className="text-white/55">AISA Company</span>
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

type SocialBtnProps = { icon: LucideIcon; href?: string; label: string }
function SocialBtn({ icon: Icon, href = "#", label }: SocialBtnProps) {
  return (
    <a
      href={href}
      className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white hover:-translate-y-0.5"
      aria-label={label}
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
      <span>{text}</span>
    </div>
  )
}

function FooterNavLink({ to, text }: { to: string; text: string }) {
  return (
    <li>
      <Link className="transition hover:text-white" to={to}>
        {text}
      </Link>
    </li>
  )
}

function FooterLink({ text, href }: { text: string; href: string }) {
  return (
    <li>
      <a className="transition hover:text-white" href={href}>
        {text}
      </a>
    </li>
  )
}
