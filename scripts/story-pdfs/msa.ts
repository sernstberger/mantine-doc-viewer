/**
 * Master services agreement for the Dealroom (contract review) story: 12 Letter pages, a cover
 * with a linked contents list, nine sections that flow across pages, a signature page, and an
 * outline entry per section. The figures (list price, discount, net 60) and the section pages
 * are repeated in the story, keep them in sync.
 */
import { line, rect, StoryPage, StoryPdfSource, text } from './pdf-writer';

const W = 612;
const H = 792;
const LEFT = 76;
const RIGHT = W - 76;
const TEXT_WIDTH = RIGHT - LEFT;
const SIZE = 12;
const LEADING = 18.4;
const TOP = H - 96;
const BOTTOM = 84;
const TOTAL_PAGES = 12;
/** Sections that start on a fresh page, as in the order-form style of this contract */
const BREAK_BEFORE = new Set([3, 5]);
const INK = '#16181d';
const MUTED = '#5e6470';
const RULE = '#d5d8de';
const VIOLET = '#5b4cdb';

/** Times-Roman advance widths for ASCII 32-126, per 1000 em */
const TIMES = [
  250, 333, 408, 500, 500, 833, 778, 180, 333, 333, 500, 564, 250, 333, 250, 278, 500, 500, 500,
  500, 500, 500, 500, 500, 500, 500, 278, 278, 564, 564, 564, 444, 921, 722, 667, 667, 722, 611,
  556, 722, 722, 333, 389, 722, 611, 889, 722, 722, 556, 722, 667, 556, 611, 722, 722, 944, 722,
  722, 611, 333, 278, 333, 469, 500, 333, 444, 500, 444, 500, 444, 333, 500, 500, 278, 278, 500,
  278, 778, 500, 500, 500, 500, 333, 389, 278, 500, 500, 722, 500, 500, 444, 480, 200, 480, 541,
];

function width(value: string, size: number, bold = false) {
  let total = 0;
  for (const char of value) {
    total += TIMES[char.charCodeAt(0) - 32] ?? 500;
  }
  return (total * size * (bold ? 1.06 : 1)) / 1000;
}

interface Run {
  value: string;
  bold: boolean;
  x: number;
}

/** Wraps a run-in heading (bold) and body text into lines of runs */
function wrap(head: string | undefined, body: string, maxWidth: number, size: number): Run[][] {
  const words = [
    ...(head ? head.split(/\s+/).map((value) => ({ value, bold: true })) : []),
    ...body.split(/\s+/).map((value) => ({ value, bold: false })),
  ].filter((word) => word.value);
  const lines: Run[][] = [];
  let current: Run[] = [];
  let x = 0;
  const space = width(' ', size);
  words.forEach((word) => {
    const w = width(word.value, size, word.bold);
    if (current.length && x + w > maxWidth) {
      lines.push(current);
      current = [];
      x = 0;
    }
    const last = current[current.length - 1];
    if (last && last.bold === word.bold) {
      last.value += ` ${word.value}`;
    } else {
      current.push({ value: word.value, bold: word.bold, x: last ? x : 0 });
      if (last) {
        // A new run starts after the space that followed the previous word
        current[current.length - 1].x = x;
      }
    }
    x += w + space;
  });
  if (current.length) {
    lines.push(current);
  }
  return lines;
}

type Block =
  | { kind: 'section'; number: number; title: string }
  | { kind: 'clause'; head?: string; body: string; indent?: number };

const section = (number: number, title: string): Block => ({ kind: 'section', number, title });
const clause = (head: string, body: string): Block => ({ kind: 'clause', head, body });
const item = (body: string): Block => ({ kind: 'clause', body, indent: 22 });

