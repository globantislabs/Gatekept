'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useAppStore } from '@/store/app-store'

// ─── Brand Colors ────────────────────────────────────────────
const BRAND = {
  green: '#48805b',
  dark: '#1f1e1c',
  muted: '#88837b',
  surface: '#e3dfd8',
  bg: '#f4f3f0',
}

// ─── Zero-width space char ───────────────────────────────────
const ZWS = '\u200B'

// ─── Policy config map ───────────────────────────────────────
interface PolicyConfig {
  title: string
  pdf: string
  text: string
}

const POLICY_CONFIG: Record<string, PolicyConfig> = {
  'policy-terms': {
    title: 'Terms & Conditions',
    pdf: '/policies/terms-and-conditions.pdf',
    text: `TERMS & CONDITIONS

Effective Date: 03 August 2026

These    Terms    &   Conditions   ("Terms")   govern    your   access   to   and    use   of
NOTJUSTWATR.COM ("Website"), owned and operated by Zum Heilen Healthcare
Private Limited ("Company", "we", "our", or "us").

By accessing, browsing, registering on, or purchasing products through this Website, you
agree to be bound by these Terms & Conditions. If you do not agree with any part of
these Terms, you should discontinue use of the Website immediately.

1. COMPANY INFORMATION

Legal Name: Zum Heilen Healthcare Private Limited
Corporate Identification Number (CIN): U85110KA2015PTC078824
GSTIN: 29AAACZ8161A2ZA
FSSAI Licence Number: 11224998000039
Registered Office:
9/36, 203, Vaishnavi Sapphire Centre,${ZWS}
2nd Floor, Tumkur Road, Yeshwanthpura,${ZWS}
Bengaluru, Karnataka – 560022, India
Customer Support
Email: info@zh-onehealth.com
Phone: +91 9288007431
Working Hours: Monday to Saturday, 10:00 AM to 5:00 PM (IST)

2. ELIGIBILITY

By using this Website, you represent and warrant that:

   ${'●'}${ZWS} You are at least 18 years of age or otherwise legally competent to enter into a
        binding contract under applicable laws.
   ${'●'}${ZWS} The information provided by you is true, complete and accurate.
   ${'●'}${ZWS} You shall use the Website only for lawful purposes.

3. PRODUCTS

The Website offers packaged food, beverages and related consumer products for sale.

Product images are for illustrative purposes only. Actual packaging, colour, labelling or
appearance may vary without affecting the quality or functionality of the product.

The Company reserves the right to modify, discontinue or update products, formulations,
packaging or pricing without prior notice.

4. PRICING
   ${'●'}${ZWS} All prices are displayed in Indian Rupees (INR).
   ${'●'}${ZWS} Prices are inclusive of applicable GST unless otherwise specified.
   ${'●'}${ZWS} Shipping charges, if applicable, shall be displayed separately during checkout.
   ${'●'}${ZWS} The Company reserves the right to revise prices at any time prior to order
          confirmation.

5. ORDER ACCEPTANCE

Submission of an order constitutes an offer to purchase and does not guarantee
acceptance.

The Company reserves the right to accept, reject or cancel any order at its sole discretion,
including but not limited to cases involving:

   ${'●'}${ZWS} Product unavailability.
   ${'●'}${ZWS} Pricing or typographical errors.
   ${'●'}${ZWS} Suspected fraudulent transactions.
   ${'●'}${ZWS} Regulatory restrictions.
   ${'●'}${ZWS} Incorrect customer information.
   ${'●'}${ZWS} Violation of these Terms.

If payment has already been received for a cancelled order, the amount shall be refunded
through the original mode of payment in accordance with the Refund & Cancellation
Policy.

6. PAYMENTS

Payments may be made through payment methods made available on the Website,
including:

   ${'●'}${ZWS} UPI
   ${'●'}${ZWS} Credit Cards
   ${'●'}${ZWS} Debit Cards
   ${'●'}${ZWS} Net Banking
   ${'●'}${ZWS} Digital Wallets
   ${'●'}${ZWS} Other authorised payment methods

All electronic payments are securely processed through RBI-compliant third-party
payment gateway service providers.

The Company does not collect or store confidential payment credentials such as card
numbers, CVV, UPI PINs or net banking passwords.

7. SHIPPING AND DELIVERY
Orders shall be processed and delivered in accordance with the Shipping & Delivery
Policy published on the Website.

India Post is the Company's preferred shipping partner. However, the Company may
engage other authorised logistics partners to ensure timely delivery.

Estimated delivery timelines are indicative and may vary depending on the delivery
location, courier operations, public holidays, weather conditions or circumstances beyond
the Company's reasonable control.

8. CANCELLATION, RETURNS AND REFUNDS

Cancellation, return and refund requests shall be governed by the Refund & Cancellation
Policy available on the Website.

Refunds, where approved, shall be processed through the original mode of payment
within the timelines specified in the applicable policy.

9. USER RESPONSIBILITIES

Users agree to:

   ${'●'}${ZWS} Provide accurate and complete information.
   ${'●'}${ZWS} Maintain the confidentiality of their account credentials.
   ${'●'}${ZWS} Ensure secure use of their account.
   ${'●'}${ZWS} Promptly notify the Company of any unauthorised use of their account.
   ${'●'}${ZWS} Comply with all applicable laws while using the Website.

Users shall be responsible for all activities carried out through their accounts.

10. PROHIBITED ACTIVITIES

Users shall not:

   ${'●'}${ZWS} Use the Website for unlawful purposes.
   ${'●'}${ZWS} Attempt unauthorised access to the Website or its systems.
   ${'●'}${ZWS} Upload viruses, malware or malicious software.
   ${'●'}${ZWS} Interfere with the operation or security of the Website.
   ${'●'}${ZWS} Engage in fraudulent or deceptive transactions.
   ${'●'}${ZWS} Misrepresent their identity.
   ${'●'}${ZWS} Copy, reproduce or commercially exploit Website content without prior written
       permission.

11. INTELLECTUAL PROPERTY

All content available on the Website, including but not limited to:

   ${'●'}${ZWS} Trademarks
   ${'●'}${ZWS} Logos
   ${'●'}${ZWS} Product names
   ${'●'}${ZWS} Product images
   ${'●'}${ZWS} Text
   ${'●'}${ZWS} Graphics
   ${'●'}${ZWS} Videos
   ${'●'}${ZWS} Software
   ${'●'}${ZWS} Website design
   ${'●'}${ZWS} Layout and content

is the exclusive property of Zum Heilen Healthcare Private Limited or its licensors and is
protected under applicable intellectual property laws.

No content may be copied, reproduced, distributed or used without prior written
permission.

12. DISCLAIMER

The information provided on the Website is intended solely for general informational and
commercial purposes.

The Company makes reasonable efforts to ensure the accuracy of product descriptions
and information; however, it does not warrant that all information is complete, current or
error-free.

Users should read product labels and usage instructions carefully before consumption.

Nothing contained on this Website shall be construed as medical advice, diagnosis or
treatment. Customers should consult qualified healthcare professionals regarding any
medical condition or dietary concerns.

13. LIMITATION OF LIABILITY

To the maximum extent permitted by applicable law, Zum Heilen Healthcare Private
Limited shall not be liable for any indirect, incidental, consequential, special or punitive
damages arising from:

   ${'●'}${ZWS} Use or inability to use the Website.
   ${'●'}${ZWS} Delay or interruption of services.
   ${'●'}${ZWS} Unauthorised access to user information.
   ${'●'}${ZWS} Technical failures.
   ${'●'}${ZWS} Third-party service interruptions.
   ${'●'}${ZWS} Delivery delays beyond the Company's reasonable control.

The Company's total liability, if any, shall not exceed the amount actually paid by the
customer for the relevant order.
14. PRIVACY

Collection, processing and protection of personal information shall be governed by the
Privacy Policy available on the Website.

15. MODIFICATION OF TERMS

The Company reserves the right to amend or update these Terms & Conditions at any
time.

Revised Terms shall become effective immediately upon publication on the Website.
Continued use of the Website constitutes acceptance of the updated Terms.

16. GOVERNING LAW AND JURISDICTION

These Terms & Conditions shall be governed by and construed in accordance with the
laws of India.

Subject to applicable law, the courts located in Bengaluru, Karnataka shall have exclusive
jurisdiction over any disputes arising out of or relating to the use of this Website or
transactions conducted through it.

17. GRIEVANCE REDRESSAL

For any complaints, concerns or queries regarding the Website or these Terms, users may
contact:

Grievance Officer
Name: Fepslin Athishmon S
Designation: Chief Operating Officer (COO)
Email: fepslin@zh-onehealth.com
Customer Support Email: info@zh-onehealth.com
Phone: +91 9288007431
Working Hours: Monday to Saturday, 10:00 AM to 5:00 PM (IST)

By accessing or using NOTJUSTWATR.COM, you acknowledge that you have read,
understood and agreed to these Terms & Conditions.`,
  },

  'policy-privacy': {
    title: 'Privacy Policy',
    pdf: '/policies/privacy-policy.pdf',
    text: `PRIVACY POLICY

Effective Date: 03 August 2026

This Privacy Policy ("Policy") describes how Zum Heilen Healthcare Private Limited
("Company", "we", "our", or "us"), the owner and operator of NOTJUSTWATR.COM
("Website"), collects, uses, stores, processes, discloses and protects personal information
of users, customers and visitors ("User", "you" or "your").

This Policy is published in accordance with the provisions of the Information Technology
Act, 2000, the Information Technology (Reasonable Security Practices and Procedures
and Sensitive Personal Data or Information) Rules, 2011, the Digital Personal Data
Protection Act, 2023, the Consumer Protection (E-Commerce) Rules, 2020 and other
applicable laws of India.

By accessing, browsing, registering on, or making purchases through the Website, you
acknowledge that you have read, understood and agreed to the terms of this Privacy
Policy.

1. ENTITY DETAILS

Legal Name: Zum Heilen Healthcare Private Limited
Corporate Identification Number (CIN): U85110KA2015PTC078824
GSTIN: 29AAACZ8161A2ZA
FSSAI Licence Number: 11224998000039
Registered Office Address:
9/36, 203, Vaishnavi Sapphire Centre,${ZWS}
2nd Floor, Tumkur Road, Yeshwanthpura,${ZWS}
Bengaluru, Karnataka – 560022, India
Customer Support Email: info@zh-onehealth.com
Customer Support Number: +91 9288007431
Working Hours: Monday to Saturday, 10:00 AM to 5:00 PM IST

2. INFORMATION COLLECTED

The Company may collect, receive, store or process the following categories of
information:

A. Personal Information

   ${'●'}${ZWS} Full Name
   ${'●'}${ZWS} Email Address
   ${'●'}${ZWS} Mobile Number
   ${'●'}${ZWS} Billing Address
   ${'●'}${ZWS} Shipping Address
   ${'●'}${ZWS} City, State and PIN Code
   ${'●'}${ZWS} Order and Transaction Details

B. Technical Information

   ${'●'}${ZWS} IP Address
   ${'●'}${ZWS} Browser Type
   ${'●'}${ZWS} Device Information
   ${'●'}${ZWS} Operating System
   ${'●'}${ZWS} Website Usage Information
   ${'●'}${ZWS} Login Information
   ${'●'}${ZWS} Cookie and Session Data

C. Transaction Information

   ${'●'}${ZWS} Order History
   ${'●'}${ZWS} Payment Status
   ${'●'}${ZWS} Refund Status
   ${'●'}${ZWS} Shipping Information

The Company collects only such information as is reasonably necessary for lawful
business purposes and provision of services.

3. PURPOSE OF PROCESSING

Personal information may be processed for the following purposes:

   ${'●'}${ZWS} Registration and management of user accounts.
   ${'●'}${ZWS} Processing and fulfilment of orders.
   ${'●'}${ZWS} Delivery of products purchased through the Website.
   ${'●'}${ZWS} Processing payments, refunds and cancellations.
   ${'●'}${ZWS} Customer support and grievance redressal.
   ${'●'}${ZWS} Fraud prevention, risk management and security monitoring.
   ${'●'}${ZWS} Compliance with statutory, legal, accounting and regulatory obligations.
   ${'●'}${ZWS} Improvement of Website functionality, customer experience and business
      operations.
   ${'●'}${ZWS} Communication relating to orders, products, services and regulatory notices.

4. PAYMENT SECURITY

The Website utilizes secure payment gateway service providers authorized to process
electronic payments in accordance with applicable laws and regulatory requirements.

The Company does not collect, store or retain:

   ${'●'}${ZWS} Credit Card Numbers
   ${'●'}${ZWS} Debit Card Numbers
   ${'●'}${ZWS} CVV Numbers
   ${'●'}${ZWS} UPI PINs
   ${'●'}${ZWS} Net Banking Passwords
   ${'●'}${ZWS} Authentication Credentials

All payment transactions are processed through encrypted and secure third-party
payment infrastructure.

5. COOKIES AND TRACKING TECHNOLOGIES

The Website may use cookies, web beacons and similar technologies for:

   ${'●'}${ZWS} User authentication
   ${'●'}${ZWS} Session management
   ${'●'}${ZWS} Shopping cart functionality
   ${'●'}${ZWS} Website analytics
   ${'●'}${ZWS} Performance monitoring
   ${'●'}${ZWS} User experience enhancement

Users may configure their browser settings to refuse cookies; however, certain
functionalities of the Website may become unavailable.

6. DISCLOSURE OF INFORMATION

The Company may disclose personal information only on a need-to-know basis and
solely for legitimate business purposes, including to:

   ${'●'}${ZWS} Payment Gateway Service Providers
   ${'●'}${ZWS} Logistics and Delivery Partners
   ${'●'}${ZWS} India Post and other authorized courier service providers
   ${'●'}${ZWS} Information Technology and Website Service Providers
   ${'●'}${ZWS} Professional Advisors, Auditors and Regulatory Authorities
   ${'●'}${ZWS} Government Bodies or Law Enforcement Agencies where disclosure is required
       under applicable law

The Company does not sell, rent, lease or commercially exploit personal information
belonging to users.

7. DATA SECURITY

The Company maintains reasonable administrative, technical and organizational
safeguards designed to protect personal information against unauthorized access,
misuse, alteration, disclosure or destruction.

Security measures may include:
   ${'●'}${ZWS} Secure Socket Layer (SSL) encryption
   ${'●'}${ZWS} Access control mechanisms
   ${'●'}${ZWS} Password protection systems
   ${'●'}${ZWS} Firewall and network security measures
   ${'●'}${ZWS} Periodic security monitoring and updates

While the Company endeavors to protect all information, no electronic transmission or
storage system can be guaranteed to be completely secure.

8. DATA RETENTION

Personal information shall be retained only for the period necessary to:

   ${'●'}${ZWS} Fulfil contractual obligations.
   ${'●'}${ZWS} Complete transactions.
   ${'●'}${ZWS} Resolve disputes.
   ${'●'}${ZWS} Comply with statutory obligations.
   ${'●'}${ZWS} Maintain accounting, taxation and regulatory records.

Upon expiry of the applicable retention period, information may be securely deleted,
anonymized or archived in accordance with legal requirements.

9. USER RIGHTS

Subject to applicable law, users may request:

   ${'●'}${ZWS} Access to their personal information.
   ${'●'}${ZWS} Correction of inaccurate or incomplete information.
   ${'●'}${ZWS} Updating of personal information.
   ${'●'}${ZWS} Withdrawal of consent where processing is based on consent.
   ${'●'}${ZWS} Erasure of personal information where legally permissible.

Requests may be submitted to the Grievance Officer identified below.

10. THIRD-PARTY LINKS

The Website may contain links to third-party websites or services.

The Company shall not be responsible for the privacy practices, content, security or
policies of any third-party website. Users are advised to review the privacy policies of
such websites independently.

11. CHILDREN'S PRIVACY

The Website is intended for use by individuals who are legally competent to enter into
binding contracts under applicable law.
The Company does not knowingly collect personal information from minors without
appropriate authorization.

12. CHANGES TO THIS POLICY

The Company reserves the right to amend, modify or update this Privacy Policy at any
time without prior notice.

Any revisions shall become effective immediately upon publication on the Website.
Continued use of the Website following publication of revised terms shall constitute
acceptance of such revisions.

13. GRIEVANCE OFFICER

In accordance with applicable laws, including the Information Technology Act, 2000 and
rules framed thereunder, the following person has been designated as the Grievance
Officer:

Name: Fepslin Athishmon S
Designation: Chief Operating Officer (COO)
Email: fepslin@zh-onehealth.com

Users may submit complaints, concerns or requests relating to privacy, data processing or
information security to the Grievance Officer.

14. CONTACT DETAILS

For any questions, concerns or requests regarding this Privacy Policy, users may contact:

Zum Heilen Healthcare Private Limited
9/36, 203, Vaishnavi Sapphire Centre,${ZWS}
2nd Floor, Tumkur Road, Yeshwanthpura,${ZWS}
Bengaluru, Karnataka – 560022, India
Email: info@zh-onehealth.com
Phone: +91 9288007431
Working Hours: Monday to Saturday, 10:00 AM to 5:00 PM IST

By using NOTJUSTWATR.COM, you acknowledge that you have read, understood and
agreed to the terms of this Privacy Policy.`,
  },

  'policy-shipping': {
    title: 'Shipping & Delivery Policy',
    pdf: '/policies/shipping-and-delivery-policy.pdf',
    text: `SHIPPING & DELIVERY POLICY

Effective Date: 03 August 2026

This Shipping & Delivery Policy ("Policy") outlines the terms governing the processing,
shipment and delivery of orders placed through NOTJUSTWATR.COM, owned and
operated by Zum Heilen Healthcare Private Limited ("Company", "we", "our", or "us").

By placing an order through the Website, you acknowledge and agree to this Policy.

1. ORDER PROCESSING

Orders are processed after successful payment verification and order confirmation.

   ${'●'}${ZWS} Orders are generally processed within 1 to 2 Business Days.
   ${'●'}${ZWS} Orders received on Sundays or public holidays will be processed on the next
      Business Day.
   ${'●'}${ZWS} Processing timelines may vary during festive seasons, promotional campaigns or
      due to unforeseen operational circumstances.

Order confirmation will be sent to the registered email address and/or mobile number
provided at the time of purchase.

2. SHIPPING PARTNERS

The Company primarily ships orders through India Post.

To ensure efficient and timely delivery, the Company may also engage other reputable
courier and logistics partners based on service availability, delivery location and
operational requirements.

The selection of the shipping partner shall be at the sole discretion of the Company.

3. SHIPPING COVERAGE

The Company currently delivers to serviceable locations across India.

Delivery is subject to the serviceability of the destination PIN Code by our logistics
partners.

The Company reserves the right to decline delivery to locations that are not serviceable.

4. DELIVERY TIMELINES

Estimated delivery timelines are as follows:

   ${'●'}${ZWS} Metro Cities: 2–5 Business Days
   ${'●'}${ZWS} Other Cities and Towns: 3–7 Business Days
   ${'●'}${ZWS} Remote or Rural Locations: 5–10 Business Days

These timelines are estimates only and are not guaranteed.
Actual delivery may vary depending on:

   ${'●'}${ZWS} Destination location
   ${'●'}${ZWS} Courier operations
   ${'●'}${ZWS} Weather conditions
   ${'●'}${ZWS} Public holidays
   ${'●'}${ZWS} Natural disasters
   ${'●'}${ZWS} Government restrictions
   ${'●'}${ZWS} Other circumstances beyond the Company's reasonable control

5. SHIPPING CHARGES

Applicable shipping charges, if any, shall be displayed during the checkout process
before payment confirmation.

The Company may offer promotional free shipping or discounted shipping on eligible
orders from time to time.

6. ORDER TRACKING

Once an order has been dispatched, customers will receive shipment confirmation
through email and/or SMS, including tracking information where available.

Customers may use the tracking details provided to monitor the status of their shipment.

7. DELIVERY OF ORDERS

Deliveries will be made to the shipping address provided by the customer during
checkout.

Customers are responsible for ensuring that:

   ${'●'}${ZWS} The shipping address is complete and accurate.
   ${'●'}${ZWS} The contact number is valid and reachable.
   ${'●'}${ZWS} Someone is available to receive the shipment during normal delivery hours.

The Company shall not be responsible for delays or failed deliveries resulting from
incorrect or incomplete address information provided by the customer.

8. FAILED DELIVERY

If delivery cannot be completed due to reasons including, but not limited to:

   ${'●'}${ZWS} Incorrect or incomplete address
   ${'●'}${ZWS} Incorrect contact details
   ${'●'}${ZWS} Customer unavailable after reasonable delivery attempts
   ${'●'}${ZWS} Refusal to accept delivery

the shipment may be returned to the Company.
Re-dispatch of returned shipments may be subject to additional shipping charges.

9. DAMAGED OR TAMPERED SHIPMENTS

Customers are requested to inspect the package upon delivery.

If the package appears to be damaged, tampered with or opened, customers should:

   ${'●'}${ZWS} Refuse delivery where appropriate; or
   ${'●'}${ZWS} Record clear photographs of the package; and
   ${'●'}${ZWS} Contact Customer Support within 48 hours of delivery.

Claims relating to damaged shipments shall be handled in accordance with the Refund,
Cancellation & Return Policy.

10. DELIVERY DELAYS

While the Company endeavours to deliver all orders within the estimated timelines,
delays may occur due to circumstances beyond its reasonable control, including:

   ${'●'}${ZWS} Natural disasters
   ${'●'}${ZWS} Floods
   ${'●'}${ZWS} Cyclones
   ${'●'}${ZWS} Strikes
   ${'●'}${ZWS} Transportation disruptions
   ${'●'}${ZWS} Government regulations or restrictions
   ${'●'}${ZWS} Public emergencies
   ${'●'}${ZWS} Courier operational delays

The Company shall not be liable for any indirect or consequential losses arising from
such delays.

11. CHANGE OF SHIPPING ADDRESS

Requests to change the shipping address may be considered only if the order has not yet
been dispatched.

Once an order has been shipped, the shipping address cannot be modified.

12. CONTACT INFORMATION

For any shipping or delivery-related enquiries, customers may contact:

Zum Heilen Healthcare Private Limited
Customer Support Email: info@zh-onehealth.com
Customer Support Number: +91 9288007431
Working Hours: Monday to Saturday, 10:00 AM to 5:00 PM (IST)

13. GRIEVANCE REDRESSAL
Customers who are not satisfied with the resolution of a shipping or delivery-related
issue may contact:

Grievance Officer

Name: Fepslin Athishmon S
Designation: Chief Operating Officer (COO)
Email: fepslin@zh-onehealth.com

The Company will make reasonable efforts to address grievances in accordance with
applicable laws and internal procedures.

14. POLICY MODIFICATION

The Company reserves the right to amend, revise or update this Shipping & Delivery
Policy at any time without prior notice.

Any modifications shall become effective immediately upon publication on the Website.

Continued use of NOTJUSTWATR.COM after such publication constitutes acceptance of
the revised Policy.`,
  },

  'policy-refund': {
    title: 'Refund, Cancellation & Return Policy',
    pdf: '/policies/refund-cancellation-and-return-policy.pdf',
    text: `REFUND, CANCELLATION & RETURN POLICY

Effective Date: 03 August 2026

This Refund, Cancellation & Return Policy ("Policy") governs the cancellation of orders,
return   of    products   and   processing   of   refunds for purchases made through
NOTJUSTWATR.COM, owned and operated by Zum Heilen Healthcare Private Limited
("Company", "we", "our", or "us").

By placing an order on the Website, you acknowledge that you have read and agreed to
this Policy.

1. ORDER CANCELLATION

Customers may request cancellation of an order only before the order has been
dispatched from our warehouse.

Once an order has been packed, shipped or handed over to the courier partner for
delivery, cancellation requests cannot be accepted.

The Company reserves the right to cancel any order due to:

   ${'●'}${ZWS} Product unavailability.
   ${'●'}${ZWS} Pricing or technical errors.
   ${'●'}${ZWS} Payment verification failure.
   ${'●'}${ZWS} Suspected fraudulent transactions.
   ${'●'}${ZWS} Regulatory or legal restrictions.
   ${'●'}${ZWS} Force majeure events beyond the Company's reasonable control.

Where the Company cancels a prepaid order, the amount paid shall be refunded through
the original mode of payment.

2. RETURN POLICY

As NOTJUSTWATR products are packaged food and beverage products intended for
human consumption, returns are accepted only under the circumstances described below.

A return may be approved if:

   ${'●'}${ZWS} The product delivered is damaged during transit.
   ${'●'}${ZWS} The product received is defective.
   ${'●'}${ZWS} An incorrect product has been delivered.
   ${'●'}${ZWS} The delivered quantity differs from the confirmed order.
   ${'●'}${ZWS} The product has expired at the time of delivery.

Customers must notify the Company within 48 hours of delivery by contacting Customer
Support.
The request should include:

   ${'●'}${ZWS} Order Number.
   ${'●'}${ZWS} Customer Name.
   ${'●'}${ZWS} Photographs of the product.
   ${'●'}${ZWS} Photographs of the outer package.
   ${'●'}${ZWS} A brief description of the issue.

The Company reserves the right to request additional information where necessary to
assess the claim.

3. NON-RETURNABLE PRODUCTS

For reasons of food safety, hygiene and quality assurance, the following products are not
eligible for return:

   ${'●'}${ZWS} Opened products.
   ${'●'}${ZWS} Consumed or partially consumed products.
   ${'●'}${ZWS} Products with damaged or missing original packaging caused after delivery.
   ${'●'}${ZWS} Products damaged due to improper handling or storage by the customer.
   ${'●'}${ZWS} Products returned without prior approval.
   ${'●'}${ZWS} Products returned after the specified reporting period.

Nothing in this Policy limits any statutory rights available to consumers under applicable
law.

4. REFUND POLICY

Refunds may be approved in the following circumstances:

   ${'●'}${ZWS} Cancellation of prepaid orders before dispatch.
   ${'●'}${ZWS} Verified damage during transit.
   ${'●'}${ZWS} Delivery of incorrect products.
   ${'●'}${ZWS} Delivery of expired products.
   ${'●'}${ZWS} Failure to deliver the order.
   ${'●'}${ZWS} Duplicate or excess payment received.
   ${'●'}${ZWS} Any other situation where the Company determines that a refund is appropriate.

Refunds shall be processed only after verification of the claim, where applicable.

5. MODE OF REFUND

Approved refunds shall be processed through the original mode of payment used for
the purchase.
Where the original payment method is unavailable for reasons beyond the Company's
control, the Company may request additional information to facilitate the refund in
accordance with applicable laws.

6. REFUND TIMELINE

Once approved, refunds are generally processed within 5 to 10 business days.

The actual credit of funds may vary depending on:

   ${'●'}${ZWS} Bank processing timelines.
   ${'●'}${ZWS} Card issuing banks.
   ${'●'}${ZWS} UPI service providers.
   ${'●'}${ZWS} Payment gateway processing schedules.

The Company shall not be responsible for delays attributable to banks, payment
gateways or other financial institutions.

7. REPLACEMENT OF PRODUCTS

Where a replacement is approved, the Company may, at its discretion:

   ${'●'}${ZWS} Dispatch a replacement product; or
   ${'●'}${ZWS} Issue a refund if replacement is not feasible.

Replacement is subject to product availability.

8. FAILED OR DUPLICATE PAYMENTS

If a payment has been debited but the order was not successfully placed, customers are
requested to contact Customer Support.

After verification, eligible refunds for failed or duplicate transactions shall be processed
through the original payment method.

9. CONTACT FOR RETURNS AND REFUNDS

For any cancellation, return or refund request, customers may contact:

Zum Heilen Healthcare Private Limited
Customer Support Email: info@zh-onehealth.com
Customer Support Number: +91 9288007431
Working Hours: Monday to Saturday, 10:00 AM to 5:00 PM (IST)

10. GRIEVANCE REDRESSAL

If a customer is dissatisfied with the resolution of a refund, cancellation or return request,
the matter may be escalated to:

Grievance Officer
Name: Fepslin Athishmon S
Designation: Chief Operating Officer (COO)
Email: fepslin@zh-onehealth.com

The Company will make reasonable efforts to address grievances in accordance with
applicable laws and internal procedures.

11. POLICY MODIFICATION

The Company reserves the right to amend, revise or update this Policy at any time
without prior notice.

Any changes shall become effective immediately upon publication on the Website.

Continued use of NOTJUSTWATR.COM following such publication constitutes acceptance
of the revised Policy.`,
  },

  'policy-grievance': {
    title: 'Grievance Redressal Policy',
    pdf: '/policies/grievance-redressal-policy.pdf',
    text: `GRIEVANCE REDRESSAL POLICY

Effective Date: 03 August 2026

NOTJUSTWATR.COM ("Website") is owned and operated by Zum Heilen Healthcare
Private Limited ("Company", "we", "our", or "us").

The Company is committed to providing high standards of customer service and ensuring
that all customer concerns, complaints and grievances are addressed fairly, transparently
and in a timely manner. This Grievance Redressal Policy outlines the procedure for
submitting and resolving complaints relating to products, services, orders and the use of
the Website.

1. OBJECTIVE

The objective of this Policy is to:

   ${'●'}${ZWS} Provide customers with a transparent mechanism for raising grievances.
   ${'●'}${ZWS} Ensure prompt acknowledgement and resolution of complaints.
   ${'●'}${ZWS} Promote fair business practices and customer satisfaction.
   ${'●'}${ZWS} Comply with applicable laws governing e-commerce and consumer protection in
       India.

2. SCOPE

This Policy applies to grievances relating to, including but not limited to:

   ${'●'}${ZWS} Order placement and confirmation
   ${'●'}${ZWS} Product availability
   ${'●'}${ZWS} Shipping and delivery
   ${'●'}${ZWS} Damaged, defective or incorrect products
   ${'●'}${ZWS} Refunds, cancellations and returns
   ${'●'}${ZWS} Payment-related issues
   ${'●'}${ZWS} Website functionality
   ${'●'}${ZWS} Privacy and personal data
   ${'●'}${ZWS} Customer service experience
   ${'●'}${ZWS} Any other issue arising from the use of NOTJUSTWATR.COM

3. HOW TO SUBMIT A GRIEVANCE

Customers may submit their grievance through the following contact details:

Customer Support

Email: info@zh-onehealth.com
Phone: +91 9288007431
Working Hours: Monday to Saturday, 10:00 AM to 5:00 PM (IST)
To facilitate prompt resolution, customers are requested to provide:

   ${'●'}${ZWS} Full Name
   ${'●'}${ZWS} Registered Email Address
   ${'●'}${ZWS} Mobile Number
   ${'●'}${ZWS} Order Number (if applicable)
   ${'●'}${ZWS} Description of the grievance
   ${'●'}${ZWS} Relevant photographs or supporting documents, where applicable

4. GRIEVANCE OFFICER

In accordance with applicable laws, the Company has appointed the following Grievance
Officer:

Name: Fepslin Athishmon S
Designation: Chief Operating Officer (COO)
Email: fepslin@zh-onehealth.com

The Grievance Officer is responsible for overseeing the receipt, review and resolution of
customer grievances in accordance with this Policy and applicable laws.

5. RESOLUTION PROCESS

Upon receipt of a grievance:

   1.${ZWS} The complaint will be reviewed and assigned a reference for internal tracking.
   2.${ZWS} Additional information or documentation may be requested where necessary.
   3.${ZWS} The Company will investigate the matter in consultation with the relevant
       departments.
   4.${ZWS} Appropriate corrective action or resolution will be communicated to the customer.

Where the grievance relates to refunds, returns, deliveries or payments, resolution shall
be subject to the applicable policies published on the Website.

6. RESOLUTION TIMELINES

The Company endeavours to:

   ${'●'}${ZWS} Acknowledge receipt of a grievance within 48 business hours.
   ${'●'}${ZWS} Resolve grievances as expeditiously as possible, ordinarily within 15 business
       days, depending on the nature and complexity of the matter.

Certain grievances requiring verification by banks, payment gateways, logistics partners
or regulatory authorities may take additional time.

7. CUSTOMER RESPONSIBILITIES

Customers are requested to:
   ${'●'}${ZWS} Provide accurate and complete information.
   ${'●'}${ZWS} Cooperate during the investigation process.
   ${'●'}${ZWS} Submit grievances promptly after identifying the issue.
   ${'●'}${ZWS} Refrain from providing false or misleading information.

Incomplete or inaccurate information may delay the resolution process.

8. EXCLUSIONS

The Company may decline grievances arising from:

   ${'●'}${ZWS} Misuse of products contrary to instructions.
   ${'●'}${ZWS} Damage caused after delivery due to improper handling or storage.
   ${'●'}${ZWS} Requests submitted without sufficient supporting information.
   ${'●'}${ZWS} Matters beyond the Company's reasonable control, including delays caused by
      third-party logistics providers, financial institutions or force majeure events.

Nothing in this section shall limit any rights available to consumers under applicable law.

9. CONFIDENTIALITY

All grievances and supporting information submitted by customers shall be handled
confidentially and used solely for the purpose of investigating and resolving the
complaint, in accordance with the Company's Privacy Policy and applicable data
protection laws.

10. POLICY REVIEW

The Company reserves the right to amend or update this Grievance Redressal Policy from
time to time to reflect changes in legal, regulatory or operational requirements.

The revised Policy shall become effective upon publication on the Website.

11. COMPANY DETAILS

Zum Heilen Healthcare Private Limited

CIN: U85110KA2015PTC078824
GSTIN: 29AAACZ8161A2ZA
FSSAI Licence Number: 11224998000039
Registered Office:
      9/36, 203, Vaishnavi Sapphire Centre,${ZWS}
      2nd Floor, Tumkur Road, Yeshwanthpura,${ZWS}
      Bengaluru, Karnataka – 560022, India

Customer Support Email: info@zh-onehealth.com
Customer Support Number: +91 9288007431
Working Hours: Monday to Saturday, 10:00 AM to 5:00 PM (IST)`,
  },

  'policy-about': {
    title: 'About Us',
    pdf: '/policies/about-us.pdf',
    text: `About Us

Welcome to NOTJUSTWATR.COM, the official online store of Zum Heilen Healthcare
Private Limited.

At NOTJUSTWATR, we believe that everyday nutrition should be simple, convenient and
backed by innovation. Our mission is to develop premium food and beverage products
that combine quality ingredients with scientific research, helping consumers make better
lifestyle choices without compromising on taste or convenience.

Our product portfolio includes carefully developed beverages and functional food
products designed to integrate seamlessly into daily life. Every product is created with a
strong focus on quality, safety, consistency and consumer satisfaction.

As a food business operating under the applicable regulatory framework in India, we are
committed to maintaining high standards of manufacturing, quality assurance and
regulatory compliance. Our products are sourced, manufactured and supplied through
approved facilities that comply with applicable food safety and quality standards.

At NOTJUSTWATR, customer trust is our highest priority. We strive to provide:

   ${'●'}${ZWS} Premium quality food and beverage products
   ${'●'}${ZWS} Safe and secure online shopping
   ${'●'}${ZWS} Transparent pricing
   ${'●'}${ZWS} Reliable order fulfilment
   ${'●'}${ZWS} Responsive customer support
   ${'●'}${ZWS} Timely delivery across India

Innovation is at the heart of everything we do. We continuously invest in research and
product development to create solutions that meet the evolving needs of modern
consumers while maintaining the highest standards of quality and integrity.

Our commitment extends beyond delivering products—we aim to build lasting
relationships with our customers through transparency, reliability and exceptional
service.

Thank you for choosing NOTJUSTWATR.COM. We appreciate your trust and look
forward to serving you with products that reflect our commitment to quality, innovation
and customer satisfaction.

Corporate Information

Legal Name
Zum Heilen Healthcare Private Limited
Corporate Identification Number (CIN)
U85110KA2015PTC078824

GSTIN
29AAACZ8161A2ZA

FSSAI Licence Number
11224998000039

Registered Office
9/36, 203, Vaishnavi Sapphire Centre,${ZWS}
2nd Floor, Tumkur Road, Yeshwanthpura,${ZWS}
Bengaluru, Karnataka – 560022, India

Customer Support
Email: info@zh-onehealth.com

Phone: +91 9288007431

Business Hours
Monday to Saturday${ZWS}
10:00 AM – 5:00 PM (IST)`,
  },

  'policy-contact': {
    title: 'Contact Us',
    pdf: '/policies/contact-us.pdf',
    text: `Contact Us

We're here to help. If you have any questions regarding our products, orders, shipping,
payments or your shopping experience on NOTJUSTWATR.COM, please get in touch
with us.

Customer Support

Email: info@zh-onehealth.com
Phone: +91 9288007431
Business Hours:
Monday to Saturday
10:00 AM – 5:00 PM (IST)

Registered Office

Zum Heilen Healthcare Private Limited

9/36, 203, Vaishnavi Sapphire Centre,${ZWS}
2nd Floor, Tumkur Road, Yeshwanthpura,${ZWS}
Bengaluru, Karnataka – 560022, India`,
  },
}

