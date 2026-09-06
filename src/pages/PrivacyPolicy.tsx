const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: September 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Who We Are</h2>
            <p>
              Automorai ("we", "us", "our") provides automated customer engagement
              tools for businesses that use Facebook Pages, including automatic
              replies to comments and messages. This Privacy Policy explains what
              information we collect, how we use it, and your rights regarding
              that information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. Information We Collect</h2>
            <p className="mb-2">When you connect your Facebook Page to Automorai, we collect:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Basic Facebook profile information (name, email) used to create your Automorai account</li>
              <li>The list of Facebook Pages you manage, so you can choose which Page to connect</li>
              <li>Page access tokens, used only to act on your behalf on the Pages you connect</li>
              <li>Comments and messages received on your connected Page, so we can generate and post automatic replies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. How We Use Your Information</h2>
            <p className="mb-2">We use the information above solely to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Operate the auto-reply service you signed up for (comments and Messenger)</li>
              <li>Show you your connected Pages and account status in your Automorai dashboard</li>
              <li>Provide customer support when you contact us</li>
              <li>Improve the reliability of our automated reply system</li>
            </ul>
            <p className="mt-2">
              We do not sell your data, and we do not use Page or user data for
              advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. How We Share Information</h2>
            <p>
              We share data only with the service providers necessary to operate
              Automorai, such as our hosting provider and the AI service used to
              generate reply text. These providers process data only on our
              instructions and are not permitted to use it for their own
              purposes. We do not share your data with any other third party
              except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. Data Retention</h2>
            <p>
              We retain Page access tokens and comment/message data only for as
              long as your account remains active and connected. If you
              disconnect your Page or delete your account, we delete the
              associated access tokens and stop processing new data for that
              Page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">6. Your Rights</h2>
            <p>
              You can disconnect your Facebook Page from Automorai at any time
              from your dashboard, which revokes our access. You can also
              request full deletion of your account and associated data by
              contacting us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">7. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or your data,
              contact us at{" "}
              <a href="mailto:tansiwh03@gmail.com" className="text-purple-400 hover:underline">
                tansiwh03@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
