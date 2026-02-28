import { Box, Container, Paper, Typography } from "@mui/material";

export default function Terms() {
  return (
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(14,165,233,0.18) 0%, #0b1220 40%, #0f172a 100%)", py: 8 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 4, borderRadius: 4, boxShadow: "0 30px 60px rgba(15,23,42,0.35)" }}>
          <Typography variant="h4" gutterBottom>Terms & Conditions</Typography>
          <Typography paragraph>
            Effective date: February 28, 2026. These terms govern your use of the platform, including inventory, sales, attendance, and
            billing features. You are responsible for data accuracy, user access, and complying with applicable laws.
          </Typography>
          <Typography variant="h6" gutterBottom>Description of Services</Typography>
          <Typography paragraph>
            Invonta is a software platform for businesses to manage operations such as inventory, sales, customers, vendors, payroll,
            attendance, and reporting. Access to paid features is provided after successful payment authorization.
          </Typography>
          <Typography variant="h6" gutterBottom>Payment Methods and Billing Authorization</Typography>
          <Typography paragraph>
            Payment may be made through approved payment partners and methods presented at checkout, which may include card payments and other
            local payment options depending on your location and eligibility. Card details must belong to an authorized payer.
          </Typography>
          <Typography paragraph>
            You authorize us and our payment partners to validate your payment instrument, debit the total amount due, apply taxes where
            required, and process renewals if you are on a recurring plan. You must provide accurate billing details and keep payment methods
            current. Failed, reversed, or declined payments may pause access until resolved.
          </Typography>
          <Typography variant="h6" gutterBottom>Delivery and Fulfillment Policy</Typography>
          <Typography paragraph>
            For digital subscriptions and services, fulfillment occurs electronically by provisioning your account and granting feature access
            after payment confirmation. Delivery timelines may vary for manual reviews, compliance checks, or bank/payment partner processing.
          </Typography>
          <Typography variant="h6" gutterBottom>Export and Geographic Restrictions</Typography>
          <Typography paragraph>
            Some plans, features, and payment methods may be restricted by jurisdiction, sanctions laws, or payment partner rules. You may not
            use the service where prohibited by law.
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
          <Typography variant="h6" gutterBottom>Compliance, KYC, and AML</Typography>
          <Typography paragraph>
            You agree to comply with applicable anti-money laundering, sanctions, anti-bribery, tax, consumer protection, and card network
            requirements. We and our payment partners may request business verification information (including identity, ownership, business
            activity, and source-of-funds details) and may suspend processing until reviews are completed.
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
          <Typography paragraph>
            You may not use the service for prohibited or high-risk activities identified by law, card schemes, banks, or payment partners,
            including illegal goods/services, intellectual property infringement, deceptive trade practices, money laundering, or unauthorized
            payment collection on behalf of third parties.
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
            Refund eligibility depends on your plan, purchase channel, and applicable law. If a service cannot be delivered due to our
            unavailability, we may offer a full or pro-rata refund where required. Cancellation by you may become effective at the end of the
            paid term, unless otherwise stated at checkout.
          </Typography>
          <Typography paragraph>
            Where an administrative fee is disclosed at checkout, it may be deducted for cancellations or reversals. Some payment method fees
            are non-refundable. Refund timelines can vary based on banking rails and payment partner processes.
          </Typography>
          <Typography paragraph>
            If you pay via a third-party app marketplace or partner platform, that channel's refund and cancellation rules may apply in
            addition to these terms.
          </Typography>
          <Typography variant="h6" gutterBottom>Chargebacks and Payment Disputes</Typography>
          <Typography paragraph>
            If a transaction is charged back or disputed, we may restrict account features while the matter is reviewed. You agree to provide
            reasonable cooperation and supporting records. We may recover unpaid fees, chargeback amounts, and related costs to the extent
            permitted by law and contract.
          </Typography>
          <Typography paragraph>
            Excessive dispute ratios, unusual payment behavior, or suspected fraud may result in additional verification, delayed settlements,
            reserves, suspension of payment options, or account termination.
          </Typography>
          <Typography variant="h6" gutterBottom>Card Acquiring and Security</Typography>
          <Typography paragraph>
            Card transactions are processed through PCI-compliant payment partners. We do not store full primary account numbers or CVV data
            on our servers. Payment data is transmitted over encrypted channels and is handled according to applicable card scheme and security
            standards.
          </Typography>
          <Typography variant="h6" gutterBottom>Customer Data Separation</Typography>
          <Typography paragraph>
            Business account data you provide to us is stored separately from raw cardholder data entered on payment partner checkout pages.
            Payment partners may provide us with limited transaction metadata needed for reconciliation, support, fraud prevention, and
            compliance.
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
          <Typography variant="h6" gutterBottom>Changes to These Terms</Typography>
          <Typography paragraph>
            We may update these terms as products, legal requirements, and payment partner rules change. Updated terms become effective when
            posted, unless a different date is stated.
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
