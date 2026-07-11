import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "PlayZone privacy policy - how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p><em>Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</em></p>

      <h2>Information We Collect</h2>
      <p>PlayZone is a free online gaming and quiz platform. We collect minimal data to provide you with the best experience:</p>
      <ul>
        <li><strong>Game Scores:</strong> Stored locally in your browser (localStorage). We do not send this data to any server.</li>
        <li><strong>Usage Analytics:</strong> We may use Google Analytics to understand how visitors use our site.</li>
      </ul>

      <h2>Advertising</h2>
      <p>We use Google AdSense to display advertisements. Google may use cookies to serve ads based on your prior visits to our website or other websites. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>

      <h2>Cookies</h2>
      <p>Our site uses cookies for:</p>
      <ul>
        <li>Storing your game preferences locally</li>
        <li>Google AdSense ad personalization</li>
        <li>Analytics (if enabled)</li>
      </ul>

      <h2>Third-Party Services</h2>
      <p>We use the following third-party services:</p>
      <ul>
        <li>Google AdSense for advertising</li>
        <li>Vercel for hosting</li>
      </ul>

      <h2>Children&apos;s Privacy</h2>
      <p>Our games are suitable for all ages. We do not knowingly collect personal information from children under 13.</p>

      <h2>Contact</h2>
      <p>If you have any questions about this privacy policy, please contact us through our website.</p>
    </div>
  );
}
