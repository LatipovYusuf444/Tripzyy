import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Lock, Mail, Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { registerUser, type RegisterPayload } from "@/features/auth/api/auth.service";
import { Link, useNavigate } from "react-router-dom";

const schema = z
  .object({
    full_name: z.string().min(3, "Ism-familiya kamida 3 ta belgidan iborat bo‘lsin"),
    email: z.string().email("Email noto‘g‘ri"),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, "Parol kamida 8 ta belgi")
      .regex(/[A-Z]/, "Kamida 1 ta katta harf bo‘lsin")
      .regex(/[0-9]/, "Kamida 1 ta raqam bo‘lsin"),
    confirm_password: z.string().min(1, "Parolni qayta kiriting"),
    agree: z.boolean().refine((v) => v === true, "Shartlarga rozilik kerak"),
  })
  .refine((v) => v.password === v.confirm_password, {
    message: "Parollar bir xil emas",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const nav = useNavigate();
  const [showPass, setShowPass] = React.useState(false);
  const [showPass2, setShowPass2] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
      agree: false,
    },
    mode: "onTouched",
  });

  const mutation = useMutation({
    mutationFn: (payload: RegisterPayload) => registerUser(payload),
    onSuccess: () => {
      nav("/login");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Xatolik yuz berdi. Qayta urinib ko‘ring.";
      setServerError(msg);
    },
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);

    mutation.mutate({
      full_name: values.full_name,
      email: values.email,
      ...(values.phone?.trim() ? { phone: values.phone.trim() } : {}),
      password: values.password,
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* ✅ BG IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url(https://hdpic.club/uploads/posts/2022-01/1642794958_1-hdpic-club-p-samolet-rasmlari-foto-3.jpg)",
        }}
      />

      {/* ✅ Luxury overlays */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050B18]/30 via-[#050B18]/70 to-[#050B18]/95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_55%),radial-gradient(circle_at_50%_90%,rgba(0,0,0,0.6),transparent_55%)]" />

      {/* ✅ Premium grid */}
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:52px_52px]" />

      <div className="relative z-10 mx-auto w-full max-w-xl px-4 py-10 mt-32 mb-32">
        <div className="relative">
          {/* glow */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-b from-white/20 via-white/0 to-white/10 blur-2xl" />

          {/* ✅ Glass Card */}
          <div className="relative rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_-45px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">Ro‘yxatdan o‘tish</h1>
                <p className="mt-1 text-sm text-white/70">
                  Ma’lumotlarni to‘ldiring va akkaunt yarating.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/70">
                Premium
              </div>
            </div>

            {serverError && (
              <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {serverError}
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <Field
                icon={<User className="h-4 w-4" />}
                label="Ism-familiya"
                placeholder="Masalan: Yusuf Latipov"
                error={form.formState.errors.full_name?.message}
                {...form.register("full_name")}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  placeholder="you@email.com"
                  error={form.formState.errors.email?.message}
                  {...form.register("email")}
                />
                <Field
                  icon={<Phone className="h-4 w-4" />}
                  label="Telefon (ixtiyoriy)"
                  placeholder="+998 90 123 45 67"
                  error={form.formState.errors.phone?.message}
                  {...form.register("phone")}
                />
              </div>

              <PasswordField
                label="Parol"
                placeholder="********"
                show={showPass}
                onToggle={() => setShowPass((p) => !p)}
                error={form.formState.errors.password?.message}
                icon={<Lock className="h-4 w-4" />}
                rightIcon={showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {...form.register("password")}
              />

              <PasswordField
                label="Parolni qayta kiriting"
                placeholder="********"
                show={showPass2}
                onToggle={() => setShowPass2((p) => !p)}
                error={form.formState.errors.confirm_password?.message}
                icon={<Lock className="h-4 w-4" />}
                rightIcon={showPass2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {...form.register("confirm_password")}
              />

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-white"
                  {...form.register("agree")}
                />
                <div className="text-sm text-white/75">
                  Men shartlar va maxfiylik siyosatiga roziman.
                  {form.formState.errors.agree?.message && (
                    <div className="mt-1 text-xs text-red-200">
                      {form.formState.errors.agree?.message}
                    </div>
                  )}
                </div>
              </label>

              <button
                type="submit"
                disabled={mutation.isPending}
                className={cn(
                  "w-full rounded-2xl border border-white/20 bg-white px-5 py-3 font-semibold text-[#050B18]",
                  "transition hover:translate-y-[-1px] hover:shadow-[0_12px_45px_-18px_rgba(255,255,255,0.6)]",
                  "disabled:opacity-60 disabled:hover:translate-y-0"
                )}
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Yuborilmoqda...
                  </span>
                ) : (
                  "Ro‘yxatdan o‘tish"
                )}
              </button>

              <div className="text-center text-sm text-white/70">
                Akkountingiz bormi?{" "}
                <Link to="/login" className="text-white underline underline-offset-4">
                  Kirish
                </Link>
              </div>
            </form>
          </div>

          <div className="mt-4 text-center text-xs text-white/55">
            © Tripzy • Premium Aviation
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------- UI components -------- */

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ReactNode;
  error?: string;
};

const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, icon, error, className, ...props },
  ref
) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-white/75">{label}</div>
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl",
          "bg-white/10 border-white/15",
          "focus-within:border-white/35 focus-within:bg-white/15 transition",
          error && "border-red-500/35",
          className
        )}
      >
        <span className="text-white/70">{icon}</span>
        <input
          ref={ref}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45"
          {...props}
        />
      </div>
      {error && <div className="mt-1 text-xs text-red-200">{error}</div>}
    </div>
  );
});

type PasswordFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  show: boolean;
  onToggle: () => void;
  error?: string;
};

const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { label, icon, rightIcon, show, onToggle, error, className, ...props },
  ref
) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-white/75">{label}</div>
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl",
          "bg-white/10 border-white/15",
          "focus-within:border-white/35 focus-within:bg-white/15 transition",
          error && "border-red-500/35",
          className
        )}
      >
        <span className="text-white/70">{icon}</span>
        <input
          ref={ref}
          type={show ? "text" : "password"}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45"
          {...props}
        />
        <button
          type="button"
          onClick={onToggle}
          className="rounded-xl border border-white/15 bg-white/10 p-2 text-white/80 hover:bg-white/15"
          aria-label="Parolni ko‘rsatish/yashirish"
        >
          {rightIcon}
        </button>
      </div>
      {error && <div className="mt-1 text-xs text-red-200">{error}</div>}
    </div>
  );
});
