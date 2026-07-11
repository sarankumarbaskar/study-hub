import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the PlayZone team.",
};

export default function ContactPage() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <span className="text-5xl block mb-6">📧</span>
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Have feedback, questions, or suggestions? We&apos;d love to hear from you!
      </p>
      <a
        href="mailto:hello@playzone.example.com"
        className="inline-flex items-center justify-center px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-full transition-colors text-lg"
      >
        Send us an email
      </a>
    </div>
  );
}
