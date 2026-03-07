import { Box, Container, Paper, Typography } from "@mui/material";
import PublicFooter from "../../components/marketplace-detail/PublicFooter";


export default function Privacy() {
  return (
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(14,165,233,0.18) 0%, #0b1220 40%, #0f172a 100%)", py: 8 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 4, borderRadius: 4, boxShadow: "0 30px 60px rgba(15,23,42,0.35)" }}>
          <Typography variant="h4" gutterBottom>Privacy Policy</Typography>
          <Typography paragraph>
            Effective date: March 7, 2026. Invonta is a product by ASASA Tech (www.asasatech.com). We collect account details, business profile data, and activity logs to deliver inventory,
            sales, and billing features. We do not sell your data.
          </Typography>
          <Typography paragraph>
            Card payments are processed by a PCI-compliant payment processor. We do not store full card numbers or CVV codes. We may store
            limited billing metadata such as card brand, last four digits, expiration month/year, billing address, and a payment token.
          </Typography>
          <Typography paragraph>
            If you pay through the Facebook/Meta app, we receive confirmation details such as transaction status, amount, currency, timestamp,
            and platform identifiers so we can reconcile billing and provision access.
          </Typography>
          <Typography paragraph>
            We store uploaded images and documents in cloud storage you control. Access is limited to your organization and authorized staff.
          </Typography>
          <Typography paragraph>
            You can request data removal by contacting support. Admins can export core records for compliance, subject to legal retention
            requirements.
          </Typography>
          <Typography variant="h6" gutterBottom>Information We Collect</Typography>
          <Typography paragraph>
            We collect information you provide directly, such as name, email, phone number, business name, addresses, tax identifiers, and
            user role assignments. We also collect operational data you enter, including products, SKUs, stock counts, purchase orders, sales
            orders, invoices, customers, vendors, and attendance records.
          </Typography>
          <Typography paragraph>
            We collect usage data, such as login history, feature usage, device type, browser type, IP address, and error logs. This helps us
            secure the service, improve performance, and support troubleshooting.
          </Typography>
          <Typography paragraph>
            For payment compliance and fraud prevention, we and our payment partners may collect transaction metadata, risk signals, velocity
            indicators, device/browser fingerprint data, and verification information required for KYC/AML or sanctions screening.
          </Typography>
          <Typography variant="h6" gutterBottom>How We Use Information</Typography>
          <Typography paragraph>
            We use your information to provide and operate the platform, process payments, send service notifications, manage support
            requests, and improve product features. We may also use data to comply with legal obligations, prevent fraud, and enforce our
            policies.
          </Typography>
          <Typography paragraph>
            We do not use your data for advertising and we do not sell personal information. If we send product updates or marketing messages,
            you can opt out at any time.
          </Typography>
          <Typography variant="h6" gutterBottom>Legal Bases for Processing</Typography>
          <Typography paragraph>
            Depending on your jurisdiction, we process personal data based on one or more lawful bases, including contract performance,
            legitimate interests (such as fraud prevention and product security), legal obligations, and consent where required.
          </Typography>
          <Typography variant="h6" gutterBottom>Sharing and Disclosure</Typography>
          <Typography paragraph>
            We share data with trusted service providers who help us deliver the platform, such as hosting, analytics, email delivery, and
            payment processing providers. These providers are authorized to process data only as needed to perform services for us and are
            obligated to protect it.
          </Typography>
          <Typography paragraph>
            For payment processing, fraud screening, and dispute handling, data may be shared with payment gateways, acquiring banks, card
            networks, financial institutions, anti-fraud partners, and regulators or law enforcement where required.
          </Typography>
          <Typography paragraph>
            We may disclose information if required by law, regulation, or legal process, or to protect the rights, property, and safety of
            our users, employees, and the public. If the platform is involved in a merger, acquisition, or asset sale, your data may be
            transferred as part of that transaction.
          </Typography>
          <Typography variant="h6" gutterBottom>Data Retention</Typography>
          <Typography paragraph>
            We retain data for as long as your account is active or as needed to provide the service. We may retain certain information after
            account closure to comply with legal obligations, resolve disputes, or enforce agreements.
          </Typography>
          <Typography paragraph>
            Payment and dispute records may be retained for longer periods where required by payment partner rules, financial regulations, tax
            laws, and chargeback management timelines.
          </Typography>
          <Typography variant="h6" gutterBottom>Security</Typography>
          <Typography paragraph>
            We use reasonable administrative, technical, and physical safeguards to protect your data, including access controls, encryption
            in transit, and audit logging. However, no system can be guaranteed to be 100% secure.
          </Typography>
          <Typography variant="h6" gutterBottom>Your Choices and Rights</Typography>
          <Typography paragraph>
            You may access, update, or correct your account information in your profile settings. Admins can manage user roles, export data,
            and request deletion. Depending on your location, you may have additional rights under applicable privacy laws.
          </Typography>
          <Typography paragraph>
            You may also object to certain processing, request restriction, or request portability where legally applicable. We may decline
            requests where an exception applies, including legal retention obligations and fraud/security requirements.
          </Typography>
          <Typography variant="h6" gutterBottom>International Transfers</Typography>
          <Typography paragraph>
            If you access the service from outside the country where our servers are located, your information may be transferred and stored
            across borders. We take steps to ensure appropriate safeguards for such transfers as required by law.
          </Typography>
          <Typography variant="h6" gutterBottom>Cookies and Similar Technologies</Typography>
          <Typography paragraph>
            We use cookies, local storage, and similar technologies for authentication, session management, security, analytics, and platform
            performance. You can manage browser settings to block some cookies, but this may affect service functionality.
          </Typography>
          <Typography variant="h6" gutterBottom>Fraud Prevention and Monitoring</Typography>
          <Typography paragraph>
            To protect users and payment ecosystems, we monitor transactions and account behavior for suspicious activity. We may block or
            review activity that appears fraudulent, unlawful, or in violation of card network and payment partner rules.
          </Typography>
          <Typography variant="h6" gutterBottom>Children's Privacy</Typography>
          <Typography paragraph>
            The platform is not intended for children under the age of 13 (or the minimum age required in your jurisdiction). We do not
            knowingly collect personal data from children.
          </Typography>
          <Typography variant="h6" gutterBottom>Policy Updates</Typography>
          <Typography paragraph>
            We may update this policy from time to time. We will post the updated version and revise the effective date when changes are made.
          </Typography>
          <Typography variant="h6" gutterBottom>Contact</Typography>
          <Typography paragraph>
            For privacy questions, contact support through the channels listed on our website or within your account. You can also contact ASASA Tech at info@asasatech.com.
          </Typography>
        </Paper>
      </Container>
      <PublicFooter />
    </Box>
  );
}
