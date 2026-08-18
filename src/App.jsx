/*
 LUXMO HUB — COMPLETE ALL-FEATURES MERGED FINAL
 Baseline: MASTER_PLUS_ALL_FEATURES_FINAL
 Verified against: COMPLETE_FINAL_GOOGLE_AUTHENTICATOR (312 KB)
 The merged file retains the older feature set and includes the newer
 store-settings, premium-homepage, OTP/TOTP admin, and master-admin controls.
*/
/*
 * LUXMO HUB — ALL FEATURES PRESERVED
 * Based on the 5,022-line Production Clean App.jsx.
 * This revision is additive: no existing feature/component was intentionally removed.
 * Added/retained: Live Tracking, WhatsApp Inquiry, Solar Calculator,
 * Warranty Registration, Low Stock Alerts, Store Shipping Settings,
 * persistent Store Settings, Premium Homepage sections, and Admin Email+Mobile+OTP.
 * Homepage inverter card text contrast was improved only.
 */

/*
 * LUXMO HUB — PRODUCTION CLEAN FRONTEND
 *
 * Changes made from the supplied App file:
 * 1. Removed the duplicated Pro Suite / customer-tools / main-app block.
 * 2. Kept one canonical LuxmoHubApp export.
 * 3. Kept one canonical set of Pro Suite helpers/components.
 * 4. Disabled Partial COD until server-side verified payment + balance
 *    collection is implemented.
 *
 * Important production boundary:
 * Secure admin authentication, Razorpay signature verification, courier
 * credentials, order persistence and shipping settings must be enforced by
 * server/API code. Browser localStorage/sessionStorage must not be treated
 * as a secure source of truth.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Search, Lock, ChevronRight, Filter, Trash2, Edit3, 
  AlertCircle, Star, ArrowLeft, Upload, CheckCircle2, ShieldCheck, X, Phone, Mail,
  FileText, Info, HelpCircle, RefreshCw, Truck, Scale
} from 'lucide-react';

const BUSINESS_INFO = {
  tradeName: "LUXMO HUB",
  legalName: "Sarita Devi",
  type: "Proprietorship",
  gstin: "09CNCPD1174R1ZN",

  // Complete Udyam Registration Certificate details
  udyam: {
    registrationNumber: "UDYAM-UP-21-0062490",
    enterpriseName: "LUXMO HUB",
    classificationYear: "2026-27",
    enterpriseType: "Micro",
    classificationDate: "05/08/2026",
    majorActivity: "TRADING",
    socialCategory: "OBC",
    unitName: "Luxmo Hub",

    officialAddress: {
      flatDoorBlockNo: "147",
      premisesBuilding: "Luxmo Hub Office",
      villageTown: "Kotwa",
      blockPost: "Mathura Chhapar",
      roadStreetLane: "Unnamed Road",
      city: "Deoria",
      state: "UTTAR PRADESH",
      district: "DEORIA",
      pinCode: "274405"
    },

    registeredMobile: "8299260182",
    registeredEmail: "Luxmohub@gmail.com",

    dateOfIncorporationRegistration: "25/05/2026",
    dateOfCommencementOfProductionBusiness: "25/05/2026",
    dateOfUdyamRegistration: "05/08/2026",

    nicClassification: {
      nic2Digit: "46",
      nic2DigitActivity: "Wholesale trade, except of motor vehicles and motorcycles",
      nic4Digit: "4659",
      nic4DigitActivity: "Wholesale of other machinery and equipment",
      nic5Digit: "46599",
      nic5DigitActivity: "Wholesale of other machinery, equipment and supplies n.e.c. including computer-controlled machine tools and computer-controlled sewing and knitting machines",
      activity: "Trading"
    },

    assistance: {
      districtIndustriesCentre: "DEORIA (UTTAR PRADESH)",
      msmeDfo: "KANPUR (UTTAR PRADESH)"
    }
  },

  address: {
    line1: "Building No. 147, Unnamed Road",
    line2: "Near Mathura Chhapar Branch Post Office",
    area: "Vill-Kotwa, Mathura Chhapar",
    district: "District Deoria",
    state: "Uttar Pradesh – 274405, India"
  },
  emails: ["luxmohub@gmail.com"],
  phones: ["+91 7565012418", "+91 8299260182"],
  hours: "Monday–Saturday, 10:00 AM–6:00 PM (Sunday and public holidays may be closed.)"
};

const CATEGORIES = ["Hybrid Solar Inverter", "Mobile Back Case", "Solar Accessories"];

const IPHONE_MODELS = [
  "iPhone 18 Pro Max", "iPhone 18 Pro", "iPhone 18 Plus", "iPhone 18", "iPhone Air",
  "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17 Plus", "iPhone 17", "iPhone Air",
  "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
  "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
  "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13 Mini", "iPhone 13",
  "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12 Mini", "iPhone 12",
  "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
  "iPhone SE (3rd Gen)", "iPhone SE (2nd Gen)", "iPhone XR", "iPhone XS Max", "iPhone XS", "iPhone X"
];

const SAMSUNG_MODELS = [
  "Galaxy Z Fold 9 Ultra", "Galaxy Z Fold 9", "Galaxy Z Fold 8",
  "Galaxy Z Flip 8", "Galaxy Z Flip 7",
  // Galaxy S Series
  "Galaxy S26 Ultra", "Galaxy S26+", "Galaxy S26", "Galaxy S26 FE",
  "Galaxy S25 Ultra", "Galaxy S25+", "Galaxy S25", "Galaxy S25 FE",
  "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S24 FE",
  "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S23 FE",
  "Galaxy S22 Ultra", "Galaxy S22+", "Galaxy S22", "Galaxy S22 FE",
  "Galaxy S21 Ultra", "Galaxy S21+", "Galaxy S21", "Galaxy S21 FE",
  "Galaxy S20 Ultra", "Galaxy S20+", "Galaxy S20", "Galaxy S20 FE",
  // Galaxy Z Fold / Flip
  "Galaxy Z Fold 7", "Galaxy Z Fold 6", "Galaxy Z Fold 5", "Galaxy Z Fold 4", "Galaxy Z Fold 3", "Galaxy Z Fold 2", "Galaxy Fold",
  "Galaxy Z Flip 7", "Galaxy Z Flip 6", "Galaxy Z Flip 5", "Galaxy Z Flip 4", "Galaxy Z Flip 3", "Galaxy Z Flip",
  // Galaxy A Series
  "Galaxy A56 5G", "Galaxy A55 5G", "Galaxy A54 5G", "Galaxy A53 5G", "Galaxy A52 5G", "Galaxy A52",
  "Galaxy A36 5G", "Galaxy A35 5G", "Galaxy A34 5G", "Galaxy A33 5G", "Galaxy A32",
  "Galaxy A26 5G", "Galaxy A25 5G", "Galaxy A24", "Galaxy A23", "Galaxy A22", "Galaxy A15", "Galaxy A14", "Galaxy A13",
  // Galaxy M Series
  "Galaxy M56 5G", "Galaxy M55 5G", "Galaxy M54 5G", "Galaxy M53 5G", "Galaxy M52 5G", "Galaxy M51",
  "Galaxy M36 5G", "Galaxy M35 5G", "Galaxy M34 5G", "Galaxy M33 5G", "Galaxy M32", "Galaxy M31", "Galaxy M30",
  "Galaxy M26 5G", "Galaxy M25 5G", "Galaxy M15 5G", "Galaxy M14 5G", "Galaxy M13",
  // Galaxy F Series
  "Galaxy F56 5G", "Galaxy F55 5G", "Galaxy F54 5G", "Galaxy F34 5G", "Galaxy F33", "Galaxy F23 5G", "Galaxy F22", "Galaxy F15 5G", "Galaxy F14 5G", "Galaxy F13"
];

const GOOGLE_PIXEL_MODELS = [
  "Google Pixel 10a", "Google Pixel 10", "Google Pixel 10 Pro", "Google Pixel 10 Pro XL", "Google Pixel 10 Pro Fold",
  "Google Pixel 9a", "Google Pixel 9", "Google Pixel 9 Pro", "Google Pixel 9 Pro XL", "Google Pixel 9 Pro Fold",
  "Google Pixel 8a", "Google Pixel 8", "Google Pixel 8 Pro", "Google Pixel 8 Pro Fold",
  "Google Pixel 7a", "Google Pixel 7", "Google Pixel 7 Pro",
  "Google Pixel 6a", "Google Pixel 6", "Google Pixel 6 Pro",
  "Google Pixel 5a", "Google Pixel 5", "Google Pixel 4a", "Google Pixel 4", "Google Pixel 4 XL",
  "Google Pixel 3a", "Google Pixel 3a XL", "Google Pixel 3", "Google Pixel 3 XL",
  "Google Pixel 2", "Google Pixel 2 XL", "Google Pixel XL", "Google Pixel"
];

const MOBILE_MODELS = [
  // Apple
  "iPhone 18", "iPhone 18 Plus", "iPhone 18 Pro", "iPhone 18 Pro Max", "iPhone Air",
  "iPhone 17", "iPhone 17 Plus", "iPhone 17 Pro", "iPhone 17 Pro Max",
  "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
  "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
  "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
  "iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
  "iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
  "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
  "iPhone SE (3rd Gen)", "iPhone SE (2nd Gen)", "iPhone XR", "iPhone XS", "iPhone XS Max", "iPhone X", "iPhone 8", "iPhone 8 Plus",
  // Samsung Galaxy S
  "Galaxy S25", "Galaxy S25 FE", "Galaxy S25 Plus", "Galaxy S25 Ultra",
  "Galaxy S24", "Galaxy S24 FE", "Galaxy S24 Plus", "Galaxy S24 Ultra",
  "Galaxy S23", "Galaxy S23 FE", "Galaxy S23 Plus", "Galaxy S23 Ultra",
  "Galaxy S22", "Galaxy S22 Plus", "Galaxy S22 Ultra",
  "Galaxy S21", "Galaxy S21 FE", "Galaxy S21 Plus", "Galaxy S21 Ultra",
  "Galaxy S20", "Galaxy S20 FE", "Galaxy S20 Plus", "Galaxy S20 Ultra",
  // Samsung Galaxy Fold / Flip
  "Galaxy Fold", "Galaxy Z Fold2", "Galaxy Z Fold3", "Galaxy Z Fold4", "Galaxy Z Fold5", "Galaxy Z Fold6", "Galaxy Z Fold7", "Galaxy Z Fold8", "Galaxy Z Fold9", "Galaxy Z Fold9 Ultra",
  "Galaxy Z Flip", "Galaxy Z Flip3", "Galaxy Z Flip4", "Galaxy Z Flip5", "Galaxy Z Flip6", "Galaxy Z Flip7", "Galaxy Z Flip8",
  // Samsung A series
  "Galaxy A05", "Galaxy A05s", "Galaxy A06", "Galaxy A14", "Galaxy A15", "Galaxy A16", "Galaxy A17", "Galaxy A24", "Galaxy A25", "Galaxy A26", "Galaxy A34", "Galaxy A35", "Galaxy A36", "Galaxy A54", "Galaxy A55", "Galaxy A56", "Galaxy A73",
  // Samsung M series
  "Galaxy M14", "Galaxy M15", "Galaxy M16", "Galaxy M33", "Galaxy M34", "Galaxy M35", "Galaxy M36", "Galaxy M51", "Galaxy M52", "Galaxy M53", "Galaxy M54", "Galaxy M55", "Galaxy M56",
  // Samsung F series
  "Galaxy F14", "Galaxy F15", "Galaxy F16", "Galaxy F23", "Galaxy F34", "Galaxy F54", "Galaxy F55", "Galaxy F56",
  // Google Pixel
  "Google Pixel 10", "Google Pixel 10a", "Google Pixel 10 Pro", "Google Pixel 10 Pro XL", "Google Pixel 10 Pro Fold",
  "Google Pixel 9", "Google Pixel 9a", "Google Pixel 9 Pro", "Google Pixel 9 Pro XL", "Google Pixel 9 Pro Fold",
  "Google Pixel 8", "Google Pixel 8a", "Google Pixel 8 Pro", "Google Pixel 8 Fold",
  "Google Pixel 7", "Google Pixel 7a", "Google Pixel 7 Pro", "Google Pixel 7 Fold",
  "Google Pixel 6", "Google Pixel 6a", "Google Pixel 6 Pro", "Google Pixel 5", "Google Pixel 4a", "Google Pixel 4", "Google Pixel 3a", "Google Pixel 3"
];

const MOBILE_COLOURS = [
  "Black", "White", "Gray", "Light Gray", "Dark Gray", "Navy Blue", "Blue", "Sky Blue",
  "Cognac Brown", "Dark Brown", "Light Brown", "Tan Brown", "Burnt Orange", "Orange", "Red",
  "Green", "Forest Green", "Olive Green", "Beige", "Cream", "Yellow", "Purple", "Lavender", "Pink", "Rose Gold", "Clear"
];

const VARIANT_COLOURS = MOBILE_COLOURS;

const INVERTER_MODELS = [
  "Hybrid Solar Inverter 3KW 24V", "Hybrid Solar Inverter 3.5KW 24V", "Hybrid Solar Inverter 5KW 24V",
  "Hybrid Solar Inverter 5KW 48V", "Hybrid Solar Inverter 5.5KW 24V", "Hybrid Solar Inverter 5.5KW 48V",
  "Hybrid Solar Inverter 6KW 48V", "Hybrid Solar Inverter 6.2KW 48V", "Hybrid Solar Inverter 6.5KW 48V",
  "Hybrid Solar Inverter 8KW 48V", "Hybrid Solar Inverter 8.5KW 48V", "Hybrid Solar Inverter 10KW 48V",
  "Hybrid Solar Inverter 10.5KW 48V", "Hybrid Solar Inverter 11KW 48V", "Hybrid Solar Inverter 11.5KW 48V",
  "Hybrid Solar Inverter 12KW 48V", "Hybrid Solar Inverter 12.5KW 48V"
];

const ACCESSORY_MODELS = [
  "Solar DC Cable", "MC4 Solar Connector", "MC4 Connector Pair", "Solar DC Connector",
  "Solar Cable Connector", "Solar Cable Accessories", "Solar Charge Controller", "Solar DC Fuse",
  "Solar DC Isolator", "Solar PV Combiner Box", "Solar Installation Accessories",
  "Solar Inverter Accessories", "WiFi Monitoring Dongle", "Solar Inverter Communication Cable"
];

const MODEL_MAP = {
  "Mobile Back Case": MOBILE_MODELS,
  "Hybrid Solar Inverter": INVERTER_MODELS,
  "Solar Accessories": ACCESSORY_MODELS
};

// Tax rules supplied for LUXMO HUB product listings.
// HSN/GST are derived from the selected category and, for mobile cases, material.
const MATERIAL_LABELS = {
  "": "Select material",
  "Genuine Leather": "Genuine Leather",
  "PU Leather": "PU Leather",
  "Plastic / Silicone / TPU / Rubber": "Plastic / Silicone / TPU / Rubber"
};

const MATERIAL_OPTIONS = {
  "Mobile Back Case": [
    "",
    "Genuine Leather",
    "PU Leather",
    "Plastic / Silicone / TPU / Rubber"
  ],
  "Hybrid Solar Inverter": ["Not Applicable"],
  "Solar Accessories": ["Not Specified"]
};

const TAX_RULES = {
  "Hybrid Solar Inverter": { hsn: "85044010", gstRate: 18, label: "Hybrid Solar Inverter / Electric Inverter" },
  "Mobile Back Case": {
    "Genuine Leather": { hsn: "42029900", gstRate: 18, label: "Mobile Phone Back Case / Cover – Genuine Leather" },
    "PU Leather": { hsn: "42029900", gstRate: 18, label: "Mobile Phone Back Case / Cover – PU Leather" },
    "Plastic / Silicone / TPU / Rubber": { hsn: "39269099", gstRate: 18, label: "Mobile Phone Back Case / Cover – Plastic / Silicone / TPU / Rubber" }
  },
  "Solar Accessories": null
};

const getTaxInfo = (category, material) => {
  if (category === "Hybrid Solar Inverter") return TAX_RULES[category];
  if (category === "Mobile Back Case") return TAX_RULES[category]?.[material] || null;
  return null;
};

const FORBIDDEN_TERMS = ["solar panel", "solar panels", "topcon", "mono perc", "bifacial", "half-cut"];

const INITIAL_PRODUCTS = [
  {
    id: "prod-001",
    title: "LUXMO HUB 5.5KW 24V Hybrid Solar Inverter",
    category: "Hybrid Solar Inverter",
    model: "Hybrid Solar Inverter 5.5KW 24V",
    material: "Not Applicable",
    description: "Pure Sine Wave | MPPT Solar Charge Controller | 24V Battery Support | Home & Solar Power Backup System",
    price: 65000,
    salePrice: 54999,
    stock: 10,
    sku: "LUX5.5H24V",
    hsn: "85044010",
    gstRate: 18,
    images: ["https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&q=80&w=600"],
    published: true,
    rating: null,
    reviewsCount: 0
  }
];


const RETURN_REPLACEMENT_POLICY = String.raw`LUXMO HUB — Return & Replacement Policy

Effective Date: 12 August 2026

At LUXMO HUB, we are committed to providing genuine, quality products and a reliable shopping experience. We carefully inspect and securely pack products before dispatch.

If you receive a product that is damaged during transit, defective, incorrect, or significantly different from what you ordered, you may request a return or replacement in accordance with the terms below.

1. Return Request Period

- Return or replacement requests must be raised within 7 calendar days from the date of delivery.
- Requests received after 7 days may not be accepted.
- The product must be returned in its original condition, along with original packaging, accessories, manuals, and other included items, wherever applicable.
- All return requests are subject to verification and approval by LUXMO HUB.

2. Eligible Reasons for Return or Replacement

A return or replacement may be considered in the following situations:

- Product received is physically damaged during transit.
- Wrong product, model, capacity, colour, or variant received.
- Product is defective or non-functional upon initial inspection.
- Product received is significantly different from the product ordered.
- Essential accessories or components are missing from the package.
- Product has a verified manufacturing defect covered under the applicable warranty terms.

3. Hybrid Solar Inverter – Special Return Conditions

For LUXMO HUB Hybrid Solar Inverters, customers must ensure that installation is performed by a qualified and experienced electrician/solar technician.

Returns or replacements may not be accepted where damage is caused by:

- Incorrect installation or wiring.
- Reverse polarity or incorrect battery connection.
- Incorrect battery voltage or incompatible battery configuration.
- Excessive or unstable input/output voltage.
- Short circuit, overload, overheating caused by improper installation, or electrical faults.
- Water/moisture damage where the product is not rated for such exposure.
- Physical damage after delivery.
- Unauthorized opening, modification, repair, or tampering.
- Use contrary to the product manual or installation instructions.

Important: The inverter must not be opened, repaired, modified, or tampered with by an unauthorized person. Such actions may void the applicable warranty.

4. Mobile Phone Back Case Cover – Special Return Conditions

For Mobile Phone Back Case Covers, return or replacement may be considered if:

- The wrong phone model was delivered.
- The wrong colour/design was delivered.
- The product is damaged or defective when received.
- The product received is significantly different from the product ordered.

The product should be unused, undamaged, and in its original condition for a return based on an eligible issue.

Returns may not be accepted where the case has been:

- Used or physically damaged after delivery.
- Cut, modified, scratched, stained, or altered.
- Damaged due to improper fitting or handling.
- Returned without required original packaging, where applicable.

5. Transit Damage & Unboxing Video

Customers are strongly advised to record a continuous, clear unboxing video when opening the package, particularly for high-value electrical products such as hybrid solar inverters.

The video should show:

1. The sealed package before opening.
2. The shipping label/order details.
3. The complete opening process.
4. The product and all accessories received.
5. Any visible damage or missing components.

An unboxing video may be requested by LUXMO HUB to help verify transit damage, missing items, or incorrect products.

6. Return Approval & Product Inspection

After receiving a returned product, LUXMO HUB may inspect the product, packaging, accessories, serial number, and reported issue.

A return, replacement, or refund will be processed only after the product passes the applicable verification/inspection process.

LUXMO HUB reserves the right to reject a return request if the product is found to have been damaged, misused, modified, improperly installed, or tampered with after delivery.

7. Replacement

Where an eligible replacement is approved:

- Replacement will be subject to product availability.
- The replacement may be of the same model/variant or an equivalent product, where applicable.
- If the same product is unavailable, LUXMO HUB may provide an alternative resolution in accordance with the applicable order and refund terms.

8. Refund Policy

If a refund is approved instead of a replacement:

- The refund will generally be initiated after the returned product has been received and successfully inspected.
- Refunds will normally be processed through the original payment method, wherever technically applicable.
- The time taken for the refund to appear in the customer's bank account/card/payment method may depend on the payment gateway or financial institution.

9. Non-Returnable / Non-Eligible Cases

Returns or replacements may not be accepted for:

- Change of mind or personal preference, unless specifically stated on the product page.
- Incorrect product selection by the customer.
- Products damaged after delivery due to misuse, negligence, or improper handling.
- Products damaged due to improper installation or electrical connection.
- Products that have been opened, repaired, modified, or tampered with by an unauthorized person.
- Products with missing accessories or components required for verification.
- Physical damage caused after delivery.
- Products returned outside the applicable 7-day return period.
- Any product that does not meet the applicable return conditions described above.

10. How to Request a Return or Replacement

Customers must contact LUXMO HUB Customer Support within 7 days of delivery and provide:

- Order ID
- Customer name and contact details
- Product name/model/variant
- Reason for return or replacement
- Clear photographs of the product
- Video showing the issue, where applicable
- Unboxing video, particularly for transit damage or high-value electrical products

Our support team will review the request and provide further instructions if the return is eligible.

11. Return Shipping

For an approved return caused by a wrong product, verified manufacturing defect, or confirmed transit damage, LUXMO HUB may arrange or authorize the return shipment as applicable.

Where the return is not covered under this policy, return shipping costs may be borne by the customer.

No customer should send a product back without receiving return instructions or authorization from LUXMO HUB.

12. Return Policy Does Not Replace Warranty

The 7-day Return & Replacement Policy is separate from the product warranty.

For Hybrid Solar Inverters, manufacturing defects occurring after the applicable return period may be handled under the LUXMO HUB Warranty Policy, subject to the warranty terms, installation requirements, exclusions, and verification process.

13. Policy Updates

LUXMO HUB reserves the right to update or modify this Return & Replacement Policy when necessary. The latest version published on the official LUXMO HUB website will apply to applicable orders.

---

Return Request Window

Return / Replacement Request: Within 7 Calendar Days from the Date of Delivery

Customer Support

Brand: LUXMO HUB
Email: luxmohub@gmail.com
Phone: +91 75650 12418

LUXMO HUB — Quality Products, Trusted by You.`;

const UNBOXING_POLICY = String.raw`LUXMO HUB — Unboxing Video & Proof Requirement

Effective Date: 12 August 2026

At LUXMO HUB, we are committed to maintaining a transparent and reliable customer experience. To help protect both customers and LUXMO HUB against transit damage, missing items, wrong products, and delivery-related disputes, customers are required to record a clear and continuous unboxing video when opening their LUXMO HUB order.

The unboxing video should begin before the package is opened and should clearly capture the sealed package, shipping label, product, accessories, and the complete opening process.

---

1. Hybrid Solar Inverter — Unboxing Video Requirement

For Hybrid Solar Inverters, a clear and continuous unboxing video is required for claims relating to:

- Transit or shipping damage
- Physical damage present at the time of delivery
- Wrong inverter, model, capacity, or variant received
- Missing accessories, components, or items
- Product condition at the time of delivery
- Any other delivery-related discrepancy

For a suspected manufacturing defect or warranty claim, LUXMO HUB may additionally request:

- Product photographs
- Fault videos
- Installation photographs
- Wiring photographs
- Product serial number
- Details of electrical protection equipment
- Installation details
- Testing or troubleshooting information
- Other reasonable technical evidence required for verification

---

2. Mobile Phone Back Case Cover — Unboxing Video Requirement

For Mobile Phone Back Case Covers, a clear and continuous unboxing video is required for claims relating to:

- Product damaged during transit
- Wrong phone model received
- Wrong colour, design, or variant received
- Missing item or accessory, where applicable
- Product significantly different from the order
- Any other delivery-related discrepancy

For a suspected manufacturing defect, LUXMO HUB may request photographs, videos, order details, or other reasonable evidence necessary to verify the claim.

---

3. How to Record the Unboxing Video

To ensure that the video can be properly reviewed, customers should record the unboxing process as follows:

1. Start recording before opening the package.
2. Clearly show the sealed package from all relevant sides.
3. Clearly show the shipping label and order details.
4. Record the complete package-opening process without stopping the recording.
5. Show the product immediately after opening.
6. Show all accessories, components, manuals, and included items.
7. Clearly show any visible damage, defect, missing item, or packaging damage.
8. For applicable products, clearly show the model number and serial number.

The video should preferably be continuous, clear, unedited, and without cuts, with the package, product, and relevant contents clearly visible throughout the opening process.

---

4. Proof & Claim Verification

LUXMO HUB may request the unboxing video, photographs, order information, product serial number, installation details, or other reasonable evidence to verify a:

- Return request
- Replacement request
- Refund claim
- Transit-damage claim
- Wrong-product claim
- Missing-item claim
- Warranty claim

Submitted evidence may be reviewed to determine whether the reported issue existed at the time of delivery, occurred during transit, or resulted from installation, misuse, handling, modification, or another cause.

Providing an unboxing video does not by itself guarantee approval of a return, replacement, refund, or warranty claim. All claims remain subject to verification and the applicable LUXMO HUB policies and product-specific terms.

---

5. Packaging & Product Preservation

Customers should not discard or damage the original packaging until the product has been fully inspected and the applicable return and warranty period has passed.

Customers should retain, where applicable:

- Original shipping packaging
- Shipping label
- Product packaging
- Accessories
- Manuals
- Warranty documents
- Cables and connectors
- Other items supplied with the product

For Hybrid Solar Inverters, customers should also retain relevant installation photographs, wiring details, protection-device information, and other technical records for warranty verification.

---

6. Failure to Provide Unboxing Video

For claims involving transit damage, wrong product, missing items, or other delivery-related discrepancies, the absence of the required unboxing video may make it difficult for LUXMO HUB to verify the condition of the product at the time of delivery.

LUXMO HUB may therefore request additional evidence before determining eligibility for a return, replacement, refund, or other resolution.

Where sufficient alternative evidence is available, LUXMO HUB may consider the claim based on the circumstances and applicable policy.

---

7. Final Verification

LUXMO HUB reserves the right to verify every return, replacement, refund, transit-damage, and warranty claim before approving the applicable resolution.

Any decision will be made based on the available evidence, product condition, applicable policy, manufacturer/supplier terms, and applicable law.

LUXMO HUB — Quality Products, Trusted by You.

Customer Support
Email: luxmohub@gmail.com
Phone: +91 75650 12418`;

const WARRANTY_POLICY_FULL = String.raw`LUXMO HUB Warranty Policy

Effective Date: 12 August 2026

At LUXMO HUB, we are committed to providing quality products and dependable customer support. This Warranty Policy explains the warranty coverage applicable to products purchased through the LUXMO HUB website.

Warranty coverage may vary by product category and product model. Customers are requested to review the applicable product page, sales invoice, warranty documentation, and the terms below.

---

PART A — HYBRID SOLAR INVERTER WARRANTY

1. Warranty Period

LUXMO HUB provides a 1-Year Limited Warranty (12 Months) on eligible Hybrid Solar Inverters, starting from the original date of purchase stated on the LUXMO HUB sales invoice.

- Warranty coverage applies to the original purchaser.
- Warranty coverage is subject to this policy and the applicable manufacturer/supplier warranty terms.
- Warranty is not automatically transferable unless expressly approved by LUXMO HUB.

2. What Is Covered

This warranty covers verified manufacturing defects in eligible components of the Hybrid Solar Inverter that occur during normal and proper use within the applicable warranty period.

If a manufacturing defect is confirmed after technical inspection and verification, LUXMO HUB may, subject to availability and applicable manufacturer/supplier terms:

- Repair the affected component;
- Provide a replacement component or part; or
- Provide another applicable warranty remedy.

Replacement of the complete inverter is not automatically guaranteed.

3. Mandatory Installation & Electrical Safety Requirements

The inverter must be installed by a qualified/competent electrician or solar installation professional and operated in accordance with the manufacturer's installation manual and applicable electrical safety requirements.

Depending on the inverter model and system configuration, appropriate protection may include:

- PV DC MCB / DC Circuit Breaker
- DC SPD (Surge Protection Device)
- Battery Fuse
- Battery DC Breaker / Isolator
- AC MCB
- RCCB / RCBO, where required
- Proper Earthing / PE Protection
- Suitable Protective Electrical Enclosure / Safety Box
- Correctly sized cables, terminals, connectors, and wiring

The exact protection devices, specifications, and ratings must be selected according to the specific inverter model and installation design.

Protection ratings must not be assumed or copied from another inverter model without confirming the manufacturer's specifications.

4. Protective Enclosure & Environmental Protection

Where required by the installation design, the inverter should be installed inside or within a suitable protective electrical enclosure/safety box that provides appropriate environmental and electrical protection.

The installation should provide reasonable protection against:

- Lizards and other reptiles
- Insects
- Rodents
- Excessive dust
- Water and moisture
- Accidental contact with electrical connections

The enclosure must provide adequate ventilation and cooling as required by the manufacturer.

A completely airtight enclosure must not be used if it interferes with the inverter's required ventilation or cooling.

5. Warranty Exclusions

Warranty coverage may not apply where technical inspection determines that damage or failure was caused by circumstances outside normal manufacturing defects, including but not limited to:

- Incorrect installation or wiring
- Incorrect polarity or electrical connection
- Incorrect battery voltage or incompatible battery configuration
- Incorrectly sized cables
- Incorrectly rated breakers, fuses, or protection devices
- Missing or improperly installed required protection equipment
- Electrical surge or abnormal voltage
- Lightning or other external electrical disturbances
- Short circuit caused by external wiring or installation
- Overloading or operation outside specified limits
- Water or moisture ingress
- Fire or overheating caused by improper installation
- Physical impact or accidental damage
- Improper ventilation or unsuitable installation location
- Damage caused by lizards, insects, rodents, or foreign objects
- Excessive dust or environmental contamination where suitable protection was required
- Unauthorized opening, modification, or repair
- Use of unauthorized replacement parts
- Misuse, negligence, or improper operation
- Failure to follow the manufacturer's installation or operating instructions

Where technical verification determines that a reported issue resulted from an excluded cause, the related repair, replacement, or service may not be covered under warranty.

6. Warranty Claim Requirements

To request warranty assistance for a Hybrid Solar Inverter, the customer may be required to provide:

1. LUXMO HUB Order ID or purchase invoice
2. Product serial number
3. Date of purchase
4. Detailed description of the problem
5. Clear photographs of the inverter
6. Photographs of the installation and wiring
7. Photos or videos showing the reported fault, where possible
8. Details of installed electrical protection equipment, where requested

LUXMO HUB may request additional photographs, videos, testing information, installation details, troubleshooting information, or other reasonable evidence before determining warranty eligibility.

7. Technical Inspection & Verification

All inverter warranty claims are subject to technical inspection and verification.

LUXMO HUB may assess whether the reported issue is consistent with:

- A manufacturing defect
- Installation-related damage
- Abnormal electrical conditions
- Environmental conditions
- Improper use
- Physical damage
- Another excluded cause

A warranty remedy will be provided only after the claim has been verified as eligible.

8. Replacement Parts

If a warranty claim is approved, LUXMO HUB may provide or arrange a replacement for the eligible defective component or part.

Replacement parts may be:

- New parts; or
- Equivalent parts meeting the required functional specifications.

Availability of replacement parts may affect the warranty resolution.

9. Installation & Service Charges

Unless expressly confirmed otherwise in writing, the warranty covers the eligible defective product/component only.

The following charges may not be included:

- Installation charges
- Removal charges
- Re-installation charges
- Technician/site visit charges
- Travel expenses
- Transportation charges
- Wiring or electrical work
- Additional system components

Any applicable charges will be communicated to the customer where required.

10. Warranty Limitations

Warranty coverage may be excluded for the specific damage or issue where inspection reasonably determines that it resulted from unauthorized modification, improper installation, misuse, abnormal electrical conditions, environmental exposure, physical damage, or another excluded cause.

An excluded condition affecting one component does not automatically mean that every unrelated component or issue is excluded; eligibility will be determined based on the specific claim and technical findings.

11. Customer Responsibility

The customer is responsible for ensuring that:

- The inverter is installed correctly.
- Required electrical protection is installed.
- Proper earthing is provided.
- Correct cable sizes and electrical ratings are used.
- The inverter is operated within its specified limits.
- Manufacturer instructions are followed.
- The installation remains appropriately protected throughout the product's use.

---

PART B — MOBILE PHONE BACK CASE COVER WARRANTY

12. Warranty Coverage

Where a warranty is offered for a specific Mobile Phone Back Case Cover, the applicable warranty period will be stated on the relevant product page, sales invoice, or warranty documentation.

Unless otherwise stated, warranty coverage is limited to verified manufacturing defects.

Warranty does not cover normal wear and tear or damage occurring after delivery due to use, handling, accident, or misuse.

13. Covered Manufacturing Defects

Subject to verification, warranty may apply to:

- Manufacturing-related structural defects
- Defects present when the product was supplied
- Significant manufacturing defects affecting normal intended use

14. Mobile Case Warranty Exclusions

Warranty does not cover:

- Scratches caused after delivery
- Normal wear and tear
- Discoloration caused by normal use or environmental exposure
- Stains or dirt
- Cracks caused by drops or impact
- Bending or deformation caused by misuse
- Damage caused by excessive force
- Damage caused by improper fitting or removal
- Damage caused by heat, chemicals, or liquids
- Cutting, drilling, modification, or alteration
- Gluing or attachment of unauthorized components
- Damage caused by misuse or negligence
- Physical damage occurring after delivery

15. Wrong or Damaged Mobile Case

If the customer receives:

- The wrong phone model
- The wrong colour/design/variant
- A visibly damaged product
- A product significantly different from the order

the customer should raise the matter under the LUXMO HUB 7-Day Return & Replacement Policy.

These delivery-related issues should not ordinarily be treated as a long-term warranty claim.

16. Mobile Case Warranty Claim

For an eligible warranty claim, LUXMO HUB may request:

- Order ID or invoice
- Product details
- Clear photographs
- Video showing the reported defect, where required
- Other reasonable evidence required for verification

LUXMO HUB may inspect the claim before approving a warranty replacement or other applicable remedy.

---

PART C — GENERAL WARRANTY TERMS

17. Warranty Does Not Replace the 7-Day Return Policy

The 7-Day Return & Replacement Policy and this Warranty Policy are separate.

Return / Replacement

Eligible delivery-related issues such as wrong, damaged, defective, or significantly different products should generally be reported within 7 calendar days from delivery, subject to the applicable Return & Replacement Policy.

Warranty

After the applicable return period, eligible manufacturing defects may be handled under this Warranty Policy and the applicable product-specific warranty terms.

18. Unboxing Video & Proof Requirement

For delivery-related claims involving transit damage, wrong products, missing items, or other delivery discrepancies, customers must comply with the LUXMO HUB Unboxing Video & Proof Requirement Policy.

LUXMO HUB may request:

- Continuous unboxing video
- Product photographs
- Packaging photographs
- Order information
- Serial number
- Installation photographs
- Wiring/protection details
- Other reasonable evidence

An unboxing video does not automatically guarantee approval of a claim. All claims remain subject to verification and applicable law.

19. Warranty Approval

Submitting a warranty request does not automatically mean that the warranty claim is approved.

Every warranty claim is subject to:

- Verification
- Technical inspection, where applicable
- Product condition
- Available evidence
- Applicable manufacturer/supplier terms
- This Warranty Policy

20. Warranty Resolution

Where a warranty claim is approved, LUXMO HUB may provide the applicable remedy depending on:

- Product category
- Nature of the defect
- Technical inspection results
- Availability of replacement parts/product
- Applicable manufacturer/supplier warranty terms

21. Warranty Transfer

Unless expressly stated otherwise, warranty coverage applies to the original purchaser and is not automatically transferable to another person.

22. Policy Updates

LUXMO HUB may update this Warranty Policy from time to time to reflect changes in products, manufacturers, warranty arrangements, or applicable requirements.

Any updated version of this policy will apply to purchases made on or after its effective date, unless otherwise required by applicable law.

---

Warranty Support

LUXMO HUB

Email: luxmohub@gmail.com
Phone: +91 75650 12418

For faster assistance, customers should keep their:

- Order invoice
- Product serial number, where applicable
- Photographs
- Videos
- Installation records, where applicable

available when contacting customer support.

---

Important Notice

This policy describes the standard warranty framework offered by LUXMO HUB.

Where a specific product page, sales invoice, manufacturer warranty card, or written product-specific warranty document provides different or additional warranty terms, the applicable product-specific terms will govern to the extent permitted by applicable law.

Nothing in this policy is intended to limit any rights or remedies available to customers under applicable law.

LUXMO HUB — Quality Products, Trusted by You.`;

const PolicyDocument = ({ text }) => (
  <div className="whitespace-pre-wrap leading-7 text-sm md:text-base text-slate-700">
    {text}
  </div>
);

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target.result);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};



/* ============================================================================
   LUXMO HUB — ECOMMERCE PRO SUITE
   ---------------------------------------------------------------------------
   This layer is intentionally additive. It does not remove the original
   catalogue, policies, Razorpay hooks, admin product editor, tax fields,
   product cards, or footer. It adds production-oriented customer and
   operations workflows that can later be connected to a real database/API.
   ============================================================================ */

