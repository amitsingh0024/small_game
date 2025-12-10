import './PrivacyPolicy.css'

interface PrivacyPolicyProps {
  onBack: () => void
}

/**
 * Privacy Policy Component
 * Displays the privacy policy for AdSense compliance
 */
export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="privacy-policy-screen">
      <div className="privacy-policy-content">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>

        <div className="privacy-policy-title">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: December 2, 2025</p>
        </div>

        <div className="privacy-policy-text">
          <section>
            <h2>Introduction</h2>
            <p>
              SMALL Game ("we", "our", or "us") operates the website https://small-umtu.onrender.com/ (the "Service").
              This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data
              when you use our Service.
            </p>
          </section>

          <section>
            <h2>Information Collection and Use</h2>
            <p>
              We use Google AdSense to display advertisements on our website. Google AdSense may collect and use information
              about your visits to this and other websites in order to provide advertisements about goods and services of
              interest to you.
            </p>
            <p>
              For more information about how Google uses data when you use our site, please visit:
              <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
                https://policies.google.com/technologies/ads
              </a>
            </p>
          </section>

          <section>
            <h2>Cookies and Tracking Technologies</h2>
            <p>
              <strong>Third-Party Cookies:</strong> Our Service uses Google AdSense to display advertisements. Google AdSense
              may set cookies on your device to provide personalized ads based on your browsing activity. We do not directly
              set or control these cookies - they are managed by Google.
            </p>
            <p>
              <strong>Local Storage:</strong> We use browser localStorage (not cookies) to store your theme preference
              (light/dark mode). This data is stored only on your device and is not transmitted to any server.
            </p>
            <p>
              <strong>No First-Party Cookies:</strong> We do not set any cookies ourselves. The only cookies that may be
              present on our site are those set by Google AdSense.
            </p>
            <p>
              You can control cookies through your browser settings. However, blocking cookies may affect the functionality
              of advertisements on our site.
            </p>
          </section>

          <section>
            <h2>Third-Party Services</h2>
            <p>
              Our Service uses Google AdSense, which is provided by Google LLC. Google AdSense uses cookies and similar
              tracking technologies to:
            </p>
            <ul>
              <li>Display personalized advertisements based on your interests</li>
              <li>Measure ad performance and effectiveness</li>
              <li>Prevent fraud and abuse</li>
            </ul>
            <p>
              For more information about how Google uses cookies and data, please visit:
              <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
                Google's Advertising Privacy & Terms
              </a>
            </p>
            <p>
              You may opt out of personalized advertising by visiting:
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
                Google's Ad Settings
              </a>
            </p>
          </section>

          <section>
            <h2>Local Data Storage</h2>
            <p>
              We use browser localStorage (not cookies) to store your theme preference (light or dark mode). This information:
            </p>
            <ul>
              <li>Is stored only on your device</li>
              <li>Is never transmitted to our servers or any third party</li>
              <li>Can be cleared at any time through your browser settings</li>
              <li>Is used solely to remember your theme preference</li>
            </ul>
          </section>

          <section>
            <h2>Children's Privacy</h2>
            <p>
              Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable
              information from children under 13. If you are a parent or guardian and you are aware that your child has
              provided us with personal data, please contact us.
            </p>
          </section>

          <section>
            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through our GitHub repository:
              <a href="https://github.com/amitsingh0024/small_game" target="_blank" rel="noopener noreferrer">
                https://github.com/amitsingh0024/small_game
              </a>
            </p>
          </section>

          <section>
            <h2>EU User Consent</h2>
            <p>
              If you are located in the European Union, please note that Google AdSense may use cookies for advertising
              purposes. By using our Service, you acknowledge that third-party cookies may be set by Google AdSense.
            </p>
            <p>
              You can manage cookie preferences through your browser settings or opt out of personalized advertising through
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
                Google's Ad Settings
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