const BLOCKS: Block[] = [
  section(1, 'Definitions'),
  clause(
    '1.1 Defined terms.',
    'In this Agreement the following terms have the meanings given below. Other terms are defined where they first appear.'
  ),
  item(
    '"Affiliate" means an entity that controls, is controlled by or is under common control with a party, where control means ownership of more than fifty percent (50%) of the voting interests.'
  ),
  item(
    '"Authorized User" means an employee or contractor of Customer or its Affiliates whom Customer permits to use the Services under this Agreement.'
  ),
  item(
    '"Customer Data" means all data, content and files that Customer or its Authorized Users submit to the Services, including personal data, but excluding Usage Data.'
  ),
  item(
    '"Documentation" means the then-current user guides and technical specifications for the Services that Kestrel makes available at docs.kestrel.example.'
  ),
  item(
    '"Fees" means the subscription fees, implementation fees and any other amounts payable by Customer under an Order Form.'
  ),
  item(
    '"List Price" means Kestrel\'s published annual subscription price for the Services at the Effective Date, before any discount.'
  ),
  item(
    '"Order Form" means an ordering document signed by both parties that references this Agreement. Order Form No. 1 is summarised in Schedule 1.'
  ),
  item(
    '"Security Incident" means a confirmed breach of security that leads to the accidental or unlawful destruction, loss, alteration, disclosure of or access to Customer Data.'
  ),
  item(
    '"Services" means the Kestrel Dispatch route planning and fleet scheduling platform, its mobile applications and the related support and implementation services described in an Order Form.'
  ),
  item(
    '"Usage Data" means technical and operational data about the performance and use of the Services, from which Customer Data and Customer\'s identity have been removed.'
  ),

  section(2, 'Services'),
  clause(
    '2.1 Provision of Services.',
    'Kestrel will make the Services available to Customer during the Subscription Term in accordance with this Agreement, the Documentation and each Order Form, and will provide them with reasonable skill and care, using suitably qualified personnel.'
  ),
  clause(
    '2.2 Authorized Users.',
    'Customer may permit up to the number of Authorized Users stated in the Order Form to use the Services. Each Authorized User must have a unique login, and Customer is responsible for their compliance with this Agreement. Customer may reassign a login from one individual to another but may not share a login between individuals.'
  ),
  clause(
    '2.3 Service levels.',
    "Kestrel will make the production Services available at least 99.9% of the time in each calendar month, excluding scheduled maintenance announced at least five (5) days ahead and outside the hours of 05:00 to 22:00 Central Time. If availability falls below 99.9% in a month, Customer is entitled to a service credit of five percent (5%) of that month's Fees, ten percent (10%) if below 99.5%, and twenty-five percent (25%) if below 99.0%. Service credits are Customer's sole remedy for unavailability except where Customer may terminate under clause 4.3."
  ),
  clause(
    '2.4 Support.',
    'Kestrel provides support by email, chat and telephone at all times for Severity 1 issues (the Services are unavailable or a core workflow is blocked), with an initial response within thirty (30) minutes and updates at least every two (2) hours until resolved. Issues of lower severity are answered within one (1) business day.'
  ),
  clause(
    '2.5 Implementation.',
    "Kestrel will provide the onboarding programme described in Order Form No. 1, including data migration from Customer's existing dispatch system, configuration of up to twelve (12) depots and training for Customer's dispatchers, for the fixed fee stated in the Order Form. Target go-live is forty-five (45) days after the Effective Date."
  ),
  clause(
    '2.6 Customer responsibilities.',
    "Customer will provide the information, access and decisions that Kestrel reasonably needs to deliver the Services on time, will keep its login credentials secure, and will tell Kestrel promptly of any unauthorized use of which it becomes aware. Kestrel is not liable for a delay that results from Customer's failure to do so."
  ),
  clause(
    '2.7 Changes to the Services.',
    "Kestrel may improve and update the Services from time to time. It will not make a change that materially reduces the functionality of the Services during the Subscription Term, and will give Customer at least ninety (90) days' notice before it withdraws any feature on which Customer's configured workflows depend."
  ),

  section(3, 'Fees and payment'),
  clause(
    '3.1 Fees.',
    'Customer will pay the Fees stated in each Order Form. The annual subscription fee for Order Form No. 1 is based on a List Price of $618,000 for one hundred and forty (140) Authorized Users and the depot and API allowances listed in Schedule 1. Fees are stated in United States dollars and, once paid, are non-refundable except as this Agreement expressly provides.'
  ),
  clause(
    '3.2 Discount.',
    'Kestrel grants Customer a discount of 22% off the List Price of the Services, reducing the annual subscription fee from $618,000 to $482,040, a saving of $135,960 a year. The discount is conditional on Customer committing to the full initial Subscription Term of thirty-six (36) months, applies only to the Services in Order Form No. 1, and does not carry over to any Renewal Term or to Authorized Users added later, which are priced at the same discount for the remainder of the initial term only. If Customer terminates this Agreement during the initial Subscription Term for any reason other than under clause 4.3 or 4.4, Customer will pay Kestrel the amount of the discount received for the period before termination.'
  ),
  clause(
    '3.3 Invoicing and payment.',
    'Kestrel will invoice the annual subscription fee in advance on the first day of each contract year, and the implementation fee on signature. Customer will pay each undisputed invoice net 60 days from the invoice date, by wire or ACH transfer to the account stated on the invoice. Invoices are issued electronically to the accounts payable contact named in the Order Form.'
  ),
  clause(
    '3.4 Late payment.',
    "If Customer does not pay an undisputed amount by its due date, Kestrel may charge interest on the overdue amount at one percent (1.0%) a month or, if lower, the highest rate the law permits, from the due date until payment. If an undisputed amount remains unpaid thirty (30) days after Kestrel's written reminder, Kestrel may suspend the Services until it is paid, after giving Customer five (5) business days' notice."
  ),
  clause(
    '3.5 Disputed invoices.',
    'Customer may withhold the part of an invoice that it disputes in good faith, provided that it tells Kestrel the reasons in writing before the due date and pays the rest on time. The parties will work together to resolve the dispute within thirty (30) days, after which either may escalate it under clause 7.4.'
  ),
  clause(
    '3.6 Taxes.',
    'The Fees do not include sales, use, value-added or similar taxes, which Customer will pay unless it gives Kestrel a valid exemption certificate. Each party is responsible for taxes on its own income, property and employees.'
  ),
  clause(
    '3.7 Renewal pricing.',
    'Kestrel will give Customer written notice of its renewal Fees at least one hundred and twenty (120) days before a Renewal Term begins. The renewal subscription fee will not exceed the Fees for the preceding contract year by more than five percent (5%), calculated on the discounted fee, unless Customer has changed the scope of the Services.'
  ),

  section(4, 'Term and termination'),
  clause(
    '4.1 Term.',
    'This Agreement starts on the Effective Date and continues for the initial Subscription Term of thirty-six (36) months stated in Order Form No. 1, and then renews automatically for successive periods of twelve (12) months (each a Renewal Term) unless either party gives the other written notice of non-renewal at least ninety (90) days before the end of the then-current term.'
  ),
  clause(
    '4.2 Termination for convenience.',
    'Neither party may terminate this Agreement for convenience during the initial Subscription Term. After it, either party may terminate at the end of a Renewal Term by giving notice under clause 4.1.'
  ),
  clause(
    '4.3 Termination for breach.',
    'Either party may terminate this Agreement by written notice if the other party commits a material breach and does not remedy it within thirty (30) days of being asked in writing to do so. Customer may also terminate by notice if the Services are unavailable for more than ninety-six (96) hours in total in any rolling three-month period.'
  ),
  clause(
    '4.4 Insolvency.',
    'Either party may terminate this Agreement immediately by written notice if the other party becomes insolvent, makes an assignment for the benefit of its creditors, has a receiver appointed over its assets, or is the subject of bankruptcy proceedings that are not dismissed within sixty (60) days.'
  ),
  clause(
    '4.5 Effect of termination.',
    "When this Agreement ends, Customer's right to use the Services stops and each party will return or delete the other's confidential information. If Customer terminates under clause 4.3 or 4.4, Kestrel will refund the prepaid Fees for the period after termination, within thirty (30) days."
  ),
  clause(
    '4.6 Transition assistance.',
    "For up to ninety (90) days after termination other than for Customer's non-payment, Kestrel will, at Customer's request and at its then-current professional services rates, help Customer export its Customer Data in a standard machine-readable format and will keep the Services available in read-only mode for that period."
  ),
  clause(
    '4.7 Survival.',
    'Clauses 3 (for amounts owed), 5, 6.7, 7 and any other clause that by its nature should continue will survive termination or expiry of this Agreement.'
  ),

  section(5, 'Liability and indemnity'),
  clause(
    '5.1 Excluded losses.',
    'Neither party is liable to the other under or in connection with this Agreement for any loss of profit, revenue, goodwill or anticipated savings, or for any indirect, special or consequential loss, whether in contract, tort (including negligence) or otherwise, even if it has been advised that the loss was possible.'
  ),
  clause(
    '5.2 General cap.',
    "Each party's total liability to the other under or in connection with this Agreement in any contract year is limited to the Fees paid and payable by Customer for the twelve (12) months in which the event giving rise to the claim first occurred. The cap applies equally to both parties."
  ),
  clause(
    '5.3 Data protection cap.',
    "Despite clause 5.2, Kestrel's total liability arising from a Security Incident or from its breach of clause 6 is limited to two times (2x) the Fees paid and payable for that period. Amounts paid under this clause count towards, and do not add to, the cap in clause 5.2 for the same event only to the extent that they do not exceed it."
  ),
  clause(
    '5.4 What is not limited.',
    "Nothing in this Agreement limits or excludes either party's liability for death or personal injury caused by its negligence, for fraud or fraudulent misrepresentation, for its gross negligence or wilful misconduct, for its obligations under clause 5.5 or 5.7, or for Customer's obligation to pay the Fees."
  ),
  clause(
    '5.5 Indemnity by Kestrel.',
    "Kestrel will defend Customer against any third-party claim that the Services, used as permitted by this Agreement, infringe that third party's patent, copyright, trademark or trade secret, and will pay the damages and costs finally awarded or agreed in settlement. If a claim is made, Kestrel may modify the Services so that they no longer infringe, procure the right for Customer to continue using them, or, if neither is commercially reasonable, terminate the affected Services and refund the prepaid Fees for the period after termination."
  ),
  clause(
    '5.6 Exclusions from the indemnity.',
    'Kestrel has no obligation under clause 5.5 to the extent that a claim arises from Customer Data, from a combination of the Services with items that Kestrel did not supply, from use that breaches this Agreement, or from a modification that Kestrel did not make.'
  ),
  clause(
    '5.7 Indemnity by Customer.',
    "Customer will defend Kestrel against any third-party claim arising from Customer Data or from Customer's use of the Services in breach of this Agreement or of applicable law, and will pay the damages and costs finally awarded or agreed in settlement."
  ),
  clause(
    '5.8 Conduct of claims.',
    "The indemnified party will notify the other promptly of a claim, let it control the defence and settlement (provided that it may not settle in a way that admits fault on the indemnified party's behalf without consent), and give reasonable help at the indemnifying party's cost."
  ),

  section(6, 'Data protection'),
  clause(
    '6.1 Roles.',
    "Customer is the controller of the personal data in Customer Data and Kestrel is its processor. Kestrel will process that personal data only on Customer's documented instructions, which are this Agreement, the Documentation and Customer's use of the Services, unless the law requires otherwise."
  ),
  clause(
    '6.2 Use of Customer Data.',
    'Kestrel will use Customer Data only to provide and support the Services. It will not sell Customer Data, use it to train models offered to other customers, or disclose it to a third party except to a subprocessor under clause 6.4 or as the law requires. Kestrel may use Usage Data to operate and improve the Services.'
  ),
  clause(
    '6.3 Security.',
    'Kestrel will maintain administrative, technical and physical safeguards that are no less protective than those in its security schedule, including encryption of Customer Data in transit (TLS 1.2 or higher) and at rest (AES-256), role-based access with multi-factor authentication, logical separation of customer environments, and annual penetration testing by an independent firm. Kestrel will hold a current SOC 2 Type II report for the Services and give Customer a copy each year on request.'
  ),
  clause(
    '6.4 Subprocessors.',
    "Customer authorises Kestrel to use the subprocessors listed at trust.kestrel.example. Kestrel will give Customer at least thirty (30) days' notice before it adds or replaces one, and Customer may object on reasonable data protection grounds. If the parties cannot resolve the objection, Customer may terminate the affected Services and receive a refund of the prepaid Fees for the period after termination."
  ),
  clause(
    '6.5 Security Incidents.',
    'Kestrel will notify Customer without undue delay and in any event within forty-eight (48) hours after it confirms a Security Incident, will give Customer the information it reasonably needs to meet its own notification duties, and will take prompt steps to contain and remedy the incident.'
  ),
  clause(
    '6.6 International transfers.',
    'Where Customer Data from the European Economic Area, the United Kingdom or Switzerland is transferred to Kestrel in the United States, the parties will rely on the Standard Contractual Clauses and the data protection addendum set out in Schedule 2, which form part of this Agreement.'
  ),
  clause(
    '6.7 Return and deletion.',
    "Within thirty (30) days after this Agreement ends, Kestrel will delete Customer Data from its active systems at Customer's request and from its backups within a further ninety (90) days, and will confirm deletion in writing. Customer may export its Customer Data at any time before then."
  ),
  clause(
    '6.8 Audit.',
    "Customer may, once in any twelve-month period and on thirty (30) days' notice, audit Kestrel's compliance with this clause 6, by reviewing its SOC 2 report and written answers to a reasonable questionnaire. If that does not satisfy Customer's regulator or the law, Customer may carry out an on-site audit at its own cost during business hours."
  ),

  section(7, 'General'),
  clause(
    '7.1 Confidentiality.',
    "Each party will keep the other's non-public information that is marked confidential or that a reasonable person would understand to be confidential, using at least the care it uses for its own, and use it only to perform this Agreement. These duties last for three (3) years after this Agreement ends, and for as long as it remains a trade secret for trade secrets."
  ),
  clause(
    '7.2 Publicity.',
    "Neither party will issue a press release about this Agreement or use the other's name or logo without the other's written consent, which may not be unreasonably withheld for a customer reference after go-live."
  ),
  clause(
    '7.3 Assignment.',
    "Neither party may assign this Agreement without the other's written consent, except to an Affiliate or to a successor to all or substantially all of its business, on written notice. A change of control of Kestrel is not an assignment."
  ),
  clause(
    '7.4 Governing law and disputes.',
    'This Agreement is governed by the laws of the State of Oregon, without regard to its conflict of laws rules. The parties will first try to resolve a dispute through their executive sponsors within thirty (30) days. If they cannot, the state and federal courts located in Multnomah County, Oregon have exclusive jurisdiction.'
  ),
  clause(
    '7.5 Notices.',
    'Notices must be in writing and delivered by hand, by courier or by email with a copy by courier to the address in the Order Form. A notice takes effect when it is received. Notices of breach or termination must also be sent to the legal contact named there.'
  ),
  clause(
    '7.6 Force majeure.',
    'A party is not liable for a delay or failure to perform, other than a payment obligation, caused by events beyond its reasonable control, provided that it tells the other party promptly and works to resume performance. If the event lasts more than sixty (60) days, either party may terminate the affected Services on notice.'
  ),
  clause(
    '7.7 Entire agreement.',
    'This Agreement, with its Order Forms and Schedules, is the whole agreement between the parties about its subject and replaces earlier discussions and proposals. If they conflict, the Order Form prevails for the commercial terms it states, and otherwise this Agreement prevails. A change must be in writing and signed by both parties.'
  ),
];