const LUXMO_PRO_STORAGE = {
  wishlist: "luxmo_pro_wishlist",
  addresses: "luxmo_pro_addresses",
  customer: "luxmo_pro_customer",
  orders: "luxmo_pro_orders",
  reviews: "luxmo_pro_reviews",
  recentlyViewed: "luxmo_pro_recently_viewed",
  compare: "luxmo_pro_compare",
  newsletter: "luxmo_pro_newsletter",
  contacts: "luxmo_pro_contacts",
  cookie: "luxmo_pro_cookie_consent",
  theme: "luxmo_pro_theme",
  recentSearches: "luxmo_pro_recent_searches",
  notifications: "luxmo_pro_notifications",
  stockAlerts: "luxmo_pro_stock_alerts"
};

const LUXMO_COUPONS = [
  { code: "WELCOME5", type: "percent", value: 5, min: 499, maxDiscount: 500, label: "5% off on orders ₹499+" },
  { code: "LUXMO100", type: "flat", value: 100, min: 1999, maxDiscount: 100, label: "₹100 off on orders ₹1,999+" },
  { code: "SOLAR500", type: "flat", value: 500, min: 15000, maxDiscount: 500, category: "Hybrid Solar Inverter", label: "₹500 off eligible inverter orders" }
];

const LUXMO_SHIPPING_RULES = {
  mobile: { freeAbove: 999, standard: 79, express: 149, minDays: 4, maxDays: 8 },
  inverter: { freeAbove: 20000, standard: 499, express: 999, minDays: 5, maxDays: 12 },
  accessories: { freeAbove: 1499, standard: 99, express: 199, minDays: 4, maxDays: 9 }
};

const LUXMO_COURIER_PROVIDERS = [
  { id: "ithink", name: "iThink Logistics", mode: "Aggregator", enabled: true, priority: 1 },
  { id: "shiprocket", name: "Shiprocket", mode: "Aggregator", enabled: true, priority: 2 },
  { id: "delhivery", name: "Delhivery", mode: "Direct / Carrier", enabled: true, priority: 3 },
  { id: "amazon_shipping", name: "Amazon Shipping", mode: "Carrier", enabled: false, priority: 4 }
];

const LUXMO_DEFAULT_STORE_SETTINGS = {
  codEnabled: true,
  onlinePaymentEnabled: true,
  standardDeliveryEnabled: true,
  expressDeliveryEnabled: true,
  standardDeliveryRate: 79,
  expressDeliveryRate: 149,
  standardMinDays: 4,
  standardMaxDays: 8,
  expressMinDays: 3,
  expressMaxDays: 6,
  freeShippingAboveMobile: 999,
  freeShippingAboveInverter: 20000,
  freeShippingAboveAccessories: 1499
};

const LUXMO_STORE_SETTINGS_KEY = "luxmo_store_settings";

const luxmoNormalizeStoreSettings = (value = {}) => ({
  ...LUXMO_DEFAULT_STORE_SETTINGS,
  ...value,
  ...(safeReadJSON("luxmo_master_admin_settings_v2", {})?.shipping || {}),
  standardDeliveryRate: Math.max(0, Number(value.standardDeliveryRate ?? LUXMO_DEFAULT_STORE_SETTINGS.standardDeliveryRate)),
  expressDeliveryRate: Math.max(0, Number(value.expressDeliveryRate ?? LUXMO_DEFAULT_STORE_SETTINGS.expressDeliveryRate)),
  standardMinDays: Math.max(1, Number(value.standardMinDays ?? LUXMO_DEFAULT_STORE_SETTINGS.standardMinDays)),
  standardMaxDays: Math.max(1, Number(value.standardMaxDays ?? LUXMO_DEFAULT_STORE_SETTINGS.standardMaxDays)),
  expressMinDays: Math.max(1, Number(value.expressMinDays ?? LUXMO_DEFAULT_STORE_SETTINGS.expressMinDays)),
  expressMaxDays: Math.max(1, Number(value.expressMaxDays ?? LUXMO_DEFAULT_STORE_SETTINGS.expressMaxDays)),
  freeShippingAboveMobile: Math.max(0, Number(value.freeShippingAboveMobile ?? LUXMO_DEFAULT_STORE_SETTINGS.freeShippingAboveMobile)),
  freeShippingAboveInverter: Math.max(0, Number(value.freeShippingAboveInverter ?? LUXMO_DEFAULT_STORE_SETTINGS.freeShippingAboveInverter)),
  freeShippingAboveAccessories: Math.max(0, Number(value.freeShippingAboveAccessories ?? LUXMO_DEFAULT_STORE_SETTINGS.freeShippingAboveAccessories))
});

const LUXMO_PAYMENT_METHODS = [
  { id: "razorpay", label: "Online Payment", description: "UPI, cards, net banking and supported wallets" },
  { id: "cod", label: "Cash on Delivery", description: "Available only where COD serviceability and order rules allow" },
];

const LUXMO_ORDER_STATUSES = [
  "Pending Payment", "Confirmed", "Processing", "Packed", "Shipped", "In Transit", "Out for Delivery", "Delivered", "Cancelled", "RTO", "Returned", "Refunded"
];

const LUXMO_REVIEW_STATUS = ["Pending", "Published", "Rejected"];

const safeReadJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

const safeWriteJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    luxmoRemoteCustomerWrite(key, value);
    return true;
  } catch (e) {
    console.error("LUXMO storage error", key, e);
    return false;
  }
};

/* LUXMO HUB PRODUCTION DATA BRIDGE
   localStorage is cache/offline convenience only.
   Firestore through Vercel APIs is the production source of truth. */
const LUXMO_REMOTE_CUSTOMER_KEYS = new Set([
  "luxmo_pro_wishlist","luxmo_pro_addresses","luxmo_pro_customer",
  "luxmo_pro_recently_viewed","luxmo_pro_compare","luxmo_pro_stock_alerts"
]);
const luxmoApi = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    headers: { Accept: "application/json", ...(options.body ? {"Content-Type":"application/json"} : {}), ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || `API ${response.status}`);
  return data;
};
const luxmoEnsureCustomerSession = () =>
  fetch("/api/customer-session", { credentials:"include", headers:{Accept:"application/json"} }).catch(()=>null);
const luxmoLoadRazorpay = () => {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(window.Razorpay);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Razorpay));
      existing.addEventListener("error", () => reject(new Error("Razorpay checkout script failed to load.")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay checkout loaded but is unavailable."));
    script.onerror = () => reject(new Error("Razorpay checkout script failed to load."));
    document.body.appendChild(script);
  });
};

const luxmoRemoteCustomerWrite = (key,value) => {
  if (!LUXMO_REMOTE_CUSTOMER_KEYS.has(key)) return;
  luxmoApi("/api/customer-data", {method:"PUT",body:JSON.stringify({key,value})})
    .catch(error=>console.warn("Remote customer sync:",key,error.message));
};
const luxmoServerFirstProducts = async () => {
  try {
    const data = await luxmoApi("/api/products");
    return Array.isArray(data.products) && data.products.length ? data.products : null;
  } catch (error) {
    console.warn("Product API unavailable; using cached catalogue:",error.message);
    return null;
  }
};


const luxmoMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const luxmoDate = (value) => {
  try {
    return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch (e) {
    return "—";
  }
};

const luxmoOrderNumber = () => `LMH${new Date().getFullYear()}${String(Date.now()).slice(-8)}`;

const luxmoNormalizePincode = (value) => String(value || "").replace(/\D/g, "").slice(0, 6);

const luxmoValidateIndianMobile = (value) => /^[6-9]\d{9}$/.test(String(value || "").replace(/\D/g, ""));

const luxmoValidatePincode = (value) => /^[1-9]\d{5}$/.test(luxmoNormalizePincode(value));

const luxmoProductPrice = (product) => Number(product?.salePrice || product?.price || 0);

const luxmoProductStock = (product) => {
  if (Array.isArray(product?.variants) && product.variants.length) {
    return product.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
  }
  return Number(product?.stock || 0);
};

const luxmoProductKey = (product, variant) => variant ? `${product.id}::${variant.key}` : String(product.id);

const luxmoProductCategoryType = (product) => {
  if (product?.category === "Hybrid Solar Inverter") return "inverter";
  if (product?.category === "Solar Accessories") return "accessories";
  return "mobile";
};

const luxmoShippingEstimate = (items, mode = "standard", storeSettings = LUXMO_DEFAULT_STORE_SETTINGS) => {
  const settings = luxmoNormalizeStoreSettings(storeSettings);
  const hasInverter = items.some(item => item.category === "Hybrid Solar Inverter");
  const hasMobile = items.some(item => item.category === "Mobile Back Case");
  const hasAccessory = items.some(item => item.category === "Solar Accessories");
  const total = items.reduce((sum, item) => sum + luxmoProductPrice(item) * Number(item.qty || 1), 0);

  const freeAbove = hasInverter
    ? settings.freeShippingAboveInverter
    : hasAccessory && !hasMobile
      ? settings.freeShippingAboveAccessories
      : settings.freeShippingAboveMobile;

  if (mode === "express") {
    return {
      fee: total >= freeAbove ? 0 : settings.expressDeliveryRate,
      minDays: settings.expressMinDays,
      maxDays: Math.max(settings.expressMinDays, settings.expressMaxDays)
    };
  }

  return {
    fee: total >= freeAbove ? 0 : settings.standardDeliveryRate,
    minDays: settings.standardMinDays,
    maxDays: Math.max(settings.standardMinDays, settings.standardMaxDays)
  };
};

const luxmoCodEligibility = (items, subtotal, pincode, storeSettings = LUXMO_DEFAULT_STORE_SETTINGS) => {
  const settings = luxmoNormalizeStoreSettings(storeSettings);
  if (!settings.codEnabled) return { allowed: false, reason: "Cash on Delivery is currently unavailable." };
  if (!luxmoValidatePincode(pincode)) return { allowed: false, reason: "Enter a valid 6-digit pincode." };
  if (subtotal > 30000) return { allowed: false, reason: "Full COD is disabled for orders above ₹30,000. Use prepaid or eligible partial COD." };
  if (items.some(item => item.category === "Hybrid Solar Inverter") && subtotal > 10000) {
    return { allowed: false, reason: "High-value inverter orders require prepaid or partial COD." };
  }
  return { allowed: true, reason: "COD may be available subject to courier serviceability." };
};

const luxmoApplyCoupon = (couponCode, subtotal, items) => {
  const code = String(couponCode || "").trim().toUpperCase();
  if (!code) return { valid: false, discount: 0, message: "Enter a coupon code." };
  const managedCoupons = safeReadJSON("luxmo_master_admin_settings_v2", { coupons: LUXMO_COUPONS })?.coupons || LUXMO_COUPONS;
  const coupon = managedCoupons.find(c => c.code === code && c.enabled !== false);
  if (!coupon) return { valid: false, discount: 0, message: "Invalid coupon code." };
  if (subtotal < coupon.min) return { valid: false, discount: 0, message: `Minimum order value is ${luxmoMoney(coupon.min)}.` };
  if (coupon.category && !items.some(item => item.category === coupon.category)) return { valid: false, discount: 0, message: "This coupon is not applicable to the selected products." };
  const raw = coupon.type === "percent" ? subtotal * coupon.value / 100 : coupon.value;
  const discount = Math.min(raw, coupon.maxDiscount || raw, subtotal);
  return { valid: true, discount, coupon, message: `${coupon.label} applied.` };
};

const LUXMO_FAQ = [
  { q: "How can I select my phone model and colour?", a: "Open the product, choose your exact device model, then choose the available colour. The selected combination should be treated as a separate variant/SKU." },
  { q: "Do you support COD?", a: "COD can be offered for eligible orders and pincodes. High-value inverter orders should use prepaid or partial COD according to your business rules." },
  { q: "How can I track my order?", a: "Use the Orders area and enter the order ID/AWB. Once courier API integration is connected, the tracking status can be synchronized automatically." },
  { q: "What is the return period?", a: "The current website policy states a 7-day Return & Replacement process for eligible issues. Customers should review the complete policy before ordering." },
  { q: "What payment options are available?", a: "The checkout can support Razorpay online payment and eligible COD/partial COD flows." },
  { q: "How should a solar inverter be installed?", a: "Follow the applicable manufacturer manual and electrical safety requirements. Your current warranty policy requires appropriate installation and protection equipment for eligible claims." },
  { q: "Can I request a GST invoice?", a: "Yes. The checkout can collect GST details such as GSTIN and billing information when required, subject to backend invoice generation." },
  { q: "Can I save products for later?", a: "Yes. The Wishlist feature stores selected products locally until you connect a customer account/database." },
  { q: "How do I report a damaged delivery?", a: "Contact support promptly, keep the original packaging and provide photographs/video as requested by the applicable return policy." },
  { q: "Can I buy both phone cases and solar products?", a: "Yes. The catalog supports Mobile Back Case, Hybrid Solar Inverter and Solar Accessories as separate categories." }
];

const LUXMO_PROTECTED_FEATURES = [
  "Product catalogue and category management",
  "Model × colour variants",
  "SKU and stock controls",
  "Wishlist",
  "Product comparison",
  "Recently viewed products",
  "Coupon and promotion rules",
  "Customer profile and address book",
  "Checkout and payment selection",
  "COD eligibility rules",
  "Pincode/serviceability placeholder",
  "Order history",
  "Order tracking placeholder",
  "Review and rating workflow",
  "Stock alert subscriptions",
  "Contact and support tickets",
  "Newsletter subscription",
  "Invoice print view",
  "Admin operations dashboard",
  "Courier provider configuration",
  "SEO/structured-data helpers",
  "Cookie consent",
  "Accessibility controls",
  "Dark/light theme preference",
  "Recently searched terms",
  "Live order tracking modal (Order ID + mobile verification)",
  "WhatsApp quick order / inquiry modal",
  "Solar calculator / load estimator",
  "Warranty registration form",
  "Low-stock and inventory alert badge",
  "Store shipping settings panel",
  "Default store settings system",
  "Store settings persistent storage/key system",
  "Premium homepage sections",
  "Google Authenticator 6-digit TOTP admin authentication",
  "Secure HttpOnly admin session",
  "Secure admin logout"
];

function LuxmoRecentSearches({ terms = [], onSelect, onClear }) {
  if (!terms.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Search History</p>
          <h3 className="text-sm font-black text-slate-900">Recently searched terms</h3>
        </div>
        <button type="button" onClick={onClear} className="text-xs font-black text-red-600">Clear</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {terms.map(term => (
          <button
            type="button"
            key={term}
            onClick={() => onSelect(term)}
            className="rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}

function LuxmoProBadge({ children, tone = "blue" }) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200"
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[tone] || styles.blue}`}>{children}</span>;
}

function LuxmoSectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
      <div>
        {eyebrow && <div className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">{eyebrow}</div>}
        <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-1 max-w-3xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function LuxmoMetricCard({ label, value, hint, icon = "▣" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500">{label}</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{value}</div>
          {hint && <div className="text-[11px] text-slate-500 mt-1">{hint}</div>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white grid place-items-center font-black">{icon}</div>
      </div>
    </div>
  );
}

function LuxmoCustomerProfile({ customer, setCustomer }) {
  const [draft, setDraft] = useState(customer || { name: "", email: "", phone: "" });
  useEffect(() => setDraft(customer || { name: "", email: "", phone: "" }), [customer]);
  const save = () => {
    if (!draft.name.trim()) return alert("Please enter your name.");
    if (!luxmoValidateIndianMobile(draft.phone)) return alert("Please enter a valid 10-digit mobile number.");
    setCustomer(draft);
    safeWriteJSON(LUXMO_PRO_STORAGE.customer, draft);
    alert("Customer profile saved.");
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <LuxmoSectionTitle eyebrow="Account" title="Customer Profile" description="Save basic customer information for faster checkout." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Full name" className="border rounded-xl px-3 py-2.5 text-sm" />
        <input value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} placeholder="Email" type="email" className="border rounded-xl px-3 py-2.5 text-sm" />
        <input value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} placeholder="Mobile number" inputMode="numeric" className="border rounded-xl px-3 py-2.5 text-sm" />
      </div>
      <button onClick={save} className="mt-4 bg-slate-900 text-white rounded-xl px-5 py-2.5 text-sm font-bold">Save Profile</button>
    </div>
  );
}

function LuxmoAddressBook({ addresses, setAddresses }) {
  const empty = { id: "", label: "Home", name: "", phone: "", line1: "", line2: "", city: "", state: "Uttar Pradesh", pincode: "" };
  const [draft, setDraft] = useState(empty);
  const save = () => {
    if (!draft.name || !draft.line1 || !draft.city || !luxmoValidatePincode(draft.pincode) || !luxmoValidateIndianMobile(draft.phone)) {
      return alert("Please complete name, mobile, address, city and valid pincode.");
    }
    const next = [...addresses, { ...draft, id: `addr-${Date.now()}` }];
    setAddresses(next);
    safeWriteJSON(LUXMO_PRO_STORAGE.addresses, next);
    setDraft(empty);
  };
  const remove = id => {
    const next = addresses.filter(a => a.id !== id);
    setAddresses(next);
    safeWriteJSON(LUXMO_PRO_STORAGE.addresses, next);
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <LuxmoSectionTitle eyebrow="Checkout" title="Address Book" description="Save multiple delivery addresses for future orders." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries({ label: "Label", name: "Full name", phone: "Mobile", line1: "Address line 1", line2: "Address line 2", city: "City", state: "State", pincode: "Pincode" }).map(([key, label]) => (
          <input key={key} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} placeholder={label} className="border rounded-xl px-3 py-2.5 text-sm" inputMode={key === "phone" || key === "pincode" ? "numeric" : undefined} />
        ))}
      </div>
      <button onClick={save} className="mt-4 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-bold">Save Address</button>
      <div className="mt-5 space-y-3">
        {addresses.length === 0 ? <div className="text-sm text-slate-500">No saved addresses yet.</div> : addresses.map(address => (
          <div key={address.id} className="border rounded-xl p-4 flex items-start justify-between gap-3">
            <div><div className="font-black text-sm">{address.label} · {address.name}</div><div className="text-xs text-slate-600 mt-1">{address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} - {address.pincode}</div><div className="text-xs text-slate-500 mt-1">{address.phone}</div></div>
            <button onClick={() => remove(address.id)} className="text-red-600 text-xs font-bold">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LuxmoWishlist({ products, wishlist, setWishlist, onSelect, onAddToCart }) {
  const items = products.filter(p => wishlist.includes(p.id));
  const toggle = id => {
    const next = wishlist.includes(id) ? wishlist.filter(x => x !== id) : [...wishlist, id];
    setWishlist(next);
    safeWriteJSON(LUXMO_PRO_STORAGE.wishlist, next);
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <LuxmoSectionTitle eyebrow="Saved" title="Wishlist" description="Keep products you may want to purchase later." />
      {items.length === 0 ? <div className="py-10 text-center text-sm text-slate-500">Your wishlist is empty.</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map(p => (
            <div key={p.id} className="border rounded-2xl overflow-hidden bg-white">
              <button onClick={() => onSelect(p)} className="block w-full"><img src={p.images?.[0] || p.image} alt={p.title} className="w-full aspect-square object-cover" /></button>
              <div className="p-3"><div className="font-bold text-sm line-clamp-2">{p.title}</div><div className="font-black mt-2">{luxmoMoney(luxmoProductPrice(p))}</div><div className="flex gap-2 mt-3"><button onClick={() => onAddToCart(p)} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-xs font-bold">Add to Cart</button><button onClick={() => toggle(p.id)} className="px-3 border rounded-lg text-xs">♥</button></div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LuxmoCompare({ products, compareIds, setCompareIds, onSelect }) {
  const items = products.filter(p => compareIds.includes(p.id));
  const toggle = id => {
    if (compareIds.includes(id)) return setCompareIds(compareIds.filter(x => x !== id));
    if (compareIds.length >= 4) return alert("You can compare up to 4 products.");
    setCompareIds([...compareIds, id]);
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <LuxmoSectionTitle eyebrow="Decision tools" title="Product Compare" description="Compare up to four products side by side." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {products.slice(0, 20).map(p => <button key={p.id} onClick={() => toggle(p.id)} className={`text-left border rounded-xl p-3 ${compareIds.includes(p.id) ? "border-blue-600 bg-blue-50" : "border-slate-200"}`}><div className="font-bold text-xs line-clamp-2">{p.title}</div><div className="text-xs mt-1">{luxmoMoney(luxmoProductPrice(p))}</div></button>)}
      </div>
      {items.length > 0 && <div className="mt-6 overflow-auto"><table className="w-full text-xs border-collapse"><thead><tr>{items.map(p => <th key={p.id} className="border p-3 text-left min-w-48">{p.title}</th>)}</tr></thead><tbody><tr>{items.map(p => <td key={p.id} className="border p-3 align-top"><div><b>Category:</b> {p.category}</div><div className="mt-1"><b>Model:</b> {p.model}</div><div className="mt-1"><b>Price:</b> {luxmoMoney(luxmoProductPrice(p))}</div><div className="mt-1"><b>Stock:</b> {luxmoProductStock(p)}</div><div className="mt-1"><b>SKU:</b> {p.sku || "—"}</div><button onClick={() => onSelect(p)} className="mt-3 text-blue-600 font-bold">View Product</button></td>)}</tr></tbody></table></div>}
    </div>
  );
}

function LuxmoRecentlyViewed({ products, ids, onSelect, onClear }) {
  const items = ids.map(id => products.find(p => p.id === id)).filter(Boolean);
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><LuxmoSectionTitle eyebrow="History" title="Recently Viewed" action={items.length ? <button onClick={onClear} className="text-xs font-bold text-red-600">Clear</button> : null} />{items.length === 0 ? <p className="text-sm text-slate-500">Products you view will appear here.</p> : <div className="flex gap-3 overflow-x-auto pb-2">{items.map(p => <button key={p.id} onClick={() => onSelect(p)} className="w-44 shrink-0 border rounded-xl overflow-hidden text-left"><img src={p.images?.[0] || p.image} alt={p.title} className="w-full h-32 object-cover"/><div className="p-2"><div className="text-xs font-bold line-clamp-2">{p.title}</div><div className="text-xs font-black mt-1">{luxmoMoney(luxmoProductPrice(p))}</div></div></button>)}</div>}</div>;
}

function LuxmoCouponBox({ subtotal, items, onDiscountChange }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const apply = () => {
    const result = luxmoApplyCoupon(code, subtotal, items);
    setMessage(result.message);
    onDiscountChange(result.valid ? result.discount : 0, result.valid ? result.coupon.code : "");
  };
  return <div className="border rounded-xl p-4 bg-slate-50"><div className="text-sm font-black">Have a coupon?</div><div className="flex gap-2 mt-2"><input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white"/><button onClick={apply} className="bg-slate-900 text-white rounded-lg px-4 text-xs font-bold">Apply</button></div>{message && <div className="text-xs mt-2 text-slate-600">{message}</div>}<div className="flex flex-wrap gap-2 mt-3">{LUXMO_COUPONS.map(c => <button key={c.code} onClick={() => setCode(c.code)} className="text-[10px] border rounded-full px-2 py-1 bg-white">{c.code}</button>)}</div></div>;
}

function LuxmoPincodeChecker({ cartItems }) {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState(null);
  const check = () => {
    const pin = luxmoNormalizePincode(pincode);
    if (!luxmoValidatePincode(pin)) return setResult({ ok: false, message: "Please enter a valid 6-digit pincode." });
    const estimate = luxmoShippingEstimate(cartItems.length ? cartItems : [{ category: "Mobile Back Case", price: 999, qty: 1 }]);
    setResult({ ok: true, message: `Estimated standard delivery: ${estimate.minDays}–${estimate.maxDays} business days. Final courier availability will be confirmed by the shipping provider.` });
  };
  return <div className="border rounded-xl p-4"><div className="font-black text-sm">Check Delivery Availability</div><div className="flex gap-2 mt-2"><input value={pincode} onChange={e => setPincode(e.target.value)} maxLength={6} inputMode="numeric" placeholder="6-digit pincode" className="flex-1 border rounded-lg px-3 py-2 text-sm"/><button onClick={check} className="bg-blue-600 text-white rounded-lg px-4 text-xs font-bold">Check</button></div>{result && <div className={`mt-2 text-xs ${result.ok ? "text-emerald-700" : "text-red-600"}`}>{result.message}</div>}</div>;
}

function LuxmoStoreSettingsPanel({ settings, setSettings }) {
  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
  const save = () => {
    const normalized = luxmoNormalizeStoreSettings(settings);
    setSettings(normalized);
    safeWriteJSON(LUXMO_STORE_SETTINGS_KEY, normalized);
    alert("Shipping & payment settings saved successfully.");
  };
  const numberField = (key, label, suffix = "₹") => (
    <label className="block">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <div className="flex items-center mt-1">
        {suffix === "₹" && <span className="px-3 py-2.5 bg-slate-100 border border-r-0 rounded-l-lg text-sm">₹</span>}
        <input type="number" min="0" value={settings[key]} onChange={e => update(key, e.target.value)}
          className={`w-full px-3 py-2.5 bg-white text-slate-900 border border-slate-300 ${suffix === "₹" ? "rounded-r-lg" : "rounded-lg"} text-sm`} />
      </div>
    </label>
  );
  const toggle = (key, title, description) => (
    <label className="flex items-center justify-between gap-4 border rounded-xl p-3 bg-white cursor-pointer">
      <div><div className="font-bold text-sm">{title}</div><div className="text-[11px] text-slate-500 mt-1">{description}</div></div>
      <input type="checkbox" checked={!!settings[key]} onChange={e => update(key, e.target.checked)} className="w-5 h-5 accent-blue-600" />
    </label>
  );
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <LuxmoSectionTitle eyebrow="Admin Settings" title="Shipping & Payment Controls" description="Change COD availability and delivery charges without editing App.jsx." />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {toggle("codEnabled","Cash on Delivery","Show or hide COD for customers.")}
      {toggle("onlinePaymentEnabled","Online Payment","Show or hide Razorpay/online payment.")}
      {toggle("standardDeliveryEnabled","Standard Delivery","Show or hide Standard Delivery at checkout.")}
      {toggle("expressDeliveryEnabled","Express Delivery","Show or hide Express Delivery at checkout.")}
    </div>
    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border rounded-2xl p-4 bg-slate-50">
        <h3 className="font-black text-sm">Standard Delivery</h3>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {numberField("standardDeliveryRate","Rate")}
          {numberField("standardMinDays","Minimum days","days")}
          {numberField("standardMaxDays","Maximum days","days")}
        </div>
      </div>
      <div className="border rounded-2xl p-4 bg-slate-50">
        <h3 className="font-black text-sm">Express Delivery</h3>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {numberField("expressDeliveryRate","Rate")}
          {numberField("expressMinDays","Minimum days","days")}
          {numberField("expressMaxDays","Maximum days","days")}
        </div>
      </div>
    </div>
    <div className="mt-4 border rounded-2xl p-4 bg-slate-50">
      <h3 className="font-black text-sm">Free Shipping Thresholds</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        {numberField("freeShippingAboveMobile","Mobile Cases free above")}
        {numberField("freeShippingAboveInverter","Inverter free above")}
        {numberField("freeShippingAboveAccessories","Accessories free above")}
      </div>
    </div>
    <div className="mt-4 flex justify-end">
      <button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-sm font-black">Save Settings</button>
    </div>
  </div>;
}

function LuxmoCheckout({ cart, subtotal, customer, addresses, onOrderCreated, onClose, storeSettings }) {
  const [selectedAddress, setSelectedAddress] = useState(addresses[0]?.id || "");
  const [draft, setDraft] = useState(() => {
    const initial = addresses[0] || { name: customer?.name || "", phone: customer?.phone || "", line1: "", line2: "", city: "", state: "Uttar Pradesh", pincode: "" };
    return { ...initial, pincode: luxmoNormalizePincode(initial.pincode) };
  });
  const [payment, setPayment] = useState(storeSettings.onlinePaymentEnabled ? "razorpay" : "cod");
  const [shippingMode, setShippingMode] = useState(storeSettings.standardDeliveryEnabled ? "standard" : "express");
  const [discount, setDiscount] = useState(0);
  const [coupon, setCoupon] = useState("");
  const managedPaymentMethods = safeReadJSON("luxmo_master_admin_settings_v2", { paymentMethods: LUXMO_PAYMENT_METHODS })?.paymentMethods || LUXMO_PAYMENT_METHODS;
  const effectiveShippingMode =
    shippingMode === "express" && storeSettings.expressDeliveryEnabled
      ? "express"
      : storeSettings.standardDeliveryEnabled
        ? "standard"
        : "express";
  const shipping = luxmoShippingEstimate(cart, effectiveShippingMode, storeSettings);
  const total = Math.max(0, subtotal - discount + shipping.fee);
  const cod = luxmoCodEligibility(cart, subtotal, draft.pincode, storeSettings);
  const submit = () => {
    if (!draft.name.trim() || !luxmoValidateIndianMobile(draft.phone) || !draft.line1.trim() || !draft.city.trim() || !luxmoValidatePincode(draft.pincode)) return alert("Please complete valid delivery details.");
    if (payment === "cod" && !cod.allowed) return alert(cod.reason);
    if (!storeSettings.standardDeliveryEnabled && !storeSettings.expressDeliveryEnabled) {
      return alert("Delivery is currently unavailable. Please contact LUXMO HUB support.");
    }
    const order = {
      id: luxmoOrderNumber(),
      createdAt: new Date().toISOString(),
      status: payment === "razorpay" ? "Pending Payment" : "Confirmed",
      paymentMethod: payment,
      paymentStatus: payment === "razorpay" ? "Pending" : "Pending Collection",
      items: cart.map(item => ({ id: item.id, title: item.title, qty: item.qty, price: luxmoProductPrice(item), model: item.model, colour: item.colour, sku: item.sku })),
      subtotal,
      discount,
      coupon,
      shippingFee: shipping.fee,
      total,
      shippingMode,
      address: draft,
      courierProvider: "Pending Assignment",
      awb: "",
      trackingUrl: ""
    };
    onOrderCreated(order);
  };
  return <div className="fixed inset-0 z-[70] bg-black/50 p-3 md:p-8 overflow-auto"><div className="max-w-5xl mx-auto bg-slate-50 rounded-3xl shadow-2xl overflow-hidden"><div className="bg-slate-950 text-white p-5 flex items-center justify-between"><div><div className="text-xs uppercase tracking-widest text-slate-400">LUXMO HUB</div><h2 className="text-xl font-black">Secure Checkout</h2></div><button onClick={onClose} className="text-white text-2xl">×</button></div><div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5"><div className="lg:col-span-2 space-y-5"><div className="bg-white border rounded-2xl p-5"><h3 className="font-black">Delivery Address</h3>{addresses.length > 0 && <select value={selectedAddress} onChange={e => { setSelectedAddress(e.target.value); const a = addresses.find(x => x.id === e.target.value); if (a) setDraft({ ...a, pincode: luxmoNormalizePincode(a.pincode) }); }} className="w-full mt-3 border rounded-xl px-3 py-2.5 text-sm"><option value="">Enter new address</option>{addresses.map(a => <option key={a.id} value={a.id}>{a.label} — {a.name}, {a.pincode}</option>)}</select>}<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">{[["name","Full name"],["phone","Mobile"],["line1","Address"],["line2","Address line 2"],["city","City"],["state","State"]].map(([key,label]) => <input key={key} value={draft[key] || ""} onChange={e => setDraft({ ...draft, [key]: e.target.value })} placeholder={label} className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />)}<input key="pincode" type="text" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={draft.pincode || ""} onChange={e => setDraft({ ...draft, pincode: luxmoNormalizePincode(e.target.value) })} placeholder="6-digit Pincode" aria-label="6-digit Pincode" className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div></div><div className="bg-white border rounded-2xl p-5"><h3 className="font-black">Shipping Method</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">{[["standard","Standard Delivery",storeSettings.standardDeliveryEnabled],["express","Express Delivery",storeSettings.expressDeliveryEnabled]].filter(([, ,enabled]) => enabled).map(([id,label]) => { const estimate = luxmoShippingEstimate(cart,id,storeSettings); return <button key={id} onClick={() => setShippingMode(id)} className={`text-left border rounded-xl p-3 ${effectiveShippingMode === id ? "border-blue-600 bg-blue-50" : ""}`}><div className="font-bold text-sm">{label}</div><div className="text-xs text-slate-500 mt-1">{estimate.fee ? luxmoMoney(estimate.fee) : "FREE"} · {estimate.minDays}–{estimate.maxDays} business days</div></button>; })}</div></div><div className="bg-white border rounded-2xl p-5"><h3 className="font-black">Payment Method</h3><div className="space-y-2 mt-3">{managedPaymentMethods.filter(m => m.enabled !== false && (m.id === "razorpay" ? storeSettings.onlinePaymentEnabled : m.id === "cod" ? storeSettings.codEnabled : false)).map(m => <button key={m.id} onClick={() => setPayment(m.id)} className={`w-full text-left border rounded-xl p-3 ${payment === m.id ? "border-blue-600 bg-blue-50" : ""}`}><div className="font-bold text-sm">{m.label}</div><div className="text-xs text-slate-500">{m.description}</div></button>)}</div>{payment === "cod" && <div className={`mt-3 rounded-xl p-3 text-xs ${cod.allowed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{cod.reason}</div>}{payment === "partial_cod" && <div className="mt-3 bg-amber-50 text-amber-800 rounded-xl p-3 text-xs">Partial COD should be implemented with a verified payment gateway order and server-side balance calculation before production use.</div>}</div></div><div className="bg-white border rounded-2xl p-5 h-fit sticky top-3"><h3 className="font-black">Order Summary</h3><div className="space-y-2 mt-4">{cart.map(item => <div key={item.cartKey || item.id} className="flex justify-between gap-3 text-xs"><span>{item.title} × {item.qty}{item.model ? ` · ${item.model}` : ""}{item.colour ? ` · ${item.colour}` : ""}</span><b>{luxmoMoney(luxmoProductPrice(item)*item.qty)}</b></div>)}</div><div className="border-t mt-4 pt-4 space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><b>{luxmoMoney(subtotal)}</b></div><div className="flex justify-between"><span>Discount</span><b>-{luxmoMoney(discount)}</b></div><div className="flex justify-between"><span>Shipping</span><b>{shipping.fee ? luxmoMoney(shipping.fee) : "FREE"}</b></div><div className="flex justify-between text-lg font-black pt-2"><span>Total</span><b className="text-blue-600">{luxmoMoney(total)}</b></div></div><LuxmoPincodeChecker cartItems={cart}/><button onClick={submit} className="w-full mt-4 bg-blue-600 text-white rounded-xl py-3 font-black">Place {payment === "razorpay" ? "Online" : "COD"} Order</button><p className="text-[10px] text-slate-500 mt-3">Production payment and courier operations must be verified server-side before dispatch.</p></div></div></div></div>;
}

function LuxmoOrderCenter({ orders, setOrders }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const filtered = orders.filter(o => !query || `${o.id} ${o.status} ${o.awb || ""}`.toLowerCase().includes(query.toLowerCase()));
  const updateStatus = (id, status) => { const next = orders.map(o => o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o); setOrders(next); safeWriteJSON(LUXMO_PRO_STORAGE.orders, next); };
  const printInvoice = order => { const w = window.open("", "_blank", "width=900,height=900"); if (!w) return; w.document.write(`<html><head><title>${order.id} Invoice</title><style>body{font-family:Arial;padding:40px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:10px;text-align:left}</style></head><body><h1>LUXMO HUB</h1><p>Order: ${order.id}<br/>Date: ${luxmoDate(order.createdAt)}</p><p>${order.address?.name || ""}<br/>${order.address?.line1 || ""}, ${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.pincode || ""}</p><table><tr><th>Product</th><th>Qty</th><th>Price</th></tr>${order.items.map(i=>`<tr><td>${i.title} ${i.model||""} ${i.colour||""}</td><td>${i.qty}</td><td>${luxmoMoney(i.price*i.qty)}</td></tr>`).join("")}<tr><th colspan="2">Total</th><th>${luxmoMoney(order.total)}</th></tr></table><p>Payment: ${order.paymentMethod}</p></body></html>`); w.document.close(); w.focus(); w.print(); };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><LuxmoSectionTitle eyebrow="Orders" title="Order Center" description="View order status, payment state, courier assignment and invoice print views."/><div className="flex gap-2 mb-4"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search order ID / AWB / status" className="flex-1 border rounded-xl px-3 py-2.5 text-sm"/></div>{filtered.length===0?<div className="text-sm text-slate-500 py-8 text-center">No orders found.</div>:<div className="space-y-3">{filtered.map(o=><div key={o.id} className="border rounded-2xl p-4"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><div className="font-black text-sm">{o.id}</div><div className="text-xs text-slate-500">{luxmoDate(o.createdAt)} · {o.paymentMethod}</div></div><div className="flex items-center gap-2"><select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)} className="border rounded-lg px-2 py-1.5 text-xs">{LUXMO_ORDER_STATUSES.map(s=><option key={s}>{s}</option>)}</select><button onClick={()=>setSelected(selected===o.id?null:o.id)} className="border rounded-lg px-3 py-1.5 text-xs font-bold">Details</button><button onClick={()=>printInvoice(o)} className="bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-bold">Invoice</button></div></div>{selected===o.id&&<div className="mt-4 bg-slate-50 rounded-xl p-4 text-xs grid grid-cols-1 md:grid-cols-3 gap-4"><div><b>Items</b>{o.items?.map((i,idx)=><div key={idx} className="mt-1">{i.title} × {i.qty}<br/>{i.model} {i.colour}</div>)}</div><div><b>Delivery</b><div className="mt-1">{o.address?.name}<br/>{o.address?.line1}<br/>{o.address?.city}, {o.address?.state} - {o.address?.pincode}<br/>{o.address?.phone}</div></div><div><b>Shipment</b><div className="mt-1">Provider: {o.courierProvider || "Pending"}<br/>AWB: {o.awb || "Pending"}<br/>Status: {o.status}</div></div></div>}</div>)}</div>}</div>;
}

function LuxmoReviewCenter({ products, reviews, setReviews }) {
  const [draft, setDraft] = useState({ productId: products[0]?.id || "", name: "", rating: 5, text: "" });
  const submit = () => { if (!draft.productId || !draft.name.trim() || !draft.text.trim()) return alert("Please select a product and complete your review."); const review = { ...draft, id: `rev-${Date.now()}`, createdAt: new Date().toISOString(), status: "Pending" }; const next=[review,...reviews]; setReviews(next); safeWriteJSON(LUXMO_PRO_STORAGE.reviews,next); setDraft({ ...draft, name:"", text:"" }); alert("Review submitted for moderation."); };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><LuxmoSectionTitle eyebrow="Social proof" title="Ratings & Reviews" description="Customer reviews can be submitted and moderated before publication."/><div className="grid grid-cols-1 md:grid-cols-4 gap-3"><select value={draft.productId} onChange={e=>setDraft({...draft,productId:e.target.value})} className="border rounded-xl px-3 py-2.5 text-sm">{products.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select><input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Your name" className="border rounded-xl px-3 py-2.5 text-sm"/><select value={draft.rating} onChange={e=>setDraft({...draft,rating:Number(e.target.value)})} className="border rounded-xl px-3 py-2.5 text-sm">{[5,4,3,2,1].map(x=><option key={x} value={x}>{x} Star</option>)}</select><button onClick={submit} className="bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-bold">Submit Review</button></div><textarea value={draft.text} onChange={e=>setDraft({...draft,text:e.target.value})} placeholder="Write your review" className="w-full border rounded-xl px-3 py-2.5 text-sm mt-3 min-h-28"/><div className="mt-5 space-y-2">{reviews.slice(0,10).map(r=><div key={r.id} className="border rounded-xl p-3 text-xs"><div className="flex justify-between"><b>{r.name}</b><span>{"★".repeat(Number(r.rating||5))}</span></div><div className="text-slate-600 mt-1">{r.text}</div><LuxmoProBadge tone={r.status === "Published" ? "green" : r.status === "Rejected" ? "red" : "amber"}>{r.status}</LuxmoProBadge></div>)}</div></div>;
}

function LuxmoStockAlerts({ products, alerts, setAlerts }) {
  const [email, setEmail] = useState("");
  const [productId, setProductId] = useState(products[0]?.id || "");
  const save = () => { if (!email.includes("@") || !productId) return alert("Enter a valid email and product."); const next=[...alerts,{id:`alert-${Date.now()}`,email,productId,createdAt:new Date().toISOString()}]; setAlerts(next); safeWriteJSON(LUXMO_PRO_STORAGE.stockAlerts,next); setEmail(""); alert("Stock alert preference saved."); };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><LuxmoSectionTitle eyebrow="Inventory" title="Back-in-Stock Alerts" description="Collect customer interest when a product is unavailable."/><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><select value={productId} onChange={e=>setProductId(e.target.value)} className="border rounded-xl px-3 py-2.5 text-sm">{products.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" className="border rounded-xl px-3 py-2.5 text-sm"/><button onClick={save} className="bg-slate-900 text-white rounded-xl px-4 py-2.5 text-sm font-bold">Notify Me</button></div></div>;
}

function LuxmoContactCenter() {
  const [form, setForm] = useState({ name:"", email:"", phone:"", subject:"Order / Product Query", message:"" });
  const submit = () => { if (!form.name || !form.email || !form.message) return alert("Please complete the required fields."); const existing=safeReadJSON(LUXMO_PRO_STORAGE.contacts,[]); safeWriteJSON(LUXMO_PRO_STORAGE.contacts,[{...form,id:`ticket-${Date.now()}`,createdAt:new Date().toISOString(),status:"Open"},...existing]); alert("Support request submitted."); setForm({...form,name:"",email:"",phone:"",message:""}); };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><LuxmoSectionTitle eyebrow="Support" title="Contact & Support" description="Create a customer support request without leaving the website."/><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{[["name","Name"],["email","Email"],["phone","Phone"],["subject","Subject"]].map(([k,l])=><input key={k} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={l} className="border rounded-xl px-3 py-2.5 text-sm"/> )}</div><textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="How can we help?" className="w-full border rounded-xl px-3 py-2.5 text-sm mt-3 min-h-32"/><button onClick={submit} className="mt-3 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-bold">Submit Support Request</button></div>;
}

function LuxmoNewsletter() {
  const [email,setEmail]=useState(""); const submit=()=>{if(!email.includes("@"))return alert("Enter a valid email.");const next=Array.from(new Set([...safeReadJSON(LUXMO_PRO_STORAGE.newsletter,[]),email]));safeWriteJSON(LUXMO_PRO_STORAGE.newsletter,next);setEmail("");alert("You are subscribed to Luxmo Hub updates.");};
  return <div className="rounded-2xl bg-slate-950 text-white p-6"><div className="text-xs font-black uppercase tracking-widest text-amber-400">Stay Updated</div><h3 className="text-xl font-black mt-1">New products, offers & updates</h3><div className="flex gap-2 mt-4 max-w-xl"><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your email" className="flex-1 rounded-xl px-3 py-2.5 text-sm text-slate-900"/><button onClick={submit} className="bg-amber-400 text-slate-950 rounded-xl px-4 font-black text-sm">Subscribe</button></div></div>;
}

function LuxmoFAQ() {
  const [open,setOpen]=useState(0); return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><LuxmoSectionTitle eyebrow="Help" title="Frequently Asked Questions" description="Quick answers for common shopping and support questions."/><div className="space-y-2">{LUXMO_FAQ.map((f,i)=><div key={i} className="border rounded-xl overflow-hidden"><button onClick={()=>setOpen(open===i?-1:i)} className="w-full flex justify-between gap-3 text-left p-4 text-sm font-bold"><span>{f.q}</span><span>{open===i?"−":"+"}</span></button>{open===i&&<div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed">{f.a}</div>}</div>)}</div></div>;
}

function LuxmoCourierSettings({ settings, setSettings }) {
  const toggle = id => { const next=settings.map(x=>x.id===id?{...x,enabled:!x.enabled}:x); setSettings(next); safeWriteJSON("luxmo_pro_couriers",next); };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><LuxmoSectionTitle eyebrow="Shipping" title="Courier Partner Settings" description="Configure the providers you plan to connect through server-side APIs."/><div className="space-y-3">{settings.map(c=><div key={c.id} className="border rounded-xl p-4 flex items-center justify-between"><div><div className="font-black text-sm">{c.name}</div><div className="text-xs text-slate-500">{c.mode} · Priority {c.priority}</div></div><button onClick={()=>toggle(c.id)} className={`rounded-full px-4 py-2 text-xs font-black ${c.enabled?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{c.enabled?"Enabled":"Disabled"}</button></div>)}</div><div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">API credentials must remain server-side in Vercel environment variables. Do not expose courier secrets in browser code.</div></div>;
}

function LuxmoAnalytics({ products, orders, reviews, alerts }) {
  const revenue=orders.filter(o=>!['Cancelled','RTO','Returned','Refunded'].includes(o.status)).reduce((s,o)=>s+Number(o.total||0),0);
  const delivered=orders.filter(o=>o.status==='Delivered').length;
  const lowStock=products.filter(p=>luxmoProductStock(p)<=5).length;
  const pendingReviews=reviews.filter(r=>r.status==='Pending').length;
  return <div className="space-y-5 min-w-0"><LuxmoSectionTitle eyebrow="Business" title="Store Analytics" description="Local operational dashboard. Connect a database/analytics provider for production reporting."/><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><LuxmoMetricCard label="Orders" value={orders.length} icon="▤"/><LuxmoMetricCard label="Gross Order Value" value={luxmoMoney(revenue)} icon="₹"/><LuxmoMetricCard label="Delivered" value={delivered} icon="✓"/><LuxmoMetricCard label="Low Stock" value={lowStock} icon="!"/></div><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div className="bg-white border rounded-2xl p-5"><h3 className="font-black">Operational Alerts</h3><div className="mt-3 space-y-2 text-xs"><div className="flex justify-between"><span>Pending review moderation</span><b>{pendingReviews}</b></div><div className="flex justify-between"><span>Stock alert subscriptions</span><b>{alerts.length}</b></div><div className="flex justify-between"><span>Orders needing shipment assignment</span><b>{orders.filter(o=>!o.awb).length}</b></div></div></div><div className="bg-white border rounded-2xl p-5"><h3 className="font-black">Product Categories</h3><div className="mt-3 space-y-2 text-xs">{CATEGORIES.map(c=><div key={c} className="flex justify-between"><span>{c}</span><b>{products.filter(p=>p.category===c).length}</b></div>)}</div></div></div></div>;
}

function LuxmoSeoTools({ products }) {
  const title = "LUXMO HUB | Hybrid Solar Inverters & Premium Mobile Phone Cases";
  const description = "Shop hybrid solar inverters, solar accessories and premium mobile phone back case covers from LUXMO HUB.";
  const copy = text => { navigator.clipboard?.writeText(text); alert("Copied to clipboard."); };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><LuxmoSectionTitle eyebrow="Growth" title="SEO & Sharing Tools" description="Useful content blocks for page metadata, social sharing and structured product information."/><div className="space-y-3"><div><label className="text-xs font-bold">Suggested SEO Title</label><div className="flex gap-2 mt-1"><input readOnly value={title} className="flex-1 border rounded-xl px-3 py-2 text-sm"/><button onClick={()=>copy(title)} className="border rounded-xl px-3 text-xs font-bold">Copy</button></div></div><div><label className="text-xs font-bold">Suggested Meta Description</label><div className="flex gap-2 mt-1"><textarea readOnly value={description} className="flex-1 border rounded-xl px-3 py-2 text-sm"/><button onClick={()=>copy(description)} className="border rounded-xl px-3 text-xs font-bold">Copy</button></div></div><div className="bg-slate-50 rounded-xl p-3 text-xs"><b>Structured-data reminder:</b> Product pages should emit Product, Offer, AggregateRating (only when genuine ratings exist), BreadcrumbList and Organization JSON-LD from the server-rendered page.</div><div className="text-xs text-slate-500">Current catalogue count: {products.length}</div></div></div>;
}

function LuxmoCookieConsent() {
  const [visible,setVisible]=useState(()=>!localStorage.getItem(LUXMO_PRO_STORAGE.cookie));
  if(!visible)return null;
  const save=choice=>{localStorage.setItem(LUXMO_PRO_STORAGE.cookie,choice);setVisible(false);};
  return <div className="fixed bottom-3 left-3 right-3 md:left-auto md:max-w-xl z-[90] bg-white border border-slate-300 rounded-2xl shadow-2xl p-4"><div className="font-black text-sm">Privacy & Cookies</div><p className="text-xs text-slate-600 mt-1">This website may use essential storage for cart, preferences and checkout. Analytics/marketing cookies should be enabled only after appropriate consent and implementation.</p><div className="flex gap-2 mt-3"><button onClick={()=>save("essential")} className="border rounded-lg px-3 py-2 text-xs font-bold">Essential Only</button><button onClick={()=>save("all")} className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs font-bold">Accept</button></div></div>;
}

function LuxmoFeatureChecklist() {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><LuxmoSectionTitle eyebrow="Readiness" title="Ecommerce Feature Checklist" description="A practical checklist for the Luxmo Hub storefront."/><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{LUXMO_PROTECTED_FEATURES.map((f,i)=><div key={f} className="flex gap-2 items-center border rounded-xl px-3 py-2.5 text-xs"><span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center font-black">✓</span><span>{f}</span></div>)}</div></div>;
}

function LuxmoProSuite({ products, cart, addToCart, onSelectProduct, isAdminLoggedIn, onPay, siteTheme, setSiteTheme }) {
  const [tab,setTab]=useState("overview");
  const [wishlist,setWishlist]=useState(()=>safeReadJSON(LUXMO_PRO_STORAGE.wishlist,[]));
  const [addresses,setAddresses]=useState(()=>safeReadJSON(LUXMO_PRO_STORAGE.addresses,[]));
  const [customer,setCustomer]=useState(()=>safeReadJSON(LUXMO_PRO_STORAGE.customer,{name:"",email:"",phone:""}));
  const [orders,setOrders]=useState(()=>safeReadJSON(LUXMO_PRO_STORAGE.orders,[]));
  const [reviews,setReviews]=useState(()=>safeReadJSON(LUXMO_PRO_STORAGE.reviews,[]));
  const [recent,setRecent]=useState(()=>safeReadJSON(LUXMO_PRO_STORAGE.recentlyViewed,[]));
  const [compare,setCompare]=useState(()=>safeReadJSON(LUXMO_PRO_STORAGE.compare,[]));
  const [alerts,setAlerts]=useState(()=>safeReadJSON(LUXMO_PRO_STORAGE.stockAlerts,[]));
  const [couriers,setCouriers]=useState(()=>safeReadJSON("luxmo_pro_couriers",LUXMO_COURIER_PROVIDERS));
  const [storeSettings,setStoreSettings]=useState(()=>luxmoNormalizeStoreSettings(safeReadJSON(LUXMO_STORE_SETTINGS_KEY,LUXMO_DEFAULT_STORE_SETTINGS)));

  useEffect(() => {
    let cancelled = false;
    luxmoApi("/api/customer-data").then(data => {
      if (cancelled) return;
      const d = data.data || {};
      if (Array.isArray(d.wishlist)) setWishlist(d.wishlist);
      if (Array.isArray(d.addresses)) setAddresses(d.addresses);
      if (d.customer && typeof d.customer === "object") setCustomer(d.customer);
      if (Array.isArray(d.recentlyViewed)) setRecent(d.recentlyViewed);
      if (Array.isArray(d.compare)) setCompare(d.compare);
      if (Array.isArray(d.stockAlerts)) setAlerts(d.stockAlerts);
    }).catch(error => console.warn("Customer Firestore load unavailable:",error.message));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    Promise.all([
      luxmoApi("/api/orders").catch(()=>({orders:[]})),
      luxmoApi("/api/reviews").catch(()=>({reviews:[]}))
    ]).then(([o,r]) => {
      if (Array.isArray(o.orders) && o.orders.length) setOrders(o.orders);
      if (Array.isArray(r.reviews) && r.reviews.length) setReviews(r.reviews);
    });
  }, []);
  const [checkout,setCheckout]=useState(false);
  const [discount,setDiscount]=useState(0);
  const subtotal=cart.reduce((s,item)=>s+luxmoProductPrice(item)*Number(item.qty||1),0);
  const selectProduct=p=>{setRecent(prev=>{const next=[p.id,...prev.filter(id=>id!==p.id)].slice(0,12);safeWriteJSON(LUXMO_PRO_STORAGE.recentlyViewed,next);return next;});onSelectProduct(p);};
  const createOrder=order=>{
    const next=[order,...orders];
    setOrders(next);
    safeWriteJSON(LUXMO_PRO_STORAGE.orders,next);
    setCheckout(false);

    // Online orders continue directly into the existing Razorpay flow.
    // This removes the old duplicate cart-payment path and keeps the
    // delivery address/order data collected by Secure Checkout.
    if(order.paymentMethod === "razorpay"){
      setTimeout(()=>{
        if (typeof onPay === "function") onPay();
      },0);
    }else{
      alert(`Order ${order.id} created successfully.`);
    }
  };
  const tabs=[
    ["overview","Overview"],["profile","Profile"],["wishlist","Wishlist"],["compare","Compare"],["orders","Orders"],["reviews","Reviews"],["alerts","Stock Alerts"],["support","Support"],["faq","FAQ"],["shipping","Shipping"],["seo","SEO"]
  ];
  if(isAdminLoggedIn) tabs.push(["settings","Store Settings"],["analytics","Analytics"],["couriers","Couriers"],["checklist","Checklist"]);
  return <>
    <div className="luxmo-pro-suite rounded-3xl bg-slate-50 border border-slate-200 p-4 md:p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div><div className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-black">LUXMO HUB PRO</div><h2 className="text-2xl font-black text-slate-900">Ecommerce Control Center</h2><p className="text-sm text-slate-500 mt-1">Customer tools, checkout workflows, reviews, orders, shipping settings and store operations.</p></div>
        <div className="flex flex-wrap gap-2"><LuxmoProBadge tone="green">{products.length} Products</LuxmoProBadge><LuxmoProBadge>{cart.length} Cart Items</LuxmoProBadge><LuxmoProBadge tone="amber">{orders.length} Orders</LuxmoProBadge></div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">{tabs.map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold border ${tab===id?"bg-slate-900 text-white border-slate-900":"bg-white text-slate-700 border-slate-200"}`}>{label}</button>)}</div>
      {tab==="overview"&&<div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Preference</p>
            <h3 className="text-sm font-black text-slate-900">Dark / Light theme preference</h3>
            <p className="text-xs text-slate-500 mt-1">Your preference is saved on this device.</p>
          </div>
          <button
            type="button"
            onClick={() => setSiteTheme(siteTheme === "dark" ? "light" : "dark")}
            className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-xs font-black"
          >
            {siteTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><LuxmoMetricCard label="Wishlist" value={wishlist.length} icon="♥"/><LuxmoMetricCard label="Saved Addresses" value={addresses.length} icon="⌂"/><LuxmoMetricCard label="Orders" value={orders.length} icon="▤"/><LuxmoMetricCard label="Compare" value={compare.length} icon="⇄"/></div><LuxmoRecentlyViewed products={products} ids={recent} onSelect={selectProduct} onClear={()=>{setRecent([]);safeWriteJSON(LUXMO_PRO_STORAGE.recentlyViewed,[]);}}/><LuxmoNewsletter/><LuxmoFeatureChecklist/></div>}
      {tab==="profile"&&<div className="space-y-5"><LuxmoCustomerProfile customer={customer} setCustomer={setCustomer}/><LuxmoAddressBook addresses={addresses} setAddresses={setAddresses}/></div>}
      {tab==="wishlist"&&<LuxmoWishlist products={products} wishlist={wishlist} setWishlist={setWishlist} onSelect={selectProduct} onAddToCart={addToCart}/>} 
      {tab==="compare"&&<LuxmoCompare products={products} compareIds={compare} setCompareIds={v=>{setCompare(v);safeWriteJSON(LUXMO_PRO_STORAGE.compare,v)}} onSelect={selectProduct}/>} 
      {tab==="orders"&&<LuxmoOrderCenter orders={orders} setOrders={setOrders}/>} 
      {tab==="reviews"&&<LuxmoReviewCenter products={products} reviews={reviews} setReviews={setReviews}/>} 
      {tab==="alerts"&&<LuxmoStockAlerts products={products} alerts={alerts} setAlerts={setAlerts}/>} 
      {tab==="support"&&<LuxmoContactCenter/>} 
      {tab==="faq"&&<LuxmoFAQ/>} 
      {tab==="shipping"&&<div className="space-y-5"><LuxmoPincodeChecker cartItems={cart}/><LuxmoCourierSettings settings={couriers} setSettings={setCouriers}/></div>} {tab==="settings"&&isAdminLoggedIn&&<LuxmoStoreSettingsPanel settings={storeSettings} setSettings={setStoreSettings}/>} 
      {tab==="seo"&&<LuxmoSeoTools products={products}/>} 
      {tab==="analytics"&&isAdminLoggedIn&&<LuxmoAnalytics products={products} orders={orders} reviews={reviews} alerts={alerts}/>} 
      {tab==="couriers"&&isAdminLoggedIn&&<LuxmoCourierSettings settings={couriers} setSettings={setCouriers}/>} 
      {tab==="checklist"&&isAdminLoggedIn&&<LuxmoFeatureChecklist/>}
      {cart.length>0&&<div className="sticky bottom-3 bg-slate-950 text-white rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-2xl"><div><div className="font-black">Ready to checkout?</div><div className="text-xs text-slate-300">{cart.length} line item(s) · {luxmoMoney(subtotal)}</div></div><div className="flex gap-2"><button onClick={()=>setCheckout(true)} className="bg-blue-600 rounded-xl px-5 py-2.5 text-sm font-black">Checkout</button><LuxmoCouponBox subtotal={subtotal} items={cart} onDiscountChange={(d,c)=>{setDiscount(d);}}/></div></div>}
    </div>
    {checkout&&<LuxmoCheckout cart={cart} subtotal={subtotal} customer={customer} addresses={addresses} storeSettings={storeSettings} onOrderCreated={createOrder} onClose={()=>setCheckout(false)}/>} 
    <LuxmoCookieConsent/>
  </>;
}

/* ============================================================================
   PRODUCT / CUSTOMER EXPERIENCE HELPERS
   ============================================================================ */

function LuxmoVariantSummary({ product }) {
  const variants=product?.variants||[];
  if(!variants.length)return null;
  const models=[...new Set(variants.map(v=>v.model))];
  const colours=[...new Set(variants.map(v=>v.colour))];
  return <div className="grid grid-cols-2 gap-2 text-[11px] mt-3"><div className="border rounded-lg p-2"><span className="text-slate-500 block">Device Options</span><b>{models.length}</b></div><div className="border rounded-lg p-2"><span className="text-slate-500 block">Colour Options</span><b>{colours.length}</b></div></div>;
}

function LuxmoTrustStrip() {
  const items=[["✓","Secure Checkout","Razorpay-ready online payments"],["↻","7-Day Policy","Eligible return/replacement support"],["⚡","Fast Support","Product and order assistance"],["▣","Variant Accuracy","Model + colour selection"]];
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{items.map(([icon,title,text])=><div key={title} className="bg-white border rounded-2xl p-4"><div className="text-xl font-black">{icon}</div><div className="font-black text-sm mt-2">{title}</div><div className="text-[11px] text-slate-500 mt-1">{text}</div></div>)}</div>;
}

function LuxmoProductSchema({ product }) {
  useEffect(()=>{
    if(!product)return;
    const id=`luxmo-product-schema-${product.id}`;
    let script=document.getElementById(id);
    if(!script){script=document.createElement("script");script.id=id;script.type="application/ld+json";document.head.appendChild(script);}
    script.textContent=JSON.stringify({"@context":"https://schema.org","@type":"Product",name:product.title,description:product.description,image:product.images||[],sku:product.sku,offers:{"@type":"Offer",priceCurrency:"INR",price:String(luxmoProductPrice(product)),availability:luxmoProductStock(product)>0?"https://schema.org/InStock":"https://schema.org/OutOfStock"}});
    return()=>{script?.remove();};
  },[product]);
  return null;
}

function LuxmoBackToTop() {
  const [show,setShow]=useState(false);
  useEffect(()=>{const fn=()=>setShow(window.scrollY>500);window.addEventListener("scroll",fn,{passive:true});return()=>window.removeEventListener("scroll",fn);},[]);
  if(!show)return null;
  return <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} aria-label="Back to top" className="fixed bottom-5 right-5 z-[60] w-11 h-11 rounded-full bg-slate-900 text-white shadow-xl font-black">↑</button>;
}

function LuxmoAccessibilityTools() {
  const [large,setLarge]=useState(false);
  const toggle=()=>{setLarge(v=>!v);document.documentElement.style.fontSize=!large?"110%":"100%";};
  return <button onClick={toggle} aria-label="Toggle larger text" title="Accessibility: larger text" className="fixed left-3 bottom-5 z-[60] w-10 h-10 rounded-full bg-white border shadow-lg text-sm font-black">A+</button>;
}

/* ============================================================================
   END OF ADDITIVE PRO SUITE
   ============================================================================ */


/* ============================================================================
   LUXMO HUB CUSTOMER TOOLS
   - Live order tracking
   - Warranty registration
   - Solar load calculator
   - WhatsApp quick inquiry
   - Low-stock admin badge
   ============================================================================ */

function LuxmoOrderTrackingModal({ onClose }) {
  const [orderId, setOrderId] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const normalizeTracking = (data) => {
    const source = data?.tracking || data?.shipment || data?.order || data?.data || data || {};
    const events =
      source?.events ||
      source?.trackingEvents ||
      source?.history ||
      source?.scans ||
      data?.events ||
      data?.history ||
      [];
    return {
      status: source?.status || source?.current_status || source?.shipment_status || data?.status || "Status unavailable",
      awb: source?.awb || source?.awb_code || source?.waybill || data?.awb || data?.waybill || "",
      courier: source?.courier || source?.courier_name || source?.logistic_name || data?.courier || "",
      trackingUrl: source?.trackingUrl || source?.tracking_url || source?.tracking_url_text || data?.trackingUrl || "",
      orderId: source?.orderId || source?.order_id || data?.orderId || data?.order_id || orderId,
      events: Array.isArray(events) ? events : []
    };
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const cleanOrderId = orderId.trim();
    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);

    if (!cleanOrderId) {
      setError("Please enter your Order ID.");
      return;
    }
    if (cleanMobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: cleanOrderId,
          order_id: cleanOrderId,
          mobile: cleanMobile,
          phone: cleanMobile
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid tracking response from server.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.error || data.message || "Order tracking failed.");
      }

      setResult(normalizeTracking(data));
    } catch (err) {
      console.error("Order tracking error:", err);
      setError(err?.message || "Unable to fetch order status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="luxmo-solar-estimator fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200">
        <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-blue-600">LUXMO HUB</p>
            <h2 className="text-xl font-black text-slate-900">Live Order Tracking</h2>
            <p className="text-xs text-slate-500 mt-1">Check your shipment without logging in.</p>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 font-black">×</button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">Order ID</label>
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter your Order ID"
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">Mobile Number</label>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile number"
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-xs font-semibold">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white py-3 font-black text-sm"
          >
            {loading ? "Checking status..." : "Check Order Status"}
          </button>
        </form>

        {result && (
          <div className="px-5 pb-6 space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-black text-emerald-700">Current Status</p>
                  <p className="text-lg font-black text-emerald-900 mt-1">{result.status}</p>
                </div>
                <span className="text-2xl">📦</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border bg-slate-50 p-3">
                <span className="text-slate-500">Order ID</span>
                <strong className="block mt-1 break-all text-slate-900">{result.orderId || orderId}</strong>
              </div>
              <div className="rounded-xl border bg-slate-50 p-3">
                <span className="text-slate-500">Courier</span>
                <strong className="block mt-1 text-slate-900">{result.courier || "—"}</strong>
              </div>
              <div className="rounded-xl border bg-slate-50 p-3 col-span-2">
                <span className="text-slate-500">AWB / Waybill</span>
                <strong className="block mt-1 break-all text-slate-900">{result.awb || "Not assigned yet"}</strong>
              </div>
            </div>

            {result.trackingUrl && (
              <a
                href={result.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm font-black"
              >
                Open Courier Tracking
              </a>
            )}

            {result.events.length > 0 && (
              <div className="rounded-2xl border p-4">
                <h3 className="font-black text-sm">Tracking History</h3>
                <div className="mt-3 space-y-3">
                  {result.events.slice(0, 20).map((event, index) => {
                    const label = event?.status || event?.activity || event?.description || event?.message || "Shipment update";
                    const date = event?.date || event?.datetime || event?.timestamp || event?.created_at || "";
                    const location = event?.location || event?.city || "";
                    return (
                      <div key={`${index}-${label}`} className="flex gap-3 text-xs">
                        <div className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-800">{String(label)}</div>
                          {(date || location) && <div className="text-slate-500 mt-0.5">{[date, location].filter(Boolean).join(" · ")}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LuxmoWarrantyRegistrationModal({ products = [], onClose }) {
  const [form, setForm] = useState({
    customerName: "",
    mobile: "",
    email: "",
    productName: "",
    serialNumber: "",
    orderId: "",
    installationDate: "",
    installerName: "",
    batteryType: "",
    batteryCapacity: "",
    address: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const solarProducts = products.filter((p) =>
    String(p.category || "").toLowerCase().includes("solar")
  );

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!form.customerName.trim() || !form.mobile.trim() || !form.productName.trim() || !form.serialNumber.trim()) {
      setMessage({ type: "error", text: "Customer name, mobile, product and serial number are required." });
      return;
    }

    const cleanMobile = form.mobile.replace(/\D/g, "").slice(-10);
    if (cleanMobile.length !== 10) {
      setMessage({ type: "error", text: "Please enter a valid 10-digit mobile number." });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        mobile: cleanMobile,
        phone: cleanMobile,
        product_name: form.productName,
        productName: form.productName,
        serial_number: form.serialNumber,
        serialNumber: form.serialNumber,
        order_id: form.orderId,
        orderId: form.orderId,
        installation_date: form.installationDate,
        installationDate: form.installationDate,
        battery_type: form.batteryType,
        batteryType: form.batteryType,
        battery_capacity: form.batteryCapacity,
        batteryCapacity: form.batteryCapacity
      };

      const response = await fetch("/api/warranty-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid warranty registration response.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.error || data.message || "Warranty registration failed.");
      }

      const registration = {
        ...form,
        mobile: cleanMobile,
        registrationId: data.registrationId || data.id || data.data?.registrationId || `LUX-W-${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      try {
        const saved = JSON.parse(localStorage.getItem("luxmo_warranty_registrations") || "[]");
        const list = Array.isArray(saved) ? saved : [];
        localStorage.setItem("luxmo_warranty_registrations", JSON.stringify([registration, ...list].slice(0, 50)));
      } catch {}

      setMessage({
        type: "success",
        text: `Warranty registered successfully. Registration ID: ${registration.registrationId}`
      });
      setForm({
        customerName: "",
        mobile: "",
        email: "",
        productName: "",
        serialNumber: "",
        orderId: "",
        installationDate: "",
        installerName: "",
        batteryType: "",
        batteryCapacity: "",
        address: "",
        notes: ""
      });
    } catch (err) {
      console.error("Warranty registration error:", err);
      setMessage({ type: "error", text: err?.message || "Unable to register warranty." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200">
        <div className="sticky top-0 z-10 bg-white border-b p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-emerald-600">LUXMO HUB</p>
            <h2 className="text-xl font-black text-slate-900">Warranty Registration</h2>
            <p className="text-xs text-slate-500 mt-1">Register your inverter or solar product after installation.</p>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 font-black">×</button>
        </div>

        <form onSubmit={submit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black mb-1">Customer Name *</label>
            <input required value={form.customerName} onChange={(e) => update("customerName", e.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-black mb-1">Mobile *</label>
            <input required inputMode="numeric" maxLength={10} value={form.mobile} onChange={(e) => update("mobile", e.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-black mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-black mb-1">Product *</label>
            <input
              list="luxmo-warranty-products"
              required
              value={form.productName}
              onChange={(e) => update("productName", e.target.value)}
              placeholder="e.g. 5.5kW Hybrid Solar Inverter"
              className="w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900"
            />
            <datalist id="luxmo-warranty-products">
              {solarProducts.map((p) => <option key={p.id} value={p.title} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-black mb-1">Serial Number *</label>
            <input required value={form.serialNumber} onChange={(e) => update("serialNumber", e.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-black mb-1">Order ID / Invoice No.</label>
            <input value={form.orderId} onChange={(e) => update("orderId", e.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-black mb-1">Installation Date</label>
            <input type="date" value={form.installationDate} onChange={(e) => update("installationDate", e.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-black mb-1">Installer Name</label>
            <input value={form.installerName} onChange={(e) => update("installerName", e.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-black mb-1">Battery Type</label>
            <input value={form.batteryType} onChange={(e) => update("batteryType", e.target.value)} placeholder="LiFePO4 / Lead Acid" className="w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-black mb-1">Battery Capacity</label>
            <input value={form.batteryCapacity} onChange={(e) => update("batteryCapacity", e.target.value)} placeholder="e.g. 200Ah" className="w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-black mb-1">Installation Address</label>
            <textarea rows={2} value={form.address} onChange={(e) => update("address", e.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-black mb-1">Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900" />
          </div>

          {message.text && (
            <div className={`md:col-span-2 rounded-xl p-3 text-xs font-semibold ${message.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
              {message.text}
            </div>
          )}

          <div className="md:col-span-2 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border px-5 py-3 text-sm font-bold">Close</button>
            <button type="submit" disabled={loading} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-5 py-3 text-sm font-black">
              {loading ? "Registering..." : "Register Warranty"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LuxmoSolarCalculator({ products = [], onClose }) {
  const defaultAppliances = [
    { id: "fan", name: "Ceiling Fan", watts: 70, hours: 8, qty: 2 },
    { id: "light", name: "LED Light", watts: 10, hours: 6, qty: 6 },
    { id: "tv", name: "LED TV", watts: 120, hours: 5, qty: 1 },
    { id: "fridge", name: "Refrigerator", watts: 180, hours: 10, qty: 1 },
    { id: "pump", name: "Water Pump", watts: 750, hours: 1, qty: 1 },
    { id: "cooler", name: "Air Cooler", watts: 200, hours: 6, qty: 1 }
  ];

  const [appliances, setAppliances] = useState(defaultAppliances);
  const [customName, setCustomName] = useState("");
  const [customWatts, setCustomWatts] = useState("");
  const [customHours, setCustomHours] = useState("4");
  const [customQty, setCustomQty] = useState("1");

  const totals = useMemo(() => {
    const connectedLoad = appliances.reduce((sum, a) => sum + Number(a.watts || 0) * Number(a.qty || 0), 0);
    const dailyEnergy = appliances.reduce((sum, a) => sum + (Number(a.watts || 0) * Number(a.qty || 0) * Number(a.hours || 0)) / 1000, 0);
    const peakLoad = connectedLoad * 1.25;
    const inverterChoices = [3.6, 4.2, 5, 5.5, 6.2, 6.5, 12];
    const recommendedKw = inverterChoices.find((kw) => kw * 1000 >= peakLoad) || 12;
    const solarKw = Math.max(1, Math.ceil((dailyEnergy / 4.5) * 1.2 * 10) / 10);
    const batteryWh = dailyEnergy * 1000 * 0.6;
    const batteryVoltage = recommendedKw > 5.5 ? 48 : 24;
    const batteryAh = Math.ceil(batteryWh / batteryVoltage);
    return { connectedLoad, dailyEnergy, peakLoad, recommendedKw, solarKw, batteryVoltage, batteryAh };
  }, [appliances]);

  const update = (id, key, value) => {
    setAppliances((prev) => prev.map((a) => a.id === id ? { ...a, [key]: Math.max(0, Number(value) || 0) } : a));
  };

  const addCustom = () => {
    if (!customName.trim() || Number(customWatts) <= 0) return;
    setAppliances((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: customName.trim(),
        watts: Number(customWatts),
        hours: Number(customHours) || 1,
        qty: Number(customQty) || 1
      }
    ]);
    setCustomName("");
    setCustomWatts("");
    setCustomHours("4");
    setCustomQty("1");
  };

  const recommendedProducts = useMemo(() => {
    return products
      .filter((p) => String(p.category || "").toLowerCase().includes("hybrid solar inverter"))
      .filter((p) => {
        const text = `${p.title || ""} ${p.model || ""} ${(p.models || []).join(" ")}`.toLowerCase();
        return text.includes(`${String(totals.recommendedKw).replace(".","-")}kw`) ||
          text.includes(`${totals.recommendedKw}kw`) ||
          text.includes(`${totals.recommendedKw} kw`);
      })
      .slice(0, 3);
  }, [products, totals.recommendedKw]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200">
        <div className="sticky top-0 z-10 bg-white border-b p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-amber-600">LUXMO HUB</p>
            <h2 className="text-xl font-black text-slate-900">Solar Load Estimator</h2>
            <p className="text-xs text-slate-500 mt-1">Estimate connected load, daily energy and an inverter size.</p>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 font-black">×</button>
        </div>

        <div className="p-5 space-y-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <strong>Important:</strong> This is a preliminary sizing estimate. Final inverter, PV and battery sizing should be confirmed from actual appliance starting currents, usage patterns, battery limits and installation conditions.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Appliance</th>
                  <th className="py-2">W</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Hours/day</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {appliances.map((a) => (
                  <tr key={a.id} className="border-b">
                    <td className="py-2 pr-2 font-bold">{a.name}</td>
                    <td className="py-2 pr-2"><input type="number" min="0" value={a.watts} onChange={(e) => update(a.id, "watts", e.target.value)} className="w-20 rounded-lg border px-2 py-1.5 text-slate-900" /></td>
                    <td className="py-2 pr-2"><input type="number" min="0" value={a.qty} onChange={(e) => update(a.id, "qty", e.target.value)} className="w-16 rounded-lg border px-2 py-1.5 text-slate-900" /></td>
                    <td className="py-2 pr-2"><input type="number" min="0" step="0.5" value={a.hours} onChange={(e) => update(a.id, "hours", e.target.value)} className="w-20 rounded-lg border px-2 py-1.5 text-slate-900" /></td>
                    <td className="py-2"><button type="button" onClick={() => setAppliances((prev) => prev.filter((x) => x.id !== a.id))} className="text-red-600 font-bold">Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Appliance name" className="rounded-xl border px-3 py-2.5 text-sm text-slate-900 md:col-span-2" />
            <input type="number" min="1" value={customWatts} onChange={(e) => setCustomWatts(e.target.value)} placeholder="Watts" className="rounded-xl border px-3 py-2.5 text-sm text-slate-900" />
            <input type="number" min="0.5" step="0.5" value={customHours} onChange={(e) => setCustomHours(e.target.value)} placeholder="Hours" className="rounded-xl border px-3 py-2.5 text-sm text-slate-900" />
            <button type="button" onClick={addCustom} className="rounded-xl bg-slate-900 text-white font-black text-sm">Add</button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-slate-950 text-white p-4"><span className="text-xs text-slate-400">Connected Load</span><strong className="block text-xl mt-1">{(totals.connectedLoad / 1000).toFixed(2)} kW</strong></div>
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4"><span className="text-xs text-blue-700">Daily Energy</span><strong className="block text-xl mt-1 text-slate-900">{totals.dailyEnergy.toFixed(2)} kWh</strong></div>
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4"><span className="text-xs text-emerald-700">Recommended Inverter</span><strong className="block text-xl mt-1 text-slate-900">{totals.recommendedKw} kW</strong></div>
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4"><span className="text-xs text-amber-700">Estimated PV</span><strong className="block text-xl mt-1 text-slate-900">{totals.solarKw} kW</strong></div>
          </div>

          <div className="rounded-2xl border bg-slate-50 p-4 text-sm">
            <div className="font-black">Preliminary battery estimate</div>
            <p className="text-xs text-slate-600 mt-1">Approx. {totals.batteryAh} Ah at {totals.batteryVoltage}V for a moderate backup assumption. Actual battery sizing depends on backup hours and allowable depth of discharge.</p>
          </div>

          {recommendedProducts.length > 0 && (
            <div>
              <h3 className="font-black text-sm">Matching LUXMO HUB products</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                {recommendedProducts.map((p) => (
                  <div key={p.id} className="border rounded-2xl p-4">
                    <div className="font-black text-sm">{p.title}</div>
                    <div className="text-xs text-slate-500 mt-1">₹{luxmoProductPrice(p).toLocaleString("en-IN")}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="rounded-xl bg-slate-900 text-white px-5 py-3 text-sm font-black">Close Calculator</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LuxmoQuickWhatsAppModal({ onClose }) {
  const phone = "917565012418";
  const [type, setType] = useState("Solar Inverter");
  const [message, setMessage] = useState("Hello LUXMO HUB, I want information about your Hybrid Solar Inverters. Please share price, specifications, warranty and delivery details.");

  const templates = {
    "Solar Inverter": "Hello LUXMO HUB, I want information about your Hybrid Solar Inverters. Please share price, specifications, warranty and delivery details.",
    "Bulk Solar Inquiry": "Hello LUXMO HUB, I am interested in a bulk purchase of Hybrid Solar Inverters / Solar Accessories. Please share your wholesale price, MOQ, warranty and delivery terms.",
    "Mobile Cases": "Hello LUXMO HUB, I am interested in Premium Mobile Phone Cases. Please share available models, colours, prices and bulk options.",
    "Warranty / Support": "Hello LUXMO HUB, I need warranty / after-sales support. My Order ID / Serial Number is: "
  };

  const send = () => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-emerald-600">Quick Contact</p>
            <h2 className="text-xl font-black text-slate-900">WhatsApp Inquiry</h2>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 font-black">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(templates).map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => { setType(item); setMessage(templates[item]); }}
                className={`rounded-xl border px-3 py-2.5 text-xs font-black ${type === item ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="w-full rounded-xl border px-3 py-3 text-sm text-slate-900" />
          <button type="button" onClick={send} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-black">
            Open WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function LuxmoLowStockBadge({ products = [], isAdmin = false, onClick }) {
  const [count, setCount] = useState(() => products.filter((p) => luxmoProductStock(p) <= 5).length);

  useEffect(() => {
    const refresh = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("luxmo_products") || "[]");
        const source = Array.isArray(saved) && saved.length ? saved : products;
        setCount(source.filter((p) => luxmoProductStock(p) <= 5).length);
      } catch {
        setCount(products.filter((p) => luxmoProductStock(p) <= 5).length);
      }
    };
    refresh();
    const timer = setInterval(refresh, 30000);
    window.addEventListener("storage", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", refresh);
    };
  }, [products]);

  if (!isAdmin) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      title="Low stock products"
      className={`relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-black border ${count > 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}
    >
      <span>{count > 0 ? "⚠️" : "✓"}</span>
      Low Stock
      <span className="min-w-5 h-5 px-1 rounded-full bg-white border flex items-center justify-center">{count}</span>
    </button>
  );
}


export default function LuxmoHubApp() {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem("luxmo_products");
      const loaded = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
      return Array.isArray(loaded) && loaded.length ? loaded : INITIAL_PRODUCTS;
    } catch (err) {
      console.error("Storage load error:", err);
      return INITIAL_PRODUCTS;
    }
  });;

  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedModelFilter, setSelectedModelFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(() => safeReadJSON(LUXMO_PRO_STORAGE.recentSearches, []));
  const [siteTheme, setSiteTheme] = useState(() => safeReadJSON(LUXMO_PRO_STORAGE.theme, "light") === "dark" ? "dark" : "light");
  const [activeTab, setActiveTab] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantKey, setSelectedVariantKey] = useState("");
  const [showProCenter, setShowProCenter] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [showSolarCalculator, setShowSolarCalculator] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Production homepage: published content comes from the Firestore-backed database API.
  // localStorage may hold an unsaved admin draft, but it is never the published source of truth.
  const [homepageDraft, setHomepageDraft] = useState(() => {
    try {
      const saved = localStorage.getItem("luxmo_homepage_draft");
      return saved ? { ...luxmoClone(DEFAULT_HOMEPAGE_CONFIG), ...JSON.parse(saved) } : luxmoClone(DEFAULT_HOMEPAGE_CONFIG);
    } catch { return luxmoClone(DEFAULT_HOMEPAGE_CONFIG); }
  });
  const [homepagePublished, setHomepagePublished] = useState(luxmoClone(DEFAULT_HOMEPAGE_CONFIG));
  const [homepagePreview, setHomepagePreview] = useState(false);
  const [homepageInitialized, setHomepageInitialized] = useState(false);
  const [homepageLoading, setHomepageLoading] = useState(true);
  const [homepageError, setHomepageError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(LUXMO_PRO_STORAGE.theme, siteTheme);
      document.documentElement.setAttribute("data-luxmo-theme", siteTheme);
    } catch {}
  }, [siteTheme]);

  useEffect(() => {
    luxmoLoadRazorpay().catch(error => {
      console.warn("Razorpay preload:", error.message);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setHomepageLoading(true);
      setHomepageError("");
      try {
        const r = await fetch("/api/homepage", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" }
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.success) throw new Error(luxmoApiErrorMessage(data.error, "Unable to load homepage from database."));
        if (!cancelled) {
          const config = { ...luxmoClone(DEFAULT_HOMEPAGE_CONFIG), ...(data.config || {}) };
          setHomepagePublished(config);
          setHomepageDraft(config);
          setHomepageInitialized(true);
          try { localStorage.removeItem("luxmo_homepage_published"); } catch {}
        }
      } catch (e) {
        if (!cancelled) {
          setHomepageError(e?.message || "Unable to load homepage.");
          setHomepagePublished(luxmoClone(DEFAULT_HOMEPAGE_CONFIG));
        }
      } finally {
        if (!cancelled) setHomepageLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // Draft convenience only; it is never used as published content.
    try { localStorage.setItem("luxmo_homepage_draft", JSON.stringify(homepageDraft)); }
    catch (e) { console.warn("Homepage draft storage limit reached", e); }
  }, [homepageDraft]);

  useEffect(() => {
    const seo = homepagePublished?.seo || {};
    if (seo.title) document.title = seo.title;
    if (seo.description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
      meta.content = seo.description;
    }
    if (seo.canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
      link.href = seo.canonical;
    }
  }, [homepagePublished]);

  useEffect(() => {
    const seo = homepagePublished?.seo || {};
    if (seo.ogImage) {
      let og = document.querySelector('meta[property="og:image"]');
      if (!og) { og = document.createElement("meta"); og.setAttribute("property", "og:image"); document.head.appendChild(og); }
      og.content = seo.ogImage;
    }
  }, [homepagePublished]);

  const saveHomepageDraft = () => {
    try {
      localStorage.setItem("luxmo_homepage_draft", JSON.stringify(homepageDraft));
      alert("Homepage draft saved on this device. It is not published.");
    } catch {
      alert("Unable to save homepage draft. Browser storage may be full.");
    }
  };

  const publishHomepage = async () => {
    const clean = luxmoClone(homepageDraft);
    clean.promos = (clean.promos || []).slice(0, 12).map((x, i) => ({
      ...x,
      order: i + 1,
      show: x.show !== false,
      enabled: x.enabled !== false,
      featured: x.featured !== false
    }));
    clean.publishedAt = new Date().toISOString();

    try {
      const r = await fetch("/api/publish", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(clean)
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.success) throw new Error(luxmoApiErrorMessage(data.error, data.message || "Homepage publish failed."));
      const published = { ...luxmoClone(DEFAULT_HOMEPAGE_CONFIG), ...(data.config || clean) };
      setHomepagePublished(published);
      setHomepageDraft(published);
      setHomepagePreview(false);
      setHomepageError("");
      alert("Homepage published to database successfully.");
    } catch (e) {
      setHomepageError(e?.message || "Unable to publish homepage.");
      alert(luxmoApiErrorMessage(e?.message, "Unable to publish homepage. Database was not updated."));
    }
  };

  // Secure Admin authentication — Google Authenticator (TOTP).
  // IMPORTANT: the TOTP secret stays ONLY in Vercel as ADMIN_TOTP_SECRET.
  // The browser sends only the current 6-digit code to the server API.
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminSessionChecking, setAdminSessionChecking] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminOtp, setAdminOtp] = useState("");
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const verifyAdminSession = async () => {
    setAdminSessionChecking(true);
    try {
      const response = await fetch("/api/admin-session", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      const data = await response.json().catch(() => ({}));
      const authenticated = Boolean(
        response.ok &&
        (data.authenticated === true ||
          data.isAuthenticated === true ||
          data.loggedIn === true ||
          data.success === true)
      );
      setIsAdminLoggedIn(authenticated);
      if (!authenticated && activeTab === "admin") setActiveTab("home");
      return authenticated;
    } catch (error) {
      console.error("Admin session verification failed:", error);
      setIsAdminLoggedIn(false);
      if (activeTab === "admin") setActiveTab("home");
      return false;
    } finally {
      setAdminSessionChecking(false);
    }
  };

  useEffect(() => {
    verifyAdminSession();
  }, []);

  useEffect(() => {
    luxmoEnsureCustomerSession();
    let cancelled = false;
    luxmoServerFirstProducts().then(remote => {
      if (!cancelled && remote) {
        setProducts(remote);
        try { localStorage.setItem("luxmo_products", JSON.stringify(remote)); } catch {}
      }
    });
    return () => { cancelled = true; };
  }, []);

  const openAdminLogin = () => {
    setAuthError("");
    setAuthMessage("");
    setAdminOtp("");
    setShowAdminModal(true);
  };

  const handleAdminVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");

    const otp = adminOtp.replace(/\D/g, "").slice(0, 6);

    if (!/^\d{6}$/.test(otp)) {
      setAuthError("Please enter the current 6-digit Google Authenticator code.");
      return;
    }

    setAdminAuthLoading(true);
    try {
      // Do NOT send ADMIN_TOTP_SECRET to the browser or API request.
      // The server reads ADMIN_TOTP_SECRET from Vercel Environment Variables.
      const response = await fetch("/api/admin-verify-otp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ otp })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success !== true) {
        throw new Error(data.error || data.message || "Invalid or expired Google Authenticator code.");
      }

      const authenticated = await verifyAdminSession();
      if (!authenticated) {
        throw new Error("OTP verified, but secure admin session could not be established.");
      }

      setShowAdminModal(false);
      setAdminOtp("");
      setAuthMessage("");
      setAuthError("");
      setActiveTab("admin");
    } catch (error) {
      console.error("Admin Google Authenticator verification error:", error);
      setAuthError(error.message || "Google Authenticator verification failed.");
      setIsAdminLoggedIn(false);
    } finally {
      setAdminAuthLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    setAdminAuthLoading(true);
    try {
      await fetch("/api/admin-logout", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
    } catch (error) {
      console.error("Admin logout API error:", error);
    } finally {
      setIsAdminLoggedIn(false);
      setAdminOtp("");
      setAuthError("");
      setAuthMessage("");
      setActiveTab("home");
      setAdminAuthLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "admin" && !adminSessionChecking && !isAdminLoggedIn) {
      openAdminLogin();
      setActiveTab("home");
    }
  }, [activeTab, adminSessionChecking, isAdminLoggedIn]);

  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '', category: CATEGORIES[0], model: MOBILE_MODELS[0], models: [MOBILE_MODELS[0]], material: "", description: '',
    price: '', salePrice: '', stock: '', sku: '', hsn: '42029900', gstRate: '18',
    images: [], published: true, colours: [MOBILE_COLOURS[0]], variants: [],
    badge: '', bestSeller: false, hotDeal: false, featured: false, buyNowUrl: '', detailsUrl: '',
    seoTitle: '', seoDescription: '', seoCanonical: '', seoOgImage: '', specs: '',
    inverterSpecs: { ratedPower: '', batteryVoltage: '', mpptCurrent: '', pvInput: '', mpptVoltage: '', acInput: '', acOutput: '', batteryType: '', bms: '', wifi: '', parallel: '', ipRating: '', weight: '', warranty: '' },
    mobileSpecs: { brand: '', phoneModel: MOBILE_MODELS[0], material: '', magsafe: '', cameraProtection: '', colour: '' }
  });
  const [formError, setFormError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    if (files.length + formData.images.length > 5) {
      setFormError('Maximum 5 images allowed per product.');
      return;
    }

    setIsCompressing(true);
    setFormError('');

    try {
      const compressed = await Promise.all(files.map(file => compressImage(file)));
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...compressed].slice(0, 5)
      }));
    } catch (err) {
      console.error("Upload Error:", err);
      setFormError('Failed to process image. Try a smaller image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  useEffect(() => {
    try { localStorage.setItem("luxmo_products", JSON.stringify(products)); } catch {}
    if (!isAdminLoggedIn) return;
    const timer = setTimeout(() => {
      luxmoApi("/api/products", {method:"PUT",body:JSON.stringify({products})})
        .catch(error => console.error("Firestore product sync failed:", error));
    }, 250);
    return () => clearTimeout(timer);
  }, [products, isAdminLoggedIn]);

  useEffect(() => {
    const availableModels = MODEL_MAP[formData.category] || [];
    const availableMaterials = MATERIAL_OPTIONS[formData.category] || [];
    const nextModel = availableModels.includes(formData.model) ? formData.model : (availableModels[0] || '');
    const nextMaterial = availableMaterials.includes(formData.material) ? formData.material : (availableMaterials[0] || '');
    const tax = getTaxInfo(formData.category, nextMaterial);

    setFormData(prev => ({
      ...prev,
      model: nextModel,
      models: prev.models?.filter(m => availableModels.includes(m)).length ? prev.models.filter(m => availableModels.includes(m)) : [nextModel],
      material: nextMaterial,
      hsn: tax?.hsn || '',
      gstRate: tax?.gstRate ?? ''
    }));
  }, [formData.category]);

  useEffect(() => {
    const tax = getTaxInfo(formData.category, formData.material);
    if (tax) {
      setFormData(prev => ({ ...prev, hsn: tax.hsn, gstRate: tax.gstRate }));
    } else if (formData.category === "Solar Accessories") {
      setFormData(prev => ({ ...prev, hsn: '', gstRate: '' }));
    }
  }, [formData.material]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const combinedText = `${p.title} ${p.description} ${p.category} ${p.model} ${(p.models || []).join(" ")} ${(p.colours || []).join(" ")}`.toLowerCase();
      if (FORBIDDEN_TERMS.some(term => combinedText.includes(term))) return false;

      const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchesModel = selectedModelFilter === "All" || p.model === selectedModelFilter || (p.models || []).includes(selectedModelFilter);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.title.toLowerCase().includes(q) || 
        (`${p.model || ""} ${(p.models || []).join(" ")} ${(p.colours || []).join(" ")}`).toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q);

      return matchesCat && matchesModel && matchesSearch && (isAdminLoggedIn || p.published);
    });
  }, [products, selectedCategory, selectedModelFilter, searchQuery, isAdminLoggedIn]);

  const buildVariantMatrix = (models, colours, baseSku, basePrice, baseSalePrice, baseStock, images) => {
    const safeModels = models?.length ? models : [formData.model];
    const safeColours = colours?.length ? colours : ["Default"];
    return safeModels.flatMap(model => safeColours.map(colour => {
      const key = `${model}__${colour}`;
      const compactModel = model.replace(/[^A-Za-z0-9]/g, "").slice(0, 12).toUpperCase();
      const compactColour = colour.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase();
      return {
        key,
        model,
        colour,
        sku: `${baseSku || "LUX"}-${compactModel}-${compactColour}`,
        price: Number(basePrice) || 0,
        salePrice: baseSalePrice ? Number(baseSalePrice) : null,
        stock: Number(baseStock) || 0,
        images: images || []
      };
    }));
  };

  const validateAndSaveProduct = (e) => {
    e.preventDefault();
    setFormError('');

    if (FORBIDDEN_TERMS.some(term => formData.title.toLowerCase().includes(term))) {
      setFormError('Product title contains prohibited terms.');
      return;
    }

    if (!formData.images || formData.images.length === 0) {
      setFormError('Please upload at least 1 product image.');
      return;
    }

    const taxInfo = getTaxInfo(formData.category, formData.material);
    if (formData.category === "Mobile Back Case" && !formData.material) {
      setFormError('Please select the correct mobile case material so the correct HSN code can be applied.');
      return;
    }
    if ((formData.category === "Mobile Back Case" || formData.category === "Hybrid Solar Inverter") && !taxInfo) {
      setFormError('Please select a valid product material/category so the correct HSN and GST can be applied.');
      return;
    }

    const productPayload = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      title: formData.title.trim(),
      category: formData.category,
      model: formData.model,
      models: formData.category === "Mobile Back Case" ? (formData.models?.length ? formData.models : [formData.model]) : [formData.model],
      colours: formData.category === "Mobile Back Case" ? (formData.colours?.length ? formData.colours : ["Default"]) : [],
      variants: formData.category === "Mobile Back Case"
        ? (formData.variants?.length ? formData.variants : buildVariantMatrix(formData.models, formData.colours, formData.sku.trim(), formData.price, formData.salePrice, formData.stock, formData.images))
        : [],
      material: formData.material,
      description: formData.description.trim(),
      price: Number(formData.price),
      salePrice: formData.salePrice ? Number(formData.salePrice) : null,
      stock: Number(formData.stock),
      sku: formData.sku.trim(),
      hsn: taxInfo?.hsn || '',
      gstRate: taxInfo?.gstRate ?? null,
      images: formData.images,
      published: Boolean(formData.published),
      rating: editingProduct ? editingProduct.rating : null,
      reviewsCount: editingProduct ? editingProduct.reviewsCount : 0,
      badge: formData.badge?.trim() || '',
      bestSeller: Boolean(formData.bestSeller),
      hotDeal: Boolean(formData.hotDeal),
      featured: Boolean(formData.featured),
      buyNowUrl: formData.buyNowUrl?.trim() || '',
      detailsUrl: formData.detailsUrl?.trim() || '',
      seoTitle: formData.seoTitle?.trim() || '',
      seoDescription: formData.seoDescription?.trim() || '',
      seoCanonical: formData.seoCanonical?.trim() || '',
      seoOgImage: formData.seoOgImage || '',
      specs: formData.specs?.trim() || '',
      inverterSpecs: formData.inverterSpecs || {},
      mobileSpecs: formData.mobileSpecs || {}
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? productPayload : p));
    } else {
      setProducts(prev => [productPayload, ...prev]);
    }

    resetForm();
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      title: '', category: CATEGORIES[0], model: MOBILE_MODELS[0], models: [MOBILE_MODELS[0]], material: "", description: '',
      price: '', salePrice: '', stock: '', sku: '', hsn: '42029900', gstRate: '18',
      images: [], published: true, colours: [MOBILE_COLOURS[0]], variants: [],
      badge: '', bestSeller: false, hotDeal: false, featured: false, buyNowUrl: '', detailsUrl: '',
      seoTitle: '', seoDescription: '', seoCanonical: '', seoOgImage: '', specs: '',
    inverterSpecs: { ratedPower: '', batteryVoltage: '', mpptCurrent: '', pvInput: '', mpptVoltage: '', acInput: '', acOutput: '', batteryType: '', bms: '', wifi: '', parallel: '', ipRating: '', weight: '', warranty: '' },
    mobileSpecs: { brand: '', phoneModel: MOBILE_MODELS[0], material: '', magsafe: '', cameraProtection: '', colour: '' }
    });
    setFormError('');
  };

  const handleEditInit = (prod) => {
    setEditingProduct(prod);
    const materialOptions = MATERIAL_OPTIONS[prod.category] || [];
    const material = materialOptions.includes(prod.material) ? prod.material : (materialOptions[0] || '');
    const taxInfo = getTaxInfo(prod.category, material);
    setFormData({ 
      ...prod,
      models: prod.models || (prod.model ? [prod.model] : [MOBILE_MODELS[0]]),
      colours: prod.colours || (prod.category === "Mobile Back Case" ? [MOBILE_COLOURS[0]] : []),
      variants: prod.variants || [],
      material,
      hsn: taxInfo?.hsn || '',
      gstRate: taxInfo?.gstRate ?? '',
      salePrice: prod.salePrice || '',
      images: prod.images || (prod.image ? [prod.image] : []),
      seoCanonical: prod.seoCanonical || '',
      seoOgImage: prod.seoOgImage || '',
      inverterSpecs: { ratedPower: '', batteryVoltage: '', mpptCurrent: '', pvInput: '', mpptVoltage: '', acInput: '', acOutput: '', batteryType: '', bms: '', wifi: '', parallel: '', ipRating: '', weight: '', warranty: '', ...(prod.inverterSpecs || {}) },
      mobileSpecs: { brand: '', phoneModel: prod.model || MOBILE_MODELS[0], material: prod.material || '', magsafe: '', cameraProtection: '', colour: '', ...(prod.mobileSpecs || {}) }
    });
    setActiveTab('admin');
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm("Delete this product?")) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const addToCart = (product, variant = null) => {
    const item = variant ? {
      ...product,
      model: variant.model,
      colour: variant.colour,
      sku: variant.sku,
      price: variant.price,
      salePrice: variant.salePrice,
      stock: variant.stock,
      images: variant.images?.length ? variant.images : product.images
    } : product;
    const cartKey = variant ? `${product.id}::${variant.key}` : product.id;
    setCart(prev => {
      const exists = prev.find(x => x.cartKey === cartKey);
      if (exists) return prev.map(x => x.cartKey === cartKey ? { ...x, qty: Math.min(x.qty + 1, Number(x.stock || 999999)) } : x);
      return [...prev, { ...item, cartKey, qty: 1 }];
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.salePrice || item.price) * item.qty, 0);

  const currentFormTaxInfo = getTaxInfo(formData.category, formData.material);
  const selectedProductVariants = selectedProduct?.variants || [];
  const activeVariant = selectedProductVariants.find(v => v.key === selectedVariantKey) || selectedProductVariants[0] || null;
  const displayedProduct = activeVariant ? { ...selectedProduct, ...activeVariant, images: activeVariant.images?.length ? activeVariant.images : selectedProduct.images } : selectedProduct;

  const handleRazorpayPayment = async () => {
    try {
      await luxmoLoadRazorpay();
    } catch (error) {
      console.error("Razorpay loader error:", error);
      alert(error?.message || "Razorpay is currently unavailable. Please try again.");
      return;
    }

    if (!cart || cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const shipmentLockKey = "luxmo_payment_shipment_lock";

    // Frontend duplicate-payment/shipment protection.
    try {
      const rawLock = localStorage.getItem(shipmentLockKey);
      if (rawLock) {
        const lock = JSON.parse(rawLock);
        if (
          lock?.status === "processing" &&
          Date.now() - Number(lock.timestamp || 0) < 10 * 60 * 1000
        ) {
          alert("A payment/shipment process is already running. Please wait.");
          return;
        }
      }
    } catch (e) {
      console.warn("Could not read payment lock:", e);
    }

    try {
      // Checkout already stores the customer's address + items + total here.
      // Use the latest pending online order when available.
      let storedOrders = [];
      try {
        const rawOrders = localStorage.getItem("luxmo_pro_orders");
        const parsedOrders = rawOrders ? JSON.parse(rawOrders) : [];
        storedOrders = Array.isArray(parsedOrders) ? parsedOrders : [];
      } catch (e) {
        console.warn("Could not read Luxmo orders:", e);
      }

      const pendingOrder = storedOrders.find(
        (order) =>
          order &&
          order.paymentMethod === "razorpay" &&
          (order.paymentStatus === "Pending" || order.status === "Pending Payment")
      );

      if (!pendingOrder) {
        alert("Please complete the delivery address and place the online order from Checkout first.");
        return;
      }

      const address = pendingOrder.address || pendingOrder.shippingAddress;
      if (
        !address?.name ||
        !address?.phone ||
        !address?.line1 ||
        !address?.city ||
        !address?.state ||
        !address?.pincode
      ) {
        alert("Please complete your delivery address before making payment.");
        return;
      }

      const items = (pendingOrder.items?.length ? pendingOrder.items : cart).map((item) => ({
        id: item.id,
        title: item.title,
        qty: Number(item.qty || 1),
        price: Number(item.price ?? item.salePrice ?? 0),
        model: item.model || "",
        colour: item.colour || "",
        sku: item.sku || ""
      }));

      const total = Number(
        pendingOrder.total ??
        pendingOrder.grandTotal ??
        cartTotal ??
        0
      );

      const orderPayload = {
        ...pendingOrder,
        id: pendingOrder.id,
        items,
        total,
        subtotal: Number(pendingOrder.subtotal ?? total),
        discount: Number(pendingOrder.discount || 0),
        shippingFee: Number(pendingOrder.shippingFee || 0),
        paymentMethod: "razorpay",
        customer: {
          name: address.name,
          phone: address.phone,
          email: pendingOrder.email || address.email || ""
        },
        shippingAddress: {
          name: address.name,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2 || "",
          city: address.city,
          state: address.state,
          pincode: address.pincode
        },
        address
      };

      // Existing Razorpay create-order flow is preserved.
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: total
        })
      });

      let orderData = {};
      try {
        orderData = await orderResponse.json();
      } catch {
        throw new Error("Invalid response from Razorpay order API.");
      }

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || "Unable to create order");
      }

      try {
        localStorage.setItem(
          shipmentLockKey,
          JSON.stringify({
            status: "processing",
            razorpayOrderId: orderData.orderId,
            websiteOrderId: pendingOrder.id,
            timestamp: Date.now()
          })
        );
      } catch (e) {
        console.warn("Could not save payment lock:", e);
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: BUSINESS_INFO.tradeName,
        description: "Luxmo Hub Order",
        order_id: orderData.orderId,

        handler: async function (response) {
          try {
            // STEP 1: Verify Razorpay payment on the server.
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                ...response,
                order: orderPayload,
                orderData: orderPayload
              })
            });

            let verifyData = {};
            try {
              verifyData = await verifyResponse.json();
            } catch {
              throw new Error("Invalid payment verification response.");
            }

            if (!verifyResponse.ok || !verifyData.success) {
              console.error("Razorpay verification failed:", verifyData);
              localStorage.removeItem(shipmentLockKey);
              alert(verifyData.error || "Payment verification failed.");
              return;
            }

            // IMPORTANT: Payment is now verified. Shipment failure must NOT
            // change payment status to failed.
            console.log("Razorpay payment verified:", response.razorpay_payment_id);

            // STEP 2: Select iThink / Shiprocket.
            let provider = String(
              orderPayload.courierProvider || ""
            ).trim().toLowerCase();

            if (
              !provider ||
              provider === "pending" ||
              provider === "pending assignment"
            ) {
              let savedProvider = "";
              try {
                savedProvider = String(
                  localStorage.getItem("luxmo_selected_courier") || ""
                ).trim().toLowerCase();
              } catch {}

              if (savedProvider === "ithink" || savedProvider === "shiprocket") {
                provider = savedProvider;
              } else {
                const useIThink = window.confirm(
                  "Choose Shipping Partner:\n\nOK = iThink Logistics\nCancel = Shiprocket"
                );
                provider = useIThink ? "ithink" : "shiprocket";
                try {
                  localStorage.setItem("luxmo_selected_courier", provider);
                } catch {}
              }
            }

            // STEP 3: Do not create the same shipment twice.
            const shipmentKey = `luxmo_shipment_${orderData.orderId}`;
            let existingShipment = null;
            try {
              const savedShipment = localStorage.getItem(shipmentKey);
              existingShipment = savedShipment ? JSON.parse(savedShipment) : null;
            } catch {}

            if (existingShipment?.success === true) {
              alert(
                `Payment Successful!\n\nPayment ID: ${response.razorpay_payment_id}\nAWB: ${existingShipment.awb || "Already created"}`
              );
              localStorage.removeItem(shipmentLockKey);
              setCart([]);
              setActiveTab("home");
              return;
            }

            // STEP 4: Create shipment only AFTER payment verification.
            const shipmentResponse = await fetch("/api/create-shipment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                provider,
                order: {
                  ...orderPayload,
                  provider,
                  courierProvider: provider
                },
                orderData: {
                  ...orderPayload,
                  provider,
                  courierProvider: provider
                }
              })
            });

            let shipmentData = {};
            try {
              shipmentData = await shipmentResponse.json();
            } catch {
              shipmentData = {};
            }

            // PAYMENT SUCCESS + SHIPMENT FAILURE = payment remains PAID.
            if (!shipmentResponse.ok || !shipmentData.success) {
              console.error(
                "Shipment failed after successful payment:",
                shipmentData
              );

              const pendingShipmentOrder = {
                ...orderPayload,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                paymentStatus: "Paid",
                paymentVerified: true,
                status: "Payment Confirmed - Shipment Pending",
                courierProvider: provider,
                shipmentStatus: "Pending",
                shipmentError:
                  shipmentData.error || "Shipment creation failed",
                updatedAt: new Date().toISOString()
              };

              try {
                const current = JSON.parse(
                  localStorage.getItem("luxmo_pro_orders") || "[]"
                );
                const safeCurrent = Array.isArray(current) ? current : [];
                const updated = [
                  pendingShipmentOrder,
                  ...safeCurrent.filter((o) => o?.id !== pendingShipmentOrder.id)
                ];
                localStorage.setItem("luxmo_pro_orders", JSON.stringify(updated));
              } catch (e) {
                console.error("Could not save shipment-pending order:", e);
              }

              localStorage.removeItem(shipmentLockKey);
              setCart([]);
              setActiveTab("home");

              alert(
                "Payment was successful and verified, but shipment creation is pending. Your payment is NOT failed. Please do NOT pay again."
              );
              return;
            }

            // STEP 5: Save AWB + shipment details after successful shipment.
            const shipment = shipmentData.shipment || shipmentData;
            const awb =
              shipment?.awb ||
              shipment?.awb_code ||
              shipment?.waybill ||
              "";
            const trackingUrl =
              shipment?.trackingUrl ||
              shipment?.tracking_url ||
              "";
            const courier =
              shipment?.courier ||
              shipment?.courier_name ||
              shipment?.logistic_name ||
              provider;
            const shipmentId =
              shipment?.shipmentId ||
              shipment?.shipment_id ||
              "";

            const shipmentRecord = {
              success: true,
              provider,
              courier,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              shipmentId,
              awb,
              trackingUrl,
              createdAt: new Date().toISOString()
            };

            localStorage.setItem(shipmentKey, JSON.stringify(shipmentRecord));

            const completedOrder = {
              ...orderPayload,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              paymentStatus: "Paid",
              paymentVerified: true,
              status: "Shipped",
              courierProvider: provider,
              courier,
              shipmentId,
              awb,
              trackingUrl,
              shipmentStatus: "Created",
              updatedAt: new Date().toISOString()
            };

            try {
              const current = JSON.parse(
                localStorage.getItem("luxmo_pro_orders") || "[]"
              );
              const safeCurrent = Array.isArray(current) ? current : [];
              const updated = [
                completedOrder,
                ...safeCurrent.filter((o) => o?.id !== completedOrder.id)
              ];
              localStorage.setItem("luxmo_pro_orders", JSON.stringify(updated));
            } catch (e) {
              console.error("Could not save completed order:", e);
            }

            localStorage.removeItem(shipmentLockKey);

            alert(
              `Payment Successful!\n\nPayment ID: ${response.razorpay_payment_id}\nCourier: ${courier}\nAWB: ${awb || "Will be assigned shortly"}\n\nYour order has been confirmed for shipment.`
            );

            setCart([]);
            setActiveTab("home");
          } catch (error) {
            // Never report a post-payment processing error as "payment failed".
            console.error("Payment/shipment processing error:", error);
            try {
              localStorage.removeItem(shipmentLockKey);
            } catch {}
            alert(
              `Payment may have been successful, but order processing needs attention.\n\nPlease DO NOT make another payment.\nReference: ${response?.razorpay_order_id || "N/A"}`
            );
          }
        },

        prefill: {
          name: orderPayload.customer?.name || "Customer",
          email: orderPayload.customer?.email || BUSINESS_INFO.emails[0],
          contact: orderPayload.customer?.phone || BUSINESS_INFO.phones[0]
        },

        theme: {
          color: "#2563eb"
        }
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        try {
          localStorage.removeItem(shipmentLockKey);
        } catch {}
        alert(
          response.error?.description ||
            "Payment failed. Please try again."
        );
      });

      paymentObject.open();
    } catch (error) {
      console.error("Razorpay Error:", error);
      try {
        localStorage.removeItem(shipmentLockKey);
      } catch {}
      alert(error.message || "Unable to start payment.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col luxmo-page-root">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <span>GST Registered Proprietorship: <strong>{BUSINESS_INFO.legalName}</strong> ({BUSINESS_INFO.tradeName})</span>
          <div className="flex gap-4">
            <a href={`tel:${BUSINESS_INFO.phones[0]}`} className="hover:text-white flex items-center gap-1"><Phone className="w-3 h-3" /> {BUSINESS_INFO.phones[0]}</a>
            <a href={`mailto:${BUSINESS_INFO.emails[0]}`} className="hover:text-white flex items-center gap-1"><Mail className="w-3 h-3" /> {luxmoBusinessValue("email",BUSINESS_INFO.emails[0])}</a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setActiveTab("home")}>
            <div className="bg-slate-950 text-white font-black text-base sm:text-xl px-2.5 sm:px-3 py-1.5 rounded-xl tracking-wider border border-amber-500 shadow-sm whitespace-nowrap">
              LUX<span className="text-amber-400">M</span>O <span className="text-amber-400">HUB</span>
            </div>
          </div>

          <div className="flex-1 max-w-md relative hidden lg:block">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const term = String(searchQuery || "").trim();
                  if (term) {
                    const next = [term, ...recentSearches.filter(x => x.toLowerCase() !== term.toLowerCase())].slice(0, 8);
                    setRecentSearches(next);
                    safeWriteJSON(LUXMO_PRO_STORAGE.recentSearches, next);
                    setActiveTab("catalog");
                  }
                }
              }}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-white text-slate-900 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          </div>

          <div className="flex items-center justify-end gap-1.5 sm:gap-3 text-sm font-medium min-w-0 ml-auto">
            <button onClick={() => setActiveTab("home")} className={`px-2 py-2 rounded-lg whitespace-nowrap ${activeTab === 'home' ? 'text-blue-600 bg-blue-50 font-black' : 'text-slate-600'}`}>Home</button>
            <button onClick={() => setActiveTab("catalog")} className={`px-2 py-2 rounded-lg whitespace-nowrap ${activeTab === 'catalog' ? 'text-blue-600 bg-blue-50 font-black' : 'text-slate-600'}`}>Products</button>
            <button onClick={() => setActiveTab("policies")} className={`hidden sm:block px-2 py-2 rounded-lg whitespace-nowrap ${activeTab === 'policies' ? 'text-blue-600 bg-blue-50 font-black' : 'text-slate-600'}`}>Policies</button>
            <button onClick={() => setShowProCenter(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-2.5 sm:px-3 py-2 rounded-xl whitespace-nowrap shadow-sm">Store Tools</button>

            <button onClick={() => setActiveTab("cart")} className="relative p-2 rounded-xl hover:bg-slate-100 hover:text-blue-600 text-slate-700 shrink-0">
              <ShoppingBag className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.reduce((a, b) => a + b.qty, 0)}
                </span>
              )}
            </button>

            {isAdminLoggedIn ? (
              <>
                <LuxmoLowStockBadge
                  products={products}
                  isAdmin={isAdminLoggedIn}
                  onClick={() => setActiveTab("admin")}
                />
                <button onClick={() => setActiveTab("admin")} className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Dashboard
                </button>
              </>
            ) : (
              <button onClick={openAdminLogin} className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1">
                <Lock className="w-3 h-3" /> Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 min-w-0">
        {/* HOME VIEW */}
        {activeTab === "home" && (
          <div className="space-y-10">

            {/* CONTROLLED HOMEPAGE — rendered from published Admin settings */}
            <LuxmoControlledHomepageSections
              products={products}
              homepageConfig={homepagePublished}
              setSelectedCategory={setSelectedCategory}
              setActiveTab={setActiveTab}
              setShowSolarCalculator={setShowSolarCalculator}
              setShowTrackingModal={setShowTrackingModal}
              setShowWarrantyModal={setShowWarrantyModal}
              setShowWhatsAppModal={setShowWhatsAppModal}
              onSelectProduct={(p) => { setSelectedProduct(p); setSelectedVariantKey(p?.variants?.[0]?.key || ""); setActiveImageIndex(0); setActiveTab("product"); }}
            />

            {/* ORIGINAL HOME CONTENT — PRESERVED IN SOURCE, NOT SHOWN ON THE PREMIUM HOME */}
            <div className="hidden" aria-hidden="true">

            {/* HERO */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white shadow-2xl">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white,_transparent_35%)]" />
              <div className="relative px-6 py-10 md:px-12 md:py-14">
                <div className="max-w-4xl">
                  <p className="text-sm md:text-base font-bold tracking-[0.2em] text-amber-300 uppercase">
                    LUXMO HUB
                  </p>
                  <h1 className="mt-4 text-3xl md:text-5xl lg:text-6xl font-black leading-tight">
                    Hybrid Solar Inverters, Solar Accessories & Premium Mobile Cases
                  </h1>
                  <p className="mt-5 text-base md:text-xl text-slate-200">
                    Quality Products • Secure Payments • Reliable Support
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <button
                      onClick={() => {
                        setSelectedCategory("Hybrid Solar Inverter");
                        setActiveTab("catalog");
                      }}
                      className="px-6 py-3.5 rounded-xl bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition shadow-lg"
                    >
                      Shop Solar Inverters →
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory("Mobile Back Case");
                        setActiveTab("catalog");
                      }}
                      className="px-6 py-3.5 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition shadow-lg"
                    >
                      Shop Mobile Cases →
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* CUSTOMER QUICK TOOLS */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setShowTrackingModal(true)}
                className="rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 p-5 text-left transition"
              >
                <div className="text-2xl">📦</div>
                <h3 className="mt-2 font-black text-slate-900">Track Your Order</h3>
                <p className="text-xs text-slate-600 mt-1">Check shipment status using Order ID + mobile.</p>
              </button>

              <button
                type="button"
                onClick={() => setShowSolarCalculator(true)}
                className="rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100 p-5 text-left transition"
              >
                <div className="text-2xl">☀️</div>
                <h3 className="mt-2 font-black text-slate-900">Solar Calculator</h3>
                <p className="text-xs text-slate-600 mt-1">Estimate load and suitable inverter size.</p>
              </button>

              <button
                type="button"
                onClick={() => setShowWarrantyModal(true)}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 p-5 text-left transition"
              >
                <div className="text-2xl">🛡️</div>
                <h3 className="mt-2 font-black text-slate-900">Register Warranty</h3>
                <p className="text-xs text-slate-600 mt-1">Register your solar product after installation.</p>
              </button>

              <button
                type="button"
                onClick={() => setShowWhatsAppModal(true)}
                className="rounded-2xl border border-green-200 bg-green-50 hover:bg-green-100 p-5 text-left transition"
              >
                <div className="text-2xl">💬</div>
                <h3 className="mt-2 font-black text-slate-900">WhatsApp Quick Inquiry</h3>
                <p className="text-xs text-slate-600 mt-1">Bulk, solar, mobile case and support inquiries.</p>
              </button>
            </section>

            {/* TRUST */}
            <section className="space-y-5">
              <div className="text-center">
                <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">Why Choose Us</p>
                <h2 className="mt-1 text-2xl md:text-3xl font-black text-slate-900">Why Choose LUXMO HUB</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  ["✓", "Quality Products"],
                  ["✓", "GST Invoice"],
                  ["✓", "Secure Payment"],
                  ["✓", "Reliable Shipping"],
                  ["✓", "Customer Support"],
                  ["✓", "Warranty Support"]
                ].map(([icon, title]) => (
                  <div key={title} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg">
                      {icon}
                    </div>
                    <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                  </div>
                ))}
              </div>
            </section>

            {/* PRODUCT CATEGORIES */}
            <section className="space-y-5">
              <div className="text-center">
                <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">Shop by Category</p>
                <h2 className="mt-1 text-2xl md:text-3xl font-black text-slate-900">Our Product Categories</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  {
                    icon: "☀️",
                    title: "Hybrid Solar Inverters",
                    text: "Reliable hybrid power solutions for homes and solar-energy applications.",
                    category: "Hybrid Solar Inverter",
                    button: "Shop Solar Inverters →"
                  },
                  {
                    icon: "📱",
                    title: "Premium Mobile Cases",
                    text: "Stylish and protective cases for popular iPhone and Samsung models.",
                    category: "Mobile Back Case",
                    button: "Shop Mobile Cases →"
                  },
                  {
                    icon: "🔌",
                    title: "Solar Accessories",
                    text: "Practical accessories for safe and reliable solar installations.",
                    category: "Solar Accessories",
                    button: "Shop Solar Accessories →"
                  }
                ].map((item) => (
                  <div key={item.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
                      {item.icon}
                    </div>
                    <h3 className="mt-5 text-xl font-black text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-slate-600 leading-relaxed">{item.text}</p>
                    <button
                      onClick={() => {
                        setSelectedCategory(item.category);
                        setActiveTab("catalog");
                      }}
                      className="mt-5 text-blue-600 font-bold hover:text-blue-700"
                    >
                      {item.button}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* ABOUT */}
            <section className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-7 md:p-10">
                  <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">About LUXMO HUB</p>
                  <h2 className="mt-2 text-2xl md:text-3xl font-black text-slate-900">
                    Quality products with transparent, customer-focused support.
                  </h2>
                  <p className="mt-4 text-slate-600 leading-relaxed">
                    Welcome to LUXMO HUB, a customer-focused online brand offering quality products designed to meet everyday technology and renewable-energy needs.
                  </p>
                  <p className="mt-3 text-slate-600 leading-relaxed">
                    We focus on Hybrid Solar Inverters, Solar Accessories and Premium Mobile Phone Back Case Covers, with clear product information, secure packaging, reliable delivery support and transparent policies.
                  </p>
                  <button
                    onClick={() => setActiveTab("policies")}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
                  >
                    Learn More <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-slate-950 text-white p-7 md:p-10">
                  <h3 className="text-xl font-black">Our Commitment</h3>
                  <ul className="mt-5 space-y-3 text-slate-300">
                    <li>✓ Quality-focused products</li>
                    <li>✓ Accurate product information</li>
                    <li>✓ Secure packaging</li>
                    <li>✓ Reliable delivery support</li>
                    <li>✓ Transparent return and warranty policies</li>
                    <li>✓ Responsive customer support</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* DELIVERY HIGHLIGHT */}
            <section className="rounded-2xl bg-blue-50 border border-blue-100 p-6">
              <h2 className="text-xl font-black text-slate-900">🚚 Delivery Timeframe</h2>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-white rounded-xl p-4 border border-blue-100">
                  <p className="font-bold text-slate-900">📱 Mobile Phone Back Case Covers</p>
                  <p className="mt-1 text-blue-700 font-black">7–12 Business Days after dispatch</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-blue-100">
                  <p className="font-bold text-slate-900">☀️ Hybrid Solar Inverters</p>
                  <p className="mt-1 text-blue-700 font-black">8–14 Business Days after dispatch</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-3">
                Delivery time does not include order processing time and may vary by destination, courier serviceability and other circumstances.
              </p>
            </section>

            {/* SUPPORT */}
            <section className="rounded-2xl bg-slate-900 text-white p-7 text-center">
              <h2 className="text-2xl font-black">Need Help?</h2>
              <p className="mt-2 text-slate-300">Our customer support team is available for product, order, delivery and warranty assistance.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <a href={`tel:${BUSINESS_INFO.phones[0]}`} className="px-5 py-3 rounded-xl bg-white text-slate-900 font-bold">
                  Call +91 75650 12418
                </a>
                <a href={`mailto:${BUSINESS_INFO.emails[0]}`} className="px-5 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold">
                  Email Support
                </a>
              </div>
            </section>

            </div>
          </div>
        )}

        {/* CATALOG VIEW */}
        {activeTab === "catalog" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h1 className="text-xl font-bold">Catalog</h1>
              <div className="flex gap-2">
                <button onClick={() => setSelectedCategory("All")} className={`px-3 py-1 text-xs rounded-lg ${selectedCategory === "All" ? "bg-blue-600 text-white" : "bg-white border"}`}>All</button>
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 text-xs rounded-lg ${selectedCategory === cat ? "bg-blue-600 text-white" : "bg-white border"}`}>{cat}</button>
                ))}
              </div>
            </div>

            <LuxmoRecentSearches
              terms={recentSearches}
              onSelect={(term) => setSearchQuery(term)}
              onClear={() => {
                setRecentSearches([]);
                safeWriteJSON(LUXMO_PRO_STORAGE.recentSearches, []);
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map(prod => (
                <ProductCard key={prod.id} product={prod} onSelect={(p) => { setSelectedProduct(p); setSelectedVariantKey(p.variants?.[0]?.key || ""); setActiveImageIndex(0); setActiveTab("product"); }} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        )}

        {/* CUSTOMER POLICIES TAB VIEW */}
        {activeTab === "policies" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-slate-950 text-white rounded-3xl p-7 md:p-10 shadow-xl">
              <p className="text-sm font-bold text-amber-300 uppercase tracking-wider">LUXMO HUB Policies</p>
              <h1 className="mt-2 text-3xl md:text-4xl font-black">Customer Policies & Business Information</h1>
              <p className="mt-3 text-slate-300">Effective Date: 12 August 2026</p>
            </div>

            {/* ABOUT US — FULL CONTENT */}
            <section className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">LUXMO HUB</p>
                <h2 className="text-3xl font-black text-slate-900 mt-1">ABOUT US</h2>
              </div>

              <p>
                Welcome to LUXMO HUB, a customer-focused online brand offering quality products designed to meet everyday technology and renewable-energy needs.
              </p>

              <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-900">OUR PRODUCT CATEGORIES</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border bg-slate-50 p-5">
                    <h4 className="font-black text-slate-900">☀️ Hybrid Solar Inverters</h4>
                    <p className="mt-2 text-slate-600">
                      Reliable power solutions for homes, businesses, and solar-energy applications, with a focus on practical performance, safety, and dependable support.
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-slate-50 p-5">
                    <h4 className="font-black text-slate-900">📱 Mobile Phone Back Case Covers</h4>
                    <p className="mt-2 text-slate-600">
                      Stylish and protective phone cases designed to provide everyday protection while maintaining a clean and premium look.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">OUR COMMITMENT</h3>
                <p className="mt-2">
                  At LUXMO HUB, we believe that a good shopping experience goes beyond simply selling a product. We aim to provide:
                </p>
                <ul className="mt-3 list-disc pl-6 space-y-1">
                  <li>Quality-focused products</li>
                  <li>Accurate product information</li>
                  <li>Secure packaging</li>
                  <li>Reliable delivery support</li>
                  <li>Transparent return and replacement policies</li>
                  <li>Clear warranty terms</li>
                  <li>Responsive customer support</li>
                  <li>Fair and transparent complaint resolution</li>
                </ul>
                <p className="mt-4">
                  Our goal is to make every purchase simple, reliable, and trustworthy.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">QUALITY & PRODUCT VERIFICATION</h3>
                <p className="mt-2">
                  We aim to provide products that meet the specifications and descriptions published on our website.
                </p>
                <p className="mt-3">
                  For Hybrid Solar Inverters, customers are provided with applicable product specifications, installation requirements, safety information, and warranty terms.
                </p>
                <p className="mt-3">
                  For Mobile Phone Back Case Covers, product compatibility, model, colour, design, and other relevant details are provided on the applicable product page.
                </p>
                <p className="mt-3">
                  Customers are encouraged to carefully review product specifications before placing an order.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">CUSTOMER-FIRST APPROACH</h3>
                <p className="mt-2">
                  We understand that customers need confidence when purchasing products online, particularly electrical products such as Hybrid Solar Inverters.
                </p>
                <p className="mt-3">
                  That's why LUXMO HUB maintains dedicated policies covering:
                </p>
                <ul className="mt-3 list-disc pl-6 space-y-1">
                  <li>Shipping &amp; Delivery</li>
                  <li>Return &amp; Replacement</li>
                  <li>Refunds</li>
                  <li>Warranty</li>
                  <li>Unboxing Video &amp; Proof</li>
                  <li>Privacy</li>
                  <li>Grievance Redressal</li>
                  <li>Terms &amp; Customer Policies</li>
                </ul>
                <p className="mt-4">
                  These policies are designed to provide customers with clear information before and after purchase.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">OUR VISION</h3>
                <p className="mt-2">
                  Our vision is to build LUXMO HUB as a trusted online destination for practical, quality-focused products, while maintaining transparency, responsible customer service, and long-term customer relationships.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">OUR PROMISE</h3>
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-slate-50 p-4 font-bold">Quality Products.</div>
                  <div className="rounded-xl border bg-slate-50 p-4 font-bold">Transparent Policies.</div>
                  <div className="rounded-xl border bg-slate-50 p-4 font-bold">Reliable Support.</div>
                  <div className="rounded-xl border bg-slate-50 p-4 font-bold">Customer Trust.</div>
                </div>
                <p className="mt-4">At LUXMO HUB, every order matters to us.</p>
                <p className="mt-3 font-black text-slate-900">LUXMO HUB — QUALITY PRODUCTS, TRUSTED BY YOU.</p>
              </div>

              <div className="rounded-2xl bg-slate-950 text-white p-6">
                <h3 className="text-xl font-black">BUSINESS INFORMATION</h3>
                <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
                  <p><strong>Trade Name / Brand:</strong> LUXMO HUB</p>
                  <p><strong>Legal Business Name:</strong> Sarita Devi</p>
                  <p><strong>Business Constitution:</strong> Proprietorship</p>
                  <p><strong>GSTIN:</strong> 09CNCPD1174R1ZN</p>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
                  <h4 className="text-lg font-black text-amber-300">Udyam / MSME Registration Details</h4>

                  <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-slate-200">
                    <p><strong>Udyam Registration Number:</strong> {BUSINESS_INFO.udyam.registrationNumber}</p>
                    <p><strong>Name of Enterprise:</strong> {BUSINESS_INFO.udyam.enterpriseName}</p>
                    <p><strong>Classification Year:</strong> {BUSINESS_INFO.udyam.classificationYear}</p>
                    <p><strong>Enterprise Type:</strong> {BUSINESS_INFO.udyam.enterpriseType}</p>
                    <p><strong>Classification Date:</strong> {BUSINESS_INFO.udyam.classificationDate}</p>
                    <p><strong>Major Activity:</strong> {BUSINESS_INFO.udyam.majorActivity}</p>
                    <p><strong>Social Category:</strong> {BUSINESS_INFO.udyam.socialCategory}</p>
                    <p><strong>Name of Unit:</strong> {BUSINESS_INFO.udyam.unitName}</p>
                    <p><strong>Registered Mobile:</strong> {BUSINESS_INFO.udyam.registeredMobile}</p>
                    <p><strong>Registered Email:</strong> {BUSINESS_INFO.udyam.registeredEmail}</p>
                    <p><strong>Date of Incorporation / Registration:</strong> {BUSINESS_INFO.udyam.dateOfIncorporationRegistration}</p>
                    <p><strong>Date of Commencement of Production / Business:</strong> {BUSINESS_INFO.udyam.dateOfCommencementOfProductionBusiness}</p>
                    <p><strong>Date of Udyam Registration:</strong> {BUSINESS_INFO.udyam.dateOfUdyamRegistration}</p>
                  </div>

                  <div className="mt-5 pt-5 border-t border-slate-700">
                    <h4 className="font-bold text-amber-300">Official Address of Enterprise</h4>
                    <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm text-slate-300">
                      <p><strong>Flat/Door/Block No.:</strong> {BUSINESS_INFO.udyam.officialAddress.flatDoorBlockNo}</p>
                      <p><strong>Name of Premises/Building:</strong> {BUSINESS_INFO.udyam.officialAddress.premisesBuilding}</p>
                      <p><strong>Village/Town:</strong> {BUSINESS_INFO.udyam.officialAddress.villageTown}</p>
                      <p><strong>Block/Post:</strong> {BUSINESS_INFO.udyam.officialAddress.blockPost}</p>
                      <p><strong>Road/Street/Lane:</strong> {BUSINESS_INFO.udyam.officialAddress.roadStreetLane}</p>
                      <p><strong>City:</strong> {BUSINESS_INFO.udyam.officialAddress.city}</p>
                      <p><strong>State:</strong> {BUSINESS_INFO.udyam.officialAddress.state}</p>
                      <p><strong>District:</strong> {BUSINESS_INFO.udyam.officialAddress.district}</p>
                      <p><strong>PIN:</strong> {BUSINESS_INFO.udyam.officialAddress.pinCode}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t border-slate-700">
                    <h4 className="font-bold text-amber-300">National Industry Classification (NIC) Codes</h4>
                    <div className="mt-3 space-y-3 text-sm text-slate-300">
                      <p><strong>NIC 2 Digit:</strong> {BUSINESS_INFO.udyam.nicClassification.nic2Digit} — {BUSINESS_INFO.udyam.nicClassification.nic2DigitActivity}</p>
                      <p><strong>NIC 4 Digit:</strong> {BUSINESS_INFO.udyam.nicClassification.nic4Digit} — {BUSINESS_INFO.udyam.nicClassification.nic4DigitActivity}</p>
                      <p><strong>NIC 5 Digit:</strong> {BUSINESS_INFO.udyam.nicClassification.nic5Digit} — {BUSINESS_INFO.udyam.nicClassification.nic5DigitActivity}</p>
                      <p><strong>Activity:</strong> {BUSINESS_INFO.udyam.nicClassification.activity}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t border-slate-700">
                    <h4 className="font-bold text-amber-300">Udyam Assistance Offices</h4>
                    <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm text-slate-300">
                      <p><strong>District Industries Centre:</strong> {BUSINESS_INFO.udyam.assistance.districtIndustriesCentre}</p>
                      <p><strong>MSME-DFO:</strong> {BUSINESS_INFO.udyam.assistance.msmeDfo}</p>
                    </div>
                  </div>
                </div>

                <h4 className="font-bold mt-6">Customer Support:</h4>
                <p className="mt-1">Email: <a href="mailto:luxmohub@gmail.com" className="underline hover:text-white">luxmohub@gmail.com</a></p>
                <p>Phone: <a href="tel:+917565012418" className="underline hover:text-white">+91 75650 12418</a></p>

                <h4 className="font-bold mt-6">Grievance Redressal Officer:</h4>
                <p className="mt-1">Gyaneshwar Sharma</p>
                <p>Email: <a href="mailto:luxmohub@gmail.com" className="underline hover:text-white">luxmohub@gmail.com</a></p>
                <p>Phone: <a href="tel:+917565012418" className="underline hover:text-white">+91 75650 12418</a></p>
              </div>
            </section>

            {/* SHIPPING & DELIVERY — FULL CONTENT */}
            <section className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                  🚚 LUXMO HUB — Shipping &amp; Delivery Timeframe
                </h2>
                <p className="text-xs text-slate-500 mt-2">Effective Date: 12 August 2026</p>
              </div>

              <p>
                At LUXMO HUB, we aim to process, dispatch, and deliver every order safely and efficiently. Delivery timelines may vary depending on the product category, delivery location, courier serviceability, weather conditions, public holidays, and other circumstances beyond our reasonable control.
              </p>

              <div>
                <h3 className="font-black text-lg">1. Expected Delivery Time</h3>
                <p className="mt-2">
                  The following delivery timeframes apply after the order has been processed and dispatched.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-50 rounded-xl p-5 border">
                    <p className="font-black text-slate-900">📱 Mobile Phone Back Case Covers</p>
                    <p className="text-blue-700 font-black mt-2">Expected Delivery: 7–12 Business Days</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-5 border">
                    <p className="font-black text-slate-900">☀️ Hybrid Solar Inverters</p>
                    <p className="text-blue-700 font-black mt-2">Expected Delivery: 8–14 Business Days</p>
                  </div>
                </div>

                <p className="mt-4 text-sm">
                  <strong>Important:</strong> The above delivery timeframe does not include the order processing time.
                </p>
              </div>

              <div>
                <h3 className="font-black text-lg">2. Delivery Timeline</h3>
                <p className="mt-2">
                  The estimated delivery period begins from the date the order is dispatched and handed over to the courier partner.
                </p>
                <p className="mt-3">
                  Once the order has been dispatched, LUXMO HUB will provide available shipment or tracking information through the applicable communication channel.
                </p>
                <p className="mt-3">
                  Delivery estimates are calculated based on normal courier operations and may vary depending on the destination and service availability.
                </p>
              </div>

              <div>
                <h3 className="font-black text-lg">3. Factors That May Affect Delivery</h3>
                <p className="mt-2">Delivery may take longer than the estimated timeframe due to:</p>
                <ul className="mt-3 list-disc pl-6 space-y-1">
                  <li>Remote or difficult-to-service delivery locations</li>
                  <li>Courier partner delays</li>
                  <li>Weather conditions or natural events</li>
                  <li>Public holidays and weekends</li>
                  <li>Transportation or logistics disruptions</li>
                  <li>Festive seasons or periods of high shipping volume</li>
                  <li>Incorrect or incomplete delivery information</li>
                  <li>Local delivery restrictions or serviceability issues</li>
                  <li>Circumstances beyond LUXMO HUB's reasonable control</li>
                </ul>
              </div>

              <div>
                <h3 className="font-black text-lg">4. Delivery Delays</h3>
                <p className="mt-2">
                  The delivery timelines provided by LUXMO HUB are estimated timeframes and are not guaranteed delivery dates.
                </p>
                <p className="mt-3">
                  If a shipment is delayed beyond the estimated timeframe, customers may contact LUXMO HUB Customer Support with their Order ID and available tracking details for assistance.
                </p>
                <p className="mt-3">
                  LUXMO HUB will make reasonable efforts to assist customers in resolving delivery-related issues.
                </p>
              </div>

              <div>
                <h3 className="font-black text-lg">5. Customer Responsibility</h3>
                <p className="mt-2">Customers are responsible for providing a complete and accurate:</p>
                <ul className="mt-3 list-disc pl-6 space-y-1">
                  <li>Delivery address</li>
                  <li>PIN code</li>
                  <li>Mobile number</li>
                  <li>Email address, where required</li>
                  <li>Other delivery information requested during checkout</li>
                </ul>
                <p className="mt-3">
                  Delays or failed delivery attempts resulting from incorrect, incomplete, or inaccurate customer-provided information may not be attributable to LUXMO HUB.
                </p>
              </div>

              <div>
                <h3 className="font-black text-lg">6. Delivery Attempt &amp; Undelivered Orders</h3>
                <p className="mt-2">
                  Customers should ensure that someone is available to receive the shipment at the provided delivery address.
                </p>
                <p className="mt-3">
                  If a shipment cannot be delivered because of an incorrect address, unavailable recipient, refusal to accept the shipment, or other customer-related circumstances, the courier partner may attempt re-delivery or return the shipment to LUXMO HUB, subject to the courier's applicable procedures.
                </p>
                <p className="mt-3">
                  Any applicable re-shipping or additional delivery charges, where relevant and permitted, may be communicated separately.
                </p>
              </div>

              <div>
                <h3 className="font-black text-lg">7. Estimated Delivery Summary</h3>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border p-3 text-left">Product Category</th>
                        <th className="border p-3 text-left">Expected Delivery</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-3">📱 Mobile Phone Back Case Cover</td>
                        <td className="border p-3">7–12 Business Days</td>
                      </tr>
                      <tr>
                        <td className="border p-3">☀️ Hybrid Solar Inverter</td>
                        <td className="border p-3">8–14 Business Days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  <strong>Note:</strong> Delivery time is calculated after order processing and dispatch. Actual delivery time may vary depending on the destination, courier serviceability, and other circumstances affecting transportation.
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">
                <h3 className="font-black text-lg">8. Customer Support</h3>
                <p className="mt-2">For delivery-related assistance, customers should contact:</p>
                <p className="mt-3 font-bold">LUXMO HUB</p>
                <p>Email: <a href="mailto:luxmohub@gmail.com" className="text-blue-700 underline">luxmohub@gmail.com</a></p>
                <p>Phone: <a href="tel:+917565012418" className="text-blue-700 underline">+91 75650 12418</a></p>
                <p className="mt-3 text-sm">
                  Please keep your Order ID and tracking details available when contacting customer support.
                </p>
              </div>

              <p className="font-black text-slate-900">LUXMO HUB — Quality Products, Trusted by You.</p>
            </section>

            {/* RETURN & REPLACEMENT — FULL POLICY */}
             <section className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm">
               <PolicyDocument text={RETURN_REPLACEMENT_POLICY} />
             </section>

             {/* UNBOXING & PROOF — FULL POLICY */}
             <section className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm">
               <PolicyDocument text={UNBOXING_POLICY} />
             </section>

             {/* WARRANTY — FULL POLICY */}
             <section className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm">
               <PolicyDocument text={WARRANTY_POLICY_FULL} />
             </section>

             {/* GRIEVANCE */}
            <section className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-2xl font-black text-slate-900">⚖️ Grievance Redressal &amp; Customer Complaint</h2>
              <p>LUXMO HUB aims to acknowledge customer complaints within 48 hours and aims to redress complaints within one month, subject to applicable law and the nature and complexity of the complaint.</p>
              <div className="bg-slate-50 rounded-xl p-5 border">
                <p><strong>Grievance Redressal Officer:</strong> Gyaneshwar Sharma</p>
                <p><strong>Email:</strong> luxmohub@gmail.com</p>
                <p><strong>Phone:</strong> +91 75650 12418</p>
              </div>
            </section>

            {/* BUSINESS INFORMATION */}
            <section className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900">🏢 Business Information</h2>
              <div className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
                <div><span className="font-bold">Trade Name / Brand:</span> LUXMO HUB</div>
                <div><span className="font-bold">Legal Business Name:</span> Sarita Devi</div>
                <div><span className="font-bold">Business Constitution:</span> Proprietorship</div>
                <div><span className="font-bold">GSTIN:</span> 09CNCPD1174R1ZN</div>
                <div><span className="font-bold">Customer Support:</span> luxmohub@gmail.com</div>
                <div><span className="font-bold">Phone:</span> +91 75650 12418</div>
                <div><span className="font-bold">Grievance Officer:</span> Gyaneshwar Sharma</div>
              </div>
            </section>

            {/* COMPLETE UDYAM / MSME REGISTRATION */}
            <section className="bg-slate-950 text-white border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Government Registration</p>
              <h2 className="mt-1 text-2xl md:text-3xl font-black">Udyam / MSME Registration Details</h2>

              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="rounded-xl bg-white/5 border border-slate-700 p-4">
                  <p className="text-slate-400">Udyam Registration Number</p>
                  <p className="mt-1 font-black text-amber-300">{BUSINESS_INFO.udyam.registrationNumber}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-slate-700 p-4">
                  <p className="text-slate-400">Name of Enterprise</p>
                  <p className="mt-1 font-black">{BUSINESS_INFO.udyam.enterpriseName}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-slate-700 p-4">
                  <p className="text-slate-400">Enterprise Type</p>
                  <p className="mt-1 font-black">{BUSINESS_INFO.udyam.enterpriseType}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-slate-700 p-4">
                  <p className="text-slate-400">Classification Year</p>
                  <p className="mt-1 font-black">{BUSINESS_INFO.udyam.classificationYear}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-slate-700 p-4">
                  <p className="text-slate-400">Classification Date</p>
                  <p className="mt-1 font-black">{BUSINESS_INFO.udyam.classificationDate}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-slate-700 p-4">
                  <p className="text-slate-400">Major Activity</p>
                  <p className="mt-1 font-black">{BUSINESS_INFO.udyam.majorActivity}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-slate-700 p-4">
                  <p className="text-slate-400">Social Category</p>
                  <p className="mt-1 font-black">{BUSINESS_INFO.udyam.socialCategory}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-slate-700 p-4">
                  <p className="text-slate-400">Name of Unit</p>
                  <p className="mt-1 font-black">{BUSINESS_INFO.udyam.unitName}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-slate-700 p-4">
                  <p className="text-slate-400">Registered Mobile</p>
                  <p className="mt-1 font-black">{BUSINESS_INFO.udyam.registeredMobile}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-slate-700 p-4">
                  <p className="text-slate-400">Registered Email</p>
                  <p className="mt-1 font-black">{BUSINESS_INFO.udyam.registeredEmail}</p>
                </div>
                <div className="sm:col-span-2 rounded-xl bg-white/5 border border-slate-700 p-4">
                  <p className="text-slate-400">Date of Incorporation / Registration</p>
                  <p className="mt-1 font-black">{BUSINESS_INFO.udyam.dateOfIncorporationRegistration}</p>
                </div>
                <div className="sm:col-span-2 rounded-xl bg-white/5 border border-slate-700 p-4">
                  <p className="text-slate-400">Date of Commencement of Production / Business</p>
                  <p className="mt-1 font-black">{BUSINESS_INFO.udyam.dateOfCommencementOfProductionBusiness}</p>
                </div>
                <div className="sm:col-span-2 rounded-xl bg-white/5 border border-slate-700 p-4">
                  <p className="text-slate-400">Date of Udyam Registration</p>
                  <p className="mt-1 font-black">{BUSINESS_INFO.udyam.dateOfUdyamRegistration}</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-white/5 border border-slate-700 p-5">
                <h3 className="font-black text-amber-300">Official Address of Enterprise</h3>
                <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-slate-300">
                  <p><strong>Flat/Door/Block No.:</strong> {BUSINESS_INFO.udyam.officialAddress.flatDoorBlockNo}</p>
                  <p><strong>Premises/Building:</strong> {BUSINESS_INFO.udyam.officialAddress.premisesBuilding}</p>
                  <p><strong>Village/Town:</strong> {BUSINESS_INFO.udyam.officialAddress.villageTown}</p>
                  <p><strong>Block/Post:</strong> {BUSINESS_INFO.udyam.officialAddress.blockPost}</p>
                  <p><strong>Road/Street/Lane:</strong> {BUSINESS_INFO.udyam.officialAddress.roadStreetLane}</p>
                  <p><strong>City:</strong> {BUSINESS_INFO.udyam.officialAddress.city}</p>
                  <p><strong>State:</strong> {BUSINESS_INFO.udyam.officialAddress.state}</p>
                  <p><strong>District:</strong> {BUSINESS_INFO.udyam.officialAddress.district}</p>
                  <p><strong>PIN:</strong> {BUSINESS_INFO.udyam.officialAddress.pinCode}</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-white/5 border border-slate-700 p-5">
                <h3 className="font-black text-amber-300">National Industry Classification (NIC) Codes</h3>
                <div className="mt-3 space-y-3 text-sm text-slate-300">
                  <p><strong>NIC 2 Digit:</strong> {BUSINESS_INFO.udyam.nicClassification.nic2Digit} — {BUSINESS_INFO.udyam.nicClassification.nic2DigitActivity}</p>
                  <p><strong>NIC 4 Digit:</strong> {BUSINESS_INFO.udyam.nicClassification.nic4Digit} — {BUSINESS_INFO.udyam.nicClassification.nic4DigitActivity}</p>
                  <p><strong>NIC 5 Digit:</strong> {BUSINESS_INFO.udyam.nicClassification.nic5Digit} — {BUSINESS_INFO.udyam.nicClassification.nic5DigitActivity}</p>
                  <p><strong>Activity:</strong> {BUSINESS_INFO.udyam.nicClassification.activity}</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-white/5 border border-slate-700 p-5">
                <h3 className="font-black text-amber-300">Udyam Assistance Offices</h3>
                <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm text-slate-300">
                  <p><strong>District Industries Centre:</strong> {BUSINESS_INFO.udyam.assistance.districtIndustriesCentre}</p>
                  <p><strong>MSME-DFO:</strong> {BUSINESS_INFO.udyam.assistance.msmeDfo}</p>
                </div>
              </div>
            </section>

            {/* EXISTING POLICY SUMMARY */}
            <section className="bg-slate-50 border rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-black text-slate-900">Important Customer Policies</h2>
              <p className="mt-3 text-slate-600">The full policy documents below should be read together with the applicable product page, sales invoice and product-specific terms.</p>
              <ul className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                <li>• Terms &amp; Customer Policies</li>
                <li>• Privacy Policy</li>
                <li>• Return &amp; Replacement</li>
                <li>• Refund Policy</li>
                <li>• Warranty Policy</li>
                <li>• Shipping &amp; Delivery</li>
                <li>• Unboxing &amp; Proof</li>
                <li>• Grievance Redressal</li>
              </ul>
            </section>
          </div>
        )}

        {/* PRODUCT DETAILS VIEW */}
        {activeTab === "product" && selectedProduct && (
          <>
            <LuxmoProductSchema product={displayedProduct || selectedProduct} />
            <LuxmoTrustStrip />
            <LuxmoVariantSummary product={selectedProduct} />
            <div className="bg-white rounded-2xl border p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <img
                src={(displayedProduct.images && displayedProduct.images[activeImageIndex]) || displayedProduct.image}
                alt={selectedProduct.title}
                className="w-full aspect-square object-cover rounded-xl border"
              />

              {selectedProduct.images && selectedProduct.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedProduct.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt=""
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-16 object-cover rounded-lg border-2 cursor-pointer ${activeImageIndex === idx ? "border-blue-600" : "border-transparent"}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{selectedProduct.title}</h1>
              {selectedProduct.category === "Mobile Back Case" && selectedProductVariants.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-2 text-slate-700">Select Device Model</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProductVariants.map(v => v.model).filter((m, i, arr) => arr.indexOf(m) === i).map(model => {
                        const isActive = activeVariant?.model === model;
                        return <button key={model} type="button" onClick={() => { const next = selectedProductVariants.find(v => v.model === model); setSelectedVariantKey(next?.key || ""); setActiveImageIndex(0); }} className={`px-3 py-2 rounded-lg border text-xs font-semibold ${isActive ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-700"}`}>{model}</button>;
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 text-slate-700">Select Colour</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProductVariants.filter(v => v.model === activeVariant?.model).map(v => (
                        <button key={v.key} type="button" onClick={() => { setSelectedVariantKey(v.key); setActiveImageIndex(0); }} className={`px-3 py-2 rounded-lg border text-xs font-semibold ${activeVariant?.key === v.key ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-700"}`}>{v.colour}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500">Model: {displayedProduct.model}{displayedProduct.colour ? ` · ${displayedProduct.colour}` : ""}</p>

              {selectedProduct.material && selectedProduct.material !== "Not Applicable" && (
                <p className="text-xs text-slate-500">Material / Type: {selectedProduct.material}</p>
              )}

              <div className="text-2xl font-extrabold text-slate-900">
                ₹{displayedProduct.salePrice || displayedProduct.price}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Tax Information</h3>
                  {selectedProduct.hsn && selectedProduct.gstRate != null && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                      Tax Details
                    </span>
                  )}
                </div>

                {selectedProduct.hsn && selectedProduct.gstRate != null ? (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <span className="text-slate-500 block">HSN Code</span>
                      <strong className="text-slate-900 text-sm">{selectedProduct.hsn}</strong>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <span className="text-slate-500 block">GST Rate</span>
                      <strong className="text-slate-900 text-sm">{selectedProduct.gstRate}%</strong>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-3">
                    <strong className="text-slate-800">Tax classification:</strong> HSN/GST details are not configured for this product category.
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-600 whitespace-pre-line">
                {displayedProduct.description}
              </p>

              {displayedProduct.specs && <div className="rounded-2xl border bg-slate-50 p-4">
                <h3 className="font-black text-sm">Technical Specifications</h3>
                <p className="mt-2 text-xs text-slate-600 whitespace-pre-line">{displayedProduct.specs}</p>
              </div>}
              {displayedProduct.category === "Hybrid Solar Inverter" && displayedProduct.inverterSpecs && Object.values(displayedProduct.inverterSpecs).some(Boolean) && <div className="rounded-2xl border bg-amber-50 p-4">
                <h3 className="font-black text-sm">Solar Inverter Specifications</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">{Object.entries(displayedProduct.inverterSpecs).filter(([,v])=>String(v||"").trim()).map(([k,v])=><div key={k} className="rounded-xl bg-white border p-2"><span className="block text-[10px] uppercase text-slate-500">{k.replace(/([A-Z])/g," $1")}</span><strong>{v}</strong></div>)}</div>
              </div>}
              {displayedProduct.category === "Mobile Back Case" && displayedProduct.mobileSpecs && Object.values(displayedProduct.mobileSpecs).some(Boolean) && <div className="rounded-2xl border bg-blue-50 p-4">
                <h3 className="font-black text-sm">Mobile Case Specifications</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">{Object.entries(displayedProduct.mobileSpecs).filter(([,v])=>String(v||"").trim()).map(([k,v])=><div key={k} className="rounded-xl bg-white border p-2"><span className="block text-[10px] uppercase text-slate-500">{k.replace(/([A-Z])/g," $1")}</span><strong>{v}</strong></div>)}</div>
              </div>}

              <button
                onClick={() => addToCart(selectedProduct, activeVariant)}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-sm"
              >
                Add to Cart
              </button>
            </div>
          </div>
          </>
        )}

        {/* CART VIEW */}
        {activeTab === "cart" && (
          <div className="bg-white rounded-2xl border p-6 max-w-2xl mx-auto space-y-6">
            <h1 className="text-xl font-bold border-b pb-3">Shopping Cart</h1>
            {cart.length === 0 ? <p className="text-center text-slate-500 py-8">Your cart is empty.</p> : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-500">Qty: {item.qty} × ₹{item.salePrice || item.price}</p>
                    </div>
                    <span className="font-bold">₹{(item.salePrice || item.price) * item.qty}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-lg font-bold pt-2">
                  <span>Total Payable:</span>
                  <span className="text-blue-600">₹{cartTotal}</span>
                </div>
                <button
                  onClick={() => setShowProCenter(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm"
                >
                  Proceed to Secure Checkout
                </button>
                <p className="text-[10px] text-slate-500 text-center mt-2">
                  Enter your delivery address and choose your payment method at checkout.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ADMIN DASHBOARD VIEW */}
        {activeTab === "admin" && isAdminLoggedIn && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b pb-4">
              <div>
                <h1 className="text-xl font-bold">Admin Management Console</h1>
                <p className="text-xs text-slate-500 mt-1">Inventory, products and operational controls.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <LuxmoLowStockBadge products={products} isAdmin={isAdminLoggedIn} />
                <button onClick={handleAdminLogout} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-xs font-bold">Log Out Admin</button>
              </div>
            </div>

            <LuxmoHomepageAdmin
              products={products}
              homepageDraft={homepageDraft}
              setHomepageDraft={setHomepageDraft}
              onSaveDraft={saveHomepageDraft}
              onPublish={publishHomepage}
              previewMode={homepagePreview}
              setPreviewMode={setHomepagePreview}
            />

            <LuxmoMasterAdminControl products={products} setProducts={setProducts} />

            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-bold mb-4">{editingProduct ? "Edit Product" : "Add Product"}</h2>
              {formError && <p className="text-xs text-red-600 mb-4 bg-red-50 p-2 rounded font-semibold">{formError}</p>}
              
              <form onSubmit={validateAndSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-bold mb-1 text-slate-700">Product Title</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="Enter product title..."
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Category</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold mb-1 text-slate-700">Device Models (Multi-Select)</label>
                  <select multiple value={formData.models || [formData.model]} onChange={e => { const models = Array.from(e.target.selectedOptions).map(o => o.value); setFormData({ ...formData, models, model: models[0] || '' }); }} className="w-full min-h-40 p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    {(MODEL_MAP[formData.category] || []).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Mobile cases: Ctrl/Cmd-click (desktop) or multi-select to choose all compatible models for this design.</p>
                </div>

                {formData.category === "Mobile Back Case" && (
                  <div className="md:col-span-2">
                    <label className="block font-bold mb-1 text-slate-700">Colours (Multi-Select)</label>
                    <select multiple value={formData.colours || [MOBILE_COLOURS[0]]} onChange={e => setFormData({ ...formData, colours: Array.from(e.target.selectedOptions).map(o => o.value) })} className="w-full min-h-32 p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      {MOBILE_COLOURS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, variants: buildVariantMatrix(prev.models, prev.colours, prev.sku, prev.price, prev.salePrice, prev.stock, prev.images) }))} className="mt-2 bg-slate-900 text-white font-bold px-4 py-2 rounded-md">Generate Model × Colour Variants</button>
                  </div>
                )}

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Product Material / Type</label>
                  <select
                    value={formData.material}
                    onChange={e => setFormData({ ...formData, material: e.target.value })}
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {(MATERIAL_OPTIONS[formData.category] || []).map(material => (
                      <option key={material || 'select-material'} value={material}>
                        {MATERIAL_LABELS[material] || material}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900">Tax Information</h3>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          HSN and GST are assigned automatically from the selected category/material.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-white border border-blue-200 text-blue-700">
                        Auto Assigned
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg border border-blue-100 p-3">
                        <span className="block text-[10px] uppercase tracking-wide font-bold text-slate-500">Category</span>
                        <strong className="block mt-1 text-sm text-slate-900">{formData.category}</strong>
                      </div>

                      <div className="bg-white rounded-lg border border-blue-100 p-3">
                        <span className="block text-[10px] uppercase tracking-wide font-bold text-slate-500">HSN Code</span>
                        <strong className="block mt-1 text-sm text-slate-900">
                          {currentFormTaxInfo?.hsn || "Select applicable material"}
                        </strong>
                      </div>

                      <div className="bg-white rounded-lg border border-blue-100 p-3">
                        <span className="block text-[10px] uppercase tracking-wide font-bold text-slate-500">GST Rate</span>
                        <strong className="block mt-1 text-sm text-slate-900">
                          {currentFormTaxInfo ? `${currentFormTaxInfo.gstRate}%` : "Select applicable material"}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-3 text-[11px]">
                      {currentFormTaxInfo ? (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-800">
                          <strong>Tax classification:</strong> {currentFormTaxInfo.label}
                        </div>
                      ) : formData.category === "Mobile Back Case" ? (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800">
                          Select Genuine Leather, PU Leather, or Plastic / Silicone / TPU / Rubber to display the correct HSN and GST.
                        </div>
                      ) : (
                        <div className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-slate-600">
                          HSN/GST classification has not been supplied for this category. Do not enter or invent a tax code.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Price (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.price} 
                    onChange={e => setFormData({ ...formData, price: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Sale Price (Optional ₹)</label>
                  <input 
                    type="number" 
                    value={formData.salePrice} 
                    onChange={e => setFormData({ ...formData, salePrice: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Stock</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.stock} 
                    onChange={e => setFormData({ ...formData, stock: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">SKU</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.sku} 
                    onChange={e => setFormData({ ...formData, sku: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>

                {formData.category === "Mobile Back Case" && formData.variants?.length > 0 && (
                  <div className="md:col-span-2 border rounded-xl overflow-auto bg-white">
                    <div className="p-3 border-b bg-slate-50 font-bold text-slate-800">Generated Variants ({formData.variants.length})</div>
                    <table className="w-full text-[11px]">
                      <thead><tr className="border-b"><th className="p-2 text-left">Model</th><th className="p-2 text-left">Colour</th><th className="p-2 text-left">SKU</th><th className="p-2 text-left">Stock</th></tr></thead>
                      <tbody>{formData.variants.map((v, i) => <tr key={v.key || i} className="border-b last:border-0"><td className="p-2">{v.model}</td><td className="p-2">{v.colour}</td><td className="p-2">{v.sku}</td><td className="p-2">{v.stock}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}

                <div className="md:col-span-2 border-2 border-dashed border-slate-300 p-4 rounded-lg bg-slate-50 text-center">
                  <label className="block font-bold mb-2 text-slate-700">Upload Product Images (Up to 5)</label>
                  
                  {formData.images.length < 5 && (
                    <>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        id="multi-file-input" 
                        disabled={isCompressing}
                      />
                      <label 
                        htmlFor="multi-file-input" 
                        className={`cursor-pointer inline-flex items-center gap-2 text-white px-4 py-2 rounded-md font-bold transition ${isCompressing ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-500'}`}
                      >
                        <Upload className="w-4 h-4" /> 
                        {isCompressing ? "Optimizing Images..." : `Select Images (${formData.images.length}/5)`}
                      </label>
                    </>
                  )}

                  {formData.images.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3 justify-center">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative group border rounded-lg overflow-hidden bg-white shadow-sm">
                          <img src={img} alt={`Preview ${index}`} className="w-20 h-20 object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs shadow hover:bg-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="font-black text-slate-900">Advanced Product Controls</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md" value={formData.badge || ''} onChange={e=>setFormData({...formData,badge:e.target.value})} placeholder="Offer badge e.g. 20% OFF / Best Seller" />
                    <input className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md" value={formData.buyNowUrl || ''} onChange={e=>setFormData({...formData,buyNowUrl:e.target.value})} placeholder="Buy Now URL (optional)" />
                    <input className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md" value={formData.detailsUrl || ''} onChange={e=>setFormData({...formData,detailsUrl:e.target.value})} placeholder="View Details URL (optional)" />
                    <input className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md" value={formData.seoTitle || ''} onChange={e=>setFormData({...formData,seoTitle:e.target.value})} placeholder="Product SEO Title" />
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs font-bold">
                    <label><input type="checkbox" checked={!!formData.featured} onChange={e=>setFormData({...formData,featured:e.target.checked})}/> Featured</label>
                    <label><input type="checkbox" checked={!!formData.bestSeller} onChange={e=>setFormData({...formData,bestSeller:e.target.checked})}/> Best Seller</label>
                    <label><input type="checkbox" checked={!!formData.hotDeal} onChange={e=>setFormData({...formData,hotDeal:e.target.checked})}/> Hot Deal</label>
                    <label><input type="checkbox" checked={!!formData.published} onChange={e=>setFormData({...formData,published:e.target.checked})}/> Published</label>
                  </div>
                  <textarea rows="3" className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md" value={formData.seoDescription || ''} onChange={e=>setFormData({...formData,seoDescription:e.target.value})} placeholder="Product SEO Meta Description" />
                  <input className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md" value={formData.seoCanonical || ''} onChange={e=>setFormData({...formData,seoCanonical:e.target.value})} placeholder="Product Canonical URL" />
                  <label className="block border rounded-xl p-3 text-xs font-bold">Product SEO / Open Graph Image
                    <input type="file" accept="image/*" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{const v=await compressImage(f);setFormData(prev=>({...prev,seoOgImage:v}));}catch{alert("SEO image upload failed.");}}} className="mt-2 block w-full"/>
                  </label>
                  {formData.category === "Hybrid Solar Inverter" && <div className="border rounded-xl p-4 bg-amber-50 space-y-3">
                    <div className="font-black">☀️ Structured Hybrid Inverter Specifications</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">{Object.entries({ratedPower:"Rated Power",batteryVoltage:"Battery Voltage",mpptCurrent:"MPPT Current",pvInput:"PV Input",mpptVoltage:"MPPT Voltage",acInput:"AC Input",acOutput:"AC Output",batteryType:"Battery Type",bms:"BMS Communication",wifi:"Wi-Fi Monitoring",parallel:"Parallel Support",ipRating:"IP Rating",weight:"Weight",warranty:"Warranty"}).map(([k,label])=><input key={k} className="p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md" value={formData.inverterSpecs?.[k] || ''} onChange={e=>setFormData(prev=>({...prev,inverterSpecs:{...(prev.inverterSpecs||{}),[k]:e.target.value}}))} placeholder={label}/>)}</div>
                  </div>}
                  {formData.category === "Mobile Back Case" && <div className="border rounded-xl p-4 bg-blue-50 space-y-3">
                    <div className="font-black">📱 Structured Mobile Case Specifications</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">{Object.entries({brand:"Phone Brand",phoneModel:"Phone Model",material:"Material",magsafe:"MagSafe",cameraProtection:"Camera Protection",colour:"Colour"}).map(([k,label])=><input key={k} className="p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md" value={formData.mobileSpecs?.[k] || ''} onChange={e=>setFormData(prev=>({...prev,mobileSpecs:{...(prev.mobileSpecs||{}),[k]:e.target.value}}))} placeholder={label}/>)}</div>
                  </div>}
                  <textarea rows="5" className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md" value={formData.specs || ''} onChange={e=>setFormData({...formData,specs:e.target.value})} placeholder="Additional technical specifications / notes" />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold mb-1 text-slate-700">Description</label>
                  <textarea 
                    rows="3" 
                    required 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  ></textarea>
                </div>

                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-md text-xs">Save Product</button>
                  {editingProduct && <button type="button" onClick={resetForm} className="bg-slate-200 text-slate-800 px-4 py-2.5 rounded-md text-xs font-bold">Cancel</button>}
                </div>
              </form>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b font-bold">
                              <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">HSN</th>
              <th className="p-3">GST</th>
              <th className="p-3">Stock</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="p-3 font-semibold">{p.title}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">₹{p.salePrice || p.price}</td>
                <td className="p-3">{p.hsn || "-"}</td>
                <td className="p-3">
                  {p.gstRate != null ? `${p.gstRate}%` : "-"}
                </td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => handleEditInit(p)}
                    className="hover:text-blue-600"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="hover:text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )}

        {showProCenter && (
          <div className="fixed inset-0 z-[65] bg-black/40 p-2 md:p-5 overflow-auto">
            <div className="max-w-7xl mx-auto my-2 md:my-5">
              <div className="flex justify-end mb-2">
                <button onClick={() => setShowProCenter(false)} className="bg-white border rounded-xl px-4 py-2 text-sm font-black shadow-lg">Close Store Tools ×</button>
              </div>
              <LuxmoProSuite
                products={products}
                cart={cart}
                addToCart={addToCart}
                onSelectProduct={(p) => { setSelectedProduct(p); setSelectedVariantKey(p.variants?.[0]?.key || ""); setActiveImageIndex(0); setActiveTab("product"); setShowProCenter(false); }}
                isAdminLoggedIn={isAdminLoggedIn}
                onPay={handleRazorpayPayment}
                siteTheme={siteTheme}
                setSiteTheme={setSiteTheme}
              />
            </div>
          </div>
        )}
        <LuxmoBackToTop />
        <LuxmoAccessibilityTools />

      </main>

  {/* FORM TEXT CONTRAST FIX — Store Tools + Solar Load Estimator */}
  <style>{`
    .luxmo-pro-suite,
    .luxmo-solar-estimator {
      color-scheme: light;
    }

    .luxmo-pro-suite input,
    .luxmo-pro-suite textarea,
    .luxmo-pro-suite select,
    .luxmo-solar-estimator input,
    .luxmo-solar-estimator textarea,
    .luxmo-solar-estimator select {
      color: #0f172a !important;
      -webkit-text-fill-color: #0f172a !important;
      background-color: #ffffff !important;
      color-scheme: light !important;
    }

    .luxmo-pro-suite input::placeholder,
    .luxmo-pro-suite textarea::placeholder,
    .luxmo-solar-estimator input::placeholder,
    .luxmo-solar-estimator textarea::placeholder {
      color: #64748b !important;
      -webkit-text-fill-color: #64748b !important;
      opacity: 1 !important;
    }

    .luxmo-pro-suite select option,
    .luxmo-solar-estimator select option {
      color: #0f172a !important;
      background-color: #ffffff !important;
    }

    /* Newsletter has a deliberately dark background. Keep its field dark,
       but make the entered text and placeholder readable. */
    .luxmo-pro-suite .bg-slate-950 input {
      background-color: #3f3f46 !important;
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }

    .luxmo-pro-suite .bg-slate-950 input::placeholder {
      color: #d4d4d8 !important;
      -webkit-text-fill-color: #d4d4d8 !important;
      opacity: 1 !important;
    }
  `}</style>

  {/* DARK/LIGHT THEME PREFERENCE */}
  <style>{`
    html[data-luxmo-theme="dark"] .luxmo-page-root {
      background: #0f172a !important;
      color: #e2e8f0 !important;
    }
    html[data-luxmo-theme="dark"] .luxmo-page-root .bg-white {
      background-color: #111827 !important;
    }
    html[data-luxmo-theme="dark"] .luxmo-page-root .bg-slate-50 {
      background-color: #0f172a !important;
    }
    html[data-luxmo-theme="dark"] .luxmo-page-root .bg-slate-100 {
      background-color: #1e293b !important;
    }
    html[data-luxmo-theme="dark"] .luxmo-page-root .text-slate-900,
    html[data-luxmo-theme="dark"] .luxmo-page-root .text-slate-800 {
      color: #f8fafc !important;
    }
    html[data-luxmo-theme="dark"] .luxmo-page-root .text-slate-700 {
      color: #e2e8f0 !important;
    }
    html[data-luxmo-theme="dark"] .luxmo-page-root .text-slate-600,
    html[data-luxmo-theme="dark"] .luxmo-page-root .text-slate-500 {
      color: #cbd5e1 !important;
    }
    html[data-luxmo-theme="dark"] .luxmo-page-root .border-slate-200,
    html[data-luxmo-theme="dark"] .luxmo-page-root .border-slate-300 {
      border-color: #334155 !important;
    }
    html[data-luxmo-theme="dark"] .luxmo-page-root input,
    html[data-luxmo-theme="dark"] .luxmo-page-root textarea,
    html[data-luxmo-theme="dark"] .luxmo-page-root select {
      background-color: #1e293b !important;
      color: #f8fafc !important;
      -webkit-text-fill-color: #f8fafc !important;
      border-color: #475569 !important;
    }
    html[data-luxmo-theme="dark"] .luxmo-page-root input::placeholder,
    html[data-luxmo-theme="dark"] .luxmo-page-root textarea::placeholder {
      color: #94a3b8 !important;
      -webkit-text-fill-color: #94a3b8 !important;
    }
  `}</style>

  {/* MOBILE RESPONSIVE SAFETY — full viewport width on phones */}
  <style>{`
    html, body, #root { width: 100%; min-width: 0; max-width: 100%; margin: 0; padding: 0; }
    *, *::before, *::after { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; }
    body { overflow-x: hidden; min-width: 0; }
    #root { min-height: 100vh; }
    .luxmo-page-root { width: 100%; min-width: 0; max-width: 100%; overflow-x: clip; }
    img, video, canvas, svg { max-width: 100%; }
    @media (max-width: 767px) {
      main, header, footer, section, article, nav { width: 100%; max-width: 100%; }
      input, select, textarea, button { max-width: 100%; }
      .luxmo-page-root .max-w-7xl { width: 100%; max-width: 100%; }
    }
  `}</style>

  {/* PROFESSIONAL FOOTER */}
  {homepagePublished?.sectionEnabled?.footer !== false && <footer className="bg-slate-950 text-slate-300 mt-10">
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white text-lg font-black">LUXMO HUB</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Quality products, secure payments, reliable support.
          </p>
          <p className="mt-4 text-sm text-slate-400">Quality Products, Trusted by You.</p>
        </div>

        <div>
          <h4 className="text-white font-bold">Quick Links</h4>
          <div className="mt-3 space-y-2 text-sm">
            {[
              ["About Us", "policies"],
              ["Contact Us", "policies"],
              ["Terms & Customer Policies", "policies"],
              ["Privacy Policy", "policies"],
              ["Return & Replacement", "policies"],
              ["Refund Policy", "policies"]
            ].map(([label, tab]) => (
              <button key={label} onClick={() => setActiveTab(tab)} className="block hover:text-white hover:underline text-left">
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold">Support Policies</h4>
          <div className="mt-3 space-y-2 text-sm">
            {["Warranty Policy", "Shipping & Delivery", "Unboxing & Proof", "Grievance Redressal"].map((label) => (
              <button key={label} onClick={() => setActiveTab("policies")} className="block hover:text-white hover:underline text-left">
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold">Legal Business Details</h4>
          <div className="mt-3 space-y-1 text-sm text-slate-400">
            <p><strong className="text-slate-200">Legal Business Name:</strong> {luxmoBusinessValue("legalName","Sarita Devi")}</p>
            <p><strong className="text-slate-200">Business Constitution:</strong> {luxmoBusinessValue("constitution","Proprietorship")}</p>
            <p><strong className="text-slate-200">GSTIN:</strong> {luxmoBusinessValue("gstin","09CNCPD1174R1ZN")}</p>
            <p><strong className="text-slate-200">Udyam Registration No.:</strong> {BUSINESS_INFO.udyam.registrationNumber}</p>
            <p><strong className="text-slate-200">Enterprise Type:</strong> {BUSINESS_INFO.udyam.enterpriseType}</p>
            <p><strong className="text-slate-200">Major Activity:</strong> {BUSINESS_INFO.udyam.majorActivity}</p>
            <p><strong className="text-slate-200">Grievance Officer:</strong> {luxmoBusinessValue("grievanceOfficer","Gyaneshwar Sharma")}</p>
            <a href={`mailto:${BUSINESS_INFO.emails[0]}`} className="block hover:text-white pt-1">{BUSINESS_INFO.emails[0]}</a>
            <a href={`tel:${luxmoBusinessValue("phone","+91 75650 12418").replace(/\s/g,"")}`} className="block hover:text-white">{luxmoBusinessValue("phone","+91 75650 12418")}</a>
          </div>
        </div>
      </div>

      {/* SOCIAL MEDIA LINKS */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <h4 className="text-white text-lg font-bold">Connect With LUXMO HUB</h4>
        <p className="mt-2 text-sm text-slate-400">Follow LUXMO HUB and contact us through our official social channels.</p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <a
            href="https://wa.me/917565012418"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-white font-bold hover:bg-green-700 transition shadow-sm"
          >
            🟢 WhatsApp
          </a>

          <a
            href="https://www.youtube.com/@LuxmoHub"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-white font-bold hover:bg-red-700 transition shadow-sm"
          >
            ▶️ YouTube
          </a>

          <a
            href="https://www.instagram.com/luxmohub?igsh=dndlNGM5aWVvZjRl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 py-3 text-white font-bold hover:bg-pink-700 transition shadow-sm"
          >
            📸 Instagram
          </a>

          <a
            href="https://www.facebook.com/profile.php?id=61591823462762"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white font-bold hover:bg-blue-700 transition shadow-sm"
          >
            🔵 Facebook Page
          </a>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between gap-3 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} LUXMO HUB. All rights reserved.</p>
        <p>LUXMO HUB — Quality Products, Trusted by You.</p>
      </div>
    </div>
  </footer>}

  {/* ADMIN AUTH MODAL — GOOGLE AUTHENTICATOR / TOTP */}
  {showAdminModal && (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="text-xs font-black tracking-[0.2em] text-amber-600">LUXMO HUB</div>
            <h3 className="mt-1 font-black text-xl text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Admin Verification
            </h3>
          </div>
          <button type="button" onClick={() => setShowAdminModal(false)} className="text-slate-500 hover:text-slate-900" disabled={adminAuthLoading}>✕</button>
        </div>

        <p className="text-sm text-slate-600">
          Open <strong>Google Authenticator</strong> and enter the current 6-digit code for <strong>LUXMO HUB Admin</strong>.
        </p>

        {authError && <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl">{authError}</p>}
        {authMessage && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">{authMessage}</p>}

        <form onSubmit={handleAdminVerifyOtp} className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-slate-700">Google Authenticator Code</span>
            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              value={adminOtp}
              onChange={e => setAdminOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="mt-2 w-full px-3 py-4 bg-white text-slate-900 placeholder:text-slate-300 border border-slate-300 rounded-xl text-center tracking-[0.45em] text-2xl font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <button type="submit" disabled={adminAuthLoading || adminOtp.length !== 6} className="w-full bg-slate-900 disabled:opacity-50 text-white text-sm font-black py-3.5 rounded-xl">
            {adminAuthLoading ? "Verifying…" : "Verify & Open Admin Panel"}
          </button>
        </form>

        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900">
          <strong>Security:</strong> ADMIN_TOTP_SECRET is never sent to the browser. The server verifies the 6-digit code using the Vercel environment variable.
        </div>
      </div>
    </div>
  )}

      {/* GLOBAL CUSTOMER TOOLS */}
      {showTrackingModal && (
        <LuxmoOrderTrackingModal onClose={() => setShowTrackingModal(false)} />
      )}

      {showWarrantyModal && (
        <LuxmoWarrantyRegistrationModal
          products={products}
          onClose={() => setShowWarrantyModal(false)}
        />
      )}

      {showSolarCalculator && (
        <LuxmoSolarCalculator
          products={products}
          onClose={() => setShowSolarCalculator(false)}
        />
      )}

      {showWhatsAppModal && (
        <LuxmoQuickWhatsAppModal onClose={() => setShowWhatsAppModal(false)} />
      )}

      {/* Floating WhatsApp quick contact */}
      <button
        type="button"
        onClick={() => setShowWhatsAppModal(true)}
        aria-label="WhatsApp quick inquiry"
        title="WhatsApp Quick Inquiry"
        className="fixed bottom-20 right-4 z-[70] w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl flex items-center justify-center text-2xl border-4 border-white"
      >
        💬
      </button>

    </div>
  );
}




/* ============================================================================
   LUXMO HUB — CONTROLLED HOMEPAGE / E-COMMERCE MANAGEMENT
   Additive feature layer. Existing components remain untouched.
   ============================================================================ */
const DEFAULT_HOMEPAGE_CONFIG = {
  hero: {
    enabled: true,
    badge: "LUXMO HUB · Premium Store",
    title: "Smart Solar Solutions & Premium Mobile Protection",
    description: "Reliable hybrid solar inverters and premium protective cases for modern homes, businesses and smartphones.",
    primaryText: "Shop Solar Inverters",
    primaryLink: "Hybrid Solar Inverter",
    secondaryText: "Shop Mobile Cases",
    secondaryLink: "Mobile Back Case",
    desktopImage: "",
    mobileImage: ""
  },
  categories: [
    { id: "cat-solar", icon: "☀️", title: "Hybrid Solar Inverters", description: "24V and 48V hybrid inverter solutions.", buttonText: "Shop Inverters", link: "Hybrid Solar Inverter", enabled: true, order: 1 },
    { id: "cat-accessories", icon: "🔋", title: "Solar Accessories", description: "Accessories for solar installation and monitoring.", buttonText: "Shop Accessories", link: "Solar Accessories", enabled: true, order: 2 },
    { id: "cat-mobile", icon: "📱", title: "Premium Mobile Cases", description: "Premium protection for modern smartphones.", buttonText: "Shop Cases", link: "Mobile Back Case", enabled: true, order: 3 }
  ],
  sections: [
    "hero", "promotions", "categories", "solar", "accessories", "calculator",
    "mobile", "materials", "trust", "support", "reviews", "faq", "cta", "footer"
  ],
  sectionEnabled: {
    hero: true, promotions: true, categories: true, solar: true, accessories: true,
    calculator: true, mobile: true, materials: true, trust: true, support: true,
    reviews: true, faq: true, cta: true, footer: true
  },
  promos: [],
  reviews: [],
  faqs: [
    { id: "faq-1", question: "Which battery is compatible with a hybrid inverter?", answer: "Check the inverter's specified battery voltage, chemistry and BMS communication requirements before purchase." },
    { id: "faq-2", question: "Should I choose a 24V or 48V inverter?", answer: "The correct voltage depends on your system size, battery bank and installation design. Use the solar calculator or contact LUXMO HUB." },
    { id: "faq-3", question: "How do I register warranty?", answer: "Use the Warranty Registration option on the website and keep your order details and serial number ready." },
    { id: "faq-4", question: "Which phone models are available?", answer: "Available phone models are shown in the Mobile Back Case category and product pages." }
  ],
  seo: {
    title: "LUXMO HUB | Hybrid Solar Inverters & Premium Mobile Cases",
    description: "Shop hybrid solar inverters, solar accessories and premium mobile phone back cases from LUXMO HUB.",
    canonical: "",
    ogImage: ""
  }
};

const luxmoClone = (value) => {
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
};

const luxmoApiErrorMessage = (value, fallback = "Something went wrong.") => {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    if (typeof value.message === "string" && value.message.trim()) return value.message;
    if (typeof value.error === "string" && value.error.trim()) return value.error;
    if (typeof value.code === "string" && value.code.trim()) return `${value.code}: ${value.message || "Request failed."}`;
    try {
      const json = JSON.stringify(value);
      if (json && json !== "{}") return json;
    } catch {}
  }
  return fallback;
};

const luxmoDiscount = (mrp, salePrice) => {
  const m = Number(mrp || 0);
  const s = Number(salePrice || 0);
  if (!m || !s || s >= m) return 0;
  return Math.round(((m - s) / m) * 100);
};

function LuxmoControlledHomepageSections({
  products = [], homepageConfig = DEFAULT_HOMEPAGE_CONFIG, setSelectedCategory, setActiveTab,
  setShowSolarCalculator, setShowTrackingModal, setShowWarrantyModal, setShowWhatsAppModal,
  onSelectProduct
}) {
  const [promoIndex, setPromoIndex] = React.useState(0);
  const cfg = homepageConfig || DEFAULT_HOMEPAGE_CONFIG;
  const enabled = cfg.sectionEnabled || DEFAULT_HOMEPAGE_CONFIG.sectionEnabled;
  const publishedProducts = products.filter(p => p.published !== false);
  const getProduct = (id) => products.find(p => String(p.id) === String(id));
  const promos = (cfg.promos || [])
    .filter(x => x && x.show !== false)
    .sort((a,b) => Number(a.order || 0) - Number(b.order || 0))
    .slice(0, 12);

  const goCategory = (category) => { setSelectedCategory(category); setActiveTab("catalog"); };
  const visibleSections = (cfg.sections || DEFAULT_HOMEPAGE_CONFIG.sections).filter(key => enabled[key] !== false);

  const promoCards = promos.map(slot => {
    const p = getProduct(slot.productId);
    return {
      ...slot, ...p,
      id: slot.id || p?.id,
      title: slot.title || p?.title || "LUXMO HUB Product",
      image: slot.image || p?.images?.[0] || p?.image || "",
      mrp: Number(slot.mrp ?? p?.price ?? 0),
      salePrice: Number(slot.salePrice ?? p?.salePrice ?? p?.price ?? 0),
      discount: luxmoDiscount(slot.mrp ?? p?.price, slot.salePrice ?? p?.salePrice ?? p?.price)
    };
  });

  const solarProducts = publishedProducts.filter(p => p.category === "Hybrid Solar Inverter").slice(0, 6);
  const mobileProducts = publishedProducts.filter(p => p.category === "Mobile Back Case").slice(0, 8);
  const accessories = publishedProducts.filter(p => p.category === "Solar Accessories").slice(0, 6);

  const renderPromo = () => enabled.promotions === false ? null : (
    <section key="promotions" className="rounded-3xl border border-amber-200 bg-white shadow-sm p-4 sm:p-6 overflow-hidden">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">Special Offers</p><h2 className="text-2xl md:text-3xl font-black text-slate-900">🔥 Featured Deals</h2></div>
        <span className="text-xs font-bold text-slate-500">{promoCards.length}/12 featured</span>
      </div>
      {promoCards.length ? (
        <div className="relative">
          {(() => {
            const renderPromoCard = (p, i) => {
              const price = p.salePrice || p.mrp;
              return <article key={p.id || i} className="snap-start shrink-0 w-[82vw] max-w-[320px] sm:w-[46%] lg:w-auto lg:flex-1 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-lg transition">
                <button type="button" className="block w-full text-left" onClick={() => { if (p.id && getProduct(p.id) && onSelectProduct) onSelectProduct(getProduct(p.id)); }}>
                  <div className="relative aspect-square bg-slate-100 overflow-hidden">
                    {p.image ? <img src={p.image} alt={p.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full grid place-items-center text-5xl">📦</div>}
                    {p.badge && <span className="absolute left-2 top-2 rounded-full bg-red-600 text-white text-[10px] font-black px-2.5 py-1">{p.badge}</span>}
                    {p.bestSeller && <span className="absolute right-2 top-2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-1">BEST SELLER</span>}
                    {p.hotDeal && <span className="absolute left-2 bottom-2 rounded-full bg-slate-950 text-white text-[9px] font-black px-2 py-1">HOT DEAL</span>}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">{p.category || "LUXMO HUB"}</p>
                    <h3 className="mt-1 font-black text-sm line-clamp-2 min-h-[40px]">{p.title}</h3>
                    <div className="mt-2 flex items-baseline gap-2 flex-wrap"><span className="text-lg font-black text-slate-950">₹{price.toLocaleString("en-IN")}</span>{p.mrp > price && <span className="text-xs text-slate-400 line-through">₹{p.mrp.toLocaleString("en-IN")}</span>}</div>
                    {p.discount > 0 && <div className="mt-1 text-xs font-black text-emerald-700">🔥 {p.discount}% OFF</div>}
                  </div>
                </button>
                <div className="p-3 pt-0 grid grid-cols-2 gap-2"><button type="button" onClick={() => { if (p.detailsUrl) { window.location.href = p.detailsUrl; return; } if (p.id && getProduct(p.id) && onSelectProduct) onSelectProduct(getProduct(p.id)); }} className="rounded-xl border border-slate-300 py-2 text-[11px] font-black">View Details</button><button type="button" onClick={() => { if (p.buyNowUrl) { window.location.href = p.buyNowUrl; return; } if (p.id && getProduct(p.id)) { setActiveTab("catalog"); if (onSelectProduct) onSelectProduct(getProduct(p.id)); } }} className="rounded-xl bg-slate-950 text-white py-2 text-[11px] font-black">Buy Now</button></div>
              </article>;
            };
            const desktopCards = promoCards.length <= 5 ? promoCards : Array.from({length: 5}, (_, offset) => promoCards[(promoIndex + offset) % promoCards.length]);
            return <>
              <div className="lg:hidden flex gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {promoCards.map(renderPromoCard)}
              </div>
              <div className="hidden lg:flex gap-3 overflow-hidden">
                {desktopCards.map(renderPromoCard)}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 font-bold">Swipe on mobile · 5 cards on desktop</span>
                <div className="flex gap-2">
                  <button type="button" disabled={promoCards.length <= 5} onClick={() => setPromoIndex(i => i <= 0 ? Math.max(0,promoCards.length - 1) : i - 1)} className="rounded-full border px-3 py-1 font-black disabled:opacity-40" aria-label="Previous deals">←</button>
                  <button type="button" disabled={promoCards.length <= 5} onClick={() => setPromoIndex(i => (i + 1) % promoCards.length)} className="rounded-full border px-3 py-1 font-black disabled:opacity-40" aria-label="Next deals">→</button>
                </div>
              </div>
            </>;
          })()}
        </div>
      ) : <div className="rounded-2xl bg-slate-50 border border-dashed p-8 text-center text-sm text-slate-500">Promotional products will appear here after you publish them from Admin Panel.</div>}
    </section>
  );

  const renderHero = () => <section key="hero" className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl">
    {cfg.hero.desktopImage && <img src={cfg.hero.desktopImage} alt="LUXMO HUB" className="absolute inset-0 hidden md:block w-full h-full object-cover opacity-35" />}
    {cfg.hero.mobileImage && <img src={cfg.hero.mobileImage} alt="LUXMO HUB" className="absolute inset-0 md:hidden w-full h-full object-cover opacity-35" />}
    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/40" />
    <div className="relative px-5 py-8 sm:py-10 md:px-12 md:py-14 max-w-4xl">
      <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">{cfg.hero.badge}</div>
      <h1 className="mt-5 text-3xl sm:text-4xl md:text-6xl font-black leading-tight tracking-tight">{cfg.hero.title}</h1>
      <p className="mt-5 text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl">{cfg.hero.description}</p>
      <div className="mt-7 flex flex-col sm:flex-row gap-3"><button onClick={() => goCategory(cfg.hero.primaryLink || "Hybrid Solar Inverter")} className="w-full sm:w-auto rounded-xl bg-amber-400 px-5 py-3.5 font-black text-slate-950 shadow-lg hover:bg-amber-300 transition">{cfg.hero.primaryText}</button><button onClick={() => goCategory(cfg.hero.secondaryLink || "Mobile Back Case")} className="w-full sm:w-auto rounded-xl bg-white px-5 py-3.5 font-black text-slate-950 shadow-sm hover:bg-slate-100 transition">{cfg.hero.secondaryText}</button></div>
    </div>
  </section>;

  const renderCategories = () => {
    const cats = (cfg.categories || DEFAULT_HOMEPAGE_CONFIG.categories || [])
      .filter(c => c && c.enabled !== false)
      .sort((a,b) => Number(a.order || 0) - Number(b.order || 0));
    return <section key="categories">
      <div className="text-center mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">Explore LUXMO HUB</p>
        <h2 className="mt-1 text-2xl md:text-3xl font-black">Choose Your Category</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {cats.map((c, i) => (
          <button key={c.id || i} onClick={() => goCategory(c.link || "All")} className={`text-left rounded-3xl border p-6 hover:shadow-lg ${i % 3 === 0 ? "border-amber-200 bg-amber-50" : i % 3 === 1 ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
            <div className="text-4xl">{c.icon || "🛍️"}</div>
            <h3 className="mt-3 text-xl font-black">{c.title || "Category"}</h3>
            <p className="mt-1 text-sm text-slate-600">{c.description || ""}</p>
            <span className="inline-block mt-4 text-xs font-black text-blue-700">{c.buttonText || "Shop Now"} →</span>
          </button>
        ))}
      </div>
    </section>;
  };

  const productGrid = (list, title, category, key) => <section key={key}><div className="flex items-end justify-between gap-3 mb-5"><div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">LUXMO HUB Collection</p><h2 className="text-2xl md:text-3xl font-black">{title}</h2></div><button onClick={() => goCategory(category)} className="text-sm font-black text-blue-600">View All →</button></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{list.length ? list.map(p => <ProductCard key={p.id} product={p} onSelect={onSelectProduct} onAddToCart={() => {}} />) : <div className="sm:col-span-2 lg:col-span-4 rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">No published products in this section yet.</div>}</div></section>;

  const renderSection = (key) => {
    if (enabled[key] === false) return null;
    if (key === "hero") return renderHero();
    if (key === "promotions") return renderPromo();
    if (key === "categories") return renderCategories();
    if (key === "solar") return productGrid(solarProducts, "⚡ Hybrid Solar Inverters", "Hybrid Solar Inverter", "solar");
    if (key === "accessories") return productGrid(accessories, "🔋 Solar Accessories", "Solar Accessories", "accessories");
    if (key === "mobile") return productGrid(mobileProducts, "📱 Premium Mobile Phone Cases", "Mobile Back Case", "mobile");
    if (key === "calculator") return <section key="calculator" className="rounded-3xl bg-gradient-to-r from-amber-50 via-white to-blue-50 border border-amber-200 p-7 md:p-10 flex flex-col lg:flex-row justify-between gap-6 items-center"><div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">Smart Decision Tool</p><h2 className="mt-1 text-2xl md:text-3xl font-black">☀️ Find the Right Solar Inverter</h2><p className="mt-2 text-slate-600">Estimate connected load, battery capacity and approximate solar requirement.</p></div><button onClick={() => setShowSolarCalculator(true)} className="rounded-2xl bg-slate-950 text-white px-6 py-4 font-black">Calculate My Solar Requirement →</button></section>;
    if (key === "materials") return <section key="materials"><div className="text-center mb-6"><p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">Premium Materials</p><h2 className="text-2xl md:text-3xl font-black">✨ Choose Your Material</h2></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{["Genuine Leather","PU Leather","TPU","Polycarbonate (PC)","TPU + PC Hybrid","MagSafe","Carbon Fiber","Silicone","Clear TPU"].map(x => <button key={x} onClick={() => goCategory("Mobile Back Case")} className="text-left rounded-2xl border bg-white p-4 hover:shadow-lg"><div className="text-xl">✨</div><div className="mt-2 font-black text-sm">{x}</div></button>)}</div></section>;
    if (key === "trust") return <section key="trust" className="rounded-3xl bg-slate-950 text-white p-7 md:p-9"><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">{["✓ Quality Products","🔒 Secure Payments","🚚 Fast Delivery","🛡️ Warranty Support","↩️ Easy Returns","💬 Customer Support"].map(x => <div key={x} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center font-black text-sm">{x}</div>)}</div></section>;
    if (key === "support") return <section key="support" className="grid md:grid-cols-3 gap-4"><button onClick={() => setShowWarrantyModal(true)} className="text-left rounded-2xl border border-emerald-200 bg-emerald-50 p-6"><div className="text-3xl">🛡️</div><h3 className="mt-3 font-black">Register Warranty</h3><p className="mt-1 text-sm text-slate-600">Register serial number and installation details.</p></button><button onClick={() => setShowTrackingModal(true)} className="text-left rounded-2xl border border-blue-200 bg-blue-50 p-6"><div className="text-3xl">📦</div><h3 className="mt-3 font-black">Track Your Order</h3><p className="mt-1 text-sm text-slate-600">Check status using Order ID and mobile.</p></button><button onClick={() => setShowWhatsAppModal(true)} className="text-left rounded-2xl border border-green-200 bg-green-50 p-6"><div className="text-3xl">💬</div><h3 className="mt-3 font-black">WhatsApp Support</h3><p className="mt-1 text-sm text-slate-600">Solar, bulk order and product help.</p></button></section>;
    if (key === "reviews") return <section key="reviews" className="rounded-3xl border bg-white p-6"><p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">Social Proof</p><h2 className="mt-1 text-2xl font-black">⭐ Customer Reviews</h2><div className="mt-4 grid md:grid-cols-2 gap-3">{(cfg.reviews || []).filter(r => r.show !== false).map(r => <div key={r.id} className="rounded-2xl bg-amber-50 p-4"><div className="font-black">{r.name || "Customer"} · {"★".repeat(Math.max(1, Math.min(5, Number(r.rating || 5))))}</div><p className="mt-2 text-sm text-slate-600">{r.text}</p></div>)}{!(cfg.reviews || []).some(r => r.show !== false) && <p className="text-sm text-slate-500">Customer reviews will appear here after they are added and published from Admin Panel.</p>}</div></section>;
    if (key === "faq") return <section key="faq" className="rounded-3xl border bg-white p-6"><p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">Help Center</p><h2 className="mt-1 text-2xl font-black">❓ Frequently Asked Questions</h2><div className="mt-4 grid md:grid-cols-2 gap-2">{(cfg.faqs || []).map(q => <details key={q.id} className="rounded-xl bg-slate-50 px-4 py-3"><summary className="font-bold cursor-pointer">{q.question}</summary><p className="mt-2 text-sm text-slate-600">{q.answer}</p></details>)}</div></section>;
    if (key === "cta") return <section key="cta" className="rounded-[2rem] bg-slate-950 text-white p-8 md:p-12 text-center shadow-2xl"><p className="text-amber-300 text-[11px] font-black uppercase tracking-[0.25em]">LUXMO HUB</p><h2 className="mt-2 text-3xl md:text-5xl font-black">Choose Better. Power Smarter. Protect Better.</h2><div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={() => goCategory("Hybrid Solar Inverter")} className="rounded-xl bg-amber-400 text-slate-950 px-6 py-3.5 font-black">☀️ Shop Solar →</button><button onClick={() => goCategory("Mobile Back Case")} className="rounded-xl bg-white text-slate-950 px-6 py-3.5 font-black">📱 Shop Mobile Cases →</button></div></section>;
    if (key === "footer") return null;
    return null;
  };

  return <div className="space-y-10 min-w-0 w-full">{visibleSections.map(renderSection)}</div>;
}

function LuxmoHomepageAdmin({ products, homepageDraft, setHomepageDraft, onSaveDraft, onPublish, previewMode, setPreviewMode }) {
  const cfg = homepageDraft;
  const [active, setActive] = React.useState("hero");
  const [uploading, setUploading] = React.useState(false);
  const update = (path, value) => setHomepageDraft(prev => {
    const next = luxmoClone(prev);
    let target = next;
    const parts = path.split(".");
    parts.forEach((part, i) => { if (i === parts.length - 1) target[part] = value; else target = target[part]; });
    return next;
  });
  const addPromo = () => {
    if ((cfg.promos || []).length >= 12) return alert("Maximum 12 promotional products allowed.");
    const available = products.find(p => !(cfg.promos || []).some(x => x.productId === p.id));
    if (!available) return alert("All available products are already added.");
    setHomepageDraft(prev => ({ ...prev, promos: [...(prev.promos || []), { id: `promo-${Date.now()}`, productId: available.id, title: available.title, image: available.images?.[0] || "", images: Array.isArray(available.images) ? available.images.slice(0, 5) : [], mrp: available.price || 0, salePrice: available.salePrice || available.price || 0, badge: "HOT DEAL", bestSeller: false, hotDeal: true, featured: true, show: true, order: (prev.promos || []).length + 1, detailsUrl: "", buyNowUrl: "" }] }));
  };
  const updatePromo = (id, patch) => setHomepageDraft(prev => ({ ...prev, promos: (prev.promos || []).map(x => x.id === id ? { ...x, ...patch } : x) }));
  const removePromo = id => setHomepageDraft(prev => ({ ...prev, promos: (prev.promos || []).filter(x => x.id !== id).map((x,i) => ({...x,order:i+1})) }));
  const movePromo = (id, dir) => setHomepageDraft(prev => { const arr=[...(prev.promos||[])].sort((a,b)=>Number(a.order||0)-Number(b.order||0)); const i=arr.findIndex(x=>x.id===id); const j=i+dir; if(i<0||j<0||j>=arr.length)return prev; [arr[i],arr[j]]=[arr[j],arr[i]]; return {...prev,promos:arr.map((x,k)=>({...x,order:k+1}))}; });
  const moveSection = (index, dir) => setHomepageDraft(prev => { const arr=[...(prev.sections||[])]; const j=index+dir; if(j<0||j>=arr.length)return prev; [arr[index],arr[j]]=[arr[j],arr[index]]; return {...prev,sections:arr}; });
  const uploadImage = (setter) => async (e) => { const file=e.target.files?.[0]; if(!file)return; setUploading(true); try { const img=await compressImage(file); setter(img); } catch { alert("Image upload failed."); } finally { setUploading(false); } };
  const toggleSection = key => setHomepageDraft(prev => ({...prev,sectionEnabled:{...prev.sectionEnabled,[key]:prev.sectionEnabled?.[key]===false}}));

  return <div className="space-y-5">
    <div className="flex flex-col lg:flex-row gap-2 justify-between items-start lg:items-center"><div><h2 className="text-xl font-black">🏠 Homepage Management</h2><p className="text-xs text-slate-500">Control hero, sections, up to 12 promotional products, reviews, FAQ and SEO.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setPreviewMode(!previewMode)} className="rounded-xl border px-3 py-2 text-xs font-black">{previewMode ? "Close Preview" : "Preview Homepage"}</button><button onClick={onSaveDraft} className="rounded-xl bg-slate-900 text-white px-3 py-2 text-xs font-black">Save Draft</button><button onClick={onPublish} className="rounded-xl bg-emerald-600 text-white px-3 py-2 text-xs font-black">Publish</button></div></div>
    {previewMode ? <div className="rounded-2xl border bg-slate-50 p-4"><LuxmoControlledHomepageSections products={products} homepageConfig={cfg} setSelectedCategory={()=>{}} setActiveTab={()=>{}} setShowSolarCalculator={()=>{}} setShowTrackingModal={()=>{}} setShowWarrantyModal={()=>{}} setShowWhatsAppModal={()=>{}} onSelectProduct={()=>{}} /></div> : <div className="grid lg:grid-cols-[220px_1fr] gap-5">
      <div className="bg-white border rounded-2xl p-2 sm:p-3 w-full min-w-0 max-w-full flex flex-nowrap lg:flex-col gap-2 overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain scrollbar-thin lg:overflow-visible lg:sticky lg:top-24" role="tablist" aria-label="Homepage Management sections">
         <div className="lg:hidden shrink-0 px-1 pb-1 text-[10px] font-bold text-slate-400">← Swipe tabs horizontally →</div>
        {["hero","promotions","categories","sections","reviews","faq","seo"].map(x => <button key={x} onClick={()=>setActive(x)} className={`shrink-0 lg:w-full flex-none text-left rounded-xl px-3 py-2.5 text-xs font-black whitespace-nowrap select-none ${active===x?'bg-slate-950 text-white':'hover:bg-slate-100'}`} role="tab" aria-selected={active===x}>{x === "hero" ? "🔥 Hero" : x === "promotions" ? "🛍️ Promotional Products" : x === "categories" ? "🧩 Categories" : x === "sections" ? "🧩 Sections ON/OFF & Order" : x === "reviews" ? "⭐ Reviews" : x === "faq" ? "❓ FAQ" : "🔎 SEO"}</button>)}
      </div>
      <div className="space-y-4">
        {active === "hero" && <div className="bg-white border rounded-2xl p-5 space-y-4"><h3 className="font-black">Hero Section</h3><input className="admin-field" value={cfg.hero.badge} onChange={e=>update("hero.badge",e.target.value)} placeholder="Badge"/><input className="admin-field" value={cfg.hero.title} onChange={e=>update("hero.title",e.target.value)} placeholder="Heading"/><textarea className="admin-field" rows="4" value={cfg.hero.description} onChange={e=>update("hero.description",e.target.value)} placeholder="Description"/><div className="grid md:grid-cols-2 gap-3"><input className="admin-field" value={cfg.hero.primaryText} onChange={e=>update("hero.primaryText",e.target.value)} placeholder="Primary button"/><input className="admin-field" value={cfg.hero.primaryLink} onChange={e=>update("hero.primaryLink",e.target.value)} placeholder="Primary category"/><input className="admin-field" value={cfg.hero.secondaryText} onChange={e=>update("hero.secondaryText",e.target.value)} placeholder="Secondary button"/><input className="admin-field" value={cfg.hero.secondaryLink} onChange={e=>update("hero.secondaryLink",e.target.value)} placeholder="Secondary category"/></div><div className="grid md:grid-cols-2 gap-3"><label className="rounded-xl border p-3 text-xs font-bold">Desktop Hero Image<input type="file" accept="image/*" onChange={uploadImage(v=>update("hero.desktopImage",v))} className="mt-2 block w-full"/></label><label className="rounded-xl border p-3 text-xs font-bold">Mobile Hero Image<input type="file" accept="image/*" onChange={uploadImage(v=>update("hero.mobileImage",v))} className="mt-2 block w-full"/></label></div>{uploading&&<p className="text-xs text-blue-600">Optimizing image…</p>}</div>}
        {active === "promotions" && <div className="bg-white border rounded-2xl p-5 space-y-4"><div className="flex justify-between items-center"><div><h3 className="font-black">🛍️ Promotional Products</h3><p className="text-xs text-slate-500">Amazon/Flipkart-style carousel. Maximum 12 products.</p></div><button onClick={addPromo} disabled={(cfg.promos||[]).length>=12} className="rounded-xl bg-blue-600 disabled:bg-slate-300 text-white px-3 py-2 text-xs font-black">+ Add Product</button></div>{(cfg.promos||[]).map((slot,i)=>{const p=products.find(x=>x.id===slot.productId);const discount=luxmoDiscount(slot.mrp,slot.salePrice);return <div key={slot.id} className="rounded-2xl border p-4 space-y-3"><div className="flex justify-between gap-2"><div className="font-black text-sm">#{i+1} {slot.title || p?.title}</div><div className="flex gap-1"><button onClick={()=>movePromo(slot.id,-1)} className="border rounded-lg px-2">↑</button><button onClick={()=>movePromo(slot.id,1)} className="border rounded-lg px-2">↓</button><button onClick={()=>removePromo(slot.id)} className="border border-red-200 text-red-600 rounded-lg px-2">Delete</button></div></div><select className="admin-field" value={slot.productId||""} onChange={e=>{const np=products.find(x=>x.id===e.target.value);updatePromo(slot.id,{productId:e.target.value,title:np?.title||slot.title,image:np?.images?.[0]||slot.image,images:Array.isArray(np?.images)?np.images.slice(0,5):(slot.images||[]),mrp:np?.price??slot.mrp,salePrice:np?.salePrice??np?.price??slot.salePrice});}}><option value="">Select product</option>{products.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select><div className="grid md:grid-cols-2 gap-3"><input className="admin-field" value={slot.title||""} onChange={e=>updatePromo(slot.id,{title:e.target.value})} placeholder="Promotional title"/><input className="admin-field" value={slot.badge||""} onChange={e=>updatePromo(slot.id,{badge:e.target.value})} placeholder="Offer badge e.g. 20% OFF"/><input type="number" className="admin-field" value={slot.mrp??""} onChange={e=>updatePromo(slot.id,{mrp:e.target.value})} placeholder="MRP"/><input type="number" className="admin-field" value={slot.salePrice??""} onChange={e=>updatePromo(slot.id,{salePrice:e.target.value})} placeholder="Sale price"/></div><div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm font-black text-emerald-700">Automatic Discount: {discount}%</div><div className="flex flex-wrap gap-4 text-xs font-bold"><label><input type="checkbox" checked={slot.show!==false} onChange={e=>updatePromo(slot.id,{show:e.target.checked})}/> Show</label><label><input type="checkbox" checked={!!slot.bestSeller} onChange={e=>updatePromo(slot.id,{bestSeller:e.target.checked})}/> Best Seller</label><label><input type="checkbox" checked={!!slot.hotDeal} onChange={e=>updatePromo(slot.id,{hotDeal:e.target.checked})}/> Hot Deal</label><label><input type="checkbox" checked={!!slot.featured} onChange={e=>updatePromo(slot.id,{featured:e.target.checked})}/> Featured</label></div><label className="block rounded-xl border p-3 text-xs font-bold">Change Main Promotional Photo<input type="file" accept="image/*" onChange={uploadImage(v=>updatePromo(slot.id,{image:v,images:[v,...(slot.images||[]).filter(x=>x!==v)].slice(0,5)}))} className="mt-2 block w-full"/></label>
<label className="block rounded-xl border p-3 text-xs font-bold">Product Photo Gallery (up to 5)<input type="file" accept="image/*" multiple onChange={async e=>{const files=Array.from(e.target.files||[]).slice(0,5); if(!files.length)return; setUploading(true); try{const imgs=[]; for(const f of files){imgs.push(await compressImage(f));} updatePromo(slot.id,{images:imgs,image:imgs[0]||slot.image});}catch{alert("Gallery upload failed.");}finally{setUploading(false);}}} className="mt-2 block w-full"/>{(slot.images||[]).length>0&&<div className="mt-2 grid grid-cols-5 gap-2">{(slot.images||[]).map((img,gi)=><div key={gi} className="relative"><img src={img} alt={`Promo ${gi+1}`} className="w-full aspect-square object-cover rounded-lg border"/><button type="button" onClick={()=>{const imgs=(slot.images||[]).filter((_,idx)=>idx!==gi); updatePromo(slot.id,{images:imgs,image:imgs[0]||""});}} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black">×</button></div>)}</div>}</label>
<div className="grid md:grid-cols-2 gap-3"><input className="admin-field" value={slot.detailsUrl||""} onChange={e=>updatePromo(slot.id,{detailsUrl:e.target.value})} placeholder="View Details URL"/><input className="admin-field" value={slot.buyNowUrl||""} onChange={e=>updatePromo(slot.id,{buyNowUrl:e.target.value})} placeholder="Buy Now URL"/></div></div>})}</div>}
                 {active === "categories" && <div className="bg-white border rounded-2xl p-5 space-y-4">
           <div><h3 className="font-black">Homepage Categories</h3><p className="text-xs text-slate-500">Edit category title, icon, description, button, link, visibility and order without touching code.</p></div>
           {(cfg.categories || []).slice().sort((a,b)=>Number(a.order||0)-Number(b.order||0)).map((c,i) => (
             <div key={c.id} className="border rounded-xl p-4 space-y-3">
               <div className="flex justify-between items-center gap-2"><strong className="text-sm">Category #{i+1}</strong><label className="text-xs font-bold"><input type="checkbox" checked={c.enabled !== false} onChange={e=>setHomepageDraft(prev=>({...prev,categories:prev.categories.map(x=>x.id===c.id?{...x,enabled:e.target.checked}:x)}))}/> Show</label></div>
               <div className="grid md:grid-cols-2 gap-3">
                 <input className="admin-field" value={c.icon||""} onChange={e=>setHomepageDraft(prev=>({...prev,categories:prev.categories.map(x=>x.id===c.id?{...x,icon:e.target.value}:x)}))} placeholder="Icon / emoji"/>
                 <input className="admin-field" value={c.title||""} onChange={e=>setHomepageDraft(prev=>({...prev,categories:prev.categories.map(x=>x.id===c.id?{...x,title:e.target.value}:x)}))} placeholder="Category title"/>
                 <input className="admin-field" value={c.buttonText||""} onChange={e=>setHomepageDraft(prev=>({...prev,categories:prev.categories.map(x=>x.id===c.id?{...x,buttonText:e.target.value}:x)}))} placeholder="Button text"/>
                 <input className="admin-field" value={c.link||""} onChange={e=>setHomepageDraft(prev=>({...prev,categories:prev.categories.map(x=>x.id===c.id?{...x,link:e.target.value}:x)}))} placeholder="Category / URL link"/>
                 <input className="admin-field" type="number" value={c.order||i+1} onChange={e=>setHomepageDraft(prev=>({...prev,categories:prev.categories.map(x=>x.id===c.id?{...x,order:Number(e.target.value)}:x)}))} placeholder="Display order"/>
               </div>
               <textarea className="admin-field" rows="2" value={c.description||""} onChange={e=>setHomepageDraft(prev=>({...prev,categories:prev.categories.map(x=>x.id===c.id?{...x,description:e.target.value}:x)}))} placeholder="Category description"/>
             </div>
           ))}
         </div>}
{active === "sections" && <div className="bg-white border rounded-2xl p-5"><h3 className="font-black">Homepage Sections</h3><p className="text-xs text-slate-500 mb-4">Turn sections ON/OFF and change their order.</p><div className="space-y-2">{(cfg.sections||[]).map((key,i)=><div key={key} className="flex items-center gap-2 border rounded-xl p-3"><button onClick={()=>toggleSection(key)} className={`rounded-full px-3 py-1 text-[10px] font-black ${cfg.sectionEnabled?.[key]===false?'bg-slate-200 text-slate-500':'bg-emerald-100 text-emerald-700'}`}>{cfg.sectionEnabled?.[key]===false?'OFF':'ON'}</button><span className="flex-1 text-sm font-black capitalize">{key}</span><button onClick={()=>moveSection(i,-1)} className="border rounded-lg px-2">↑</button><button onClick={()=>moveSection(i,1)} className="border rounded-lg px-2">↓</button></div>)}</div></div>}
        {active === "reviews" && <div className="bg-white border rounded-2xl p-5 space-y-4"><div className="flex justify-between"><h3 className="font-black">Customer Reviews</h3><button onClick={()=>setHomepageDraft(prev=>({...prev,reviews:[...(prev.reviews||[]),{id:`review-${Date.now()}`,name:"",rating:5,text:"",show:true}]}))} className="rounded-xl bg-blue-600 text-white px-3 py-2 text-xs font-black">+ Add Review</button></div>{(cfg.reviews||[]).map(r=><div key={r.id} className="border rounded-xl p-3 grid md:grid-cols-[1fr_120px_1fr_auto] gap-2"><input className="admin-field" placeholder="Customer name" value={r.name} onChange={e=>setHomepageDraft(prev=>({...prev,reviews:prev.reviews.map(x=>x.id===r.id?{...x,name:e.target.value}:x)}))}/><input className="admin-field" type="number" min="1" max="5" value={r.rating} onChange={e=>setHomepageDraft(prev=>({...prev,reviews:prev.reviews.map(x=>x.id===r.id?{...x,rating:e.target.value}:x)}))}/><textarea className="admin-field" placeholder="Review" value={r.text} onChange={e=>setHomepageDraft(prev=>({...prev,reviews:prev.reviews.map(x=>x.id===r.id?{...x,text:e.target.value}:x)}))}/><button onClick={()=>setHomepageDraft(prev=>({...prev,reviews:prev.reviews.filter(x=>x.id!==r.id)}))} className="text-red-600 font-black">Delete</button></div>)}</div>}
        {active === "faq" && <div className="bg-white border rounded-2xl p-5 space-y-4"><div className="flex justify-between"><h3 className="font-black">FAQ Management</h3><button onClick={()=>setHomepageDraft(prev=>({...prev,faqs:[...(prev.faqs||[]),{id:`faq-${Date.now()}`,question:"",answer:""}]}))} className="rounded-xl bg-blue-600 text-white px-3 py-2 text-xs font-black">+ Add FAQ</button></div>{(cfg.faqs||[]).map(q=><div key={q.id} className="border rounded-xl p-3 space-y-2"><input className="admin-field" placeholder="Question" value={q.question} onChange={e=>setHomepageDraft(prev=>({...prev,faqs:prev.faqs.map(x=>x.id===q.id?{...x,question:e.target.value}:x)}))}/><textarea className="admin-field" placeholder="Answer" value={q.answer} onChange={e=>setHomepageDraft(prev=>({...prev,faqs:prev.faqs.map(x=>x.id===q.id?{...x,answer:e.target.value}:x)}))}/><button onClick={()=>setHomepageDraft(prev=>({...prev,faqs:prev.faqs.filter(x=>x.id!==q.id)}))} className="text-red-600 text-xs font-black">Delete FAQ</button></div>)}</div>}
        {active === "seo" && <div className="bg-white border rounded-2xl p-5 space-y-3"><h3 className="font-black">Homepage SEO</h3><input className="admin-field" value={cfg.seo.title} onChange={e=>update("seo.title",e.target.value)} placeholder="SEO Title"/><textarea className="admin-field" rows="4" value={cfg.seo.description} onChange={e=>update("seo.description",e.target.value)} placeholder="Meta Description"/><input className="admin-field" value={cfg.seo.canonical} onChange={e=>update("seo.canonical",e.target.value)} placeholder="Canonical URL"/><label className="block rounded-xl border p-3 text-xs font-bold">OG Image<input type="file" accept="image/*" onChange={uploadImage(v=>update("seo.ogImage",v))} className="mt-2 block w-full"/></label></div>}
      </div>
    </div>}
    <style>{`.admin-field{width:100%;padding:.65rem .75rem;background:white;color:#0f172a;border:1px solid #cbd5e1;border-radius:.75rem;font-size:.8rem;outline:none}.admin-field:focus{border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,.12)}`}</style>
  </div>;
}


/* ============================================================================
   LUXMO HUB — MASTER ADMIN CONTROL CENTER
   Additive only: the existing catalogue, policies, checkout, Razorpay hooks,
   Google Authenticator/TOTP login and previous admin components remain intact.
   ============================================================================ */

const LUXMO_ADVANCED_ADMIN_KEY = "luxmo_master_admin_settings_v2";
const LUXMO_POLICY_OVERRIDE_KEY = "luxmo_policy_overrides_v2";
const LUXMO_BUSINESS_OVERRIDE_KEY = "luxmo_business_overrides_v2";

const LUXMO_MASTER_DEFAULTS = {
  coupons: LUXMO_COUPONS,
  shipping: LUXMO_DEFAULT_STORE_SETTINGS,
  couriers: LUXMO_COURIER_PROVIDERS,
  paymentMethods: LUXMO_PAYMENT_METHODS.map(x => ({ ...x, enabled: true })),
  orderStatuses: LUXMO_ORDER_STATUSES,
  reviewStatuses: LUXMO_REVIEW_STATUS
};

const LUXMO_POLICY_EDITOR_DEFAULTS = {
  "Warranty Policy": WARRANTY_POLICY_FULL,
  "Shipping & Delivery": "LUXMO HUB Shipping & Delivery policy. Delivery timelines depend on product category, destination, courier serviceability, weather, holidays and operational conditions. Standard and express delivery rules are controlled from Admin Panel → Shipping.",
  "Unboxing & Proof": UNBOXING_POLICY,
  "Grievance Redressal": "LUXMO HUB Grievance Redressal. Grievance Officer: Gyaneshwar Sharma. Email: luxmohub@gmail.com. Phone: +91 75650 12418. Complaints should include order ID, customer details, product details and supporting evidence.",
  "About Us": "Welcome to LUXMO HUB — a customer-focused online brand offering hybrid solar inverters, solar accessories and premium mobile phone back case covers. LUXMO HUB focuses on accurate product information, secure packaging, reliable delivery support and responsive customer service.",
  "Contact Us": "LUXMO HUB Customer Support\nEmail: luxmohub@gmail.com\nPhone: +91 75650 12418\nBusiness hours: Monday–Saturday, 10:00 AM–6:00 PM.",
  "Terms & Customer Policies": "LUXMO HUB Terms & Customer Policies. Customers should review product descriptions, pricing, delivery, payment, return, replacement, refund, warranty and other applicable policies before placing an order.",
  "Privacy Policy": "LUXMO HUB Privacy Policy. Customer information should be used only for legitimate order processing, customer support, payment, delivery, security and legal/compliance purposes, subject to applicable law.",
  "Return & Replacement": RETURN_REPLACEMENT_POLICY,
  "Refund Policy": "LUXMO HUB Refund Policy. Approved refunds are initiated after applicable verification and inspection and are generally returned through the original payment method where technically applicable. Gateway/bank processing time may vary."
};

const luxmoMasterRead = () => safeReadJSON(LUXMO_ADVANCED_ADMIN_KEY, LUXMO_MASTER_DEFAULTS);

const luxmoBusinessValue = (key, fallback) => safeReadJSON("luxmo_business_overrides_v2", {})?.[key] || fallback;

function LuxmoMasterAdminControl({ products = [], setProducts }) {
  const [tab, setTab] = React.useState("operations");
  const [settings, setSettings] = React.useState(() => luxmoMasterRead());
  const [policies, setPolicies] = React.useState(() => safeReadJSON(LUXMO_POLICY_OVERRIDE_KEY, LUXMO_POLICY_EDITOR_DEFAULTS));
  const [business, setBusiness] = React.useState(() => safeReadJSON(LUXMO_BUSINESS_OVERRIDE_KEY, {
    legalName: BUSINESS_INFO.legalName,
    constitution: BUSINESS_INFO.type,
    gstin: BUSINESS_INFO.gstin,
    udyam: BUSINESS_INFO.udyam.registrationNumber,
    enterpriseType: BUSINESS_INFO.udyam.enterpriseType,
    majorActivity: BUSINESS_INFO.udyam.majorActivity,
    grievanceOfficer: "Gyaneshwar Sharma",
    email: BUSINESS_INFO.emails[0],
    phone: BUSINESS_INFO.phones[0]
  }));
  const [orders, setOrders] = React.useState(() => safeReadJSON(LUXMO_PRO_STORAGE.orders, []));
  const [saved, setSaved] = React.useState("");
  const [loadingSettings, setLoadingSettings] = React.useState(true);

  const loadMasterSettings = async () => {
    setLoadingSettings(true);
    try {
      const r = await fetch("/api/admin/master-settings", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.success) throw new Error(data.error || "Unable to load Master Admin settings.");
      const db = data.settings || {};
      setSettings(prev => ({ ...prev, ...db }));
      if (db.policies) setPolicies(db.policies);
      if (db.business) setBusiness(db.business);
    } catch (e) {
      setSaved(e?.message || "Unable to load database settings.");
    } finally {
      setLoadingSettings(false);
    }
  };

  React.useEffect(() => { loadMasterSettings(); }, []);

  const saveSettings = async (next) => {
    setSettings(next);
    setSaved("Saving…");
    try {
      const payload = { ...next, policies, business };
      const r = await fetch("/api/admin/master-settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.success) throw new Error(data.error || "Master settings save failed.");
      setSettings(data.settings || payload);
      setSaved("Saved to database");
      window.dispatchEvent(new Event("luxmo-master-settings-updated"));
    } catch (e) {
      setSaved(e?.message || "Save failed");
    } finally {
      setTimeout(() => setSaved(""), 2200);
    }
  };

  const savePolicies = async (next) => {
    setPolicies(next);
    await saveSettings({ ...settings, policies: next, business });
    window.dispatchEvent(new Event("luxmo-policy-updated"));
  };

  const saveBusiness = async (next) => {
    setBusiness(next);
    await saveSettings({ ...settings, policies, business: next });
    window.dispatchEvent(new Event("luxmo-business-updated"));
  };
  const updateOrder = (id, patch) => {
    const next = orders.map(o => (o.id || o.orderId) === id ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o);
    setOrders(next);
    safeWriteJSON(LUXMO_PRO_STORAGE.orders, next);
  };
  const updateStock = (id, stock) => {
    const next = products.map(p => p.id === id ? { ...p, stock: Math.max(0, Number(stock || 0)) } : p);
    setProducts(next);
    safeWriteJSON("luxmo_products", next);
  };

  const tabs = [
    ["operations","⚙️ Operations"],["coupons","🎟️ Coupons"],["shipping","🚚 Shipping"],
    ["payments","💳 Payments"],["orders","📦 Orders"],["inventory","📊 Inventory"],
    ["reviews","⭐ Review Status"],["policies","📄 Policies"],["business","🏢 Legal Business"],["security","🔐 Security"]
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-5 border-b bg-slate-950 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div><p className="text-[10px] uppercase tracking-[0.2em] text-amber-300 font-black">Master Control</p><h2 className="text-xl font-black">⚙️ Complete Store Admin Control</h2><p className="text-xs text-slate-300 mt-1">Coupons, shipping, couriers, payments, orders, inventory, reviews, policies and legal business details.</p></div>
          {saved && <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-black text-emerald-200">{saved}</span>}
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{tabs.map(([id,label]) => <button key={id} onClick={()=>setTab(id)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${tab===id ? "bg-white text-slate-950" : "bg-white/10 text-white hover:bg-white/20"}`}>{label}</button>)}</div>
      </div>

      <div className="p-5 space-y-5">
        {loadingSettings && <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-bold text-blue-800">Loading Master Admin settings from database…</div>}
        {tab === "operations" && <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border p-5 bg-slate-50"><div className="text-xs font-bold text-slate-500">Products</div><div className="text-3xl font-black">{products.length}</div><p className="text-xs text-slate-500 mt-1">Catalogue items currently loaded.</p></div>
          <div className="rounded-2xl border p-5 bg-slate-50"><div className="text-xs font-bold text-slate-500">Promotional limit</div><div className="text-3xl font-black">12</div><p className="text-xs text-slate-500 mt-1">Homepage promotional slots.</p></div>
          <div className="rounded-2xl border p-5 bg-slate-50"><div className="text-xs font-bold text-slate-500">Admin security</div><div className="text-xl font-black text-emerald-700">Google Authenticator</div><p className="text-xs text-slate-500 mt-1">Existing 6-digit TOTP flow retained.</p></div>
        </div>}

        {tab === "coupons" && <div className="space-y-4">
          <div className="flex justify-between items-center gap-3"><div><h3 className="font-black">Coupon Management</h3><p className="text-xs text-slate-500">Add, edit, enable and remove promotional coupon rules.</p></div><button onClick={()=>saveSettings({...settings,coupons:[...(settings.coupons||[]),{code:`LUXMO${Date.now().toString().slice(-4)}`,type:"percent",value:5,min:499,maxDiscount:500,label:"New coupon",enabled:true}]})} className="rounded-xl bg-blue-600 text-white px-3 py-2 text-xs font-black">+ Add Coupon</button></div>
          {(settings.coupons||[]).map((c,i)=><div key={`${c.code}-${i}`} className="border rounded-2xl p-4 grid md:grid-cols-6 gap-2">
            <input className="admin-field" value={c.code||""} onChange={e=>{const a=[...(settings.coupons||[])];a[i]={...a[i],code:e.target.value.toUpperCase()};saveSettings({...settings,coupons:a});}} placeholder="CODE"/>
            <select className="admin-field" value={c.type||"percent"} onChange={e=>{const a=[...(settings.coupons||[])];a[i]={...a[i],type:e.target.value};saveSettings({...settings,coupons:a});}}><option value="percent">Percent</option><option value="flat">Flat ₹</option></select>
            <input className="admin-field" type="number" value={c.value??0} onChange={e=>{const a=[...(settings.coupons||[])];a[i]={...a[i],value:Number(e.target.value)};saveSettings({...settings,coupons:a});}} placeholder="Value"/>
            <input className="admin-field" type="number" value={c.min??0} onChange={e=>{const a=[...(settings.coupons||[])];a[i]={...a[i],min:Number(e.target.value)};saveSettings({...settings,coupons:a});}} placeholder="Min order"/>
            <input className="admin-field" type="number" value={c.maxDiscount??0} onChange={e=>{const a=[...(settings.coupons||[])];a[i]={...a[i],maxDiscount:Number(e.target.value)};saveSettings({...settings,coupons:a});}} placeholder="Max discount"/>
            <button onClick={()=>saveSettings({...settings,coupons:(settings.coupons||[]).filter((_,x)=>x!==i)})} className="rounded-xl border border-red-200 text-red-600 text-xs font-black">Delete</button>
            <input className="admin-field md:col-span-5" value={c.label||""} onChange={e=>{const a=[...(settings.coupons||[])];a[i]={...a[i],label:e.target.value};saveSettings({...settings,coupons:a});}} placeholder="Customer-facing coupon description"/>
            <label className="text-xs font-bold flex items-center gap-2"><input type="checkbox" checked={c.enabled!==false} onChange={e=>{const a=[...(settings.coupons||[])];a[i]={...a[i],enabled:e.target.checked};saveSettings({...settings,coupons:a});}}/> Enabled</label>
          </div>)}
        </div>}

        {tab === "shipping" && <div className="space-y-5">
          <div><h3 className="font-black">Shipping Rules & Courier Providers</h3><p className="text-xs text-slate-500">Control delivery charges, free-shipping thresholds, delivery windows and enabled courier providers.</p></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries({standardDeliveryRate:"Standard ₹",expressDeliveryRate:"Express ₹",standardMinDays:"Standard min days",standardMaxDays:"Standard max days",expressMinDays:"Express min days",expressMaxDays:"Express max days",freeShippingAboveMobile:"Mobile free above ₹",freeShippingAboveInverter:"Inverter free above ₹",freeShippingAboveAccessories:"Accessories free above ₹"}).map(([k,label])=><label key={k} className="text-xs font-bold text-slate-700">{label}<input className="admin-field mt-1" type="number" value={settings.shipping?.[k]??""} onChange={e=>saveSettings({...settings,shipping:{...settings.shipping,[k]:Number(e.target.value)}})}/></label>)}
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-bold">{["codEnabled","onlinePaymentEnabled","standardDeliveryEnabled","expressDeliveryEnabled"].map(k=><label key={k}><input type="checkbox" checked={settings.shipping?.[k]!==false} onChange={e=>saveSettings({...settings,shipping:{...settings.shipping,[k]:e.target.checked}})}/> {k}</label>)}</div>
          <div className="border rounded-2xl p-4"><h4 className="font-black">Courier Providers</h4><div className="mt-3 space-y-2">{(settings.couriers||[]).map((c,i)=><div key={c.id||i} className="grid sm:grid-cols-[1fr_160px_100px] gap-2 items-center border rounded-xl p-3"><input className="admin-field" value={c.name||""} onChange={e=>{const a=[...(settings.couriers||[])];a[i]={...a[i],name:e.target.value};saveSettings({...settings,couriers:a});}}/><input className="admin-field" type="number" value={c.priority||i+1} onChange={e=>{const a=[...(settings.couriers||[])];a[i]={...a[i],priority:Number(e.target.value)};saveSettings({...settings,couriers:a});}}/><label className="text-xs font-bold"><input type="checkbox" checked={c.enabled!==false} onChange={e=>{const a=[...(settings.couriers||[])];a[i]={...a[i],enabled:e.target.checked};saveSettings({...settings,couriers:a});}}/> Enabled</label></div>)}</div></div>
        </div>}

        {tab === "payments" && <div className="space-y-4">
          <h3 className="font-black">Payment Methods</h3>
          {(settings.paymentMethods||[]).map((m,i)=><div key={m.id||i} className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><div className="font-black">{m.label}</div><div className="text-xs text-slate-500">{m.description}</div></div><label className="text-xs font-bold"><input type="checkbox" checked={m.enabled!==false} onChange={e=>{const a=[...(settings.paymentMethods||[])];a[i]={...a[i],enabled:e.target.checked};saveSettings({...settings,paymentMethods:a});}}/> Enabled</label></div>)}
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">Razorpay secret keys and signature verification remain server-side. This panel does not expose secrets.</p>
        </div>}

        {tab === "orders" && <div className="space-y-4">
          <div><h3 className="font-black">Detailed Order Status Management</h3><p className="text-xs text-slate-500">Review locally stored orders and move them through the full operational status list.</p></div>
          {(orders||[]).length === 0 ? <div className="border border-dashed rounded-2xl p-8 text-center text-sm text-slate-500">No locally stored orders yet.</div> : (orders||[]).map(o=><div key={o.id||o.orderId} className="border rounded-2xl p-4 grid md:grid-cols-[1fr_220px_160px] gap-3 items-center"><div><div className="font-black">{o.orderNumber||o.id||"Order"}</div><div className="text-xs text-slate-500">{o.customer?.name||o.customerName||"Customer"} · {o.paymentStatus||o.payment||"Payment status not set"}</div></div><select className="admin-field" value={o.status||"Pending Payment"} onChange={e=>updateOrder(o.id||o.orderId,{status:e.target.value})}>{(settings.orderStatuses||LUXMO_ORDER_STATUSES).map(s=><option key={s}>{s}</option>)}</select><div className="text-sm font-black">{luxmoMoney(o.total||o.amount||0)}</div></div>)}
          <div className="border rounded-2xl p-4"><h4 className="font-black">Order Status List</h4><div className="mt-3 flex flex-wrap gap-2">{(settings.orderStatuses||[]).map((s,i)=><span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{s}</span>)}</div><button onClick={()=>{const custom=prompt("Enter comma-separated order statuses",(settings.orderStatuses||[]).join(", "));if(custom!==null)saveSettings({...settings,orderStatuses:custom.split(",").map(x=>x.trim()).filter(Boolean)});}} className="mt-3 rounded-xl border px-3 py-2 text-xs font-black">Edit Status List</button></div>
        </div>}

        {tab === "inventory" && <div className="space-y-4">
          <h3 className="font-black">Inventory & SKU Control</h3>
          <div className="overflow-x-auto border rounded-2xl"><table className="w-full text-xs"><thead className="bg-slate-50"><tr><th className="p-3 text-left">Product</th><th className="p-3 text-left">SKU</th><th className="p-3 text-left">Stock</th><th className="p-3 text-left">Status</th></tr></thead><tbody>{products.map(p=><tr key={p.id} className="border-t"><td className="p-3 font-bold">{p.title}</td><td className="p-3">{p.sku||"—"}</td><td className="p-3"><input className="admin-field max-w-32" type="number" value={p.stock??0} onChange={e=>updateStock(p.id,e.target.value)}/></td><td className="p-3">{Number(p.stock||0)<=2?<span className="text-red-600 font-black">Low Stock</span>:<span className="text-emerald-700 font-black">In Stock</span>}</td></tr>)}</tbody></table></div>
        </div>}

        {tab === "reviews" && <div className="space-y-4">
          <h3 className="font-black">Review Status Workflow</h3><p className="text-xs text-slate-500">Default workflow: Pending → Published or Rejected.</p>
          <div className="flex flex-wrap gap-2">{(settings.reviewStatuses||[]).map((s,i)=><span key={i} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black">{s}</span>)}</div>
          <button onClick={()=>{const custom=prompt("Enter comma-separated review statuses",(settings.reviewStatuses||[]).join(", "));if(custom!==null)saveSettings({...settings,reviewStatuses:custom.split(",").map(x=>x.trim()).filter(Boolean)});}} className="rounded-xl border px-3 py-2 text-xs font-black">Edit Review Status List</button>
        </div>}

        {tab === "policies" && <div className="space-y-4">
          <div><h3 className="font-black">Policy & Customer Content Manager</h3><p className="text-xs text-slate-500">Warranty, Shipping & Delivery, Unboxing & Proof, Grievance, About, Contact, Terms, Privacy, Return and Refund content can be edited and saved here. Existing policy components remain preserved.</p></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{Object.keys(LUXMO_POLICY_EDITOR_DEFAULTS).map(k=><button key={k} onClick={()=>setTab(`policy:${k}`)} className="text-left rounded-xl border px-3 py-3 text-xs font-bold hover:bg-slate-50">{k}</button>)}</div>
        </div>}

        {tab.startsWith("policy:") && <div className="space-y-4">
          <button onClick={()=>setTab("policies")} className="text-xs font-black text-blue-700">← Back to Policy Manager</button>
          <h3 className="font-black">{tab.slice(7)}</h3>
          <textarea className="admin-field min-h-[420px] font-mono" value={policies[tab.slice(7)]||""} onChange={e=>setPolicies(prev=>({...prev,[tab.slice(7)]:e.target.value}))}/>
          <button onClick={()=>savePolicies(policies)} className="rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-xs font-black">Save Policy</button>
        </div>}

        {tab === "business" && <div className="space-y-4">
          <h3 className="font-black">Legal Business Details</h3>
          <div className="grid md:grid-cols-2 gap-3">{Object.entries({legalName:"Legal Business Name",constitution:"Business Constitution",gstin:"GSTIN",udyam:"Udyam Registration No.",enterpriseType:"Enterprise Type",majorActivity:"Major Activity",grievanceOfficer:"Grievance Officer",email:"Business Email",phone:"Business Phone"}).map(([k,label])=><label key={k} className="text-xs font-bold">{label}<input className="admin-field mt-1" value={business[k]||""} onChange={e=>setBusiness(prev=>({...prev,[k]:e.target.value}))}/></label>)}</div>
          <button onClick={()=>saveBusiness(business)} className="rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-xs font-black">Save Legal Details</button>
        </div>}

        {tab === "security" && <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><h3 className="font-black text-emerald-900">Google Authenticator Admin Login — Preserved</h3><p className="mt-2 text-sm text-emerald-800">The existing 6-digit TOTP login and server-session flow remain the authentication boundary. The Admin Panel does not expose the TOTP secret.</p></div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h3 className="font-black text-amber-900">Production Security</h3><p className="mt-2 text-sm text-amber-800">localStorage is useful for this frontend demo but is not a secure multi-device database. Connect product, pricing, order, policy and store-setting persistence to authenticated server/API storage before production.</p></div>
        </div>}
      </div>
    </section>
  );
}

/* ============================================================================
   LUXMO HUB — PREMIUM MULTI-CATEGORY HOMEPAGE ADD-ON
   ---------------------------------------------------------------------------
   Additive only: the existing catalogue, policies, checkout, admin tools,
   Razorpay hooks, tracking/warranty/calculator/WhatsApp modals and existing
   homepage content are preserved below. This component adds the requested
   premium Solar + Mobile Cases homepage experience.
   ============================================================================ */

function LuxmoPremiumHomepageSections({
  products = [],
  setSelectedCategory,
  setActiveTab,
  setShowSolarCalculator,
  setShowTrackingModal,
  setShowWarrantyModal,
  setShowWhatsAppModal,
}) {
  const solarProducts = products.filter(
    (p) => p.category === "Hybrid Solar Inverter" && p.published !== false
  );
  const mobileProducts = products.filter(
    (p) => p.category === "Mobile Back Case" && p.published !== false
  );

  const goCategory = (category) => {
    setSelectedCategory(category);
    setActiveTab("catalog");
  };

  const inverterFallback = [
    ["3.6kW", "24V", "MPPT", "Warranty"],
    ["5kW", "24V", "MPPT", "Warranty"],
    ["5.5kW", "24V", "MPPT", "Warranty"],
    ["6.2kW", "48V", "MPPT", "Warranty"],
    ["6.5kW", "48V", "MPPT", "Warranty"],
    ["12kW", "48V", "MPPT", "Warranty"],
  ];

  const inverterCards = solarProducts.length
    ? solarProducts.slice(0, 6)
    : inverterFallback.map((x, i) => ({
        id: `premium-inverter-${i}`,
        title: `LUXMO HUB ${x[0]} Hybrid Solar Inverter`,
        model: `Hybrid Solar Inverter ${x[0]} ${x[1]}`,
        salePrice: null,
        price: null,
        premiumPlaceholder: true,
        spec: x,
      }));

  const materials = [
    ["🐄", "Genuine Leather", "Premium natural leather finish"],
    ["🪶", "PU Leather", "Premium leather-look protection"],
    ["🌱", "Vegan / Microfiber Leather", "Soft-touch modern finish"],
    ["🛡️", "TPU", "Flexible shock-absorbing protection"],
    ["💪", "Polycarbonate (PC)", "Rigid and lightweight protection"],
    ["🧱", "TPU + PC Hybrid", "Dual-layer everyday protection"],
    ["⚡", "MagSafe", "Magnetic accessory compatible designs"],
    ["🖤", "Carbon Fiber", "Technical textured premium look"],
    ["💎", "Silicone", "Soft-touch comfortable grip"],
    ["🧊", "Clear TPU", "Transparent protection"],
    ["🛡️", "Aramid Fiber", "Ultra-thin technical protection"],
    ["✨", "Matte Finish", "Clean anti-fingerprint appearance"],
  ];

  return (
    <div className="space-y-12 mb-12">
      {/* PREMIUM HERO */}
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl border border-slate-800">
        <div className="absolute -top-28 -right-24 w-80 h-80 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="absolute -bottom-28 -left-24 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="relative grid lg:grid-cols-[1.05fr_.95fr] gap-8 items-center px-6 py-10 md:px-12 md:py-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">
              LUXMO HUB · Premium Store
            </div>
            <h2 className="mt-5 text-4xl md:text-6xl font-black leading-[1.02]">
              Smart Solar Solutions
              <span className="block text-amber-300">& Premium Mobile Protection</span>
            </h2>
            <p className="mt-5 max-w-2xl text-slate-300 text-base md:text-lg leading-relaxed">
              Reliable hybrid solar inverters for home and business, plus
              premium protective cases designed for modern smartphones.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => goCategory("Hybrid Solar Inverter")}
                className="rounded-xl bg-amber-400 px-5 py-3.5 font-black text-slate-950 hover:bg-amber-300 transition shadow-lg"
              >
                ☀️ Shop Solar Inverters
              </button>
              <button
                onClick={() => goCategory("Mobile Back Case")}
                className="rounded-xl bg-white px-5 py-3.5 font-black text-slate-950 hover:bg-slate-100 transition shadow-lg"
              >
                📱 Shop Mobile Cases
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-300">
              <span>✓ Secure Payment</span>
              <span>✓ Fast Delivery</span>
              <span>✓ Warranty Support</span>
            </div>
          </div>

          {/* Subtle 3D-style product composition — CSS only */}
          <div className="relative min-h-[300px] grid place-items-center">
            <div className="absolute w-56 h-56 rounded-full bg-amber-300/10 blur-2xl" />
            <div className="relative w-full max-w-md h-[290px]">
              <div className="absolute right-3 top-5 w-48 h-56 rounded-[2rem] border border-slate-700 bg-gradient-to-br from-slate-700 via-slate-900 to-black shadow-2xl rotate-[8deg] transform-gpu">
                <div className="absolute top-7 left-7 w-14 h-14 rounded-2xl bg-slate-800 border border-slate-600 grid place-items-center text-2xl">☀️</div>
                <div className="absolute bottom-7 left-7 right-7">
                  <div className="text-[9px] tracking-[0.2em] text-slate-400">LUXMO HUB</div>
                  <div className="mt-1 text-lg font-black">HYBRID</div>
                  <div className="text-xs text-amber-300 font-bold">SOLAR INVERTER</div>
                </div>
              </div>
              <div className="absolute left-3 bottom-1 w-44 h-60 rounded-[2.2rem] border-[7px] border-slate-800 bg-gradient-to-br from-amber-700 via-amber-900 to-slate-950 shadow-2xl -rotate-[10deg] transform-gpu">
                <div className="absolute top-4 left-4 w-12 h-20 rounded-xl bg-black/60 border border-white/10">
                  <div className="w-5 h-5 rounded-full bg-slate-700 mt-2 ml-2" />
                  <div className="w-5 h-5 rounded-full bg-slate-700 mt-1 ml-2" />
                  <div className="w-5 h-5 rounded-full bg-slate-700 mt-1 ml-2" />
                </div>
                <div className="absolute bottom-7 left-0 right-0 text-center text-[10px] font-black tracking-widest text-white/70">
                  PREMIUM CASE
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TWO MAIN CATEGORIES */}
      <section>
        <div className="text-center mb-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">Explore LUXMO HUB</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-black text-slate-900">Choose Your Category</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-7 shadow-sm hover:shadow-xl transition">
            <div className="text-4xl">☀️</div>
            <h3 className="mt-4 text-2xl font-black text-slate-950">SOLAR SOLUTIONS</h3>
            <p className="mt-2 text-slate-600">Hybrid Solar Inverters & Solar Accessories for home and business power solutions.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => goCategory("Hybrid Solar Inverter")} className="rounded-xl bg-slate-950 text-white px-4 py-2.5 text-sm font-black">Shop Inverters →</button>
              <button onClick={() => setShowSolarCalculator(true)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black">Solar Calculator →</button>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-7 shadow-sm hover:shadow-xl transition">
            <div className="text-4xl">📱</div>
            <h3 className="mt-4 text-2xl font-black text-slate-950">PREMIUM MOBILE CASES</h3>
            <p className="mt-2 text-slate-600">Premium Protection. Premium Design. Precision-fit cases for modern smartphones.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => goCategory("Mobile Back Case")} className="rounded-xl bg-slate-950 text-white px-4 py-2.5 text-sm font-black">Shop Cases →</button>
              <button onClick={() => goCategory("Mobile Back Case")} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black">Find Your Phone →</button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED SOLAR */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">Solar Collection</p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">⚡ Power Your Home with LUXMO HUB</h2>
          </div>
          <button onClick={() => goCategory("Hybrid Solar Inverter")} className="text-sm font-black text-blue-600">View All Solar Inverters →</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {inverterCards.map((p, i) => (
            <div key={p.id || i} className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition">
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-800 to-blue-950 text-white">
                {p.images?.[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="text-center">
                      <div className="text-4xl">☀️</div>
                      <div className="mt-1 text-xs font-black tracking-widest">LUXMO HUB</div>
                    </div>
                  </div>
                )}

                {/* High-contrast product information overlay.
                    Existing product image and badges are preserved. */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">
                    HYBRID SOLAR INVERTER
                  </div>
                  <h3 className="mt-1 max-w-[95%] text-base sm:text-lg leading-tight font-black text-white drop-shadow-md">
                    {String(p.title || "LUXMO HUB Hybrid Solar Inverter")
                      .replace(/\s*\/\s*/g, " / ")}
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-600">Hybrid Solar Inverter</div>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
                  <span className="rounded-full bg-slate-100 px-2 py-1">{p.spec?.[0] || p.model?.match(/[\d.]+KW/i)?.[0] || "Hybrid"}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">{p.spec?.[1] || (p.model?.match(/24V|48V/i)?.[0] || "Battery")}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">MPPT</span>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">Warranty</span>
                </div>
                {p.premiumPlaceholder ? (
                  <p className="mt-3 text-xs text-slate-500">Available when this model is added to your live catalogue.</p>
                ) : (
                  <div className="mt-3 text-lg font-black">{p.salePrice || p.price ? `₹${Number(p.salePrice || p.price).toLocaleString("en-IN")}` : "Price on product page"}</div>
                )}
                <button onClick={() => goCategory("Hybrid Solar Inverter")} className="mt-3 w-full rounded-xl bg-slate-950 text-white py-2.5 text-xs font-black">View Details / Buy Now</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SOLAR CALCULATOR CTA */}
      <section className="rounded-3xl bg-gradient-to-r from-amber-50 via-white to-blue-50 border border-amber-200 p-7 md:p-10">
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">Smart Decision Tool</p>
            <h2 className="mt-1 text-2xl md:text-3xl font-black text-slate-900">☀️ Find the Right Solar Inverter</h2>
            <p className="mt-2 text-slate-600">Estimate connected load, daily consumption, recommended inverter size, battery capacity and approximate solar requirement.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-700">
              {["💡 Lights","🌀 Fan","📺 TV","❄️ Refrigerator","❄️ AC","💨 Cooler","🧺 Washing Machine","💧 Water Pump","🔥 Geyser","🖥️ Computer"].map(x => <span key={x} className="rounded-full bg-white border border-slate-200 px-3 py-1.5">{x}</span>)}
            </div>
          </div>
          <button onClick={() => setShowSolarCalculator(true)} className="rounded-2xl bg-slate-950 text-white px-6 py-4 font-black shadow-xl hover:bg-slate-800">Calculate My Solar Requirement →</button>
        </div>
      </section>

      {/* MOBILE BRANDS */}
      <section>
        <div className="text-center mb-5">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">Mobile Protection</p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">📱 Premium Protection for Your Smartphone</h2>
          <p className="text-sm text-slate-500 mt-2">Find your exact phone model and choose your preferred material.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {["iPhone","Samsung","Google Pixel","OnePlus","Xiaomi","Other Android"].map(brand => (
            <button key={brand} onClick={() => goCategory("Mobile Back Case")} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold hover:border-slate-950 hover:shadow-sm">{brand}</button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-bold">
          {["Leather","MagSafe","Hybrid","Clear","Silicone","Carbon Fiber","Rugged"].map(c => <span key={c} className="rounded-full bg-slate-100 px-3 py-1.5">{c}</span>)}
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(mobileProducts.length ? mobileProducts.slice(0,4) : [
            {id:"m1", title:"Premium Leather Mobile Case", material:"Genuine Leather"},
            {id:"m2", title:"MagSafe Hybrid Mobile Case", material:"TPU + PC Hybrid"},
            {id:"m3", title:"Carbon Fiber Protective Case", material:"Carbon Fiber"},
            {id:"m4", title:"Premium Silicone Mobile Case", material:"Silicone"},
          ]).map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-lg transition">
              <div className="aspect-square bg-slate-100 grid place-items-center">
                {p.images?.[0] ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" /> : <div className="text-6xl">📱</div>}
              </div>
              <div className="p-4">
                <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">{p.material || "Premium Material"}</div>
                <h3 className="mt-1 font-black text-slate-900 line-clamp-2">{p.title}</h3>
                {p.salePrice || p.price ? <div className="mt-2 font-black">₹{Number(p.salePrice || p.price).toLocaleString("en-IN")}</div> : <div className="mt-2 text-sm text-slate-500">Explore available models</div>}
                <button onClick={() => goCategory("Mobile Back Case")} className="mt-3 w-full rounded-xl bg-slate-950 text-white py-2.5 text-xs font-black">Add to Cart / Buy Now</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MATERIALS */}
      <section>
        <div className="text-center mb-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">Premium Materials</p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">✨ Choose Your Material</h2>
          <p className="text-sm text-slate-500 mt-2">Premium materials. Precision fit. Everyday protection.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {materials.map(([icon, title, desc]) => (
            <button key={title} onClick={() => goCategory("Mobile Back Case")} className="text-left rounded-2xl border border-slate-200 bg-white p-4 hover:-translate-y-0.5 hover:shadow-lg transition">
              <div className="text-2xl">{icon}</div>
              <div className="mt-2 font-black text-sm text-slate-900">{title}</div>
              <div className="mt-1 text-[11px] text-slate-500 leading-relaxed">{desc}</div>
            </button>
          ))}
        </div>
        <div className="text-center mt-5">
          <button onClick={() => goCategory("Mobile Back Case")} className="rounded-xl bg-slate-950 text-white px-5 py-3 text-sm font-black">View All Materials →</button>
        </div>
      </section>

      {/* PROTECTION FEATURES */}
      <section className="rounded-3xl bg-slate-950 text-white p-7 md:p-9">
        <div className="text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">Built for Everyday Use</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-black">🛡️ Designed to Protect</h2>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {["Camera Protection","Raised Edge Protection","Drop Protection","Scratch Resistance","MagSafe Compatible","Precision Fit"].map((x, i) => (
            <div key={x} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-2xl">{["📷","↗️","🛡️","✨","🧲","✓"][i]}</div>
              <div className="mt-2 text-xs font-black">{x}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SUPPORT / WARRANTY / TRACKING / WHATSAPP */}
      <section className="grid md:grid-cols-3 gap-4">
        <button onClick={() => setShowWarrantyModal(true)} className="text-left rounded-2xl border border-emerald-200 bg-emerald-50 p-6 hover:shadow-lg transition">
          <div className="text-3xl">🛡️</div>
          <h3 className="mt-3 font-black text-slate-900">Register Your LUXMO HUB Warranty</h3>
          <p className="mt-1 text-sm text-slate-600">Register serial number and installation details for faster after-sales support.</p>
          <span className="inline-block mt-4 text-sm font-black text-emerald-700">Register Warranty →</span>
        </button>
        <button onClick={() => setShowTrackingModal(true)} className="text-left rounded-2xl border border-blue-200 bg-blue-50 p-6 hover:shadow-lg transition">
          <div className="text-3xl">📦</div>
          <h3 className="mt-3 font-black text-slate-900">Track Your Order</h3>
          <p className="mt-1 text-sm text-slate-600">No login required. Check status using Order ID and mobile number.</p>
          <span className="inline-block mt-4 text-sm font-black text-blue-700">Track Order →</span>
        </button>
        <button onClick={() => setShowWhatsAppModal(true)} className="text-left rounded-2xl border border-green-200 bg-green-50 p-6 hover:shadow-lg transition">
          <div className="text-3xl">💬</div>
          <h3 className="mt-3 font-black text-slate-900">Need Help Choosing?</h3>
          <p className="mt-1 text-sm text-slate-600">Solar, bulk order and mobile case inquiries through WhatsApp.</p>
          <span className="inline-block mt-4 text-sm font-black text-green-700">WhatsApp Inquiry →</span>
        </button>
      </section>

      {/* WHY CHOOSE */}
      <section>
        <div className="text-center mb-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">Trust</p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">Why Customers Choose LUXMO HUB</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {["✓ Quality Products","🔒 Secure Payments","🚚 Fast Delivery","🛡️ Warranty Support","↩️ Easy Returns","💬 Customer Support"].map(x => (
            <div key={x} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm font-black text-sm">{x}</div>
          ))}
        </div>
      </section>

      {/* REVIEWS + FAQ */}
      <section className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">Social Proof</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">⭐ Customer Reviews</h2>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-amber-50 p-4"><div className="font-black">☀️ Solar Customer Reviews</div><p className="mt-1 text-sm text-slate-600">Verified product and support feedback can be displayed here as reviews are published.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><div className="font-black">📱 Mobile Case Reviews</div><p className="mt-1 text-sm text-slate-600">Show phone-model, material and protection-specific customer feedback here.</p></div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">Help Center</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">❓ Frequently Asked Questions</h2>
          <div className="mt-4 space-y-2 text-sm">
            {[
              "Which battery is compatible with a hybrid inverter?",
              "Should I choose a 24V or 48V inverter?",
              "How many solar panels are required?",
              "How do I register warranty?",
              "Which phone models are available?",
              "Are MagSafe cases compatible?",
              "What material is the case made from?",
              "What is the return period?",
            ].map(q => <div key={q} className="rounded-xl bg-slate-50 px-4 py-3 font-bold text-slate-700">{q}</div>)}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="rounded-[2rem] bg-slate-950 text-white p-8 md:p-12 text-center shadow-2xl">
        <p className="text-amber-300 text-[11px] font-black uppercase tracking-[0.25em]">LUXMO HUB</p>
        <h2 className="mt-2 text-3xl md:text-5xl font-black">Choose Better. Power Smarter. Protect Better.</h2>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button onClick={() => goCategory("Hybrid Solar Inverter")} className="rounded-xl bg-amber-400 text-slate-950 px-6 py-3.5 font-black">☀️ Shop Solar →</button>
          <button onClick={() => goCategory("Mobile Back Case")} className="rounded-xl bg-white text-slate-950 px-6 py-3.5 font-black">📱 Shop Mobile Cases →</button>
        </div>
      </section>
    </div>
  );
}


function ProductCard({ product, onSelect, onAddToCart }) {
  const displayImage =
    (product.images && product.images[0]) || product.image;

  return (
    <div className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition flex flex-col justify-between">
      <div
        className="cursor-pointer"
        onClick={() => onSelect(product)}
      >
        <img src={displayImage} alt={product.title} className="w-full aspect-square object-cover" />
        <div className="p-4 space-y-1">
          <span className="text-[10px] font-bold text-blue-600 uppercase">{product.category}</span>
          <h3 className="font-semibold text-sm line-clamp-1">{product.title}</h3>
          <p className="text-xs text-slate-500">{product.models?.length ? `${product.models.length} models` : `Model: ${product.model}`}{product.colours?.length ? ` · ${product.colours.length} colours` : ""}</p>
          <div className="font-extrabold text-base pt-1">₹{product.salePrice || product.price}</div>
          {product.hsn && product.gstRate != null && (
            <div className="text-[10px] text-slate-500 pt-1">HSN: {product.hsn} · GST: {product.gstRate}%</div>
          )}
        </div>
      </div>
      <div className="p-4 pt-0">
        <button 
          onClick={() => product.variants?.length ? onSelect(product) : onAddToCart(product)} 
          className="w-full bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-bold py-2 rounded-lg transition"
        >
          {product.variants?.length ? "Select Model & Colour" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

