import { Box, Container, Paper, Typography } from "@mui/material";

export default function Terms() {
  return (
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(14,165,233,0.18) 0%, #0b1220 40%, #0f172a 100%)", py: 8 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 4, borderRadius: 4, boxShadow: "0 30px 60px rgba(15,23,42,0.35)" }}>
          <Typography variant="h4" gutterBottom>Terms & Conditions</Typography>
          <Typography paragraph>
            These terms govern your use of the platform, including inventory, sales, attendance, and billing features. You are responsible
            for data accuracy, user access, and complying with applicable laws.
          </Typography>
          <Typography paragraph>
            Card details must belong to an authorized payer. You must provide accurate billing information and keep payment methods current.
            Failed or reversed payments may pause access until resolved.
          </Typography>
          <Typography paragraph>
            If you pay through the Facebook/Meta app, you agree to follow that platform's purchase rules, review processes, taxes, and refund
            requirements. Access may be provisioned only after confirmed payment.
          </Typography>
          <Typography paragraph>
            Do not upload illegal or infringing content, attempt unauthorized access, or abuse the service. Usage may be suspended for
            violations or security risks.
          </Typography>
          <Typography paragraph>
            We may update features and policies as the platform evolves, with updates taking effect when posted.
          </Typography>
          <Typography variant="h6" gutterBottom>Account Responsibilities</Typography>
          <Typography paragraph>
            You are responsible for keeping your login credentials confidential and for all activity that occurs under your account. If you
            suspect unauthorized access, you must notify us promptly. You agree to create accurate profiles for your organization, locations,
            and users, and to keep records up to date so that reports, invoices, and tax calculations remain reliable.
          </Typography>
          <Typography paragraph>
            You may assign roles and permissions to your staff. You are responsible for ensuring that only authorized personnel access
            sensitive functions such as pricing, payroll, customer data, and payment settings.
          </Typography>
          <Typography variant="h6" gutterBottom>Acceptable Use</Typography>
          <Typography paragraph>
            You agree not to misuse the platform or interfere with its operation. Prohibited activities include attempting to bypass
            authentication, scraping data without permission, introducing malware, or using the service for unlawful, fraudulent, or harmful
            purposes. We may investigate suspected abuse and suspend or terminate access as needed to protect users and the service.
          </Typography>
          <Typography paragraph>
            You are responsible for ensuring that any data you upload, including customer records, product images, invoices, or documents,
            does not violate third-party rights and complies with privacy and consumer protection laws.
          </Typography>
          <Typography variant="h6" gutterBottom>Billing, Taxes, and Renewals</Typography>
          <Typography paragraph>
            Paid plans are billed in advance according to the plan term you select. Unless otherwise stated, subscriptions renew
            automatically. You authorize us to charge your payment method on each renewal date. If a payment fails, we may retry the charge,
            notify you, and temporarily restrict access until payment is resolved.
          </Typography>
          <Typography paragraph>
            You are responsible for any applicable taxes, duties, or government fees associated with your purchase. We may collect tax where
            required by law based on your billing location.
          </Typography>
          <Typography variant="h6" gutterBottom>Refunds and Cancellations</Typography>
          <Typography paragraph>
            Refund eligibility depends on your plan and the payment channel used. If you paid through a third-party marketplace such as the
            Facebook/Meta app, refunds and chargebacks are handled under that platform's policies. For direct payments, refund requests must
            be submitted within the time window stated at purchase, and we may deny refunds for excessive use, policy violations, or
            fraudulent activity.
          </Typography>
          <Typography paragraph>
            You can cancel a subscription at any time in your account settings. Cancellation stops future billing, and access continues
            through the end of the paid term unless otherwise required by the payment platform.
          </Typography>
          <Typography variant="h6" gutterBottom>Service Availability</Typography>
          <Typography paragraph>
            We aim to provide reliable availability, but the service may be interrupted for maintenance, updates, or events outside our
            control. We may change, suspend, or discontinue features with reasonable notice when feasible.
          </Typography>
          <Typography variant="h6" gutterBottom>Data and Backups</Typography>
          <Typography paragraph>
            You retain ownership of your content. We provide tools to export core data, but you are responsible for keeping your own backups
            and for ensuring exported data is stored securely.
          </Typography>
          <Typography variant="h6" gutterBottom>Disclaimers and Liability</Typography>
          <Typography paragraph>
            The platform is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, we disclaim warranties
            of merchantability, fitness for a particular purpose, and non-infringement. We are not liable for indirect, incidental, or
            consequential damages arising from your use of the service.
          </Typography>
          <Typography variant="h6" gutterBottom>Termination</Typography>
          <Typography paragraph>
            We may suspend or terminate access if you violate these terms, fail to pay, or create risk for the platform or other users. Upon
            termination, your access to the service ends, and we may delete data in accordance with our retention practices.
          </Typography>
          <Typography variant="h6" gutterBottom>Contact</Typography>
          <Typography paragraph>
            If you have questions about these terms, contact support through the channels listed on our website or within your account.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