const SHORT_TITLES: Record<string, string> = {
  'Term and termination': 'Term',
  'Liability and indemnity': 'Liability',
  'Signatures and order form': 'Signatures',
};

/** The signature page and Schedule 1 summary, always the last page */
const SIGNATURE_TITLE = 'Signatures and order form';

interface Placed {
  page: number;
  ops: string;
}

function chrome(page: number): string {
  return [
    text(LEFT, H - 52, 'Master services agreement', { size: 8.5, font: 'sans', color: MUTED }),
    text(RIGHT - 118, H - 52, 'Kestrel and Brightline Freight', {
      size: 8.5,
      font: 'sans',
      color: MUTED,
    }),
    line(LEFT, H - 60, RIGHT, H - 60, { color: RULE, width: 0.5 }),
    line(LEFT, 62, RIGHT, 62, { color: RULE, width: 0.5 }),
    text(LEFT, 46, 'MSA-2026-0417, draft 4. Confidential.', {
      size: 8.5,
      font: 'sans',
      color: MUTED,
    }),
    text(RIGHT - 54, 46, `Page ${page} of ${TOTAL_PAGES}`, {
      size: 8.5,
      font: 'sans',
      color: MUTED,
    }),
  ].join('\n');
}

function layoutBody() {
  const pages: string[][] = [];
  const sectionPages: { title: string; page: number }[] = [];
  let pageNumber = 2;
  let y = TOP;
  let ops: string[] = [];

  const newPage = () => {
    pages.push(ops);
    ops = [];
    pageNumber += 1;
    y = TOP;
  };

  BLOCKS.forEach((block) => {
    if (block.kind === 'section') {
      // Keep a heading together with at least three lines of what follows
      if (y - 40 - LEADING * 3 < BOTTOM || (BREAK_BEFORE.has(block.number) && y !== TOP)) {
        newPage();
      }
      y -= y === TOP ? 0 : 20;
      sectionPages.push({ title: block.title, page: pageNumber });
      ops.push(
        text(LEFT, y - 12, `${block.number}. ${block.title}`, {
          size: 15,
          font: 'sansBold',
          color: INK,
        })
      );
      y -= 28;
      return;
    }
    const indent = block.indent ?? 0;
    const lines = wrap(block.head, block.body, TEXT_WIDTH - indent, SIZE);
    // Avoid a single line stranded at the foot or head of a page
    let start = 0;
    while (start < lines.length) {
      const room = Math.floor((y - BOTTOM) / LEADING);
      if (room < 2 && lines.length - start > 1) {
        newPage();
        continue;
      }
      let count = Math.min(room, lines.length - start);
      if (lines.length - start - count === 1) {
        count -= 1;
      }
      if (count < 1) {
        newPage();
        continue;
      }
      lines.slice(start, start + count).forEach((runs, index) => {
        runs.forEach((run) => {
          ops.push(
            text(LEFT + indent + run.x, y - index * LEADING - SIZE, run.value, {
              size: SIZE,
              font: run.bold ? 'serifBold' : 'serif',
              color: INK,
            })
          );
        });
      });
      y -= count * LEADING;
      start += count;
      if (start < lines.length) {
        newPage();
      }
    }
    y -= 6;
  });
  pages.push(ops);
  return { pages, sectionPages };
}

