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

const MOBILE_MODELS = [
  "Galaxy Z Fold 7", "Galaxy Z Fold 6", "Galaxy Z Fold 5", "Galaxy Z Fold 4", "Galaxy Z Fold 3", "Galaxy Z Fold 2", "Galaxy Fold",
  "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17 Plus", "iPhone 17",
  "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
  "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
  "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13 Mini", "iPhone 13",
  "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12 Mini", "iPhone 12",
  "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
  "Galaxy S26 Ultra", "Galaxy S26 Plus", "Galaxy S26 FE", "Galaxy S26",
  "Galaxy S25 Ultra", "Galaxy S25 Plus", "Galaxy S25 FE", "Galaxy S25",
  "Galaxy S24 Ultra", "Galaxy S24 Plus", "Galaxy S24 FE", "Galaxy S24",
  "Galaxy S23 Ultra", "Galaxy S23 Plus", "Galaxy S23 FE", "Galaxy S23",
  "Galaxy S22 Ultra", "Galaxy S22 Plus", "Galaxy S22 FE", "Galaxy S22"
];

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

export default function LuxmoHubApp() {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('luxmo_products');
      const loaded = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
      return loaded.map(product => {
        const materialOptions = MATERIAL_OPTIONS[product.category] || [];
        const material = materialOptions.includes(product.material) ? product.material : (product.category === "Hybrid Solar Inverter" ? "Not Applicable" : "");
        const taxInfo = getTaxInfo(product.category, material);
        const isMobileWithoutMaterial = product.category === "Mobile Back Case" && !material;
        return {
          ...product,
          material,
          hsn: isMobileWithoutMaterial ? "" : (taxInfo?.hsn || product.hsn || ""),
          gstRate: isMobileWithoutMaterial ? null : (taxInfo?.gstRate ?? product.gstRate ?? null)
        };
      });
    } catch (err) {
      console.error("Storage load error:", err);
      return INITIAL_PRODUCTS;
    }
  });

  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedModelFilter, setSelectedModelFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('luxmo_admin_session') === 'true';
  });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminAuthInput, setAdminAuthInput] = useState("");
  const [authError, setAuthError] = useState("");

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminAuthInput === "LUXMO#SECURE2026") {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('luxmo_admin_session', 'true');
      setShowAdminModal(false);
      setAdminAuthInput("");
      setAuthError("");
    } else {
      setAuthError("Incorrect authentication key.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('luxmo_admin_session');
    setActiveTab("home");
  };

  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '', category: CATEGORIES[0], model: MOBILE_MODELS[0], material: "", description: '',
    price: '', salePrice: '', stock: '', sku: '', hsn: '42029900', gstRate: '18',
    images: [], published: true
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
    try {
      localStorage.setItem('luxmo_products', JSON.stringify(products));
    } catch (e) {
      console.error("Storage Limit Reached!", e);
      alert("Browser storage limit full!");
    }
  }, [products]);

  useEffect(() => {
    const availableModels = MODEL_MAP[formData.category] || [];
    const availableMaterials = MATERIAL_OPTIONS[formData.category] || [];
    const nextModel = availableModels.includes(formData.model) ? formData.model : (availableModels[0] || '');
    const nextMaterial = availableMaterials.includes(formData.material) ? formData.material : (availableMaterials[0] || '');
    const tax = getTaxInfo(formData.category, nextMaterial);

    setFormData(prev => ({
      ...prev,
      model: nextModel,
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
      const combinedText = `${p.title} ${p.description} ${p.category} ${p.model}`.toLowerCase();
      if (FORBIDDEN_TERMS.some(term => combinedText.includes(term))) return false;

      const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchesModel = selectedModelFilter === "All" || p.model === selectedModelFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.title.toLowerCase().includes(q) || 
        p.model.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q);

      return matchesCat && matchesModel && matchesSearch && (isAdminLoggedIn || p.published);
    });
  }, [products, selectedCategory, selectedModelFilter, searchQuery, isAdminLoggedIn]);

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
      reviewsCount: editingProduct ? editingProduct.reviewsCount : 0
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
      title: '', category: CATEGORIES[0], model: MOBILE_MODELS[0], material: "", description: '',
      price: '', salePrice: '', stock: '', sku: '', hsn: '42029900', gstRate: '18',
      images: [], published: true
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
      material,
      hsn: taxInfo?.hsn || '',
      gstRate: taxInfo?.gstRate ?? '',
      salePrice: prod.salePrice || '',
      images: prod.images || (prod.image ? [prod.image] : []) 
    });
    setActiveTab('admin');
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm("Delete this product?")) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.salePrice || item.price) * item.qty, 0);

  const currentFormTaxInfo = getTaxInfo(formData.category, formData.material);

  const handleRazorpayPayment = async () => {
  if (!window.Razorpay) {
    alert("Razorpay loading. Please try again.");
    return;
  }

  if (!cart || cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  try {
    const orderResponse = await fetch("/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: cartTotal
      })
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok || !orderData.success) {
      throw new Error(
        orderData.error || "Unable to create order"
      );
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
          const verifyResponse = await fetch(
            "/api/verify-payment",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(response)
            }
          );

          const verifyData = await verifyResponse.json();

          if (!verifyResponse.ok || !verifyData.success) {
            alert("Payment verification failed.");
            return;
          }

          alert(
            `Payment Successful!\nPayment ID: ${response.razorpay_payment_id}`
          );

          setCart([]);
          setActiveTab("home");

        } catch (error) {
          console.error("Verification error:", error);
          alert("Payment verification failed.");
        }
      },

      prefill: {
        name: "Customer",
        email: BUSINESS_INFO.emails[0],
        contact: BUSINESS_INFO.phones[0]
      },

      theme: {
        color: "#2563eb"
      }
    };

    const paymentObject = new window.Razorpay(options);

    paymentObject.on(
      "payment.failed",
      function (response) {
        console.error(
          "Payment failed:",
          response.error
        );

        alert(
          response.error?.description ||
          "Payment failed. Please try again."
        );
      }
    );

    paymentObject.open();

  } catch (error) {
    console.error("Razorpay Error:", error);

    alert(
      error.message ||
      "Unable to start payment."
    );
  }
};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <span>GST Registered Proprietorship: <strong>{BUSINESS_INFO.legalName}</strong> ({BUSINESS_INFO.tradeName})</span>
          <div className="flex gap-4">
            <a href={`tel:${BUSINESS_INFO.phones[0]}`} className="hover:text-white flex items-center gap-1"><Phone className="w-3 h-3" /> {BUSINESS_INFO.phones[0]}</a>
            <a href={`mailto:${BUSINESS_INFO.emails[0]}`} className="hover:text-white flex items-center gap-1"><Mail className="w-3 h-3" /> {BUSINESS_INFO.emails[0]}</a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("home")}>
            <div className="bg-slate-900 text-white font-black text-xl px-3 py-1 rounded tracking-wider border border-amber-500">
              LUX<span className="text-amber-400">M</span>O <span className="text-amber-400">HUB</span>
            </div>
          </div>

          <div className="flex-1 max-w-md relative hidden md:block">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-white text-slate-900 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-6 text-sm font-medium">
            <button onClick={() => setActiveTab("home")} className={activeTab === 'home' ? 'text-blue-600 font-semibold' : 'text-slate-600'}>Home</button>
            <button onClick={() => setActiveTab("catalog")} className={activeTab === 'catalog' ? 'text-blue-600 font-semibold' : 'text-slate-600'}>Products</button>
            <button onClick={() => setActiveTab("policies")} className={activeTab === 'policies' ? 'text-blue-600 font-semibold' : 'text-slate-600'}>Policies</button>
            <button onClick={() => setActiveTab("cart")} className="relative p-1.5 hover:text-blue-600 text-slate-700">
              <ShoppingBag className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.reduce((a, b) => a + b.qty, 0)}
                </span>
              )}
            </button>

            {isAdminLoggedIn ? (
              <button onClick={() => setActiveTab("admin")} className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1">
                <Lock className="w-3 h-3" /> Dashboard
              </button>
            ) : (
              <button onClick={() => setShowAdminModal(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1">
                <Lock className="w-3 h-3" /> Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* HOME VIEW */}
        {activeTab === "home" && (
          <div className="space-y-10">

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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map(prod => (
                <ProductCard key={prod.id} product={prod} onSelect={(p) => { setSelectedProduct(p); setActiveImageIndex(0); setActiveTab("product"); }} onAddToCart={addToCart} />
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
          <div className="bg-white rounded-2xl border p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <img
                src={(selectedProduct.images && selectedProduct.images[activeImageIndex]) || selectedProduct.image}
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
              <p className="text-xs text-slate-500">Model: {selectedProduct.model}</p>

              {selectedProduct.material && selectedProduct.material !== "Not Applicable" && (
                <p className="text-xs text-slate-500">Material / Type: {selectedProduct.material}</p>
              )}

              <div className="text-2xl font-extrabold text-slate-900">
                ₹{selectedProduct.salePrice || selectedProduct.price}
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
                {selectedProduct.description}
              </p>

              <button
                onClick={() => addToCart(selectedProduct)}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-sm"
              >
                Add to Cart
              </button>
            </div>
          </div>
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
                <button onClick={handleRazorpayPayment} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg text-sm">
                  Pay Now via Razorpay
                </button>
              </div>
            )}
          </div>
        )}

        {/* ADMIN DASHBOARD VIEW */}
        {activeTab === "admin" && isAdminLoggedIn && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h1 className="text-xl font-bold">Admin Management Console</h1>
              <button onClick={handleAdminLogout} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-xs font-bold">Log Out Admin</button>
            </div>

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

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Model</label>
                  <select 
                    value={formData.model} 
                    onChange={e => setFormData({ ...formData, model: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {MODEL_MAP[formData.category]?.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

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

      </main>

  {/* PROFESSIONAL FOOTER */}
  <footer className="bg-slate-950 text-slate-300 mt-10">
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
            <p><strong className="text-slate-200">Legal Business Name:</strong> Sarita Devi</p>
            <p><strong className="text-slate-200">Business Constitution:</strong> Proprietorship</p>
            <p><strong className="text-slate-200">GSTIN:</strong> 09CNCPD1174R1ZN</p>
            <p><strong className="text-slate-200">Udyam Registration No.:</strong> {BUSINESS_INFO.udyam.registrationNumber}</p>
            <p><strong className="text-slate-200">Enterprise Type:</strong> {BUSINESS_INFO.udyam.enterpriseType}</p>
            <p><strong className="text-slate-200">Major Activity:</strong> {BUSINESS_INFO.udyam.majorActivity}</p>
            <p><strong className="text-slate-200">Grievance Officer:</strong> Gyaneshwar Sharma</p>
            <a href={`mailto:${BUSINESS_INFO.emails[0]}`} className="block hover:text-white pt-1">{BUSINESS_INFO.emails[0]}</a>
            <a href={`tel:+917565012418`} className="block hover:text-white">+91 75650 12418</a>
          </div>
        </div>
      </div>

      {/* SOCIAL MEDIA */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <h4 className="text-white font-bold">Follow LUXMO HUB</h4>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="https://wa.me/917565012418"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition"
          >
            WhatsApp
          </a>

          <a
            href="https://www.youtube.com/@LuxmoHub"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition"
          >
            YouTube
          </a>

          <a
            href="https://www.instagram.com/luxmohub?igsh=dndlNGM5aWVvZjRl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold transition"
          >
            Instagram
          </a>

          <a
            href="https://www.facebook.com/profile.php?id=61591823462762"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition"
          >
            Facebook Page
          </a>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between gap-3 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} LUXMO HUB. All rights reserved.</p>
        <p>LUXMO HUB — Quality Products, Trusted by You.</p>
      </div>
    </div>
  </footer>

  {/* ADMIN AUTH MODAL */}
  {showAdminModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Admin Authentication
          </h3>

          <button
            onClick={() => setShowAdminModal(false)}
            className="text-slate-500 hover:text-slate-900"
          >
            X
          </button>
        </div>

        {authError && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {authError}
          </p>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-3">
          <input
            type="password"
            required
            value={adminAuthInput}
            onChange={(e) => setAdminAuthInput(e.target.value)}
            placeholder="Enter Key..."
            className="w-full px-3 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-lg"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  )}

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
          <p className="text-xs text-slate-500">Model: {product.model}</p>
          <div className="font-extrabold text-base pt-1">₹{product.salePrice || product.price}</div>
          {product.hsn && product.gstRate != null && (
            <div className="text-[10px] text-slate-500 pt-1">HSN: {product.hsn} · GST: {product.gstRate}%</div>
          )}
        </div>
      </div>
      <div className="p-4 pt-0">
        <button 
          onClick={() => onAddToCart(product)} 
          className="w-full bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-bold py-2 rounded-lg transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

// LUXMO HUB: syntax-checked final App.jsx
