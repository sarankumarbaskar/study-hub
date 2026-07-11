import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "PlayZone terms of service.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose dark:prose-invert">
      <h1>Terms of Service</h1>
      <p><em>Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</em></p>

      <h2>1. Acceptance of Terms</h2>
      <p>By using PlayZone, you agree to these terms. If you do not agree, please do not use the service.</p>

      <h2>2. Description of Service</h2>
      <p>PlayZone provides free online games and quizzes for entertainment purposes. The service is provided &quot;as is&quot; without warranties of any kind.</p>

      <h2>3. User Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Attempt to hack, exploit, or disrupt the service</li>
        <li>Use automated tools to interact with the games</li>
        <li>Submit offensive or inappropriate content in leaderboard names</li>
      </ul>

      <h2>4. Intellectual Property</h2>
      <p>All games, quizzes, and content on PlayZone are our intellectual property. You may not copy, modify, or distribute any content without permission.</p>

      <h2>5. Advertising</h2>
      <p>PlayZone displays advertisements through Google AdSense. By using the service, you acknowledge that ads will be shown during your experience.</p>

      <h2>6. Limitation of Liability</h2>
      <p>PlayZone is not liable for any damages arising from the use of this service. Play responsibly!</p>

      <h2>7. Changes to Terms</h2>
      <p>We may update these terms at any time. Continued use of the service constitutes acceptance of any changes.</p>

      <h2>8. Contact</h2>
      <p>For questions about these terms, please contact us through our website.</p>
    </div>
  );
}