function cover(sections: { title: string; page: number }[]): StoryPage {
  const ops: string[] = [
    rect(0, H - 14, W, 14, { fill: VIOLET }),
    text(LEFT, H - 90, 'MSA-2026-0417', { size: 10, font: 'sansBold', color: VIOLET }),
    text(LEFT, H - 150, 'Master services', { size: 38, font: 'sansBold', color: INK }),
    text(LEFT, H - 194, 'agreement', { size: 38, font: 'sansBold', color: INK }),
    text(LEFT, H - 232, 'Kestrel Dispatch platform subscription and services', {
      size: 13,
      font: 'sans',
      color: MUTED,
    }),
    line(LEFT, H - 262, RIGHT, H - 262, { color: RULE, width: 0.5 }),
    text(LEFT, H - 292, 'Kestrel Software, Inc.', { size: 12, font: 'sansBold', color: INK }),
    text(LEFT, H - 308, '400 Harbor Street, Suite 1200, Portland, OR', {
      size: 10,
      font: 'sans',
      color: MUTED,
    }),
    text(LEFT, H - 324, '("Kestrel")', { size: 10, font: 'sans', color: MUTED }),
    text(W / 2 + 20, H - 292, 'Brightline Freight, Inc.', {
      size: 12,
      font: 'sansBold',
      color: INK,
    }),
    text(W / 2 + 20, H - 308, '2200 Riverfront Pkwy, Memphis, TN', {
      size: 10,
      font: 'sans',
      color: MUTED,
    }),
    text(W / 2 + 20, H - 324, '("Customer")', { size: 10, font: 'sans', color: MUTED }),
    text(LEFT, H - 366, 'Effective date', { size: 9, font: 'sans', color: MUTED }),
    text(LEFT, H - 382, '1 December 2026', { size: 11, font: 'sansBold', color: INK }),
    text(W / 2 + 20, H - 366, 'Initial term', { size: 9, font: 'sans', color: MUTED }),
    text(W / 2 + 20, H - 382, '36 months', { size: 11, font: 'sansBold', color: INK }),
    text(LEFT, H - 436, 'Contents', { size: 11, font: 'sansBold', color: INK }),
    line(LEFT, H - 446, RIGHT, H - 446, { color: INK, width: 0.8 }),
  ];
  const links: NonNullable<StoryPage['links']> = [];
  sections.forEach((entry, index) => {
    const y = H - 470 - index * 25;
    ops.push(text(LEFT, y, entry.title, { size: 11, font: 'sans', color: INK }));
    ops.push(text(RIGHT - 12, y, String(entry.page), { size: 11, font: 'sans', color: MUTED }));
    ops.push(line(LEFT, y - 8, RIGHT, y - 8, { color: RULE, width: 0.5 }));
    links.push({ rect: [LEFT, y - 8, RIGHT, y + 12], page: entry.page });
  });
  ops.push(
    text(LEFT, 62, "Draft 4. Customer's redline of 12 November 2026 incorporated. Confidential.", {
      size: 8.5,
      font: 'sans',
      color: MUTED,
    })
  );
  return { width: W, height: H, content: ops.join('\n'), links };
}