// ─── Parsed policy element types ─────────────────────────────
type PolicyElement =
  | { type: 'title'; text: string }
  | { type: 'effective-date'; text: string }
  | { type: 'section-heading'; text: string }
  | { type: 'sub-heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: string[] }
  | { type: 'info-line'; label: string; value: string }

// ─── Parser ──────────────────────────────────────────────────
function parsePolicyText(raw: string): PolicyElement[] {
  // Remove zero-width spaces for cleaner processing
  const text = raw.replace(/\u200B/g, '')
  const lines = text.split('\n')
  const elements: PolicyElement[] = []
  let i = 0

  // Helper: check if a line is blank
  const isBlank = (line: string) => line.trim() === ''

  // Helper: check if a line is a numbered section heading like "1. COMPANY INFORMATION"
  const isNumberedHeading = (line: string) => /^\d+\.\s+[A-Z]/.test(line.trim())

  // Helper: check if a line is a letter sub-heading like "A. Personal Information"
  const isLetterHeading = (line: string) => /^[A-Z]\.\s+[A-Z]/.test(line.trim())

  // Helper: check if a line starts with a bullet point
  const isBulletLine = (line: string) => /^\s*●\s/.test(line)

  // Helper: check if a line starts with an indented numbered item like "   1. Text"
  const isIndentedNumberedItem = (line: string) => /^\s+\d+\.\s/.test(line)

  // Helper: check if a line is a continuation (more indented than normal, not a bullet or numbered)
  const isContinuation = (line: string) =>
    /^\s{6,}/.test(line) && !isBulletLine(line) && !isIndentedNumberedItem(line)

  // Skip leading blank lines
  while (i < lines.length && isBlank(lines[i])) i++

  // Parse main title (first non-blank line)
  if (i < lines.length) {
    elements.push({ type: 'title', text: lines[i].trim() })
    i++
  }

  // Skip blanks after title
  while (i < lines.length && isBlank(lines[i])) i++

  // Parse effective date
  if (i < lines.length && lines[i].trim().startsWith('Effective Date:')) {
    elements.push({ type: 'effective-date', text: lines[i].trim() })
    i++
  }

  // Skip blanks
  while (i < lines.length && isBlank(lines[i])) i++

  // Now parse the body
  while (i < lines.length) {
    const line = lines[i]

    // Blank line - skip
    if (isBlank(line)) {
      i++
      continue
    }

    // Numbered section heading like "1. COMPANY INFORMATION"
    if (isNumberedHeading(line)) {
      elements.push({ type: 'section-heading', text: line.trim() })
      i++
      continue
    }

    // Letter sub-heading like "A. Personal Information"
    if (isLetterHeading(line)) {
      elements.push({ type: 'sub-heading', text: line.trim() })
      i++
      continue
    }

    // Bullet list - collect consecutive bullet lines
    if (isBulletLine(line)) {
      const items: string[] = []
      let currentBullet = ''

      while (i < lines.length) {
        const l = lines[i]

        if (isBlank(l)) {
          // End of bullet list
          if (currentBullet) {
            items.push(currentBullet.trim())
            currentBullet = ''
          }
          i++
          break
        }

        if (isBulletLine(l)) {
          // New bullet item
          if (currentBullet) {
            items.push(currentBullet.trim())
          }
          currentBullet = l.replace(/^\s*●\s*/, '')
          i++
        } else if (isContinuation(l) && currentBullet) {
          // Continuation of current bullet
          currentBullet += ' ' + l.trim()
          i++
        } else if (isNumberedHeading(l) || isLetterHeading(l)) {
          // Hit a heading - end the bullet list
          if (currentBullet) {
            items.push(currentBullet.trim())
            currentBullet = ''
          }
          break
        } else {
          // Regular line - could be end of bullet list
          if (currentBullet) {
            items.push(currentBullet.trim())
            currentBullet = ''
          }
          // Don't increment i - let the outer loop handle this line
          break
        }
      }

      // Flush any remaining bullet
      if (currentBullet) {
        items.push(currentBullet.trim())
      }

      if (items.length > 0) {
        elements.push({ type: 'bullet-list', items })
      }
      continue
    }

    // Indented numbered list like "   1. Text"
    if (isIndentedNumberedItem(line)) {
      const items: string[] = []
      let currentItem = ''

      while (i < lines.length) {
        const l = lines[i]

        if (isBlank(l)) {
          if (currentItem) {
            items.push(currentItem.trim())
            currentItem = ''
          }
          i++
          break
        }

        if (isIndentedNumberedItem(l)) {
          if (currentItem) {
            items.push(currentItem.trim())
          }
          currentItem = l.replace(/^\s*\d+\.\s*/, '')
          i++
        } else if (isContinuation(l) && currentItem) {
          currentItem += ' ' + l.trim()
          i++
        } else {
          if (currentItem) {
            items.push(currentItem.trim())
            currentItem = ''
          }
          break
        }
      }

      if (currentItem) {
        items.push(currentItem.trim())
      }

      if (items.length > 0) {
        elements.push({ type: 'numbered-list', items })
      }
      continue
    }

    // Info line with label: value pattern (like "Legal Name: ..." or "Email: ...")
    const infoMatch = line.trim().match(/^([A-Z][A-Za-z\s&()/]+?):\s+(.+)$/)
    if (infoMatch && !isNumberedHeading(line) && !isLetterHeading(line)) {
      // Check if this looks like a real info line (label is short enough)
      const label = infoMatch[1].trim()
      const value = infoMatch[2].trim()
      if (label.length < 60) {
        // Collect continuation lines for the value
        i++
        while (i < lines.length && isContinuation(lines[i]) && !isBlank(lines[i])) {
          // Skip continuation for info lines - they're part of the value
          i++
        }
        elements.push({ type: 'info-line', label, value })
        continue
      }
    }

    // Regular paragraph - collect consecutive non-blank, non-special lines
    {
      let paraText = line.trim()
      i++

      while (i < lines.length) {
        const l = lines[i]

        if (isBlank(l)) {
          i++
          break
        }

        if (isNumberedHeading(l) || isLetterHeading(l) || isBulletLine(l) || isIndentedNumberedItem(l)) {
          break
        }

        // Check if this looks like an info line
        const infoM = l.trim().match(/^([A-Z][A-Za-z\s&()/]+?):\s+(.+)$/)
        if (infoM && infoM[1].trim().length < 60) {
          break
        }

        paraText += ' ' + l.trim()
        i++
      }

      if (paraText) {
        // Check if it's an info line pattern
        const pInfoMatch = paraText.match(/^([A-Z][A-Za-z\s&()/]+?):\s+(.+)$/)
        if (pInfoMatch && pInfoMatch[1].trim().length < 60) {
          elements.push({
            type: 'info-line',
            label: pInfoMatch[1].trim(),
            value: pInfoMatch[2].trim(),
          })
        } else {
          elements.push({ type: 'paragraph', text: paraText })
        }
      }
    }
  }

  return elements
}

// ─── Animation variants ──────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

// ─── Rendered policy content ─────────────────────────────────
function PolicyContent({ elements }: { elements: PolicyElement[] }) {
  return (
    <div className="space-y-5">
      {elements.map((el, idx) => {
        switch (el.type) {
          case 'title':
            // Title is rendered separately at the top, skip here
            return null

          case 'effective-date':
            // Effective date is rendered separately at the top, skip here
            return null

          case 'section-heading':
            return (
              <motion.div
                key={idx}
                custom={idx * 0.02}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
              >
                <h2
                  className="text-lg font-semibold mt-10 mb-3 pb-2"
                  style={{ color: BRAND.green, borderBottom: `2px solid ${BRAND.green}` }}
                >
                  {el.text}
                </h2>
              </motion.div>
            )

          case 'sub-heading':
            return (
              <motion.div
                key={idx}
                custom={idx * 0.02}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
              >
                <h3
                  className="text-base font-semibold mt-6 mb-2"
                  style={{ color: BRAND.dark }}
                >
                  {el.text}
                </h3>
              </motion.div>
            )

          case 'paragraph':
            return (
              <motion.p
                key={idx}
                custom={idx * 0.02}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="text-sm leading-relaxed"
                style={{ color: BRAND.dark }}
              >
                {el.text}
              </motion.p>
            )

          case 'bullet-list':
            return (
              <motion.ul
                key={idx}
                custom={idx * 0.02}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="space-y-2 pl-1"
              >
                {el.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex gap-2 text-sm leading-relaxed" style={{ color: BRAND.dark }}>
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: BRAND.green }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </motion.ul>
            )

          case 'numbered-list':
            return (
              <motion.ol
                key={idx}
                custom={idx * 0.02}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="space-y-2 pl-1"
              >
                {el.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex gap-2 text-sm leading-relaxed" style={{ color: BRAND.dark }}>
                    <span
                      className="shrink-0 font-semibold"
                      style={{ color: BRAND.green }}
                    >
                      {itemIdx + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </motion.ol>
            )

          case 'info-line':
            return (
              <motion.div
                key={idx}
                custom={idx * 0.02}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="text-sm leading-relaxed"
                style={{ color: BRAND.dark }}
              >
                <span className="font-medium" style={{ color: BRAND.dark }}>{el.label}:</span>{' '}
                <span>{el.value}</span>
              </motion.div>
            )

          default:
            return null
        }
      })}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────
export default function PolicyPage() {
  const { currentView, navigateTo } = useAppStore()

  const config = POLICY_CONFIG[currentView]
  const policyText = config?.text ?? ''
  const policyTitle = config?.title ?? 'Policy'
  const policyPdf = config?.pdf ?? ''

  const parsedElements = useMemo(() => parsePolicyText(policyText), [policyText])

  // Find the effective date from parsed elements
  const effectiveDateEl = parsedElements.find((el) => el.type === 'effective-date')
  const effectiveDate = effectiveDateEl && effectiveDateEl.type === 'effective-date'
    ? effectiveDateEl.text
    : 'Effective Date: 03 August 2026'

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND.bg }}>
        <p style={{ color: BRAND.muted }}>Policy not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg }}>
      {/* ── Breadcrumb ─────────────────────────────────── */}
      <div className="border-b" style={{ backgroundColor: '#fff', borderColor: BRAND.surface }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="#"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    navigateTo('landing')
                  }}
                  className="text-sm"
                  style={{ color: BRAND.muted }}
                >
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-medium" style={{ color: BRAND.dark }}>
                  {policyTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ backgroundColor: BRAND.green }}
            >
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ color: BRAND.dark }}
              >
                {policyTitle}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: BRAND.muted }}>
                {effectiveDate}
              </p>
            </div>
          </div>
        </motion.div>

        <Separator className="my-4" style={{ backgroundColor: BRAND.surface }} />

        {/* ── Download PDF button ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex justify-end mb-6"
        >
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
            style={{ borderColor: BRAND.green, color: BRAND.green }}
          >
            <a href={policyPdf} download target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4" />
              Download PDF
            </a>
          </Button>
        </motion.div>
      </div>

      {/* ── Content Card ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8"
      >
        <div
          className="rounded-xl p-6 sm:p-8 lg:p-10 shadow-sm"
          style={{ backgroundColor: '#fff' }}
        >
          <PolicyContent elements={parsedElements} />
        </div>
      </motion.div>

      {/* ── Back to Home ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
      >
        <Button
          variant="ghost"
          className="gap-2"
          style={{ color: BRAND.green }}
          onClick={() => navigateTo('landing')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </motion.div>
    </div>
  )
}