function signaturePage(): StoryPage {
  const ops: string[] = [
    chrome(TOTAL_PAGES),
    text(LEFT, TOP - 12, 'Schedule 1: Order Form No. 1', {
      size: 15,
      font: 'sansBold',
      color: INK,
    }),
  ];
  const rows: [string, string][] = [
    ['Services', 'Kestrel Dispatch platform, 140 Authorized Users, 12 depots'],
    ['List Price', '$618,000 a year'],
    ['Discount', '22% ($135,960 a year), initial term only'],
    ['Annual subscription fee', '$482,040'],
    ['Implementation', '$38,000 fixed fee, invoiced on signature'],
    ['Initial term', '36 months from 1 December 2026'],
    ['Payment terms', 'Net 60 days from invoice date'],
    ['Billing', 'Annually in advance'],
  ];
  let y = TOP - 44;
  ops.push(line(LEFT, y + 14, RIGHT, y + 14, { color: INK, width: 0.8 }));
  rows.forEach(([label, value]) => {
    ops.push(text(LEFT, y - 4, label, { size: 10.5, font: 'sans', color: MUTED }));
    ops.push(text(LEFT + 160, y - 4, value, { size: 10.5, font: 'sansBold', color: INK }));
    ops.push(line(LEFT, y - 14, RIGHT, y - 14, { color: RULE, width: 0.5 }));
    y -= 28;
  });

  y -= 36;
  ops.push(text(LEFT, y, 'Signatures', { size: 15, font: 'sansBold', color: INK }));
  y -= 22;
  ops.push(
    text(LEFT, y, 'The parties have signed this Agreement by their authorized representatives.', {
      size: 12,
      font: 'serif',
      color: INK,
    })
  );
  y -= 44;
  const block = (x: number, company: string, person: string, title: string) => {
    ops.push(text(x, y, company, { size: 11, font: 'sansBold', color: INK }));
    ops.push(line(x, y - 56, x + 200, y - 56, { color: INK, width: 0.7 }));
    ops.push(text(x, y - 70, 'Signature', { size: 8.5, font: 'sans', color: MUTED }));
    ops.push(text(x, y - 98, `Name: ${person}`, { size: 10.5, font: 'serif', color: INK }));
    ops.push(text(x, y - 116, `Title: ${title}`, { size: 10.5, font: 'serif', color: INK }));
    ops.push(line(x, y - 156, x + 200, y - 156, { color: INK, width: 0.7 }));
    ops.push(text(x, y - 170, 'Date', { size: 8.5, font: 'sans', color: MUTED }));
  };
  block(LEFT, 'Kestrel Software, Inc.', 'Rafael Oduya', 'Chief Revenue Officer');
  block(W / 2 + 10, 'Brightline Freight, Inc.', 'Karen Whitcombe', 'Chief Procurement Officer');
  return { width: W, height: H, content: ops.join('\n') };
}

const source: StoryPdfSource = {
  fileName: 'msa.pdf',
  build: () => {
    const { pages, sectionPages } = layoutBody();
    const total = pages.length + 2;
    if (total !== TOTAL_PAGES) {
      throw new Error(`msa.pdf has ${total} pages, expected ${TOTAL_PAGES}: tune the text or size`);
    }
    const signatures = { title: SIGNATURE_TITLE, page: TOTAL_PAGES };
    const outline = [...sectionPages, signatures];
    // Short bookmark names, the full section titles stay on the cover and in the headings
    const bookmarks = outline.map((entry) => ({
      title: SHORT_TITLES[entry.title] ?? entry.title,
      page: entry.page,
    }));
    return {
      title: 'Master services agreement, Kestrel Software and Brightline Freight',
      author: 'Kestrel Software, Inc.',
      subject: 'MSA-2026-0417, draft 4',
      outline: bookmarks,
      pages: [
        cover(outline),
        ...pages.map((ops, index) => ({
          width: W,
          height: H,
          content: [chrome(index + 2), ...ops].join('\n'),
        })),
        signaturePage(),
      ],
    };
  },
};

export default source;
